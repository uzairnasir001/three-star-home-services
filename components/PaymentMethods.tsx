import React from 'react';
import JazzCashPayment from './JazzCashPayment';
import type { MwalletCnicPaymentResult } from '../services/paymentService';

interface Props {
  amount: number;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceDescription: string;
  onJazzCashResult: (result: MwalletCnicPaymentResult) => void;
  onError: (err: string) => void;
  onCancel: () => void;
}

const PaymentMethods: React.FC<Props> = ({
  amount,
  bookingId,
  customerName,
  customerEmail,
  customerPhone,
  serviceDescription,
  onJazzCashResult,
  onError,
  onCancel,
}) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">Payment</h3>
      <p className="text-sm text-gray-600 mb-4">Online payment via JazzCash is available to complete your booking securely.</p>

      <JazzCashPayment
        amount={amount}
        bookingId={bookingId}
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        serviceDescription={serviceDescription}
        onPaymentResult={onJazzCashResult}
        onError={onError}
        onCancel={onCancel}
      />
    </div>
  );
};

export default PaymentMethods;
