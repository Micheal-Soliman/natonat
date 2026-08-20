type ProductNameInput = {
  name: string;
  type?: string | null;
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function getProductDisplayName({ name, type }: ProductNameInput) {
  const cleanName = normalize(name);
  const cleanType = type ? normalize(type) : "";

  if (!cleanType || cleanName.toLocaleLowerCase().includes(cleanType.toLocaleLowerCase())) {
    return cleanName;
  }

  return `${cleanName} ${cleanType}`;
}

