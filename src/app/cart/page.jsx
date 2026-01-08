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

  /* ================= โหลดตะกร้า ================= */
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

  /* ================= ลบสินค้า ================= */
  const removeItem = async (productId) => {
    const res = await fetch("/api/cart/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.email, productId }),
    });

    if (res.ok) fetchCart();
    else alert("ไม่สามารถลบสินค้าได้");
  };

  /* ================= helper: อ่านสต็อก ================= */
  const getRemainingStock = (item) => {
    const keys = [
      "stock",
      "remainingStock",
      "stockQty",
      "available",
      "quantityAvailable",
      "remaining",
    ];
    for (const k of keys) {
      if (item[k] !== undefined && item[k] !== null) {
        const n = Number(item[k]);
        if (!isNaN(n)) return n;
      }
    }
    return null;
  };

  /* ================= คำนวณราคา ================= */
  const subtotal =
    cart?.items?.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    ) || 0;

  const shippingFee = cart?.items?.length > 0 ? 200 : 0;

  const vatRate = 0.07;
  const vatAmount = Number(((subtotal * vatRate)).toFixed(2));

  const grandTotal = Number((subtotal + shippingFee + vatAmount).toFixed(2));

  if (!session)
    return <p className="text-center text-white">กรุณาเข้าสู่ระบบ</p>;
  if (loading || !cart)
    return <p className="text-center text-white">กำลังโหลด...</p>;

  /* ================= สินค้าสต็อกต่ำ ================= */
  const lowStockItems =
    cart.items
      ?.map((it) => {
        const remaining = getRemainingStock(it);
        return { item: it, remaining };
      })
      .filter((x) => x.remaining !== null && Number(x.remaining) <= 1) || [];

  /* ================= Checkout ================= */
  const handleCheckoutClick = (e) => {
    if (!acceptedTerms) {
      e.preventDefault();
      setShowAcceptWarning(true);
      acceptRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    window.location.href = "/checkout";
  };

  return (
    <main className="bg-black min-h-screen text-white">
      <Navbar session={session} />

      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">🛒 ตะกร้าสินค้า</h1>

        {cart.items.length === 0 ? (
          <p className="text-center text-gray-400">ยังไม่มีสินค้าในตะกร้า</p>
        ) : (
          <>
            {/* ================= รายการสินค้า ================= */}
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
                      className="rounded object-cover"
                    />
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>

                      {item.discountPercent > 0 ? (
                        <>
                          <p className="text-sm text-gray-400 line-through">
                            {item.originalPrice?.toLocaleString?.() ??
                              item.originalPrice}{" "}
                            บาท
                          </p>
                          <p className="text-green-400">
                            {item.price.toLocaleString()} บาท ×{" "}
                            {item.quantity}
                            <span className="text-yellow-400 ml-2">
                              🔻 ลด {item.discountPercent}%
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-300">
                          {item.price.toLocaleString()} บาท ×{" "}
                          {item.quantity}
                        </p>
                      )}

                      {getRemainingStock(item) !== null && (
                        <p className="text-xs text-gray-400">
                          คงเหลือในสต็อก: {getRemainingStock(item)} ชิ้น
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-sm"
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>

            {/* ================= สรุปยอด ================= */}
            <div className="bg-white/5 p-4 rounded border border-gray-700">
              <div className="flex justify-between mb-2">
                <span>ยอดรวมสินค้า</span>
                <span>{subtotal.toLocaleString()} บาท</span>
              </div>

              <div className="flex justify-between mb-2">
                <span>ค่าส่งสินค้า</span>
                <span>{shippingFee.toLocaleString()} บาท</span>
              </div>

              <div className="flex justify-between mb-2">
                <span>VAT 7%</span>
                <span>{vatAmount.toLocaleString()} บาท</span>
              </div>

              <div className="border-t border-gray-600 pt-3 flex justify-between text-lg font-bold">
                <span>ยอดชำระทั้งหมด</span>
                <span>{grandTotal.toLocaleString()} บาท</span>
              </div>

              {/* ================= แจ้งเตือนสต็อกต่ำ ================= */}
              {lowStockItems.length > 0 && (
                <div className="mt-4 bg-red-100 text-red-800 p-4 rounded">
                  <strong>หมายเหตุสำคัญเกี่ยวกับสต็อกสินค้า</strong>
                  <ul className="list-disc pl-5 text-sm mt-2">
                    {lowStockItems.map(({ item, remaining }) => (
                      <li key={item.productId}>
                        {item.name} — เหลือ {remaining} ชิ้น
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm mt-2">
                    หากมีการสั่งซื้อพร้อมกัน ระบบจะยืนยันให้ผู้ที่ยืนยันการสั่งซื้อมาก่อน
                    และจะติดต่อคืนเงินหากคำสั่งซื้อไม่ผ่าน
                  </p>
                </div>
              )}

              {/* ================= Checkbox ================= */}
              <div ref={acceptRef} className="mt-4">
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (e.target.checked) setShowAcceptWarning(false);
                    }}
                  />
                  ข้าพเจ้าเข้าใจและยอมรับเงื่อนไขเกี่ยวกับการจัดการกรณีสต็อกไม่เพียงพอ
                </label>

                {showAcceptWarning && (
                  <p className="text-yellow-300 mt-2">
                    กรุณาติ๊กยอมรับเงื่อนไขก่อนดำเนินการต่อ
                  </p>
                )}
              </div>

              <button
                onClick={handleCheckoutClick}
                disabled={!acceptedTerms}
                className={`mt-6 w-full py-2 rounded text-lg ${
                  acceptedTerms
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-700 cursor-not-allowed"
                }`}
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
