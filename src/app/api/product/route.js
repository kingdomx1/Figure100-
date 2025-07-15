// /app/api/products/route.js
import { connectMongoDB } from "../../../../lib/mongodb";
import Product from "../../../../models/Product";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectMongoDB();

  const { searchParams } = new URL(req.url);
  const studio = searchParams.get("studio");
  const title = searchParams.get("title");
  const scale = searchParams.get("scale");

  const filter = {};
  if (studio) filter.studio = studio;
  if (title) filter.title = title;
  if (scale) filter.scale = scale;

  const products = await Product.find(filter).sort({ createdAt: -1 });

  return NextResponse.json(products);
}
