// MOCK WhatsApp service — logs to console, returns a wa.me deep link.
// Replace with Fonnte API call in production.
import { rupiah } from "./format";

type OrderForMsg = {
  order_number: string;
  customer_name: string;
  customer_whatsapp: string;
  order_type: "DINE_IN" | "TAKE_AWAY";
  table_code: string | null;
  payment_method: "QRIS" | "CASH";
  total: number;
  items: { product_name: string; quantity: number; line_total: number }[];
};

export function buildReceipt(o: OrderForMsg) {
  const lines = [
    `🌿 *MAJAMU* — Tradisi yang Dimajukan`,
    ``,
    `Terima kasih, *${o.customer_name}*!`,
    `No. Pesanan: *${o.order_number}*`,
    `Tipe: ${o.order_type === "DINE_IN" ? `Dine In (Meja ${o.table_code})` : "Take Away"}`,
    `Pembayaran: ${o.payment_method}`,
    ``,
    `*Pesanan*`,
    ...o.items.map((i) => `• ${i.quantity}x ${i.product_name} — ${rupiah(i.line_total)}`),
    ``,
    `*Total: ${rupiah(o.total)}*`,
    ``,
    `Lacak pesanan kamu di link berikut.`,
  ];
  return lines.join("\n");
}

export function waLink(phone: string, message: string) {
  const clean = phone.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsAppMock(phone: string, message: string) {
  // eslint-disable-next-line no-console
  console.log("[WA MOCK]", phone, "\n", message);
  return { ok: true, link: waLink(phone, message) };
}
