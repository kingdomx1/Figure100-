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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
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
                className="rounded mb-4"
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
                  {(
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
            <p className="mt-2 text-gray-700">{selectedProduct.description}</p>

            <button
              onClick={async () => {
                if (!session?.user?.email) {
                  router.push("/login");
                  return;
                }

                const discount =
                  selectedProduct.discountPercent > 0
                    ? Math.round(
                        selectedProduct.price *
                          (1 - selectedProduct.discountPercent / 100)
                      )
                    : selectedProduct.price;

                try {
                  const res = await fetch("/api/cart", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      userId: session.user.email,
                      product: {
                        productId: selectedProduct._id,
                        name: selectedProduct.name,
                        price: discount,
                        originalPrice: selectedProduct.price,
                        discountPercent: selectedProduct.discountPercent,
                        image: selectedProduct.images?.[0],
                        quantity: 1,
                      },
                    }),
                  });

                  if (!res.ok) throw new Error("ไม่สามารถเพิ่มสินค้าได้");

                  alert("เพิ่มสินค้าลงตะกร้าแล้ว");
                  setSelectedProduct(null);
                } catch (error) {
                  console.error("เกิดข้อผิดพลาด:", error);
                  alert("เพิ่มสินค้าไม่สำเร็จ");
                }
              }}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded w-full"
            >
              ใส่ตะกร้า
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
