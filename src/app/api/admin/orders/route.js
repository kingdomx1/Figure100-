import { connectMongoDB } from "../../../../../lib/mongodb";
import Order from "../../../../../models/Order";
import { NextResponse } from "next/server";

export async function GET() {
  await connectMongoDB();

  try {
    const orders = await Order.find({ status: { $ne: "จัดส่งเรียบร้อย" } }).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ message: "โหลดคำสั่งซื้อไม่สำเร็จ" }, { status: 500 });
  }
}