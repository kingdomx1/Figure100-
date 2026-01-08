"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";

export default function WelcomePage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // ================= โหลดสินค้า =================
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
      } catch (err) {
        console.error("โหลดสินค้าล้มเหลว:", err);
      }
    };

    fetchProducts();
  }, [searchParams]);

  // reset จำนวน
  useEffect(() => {
    if (selectedProduct) setQuantity(1);
  }, [selectedProduct]);

  const inc = () => {
    if (!selectedProduct) return;
    if (quantity < selectedProduct.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const dec = () => setQuantity((q) => Math.max(1, q - 1));

  // ================= ใส่ตะกร้า =================
  const handleAddToCart = async () => {
    if (!isLoggedIn || !selectedProduct) return;

    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.email,
        product: {
          productId: selectedProduct._id,
          name: selectedProduct.name,
          price: selectedProduct.finalPrice,
          originalPrice: selectedProduct.price,
          discountPercent: selectedProduct.isDiscountActive
            ? selectedProduct.discountPercent
            : 0,
          image: selectedProduct.images?.[0],
          quantity,
        },
      }),
    });

    alert("เพิ่มสินค้าลงตะกร้าแล้ว");
    setSelectedProduct(null);
  };

  return (
    <main className="bg-black min-h-screen">
      <Navbar />

      <Container>
        <h1 className="text-white text-3xl font-bold text-center py-10">
          สินค้า
        </h1>

        {products.length === 0 ? (
          <p className="text-center text-white">ไม่พบสินค้า</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-9">
            {products.map((product) => (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                className="relative group rounded-xl overflow-hidden shadow-md cursor-pointer bg-white hover:scale-105 transition"
              >
                {/* 🔻 badge ส่วนลด */}
                {product.isDiscountActive && product.discountPercent > 0 && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-10">
                    ลด {product.discountPercent}%
                  </div>
                )}

                <Image
                  src={product.images?.[0] || "/no-image.png"}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover"
                />

                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-center py-2 opacity-0 group-hover:opacity-100">
                  {product.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* ================= MODAL ================= */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-start overflow-y-auto py-10">
          <div className="bg-white w-full max-w-3xl rounded-xl p-6 relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 text-xl"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              <Image
                src={selectedProduct.images?.[0] || "/no-image.png"}
                alt={selectedProduct.name}
                width={400}
                height={400}
                className="rounded w-full md:w-1/2 object-contain"
              />

              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {selectedProduct.name}
                </h2>

                <p className="text-gray-600 mb-1">
                  {selectedProduct.studio} - {selectedProduct.title}
                </p>

                {/* ===== ราคา ===== */}
                {selectedProduct.isDiscountActive &&
                selectedProduct.discountPercent > 0 ? (
                  <>
                    <p className="text-red-600 font-semibold">
                      🔻 ลด {selectedProduct.discountPercent}%
                    </p>
                    <p className="text-gray-400 line-through">
                      ราคาเดิม {selectedProduct.price.toLocaleString()} บาท
                    </p>
                    <p className="text-green-600 font-bold text-lg">
                      ราคาหลังหักส่วนลด{" "}
                      {selectedProduct.finalPrice.toLocaleString()} บาท
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-lg">
                    ราคา {selectedProduct.price.toLocaleString()} บาท
                  </p>
                )}

                <p className="text-sm text-gray-500 mb-3">
                  คงเหลือ {selectedProduct.stock} ชิ้น
                </p>

                <p className="mb-4 text-gray-700">
                  {selectedProduct.description}
                </p>

                {/* จำนวน */}
                <div className="flex items-center gap-4">
                  <button onClick={dec} className="px-3 py-1 bg-gray-200">
                    −
                  </button>
                  <span className="font-bold">{quantity}</span>
                  <button onClick={inc} className="px-3 py-1 bg-gray-200">
                    +
                  </button>
                </div>

                <div className="mt-4 font-semibold">
                  รวม{" "}
                  {(selectedProduct.finalPrice * quantity).toLocaleString()} บาท
                </div>

                {!isLoggedIn ? (
                  <p className="text-red-500 mt-4 text-sm">
                    * กรุณาเข้าสู่ระบบเพื่อสั่งซื้อสินค้า
                  </p>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded w-full"
                  >
                    ใส่ตะกร้า
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
