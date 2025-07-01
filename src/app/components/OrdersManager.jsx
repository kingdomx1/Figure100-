"use client";

import { useEffect, useState } from "react";

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [showAll, setShowAll] = useState(false); // state สำหรับปุ่มแสดงทั้งหมด

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("❌ โหลดคำสั่งซื้อไม่สำเร็จ:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId) => {
    try {
      const res = await fetch(`/api/admin/orders/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "จัดส่งเรียบร้อย" }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, status: "จัดส่งเรียบร้อย" } : order
          )
        );
      } else {
        alert("ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
    }
  };

  // กรองรายการที่ยังไม่จัดส่งถ้าไม่ได้กด "แสดงทั้งหมด"
  const filteredOrders = showAll
    ? orders
    : orders.filter((order) => order.status !== "จัดส่งเรียบร้อย");

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-6">📦 รายการคำสั่งซื้อ</h2>

      {/* ปุ่มแสดงทั้งหมด / ซ่อนที่จัดส่งแล้ว */}
      <div className="mb-4">
        <button
          onClick={() => setShowAll(!showAll)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          {showAll ? "🔽 ซ่อนคำสั่งซื้อที่จัดส่งแล้ว" : "📜 แสดงคำสั่งซื้อทั้งหมด"}
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <p>ไม่มีคำสั่งซื้อที่แสดงอยู่</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="border border-gray-300 p-4 rounded bg-white"
            >
              <p><strong>ผู้สั่ง:</strong> {order.shipping.fullname}</p>
              <p><strong>อีเมล:</strong> {order.user}</p>
              <p><strong>ยอดรวม:</strong> {order.total.toLocaleString()} บาท</p>

              {/* ป้ายสถานะ */}
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  order.status === "จัดส่งเรียบร้อย"
                    ? "bg-green-200 text-green-800 border border-green-300"
                    : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                }`}
              >
                📌 สถานะ: {order.status}
              </span>

              <p className="mt-2"><strong>เวลาสั่งซื้อ:</strong> {new Date(order.createdAt).toLocaleString()}</p>

              <ul className="mt-2 text-sm text-gray-700">
                {order.items.map((item, index) => (
                  <li key={index}>- {item.name} × {item.quantity}</li>
                ))}
              </ul>

              {/* ปุ่มยืนยันคำสั่งซื้อ */}
              {order.status !== "จัดส่งเรียบร้อย" && (
                <button
                  onClick={() => updateStatus(order._id)}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  ✅ ยืนยันคำสั่งซื้อ / เปลี่ยนเป็น "จัดส่งเรียบร้อย"
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
