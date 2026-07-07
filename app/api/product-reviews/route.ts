import { NextResponse } from "next/server";
import { createClient } from "next-sanity";

import { sendReviewNotificationEmail } from "@/lib/email";
import { sanityClient } from "@/sanity/lib/client";
import { apiVersion, dataset, projectId } from "@/sanity/env";

type ProductLookup = {
  _id: string;
  name: string;
  slug?: string;
};

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return null;

  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = cleanText(searchParams.get("slug"), 120);

  if (!slug) {
    return NextResponse.json({ reviews: [] });
  }

  const reviews = await sanityClient.fetch(
    `*[
      _type == "productReview" &&
      status == "approved" &&
      (product->slug.current == $slug || productSlug == $slug)
    ] | order(submittedAt desc)[0...20] {
      _id,
      customerName,
      rating,
      review,
      submittedAt
    }`,
    { slug },
    { next: { revalidate: 60, tags: [`product-reviews-${slug}`] } },
  );

  return NextResponse.json({ reviews: Array.isArray(reviews) ? reviews : [] });
}

export async function POST(request: Request) {
  const writeClient = getWriteClient();
  if (!writeClient) {
    return NextResponse.json(
      { error: "Review submission is not configured" },
      { status: 503 },
    );
  }

  let body: {
    productSlug?: unknown;
    customerName?: unknown;
    name?: unknown;
    rating?: unknown;
    review?: unknown;
    website?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ success: true });
  }

  const productSlug = cleanText(body.productSlug, 120);
  const customerName = cleanText(body.customerName ?? body.name, 80);
  const review = cleanText(body.review, 1000);
  const rating = Number(body.rating);

  if (!productSlug || customerName.length < 2 || review.length < 10 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Please provide a valid name, rating, and review" },
      { status: 400 },
    );
  }

  const product = await sanityClient.fetch<ProductLookup | null>(
    `*[_type == "product" && isActive != false && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current
    }`,
    { slug: productSlug },
  );

  if (!product?._id) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const reviewDoc = await writeClient.create({
    _type: "productReview",
    status: "pending",
    product: {
      _type: "reference",
      _ref: product._id.replace(/^drafts\./, ""),
    },
    productSlug,
    productName: product.name,
    customerName,
    rating,
    review,
    submittedAt: new Date().toISOString(),
  });

  await sendReviewNotificationEmail({
    customerName,
    rating,
    review,
    productName: product.name,
    productSlug,
    reviewId: reviewDoc._id,
  });

  return NextResponse.json({
    success: true,
    status: "pending",
  });
}
