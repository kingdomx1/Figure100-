"use client";

import { useState, useEffect } from "react";

export default function AddProductForm() {
  const [form, setForm] = useState({
    name: "",
    studio: "",
    title: "",
    scale: "",
    price: "",
    stock: "",
    description: "",
    image: null,
  });
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลสินค้าได้");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in form) {
      if (key === "image") {
        if (form.image) formData.append("image", form.image);
      } else {
        formData.append(key, form[key]);
      }
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("เพิ่มสินค้าสำเร็จ");
        setForm({
          name: "",
          studio: "",
          title: "",
          scale: "",
          price: "",
          stock: "",
          description: "",
          image: null,
        });
        fetchProducts();
      } else {
        alert("ผิดพลาดในการเพิ่มสินค้า");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการส่งข้อมูล:", error);
      alert("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("คุณต้องการลบสินค้านี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        alert("ลบสินค้าสำเร็จ");
        fetchProducts();
      } else {
        alert("เกิดข้อผิดพลาดในการลบสินค้า");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบสินค้า:", error);
      alert("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const handleEdit = (product) => {
    // เตรียมข้อมูลสำหรับแก้ไข (clone)
    setEditProduct({
      ...product,
      // ensure fields exist as strings/numbers
      price: product.price ?? "",
      stock: product.stock ?? "",
      description: product.description ?? "",
      name: product.name ?? "",
      studio: product.studio ?? "",
      title: product.title ?? "",
      scale: product.scale ?? "",
    });
    // scroll to edit block (optional)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitEdit = async () => {
    if (!editProduct) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editProduct._id,
          updatedData: {
            name: editProduct.name,
            studio: editProduct.studio,
            title: editProduct.title,
            scale: editProduct.scale,
            price: editProduct.price,
            stock: editProduct.stock,
            description: editProduct.description,
          },
        }),
      });

      if (res.ok) {
        alert("แก้ไขสินค้าสำเร็จ");
        setEditProduct(null);
        fetchProducts();
      } else {
        alert("เกิดข้อผิดพลาดในการแก้ไขสินค้า");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการแก้ไขสินค้า:", error);
      alert("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-5">
      <h1 className="text-2xl font-bold mb-6 text-center">เพิ่มสินค้าใหม่</h1>

      {/* ฟอร์มเพิ่มสินค้า */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-5 border rounded-lg bg-white shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">ชื่อสินค้า</label>
            <input
              type="text"
              placeholder="ชื่อสินค้า"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border p-2 w-full rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Studio</label>
            <input
              type="text"
              placeholder="Studio"
              value={form.studio}
              onChange={(e) => setForm({ ...form, studio: e.target.value })}
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scale</label>
            <input
              type="text"
              placeholder="Scale (เช่น 1/4, 1/6)"
              value={form.scale}
              onChange={(e) => setForm({ ...form, scale: e.target.value })}
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ราคา</label>
            <input
              type="number"
              placeholder="ราคา"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border p-2 w-full rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="border p-2 w-full rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">คำอธิบายสินค้า</label>
          <textarea
            placeholder="คำอธิบายสินค้า"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">รูปภาพสินค้า</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
            className="border p-2 w-full rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          เพิ่มสินค้า
        </button>
      </form>

      {/* ฟอร์มแก้ไขสินค้า */}
      {editProduct && (
        <div className="mt-10 p-6 border rounded-lg bg-gray-50 shadow-md">
          <h2 className="text-xl font-bold mb-4 text-center">แก้ไขสินค้า</h2>

          <div className="grid grid-cols-1 gap-4">
            {/* สำหรับแต่ละฟิลด์ จะแสดงหัวข้อ/label ข้างหน้า */}
            <div>
              <label className="block text-sm font-semibold mb-1">ชื่อสินค้า</label>
              <input
                type="text"
                value={editProduct.name}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, name: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Studio</label>
              <input
                type="text"
                value={editProduct.studio}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, studio: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Title</label>
              <input
                type="text"
                value={editProduct.title}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, title: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Scale</label>
              <input
                type="text"
                value={editProduct.scale}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, scale: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">ราคา</label>
                <input
                  type="number"
                  value={editProduct.price}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, price: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Stock</label>
                <input
                  type="number"
                  value={editProduct.stock}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, stock: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">คำอธิบายสินค้า</label>
              <textarea
                value={editProduct.description}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, description: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">รูปภาพปัจจุบัน</label>
              {editProduct.images && editProduct.images.length > 0 ? (
                // แสดงรูปจาก path ที่เก็บ (สมมติเป็น /uploads/...)
                <img
                  src={editProduct.images[0]}
                  alt={editProduct.name}
                  className="w-full h-48 object-cover rounded"
                />
              ) : (
                <p className="text-sm text-gray-500">ยังไม่มีรูปภาพ</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                บันทึกการแก้ไข
              </button>
              <button
                onClick={() => setEditProduct(null)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* รายการสินค้า */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4 text-center">รายการสินค้า</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="border rounded-lg shadow p-4 bg-white flex flex-col"
            >
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-60 object-cover object-center rounded mb-3"
                />
              ) : (
                <div className="w-full h-60 bg-gray-100 rounded mb-3 flex items-center justify-center text-gray-500">
                  ไม่พบรูปภาพ
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-gray-600">{product.studio} - {product.title}</p>
                <p className="text-gray-600">Scale {product.scale}</p>
                <p className="text-gray-800 font-bold mt-2">{product.price} บาท</p>
                <p className="text-sm text-gray-500">คงเหลือ {product.stock} ชิ้น</p>
                <p className="mt-2 text-gray-700">{product.description}</p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
