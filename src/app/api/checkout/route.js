import { connectMongoDB } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectMongoDB();

  try {
    const formData = await req.formData();

    const user = formData.get("user");
    const fullname = formData.get("fullname");
    const address = formData.get("address");
    const phone = formData.get("phone");
    const items = JSON.parse(formData.get("items")); // ต้องส่งเป็น JSON string
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

    const newOrder = new Order({
      user,
      items,
      total,
      shipping: { fullname, address, phone },
      slip: slipFilename,
    });

    await newOrder.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving order:", error);
    return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
