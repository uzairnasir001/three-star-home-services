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
