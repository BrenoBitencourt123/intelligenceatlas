import { describe, it, expect } from 'vitest';
import {
  DISCIPLINAS,
  TOPICS,
  SKILLS,
  validateTopicIds,
  validateSkillIds,
  validateDisciplinaId,
  getTopicsForArea,
  getTopicIdsForArea,
  getTopicLabel,
  getSkillLabel,
  getDisciplinaLabel,
  getDisciplinasForArea,
  filterValidTopicIds,
  filterValidSkillIds,
  normalizeIds,
} from '../taxonomy';

// ── DISCIPLINAS ─────────────────────────────────────────────────────────────

describe('DISCIPLINAS', () => {
  it('covers all 4 ENEM areas', () => {
    const areas = Object.keys(DISCIPLINAS);
    expect(areas).toContain('humanas');
    expect(areas).toContain('natureza');
    expect(areas).toContain('linguagens');
    expect(areas).toContain('matematica');
  });

  it('humanas has 4 disciplinas', () => {
    expect(DISCIPLINAS.humanas).toHaveLength(4);
  });

  it('natureza has 3 disciplinas', () => {
    expect(DISCIPLINAS.natureza).toHaveLength(3);
  });

  it('all disciplinas have id, label, area', () => {
    for (const discs of Object.values(DISCIPLINAS)) {
      for (const d of discs) {
        expect(d.id).toBeTruthy();
        expect(d.label).toBeTruthy();
        expect(d.area).toBeTruthy();
      }
    }
  });
});

// ── TOPICS ──────────────────────────────────────────────────────────────────

describe('TOPICS', () => {
  it('has topics for all disciplinas', () => {
    for (const discs of Object.values(DISCIPLINAS)) {
      for (const d of discs) {
        expect(TOPICS[d.id]).toBeDefined();
        expect(TOPICS[d.id].length).toBeGreaterThan(0);
      }
    }
  });

  it('all topic IDs follow {disciplina}__{subtopic} format', () => {
    for (const [disciplina, topics] of Object.entries(TOPICS)) {
      for (const t of topics) {
        expect(t.id.startsWith(`${disciplina}__`)).toBe(true);
      }
    }
  });

  it('fisica has cinematica', () => {
    const ids = TOPICS.fisica.map((t) => t.id);
    expect(ids).toContain('fisica__cinematica');
  });

  it('historia has brasil_colonia', () => {
    const ids = TOPICS.historia.map((t) => t.id);
    expect(ids).toContain('historia__brasil_colonia');
  });

  it('matematica has proporcionalidade', () => {
    const ids = TOPICS.matematica.map((t) => t.id);
    expect(ids).toContain('matematica__proporcionalidade');
  });

  it('no duplicate IDs across all topics', () => {
    const allIds = Object.values(TOPICS).flatMap((ts) => ts.map((t) => t.id));
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });
});

// ── SKILLS ──────────────────────────────────────────────────────────────────

