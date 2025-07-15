import { connectMongoDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/user";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectMongoDB();

    const { email, name, phone, address } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "ไม่พบอีเมล" }, { status: 400 });
    }

    await User.findOneAndUpdate(
      { email },
      { name, phone, address },
      { new: true }
    );

    return NextResponse.json({ message: "อัปเดตข้อมูลเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการอัปเดต:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}