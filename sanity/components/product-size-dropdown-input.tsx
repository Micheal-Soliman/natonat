"use client";

import { useEffect, useState } from "react";
import {
  PatchEvent,
  set,
  unset,
  useClient,
  useFormValue,
  type StringInputProps,
} from "sanity";

type ProductSizes = {
  size?: string;
  sizePrices?: Record<string, unknown>;
};

export function ProductSizeDropdownInput({ value, onChange }: StringInputProps) {
  const client = useClient({ apiVersion: "2026-06-04" });
  const productReference = useFormValue(["product"]) as { _ref?: string } | undefined;
  const [sizes, setSizes] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!productReference?._ref) return;

    client
      .fetch<ProductSizes | null>(`*[_id == $id][0]{size, sizePrices}`, {
        id: productReference._ref.replace(/^drafts\./, ""),
      })
      .then((product) => {
        if (cancelled) return;
        const priceSizes = Object.keys(product?.sizePrices || {}).filter(
          (size) => product?.sizePrices?.[size],
        );
        setSizes(priceSizes.length ? priceSizes : product?.size ? [product.size.toLowerCase()] : []);
      })
      .catch(() => {
        if (!cancelled) setSizes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [client, productReference?._ref]);

  const visibleSizes = productReference?._ref ? sizes : [];

  return (
    <select
      value={typeof value === "string" ? value : ""}
      disabled={!productReference?._ref || visibleSizes.length === 0}
      onChange={(event) => {
        const nextValue = event.currentTarget.value;
        onChange(PatchEvent.from(nextValue ? set(nextValue) : unset()));
      }}
      style={{
        width: "100%",
        minHeight: 38,
        border: "1px solid var(--card-border-color)",
        borderRadius: 3,
        background: "var(--card-bg-color)",
        color: "var(--card-fg-color)",
        padding: "0 11px",
      }}
    >
      <option value="">
        {!productReference?._ref
          ? "Select a product first"
          : visibleSizes.length
            ? "No fixed size"
            : "This product has no size options"}
      </option>
      {visibleSizes.map((size) => (
        <option key={size} value={size}>
          {size.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
