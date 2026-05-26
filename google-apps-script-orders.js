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
    "Raw Payload"
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
    `${item.name} (x${item.quantity}) - EGP ${item.price_egp}`
  ).join(" | ");
  
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
    JSON.stringify(data)
  ];
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
