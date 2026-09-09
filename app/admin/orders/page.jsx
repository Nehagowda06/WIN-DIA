"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/src/frontend/hooks/useAuth";
import styles from "../admin.module.css";

const STATUSES = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function formatStatusLabel(status) {
  return (status || "placed").replace(/_/g, " ");
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(0)}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Packing Slip Generator (Receipt size - 80mm thermal printer format) ────

function generateShippingLabel(order) {
  const addr = order.shipping_address || {};
  const orderDate = new Date(order.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const orderNumber = order.order_number || order.id;
  
  // Get order items - REAL DATA
  const items = order.order_items || [];
  const totalItems = items.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);
  const subtotal = order.items_price || 0;
  const shipping = order.shipping_price || 0;
  const discount = order.discount_price || 0;
  const total = order.total_price || 0;
  
  // Payment status
  const paymentStatus = order.payment_status === 'paid' ? 'PAID' : 
                        order.payment_method === 'cod' ? 'COD' : 'PENDING';

  const slipHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Packing Slip - ${orderNumber}</title>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    /* Receipt size: 80mm width (thermal printer standard) */
    @page {
      size: 80mm auto;
      margin: 0;
    }
    
    body { 
      font-family: Arial, sans-serif;
      width: 80mm;
      padding: 5mm;
      margin: 0 auto;
      background: white;
      color: #000;
      font-size: 11px;
    }
    
    /* Header: Logo + TM + Brand name - matching reference design */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      margin-bottom: 8px;
      gap: 12px;
    }
    .logo-with-tm {
      position: relative;
      display: inline-block;
    }
    .logo {
      max-width: 45px;
      height: auto;
      display: block;
    }
    .tm-badge {
      position: absolute;
      top: 0;
      right: 2px;
      font-size: 8px;
      font-weight: bold;
      color: #000;
    }
    .brand-name {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: bold;
      letter-spacing: 1px;
      color: #000;
      line-height: 1;
      padding-top: 2px;
    }
    
    /* Title */
    .title {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 3px;
      padding: 8px 0;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      margin: 8px 0 12px 0;
    }
    
    /* Order info */
    .info-section {
      margin-bottom: 10px;
      line-height: 1.7;
      font-size: 11px;
    }
    .info-row {
      display: flex;
      gap: 5px;
    }
    .info-label {
      width: 80px;
    }
    .info-value {
      font-weight: bold;
    }
    
    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }
    
    /* Ship to */
    .ship-to-title {
      font-weight: bold;
      margin-bottom: 6px;
    }
    .address-block {
      line-height: 1.6;
      margin-bottom: 10px;
      font-size: 11px;
    }
    
    /* Items table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10px;
    }
    .items-table th {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 6px 4px;
      text-align: left;
      font-weight: bold;
    }
    .items-table td {
      padding: 6px 4px;
      border-bottom: 1px dashed #ccc;
    }
    .items-table .text-right {
      text-align: right;
    }
    .items-table .qty-col {
      width: 30px;
      text-align: center;
    }
    .items-table .price-col {
      width: 60px;
      text-align: right;
    }
    
    /* Summary */
    .summary {
      margin-top: 10px;
      font-size: 11px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .total-section {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      margin-top: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
      font-weight: bold;
    }
    
    /* Thank you */
    .thank-you {
      text-align: center;
      margin: 15px 0 10px 0;
      font-size: 11px;
    }
    
    /* Footer contact */
    .footer {
      margin-top: 15px;
      padding-top: 12px;
      border-top: 1px solid #ddd;
      line-height: 1.8;
      font-size: 10px;
      text-align: center;
    }
    
    /* Packed message */
    .packed {
      text-align: center;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #000;
      font-weight: bold;
      font-size: 10px;
    }
    
    @media print {
      body { 
        width: 80mm;
      }
    }
  </style>
</head>
<body>
  <!-- Header: Logo with TM + WIN-DIA brand (matching reference) -->
  <div class="header">
    <div class="logo-with-tm">
      <img src="/images/windia-logo.png" alt="WIN-DIA" class="logo" />
      <span class="tm-badge">TM</span>
    </div>
    <div class="brand-name">WIN-DIA</div>
  </div>

  <!-- Title -->
  <div class="title">PACKING SLIP</div>

  <!-- Order Info -->
  <div class="info-section">
    <div class="info-row">
      <span class="info-label">Order #</span>
      <span class="info-value">: ${orderNumber}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Order Date</span>
      <span class="info-value">: ${orderDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Payment</span>
      <span class="info-value">: ${paymentStatus}</span>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Ship To -->
  <div class="ship-to-title">SHIP TO:</div>
  <div class="address-block">
    ${addr.full_name || addr.name || 'Customer Name'}<br>
    ${addr.address_line1 || addr.street || 'Address Line 1'}<br>
    ${addr.address_line2 ? addr.address_line2 + '<br>' : ''}${addr.city || 'City'}, ${addr.state || 'State'} - ${addr.pincode || 'PIN'}<br>
    Phone: +91 ${addr.phone || '00000 00000'}
  </div>

  <div class="divider"></div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th>ITEM</th>
        <th class="qty-col">QTY</th>
        <th class="price-col">PRICE</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.name || item.product_name || 'Product'}</td>
          <td class="qty-col">${item.qty || item.quantity || 1}</td>
          <td class="price-col">₹${((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(0)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Summary -->
  <div class="summary">
    <div class="summary-row">
      <span>Items</span>
      <span>${totalItems}</span>
    </div>
    <div class="summary-row">
      <span>Subtotal</span>
      <span>₹${subtotal.toFixed(0)}</span>
    </div>
    <div class="summary-row">
      <span>Shipping</span>
      <span>₹${shipping.toFixed(0)}</span>
    </div>
    ${discount > 0 ? `
    <div class="summary-row">
      <span>Discount</span>
      <span>- ₹${discount.toFixed(0)}</span>
    </div>
    ` : ''}
  </div>

  <!-- Total -->
  <div class="total-section">
    <div class="total-row">
      <span>TOTAL</span>
      <span>₹${total.toFixed(0)}</span>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Thank You -->
  <div class="thank-you">
    Thank you for choosing WIN-DIA! 🌿
  </div>

  <!-- Footer: Company Details -->
  <div class="footer">
    🌐 www.win-dia.com<br>
    📞 Customer Support: +91 96861 53413<br>
    📷 @windia.cocofoods
  </div>

  <!-- Packed Message -->
  <div class="packed">
    🌱 Packed with care in Mysuru
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => window.print(), 300);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(slipHtml);
  printWindow.document.close();
}

// ─── Components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const colorMap = {
    placed: "#f59e0b",
    confirmed: "#3b82f6",
    processing: "#8b5cf6",
    shipped: "#06b6d4",
    delivered: "#10b981",
    cancelled: "#ef4444",
  };
  const color = colorMap[status] || "#6b7280";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        textTransform: "capitalize",
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

function StatusFilter({ filter, setFilter }) {
  return (
    <div className={styles.toolbar}>
      <select className={styles.select} style={{ maxWidth: 240 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">All statuses</option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {formatStatusLabel(status)}
          </option>
        ))}
      </select>
    </div>
  );
}

