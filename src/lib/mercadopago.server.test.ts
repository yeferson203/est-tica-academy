import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPreference } from "./mercadopago.server";

const fetchMock = vi.fn<typeof fetch>();

describe("Mercado Pago course return", () => {
  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "test-token");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ init_point: "https://mercadopago.example/checkout" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("returns every payment result to the purchased course", async () => {
    await createPreference({
      courseId: "course-id",
      title: "Cuidado facial",
      price: 180000,
      userId: "user-id",
      courseSlug: "cuidado-facial-esencial",
      origin: "https://academia.example",
    });

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.back_urls).toEqual({
      success: "https://academia.example/cursos/cuidado-facial-esencial",
      failure: "https://academia.example/cursos/cuidado-facial-esencial",
      pending: "https://academia.example/cursos/cuidado-facial-esencial",
    });
    expect(request.auto_return).toBe("approved");
  });

  it("omits automatic return for localhost, where Mercado Pago requires HTTPS", async () => {
    await createPreference({
      courseId: "course-id",
      title: "Cuidado facial",
      price: 180000,
      userId: "user-id",
      courseSlug: "cuidado-facial-esencial",
      origin: "http://localhost:5173",
    });

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.back_urls.success).toBe("http://localhost:5173/cursos/cuidado-facial-esencial");
    expect(request).not.toHaveProperty("auto_return");
  });
});
