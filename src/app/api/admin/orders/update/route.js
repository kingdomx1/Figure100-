import { connectMongoDB } from "../../../../../../lib/mongodb";
import Order from "../../../../../../models/Order";
import Product from "../../../../../../models/Product";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoDB();

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ message: "❌ ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const allowedStatuses = ["รอการยืนยัน", "จัดส่งเรียบร้อย", "ยกเลิก"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ message: "❌ สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: "❌ ไม่พบคำสั่งซื้อนั้น" }, { status: 404 });
    }

    let stockWarnings = [];

    if (status === "จัดส่งเรียบร้อย") {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock -= item.quantity;

          if (product.stock < 0) {
            return NextResponse.json({
              message: `❌ สินค้า "${product.name}" มีสต็อกไม่เพียงพอ`,
            }, { status: 400 });
          }

          await product.save();

          // เก็บข้อความแจ้งเตือน
          stockWarnings.push(`📦 ${product.name}: เหลือ ${product.stock} ชิ้น`);
        }
      }
    }

    order.status = status;
    await order.save();

    return NextResponse.json({
      message: "✅ อัปเดตสถานะสำเร็จ",
      order,
      stockWarnings,
    });
  } catch (error) {
    console.error("❌ อัปเดตสถานะล้มเหลว:", error);
    return NextResponse.json({ message: "❌ เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
