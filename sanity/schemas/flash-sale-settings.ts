import { defineField, defineType } from "sanity";

export const flashSaleSettings = defineType({
  name: "flashSaleSettings",
  title: "Flash sale modal",
  type: "document",
  initialValue: {
    enabled: false,
    eyebrow: "Limited time",
    title: "Flash Sale",
    description: "Save on selected natOnat travel essentials before the offer ends.",
    badge: "Sale",
    discountLabel: "Limited offer",
    ctaLabel: "Shop offer",
    secondaryLabel: "Not now",
  },
  fields: [
    defineField({ name: "enabled", title: "Enabled", type: "boolean", initialValue: false }),
    defineField({ name: "eyebrow", title: "Small label", type: "string" }),
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({ name: "badge", title: "Badge", type: "string" }),
    defineField({ name: "discountLabel", title: "Discount label", type: "string" }),
    defineField({ name: "endsAt", title: "Countdown end time", type: "datetime" }),
    defineField({ name: "ctaLabel", title: "CTA label", type: "string" }),
    defineField({ name: "secondaryLabel", title: "Secondary button label", type: "string" }),
    defineField({
      name: "product",
      title: "Sale product",
      type: "reference",
      to: [{ type: "product" }],
    }),
    defineField({
      name: "image",
      title: "Custom modal image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Flash sale modal",
      subtitle: "Home page sale popup",
    }),
  },
});
