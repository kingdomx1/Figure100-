import { connectMongoDB } from "../../../../lib/mongodb";
import Cart from "../../../../models/Cart";
import Product from "../../../../models/Product";
import Discount from "../../../../models/Discount";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectMongoDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const cart = await Cart.findOne({ userId }) || { items: [] };
  const productIds = cart.items.map((item) => item.productId);

  // ดึงข้อมูลสินค้าจาก productId ที่อยู่ในตะกร้า
  const products = await Product.find({ _id: { $in: productIds } });
  const discounts = await Discount.find({});

  // รวมข้อมูล product + discount
  const enrichedItems = cart.items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.productId);
    if (!product) return null;

    const discount = discounts.find((d) => d.title === product.title);
    const discountPercent = discount ? discount.discountPercent : 0;
    const discountedPrice = Math.round(product.price * (1 - discountPercent / 100));

    return {
      productId: product._id,
      name: product.name,
      title: product.title,
      image: product.images?.[0] || "/no-image.png",
      quantity: item.quantity,
      originalPrice: product.price,
      discountPercent,
      price: discountedPrice,
    };
  }).filter(Boolean);

  return NextResponse.json({ items: enrichedItems });
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
