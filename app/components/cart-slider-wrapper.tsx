"use client";

import dynamic from "next/dynamic";

const CartSlider = dynamic(
  () => import("./cart-slider").then((mod) => mod.CartSlider),
  {
    ssr: false,
    loading: () => null,
  },
);

export function CartSliderWrapper() {
  return <CartSlider />;
}
