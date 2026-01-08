import { connectMongoDB } from "../../../../../lib/mongodb";
import Product from "../../../../../models/Product";
import Discount from "../../../../../models/Discount";
import { NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

/* =========================================================
   POST : เพิ่มสินค้า
========================================================= */
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

      const filePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        filename
      );
      await writeFile(filePath, buffer);
    }

    const newProduct = new Product({
      name: formData.get("name"),
      studio: formData.get("studio"),
      title: formData.get("title"),
      scale: formData.get("scale"),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      description: formData.get("description"),
      images: filename ? [`/uploads/${filename}`] : [],
    });

    await newProduct.save();

    return NextResponse.json({ message: "เพิ่มสินค้าสำเร็จ" });
  } catch (error) {
    console.error("❌ POST error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเพิ่มสินค้า" },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET : ดึงสินค้า + คำนวณส่วนลด (เวลาไทย)
========================================================= */
export async function GET(req) {
  await connectMongoDB();

  try {
    const { searchParams } = new URL(req.url);
    const studio = searchParams.get("studio");
    const title = searchParams.get("title");
    const scale = searchParams.get("scale");

    // ✅ filter แบบไม่ทำให้สินค้าหาย
    const filter = {};

    if (studio) {
      filter.studio = { $regex: studio, $options: "i" };
    }

    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    if (scale) {
      filter.scale = scale;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    const discounts = await Discount.find({});

    // ✅ เวลาไทย
    const nowTH = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Bangkok",
      })
    );

    const enrichedProducts = products.map((product) => {
      // match discount ด้วยการ includes (ไม่ strict)
      const discount = discounts.find((d) =>
        product.title?.toLowerCase().includes(d.title.toLowerCase())
      );

      let discountPercent = 0;
      let isDiscountActive = false;

      if (discount) {
        const startDate = discount.startDate
          ? new Date(discount.startDate)
          : null;
        const endDate = discount.endDate
          ? new Date(discount.endDate)
          : null;

        // ❗ หมดทันทีเมื่อถึง endDate
        isDiscountActive =
          (!startDate || nowTH >= startDate) &&
          (!endDate || nowTH < endDate);

        if (isDiscountActive) {
          discountPercent = discount.discountPercent;
        }
      }

      const finalPrice =
        discountPercent > 0
          ? Math.round(product.price * (1 - discountPercent / 100))
          : product.price;

      return {
        ...product.toObject(),
        discountPercent,
        isDiscountActive,
        finalPrice,
      };
    });

    return NextResponse.json(enrichedProducts);
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE : ลบสินค้า
========================================================= */
export async function DELETE(req) {
  await connectMongoDB();

  try {
    const { id } = await req.json();
    await Product.findByIdAndDelete(id);

    return NextResponse.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("❌ DELETE error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการลบสินค้า" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH : แก้ไขสินค้า
========================================================= */
export async function PATCH(req) {
  await connectMongoDB();

  try {
    const { id, updatedData } = await req.json();
    await Product.findByIdAndUpdate(id, updatedData);

    return NextResponse.json({ message: "แก้ไขสินค้าสำเร็จ" });
  } catch (error) {
    console.error("❌ PATCH error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการแก้ไขสินค้า" },
      { status: 500 }
    );
  }
}
