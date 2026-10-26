import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader, SiteFooter, CookieNotice } from "@/components/site-chrome";

// Versioned so WhatsApp/Facebook re-fetch the preview instead of reusing a stale cached copy.
const OG_IMAGE = "https://academialorenabahos.netlify.app/og-image.jpg?v=20261026b";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">Esta página no existe.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Intenta de nuevo en unos segundos.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Academia Lorena Bahos · Cursos de estética" },
      {
        name: "description",
        content: "Cursos online de estética y cuidado facial con certificado.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Academia Lorena Bahos" },
      { property: "og:locale", content: "es_CO" },
      { property: "og:title", content: "Academia Lorena Bahos · Cursos de estética" },
      {
        property: "og:description",
        content: "Cursos online de cuidado facial con certificado al finalizar.",
      },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:secure_url", content: OG_IMAGE },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Academia Lorena Bahos: cursos online de estética facial",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Academia Lorena Bahos · Cursos de estética" },
      {
        name: "twitter:description",
        content: "Cursos online de cuidado facial con certificado al finalizar.",
      },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "theme-color", content: "#fbf9f6" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Figtree:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico?v=20261026", sizes: "any" },
      { rel: "icon", href: "/favicon.svg?v=20261026", type: "image/svg+xml" },
      {
        rel: "icon",
        href: "/favicon-48.png?v=20261026",
        type: "image/png",
        sizes: "48x48",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png?v=20261026",
        sizes: "180x180",
      },
      { rel: "manifest", href: "/site.webmanifest?v=20261026" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <Toaster />
      <CookieNotice />
    </QueryClientProvider>
  );
}
