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

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .superRefine((value, ctx) => {
    if (value.new_password !== value.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "New passwords do not match",
      });
    }

    if (value.current_password === value.new_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_password"],
        message: "New password must be different from your current password",
      });
    }
  });

export const resendEmailOtpSchema = z.object({
  email: purdueEmailSchema,
});

export const resendPhoneOtpSchema = z.object({
  phone: phoneSchema,
});

export const forgotPasswordSchema = z.object({
  email: purdueEmailSchema,
  redirect_to: z.string().url().optional(),
});

export const resetPasswordSchema = z
  .object({
    token_hash: z.string().min(1, "Reset token is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .superRefine((value, ctx) => {
    if (value.new_password !== value.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "New passwords do not match",
      });
    }
  });
