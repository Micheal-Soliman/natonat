import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function renderItemHtml(item: any) {
  const optionsHtml = item.options?.map((opt: any) => `<div style="font-size: 14px; color: #555; margin-top: 2px;">${opt.size || ''} ${opt.design || ''}</div>`).join('') || '';
  return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.name}
        ${optionsHtml ? `<div>${optionsHtml}</div>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">EGP ${item.price_egp || item.price || 0}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">EGP ${(item.price_egp || item.price || 0) * item.quantity}</td>
    </tr>
  `;
}

export async function sendOrderEmail(orderData: any) {
  const adminEmail = 'natonateg@gmail.com';
  const itemsHtml = orderData.items.map(renderItemHtml).join('');

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
          <p><strong>Subtotal:</strong> EGP ${orderData.extras?.subtotal_egp || (orderData.amount_egp - (orderData.shipping_egp || 0))}</p>
          <p><strong>Shipping:</strong> EGP ${orderData.shipping_egp || 0}</p>
          <p style="font-size: 18px; color: #EEBC3F;"><strong>Total: EGP ${orderData.amount_egp}</strong></p>
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

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: customerEmail,
    subject: `Order Confirmation - ${orderData.order_ref || 'N/A'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0F1A26; margin: 0;">natOnat</h1>
          <p style="color: #EEBC3F; margin: 5px 0;">Pack Smart. Travel Easy.</p>
        </div>

        <h2 style="color: #0F1A26; text-align: center;">Order Confirmed!</h2>
        <p style="font-size: 16px; text-align: center;">Thank you for your order. We'll ship it right away!</p>

        <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 16px; margin: 5px 0;"><strong>Order Reference:</strong> ${orderData.order_ref}</p>
          <p style="font-size: 16px; margin: 5px 0;"><strong>Customer Name:</strong> ${orderData.customer.first_name} ${orderData.customer.last_name}</p>
          <p style="font-size: 16px; margin: 5px 0;"><strong>Phone:</strong> ${orderData.customer.phone}</p>
          <p style="font-size: 16px; margin: 5px 0;"><strong>City:</strong> ${orderData.customer.city}</p>
          <p style="font-size: 16px; margin: 5px 0;"><strong>Address:</strong> ${orderData.customer.address}</p>
          <p style="font-size: 16px; margin: 5px 0;"><strong>Payment Method:</strong> ${orderData.payment_method}</p>
        </div>

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
          <p><strong>Subtotal:</strong> EGP ${orderData.extras?.subtotal_egp || (orderData.amount_egp - (orderData.shipping_egp || 0))}</p>
          <p><strong>Shipping:</strong> EGP ${orderData.shipping_egp || 0}</p>
          <p style="font-size: 18px; color: #EEBC3F;"><strong>Total: EGP ${orderData.amount_egp}</strong></p>
        </div>

        <div style="margin-top: 30px; padding: 15px; background-color: #EEBC3F; border-radius: 5px; text-align: center;">
          <p style="color: #0F1A26; font-weight: bold; margin: 0;">We'll send you a confirmation when your order ships!</p>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
          <p style="margin: 5px 0;">Questions? Contact us at info@natonat.com or +20 10 70004227</p>
          <p style="margin: 5px 0;">© 2024 natOnat. All rights reserved.</p>
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
