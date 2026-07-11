/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Google Apps Script for natOnat order logging.
 *
 * Install/update:
 * 1. Open https://script.google.com
 * 2. Paste this full file into the deployed Web App project.
 * 3. Deploy > Manage deployments > Edit > New version > Deploy.
 *
 * Important:
 * Saving the script alone does not update the live Web App version.
 */

const SHEET_NAME = "orders";
const COD_SHEET_NAME = "cod_orders";

const HEADERS = [
  "Timestamp",
  "Source",
  "Order Ref",
  "Special Reference (Paymob)",
  "Intention Order ID",
  "Paymob Reference",
  "Status",
  "Payment Status",
  "Subtotal (EGP)",
  "Shipping (EGP)",
  "Discount Code",
  "Discount (EGP)",
  "Payment Discount (EGP)",
  "Payment Discount Percent",
  "Total (EGP)",
  "Total Cents",
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "Address",
  "City",
  "Governorate",
  "City Key",
  "Delivery Method",
  "Shipping Cost Rule",
  "Payment Method",
  "Bank Name (Card only)",
  "Locale",
  "Items Count",
  "Total Items Quantity",
  "Items Summary",
  "Products Details",
  "Bundles Details",
  "Items Flat Details",
  "Items (Full JSON)",
  "Items Flat JSON",
  "Customer (Full JSON)",
  "Paymob Data (JSON)",
  "Payment Data (JSON)",
  "Discount Data (JSON)",
  "Extras (JSON)",
  "Aramex Tracking Number",
  "Aramex Tracking Link",
  "Aramex GUID",
  "Aramex Status",
  "Aramex Latest Update",
  "Aramex Latest Location",
  "Aramex Synced At",
  "Aramex Error",
  "InstaPay Proof Status",
  "InstaPay Proof File",
  "InstaPay Proof Uploaded At",
  "InstaPay Approval Status",
  "Email Sent At",
  "InstaPay Admin Email Sent At",
  "InstaPay Customer Pending Email Sent At",
  "Inventory Status",
  "Inventory Updated At",
  "Referral Data (JSON)",
  "Tracking Link",
  "Catalog Enriched At",
  "History (JSON)",
  "Raw Payload",
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allOrdersResult = upsertOrderRow(ss, SHEET_NAME, data);
    const codResult = isCodOrder(data) ? upsertOrderRow(ss, COD_SHEET_NAME, data) : null;

    return jsonOutput({
      success: true,
      orders: allOrdersResult,
      cod_orders: codResult,
    });
  } catch (error) {
    return jsonOutput({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = params.action || "";
  const orderRef = params.order_ref || "";

  if (action === "list") {
    return listOrders(params);
  }

  if (!orderRef) {
    return jsonOutput({
      success: true,
      message: "Order logging webhook is active",
      timestamp: new Date().toISOString(),
      sheet: SHEET_NAME,
    });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return jsonOutput({ success: false, error: "Sheet not found" });
    }

    ensureHeaders(sheet);

    const values = sheet.getDataRange().getValues();
    const headers = values[0] || [];
    const orderRefIndex = headers.indexOf("Order Ref");
    const rawPayloadIndex = headers.indexOf("Raw Payload");

    for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex--) {
      const row = values[rowIndex];
      const rowOrderRef = orderRefIndex >= 0 ? row[orderRefIndex] : row[2];

      if (String(rowOrderRef) === String(orderRef)) {
        const rawPayload = rawPayloadIndex >= 0 ? row[rawPayloadIndex] : "";
        const order = rawPayload ? JSON.parse(rawPayload) : rowToObject(headers, row);

        return jsonOutput({
          success: true,
          order,
          row: rowIndex + 1,
        });
      }
    }

    return jsonOutput({ success: false, error: "Order not found" });
  } catch (error) {
    return jsonOutput({ success: false, error: error.toString() });
  }
}

