import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, "lib", "products.ts");
const outputPath = path.join(rootDir, "sanity-products.ndjson");

const source = fs.readFileSync(sourcePath, "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const sandbox = {
  exports: {},
  module: { exports: {} },
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(outputText, sandbox, { filename: sourcePath });

const products = sandbox.module.exports.products;

if (!Array.isArray(products)) {
  throw new Error("Could not read products from lib/products.ts");
}

function clean(value) {
  if (Array.isArray(value)) {
    return value.map(clean).filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, clean(item)])
        .filter(([, item]) => item !== undefined && item !== null),
    );
  }

  return value === undefined || value === null ? undefined : value;
}

function asArray(value) {
  if (!value) return undefined;
  return Array.isArray(value) ? value : [value];
}

function toSanityProduct(product, index) {
  return clean({
    _id: `product-${product.id}`,
    _type: "product",
    legacyId: product.id,
    name: product.name,
    slug: { _type: "slug", current: product.slug },
    isActive: true,
    category: asArray(product.category),
    type: product.type,
    tag: product.tag,
    price: product.price,
    originalPrice: product.originalPrice,
    description: product.description,
    features: product.features,
    size: product.size,
    sizePrices: product.sizePrices,
    theme: product.theme,
    color: product.color,
    colors: product.colors?.map((color, colorIndex) => ({
      _key: `${product.id}-color-${color.id || colorIndex}`,
      id: color.id,
      name: color.name,
      imageUrl: color.image,
    })),
    imageUrl: product.image,
    galleryUrls: product.images,
    gender: asArray(product.gender),
    collection: product.collection,
    printType: product.printType,
    isBundle: Boolean(product.isBundle),
    bundleItems: product.bundleItems?.map((item, itemIndex) => ({
      _key: `${product.id}-bundle-${itemIndex}`,
      legacyProductIds: item.productIds || asArray(item.productId),
      quantity: item.quantity,
      label: item.label,
    })),
    dynamicPricing: Boolean(product.dynamicPricing),
    pricingRule: product.pricingRule,
    sortOrder: index,
  });
}

const docs = products.map(toSanityProduct);
fs.writeFileSync(outputPath, `${docs.map((doc) => JSON.stringify(doc)).join("\n")}\n`);

console.log(`Exported ${docs.length} products to ${path.relative(rootDir, outputPath)}`);
