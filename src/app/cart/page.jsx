"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Navbar from "../components/Navbar";

export default function CartPage() {
  const { data: session } = useSession();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?userId=${session.user.email}`);
      const data = await res.json();
      setCart(data);
    } catch (error) {
      console.error("โหลดตะกร้าล้มเหลว:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchCart();
  }, [session]);

  const removeItem = async (productId) => {
    const res = await fetch("/api/cart/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.email, productId }),
    });

    if (res.ok) {
      fetchCart();
    } else {
      alert("ไม่สามารถลบสินค้าได้");
    }
  };

  //  ราคาสินค้ารวมทั้งหมด
  const subtotal =
    cart?.items?.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    ) || 0;

  //  ค่าส่งสินค้า "เหมา 200 บาท"
  const shippingFee = cart?.items?.length > 0 ? 200 : 0;

  //  VAT 7% คิดจาก (สินค้า + ค่าส่ง)
  const vatRate = 0.07;
  const vatAmount = Number(((subtotal + shippingFee) * vatRate).toFixed(2));

  //  ราคารวมทั้งหมด
  const grandTotal = Number((subtotal + shippingFee + vatAmount).toFixed(2));

  if (!session) return <p className="text-center text-white">กรุณาเข้าสู่ระบบ</p>;
  if (loading || !cart) return <p className="text-center text-white">กำลังโหลด...</p>;

  return (
    <main className="bg-black min-h-screen text-white">
      <Navbar session={session} />

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-center">🛒 ตะกร้าสินค้า</h1>

        {cart.items.length === 0 ? (
          <p className="text-center text-gray-400">ยังไม่มีสินค้าในตะกร้า</p>
        ) : (
          <>
            {/* รายการสินค้า */}
            <div className="space-y-6">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between items-center border-b border-gray-700 pb-4"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded shadow object-cover"
                    />
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>

                      {item.discountPercent > 0 ? (
                        <>
                          <p className="text-sm text-gray-400 line-through">
                            {item.originalPrice.toLocaleString()} บาท
                          </p>
                          <p className="text-green-400 font-medium">
                            {item.price.toLocaleString()} บาท × {item.quantity}
                            <span className="text-yellow-400 ml-2">
                              🔻 ลด {item.discountPercent}%
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-300">
                          {item.price.toLocaleString()} บาท × {item.quantity}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>

            {/* สรุปยอด */}
            <div className="text-right mt-8 bg-white/5 p-4 rounded border border-gray-700">
              <div className="flex justify-between text-gray-300 mb-2">
                <span>ยอดรวมสินค้า</span>
                <span>{subtotal.toLocaleString()} บาท</span>
              </div>

              <div className="flex justify-between text-gray-300 mb-2">
                <span>ค่าส่งสินค้า</span>
                <span>{shippingFee.toLocaleString()} บาท</span>
              </div>

              <div className="flex justify-between text-gray-300 mb-2">
                <span>VAT 7%</span>
                <span>{vatAmount.toLocaleString()} บาท</span>
              </div>

              <div className="border-t border-gray-600 mt-3 pt-3 flex justify-between text-lg font-bold text-white">
                <span>ยอดชำระทั้งหมด</span>
                <span>{grandTotal.toLocaleString()} บาท</span>
              </div>

              <button
                onClick={() => (window.location.href = "/checkout")}
                className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded text-lg"
              >
                ดำเนินการชำระเงิน
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
