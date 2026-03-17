
import { ServiceCategory, ServiceItem } from './types';

export const BUSINESS_INFO = {
  name: "Three Stars Home Services",
  tagline: "Home Services On-Demand — Delivery in 30 Minutes",
  location: "Multan, Pakistan",
  address: "173/1 X-E-X Iqbal Street Near Board Of Education Gulgasht Multan",
  email: "zainisheik103@gmail.com",
  phones: ["0333-6284839"],
  whatsapp: "923336284839"
};

export const SERVICES: ServiceItem[] = [
  // Construction / Property Services
  { id: "c1", name: "Property Selling & Purchasing", category: ServiceCategory.CONSTRUCTION, description: "Professional real estate consultancy for buying and selling property.", icon: "💰", price: 5000, unit: "Consultation" },
  { id: "c2", name: "Property Construction", category: ServiceCategory.CONSTRUCTION, description: "End-to-end building construction services with quality materials.", icon: "🏗️", price: 2500, unit: "Sq Ft" },
  { id: "c3", name: "Property Renovation", category: ServiceCategory.CONSTRUCTION, description: "Transform your old space into a modern masterpiece.", icon: "🏠", price: 15000, unit: "Min. Project" },
  { id: "c4", name: "Architect Designing", category: ServiceCategory.CONSTRUCTION, description: "Professional architectural planning and structural design.", icon: "📐", price: 10000, unit: "Map" },
  { id: "c5", name: "Interior Designing", category: ServiceCategory.CONSTRUCTION, description: "Creative interior solutions for homes and offices.", icon: "🛋️", price: 5000, unit: "Room" },
  { id: "c6", name: "Interior Work & Landscaping", category: ServiceCategory.CONSTRUCTION, description: "Flooring, ceiling, and beautiful garden landscaping.", icon: "🌳", price: 200, unit: "Sq Ft" },
  { id: "c7", name: "Maps", category: ServiceCategory.CONSTRUCTION, description: "Approved building maps and technical drawings.", icon: "🗺️", price: 8000, unit: "Map" },
  { id: "c8", name: "Electrician", category: ServiceCategory.CONSTRUCTION, description: "Expert electrical wiring, repairs, and installations.", icon: "⚡", price: 500, unit: "Visit" },
  { id: "c9", name: "Plumber", category: ServiceCategory.CONSTRUCTION, description: "Fast plumbing repairs and sanitary fittings.", icon: "🚿", price: 500, unit: "Visit" },
  { id: "c10", name: "Painter", category: ServiceCategory.CONSTRUCTION, description: "High-quality wall painting and distemper services.", icon: "🖌️", price: 15, unit: "Sq Ft" },
  { id: "c11", name: "Mason", category: ServiceCategory.CONSTRUCTION, description: "Skilled masonry work for walls and floors.", icon: "🧱", price: 1200, unit: "Day" },
  { id: "c12", name: "Labor", category: ServiceCategory.CONSTRUCTION, description: "Reliable general labor for all your home needs.", icon: "👷", price: 800, unit: "Day" },
  { id: "c13", name: "Carpenter", category: ServiceCategory.CONSTRUCTION, description: "Furniture repair and custom woodwork.", icon: "🔨", price: 1000, unit: "Visit" },

  // Grocery / Delivery Services
  { id: "g1", name: "Grocery Delivery", category: ServiceCategory.GROCERY, description: "Daily household essentials delivered to your door.", icon: "🛒", price: 150, unit: "Delivery" },
  { id: "g2", name: "Fresh Vegetables", category: ServiceCategory.GROCERY, description: "Farm-fresh vegetables handpicked for quality.", icon: "🥬", price: 100, unit: "Service Fee" },
  { id: "g3", name: "Fresh Fruits", category: ServiceCategory.GROCERY, description: "Seasonal fresh fruits delivered within 30 minutes.", icon: "🍎", price: 100, unit: "Service Fee" },
  { id: "g4", name: "Fresh Meats", category: ServiceCategory.GROCERY, description: "Hygienic and fresh poultry, beef, and mutton.", icon: "🍗", price: 150, unit: "Service Fee" },
  { id: "g5", name: "Bakery Items", category: ServiceCategory.GROCERY, description: "Fresh cakes, bread, and savory bakery snacks.", icon: "🥯", price: 100, unit: "Delivery" },
  { id: "g6", name: "Medicines", category: ServiceCategory.GROCERY, description: "Emergency and regular medicine delivery.", icon: "💊", price: 200, unit: "Emergency" },
  { id: "g7", name: "Cosmetics", category: ServiceCategory.GROCERY, description: "High-quality beauty and personal care products.", icon: "💄", price: 150, unit: "Delivery" },
  { id: "g8", name: "Electronics", category: ServiceCategory.GROCERY, description: "Small household electronics and gadgets.", icon: "🔌", price: 300, unit: "Delivery" },
  { id: "g9", name: "Crockery", category: ServiceCategory.GROCERY, description: "Elegant kitchenware and dining sets.", icon: "🍽️", price: 200, unit: "Delivery" },
  { id: "g10", name: "Mobile Accessories", category: ServiceCategory.GROCERY, description: "Chargers, cables, and mobile peripherals.", icon: "📱", price: 100, unit: "Delivery" },
  { id: "g11", name: "Security Guard", category: ServiceCategory.GROCERY, description: "Professional security personnel for events or homes.", icon: "💂", price: 25000, unit: "Month" },
  { id: "g12", name: "Staff", category: ServiceCategory.GROCERY, description: "Housekeeping and domestic support staff.", icon: "🧹", price: 15000, unit: "Month" },

  // Event / Tours Services
  { id: "e1", name: "Weddings Ceremony", category: ServiceCategory.EVENT, description: "Complete wedding planning and management.", icon: "💍", price: 50000, unit: "Start" },
  { id: "e2", name: "Birthdays", category: ServiceCategory.EVENT, description: "Fun and memorable birthday party setups.", icon: "🎂", price: 10000, unit: "Start" },
  { id: "e3", name: "Family Trips", category: ServiceCategory.EVENT, description: "Customized family vacation planning.", icon: "🚐", price: 5000, unit: "Plan" },
  { id: "e4", name: "Meetings", category: ServiceCategory.EVENT, description: "Professional corporate event organization.", icon: "🤝", price: 15000, unit: "Event" },
  { id: "e5", name: "Informative & Historical Trips", category: ServiceCategory.EVENT, description: "Guided tours to historical sites in Multan.", icon: "🏛️", price: 2000, unit: "Person" },
  { id: "e6", name: "School & Collages Trips", category: ServiceCategory.EVENT, description: "Safe and educational group travel for students.", icon: "🚌", price: 1500, unit: "Person" },
  { id: "e7", name: "Domestic & International Air Tickets", category: ServiceCategory.EVENT, description: "Affordable flight bookings globally.", icon: "✈️", price: 500, unit: "Booking Fee" },
  { id: "e8", name: "Hajj & Umrah Package", category: ServiceCategory.EVENT, description: "Spiritual journey packages with full support.", icon: "🕋", price: 2500, unit: "Service Fee" },
  { id: "e9", name: "Work & Visit Visa", category: ServiceCategory.EVENT, description: "Visa consultancy and documentation services.", icon: "🛂", price: 5000, unit: "Case" },
  { id: "e10", name: "Rent A Car", category: ServiceCategory.EVENT, description: "Reliable car rental with or without drivers.", icon: "🚗", price: 3500, unit: "Day" },
];
