import { defineField, defineType } from "sanity";

export const adminExpense = defineType({
  name: "adminExpense",
  title: "Admin expenses",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "amountEgp",
      title: "Amount EGP",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      initialValue: "operations",
      options: {
        list: [
          { title: "Ads", value: "ads" },
          { title: "Packaging", value: "packaging" },
          { title: "Shipping adjustment", value: "shipping_adjustment" },
          { title: "Salaries", value: "salaries" },
          { title: "Tools / subscriptions", value: "tools" },
          { title: "Operations", value: "operations" },
          { title: "Refund / compensation", value: "refund" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "expenseDate",
      title: "Expense date",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "paymentMethod",
      title: "Payment method",
      type: "string",
      options: {
        list: [
          { title: "Cash", value: "cash" },
          { title: "Bank transfer", value: "bank_transfer" },
          { title: "Card", value: "card" },
          { title: "InstaPay", value: "instapay" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "vendor",
      title: "Vendor / supplier",
      type: "string",
    }),
    defineField({
      name: "relatedOrderRef",
      title: "Related order reference",
      type: "string",
      description: "Optional. Use for refunds, compensation, shipping adjustments, or order-specific costs.",
    }),
    defineField({
      name: "notes",
      title: "Notes",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "isActive",
      title: "Include in dashboard",
      type: "boolean",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Expense date desc",
      name: "expenseDateDesc",
      by: [{ field: "expenseDate", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      amount: "amountEgp",
      category: "category",
      date: "expenseDate",
    },
    prepare({ title, amount, category, date }) {
      return {
        title,
        subtitle: [category, amount ? `EGP ${amount}` : null, date ? new Date(date).toLocaleDateString("en-EG") : null]
          .filter(Boolean)
          .join(" - "),
      };
    },
  },
});
