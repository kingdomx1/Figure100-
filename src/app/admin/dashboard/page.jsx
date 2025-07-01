"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../components/AdminSidebar";
import ProductsManager from "../../components/ProductsManager";
import OrdersManager from "../../components/OrdersManager";

export default function AdminDashboard() {
  const router = useRouter();
  const [active, setActive] = useState("dashboard");

  const handleLogout = () => {
    // เขียน logout logic เช่น signOut() ได้เลย
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar active={active} setActive={setActive} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 p-10">
        {active === "dashboard" && <div className="text-3xl font-bold">🖥️ หน้าหลัก Dashboard</div>}
        {active === "products" && <ProductsManager />}
        {active === "order" && <OrdersManager />}
        {active === "discounts" && <div className="text-3xl font-bold">🏷️ จัดการส่วนลดสินค้า</div>}
      </main>
    </div>
  );
}
