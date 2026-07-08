import type { CursoUfu } from "@/data/ufu/vestibular";

// Slug no formato do pSEO: <nome>-<turno>-<cidade> (minusculas, sem acento, hifens)
export function slugCursoUfu(curso: Pick<CursoUfu, "nome" | "turno" | "cidade">): string {
  return slugify(`${curso.nome}-${curso.turno}-${curso.cidade}`);
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
