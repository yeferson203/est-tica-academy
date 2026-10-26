import img1 from "@/assets/curso-1.jpg";
import img2 from "@/assets/curso-2.jpg";
import img3 from "@/assets/curso-3.jpg";

const fallback: Record<string, string> = {
  "cuidado-facial-esencial": img1,
  "limpieza-facial-profunda": img2,
  "masaje-facial-drenaje": img3,
};

export function courseImage(c: { slug: string; image_url?: string | null }) {
  return c.image_url || fallback[c.slug] || img1;
}

export function formatCOP(v: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);
}

/** Converts YouTube/Vimeo watch links to embeddable URLs. */
export function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

/** Score percentage, rounded. */
export function scorePercent(correct: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}
