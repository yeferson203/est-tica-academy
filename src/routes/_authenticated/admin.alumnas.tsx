import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCOP } from "@/lib/courses";

export const Route = createFileRoute("/_authenticated/admin/alumnas")({
  component: Students,
});

function Students() {
  const { data } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const [{ data: enr }, { data: profiles }, { data: certs }] = await Promise.all([
        supabase.from("enrollments").select("user_id, course_id, amount, created_at, courses(title)").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name"),
        supabase.from("certificates").select("user_id, course_id"),
      ]);
      return { enr: enr ?? [], profiles: profiles ?? [], certs: certs ?? [] };
    },
  });
  if (!data) return <p className="text-muted-foreground">Cargando…</p>;
  const total = data.enr.reduce((s, e) => s + (e.amount ?? 0), 0);
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Usuarias registradas" value={String(data.profiles.length)} />
        <Stat label="Inscripciones" value={String(data.enr.length)} />
        <Stat label="Ingresos" value={formatCOP(total)} />
      </div>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="p-4">Alumna</th><th className="p-4">Curso</th><th className="p-4">Pagado</th><th className="p-4">Fecha</th><th className="p-4">Certificado</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.enr.map((e) => (
              <tr key={e.user_id + e.course_id}>
                <td className="p-4">{data.profiles.find((p) => p.id === e.user_id)?.full_name ?? "—"}</td>
                <td className="p-4">{e.courses?.title}</td>
                <td className="p-4">{formatCOP(e.amount ?? 0)}</td>
                <td className="p-4">{new Date(e.created_at).toLocaleDateString("es-CO")}</td>
                <td className="p-4">{data.certs.some((c) => c.user_id === e.user_id && c.course_id === e.course_id) ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value}</p>
    </div>
  );
}
