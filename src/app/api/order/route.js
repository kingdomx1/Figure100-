import { connectMongoDB } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import { NextResponse } from "next/server";

export async function GET() {
  await connectMongoDB();

  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถโหลดคำสั่งซื้อได้" }, { status: 500 });
  }
}
