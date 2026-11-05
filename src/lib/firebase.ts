"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch,
  doc,
  getDoc,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { FIREBASE_ENABLED, firebaseConfig } from "@/lib/firebaseConfig";
import type { LeaderboardEntry } from "@/lib/quizHelpers";
import type { QuizQuestion } from "@/data/quizTypes";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function isCloudSyncEnabled(): boolean {
  return FIREBASE_ENABLED;
}

function getDb(): Firestore | null {
  if (!FIREBASE_ENABLED) return null;
  if (typeof window === "undefined") return null;
  try {
    if (!app) {
      app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    }
    if (!db) {
      db = getFirestore(app);
    }
    return db;
  } catch (e) {
    console.error("Firebase init failed", e);
    return null;
  }
}

const COL = "leaderboard";

export async function cloudLoadLeaderboard(): Promise<LeaderboardEntry[] | null> {
  const database = getDb();
  if (!database) return null;
  try {
    const q = query(collection(database, COL), orderBy("score", "desc"), limit(50));
    const snap = await getDocs(q);
    const list: LeaderboardEntry[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        id: docSnap.id,
        name: String(d.name ?? "匿名"),
        topics: String(d.topics ?? ""),
        score: Number(d.score ?? 0),
        date: String(d.date ?? ""),
        time: String(d.time ?? ""),
        wrongCount: Number(d.wrongCount ?? 0),
      });
    });
    return list;
  } catch (e) {
    console.error("cloudLoadLeaderboard", e);
    return null;
  }
}

export async function cloudSaveLeaderboardEntry(
  entry: Omit<LeaderboardEntry, "id"> & { id?: string }
): Promise<boolean> {
  const database = getDb();
  if (!database) return false;
  try {
    await addDoc(collection(database, COL), {
      name: entry.name.slice(0, 20),
      topics: entry.topics.slice(0, 80),
      score: Number(entry.score),
      date: entry.date,
      time: entry.time,
      wrongCount: Number(entry.wrongCount) || 0,
      createdAt: Date.now(),
    });
    return true;
  } catch (e) {
    console.error("cloudSaveLeaderboardEntry", e);
    return false;
  }
}

export async function cloudClearLeaderboard(): Promise<boolean> {
  const database = getDb();
  if (!database) return false;
  try {
    const snap = await getDocs(collection(database, COL));
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 450) {
      const batch = writeBatch(database);
      docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return true;
  } catch (e) {
    console.error("cloudClearLeaderboard", e);
    return false;
  }
}

/** 題庫雲端：quiz_settings/main */
export async function cloudLoadQuizBank(): Promise<{
  custom: QuizQuestion[];
  disabled: string[];
  updatedAt: number;
} | null> {
  const database = getDb();
  if (!database) return null;
  try {
    const ref = doc(database, "quiz_settings", "main");
    const snap = await getDoc(ref);
    if (!snap.exists()) return { custom: [], disabled: [], updatedAt: 0 };
    const d = snap.data();
    const custom = Array.isArray(d.custom) ? (d.custom as QuizQuestion[]) : [];
    const disabled = Array.isArray(d.disabled) ? d.disabled.map(String) : [];
    return {
      custom,
      disabled,
      updatedAt: Number(d.updatedAt || 0),
    };
  } catch (e) {
    console.error("cloudLoadQuizBank", e);
    return null;
  }
}

export async function cloudSaveQuizBank(
  custom: QuizQuestion[],
  disabled: string[]
): Promise<boolean> {
  const database = getDb();
  if (!database) return false;
  try {
    const ref = doc(database, "quiz_settings", "main");
    await setDoc(ref, {
      custom,
      disabled,
      updatedAt: Date.now(),
    });
    return true;
  } catch (e) {
    console.error("cloudSaveQuizBank", e);
    return false;
  }
}
