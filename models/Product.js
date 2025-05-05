import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: String,
  studio: String,
  title: String,
  scale: String,
  price: Number,
  stock: Number,
  images: [String],
  description: String,
}, { timestamps: true }); // timestamps สร้าง createdAt, updatedAt ให้อัตโนมัติ

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
