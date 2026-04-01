import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';

interface JazzCashCardPaymentProps {
  amount: number;
  bookingId: string;
  serviceDescription: string;
  onError: (error: string) => void;
  onCancel: () => void;
}

function postRedirectForm(actionUrl: string, fields: Record<string, string>) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = actionUrl;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value == null ? '' : String(value);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

const JazzCashCardPayment: React.FC<JazzCashCardPaymentProps> = ({
  amount,
  bookingId,
  serviceDescription,
  onError,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardPay = async () => {
    if (amount <= 0) {
      onError('Invalid payment amount');
      return;
    }

    setIsProcessing(true);

    try {
      const data = await paymentService.initiateJazzcashCardPayment({
        bookingId,
        amount,
        description: serviceDescription,
      });

      if (!data.success || !data.actionUrl || !data.fields) {
        const detail =
          data.missingEnv?.length
            ? `Missing: ${data.missingEnv.join(', ')}`
            : data.error || 'Could not start card checkout';
        setIsProcessing(false);
        onError(detail);
        return;
      }

      sessionStorage.setItem('jazzcash_txn_ref', data.txnRefNo || '');
      sessionStorage.setItem('jazzcash_booking_id', bookingId);

      postRedirectForm(data.actionUrl, data.fields as Record<string, string>);
    } catch {
      setIsProcessing(false);
      onError('Failed to start card payment. Please try again.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto border border-gray-100">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Card payment</h3>
        <p className="text-sm text-gray-600 mb-4">
          Pay with a debit or credit card on JazzCash&apos;s secure checkout. You will leave this site briefly and return when
          payment is complete.
        </p>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Service:</span>
            <span className="font-semibold text-gray-800 text-right">{serviceDescription}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-lg text-primary">PKR {amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCardPay}
        disabled={isProcessing}
        className={`w-full py-3 rounded-lg font-semibold text-white mb-3 transition ${
          isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:opacity-90 active:scale-95'
        }`}
      >
        {isProcessing ? 'Redirecting…' : `Pay PKR ${amount.toLocaleString()} with card`}
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={isProcessing}
        className="w-full py-2 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
      >
        Cancel
      </button>

      <p className="text-center text-xs text-gray-500 mt-4">Secured by JazzCash Page Redirection (v1.1)</p>
    </div>
  );
};

export default JazzCashCardPayment;
