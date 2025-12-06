"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Container from "./components/Container";
import Navbar from "./components/Navbar";

export default function Home() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [localQty, setLocalQty] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/admin/products");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("โหลดสินค้าล้มเหลว:", error);
      }
    };
    fetchProducts();
  }, []);

  // เมื่อเปิด modal ให้รีเซ็ตจำนวนเป็น 1
  useEffect(() => {
    if (selectedProduct) setLocalQty(1);
  }, [selectedProduct]);

  // อ่านตะกร้าของผู้ใช้ (ถ้าต้องการใช้ตรวจสอบ)
  const fetchCart = async () => {
    try {
      if (!session?.user?.email) return null;
      const res = await fetch(`/api/cart?userId=${session.user.email}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("fetchCart error:", err);
      return null;
    }
  };

  // เพิ่มทีละ 1 เข้าตะกร้า
  const handleIncrease = async () => {
    if (!selectedProduct) return;
    if (!session?.user?.email) {
      router.push("/login");
      return;
    }

    // ตรวจสต็อก: ดูจำนวนที่อยู่ในตะกร้าแล้วเทียบกับ stock
    const cart = await fetchCart();
    const cartItem = cart?.items?.find((it) => it.productId === selectedProduct._id);
    const currentInCart = cartItem?.quantity || 0;
    const currentStock = selectedProduct.stock ?? Infinity;

    if (currentInCart + 1 > currentStock) {
      alert(`ไม่สามารถเพิ่มได้ — สต็อกมีเพียง ${currentStock} ชิ้น`);
      return;
    }

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.email,
          product: {
            productId: selectedProduct._id,
            name: selectedProduct.name,
            price:
              selectedProduct.discountPercent > 0
                ? Math.round(
                    selectedProduct.price * (1 - selectedProduct.discountPercent / 100)
                  )
                : selectedProduct.price,
            originalPrice: selectedProduct.price,
            discountPercent: selectedProduct.discountPercent || 0,
            image: selectedProduct.images?.[0] || "",
            quantity: 1, // เพิ่มทีละ 1
          },
        }),
      });

      if (!res.ok) {
        console.error("เพิ่มสินค้าไม่สำเร็จ:", await res.text());
        alert("ไม่สามารถเพิ่มสินค้าได้ ลองใหม่");
        return;
      }

      // อัปเดตจำนวนที่แสดงใน modal
      setLocalQty((q) => q + 1);
    } catch (err) {
      console.error("Error add to cart:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  
  const handleDecrease = async () => {
    if (!selectedProduct) return;
    if (!session?.user?.email) {
      router.push("/login");
      return;
    }

    const cart = await fetchCart();
    const cartItem = cart?.items?.find((it) => it.productId === selectedProduct._id);
    const currentInCart = cartItem?.quantity || 0;

    if (currentInCart <= 0) {
      // ถ้ายังไม่มีในตะกร้า ให้ลดแค่ localQty (ไม่ให้ต่ำกว่า 1)
      setLocalQty((q) => Math.max(1, q - 1));
      return;
    }

    const newQty = currentInCart - 1;

    try {
      // ลบรายการทั้งหมดก่อน (ตาม API  POST /api/cart/delete)
      const delRes = await fetch("/api/cart/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.email, productId: selectedProduct._id }),
      });

      if (!delRes.ok) {
        console.error("ลบรายการจากตะกร้าไม่สำเร็จ");
        alert("ไม่สามารถอัพเดตตะกร้าได้ ลองใหม่");
        return;
      }

      // ถ้ายังมีจำนวนเหลือ ให้เพิ่มกลับด้วย newQty
      if (newQty > 0) {
        const addRes = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.email,
            product: {
              productId: selectedProduct._id,
              name: selectedProduct.name,
              price:
                selectedProduct.discountPercent > 0
                  ? Math.round(
                      selectedProduct.price * (1 - selectedProduct.discountPercent / 100)
                    )
                  : selectedProduct.price,
              originalPrice: selectedProduct.price,
              discountPercent: selectedProduct.discountPercent || 0,
              image: selectedProduct.images?.[0] || "",
              quantity: newQty,
            },
          }),
        });

        if (!addRes.ok) {
          console.error("เพิ่มกลับตะกร้าไม่สำเร็จ");
          alert("อัพเดตตะกร้าไม่สำเร็จ ลองใหม่");
          return;
        }
      }

      // อัปเดตจำนวนที่แสดงใน modal (local)
      setLocalQty((q) => Math.max(1, q - 1));
    } catch (err) {
      console.error("Error decrease:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <main className="bg-black min-h-screen">
      <Navbar />
      <Container>
        <h1 className="text-white text-3xl font-bold text-center py-10">สินค้าแนะนำ</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-9">
          {products.map((product) => (
            <div
              key={product._id}
              className="relative group rounded-xl overflow-hidden shadow-md cursor-pointer bg-white transition-transform duration-300 hover:scale-105"
              onClick={() => setSelectedProduct(product)}
            >
              {product.images?.[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover rounded-xl transition-all duration-300"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-center py-2 opacity-0 group-hover:opacity-100 transition duration-300">
                {product.name}
              </div>
            </div>
          ))}
        </div>
      </Container>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full relative text-black">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
            >
              ✕
            </button>

            {selectedProduct.images?.[0] && (
              <Image
                src={selectedProduct.images[0]}
                alt={selectedProduct.name}
                width={400}
                height={250}
                className="rounded mb-4 object-contain w-full h-56"
              />
            )}

            <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
            <p className="text-gray-600 mb-1">
              Studio: {selectedProduct.studio} - {selectedProduct.title}
            </p>

            {selectedProduct.discountPercent > 0 ? (
              <div className="mb-1">
                <p className="text-red-600 font-semibold">
                  🔻 ลด {selectedProduct.discountPercent}%
                </p>
                <p className="text-gray-400 line-through">
                  ราคาเดิม: {selectedProduct.price.toLocaleString()} บาท
                </p>
                <p className="text-green-600 font-bold text-lg">
                  ราคาหลังหักส่วนลด:{" "}
                  {Math.round(
                    selectedProduct.price *
                      (1 - selectedProduct.discountPercent / 100)
                  ).toLocaleString()}{" "}
                  บาท
                </p>
              </div>
            ) : (
              <p className="text-gray-800 font-semibold mb-1">
                ราคา: {selectedProduct.price.toLocaleString()} บาท
              </p>
            )}

            <p className="text-gray-600">คงเหลือ: {selectedProduct.stock} ชิ้น</p>
            <p className="mt-2 text-gray-700 mb-4">{selectedProduct.description}</p>

            {/* ---------- เพิ่มปุ่ม + / - แทนปุ่มใส่ตะกร้า ---------- */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDecrease}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-lg"
                  aria-label="ลดจำนวน"
                >
                  −
                </button>

                <div className="min-w-[44px] text-center font-semibold">
                  {localQty}
                </div>

                <button
                  onClick={handleIncrease}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-lg"
                  aria-label="เพิ่มจำนวน"
                >
                  +
                </button>
              </div>

              <div className="text-sm text-gray-600">
                รวม:{" "}
                <span className="font-semibold">
                  {(
                    (selectedProduct.discountPercent > 0
                      ? Math.round(
                          selectedProduct.price *
                            (1 - selectedProduct.discountPercent / 100)
                        )
                      : selectedProduct.price) * localQty
                  ).toLocaleString()}{" "}
                  บาท
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
