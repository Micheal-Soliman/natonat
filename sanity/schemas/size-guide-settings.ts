import { defineArrayMember, defineField, defineType } from "sanity";

export const sizeGuideSettings = defineType({
  name: "sizeGuideSettings",
  title: "Size guide",
  type: "document",
  initialValue: {
    label: "Size video",
    title: "Size Guide",
    subtitle: "Measure your suitcase height only, excluding wheels.",
    videoTitle: "How to measure your suitcase",
    videoSubtitle: "Measure height only, excluding wheels.",
    videoDuration: "20 sec",
    videoUrl: "/size.mp4",
    tips: ["Measure height only", "Exclude wheels"],
    sizes: [
      {
        _key: "size-s",
        size: "S",
        cm: "45-53",
        inch: "18-21",
        type: "Carry-on",
        note: "Height only",
      },
      {
        _key: "size-m",
        size: "M",
        cm: "55-63",
        inch: "22-25",
        type: "Medium",
        note: "Height only",
      },
      {
        _key: "size-l",
        size: "L",
        cm: "65-70",
        inch: "26-28",
        type: "Large",
        note: "Height only",
      },
      {
        _key: "size-xl",
        size: "XL",
        cm: "72-81",
        inch: "29-32",
        type: "Extra Large",
        note: "Height only",
      },
    ],
    note: "Measure height only, excluding wheels.",
  },
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
  preview: {
    prepare: () => ({
      title: "Size guide",
      subtitle: "Size numbers and size guide video",
    }),
  },
});
