
import React from 'react';
import { BUSINESS_INFO } from '../constants';
import { ServiceCategory } from '../types';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-primary overflow-hidden h-[600px] flex items-center">
        <div className="absolute inset-0 opacity-20">
            <img 
                src="https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&q=80&w=1920" 
                alt="Multan Cityscape" 
                className="w-full h-full object-cover"
            />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-white">
          <div className="max-w-2xl">
            <div className="inline-block px-4 py-1 bg-secondary rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                Multan's Premier Service Provider
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              {BUSINESS_INFO.name}
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-gray-200 font-light italic">
              "{BUSINESS_INFO.tagline}"
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => onNavigate('book')}
                className="bg-secondary text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-all transform hover:-translate-y-1 shadow-lg"
              >
                Book a Service
              </button>
              <a 
                href={`https://wa.me/${BUSINESS_INFO.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center"
              >
                <span className="mr-2">WhatsApp Now</span>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 p-8 hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                <p className="text-white text-sm font-medium">Serving Locations:</p>
                <p className="text-secondary text-lg font-bold">Gulgasht, Bosan Road, Cantt & more</p>
            </div>
        </div>
      </section>

      {/* Featured Service Categories */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Our Primary Solutions</h2>
          <div className="h-1 w-20 bg-secondary mx-auto"></div>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto">
            We provide specialized services across three major categories to handle everything from your morning groceries to your dream home construction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              title: "Construction & Property",
              category: ServiceCategory.CONSTRUCTION,
              description: "Expert builders, interior designers, and maintenance staff at your service.",
              image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800"
            },
            {
              title: "Grocery & Delivery",
              category: ServiceCategory.GROCERY,
              description: "Get fresh fruits, vegetables, and medicines delivered in just 30 minutes.",
              image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
            },
            {
              title: "Events & Tours",
              category: ServiceCategory.EVENT,
              description: "Complete management for weddings, birthday parties, and historical trips.",
              image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800"
            }
          ].map((cat, idx) => (
            <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-xl hover-scale group">
              <div className="h-56 overflow-hidden relative">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <h3 className="absolute bottom-4 left-6 text-xl font-bold text-white">{cat.title}</h3>
              </div>
              <div className="p-8">
                <p className="text-gray-600 mb-6 leading-relaxed h-12 overflow-hidden">
                  {cat.description}
                </p>
                <button 
                    onClick={() => onNavigate('services')}
                    className="text-primary font-bold flex items-center hover:text-secondary transition-colors"
                >
                    View All Services <span className="ml-2">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[40px] p-12 md:p-20 shadow-2xl border border-gray-100 flex flex-col md:flex-row items-center justify-between text-center md:text-left overflow-hidden relative">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 mb-10 md:mb-0 max-w-xl">
                    <h3 className="text-3xl md:text-4xl font-bold text-primary mb-6">Ready to experience the 30-minute delivery?</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Whether it's an emergency electrical repair or a grocery list that needs fulfilling, our team is dispatched across Multan to reach you within half an hour.
                    </p>
                </div>
                <div className="relative z-10 flex flex-col gap-4">
                    <a 
                        href={`tel:${BUSINESS_INFO.phones[0].replace(/-/g, '')}`}
                        className="bg-primary text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-blue-800 transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center"
                    >
                        <span className="mr-3">Call Now:</span>
                        {BUSINESS_INFO.phones[0]}
                    </a>
                    <p className="text-sm text-gray-400 font-medium text-center italic">Available 24/7 for urgent requests</p>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
