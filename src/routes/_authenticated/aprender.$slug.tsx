import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toEmbedUrl } from "@/lib/courses";
import { issueCertificate, submitQuiz } from "@/lib/academy.functions";

export const Route = createFileRoute("/_authenticated/aprender/$slug")({
  head: () => ({
    meta: [
      { title: "Aula virtual · Academia Lorena Bahos" },
      { name: "description", content: "Lecciones, examen final y certificado." },
      { property: "og:title", content: "Aula virtual" },
      { property: "og:description", content: "Avanza en tus lecciones." },
    ],
  }),
  component: Classroom,
});

function Classroom() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [active, setActive] = useState<string | "quiz" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["classroom", slug],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: course } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!course) return null;
      const [
        { data: enrolled },
        { data: lessons },
        { data: prog },
        { data: quiz },
        { data: attempts },
        { data: cert },
        { data: profile },
      ] = await Promise.all([
        supabase.rpc("is_enrolled", { _course_id: course.id }),
        supabase.from("lessons").select("*").eq("course_id", course.id).order("position"),
        supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("course_id", course.id)
          .eq("user_id", u.user!.id),
        supabase.rpc("course_quiz", { _course_id: course.id }),
        supabase
          .from("quiz_attempts")
          .select("score,passed")
          .eq("course_id", course.id)
          .eq("user_id", u.user!.id)
          .order("score", { ascending: false })
          .limit(1),
        supabase
          .from("certificates")
          .select("id")
          .eq("course_id", course.id)
          .eq("user_id", u.user!.id)
          .maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", u.user!.id).maybeSingle(),
      ]);
      return {
        course,
        enrolled: !!enrolled,
        lessons: lessons ?? [],
        done: new Set((prog ?? []).map((p) => p.lesson_id)),
        quiz: quiz ?? [],
        best: attempts?.[0],
        cert,
        fullName: profile?.full_name ?? u.user!.user_metadata?.["full_name"] ?? "",
        userId: u.user!.id,
      };
    },
  });

  useEffect(() => {
    if (data && !active) setActive(data.lessons[0]?.id ?? "quiz");
  }, [data, active]);

  if (isLoading) return <p className="p-16 text-center text-muted-foreground">Cargando…</p>;
  if (!data) return <p className="p-16 text-center">Curso no encontrado.</p>;
  if (!data.enrolled)
    return (
      <div className="p-16 text-center">
        <p>Aún no tienes acceso a este curso.</p>
        <Link
          to="/cursos/$slug"
          params={{ slug }}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground"
        >
          Ver curso
        </Link>
      </div>
    );

  const allDone = data.lessons.every((l) => data.done.has(l.id));
  const lesson = data.lessons.find((l) => l.id === active);
  const refresh = () => qc.invalidateQueries({ queryKey: ["classroom", slug] });

  async function markDone(id: string) {
    const { error } = await supabase
      .from("lesson_progress")
      .insert({ lesson_id: id, course_id: data!.course.id, user_id: data!.userId });
    if (error && !error.message.includes("duplicate")) {
      toast.error("No se pudo guardar");
      return;
    }
    await refresh();
    const idx = data!.lessons.findIndex((l) => l.id === id);
    setActive(data!.lessons[idx + 1]?.id ?? "quiz");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-2xl border border-border bg-card p-4">
        <p className="eyebrow px-2">Curso</p>
        <h2 className="px-2 pt-1 text-2xl leading-tight">{data.course.title}</h2>
        <ul className="mt-4 space-y-1">
          {data.lessons.map((l, i) => (
            <li key={l.id}>
              <button
                onClick={() => setActive(l.id)}
                className={`flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left text-sm ${active === l.id ? "bg-accent" : "hover:bg-muted"}`}
              >
                {data.done.has(l.id) ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span>
                  {i + 1}. {l.title}
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => setActive("quiz")}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm ${active === "quiz" ? "bg-accent" : "hover:bg-muted"}`}
            >
              <Award className="h-4 w-4 text-gold" /> Examen y certificado
            </button>
          </li>
        </ul>
      </aside>

      <section>
        {lesson ? (
          <article>
            {toEmbedUrl(lesson.video_url) && (
              <div className="aspect-video overflow-hidden rounded-2xl bg-ink">
                <iframe
                  src={toEmbedUrl(lesson.video_url)!}
                  title={lesson.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <h1 className="mt-8 text-4xl">{lesson.title}</h1>
            <div className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {lesson.content}
            </div>
            <div className="mt-8">
              {data.done.has(lesson.id) ? (
                <p className="flex items-center gap-2 text-sm text-gold">
                  <CheckCircle2 className="h-4 w-4" /> Lección completada
                </p>
              ) : (
                <button
                  onClick={() => markDone(lesson.id)}
                  className="rounded-full bg-primary px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground"
                >
                  Marcar como completada
                </button>
              )}
            </div>
          </article>
        ) : (
          <QuizPanel
            courseId={data.course.id}
            quiz={data.quiz}
            allDone={allDone}
            best={data.best}
            certId={data.cert?.id}
            defaultName={data.fullName}
            passScore={data.course.pass_score}
            onChange={refresh}
            onCert={(id) => navigate({ to: "/certificado/$id", params: { id } })}
          />
        )}
      </section>
    </div>
  );
}

function QuizPanel(props: {
  courseId: string;
  quiz: { id: string; question: string; options: unknown }[];
  allDone: boolean;
  best?: { score: number; passed: boolean } | undefined;
  certId?: string | undefined;
  defaultName: string;
  passScore: number;
  onChange: () => void;
  onCert: (id: string) => void;
}) {
  const submit = useServerFn(submitQuiz);
  const issue = useServerFn(issueCertificate);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [name, setName] = useState(props.defaultName);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  if (props.certId)
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Award className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-4 text-4xl">¡Curso completado!</h1>
        <button
          onClick={() => props.onCert(props.certId!)}
          className="mt-6 rounded-full bg-gold px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-gold-foreground"
        >
          Ver mi certificado
        </button>
      </div>
    );

  if (!props.allDone)
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="text-4xl">Examen final</h1>
        <p className="mt-3 text-muted-foreground">
          Completa todas las lecciones para desbloquear el examen.
        </p>
      </div>
    );

  const passed = result?.passed || props.best?.passed;

  async function doSubmit() {
    if (Object.keys(answers).length < props.quiz.length) {
      toast.error("Responde todas las preguntas");
      return;
    }
    setBusy(true);
    try {
      const r = await submit({ data: { courseId: props.courseId, answers } });
      setResult(r);
      toast[r.passed ? "success" : "error"](
        r.passed
          ? `¡Aprobaste con ${r.score}%!`
          : `Obtuviste ${r.score}%. Necesitas ${props.passScore}%.`,
      );
      props.onChange();
    } finally {
      setBusy(false);
    }
  }

  async function doIssue() {
    setBusy(true);
    try {
      const r = await issue({ data: { courseId: props.courseId, fullName: name } });
      props.onCert(r.id);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  if (passed)
    return (
      <div className="rounded-2xl border border-border bg-card p-10">
        <p className="eyebrow">Aprobado · {result?.score ?? props.best?.score}%</p>
        <h1 className="mt-3 text-4xl">
          Tu <em className="text-gold">certificado</em>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Escribe tu nombre tal como quieres que aparezca en el certificado.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="Nombre completo"
          className="mt-6 w-full rounded-full border border-input bg-background px-5 py-3.5"
        />
        <button
          onClick={doIssue}
          disabled={busy || name.trim().length < 3}
          className="mt-5 rounded-full bg-gold px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-60"
        >
          Emitir certificado
        </button>
      </div>
    );

  return (
    <div>
      <p className="eyebrow">Examen final · Aprobación {props.passScore}%</p>
      <h1 className="mt-3 text-4xl">Pon a prueba lo aprendido</h1>
      <ol className="mt-8 space-y-6">
        {props.quiz.map((q, i) => (
          <li key={q.id} className="rounded-2xl border border-border bg-card p-6">
            <p className="font-medium">
              {i + 1}. {q.question}
            </p>
            <div className="mt-4 space-y-2">
              {(q.options as string[]).map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${answers[q.id] === oi ? "border-gold bg-accent" : "border-border"}`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === oi}
                    onChange={() => setAnswers({ ...answers, [q.id]: oi })}
                    className="accent-[var(--gold)]"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button
        onClick={doSubmit}
        disabled={busy}
        className="mt-8 rounded-full bg-primary px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-60"
      >
        {busy ? "Calificando…" : "Enviar respuestas"}
      </button>
    </div>
  );
}
