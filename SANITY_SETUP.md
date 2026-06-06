# Sanity CMS setup

This project now includes a Sanity Studio scaffold for managing products.

## Environment variables

Add these values to `.env.local` and to the production hosting environment:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-06-04
```

The project currently uses safe placeholder defaults so the Next.js build does
not break before Sanity is connected.

## Studio URL

After configuring the environment variables and running the app, open:

```text
/studio
```

Localized Studio URLs (`/en/studio` and `/ar/studio`) redirect to `/studio`
so Sanity sees the same `basePath` as the configured workspace.

## Product model

The `product` schema is designed to mirror `lib/products.ts`:

- Name, slug, active/hidden state
- Category, type, tag
- Price and original price
- Description and features
- Main image URL and Sanity image
- Gallery URLs and Sanity gallery images
- Size prices
- Colors
- Gender, collection, print type filters
- Bundle items and pricing rules
- Sort order

The Studio product editor is split into tabs:

- Basic: name, slug, visibility, category, badge and ordering
- Pricing: price, original price, size prices and pricing rules
- Content: description, features, filters and variants
- Media: current public image URLs and future Sanity image fields
- Bundle: bundle configuration

## Import current products

Generate an import file from the current local catalog:

```bash
npm run sanity:products:export
```

Then import it into the configured Sanity dataset:

```bash
npx sanity dataset import sanity-products.ndjson production --replace
```

You must be logged in with a Sanity account that has write access to the
project before importing.

## Safe migration plan

1. Create the Sanity project and dataset.
2. Add the environment variables.
3. Open the Studio and verify the product schema.
4. Import existing products from `lib/products.ts`.
5. Switch the storefront to read from Sanity with `lib/products.ts` as fallback.

The storefront is not switched to Sanity yet. This keeps the live site safe
until the dataset is ready and reviewed.
