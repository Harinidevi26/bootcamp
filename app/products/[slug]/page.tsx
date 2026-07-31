import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  slug: string;
}

// Helper to fetch the product by slug from the local API route
async function getProduct(slug: string): Promise<Product | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product;
  } catch (error) {
    console.error("Failed to fetch product from API", error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} | ShopSphere`,
      description: product.description,
      images: [{ url: product.image_url }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ShopSphere`,
      description: product.description,
      images: [product.image_url],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/products"
          className="mb-8 inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          &larr; Back to all products
        </Link>
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2">
          {/* Product Image */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface aspect-square">
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-center">
            <span className="inline-flex self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {product.category}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-2xl font-semibold text-foreground">
              ${product.price.toFixed(2)}
            </p>
            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <p className="text-base text-muted leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="mt-8">
              <button
                className="
                  flex w-full items-center justify-center rounded-xl bg-primary px-8 py-4
                  text-base font-medium text-primary-foreground hover:opacity-90
                  transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/40
                  sm:w-auto
                "
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
