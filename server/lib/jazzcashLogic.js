/**
 * JazzCash MWALLET REST API v2.0 (with CNIC) — merchant guide: §3.3 amount (×100), §3.5 PKT datetimes,
 * §4 sample request fields; §3.2 IPN + status inquiry.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { generateSecureHash, verifySecureHash } from '../utils/secureHash.js';
import { postJson } from '../utils/postJson.js';

function pkrFromGatewayAmount(ppAmount) {
  if (ppAmount == null || ppAmount === '') return undefined;
  const n = Number(ppAmount);
  if (!Number.isFinite(n)) return undefined;
  return n / 100;
}

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

export async function runJazzcashIpn(data) {
  try {
    const receivedHash = data.pp_SecureHash || data.secureHash;
    if (!receivedHash) {
      console.error('[JazzCash IPN] Missing pp_SecureHash');
      return { statusCode: 400, text: 'Missing secure hash' };
    }
    if (!verifySecureHash(data, config.jazzcash.integritySalt, receivedHash)) {
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
        amount_paid: pkrFromGatewayAmount(data.pp_Amount),
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
          amount_paid: pkrFromGatewayAmount(data.pp_Amount),
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

function pktWallTime(date) {
  return new Date(
    date.toLocaleString('en-US', {
      timeZone: 'Asia/Karachi',
    })
  );
}

function formatYmdHms(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
}

/**
 * Build redirect Location for browser after JazzCash POSTs to our card return URL.
 * Hash routing: query on pathname so Book page reads location.search.
 */
export function buildJazzcashCardReturnRedirect(returnBody) {
  const base = (
    config.jazzcash.spaPublicOrigin ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ).replace(/\/$/, '');
  const sp = new URLSearchParams();
  sp.set('payment', 'complete');
  const passKeys = [
    'pp_TxnRefNo',
    'pp_ResponseCode',
    'pp_ResponseMessage',
    'pp_Amount',
    'pp_BillReference',
    'pp_TxnType',
    'pp_TxnCurrency',
  ];
  const src = returnBody && typeof returnBody === 'object' ? returnBody : {};
  for (const k of passKeys) {
    const v = src[k];
    if (v != null && String(v).trim() !== '') sp.set(k, String(v).trim());
  }
  return `${base}/?${sp.toString()}#book`;
}

/**
 * Card Page Redirection v1.1 (MPAY) — server builds signed fields; browser POSTs form to JazzCash.
 */
export async function runInitiateJazzcashCard(body) {
  const { merchantId, password, integritySalt, cardMerchantFormUrl, cardReturnUrl } = config.jazzcash;
  const missing = [];
  if (!merchantId) missing.push('VITE_JAZZCASH_MERCHANT_ID');
  if (!password) missing.push('VITE_JAZZCASH_PASSWORD');
  if (!integritySalt) missing.push('VITE_JAZZCASH_INTEGRITY_SALT (or VITE_JAZZCASH_INTEGRITY_CHECK_KEY)');
  if (!cardReturnUrl) missing.push('JAZZCASH_CARD_RETURN_URL');
  if (missing.length) {
    console.error('[JazzCash Card] Missing env:', missing.join(', '));
    return {
      statusCode: 503,
      json: {
        success: false,
        error: 'JazzCash card redirect is not configured on the server',
        missingEnv: missing,
      },
    };
  }

  const { bookingId, amount, description } = body || {};
  if (!bookingId) {
    return { statusCode: 400, json: { success: false, error: 'bookingId is required' } };
  }

  const amountPkr = Math.round(Number(amount));
  if (!amountPkr || amountPkr <= 0) {
    return { statusCode: 400, json: { success: false, error: 'amount is required' } };
  }

  const now = pktWallTime(new Date());
  const milli = String(now.getMilliseconds()).padStart(3, '0');
  const txnRefNo = `TRN${formatYmdHms(now)}${milli}`;
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const billRef = String(bookingId || '').replace(/[^A-Za-z0-9]/g, '') || 'billRef';
  const ppAmount = String(amountPkr * 100);

  const params = {
    pp_Version: '1.1',
    pp_TxnType: 'MPAY',
    pp_Language: 'EN',
    pp_MerchantID: merchantId,
    pp_Password: password,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: ppAmount,
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatYmdHms(now),
    pp_BillReference: billRef,
    pp_Description: String(description || '').slice(0, 500),
    pp_TxnExpiryDateTime: formatYmdHms(expiry),
    pp_ReturnURL: cardReturnUrl,
    pp_SubMerchantID: '',
    pp_BankID: '',
    pp_ProductID: '',
    ppmpf_1: '',
    ppmpf_2: '',
    ppmpf_3: '',
    ppmpf_4: '',
    ppmpf_5: '',
    pp_SecureHash: '',
  };

  /* Card v1.1 sample uses PHP hash_hmac → lowercase hex; REST/MWALLET keep uppercase default. */
  params.pp_SecureHash = generateSecureHash(params, integritySalt, { hashHexLower: true });

  const supportLog = process.env.JAZZCASH_SUPPORT_LOG === '1';
  const debug = supportLog || process.env.JAZZCASH_LOG_OUTBOUND_PAYLOAD === '1';
  if (debug) {
    const { pp_Password: _p, ...rest } = params;
    console.log('[JazzCash Card outbound]', JSON.stringify(rest));
  }

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from('bookings')
      .update({
        transaction_id: txnRefNo,
        payment_status: 'pending',
        payment_method: 'JazzCash Card',
      })
      .eq('id', bookingId);
    if (error) console.error('[JazzCash Card] Supabase update error:', error);
  }

  return {
    statusCode: 200,
    json: {
      success: true,
      actionUrl: cardMerchantFormUrl,
      txnRefNo,
      fields: params,
    },
  };
}

