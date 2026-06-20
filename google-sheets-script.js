/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * After changing this file in Google Apps Script:
 * Deploy > Manage deployments > Edit > New version > Deploy.
 * Saving without creating a new deployment version leaves the live webhook unchanged.
 */

const SPREADSHEET_ID = "1dNjh5Bu_-OylUS2TSLjS9tx6t6Lnj49DBdcKljd4Ldo";
const SHEET_NAME = "cod_orders";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput({ success: false, error: "No post data received" });
    }

    const data = JSON.parse(e.postData.contents);

    const paymentMethod = String(data.payment_method || "").toLowerCase();
    const isCOD =
      paymentMethod === "cod" ||
      paymentMethod === "cash on delivery";

    if (!isCOD) {
      return jsonOutput({
        success: true,
        skipped: true,
        reason: "Not a COD order",
        payment_method: data.payment_method || ""
      });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      createHeaders(sheet);
    }

    if (sheet.getLastRow() === 0) {
      createHeaders(sheet);
    }

    ensureExtendedHeaders(sheet);

    const orderRef = data.order_ref || "";
    if (!orderRef) {
      return jsonOutput({ success: false, error: "Missing order_ref" });
    }

    const row = buildOrderRow(data);

    const existingRow = findOrderRow(sheet, orderRef);

    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
      formatRow(sheet, existingRow, data);

      return jsonOutput({
        success: true,
        updated: true,
        row: existingRow,
        order_ref: orderRef
      });
    }

    sheet.appendRow(row);
    const lastRow = sheet.getLastRow();
    formatRow(sheet, lastRow, data);

    return jsonOutput({
      success: true,
      inserted: true,
      row: lastRow,
      order_ref: orderRef
    });

  } catch (error) {
    return jsonOutput({
      success: false,
      error: error.toString(),
      stack: error.stack || ""
    });
  }
}

