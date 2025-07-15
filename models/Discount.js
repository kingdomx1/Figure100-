import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema({
  title: String,             // อ้างอิงชื่อเรื่องของสินค้า
  discountPercent: Number,  // ส่วนลด %
  startDate: Date,          // เริ่มลด (optional)
  endDate: Date,            // สิ้นสุดลด (optional)
}, {
  timestamps: true
});

export default mongoose.models.Discount || mongoose.model("Discount", DiscountSchema);
