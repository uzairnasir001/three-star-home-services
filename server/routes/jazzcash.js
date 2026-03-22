import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { generateSecureHash, verifySecureHash } from '../utils/secureHash.js';

const router = Router();

const supabase = config.supabase.url && config.supabase.serviceRoleKey
  ? createClient(config.supabase.url, config.supabase.serviceRoleKey)
  : null;

/**
 * IPN (Instant Payment Notification)
 * JazzCash POSTs here when payment status changes.
 * Configure this URL in JazzCash Credentials: https://yourdomain.com/api/jazzcash-ipn
 */
router.post('/jazzcash-ipn', async (req, res) => {
  try {
    const data = req.body;
    const receivedHash = data.pp_SecureHash || data.secureHash;

    if (!receivedHash) {
      console.error('[JazzCash IPN] Missing pp_SecureHash');
      return res.status(400).send('Missing secure hash');
    }

    const isValid = verifySecureHash(data, config.jazzcash.integritySalt, receivedHash);
    if (!isValid) {
      console.error('[JazzCash IPN] Invalid secure hash');
      return res.status(400).send('Invalid secure hash');
    }

    const responseCode = data.pp_ResponseCode ?? data.responseCode ?? '';
    const txnRefNo = data.pp_TxnRefNo ?? data.pp_TxnRefNo ?? '';
    const billRef = data.pp_BillReference ?? data.pp_BillReference ?? '';

    let paymentStatus = 'failed';
    if (String(responseCode) === '000' || String(responseCode) === '0') {
      paymentStatus = 'completed';
    } else if (String(responseCode) === '200') {
      paymentStatus = 'cancelled';
    }

    const bookingId = billRef || txnRefNo;

    if (supabase && (billRef || txnRefNo)) {
      const updatePayload = {
        payment_status: paymentStatus,
        transaction_id: txnRefNo || undefined,
        amount_paid: data.pp_Amount ? Number(data.pp_Amount) / 100 : undefined,
      };
      let query = supabase.from('bookings').select('id');
      if (billRef) query = query.eq('id', billRef);
      else if (txnRefNo) query = query.eq('transaction_id', txnRefNo);
      const { data: rows } = await query.limit(1);
      const match = rows?.[0];
      if (match) {
        const { error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', match.id);
        if (error) console.error('[JazzCash IPN] Supabase update error:', error);
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[JazzCash IPN] Error:', err);
    res.status(500).send('Internal error');
  }
});

/**
 * Status Inquiry - Check transaction status with JazzCash
 * Called by frontend. Uses JazzCash Retrieve API, updates Supabase.
 */
router.post('/check-payment-status', async (req, res) => {
  try {
    const { transactionRef, bookingId } = req.body;

    if (!transactionRef) {
      return res.status(400).json({ success: false, error: 'Missing transactionRef' });
    }

    const params = {
      pp_TxnRefNo: transactionRef,
      pp_MerchantID: config.jazzcash.merchantId,
      pp_Password: config.jazzcash.password,
      pp_Version: '2.0',
    };
    params.pp_SecureHash = generateSecureHash(params, config.jazzcash.integritySalt);

    const retrieveUrl = `${config.jazzcash.apiBaseUrl}/ApplicationAPI/API/2.0/Retrieve`;
    const response = await fetch(retrieveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json().catch(() => ({}));
    const status = data.status || data.pp_Status || '';
    const responseCode = data.pp_ResponseCode ?? data.responseCode;

    let paymentStatus = 'pending';
    if (String(responseCode) === '000' || String(responseCode) === '0' || status === 'SUCCESS') {
      paymentStatus = 'completed';
    } else if (String(responseCode) === '200' || status === 'CANCELLED') {
      paymentStatus = 'cancelled';
    } else if (responseCode && String(responseCode) !== '000') {
      paymentStatus = 'failed';
    }

    let idToUpdate = bookingId;
    if (!idToUpdate && supabase) {
      idToUpdate = await findBookingByTxnRef(transactionRef);
    }
    if (supabase && idToUpdate) {
      await supabase
        .from('bookings')
        .update({
          payment_status: paymentStatus,
          transaction_id: transactionRef,
          amount_paid: data.pp_Amount ? Number(data.pp_Amount) / 100 : undefined,
        })
        .eq('id', idToUpdate);
    }

    res.json({
      success: paymentStatus === 'completed',
      status: paymentStatus,
      transactionId: transactionRef,
      error: paymentStatus === 'failed' ? (data.pp_ResponseMessage || data.responseMessage || 'Payment failed') : undefined,
    });
  } catch (err) {
    console.error('[Status Inquiry] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

/**
 * MWALLET REST API v2.0 (with CNIC) - initiate payment
 * Called by the frontend via your backend to avoid browser CORS.
 *
 * Expects:
 * - bookingId: string (pp_BillReference)
 * - amount: number (pp_Amount expects amount * 100)
 * - customerPhone: string (pp_MobileNumber)
 * - description: string (pp_Description)
 * - cnicLast6: string (pp_CNIC)
 */
router.post('/initiate-mwallet-cnic', async (req, res) => {
  try {
    const { merchantId, password, integritySalt, mwalletRestV2CnicUrl } = config.jazzcash;
    const missing = [];
    if (!merchantId) missing.push('VITE_JAZZCASH_MERCHANT_ID');
    if (!password) missing.push('VITE_JAZZCASH_PASSWORD');
    if (!integritySalt) missing.push('VITE_JAZZCASH_INTEGRITY_SALT (or VITE_JAZZCASH_INTEGRITY_CHECK_KEY)');
    if (missing.length) {
      console.error('[MWALLET REST v2.0 CNIC] Missing env:', missing.join(', '));
      return res.status(503).json({
        success: false,
        error: 'JazzCash credentials not configured on the server',
        missingEnv: missing,
      });
    }

    const { bookingId, amount, customerPhone, description, cnicLast6 } = req.body || {};

    if (!cnicLast6 || !/^\d{6}$/.test(String(cnicLast6))) {
      return res.status(400).json({ success: false, error: 'CNIC last 6 digits is required' });
    }
    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'bookingId is required' });
    }
    if (!customerPhone) {
      return res.status(400).json({ success: false, error: 'customerPhone is required' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'amount is required' });
    }

    const toPKTDate = (date) =>
      new Date(
        date.toLocaleString('en-US', {
          timeZone: 'Asia/Karachi',
        })
      );

    const formatTxnDateTime = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return `${y}${m}${d}${h}${min}${s}`;
    };

    const formatTxnExpiryPlusOneDay = (date) => {
      const expiry = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      return formatTxnDateTime(expiry);
    };

    const makeBillReferenceAlnum = (input) => {
      const cleaned = String(input || '').replace(/[^A-Za-z0-9]/g, '');
      return cleaned || 'billRef';
    };

    const pktNow = toPKTDate(new Date());
    const txnRefNo = `Thr${formatTxnDateTime(pktNow)}`;

    // Build request payload per PDF:
    // - values must be strings
    // - empty params must be included as "" (not removed)
    const params = {
      pp_Version: '2.0',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: config.jazzcash.merchantId,
      pp_SubMerchantID: '',
      pp_Password: config.jazzcash.password,
      pp_BankID: '',
      pp_ProductID: '',
      pp_TxnRefNo: txnRefNo,
      pp_Amount: String(Math.round(Number(amount) * 100)),
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: formatTxnDateTime(pktNow),
      pp_TxnExpiryDateTime: formatTxnExpiryPlusOneDay(pktNow),
      pp_BillReference: makeBillReferenceAlnum(bookingId),
      pp_Description: String(description || ''),
      pp_CNIC: String(cnicLast6),
      pp_MobileNumber: String(customerPhone),
      ppmpf_1: '',
      ppmpf_2: '',
      ppmpf_3: '',
      ppmpf_4: '',
      ppmpf_5: '',
      pp_SecureHash: '',
    };

    params.pp_SecureHash = generateSecureHash(params, config.jazzcash.integritySalt);

    const response = await fetch(mwalletRestV2CnicUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json().catch(async () => ({ raw: await response.text() }));

    return res.json({
      success: true,
      transactionRefNo: txnRefNo,
      httpStatus: response.status,
      response: data,
    });
  } catch (err) {
    console.error('[MWALLET REST v2.0 CNIC] Error:', err);
    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate MWALLET payment',
      ...(isDev && {
        cause: err?.message || String(err),
        hints: [
          'Keep the API server running on port 3001: npm run server (or use npm run dev:full with Vite on 3000).',
          'If the browser shows 500 with an empty body, the proxy target may be down — start the server and retry.',
          'After editing .env.local, restart node server/index.js so dotenv reloads.',
        ],
      }),
    });
  }
});

async function findBookingByTxnRef(txnRef) {
  const { data } = await supabase
    .from('bookings')
    .select('id')
    .eq('transaction_id', txnRef)
    .limit(1)
    .single();
  return data?.id;
}

export default router;
