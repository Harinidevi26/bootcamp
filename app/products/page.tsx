import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Shop All Products",
};

export default function ProductsPage() {
  return <ProductsClient />;
}
