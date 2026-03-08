import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import Link from "next/link";
import { products, getProductBySlug } from "@/lib/products";
import ProductPageContent from "./product-content";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  
  // If product not found, show error or redirect
  if (!product) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3] pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-[#0F1A26] mb-4">Product Not Found</h1>
            <Link href="/shop" className="text-[#EEBC3F] hover:underline">
              Back to Shop
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  // Get prev/next products for navigation
  const currentProductIndex = products.findIndex((p) => p.id === product.id);
  const prevProduct = currentProductIndex > 0 ? products[currentProductIndex - 1] : null;
  const nextProduct = currentProductIndex < products.length - 1 ? products[currentProductIndex + 1] : null;

  return (
    <ProductPageContent 
      product={product} 
      prevProduct={prevProduct} 
      nextProduct={nextProduct} 
    />
  );
}
