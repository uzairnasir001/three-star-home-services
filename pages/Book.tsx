
import React, { useState, useEffect } from 'react';
import { SERVICES, BUSINESS_INFO } from '../constants';
import { ServiceCategory } from '../types';
import { dataService } from '../services/dataService';
import { paymentService } from '../services/paymentService';
import type { MwalletCnicPaymentResult } from '../services/paymentService';
import { formatCurrency } from '../utils/currency';
import JazzCashPayment from '../components/JazzCashPayment';
import PaymentMethods from '../components/PaymentMethods';

const Book: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    category: '' as ServiceCategory | '',
    service: '',
    date: '',
    time: '',
    notes: '',
    botField: '' // Honeypot field for bot detection
  });

  const [availableServices, setAvailableServices] = useState<typeof SERVICES>([]);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'payment' | 'verifying' | 'success' | 'error'>('idle');
  const [selectedServicePrice, setSelectedServicePrice] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const bookingLineItem = SERVICES.find((s) => s.name === formData.service);
  const paymentAmount = bookingLineItem?.price ?? 0;

  useEffect(() => {
    if (formData.category) {
      const filtered = SERVICES.filter(s => s.category === formData.category);
      setAvailableServices(filtered);
      setFormData(prev => ({ ...prev, service: '' }));
      setSelectedServicePrice(null);
    } else {
      setAvailableServices([]);
    }
  }, [formData.category]);

  useEffect(() => {
    if (!formData.service) {
      setSelectedServicePrice(null);
      return;
    }
    const service = SERVICES.find((s) => s.name === formData.service);
    setSelectedServicePrice(service?.price ?? null);
  }, [formData.service]);

  // Handle return from JazzCash payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentComplete = params.get('payment') === 'complete' || params.get('pp_ResponseCode');
    const txnRef = params.get('pp_TxnRefNo') || sessionStorage.getItem('jazzcash_txn_ref');
    if (paymentComplete && txnRef) {
      sessionStorage.removeItem('jazzcash_txn_ref');
      setStatus('verifying');
      paymentService.checkTransactionStatus(txnRef).then((result) => {
        setStatus(result.success ? 'success' : 'idle');
      });
    }
  }, []);

  const validatePhone = (phone: string) => {
    // Basic validation for PK numbers
    return /^(\+92|0|92)[0-9]{10}$/.test(phone.replace(/[\s-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Honeypot
    if (formData.botField) {
      console.warn("Spam detection triggered.");
      return;
    }

    if (!validatePhone(formData.phone)) {
        alert("Please enter a valid Pakistani phone number.");
        return;
    }

    setStatus('submitting');

    try {
      const { botField, ...actualData } = formData;
      const booking = await dataService.addBooking({
        ...actualData,
        email: actualData.email || 'not-provided@booking.local',
        estimatedPrice: selectedServicePrice ? formatCurrency(selectedServicePrice) : 'TBD',
        paymentStatus: 'pending'
      } as any);
      
      setBookingId(booking.id);
      setStatus('payment');
    } catch (err) {
      console.error('Booking failed:', err);
      setStatus('error');
      alert('Failed to submit booking. Please try again.');
    }
  };

  const handlePaymentInitiated = async (transRef: string, method?: string) => {
    setTransactionId(transRef);
    if (bookingId) {
      try {
        await dataService.updateBooking(bookingId, {
          transactionId: transRef,
          paymentMethod: method,
          paymentStatus: 'pending'
        });
      } catch (err) {
        console.error('Failed to update booking:', err);
      }
    }
    if (method && method !== 'JazzCash') {
      setStatus('success');
    }
  };

  const handleJazzCashResult = async (result: MwalletCnicPaymentResult) => {
    const txnRefNo = result.transactionRefNo;
    const raw = result.response || {};
    const code = String(raw.pp_ResponseCode ?? raw.responseCode ?? '').trim();
    const message = String(raw.pp_ResponseMessage ?? raw.responseMessage ?? '').trim();

    let paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled';
    if (code === '000' || code === '0') paymentStatus = 'completed';
    else if (code === '200') paymentStatus = 'cancelled';
    else paymentStatus = 'failed';

    setTransactionId(txnRefNo);

    if (bookingId) {
      try {
        await dataService.updateBooking(bookingId, {
          transactionId: txnRefNo,
          paymentMethod: 'JazzCash',
          paymentStatus,
          amountPaid: bookingLineItem ? paymentAmount : undefined,
        });
      } catch (err) {
        console.error('Failed to update booking with JazzCash result:', err);
      }
    }

    if (paymentStatus === 'completed') {
      setStatus('success');
    } else {
      alert(`JazzCash payment failed: ${message || code || 'Unknown error'}`);
      setStatus('idle');
    }
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment Error: ${error}`);
    setStatus('idle');
  };

  const handlePaymentCancel = () => {
    // Reset to form
    setStatus('idle');
    setBookingId(null);
  };

  if (status === 'verifying') {
    return (
      <div className="py-20 max-w-xl mx-auto text-center px-4 animate-fade-in">
        <div className="bg-white p-12 rounded-3xl shadow-2xl">
          <div className="text-6xl mb-6 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold text-primary mb-4">Verifying Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your transaction.</p>
        </div>
      </div>
    );
  }

  if (status === 'payment') {
    return (
      <div className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4">
          <PaymentMethods
            amount={paymentAmount}
            bookingId={bookingId || ''}
            customerName={formData.name}
            customerEmail={formData.email}
            customerPhone={formData.phone}
            serviceDescription={formData.service}
            onJazzCashResult={handleJazzCashResult}
            onError={handlePaymentError}
            onCancel={handlePaymentCancel}
          />
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="py-20 max-w-xl mx-auto text-center px-4 animate-fade-in">
        <div className="bg-white p-12 rounded-3xl shadow-2xl">
          <div className="text-6xl mb-6">🛡️</div>
          <h2 className="text-3xl font-bold text-primary mb-4">Request Received!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your secure booking has been logged. Our dispatch team will verify your details and contact you within 30 minutes for urgent requests in Multan.
          </p>
          <button 
            onClick={() => setStatus('idle')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
          <div className="md:w-1/3 bg-primary p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-6xl">🔒</span>
            </div>
            <h2 className="text-3xl font-bold mb-6 relative z-10">Secure Booking</h2>
            <p className="text-blue-200 mb-10 relative z-10">Your personal data is handled with care. Submit your details for immediate dispatch across Multan city.</p>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-start">
                <span className="bg-blue-800 p-2 rounded-lg mr-4 mt-1">🕒</span>
                <div>
                  <h4 className="font-bold text-sm">Rapid Dispatch</h4>
                  <p className="text-xs text-blue-200">Serving Gulgasht, Bosan Road, and beyond.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-800 p-2 rounded-lg mr-4 mt-1">🛡️</span>
                <div>
                  <h4 className="font-bold text-sm">Vetted Pros</h4>
                  <p className="text-xs text-blue-200">Every worker is background checked.</p>
                </div>
              </div>
            </div>

            {selectedServicePrice && (
              <div className="mt-12 p-6 bg-white/10 rounded-2xl border border-white/20 relative z-10">
                <p className="text-[10px] text-blue-200 uppercase font-bold tracking-widest mb-1">Estimated Base Rate</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(selectedServicePrice)}</p>
                <p className="text-[10px] text-blue-300 mt-1 italic">* Validated upon site inspection.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="md:w-2/3 p-12 space-y-6">
            {/* Honeypot Field */}
            <div className="hidden">
              <input 
                type="text" 
                name="bot_protection" 
                tabIndex={-1} 
                autoComplete="off"
                value={formData.botField}
                onChange={(e) => setFormData({...formData, botField: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input 
                  required
                  autoComplete="name"
                  className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                <input 
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="0333 1234567"
                  className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email (Optional)</label>
                <input 
                  type="email"
                  autoComplete="email"
                  className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Address in Multan</label>
                <input 
                  required
                  autoComplete="street-address"
                  placeholder="Street, Area, Landmark"
                  className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                <div className="relative">
                  <select 
                    required
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 text-gray-900 pr-12 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm hover:bg-white focus:outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as ServiceCategory})}
                  >
                    <option value="">Select Category</option>
                    {Object.values(ServiceCategory).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="text-gray-400">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Service Type</label>
                <div className="relative">
                  <select 
                    required
                    disabled={!formData.category}
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 text-gray-900 pr-12 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-50 hover:bg-white disabled:hover:bg-gray-50 focus:outline-none"
                    value={formData.service}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({ ...formData, service: name });
                    }}
                  >
                    <option value="">Select Service</option>
                    {availableServices.map(service => (
                      <option key={service.id} value={service.name}>{service.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="text-gray-400">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Preferred Date</label>
                <div className="relative">
                  <input 
                    required
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 pr-12 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Preferred Time</label>
                <div className="relative">
                  <input 
                    required
                    type="time"
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 pr-12 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Additional Notes</label>
              <textarea 
                rows={3}
                placeholder="Specific instructions for our team..."
                className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <button 
              disabled={status === 'submitting'}
              type="submit"
              className="w-full py-5 bg-secondary text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 active:scale-[0.98]"
            >
              {status === 'submitting' ? 'Verifying...' : 'Authorize Booking Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Book;
