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

type ProductColor = {
  id?: string;
  name?: string;
};

export function ProductColorDropdownInput({ value, onChange, path }: StringInputProps) {
  const client = useClient({ apiVersion: "2026-06-04" });
  const productReference = useFormValue([...path.slice(0, -1), "product"]) as
    | { _ref?: string }
    | undefined;
  const [colors, setColors] = useState<ProductColor[]>([]);

  useEffect(() => {
    let cancelled = false;

    if (!productReference?._ref) {
      return;
    }

    client
      .fetch<ProductColor[]>(`*[_id == $id][0].colors[]{id, name}`, {
        id: productReference._ref.replace(/^drafts\./, ""),
      })
      .then((nextColors) => {
        if (!cancelled) setColors(nextColors || []);
      })
      .catch(() => {
        if (!cancelled) setColors([]);
      });

    return () => {
      cancelled = true;
    };
  }, [client, productReference?._ref]);

  const visibleColors = productReference?._ref ? colors : [];

  return (
    <select
      value={typeof value === "string" ? value : ""}
      disabled={!productReference?._ref || visibleColors.length === 0}
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
          : visibleColors.length
            ? "No fixed color"
            : "This product has no color options"}
      </option>
      {visibleColors.map((color) => (
        <option key={color.id || color.name} value={color.id || color.name}>
          {color.name || color.id}
        </option>
      ))}
    </select>
  );
}
