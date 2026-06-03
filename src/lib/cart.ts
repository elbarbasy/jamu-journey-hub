import { useEffect, useState, useSyncExternalStore } from "react";

export type Customization = {
  sweetness?: "Less" | "Normal" | "Extra";
  creamy?: boolean;
  temperature?: "Hot" | "Cold";
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  customization: Customization;
  image_url?: string | null;
};

const KEY = "majamu_cart_v1";
const CTX_KEY = "majamu_ctx_v1";

type Ctx = { tableCode: string | null; orderType: "DINE_IN" | "TAKE_AWAY" | null };

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new Event("majamu:store"));
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("majamu:store", handler);
  window.addEventListener("storage", handler);
  listeners.add(handler);
  return () => {
    window.removeEventListener("majamu:store", handler);
    window.removeEventListener("storage", handler);
    listeners.delete(handler);
  };
}

export function useCart() {
  const items = useSyncExternalStore(
    subscribe,
    () => read<CartItem[]>(KEY, []),
    () => [] as CartItem[],
  );
  const ctx = useSyncExternalStore(
    subscribe,
    () => read<Ctx>(CTX_KEY, { tableCode: null, orderType: null }),
    () => ({ tableCode: null, orderType: null }) as Ctx,
  );
  return {
    items,
    ctx,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
    add(item: CartItem) {
      const cur = read<CartItem[]>(KEY, []);
      cur.push(item);
      write(KEY, cur);
    },
    updateQty(idx: number, qty: number) {
      const cur = read<CartItem[]>(KEY, []);
      if (qty <= 0) cur.splice(idx, 1);
      else cur[idx].quantity = qty;
      write(KEY, cur);
    },
    remove(idx: number) {
      const cur = read<CartItem[]>(KEY, []);
      cur.splice(idx, 1);
      write(KEY, cur);
    },
    clear() { write(KEY, []); },
    setContext(c: Ctx) { write(CTX_KEY, c); },
  };
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
