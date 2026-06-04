import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  target: z.string().min(6).max(20),
  message: z.string().min(1).max(4000),
});

export const sendFonnteMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      return { ok: false, error: "FONNTE_TOKEN belum dikonfigurasi" };
    }

    // Normalize phone to 62 format
    const clean = data.target.replace(/\D/g, "").replace(/^0/, "62");

    try {
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          target: clean,
          message: data.message,
          countryCode: "62",
        }).toString(),
      });
      const json = (await res.json().catch(() => ({}))) as { status?: boolean; reason?: string };
      if (!res.ok || json.status === false) {
        return { ok: false, error: json.reason ?? `HTTP ${res.status}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Gagal kirim WA" };
    }
  });
