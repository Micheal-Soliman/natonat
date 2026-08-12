import {
  getBostaDeliveryStateCode,
  getBostaDeliveryStateValue,
  getBostaDeliveryTimestamp,
  getBostaExceptionLabel,
  getOrderStatusFromBostaState,
  searchBostaDeliveries,
} from "@/lib/bosta";

export type BostaOrderRecord = Record<string, unknown>;

export type BostaReconciliationUpdate = {
  order: BostaOrderRecord;
  orderRef: string;
  trackingNumber: string;
  status: string;
  bosta: BostaOrderRecord;
};

export type BostaReconciliationResult = {
  checked: number;
  updates: BostaReconciliationUpdate[];
  errors: Array<{ orderRef: string; error: string }>;
  missing: Array<{ orderRef: string; trackingNumber: string }>;
};

function getString(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value instanceof Date) return value.toISOString();
  return "";
}

function getObject(value: unknown): BostaOrderRecord {
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      return getObject(JSON.parse(value) as unknown);
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? value as BostaOrderRecord
    : {};
}

export function getBostaOrderRef(order: BostaOrderRecord) {
  return getString(order.order_ref || order["Order Ref"]);
}

export function getBostaShipment(order: BostaOrderRecord) {
  return getObject(order.bosta || order.shipment || order.aramex);
}

export function getBostaTrackingNumber(order: BostaOrderRecord) {
  const bosta = getBostaShipment(order);
  return getString(
    bosta.trackingNumber ||
      order["Bosta Tracking Number"] ||
      order["Aramex Tracking Number"],
  );
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getDeliveryTrackingNumber(delivery: BostaOrderRecord) {
  return getString(
    delivery.trackingNumber ||
      delivery.tracking_number ||
      delivery.shipmentNumber,
  );
}

function selectLatestDelivery(deliveries: BostaOrderRecord[]) {
  return [...deliveries].sort((left, right) => {
    const timestampDifference = getBostaDeliveryTimestamp(right) - getBostaDeliveryTimestamp(left);
    if (timestampDifference !== 0) return timestampDifference;

    const terminalRank = (delivery: BostaOrderRecord) => {
      const code = Number(getBostaDeliveryStateCode(delivery));
      if (code === 46 || code === 60) return 4;
      if (code === 49 || code === 48) return 3;
      if (code === 45) return 2;
      return 1;
    };

    return terminalRank(right) - terminalRank(left);
  })[0];
}

export function buildBostaReconciliationUpdate(
  order: BostaOrderRecord,
  delivery: BostaOrderRecord,
): BostaReconciliationUpdate {
  const currentBosta = getBostaShipment(order);
  const stateCode = getBostaDeliveryStateCode(delivery);
  const stateValue = getBostaDeliveryStateValue(delivery);
  const exceptionCode = getString(delivery.exceptionCode || delivery.exceptionReasonCode);
  const exceptionLabel = getString(delivery.exceptionReason) || getBostaExceptionLabel(exceptionCode);
  const trackingNumber = getDeliveryTrackingNumber(delivery) || getBostaTrackingNumber(order);
  const deliveryId = getString(delivery._id || delivery.id) || getString(currentBosta.deliveryId || currentBosta.guid);
  const latestDescription = [stateValue, exceptionLabel].filter(Boolean).join(" - ");
  const deliveryTimestamp = getBostaDeliveryTimestamp(delivery);
  const latestDate = deliveryTimestamp
    ? new Date(deliveryTimestamp).toISOString()
    : new Date().toISOString();
  const syncedAt = new Date().toISOString();
  const bosta = {
    ...currentBosta,
    provider: "bosta",
    guid: deliveryId,
    deliveryId,
    trackingNumber,
    trackingLink: trackingNumber
      ? `https://bosta.co/tracking-shipments?shipmentNumber=${encodeURIComponent(trackingNumber)}`
      : getString(currentBosta.trackingLink),
    status: stateValue || getString(currentBosta.status),
    latestCode: stateCode,
    latestDescription: latestDescription || getString(currentBosta.latestDescription),
    latestDate,
    latestComments: getString(delivery.notes || delivery.message),
    latestProblemCode: exceptionCode,
    syncedAt,
    trackingRaw: delivery,
    error: "",
  };

  return {
    order,
    orderRef: getBostaOrderRef(order),
    trackingNumber,
    status: getOrderStatusFromBostaState(stateCode) || getString(order.status) || "shipped",
    bosta,
  };
}

export async function reconcileBostaOrders(
  orders: BostaOrderRecord[],
  batchSize = 50,
): Promise<BostaReconciliationResult> {
  const trackedOrders = orders
    .map((order) => {
      const shipment = getBostaShipment(order);
      return {
        order,
        orderRef: getBostaOrderRef(order),
        trackingNumber: getBostaTrackingNumber(order),
        provider: getString(shipment.provider).toLowerCase(),
      };
    })
    .filter((entry) =>
      entry.orderRef &&
      entry.trackingNumber &&
      (!entry.provider || entry.provider === "bosta"),
    );
  const updates: BostaReconciliationUpdate[] = [];
  const errors: Array<{ orderRef: string; error: string }> = [];
  const missing: Array<{ orderRef: string; trackingNumber: string }> = [];

  for (const batch of chunk(trackedOrders, Math.max(1, batchSize))) {
    const searchResult = await searchBostaDeliveries({
      trackingNumbers: batch.map((entry) => entry.trackingNumber),
    });

    if (!searchResult.success) {
      const error = searchResult.error || "Could not search Bosta deliveries";
      errors.push(...batch.map((entry) => ({ orderRef: entry.orderRef, error })));
      continue;
    }

    const deliveriesByTracking = new Map<string, BostaOrderRecord[]>();
    for (const delivery of searchResult.deliveries) {
      const trackingNumber = getDeliveryTrackingNumber(delivery);
      if (!trackingNumber) continue;
      const deliveries = deliveriesByTracking.get(trackingNumber) || [];
      deliveries.push(delivery);
      deliveriesByTracking.set(trackingNumber, deliveries);
    }

    for (const entry of batch) {
      const candidates = deliveriesByTracking.get(entry.trackingNumber) || [];
      const delivery = selectLatestDelivery(candidates);
      if (!delivery) {
        missing.push({
          orderRef: entry.orderRef,
          trackingNumber: entry.trackingNumber,
        });
        continue;
      }

      updates.push(buildBostaReconciliationUpdate(entry.order, delivery));
    }
  }

  return {
    checked: trackedOrders.length,
    updates,
    errors,
    missing,
  };
}
