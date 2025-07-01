import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  user: String,
  items: [
    {
      productId: String,
      name: String,
      image: String,
      price: Number,
      quantity: Number,
    },
  ],
  total: Number,
  shipping: {
    fullname: String,
    address: String,
    phone: String,
  },
  slip: String, // ชื่อไฟล์สลิปแนบ

  // ✅ เพิ่มสถานะคำสั่งซื้อแบบ Enum เพื่อควบคุมค่าที่รับได้
  status: {
    type: String,
    enum: ["รอการยืนยัน", "จัดส่งเรียบร้อย"],
    default: "รอการยืนยัน",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
