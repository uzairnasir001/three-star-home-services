
import React, { useState } from 'react';
import { BUSINESS_INFO } from '../constants';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home', secure: false },
    { id: 'services', label: 'Services', secure: false },
    { id: 'book', label: 'Book Now', secure: false },
    { id: 'contact', label: 'Contact', secure: false },
    { id: 'admin', label: 'Admin', secure: true },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              <div className="bg-primary p-2 rounded-lg mr-2">
                <span className="text-white font-bold text-xl">★★★</span>
              </div>
              <div className="flex flex-col">
                <span className="text-primary font-bold text-lg leading-tight">Three Stars</span>
                <span className="text-secondary font-semibold text-xs uppercase tracking-wider">Home Services</span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`${
                  currentPage === link.id
                    ? 'text-secondary border-b-2 border-secondary'
                    : 'text-gray-600 hover:text-primary'
                } px-1 py-2 text-sm font-medium transition-colors flex items-center gap-1.5`}
              >
                {link.label}
                {link.secure && <span className="text-[10px]" title="Secure Access Only">🔒</span>}
              </button>
            ))}
            <a 
              href={`tel:${BUSINESS_INFO.phones[0].replace(/-/g, '')}`}
              className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center"
            >
              Call Now
            </a>
          </div>

          <div className="lg:hidden flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === link.id
                    ? 'text-secondary bg-gray-50'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {link.label}
                {link.secure && <span className="text-xs">🔒</span>}
              </button>
            ))}
            <div className="mt-4 px-3">
              <a 
                href={`tel:${BUSINESS_INFO.phones[0].replace(/-/g, '')}`}
                className="block w-full text-center bg-primary text-white px-6 py-3 rounded-lg text-base font-semibold"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
