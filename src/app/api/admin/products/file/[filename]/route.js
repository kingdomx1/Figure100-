// app/api/admin/products/file/[filename]/route.js

import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';

export async function GET(req, { params }) {
  const { filename } = params;

  try {
    const filePath = path.join(process.cwd(), 'public/uploads', filename);
    const imageBuffer = await readFile(filePath);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png", // สมมุติทุกไฟล์เป็น .jpg
        "Content-Length": imageBuffer.length.toString(),
      }
    });
  } catch (error) {
    console.error('โหลดรูปผิดพลาด:', error);
    return NextResponse.json({ message: 'ไม่พบไฟล์' }, { status: 404 });
  }
}
