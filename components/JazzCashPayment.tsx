import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import type { MwalletCnicPaymentResult, MwalletCnicPaymentRequest } from '../services/paymentService';

interface JazzCashPaymentProps {
  amount: number;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceDescription: string;
  onPaymentResult: (result: MwalletCnicPaymentResult) => void;
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
  onPaymentResult,
  onError,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cnicLast6, setCnicLast6] = useState('');

  const handlePaymentClick = async () => {
    if (amount <= 0) {
      onError('Invalid payment amount');
      return;
    }

    const cleanedCnic = (cnicLast6 || '').replace(/\D/g, '').slice(-6);
    if (!/^\d{6}$/.test(cleanedCnic)) {
      onError('Please enter CNIC last 6 digits (numbers only).');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await paymentService.initiateMwalletCnicRestPayment({
        bookingId,
        amount,
        customerName,
        customerEmail,
        customerPhone,
        description: serviceDescription,
        returnUrl: window.location.origin,
        cnicLast6: cleanedCnic,
      } as MwalletCnicPaymentRequest);

      onPaymentResult(result);
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

      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">CNIC Verification</h4>
        <input
          value={cnicLast6}
          onChange={(e) => setCnicLast6(e.target.value)}
          inputMode="numeric"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
          placeholder="Enter CNIC last 6 digits"
          aria-label="CNIC last 6 digits"
        />
        <p className="text-xs text-gray-500 mt-2">
          Required for MWALLET REST v2.0 (with CNIC).
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6">
        <p className="text-xs text-blue-700">
          💳 Processing MWALLET REST payment and waiting for response.
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
