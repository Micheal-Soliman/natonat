/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Google Apps Script for Enhanced Order Logging
 * 
 * Instructions:
 * 1. Go to https://script.google.com
 * 2. Create new project
 * 3. Paste this code
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL to your .env.local as GOOGLE_SHEETS_WEBHOOK_URL
 *
 * When updating an existing deployment:
 * Deploy > Manage deployments > Edit > New version > Deploy.
 * Saving the script alone does not update the live Web App version.
 */

const SHEET_NAME = "orders";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      createHeaders(sheet);
    }

    ensureExtendedHeaders(sheet);
    
    const row = buildOrderRow(data);
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, rowAdded: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createHeaders(sheet) {
  const headers = [
    // Timestamp & Source
    "Timestamp",
    "Source",
    
    // Order Reference
    "Order Ref",
    "Special Reference (Paymob)",
    "Intention Order ID",
    "Paymob Client Secret",
    
    // Order Status
    "Status",
    "Payment Status",
    
    // Financial Summary
    "Subtotal (EGP)",
    "Shipping (EGP)",
    "Total (EGP)",
    "Total Cents",
    
    // Customer Info
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Address",
    "City",
    "City Key",
    
    // Delivery Method
    "Delivery Method",
    "Shipping Cost Rule",
    
    // Payment Method
    "Payment Method",
    "Bank Name (Card only)",
    
    // Locale & Language
    "Locale",
    
    // Items Summary
    "Items Count",
    "Items Summary",
    
    // Full Item Details (JSON)
    "Items (Full JSON)",
    
    // Customer Full Data (JSON)
    "Customer (Full JSON)",
    
    // Paymob Data (JSON)
    "Paymob Data (JSON)",
    
    // Extras (JSON)
    "Extras (JSON)",
    
    // Raw Payload
    "Raw Payload",

    // Enhanced product details
    "Total Items Quantity",
    "Products Details",
    "Bundles Details",
    "Catalog Enriched At"
  ];
  
  sheet.appendRow(headers);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#EEBC3F");
  headerRange.setFontColor("#0F1A26");
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

function ensureExtendedHeaders(sheet) {
  const requiredHeaders = [
    "Total Items Quantity",
    "Products Details",
    "Bundles Details",
    "Catalog Enriched At"
  ];
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const missingHeaders = requiredHeaders.filter(header => existingHeaders.indexOf(header) === -1);

  if (missingHeaders.length === 0) return;

  const startColumn = existingHeaders.length + 1;
  sheet.getRange(1, startColumn, 1, missingHeaders.length).setValues([missingHeaders]);
  const range = sheet.getRange(1, startColumn, 1, missingHeaders.length);
  range.setFontWeight("bold");
  range.setBackground("#EEBC3F");
  range.setFontColor("#0F1A26");
  sheet.autoResizeColumns(startColumn, missingHeaders.length);
}

function formatProductDetails(item) {
  const details = [
    `Name: ${item.name || ""}`,
    item.id ? `ID: ${item.id}` : "",
    item.slug ? `Slug: ${item.slug}` : "",
    item.type ? `Type: ${item.type}` : "",
    item.size ? `Size: ${String(item.size).toUpperCase()}` : "",
    item.color ? `Color: ${item.color}` : "",
    `Qty: ${Number(item.quantity || 0)}`,
    `Unit Price: EGP ${Number(item.price_egp || item.price || 0)}`,
    item.original_price_egp
      ? `Original Price: EGP ${Number(item.original_price_egp)}`
      : ""
  ].filter(Boolean);

  return details.join(" | ");
}

function formatBundleDetails(item) {
  const selections = Array.isArray(item.bundleSelections) ? item.bundleSelections : [];
  if (selections.length === 0) return "";

  const contents = selections.map((selection, index) => {
    const details = [
      `${index + 1}. ${selection.label || "Bundle item"}: ${selection.productName || ""}`,
      selection.productId ? `ID: ${selection.productId}` : "",
      selection.productSlug ? `Slug: ${selection.productSlug}` : "",
      selection.productType ? `Type: ${selection.productType}` : "",
      selection.size ? `Size: ${String(selection.size).toUpperCase()}` : "",
      selection.color ? `Color: ${selection.color}` : "",
      `Qty: ${Number(selection.quantity || 1)}`,
      selection.price !== undefined ? `Catalog Price: EGP ${Number(selection.price)}` : "",
      selection.originalPrice !== undefined
        ? `Original: EGP ${Number(selection.originalPrice)}`
        : ""
    ].filter(Boolean);

    return details.join(" | ");
  });

  return `${item.name || "Bundle"} => ${contents.join(" || ")}`;
}

function buildOrderRow(data) {
  const now = new Date();
  const timestamp = Utilities.formatDate(now, "Africa/Cairo", "yyyy-MM-dd HH:mm:ss");
  
  // Extract data safely
  const source = data.source || "";
  const orderRef = data.order_ref || "";
  const status = data.status || "";
  const amountEgp = data.amount_egp || 0;
  const shippingEgp = data.shipping_egp || 0;
  const amountCents = data.amount_cents || 0;
  const deliveryMethod = data.delivery_method || "";
  const paymentMethod = data.payment_method || "";
  const locale = data.locale || "";
  
  // Customer data
  const customer = data.customer || {};
  const firstName = customer.first_name || "";
  const lastName = customer.last_name || "";
  const email = customer.email || "";
  const phone = customer.phone || "";
  const address = customer.address || "";
  const city = customer.city || "";
  
  // Items data
  const items = data.items || [];
  const itemsCount = items.length;
  const totalItemsQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const itemsSummary = items.map(formatProductDetails).join(" || ");
  const productsDetails = items
    .filter(item => !item.isBundle)
    .map(formatProductDetails)
    .join("\n");
  const bundlesDetails = items
    .filter(item => item.isBundle || (item.bundleSelections || []).length > 0)
    .map(formatBundleDetails)
    .filter(Boolean)
    .join("\n");
  
  // Paymob data
  const paymob = data.paymob || {};
  const specialReference = paymob.special_reference || data.special_reference || "";
  const intentionOrderId = paymob.intention_order_id || "";
  const clientSecret = paymob.client_secret || "";
  
  // Extras
  const extras = data.extras || {};
  const bankName = extras.bank_name || "";
  const cityKey = extras.city_key || "";
  const shippingRule = extras.shipping_rule || "";
  
  // Payment status from webhook (if available)
  const paymentStatus = data.payment_status || (status === "created" ? "Pending" : status);
  
  return [
    // Timestamp & Source
    timestamp,
    source,
    
    // Order Reference
    orderRef,
    specialReference,
    intentionOrderId,
    clientSecret,
    
    // Order Status
    status,
    paymentStatus,
    
    // Financial Summary
    amountEgp - shippingEgp, // Subtotal
    shippingEgp,
    amountEgp, // Total
    amountCents,
    
    // Customer Info
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    cityKey,
    
    // Delivery Method
    deliveryMethod,
    shippingRule,
    
    // Payment Method
    paymentMethod,
    bankName,
    
    // Locale
    locale,
    
    // Items Summary
    itemsCount,
    itemsSummary,
    
    // Full JSON columns
    JSON.stringify(items),
    JSON.stringify(customer),
    JSON.stringify(paymob),
    JSON.stringify(extras),
    
    // Raw payload
    JSON.stringify(data),

    // Enhanced product details
    totalItemsQuantity,
    productsDetails,
    bundlesDetails,
    data.catalog_enriched_at || ""
  ];
}

function doGet(e) {
  const orderRef = e && e.parameter ? e.parameter.order_ref : "";

  if (!orderRef) {
    return jsonOutput({
      success: true,
      message: "Order logging webhook is active",
      timestamp: new Date().toISOString(),
      sheet: SHEET_NAME
    });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return jsonOutput({ success: false, error: "Sheet not found" });
    }

    const values = sheet.getDataRange().getValues();

    for (let rowIndex = values.length - 1; rowIndex >= 1; rowIndex--) {
      const row = values[rowIndex];
      const rowOrderRef = row[2];

      if (rowOrderRef === orderRef) {
        const headers = values[0];
        const rawPayloadIndex = headers.indexOf("Raw Payload");
        const rawPayload = rawPayloadIndex >= 0 ? row[rawPayloadIndex] : row[30];
        const order = rawPayload ? JSON.parse(rawPayload) : {};

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

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
