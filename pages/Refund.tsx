import React from 'react';

const Refund: React.FC = () => {
  return (
    <div className="py-20 max-w-4xl mx-auto px-4">
      <div className="bg-white p-10 rounded-2xl shadow-md">
        <h1 className="text-3xl font-bold mb-4">Refund Policy</h1>
        <p className="text-gray-700 leading-relaxed">We strive for customer satisfaction. Refunds are considered on a case-by-case basis depending on the service delivered, proof of issue, and timing. For booking cancellations, please contact support as soon as possible to discuss options.</p>
        <ul className="list-disc mt-4 ml-6 text-gray-700 space-y-2">
          <li>Refund requests should be submitted within 7 days of service completion.</li>
          <li>Partial refunds may apply when portion of service was rendered.</li>
          <li>Refunds for online payments require transaction verification.</li>
        </ul>
      </div>
    </div>
  );
};

export default Refund;
