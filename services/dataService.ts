import { supabase } from '../lib/supabase';
import { Booking, ContactMessage } from '../types';

/** Browser-safe UUID for booking/contact ids (avoids .select() after insert — RLS allows anon INSERT but not SELECT). */
function newRowId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Map Supabase snake_case row to app camelCase
function mapBookingRow(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    email: row.email as string,
    address: row.address as string,
    category: row.category as string,
    service: row.service as string,
    date: row.date as string,
    time: row.time as string,
    notes: (row.notes as string) || '',
    createdAt: row.created_at as string,
    estimatedPrice: row.estimated_price as string | undefined,
    paymentStatus: row.payment_status as Booking['paymentStatus'],
    transactionId: row.transaction_id as string | undefined,
    amountPaid: row.amount_paid != null ? Number(row.amount_paid) : undefined,
    paymentMethod: row.payment_method as string | undefined,
  };
}

function mapContactRow(row: Record<string, unknown>): ContactMessage {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    message: row.message as string,
    createdAt: row.created_at as string,
  };
}

export const dataService = {
  // Bookings
  async getBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapBookingRow);
  },

  async addBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const id = newRowId();
    const createdAt = new Date().toISOString();

    // No .select() after insert: guest role has INSERT policy but not SELECT on bookings.
    // PostgREST INSERT+RETURNING requires SELECT RLS; without it you get 42501.
    const { error } = await supabase.from('bookings').insert({
      id,
      name: booking.name,
      phone: booking.phone,
      email: booking.email || 'not-provided@booking.local',
      address: booking.address,
      category: booking.category,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      notes: booking.notes || '',
      estimated_price: booking.estimatedPrice,
      payment_status: booking.paymentStatus || 'pending',
      transaction_id: booking.transactionId,
      amount_paid: booking.amountPaid,
      payment_method: booking.paymentMethod,
    });

    if (error) throw error;

    return mapBookingRow({
      id,
      name: booking.name,
      phone: booking.phone,
      email: booking.email || 'not-provided@booking.local',
      address: booking.address,
      category: booking.category,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      notes: booking.notes || '',
      created_at: createdAt,
      estimated_price: booking.estimatedPrice,
      payment_status: booking.paymentStatus || 'pending',
      transaction_id: booking.transactionId,
      amount_paid: booking.amountPaid,
      payment_method: booking.paymentMethod,
    });
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.estimatedPrice !== undefined) dbUpdates.estimated_price = updates.estimatedPrice;
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.transactionId !== undefined) dbUpdates.transaction_id = updates.transactionId;
    if (updates.amountPaid !== undefined) dbUpdates.amount_paid = updates.amountPaid;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;

    // No .select(): anon cannot SELECT bookings rows (only authenticated admin can list).
    const { error } = await supabase.from('bookings').update(dbUpdates).eq('id', id);

    if (error) throw error;
    return null;
  },

  async deleteBooking(id: string): Promise<void> {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) throw error;
  },

  async getBookingsByPaymentStatus(
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
  ): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('payment_status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapBookingRow);
  },

  // Contact Messages
  async getContactMessages(): Promise<ContactMessage[]> {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapContactRow);
  },

  async addContactMessage(msg: Omit<ContactMessage, 'id' | 'createdAt'>): Promise<ContactMessage> {
    const id = newRowId();
    const createdAt = new Date().toISOString();

    const { error } = await supabase.from('contact_messages').insert({
      id,
      name: msg.name,
      email: msg.email,
      message: msg.message,
    });

    if (error) throw error;

    return mapContactRow({
      id,
      name: msg.name,
      email: msg.email,
      message: msg.message,
      created_at: createdAt,
    });
  },
};
