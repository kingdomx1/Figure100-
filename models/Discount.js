import mongoose from "mongoose";

const DiscountSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    discountPercent: { type: Number, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Discount ||
  mongoose.model("Discount", DiscountSchema);
