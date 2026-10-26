import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("accepts Mercado Pago return URLs with a numeric payment_id", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes(
      "/cursos/cuidado-facial-esencial?payment_id=123456&status=approved",
    );

    expect(matches.at(-1)?.routeId).toBe("/cursos/$slug");
  });

  it("matches the public privacy and cookie policy pages", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    expect(router.matchRoutes("/privacidad").at(-1)?.routeId).toBe("/privacidad");
    expect(router.matchRoutes("/cookies").at(-1)?.routeId).toBe("/cookies");
  });
});
