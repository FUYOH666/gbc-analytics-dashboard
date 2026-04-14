import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { z } from "zod";

import type { MockOrder } from "@/lib/orders/import-payload";

const mockOrderSchema: z.ZodType<MockOrder> = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  orderType: z.string().min(1),
  orderMethod: z.string().min(1),
  status: z.string().min(1),
  items: z.array(
    z.object({
      productName: z.string().min(1),
      quantity: z.number().positive(),
      initialPrice: z.number().nonnegative(),
    }),
  ),
  delivery: z.object({
    address: z.object({
      city: z.string().min(1),
      text: z.string().min(1),
    }),
  }),
  customFields: z.record(z.string(), z.string()).optional(),
});

const mockOrdersSchema = z.array(mockOrderSchema);

export async function loadMockOrders() {
  const filePath = join(process.cwd(), "mock_orders.json");
  const fileContents = await readFile(filePath, "utf8");

  return mockOrdersSchema.parse(JSON.parse(fileContents));
}
