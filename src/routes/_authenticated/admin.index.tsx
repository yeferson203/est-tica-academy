import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCOP } from "@/lib/courses";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminCourses,
});

function AdminCourses() {
  const navigate = useNavigate();
  const { data = [] } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await supabase.from("courses").select("*").order("created_at")).data ?? [],
  });

  async function create() {
    const slug = `nuevo-curso-${Date.now().toString(36)}`;
    const { data: c, error } = await supabase.from("courses").insert({ slug, title: "Nuevo curso", published: false }).select("id").single();
    if (error) return toast.error(error.message);
    navigate({ to: "/admin/cursos/$id", params: { id: c.id } });
  }

  return (
    <div>
      <button onClick={create} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[0.7rem] uppercase tracking-[0.2em] text-primary-foreground">
        <Plus className="h-4 w-4" /> Nuevo curso
      </button>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {data.map((c) => (
          <Link key={c.id} to="/admin/cursos/$id" params={{ id: c.id }} className="flex items-center justify-between px-6 py-4 hover:bg-muted">
            <div>
              <p className="font-serif text-2xl">{c.title}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <div className="text-right text-sm">
              <p>{formatCOP(c.price_cop)}</p>
              <p className={c.published ? "text-gold" : "text-muted-foreground"}>{c.published ? "Publicado" : "Borrador"}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
