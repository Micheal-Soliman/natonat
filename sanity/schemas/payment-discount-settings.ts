import { defineField, defineType } from "sanity";

export const paymentDiscountSettings = defineType({
  name: "paymentDiscountSettings",
  title: "Payment method discounts",
  type: "document",
  fields: [
    defineField({
      name: "enabled",
      title: "Enable payment discounts",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "cardPercent",
      title: "Card / Visa discount percent",
      type: "number",
      initialValue: 5,
      validation: (Rule) => Rule.required().min(0).max(90),
    }),
    defineField({
      name: "instapayPercent",
      title: "InstaPay / Wallets discount percent",
      type: "number",
      initialValue: 2,
      validation: (Rule) => Rule.required().min(0).max(90),
    }),
    defineField({
      name: "codPercent",
      title: "Cash on delivery discount percent",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0).max(90),
    }),
  ],
  preview: {
    select: {
      enabled: "enabled",
      card: "cardPercent",
      instapay: "instapayPercent",
      cod: "codPercent",
    },
    prepare({ enabled, card, instapay, cod }) {
      return {
        title: "Payment method discounts",
        subtitle: enabled
          ? `Card ${card || 0}% / InstaPay ${instapay || 0}% / COD ${cod || 0}%`
          : "Disabled",
      };
    },
  },
});
