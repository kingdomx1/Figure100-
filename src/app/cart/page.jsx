"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Navbar from "../components/Navbar";

export default function CartPage() {
  const { data: session } = useSession();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showAcceptWarning, setShowAcceptWarning] = useState(false);
  const acceptRef = useRef(null);

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

  // helper: พยายามอ่านสต็อกจากฟิลด์ที่ต่างกันใน item
  const getRemainingStock = (item) => {
    const keys = [
      "stock",
      "remainingStock",
      "stockQty",
      "available",
      "quantityAvailable",
      "remaining",
      "qtyAvailable",
    ];
    for (const k of keys) {
      if (item[k] !== undefined && item[k] !== null) {
        const n = Number(item[k]);
        if (!isNaN(n)) return n;
      }
    }
    return null;
  };

  // ราคาสินค้ารวมทั้งหมด
  const subtotal =
    cart?.items?.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    ) || 0;

  // ค่าส่งสินค้า "เหมา 200 บาท"
  const shippingFee = cart?.items?.length > 0 ? 200 : 0;

  // VAT 7% คิดจาก (สินค้า + ค่าส่ง)
  const vatRate = 0.07;
  const vatAmount = Number(((subtotal * vatRate)).toFixed(2));

  // ราคารวมทั้งหมด
  const grandTotal = Number((subtotal + shippingFee + vatAmount).toFixed(2));

  if (!session) return <p className="text-center text-white">กรุณาเข้าสู่ระบบ</p>;
  if (loading || !cart) return <p className="text-center text-white">กำลังโหลด...</p>;

  // หาไอเท็มที่เหลือสต็อก 1 ชิ้น (หรือ 0-1) — เฉพาะกรณีที่รู้ค่าสต็อกจริง
  const lowStockItems =
    cart.items
      ?.map((it) => {
        const remaining = getRemainingStock(it);
        return { item: it, remaining };
      })
      .filter((x) => x.remaining !== null && Number(x.remaining) <= 1) || [];

  const handleCheckoutClick = (e) => {
    if (!acceptedTerms) {
      e.preventDefault();
      setShowAcceptWarning(true);
      // focus to checkbox area for accessibility
      if (acceptRef.current) {
        acceptRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    // ถ้าต้องการทำงานก่อนนำทาง เช่น สร้าง order preview ให้เรียก API ที่นี่ก่อน redirect
    window.location.href = "/checkout";
  };

  return (
    <main className="bg-black min-h-screen text-white">
      <Navbar session={session} />

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-4 text-center">🛒 ตะกร้าสินค้า</h1>

        {cart.items.length === 0 ? (
          <p className="text-center text-gray-400">ยังไม่มีสินค้าในตะกร้า</p>
        ) : (
          <>
            {/* รายการสินค้า */}
            <div className="space-y-6 mb-6">
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
                            {item.originalPrice?.toLocaleString?.() ?? item.originalPrice} บาท
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

                      {/* แสดงสต็อกถ้ามีข้อมูล */}
                      {getRemainingStock(item) !== null && (
                        <p className="text-xs text-gray-400 mt-1">
                          คงเหลือในสต็อก: {getRemainingStock(item)} ชิ้น
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
            <div className="text-right bg-white/5 p-4 rounded border border-gray-700">
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

              {/* ที่แสดงข้อความแจ้งเตือนสต็อกต่ำ ถัดจากยอดชำระทั้งหมด */}
              {lowStockItems.length > 0 && (
                <div className="mt-4 rounded-lg bg-red-100 border border-red-200 p-4 text-red-800 text-left">
                  <strong className="block mb-1">หมายเหตุสำคัญเกี่ยวกับสต็อกสินค้า</strong>
                  <p className="text-sm mb-2">
                    สินค้าบางรายการที่อยู่ในตะกร้าของท่านเหลือเพียง 1 ชิ้น:
                  </p>

                  <ul className="list-disc pl-5 text-sm mb-2">
                    {lowStockItems.map(({ item, remaining }) => (
                      <li key={item.productId || item.id || item.name}>
                        {item.name} — {remaining} ชิ้น (ในสต็อก)
                      </li>
                    ))}
                  </ul>

                  <p className="text-sm">
                    หากมีผู้สั่งซื้อสินค้ารายการเดียวกันพร้อมกัน ทางร้านจะยืนยันคำสั่งซื้อให้กับผู้ที่ยืนยันการสั่งซื้อมาก่อน โดยพิจารณาจากเวลาการยืนยันคำสั่งซื้อ หากคำสั่งซื้อของท่านไม่ได้รับการยืนยัน เจ้าหน้าที่จะติดต่อท่านทางหมายเลขโทรศัพท์ที่ท่านให้ไว้เพื่อดำเนินการคืนเงิน
                  </p>
                </div>
              )}

              {/* Checkbox ยืนยันเงื่อนไข */}
              <div ref={acceptRef} className="mt-4 text-left">
                <label className="inline-flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (e.target.checked) setShowAcceptWarning(false);
                    }}
                    className="mt-1 form-checkbox h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm">
                    ข้าพเจ้าได้อ่านและ <strong>เข้าใจและยอมรับเงื่อนไข</strong> ที่ระบุเกี่ยวกับการจัดการกรณีสินค้าคงเหลือไม่เพียงพอ (หากสินค้าเหลือเพียง 1 ชิ้น ทางร้านจะยืนยันให้ผู้ที่ยืนยันการสั่งซื้อมาก่อน และจะติดต่อทางหมายเลขโทรศัพท์เพื่อคืนเงินในกรณีที่คำสั่งซื้อไม่ผ่าน)
                  </span>
                </label>

                {showAcceptWarning && (
                  <p className="text-sm text-yellow-300 mt-2">กรุณาติ๊กยอมรับเงื่อนไขก่อนดำเนินการชำระเงิน</p>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleCheckoutClick}
                  disabled={!acceptedTerms}
                  className={`w-full text-center ${
                    acceptedTerms ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 cursor-not-allowed"
                  } text-white px-6 py-2 rounded text-lg`}
                >
                  ดำเนินการชำระเงิน
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
