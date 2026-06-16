import { PatchEvent, set, unset } from "sanity";

import { categoryOptions } from "@/sanity/schemas/category-options";

type CategoryDropdownInputProps = {
  value?: Array<string | number | boolean>;
  onChange: (event: PatchEvent) => void;
};

export function CategoryDropdownInput({
  value,
  onChange,
}: CategoryDropdownInputProps) {
  const selectedValue = Array.isArray(value) ? String(value[0] || "") : "";

  return (
    <div>
      <select
        value={selectedValue}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          onChange(PatchEvent.from(nextValue ? set([nextValue]) : unset()));
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
        <option value="">Select category...</option>
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.title}
          </option>
        ))}
      </select>

      {Array.isArray(value) && value.length > 1 && (
        <p style={{ color: "var(--card-muted-fg-color)", fontSize: 12 }}>
          This product has multiple saved categories. Selecting a category will
          keep one category only.
        </p>
      )}
    </div>
  );
}
