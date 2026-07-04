export interface LeadPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | undefined;
  business_name: string;
  city: string;
  plan_interest?: string | undefined;
  message?: string | undefined;
}

export interface LeadPort {
  deliver(lead: LeadPayload): Promise<void>;
}
