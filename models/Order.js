import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
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

    //  เพิ่มรหัสคำสั่งซื้อ 10 หลักไม่ซ้ำ
    orderNumber: {
      type: String,
      unique: true,
    },

    //  เพิ่มสถานะคำสั่งซื้อแบบ enum
    status: {
      type: String,
      enum: ["รอการยืนยัน","จัดส่งเรียบร้อย","ยกเลิก"],
      default: "รอการยืนยัน",
    },
  },
  {
    timestamps: true, //  เพิ่ม createdAt และ updatedAt อัตโนมัติ
  }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
