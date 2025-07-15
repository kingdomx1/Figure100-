import { connectMongoDB } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectMongoDB();

  const { searchParams } = new URL(req.url);
  const userEmail = searchParams.get("user");

  if (!userEmail) {
    return NextResponse.json(
      { error: "กรุณาระบุผู้ใช้งาน (user)" },
      { status: 400 }
    );
  }

  try {
    const orders = await Order.find({ user: userEmail }).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: "ไม่สามารถโหลดคำสั่งซื้อได้" },
      { status: 500 }
    );
  }
}
