import React from 'react';
import { BUSINESS_INFO } from '../constants';

const Privacy: React.FC = () => {
  return (
    <div className="py-20 max-w-4xl mx-auto px-4">
      <div className="bg-white p-10 rounded-2xl shadow-md">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-700 leading-relaxed">We respect your privacy. This policy explains what data we collect, how we use it, and your choices. We collect only necessary contact and booking information to fulfill service requests. We do not sell personal data. For privacy concerns contact {BUSINESS_INFO.email}.</p>
        <ul className="list-disc mt-4 ml-6 text-gray-700 space-y-2">
          <li>Booking data is stored locally for administrative purposes.</li>
          <li>Payment details are handled by third-party processors; avoid sharing sensitive banking information directly.</li>
          <li>We retain records to support service delivery and dispute resolution.</li>
        </ul>
      </div>
    </div>
  );
};

export default Privacy;
