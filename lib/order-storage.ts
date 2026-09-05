import {
  fetchOrderFromDatabaseIncludingDeleted,
  isDeletedOrderRecord,
} from "@/lib/order-database";

type OrderRecord = Record<string, unknown>;

export async function fetchOrderFromGoogleSheets(orderRef: string) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl || !orderRef) return null;

  const url = new URL(webhookUrl);
  url.searchParams.set("order_ref", orderRef);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;

    const data = await response.json() as {
      success?: boolean;
      order?: OrderRecord;
    };
    return data.success && data.order ? data.order : null;
  } catch (error) {
    console.error("Could not fetch order from Google Sheets", {
      order_ref: orderRef,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function fetchOrderFromStorage(orderRef: string) {
  const [databaseResult, sheetsResult] = await Promise.allSettled([
    fetchOrderFromDatabaseIncludingDeleted(orderRef),
    fetchOrderFromGoogleSheets(orderRef),
  ]);
  const databaseOrder = databaseResult.status === "fulfilled" ? databaseResult.value : null;
  const sheetOrder = sheetsResult.status === "fulfilled" ? sheetsResult.value : null;

  if (databaseResult.status === "rejected") {
    console.error("Could not fetch order from Supabase; trying Google Sheets", {
      order_ref: orderRef,
      error: databaseResult.reason instanceof Error
        ? databaseResult.reason.message
        : String(databaseResult.reason),
    });
  }

  if (isDeletedOrderRecord(databaseOrder)) return null;
  return databaseOrder || sheetOrder;
}
