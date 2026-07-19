import { defineField, defineType } from "sanity";

export const checkoutPopupSettings = defineType({
  name: "checkoutPopupSettings",
  title: "Checkout popup",
  type: "document",
  fields: [
    defineField({
      name: "enabled",
      title: "Enable popup",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "product",
      title: "Popup product",
      type: "reference",
      to: [{ type: "product" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Custom popup image",
      type: "image",
      options: { hotspot: true },
      description: "Optional. If empty, product image will be used.",
    }),
    defineField({
      name: "badge",
      title: "Badge",
      type: "string",
      initialValue: "PackOnat",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      initialValue: "\u062a\u062d\u0628 \u062a\u0636\u064a\u0641 PackOnat \u0645\u0639 \u0627\u0644\u0623\u0648\u0631\u062f\u0631\u061f",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      initialValue:
        "\u0645\u0646\u0638\u0645 \u0634\u0646\u0637\u0629 \u0633\u0641\u0631 \u0639\u0645\u0644\u064a \u064a\u062e\u0644\u064a \u0647\u062f\u0648\u0645\u0643 \u0645\u062a\u0631\u062a\u0628\u0629 \u0648\u0633\u0647\u0644\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u062c\u0648\u0647 \u0627\u0644\u0634\u0646\u0637\u0629.",
    }),
    defineField({
      name: "discountPercent",
      title: "Hint discount percent",
      type: "number",
      initialValue: 7,
      validation: (Rule) => Rule.min(0).max(95),
    }),
    defineField({
      name: "hint",
      title: "Hint text",
      type: "string",
      initialValue:
        "\u0644\u0648 \u0636\u0641\u062a\u0647 \u062f\u0644\u0648\u0642\u062a\u064a \u0647\u064a\u0628\u0642\u0649 \u0639\u0646\u062f\u0643 \u0645\u0646\u062a\u062c\u064a\u0646 \u0648\u064a\u0638\u0647\u0631\u0644\u0643 \u062e\u0635\u0645 7%.",
    }),
    defineField({
      name: "acceptLabel",
      title: "Accept button label",
      type: "string",
      initialValue: "\u0634\u0648\u0641 PackOnat",
    }),
    defineField({
      name: "declineLabel",
      title: "Decline button label",
      type: "string",
      initialValue: "\u0643\u0645\u0644 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0637\u0644\u0628",
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
        title: title || "Checkout popup",
        subtitle: `${enabled ? "Enabled" : "Disabled"}${product ? ` · ${product}` : ""}`,
      };
    },
  },
});
