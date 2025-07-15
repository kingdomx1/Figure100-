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

  const getTotal = () =>
    cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

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
                      className="rounded shadow"
                    />
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>
                      {item.discountPercent > 0 ? (
                        <>
                          <p className="text-sm text-gray-400 line-through">
                            {item.originalPrice.toLocaleString()} บาท
                          </p>
                          <p className="text-green-400 font-medium">
                            {item.price.toLocaleString()} บาท × {item.quantity}{" "}
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

            <div className="text-right mt-8 border-t border-gray-700 pt-4">
              <h2 className="text-xl font-bold">
                รวมทั้งหมด: {getTotal().toLocaleString()} บาท
              </h2>

              <button
                onClick={() => window.location.href = "/checkout"}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded text-lg"
              >
                สั่งซื้อ
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
