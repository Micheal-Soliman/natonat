import { defineArrayMember, defineField, defineType } from "sanity";

export const referralRecord = defineType({
  name: "referralRecord",
  title: "Referral record",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Referral code",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "referrerName",
      title: "Referrer name",
      type: "string",
    }),
    defineField({
      name: "referrerPhone",
      title: "Referrer phone",
      type: "string",
    }),
    defineField({
      name: "referrerEmail",
      title: "Referrer email",
      type: "string",
    }),
    defineField({
      name: "sourceOrderRef",
      title: "Source order reference",
      type: "string",
      description: "The order that created this referral code.",
    }),
    defineField({
      name: "uses",
      title: "Confirmed referrals",
      type: "number",
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: "rewardCodes",
      title: "Generated reward codes",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "orderRef", title: "Referred order", type: "string" }),
            defineField({ name: "code", title: "Reward code", type: "string" }),
            defineField({ name: "value", title: "Reward value", type: "number" }),
            defineField({ name: "createdAt", title: "Created at", type: "datetime" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "conversions",
      title: "Conversions",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "orderRef", title: "Order reference", type: "string" }),
            defineField({ name: "customerName", title: "Customer name", type: "string" }),
            defineField({ name: "customerPhone", title: "Customer phone", type: "string" }),
            defineField({ name: "amountEgp", title: "Order amount EGP", type: "number" }),
            defineField({ name: "discountEgp", title: "Customer discount EGP", type: "number" }),
            defineField({ name: "rewardCode", title: "Reward code", type: "string" }),
            defineField({ name: "confirmedAt", title: "Confirmed at", type: "datetime" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "code",
      name: "referrerName",
      phone: "referrerPhone",
      uses: "uses",
      isActive: "isActive",
    },
    prepare({ title, name, phone, uses, isActive }) {
      return {
        title: `${title || "Referral"} ${isActive === false ? "(inactive)" : ""}`,
        subtitle: [name, phone, `${uses || 0} confirmed`].filter(Boolean).join(" - "),
      };
    },
  },
});
