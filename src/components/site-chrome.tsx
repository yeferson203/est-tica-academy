import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const COOKIE_NOTICE_EVENT = "academy:show-cookie-notice";
const COOKIE_NOTICE_STORAGE_KEY = "academy-cookie-notice-seen-v1";

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

  const link =
    "text-[0.7rem] tracking-[0.2em] text-muted-foreground hover:text-foreground uppercase";
  return (
    <header className="no-print border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className={link}>
            Cursos
          </Link>
          {user && (
            <Link to="/mis-cursos" className={link}>
              Mis cursos
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={link}>
              Administrar
            </Link>
          )}
        </nav>
        {user ? (
          <button
            onClick={signOut}
            className="rounded-full border border-border px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] hover:bg-accent"
          >
            Salir
          </button>
        ) : (
          <Link
            to="/auth"
            className="rounded-full border border-border px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] hover:bg-accent"
          >
            Ingresar
          </Link>
        )}
      </div>
      <nav className="flex justify-center gap-6 pb-3 md:hidden">
        <Link to="/" className={link}>
          Cursos
        </Link>
        {user && (
          <Link to="/mis-cursos" className={link}>
            Mis cursos
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin" className={link}>
            Admin
          </Link>
        )}
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
        <nav aria-label="Información legal" className="mt-8 flex flex-wrap justify-center gap-6">
          <Link to="/privacidad" className="text-xs underline underline-offset-4 opacity-80">
            Tratamiento de datos
          </Link>
          <Link to="/cookies" className="text-xs underline underline-offset-4 opacity-80">
            Cookies y caché
          </Link>
          <button
            onClick={() => window.dispatchEvent(new Event(COOKIE_NOTICE_EVENT))}
            className="text-xs underline underline-offset-4 opacity-80"
          >
            Ver aviso de cookies
          </button>
        </nav>
      </div>
    </footer>
  );
}

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showNotice = () => setVisible(true);
    window.addEventListener(COOKIE_NOTICE_EVENT, showNotice);
    try {
      setVisible(window.localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) !== "seen");
    } catch (error) {
      console.error("Could not read cookie notice preference:", error);
      setVisible(true);
    }
    return () => window.removeEventListener(COOKIE_NOTICE_EVENT, showNotice);
  }, []);

  function acknowledgeNotice() {
    try {
      window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, "seen");
    } catch (error) {
      console.error("Could not save cookie notice preference:", error);
      toast.error("No pudimos guardar esta preferencia en tu navegador.");
      return;
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Aviso de almacenamiento y cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl md:flex md:items-center md:gap-6"
    >
      <div className="flex-1">
        <p className="font-medium">Almacenamiento esencial</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Usamos almacenamiento del navegador para mantener tu sesión y recordar este aviso. No
          utilizamos analítica ni publicidad.{" "}
          <Link to="/cookies" className="underline underline-offset-4">
            Más información
          </Link>
        </p>
      </div>
      <button
        onClick={acknowledgeNotice}
        className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.16em] text-primary-foreground md:mt-0 md:w-auto"
      >
        Entendido
      </button>
    </aside>
  );
}
