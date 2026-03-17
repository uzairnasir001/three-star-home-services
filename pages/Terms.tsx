import React from 'react';
import { BUSINESS_INFO } from '../constants';

const Terms: React.FC = () => {
  return (
    <div className="py-20 max-w-4xl mx-auto px-4">
      <div className="bg-white p-10 rounded-2xl shadow-md">
        <h1 className="text-3xl font-bold mb-4">Terms &amp; Conditions</h1>
        <p className="text-gray-700 leading-relaxed">Please read these terms and conditions carefully before using our services. By booking with Three Stars Home Services you agree to the terms listed here, which include service expectations, cancellation policy, and liability limitations. For specific questions, reach out to {BUSINESS_INFO.email}.</p>
        <ul className="list-disc mt-4 ml-6 text-gray-700 space-y-2">
          <li>Bookings are subject to availability and confirmation by our dispatch team.</li>
          <li>Estimated prices are validated on-site and may change after inspection.</li>
          <li>Service times are estimates and may vary due to operational constraints.</li>
        </ul>
      </div>
    </div>
  );
};

export default Terms;
