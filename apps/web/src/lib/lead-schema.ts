import { z } from 'zod';

export const LeadSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Valid email required').max(254),
  phone: z.string().max(30).optional(),
  business_name: z.string().min(1, 'Business name is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  plan_interest: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
  // honeypot — bots fill it; humans leave it empty
  _gotcha: z.string().max(0, 'Bot detected').optional(),
});

export type LeadInput = z.infer<typeof LeadSchema>;
