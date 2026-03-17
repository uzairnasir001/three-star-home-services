
export enum ServiceCategory {
  CONSTRUCTION = "Construction / Property Services",
  GROCERY = "Grocery / Delivery Services",
  EVENT = "Event / Tours Services"
}

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  icon: string;
  price: number; // Base price in PKR
  unit: string;  // e.g., "Visit", "Sq Ft", "Service Fee"
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  category: ServiceCategory;
  service: string;
  date: string;
  time: string;
  notes: string;
  createdAt: string;
  estimatedPrice?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  amountPaid?: number;
  paymentMethod?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}
