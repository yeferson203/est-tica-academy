import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courseImage, formatCOP } from "@/lib/courses";
import { startCheckout } from "@/lib/academy.functions";

export const Route = createFileRoute("/cursos/$slug")({
  head: () => ({
    meta: [
      { title: "Curso de estética · Academia Lorena Bahos" },
      { name: "description", content: "Detalle del curso, lecciones incluidas y certificado." },
      { property: "og:title", content: "Curso de estética · Academia Lorena Bahos" },
      { property: "og:description", content: "Lecciones en video, examen final y certificado a tu nombre." },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const checkout = useServerFn(startCheckout);
  const [paying, setPaying] = useState(false);

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
    queryFn: async () => (await supabase.rpc("course_outline", { _course_id: course!.id })).data ?? [],
  });
  const { data: enrolled } = useQuery({
    queryKey: ["enrolled", course?.id, user?.id],
    enabled: !!course && !!user,
    queryFn: async () => !!(await supabase.rpc("is_enrolled", { _course_id: course!.id })).data,
  });

  if (isLoading) return <p className="p-16 text-center text-muted-foreground">Cargando…</p>;
  if (!course) return <p className="p-16 text-center">Curso no encontrado.</p>;

  async function buy() {
    if (!user) {
      sessionStorage.setItem("after_login", `/cursos/${slug}`);
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
          <p className="eyebrow">{course.level} · {course.duration}</p>
          <h1 className="mt-4 text-5xl leading-tight md:text-6xl">{course.title}</h1>
          <p className="mt-3 text-xl italic text-gold font-serif">{course.subtitle}</p>
          <p className="mt-6 leading-relaxed text-muted-foreground">{course.description}</p>

          <h2 className="mt-12 text-3xl">Contenido del curso</h2>
          <ol className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {outline.map((l, i) => (
              <li key={l.id} className="flex items-center gap-4 px-5 py-4">
                <span className="font-serif text-2xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1">{l.title}</span>
                {enrolled ? <Check className="h-4 w-4 text-gold" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
              </li>
            ))}
            <li className="flex items-center gap-4 px-5 py-4 text-muted-foreground">
              <span className="font-serif text-2xl text-gold">✦</span> Examen final y certificado
            </li>
          </ol>
        </div>
        <aside className="h-fit overflow-hidden rounded-2xl border border-border bg-card md:sticky md:top-6">
          <img src={courseImage(course)} alt={course.title} width={1024} height={768} className="aspect-[4/3] w-full object-cover" />
          <div className="p-6">
            <p className="font-serif text-4xl">{course.price_cop > 0 ? formatCOP(course.price_cop) : "Gratis"}</p>
            {enrolled ? (
              <Link to="/aprender/$slug" params={{ slug }} className="mt-6 block rounded-full bg-primary py-4 text-center text-xs uppercase tracking-[0.2em] text-primary-foreground">
                Continuar curso
              </Link>
            ) : (
              <button onClick={buy} disabled={paying} className="mt-6 w-full rounded-full bg-gold py-4 text-xs uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-60">
                {paying ? "Redirigiendo…" : user ? "Comprar con Mercado Pago" : "Ingresa para comprar"}
              </button>
            )}
            <p className="mt-4 text-center text-xs text-muted-foreground">Acceso ilimitado · Certificado incluido</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
