import mongoose from "mongoose";

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      productId: { type: String, required: true },
      name: String,
      price: Number,
      quantity: Number,
      image: String
    }
  ]
});

const Cart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);
export default Cart;
