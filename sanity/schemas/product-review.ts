import { defineField, defineType } from "sanity";

export const productReview = defineType({
  name: "productReview",
  title: "Product reviews",
  type: "document",
  fields: [
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      initialValue: "pending",
      options: {
        layout: "radio",
        list: [
          { title: "Pending approval", value: "pending" },
          { title: "Approved - visible on site", value: "approved" },
          { title: "Rejected - hidden", value: "rejected" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      to: [{ type: "product" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "productSlug",
      title: "Product slug",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "productName",
      title: "Product name",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerName",
      title: "Customer name",
      type: "string",
      validation: (Rule) => Rule.required().min(2).max(80),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: "review",
      title: "Review",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required().min(10).max(1000),
    }),
    defineField({
      name: "submittedAt",
      title: "Submitted at",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "approvedAt",
      title: "Approved at",
      type: "datetime",
      hidden: ({ document }) => document?.status !== "approved",
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "newestFirst",
      by: [{ field: "submittedAt", direction: "desc" }],
    },
    {
      title: "Pending first",
      name: "pendingFirst",
      by: [
        { field: "status", direction: "desc" },
        { field: "submittedAt", direction: "desc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "customerName",
      subtitle: "productName",
      rating: "rating",
      status: "status",
    },
    prepare({ title, subtitle, rating, status }) {
      return {
        title: `${title || "Customer"} - ${rating || 0}/5`,
        subtitle: [status || "pending", subtitle].filter(Boolean).join(" - "),
      };
    },
  },
});
