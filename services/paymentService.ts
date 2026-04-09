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

export interface JazzCashCardInitRequest {
  bookingId: string;
  amount: number;
  description: string;
}

export interface JazzCashCardInitResponse {
  success: boolean;
  actionUrl?: string;
  txnRefNo?: string;
  fields?: Record<string, string>;
  error?: string;
  missingEnv?: string[];
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

  async initiateJazzcashCardPayment(request: JazzCashCardInitRequest): Promise<JazzCashCardInitResponse> {
    const res = await fetch(apiUrl('/api/initiate-jazzcash-card'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: request.bookingId,
        amount: request.amount,
        description: request.description,
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

    const fields = data.fields;
    return {
      success: Boolean(data.success),
      actionUrl: data.actionUrl as string | undefined,
      txnRefNo: data.txnRefNo as string | undefined,
      fields: fields && typeof fields === 'object' ? (fields as Record<string, string>) : undefined,
      error: data.error as string | undefined,
      missingEnv: Array.isArray(data.missingEnv) ? (data.missingEnv as string[]) : undefined,
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

  /** Sync booking row when browser already has pp_ResponseCode 000 from card return (inquiry may lag). */
  async ackCardReturnSuccess(payload: {
    transactionRef: string;
    bookingId?: string;
    responseCode: string;
    ppAmount?: string | null;
    billReference?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(apiUrl('/api/ack-card-return'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionRef: payload.transactionRef,
          bookingId: payload.bookingId,
          responseCode: payload.responseCode,
          pp_Amount: payload.ppAmount ?? undefined,
          pp_BillReference: payload.billReference ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      return { success: Boolean(data.success), error: data.error };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  async checkTransactionStatus(transactionRef: string, bookingId?: string): Promise<PaymentResponse> {
    try {
      const response = await fetch(apiUrl('/api/check-payment-status'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionRef, bookingId }),
      });
      if (response.ok) {
        return await response.json();
      }
      return { success: false, error: 'Failed to check status' };
    } catch {
      return { success: false, error: 'Error checking transaction status' };
    }
  }

  /**
   * After card redirect, poll until JazzCash reports completed, or cancelled/failed.
   * Keeps "verifying" on screen until then; only stops early on terminal failure states.
   * Long safety cap avoids an unbounded hang if the gateway never returns a final state.
   */
  async checkTransactionStatusAfterReturn(
    transactionRef: string,
    bookingId?: string
  ): Promise<PaymentResponse> {
    const MAX_WAIT_MS = 2 * 60 * 60 * 1000; // 2h safety cap
    const started = Date.now();
    let delayMs = 4000;
    const MAX_DELAY_MS = 30000;
    let last: PaymentResponse = { success: false, status: 'pending' };

    while (Date.now() - started < MAX_WAIT_MS) {
      last = await this.checkTransactionStatus(transactionRef, bookingId);
      if (last.success) return last;
      const st = String(last.status || '').toLowerCase();
      if (st === 'cancelled' || st === 'failed') return last;

      await new Promise((r) => setTimeout(r, delayMs));
      delayMs = Math.min(Math.floor(delayMs * 1.12), MAX_DELAY_MS);
    }
    return last;
  }
}

export const paymentService = new PaymentService();
