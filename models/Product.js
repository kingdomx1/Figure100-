import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studio: { type: String, required: true },
  title: { type: String, required: true },
  scale: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  images: [{ type: String }],
  description: { type: String },
}, { timestamps: true }); // สร้าง createdAt, updatedAt ให้อัตโนมัติ

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
