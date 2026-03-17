import { supabase } from '../lib/supabase';
import { Booking, ContactMessage } from '../types';

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
    const { data, error } = await supabase
      .from('bookings')
      .insert({
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
      })
      .select()
      .single();

    if (error) throw error;
    return mapBookingRow(data);
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.estimatedPrice !== undefined) dbUpdates.estimated_price = updates.estimatedPrice;
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.transactionId !== undefined) dbUpdates.transaction_id = updates.transactionId;
    if (updates.amountPaid !== undefined) dbUpdates.amount_paid = updates.amountPaid;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;

    const { data, error } = await supabase
      .from('bookings')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? mapBookingRow(data) : null;
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
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: msg.name,
        email: msg.email,
        message: msg.message,
      })
      .select()
      .single();

    if (error) throw error;
    return mapContactRow(data);
  },
};
