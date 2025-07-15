"use client";

import { useState, useEffect } from "react";

export default function DiscountManager() {
  const [discounts, setDiscounts] = useState([]);
  const [titles, setTitles] = useState([]);
  const [form, setForm] = useState({
    title: "",
    discountPercent: "",
    startDate: "",
    endDate: "",
  });

  // โหลดรายการส่วนลด
  useEffect(() => {
    fetch("/api/admin/discounts")
      .then((res) => res.json())
      .then((data) => setDiscounts(data));
  }, []);

  // โหลดชื่อเรื่องจากสินค้าทั้งหมด
  useEffect(() => {
    fetch("/api/product/titles")
      .then((res) => res.json())
      .then((data) => setTitles(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form), // ✅ ส่งข้อมูล form อย่างถูกต้อง
    });

    if (res.ok) {
      const updated = await res.json();
      setDiscounts(updated);
      setForm({
        title: "",
        discountPercent: "",
        startDate: "",
        endDate: "",
      });
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch("/api/admin/discounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }), // ✅ ส่ง id ผ่าน body
    });

    if (res.ok) {
      const updated = await res.json();
      setDiscounts(updated);
    }
  };

  return (
    <div className="text-black max-w-2xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6">🎯 จัดการส่วนลดสินค้า</h2>

      {/* ฟอร์มเพิ่มส่วนลด */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-10"
      >
        <div>
          <label className="block font-medium mb-1">ชื่อเรื่องสินค้า</label>
          <select
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          >
            <option value="">-- กรุณาเลือกชื่อเรื่อง --</option>
            {titles.map((t, i) => (
              <option key={i} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">เปอร์เซ็นต์ส่วนลด (%)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={form.discountPercent}
            onChange={(e) =>
              setForm({ ...form, discountPercent: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          ➕ เพิ่มส่วนลด
        </button>
      </form>

      {/* รายการส่วนลด */}
      <div className="space-y-3">
        {discounts.length === 0 ? (
          <p className="text-gray-500">ยังไม่มีส่วนลด</p>
        ) : (
          discounts.map((d) => (
            <div
              key={d._id}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{d.title}</p>
                <p>ลด {d.discountPercent}%</p>
                {d.startDate && d.endDate && (
                  <p className="text-sm text-gray-600">
                    {new Date(d.startDate).toLocaleDateString()} -{" "}
                    {new Date(d.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(d._id)}
                className="text-red-500 hover:underline"
              >
                ลบ
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
