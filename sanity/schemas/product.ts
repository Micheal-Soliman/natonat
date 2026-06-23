import { defineArrayMember, defineField, defineType } from "sanity";

import { CategoryDropdownInput } from "@/sanity/components/category-dropdown-input";
import { categoryOptions } from "./category-options";

const sizeOptions = [
  { title: "S", value: "s" },
  { title: "M", value: "m" },
  { title: "L", value: "l" },
  { title: "XL", value: "xl" },
];

const themeOptions = [
  { title: "Minimal", value: "minimal" },
  { title: "Fun", value: "fun" },
  { title: "Travel Icons", value: "travel-icons" },
];

const pricePairFields = [
  defineField({
    name: "price",
    title: "Price",
    type: "number",
    validation: (Rule) => Rule.min(0),
  }),
  defineField({
    name: "originalPrice",
    title: "Original price",
    type: "number",
    validation: (Rule) => Rule.min(0),
  }),
];

const stockFields = [
  defineField({
    name: "status",
    title: "Status",
    type: "string",
    initialValue: "in_stock",
    options: {
      layout: "radio",
      list: [
        { title: "In stock", value: "in_stock" },
        { title: "Low stock", value: "low_stock" },
        { title: "Out of stock", value: "out_of_stock" },
      ],
    },
  }),
  defineField({
    name: "quantity",
    title: "Quantity",
    type: "number",
    description: "Optional. If this is 0, this size is treated as out of stock.",
    validation: (Rule) => Rule.min(0).integer(),
  }),
];

