// app/api/products/[slug]/route.ts — placeholder
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  return NextResponse.json({ slug: params.slug, product: null });
}
