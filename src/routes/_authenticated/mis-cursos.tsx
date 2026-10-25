import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { courseImage } from "@/lib/courses";

export const Route = createFileRoute("/_authenticated/mis-cursos")({
  head: () => ({
    meta: [
      { title: "Mis cursos · Academia Lorena Bahos" },
      { name: "description", content: "Tus cursos comprados, progreso y certificados." },
      { property: "og:title", content: "Mis cursos" },
      { property: "og:description", content: "Tu progreso y certificados." },
    ],
  }),
  component: MyCourses,
});

function MyCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-courses"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const [{ data: enr }, { data: certs }, { data: prog }] = await Promise.all([
        supabase.from("enrollments").select("course_id, courses(*)").eq("user_id", uid),
        supabase.from("certificates").select("id, course_id").eq("user_id", uid),
        supabase.from("lesson_progress").select("course_id").eq("user_id", uid),
      ]);
      return { enr: enr ?? [], certs: certs ?? [], prog: prog ?? [] };
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="eyebrow">Tu espacio</p>
      <h1 className="mt-3 text-5xl">Mis <em className="text-gold">cursos</em></h1>
      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Cargando…</p>
      ) : !data?.enr.length ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">Aún no tienes cursos.</p>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground">Explorar cursos</Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {data.enr.map(({ course_id, courses: c }) => {
            if (!c) return null;
            const cert = data.certs.find((x) => x.course_id === course_id);
            const done = data.prog.filter((p) => p.course_id === course_id).length;
            return (
              <div key={course_id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <img src={courseImage(c)} alt={c.title} loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full object-cover" />
                <div className="p-6">
                  <h3 className="text-2xl">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{done} lecciones completadas</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/aprender/$slug" params={{ slug: c.slug }} className="rounded-full bg-primary px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] text-primary-foreground">
                      {done ? "Continuar" : "Empezar"}
                    </Link>
                    {cert && (
                      <Link to="/certificado/$id" params={{ id: cert.id }} className="rounded-full border border-gold px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] text-gold">
                        Certificado
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
