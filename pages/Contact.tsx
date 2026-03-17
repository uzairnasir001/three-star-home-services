
import React, { useState } from 'react';
import { BUSINESS_INFO } from '../constants';
import { dataService } from '../services/dataService';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addContactMessage(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 pb-20">
      {/* Map Section */}
      <div className="h-[400px] w-full bg-gray-200 relative">
        <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13801.373264478345!2d71.4880145!3d30.2116345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x393b338e55555555%3A0x5555555555555555!2sGulgasht%20Colony%2C%20Multan!5e0!3m2!1sen!2spk!4v1650000000000!5m2!1sen!2spk" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy"
            title="Business Location"
        ></iframe>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <h3 className="text-2xl font-bold text-primary mb-8 underline decoration-secondary decoration-4 underline-offset-8">Find Us</h3>
                
                <div className="space-y-8">
                    <div className="flex items-start">
                        <span className="text-2xl mr-4">📍</span>
                        <div>
                            <p className="font-bold text-gray-800">Our Address</p>
                            <p className="text-gray-600 text-sm mt-1">{BUSINESS_INFO.address}</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <span className="text-2xl mr-4">📞</span>
                        <div>
                            <p className="font-bold text-gray-800">Phone Numbers</p>
                            {BUSINESS_INFO.phones.map(phone => (
                                <p key={phone} className="text-gray-600 text-sm mt-1">{phone}</p>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-start">
                        <span className="text-2xl mr-4">✉️</span>
                        <div>
                            <p className="font-bold text-gray-800">Email Support</p>
                            <p className="text-gray-600 text-sm mt-1">{BUSINESS_INFO.email}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-10 border-t border-gray-100">
                    <p className="text-sm font-bold text-primary mb-4">Connect on WhatsApp</p>
                    <a 
                        href={`https://wa.me/${BUSINESS_INFO.whatsapp}`}
                        className="flex items-center justify-center w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                    >
                        <span>Open WhatsApp Chat</span>
                    </a>
                </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 h-full">
                <h3 className="text-2xl font-bold text-primary mb-6">Send us a Message</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">Have a specific question about our services or need a custom quote for property construction? Drop us a line below.</p>

                {submitted ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl mb-8 flex items-center">
                        <span className="text-2xl mr-4">🎉</span>
                        <p className="font-medium">Message sent! We'll get back to you soon.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                                <input 
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Your Email</label>
                                <input 
                                    required
                                    type="email"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                            <textarea 
                                required
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                            ></textarea>
                        </div>
                        <button 
                            type="submit"
                            className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-800 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>Send Message</span>
                            <span>✈️</span>
                        </button>
                    </form>
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
