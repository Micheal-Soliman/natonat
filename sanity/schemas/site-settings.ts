import { defineArrayMember, defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "flashSale", title: "Flash sale", default: true },
    { name: "sizeGuide", title: "Size guide" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Internal title",
      type: "string",
      initialValue: "Website settings",
    }),
    defineField({
      name: "flashSale",
      title: "Home flash sale modal",
      type: "object",
      group: "flashSale",
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
    }),
    defineField({
      name: "sizeGuide",
      title: "Size guide content",
      type: "object",
      group: "sizeGuide",
      fields: [
        defineField({ name: "label", title: "Label", type: "string" }),
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({ name: "subtitle", title: "Subtitle", type: "text", rows: 2 }),
        defineField({ name: "videoTitle", title: "Video title", type: "string" }),
        defineField({ name: "videoSubtitle", title: "Video subtitle", type: "string" }),
        defineField({ name: "videoDuration", title: "Video duration label", type: "string" }),
        defineField({ name: "videoUrl", title: "Video URL", type: "url" }),
        defineField({ name: "videoFile", title: "Uploaded video file", type: "file" }),
        defineField({
          name: "poster",
          title: "Video poster image",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "tips",
          title: "Video tips",
          type: "array",
          of: [defineArrayMember({ type: "string" })],
          validation: (Rule) => Rule.max(3),
        }),
        defineField({
          name: "sizes",
          title: "Size numbers",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              fields: [
                defineField({ name: "size", title: "Size", type: "string" }),
                defineField({ name: "cm", title: "Centimeters", type: "string" }),
                defineField({ name: "inch", title: "Inches", type: "string" }),
                defineField({ name: "type", title: "Type label", type: "string" }),
                defineField({ name: "note", title: "Note", type: "string" }),
              ],
              preview: {
                select: {
                  title: "size",
                  subtitle: "cm",
                },
              },
            }),
          ],
        }),
        defineField({ name: "note", title: "Size guide note", type: "text", rows: 2 }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({
      title: "Site settings",
      subtitle: "Flash sale modal and size guide",
    }),
  },
});