function listOrders(params) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return jsonOutput({ success: false, error: "Sheet not found" });
    }

    ensureHeaders(sheet);

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return jsonOutput({ success: true, orders: [], total: 0 });
    }

    const headers = values[0] || [];
    const rawPayloadIndex = headers.indexOf("Raw Payload");
    const maxLimit = 1000;
    const requestedLimit = Number(params.limit || 500);
    const limit = Math.max(1, Math.min(maxLimit, Number.isFinite(requestedLimit) ? requestedLimit : 500));

    const orders = [];
    for (let rowIndex = values.length - 1; rowIndex >= 1 && orders.length < limit; rowIndex--) {
      const row = values[rowIndex];
      const rowObject = rowToObject(headers, row);
      const rawPayload = rawPayloadIndex >= 0 ? row[rawPayloadIndex] : "";
      let order = null;

      if (rawPayload) {
        try {
          order = JSON.parse(rawPayload);
        } catch (error) {
          order = null;
        }
      }

      if (!order) {
        order = rowObject;
      }

      orders.push({
        ...rowObject,
        ...order,
        sheet_row: rowIndex + 1,
      });
    }

    return jsonOutput({
      success: true,
      orders,
      returned: orders.length,
      total: values.length - 1,
    });
  } catch (error) {
    return jsonOutput({ success: false, error: error.toString() });
  }
}

function isCodOrder(data) {
  const paymentMethod = String(data.payment_method || "").toLowerCase();
  const paymentStatus = String(data.payment_status || "").toLowerCase();
  return paymentMethod === "cod" || paymentStatus === "cash on delivery";
}

function upsertOrderRow(ss, sheetName, data) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    createHeaders(sheet);
  }

  ensureHeaders(sheet);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowObject = buildOrderRowObject(data);
  const row = headers.map((header) => valueForCell(rowObject[header]));
  const orderRef = data.order_ref || "";
  const existingRow = orderRef ? findOrderRow(sheet, orderRef) : null;

  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    return { sheet: sheetName, updated: true, row: existingRow, order_ref: orderRef };
  }

  sheet.appendRow(row);
  return { sheet: sheetName, inserted: true, row: sheet.getLastRow(), order_ref: orderRef };
}

function createHeaders(sheet) {
  sheet.appendRow(HEADERS);
  formatHeaders(sheet, 1, HEADERS.length);
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    createHeaders(sheet);
    return;
  }

  const legacyPaymobSecretHeader = sheet.getRange(1, 6).getValue();
  if (legacyPaymobSecretHeader === "Paymob Client Secret") {
    sheet.getRange(1, 6).setValue("Paymob Reference");
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const missingHeaders = HEADERS.filter((header) => existingHeaders.indexOf(header) === -1);

  if (missingHeaders.length === 0) return;

  const startColumn = existingHeaders.length + 1;
  sheet.getRange(1, startColumn, 1, missingHeaders.length).setValues([missingHeaders]);
  formatHeaders(sheet, startColumn, missingHeaders.length);
}

function formatHeaders(sheet, startColumn, count) {
  const range = sheet.getRange(1, startColumn, 1, count);
  range.setFontWeight("bold");
  range.setBackground("#EEBC3F");
  range.setFontColor("#0F1A26");
  sheet.autoResizeColumns(startColumn, count);
}

