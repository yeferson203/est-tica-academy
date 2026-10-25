import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 font-serif text-lg italic text-gold">
        LB
      </span>
      <span className="border-b border-gold pb-1 text-xs tracking-[0.25em] text-foreground">
        LORENA BAHOS <span className="text-muted-foreground">· ACADEMIA</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const link = "text-[0.7rem] tracking-[0.2em] text-muted-foreground hover:text-foreground uppercase";
  return (
    <header className="no-print border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className={link}>Cursos</Link>
          {user && <Link to="/mis-cursos" className={link}>Mis cursos</Link>}
          {isAdmin && <Link to="/admin" className={link}>Administrar</Link>}
        </nav>
        {user ? (
          <button onClick={signOut} className="rounded-full border border-border px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] hover:bg-accent">
            Salir
          </button>
        ) : (
          <Link to="/auth" className="rounded-full border border-border px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] hover:bg-accent">
            Ingresar
          </Link>
        )}
      </div>
      <nav className="flex justify-center gap-6 pb-3 md:hidden">
        <Link to="/" className={link}>Cursos</Link>
        {user && <Link to="/mis-cursos" className={link}>Mis cursos</Link>}
        {isAdmin && <Link to="/admin" className={link}>Admin</Link>}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print bg-ink text-ink-foreground">
      <div className="mx-auto max-w-6xl px-6 py-14 text-center">
        <p className="eyebrow">Un espacio para aprender</p>
        <h2 className="mt-4 text-4xl md:text-5xl">
          Tu camino en la <em className="text-gold">estética</em> empieza aquí.
        </h2>
        <p className="mt-6 text-sm opacity-70">
          Av. San Francisco, Edificio Fénix, piso 2 · Mocoa, Putumayo · +57 323 729 8148
        </p>
      </div>
    </footer>
  );
}
