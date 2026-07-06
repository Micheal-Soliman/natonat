import { defineArrayMember, defineField, defineType } from "sanity";

export const discountCode = defineType({
  name: "discountCode",
  title: "Discount code",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Internal title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "code",
      title: "Code",
      type: "string",
      description: "Example: WELCOME10. Codes are matched case-insensitively.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "discountType",
      title: "Discount type",
      type: "string",
      initialValue: "percentage",
      options: {
        layout: "radio",
        list: [
          { title: "Percentage", value: "percentage" },
          { title: "Fixed EGP amount", value: "fixed" },
          { title: "Free shipping", value: "free_shipping" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "value",
      title: "Value",
      type: "number",
      description: "Use 10 for 10%, or 100 for EGP 100. Leave empty for free shipping.",
      hidden: ({ parent }) => parent?.discountType === "free_shipping",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "maxDiscountEgp",
      title: "Max discount in EGP",
      type: "number",
      description: "Optional cap for percentage discounts.",
      hidden: ({ parent }) => parent?.discountType !== "percentage",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "minimumSubtotalEgp",
      title: "Minimum subtotal in EGP",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "startsAt",
      title: "Starts at",
      type: "datetime",
    }),
    defineField({
      name: "endsAt",
      title: "Ends at",
      type: "datetime",
    }),
    defineField({
      name: "allowedPaymentMethods",
      title: "Allowed payment methods",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: {
        layout: "tags",
        list: [
          { title: "Cash on Delivery", value: "cod" },
          { title: "InstaPay / Wallets", value: "instapay" },
          { title: "Card", value: "card" },
        ],
      },
    }),
    defineField({
      name: "combineWithPaymentDiscount",
      title: "Can combine with payment method discount",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "appliesTo",
      title: "Applies to",
      type: "string",
      initialValue: "all",
      options: {
        layout: "radio",
        list: [
          { title: "All products", value: "all" },
          { title: "Selected products", value: "products" },
          { title: "Selected categories", value: "categories" },
        ],
      },
    }),
    defineField({
      name: "products",
      title: "Products",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "product" }] })],
      hidden: ({ parent }) => parent?.appliesTo !== "products",
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      hidden: ({ parent }) => parent?.appliesTo !== "categories",
    }),
    defineField({
      name: "customerMessage",
      title: "Customer success message",
      type: "string",
      description: "Optional message shown after applying the code.",
    }),
  ],
  preview: {
    select: {
      title: "code",
      subtitle: "title",
      isActive: "isActive",
      discountType: "discountType",
      value: "value",
    },
    prepare({ title, subtitle, isActive, discountType, value }) {
      const discountLabel =
        discountType === "free_shipping"
          ? "Free shipping"
          : discountType === "percentage"
            ? `${value || 0}%`
            : `EGP ${value || 0}`;

      return {
        title: `${title || "Discount"} ${isActive === false ? "(inactive)" : ""}`,
        subtitle: [discountLabel, subtitle].filter(Boolean).join(" - "),
      };
    },
  },
});
