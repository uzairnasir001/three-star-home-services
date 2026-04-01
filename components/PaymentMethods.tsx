import React, { useState } from 'react';
import JazzCashPayment from './JazzCashPayment';
import JazzCashCardPayment from './JazzCashCardPayment';
import type { MwalletCnicPaymentResult } from '../services/paymentService';

type JazzCashChannel = 'mwallet' | 'card';

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
  const [channel, setChannel] = useState<JazzCashChannel>('mwallet');

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">Payment</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose JazzCash mobile wallet (CNIC) or card checkout to complete your booking securely.
      </p>

      <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50 mb-6" role="tablist" aria-label="Payment method">
        <button
          type="button"
          role="tab"
          aria-selected={channel === 'mwallet'}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition ${
            channel === 'mwallet' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setChannel('mwallet')}
        >
          Mobile wallet
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={channel === 'card'}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition ${
            channel === 'card' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setChannel('card')}
        >
          Debit / credit card
        </button>
      </div>

      {channel === 'mwallet' ? (
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
      ) : (
        <JazzCashCardPayment
          amount={amount}
          bookingId={bookingId}
          serviceDescription={serviceDescription}
          onError={onError}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};

export default PaymentMethods;
