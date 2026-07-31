import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";

/** Shape passed to each ProductCard */
interface Product {
  slug: string;
  name: string;
  price: number;
  image: string;
}

const FEATURED_PRODUCTS: Product[] = [
  {
    slug: "wireless-noise-cancelling-headphones",
    name: "Wireless Noise-Cancelling Headphones",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
  },
  {
    slug: "minimalist-leather-watch",
    name: "Minimalist Leather Watch",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
  },
  {
    slug: "premium-running-sneakers",
    name: "Premium Running Sneakers",
    price: 94.99,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  },
  {
    slug: "portable-bluetooth-speaker",
    name: "Portable Bluetooth Speaker",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80",
  },
  {
    slug: "smart-fitness-tracker",
    name: "Smart Fitness Tracker",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&q=80",
  },
  {
    slug: "canvas-backpack",
    name: "Canvas Backpack",
    price: 44.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
  },
  {
    slug: "ceramic-coffee-mug",
    name: "Ceramic Coffee Mug",
    price: 19.99,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80",
  },
  {
    slug: "mechanical-keyboard",
    name: "Mechanical Keyboard",
    price: 109.99,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Top navigation ── */}
      <Navbar />

      {/* ── Hero banner ── */}
      <Hero />

      {/* ── Featured Products ── */}
      <main id="featured-products" className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Featured Products
            </h2>
            <p className="mt-3 text-base text-muted sm:text-lg">
              Hand-picked favourites — fresh in and flying off the shelves.
            </p>
          </div>

          {/* Responsive product grid: 1 col → 2 sm → 3 md → 4 lg */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {FEATURED_PRODUCTS.map((product) => (
              <ProductCard
                key={product.slug}
                {...product}
              />
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
