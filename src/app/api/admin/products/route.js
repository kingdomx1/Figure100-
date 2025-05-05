import { connectMongoDB } from "../../../../../lib/mongodb";
import Product from '../../../../../models/Product';
import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// POST - เพิ่มสินค้าใหม่
export async function POST(req) {
  await connectMongoDB();

  try {
    const formData = await req.formData();
    const image = formData.get('image');

    let filename = '';

    if (image) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      filename = `${uuidv4()}.png`; // สุ่มชื่อไฟล์

      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
      await writeFile(filePath, buffer);
    }

    const newProduct = new Product({
      name: formData.get('name'),
      studio: formData.get('studio'),
      title: formData.get('title'),
      scale: formData.get('scale'),
      price: formData.get('price'),
      stock: formData.get('stock'),
      description: formData.get('description'),
      images: [`/uploads/${filename}`],
    });

    await newProduct.save();

    return NextResponse.json({ message: 'เพิ่มสินค้าสำเร็จ' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้า' }, { status: 500 });
  }
}

// GET - ดึงสินค้าทั้งหมด
export async function GET(req) {
  await connectMongoDB();

  try {
    const products = await Product.find({});
    return NextResponse.json(products);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

// DELETE - ลบสินค้า
export async function DELETE(req) {
  await connectMongoDB();

  try {
    const { id } = await req.json();
    await Product.findByIdAndDelete(id);

    return NextResponse.json({ message: 'ลบสินค้าสำเร็จ' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลบสินค้า:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลบสินค้า' }, { status: 500 });
  }
}

// PATCH - แก้ไขสินค้า
export async function PATCH(req) {
  await connectMongoDB();

  try {
    const { id, updatedData } = await req.json();
    await Product.findByIdAndUpdate(id, updatedData);

    return NextResponse.json({ message: 'แก้ไขสินค้าสำเร็จ' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการแก้ไขสินค้า:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า' }, { status: 500 });
  }
}
