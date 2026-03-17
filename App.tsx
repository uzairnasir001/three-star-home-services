
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import Book from './pages/Book';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import { BUSINESS_INFO } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>(() => {
      const hash = window.location.hash.replace('#', '');
      return hash || 'home';
  });
  
  const navigate = (page: string) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setCurrentPage(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home onNavigate={navigate} />;
      case 'services': return <Services onNavigate={navigate} />;
      case 'book': return <Book />;
      case 'contact': return <Contact />;
      case 'admin': return <Admin />;
      case 'terms': return <Terms />;
      case 'privacy': return <Privacy />;
      case 'refund': return <Refund />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={navigate} 
      />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer />
      
      {/* Quick Action Float */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-4">
        <a 
          href={`https://wa.me/${BUSINESS_INFO.whatsapp}`} 
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-green-600 transition-all hover:scale-110 active:scale-95 group relative"
        >
          <span className="text-2xl">💬</span>
          <span className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm whitespace-nowrap pointer-events-none">WhatsApp Us</span>
        </a>
        <a 
          href={`tel:${BUSINESS_INFO.phones[0].replace(/-/g, '')}`} 
          className="w-14 h-14 bg-secondary text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-red-700 transition-all hover:scale-110 active:scale-95 group relative"
        >
          <span className="text-2xl">📞</span>
          <span className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm whitespace-nowrap pointer-events-none">Call Support</span>
        </a>
      </div>
    </div>
  );
};

export default App;
