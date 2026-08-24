This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## WhatsApp order verification

The order confirmation flow requires these server-side environment variables:

```bash
ORDER_VERIFICATION_ENABLED=true
ORDER_CONFIRMATION_SECRET=
WHATSAPP_CLOUD_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_ORDER_CONFIRMATION_TEMPLATE=order_confirmation
WHATSAPP_ORDER_REMINDER_TEMPLATE=order_reminder
WHATSAPP_ORDER_TEMPLATE_LANGUAGE=ar
CRON_SECRET=
```

Configure the Meta callback URL as `/api/whatsapp/webhook` and subscribe it to
the WhatsApp `messages` field. Orders remain `pending_verification` until a
valid customer quick reply or an authenticated admin action confirms them.

Both WhatsApp templates must be active Utility templates in Arabic (`ar`). The
confirmation template body parameters must be ordered as customer name,
product names, sizes, total quantity, and total EGP. Button 1 must be the
confirmation quick reply and button 2 must be the cancellation quick reply.
The reminder template uses the same body parameters and button order. If the
initial WhatsApp message cannot be sent or delivered, the order stays in the
manual confirmation queue and no courier shipment is created automatically.
