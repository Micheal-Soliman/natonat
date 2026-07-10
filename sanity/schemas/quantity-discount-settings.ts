import { defineArrayMember, defineField, defineType } from "sanity";

export const quantityDiscountSettings = defineType({
  name: "quantityDiscountSettings",
  title: "Quantity discount",
  type: "document",
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "title",
      title: "Tracker title",
      type: "string",
      initialValue: "Bundle more, save more",
    }),
    defineField({
      name: "description",
      title: "Tracker description",
      type: "text",
      rows: 2,
      initialValue: "Add more products to unlock automatic order discounts.",
    }),
    defineField({
      name: "tiers",
      title: "Discount tiers",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "minQuantity",
              title: "Minimum cart items",
              type: "number",
              validation: (Rule) => Rule.required().min(2),
            }),
            defineField({
              name: "percent",
              title: "Discount percent",
              type: "number",
              validation: (Rule) => Rule.required().min(1).max(90),
            }),
            defineField({
              name: "label",
              title: "Ribbon label",
              description: "Text shown on the product card/product image ribbon. Example: اشتري 2 وخد خصم 7%",
              type: "string",
            }),
          ],
          preview: {
            select: {
              quantity: "minQuantity",
              percent: "percent",
              label: "label",
            },
            prepare({ quantity, percent, label }) {
              return {
                title: label || `${quantity}+ items`,
                subtitle: `${percent || 0}% off`,
              };
            },
          },
        }),
      ],
      initialValue: [
        { minQuantity: 2, percent: 7, label: "2 items" },
        { minQuantity: 3, percent: 10, label: "3 items" },
        { minQuantity: 4, percent: 15, label: "4+ items" },
      ],
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Quantity discount",
      subtitle: "Sitewide automatic cart discount",
    }),
  },
});
