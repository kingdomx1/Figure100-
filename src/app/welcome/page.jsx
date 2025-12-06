"use client";

import { useEffect, useState } from "react";
import { useSearchParams, redirect } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";

export default function WelcomePage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1); // จำนวนที่จะใส่ตะกร้า

  if (!session) redirect("/login");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const studio = searchParams.get("studio");
        const title = searchParams.get("title");
        const scale = searchParams.get("scale");

        let query = "";
        if (studio) query += `studio=${encodeURIComponent(studio)}&`;
        if (title) query += `title=${encodeURIComponent(title)}&`;
        if (scale) query += `scale=${encodeURIComponent(scale)}&`;

        const res = await fetch(`/api/admin/products?${query}`);
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดสินค้า:", error);
      }
    };

    fetchProducts();
  }, [searchParams]);

  // เมื่อเปิด modal สินค้า ให้รีเซ็ต quantity เป็น 1
  useEffect(() => {
    if (selectedProduct) setQuantity(1);
  }, [selectedProduct]);

  const inc = () => {
    if (!selectedProduct) return;
    const stock = selectedProduct.stock ?? Infinity;
    setQuantity((q) => {
      const next = q + 1;
      if (next > stock) {
        alert(`ไม่สามารถเพิ่มได้ — มีสต็อกเพียง ${stock} ชิ้น`);
        return q;
      }
      return next;
    });
  };

  const dec = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleAddToCart = async () => {
    if (!session?.user?.email) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      return;
    }
    if (!selectedProduct) return;

    const stock = selectedProduct.stock ?? Infinity;
    if (quantity > stock) {
      alert(`จำนวนที่เลือกมากกว่าจำนวนสต็อก (มี ${stock} ชิ้น)`);
      return;
    }

    const discountPercent = selectedProduct.discountPercent || 0;
    const discountedPrice = discountPercent > 0
      ? Math.round(selectedProduct.price * (1 - discountPercent / 100))
      : selectedProduct.price;

    const productPayload = {
      productId: selectedProduct._id,
      name: selectedProduct.name,
      price: discountedPrice,
      originalPrice: selectedProduct.price,
      discountPercent,
      image: selectedProduct.images?.[0] || "",
      quantity,
    };

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.email,
          product: productPayload,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("เพิ่มสินค้าไม่สำเร็จ:", text);
        alert("ไม่สามารถเพิ่มสินค้าได้ กรุณาลองใหม่");
        return;
      }

      alert("เพิ่มสินค้าลงตะกร้าแล้ว");
      setSelectedProduct(null);
    } catch (err) {
      console.error("Error add to cart:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <main className="bg-black min-h-screen">
      <Navbar />
      <Container>
        <h1 className="text-white text-3xl font-bold text-center py-10">
          สินค้าแนะนำ
        </h1>

        {products.length === 0 ? (
          <p className="text-center text-white">ไม่พบสินค้าที่ตรงกับหมวดหมู่</p>
        ) : (
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
        )}
      </Container>

      {/* Modal แสดงรายละเอียดสินค้า */}
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

            {/* ราคาพร้อมส่วนลด */}
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

            <p className="text-gray-600 mb-3">คงเหลือ: {selectedProduct.stock} ชิ้น</p>
            <p className="mt-2 text-gray-700 mb-4">{selectedProduct.description}</p>

            {/* จำนวน (+ / -) */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border rounded overflow-hidden">
                <button
                  onClick={dec}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300"
                  aria-label="ลดจำนวน"
                >
                  −
                </button>
                <div className="px-4 py-2 min-w-[48px] text-center font-semibold bg-white">
                  {quantity}
                </div>
                <button
                  onClick={inc}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300"
                  aria-label="เพิ่มจำนวน"
                >
                  +
                </button>
              </div>

              <div className="text-sm text-gray-500">
                <div>รวม:{" "}<span className="font-semibold">
                  {(
                    (selectedProduct.discountPercent > 0
                      ? Math.round(
                          selectedProduct.price *
                            (1 - selectedProduct.discountPercent / 100)
                        )
                      : selectedProduct.price) * quantity
                  ).toLocaleString()} บาท
                </span></div>
                <div className="text-xs text-gray-400"></div>
              </div>
            </div>

            {/* ปุ่มใส่ตะกร้า */}
            <button
              onClick={handleAddToCart}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded w-full"
            >
              ใส่ตะกร้า
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
