"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Image from "next/image";

export default function OrderHistory() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (session) {
      fetch(`/api/order?user=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => setOrders(data));
    }
  }, [session]);

  if (!session)
    return (
      <main className="bg-black min-h-screen text-white">
        <Navbar />
        <p className="text-center py-10">กรุณาเข้าสู่ระบบ</p>
      </main>
    );

  return (
    <main className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">🧾 ประวัติคำสั่งซื้อ</h1>

        {orders.length === 0 ? (
          <p className="text-center text-gray-400">คุณยังไม่มีคำสั่งซื้อ</p>
        ) : (
          <div className="space-y-8">
            {orders.map((order, i) => (
              <div
                key={i}
                className="border border-gray-700 rounded-lg p-4 shadow-md bg-gray-900"
              >
                <p className="text-lg font-semibold mb-3">
                  รหัสคำสั่งซื้อ: {order.orderNumber}
                </p>
                <div className="space-y-4">
                  {order.items.map((item, index) => {
                    const hasDiscount = item.discountPercent > 0;
                    const discountedPrice = hasDiscount
                      ? Math.round(item.price)
                      : item.price;

                    return (
                      <div
                        key={index}
                        className="flex gap-4 items-center border-b border-gray-800 pb-3"
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={60}
                            height={60}
                            className="rounded"
                          />
                        )}
                        <div>
                          <p className="font-semibold">{item.name}</p>

                          {hasDiscount ? (
                            <div className="text-sm">
                              <p className="text-red-400 font-medium">
                                🔻 ลด {item.discountPercent}%
                              </p>
                              <p className="text-gray-400 line-through">
                                {item.originalPrice.toLocaleString()} บาท × {item.quantity}
                              </p>
                              <p className="text-green-400 font-bold">
                                {discountedPrice.toLocaleString()} บาท × {item.quantity}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">
                              {item.price.toLocaleString()} บาท × {item.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4">💰 ยอดรวม: {order.total.toLocaleString()} บาท</p>
                <p>
                  🏷️ สถานะ:{" "}
                  <span
                    className={`font-bold ${
                      order.status === "กำลังตรวจสอบ"
                        ? "text-yellow-400"
                        : order.status === "สั่งซื้อสำเร็จ"
                        ? "text-green-400"
                        : order.status === "ยกเลิก"
                        ? "text-red-400"
                        : ""
                    }`}
                  >
                    {order.status}
                  </span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  🕒 วันที่สั่งซื้อ:{" "}
                  {new Date(order.createdAt).toLocaleString("th-TH")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
