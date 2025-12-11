"use client";

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

/**
 * Dashboard.jsx (แก้: เพิ่ม date picker ก่อน export)
 *
 * ติดตั้งแพ็กเกจที่ต้องใช้:
 *   npm install chart.js react-chartjs-2 jspdf jspdf-autotable
 */

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "monthly"
  const [exporting, setExporting] = useState(false);

  // date states for export
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10); // yyyy-mm-dd
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`; // yyyy-mm

  const [selectedDate, setSelectedDate] = useState(isoToday);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]));

    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  const extractItemsFromOrder = (order) => {
    const keys = ["items", "cart", "products", "orderItems", "lineItems"];
    for (const k of keys) {
      if (order[k] && Array.isArray(order[k])) return order[k];
    }
    return [];
  };

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;
  const latestOrder = orders[0];

  const productSummary = () => {
    const map = {};
    orders.forEach((order) => {
      extractItemsFromOrder(order).forEach((it) => {
        const n =
          (it.product && (it.product.title || it.product.name)) ||
          it.title ||
          it.name ||
          it.productName ||
          "Unknown Product";
        const qty = Number(it.qty || it.quantity || it.count || 1);
        map[n] = (map[n] || 0) + (isNaN(qty) ? 0 : qty);
      });
    });
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  };

  const productList = productSummary();

  const chartData = () => {
    const map = {};
    orders.forEach((order) => {
      const d = new Date(order.createdAt || order.created_at || Date.now());
      const k =
        viewMode === "daily"
          ? d.toLocaleDateString("en-GB")
          : `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      map[k] = (map[k] || 0) + (order.total || 0);
    });
    const keys = Object.keys(map).sort(
      (a, b) =>
        new Date(a.split("/").reverse().join("-")) -
        new Date(b.split("/").reverse().join("-"))
    );
    return {
      labels: keys,
      datasets: [
        {
          label: "ยอดขาย (Bath)",
          data: keys.map((k) => map[k]),
          borderColor: "rgb(99,102,241)",
          backgroundColor: "rgba(99,102,241,0.08)",
          fill: true,
        },
      ],
    };
  };

  // Helper: parse selected date/month into comparable parts
  const parseSelected = () => {
    if (viewMode === "daily") {
      // selectedDate is 'yyyy-mm-dd'
      const [y, m, d] = selectedDate.split("-").map((v) => Number(v));
      return { type: "daily", year: y, month: m - 1, day: d };
    } else {
      const [y, mm] = selectedMonth.split("-").map((v) => Number(v));
      return { type: "monthly", year: y, month: mm - 1 };
    }
  };

  // =========================
  // Export PDF (with date/month picker)
  // =========================
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      if (!orders || orders.length === 0) {
        alert("ไม่มีคำสั่งซื้อให้ส่งออก");
        setExporting(false);
        return;
      }

      const sel = parseSelected();

      // filter orders by selected period
      let filtered = orders.filter((o) => {
        const dt = new Date(o.createdAt || o.created_at || Date.now());
        if (sel.type === "daily") {
          return (
            dt.getFullYear() === sel.year &&
            dt.getMonth() === sel.month &&
            dt.getDate() === sel.day
          );
        } else {
          return dt.getFullYear() === sel.year && dt.getMonth() === sel.month;
        }
      });

      if (!filtered || filtered.length === 0) {
        alert("ไม่มีคำสั่งซื้อในช่วงเวลาที่เลือกให้ส่งออก");
        setExporting(false);
        return;
      }

      const [{ default: jsPDF }, autoTableImport] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable").catch(() => null),
      ]);
      const autoTable = autoTableImport?.default || autoTableImport;
      if (!jsPDF) throw new Error("ไม่สามารถโหลด jsPDF");

      const doc = new jsPDF({ unit: "pt", format: "a4" });

      // Header with selected period
      const periodLabel =
        sel.type === "daily"
          ? `${String(sel.day).padStart(2, "0")}/${String(sel.month + 1).padStart(2, "0")}/${sel.year}`
          : `${String(sel.month + 1).padStart(2, "0")}/${sel.year}`;

      doc.setFontSize(14);
      doc.text(`Sales Report (${sel.type === "daily" ? "Daily" : "Monthly"}) - ${periodLabel}`, 40, 50);
      doc.setFontSize(10);
      doc.text(`Generated at: ${new Date().toLocaleString("en-GB")}`, 40, 66);

      // build rows and summary from filtered orders
      const rows = [];
      let grandTotalRevenue = 0;
      let grandItemsCount = 0;
      const productCounts = {};

      filtered.forEach((order) => {
        const dt = new Date(order.createdAt || order.created_at || Date.now());
        const dateStr = dt.toLocaleDateString("en-GB");
        const buyer = order.shipping?.fullname || order.name || order.user || "Unknown Customer";

        const items = extractItemsFromOrder(order);
        let itemsTotal = 0;
        let orderItemsCount = 0;

        const itemStrings = items.map((it) => {
          const name =
            (it.product && (it.product.title || it.product.name)) ||
            it.title ||
            it.name ||
            it.productName ||
            "Unknown Product";
          const qty = Number(it.qty || it.quantity || it.count || 1);
          const price = Number(it.price || it.unitPrice || it.product?.price || 0);
          orderItemsCount += isNaN(qty) ? 0 : qty;
          itemsTotal += (isNaN(qty) ? 0 : qty) * (isNaN(price) ? 0 : price);
          productCounts[name] = (productCounts[name] || 0) + (isNaN(qty) ? 0 : qty);
          return `${name} x${qty} @${price.toLocaleString()}`;
        });

        grandItemsCount += orderItemsCount;
        grandTotalRevenue += Number(order.total || 0);

        rows.push([
          dateStr,
          buyer,
          itemStrings.length ? itemStrings.join("; ") : "-",
          `${itemsTotal.toLocaleString()} Bath`,
          `${(order.total || 0).toLocaleString()} Bath`,
        ]);
      });

      // render table
      if (autoTable) {
        autoTable(doc, {
          startY: 90,
          head: [["Date", "Buyer", "Products", "Items Total (Bath)", "Order Total (Bath)"]],
          body: rows,
          styles: { fontSize: 9 },
          columnStyles: { 2: { cellWidth: 200 } },
        });
      } else {
        doc.setFontSize(9);
        let y = 90;
        doc.text("Date | Buyer | Products | ItemsTotal | OrderTotal", 40, y);
        y += 14;
        rows.forEach((r) => {
          const line = `${r[0]} | ${r[1]} | ${r[2].slice(0, 120)} | ${r[3]} | ${r[4]}`;
          doc.text(line, 40, y);
          y += 12;
          if (y > 760) {
            doc.addPage();
            y = 40;
          }
        });
      }

      // summary page
      doc.addPage();
      doc.setFontSize(12);
      doc.text("Overall Summary", 40, 50);
      doc.setFontSize(10);
      doc.text(`Total Revenue (sum of orders): ${grandTotalRevenue.toLocaleString()} Bath`, 40, 70);
      doc.text(`Total Items Sold (sum of quantities): ${grandItemsCount.toLocaleString()} pcs`, 40, 86);
      doc.text(`Unique Products Sold: ${Object.keys(productCounts).length}`, 40, 102);

      const productRows = Object.entries(productCounts).map(([name, qty]) => [name, qty.toString()]);
      if (autoTable) {
        autoTable(doc, {
          head: [["Product", "Quantity Sold"]],
          body: productRows,
          startY: 130,
          styles: { fontSize: 10 },
        });
      } else {
        let y = 130;
        productRows.forEach((r) => {
          doc.text(`${r[0]} — ${r[1]} pcs`, 40, y);
          y += 14;
          if (y > 760) {
            doc.addPage();
            y = 40;
          }
        });
      }

      const filename = `sales_report_${sel.type}_${periodLabel.replace(/\//g, "-")}.pdf`;
      doc.save(filename);

      setExporting(false);
    } catch (err) {
      console.error("Export PDF error:", err);
      alert("ส่งออก PDF ล้มเหลว — ดู console สำหรับรายละเอียด");
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white text-slate-800 p-6">
      <div className="max-w-[1200px] mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">📊 แดชบอร์ดภาพรวม</h1>
          <div className="text-sm text-gray-500">สวัสดี, ผู้ดูแลระบบ</div>
        </header>

        {/* Summary + export controls */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-xs text-gray-400">ยอดขายรวม</p>
              <p className="text-2xl font-bold mt-2">{totalRevenue.toLocaleString()} บาท</p>
              <p className="text-xs text-gray-400 mt-1">{totalOrders} รายการ</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-xs text-gray-400">จำนวนผู้ใช้งาน</p>
              <p className="text-2xl font-bold mt-2">{users.length.toLocaleString()} คน</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-xs text-gray-400">คำสั่งซื้อล่าสุด</p>
              <p className="text-lg font-semibold mt-2">{latestOrder?.shipping?.fullname || "ยังไม่มีคำสั่งซื้อ"}</p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-xs text-gray-400">สินค้าคงเหลือ (รวม)</p>
              <p className="text-2xl font-bold mt-2">—</p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="daily">รายวัน</option>
              <option value="monthly">รายเดือน</option>
            </select>

            {/* date/month picker */}
            {viewMode === "daily" ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            )}

            <button onClick={handleExportPDF} disabled={exporting} className="bg-indigo-600 text-white px-3 py-2 rounded">
              {exporting ? "กำลังส่งออก..." : "ส่งออก"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border mb-6">
          <h2 className="text-xl font-semibold mb-4">📈 กราฟยอดขาย</h2>
          <div className="h-[420px]">
            <Line data={chartData()} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border">
            <h3 className="text-lg font-semibold mb-3">🕒 คำสั่งซื้อล่าสุด</h3>
            <ul className="divide-y">
              {orders.slice(0, 6).map((order) => (
                <li key={order._id || order.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{order.shipping?.fullname || order.name || "ลูกค้า"}</div>
                    <div className="text-xs text-gray-400">{new Date(order.createdAt || order.created_at || Date.now()).toLocaleString("en-GB")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{(order.total || 0).toLocaleString()} บาท</div>
                    <div className="text-xs text-gray-400">{order.status || "-"}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="bg-white rounded-2xl p-4 shadow-sm border">
            <div className="mb-4">
              <p className="text-xs text-gray-400">กำไร / สรุปสินค้า</p>
              <p className="text-xl font-bold">{totalRevenue.toLocaleString()} บาท</p>
            </div>

            <div className="space-y-2 max-h-48 overflow-auto">
              {productList.length === 0 ? (
                <div className="text-sm text-gray-400">ยังไม่มีข้อมูลการขายของสินค้า</div>
              ) : (
                productList.map((p) => (
                  <div key={p.name} className="flex justify-between items-center text-sm bg-slate-50 rounded-lg p-2">
                    <div className="truncate max-w-[160px]">{p.name}</div>
                    <div className="font-semibold">{p.qty} ชิ้น</div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
