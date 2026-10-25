import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, PlayCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { courseImage, formatCOP } from "@/lib/courses";
import hero from "@/assets/curso-1.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Academia Lorena Bahos · Cursos online de estética facial" },
      { name: "description", content: "Aprende cuidado facial, limpieza profunda y masaje con cursos en video y certificado a tu nombre." },
      { property: "og:title", content: "Academia Lorena Bahos · Cursos de estética" },
      { property: "og:description", content: "Cursos en video de cuidado facial con certificado al finalizar." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("published", true).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="eyebrow flex items-center gap-4"><span className="h-px w-10 bg-gold" />Academia de estética · Mocoa, Colombia</p>
          <h1 className="mt-8 text-6xl leading-[0.95] md:text-7xl">
            El arte de <br /><em className="text-gold">aprender</em><br /> a cuidar.
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
            Cursos online de cuidado facial con la experiencia de Lorena. Aprende a tu ritmo y recibe tu certificado al finalizar.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a href="#cursos" className="inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground">
              Ver cursos <ArrowRight className="h-4 w-4" />
            </a>
            <Link to="/mis-cursos" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">Mis cursos</Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-4 rounded-t-full border border-gold/30" />
          <img src={hero} alt="Tratamiento facial" width={1024} height={768} className="relative aspect-[4/5] w-full rounded-t-full object-cover" />
        </div>
      </section>

      <section className="border-y border-border/60 bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
          {[
            [PlayCircle, "Video + teoría", "Lecciones en video con explicación escrita."],
            [ShieldCheck, "Pago seguro", "Paga con Mercado Pago: tarjeta, PSE o Nequi."],
            [Award, "Certificado", "Al completar y aprobar el examen, a tu nombre."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Award;
            return (
              <div key={t as string} className="flex gap-4">
                <I className="h-6 w-6 shrink-0 text-gold" />
                <div>
                  <h3 className="text-2xl">{t as string}</h3>
                  <p className="text-sm text-muted-foreground">{d as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="cursos" className="mx-auto max-w-6xl px-6 py-20">
        <p className="eyebrow">Cursos</p>
        <h2 className="mt-3 text-5xl">Formación <em className="text-gold">con esencia</em></h2>
        {isLoading ? (
          <p className="mt-10 text-muted-foreground">Cargando cursos…</p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} to="/cursos/$slug" params={{ slug: c.slug }} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-lg">
                <img src={courseImage(c)} alt={c.title} loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="p-6">
                  <p className="eyebrow">{c.level} · {c.duration}</p>
                  <h3 className="mt-2 text-3xl leading-tight">{c.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.subtitle}</p>
                  <p className="mt-5 font-medium">{c.price_cop > 0 ? formatCOP(c.price_cop) : "Gratis"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
