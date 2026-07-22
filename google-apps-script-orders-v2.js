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
    "Updated At",
    "Source",
    "Last Update Source",
    "Update Count",
    "Update Sources",
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
    "Quantity",
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
    "Bosta Tracking Number",
    "Bosta Tracking Link",
    "Bosta Delivery ID",
    "Bosta Status",
    "Bosta Latest Update",
    "Bosta Latest Location",
    "Bosta Synced At",
    "Bosta Error",
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
      if (data.action === "delete_order") {
        return jsonOutput(deleteOrder(data));
      }

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

  function deleteOrder(data) {
    const tokenCheck = validateOrderDeleteToken(data);
    if (!tokenCheck.success) return tokenCheck;

    const orderRef = String(data.order_ref || data.orderRef || "").trim();
    if (!orderRef) {
      return { success: false, error: "Missing order_ref" };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = [SHEET_NAME, COD_SHEET_NAME];
    const deleted = [];

    sheets.forEach((sheetName) => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;

      ensureHeaders(sheet);

      let row;
      while ((row = findOrderRow(sheet, { order_ref: orderRef }))) {
        sheet.deleteRow(row);
        deleted.push({ sheet: sheetName, row, order_ref: orderRef });
      }
    });

    return {
      success: true,
      order_ref: orderRef,
      deleted,
      deleted_count: deleted.length,
    };
  }

  function doGet(e) {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || "";
    const orderRef = params.order_ref || "";

    if (action === "list") {
      return listOrders(params);
    }

    if (action === "preview_date_repair") {
      return previewDateRepair(params);
    }

    if (action === "apply_date_repair") {
      return applyDateRepair(params);
    }

    if (action === "preview_quantity_repair") {
      return previewQuantityRepair(params);
    }

    if (action === "apply_quantity_repair") {
      return applyQuantityRepair(params);
    }

    if (action === "preview_source_repair") {
      return previewSourceRepair(params);
    }

    if (action === "apply_source_repair") {
      return applySourceRepair(params);
    }

    if (action === "preview_duplicate_repair") {
      return previewDuplicateRepair(params);
    }

    if (action === "apply_duplicate_repair") {
      return applyDuplicateRepair(params);
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

  function previewDateRepair(params) {
    try {
      const result = collectDateRepairCandidates(params, {
        defaultLimit: 100,
        defaultMinimumDiffMinutes: 10,
        minimumAllowedDiffMinutes: 1,
      });

      if (!result.success) return jsonOutput(result);

      return jsonOutput({
        success: true,
        sheet: result.sheet,
        mode: "preview_only",
        note: "No cells were changed. Review candidates before adding/applying a repair action.",
        minimum_diff_minutes: result.minimumDiffMinutes,
        returned: result.candidates.length,
        candidates: result.candidates,
      });
    } catch (error) {
      return jsonOutput({ success: false, error: error.toString() });
    }
  }

  function applyDateRepair(params) {
    try {
      const tokenCheck = validateDateRepairToken(params);
      if (!tokenCheck.success) return jsonOutput(tokenCheck);

      if (params.confirm !== "YES") {
        return jsonOutput({
          success: false,
          error: "Missing confirmation. Add confirm=YES to apply date repair.",
          mode: "blocked",
        });
      }

      const result = collectDateRepairCandidates(params, {
        defaultLimit: 500,
        defaultMinimumDiffMinutes: 360,
        minimumAllowedDiffMinutes: 60,
      });

      if (!result.success) return jsonOutput(result);

      const changes = [];

      result.candidates.forEach((candidate) => {
        result.sheetObject.getRange(candidate.row, result.timestampColumn).setValue(candidate.suggested_timestamp);

        changes.push({
          row: candidate.row,
          order_ref: candidate.order_ref,
          previous_timestamp: candidate.current_timestamp,
          repaired_timestamp: candidate.suggested_timestamp,
          source: candidate.source,
          diff_minutes: candidate.diff_minutes,
        });
      });

      return jsonOutput({
        success: true,
        sheet: result.sheet,
        mode: "applied",
        minimum_diff_minutes: result.minimumDiffMinutes,
        repaired: changes.length,
        note: "Only the Timestamp column was updated.",
        changes,
      });
    } catch (error) {
      return jsonOutput({ success: false, error: error.toString() });
    }
  }

  function previewQuantityRepair(params) {
    try {
      const result = collectQuantityRepairCandidates(params, false);
      return jsonOutput({
        success: result.success,
        sheet: result.sheet,
        mode: "preview_only",
        note: "No cells were changed. Review candidates before applying quantity repair.",
        returned: result.candidates ? result.candidates.length : 0,
        candidates: result.candidates || [],
        error: result.error || undefined,
      });
    } catch (error) {
      return jsonOutput({ success: false, error: error.toString() });
    }
  }

  function applyQuantityRepair(params) {
    try {
      const tokenCheck = validateDateRepairToken(params);
      if (!tokenCheck.success) return jsonOutput(tokenCheck);

      if (params.confirm !== "YES") {
        return jsonOutput({
          success: false,
          error: "Missing confirmation. Add confirm=YES to apply quantity repair.",
          mode: "blocked",
        });
      }

      const result = collectQuantityRepairCandidates(params, true);
      return jsonOutput({
        success: result.success,
        sheet: result.sheet,
        mode: "applied",
        repaired: result.candidates ? result.candidates.length : 0,
        changes: result.candidates || [],
        error: result.error || undefined,
      });
    } catch (error) {
      return jsonOutput({ success: false, error: error.toString() });
    }
  }

  function previewSourceRepair(params) {
    try {
      const result = collectSourceRepairCandidates(params, false);
      return jsonOutput({
        success: result.success,
        sheet: result.sheet,
        mode: "preview_only",
        note: "No cells were changed. Review candidates before applying source repair.",
        returned: result.candidates ? result.candidates.length : 0,
        candidates: result.candidates || [],
        error: result.error || undefined,
      });
    } catch (error) {
      return jsonOutput({ success: false, error: error.toString() });
    }
  }

  function applySourceRepair(params) {
    try {
      const tokenCheck = validateDateRepairToken(params);
      if (!tokenCheck.success) return jsonOutput(tokenCheck);

      if (params.confirm !== "YES") {
        return jsonOutput({
          success: false,
          error: "Missing confirmation. Add confirm=YES to apply source repair.",
          mode: "blocked",
        });
      }

      const result = collectSourceRepairCandidates(params, true);
      return jsonOutput({
        success: result.success,
        sheet: result.sheet,
        mode: "applied",
        repaired: result.candidates ? result.candidates.length : 0,
        changes: result.candidates || [],
        error: result.error || undefined,
      });
    } catch (error) {
      return jsonOutput({ success: false, error: error.toString() });
    }
  }

  function previewDuplicateRepair(params) {
    try {
      const result = collectDuplicateRepairCandidates(params, false);
      return jsonOutput({
        success: result.success,
        sheet: result.sheet,
        mode: "preview_only",
        note: "No rows were changed. Review duplicate order refs before applying duplicate repair.",
        returned: result.candidates ? result.candidates.length : 0,
        candidates: result.candidates || [],
        error: result.error || undefined,
      });
    } catch (error) {
      return jsonOutput({ success: false, error: error.toString() });
    }
  }

  function applyDuplicateRepair(params) {
    try {
      const tokenCheck = validateDateRepairToken(params);
      if (!tokenCheck.success) return jsonOutput(tokenCheck);

      if (params.confirm !== "YES") {
        return jsonOutput({
          success: false,
          error: "Missing confirmation. Add confirm=YES to apply duplicate repair.",
          mode: "blocked",
        });
      }

      const result = collectDuplicateRepairCandidates(params, true);
      return jsonOutput({
        success: result.success,
        sheet: result.sheet,
        mode: "applied",
        repaired: result.candidates ? result.candidates.length : 0,
        deleted_rows: result.deletedRows || 0,
        changes: result.candidates || [],
        error: result.error || undefined,
      });
    } catch (error) {
      return jsonOutput({ success: false, error: error.toString() });
    }
  }

  function collectDuplicateRepairCandidates(params, applyChanges) {
    const sheetName = params.sheet || SHEET_NAME;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: "Sheet not found", sheet: sheetName, candidates: [] };

    ensureHeaders(sheet);

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { success: true, sheet: sheetName, candidates: [], deletedRows: 0 };

    const headers = values[0] || [];
    const orderRefIndex = headers.indexOf("Order Ref");
    if (orderRefIndex === -1) {
      return { success: false, error: "Order Ref column not found", sheet: sheetName, candidates: [] };
    }

    const groups = {};
    for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
      const orderRef = String(values[rowIndex][orderRefIndex] || "").trim();
      if (!orderRef) continue;
      if (!groups[orderRef]) groups[orderRef] = [];
      groups[orderRef].push({ rowNumber: rowIndex + 1, row: values[rowIndex] });
    }

    const limit = Math.max(1, Math.min(1000, Number(params.limit || 500)));
    const candidates = Object.keys(groups)
      .filter((orderRef) => groups[orderRef].length > 1)
      .slice(0, limit)
      .map((orderRef) => {
        const rows = groups[orderRef];
        return {
          order_ref: orderRef,
          keep_row: rows[0].rowNumber,
          duplicate_rows: rows.slice(1).map((entry) => entry.rowNumber),
          row_count: rows.length,
          sources: rows
            .map((entry) => rowToObject(headers, entry.row)["Source"])
            .map((value) => String(value || "").trim())
            .filter(Boolean),
        };
      });

    let deletedRows = 0;
    if (applyChanges) {
      const allRowsToDelete = [];
      candidates.forEach((candidate) => {
        const rows = groups[candidate.order_ref];
        const mergedObject = mergeExistingRowObjects(headers, rows.map((entry) => entry.row));
        const row = headers.map((header) => valueForCell(mergedObject[header]));
        sheet.getRange(candidate.keep_row, 1, 1, row.length).setValues([row]);
        candidate.duplicate_rows.forEach((rowNumber) => allRowsToDelete.push(rowNumber));
      });

      allRowsToDelete
        .sort((a, b) => b - a)
        .forEach((rowNumber) => {
          sheet.deleteRow(rowNumber);
          deletedRows += 1;
        });
    }

    return { success: true, sheet: sheetName, candidates, deletedRows };
  }

  function collectQuantityRepairCandidates(params, applyChanges) {
    const sheetName = params.sheet || SHEET_NAME;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: "Sheet not found", sheet: sheetName, candidates: [] };

    ensureHeaders(sheet);

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { success: true, sheet: sheetName, candidates: [] };

    const headers = values[0] || [];
    const quantityColumns = getQuantityColumnIndexes(headers);

    if (!quantityColumns.length) {
      return { success: false, error: "No quantity columns found", sheet: sheetName, candidates: [] };
    }

    const rawPayloadIndex = headers.indexOf("Raw Payload");
    const fullItemsIndex = headers.indexOf("Items (Full JSON)");
    const orderRefIndex = headers.indexOf("Order Ref");
    const limit = Math.max(1, Math.min(1000, Number(params.limit || 500)));
    const candidates = [];

    for (let rowIndex = 1; rowIndex < values.length && candidates.length < limit; rowIndex++) {
      const row = values[rowIndex];
      const quantity = getRowQuantityForRepair(row, rawPayloadIndex, fullItemsIndex, quantityColumns);
      if (!quantity) continue;

      const hasBadQuantity = quantityColumns.some((columnIndex) => Number(row[columnIndex]) !== quantity);
      if (!hasBadQuantity) continue;

      const change = {
        row: rowIndex + 1,
        order_ref: orderRefIndex >= 0 ? row[orderRefIndex] : "",
        quantity,
        current_values: quantityColumns.map((columnIndex) => ({
          header: headers[columnIndex],
          value: row[columnIndex],
        })),
      };
      candidates.push(change);

      if (applyChanges) {
        quantityColumns.forEach((columnIndex) => {
          sheet.getRange(rowIndex + 1, columnIndex + 1).setValue(quantity);
        });
      }
    }

    return { success: true, sheet: sheetName, candidates };
  }

  function collectSourceRepairCandidates(params, applyChanges) {
    const sheetName = params.sheet || SHEET_NAME;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: "Sheet not found", sheet: sheetName, candidates: [] };

    ensureHeaders(sheet);

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { success: true, sheet: sheetName, candidates: [] };

    const headers = values[0] || [];
    const sourceIndex = headers.indexOf("Source");
    const lastUpdateSourceIndex = headers.indexOf("Last Update Source");
    const rawPayloadIndex = headers.indexOf("Raw Payload");
    const historyIndex = headers.indexOf("History (JSON)");
    const orderRefIndex = headers.indexOf("Order Ref");

    if (sourceIndex === -1) {
      return { success: false, error: "Source column not found", sheet: sheetName, candidates: [] };
    }

    const limit = Math.max(1, Math.min(1000, Number(params.limit || 500)));
    const candidates = [];

    for (let rowIndex = 1; rowIndex < values.length && candidates.length < limit; rowIndex++) {
      const row = values[rowIndex];
      const currentSource = String(row[sourceIndex] || "").trim();
      if (!isUpdateOnlySource(currentSource)) continue;

      const rowObject = rowToObject(headers, row);
      const repairedSource = getOriginalSourceForRepair(rowObject);
      if (!repairedSource || repairedSource === currentSource || isUpdateOnlySource(repairedSource)) continue;

      const change = {
        row: rowIndex + 1,
        order_ref: orderRefIndex >= 0 ? row[orderRefIndex] : "",
        current_source: currentSource,
        repaired_source: repairedSource,
        last_update_source: currentSource,
      };
      candidates.push(change);

      if (applyChanges) {
        sheet.getRange(rowIndex + 1, sourceIndex + 1).setValue(repairedSource);
        if (lastUpdateSourceIndex >= 0) {
          sheet.getRange(rowIndex + 1, lastUpdateSourceIndex + 1).setValue(currentSource);
        }

        if (rawPayloadIndex >= 0) {
          const payload = parseJsonObject(row[rawPayloadIndex]);
          if (Object.keys(payload).length) {
            payload.source = repairedSource;
            payload.original_source = repairedSource;
            payload.last_update_source = currentSource;
            sheet.getRange(rowIndex + 1, rawPayloadIndex + 1).setValue(jsonStringifySafe(payload));
          }
        }

        if (historyIndex >= 0) {
          const history = parseJsonArray(row[historyIndex]);
          if (history.length) {
            sheet.getRange(rowIndex + 1, historyIndex + 1).setValue(jsonStringifySafe(history));
          }
        }
      }
    }

    return { success: true, sheet: sheetName, candidates };
  }

  function isUpdateOnlySource(value) {
    const source = String(value || "").trim().toLowerCase();
    return [
      "admin_manual_order_edit",
      "admin_status_update",
      "email_notification",
      "email_notification_failed",
      "email_notification_queued",
      "customer_email_notification",
      "meta_capi",
      "paymob_webhook_aramex",
      "paymob_webhook_bosta",
      "bosta_sync",
      "bosta_status_sync",
      "bosta_manual_tracking_update",
    ].indexOf(source) !== -1 || source.endsWith("_bosta_failed");
  }

  function getOriginalSourceForRepair(rowObject) {
    const rawPayload = parseJsonObject(rowObject["Raw Payload"]);
    const candidates = [
      rawPayload.original_source,
      rawPayload.initial_source,
      rowObject["Original Source"],
    ];

    const history = Array.isArray(rawPayload.history)
      ? rawPayload.history
      : parseJsonArray(rowObject["History (JSON)"]);
    history.forEach((entry) => {
      if (entry && typeof entry === "object") {
        candidates.push(entry.source);
      }
    });

    candidates.push(rawPayload.source);

    for (let index = 0; index < candidates.length; index++) {
      const source = String(candidates[index] || "").trim();
      if (source && !isUpdateOnlySource(source)) return source;
    }

    const orderRef = String(rowObject["Order Ref"] || rawPayload.order_ref || "").trim();
    if (/^NAT-/i.test(orderRef)) return "checkout";
    if (/^CUSTOM-/i.test(orderRef)) return "admin_special_order";

    return "";
  }

  function getQuantityColumnIndexes(headers) {
    const exactQuantityHeaders = [
      "Total Items Quantity",
      "Quantity",
      "quantity",
      "Qty",
    ];

    return headers
      .map((header, index) => {
        const normalized = String(header || "").trim().toLowerCase();
        const isExact = exactQuantityHeaders.some(
          (candidate) => candidate.toLowerCase() === normalized
        );
        const isLegacyQuantity = normalized === "items quantity" || normalized === "total quantity";
        return isExact || isLegacyQuantity ? index : -1;
      })
      .filter((index) => index >= 0)
      .filter((index, position, indexes) => indexes.indexOf(index) === position);
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

    const orderRef = extractOrderRef(data);
    if (orderRef && !data.order_ref) data.order_ref = orderRef;
    const existingRows = findOrderRows(sheet, data);
    const existingRow = existingRows.length ? existingRows[0] : null;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const existingRowObject = existingRow
      ? mergeExistingRowObjects(
          headers,
          existingRows.map((rowNumber) => sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0])
        )
      : {};
    const rowObject = buildOrderRowObject(data, existingRowObject);
    const row = headers.map((header) => valueForHeaderCell(rowObject, header));

    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
      for (let index = existingRows.length - 1; index >= 1; index--) {
        sheet.deleteRow(existingRows[index]);
      }
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

    const headerRenames = {
      " Quantity": "Quantity",
      "Aramex Tracking Number": "Bosta Tracking Number",
      "Aramex Tracking Link": "Bosta Tracking Link",
      "Aramex GUID": "Bosta Delivery ID",
      "Aramex Status": "Bosta Status",
      "Aramex Latest Update": "Bosta Latest Update",
      "Aramex Latest Location": "Bosta Latest Location",
      "Aramex Synced At": "Bosta Synced At",
      "Aramex Error": "Bosta Error",
    };

    Object.keys(headerRenames).forEach((oldHeader) => {
      const index = existingHeaders.indexOf(oldHeader);
      if (index >= 0) {
        const newHeader = headerRenames[oldHeader];
        const existingTargetIndex = existingHeaders.indexOf(newHeader);
        if (existingTargetIndex === -1 || existingTargetIndex === index) {
          sheet.getRange(1, index + 1).setValue(newHeader);
          existingHeaders[index] = newHeader;
        }
      }
    });

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

  function buildOrderRowObject(incomingData, existingRowObject) {
    const data = mergeIncomingOrderPayload(incomingData, existingRowObject);
    const now = new Date();
    const nowIso = now.toISOString();
    const timestamp = firstNonEmpty(
      existingRowObject && existingRowObject["Timestamp"],
      data.created_at,
      data.createdAt,
      data["Created At"],
      data.Timestamp,
      nowIso
    );
    const updateSource = incomingData.source || data.last_update_source || data.source || "";
    const originalSource = firstNonEmpty(
      existingRowObject && existingRowObject["Source"],
      data.original_source,
      data.source,
      updateSource
    );
    const orderRef = extractOrderRef(data);
    const updateSources = mergeUpdateSources(existingRowObject && existingRowObject["Update Sources"], updateSource);
    const updateCount = Math.max(1, numberOrZero(existingRowObject && existingRowObject["Update Count"]) + 1);
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
    const bosta = data.bosta || data.shipment || data.aramex || {};
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
    const totalItemsQuantity = items.reduce(
      (sum, item) => sum + Math.max(1, numberOrZero(item.quantity || item.qty || 1)),
      0
    );
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

    const trackingNumber = bosta.trackingNumber || bosta.trackingCode || "";
    const trackingLink =
      data.tracking_link ||
      bosta.trackingLink ||
      (trackingNumber
        ? `https://bosta.co/tracking-shipments?shipmentNumber=${encodeURIComponent(trackingNumber)}`
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
      "Updated At": data.updated_at || data.updatedAt || nowIso,
      "Source": originalSource,
      "Last Update Source": updateSource,
      "Update Count": updateCount,
      "Update Sources": updateSources.join(" | "),
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
      "Quantity": totalItemsQuantity,
      "quantity": totalItemsQuantity,
      "Qty": totalItemsQuantity,
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
      "Bosta Tracking Number": trackingNumber,
      "Bosta Tracking Link": trackingLink,
      "Bosta Delivery ID": bosta.deliveryId || bosta.guid || bosta._id || "",
      "Bosta Status": bosta.status || bosta.stateLabel || "",
      "Bosta Latest Update": bosta.latestDescription || bosta.latestDate || "",
      "Bosta Latest Location": bosta.latestLocation || "",
      "Bosta Synced At": bosta.syncedAt || "",
      "Bosta Error": bosta.error || "",
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

  function mergeIncomingOrderPayload(incomingData, existingRowObject) {
    const existingPayload = parseJsonObject(existingRowObject && existingRowObject["Raw Payload"]);
    const fallbackPayload = buildPayloadFromExistingRow(existingRowObject || {});
    const basePayload = Object.keys(existingPayload).length ? existingPayload : fallbackPayload;
    const originalSource = firstNonEmpty(
      existingRowObject && existingRowObject["Source"],
      basePayload.original_source,
      basePayload.source,
      incomingData && incomingData.source
    );
    const merged = mergePlainObjects(basePayload, incomingData || {});

    if (originalSource) merged.source = originalSource;
    if (originalSource) merged.original_source = originalSource;
    if (incomingData && incomingData.source) merged.last_update_source = incomingData.source;
    if (incomingData && incomingData.updated_at) merged.updated_at = incomingData.updated_at;
    if (incomingData && incomingData.updatedAt) merged.updatedAt = incomingData.updatedAt;

    return merged;
  }

  function buildPayloadFromExistingRow(rowObject) {
    if (!rowObject || typeof rowObject !== "object") return {};

    const items = parseJsonArray(rowObject["Items (Full JSON)"]);
    const customer = parseJsonObject(rowObject["Customer (Full JSON)"]);
    const extras = parseJsonObject(rowObject["Extras (JSON)"]);
    const paymob = parseJsonObject(rowObject["Paymob Data (JSON)"]);
    const payment = parseJsonObject(rowObject["Payment Data (JSON)"]);
    const discount = parseJsonObject(rowObject["Discount Data (JSON)"]);
    const bosta = {
      trackingNumber: rowObject["Bosta Tracking Number"] || "",
      trackingLink: rowObject["Bosta Tracking Link"] || "",
      deliveryId: rowObject["Bosta Delivery ID"] || "",
      status: rowObject["Bosta Status"] || "",
      latestDescription: rowObject["Bosta Latest Update"] || "",
      latestLocation: rowObject["Bosta Latest Location"] || "",
      syncedAt: rowObject["Bosta Synced At"] || "",
      error: rowObject["Bosta Error"] || "",
    };

    return {
      source: rowObject["Source"] || "",
      order_ref: rowObject["Order Ref"] || "",
      special_reference: rowObject["Special Reference (Paymob)"] || "",
      status: rowObject["Status"] || "",
      payment_status: rowObject["Payment Status"] || "",
      amount_egp: rowObject["Total (EGP)"] || "",
      amount_cents: rowObject["Total Cents"] || "",
      shipping_egp: rowObject["Shipping (EGP)"] || "",
      discount_code: rowObject["Discount Code"] || "",
      discount_egp: rowObject["Discount (EGP)"] || "",
      payment_discount_egp: rowObject["Payment Discount (EGP)"] || "",
      payment_discount_percent: rowObject["Payment Discount Percent"] || "",
      payment_method: rowObject["Payment Method"] || "",
      delivery_method: rowObject["Delivery Method"] || "",
      locale: rowObject["Locale"] || "",
      created_at: rowObject["Timestamp"] || "",
      updated_at: rowObject["Updated At"] || "",
      customer,
      items,
      extras,
      paymob,
      payment,
      discount,
      bosta,
      shipment: bosta,
      aramex: bosta,
      history: parseJsonArray(rowObject["History (JSON)"]),
    };
  }

  function mergePlainObjects(base, patch) {
    const output = {};

    Object.keys(base || {}).forEach((key) => {
      output[key] = base[key];
    });

    Object.keys(patch || {}).forEach((key) => {
      const value = patch[key];
      if (value === undefined) return;

      const current = output[key];
      if (isPlainObject(current) && isPlainObject(value)) {
        output[key] = mergePlainObjects(current, value);
        return;
      }

      output[key] = value;
    });

    return output;
  }

  function isPlainObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    );
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

  function extractOrderRef(data) {
    if (!data || typeof data !== "object") return "";

    const paymob = data.paymob || {};
    const payment = data.payment || {};
    return firstNonEmpty(
      data.order_ref,
      data.orderRef,
      data["Order Ref"],
      data.special_reference,
      data["Special Reference (Paymob)"],
      paymob.special_reference,
      paymob.intention_order_id,
      payment.transaction_id,
      data["Intention Order ID"],
      data["Paymob Reference"],
      ""
    );
  }

  function mergeUpdateSources(existingSources, nextSource) {
    const sources = String(`${existingSources || ""}|${nextSource || ""}`)
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);

    return sources.filter((source, index) => sources.indexOf(source) === index);
  }

  function mergeExistingRowObjects(headers, rows) {
    return rows.reduce((merged, row, index) => {
      const rowObject = rowToObject(headers, row);

      headers.forEach((header) => {
        const value = rowObject[header];
        if (header === "Timestamp") {
          if (!merged[header] || isEarlierTimestamp(value, merged[header])) {
            merged[header] = value;
          }
          return;
        }

        if (header === "Update Count") {
          merged[header] = Math.max(numberOrZero(merged[header]), numberOrZero(value));
          return;
        }

        if (header === "Update Sources") {
          mergeUpdateSources(merged[header], value).forEach((source) => {
            merged[header] = mergeUpdateSources(merged[header], source).join(" | ");
          });
          return;
        }

        if (value !== "" && value !== null && value !== undefined) {
          merged[header] = value;
        } else if (index === 0 && merged[header] === undefined) {
          merged[header] = "";
        }
      });

      return merged;
    }, {});
  }

  function isEarlierTimestamp(candidate, current) {
    const candidateDate = new Date(candidate);
    const currentDate = new Date(current);
    if (isNaN(candidateDate.getTime())) return false;
    if (isNaN(currentDate.getTime())) return true;
    return candidateDate.getTime() < currentDate.getTime();
  }

  function findOrderRow(sheet, dataOrOrderRef) {
    const rows = findOrderRows(sheet, dataOrOrderRef);
    return rows.length ? rows[0] : null;
  }

  function findOrderRows(sheet, dataOrOrderRef) {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    const data = typeof dataOrOrderRef === "object" && dataOrOrderRef ? dataOrOrderRef : { order_ref: dataOrOrderRef };
    const identities = [
      extractOrderRef(data),
      data.order_ref,
      data.orderRef,
      data.special_reference,
      data.paymob && data.paymob.special_reference,
      data.paymob && data.paymob.intention_order_id,
      data.payment && data.payment.transaction_id,
      data["Order Ref"],
      data["Special Reference (Paymob)"],
      data["Intention Order ID"],
      data["Paymob Reference"],
    ].map((value) => String(value || "").trim()).filter(Boolean);

    if (!identities.length) return [];

    const matchedRows = [];
    for (let i = values.length - 1; i >= 0; i--) {
      const rowObject = rowToObject(headers, values[i]);
      const rowIdentities = [
        rowObject["Order Ref"],
        rowObject["Special Reference (Paymob)"],
        rowObject["Intention Order ID"],
        rowObject["Paymob Reference"],
      ].map((value) => String(value || "").trim()).filter(Boolean);

      if (rowIdentities.some((value) => identities.indexOf(value) !== -1)) {
        matchedRows.push(i + 2);
      }
    }

    return matchedRows.sort((a, b) => a - b);
  }

  function rowToObject(headers, row) {
    return headers.reduce((obj, header, index) => {
      obj[header] = row[index];
      return obj;
    }, {});
  }

  function collectDateRepairCandidates(params, options) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = params.sheet || SHEET_NAME;
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return { success: false, error: "Sheet not found", sheet: sheetName };
    }

    ensureHeaders(sheet);

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return {
        success: true,
        sheet: sheetName,
        sheetObject: sheet,
        timestampColumn: 0,
        minimumDiffMinutes: options.defaultMinimumDiffMinutes,
        candidates: [],
      };
    }

    const headers = values[0] || [];
    const timestampIndex = headers.indexOf("Timestamp");
    if (timestampIndex === -1) {
      return { success: false, error: "Timestamp column not found", sheet: sheetName };
    }

    const limit = Math.max(1, Math.min(500, Number(params.limit || options.defaultLimit)));
    const minimumDiffMinutes = Math.max(
      options.minimumAllowedDiffMinutes,
      Number(params.minimum_diff_minutes || options.defaultMinimumDiffMinutes)
    );
    const candidates = [];

    for (let rowIndex = 1; rowIndex < values.length && candidates.length < limit; rowIndex++) {
      const row = values[rowIndex];
      const rowObject = rowToObject(headers, row);
      const candidate = getBestCreationDateCandidate(rowObject);
      const currentDate = parseAnyDate(rowObject["Timestamp"]);

      if (!candidate || !candidate.date || !currentDate) continue;

      const diffMinutes = Math.round(Math.abs(currentDate.getTime() - candidate.date.getTime()) / 60000);
      if (diffMinutes < minimumDiffMinutes) continue;

      candidates.push({
        row: rowIndex + 1,
        order_ref: rowObject["Order Ref"] || "",
        current_timestamp: currentDate.toISOString(),
        suggested_timestamp: candidate.date.toISOString(),
        source: candidate.source,
        diff_minutes: diffMinutes,
        payment_method: rowObject["Payment Method"] || "",
        status: rowObject["Status"] || "",
        bosta_synced_at: normalizeDateForOutput(rowObject["Bosta Synced At"] || rowObject["Aramex Synced At"]),
      });
    }

    return {
      success: true,
      sheet: sheetName,
      sheetObject: sheet,
      timestampColumn: timestampIndex + 1,
      minimumDiffMinutes,
      candidates,
    };
  }

  function validateDateRepairToken(params) {
    const configuredToken = PropertiesService.getScriptProperties().getProperty("DATE_REPAIR_TOKEN");
    if (!configuredToken) {
      return {
        success: false,
        error: "DATE_REPAIR_TOKEN is not configured in Script Properties.",
        mode: "blocked",
      };
    }

    if (params.repair_token !== configuredToken) {
      return {
        success: false,
        error: "Invalid or missing repair_token.",
        mode: "blocked",
      };
    }

    return { success: true };
  }

  function validateOrderDeleteToken(params) {
    const configuredToken = PropertiesService.getScriptProperties().getProperty("ORDER_DELETE_TOKEN");
    if (!configuredToken) {
      return {
        success: false,
        error: "ORDER_DELETE_TOKEN is not configured in Script Properties.",
        mode: "blocked",
      };
    }

    if (params.delete_token !== configuredToken) {
      return {
        success: false,
        error: "Invalid or missing delete_token.",
        mode: "blocked",
      };
    }

    return { success: true };
  }

  function getBestCreationDateCandidate(rowObject) {
    const rawPayload = parseJsonObject(rowObject["Raw Payload"]);
    const rawDate = parseAnyDate(
      rawPayload.created_at ||
      rawPayload.createdAt ||
      rawPayload.createdAtIso ||
      rawPayload.order_created_at
    );

    if (rawDate) {
      return { date: rawDate, source: "raw_payload.created_at" };
    }

    const refDate = parseDateFromOrderReference(
      rowObject["Order Ref"] ||
      rawPayload.order_ref ||
      rowObject["Special Reference (Paymob)"] ||
      rawPayload.special_reference
    );

    if (refDate) {
      return { date: refDate, source: "order_ref_timestamp" };
    }

    return null;
  }

  function parseJsonObject(value) {
    if (!value) return {};
    if (typeof value === "object" && !(value instanceof Date)) return value;
    if (typeof value !== "string") return {};

    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function parseJsonArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function getRowQuantityForRepair(row, rawPayloadIndex, fullItemsIndex, quantityColumns) {
    const rawPayload = rawPayloadIndex >= 0 ? parseJsonObject(row[rawPayloadIndex]) : {};
    const rawPayloadQuantity = calculatePayloadQuantity(rawPayload);
    if (rawPayloadQuantity) return rawPayloadQuantity;

    if (fullItemsIndex >= 0) {
      const parsedItems = parseJsonArray(row[fullItemsIndex]);
      const itemsQuantity = calculateItemsQuantity(parsedItems);
      if (itemsQuantity) return itemsQuantity;
    }

    for (let index = 0; index < quantityColumns.length; index++) {
      const value = row[quantityColumns[index]];
      const payload = parseJsonObject(value);
      const payloadQuantity = calculatePayloadQuantity(payload);
      if (payloadQuantity) return payloadQuantity;

      const items = parseJsonArray(value);
      const itemsQuantity = calculateItemsQuantity(items);
      if (itemsQuantity) return itemsQuantity;
    }

    return 0;
  }

  function calculatePayloadQuantity(payload) {
    if (!payload || typeof payload !== "object") return 0;

    if (Array.isArray(payload.items)) {
      const itemsQuantity = calculateItemsQuantity(payload.items);
      if (itemsQuantity) return itemsQuantity;
    }

    if (Array.isArray(payload.items_flat)) {
      const flatQuantity = calculateItemsQuantity(payload.items_flat);
      if (flatQuantity) return flatQuantity;
    }

    const extras = payload.extras && typeof payload.extras === "object" ? payload.extras : {};
    return (
      numberOrZero(payload.quantity) ||
      numberOrZero(payload.qty) ||
      numberOrZero(payload.total_quantity) ||
      numberOrZero(payload.totalItemsQuantity) ||
      numberOrZero(extras.custom_order_quantity)
    );
  }

  function calculateItemsQuantity(items) {
    return items.reduce((sum, item) => {
      if (!item || typeof item !== "object") return sum;
      return sum + Math.max(1, numberOrZero(item.quantity || item.qty || 1));
    }, 0);
  }

  function parseDateFromOrderReference(value) {
    const text = String(value || "");
    const match = text.match(/NAT-(\d{10,13})/i);
    if (!match) return null;

    const raw = Number(match[1]);
    if (!Number.isFinite(raw)) return null;

    const timestamp = raw > 1000000000000 ? raw : raw * 1000;
    const date = new Date(timestamp);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function parseAnyDate(value) {
    if (value instanceof Date && Number.isFinite(value.getTime())) return value;

    if (typeof value === "number" && Number.isFinite(value)) {
      if (value > 20000 && value < 80000) {
        const dateFromSerial = new Date(Math.round((value - 25569) * 86400 * 1000));
        return Number.isFinite(dateFromSerial.getTime()) ? dateFromSerial : null;
      }

      const timestamp = value > 1000000000000 ? value : value * 1000;
      const dateFromTimestamp = new Date(timestamp);
      return Number.isFinite(dateFromTimestamp.getTime()) ? dateFromTimestamp : null;
    }

    const raw = String(value || "").trim();
    if (!raw) return null;

    const normalized = raw
      .replace(/\u200f|\u200e/g, "")
      .replace(/\s+/g, " ")
      .replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}(?::\d{2})?)$/, "$1T$2");

    const direct = new Date(normalized);
    if (Number.isFinite(direct.getTime())) return direct;

    const dayFirstMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
    if (!dayFirstMatch) return null;

    const day = Number(dayFirstMatch[1]);
    const month = Number(dayFirstMatch[2]);
    let year = Number(dayFirstMatch[3]);
    let hours = Number(dayFirstMatch[4] || 0);
    const minutes = Number(dayFirstMatch[5] || 0);
    const seconds = Number(dayFirstMatch[6] || 0);
    const meridiem = String(dayFirstMatch[7] || "").toUpperCase();

    if (year < 100) year += 2000;
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function normalizeDateForOutput(value) {
    const date = parseAnyDate(value);
    return date ? date.toISOString() : "";
  }

  function firstNonEmpty() {
    for (let i = 0; i < arguments.length; i++) {
      const value = arguments[i];
      if (value === undefined || value === null) continue;
      if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
      if (String(value).trim() !== "") return value;
    }

    return "";
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
    if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
    if (typeof value === "object") return jsonStringifySafe(value);
    return value;
  }

  function valueForHeaderCell(rowObject, header) {
    if (rowObject && Object.prototype.hasOwnProperty.call(rowObject, header)) {
      return valueForCell(rowObject[header]);
    }

    const normalizedHeader = String(header || "").trim();
    if (normalizedHeader && rowObject && Object.prototype.hasOwnProperty.call(rowObject, normalizedHeader)) {
      return valueForCell(rowObject[normalizedHeader]);
    }

    return "";
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
