import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function renderItemHtml(item: any) {
  const optionsHtml = item.size
    ? `<div style="font-size: 14px; color: #555;">Size: ${item.size.toUpperCase()}</div>`
    : '';

  const colorHtml = item.color
    ? `<div style="font-size: 14px; color: #555;">Color: ${item.color}</div>`
    : '';

  // Use item.type which is always present in the payload (e.g. "Luggage Cover", "Bundle", etc.)
  const typeLabel = item.type || 'Product';

  return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong>
        ${optionsHtml}
        ${colorHtml}
        <div style="font-size: 12px; color: #777; margin-top: 2px;">${typeLabel}</div>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">EGP ${item.price_egp || item.price || 0}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">EGP ${(item.price_egp || item.price || 0) * item.quantity}</td>
    </tr>
  `;
}

function renderTotalsHtml(orderData: any) {
  const subtotal = orderData.extras?.subtotal_egp ?? (orderData.amount_egp - (orderData.shipping_egp || 0));
  const shipping = orderData.shipping_egp || 0;
  const paymentDiscount = orderData.extras?.payment_discount || 0;
  const paymentDiscountPercent = orderData.extras?.payment_discount_percent || 2;
  const total = orderData.amount_egp;

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

export async function sendOrderEmail(orderData: any) {
  const adminEmail = 'natonateg@gmail.com';
  const itemsHtml = orderData.items.map(renderItemHtml).join('');
  const totalsHtml = renderTotalsHtml(orderData);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `New Order: ${orderData.order_ref || 'N/A'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #0F1A26; text-align: center;">New Order Received!</h2>

        <p style="font-size: 16px;"><strong>Order Reference:</strong> ${orderData.order_ref}</p>
        <p style="font-size: 16px;"><strong>Customer Name:</strong> ${orderData.customer.first_name} ${orderData.customer.last_name}</p>
        <p style="font-size: 16px;"><strong>Phone:</strong> ${orderData.customer.phone}</p>
        <p style="font-size: 16px;"><strong>Email:</strong> ${orderData.customer.email}</p>
        <p style="font-size: 16px;"><strong>City:</strong> ${orderData.customer.city}</p>
        <p style="font-size: 16px;"><strong>Address:</strong> ${orderData.customer.address}</p>
        <p style="font-size: 16px;"><strong>Payment Method:</strong> ${orderData.payment_method}</p>
        <p style="font-size: 16px;"><strong>Delivery Method:</strong> ${orderData.delivery_method}</p>

        <p style="font-size: 15px; background: #fff8e1; border-left: 4px solid #EEBC3F; padding: 10px; color: #333;">
  <strong>Shipping Note:</strong> Aramex shipping will be available starting Monday, and pickup will be available starting Saturday.
</p>

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

export async function sendCustomerConfirmationEmail(orderData: any) {
  const customerEmail = orderData.customer.email;
  const itemsHtml = orderData.items.map(renderItemHtml).join('');
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
        <p style="font-size: 16px;"><strong>Customer Name:</strong> ${orderData.customer.first_name} ${orderData.customer.last_name}</p>
        <p style="font-size: 16px;"><strong>Phone:</strong> ${orderData.customer.phone}</p>
        <p style="font-size: 16px;"><strong>Email:</strong> ${orderData.customer.email}</p>
        <p style="font-size: 16px;"><strong>City:</strong> ${orderData.customer.city}</p>
        <p style="font-size: 16px;"><strong>Address:</strong> ${orderData.customer.address}</p>
        <p style="font-size: 16px;"><strong>Payment Method:</strong> ${orderData.payment_method}</p>
        <p style="font-size: 16px;"><strong>Delivery Method:</strong> ${orderData.delivery_method}</p>

        <p style="font-size: 15px; background: #fff8e1; border-left: 4px solid #EEBC3F; padding: 10px; color: #333;">
  <strong>Shipping Note:</strong> Aramex shipping will be available starting Monday, and pickup will be available starting Saturday.
</p>

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