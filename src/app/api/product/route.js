import { connectMongoDB } from "../../../../lib/mongodb";
import Product from "../../../../models/Product";
import Discount from "../../../../models/Discount";
import { NextResponse } from "next/server";

// ===== helper: เวลาไทย (UTC+7) =====
function getThailandNow() {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
}

export async function GET(req) {
  await connectMongoDB();

  const { searchParams } = new URL(req.url);
  const studio = searchParams.get("studio");
  const title = searchParams.get("title");
  const scale = searchParams.get("scale");

  const filter = {};
  if (studio) filter.studio = studio;
  if (title) filter.title = title;
  if (scale) filter.scale = scale;

  const products = await Product.find(filter).sort({ createdAt: -1 });
  const discounts = await Discount.find({});

  const nowTH = getThailandNow();

  const enrichedProducts = products.map((product) => {
    const discount = discounts.find((d) => d.title === product.title);

    let discountPercent = 0;
    let isDiscountActive = false;

    if (discount) {
      const startDate = discount.startDate
        ? new Date(discount.startDate)
        : null;

      const endDate = discount.endDate
        ? new Date(discount.endDate)
        : null;

      // ✅ ให้ส่วนลดหมด "สิ้นสุดวันนั้น"
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }

      isDiscountActive =
        (!startDate || nowTH >= startDate) &&
        (!endDate || nowTH <= endDate);

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
}
