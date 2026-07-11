import { NextResponse } from "next/server";
import { groq } from "next-sanity";

import { isAdminAuthorized } from "@/lib/admin-auth";
import { sanityClient } from "@/sanity/lib/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const expensesQuery = groq`
  *[_type == "adminExpense" && isActive != false] | order(expenseDate desc) {
    _id,
    title,
    amountEgp,
    category,
    expenseDate,
    paymentMethod,
    vendor,
    relatedOrderRef,
    notes,
    _updatedAt
  }
`;

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expenses = await sanityClient.fetch(expensesQuery, {}, { cache: "no-store" });

    return NextResponse.json({
      success: true,
      expenses,
      total: Array.isArray(expenses) ? expenses.length : 0,
      source: "sanity",
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Admin expenses] Failed to load expenses", error);
    return NextResponse.json(
      { success: false, error: "Could not load expenses" },
      { status: 500 },
    );
  }
}
