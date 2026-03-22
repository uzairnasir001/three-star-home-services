/**
 * Shared JazzCash handlers — used by Express (local) and Vercel serverless (/api).
 */
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { generateSecureHash, verifySecureHash } from '../utils/secureHash.js';

function getSupabase() {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) return null;
  return createClient(config.supabase.url, config.supabase.serviceRoleKey);
}

async function findBookingByTxnRef(supabase, txnRef) {
  if (!supabase) return undefined;
  const { data } = await supabase
    .from('bookings')
    .select('id')
    .eq('transaction_id', txnRef)
    .limit(1)
    .maybeSingle();
  return data?.id;
}

/**
 * @returns {{ statusCode: number, json?: object, text?: string }}
 */
export async function runJazzcashIpn(data) {
  try {
  const receivedHash = data.pp_SecureHash || data.secureHash;

  if (!receivedHash) {
    console.error('[JazzCash IPN] Missing pp_SecureHash');
    return { statusCode: 400, text: 'Missing secure hash' };
  }

  const isValid = verifySecureHash(data, config.jazzcash.integritySalt, receivedHash);
  if (!isValid) {
    console.error('[JazzCash IPN] Invalid secure hash');
    return { statusCode: 400, text: 'Invalid secure hash' };
  }

  const responseCode = data.pp_ResponseCode ?? data.responseCode ?? '';
  const txnRefNo = data.pp_TxnRefNo ?? '';
  const billRef = data.pp_BillReference ?? '';

  let paymentStatus = 'failed';
  if (String(responseCode) === '000' || String(responseCode) === '0') {
    paymentStatus = 'completed';
  } else if (String(responseCode) === '200') {
    paymentStatus = 'cancelled';
  }

  const supabase = getSupabase();
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
      const { error } = await supabase.from('bookings').update(updatePayload).eq('id', match.id);
      if (error) console.error('[JazzCash IPN] Supabase update error:', error);
    }
  }

  return { statusCode: 200, text: 'OK' };
  } catch (err) {
    console.error('[JazzCash IPN] Error:', err);
    return { statusCode: 500, text: 'Internal error' };
  }
}

/**
 * @returns {{ statusCode: number, json: object }}
 */
export async function runCheckPaymentStatus(body) {
  try {
  const { transactionRef, bookingId } = body || {};
  const supabase = getSupabase();

  if (!transactionRef) {
    return { statusCode: 400, json: { success: false, error: 'Missing transactionRef' } };
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
    idToUpdate = await findBookingByTxnRef(supabase, transactionRef);
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

  return {
    statusCode: 200,
    json: {
      success: paymentStatus === 'completed',
      status: paymentStatus,
      transactionId: transactionRef,
      error:
        paymentStatus === 'failed'
          ? data.pp_ResponseMessage || data.responseMessage || 'Payment failed'
          : undefined,
    },
  };
  } catch (err) {
    console.error('[Status Inquiry] Error:', err);
    return { statusCode: 500, json: { success: false, error: 'Failed to check status' } };
  }
}

/**
 * @returns {{ statusCode: number, json: object }}
 */
export async function runInitiateMwalletCnic(body) {
  const { merchantId, password, integritySalt, mwalletRestV2CnicUrl } = config.jazzcash;
  const missing = [];
  if (!merchantId) missing.push('VITE_JAZZCASH_MERCHANT_ID');
  if (!password) missing.push('VITE_JAZZCASH_PASSWORD');
  if (!integritySalt) missing.push('VITE_JAZZCASH_INTEGRITY_SALT (or VITE_JAZZCASH_INTEGRITY_CHECK_KEY)');
  if (missing.length) {
    console.error('[MWALLET REST v2.0 CNIC] Missing env:', missing.join(', '));
    return {
      statusCode: 503,
      json: {
        success: false,
        error: 'JazzCash credentials not configured on the server',
        missingEnv: missing,
      },
    };
  }

  const { bookingId, amount, customerPhone, description, cnicLast6 } = body || {};

  if (!cnicLast6 || !/^\d{6}$/.test(String(cnicLast6))) {
    return { statusCode: 400, json: { success: false, error: 'CNIC last 6 digits is required' } };
  }
  if (!bookingId) {
    return { statusCode: 400, json: { success: false, error: 'bookingId is required' } };
  }
  if (!customerPhone) {
    return { statusCode: 400, json: { success: false, error: 'customerPhone is required' } };
  }
  if (!amount || Number(amount) <= 0) {
    return { statusCode: 400, json: { success: false, error: 'amount is required' } };
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

  try {
    const response = await fetch(mwalletRestV2CnicUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json().catch(async () => ({ raw: await response.text() }));

    return {
      statusCode: 200,
      json: {
        success: true,
        transactionRefNo: txnRefNo,
        httpStatus: response.status,
        response: data,
      },
    };
  } catch (err) {
    console.error('[MWALLET REST v2.0 CNIC] Error:', err);
    const isDev = process.env.VERCEL_ENV !== 'production' && process.env.NODE_ENV !== 'production';
    return {
      statusCode: 500,
      json: {
        success: false,
        error: 'Failed to initiate MWALLET payment',
        ...(isDev && {
          cause: err?.message || String(err),
          hints: [
            'Vercel: set JazzCash + SUPABASE_SERVICE_ROLE_KEY in Project → Environment Variables.',
            'Local: npm run server on 3001 with .env.local.',
          ],
        }),
      },
    };
  }
}