export async function runInitiateMwalletCnic(body) {
  const { merchantId, password, integritySalt, mwalletRestV2CnicUrl } = config.jazzcash;
  const missing = [];
  if (!merchantId) missing.push('VITE_JAZZCASH_MERCHANT_ID');
  if (!password) missing.push('VITE_JAZZCASH_PASSWORD');
  if (!integritySalt) missing.push('VITE_JAZZCASH_INTEGRITY_SALT (or VITE_JAZZCASH_INTEGRITY_CHECK_KEY)');
  if (missing.length) {
    console.error('[MWALLET CNIC] Missing env:', missing.join(', '));
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

  const amountPkr = Math.round(Number(amount));
  if (!amountPkr || amountPkr <= 0) {
    return { statusCode: 400, json: { success: false, error: 'amount is required' } };
  }

  const ppAmount = String(amountPkr * 100);

  const now = pktWallTime(new Date());
  const txnRefNo = `T${formatYmdHms(now)}`;
  const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const billRef = String(bookingId || '').replace(/[^A-Za-z0-9]/g, '') || 'billRef';

  const params = {
    pp_Amount: ppAmount,
    pp_BankID: '',
    pp_BillReference: billRef,
    pp_CNIC: String(cnicLast6),
    pp_Description: String(description || ''),
    pp_Language: 'EN',
    pp_MerchantID: merchantId,
    pp_MobileNumber: String(customerPhone),
    pp_Password: password,
    pp_ProductID: '',
    pp_SubMerchantID: '',
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatYmdHms(now),
    pp_TxnExpiryDateTime: formatYmdHms(expiry),
    pp_TxnRefNo: txnRefNo,
    ppmpf_1: '',
    ppmpf_2: '',
    ppmpf_3: '',
    ppmpf_4: '',
    ppmpf_5: '',
    pp_SecureHash: '',
  };

  params.pp_SecureHash = generateSecureHash(params, integritySalt);

  /** Debug: echo outbound request in logs + API body (demo; restart `npm run server` after changing this file). */
  const supportLog = process.env.JAZZCASH_SUPPORT_LOG === '1';
  const debug =
    supportLog || process.env.JAZZCASH_LOG_OUTBOUND_PAYLOAD === '1';
  if (debug) {
    console.log('[MWALLET CNIC outbound]', JSON.stringify(params, null, 2));
  }

  try {
    const { status, text } = await postJson(mwalletRestV2CnicUrl, params);
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return {
      statusCode: 200,
      json: {
        success: true,
        transactionRefNo: txnRefNo,
        httpStatus: status,
        response: data,
        ...(debug && { outboundPayload: { ...params, pp_Password: password } }),
      },
    };
  } catch (err) {
    console.error('[MWALLET CNIC] Error:', err);
    return {
      statusCode: 500,
      json: {
        success: false,
        error: 'Failed to initiate MWALLET payment',
      },
    };
  }
}
