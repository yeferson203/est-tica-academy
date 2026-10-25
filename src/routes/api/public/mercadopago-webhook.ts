import { createFileRoute } from "@tanstack/react-router";
import { verifyAndEnroll } from "@/lib/mercadopago.server";

// Mercado Pago notifications. We never trust the payload: the payment is
// re-fetched from Mercado Pago with our access token before enrolling.
export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        let id = url.searchParams.get("data.id") ?? url.searchParams.get("id");
        let type = url.searchParams.get("type") ?? url.searchParams.get("topic");
        try {
          const body = (await request.json()) as { type?: string; data?: { id?: string | number } };
          if (body?.data?.id) id = String(body.data.id);
          if (body?.type) type = body.type;
        } catch {
          /* query-only notification */
        }
        if (type === "payment" && id && /^\d{1,30}$/.test(id)) {
          await verifyAndEnroll(id);
        }
        return new Response("ok");
      },
    },
  },
});
