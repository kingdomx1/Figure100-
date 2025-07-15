import { connectMongoDB } from "../../../../../lib/mongodb";
import Product from "../../../../../models/Product";
import { NextResponse } from "next/server";

export async function GET() {
  await connectMongoDB();
  const titles = await Product.distinct("title");
  return NextResponse.json(titles);
}