"use client";

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

/**
 * Dashboard.jsx
 * - UI ภาษาไทย (ทั้งหมด)
 * - Export PDF: English content, currency label "Bath"
 *
 * Required packages:
 *   npm install chart.js react-chartjs-2 jspdf jspdf-autotable
 *
 * วางไฟล์นี้เป็น Dashboard.jsx (หรือ DashboardPage.jsx) และรันในโปรเจคของคุณ
 */

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "monthly"
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // เรียก API ของคุณ — ปรับ endpoint ถ้าจำเป็น
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error("fetch orders error:", e);
        setOrders([]);
      });

    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error("fetch users error:", e);
        setUsers([]);
      });
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;
  const latestOrder = orders[0];

  // helper: ดึงรายการสินค้าใน order (รองรับหลายโครงสร้าง)
  const extractItemsFromOrder = (order) => {
    const possibleItemKeys = ["items", "cart", "products", "orderItems", "lineItems"];
    for (const k of possibleItemKeys) {
      if (order[k] && Array.isArray(order[k])) return order[k];
    }
    return [];
  };

  // สร้าง rows สำหรับตาราง PDF: [date, buyer, products string, total]
  const buildReportRows = (filteredOrders) => {
    return filteredOrders.map((order) => {
      const dateObj = new Date(order.createdAt || order.created_at || Date.now());
      const dateStr =
        viewMode === "daily" ? dateObj.toLocaleDateString("en-GB") : `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
      const buyer = order.shipping?.fullname || order.name || order.user || "Unknown Customer";

      const items = extractItemsFromOrder(order);
      const itemStrings = items.map((it) => {
        const name =
          (it.product && (it.product.title || it.product.name)) ||
          it.title ||
          it.name ||
          it.productName ||
          "Unknown Product";
        const qty = Number(it.qty || it.quantity || it.count || 1);
        const price = Number(it.price || it.unitPrice || it.product?.price || 0);
        return `${name} x${qty} @${price.toLocaleString()}`;
      });
      const itemsText = itemStrings.length > 0 ? itemStrings.join("; ") : "-";
      const total = order.total || 0;
      return [dateStr, buyer, itemsText, `${total.toLocaleString()} Bath`];
    });
  };

  // สร้างสรุปสินค้า (ชื่อ + จำนวน)
  const productSummary = () => {
    const map = {};
    orders.forEach((order) => {
      const items = extractItemsFromOrder(order);
      items.forEach((it) => {
        const name =
          (it.product && (it.product.title || it.product.name)) ||
          it.title ||
          it.name ||
          it.productName ||
          "Unknown Product";
        const qty = Number(it.qty || it.quantity || it.count || 1);
        map[name] = (map[name] || 0) + (isNaN(qty) ? 0 : qty);
      });
    });
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  };

  const productList = productSummary();

  // สร้าง data สำหรับกราฟ
  const chartData = () => {
    const counts = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt || order.created_at || Date.now());
      const key =
        viewMode === "daily"
          ? date.toLocaleDateString("en-GB")
          : `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
      counts[key] = (counts[key] || 0) + (order.total || 0);
    });

    const sortedKeys = Object.keys(counts).sort((a, b) => {
      const parseDate = (str) =>
        viewMode === "daily" ? new Date(str.split("/").reverse().join("-")) : new Date(`01/${str}`);
      return parseDate(a) - parseDate(b);
    });

    const values = sortedKeys.map((k) => counts[k]);

    return {
      labels: sortedKeys,
      datasets: [
        {
          label: "ยอดขาย (Bath)",
          data: values,
          fill: true,
          tension: 0.3,
          backgroundColor: "rgba(99,102,241,0.08)",
          borderColor: "rgb(99,102,241)",
          pointRadius: 3,
        },
      ],
    };
  };

  // =========================
  // Export PDF (English content, "Bath")
  // =========================
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      if (!orders || orders.length === 0) {
        alert("ไม่มีคำสั่งซื้อให้ส่งออก");
        setExporting(false);
        return;
      }

      // dynamic import เพื่อหลีกเลี่ยงปัญหา bundler/SSR
      const [{ default: jsPDF }, autoTableImport] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable").catch((e) => {
          console.warn("jspdf-autotable dynamic import failed:", e);
          return null;
        }),
      ]);

      const autoTable = autoTableImport ? (autoTableImport.default || autoTableImport) : null;

      if (!jsPDF) throw new Error("ไม่สามารถโหลด jsPDF");

      const doc = new jsPDF({ unit: "pt", format: "a4" });

      // Header (ภาษาอังกฤษใน PDF)
      const modeLabel = viewMode === "daily" ? "Daily" : "Monthly";
      doc.setFont("Helvetica");
      doc.setFontSize(14);
      doc.text(`Sales Report (${modeLabel})`, 40, 50);
      doc.setFontSize(10);
      doc.text(`Generated at: ${new Date().toLocaleString("en-GB")}`, 40, 66);
      doc.text(`Total Revenue: ${totalRevenue.toLocaleString()} Bath`, 40, 82);

      // สร้าง rows จาก orders
      const rows = buildReportRows(orders);

      // เรียกใช้ autoTable (สองรูปแบบ) หรือ fallback เป็น text
      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          startY: 100,
          head: [["Date", "Buyer", "Products", "Total (Bath)"]],
          body: rows,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [41, 98, 255] },
          columnStyles: { 2: { cellWidth: 240 } },
        });
      } else if (typeof autoTable === "function") {
        autoTable(doc, {
          startY: 100,
          head: [["Date", "Buyer", "Products", "Total (Bath)"]],
          body: rows,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [41, 98, 255] },
          columnStyles: { 2: { cellWidth: 240 } },
        });
      } else {
        // fallback: plain text
        doc.setFontSize(9);
        let y = 100;
        doc.text("Date | Buyer | Products | Total (Bath)", 40, y);
        y += 14;
        rows.forEach((r) => {
          const line = `${r[0]} | ${r[1]} | ${r[2].slice(0, 120)} | ${r[3]}`;
          doc.text(line, 40, y);
          y += 12;
          if (y > 760) {
            doc.addPage();
            y = 40;
          }
        });
      }

      // เพจถัดไป: สรุปยอดขายตามสินค้า
      const productCounts = {};
      orders.forEach((order) => {
        extractItemsFromOrder(order).forEach((it) => {
          const name =
            (it.product && (it.product.title || it.product.name)) ||
            it.title ||
            it.name ||
            it.productName ||
            "Unknown Product";
          const qty = Number(it.qty || it.quantity || it.count || 1);
          productCounts[name] = (productCounts[name] || 0) + (isNaN(qty) ? 0 : qty);
        });
      });

      const productRows = Object.entries(productCounts).map(([name, qty]) => [name, qty.toString()]);
      if (productRows.length > 0) {
        doc.addPage();
        doc.setFontSize(12);
        doc.text("Product Summary (Total Sold)", 40, 50);
        if (typeof doc.autoTable === "function") {
          doc.autoTable({
            head: [["Product", "Quantity Sold"]],
            body: productRows,
            startY: 80,
            styles: { fontSize: 10 },
          });
        } else if (typeof autoTable === "function") {
          autoTable(doc, {
            head: [["Product", "Quantity Sold"]],
            body: productRows,
            startY: 80,
            styles: { fontSize: 10 },
          });
        } else {
          let y = 80;
          productRows.forEach((r) => {
            doc.text(`${r[0]} — ${r[1]} pcs`, 40, y);
            y += 14;
            if (y > 760) {
              doc.addPage();
              y = 40;
            }
          });
        }
      }

      // ดาวน์โหลดไฟล์ไปยังผู้ใช้
      const filename = `sales_report_${viewMode}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      console.log("PDF สร้างแล้ว:", filename);

      // (Optional) พยายามอัปโหลดไฟล์ไปยัง server endpoint ถ้ามี
      try {
        const pdfBlob = doc.output && typeof doc.output === "function" ? doc.output("blob") : null;
        if (pdfBlob) {
          const fd = new FormData();
          fd.append("report", pdfBlob, filename);
          fd.append("mode", viewMode);
          // POST ไป /api/admin/upload-report หากมี endpoint
          const resp = await fetch("/api/admin/upload-report", {
            method: "POST",
            body: fd,
          });
          console.log("Upload response status:", resp.status);
          const text = await resp.text();
          console.log("Upload response body:", text);
        } else {
          console.warn("ไม่สามารถสร้าง pdf blob สำหรับการอัปโหลดได้");
        }
      } catch (uploadErr) {
        console.warn("การอัปโหลด PDF ล้มเหลว (เป็นขั้นตอนเสริม):", uploadErr);
      }

      setExporting(false);
    } catch (err) {
      console.error("เกิดข้อผิดพลาดขณะสร้าง/ส่งออก PDF:", err);
      alert("ส่งออก PDF ล้มเหลว — ดู console สำหรับรายละเอียด");
      setExporting(false);
    }
  };

  // =========================
  // UI ภาษาไทย
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white text-slate-800 p-6">
      <div className="max-w-[1200px] mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">📊 แดชบอร์ดภาพรวม</h1>
          <div className="text-sm text-gray-500">สวัสดี, ผู้ดูแลระบบ</div>
        </header>

        {/* สรุปและปุ่มส่งออก */}
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

          <div className="flex items-center gap-2">
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="daily">รายวัน</option>
              <option value="monthly">รายเดือน</option>
            </select>

            <button onClick={handleExportPDF} disabled={exporting} className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm">
              {exporting ? "กำลังส่งออก..." : "ส่งออก"}
            </button>
          </div>
        </div>

        {/* กราฟ */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📈 กราฟยอดขาย</h2>
          </div>
          <div className="h-[420px]">
            <Line data={chartData()} />
          </div>
        </div>

        {/* รายการคำสั่งซื้อ + สรุปสินค้า */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border">
            <h3 className="text-lg font-semibold mb-3">🕒 คำสั่งซื้อล่าสุด</h3>
            <ul className="divide-y">
              {orders.slice(0, 6).map((order) => (
                <li key={order._id || order.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{order.shipping?.fullname || order.name || "ลูกค้า"}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(order.createdAt || order.created_at || Date.now()).toLocaleString("en-GB")}
                    </div>
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