function buildOrderRowObject(data) {
  const now = new Date();
  const timestamp = Utilities.formatDate(now, "Africa/Cairo", "yyyy-MM-dd HH:mm:ss");
  const source = data.source || "";
  const orderRef = data.order_ref || "";
  const status = data.status || "";
  const paymentStatus = data.payment_status || (status === "created" ? "Pending" : status);
  const amountEgp = numberOrZero(data.amount_egp);
  const shippingEgp = numberOrZero(data.shipping_egp);
  const amountCents = numberOrZero(data.amount_cents);
  const paymentMethod = data.payment_method || "";
  const deliveryMethod = data.delivery_method || "";
  const locale = data.locale || "";
  const customer = data.customer || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const extras = data.extras || {};
  const paymob = data.paymob || {};
  const payment = data.payment || {};
  const aramex = data.aramex || {};
  const discount = data.discount || extras.discount || {};
  const inventory = data.inventory || {};
  const instapayProof = data.instapay_proof || {};

  const subtotalEgp =
    numberOrNull(extras.subtotal_egp) !== null
      ? numberOrZero(extras.subtotal_egp)
      : amountEgp - shippingEgp + numberOrZero(data.discount_egp) + numberOrZero(data.payment_discount_egp);
  const discountEgp = numberOrZero(data.discount_egp || discount.amount_egp);
  const paymentDiscountEgp = numberOrZero(data.payment_discount_egp || extras.payment_discount);
  const paymentDiscountPercent = valueOrEmpty(
    extras.payment_discount_percent || data.payment_discount_percent
  );
  const totalItemsQuantity = items.reduce((sum, item) => sum + numberOrZero(item.quantity), 0);
  const itemsFlat = Array.isArray(data.items_flat) ? data.items_flat : buildFlatItems(items);
  const itemsSummary = items.map(formatProductDetails).join(" || ");
  const productsDetails = items
    .filter((item) => !item.isBundle)
    .map(formatProductDetails)
    .join("\n");
  const bundlesDetails = items
    .filter((item) => item.isBundle || (item.bundleSelections || []).length > 0)
    .map(formatBundleDetails)
    .filter(Boolean)
    .join("\n");
  const itemsFlatDetails = itemsFlat.map(formatFlatItemDetails).join("\n");

  const trackingNumber = aramex.trackingNumber || "";
  const trackingLink =
    data.tracking_link ||
    (trackingNumber
      ? `https://www.aramex.com/eg/ar/track/results?mode=0&ShipmentNumber=${trackingNumber}`
      : "");
  const instapayProofStatus = instapayProof.file_name
    ? status === "pending_instapay_approval"
      ? "Uploaded - pending admin approval"
      : "Uploaded"
    : "";
  const instapayApprovalStatus =
    paymentMethod === "instapay"
      ? String(paymentStatus).toLowerCase() === "paid"
        ? "Approved"
        : status === "pending_instapay_approval"
          ? "Pending"
          : status || ""
      : "";

  return {
    "Timestamp": timestamp,
    "Source": source,
    "Order Ref": orderRef,
    "Special Reference (Paymob)": paymob.special_reference || data.special_reference || "",
    "Intention Order ID": paymob.intention_order_id || "",
    "Paymob Reference": paymob.id || paymob.intention_order_id || payment.transaction_id || "",
    "Status": status,
    "Payment Status": paymentStatus,
    "Subtotal (EGP)": subtotalEgp,
    "Shipping (EGP)": shippingEgp,
    "Discount Code": data.discount_code || discount.code || "",
    "Discount (EGP)": discountEgp,
    "Payment Discount (EGP)": paymentDiscountEgp,
    "Payment Discount Percent": paymentDiscountPercent,
    "Total (EGP)": amountEgp,
    "Total Cents": amountCents,
    "First Name": customer.first_name || "",
    "Last Name": customer.last_name || "",
    "Email": customer.email || "",
    "Phone": customer.phone || "",
    "Address": customer.address || "",
    "City": customer.city || "",
    "Governorate": customer.governorate || "",
    "City Key": extras.city_key || "",
    "Delivery Method": deliveryMethod,
    "Shipping Cost Rule": jsonStringifySafe(extras.shipping_rule || ""),
    "Payment Method": paymentMethod,
    "Bank Name (Card only)": extras.bank_name || "",
    "Locale": locale,
    "Items Count": items.length,
    "Total Items Quantity": totalItemsQuantity,
    "Items Summary": itemsSummary,
    "Products Details": productsDetails,
    "Bundles Details": bundlesDetails,
    "Items Flat Details": itemsFlatDetails,
    "Items (Full JSON)": jsonStringifySafe(items),
    "Items Flat JSON": jsonStringifySafe(itemsFlat),
    "Customer (Full JSON)": jsonStringifySafe(customer),
    "Paymob Data (JSON)": jsonStringifySafe(paymob),
    "Payment Data (JSON)": jsonStringifySafe(payment),
    "Discount Data (JSON)": jsonStringifySafe(discount),
    "Extras (JSON)": jsonStringifySafe(extras),
    "Aramex Tracking Number": trackingNumber,
    "Aramex Tracking Link": trackingLink,
    "Aramex GUID": aramex.guid || "",
    "Aramex Status": aramex.status || "",
    "Aramex Latest Update": aramex.latestDescription || aramex.latestDate || "",
    "Aramex Latest Location": aramex.latestLocation || "",
    "Aramex Synced At": aramex.syncedAt || "",
    "Aramex Error": aramex.error || "",
    "InstaPay Proof Status": instapayProofStatus,
    "InstaPay Proof File": instapayProof.file_name || "",
    "InstaPay Proof Uploaded At": instapayProof.uploaded_at || "",
    "InstaPay Approval Status": instapayApprovalStatus,
    "Email Sent At": data.email_sent_at || "",
    "InstaPay Admin Email Sent At": data.instapay_proof_email_sent_at || "",
    "InstaPay Customer Pending Email Sent At": data.instapay_pending_customer_email_sent_at || "",
    "Inventory Status": inventory.status || "",
    "Inventory Updated At": inventory.updatedAt || "",
    "Referral Data (JSON)": jsonStringifySafe(data.referral || ""),
    "Tracking Link": trackingLink,
    "Catalog Enriched At": data.catalog_enriched_at || "",
    "History (JSON)": jsonStringifySafe(data.history || []),
    "Raw Payload": jsonStringifySafe(data),
  };
}

