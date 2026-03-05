"use client";

import Link from "next/link";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Package, Truck, Shield, X } from "lucide-react";
import { useCart } from "@/app/lib/cart-context";

interface GroupedItem {
  id: number;
  name: string;
  type: string;
  price: number;
  originalPrice?: number;
  image: string;
  variants: {
    size?: string;
    color?: string;
    quantity: number;
  }[];
}

function groupCartItems(items: ReturnType<typeof useCart>['items']): GroupedItem[] {
  const grouped = new Map<number, GroupedItem>();
  
  items.forEach((item) => {
    if (!grouped.has(item.id)) {
      grouped.set(item.id, {
        id: item.id,
        name: item.name,
        type: item.type,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        variants: [],
      });
    }
    
    const group = grouped.get(item.id)!;
    group.variants.push({
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    });
  });
  
  return Array.from(grouped.values());
}

function getTotalQuantity(variants: GroupedItem['variants']) {
  return variants.reduce((sum, v) => sum + v.quantity, 0);
}

function getTotalPrice(price: number, variants: GroupedItem['variants']) {
  return price * getTotalQuantity(variants);
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, subtotal } = useCart();
  const groupedItems = groupCartItems(items);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Header - Clean */}
        <div className="bg-[#0F1A26] pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
              Your <span className="text-[#EEBC3F]">Cart</span>
            </h1>
            <p className="text-white/50 mt-4 max-w-xl mx-auto font-light text-lg">
              Review your items and proceed to checkout
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-[#0F1A26]/5 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-[#0F1A26]/30" />
              </div>
              <h2 className="text-xl font-semibold text-[#0F1A26] mb-2">Your cart is empty</h2>
              <p className="text-[#0F1A26]/50 mb-6">Start shopping to add items to your cart</p>
              <Link href="/shop">
                <Button className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full px-8 h-12 font-semibold transition-all duration-300">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#0F1A26]">
                    Cart Items ({groupedItems.length})
                  </h2>
                  <Link 
                    href="/shop" 
                    className="text-sm text-[#EEBC3F] hover:text-[#0F1A26] font-medium flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Continue Shopping
                  </Link>
                </div>

                <div className="space-y-4">
                  {groupedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white rounded-2xl p-4 border border-[#0F1A26]/5 flex gap-4"
                    >
                      {/* Image */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#F8F6F3]">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[#EEBC3F] text-xs font-semibold tracking-wider uppercase">
                                {item.type}
                              </span>
                              <h3 className="text-[#0F1A26] font-medium mt-0.5">{item.name}</h3>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full bg-[#0F1A26]/5 flex items-center justify-center text-[#0F1A26]/50 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Sizes List */}
                          {item.variants.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.variants.map((variant, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  {variant.size && (
                                    <span className="bg-[#EEBC3F]/10 text-[#0F1A26] px-2 py-0.5 rounded text-xs font-medium">
                                      Size {variant.size.toUpperCase()}
                                    </span>
                                  )}
                                  {variant.color && (
                                    <span className="text-[#0F1A26]/60">{variant.color}</span>
                                  )}
                                  <span className="text-[#0F1A26]/50">× {variant.quantity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity - Total for all variants */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                // Decrease first variant as example
                                if (item.variants[0]) {
                                  const originalItem = items.find(i => 
                                    i.id === item.id && 
                                    i.size === item.variants[0].size && 
                                    i.color === item.variants[0].color
                                  );
                                  if (originalItem) {
                                    updateQuantity(originalItem.id, -1);
                                  }
                                }
                              }}
                              className="w-8 h-8 rounded-lg bg-[#0F1A26]/5 flex items-center justify-center text-[#0F1A26] hover:bg-[#0F1A26]/10 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium text-[#0F1A26]">
                              {getTotalQuantity(item.variants)}
                            </span>
                            <button 
                              onClick={() => {
                                // Increase first variant as example
                                if (item.variants[0]) {
                                  const originalItem = items.find(i => 
                                    i.id === item.id && 
                                    i.size === item.variants[0].size && 
                                    i.color === item.variants[0].color
                                  );
                                  if (originalItem) {
                                    updateQuantity(originalItem.id, 1);
                                  }
                                }
                              }}
                              className="w-8 h-8 rounded-lg bg-[#0F1A26]/5 flex items-center justify-center text-[#0F1A26] hover:bg-[#0F1A26]/10 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <span className="font-semibold text-[#0F1A26]">
                            EGP {getTotalPrice(item.price, item.variants)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:w-96">
                <div className="bg-white rounded-2xl p-6 border border-[#0F1A26]/5 sticky top-28">
                  <h2 className="text-lg font-semibold text-[#0F1A26] mb-6">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0F1A26]/60">Subtotal</span>
                      <span className="text-[#0F1A26] font-medium">EGP {subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0F1A26]/60">Shipping</span>
                      <span className="text-[#0F1A26] font-medium">
                        {shipping === 0 ? "Free" : `EGP ${shipping}`}
                      </span>
                    </div>
                    <div className="border-t border-[#0F1A26]/10 pt-3">
                      <div className="flex justify-between">
                        <span className="text-[#0F1A26] font-semibold">Total</span>
                        <span className="text-[#0F1A26] font-bold text-lg">EGP {total}</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <Button className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-14 font-bold text-base transition-all duration-300 mb-4">
                      Proceed to Checkout
                    </Button>
                  </Link>

                  <p className="text-xs text-[#0F1A26]/40 text-center">
                    Shipping & taxes calculated at checkout
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
