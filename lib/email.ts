import nodemailer from 'nodemailer';

function getEmailTransportConfigs() {
  const infoHost = process.env.INFO_EMAIL_SMTP_HOST;
  const infoUser = process.env.INFO_EMAIL_USER;
  const infoPass = process.env.INFO_EMAIL_PASS;
  const configs = [];

  if (infoHost && infoUser && infoPass) {
    const port = Number(process.env.INFO_EMAIL_SMTP_PORT || 465);
    const secure = !["0", "false", "no", "off"].includes(
      String(process.env.INFO_EMAIL_SMTP_SECURE || (port === 465 ? "true" : "false")).toLowerCase(),
    );

    configs.push({
      name: "info",
      from: process.env.INFO_EMAIL_FROM || infoUser,
      transport: {
      host: infoHost,
      port,
      secure,
      auth: {
        user: infoUser,
        pass: infoPass,
      },
      },
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    configs.push({
      name: "gmail",
      from: process.env.EMAIL_USER,
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    });
  }

  return configs;
}

function getEmailFromAddress() {
  return process.env.INFO_EMAIL_FROM || process.env.INFO_EMAIL_USER || process.env.EMAIL_USER;
}

async function sendMailWithFallback(mailOptions: Record<string, unknown>) {
  const configs = getEmailTransportConfigs();

  if (!configs.length) {
    return { success: false, error: "Email SMTP is not configured" };
  }

  let lastError: unknown = null;

  for (const config of configs) {
    const transporter = nodemailer.createTransport(config.transport);

    try {
      const info = await transporter.sendMail({
        ...mailOptions,
        from: config.from || getEmailFromAddress(),
      });

      if (config.name !== "info") {
        console.warn("Email sent using fallback SMTP", {
          provider: config.name,
          to: mailOptions.to,
          subject: mailOptions.subject,
        });
      }

      return { success: true, messageId: info.messageId, provider: config.name };
    } catch (error) {
      lastError = error;
      console.error("Email SMTP send failed", {
        provider: config.name,
        to: mailOptions.to,
        subject: mailOptions.subject,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { success: false, error: lastError || "Email delivery failed" };
}

type OrderEmailItem = {
  line_id?: string;
  id?: number;
  name: string;
  slug?: string;
  quantity: number;
  size?: string;
  color?: string;
  type?: string;
  price?: number;
  price_egp?: number;
  unit_price_egp?: number;
  line_total_egp?: number;
  original_price_egp?: number;
  isBundle?: boolean;
  bundleSelections?: {
    selection_id?: string;
    bundle_index?: number;
    productId?: number;
    productName?: string;
    productSlug?: string;
    productType?: string;
    label?: string;
    size?: string;
    color?: string;
    quantity?: number;
    price?: number;
    unit_price_egp?: number;
    line_total_egp?: number;
    originalPrice?: number;
  }[];
};

type OrderEmailData = {
  order_ref?: string;
  payment_method?: string;
  delivery_method?: string;
  amount_egp?: number;
  shipping_egp?: number;
  created_at?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
  };
  items?: OrderEmailItem[];
  extras?: {
    subtotal_egp?: number;
    payment_discount?: number;
    payment_discount_percent?: number;
  };
  bosta?: {
    trackingNumber?: string;
  };
  shipment?: {
    trackingNumber?: string;
  };
  aramex?: {
    trackingNumber?: string;
  };
  instapay_proof?: {
    file_name?: string;
    file_type?: string;
    file_size?: number;
    data_url?: string;
    uploaded_at?: string;
  };
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderBundleSelectionsHtml(item: OrderEmailItem) {
  if (!item.bundleSelections?.length) return '';

  const selections = item.bundleSelections.map((selection, index) => {
    const details = [
      selection.productType ? `Type: ${escapeHtml(selection.productType)}` : '',
      selection.size ? `Size: ${escapeHtml(selection.size).toUpperCase()}` : '',
      selection.color ? `Color: ${escapeHtml(selection.color)}` : '',
      `Qty: ${selection.quantity || 1}`,
    ].filter(Boolean).join(' | ');
    const identity = [
      selection.selection_id ? `Selection: ${escapeHtml(selection.selection_id)}` : '',
      selection.productId ? `ID: ${selection.productId}` : '',
      selection.productSlug ? `Slug: ${escapeHtml(selection.productSlug)}` : '',
    ].filter(Boolean).join(' | ');
    const price = selection.unit_price_egp ?? selection.price;
    const originalPrice = selection.originalPrice;
    const priceHtml = price !== undefined
      ? `<div style="font-size: 13px; color: #555;">Catalog unit price: EGP ${price}${
          originalPrice && originalPrice !== price ? ` | Original: EGP ${originalPrice}` : ''
        }</div>`
      : '';

    return `
      <li style="margin: 6px 0;">
        <strong>${index + 1}. ${escapeHtml(selection.label || 'Bundle item')}: ${escapeHtml(selection.productName || `Product ${selection.productId || ''}`)}</strong>
        <div style="font-size: 13px; color: #555;">${details}</div>
        ${identity ? `<div style="font-size: 12px; color: #777;">${identity}</div>` : ''}
        ${priceHtml}
      </li>
    `;
  }).join('');

  return `
    <div style="margin-top: 8px; padding: 8px 10px; background: #fff8e1; border-left: 3px solid #EEBC3F;">
      <strong style="font-size: 13px;">Bundle contents:</strong>
      <ul style="margin: 4px 0 0; padding-left: 18px;">${selections}</ul>
    </div>
  `;
}

export function renderItemHtml(item: OrderEmailItem) {
  const optionsHtml = item.size
    ? `<div style="font-size: 14px; color: #555;">Size: ${escapeHtml(item.size).toUpperCase()}</div>`
    : '';

  const colorHtml = item.color
    ? `<div style="font-size: 14px; color: #555;">Color: ${escapeHtml(item.color)}</div>`
    : '';

  const typeLabel = item.type || 'Product';
  const unitPrice = item.unit_price_egp ?? item.price_egp ?? item.price ?? 0;
  const lineTotal = item.line_total_egp ?? unitPrice * item.quantity;
  const bundleHtml = renderBundleSelectionsHtml(item);
  const identityHtml = [
    item.line_id ? `Line: ${escapeHtml(item.line_id)}` : '',
    item.id ? `Product ID: ${item.id}` : '',
    item.slug ? `Slug: ${escapeHtml(item.slug)}` : '',
  ].filter(Boolean).join(' | ');
  const originalPriceHtml =
    item.original_price_egp && item.original_price_egp !== unitPrice
      ? `<div style="font-size: 12px; color: #777;">Original price: EGP ${item.original_price_egp}</div>`
      : '';

  return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${escapeHtml(item.name)}</strong>
        ${optionsHtml}
        ${colorHtml}
        <div style="font-size: 12px; color: #777; margin-top: 2px;">${escapeHtml(typeLabel)}</div>
        ${identityHtml ? `<div style="font-size: 12px; color: #777;">${identityHtml}</div>` : ''}
        ${originalPriceHtml}
        ${bundleHtml}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">EGP ${unitPrice}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">EGP ${lineTotal}</td>
    </tr>
  `;
}

function renderTotalsHtml(orderData: OrderEmailData) {
  const amount = orderData.amount_egp || 0;
  const subtotal = orderData.extras?.subtotal_egp ?? (amount - (orderData.shipping_egp || 0));
  const shipping = orderData.shipping_egp || 0;
  const paymentDiscount = orderData.extras?.payment_discount || 0;
  const paymentDiscountPercent = orderData.extras?.payment_discount_percent || 5;
  const total = amount;

  const discountRow = paymentDiscount > 0
    ? `<p><strong>Payment Discount (${paymentDiscountPercent}%):</strong> <span style="color: #27ae60;">-EGP ${paymentDiscount}</span></p>`
    : '';

  return `
    <p><strong>Subtotal:</strong> EGP ${subtotal}</p>
    <p><strong>Shipping:</strong> EGP ${shipping}</p>
    ${discountRow}
    <p style="font-size: 18px; color: #EEBC3F;"><strong>Total: EGP ${total}</strong></p>
  `;
}

export async function sendOrderEmail(orderData: OrderEmailData) {
  const adminEmail = process.env.ORDER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'natonateg@gmail.com';
  const itemsHtml = (orderData.items || []).map(renderItemHtml).join('');
  const totalsHtml = renderTotalsHtml(orderData);

  const mailOptions = {
    from: getEmailFromAddress(),
    to: adminEmail,
    subject: `New Order: ${orderData.order_ref || 'N/A'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #0F1A26; text-align: center;">New Order Received!</h2>

        <p style="font-size: 16px;"><strong>Order Reference:</strong> ${orderData.order_ref}</p>
        <p style="font-size: 16px;"><strong>Customer Name:</strong> ${orderData.customer?.first_name || ''} ${orderData.customer?.last_name || ''}</p>
        <p style="font-size: 16px;"><strong>Phone:</strong> ${orderData.customer?.phone || ''}</p>
        <p style="font-size: 16px;"><strong>Email:</strong> ${orderData.customer?.email || ''}</p>
        <p style="font-size: 16px;"><strong>City:</strong> ${orderData.customer?.city || ''}</p>
        <p style="font-size: 16px;"><strong>Address:</strong> ${orderData.customer?.address || ''}</p>
        <p style="font-size: 16px;"><strong>Payment Method:</strong> ${orderData.payment_method}</p>
        <p style="font-size: 16px;"><strong>Delivery Method:</strong> ${orderData.delivery_method}</p>


        <h3 style="margin-top: 30px; border-bottom: 2px solid #EEBC3F; padding-bottom: 5px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: left;">Qty</th>
              <th style="padding: 10px; text-align: left;">Price</th>
              <th style="padding: 10px; text-align: left;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">
          ${totalsHtml}
        </div>

        <div style="margin-top: 10px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
          <p>Bosta Tracking Number: ${orderData.bosta?.trackingNumber || orderData.shipment?.trackingNumber || orderData.aramex?.trackingNumber || 'N/A'}</p>
          <p>Order Logged At: ${orderData.created_at || 'N/A'}</p>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
          This is an automated notification from your store.
        </div>
      </div>
    `,
  };

  const result = await sendMailWithFallback(mailOptions);
  if (result.success) {
    console.log('Order email sent: %s', result.messageId);
  }
  return result;
}

function getDataUrlAttachment(proof: OrderEmailData["instapay_proof"]) {
  const dataUrl = proof?.data_url;
  if (!dataUrl) return null;

  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;

  return {
    filename: proof?.file_name || "instapay-proof.png",
    contentType: proof?.file_type || match[1],
    content: Buffer.from(match[2], "base64"),
  };
}

export async function sendInstapayApprovalEmail(orderData: OrderEmailData) {
  const adminEmail = "natonateg@gmail.com";
  const itemsHtml = (orderData.items || []).map(renderItemHtml).join("");
  const totalsHtml = renderTotalsHtml(orderData);
  const proofAttachment = getDataUrlAttachment(orderData.instapay_proof);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.natonat.com";
  const approvalToken = process.env.INSTAPAY_APPROVAL_TOKEN;
  const approvalUrl =
    approvalToken && orderData.order_ref
      ? `${appUrl}/api/orders/instapay/approve?order_ref=${encodeURIComponent(orderData.order_ref)}&token=${encodeURIComponent(approvalToken)}`
      : "";

  const approvalBlock = approvalUrl
    ? `
        <p style="margin-top: 18px;">
          <a href="${approvalUrl}" style="display:inline-block;background:#EEBC3F;color:#0F1A26;text-decoration:none;font-weight:bold;padding:12px 16px;border-radius:999px;">
            Approve InstaPay and create Bosta shipment
          </a>
        </p>
      `
    : `
        <p style="margin-top: 18px; padding: 12px; background: #fff8e1; border-radius: 10px; color: #7a5a00;">
          Approval link is disabled because INSTAPAY_APPROVAL_TOKEN is not configured. Review the proof, then approve from the admin flow/manual process.
        </p>
      `;

  const mailOptions = {
    from: getEmailFromAddress(),
    to: adminEmail,
    subject: `InstaPay approval needed: ${orderData.order_ref || "N/A"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 14px;">
        <h2 style="color: #0F1A26; text-align: center;">InstaPay Order Waiting for Approval</h2>
        <p style="text-align:center;color:#666;">Do not create Bosta shipment until this payment proof is approved.</p>

        <div style="background:#F8F6F3;border-radius:12px;padding:14px;margin:18px 0;">
          <p><strong>Order Reference:</strong> ${escapeHtml(orderData.order_ref)}</p>
          <p><strong>Customer:</strong> ${escapeHtml(orderData.customer?.first_name || "")} ${escapeHtml(orderData.customer?.last_name || "")}</p>
          <p><strong>Phone:</strong> ${escapeHtml(orderData.customer?.phone || "")}</p>
          <p><strong>Email:</strong> ${escapeHtml(orderData.customer?.email || "")}</p>
          <p><strong>City:</strong> ${escapeHtml(orderData.customer?.city || "")}</p>
          <p><strong>Address:</strong> ${escapeHtml(orderData.customer?.address || "")}</p>
          <p><strong>Payment Method:</strong> InstaPay</p>
          <p><strong>Status:</strong> Pending InstaPay Approval</p>
        </div>

        <h3 style="margin-top: 24px; border-bottom: 2px solid #EEBC3F; padding-bottom: 5px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: left;">Qty</th>
              <th style="padding: 10px; text-align: left;">Price</th>
              <th style="padding: 10px; text-align: left;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">${totalsHtml}</div>

        <div style="margin-top: 18px; padding: 12px; border: 1px dashed #EEBC3F; border-radius: 12px;">
          <p><strong>Proof file:</strong> ${escapeHtml(orderData.instapay_proof?.file_name || "Attached")}</p>
          <p><strong>Uploaded at:</strong> ${escapeHtml(orderData.instapay_proof?.uploaded_at || "N/A")}</p>
          ${proofAttachment ? "<p>The payment screenshot is attached to this email.</p>" : "<p style='color:#c0392b;'>No screenshot attachment was found.</p>"}
        </div>

        ${approvalBlock}
      </div>
    `,
    attachments: proofAttachment ? [proofAttachment] : [],
  };

  const result = await sendMailWithFallback(mailOptions);
  if (result.success) {
    console.log("InstaPay approval email sent: %s", result.messageId);
  }
  return result;
}

export async function sendInstapayPendingCustomerEmail(orderData: OrderEmailData) {
  const customerEmail = orderData.customer?.email;
  if (!customerEmail) {
    return { success: false, error: "Missing customer email" };
  }

  const itemsHtml = (orderData.items || []).map(renderItemHtml).join("");
  const totalsHtml = renderTotalsHtml(orderData);

  const mailOptions = {
    from: getEmailFromAddress(),
    to: customerEmail,
    subject: `We received your InstaPay proof - ${orderData.order_ref || "N/A"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 14px;">
        <h2 style="color: #0F1A26; text-align: center;">Payment Proof Received</h2>
        <p style="font-size: 16px; text-align: center; color: #555;">
          We received your InstaPay payment screenshot. Your order is waiting for payment confirmation by our team.
        </p>

        <div style="background:#F8F6F3;border-radius:12px;padding:14px;margin:18px 0;">
          <p><strong>Order Reference:</strong> ${escapeHtml(orderData.order_ref)}</p>
          <p><strong>Status:</strong> Payment proof under review</p>
          <p><strong>Payment Method:</strong> InstaPay</p>
        </div>

        <h3 style="margin-top: 24px; border-bottom: 2px solid #EEBC3F; padding-bottom: 5px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: left;">Qty</th>
              <th style="padding: 10px; text-align: left;">Price</th>
              <th style="padding: 10px; text-align: left;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">${totalsHtml}</div>

        <p style="margin-top: 18px; padding: 12px; background: #fff8e1; border-radius: 10px; color: #7a5a00;">
          Bosta shipping will be created only after payment approval. You will receive another email when the order is confirmed.
        </p>
      </div>
    `,
  };

  const result = await sendMailWithFallback(mailOptions);
  if (result.success) {
    console.log("InstaPay pending customer email sent: %s", result.messageId);
  }
  return result;
}

export async function sendCustomerConfirmationEmail(orderData: OrderEmailData) {
  const customerEmail = orderData.customer?.email;
  if (!customerEmail) {
    return { success: false, error: "Missing customer email" };
  }
  const itemsHtml = (orderData.items || []).map(renderItemHtml).join('');
  const totalsHtml = renderTotalsHtml(orderData);

  const mailOptions = {
    from: getEmailFromAddress(),
    to: customerEmail,
    subject: `Order Confirmation - ${orderData.order_ref || 'N/A'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #0F1A26; text-align: center;">Order Confirmed!</h2>
        <p style="font-size: 16px; text-align: center;">Thank you for your order. We'll ship it right away!</p>

        <p style="font-size: 16px;"><strong>Order Reference:</strong> ${orderData.order_ref}</p>
        <p style="font-size: 16px;"><strong>Customer Name:</strong> ${orderData.customer?.first_name || ''} ${orderData.customer?.last_name || ''}</p>
        <p style="font-size: 16px;"><strong>Phone:</strong> ${orderData.customer?.phone || ''}</p>
        <p style="font-size: 16px;"><strong>Email:</strong> ${orderData.customer?.email || ''}</p>
        <p style="font-size: 16px;"><strong>City:</strong> ${orderData.customer?.city || ''}</p>
        <p style="font-size: 16px;"><strong>Address:</strong> ${orderData.customer?.address || ''}</p>
        <p style="font-size: 16px;"><strong>Payment Method:</strong> ${orderData.payment_method}</p>
        <p style="font-size: 16px;"><strong>Delivery Method:</strong> ${orderData.delivery_method}</p>


        <h3 style="margin-top: 30px; border-bottom: 2px solid #EEBC3F; padding-bottom: 5px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: left;">Qty</th>
              <th style="padding: 10px; text-align: left;">Price</th>
              <th style="padding: 10px; text-align: left;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">
          ${totalsHtml}
        </div>

        <div style="margin-top: 10px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
          <p>Tracking Number: ${orderData.bosta?.trackingNumber || orderData.shipment?.trackingNumber || orderData.aramex?.trackingNumber || 'N/A'}</p>
          <p>Order Logged At: ${orderData.created_at || 'N/A'}</p>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
          This is an automated notification from your store.
        </div>
      </div>
    `,
  };

  const result = await sendMailWithFallback(mailOptions);
  if (result.success) {
    console.log('Customer confirmation email sent: %s', result.messageId);
  }
  return result;
}

type ReviewNotificationData = {
  customerName: string;
  rating: number;
  review: string;
  productName: string;
  productSlug: string;
  reviewId?: string;
};

export async function sendReviewNotificationEmail(reviewData: ReviewNotificationData) {
  const adminEmail = "natonateg@gmail.com";
  const studioUrl = "https://www.natonat.com/studio";

  const mailOptions = {
    from: getEmailFromAddress(),
    to: adminEmail,
    subject: `New review pending approval: ${reviewData.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #0F1A26; text-align: center;">New Product Review Pending Approval</h2>
        <p><strong>Customer:</strong> ${escapeHtml(reviewData.customerName)}</p>
        <p><strong>Product:</strong> ${escapeHtml(reviewData.productName)}</p>
        <p><strong>Product slug:</strong> ${escapeHtml(reviewData.productSlug)}</p>
        <p><strong>Rating:</strong> ${reviewData.rating}/5</p>
        ${reviewData.reviewId ? `<p><strong>Review ID:</strong> ${escapeHtml(reviewData.reviewId)}</p>` : ""}
        <div style="margin: 18px 0; padding: 14px; background: #F8F6F3; border-left: 4px solid #EEBC3F; border-radius: 8px;">
          ${escapeHtml(reviewData.review).replace(/\n/g, "<br />")}
        </div>
        <p style="font-size: 14px; color: #555;">
          Open Sanity Studio, go to <strong>Product reviews</strong>, and change status to <strong>Approved</strong> to publish it on the product page.
        </p>
        <p>
          <a href="${studioUrl}" style="display:inline-block;background:#EEBC3F;color:#0F1A26;text-decoration:none;font-weight:bold;padding:10px 14px;border-radius:999px;">Open CMS</a>
        </p>
      </div>
    `,
  };

  const result = await sendMailWithFallback(mailOptions);
  if (result.success) {
    console.log("Review notification email sent: %s", result.messageId);
  }
  return result;
}

type ReferralRewardEmailData = {
  to?: string;
  referrerName?: string;
  referralCode?: string;
  rewardCode: string;
  rewardValueEgp: number;
  orderRef?: string;
};

export async function sendReferralRewardEmail(rewardData: ReferralRewardEmailData) {
  if (!rewardData.to) {
    return { success: false, error: "Missing recipient email" };
  }

  const customerName = rewardData.referrerName || "natOnat customer";
  const shopUrl = "https://www.natonat.com/shop";

  const mailOptions = {
    from: getEmailFromAddress(),
    to: rewardData.to,
    subject: `Your natOnat referral reward is ready`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 14px;">
        <h2 style="color: #0F1A26; text-align: center;">Your referral reward is ready</h2>
        <p style="font-size: 16px;">Hi ${escapeHtml(customerName)},</p>
        <p style="font-size: 16px; line-height: 1.6;">
          Someone used your referral code${rewardData.referralCode ? ` <strong>${escapeHtml(rewardData.referralCode)}</strong>` : ""} and completed an order.
          Here is your reward code for your next natOnat order.
        </p>
        <div style="margin: 22px 0; padding: 18px; background: #F8F6F3; border: 1px solid #EEBC3F; border-radius: 14px; text-align: center;">
          <p style="margin: 0 0 8px; color: #0F1A26; font-size: 13px; font-weight: bold;">Your reward code</p>
          <p style="margin: 0; color: #0F1A26; font-size: 28px; font-weight: 900; letter-spacing: 2px;">${escapeHtml(rewardData.rewardCode)}</p>
          <p style="margin: 10px 0 0; color: #27ae60; font-size: 16px; font-weight: bold;">Save EGP ${rewardData.rewardValueEgp}</p>
        </div>
        ${rewardData.orderRef ? `<p style="font-size: 13px; color: #777;">Referral order: ${escapeHtml(rewardData.orderRef)}</p>` : ""}
        <p style="text-align: center;">
          <a href="${shopUrl}" style="display:inline-block;background:#EEBC3F;color:#0F1A26;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:999px;">Shop now</a>
        </p>
        <p style="margin-top: 24px; font-size: 12px; color: #777; text-align: center;">
          This reward is generated automatically after a successful referral order.
        </p>
      </div>
    `,
  };

  const result = await sendMailWithFallback(mailOptions);
  if (result.success) {
    console.log("Referral reward email sent: %s", result.messageId);
  }
  return result;
}