function OrderRow({ order }) {
  return (
    <tr>
      <td>
        <strong>{order.order_number || order.id}</strong>
        <br />
        <span className={styles.muted}>{formatDate(order.created_at)}</span>
      </td>
      <td>{formatCurrency(order.total_price)}</td>
      <td>
        <span className={styles.status}>{order.payment_status || "pending"}</span>
      </td>
      <td>
        <StatusBadge status={order.order_status || "placed"} />
      </td>
      <td>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          style={{ fontSize: "12px", padding: "6px 12px" }}
          onClick={() => generateShippingLabel(order)}
        >
          📦 Label
        </button>
      </td>
    </tr>
  );
}

function OrdersTable({ orders, loading }) {
  if (loading) return <div className={styles.empty}>Loading orders...</div>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Label</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
          {!orders.length && (
            <tr>
              <td colSpan="5">No orders found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Excel Export ───────────────────────────────────────────────────────────

function exportToExcel(orders) {
  if (!orders.length) {
    toast.error("No orders to export");
    return;
  }

  // CSV headers
  const headers = [
    "Order Number",
    "Order Date",
    "Customer Email",
    "Total Amount",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Shipping Address",
    "Phone",
  ];

  // CSV rows - real data from the database
  const rows = orders.map((order) => {
    const addr = order.shipping_address || {};
    const shippingLine = [
      addr.address_line1 || "",
      addr.city || "",
      addr.state || "",
      addr.pincode || "",
    ]
      .filter(Boolean)
      .join(", ");

    return [
      order.order_number || order.id,
      formatDate(order.created_at),
      order.user_email || order.email || "",
      order.total_price || 0,
      order.payment_method || "online",
      order.payment_status || "pending",
      order.order_status || "placed",
      shippingLine,
      addr.phone || "",
    ];
  });

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  // Trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  toast.success(`Exported ${orders.length} orders`);
}

// ─── Transaction Details Table (view in browser) ────────────────────────────

function TransactionDetailsTable({ orders, onClose }) {
  if (!orders.length) {
    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2>Transaction Details</h2>
          <p>No orders to display</p>
          <button className={styles.button} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Transaction Details ({orders.length} orders)</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.tableWrap} style={{ maxHeight: "70vh", overflow: "auto" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Shipping</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const addr = order.shipping_address || {};
                const shippingLine = [addr.address_line1, addr.city, addr.state, addr.pincode]
                  .filter(Boolean)
                  .join(", ");
                
                return (
                  <tr key={order.id}>
                    <td><strong>{order.order_number || order.id}</strong></td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>{order.user_email || order.email || "-"}</td>
                    <td>{formatCurrency(order.total_price)}</td>
                    <td>
                      <span className={styles.status}>{order.payment_status || "pending"}</span>
                      <br />
                      <small>{order.payment_method || "online"}</small>
                    </td>
                    <td><StatusBadge status={order.order_status || "placed"} /></td>
                    <td style={{ fontSize: "12px", maxWidth: "200px" }}>{shippingLine || "-"}</td>
                    <td>{addr.phone || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.button} onClick={() => exportToExcel(orders)}>
            📥 Download CSV
          </button>
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const load = () => {
    setLoading(true);
    authFetch(`/api/admin/orders${filter ? `?status=${filter}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const items = data.data?.items || data.orders || data.data || [];
          setOrders(Array.isArray(items) ? items : []);
        } else {
          toast.error(data.error || "Could not load orders");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  return (
    <>
      <div className={styles.toolbar}>
        <div>
          <h1 className={styles.topTitle}>Orders</h1>
          <p className={styles.muted}>
            Orders update automatically — payment confirmation and shipment booking both happen without any action needed here. Download labels below.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={styles.button}
            onClick={() => setShowDetails(true)}
            disabled={loading || !orders.length}
          >
            📊 View Details
          </button>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => exportToExcel(orders)}
            disabled={loading || !orders.length}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      <StatusFilter filter={filter} setFilter={setFilter} />

      <section className={styles.panel}>
        <OrdersTable orders={orders} loading={loading} />
      </section>

      {showDetails && <TransactionDetailsTable orders={orders} onClose={() => setShowDetails(false)} />}
    </>
  );
}
