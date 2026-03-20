// JazzCash Payment Service
// Secure Hash: HMAC-SHA256 per JazzCash Secure Hash Algorithm Documentation

export interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  paymentUrl: string;
}

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  returnUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  error?: string;
}

export interface MwalletCnicPaymentRequest extends PaymentRequest {
  // MWALLET REST v2.0 (with CNIC) requires last 6 digits of CNIC
  cnicLast6: string;
}

export interface MwalletCnicPaymentResult {
  transactionRefNo: string;
  httpStatus: number;
  response: any; // JazzCash response payload (pp_ResponseCode, pp_ResponseMessage, etc.)
}

const JAZZCASH_CONFIG: JazzCashConfig = {
  merchantId: import.meta.env.VITE_JAZZCASH_MERCHANT_ID || '',
  password: import.meta.env.VITE_JAZZCASH_PASSWORD || '',
  integritySalt: import.meta.env.VITE_JAZZCASH_INTEGRITY_SALT || import.meta.env.VITE_JAZZCASH_INTEGRITY_CHECK_KEY || '',
  paymentUrl:
    import.meta.env.VITE_JAZZCASH_PAYMENT_URL ||
    'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform',
};

// From your PDF: MWALLET REST API v2.0 (with CNIC) endpoint
const MWALLET_REST_V2_CNIC_URL =
  import.meta.env.VITE_JAZZCASH_MWALLET_REST_V2_URL ||
  'https://onlinepayments.jazzcash.com.pk/payment-orchestrator/api/v2/rest/payments/m-wallet';

/**
 * Generate pp_SecureHash per JazzCash Secure Hash Algorithm Documentation
 * 1. Filter params (pp_*, not pp_SecureHash, not null/empty)
 * 2. Sort keys alphabetically
 * 3. Concatenate: SALT&value1&value2&...
 * 4. HMAC-SHA256(concatenated, integritySalt) -> uppercase hex
 */
async function generateSecureHash(
  params: Record<string, string | number>,
  integritySalt: string
): Promise<string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      key.toLowerCase().startsWith('pp_') &&
      key.toLowerCase() !== 'pp_securehash' &&
      value != null &&
      String(value).trim() !== ''
    ) {
      filtered[key] = String(value).trim();
    }
  }

  const sortedKeys = Object.keys(filtered).sort();
  const values = sortedKeys.map((k) => filtered[k]);
  const concatenated =
    values.length === 0 ? integritySalt : `${integritySalt}&${values.join('&')}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(integritySalt);
  const messageData = encoder.encode(concatenated);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.toUpperCase();
}

/**
 * Format date as yyyyMMddHHmmss
 */
function formatTxnDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
}

function toPKTDate(date: Date): Date {
  // Convert to Asia/Karachi and format using PKT time
  return new Date(
    date.toLocaleString('en-US', {
      timeZone: 'Asia/Karachi',
    })
  );
}

function formatTxnDateTimePKT(date: Date): string {
  return formatTxnDateTime(toPKTDate(date));
}

function makeBillReferenceAlnum(input: string): string {
  // PDF requirement: pp_BillReference must be alphanumeric only (A–Z, a–z, 0–9)
  const cleaned = (input || '').replace(/[^A-Za-z0-9]/g, '');
  return cleaned || 'billRef';
}

class PaymentService {
  /**
   * Initiate JazzCash payment (async - HMAC-SHA256)
   */
  async initiatePayment(request: PaymentRequest): Promise<{
    formUrl: string;
    formData: Record<string, string>;
  }> {
    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const txnRef = `Thr${formatTxnDateTime(now)}`;

    const params: Record<string, string | number> = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_MerchantID: JAZZCASH_CONFIG.merchantId,
      pp_SubMerchantID: '',
      pp_Language: 'EN',
      pp_Password: JAZZCASH_CONFIG.password,
      pp_BankID: '',
      pp_ProductID: '',
      pp_TxnRefNo: txnRef,
      pp_Amount: Math.round(request.amount * 100),
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: formatTxnDateTime(now),
      pp_TxnExpiryDateTime: formatTxnDateTime(expiry),
      pp_BillReference: request.bookingId,
      pp_Description: request.description,
      pp_ReturnURL: request.returnUrl,
      ppmpf_1: request.customerPhone.replace(/\D/g, '').slice(-11),
      ppmpf_2: '',
      ppmpf_3: '',
      ppmpf_4: '',
      ppmpf_5: '',
    };

    const secureHash = await generateSecureHash(params, JAZZCASH_CONFIG.integritySalt);
    params.pp_SecureHash = secureHash;

    const formData: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      formData[key] = String(value);
    }

    return {
      formUrl: JAZZCASH_CONFIG.paymentUrl,
      formData,
    };
  }

  /**
   * MWALLET REST API v2.0 (with CNIC)
   * Direct REST call (no merchantform redirect). Returns JazzCash response.
   */
  async initiateMwalletCnicRestPayment(
    request: MwalletCnicPaymentRequest
  ): Promise<MwalletCnicPaymentResult> {
    if (!request.cnicLast6 || !/^\d{6}$/.test(request.cnicLast6)) {
      throw new Error('CNIC last 6 digits is required');
    }

    // CORS fix: call your own backend, which talks to JazzCash server-side.
    const res = await fetch('/api/initiate-mwallet-cnic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: request.bookingId,
        amount: request.amount,
        customerPhone: request.customerPhone,
        description: request.description,
        cnicLast6: request.cnicLast6,
      }),
    });

    const data = await res.json().catch(async () => ({ raw: await res.text() }));
    return {
      transactionRefNo: data.transactionRefNo || '',
      httpStatus: res.status,
      response: data.response || data,
    };
  }

  verifyPaymentResponse(responseData: Record<string, string>): PaymentResponse {
    try {
      const code = responseData.pp_ResponseCode ?? responseData.responseCode;
      const txnRef = responseData.pp_TxnRefNo ?? responseData.txnRefNo;

      if (code === '0' || code === 0) {
        return { success: true, transactionId: txnRef, status: 'completed' };
      }
      if (code === '200' || code === 200) {
        return { success: false, error: 'Payment cancelled by user' };
      }
      return {
        success: false,
        error: `Payment failed with code: ${code}`,
      };
    } catch {
      return { success: false, error: 'Error verifying payment response' };
    }
  }

  async checkTransactionStatus(transactionRef: string): Promise<PaymentResponse> {
    try {
      const response = await fetch('/api/check-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionRef }),
      });
      if (response.ok) {
        return await response.json();
      }
      return { success: false, error: 'Failed to check status' };
    } catch {
      return { success: false, error: 'Error checking transaction status' };
    }
  }
}

export const paymentService = new PaymentService();
