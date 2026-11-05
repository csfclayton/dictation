"use client";

import type { QuizQuestion } from "@/data/quizTypes";
import { quizBank as builtInBank } from "@/data/quizBank";
import { ALL_TOPICS } from "@/lib/quizHelpers";

const CUSTOM_KEY = "quiz_custom_v1";
const DISABLED_KEY = "quiz_disabled_builtin_v1";

export type ManagedQuestion = QuizQuestion & {
  /** 內建題目不可刪除，只可停用 */
  builtin?: boolean;
  disabled?: boolean;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadCustomQuestions(): QuizQuestion[] {
  if (typeof window === "undefined") return [];
  const list = safeParse<QuizQuestion[]>(localStorage.getItem(CUSTOM_KEY), []);
  return Array.isArray(list) ? list : [];
}

export function saveCustomQuestions(list: QuizQuestion[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

export function loadDisabledIds(): string[] {
  if (typeof window === "undefined") return [];
  const list = safeParse<string[]>(localStorage.getItem(DISABLED_KEY), []);
  return Array.isArray(list) ? list : [];
}

export function saveDisabledIds(ids: string[]) {
  localStorage.setItem(DISABLED_KEY, JSON.stringify(ids));
}

/** 練習／挑戰用：內建（未停用）+ 自訂 */
export function getActiveQuizBank(): QuizQuestion[] {
  const disabled = new Set(loadDisabledIds());
  const builtin = builtInBank.filter((q) => !disabled.has(q.id));
  const custom = loadCustomQuestions();
  return [...builtin, ...custom];
}

export function getManagedList(): ManagedQuestion[] {
  const disabled = new Set(loadDisabledIds());
  const builtin: ManagedQuestion[] = builtInBank.map((q) => ({
    ...q,
    builtin: true,
    disabled: disabled.has(q.id),
  }));
  const custom: ManagedQuestion[] = loadCustomQuestions().map((q) => ({
    ...q,
    builtin: false,
    disabled: false,
  }));
  return [...custom, ...builtin];
}

export function addCustomQuestion(q: Omit<QuizQuestion, "id"> & { id?: string }): QuizQuestion {
  const list = loadCustomQuestions();
  const item: QuizQuestion = {
    id: q.id || "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    topic: q.topic,
    question: q.question.trim(),
    options: q.options.map((o) => o.trim()),
    answer: q.answer,
  };
  list.unshift(item);
  saveCustomQuestions(list);
  return item;
}

export function updateCustomQuestion(id: string, patch: Partial<QuizQuestion>): boolean {
  const list = loadCustomQuestions();
  const i = list.findIndex((q) => q.id === id);
  if (i < 0) return false;
  list[i] = { ...list[i], ...patch, id: list[i].id };
  saveCustomQuestions(list);
  return true;
}

export function deleteCustomQuestion(id: string): boolean {
  const list = loadCustomQuestions();
  const next = list.filter((q) => q.id !== id);
  if (next.length === list.length) return false;
  saveCustomQuestions(next);
  return true;
}

export function setBuiltinDisabled(id: string, disabled: boolean) {
  const set = new Set(loadDisabledIds());
  if (disabled) set.add(id);
  else set.delete(id);
  saveDisabledIds([...set]);
}

export function clearAllCustom() {
  saveCustomQuestions([]);
}

/** 解析一行 CSV（支援引號包住含逗號的欄位） */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseAnswer(ansRaw: string): number | null {
  const up = ansRaw.trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(up)) return up.charCodeAt(0) - 65;
  const n = parseInt(ansRaw.trim(), 10);
  if (!Number.isNaN(n) && n >= 0 && n <= 3) return n;
  return null;
}

function isHeaderRow(parts: string[]): boolean {
  const joined = parts.join("|").toLowerCase();
  return (
    joined.includes("主題") ||
    joined.includes("topic") ||
    joined.includes("題目") ||
    joined.includes("question") ||
    (parts[0]?.toLowerCase() === "topic" && parts[1]?.toLowerCase().includes("question"))
  );
}

/**
 * 批量匯入：支援
 * 1) 管道：主題|題目|A|B|C|D|答案
 * 2) CSV：主題,題目,A,B,C,D,答案（可有表頭）
 */
export function parseImportLines(text: string): { ok: QuizQuestion[]; errors: string[] } {
  const ok: QuizQuestion[] = [];
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  lines.forEach((line, idx) => {
    if (line.startsWith("#") || line.startsWith("//")) return;

    let parts: string[];
    if (line.includes("|")) {
      parts = line.split("|").map((p) => p.trim());
    } else {
      parts = splitCsvLine(line);
    }

    if (idx === 0 && isHeaderRow(parts)) return;

    if (parts.length < 7) {
      errors.push(`第 ${idx + 1} 行：欄位不足（需要 7 欄）`);
      return;
    }

    const [topic, question, a, b, c, d, ansRaw] = parts;
    if (!topic || !question) {
      errors.push(`第 ${idx + 1} 行：主題或題目空白`);
      return;
    }

    const answer = parseAnswer(ansRaw);
    if (answer === null) {
      errors.push(`第 ${idx + 1} 行：答案應為 A-D 或 0-3`);
      return;
    }

    ok.push({
      id: "c_" + Date.now().toString(36) + "_" + idx + Math.random().toString(36).slice(2, 5),
      topic,
      question,
      options: [a, b, c, d],
      answer,
    });
  });
  return { ok, errors };
}

export function importCustomQuestions(questions: QuizQuestion[]) {
  const list = loadCustomQuestions();
  saveCustomQuestions([...questions, ...list]);
}

export function exportCustomAsText(): string {
  return loadCustomQuestions()
    .map((q) => {
      const letter = String.fromCharCode(65 + q.answer);
      return [q.topic, q.question, ...q.options, letter].join("|");
    })
    .join("\n");
}

export function topicStats(list: ManagedQuestion[]) {
  const map: Record<string, { total: number; active: number; custom: number }> = {};
  for (const q of list) {
    if (!map[q.topic]) map[q.topic] = { total: 0, active: 0, custom: 0 };
    map[q.topic].total++;
    if (!q.disabled) map[q.topic].active++;
    if (!q.builtin) map[q.topic].custom++;
  }
  return map;
}
