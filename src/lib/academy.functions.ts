import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scorePercent } from "./courses";

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ courseId: z.string().uuid(), origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: course, error } = await context.supabase
      .from("courses")
      .select("id,title,price_cop,published,slug")
      .eq("id", data.courseId)
      .maybeSingle();
    if (error || !course || !course.published) throw new Error("Curso no disponible");

    if (course.price_cop <= 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("enrollments")
        .upsert(
          { user_id: context.userId, course_id: course.id, amount: 0 },
          { onConflict: "user_id,course_id" },
        );
      return { free: true as const, url: null };
    }

    const { createPreference } = await import("./mercadopago.server");
    const url = await createPreference({
      courseId: course.id,
      title: course.title,
      price: course.price_cop,
      userId: context.userId,
      courseSlug: course.slug,
      email: (context.claims as { email?: string }).email,
      origin: new URL(data.origin).origin,
    });
    return { free: false as const, url };
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ paymentId: z.string().regex(/^\d{1,30}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { verifyAndEnroll } = await import("./mercadopago.server");
    const r = await verifyAndEnroll(data.paymentId);
    if (r.status === "approved" && r.userId !== context.userId) return { status: "error" };
    return { status: r.status, courseId: r.status === "approved" ? r.courseId : null };
  });

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        courseId: z.string().uuid(),
        answers: z.record(z.string().uuid(), z.number().int().min(0).max(20)),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: enrolled } = await context.supabase.rpc("is_enrolled", {
      _course_id: data.courseId,
    });
    if (!enrolled) throw new Error("No estás inscrita en este curso");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: qs }, { data: course }] = await Promise.all([
      supabaseAdmin
        .from("quiz_questions")
        .select("id,correct_index")
        .eq("course_id", data.courseId),
      supabaseAdmin.from("courses").select("pass_score").eq("id", data.courseId).single(),
    ]);
    const total = qs?.length ?? 0;
    const correct = (qs ?? []).filter((q) => data.answers[q.id] === q.correct_index).length;
    const score = total === 0 ? 100 : scorePercent(correct, total);
    const passed = score >= (course?.pass_score ?? 70);
    await supabaseAdmin
      .from("quiz_attempts")
      .insert({ user_id: context.userId, course_id: data.courseId, score, passed });
    return { score, passed, correct, total };
  });

export const issueCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({ courseId: z.string().uuid(), fullName: z.string().trim().min(3).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    const { data: existing } = await supabaseAdmin
      .from("certificates")
      .select("id")
      .eq("user_id", uid)
      .eq("course_id", data.courseId)
      .maybeSingle();
    if (existing) return { id: existing.id };

    const [
      { data: enr },
      { data: course },
      { count: lessonCount },
      { count: doneCount },
      { data: best },
    ] = await Promise.all([
      supabaseAdmin
        .from("enrollments")
        .select("id")
        .eq("user_id", uid)
        .eq("course_id", data.courseId)
        .maybeSingle(),
      supabaseAdmin.from("courses").select("title").eq("id", data.courseId).single(),
      supabaseAdmin
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", data.courseId),
      supabaseAdmin
        .from("lesson_progress")
        .select("lesson_id", { count: "exact", head: true })
        .eq("course_id", data.courseId)
        .eq("user_id", uid),
      supabaseAdmin
        .from("quiz_attempts")
        .select("score")
        .eq("course_id", data.courseId)
        .eq("user_id", uid)
        .eq("passed", true)
        .order("score", { ascending: false })
        .limit(1),
    ]);
    if (!enr) throw new Error("No estás inscrita en este curso");
    if ((doneCount ?? 0) < (lessonCount ?? 0))
      throw new Error("Completa todas las lecciones primero");
    if (!best?.length) throw new Error("Debes aprobar el examen final");

    await supabaseAdmin.from("profiles").update({ full_name: data.fullName }).eq("id", uid);
    const { data: cert, error } = await supabaseAdmin
      .from("certificates")
      .insert({
        user_id: uid,
        course_id: data.courseId,
        full_name: data.fullName,
        course_title: course!.title,
        score: best[0]!.score,
      })
      .select("id")
      .single();
    if (error) throw new Error("No se pudo emitir el certificado");
    return { id: cert.id };
  });
