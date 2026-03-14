"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { products } from "@/lib/products";
import { useCart } from "@/app/lib/cart-context";
import { SizeModal } from "@/app/components/size-modal";

// Get bundle products from lib/products
const bundles = products.filter(p => p.category === "bundles").slice(0, 4);

export function TravelSets() {
  const { addToCart } = useCart();
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof bundles[0] | null>(null);
  return (
    <section className="py-20 bg-[#F1EBE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#EEBC3F] text-sm font-semibold uppercase tracking-wider">
            Save More
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-2 mb-4">
            Travel Smarter with Bundles
          </h2>
          <p className="text-[#0F1A26]/60 max-w-2xl mx-auto">
            Complete travel sets designed for every type of journey. Save up to 30% when you bundle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="group bg-white rounded-2xl overflow-hidden border border-[#0F1A26]/10 hover:border-[#EEBC3F] transition-all hover:shadow-xl flex flex-col h-full"
            >
              {/* Bundle Image */}
              <Link href={`/product/${bundle.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={bundle.image} 
                    alt={bundle.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[#EEBC3F] text-xs font-bold tracking-wider uppercase bg-[#0F1A26]/80 px-3 py-1 rounded-full">
                      Save EGP {bundle.originalPrice - bundle.price}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-[#0F1A26] mb-2 line-clamp-1">
                  {bundle.name}
                </h3>
                <p className="text-[#0F1A26]/60 text-sm mb-4 line-clamp-2 flex-grow">
                  {bundle.description}
                </p>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-[#0F1A26]">
                    EGP {bundle.price}
                  </span>
                  <span className="text-sm text-[#0F1A26]/40 line-through">
                    EGP {bundle.originalPrice}
                  </span>
                </div>

                <Button
                  onClick={() => {
                    if (bundle.category === "luggage-covers") {
                      setSelectedProduct(bundle);
                      setSizeModalOpen(true);
                    } else {
                      addToCart({
                        id: bundle.id,
                        name: bundle.name,
                        type: bundle.type,
                        price: bundle.price,
                        originalPrice: bundle.originalPrice,
                        image: bundle.image,
                        quantity: 1,
                      });
                    }
                  }}
                  className="w-full bg-[#0F1A26] text-[#F1EBE3] hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-all duration-300 mt-auto"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            className="border-[#0F1A26] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-[#F1EBE3]"
          >
            <Link href="/shop?category=bundles">View All Bundles</Link>
          </Button>
        </div>
      </div>

      {/* Size Selection Modal */}
      <SizeModal
        isOpen={sizeModalOpen}
        onClose={() => {
          setSizeModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={(size) => {
          if (selectedProduct) {
            addToCart({
              id: selectedProduct.id,
              name: selectedProduct.name,
              type: selectedProduct.type,
              price: selectedProduct.price,
              originalPrice: selectedProduct.originalPrice,
              image: selectedProduct.image,
              size: size,
              quantity: 1,
            });
          }
          setSizeModalOpen(false);
          setSelectedProduct(null);
        }}
        productName={selectedProduct?.name || ""}
      />
    </section>
  );
}
