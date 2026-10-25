import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administración · Academia Lorena Bahos" },
      { name: "description", content: "Gestiona cursos, lecciones, exámenes y alumnas." },
      { property: "og:title", content: "Administración" },
      { property: "og:description", content: "Panel de la academia." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, user } = useAuth();
  if (!user) return null;
  if (!isAdmin) return <p className="p-16 text-center text-muted-foreground">No tienes permisos de administración.</p>;
  const l = "rounded-full px-4 py-2 text-[0.7rem] uppercase tracking-[0.2em] hover:bg-accent";
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="eyebrow">Panel</p>
      <h1 className="mt-2 text-5xl">Administración</h1>
      <nav className="mt-6 flex gap-2 border-b border-border pb-4">
        <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: "bg-accent" }} className={l}>Cursos</Link>
        <Link to="/admin/alumnas" activeProps={{ className: "bg-accent" }} className={l}>Alumnas</Link>
      </nav>
      <div className="mt-8"><Outlet /></div>
    </div>
  );
}
