
import { connectMongoDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/user";
import { NextResponse } from "next/server";


export async function GET(req) {
  await connectMongoDB();

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "กรุณาระบุ email" }, { status: 400 });
    }

    const user = await User.findOne({ email }).lean();

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    const { name, phone, address } = user;

    return NextResponse.json({ name, phone, address });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