function formatProductDetails(item) {
  return [
    item.line_id ? `Line: ${item.line_id}` : "",
    `Name: ${item.name || ""}`,
    item.id ? `ID: ${item.id}` : "",
    item.slug ? `Slug: ${item.slug}` : "",
    item.type ? `Type: ${item.type}` : "",
    item.size ? `Size: ${String(item.size).toUpperCase()}` : "",
    item.color ? `Color: ${item.color}` : "",
    `Qty: ${numberOrZero(item.quantity)}`,
    `Unit Price: EGP ${numberOrZero(item.unit_price_egp || item.price_egp || item.price)}`,
    item.line_total_egp !== undefined ? `Line Total: EGP ${numberOrZero(item.line_total_egp)}` : "",
    item.original_price_egp ? `Original Price: EGP ${numberOrZero(item.original_price_egp)}` : "",
  ].filter(Boolean).join(" | ");
}

function formatBundleDetails(item) {
  const selections = Array.isArray(item.bundleSelections) ? item.bundleSelections : [];
  if (selections.length === 0) return "";

  const contents = selections.map((selection, index) => {
    return [
      selection.selection_id ? `Selection: ${selection.selection_id}` : "",
      selection.bundle_index ? `Index: ${selection.bundle_index}` : "",
      `${index + 1}. ${selection.label || "Bundle item"}: ${selection.productName || ""}`,
      selection.productId ? `ID: ${selection.productId}` : "",
      selection.productSlug ? `Slug: ${selection.productSlug}` : "",
      selection.productType ? `Type: ${selection.productType}` : "",
      selection.size ? `Size: ${String(selection.size).toUpperCase()}` : "",
      selection.color ? `Color: ${selection.color}` : "",
      `Qty: ${numberOrZero(selection.quantity || 1)}`,
      selection.unit_price_egp !== undefined || selection.price !== undefined
        ? `Catalog Price: EGP ${numberOrZero(selection.unit_price_egp || selection.price)}`
        : "",
      selection.line_total_egp !== undefined ? `Line Total: EGP ${numberOrZero(selection.line_total_egp)}` : "",
      selection.originalPrice !== undefined ? `Original: EGP ${numberOrZero(selection.originalPrice)}` : "",
    ].filter(Boolean).join(" | ");
  });

  return `${item.name || "Bundle"} => ${contents.join(" || ")}`;
}

