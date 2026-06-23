import { defineField, defineType } from "sanity";

import { ProductColorDropdownInput } from "@/sanity/components/product-color-dropdown-input";
import { ProductSizeDropdownInput } from "@/sanity/components/product-size-dropdown-input";

export const flashSaleSectionSettings = defineType({
  name: "flashSaleSectionSettings",
  title: "Flash sale section",
  type: "document",
  initialValue: {
    enabled: false,
    eyebrow: "Limited time",
    title: "Flash Sale",
    description: "One selected option at a special price for a limited time.",
    badge: "Sale",
    discountLabel: "Offer ends in",
    addToCartLabel: "Add offer to cart",
    buyNowLabel: "Buy offer now",
  },
  fields: [
    defineField({ name: "enabled", title: "Section enabled", type: "boolean", initialValue: false }),
    defineField({ name: "eyebrow", title: "Small label", type: "string" }),
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({ name: "badge", title: "Badge", type: "string" }),
    defineField({ name: "discountLabel", title: "Countdown label", type: "string" }),
    defineField({ name: "endsAt", title: "Countdown end time", type: "datetime" }),
    defineField({
      name: "product",
      title: "Sale product",
      type: "reference",
      to: [{ type: "product" }],
      validation: (Rule) =>
        Rule.custom((value, context) =>
          context.document?.enabled && !value ? "Select a product for the section" : true,
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
          context.document?.enabled && !value && !context.document?.selectedColor
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
          context.document?.enabled && typeof value !== "number"
            ? "Enter the flash sale price"
            : true,
        ),
    }),
    defineField({ name: "addToCartLabel", title: "Add to cart label", type: "string" }),
    defineField({ name: "buyNowLabel", title: "Buy now label", type: "string" }),
    defineField({
      name: "image",
      title: "Custom section image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Flash sale section",
      subtitle: "Fixed product size/color offer",
    }),
  },
});
