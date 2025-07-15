"use client";

import { useEffect, useState } from "react";
import Chart from "chart.js/auto";
import { Line } from "react-chartjs-2";

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [viewMode, setViewMode] = useState("daily");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const latestOrder = orders[0];

  const chartData = () => {
    const counts = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const key =
        viewMode === "daily"
          ? date.toLocaleDateString("th-TH")
          : `${date.getMonth() + 1}/${date.getFullYear()}`;
      counts[key] = (counts[key] || 0) + order.total;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    return {
      labels,
      datasets: [
        {
          label: "ยอดขาย (บาท)",
          data: values,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
      ],
    };
  };

  return (
    <div className="p-6 text-black">
      <h1 className="text-3xl font-bold mb-6">📊 แดชบอร์ดภาพรวม</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border p-4 rounded shadow">
          <p className="text-sm text-gray-500">ยอดขายรวม</p>
          <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} บาท</p>
        </div>
        <div className="bg-white border p-4 rounded shadow">
          <p className="text-sm text-gray-500">จำนวนคำสั่งซื้อ</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white border p-4 rounded shadow">
          <p className="text-sm text-gray-500">ผู้สั่งซื้อล่าสุด</p>
          <p className="text-lg font-semibold">
            {latestOrder?.shipping?.fullname || "ยังไม่มี"}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border p-4 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📈 กราฟยอดขาย</h2>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="daily">รายวัน</option>
            <option value="monthly">รายเดือน</option>
          </select>
        </div >
            <div className="h-[400px]">
             <Line data={chartData()} />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">🕒 คำสั่งซื้อล่าสุด</h2>
        <ul className="space-y-2 text-sm">
          {orders.slice(0, 5).map((order) => (
            <li
              key={order._id}
              className="border-b pb-2"
            >
              <strong>{order.shipping.fullname}</strong> •{" "}
              {new Date(order.createdAt).toLocaleString("th-TH")} •{" "}
              {order.total.toLocaleString()} บาท • {order.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