describe('SKILLS', () => {
  it('has exactly 21 skills', () => {
    expect(SKILLS).toHaveLength(21);
  });

  it('contains interpretacao_grafico', () => {
    expect(SKILLS.map((s) => s.id)).toContain('interpretacao_grafico');
  });

  it('contains all expected skill IDs', () => {
    const ids = SKILLS.map((s) => s.id);
    expect(ids).toContain('aplicacao_formula');
    expect(ids).toContain('impacto_socioambiental');
    expect(ids).toContain('ciencia_no_cotidiano');
    expect(ids).toContain('interpretacao_fonte_historica');
  });

  it('no duplicate skill IDs', () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── validateTopicIds ─────────────────────────────────────────────────────────

describe('validateTopicIds', () => {
  it('returns true for valid ID', () => {
    expect(validateTopicIds(['fisica__cinematica'])).toBe(true);
  });

  it('returns true for multiple valid IDs', () => {
    expect(validateTopicIds(['fisica__cinematica', 'biologia__genetica'])).toBe(true);
  });

  it('returns false for invalid ID', () => {
    expect(validateTopicIds(['fisica__inventado'])).toBe(false);
  });

  it('returns false for completely made-up ID', () => {
    expect(validateTopicIds(['xyz__abc'])).toBe(false);
  });

  it('returns false if any ID in list is invalid', () => {
    expect(validateTopicIds(['fisica__cinematica', 'fake__id'])).toBe(false);
  });

  it('returns true for empty array', () => {
    expect(validateTopicIds([])).toBe(true);
  });
});

// ── validateSkillIds ─────────────────────────────────────────────────────────

describe('validateSkillIds', () => {
  it('returns true for valid skill', () => {
    expect(validateSkillIds(['interpretacao_grafico'])).toBe(true);
  });

  it('returns false for invalid skill', () => {
    expect(validateSkillIds(['habilidade_inventada'])).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateSkillIds([''])).toBe(false);
  });

  it('returns true for multiple valid skills', () => {
    expect(validateSkillIds(['interpretacao_grafico', 'aplicacao_formula'])).toBe(true);
  });
});

// ── validateDisciplinaId ─────────────────────────────────────────────────────

describe('validateDisciplinaId', () => {
  it('returns true for valid disciplina', () => {
    expect(validateDisciplinaId('fisica')).toBe(true);
    expect(validateDisciplinaId('historia')).toBe(true);
    expect(validateDisciplinaId('matematica')).toBe(true);
  });

  it('returns false for invalid disciplina', () => {
    expect(validateDisciplinaId('inventada')).toBe(false);
    expect(validateDisciplinaId('')).toBe(false);
  });
});

// ── getTopicsForArea ─────────────────────────────────────────────────────────

describe('getTopicsForArea', () => {
  it('returns topics for natureza (fisica + quimica + biologia)', () => {
    const topics = getTopicsForArea('natureza');
    const ids = topics.map((t) => t.id);
    expect(ids).toContain('fisica__cinematica');
    expect(ids).toContain('quimica__estequiometria');
    expect(ids).toContain('biologia__genetica');
  });

  it('returns empty array for unknown area', () => {
    expect(getTopicsForArea('desconhecida')).toHaveLength(0);
  });

  it('all returned topics have correct area field', () => {
    const topics = getTopicsForArea('humanas');
    expect(topics.every((t) => t.area === 'humanas')).toBe(true);
  });
});

// ── getTopicIdsForArea ───────────────────────────────────────────────────────

describe('getTopicIdsForArea', () => {
  it('returns string array for matematica', () => {
    const ids = getTopicIdsForArea('matematica');
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain('matematica__proporcionalidade');
  });
});

// ── label helpers ────────────────────────────────────────────────────────────

describe('getTopicLabel', () => {
  it('returns correct label', () => {
    expect(getTopicLabel('historia__brasil_colonia')).toBe('Brasil Colônia');
    expect(getTopicLabel('fisica__cinematica')).toBe('Cinemática');
  });

  it('returns undefined for unknown ID', () => {
    expect(getTopicLabel('fake__id')).toBeUndefined();
  });
});

describe('getSkillLabel', () => {
  it('returns correct label', () => {
    expect(getSkillLabel('interpretacao_grafico')).toBe('Interpretação de Gráfico');
  });

  it('returns undefined for unknown skill', () => {
    expect(getSkillLabel('nao_existe')).toBeUndefined();
  });
});

describe('getDisciplinaLabel', () => {
  it('returns label for fisica', () => {
    expect(getDisciplinaLabel('fisica')).toBe('Física');
  });
});

// ── filterValidTopicIds ──────────────────────────────────────────────────────

describe('filterValidTopicIds', () => {
  it('removes invalid IDs and returns count', () => {
    const [valid, removed] = filterValidTopicIds(['fisica__cinematica', 'fake__id', 'biologia__genetica']);
    expect(valid).toEqual(['fisica__cinematica', 'biologia__genetica']);
    expect(removed).toBe(1);
  });

  it('returns all valid if all valid', () => {
    const [valid, removed] = filterValidTopicIds(['fisica__cinematica']);
    expect(valid).toHaveLength(1);
    expect(removed).toBe(0);
  });
});

describe('filterValidSkillIds', () => {
  it('removes invalid skill IDs', () => {
    const [valid, removed] = filterValidSkillIds(['interpretacao_grafico', 'inventado']);
    expect(valid).toEqual(['interpretacao_grafico']);
    expect(removed).toBe(1);
  });
});

// ── normalizeIds ─────────────────────────────────────────────────────────────

describe('normalizeIds', () => {
  it('removes duplicates', () => {
    const result = normalizeIds(['a', 'b', 'a'], 10);
    expect(result).toEqual(['a', 'b']);
  });

  it('limits to maxLength', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const result = normalizeIds(ids, 3);
    expect(result).toHaveLength(3);
  });
});

// ── Mastery score formula ────────────────────────────────────────────────────

describe('Bayesian mastery score formula', () => {
  const score = (correct: number, attempts: number) => (correct + 1) / (attempts + 2);

  it('yields 0.5 for 0 attempts (neutral prior)', () => {
    expect(score(0, 0)).toBeCloseTo(0.5);
  });

  it('yields ~0.167 for 0 correct in 4 attempts', () => {
    expect(score(0, 4)).toBeCloseTo(1 / 6);
  });

  it('yields ~0.833 for 4 correct in 4 attempts', () => {
    expect(score(4, 4)).toBeCloseTo(5 / 6);
  });

  it('approaches 1 with many correct answers', () => {
    expect(score(100, 100)).toBeCloseTo(101 / 102);
  });
});

// ── getDisciplinasForArea ────────────────────────────────────────────────────

describe('getDisciplinasForArea', () => {
  it('returns 3 disciplinas for natureza', () => {
    const discs = getDisciplinasForArea('natureza');
    expect(discs.map((d) => d.id)).toContain('fisica');
    expect(discs.map((d) => d.id)).toContain('quimica');
    expect(discs.map((d) => d.id)).toContain('biologia');
  });

  it('returns empty array for unknown area', () => {
    expect(getDisciplinasForArea('unknown')).toHaveLength(0);
  });
});