function buildFlatItems(items) {
  return items.reduce((rows, item, itemIndex) => {
    rows.push({
      row_type: item.isBundle ? "bundle" : "product",
      item_index: itemIndex + 1,
      line_id: item.line_id || "",
      product_id: item.id || "",
      name: item.name || "",
      slug: item.slug || "",
      type: item.type || "",
      size: item.size || "",
      color: item.color || "",
      quantity: numberOrZero(item.quantity || 1),
      unit_price_egp: numberOrZero(item.unit_price_egp || item.price_egp || item.price),
      line_total_egp: numberOrZero(item.line_total_egp),
    });

    const selections = Array.isArray(item.bundleSelections) ? item.bundleSelections : [];
    selections.forEach((selection) => {
      rows.push({
        row_type: "bundle_selection",
        parent_line_id: item.line_id || "",
        item_index: itemIndex + 1,
        bundle_index: selection.bundle_index || "",
        selection_id: selection.selection_id || "",
        product_id: selection.productId || "",
        name: selection.productName || "",
        slug: selection.productSlug || "",
        type: selection.productType || "",
        label: selection.label || "",
        size: selection.size || "",
        color: selection.color || "",
        quantity: numberOrZero(selection.quantity || 1),
        unit_price_egp: numberOrZero(selection.unit_price_egp || selection.price),
        line_total_egp: numberOrZero(selection.line_total_egp),
      });
    });

    return rows;
  }, []);
}

function formatFlatItemDetails(row) {
  return [
    row.row_type ? `Row: ${row.row_type}` : "",
    row.parent_line_id ? `Parent: ${row.parent_line_id}` : "",
    row.line_id ? `Line: ${row.line_id}` : "",
    row.selection_id ? `Selection: ${row.selection_id}` : "",
    row.label ? `Label: ${row.label}` : "",
    row.name ? `Name: ${row.name}` : "",
    row.product_id ? `ID: ${row.product_id}` : "",
    row.slug ? `Slug: ${row.slug}` : "",
    row.type ? `Type: ${row.type}` : "",
    row.size ? `Size: ${String(row.size).toUpperCase()}` : "",
    row.color ? `Color: ${row.color}` : "",
    `Qty: ${numberOrZero(row.quantity)}`,
    `Unit Price: EGP ${numberOrZero(row.unit_price_egp)}`,
    row.line_total_egp ? `Line Total: EGP ${numberOrZero(row.line_total_egp)}` : "",
  ].filter(Boolean).join(" | ");
}

function findOrderRow(sheet, orderRef) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const orderRefIndex = headers.indexOf("Order Ref");
  const orderRefColumn = orderRefIndex >= 0 ? orderRefIndex + 1 : 3;
  const orderRefs = sheet.getRange(2, orderRefColumn, lastRow - 1, 1).getValues();

  for (let i = 0; i < orderRefs.length; i++) {
    if (String(orderRefs[i][0]) === String(orderRef)) {
      return i + 2;
    }
  }

  return null;
}

function rowToObject(headers, row) {
  return headers.reduce((obj, header, index) => {
    obj[header] = row[index];
    return obj;
  }, {});
}

function numberOrZero(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function valueOrEmpty(value) {
  return value === undefined || value === null ? "" : value;
}

function valueForCell(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return jsonStringifySafe(value);
  return value;
}

function jsonStringifySafe(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
