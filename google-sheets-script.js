/**
 * Google Apps Script for Enhanced Order Logging
 * 
 * Instructions:
 * 1. Go to https://script.google.com
 * 2. Create new project
 * 3. Paste this code
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 5. Copy the Web App URL to your .env.local as GOOGLE_SHEETS_WEBHOOK_URL
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
    
    const row = buildOrderRow(data);
    sheet.appendRow(row);
    
    // Format the new row
    const lastRow = sheet.getLastRow();
    formatRow(sheet, lastRow, data);
    
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
    
    // Item 1 Details
    "Item 1 Name",
    "Item 1 Quantity",
    "Item 1 Price",
    "Item 1 Size",
    "Item 1 Color",
    "Item 1 Total",
    
    // Item 2 Details
    "Item 2 Name",
    "Item 2 Quantity",
    "Item 2 Price",
    "Item 2 Size",
    "Item 2 Color",
    "Item 2 Total",
    
    // Item 3 Details
    "Item 3 Name",
    "Item 3 Quantity",
    "Item 3 Price",
    "Item 3 Size",
    "Item 3 Color",
    "Item 3 Total",
    
    // Item 4 Details
    "Item 4 Name",
    "Item 4 Quantity",
    "Item 4 Price",
    "Item 4 Size",
    "Item 4 Color",
    "Item 4 Total",
    
    // Item 5 Details
    "Item 5 Name",
    "Item 5 Quantity",
    "Item 5 Price",
    "Item 5 Size",
    "Item 5 Color",
    "Item 5 Total",
    
    // Additional Items (JSON if more than 5)
    "Additional Items (JSON)",
    
    // Customer Full Data (JSON)
    "Customer (Full JSON)",
    
    // Paymob Data (JSON)
    "Paymob Data (JSON)",
    
    // Extras (JSON)
    "Extras (JSON)",
    
    // Raw Payload
    "Raw Payload"
  ];
  
  sheet.appendRow(headers);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#EEBC3F");
  headerRange.setFontColor("#0F1A26");
  headerRange.setHorizontalAlignment("center");
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
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
  const itemsSummary = items.map(item => 
    `${item.name} (x${item.quantity}) - EGP ${item.price_egp || item.price}` 
  ).join(" | ");
  
  // Build item details for first 5 items
  const itemRows = [];
  for (let i = 0; i < 5; i++) {
    if (items[i]) {
      const item = items[i];
      itemRows.push(
        item.name || "",
        item.quantity || 0,
        item.price_egp || item.price || 0,
        item.size || "",
        item.color || "",
        (item.price_egp || item.price || 0) * (item.quantity || 0)
      );
    } else {
      itemRows.push("", "", "", "", "", "");
    }
  }
  
  // Additional items as JSON if more than 5
  const additionalItems = items.length > 5 ? JSON.stringify(items.slice(5)) : "";
  
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
    
    // Item 1 Details
    ...itemRows[0],
    
    // Item 2 Details
    ...itemRows[1],
    
    // Item 3 Details
    ...itemRows[2],
    
    // Item 4 Details
    ...itemRows[3],
    
    // Item 5 Details
    ...itemRows[4],
    
    // Additional Items
    additionalItems,
    
    // Full JSON columns
    JSON.stringify(customer),
    JSON.stringify(paymob),
    JSON.stringify(extras),
    
    // Raw payload
    JSON.stringify(data)
  ];
}

function formatRow(sheet, rowNum, data) {
  // Highlight COD orders
  const paymentMethod = data.payment_method || "";
  if (paymentMethod.toLowerCase() === "cod" || paymentMethod.toLowerCase() === "cash on delivery") {
    const rowRange = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn());
    rowRange.setBackground("#FFF3E0"); // Light orange for COD
  }
  
  // Highlight paid orders
  const status = data.status || "";
  if (status === "paid" || status === "success") {
    const rowRange = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn());
    rowRange.setBackground("#E8F5E9"); // Light green for paid
  }
  
  // Highlight pending orders
  if (status === "pending" || status === "created") {
    const rowRange = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn());
    rowRange.setBackground("#FFF9C4"); // Light yellow for pending
  }
  
  // Format currency columns
  const currencyColumns = [9, 10, 11, 12]; // Subtotal, Shipping, Total, Total Cents
  currencyColumns.forEach(col => {
    const cell = sheet.getRange(rowNum, col);
    cell.setNumberFormat("#,##0.00");
  });
  
  // Format item quantity columns
  const quantityColumns = [20, 26, 32, 38, 44]; // Item quantities
  quantityColumns.forEach(col => {
    const cell = sheet.getRange(rowNum, col);
    cell.setHorizontalAlignment("center");
  });
}

// For testing - doGet handler
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      message: "Order logging webhook is active", 
      timestamp: new Date().toISOString(),
      sheet: SHEET_NAME
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
