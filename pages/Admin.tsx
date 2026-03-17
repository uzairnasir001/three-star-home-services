
import React, { useState, useEffect } from 'react';
import { Booking, ServiceCategory } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../lib/supabase';

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ServiceCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [isAuthenticated]);

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const data = await dataService.getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwordInput });
    if (error) {
      setLoginError(error.message || 'Invalid email or password.');
      setPasswordInput('');
      return;
    }
    setIsAuthenticated(true);
    setEmail('');
    setPasswordInput('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) return;
    if (window.confirm('SECURITY ALERT: Are you sure you want to permanently delete this record? This action cannot be undone.')) {
      try {
        await dataService.deleteBooking(id);
        await loadBookings();
      } catch (err) {
        console.error('Failed to delete:', err);
        alert('Failed to delete booking.');
      }
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesCategory = filterCategory === 'All' || b.category === filterCategory;
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.phone.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="text-primary font-bold">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <span className="text-3xl text-primary">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-primary">Secure Admin Access</h2>
            <p className="text-gray-500 mt-2 text-sm">Please enter the administrative password to manage customer records.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email</label>
              <input 
                type="email"
                required
                autoComplete="email"
                className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input 
                type="password"
                required
                autoComplete="current-password"
                className={`w-full px-5 py-4 rounded-xl bg-gray-50 border ${loginError ? 'border-red-300' : 'border-gray-100'} focus:ring-2 focus:ring-primary outline-none transition-all`}
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
              {loginError && <p className="text-red-500 text-xs mt-2 font-medium ml-1">✕ {loginError}</p>}
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
            >
              Authorize Access
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-xs text-gray-400">Unauthorized access to this portal is strictly prohibited and monitored.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-primary">Booking Dashboard</h1>
                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Authorized Session</span>
            </div>
            <p className="text-gray-600 mt-1">Manage and respond to service requests securely.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 px-6">
                <div className="text-center">
                    <span className="text-xs text-gray-400 uppercase font-bold block">Total</span>
                    <span className="text-xl font-bold text-primary">{bookings.length}</span>
                </div>
                <div className="w-px h-8 bg-gray-100"></div>
                <div className="text-center">
                    <span className="text-xs text-gray-400 uppercase font-bold block">Active</span>
                    <span className="text-xl font-bold text-secondary">{bookings.length}</span>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="p-3 bg-white border border-gray-200 text-gray-400 rounded-xl hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                title="Secure Logout"
            >
                Logout 🚪
            </button>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
                <input 
                    type="text" 
                    placeholder="Search name, service, or phone..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                {['All', ...Object.values(ServiceCategory)].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            filterCategory === cat 
                                ? 'bg-primary text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {cat === 'All' ? 'All Requests' : cat.split(' / ')[0]}
                    </button>
                ))}
            </div>
        </div>

        {/* Booking Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookingsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="text-4xl mb-4">⏳</div>
                      <p className="text-gray-400 font-medium">Loading bookings...</p>
                    </td>
                  </tr>
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-primary">{booking.date}</div>
                        <div className="text-xs text-gray-500 uppercase">{booking.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold">{booking.name}</div>
                        <div className="text-xs text-blue-600 font-medium">{booking.phone}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[150px]">{booking.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-1">
                            {booking.category.split(' / ')[0]}
                        </div>
                        <div className="text-sm font-bold text-gray-800">{booking.service}</div>
                        <div className="text-[10px] text-gray-400 mt-1 max-w-[200px] truncate">{booking.address}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-green-600">
                            {booking.estimatedPrice || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                            onClick={() => handleDelete(booking.id)}
                            className="text-red-400 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-gray-400 font-medium">No customer data found in current view.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
