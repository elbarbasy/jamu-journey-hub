export function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
export function formatDateTime(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(dt);
}
