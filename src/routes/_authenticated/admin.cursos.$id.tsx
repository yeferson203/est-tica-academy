import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
type Question = Database["public"]["Tables"]["quiz_questions"]["Row"];

export const Route = createFileRoute("/_authenticated/admin/cursos/$id")({
  component: EditCourse,
});

const input = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm";
const btn = "rounded-full bg-primary px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.2em] text-primary-foreground";

function EditCourse() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["admin-course", id],
    queryFn: async () => {
      const [{ data: c }, { data: l }, { data: q }] = await Promise.all([
        supabase.from("courses").select("*").eq("id", id).single(),
        supabase.from("lessons").select("*").eq("course_id", id).order("position"),
        supabase.from("quiz_questions").select("*").eq("course_id", id).order("position"),
      ]);
      return { course: c as Course, lessons: l ?? [], questions: q ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-course", id] });
  if (!data?.course) return <p className="text-muted-foreground">Cargando…</p>;

  async function removeCourse() {
    if (!confirm("¿Eliminar este curso y todo su contenido?")) return;
    await supabase.from("courses").delete().eq("id", id);
    navigate({ to: "/admin" });
  }

  return (
    <div className="space-y-10">
      <Link to="/admin" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">← Cursos</Link>
      <CourseForm course={data.course} onSaved={refresh} />

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl">Lecciones</h2>
          <button className={btn} onClick={async () => {
            await supabase.from("lessons").insert({ course_id: id, title: "Nueva lección", position: data.lessons.length + 1 });
            refresh();
          }}><Plus className="inline h-4 w-4" /> Lección</button>
        </div>
        <div className="mt-4 space-y-4">
          {data.lessons.map((l) => <LessonForm key={l.id} lesson={l} onChange={refresh} />)}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl">Examen final</h2>
          <button className={btn} onClick={async () => {
            await supabase.from("quiz_questions").insert({ course_id: id, question: "Nueva pregunta", options: ["Opción A", "Opción B", "Opción C"], correct_index: 0, position: data.questions.length + 1 });
            refresh();
          }}><Plus className="inline h-4 w-4" /> Pregunta</button>
        </div>
        <div className="mt-4 space-y-4">
          {data.questions.map((q) => <QuestionForm key={q.id} q={q} onChange={refresh} />)}
        </div>
      </section>

      <button onClick={removeCourse} className="text-sm text-destructive">Eliminar curso</button>
    </div>
  );
}

function CourseForm({ course, onSaved }: { course: Course; onSaved: () => void }) {
  const [f, setF] = useState(course);
  useEffect(() => setF(course), [course]);
  const set = (k: keyof Course, v: unknown) => setF({ ...f, [k]: v });
  async function save() {
    const { error } = await supabase.from("courses").update({
      title: f.title, slug: f.slug, subtitle: f.subtitle, description: f.description, image_url: f.image_url || null,
      price_cop: Number(f.price_cop) || 0, duration: f.duration, level: f.level, pass_score: Number(f.pass_score) || 70, published: f.published,
    }).eq("id", course.id);
    if (error) return toast.error(error.message);
    toast.success("Curso guardado");
    onSaved();
  }
  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
      <Field label="Título"><input className={input} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <Field label="Dirección (slug)"><input className={input} value={f.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></Field>
      <Field label="Subtítulo"><input className={input} value={f.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} /></Field>
      <Field label="URL de imagen (opcional)"><input className={input} value={f.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} /></Field>
      <Field label="Precio (COP)"><input type="number" min={0} className={input} value={f.price_cop} onChange={(e) => set("price_cop", e.target.value)} /></Field>
      <Field label="Nota mínima examen (%)"><input type="number" min={0} max={100} className={input} value={f.pass_score} onChange={(e) => set("pass_score", e.target.value)} /></Field>
      <Field label="Duración"><input className={input} value={f.duration ?? ""} onChange={(e) => set("duration", e.target.value)} /></Field>
      <Field label="Nivel"><input className={input} value={f.level ?? ""} onChange={(e) => set("level", e.target.value)} /></Field>
      <div className="md:col-span-2"><Field label="Descripción"><textarea rows={4} className={input} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.published} onChange={(e) => set("published", e.target.checked)} /> Publicado</label>
      <div className="md:text-right"><button className={btn} onClick={save}>Guardar curso</button></div>
    </section>
  );
}

function LessonForm({ lesson, onChange }: { lesson: Lesson; onChange: () => void }) {
  const [f, setF] = useState(lesson);
  async function save() {
    const { error } = await supabase.from("lessons").update({ title: f.title, position: Number(f.position), video_url: f.video_url, content: f.content }).eq("id", lesson.id);
    if (error) return toast.error(error.message);
    toast.success("Lección guardada");
    onChange();
  }
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[80px_1fr_1fr]">
      <Field label="Orden"><input type="number" className={input} value={f.position} onChange={(e) => setF({ ...f, position: Number(e.target.value) })} /></Field>
      <Field label="Título"><input className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      <Field label="Video (YouTube o Vimeo)"><input className={input} value={f.video_url ?? ""} onChange={(e) => setF({ ...f, video_url: e.target.value })} /></Field>
      <div className="md:col-span-3"><Field label="Texto de la lección"><textarea rows={4} className={input} value={f.content ?? ""} onChange={(e) => setF({ ...f, content: e.target.value })} /></Field></div>
      <div className="flex gap-3 md:col-span-3 md:justify-end">
        <button onClick={async () => { await supabase.from("lessons").delete().eq("id", lesson.id); onChange(); }} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
        <button className={btn} onClick={save}>Guardar</button>
      </div>
    </div>
  );
}

function QuestionForm({ q, onChange }: { q: Question; onChange: () => void }) {
  const [question, setQuestion] = useState(q.question);
  const [options, setOptions] = useState<string[]>((q.options as string[]) ?? []);
  const [correct, setCorrect] = useState(q.correct_index);
  async function save() {
    const clean = options.map((o) => o.trim()).filter(Boolean);
    if (clean.length < 2) return toast.error("Mínimo 2 opciones");
    const { error } = await supabase.from("quiz_questions").update({ question, options: clean, correct_index: Math.min(correct, clean.length - 1) }).eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success("Pregunta guardada");
    onChange();
  }
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <Field label="Pregunta"><input className={input} value={question} onChange={(e) => setQuestion(e.target.value)} /></Field>
      {options.map((o, i) => (
        <div key={i} className="flex items-center gap-3">
          <input type="radio" checked={correct === i} onChange={() => setCorrect(i)} title="Respuesta correcta" />
          <input className={input} value={o} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} />
          <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button onClick={() => setOptions([...options, ""])} className="text-xs uppercase tracking-[0.2em] text-gold">+ Opción</button>
        <div className="flex gap-3">
          <button onClick={async () => { await supabase.from("quiz_questions").delete().eq("id", q.id); onChange(); }} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          <button className={btn} onClick={save}>Guardar</button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Marca el círculo de la respuesta correcta.</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
