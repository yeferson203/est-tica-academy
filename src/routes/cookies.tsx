import { createFileRoute } from "@tanstack/react-router";
import { COOKIE_NOTICE_EVENT } from "@/components/site-chrome";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies y almacenamiento · Academia Lorena Bahos" },
      {
        name: "description",
        content:
          "Conoce el almacenamiento esencial usado para iniciar sesión y operar la academia.",
      },
    ],
  }),
  component: CookiePolicy,
});

function CookiePolicy() {
  function reopenNotice() {
    window.dispatchEvent(new Event(COOKIE_NOTICE_EVENT));
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <p className="eyebrow">Transparencia</p>
      <h1 className="mt-4 text-5xl">Cookies y almacenamiento</h1>
      <div className="mt-10 space-y-8 leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-2xl text-foreground">Qué usa esta plataforma</h2>
          <p className="mt-3">
            La academia no instala actualmente cookies de publicidad, píxeles ni herramientas de
            analítica. Supabase guarda en el almacenamiento local de tu navegador la sesión
            necesaria para mantener tu acceso. Durante la autenticación, el navegador también usa
            almacenamiento de sesión para completar el inicio de sesión y volver a la página que
            estabas visitando.
          </p>
          <p className="mt-3">
            Guardamos en el almacenamiento local una preferencia para recordar que ya viste este
            aviso. No es una autorización para publicidad ni para seguimiento. Google, Supabase,
            Mercado Pago y Netlify pueden usar tecnologías propias en sus servicios para autenticar,
            procesar pagos, protegerlos o prestar la infraestructura; consulta sus políticas cuando
            interactúes con esos servicios.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-foreground">Cómo borrar o controlar el almacenamiento</h2>
          <p className="mt-3">
            Puedes borrar cookies y almacenamiento del navegador desde sus ajustes. Si borras la
            sesión de Supabase, tendrás que iniciar sesión de nuevo; borrar el almacenamiento del
            aviso hará que vuelva a aparecer. Bloquear todo el almacenamiento puede impedir el
            inicio de sesión y otras funciones esenciales.
          </p>
        </section>

        <section>
          <h2 className="text-2xl text-foreground">Caché de la página</h2>
          <p className="mt-3">
            La caché guarda temporalmente recursos para que carguen más rápido y no es una cookie.
            Los archivos estáticos con nombre versionado pueden almacenarse durante más tiempo. Las
            páginas dinámicas y respuestas del servidor que pueden incluir información de cuenta se
            envían con instrucciones para no guardarse en cachés compartidas. El progreso de cursos
            se consulta en tu cuenta, no se guarda como caché persistente en el navegador.
          </p>
        </section>
      </div>
      <button
        onClick={reopenNotice}
        className="mt-10 rounded-full border border-border px-6 py-3 text-xs uppercase tracking-[0.16em] text-foreground hover:bg-accent"
      >
        Volver a mostrar el aviso
      </button>
    </article>
  );
}
