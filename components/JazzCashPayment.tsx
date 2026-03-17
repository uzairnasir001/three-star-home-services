import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';

interface JazzCashPaymentProps {
  amount: number;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceDescription: string;
  onPaymentInitiated: (transactionRef: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const JazzCashPayment: React.FC<JazzCashPaymentProps> = ({
  amount,
  bookingId,
  customerName,
  customerEmail,
  customerPhone,
  serviceDescription,
  onPaymentInitiated,
  onError,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentClick = async () => {
    if (amount <= 0) {
      onError('Invalid payment amount');
      return;
    }

    setIsProcessing(true);

    try {
      const returnUrl = `${window.location.origin}/#book?payment=complete`;

      const { formUrl, formData } = await paymentService.initiatePayment({
        bookingId,
        amount,
        customerName,
        customerEmail,
        customerPhone,
        description: serviceDescription,
        returnUrl,
      });

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = formUrl;

      Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      sessionStorage.setItem('jazzcash_txn_ref', formData.pp_TxnRefNo);
      onPaymentInitiated(formData.pp_TxnRefNo);

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      setIsProcessing(false);
      onError('Failed to initiate payment. Please try again.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Details</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Service:</span>
            <span className="font-semibold text-gray-800">{serviceDescription}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-lg text-primary">PKR {amount.toLocaleString()}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold text-gray-800">Total:</span>
            <span className="font-bold text-xl text-primary">PKR {amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Customer Information</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Name:</strong> {customerName}</p>
          <p><strong>Email:</strong> {customerEmail}</p>
          <p><strong>Phone:</strong> {customerPhone}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6">
        <p className="text-xs text-blue-700">
          💳 You will be redirected to JazzCash to complete the payment securely.
        </p>
      </div>

      <button
        onClick={handlePaymentClick}
        disabled={isProcessing}
        className={`w-full py-3 rounded-lg font-semibold text-white mb-3 transition ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 active:scale-95'
        }`}
      >
        {isProcessing ? 'Processing...' : `Pay PKR ${amount.toLocaleString()} via JazzCash`}
      </button>

      <button
        onClick={onCancel}
        disabled={isProcessing}
        className="w-full py-2 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
      >
        Cancel
      </button>

      <p className="text-center text-xs text-gray-500 mt-4">
        Secure payment powered by JazzCash
      </p>
    </div>
  );
};

export default JazzCashPayment;
