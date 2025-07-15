import { connectMongoDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/user";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoDB();

    // ดึงเฉพาะผู้ใช้งานที่มี role = "user"
    const users = await User.find({ role: "user" }, "name email");

    return NextResponse.json(users);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงรายชื่อผู้ใช้งาน:", error);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดรายชื่อผู้ใช้งานได้" },
      { status: 500 }
    );
  }
}
