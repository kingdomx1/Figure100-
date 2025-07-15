"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";

export default function EditProfile() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  useEffect(() => {
    if (session) {
      setForm({
        name: session.user.name || "",
        phone: session.user.phone || "",
        address: session.user.address || "",
      });
    }
  }, [session]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name: form.name,
          phone: form.phone,
          address: form.address,
        }),
      });

      if (res.ok) {
        alert("บันทึกข้อมูลเรียบร้อยแล้ว");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

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

      <div className="max-w-xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold mb-6 text-center">🧍‍♂️ แก้ไขข้อมูลผู้ใช้</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            name="name"
            placeholder="ชื่อ-นามสกุล"
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600 placeholder-gray-400"
          />
          <input
            type="text"
            name="address"
            placeholder="ที่อยู่"
            value={form.address}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600 placeholder-gray-400"
          />
          <input
            type="tel"
            name="phone"
            placeholder="เบอร์โทรศัพท์"
            value={form.phone}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600 placeholder-gray-400"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded text-white font-semibold text-lg"
          >
            💾 บันทึกข้อมูล
          </button>
        </form>
      </div>
    </main>
  );
}
