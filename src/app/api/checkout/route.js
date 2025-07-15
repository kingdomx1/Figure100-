import { connectMongoDB } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import Cart from "../../../../models/Cart";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

// ฟังก์ชันสร้างรหัสคำสั่งซื้อไม่ซ้ำ
async function generateUniqueOrderNumber() {
  let isUnique = false;
  let orderNumber = "";

  while (!isUnique) {
    orderNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const existing = await Order.findOne({ orderNumber });
    if (!existing) {
      isUnique = true;
    }
  }

  return orderNumber;
}

export async function POST(req) {
  await connectMongoDB();

  try {
    const formData = await req.formData();

    const user = formData.get("user"); // email ของผู้ใช้
    const fullname = formData.get("fullname");
    const address = formData.get("address");
    const phone = formData.get("phone");
    const items = JSON.parse(formData.get("items"));
    const total = parseFloat(formData.get("total"));

    const slip = formData.get("slip");
    let slipFilename = "";

    if (slip) {
      const bytes = await slip.arrayBuffer();
      const buffer = Buffer.from(bytes);
      slipFilename = `${uuidv4()}.png`;
      const filePath = path.join(process.cwd(), "public", "uploads", slipFilename);
      await writeFile(filePath, buffer);
    }

    // สร้าง orderNumber ก่อนบันทึก
    const orderNumber = await generateUniqueOrderNumber();

    const newOrder = new Order({
      user,
      items,
      total,
      shipping: { fullname, address, phone },
      slip: slipFilename,
      orderNumber,
      status: "รอการยืนยัน",
    });

    await newOrder.save();

    //  ลบตะกร้าหลังจากสั่งซื้อเสร็จ
    await Cart.deleteOne({ userId: user });

    return NextResponse.json({ success: true, orderNumber });
  } catch (error) {
    console.error("❌ Error saving order:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
