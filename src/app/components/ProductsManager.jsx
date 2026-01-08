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

  // ===== state สำหรับแสดงสินค้า =====
  const [viewMode, setViewMode] = useState("all"); // all | title | studio
  const [filterValue, setFilterValue] = useState("");

  // ===== โหลดสินค้า =====
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/admin/products?${query}`);
    const data = await res.json();
    setProducts(data);
  };

  // ===== ค่า dropdown =====
  const titles = [...new Set(products.map((p) => p.title).filter(Boolean))];
  const studios = [...new Set(products.map((p) => p.studio).filter(Boolean))];

  // ===== เพิ่ม / แก้ไขสินค้า =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editProduct) {
      // 🔧 แก้ไข
      await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editProduct._id,
          updatedData: {
            name: form.name,
            studio: form.studio,
            title: form.title,
            scale: form.scale,
            price: form.price,
            stock: form.stock,
            description: form.description,
          },
        }),
      });
      alert("แก้ไขสินค้าสำเร็จ");
    } else {
      // ➕ เพิ่ม
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (key === "image") {
          if (form.image) formData.append("image", form.image);
        } else {
          formData.append(key, form[key]);
        }
      });

      await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });
      alert("เพิ่มสินค้าสำเร็จ");
    }

    // reset
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
    setEditProduct(null);
    fetchProducts();
  };

  // ===== แก้ไข =====
  const handleEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name || "",
      studio: product.studio || "",
      title: product.title || "",
      scale: product.scale || "",
      price: product.price || "",
      stock: product.stock || "",
      description: product.description || "",
      image: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ===== ลบ =====
  const handleDelete = async (id) => {
    if (!confirm("คุณต้องการลบสินค้านี้ใช่หรือไม่?")) return;

    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    fetchProducts();
  };

  // ===== กรองสินค้าตามโหมด =====
  const displayedProducts = products.filter((p) => {
    if (viewMode === "title") return p.title === filterValue;
    if (viewMode === "studio") return p.studio === filterValue;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {editProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
      </h1>

      {/* ================= FORM ================= */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-5 border rounded bg-white shadow"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="ชื่อสินค้า"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded"
            required
          />

          <input
            placeholder="Studio"
            value={form.studio}
            onChange={(e) => setForm({ ...form, studio: e.target.value })}
            className="border p-2 rounded"
          />

          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border p-2 rounded"
          />

          <input
            placeholder="Scale"
            value={form.scale}
            onChange={(e) => setForm({ ...form, scale: e.target.value })}
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="ราคา"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="จำนวนสินค้า"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="border p-2 rounded"
          />
        </div>

        <textarea
          placeholder="คำอธิบายสินค้า"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 rounded w-full"
        />

        {!editProduct && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
          />
        )}

        <button className="bg-green-600 text-white py-2 rounded w-full">
          {editProduct ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
        </button>

        {editProduct && (
          <button
            type="button"
            onClick={() => {
              setEditProduct(null);
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
            }}
            className="bg-gray-400 text-white py-2 rounded w-full"
          >
            ยกเลิก
          </button>
        )}
      </form>

      {/* ================= FILTER ================= */}
      <div className="mt-10 p-4 bg-white rounded shadow">
        <h2 className="font-bold mb-3">🔍 เลือกรูปแบบการแสดงสินค้า</h2>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setViewMode("all");
              setFilterValue("");
            }}
            className={`px-4 py-1 border rounded ${
              viewMode === "all" ? "bg-black text-white" : ""
            }`}
          >
            สินค้าทั้งหมด ({products.length})
          </button>

          <select
            onChange={(e) => {
              setViewMode("title");
              setFilterValue(e.target.value);
            }}
            className="border px-3 py-1 rounded"
            defaultValue=""
          >
            <option value="" disabled>
              เลือกชื่อเรื่อง
            </option>
            {titles.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            onChange={(e) => {
              setViewMode("studio");
              setFilterValue(e.target.value);
            }}
            className="border px-3 py-1 rounded"
            defaultValue=""
          >
            <option value="" disabled>
              เลือกสตูดิโอ
            </option>
            {studios.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= RESULT ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {displayedProducts.map((p) => (
          <div key={p._id} className="border p-4 rounded bg-white shadow">
            <img
              src={p.images?.[0]}
              className="h-56 w-full object-cover rounded mb-3"
            />
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm text-gray-600">
              {p.studio} - {p.title} | {p.scale}
            </p>
            <p className="font-bold mt-1">{p.price} บาท</p>
            <p className="text-sm text-gray-500">คงเหลือ {p.stock} ชิ้น</p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleEdit(p)}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                แก้ไข
              </button>
              <button
                onClick={() => handleDelete(p._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
