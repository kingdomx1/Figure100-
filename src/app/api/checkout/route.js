import { connectMongoDB } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import Cart from "../../../../models/Cart";
import Product from "../../../../models/Product";
import Discount from "../../../../models/Discount";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

// ฟังก์ชันสร้างรหัสคำสั่งซื้อไม่ซ้ำ
async function generateUniqueOrderNumber() {
  let isUnique = false;
  let orderNumber = "";

  while (!isUnique) {
    orderNumber = Math.floor(
      1000000000 + Math.random() * 9000000000
    ).toString();
    const existing = await Order.findOne({ orderNumber });
    if (!existing) isUnique = true;
  }

  return orderNumber;
}

export async function POST(req) {
  await connectMongoDB();

  try {
    const formData = await req.formData();

    const user = formData.get("user");
    const fullname = formData.get("fullname");
    const address = formData.get("address");
    const phone = formData.get("phone");

    // items จาก frontend (ใช้เป็น reference เท่านั้น)
    const clientItems = JSON.parse(formData.get("items"));

    const slip = formData.get("slip");
    let slipFilename = "";

    if (slip) {
      const bytes = await slip.arrayBuffer();
      const buffer = Buffer.from(bytes);
      slipFilename = `${uuidv4()}.png`;
      const filePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        slipFilename
      );
      await writeFile(filePath, buffer);
    }

    // ===============================
    // 🔐 คำนวณราคาใหม่จาก backend
    // ===============================
    const productIds = clientItems.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const discounts = await Discount.find({});
    const now = new Date();

    let total = 0;

    const finalItems = clientItems.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId
      );
      if (!product) throw new Error("ไม่พบสินค้า");

      // หา discount ที่ title ตรง
      const discount = discounts.find(
        (d) => d.title === product.title
      );

      let discountPercent = 0;

      if (discount) {
        const startDate = discount.startDate
          ? new Date(discount.startDate)
          : null;
        const endDate = discount.endDate
          ? new Date(discount.endDate)
          : null;

        const isActive =
          (!startDate || now >= startDate) &&
          (!endDate || now < endDate); // ❗ หมดทันทีเมื่อถึง endDate

        if (isActive) {
          discountPercent = discount.discountPercent;
        }
      }

      const finalPrice =
        discountPercent > 0
          ? Math.round(product.price * (1 - discountPercent / 100))
          : product.price;

      const itemTotal = finalPrice * item.quantity;
      total += itemTotal;

      return {
        productId: product._id,
        name: product.name,
        title: product.title,
        quantity: item.quantity,
        price: finalPrice,
        originalPrice: product.price,
        discountPercent,
      };
    });

    // ===============================
    // สร้าง orderNumber
    // ===============================
    const orderNumber = await generateUniqueOrderNumber();

    const newOrder = new Order({
      user,
      items: finalItems,
      total,
      shipping: { fullname, address, phone },
      slip: slipFilename,
      orderNumber,
      status: "รอการยืนยัน",
    });

    await newOrder.save();

    // ล้างตะกร้า
    await Cart.deleteOne({ userId: user });

    return NextResponse.json({
      success: true,
      orderNumber,
      total,
    });
  } catch (error) {
    console.error("❌ Error saving order:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
