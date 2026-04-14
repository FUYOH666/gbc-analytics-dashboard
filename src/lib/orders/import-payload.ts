import { subDays } from "date-fns";

export type MockOrderItem = {
  productName: string;
  quantity: number;
  initialPrice: number;
};

export type MockOrder = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  orderType: string;
  orderMethod: string;
  status: string;
  items: MockOrderItem[];
  delivery: {
    address: {
      city: string;
      text: string;
    };
  };
  customFields?: Record<string, string>;
};

export type RetailCrmOrderInput = {
  externalId: string;
  countryIso: "KZ";
  createdAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  orderMethod: string;
  status: string;
  delivery: MockOrder["delivery"];
  items: MockOrder["items"];
  customFields: Record<string, string>;
};

export type IndexedMockOrder = {
  sourceIndex: number;
  order: MockOrder;
};

const transliterationMap: Record<string, string> = {
  а: "a",
  ә: "a",
  б: "b",
  в: "v",
  г: "g",
  ғ: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  қ: "k",
  л: "l",
  м: "m",
  н: "n",
  ң: "n",
  о: "o",
  ө: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ұ: "u",
  ү: "u",
  ф: "f",
  х: "h",
  һ: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ы: "y",
  і: "i",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterate(value: string) {
  return value
    .toLowerCase()
    .split("")
    .map((char) => transliterationMap[char] ?? char)
    .join("");
}

function toSlug(value: string) {
  return transliterate(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function formatUtcDateTime(value: Date) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}

export function buildRetailCrmExternalId(order: MockOrder, index: number) {
  const orderNumber = String(index + 1).padStart(3, "0");
  const itemsCount = String(order.items.length).padStart(2, "0");

  return `mock-order-${orderNumber}-${toSlug(order.firstName)}-${toSlug(order.lastName)}-${itemsCount}`;
}

export function buildRetailCrmUploadOrdersPayload(
  orders: MockOrder[] | IndexedMockOrder[],
  site: string,
  importStartedAt: Date,
) {
  return {
    site,
    orders: orders.map((entry, index) => {
      const normalized =
        "order" in entry
          ? entry
          : {
              order: entry,
              sourceIndex: index,
            };
      const createdAt = subDays(importStartedAt, normalized.sourceIndex % 14);

      return {
        externalId: buildRetailCrmExternalId(
          normalized.order,
          normalized.sourceIndex,
        ),
        countryIso: "KZ" as const,
        createdAt: formatUtcDateTime(createdAt),
        firstName: normalized.order.firstName,
        lastName: normalized.order.lastName,
        phone: normalized.order.phone,
        email: normalized.order.email,
        orderMethod: normalized.order.orderMethod,
        status: normalized.order.status,
        delivery: normalized.order.delivery,
        items: normalized.order.items,
        customFields: normalized.order.customFields ?? {},
      };
    }),
  };
}

export function chunkOrders<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function filterOrdersForImport(
  orders: MockOrder[],
  existingExternalIds: Set<string>,
) {
  const indexedOrders = orders.map((order, sourceIndex) => ({
    order,
    sourceIndex,
  }));
  const missing = indexedOrders.filter(
    ({ order, sourceIndex }) =>
      !existingExternalIds.has(buildRetailCrmExternalId(order, sourceIndex)),
  );

  return {
    missing,
    alreadyExistingCount: orders.length - missing.length,
  };
}
