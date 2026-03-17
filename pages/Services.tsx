
import React, { useState, useMemo } from 'react';
import { SERVICES } from '../constants';
import { ServiceCategory } from '../types';
import { formatCurrency } from '../utils/currency';

interface ServicesProps {
    onNavigate: (page: string) => void;
}

const Services: React.FC<ServicesProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<ServiceCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = useMemo(() => {
    return SERVICES.filter(service => {
      const matchesTab = activeTab === 'All' || service.category === activeTab;
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            service.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Our Comprehensive Services</h1>
          <p className="text-gray-600">Choose from over 30+ high-quality services tailored for Multan residents.</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
                <input 
                    type="text" 
                    placeholder="Search services (e.g., Plumber, Milk, Visa)..." 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                {['All', ...Object.values(ServiceCategory)].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                            activeTab === tab 
                                ? 'bg-primary text-white shadow-lg' 
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                        }`}
                    >
                        {tab === 'All' ? 'All Services' : tab.split(' / ')[0]}
                    </button>
                ))}
            </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
                <div key={service.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-4xl bg-gray-50 w-16 h-16 flex items-center justify-center rounded-2xl">
                          {service.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{formatCurrency(service.price)}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">per {service.unit}</div>
                      </div>
                    </div>
                    <div className="flex-grow">
                        <span className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 block">
                            {service.category.split(' / ')[0]}
                        </span>
                        <h3 className="text-xl font-bold text-primary mb-2">{service.name}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                            {service.description}
                        </p>
                    </div>
                    <button 
                        onClick={() => onNavigate('book')}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-primary transition-colors flex items-center justify-center gap-2"
                    >
                        <span>Book This Service</span>
                        <span className="text-lg">⊕</span>
                    </button>
                </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
                <div className="text-6xl mb-4">🏜️</div>
                <h3 className="text-2xl font-bold text-gray-400">No services found for "{searchQuery}"</h3>
                <button 
                    onClick={() => {setSearchQuery(''); setActiveTab('All');}}
                    className="mt-4 text-primary font-bold hover:underline"
                >
                    Clear filters and search
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