export const product = defineType({
  name: "product",
  title: "Products",
  type: "document",
  groups: [
    { name: "basic", title: "Basic", default: true },
    { name: "pricing", title: "Pricing" },
    { name: "inventory", title: "Inventory" },
    { name: "content", title: "Content" },
    { name: "media", title: "Media" },
    { name: "bundle", title: "Bundle" },
  ],
  initialValue: {
    isActive: true,
    isBundle: false,
    dynamicPricing: false,
    stockStatus: "in_stock",
    sortOrder: 0,
  },
  fields: [
    defineField({
      name: "legacyId",
      title: "Legacy product ID",
      type: "number",
      group: "basic",
      description: "Matches the current id in lib/products.ts.",
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      group: "basic",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "basic",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Visible on site",
      type: "boolean",
      group: "basic",
      initialValue: true,
    }),
    defineField({
      name: "category",
      title: "Categories",
      type: "array",
      group: "basic",
      of: [defineArrayMember({ type: "string" })],
      options: {
        list: categoryOptions,
      },
      components: {
        input: CategoryDropdownInput,
      },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "type",
      title: "Product type label",
      type: "string",
      group: "basic",
      description: "Example: Luggage Cover, Passport Wallet, Bundle.",
    }),
    defineField({
      name: "tag",
      title: "Badge",
      type: "string",
      group: "basic",
      options: {
        list: [
          { title: "Best Seller", value: "Best Seller" },
          { title: "New", value: "New" },
          { title: "Limited", value: "Limited" },
        ],
      },
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      group: "pricing",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "originalPrice",
      title: "Original price",
      type: "number",
      group: "pricing",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "stockStatus",
      title: "Stock status",
      type: "string",
      group: "inventory",
      initialValue: "in_stock",
      options: {
        layout: "radio",
        list: [
          { title: "In stock", value: "in_stock" },
          { title: "Low stock", value: "low_stock" },
          { title: "Out of stock", value: "out_of_stock" },
        ],
      },
    }),
    defineField({
      name: "stockQuantity",
      title: "Stock quantity",
      type: "number",
      group: "inventory",
      description: "Optional internal quantity. Leave empty if you only want to use the stock status.",
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: "sizeStock",
      title: "Stock by size",
      type: "object",
      group: "inventory",
      description: "Control availability for each size. Empty sizes stay available unless the whole product is out of stock.",
      fields: sizeOptions.map((size) =>
        defineField({
          name: size.value,
          title: size.title,
          type: "object",
          fields: stockFields,
        }),
      ),
    }),
    defineField({
      name: "description",
      title: "Short description",
      type: "text",
      group: "content",
      rows: 3,
    }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "relatedProducts",
      title: "Related products",
      type: "array",
      group: "content",
      description:
        "Choose the products to show first in the Related Products section. The site fills any empty slots automatically.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "product" }],
        }),
      ],
      validation: (Rule) => Rule.unique().max(4),
    }),
    defineField({
      name: "size",
      title: "Default size",
      type: "string",
      group: "pricing",
      options: {
        list: sizeOptions,
      },
    }),
    defineField({
      name: "sizePrices",
      title: "Size pricing",
      type: "object",
      group: "pricing",
      fields: sizeOptions.map((size) =>
        defineField({
          name: size.value,
          title: size.title,
          type: "object",
          fields: pricePairFields,
        }),
      ),
    }),
    defineField({
      name: "theme",
      title: "Theme",
      type: "string",
      group: "content",
      options: {
        list: themeOptions,
      },
    }),
    defineField({
      name: "color",
      title: "Default color",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "colors",
      title: "Color variants",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "id", title: "ID", type: "string" }),
            defineField({ name: "name", title: "Name", type: "string" }),
            defineField({
              name: "imageUrl",
              title: "Current local image URL",
              type: "string",
            }),
            defineField({
              name: "image",
              title: "Sanity image",
              type: "image",
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: {
              title: "name",
              subtitle: "id",
              media: "image",
            },
          },
        }),
      ],
    }),
    defineField({
      name: "imageUrl",
      title: "Current main image URL",
      type: "string",
      group: "media",
      description: "Keeps compatibility with existing public folder URLs.",
    }),
    defineField({
      name: "mainImage",
      title: "Sanity main image",
      type: "image",
      group: "media",
      options: { hotspot: true },
    }),
    defineField({
      name: "galleryUrls",
      title: "Current gallery URLs",
      type: "array",
      group: "media",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "galleryImages",
      title: "Sanity gallery images",
      type: "array",
      group: "media",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
        }),
      ],
    }),
    defineField({
      name: "gender",
      title: "Gender filter",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "string" })],
      options: {
        list: [
          { title: "Male", value: "male" },
          { title: "Female", value: "female" },
          { title: "Unisex", value: "unisex" },
        ],
        layout: "tags",
      },
    }),
    defineField({
      name: "collection",
      title: "Collection",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Sports", value: "sports" },
          { title: "Pharaoh", value: "pharaoh" },
        ],
      },
    }),
    defineField({
      name: "printType",
      title: "Print type",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Plain", value: "plain" },
          { title: "Printed", value: "printed" },
        ],
      },
    }),
    defineField({
      name: "isBundle",
      title: "Bundle",
      type: "boolean",
      group: "bundle",
      initialValue: false,
    }),
    defineField({
      name: "bundleItems",
      title: "Bundle items",
      type: "array",
      group: "bundle",
      hidden: ({ document }) => !document?.isBundle,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "product",
              title: "Product reference",
              type: "reference",
              to: [{ type: "product" }],
            }),
            defineField({
              name: "legacyProductIds",
              title: "Legacy product IDs",
              type: "array",
              of: [defineArrayMember({ type: "number" })],
            }),
            defineField({
              name: "quantity",
              title: "Quantity",
              type: "number",
              initialValue: 1,
              validation: (Rule) => Rule.required().integer().min(1),
            }),
            defineField({
              name: "label",
              title: "Label",
              type: "string",
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "dynamicPricing",
      title: "Dynamic pricing",
      type: "boolean",
      group: "pricing",
      initialValue: false,
    }),
    defineField({
      name: "pricingRule",
      title: "Pricing rule",
      type: "string",
      group: "pricing",
      options: {
        list: [
          { title: "PackOnat 10% off", value: "packonat_10_percent_off" },
          { title: "Cover 8% off", value: "cover_8_percent_off" },
          { title: "Passport + Cover 15% off", value: "passport_cover_15_percent_off" },
          { title: "Total 8% off", value: "total_8_percent_off" },
          { title: "Total 10% off", value: "total_10_percent_off" },
          { title: "Second cheapest 5% off", value: "second_cheapest_5_percent_off" },
        ],
      },
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      group: "basic",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Sort order",
      name: "sortOrderAsc",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
    {
      title: "Legacy ID",
      name: "legacyIdAsc",
      by: [{ field: "legacyId", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "type",
      legacyId: "legacyId",
      slug: "slug.current",
      media: "mainImage",
    },
    prepare({ title, subtitle, legacyId, slug, media }) {
      return {
        title: title || slug || `Product ${legacyId || ""}`.trim() || "Untitled product",
        subtitle: [subtitle, legacyId ? `ID ${legacyId}` : null].filter(Boolean).join(" - "),
        media,
      };
    },
  },
});
