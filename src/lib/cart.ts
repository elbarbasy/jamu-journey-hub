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
const EMPTY_ITEMS: CartItem[] = [];
const EMPTY_CTX: Ctx = { tableCode: null, orderType: null };
let cartCache: { raw: string | null; value: CartItem[] } = { raw: null, value: EMPTY_ITEMS };
let ctxCache: { raw: string | null; value: Ctx } = { raw: null, value: EMPTY_CTX };

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new Event("majamu:store"));
}

function getCartSnapshot() {
  if (typeof window === "undefined") return EMPTY_ITEMS;
  const raw = localStorage.getItem(KEY);
  if (raw === cartCache.raw) return cartCache.value;
  cartCache = { raw, value: raw ? read<CartItem[]>(KEY, EMPTY_ITEMS) : EMPTY_ITEMS };
  return cartCache.value;
}

function getContextSnapshot() {
  if (typeof window === "undefined") return EMPTY_CTX;
  const raw = localStorage.getItem(CTX_KEY);
  if (raw === ctxCache.raw) return ctxCache.value;
  ctxCache = { raw, value: raw ? read<Ctx>(CTX_KEY, EMPTY_CTX) : EMPTY_CTX };
  return ctxCache.value;
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => undefined;
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
    getCartSnapshot,
    () => EMPTY_ITEMS,
  );
  const ctx = useSyncExternalStore(
    subscribe,
    getContextSnapshot,
    () => EMPTY_CTX,
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
