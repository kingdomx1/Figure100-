import { connectMongoDB } from "../../../../../lib/mongodb";
import Discount from "../../../../../models/Discount";
import { NextResponse } from "next/server";

// ดึงส่วนลดทั้งหมด
export async function GET() {
  await connectMongoDB();
  const discounts = await Discount.find().sort({ createdAt: -1 });
  return NextResponse.json(discounts);
}

// เพิ่มส่วนลดใหม่
export async function POST(req) {
  await connectMongoDB();
  const { title, discountPercent, startDate, endDate } = await req.json();

  const newDiscount = await Discount.create({
    title,
    discountPercent,
    startDate,
    endDate,
  });

  const discounts = await Discount.find().sort({ createdAt: -1 });
  return NextResponse.json(discounts);
}

//  ลบส่วนลดตาม _id (ส่ง id มาใน body)
export async function DELETE(req) {
  await connectMongoDB();
  const { id } = await req.json();

  await Discount.findByIdAndDelete(id);
  const discounts = await Discount.find().sort({ createdAt: -1 });
  return NextResponse.json(discounts);
}
