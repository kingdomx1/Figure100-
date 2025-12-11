"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Image from "next/image";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    fullname: "",
    address: "",
    phone: "",
  });
  const [slip, setSlip] = useState(null);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const SHIPPING_FEE = 200; // ค่าส่งคงที่
  const VAT_RATE = 0.07; // 7%

  // โหลดข้อมูลผู้ใช้จาก database (ถ้ามี)
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!session?.user?.email) return;

      try {
        const res = await fetch(`/api/user/profile?email=${encodeURIComponent(session.user.email)}`);
        if (!res.ok) return;
        const data = await res.json();

        setForm({
          fullname: data.name || "",
          address: data.address || "",
          phone: data.phone || "",
        });
      } catch (err) {
        console.error("โหลดข้อมูลผู้ใช้ล้มเหลว:", err);
      }
    };
    fetchUserInfo();
  }, [session]);

  // โหลดตะกร้า
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cart?userId=${session?.user?.email}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดตะกร้าได้");
        const data = await res.json();
        setCart(data);
      } catch (error) {
        console.error("โหลดตะกร้าไม่สำเร็จ:", error);
      }
      setLoading(false);
    };
    if (session) fetchCart();
  }, [session]);

  const calcSubtotal = () =>
    cart?.items?.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0) || 0;

  const subtotal = calcSubtotal();
  const vat = +(subtotal * VAT_RATE); // ไม่ปัด เพื่อคำนวณแม่นยำ
  const shipping = SHIPPING_FEE;
  const grandTotal = +(subtotal + vat + shipping);

  const formatMoney = (v) =>
    // ถ้าอยากปัดเป็นจำนวนเต็ม ให้เปลี่ยน .toFixed(2) -> Math.round
    Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2).toLocaleString();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSlipChange = (e) => {
    setSlip(e.target.files[0]);
  };

  const handleOrder = async () => {
    // ตรวจสอบว่ากรอกข้อมูลครบและแนบสลิป
    if (!form.fullname || !form.address || !form.phone || !slip) {
      alert("❗ กรุณากรอกข้อมูลให้ครบถ้วนและแนบสลิปการโอนเงิน");
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      alert("❗ ตะกร้าว่าง — ไม่สามารถสั่งซื้อได้");
      return;
    }

    const formData = new FormData();
    formData.append("user", session.user.email);
    formData.append("fullname", form.fullname);
    formData.append("address", form.address);
    formData.append("phone", form.phone);
    formData.append("subtotal", subtotal);
    formData.append("vat", vat.toFixed(2));
    formData.append("shipping", shipping);
    formData.append("total", grandTotal.toFixed(2));
    formData.append("slip", slip);
    formData.append("items", JSON.stringify(cart.items));

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("✅ สั่งซื้อสำเร็จ!");
        // ถ้าต้องการเคลียร์ตะกร้าฝั่ง client ให้เรียก API ล้างตะกร้า (ถ้ามี)
        // await fetch('/api/cart/clear', { method: 'POST', body: JSON.stringify({ userId: session.user.email }) })
        router.push("/orders/history");
      } else {
        const text = await res.text();
        console.error("Checkout error:", text);
        alert("เกิดข้อผิดพลาดในการสั่งซื้อ");
      }
    } catch (err) {
      console.error("Network error:", err);
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

  if (loading || !cart)
    return (
      <main className="bg-black min-h-screen text-white">
        <Navbar />
        <p className="text-center py-10">กำลังโหลด...</p>
      </main>
    );

  return (
    <main className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center">🧾 ยืนยันคำสั่งซื้อ</h1>

        {/* ฟอร์มกรอกข้อมูลผู้รับ */}
        <div className="space-y-4 mb-8">
          <input
            type="text"
            name="fullname"
            placeholder="ชื่อ-นามสกุล"
            value={form.fullname}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-800 border border-gray-600 placeholder-gray-400"
          />
          <textarea
            name="address"
            placeholder="ที่อยู่สำหรับจัดส่ง"
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
        </div>

        {/* แสดงตะกร้า */}
        <div className="bg-gray-900 p-6 rounded mb-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">🛍️ รายการสินค้า</h2>
          {cart.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 py-3 border-b border-gray-700"
            >
              <Image
                src={item.image}
                alt={item.name}
                width={64}
                height={64}
                className="rounded object-cover w-16 h-16"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold">{item.name}</div>

                {item.discountPercent > 0 ? (
                  <>
                    <div className="text-sm text-gray-400 line-through">
                      {Number(item.originalPrice).toLocaleString()} บาท × {item.quantity}
                    </div>
                    <div className="text-sm text-green-400 font-medium">
                      {Number(item.price).toLocaleString()} บาท × {item.quantity}
                      <span className="text-yellow-400 ml-2">🔻 ลด {item.discountPercent}%</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-300">
                    {Number(item.price).toLocaleString()} บาท × {item.quantity}
                  </div>
                )}
              </div>
              <div className="font-bold text-sm text-right w-28">
                {(Number(item.price) * Number(item.quantity)).toLocaleString()} บาท
              </div>
            </div>
          ))}

          <hr className="my-4 border-gray-700" />

          {/* สรุปราคา */}
          <div className="space-y-2 text-right">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Subtotal</span>
              <span>{subtotal.toLocaleString()} บาท</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>VAT (7%)</span>
              <span>{vat.toFixed(2).toLocaleString()} บาท</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>ค่าจัดส่ง</span>
              <span>{shipping.toLocaleString()} บาท</span>
            </div>

            <div className="flex justify-between text-lg font-bold mt-2">
              <span>รวมทั้งหมด</span>
              <span>{grandTotal.toFixed(2).toLocaleString()} บาท</span>
            </div>
          </div>
        </div>

        {/* โชว์ QR โอนเงิน */}
        <div className="bg-gray-800 p-4 rounded mb-6 text-center">
          <p className="mb-2">📌 โอนเงินผ่านบัญชีพร้อมเพย์ / ธนาคาร</p>
          <Image src="/qr.jpg" alt="QR Code" width={200} height={200} className="mx-auto rounded" />
        </div>

        {/* แนบสลิป */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">📎 แนบสลิปโอนเงิน</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleSlipChange}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm"
          />
        </div>

        {/* ปุ่มยืนยัน */}
        <button
          onClick={handleOrder}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded text-lg font-semibold"
        >
          ✅ ยืนยันการสั่งซื้อ
        </button>
      </div>
    </main>
  );
}
