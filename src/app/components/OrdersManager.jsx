"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด");
  const [stockMessages, setStockMessages] = useState([]);

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

  const updateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`/api/admin/orders/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedOrder(null);
        setStockMessages(data.stockWarnings || []);
        fetchOrders();
      } else {
        alert(data.message || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
    }
  };

  const filteredOrders =
    filterStatus === "ทั้งหมด"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

  const statusTabs = ["ทั้งหมด", "รอการยืนยัน", "จัดส่งเรียบร้อย", "ยกเลิก"];

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-6">📦 รายการคำสั่งซื้อ</h2>

      {/* Tabs เลือกสถานะ */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {statusTabs.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded ${
              filterStatus === status
                ? "bg-blue-700 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* ข้อความแจ้งเตือนสต็อก */}
      {stockMessages.length > 0 && (
        <div className="mb-4 p-4 border border-green-300 bg-green-100 text-green-800 rounded">
          <p className="font-semibold">📢 แจ้งเตือนสต็อก:</p>
          <ul className="list-disc ml-5">
            {stockMessages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <p>ไม่มีคำสั่งซื้อในสถานะนี้</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              onClick={() => setSelectedOrder(order)}
              className="border border-gray-300 p-4 rounded bg-white cursor-pointer hover:bg-gray-100"
            >
              <p><strong>รหัสคำสั่งซื้อ:</strong> {order.orderNumber || "ไม่มี"}</p>
              <p><strong>ผู้สั่ง:</strong> {order.shipping.fullname}</p>
              <p><strong>ยอดรวม:</strong> {order.total.toLocaleString()} บาท</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  order.status === "จัดส่งเรียบร้อย"
                    ? "bg-green-200 text-green-800"
                    : order.status === "ยกเลิก"
                    ? "bg-red-200 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                📌 สถานะ: {order.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal แสดงรายละเอียดคำสั่งซื้อ */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative text-black max-h-screen overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
            >
              ❌
            </button>

            <h3 className="text-xl font-bold mb-4">รายละเอียดคำสั่งซื้อ</h3>
            <p><strong>รหัสคำสั่งซื้อ:</strong> {selectedOrder.orderNumber || "ไม่มี"}</p>
            <p><strong>ชื่อผู้สั่ง:</strong> {selectedOrder.shipping.fullname}</p>
            <p><strong>ที่อยู่:</strong> {selectedOrder.shipping.address}</p>
            <p><strong>เบอร์โทร:</strong> {selectedOrder.shipping.phone}</p>
            <p><strong>ยอดรวม:</strong> {selectedOrder.total.toLocaleString()} บาท</p>
            <p><strong>สถานะ:</strong> {selectedOrder.status}</p>
            <p className="mb-2"><strong>เวลา:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>

            <ul className="mb-3 text-sm text-gray-800">
              {selectedOrder.items.map((item, index) => (
                <li key={index}>
                  - {item.name} × {item.quantity}
                </li>
              ))}
            </ul>

            {selectedOrder.slip && (
              <div className="mb-4">
                <strong>สลิปการโอนเงิน:</strong>
                <Image
                  src={`/uploads/${selectedOrder.slip}`}
                  alt="slip"
                  width={400}
                  height={400}
                  className="mt-2 border rounded object-contain"
                />
              </div>
            )}

            {/* ปุ่มแอคชัน */}
            {selectedOrder.status !== "จัดส่งเรียบร้อย" && selectedOrder.status !== "ยกเลิก" && (
              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={() => updateStatus(selectedOrder._id, "จัดส่งเรียบร้อย")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                >
                  ✅ ยืนยันคำสั่งซื้อ / เปลี่ยนเป็น "จัดส่งเรียบร้อย"
                </button>
                <button
                  onClick={() => updateStatus(selectedOrder._id, "ยกเลิก")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
                >
                  ❌ ยกเลิกคำสั่งซื้อ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