function createHeaders(sheet) {
  const headers = [
    "Timestamp",
    "Source",
    "Order Ref",
    "Status",
    "Payment Status",

    "Aramex Tracking Number",
    "Aramex Tracking Link",

    "Subtotal (EGP)",
    "Shipping (EGP)",
    "Total (EGP)",
    "COD Amount (EGP)",

    "Customer Full Name",
    "Customer Phone",
    "Customer Email",
    "Full Address",
    "City",

    "Delivery Method",
    "Payment Method",

    "Items Count",
    "Total Items Quantity",
    "Items Description",

    "Item 1 Name",
    "Item 1 Qty",
    "Item 1 Size",
    "Item 1 Color",
    "Item 1 Unit Price",
    "Item 1 Total",

    "Item 2 Name",
    "Item 2 Qty",
    "Item 2 Size",
    "Item 2 Color",
    "Item 2 Unit Price",
    "Item 2 Total",

    "Item 3 Name",
    "Item 3 Qty",
    "Item 3 Size",
    "Item 3 Color",
    "Item 3 Unit Price",
    "Item 3 Total",

    "Item 4 Name",
    "Item 4 Qty",
    "Item 4 Size",
    "Item 4 Color",
    "Item 4 Unit Price",
    "Item 4 Total",

    "Item 5 Name",
    "Item 5 Qty",
    "Item 5 Size",
    "Item 5 Color",
    "Item 5 Unit Price",
    "Item 5 Total",

    "Additional Items",
    "Products Details",
    "Bundles Details",
    "Items Flat Details",
    "Items Flat JSON",
    "Items (Full JSON)",
    "Raw Payload",
    "Catalog Enriched At"
  ];

  sheet.clear();
  sheet.appendRow(headers);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#FF9800");
  headerRange.setFontColor("#0F1A26");
  headerRange.setHorizontalAlignment("center");

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function ensureExtendedHeaders(sheet) {
  const requiredHeaders = [
    "Products Details",
    "Bundles Details",
    "Items Flat Details",
    "Items Flat JSON",
    "Items (Full JSON)",
    "Raw Payload",
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
  range.setBackground("#FF9800");
  range.setFontColor("#0F1A26");
  range.setHorizontalAlignment("center");
  sheet.autoResizeColumns(startColumn, missingHeaders.length);
}

function buildOrderRow(data) {
  const now = new Date();
  const timestamp = Utilities.formatDate(now, "Africa/Cairo", "yyyy-MM-dd HH:mm:ss");

  const source = data.source || "";
  const orderRef = data.order_ref || "";
  const status = data.status || "";
  const paymentStatus = data.payment_status || "";

  const amountEgp = Number(data.amount_egp || 0);
  const shippingEgp = Number(data.shipping_egp || 0);
  const subtotal = amountEgp - shippingEgp;

  const deliveryMethod = data.delivery_method || "";
  const paymentMethod = data.payment_method || "";

  const customer = data.customer || {};
  const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();

  const phone = customer.phone || "";
  const email = customer.email || "";
  const address = customer.address || "";
  const city = customer.city || "";

  const aramex = data.aramex || {};
  const trackingNumber = aramex.trackingNumber || "";
  const trackingLink =
    data.tracking_link ||
    (trackingNumber
      ? `https://www.aramex.com/eg/ar/track/results?mode=0&ShipmentNumber=${trackingNumber}`
      : "");

  const items = Array.isArray(data.items) ? data.items : [];

  const itemsCount = items.length;
  const totalQuantity = items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  const itemsDescription = items
    .map(item => {
      return formatProductDetails(item);
    })
    .join(" || ");

  const itemColumns = [];

  for (let i = 0; i < 5; i++) {
    const item = items[i];

    if (item) {
      const unitPrice = Number(item.unit_price_egp || item.price_egp || item.price || 0);
      const qty = Number(item.quantity || 0);
      const lineTotal = Number(item.line_total_egp || unitPrice * qty);

      itemColumns.push(
        item.name || "",
        qty,
        item.size || "",
        item.color || "",
        unitPrice,
        lineTotal
      );
    } else {
      itemColumns.push("", "", "", "", "", "");
    }
  }

  const additionalItems =
    items.length > 5
      ? items.slice(5).map(formatProductDetails).join(" || ")
      : "";

  const productsDetails = items
    .filter(item => !item.isBundle)
    .map(formatProductDetails)
    .join("\n");
  const bundlesDetails = items
    .filter(item => item.isBundle || (item.bundleSelections || []).length > 0)
    .map(formatBundleDetails)
    .filter(Boolean)
    .join("\n");
  const itemsFlat = Array.isArray(data.items_flat) ? data.items_flat : buildFlatItems(items);
  const itemsFlatDetails = itemsFlat.map(formatFlatItemDetails).join("\n");

  const codAmount =
    String(paymentMethod).toLowerCase() === "cod" ||
    String(paymentMethod).toLowerCase() === "cash on delivery"
      ? amountEgp
      : 0;

  return [
    timestamp,
    source,
    orderRef,
    status,
    paymentStatus,

    trackingNumber,
    trackingLink,

    subtotal,
    shippingEgp,
    amountEgp,
    codAmount,

    fullName,
    phone,
    email,
    address,
    city,

    deliveryMethod,
    paymentMethod,

    itemsCount,
    totalQuantity,
    itemsDescription,

    ...itemColumns,

    additionalItems,
    productsDetails,
    bundlesDetails,
    itemsFlatDetails,
    JSON.stringify(itemsFlat),
    JSON.stringify(items),
    JSON.stringify(data),
    data.catalog_enriched_at || ""
  ];
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
    `Qty: ${Number(item.quantity || 0)}`,
    `Unit Price: EGP ${Number(item.unit_price_egp || item.price_egp || item.price || 0)}`,
    item.line_total_egp !== undefined
      ? `Line Total: EGP ${Number(item.line_total_egp)}`
      : "",
    item.original_price_egp
      ? `Original Price: EGP ${Number(item.original_price_egp)}`
      : ""
  ].filter(Boolean).join(" | ");
}

function formatBundleDetails(item) {
  const selections = Array.isArray(item.bundleSelections) ? item.bundleSelections : [];
  if (selections.length === 0) return "";

  return `${item.name || "Bundle"} => ${selections.map((selection, index) => [
    selection.selection_id ? `Selection: ${selection.selection_id}` : "",
    selection.bundle_index ? `Index: ${selection.bundle_index}` : "",
    `${index + 1}. ${selection.label || "Bundle item"}: ${selection.productName || ""}`,
    selection.productId ? `ID: ${selection.productId}` : "",
    selection.productSlug ? `Slug: ${selection.productSlug}` : "",
    selection.productType ? `Type: ${selection.productType}` : "",
    selection.size ? `Size: ${String(selection.size).toUpperCase()}` : "",
    selection.color ? `Color: ${selection.color}` : "",
    `Qty: ${Number(selection.quantity || 1)}`,
    selection.unit_price_egp !== undefined || selection.price !== undefined
      ? `Catalog Price: EGP ${Number(selection.unit_price_egp || selection.price)}`
      : "",
    selection.line_total_egp !== undefined
      ? `Line Total: EGP ${Number(selection.line_total_egp)}`
      : "",
    selection.originalPrice !== undefined
      ? `Original: EGP ${Number(selection.originalPrice)}`
      : ""
  ].filter(Boolean).join(" | ")).join(" || ")}`;
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
      quantity: Number(item.quantity || 1),
      unit_price_egp: Number(item.unit_price_egp || item.price_egp || item.price || 0),
      line_total_egp: Number(item.line_total_egp || 0)
    });

    const selections = Array.isArray(item.bundleSelections) ? item.bundleSelections : [];
    selections.forEach(selection => {
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
        quantity: Number(selection.quantity || 1),
        unit_price_egp: Number(selection.unit_price_egp || selection.price || 0),
        line_total_egp: Number(selection.line_total_egp || 0)
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
    `Qty: ${Number(row.quantity || 0)}`,
    `Unit Price: EGP ${Number(row.unit_price_egp || 0)}`,
    row.line_total_egp ? `Line Total: EGP ${Number(row.line_total_egp)}` : ""
  ].filter(Boolean).join(" | ");
}

