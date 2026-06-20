import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
  aramex?: {
    trackingNumber?: string;
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
  const paymentDiscountPercent = orderData.extras?.payment_discount_percent || 2;
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
  const adminEmail = 'natonateg@gmail.com';
  const itemsHtml = (orderData.items || []).map(renderItemHtml).join('');
  const totalsHtml = renderTotalsHtml(orderData);

  const mailOptions = {
    from: process.env.EMAIL_USER,
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
          <p>Aramex Tracking Number: ${orderData.aramex?.trackingNumber || 'N/A'}</p>
          <p>Order Logged At: ${orderData.created_at || 'N/A'}</p>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
          This is an automated notification from your store.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Order email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order email:', error);
    return { success: false, error };
  }
}

export async function sendCustomerConfirmationEmail(orderData: OrderEmailData) {
  const customerEmail = orderData.customer?.email;
  const itemsHtml = (orderData.items || []).map(renderItemHtml).join('');
  const totalsHtml = renderTotalsHtml(orderData);

  const mailOptions = {
    from: process.env.EMAIL_USER,
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
          <p>Tracking Number: ${orderData.aramex?.trackingNumber || 'N/A'}</p>
          <p>Order Logged At: ${orderData.created_at || 'N/A'}</p>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
          This is an automated notification from your store.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Customer confirmation email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
    return { success: false, error };
  }
}
