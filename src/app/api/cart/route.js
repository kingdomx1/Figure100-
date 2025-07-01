import { connectMongoDB } from "../../../../lib/mongodb";
import Cart from "../../../../models/Cart";
import { NextResponse } from "next/server";

export async function GET(req) {
    await connectMongoDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const cart = await Cart.findOne({ userId }) || { items: [] };
    return NextResponse.json(cart);
  }
  
  export async function POST(req) {
    await connectMongoDB();
    const { userId, product } = await req.json();
  
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });
  
    const existingItem = cart.items.find((item) => item.productId === product.productId);
    if (existingItem) existingItem.quantity += product.quantity;
    else cart.items.push(product);
  
    await cart.save();
    return NextResponse.json({ message: "เพิ่มสินค้าลงตะกร้าแล้ว" });
  }
  
  export async function DELETE(req) {
    await connectMongoDB();
    const { userId, productId } = await req.json();
    await Cart.updateOne(
      { userId },
      { $pull: { items: { productId } } }
    );
    return NextResponse.json({ message: "ลบสินค้าแล้ว" });
  }