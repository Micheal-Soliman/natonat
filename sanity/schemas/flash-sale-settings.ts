import { defineField, defineType } from "sanity";

import { ProductColorDropdownInput } from "@/sanity/components/product-color-dropdown-input";
import { ProductSizeDropdownInput } from "@/sanity/components/product-size-dropdown-input";

export const flashSaleSettings = defineType({
  name: "flashSaleSettings",
  title: "Flash sale",
  type: "document",
  initialValue: {
    enabled: false,
    sectionEnabled: false,
    eyebrow: "Limited time",
    title: "Flash Sale",
    description: "Save on selected natOnat travel essentials before the offer ends.",
    badge: "Sale",
    discountLabel: "Limited offer",
    ctaLabel: "Shop offer",
    secondaryLabel: "Not now",
  },
  fields: [
    defineField({ name: "enabled", title: "Modal enabled", type: "boolean", initialValue: false }),
    defineField({
      name: "sectionEnabled",
      title: "Home section enabled",
      type: "boolean",
      initialValue: false,
      description: "Show this fixed-variant flash offer as a section on the home page.",
    }),
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
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.document?.sectionEnabled && !value
            ? "Select a product for the home section"
            : true,
        ),
    }),
    defineField({
      name: "selectedSize",
      title: "Only this size",
      type: "string",
      description: "Optional. The offer will add this size only.",
      components: { input: ProductSizeDropdownInput },
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.document?.sectionEnabled && !value && !context.document?.selectedColor
            ? "Choose at least one fixed size or fixed color"
            : true,
        ),
    }),
    defineField({
      name: "selectedColor",
      title: "Only this color",
      type: "string",
      description: "Optional. The offer will add this product color only.",
      components: { input: ProductColorDropdownInput },
    }),
    defineField({
      name: "salePrice",
      title: "Flash sale price",
      type: "number",
      description: "Final price for the selected size/color variant.",
      validation: (Rule) =>
        Rule.min(0).custom((value, context) =>
          context.document?.sectionEnabled && typeof value !== "number"
            ? "Enter the flash sale price"
            : true,
        ),
    }),
    defineField({
      name: "addToCartLabel",
      title: "Add to cart label",
      type: "string",
      initialValue: "Add offer to cart",
    }),
    defineField({
      name: "buyNowLabel",
      title: "Buy now label",
      type: "string",
      initialValue: "Buy offer now",
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
      title: "Flash sale",
      subtitle: "Home section and optional popup",
    }),
  },
});
