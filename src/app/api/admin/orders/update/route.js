import { connectMongoDB } from "../../../../../../lib/mongodb";
import Order from "../../../../../../models/Order";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectMongoDB();

  try {
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: "ไม่พบคำสั่งซื้อนั้น" }, { status: 404 });
    }

    order.status = status;
    await order.save();

    return NextResponse.json({ message: "อัปเดตสถานะสำเร็จ", order });
  } catch (error) {
    console.error("❌ อัปเดตสถานะล้มเหลว:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" }, { status: 500 });
  }
}