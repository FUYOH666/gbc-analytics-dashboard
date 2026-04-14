import type { Database } from "@/lib/database";

export type RetailCrmOrder = {
  id?: number;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  status?: string;
  orderMethod?: string;
  totalSumm?: number;
  currency?: string;
  createdAt?: string;
  statusUpdatedAt?: string;
  customFields?: Record<string, unknown> | unknown[];
  delivery?: {
    address?: {
      city?: string;
      text?: string;
    };
  };
  items?: Array<{
    productName?: string;
    quantity?: number;
    initialPrice?: number;
  }>;
};

export type NormalizedOrderRecord = Database["public"]["Tables"]["orders"]["Insert"];
