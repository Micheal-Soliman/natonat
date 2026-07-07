import { defineField, defineType } from "sanity";

export const referralProgram = defineType({
  name: "referralProgram",
  title: "Referral program",
  type: "document",
  fields: [
    defineField({
      name: "isEnabled",
      title: "Enable referral system",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "friendDiscountPercent",
      title: "New customer discount %",
      type: "number",
      initialValue: 5,
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: "referrerRewardPercent",
      title: "Referrer reward %",
      type: "number",
      initialValue: 5,
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: "minimumSubtotalEgp",
      title: "Minimum subtotal in EGP",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "maxFriendDiscountEgp",
      title: "Max new customer discount in EGP",
      type: "number",
      description: "Optional cap. Leave empty or 0 for no cap.",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "maxRewardDiscountEgp",
      title: "Max referrer reward in EGP",
      type: "number",
      description: "Optional cap for generated reward codes.",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "rewardExpiryDays",
      title: "Reward code expiry days",
      type: "number",
      initialValue: 30,
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: "combineFriendDiscountWithPaymentDiscount",
      title: "Referral discount can combine with payment discount",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "customerMessage",
      title: "Checkout success message",
      type: "string",
      initialValue: "Referral discount applied.",
    }),
  ],
  preview: {
    select: {
      isEnabled: "isEnabled",
      friendDiscountPercent: "friendDiscountPercent",
      referrerRewardPercent: "referrerRewardPercent",
    },
    prepare({ isEnabled, friendDiscountPercent, referrerRewardPercent }) {
      return {
        title: `Referral program ${isEnabled ? "enabled" : "disabled"}`,
        subtitle: `Friend ${friendDiscountPercent || 0}% / Referrer ${referrerRewardPercent || 0}%`,
      };
    },
  },
});
