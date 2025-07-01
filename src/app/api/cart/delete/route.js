import { connectMongoDB } from "../../../../../lib/mongodb";
import Cart from "../../../../../models/Cart";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectMongoDB();
  const { userId, productId } = await req.json();

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return NextResponse.json({ message: "ไม่พบตะกร้า" }, { status: 404 });

    cart.items = cart.items.filter(item => item.productId !== productId);
    await cart.save();

    return NextResponse.json({ message: "ลบสินค้าเรียบร้อย" });
  } catch (error) {
    console.error("ลบสินค้าไม่สำเร็จ:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
