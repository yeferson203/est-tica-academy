import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { confirmPayment } from "@/lib/academy.functions";

export const Route = createFileRoute("/_authenticated/pago")({
  validateSearch: z.object({ payment_id: z.coerce.string().optional(), status: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Resultado del pago · Academia Lorena Bahos" },
      { name: "description", content: "Confirmación de tu compra del curso." },
      { property: "og:title", content: "Resultado del pago" },
      { property: "og:description", content: "Confirmación de tu compra." },
    ],
  }),
  component: PaymentResult,
});

function PaymentResult() {
  const { payment_id } = Route.useSearch();
  const confirm = useServerFn(confirmPayment);
  const { data, isLoading } = useQuery({
    queryKey: ["confirm", payment_id],
    enabled: !!payment_id && /^\d+$/.test(payment_id),
    queryFn: () => confirm({ data: { paymentId: payment_id! } }),
  });

  const ok = data?.status === "approved";
  const pending = data?.status === "pending" || data?.status === "in_process";
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="eyebrow">Pago</p>
      <h1 className="mt-4 text-5xl">
        {isLoading ? "Verificando…" : ok ? <>¡Bienvenida al <em className="text-gold">curso</em>!</> : pending ? "Pago en proceso" : "Pago no completado"}
      </h1>
      <p className="mt-4 text-muted-foreground">
        {ok ? "Tu inscripción está lista. Ya puedes empezar." : pending ? "Te daremos acceso apenas Mercado Pago lo confirme." : !isLoading ? "Si crees que es un error, escríbenos por WhatsApp." : ""}
      </p>
      <Link to="/mis-cursos" className="mt-10 inline-flex rounded-full bg-primary px-7 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground">
        Ir a mis cursos
      </Link>
    </div>
  );
}
