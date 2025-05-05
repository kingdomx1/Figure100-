"use client";

export default function AdminSidebar({ active, setActive, onLogout }) {
  const menuItems = [
    { key: "dashboard", label: "หน้าหลัก Dashboard" },
    { key: "products", label: "จัดการสินค้า" },
    { key: "discounts", label: "จัดการส่วนลดสินค้า" },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white p-5 space-y-4">
      <h2 className="text-2xl font-bold mb-10">Admin Panel</h2>
      {menuItems.map((item) => (
        <div
          key={item.key}
          onClick={() => setActive(item.key)}
          className={`p-3 rounded cursor-pointer ${
            active === item.key ? "bg-gray-600" : "hover:bg-gray-700"
          }`}
        >
          {item.label}
        </div>
      ))}
      <div
        onClick={onLogout}
        className="p-3 rounded cursor-pointer bg-red-500 hover:bg-red-600 mt-10"
      >
        ออกจากระบบ
      </div>
    </aside>
  );
}
