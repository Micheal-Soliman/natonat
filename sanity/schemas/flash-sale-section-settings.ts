import { defineArrayMember, defineField, defineType } from "sanity";

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
      name: "offers",
      title: "Flash sale products",
      type: "array",
      description: "Add products and lock a different size/color for each offer.",
      of: [
        defineArrayMember({
          type: "object",
          name: "flashSaleOffer",
          title: "Flash sale product",
          fields: [
            defineField({
              name: "product",
              title: "Product",
              type: "reference",
              to: [{ type: "product" }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "selectedSize",
              title: "Only this size",
              type: "string",
              description: "Optional. The offer will add this size only.",
              components: { input: ProductSizeDropdownInput },
              validation: (Rule) =>
                Rule.custom((value, context) => {
                  const parent = context.parent as { selectedColor?: string } | undefined;
                  return !value && !parent?.selectedColor
                    ? "Choose at least one fixed size or fixed color"
                    : true;
                }),
            }),
            defineField({
              name: "selectedColor",
              title: "Only this color",
              type: "string",
              description: "Optional. The offer will add this product color only.",
              components: { input: ProductColorDropdownInput },
            }),
            defineField({
              name: "image",
              title: "Custom product image",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: {
              title: "product.name",
              size: "selectedSize",
              color: "selectedColor",
              media: "product.mainImage",
            },
            prepare: ({ title, size, color, media }) => ({
              title: title || "Select product",
              subtitle: [size ? String(size).toUpperCase() : "", color || ""]
                .filter(Boolean)
                .join(" · "),
              media,
            }),
          },
        }),
      ],
      validation: (Rule) =>
        Rule.max(12).custom((offers, context) =>
          context.document?.enabled && (!Array.isArray(offers) || offers.length === 0)
            ? "Add at least one flash sale product"
            : true,
        ),
    }),
    defineField({ name: "addToCartLabel", title: "Add to cart label", type: "string" }),
    defineField({ name: "buyNowLabel", title: "Buy now label", type: "string" }),
  ],
  preview: {
    prepare: () => ({
      title: "Flash sale section",
      subtitle: "Fixed product size/color offer",
    }),
  },
});
