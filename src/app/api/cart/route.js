import { connectMongoDB } from "../../../../lib/mongodb";
import Cart from "../../../../models/Cart";
import Product from "../../../../models/Product";
import Discount from "../../../../models/Discount";
import { NextResponse } from "next/server";

/* ===================== helpers ===================== */
function getThailandNow() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000);
}

function endOfDayThailand(date) {
  const d = new Date(date);
  d.setUTCHours(16, 59, 59, 999); // 23:59:59 TH
  return d;
}

/* ===================== GET ===================== */
export async function GET(req) {
  await connectMongoDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const cart = await Cart.findOne({ userId }) || { items: [] };
  const productIds = cart.items.map((i) => i.productId);

  const products = await Product.find({ _id: { $in: productIds } });
  const discounts = await Discount.find({});
  const nowTH = getThailandNow();

  const items = cart.items.map((item) => {
    const product = products.find(
      (p) => p._id.toString() === item.productId
    );
    if (!product) return null;

    const discount = discounts.find((d) => {
      if (d.title !== product.title) return false;

      if (d.startDate) {
        const startTH = new Date(d.startDate.getTime() + 7 * 60 * 60 * 1000);
        if (nowTH < startTH) return false;
      }

      if (d.endDate) {
        if (nowTH > endOfDayThailand(d.endDate)) return false;
      }

      return true;
    });

    const discountPercent = discount?.discountPercent || 0;
    const finalPrice =
      discountPercent > 0
        ? Math.round(product.price * (1 - discountPercent / 100))
        : product.price;

    return {
      productId: product._id,
      name: product.name,
      title: product.title,
      image: product.images?.[0] || "",
      quantity: item.quantity,
      originalPrice: product.price,
      discountPercent,
      price: finalPrice,
      stock: product.stock,
    };
  }).filter(Boolean);

  return NextResponse.json({ items });
}

/* ===================== POST (ใส่ตะกร้า) ===================== */
export async function POST(req) {
  await connectMongoDB();
  const { userId, product } = await req.json();

  let cart = await Cart.findOne({ userId });
  if (!cart) cart = new Cart({ userId, items: [] });

  const exist = cart.items.find(
    (i) => i.productId === product.productId
  );

  if (exist) {
    exist.quantity += product.quantity;
  } else {
    cart.items.push(product);
  }

  await cart.save();
  return NextResponse.json({ success: true });
}

/* ===================== DELETE (ลบสินค้า) ===================== */
export async function DELETE(req) {
  await connectMongoDB();
  const { userId, productId } = await req.json();

  await Cart.updateOne(
    { userId },
    { $pull: { items: { productId } } }
  );

  return NextResponse.json({ success: true });
}
