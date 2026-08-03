# Supabase Migration Checklist

Use this checklist when moving natOnat orders to a new Supabase account.

## What the developer already prepared

- `supabase/orders.sql` is the source schema for the new project.
- The website writes orders to Supabase through server-side REST calls only.
- The dashboard can backfill old orders from Google Sheets using `/api/admin/supabase-backfill`.
- Google Sheets remains enabled as a secondary log/export source.

## What you need to do in Supabase

1. Create the new Supabase project.
2. Open SQL Editor.
3. Paste and run the full contents of `supabase/orders.sql`.
4. If Supabase warns about RLS, choose the option that enables RLS.
5. Go to Project Settings > API.
6. Copy:
   - Project URL
   - Secret/service role key

Do not use the publishable/anon key for this backend order storage.

## Environment variables to update

Set these in Vercel Production and in local `.env.local` when testing locally:

```env
SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY
```

Do not commit these values to Git.

## After the env is updated

1. Redeploy the site so production uses the new Supabase project.
2. Log in to `/admin`.
3. Run a preview backfill:

```http
POST /api/admin/supabase-backfill
{
  "limit": 5000
}
```

4. If the preview counts look correct, run the real backfill:

```http
POST /api/admin/supabase-backfill
{
  "limit": 5000,
  "commit": true
}
```

5. Open the dashboard and confirm:
   - Orders count matches Google Sheets unique order refs.
   - Finance cards show values.
   - Bosta tracking data appears on orders.
   - Custom/special orders are still separated from catalog orders.

## Important notes

- New checkout orders will be saved in Supabase and Google Sheets.
- The admin dashboard reads Supabase first, then falls back to Google Sheets if needed.
- Manual catalog orders should count in finance and can create a real courier shipment when enabled.
- Custom bulk/special orders should count in finance only and should not create Bosta shipments.
