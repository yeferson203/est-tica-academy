import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/certificado/$id")({
  head: () => ({
    meta: [
      { title: "Certificado · Academia Lorena Bahos" },
      { name: "description", content: "Certificado de finalización de curso de estética." },
      { property: "og:title", content: "Certificado · Academia Lorena Bahos" },
      { property: "og:description", content: "Certificado verificable de finalización." },
    ],
  }),
  component: CertificatePage,
});

function CertificatePage() {
  const { id } = Route.useParams();
  const { data: cert, isLoading } = useQuery({
    queryKey: ["cert", id],
    queryFn: async () =>
      (await supabase.from("certificates").select("*").eq("id", id).maybeSingle()).data,
  });

  if (isLoading) return <p className="p-16 text-center text-muted-foreground">Cargando…</p>;
  if (!cert) return <p className="p-16 text-center">Certificado no encontrado.</p>;

  const date = new Date(cert.issued_at).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-4 py-10 print:p-0">
      <div className="no-print mx-auto mb-6 flex max-w-4xl justify-between">
        <Link to="/mis-cursos" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          ← Mis cursos
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] text-primary-foreground"
        >
          <Printer className="h-4 w-4" /> Descargar PDF
        </button>
      </div>
      <div className="mx-auto aspect-[1.414] max-w-4xl bg-card p-4 shadow-xl print:max-w-none print:shadow-none">
        <div className="flex h-full flex-col items-center justify-center border border-gold/60 p-4">
          <div className="flex h-full w-full flex-col items-center justify-center border border-gold/30 px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/60 font-serif text-2xl italic text-gold">
              LB
            </span>
            <p className="eyebrow mt-6">Academia Lorena Bahos · Estética integral</p>
            <h1 className="mt-6 text-4xl md:text-6xl">Certificado</h1>
            <p className="mt-1 font-serif text-xl italic text-gold md:text-2xl">de finalización</p>
            <p className="mt-8 text-sm text-muted-foreground">Se otorga a</p>
            <p className="mt-2 border-b border-gold/50 px-8 pb-2 font-serif text-3xl md:text-5xl">
              {cert.full_name}
            </p>
            <p className="mt-6 max-w-lg text-sm text-muted-foreground">
              por haber completado satisfactoriamente el curso
            </p>
            <p className="mt-2 font-serif text-2xl md:text-3xl">{cert.course_title}</p>
            <div className="mt-10 flex w-full max-w-xl items-end justify-between text-xs text-muted-foreground">
              <div className="text-left">
                <p>{date}</p>
                <p className="mt-1">Código: {cert.code}</p>
              </div>
              <div className="text-center">
                <p className="font-serif text-xl italic text-foreground">Lorena Bahos</p>
                <p className="border-t border-border pt-1">Directora académica</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
