
import React from 'react';
import { BUSINESS_INFO } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-white p-1 rounded-lg mr-2">
                <span className="text-primary font-bold text-xl">★★★</span>
              </div>
              <span className="text-xl font-bold">Three Stars Home Services</span>
            </div>
            <p className="text-gray-300 leading-relaxed italic">
              "Home Services On-Demand — Delivery in 30 Minutes"
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Trusted home care solutions in Multan. Quality construction, fast deliveries, and expert event management.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-6 border-b border-blue-800 pb-2">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="mr-3">📍</span>
                <span className="text-gray-300 text-sm leading-6">
                  {BUSINESS_INFO.address}
                </span>
              </li>
              <li className="flex items-center">
                <span className="mr-3">📧</span>
                <a href={`mailto:${BUSINESS_INFO.email}`} className="text-gray-300 hover:text-white transition-colors text-sm">
                  {BUSINESS_INFO.email}
                </a>
              </li>
              <li className="flex items-center">
                <span className="mr-3">📞</span>
                <div className="flex flex-col">
                  {BUSINESS_INFO.phones.map(phone => (
                    <a key={phone} href={`tel:${phone}`} className="text-gray-300 hover:text-white transition-colors text-sm">
                      {phone}
                    </a>
                  ))}
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 border-b border-blue-800 pb-2">Business Hours</h3>
            <p className="text-gray-300 text-sm mb-4">
              Available 24/7 for emergency bookings.
            </p>
            <div className="bg-blue-800/30 p-4 rounded-lg border border-blue-700">
              <span className="text-secondary font-bold block mb-1">PROMISE</span>
              <p className="text-sm">We aim to respond to all local service requests within 30 minutes in Multan city areas.</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-blue-800 pt-8 text-center text-gray-400 text-sm space-y-3">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <a href="#terms" className="hover:text-white">Terms &amp; Conditions</a>
            <span className="text-gray-600">•</span>
            <a href="#privacy" className="hover:text-white">Privacy Policy</a>
            <span className="text-gray-600">•</span>
            <a href="#refund" className="hover:text-white">Refund Policy</a>
          </div>
          <p>© {new Date().getFullYear()} Three Stars Home Services. All rights reserved. Designed for Multan.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
