"use client";

import { Star, Quote } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Ahmed M.",
    location: "Cairo, Egypt",
    rating: 5,
    text: "The sizing system is genius! No more guessing. My cover fits perfectly and I've received so many compliments at the airport.",
    product: "Geo Print Cover - M",
  },
  {
    id: 2,
    name: "Sarah K.",
    location: "Dubai, UAE",
    rating: 5,
    text: "Finally, a brand that understands premium quality at fair prices. The RFID wallet is beautifully crafted and the leather feels amazing.",
    product: "Classic Leather Wallet",
  },
  {
    id: 3,
    name: "Mohamed R.",
    location: "Riyadh, KSA",
    rating: 5,
    text: "Bought the family bundle for our trip to Europe. Saved money and everyone loved their matching covers. Highly recommended!",
    product: "Family Pack Bundle",
  },
  {
    id: 4,
    name: "Layla H.",
    location: "Amman, Jordan",
    rating: 4,
    text: "My suitcase looks brand new even after 10+ trips. The washable feature is a game changer for frequent travelers.",
    product: "Floral Design Cover - L",
  },
];

export function SocialProof() {
  return (
    <section className="py-20 bg-[#F1EBE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#EEBC3F] text-sm font-semibold uppercase tracking-wider">
            Trusted by Travelers
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-2 mb-4">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-5 h-5 fill-[#EEBC3F] text-[#EEBC3F]"
                />
              ))}
            </div>
            <span className="text-[#0F1A26]/60 text-sm">
              4.5/5 from 2,000+ reviews
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-6 border border-[#0F1A26]/10 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-[#EEBC3F] text-[#EEBC3F]"
                  />
                ))}
              </div>

              <div className="relative mb-4">
                <Quote className="absolute -top-2 -left-2 w-6 h-6 text-[#EEBC3F]/30" />
                <p className="text-[#0F1A26]/80 text-sm leading-relaxed relative z-10">
                  "{review.text}"
                </p>
              </div>

              <div className="border-t border-[#0F1A26]/10 pt-4 mt-4">
                <p className="text-[#0F1A26] font-medium text-sm">{review.name}</p>
                <p className="text-[#0F1A26]/50 text-xs">{review.location}</p>
                <p className="text-[#EEBC3F] text-xs mt-1">{review.product}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Platform badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          <p className="text-[#0F1A26]/50 text-sm w-full text-center mb-4">
            Available on leading marketplaces
          </p>
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg border border-[#0F1A26]/10">
            <span className="font-bold text-[#0F1A26]">amazon</span>
            <span className="text-[#0F1A26]/60 text-sm">4.5★</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg border border-[#0F1A26]/10">
            <span className="font-bold text-[#0F1A26]">noon</span>
            <span className="text-[#0F1A26]/60 text-sm">4.4★</span>
          </div>
        </div>
      </div>
    </section>
  );
}
