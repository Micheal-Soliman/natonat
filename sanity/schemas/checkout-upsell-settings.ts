import { defineArrayMember, defineField, defineType } from "sanity";

export const checkoutUpsellSettings = defineType({
  name: "checkoutUpsellSettings",
  title: "Checkout upsell popup",
  type: "document",
  fields: [
    defineField({
      name: "enabled",
      title: "Enable popup",
      type: "boolean",
      initialValue: false,
      description: "Show this offer after checkout and before the success page.",
    }),
    defineField({
      name: "product",
      title: "Upsell product",
      type: "reference",
      to: [{ type: "product" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "selectedSize",
      title: "Default size",
      type: "string",
      options: {
        list: [
          { title: "S", value: "s" },
          { title: "M", value: "m" },
          { title: "L", value: "l" },
          { title: "XL", value: "xl" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "selectedColor",
      title: "Default color",
      type: "string",
      description: "Optional color id/name to pass to the product page.",
    }),
    defineField({
      name: "image",
      title: "Custom popup image",
      type: "image",
      options: { hotspot: true },
      description: "Optional. If empty, the product image will be used.",
    }),
    defineField({
      name: "badge",
      title: "Badge",
      type: "string",
      initialValue: "\u0639\u0631\u0636 \u062e\u0627\u0635 \u0628\u0639\u062f \u0627\u0644\u0637\u0644\u0628",
    }),
    defineField({
      name: "title",
      title: "Popup title",
      type: "string",
      initialValue: "\u062a\u062d\u0628 \u062a\u0636\u064a\u0641 PackOnat \u0645\u0639 \u0627\u0644\u0623\u0648\u0631\u062f\u0631\u061f",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      initialValue:
        "\u0636\u064a\u0641 PackOnat \u062f\u0644\u0648\u0642\u062a\u064a \u0645\u0639 \u0627\u0644\u0623\u0648\u0631\u062f\u0631 \u0648\u0634\u0648\u0641 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u0646\u062a\u062c \u0642\u0628\u0644 \u0645\u0627 \u0646\u0623\u0643\u062f \u0627\u0644\u0634\u062d\u0646\u0629.",
    }),
    defineField({
      name: "hint",
      title: "Discount hint",
      type: "string",
      initialValue:
        "\u0644\u0648 \u0636\u0641\u062a\u0647 \u062f\u0644\u0648\u0642\u062a\u064a \u0647\u064a\u0628\u0642\u0649 \u0639\u0646\u062f\u0643 \u0645\u0646\u062a\u062c\u064a\u0646 \u0648\u062a\u0633\u062a\u0641\u064a\u062f \u0628\u062e\u0635\u0645 7% \u062d\u0633\u0628 \u0639\u0631\u0636 \u0627\u0644\u0640 CMS.",
      description:
        "Short reassurance/hint shown under the price. Example: \u062e\u0635\u0645 \u062e\u0627\u0635 \u0644\u0648 \u0636\u0641\u062a\u0647 \u0645\u0639 \u0627\u0644\u0623\u0648\u0631\u062f\u0631 \u062f\u0644\u0648\u0642\u062a\u064a.",
    }),
    defineField({
      name: "discountPercent",
      title: "Hint discount percent",
      type: "number",
      initialValue: 7,
      validation: (Rule) => Rule.min(0).max(95),
      description:
        "Shown as a hint/badge in the popup. Example: 7% when the order becomes 2 products.",
    }),
    defineField({
      name: "discountLabel",
      title: "Discount label",
      type: "string",
      initialValue: "\u0644\u0648 \u0627\u0644\u0623\u0648\u0631\u062f\u0631 \u0628\u0642\u0649 \u0645\u0646\u062a\u062c\u064a\u0646",
    }),
    defineField({
      name: "ctaLabel",
      title: "Accept button label",
      type: "string",
      initialValue: "\u0623\u0648\u0627\u0641\u0642\u060c \u0634\u0648\u0641 PackOnat",
    }),
    defineField({
      name: "declineLabel",
      title: "Decline button label",
      type: "string",
      initialValue: "\u0644\u0627 \u0623\u0631\u064a\u062f\u060c \u0643\u0645\u0644 \u0627\u0644\u0637\u0644\u0628",
    }),
    defineField({
      name: "showForPaymentMethods",
      title: "Show for payment methods",
      type: "array",
      of: [
        defineArrayMember({
          type: "string",
          options: {
            list: [
              { title: "Cash on Delivery", value: "cod" },
              { title: "InstaPay / Wallets", value: "instapay" },
              { title: "Card", value: "card" },
            ],
          },
        }),
      ],
      initialValue: ["cod", "instapay"],
      description: "Leave empty to show for all methods. Card users usually go to Paymob first.",
    }),
    defineField({
      name: "minimumSubtotalEgp",
      title: "Minimum order total (EGP)",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
  ],
  preview: {
    select: {
      title: "title",
      enabled: "enabled",
      product: "product.name",
    },
    prepare({ title, enabled, product }) {
      return {
        title: title || "Checkout upsell popup",
        subtitle: `${enabled ? "Enabled" : "Disabled"}${product ? ` · ${product}` : ""}`,
      };
    },
  },
});
