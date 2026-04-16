import { z } from 'zod';

export const purdueEmailSchema = z.string().email().regex(/^[^@]+@purdue\.edu$/i, 'Email must end with @purdue.edu');
export const phoneSchema = z.string().regex(/^\+1\d{10}$/, 'Phone must be a US +1 number');

export const signupSchema = z.object({
  email: purdueEmailSchema,
  password: z.string().min(8),
});

export const verifyEmailSchema = z.object({
  email: purdueEmailSchema,
  token: z.string().length(6),
});

export const sendPhoneOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyPhoneSchema = z.object({
  phone: phoneSchema,
  token: z.string().length(6),
});

export const loginSchema = z.object({
  email: purdueEmailSchema,
  password: z.string().min(1),
});

export const resendEmailOtpSchema = z.object({
  email: purdueEmailSchema,
});

export const resendPhoneOtpSchema = z.object({
  phone: phoneSchema,
});
