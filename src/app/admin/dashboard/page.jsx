"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../components/Adminsidebar";
import ProductsManager from "../../components/ProductsManager";
import OrdersManager from "../../components/OrdersManager";
import Dashboard from "../../components/Dashboard";
import DiscountManager from "../../components/DiscountManager";

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
        {active === "dashboard" && <Dashboard />}
        {active === "products" && <ProductsManager />}
        {active === "order" && <OrdersManager />}
        {active === "discounts" && <DiscountManager/>}
      </main>
    </div>
  );
}
