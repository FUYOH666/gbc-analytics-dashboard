import { z } from "zod";

import type { RetailCrmOrderInput } from "@/lib/orders/import-payload";
import { hasConfiguredValue, readEnv } from "@/lib/env";
import type { RetailCrmOrder } from "@/lib/orders/types";

const retailCrmOrderListItemSchema = z.object({
  id: z.coerce.number().optional(),
  externalId: z.string().optional(),
  number: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  status: z.string().optional(),
  orderMethod: z.string().optional(),
  createdAt: z.string().optional(),
  statusUpdatedAt: z.string().optional(),
  totalSumm: z.coerce.number().optional(),
  currency: z.string().optional(),
  customFields: z
    .union([z.record(z.string(), z.unknown()), z.array(z.unknown())])
    .optional(),
  delivery: z
    .object({
      address: z
        .object({
          city: z.string().optional(),
          text: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        productName: z.string().optional(),
        quantity: z.coerce.number().optional(),
        initialPrice: z.coerce.number().optional(),
      }),
    )
    .optional(),
});

const retailCrmListOrdersResponseSchema = z.object({
  success: z.boolean().optional(),
  orders: z.array(retailCrmOrderListItemSchema).default([]),
});

const retailCrmUploadOrdersResponseSchema = z.object({
  success: z.boolean().optional(),
  uploadedOrders: z.array(z.object({ externalId: z.string().optional() })).optional(),
  errors: z.array(z.unknown()).optional(),
});

type RetailCrmListOrdersResponse = z.infer<typeof retailCrmListOrdersResponseSchema>;
type RetailCrmUploadOrdersResponse = z.infer<typeof retailCrmUploadOrdersResponseSchema>;

function getRetailCrmConnection() {
  const env = readEnv();

  if (
    !hasConfiguredValue(env.RETAILCRM_BASE_URL) ||
    !hasConfiguredValue(env.RETAILCRM_API_KEY)
  ) {
    throw new Error(
      "RetailCRM client requires RETAILCRM_BASE_URL and RETAILCRM_API_KEY.",
    );
  }

  return {
    retailCrmBaseUrl: env.RETAILCRM_BASE_URL as string,
    retailCrmApiKey: env.RETAILCRM_API_KEY as string,
  };
}

function createRetailCrmUrl(
  pathname: string,
  apiPrefix: "/api/v5" | "/api",
  searchParams?: URLSearchParams,
) {
  const { retailCrmBaseUrl, retailCrmApiKey } = getRetailCrmConnection();

  const url = new URL(`${apiPrefix}${pathname}`, retailCrmBaseUrl);
  url.searchParams.set("apiKey", retailCrmApiKey);

  if (searchParams) {
    for (const [key, value] of searchParams.entries()) {
      url.searchParams.append(key, value);
    }
  }

  return url;
}

function createRetailCrmUrlCandidates(
  pathname: string,
  searchParams?: URLSearchParams,
) {
  return [
    createRetailCrmUrl(pathname, "/api/v5", searchParams),
    createRetailCrmUrl(pathname, "/api", searchParams),
  ];
}

export function buildRetailCrmFormBody(body: Record<string, unknown>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) {
      continue;
    }

    if (
      value !== null &&
      (typeof value === "object" || Array.isArray(value))
    ) {
      params.set(key, JSON.stringify(value));
      continue;
    }

    params.set(key, value === null ? "" : String(value));
  }

  return params;
}

export function shouldRetryRetailCrmWithoutVersion(
  status: number,
  payload: unknown,
) {
  return (
    status === 404 &&
    typeof payload === "object" &&
    payload !== null &&
    "errorMsg" in payload &&
    String(payload.errorMsg).includes("API method not found")
  );
}

async function retailCrmRequest<T>({
  pathname,
  method = "GET",
  searchParams,
  body,
  schema,
}: {
  pathname: string;
  method?: "GET" | "POST";
  searchParams?: URLSearchParams;
  body?: unknown;
  schema: z.ZodType<T>;
}) {
  const urlCandidates = createRetailCrmUrlCandidates(pathname, searchParams);
  const encodedBody =
    body && method === "POST"
      ? buildRetailCrmFormBody(body as Record<string, unknown>)
      : undefined;
  let lastError = "Unknown RetailCRM error";

  for (const [index, url] of urlCandidates.entries()) {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(encodedBody
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : {}),
      },
      body: encodedBody?.toString(),
      cache: "no-store",
    });

    const rawText = await response.text();
    let rawJson: unknown = {};

    if (rawText) {
      try {
        rawJson = JSON.parse(rawText);
      } catch {
        throw new Error(
          `RetailCRM returned a non-JSON response (${response.status}).`,
        );
      }
    }

    if (response.ok) {
      return schema.parse(rawJson);
    }

    lastError = `RetailCRM request failed (${response.status}): ${JSON.stringify(rawJson)}`;

    if (
      index === 0 &&
      shouldRetryRetailCrmWithoutVersion(response.status, rawJson)
    ) {
      continue;
    }

    throw new Error(lastError);
  }

  throw new Error(lastError);
}

export async function listRetailCrmOrdersByExternalIds(externalIds: string[]) {
  const params = new URLSearchParams();
  params.set("limit", String(Math.max(externalIds.length, 20)));

  for (const externalId of externalIds) {
    params.append("filter[externalIds][]", externalId);
  }

  const response = await retailCrmRequest<RetailCrmListOrdersResponse>({
    pathname: "/orders",
    searchParams: params,
    schema: retailCrmListOrdersResponseSchema,
  });

  return response.orders;
}

export async function listRetailCrmOrdersPage(page = 1, limit = 100) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  const response = await retailCrmRequest<RetailCrmListOrdersResponse>({
    pathname: "/orders",
    searchParams: params,
    schema: retailCrmListOrdersResponseSchema,
  });

  return response.orders;
}

export async function listAllRetailCrmOrders(limit = 100) {
  const orders: RetailCrmOrder[] = [];
  let page = 1;

  while (true) {
    const currentPage = await listRetailCrmOrdersPage(page, limit);
    orders.push(...currentPage);

    if (currentPage.length < limit) {
      break;
    }

    page += 1;
  }

  return orders;
}

export async function uploadRetailCrmOrders(
  site: string,
  orders: RetailCrmOrderInput[],
) {
  return retailCrmRequest<RetailCrmUploadOrdersResponse>({
    pathname: "/orders/upload",
    method: "POST",
    body: {
      site,
      orders,
    },
    schema: retailCrmUploadOrdersResponseSchema,
  });
}
