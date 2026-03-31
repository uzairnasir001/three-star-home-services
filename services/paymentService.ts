const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  error?: string;
}

export interface MwalletCnicPaymentRequest {
  bookingId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  cnicLast6: string;
}

export interface MwalletCnicPaymentResult {
  transactionRefNo: string;
  httpStatus: number;
  response: Record<string, unknown>;
}

class PaymentService {
  async initiateMwalletCnicRestPayment(
    request: MwalletCnicPaymentRequest
  ): Promise<MwalletCnicPaymentResult> {
    if (!request.cnicLast6 || !/^\d{6}$/.test(request.cnicLast6)) {
      throw new Error('CNIC last 6 digits is required');
    }

    const res = await fetch(apiUrl('/api/initiate-mwallet-cnic'), {
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

    const rawText = await res.text().catch(() => '');
    let data: Record<string, unknown> = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { raw: rawText };
    }

    if (res.status === 404 && (rawText.includes('NOT_FOUND') || rawText.includes('could not be found'))) {
      throw new Error('Payment API URL missing. Set VITE_API_BASE_URL or deploy the Node API.');
    }

    const responsePayload =
      data && typeof data === 'object' && 'response' in data
        ? (data.response as Record<string, unknown>)
        : data;

    return {
      transactionRefNo: (data.transactionRefNo as string) || '',
      httpStatus: res.status,
      response: responsePayload && typeof responsePayload === 'object' ? responsePayload : {},
    };
  }

  verifyPaymentResponse(responseData: Record<string, string>): PaymentResponse {
    try {
      const code = String(responseData.pp_ResponseCode ?? responseData.responseCode ?? '');
      const txnRef = responseData.pp_TxnRefNo ?? responseData.txnRefNo;

      if (code === '000' || code === '0') {
        return { success: true, transactionId: txnRef, status: 'completed' };
      }
      if (code === '200') {
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
      const response = await fetch(apiUrl('/api/check-payment-status'), {
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