function findOrderRow(sheet, orderRef) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return null;

  const orderRefs = sheet.getRange(2, 3, lastRow - 1, 1).getValues();

  for (let i = 0; i < orderRefs.length; i++) {
    if (String(orderRefs[i][0]) === String(orderRef)) {
      return i + 2;
    }
  }

  return null;
}

function formatRow(sheet, rowNum, data) {
  const lastColumn = sheet.getLastColumn();
  const rowRange = sheet.getRange(rowNum, 1, 1, lastColumn);

  const paymentMethod = String(data.payment_method || "").toLowerCase();
  const status = String(data.status || "").toLowerCase();

  if (paymentMethod === "cod" || paymentMethod === "cash on delivery") {
    rowRange.setBackground("#FFF3E0");
  }

  if (status === "paid" || status === "success") {
    rowRange.setBackground("#E8F5E9");
  }

  if (status === "pending" || status === "created") {
    rowRange.setBackground("#FFF9C4");
  }

  const aramex = data.aramex || {};
  if (aramex.trackingNumber) {
    const trackingCell = sheet.getRange(rowNum, 6);
    trackingCell.setFontWeight("bold");
    trackingCell.setFontColor("#0F1A26");
    trackingCell.setBackground("#C8E6C9");
  }

  const trackingLink = data.tracking_link || "";
  const trackingNumber = aramex.trackingNumber || "";

  if (trackingLink || trackingNumber) {
    const finalLink =
      trackingLink ||
      `https://www.aramex.com/eg/ar/track/results?mode=0&ShipmentNumber=${trackingNumber}`;

    const linkCell = sheet.getRange(rowNum, 7);
    linkCell.setFormula(`=HYPERLINK("${finalLink}", "Track")`);
    linkCell.setFontColor("#1155CC");
    linkCell.setFontLine("underline");
  }

  // Currency columns:
  // 8 subtotal, 9 shipping, 10 total, 11 COD amount
  // item prices: 26,27 / 32,33 / 38,39 / 44,45 / 50,51
  const currencyColumns = [8, 9, 10, 11, 26, 27, 32, 33, 38, 39, 44, 45, 50, 51];
  currencyColumns.forEach(col => {
    sheet.getRange(rowNum, col).setNumberFormat("#,##0.00");
  });

  // Qty columns: 23, 29, 35, 41, 47
  const quantityColumns = [23, 29, 35, 41, 47];
  quantityColumns.forEach(col => {
    const cell = sheet.getRange(rowNum, col);
    cell.setHorizontalAlignment("center");
    cell.setFontWeight("bold");
  });

  sheet.autoResizeColumns(1, lastColumn);
}

function doGet(e) {
  return jsonOutput({
    success: true,
    message: "COD order logging webhook is active",
    sheet: SHEET_NAME,
    timestamp: new Date().toISOString()
  });
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
