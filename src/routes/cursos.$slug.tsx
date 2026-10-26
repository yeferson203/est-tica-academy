import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courseImage, formatCOP } from "@/lib/courses";
import { confirmPayment, startCheckout } from "@/lib/academy.functions";

// Mercado Pago sends literal "null" values (e.g. `payment_id=null&status=null`) when the buyer
// leaves the checkout with "Volver a la tienda" without paying; treat those as absent.
const mpParam = z.preprocess(
  (v) => (v == null || v === "" || v === "null" || v === "undefined" ? undefined : String(v)),
  z.string().optional(),
);

const PAYMENT_RETURN_STATUSES = ["approved", "pending", "in_process"];

export const Route = createFileRoute("/cursos/$slug")({
  validateSearch: z.object({
    payment_id: mpParam,
    collection_id: mpParam,
    status: mpParam,
  }),
  head: () => ({
    meta: [
      { title: "Curso de estética · Academia Lorena Bahos" },
      { name: "description", content: "Detalle del curso, lecciones incluidas y certificado." },
      { property: "og:title", content: "Curso de estética · Academia Lorena Bahos" },
      {
        property: "og:description",
        content: "Lecciones en video, examen final y certificado a tu nombre.",
      },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { slug } = Route.useParams();
  const { payment_id: paymentIdParam, collection_id: collectionId, status } = Route.useSearch();
  const paymentId = paymentIdParam ?? collectionId;
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const checkout = useServerFn(startCheckout);
  const confirm = useServerFn(confirmPayment);
  const [paying, setPaying] = useState(false);
  const paymentIdIsValid = !!paymentId && /^\d{1,30}$/.test(paymentId);
  // Only a real payment (or one Mercado Pago says is approved/in progress) needs verification;
  // abandoned or rejected checkouts fall back to the normal "buy" state.
  const isPaymentReturn =
    paymentIdIsValid || (!!status && PAYMENT_RETURN_STATUSES.includes(status));

  useEffect(() => {
    const resetPaying = () => setPaying(false);
    window.addEventListener("pageshow", resetPaying);
    window.addEventListener("popstate", resetPaying);
    return () => {
      window.removeEventListener("pageshow", resetPaying);
      window.removeEventListener("popstate", resetPaying);
    };
  }, []);

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
      return data;
    },
  });
  const { data: outline = [] } = useQuery({
    queryKey: ["outline", course?.id],
    enabled: !!course,
    queryFn: async () =>
      (await supabase.rpc("course_outline", { _course_id: course!.id })).data ?? [],
  });
  const { data: enrolled } = useQuery({
    queryKey: ["enrolled", course?.id, user?.id],
    enabled: !!course && !!user,
    queryFn: async () => !!(await supabase.rpc("is_enrolled", { _course_id: course!.id })).data,
  });
  const paymentConfirmation = useQuery({
    queryKey: ["confirm", user?.id, paymentId],
    enabled: !!user && paymentIdIsValid,
    queryFn: () => confirm({ data: { paymentId: paymentId! } }),
    refetchInterval: (query) =>
      query.state.data?.status === "pending" || query.state.data?.status === "in_process"
        ? 5000
        : false,
  });
  const paymentApprovedForCourse =
    paymentConfirmation.data?.status === "approved" &&
    paymentConfirmation.data.courseId === course?.id;
  const paymentNeedsRetry =
    isPaymentReturn &&
    (paymentConfirmation.isError || paymentConfirmation.data?.status === "error");

  useEffect(() => {
    if (paymentApprovedForCourse && course && user) {
      void queryClient.invalidateQueries({ queryKey: ["enrolled", course.id, user.id] });
    }
  }, [course, paymentApprovedForCourse, queryClient, user]);

  if (isLoading) return <p className="p-16 text-center text-muted-foreground">Cargando…</p>;
  if (!course) return <p className="p-16 text-center">Curso no encontrado.</p>;

  async function buy() {
    if (!user) {
      sessionStorage.setItem("after_login", `${window.location.pathname}${window.location.search}`);
      navigate({ to: "/auth" });
      return;
    }
    setPaying(true);
    try {
      const r = await checkout({ data: { courseId: course!.id, origin: window.location.origin } });
      if (r.free) navigate({ to: "/aprender/$slug", params: { slug } });
      else if (r.url) window.location.href = r.url;
    } catch (e) {
      toast.error((e as Error).message);
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow">
            {course.level} · {course.duration}
          </p>
          <h1 className="mt-4 text-5xl leading-tight md:text-6xl">{course.title}</h1>
          <p className="mt-3 text-xl italic text-gold font-serif">{course.subtitle}</p>
          <p className="mt-6 leading-relaxed text-muted-foreground">{course.description}</p>

          <h2 className="mt-12 text-3xl">Contenido del curso</h2>
          <ol className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {outline.map((l, i) => (
              <li key={l.id} className="flex items-center gap-4 px-5 py-4">
                <span className="font-serif text-2xl text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{l.title}</span>
                {enrolled ? (
                  <Check className="h-4 w-4 text-gold" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </li>
            ))}
            <li className="flex items-center gap-4 px-5 py-4 text-muted-foreground">
              <span className="font-serif text-2xl text-gold">✦</span> Examen final y certificado
            </li>
          </ol>
        </div>
        <aside className="h-fit overflow-hidden rounded-2xl border border-border bg-card md:sticky md:top-6">
          <img
            src={courseImage(course)}
            alt={course.title}
            width={1024}
            height={768}
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="p-6">
            <p className="font-serif text-4xl">
              {course.price_cop > 0 ? formatCOP(course.price_cop) : "Gratis"}
            </p>
            {paymentIdIsValid && user && paymentConfirmation.isPending && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Verificando tu pago con Mercado Pago…
              </p>
            )}
            {isPaymentReturn && !user && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Inicia sesión con la misma cuenta de Google que usaste al comprar para validar tu
                pago y activar el acceso.
              </p>
            )}
            {paymentConfirmation.data?.status === "pending" ||
            paymentConfirmation.data?.status === "in_process" ||
            (isPaymentReturn && paymentIdIsValid && !user) ? (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {paymentConfirmation.data?.status === "pending" ||
                paymentConfirmation.data?.status === "in_process"
                  ? "Tu pago está en proceso. Estamos verificándolo; no vuelvas a pagar."
                  : "Volviendo de Mercado Pago; inicia sesión para verificar el pago."}
              </p>
            ) : null}
            {isPaymentReturn && !paymentIdIsValid && (
              <p className="mt-4 text-center text-sm text-destructive">
                No recibimos el identificador del pago para verificarlo. Revisa Mis cursos y no
                vuelvas a pagar todavía.
              </p>
            )}
            {paymentConfirmation.data?.status === "rejected" && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                El pago no se completó. Puedes intentarlo de nuevo cuando quieras.
              </p>
            )}
            {paymentConfirmation.isError && (
              <p className="mt-4 text-center text-sm text-destructive">
                No pudimos confirmar el pago. Recarga esta página para volver a intentarlo.
              </p>
            )}
            {paymentConfirmation.data?.status === "error" && (
              <p className="mt-4 text-center text-sm text-destructive">
                No pudimos validar este pago. Si ya fue aprobado, contáctanos para ayudarte.
              </p>
            )}
            {enrolled || paymentApprovedForCourse ? (
              <Link
                to="/aprender/$slug"
                params={{ slug }}
                className="mt-6 block rounded-full bg-primary py-4 text-center text-xs uppercase tracking-[0.2em] text-primary-foreground"
              >
                {paymentApprovedForCourse ? "Comprado · Empezar curso" : "Continuar curso"}
              </Link>
            ) : (
              <button
                onClick={paymentNeedsRetry ? () => void paymentConfirmation.refetch() : buy}
                disabled={
                  paying ||
                  paymentApprovedForCourse ||
                  (paymentNeedsRetry && paymentConfirmation.isFetching) ||
                  (isPaymentReturn && !paymentIdIsValid) ||
                  (paymentIdIsValid && paymentConfirmation.isPending)
                }
                className="mt-6 w-full rounded-full bg-gold py-4 text-xs uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-60"
              >
                {paying
                  ? "Redirigiendo…"
                  : paymentApprovedForCourse
                    ? "Activando acceso…"
                    : paymentNeedsRetry
                      ? paymentConfirmation.isFetching
                        ? "Verificando…"
                        : "Reintentar verificación"
                      : isPaymentReturn && !user
                        ? "Ingresa para validar tu pago"
                        : isPaymentReturn && !paymentIdIsValid
                          ? "Pago por verificar"
                          : user
                            ? "Comprar con Mercado Pago"
                            : "Ingresa para comprar"}
              </button>
            )}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Acceso ilimitado · Certificado incluido
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
