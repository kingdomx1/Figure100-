import { connectMongoDB } from "../../../../../lib/mongodb";
import Product from "../../../../../models/Product";
import Discount from "../../../../../models/Discount";
import { NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

// ✅ POST - เพิ่มสินค้าใหม่
export async function POST(req) {
  await connectMongoDB();

  try {
    const formData = await req.formData();
    const image = formData.get("image");

    let filename = "";

    if (image) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      filename = `${uuidv4()}.png`;

      const filePath = path.join(process.cwd(), "public", "uploads", filename);
      await writeFile(filePath, buffer);
    }

    const newProduct = new Product({
      name: formData.get("name"),
      studio: formData.get("studio"),
      title: formData.get("title"),
      scale: formData.get("scale"),
      price: formData.get("price"),
      stock: formData.get("stock"),
      description: formData.get("description"),
      images: [`/uploads/${filename}`],
    });

    await newProduct.save();

    return NextResponse.json({ message: "เพิ่มสินค้าสำเร็จ" });
  } catch (error) {
    console.error("❌ POST error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการเพิ่มสินค้า" }, { status: 500 });
  }
}

// ✅ GET - ดึงสินค้าทั้งหมด หรือกรองด้วย query string
export async function GET(req) {
  await connectMongoDB();

  try {
    const { searchParams } = new URL(req.url);
    const studio = searchParams.get("studio");
    const title = searchParams.get("title");
    const scale = searchParams.get("scale");

    const filter = {};
    if (studio) filter.studio = studio;
    if (title) filter.title = title;
    if (scale) filter.scale = scale;

    const products = await Product.find(filter);
    const discounts = await Discount.find({});

    const enrichedProducts = products.map((product) => {
      const discount = discounts.find((d) => d.title === product.title);
      const discountPercent = discount ? discount.discountPercent : 0;

      return {
        ...product.toObject(),
        discountPercent,
      };
    });

    return NextResponse.json(enrichedProducts);
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" }, { status: 500 });
  }
}

// ✅ DELETE - ลบสินค้า
export async function DELETE(req) {
  await connectMongoDB();

  try {
    const { id } = await req.json();
    await Product.findByIdAndDelete(id);

    return NextResponse.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("❌ DELETE error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการลบสินค้า" }, { status: 500 });
  }
}

// ✅ PATCH - แก้ไขสินค้า
export async function PATCH(req) {
  await connectMongoDB();

  try {
    const { id, updatedData } = await req.json();
    await Product.findByIdAndUpdate(id, updatedData);

    return NextResponse.json({ message: "แก้ไขสินค้าสำเร็จ" });
  } catch (error) {
    console.error("❌ PATCH error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการแก้ไขสินค้า" }, { status: 500 });
  }
}
