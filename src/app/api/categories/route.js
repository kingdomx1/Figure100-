import { connectMongoDB } from "../../../../lib/mongodb";
import Product from "../../../../models/Product"; 
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoDB();

    // ดึงข้อมูล studio, title, scale ทั้งหมดจาก product
    const products = await Product.find({}, "studio title scale");

    const studiosSet = new Set();
    const titlesSet = new Set();
    const scalesSet = new Set();

    products.forEach((product) => {
      if (product.studio) studiosSet.add(product.studio);
      if (product.title) titlesSet.add(product.title);
      if (product.scale) scalesSet.add(product.scale);
    });

    return NextResponse.json({
      studios: Array.from(studiosSet),
      titles: Array.from(titlesSet),
      scales: Array.from(scalesSet),
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดหมวดหมู่:", error);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดหมวดหมู่ได้" },
      { status: 500 }
    );
  }
}
