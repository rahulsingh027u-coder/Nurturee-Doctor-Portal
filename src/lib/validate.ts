import { z } from 'zod';

// Common validation schemas for Nurturee API routes

// Phone: 10-digit Indian mobile (starts with 6-9)
export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number');

// OTP: 6 digits
export const otpSchema = z.string().regex(/^\d{6}$/, 'OTP must be 6 digits');

// Date: YYYY-MM-DD
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format');

// Time: HH:mm
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format');

// Booking status enum
export const bookingStatusSchema = z.enum([
  'pending', 'pending_admin_approval', 'confirmed', 'in_progress', 'completed', 'cancelled'
]);

// Booking type enum
export const bookingTypeSchema = z.enum(['consultation', 'service', 'verification']);

// Consultation mode enum
export const consultationModeSchema = z.enum(['online', 'in_home']);

// ID: non-empty string (cuid)
export const idSchema = z.string().min(1, 'ID is required');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Validate helper — returns parsed data or throws
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Safe validate — returns { success, data, error }
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') };
}
