import { z } from "zod";

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Indian phone number validation
 */
export const indianPhoneSchema = z
  .string()
  .regex(/^\+91[0-9]{10}$/, "Phone must be a valid Indian number (+91XXXXXXXXXX)");

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: "Start date must be before end date" }
);

/**
 * API error response schema
 */
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

