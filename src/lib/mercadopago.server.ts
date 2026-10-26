const MP_API = "https://api.mercadopago.com";

function token() {
  const t = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!t) throw new Error("Los pagos aún no están configurados (falta el token de Mercado Pago).");
  return t;
}

export async function createPreference(input: {
  courseId: string;
  title: string;
  price: number;
  userId: string;
  courseSlug: string;
  origin: string;
}) {
  const isSecureOrigin = new URL(input.origin).protocol === "https:";
  const courseUrl = `${input.origin}/cursos/${encodeURIComponent(input.courseSlug)}`;
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        {
          id: input.courseId,
          title: input.title,
          quantity: 1,
          unit_price: input.price,
          currency_id: "COP",
        },
      ],
      // No payer email: pre-filling the student's real email locks the checkout to it, which
      // hides the "pay with a Mercado Pago account" option (and breaks test-user purchases).
      external_reference: `${input.userId}:${input.courseId}`,
      back_urls: {
        success: courseUrl,
        failure: courseUrl,
        pending: courseUrl,
      },
      ...(isSecureOrigin ? { auto_return: "approved" } : {}),
      notification_url: `${input.origin}/api/public/mercadopago-webhook`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Mercado Pago preference failed [${res.status}]: ${body}`);
    throw new Error(`Mercado Pago respondió con error (${res.status}).`);
  }
  const data = (await res.json()) as { init_point: string; sandbox_init_point?: string };
  return data.init_point;
}

/** Fetches the payment from Mercado Pago (source of truth) and enrolls the user if approved. */
export async function verifyAndEnroll(paymentId: string) {
  const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Mercado Pago payment lookup failed [${res.status}]: ${body}`);
    return { status: "error" as const };
  }
  const p = (await res.json()) as {
    status: string;
    external_reference?: string;
    transaction_amount?: number;
  };
  if (p.status !== "approved" || !p.external_reference) return { status: p.status };
  const [userId, courseId] = p.external_reference.split(":");
  if (!userId || !courseId) return { status: "error" as const };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      payment_id: String(paymentId),
      amount: Math.round(p.transaction_amount ?? 0),
    },
    { onConflict: "user_id,course_id" },
  );
  if (error) {
    console.error(error);
    return { status: "error" as const };
  }
  return { status: "approved" as const, userId, courseId };
}
