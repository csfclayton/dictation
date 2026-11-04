"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type WordItem = { text: string; jyutping?: string };

type WordGroup = {
  id: string;
  name: string;
  words: WordItem[];
};

const defaultGroups: WordGroup[] = [
  {
    id: "default",
    name: "預設詞庫",
    words: [
      { text: "爸爸", jyutping: "baa4 baa1" },
      { text: "媽媽", jyutping: "maa4 maa1" },
      { text: "哥哥", jyutping: "go4 go1" },
      { text: "姐姐", jyutping: "ze4 ze1" },
      { text: "弟弟", jyutping: "dai6 dai2" },
      { text: "妹妹", jyutping: "mui6 mui2" },
      { text: "學校", jyutping: "hok6 haau6" },
      { text: "老師", jyutping: "lou5 si1" },
      { text: "同學", jyutping: "tung4 hok6" },
      { text: "書包", jyutping: "syu1 baau1" },
      { text: "功課", jyutping: "gung1 fo3" },
      { text: "默書", jyutping: "mak6 syu1" },
      { text: "練習", jyutping: "lin6 zaap6" },
      { text: "香港", jyutping: "hoeng1 gong2" },
      { text: "廣東話", jyutping: "gwong2 dung1 waa2" },
      { text: "朋友", jyutping: "pang4 jau5" },
      { text: "今天", jyutping: "gam1 tin1" },
      { text: "太陽", jyutping: "taai3 joeng4" },
      { text: "水", jyutping: "seoi2" },
      { text: "飯", jyutping: "faan6" },
      { text: "書", jyutping: "syu1" },
      { text: "貓", jyutping: "maau1" },
      { text: "狗", jyutping: "gau2" },
    ],
  },
];

const STORAGE_KEY = "dictation_groups_v2";

type Mode = "menu" | "manage" | "select" | "ocr" | "practice";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** 圖像預處理：灰階 + 提高對比度 + 適度放大，提升 OCR 準確度 */
async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 如果圖片太細，放大到合理尺寸（有助中文識別）
      const minWidth = 1200;
      let scale = 1;
      if (img.width < minWidth) {
        scale = minWidth / img.width;
      }
      // 限制最大不要太大，避免手機記憶體問題
      scale = Math.min(scale, 2.5);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 灰階 + 提高對比度
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const contrast = 35; // 對比度強度
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        // 灰階
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // 對比度
        let val = factor * (gray - 128) + 128;
        val = Math.max(0, Math.min(255, val));
        data[i] = data[i + 1] = data[i + 2] = val;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("圖片載入失敗"));
    };

    img.src = url;
  });
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("menu");
  const [groups, setGroups] = useState<WordGroup[]>(defaultGroups);
  const [activeGroupId, setActiveGroupId] = useState<string>("default");
  const [loaded, setLoaded] = useState(false);

  const [practiceList, setPracticeList] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85);

  const [newGroupName, setNewGroupName] = useState("");
  const [newText, setNewText] = useState("");
  const [newJyutping, setNewJyutping] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [message, setMessage] = useState("");

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(["default"]);

  const [ocrText, setOcrText] = useState("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeGroup =
    groups.find((g) => g.id === activeGroupId) || groups[0] || defaultGroups[0];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
          setActiveGroupId(parsed[0].id);
          setSelectedGroupIds([parsed[0].id]);
        }
      }
    } catch (e) {
      console.error("載入詞庫失敗", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  const saveGroups = useCallback((newGroups: WordGroup[]) => {
    setGroups(newGroups);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newGroups));
    } catch (e) {
      console.error("儲存失敗", e);
      alert("儲存失敗，可能係瀏覽器儲存空間不足");
    }
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const stopAudio = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    utteranceRef.current = null;
  }, []);

  const playAudio = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) {
        alert("你的瀏覽器不支援語音合成");
        return;
      }
      stopAudio();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-HK";
      utterance.rate = speechRate;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      setIsPlaying(true);
      speechSynthesis.speak(utterance);
    },
    [speechRate, stopAudio]
  );

  const togglePlayPause = useCallback(() => {
    if (!practiceList[currentIndex]) return;
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio(practiceList[currentIndex].text);
    }
  }, [isPlaying, currentIndex, practiceList, playAudio, stopAudio]);

  useEffect(() => {
    if (mode !== "practice") return;
    const handler = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, togglePlayPause]);

  const checkAnswer = () => {
    const item = practiceList[currentIndex];
    if (!item) return;
    if (input.trim() === item.text.trim()) {
      setResult("correct");
      setScore((s) => s + 1);
    } else {
      setResult("wrong");
    }
  };

  const goTo = (index: number) => {
    stopAudio();
    setInput("");
    setResult(null);
    setCurrentIndex(index);
  };

  const nextItem = () => goTo((currentIndex + 1) % practiceList.length);
  const prevItem = () => goTo((currentIndex - 1 + practiceList.length) % practiceList.length);

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) {
      alert("請輸入詞庫名稱");
      return;
    }
    const newGroup: WordGroup = { id: generateId(), name, words: [] };
    const updated = [...groups, newGroup];
    saveGroups(updated);
    setActiveGroupId(newGroup.id);
    setNewGroupName("");
    showMessage(`已新增詞庫「${name}」`);
  };

  const deleteGroup = (id: string) => {
    if (groups.length <= 1) {
      alert("至少要保留一個詞庫");
      return;
    }
    const target = groups.find((g) => g.id === id);
    if (!confirm(`確定刪除詞庫「${target?.name}」？入面嘅詞語都會消失。`)) return;

    const updated = groups.filter((g) => g.id !== id);
    saveGroups(updated);

    if (activeGroupId === id) setActiveGroupId(updated[0].id);
    setSelectedGroupIds((prev) => {
      const next = prev.filter((x) => x !== id);
      return next.length > 0 ? next : [updated[0].id];
    });
    showMessage("已刪除詞庫");
  };

  const renameGroup = (id: string) => {
    const name = editGroupName.trim();
    if (!name) return;
    const updated = groups.map((g) => (g.id === id ? { ...g, name } : g));
    saveGroups(updated);
    setEditingGroupId(null);
    showMessage("已重新命名");
  };

  const addWordToActive = () => {
    const text = newText.trim();
    if (!text) {
      alert("請輸入中文詞語");
      return;
    }
    const current = groups.find((g) => g.id === activeGroupId) || groups[0];
    if (!current) return;
    if (current.words.some((w) => w.text === text)) {
      alert("呢個詞語已經存在於此詞庫");
      return;
    }
    const updated = groups.map((g) =>
      g.id === activeGroupId
        ? { ...g, words: [...g.words, { text, jyutping: newJyutping.trim() || undefined }] }
        : g
    );
    saveGroups(updated);
    setNewText("");
    setNewJyutping("");
    showMessage(`已加入「${text}」`);
  };

  const deleteWord = (wordIndex: number) => {
    const current = groups.find((g) => g.id === activeGroupId) || groups[0];
    if (!current || !current.words[wordIndex]) return;
    if (!confirm(`確定刪除「${current.words[wordIndex].text}」？`)) return;
    const updated = groups.map((g) =>
      g.id === activeGroupId
        ? { ...g, words: g.words.filter((_, i) => i !== wordIndex) }
        : g
    );
    saveGroups(updated);
    showMessage("已刪除詞語");
  };

  const startSelectedPractice = () => {
    const selected = groups.filter((g) => selectedGroupIds.includes(g.id));
    const allWords = selected.flatMap((g) => g.words);
    if (allWords.length === 0) {
      alert("所選詞庫冇任何詞語，請先去詞庫管理加入詞語");
      return;
    }
    setPracticeList(allWords);
    setCurrentIndex(0);
    setScore(0);
    setInput("");
    setResult(null);
    setMode("practice");
  };

  const toggleSelectGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ===== 優化後的 OCR =====
  const handleImage = async (file: File) => {
    setOcrStatus("loading");
    setOcrProgress(0);
    setOcrText("");

    try {
      // 1. 預處理圖像
      setOcrProgress(5);
      const canvas = await preprocessImage(file);

      // 2. 建立 Tesseract worker
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("chi_tra", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            // 預處理佔約 10%，識別佔 90%
            setOcrProgress(10 + Math.round((m.progress || 0) * 90));
          }
        },
      });

      // 3. 設定較適合課文嘅參數（PSM 6 = 單一均勻文字塊）
      await worker.setParameters({
        tessedit_pageseg_mode: "6",
      });

      // 4. 識別
      const {
        data: { text },
      } = await worker.recognize(canvas);

      await worker.terminate();

      const cleaned = text
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim();

      setOcrText(cleaned || "未能識別到文字，請試下再影清晰啲、光線充足一啲。");
      setOcrStatus("done");
    } catch (err) {
      console.error(err);
      setOcrText("識別失敗，請再試一次。可嘗試換張更清晰、光線更好的相片。");
      setOcrStatus("error");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  const startFromOcr = () => {
    if (!ocrText.trim()) return;
    const sentences = ocrText
      .split(/(?<=[。！？\n])\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
    if (sentences.length === 0) {
      alert("請先確認有文字內容");
      return;
    }
    setPracticeList(sentences.map((s) => ({ text: s })));
    setCurrentIndex(0);
    setScore(0);
    setInput("");
    setResult(null);
    setMode("practice");
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  // ========== UI ==========

  if (mode === "menu") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <h1 className="text-3xl font-bold text-orange-600">香港小學默書練習</h1>
          <p className="text-gray-500 mb-2">廣東話 · 繁體中文</p>

          <button
            onClick={() => setMode("select")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-semibold py-4 rounded-2xl"
          >
            開始默書練習
          </button>

          <button
            onClick={() => setMode("manage")}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xl font-semibold py-4 rounded-2xl"
          >
            📚 詞庫管理
          </button>

          <button
            onClick={() => {
              setMode("ocr");
              setOcrStatus("idle");
              setOcrText("");
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-semibold py-4 rounded-2xl"
          >
            📸 影相匯入課文
          </button>
        </div>
      </div>
    );
  }

  if (mode === "select") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">選擇默書詞庫</h2>
            <button onClick={() => setMode("menu")} className="text-gray-500 text-sm">
              ← 返回
            </button>
          </div>

          <p className="text-sm text-gray-600">可同時選擇多個詞庫一齊練習</p>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {groups.map((g) => (
              <label
                key={g.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
                  selectedGroupIds.includes(g.id)
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(g.id)}
                  onChange={() => toggleSelectGroup(g.id)}
                  className="w-5 h-5"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-lg">{g.name}</div>
                  <div className="text-sm text-gray-500">{g.words.length} 個詞語</div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={startSelectedPractice}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold py-4 rounded-2xl"
          >
            開始練習 →
          </button>
        </div>
      </div>
    );
  }

  if (mode === "manage") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">詞庫管理</h2>
            <button onClick={() => setMode("menu")} className="text-gray-500 text-sm">
              ← 返回
            </button>
          </div>

          {message && (
            <div className="bg-green-100 text-green-700 text-center py-2 rounded-xl text-sm">
              {message}
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setActiveGroupId(g.id);
                  setEditingGroupId(null);
                }}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                  activeGroupId === g.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {g.name} ({g.words.length})
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createGroup()}
              placeholder="輸入新詞庫名稱"
              className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
            />
            <button
              onClick={createGroup}
              className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-xl font-medium"
            >
              新增詞庫
            </button>
          </div>

          <div className="bg-orange-50 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center gap-2">
              {editingGroupId === activeGroup.id ? (
                <div className="flex gap-2 flex-1 items-center">
                  <input
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && renameGroup(activeGroup.id)}
                    className="flex-1 border rounded-lg px-2 py-1"
                    autoFocus
                  />
                  <button
                    onClick={() => renameGroup(activeGroup.id)}
                    className="text-green-600 text-sm font-medium"
                  >
                    儲存
                  </button>
                  <button
                    onClick={() => setEditingGroupId(null)}
                    className="text-gray-500 text-sm"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-xs text-gray-500">目前管理</div>
                    <div className="font-bold text-lg">{activeGroup.name}</div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => {
                        setEditingGroupId(activeGroup.id);
                        setEditGroupName(activeGroup.name);
                      }}
                      className="text-blue-600"
                    >
                      重新命名
                    </button>
                    <button
                      onClick={() => deleteGroup(activeGroup.id)}
                      className="text-red-500"
                    >
                      刪除
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-orange-100">
              <input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addWordToActive()}
                placeholder="中文詞語（必填）"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
              />
              <input
                value={newJyutping}
                onChange={(e) => setNewJyutping(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addWordToActive()}
                placeholder="粵拼（可選，例如 baa4 baa1）"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
              />
              <button
                onClick={addWordToActive}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl"
              >
                ＋ 加入「{activeGroup.name}」
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2">
            {activeGroup.words.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                呢個詞庫仲係空嘅
                <br />
                <span className="text-sm">用上面表格加入詞語</span>
              </div>
            ) : (
              activeGroup.words.map((w, i) => (
                <div
                  key={`${activeGroup.id}-${i}-${w.text}`}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                >
                  <div>
                    <div className="font-medium">{w.text}</div>
                    {w.jyutping && (
                      <div className="text-sm text-gray-500">{w.jyutping}</div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteWord(i)}
                    className="text-red-500 text-sm px-2 py-1"
                  >
                    刪除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // OCR 頁面（加強提示）
  if (mode === "ocr") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">影相匯入課文</h2>
            <button onClick={() => setMode("menu")} className="text-gray-500 text-sm">
              ← 返回
            </button>
          </div>

          <div className="bg-blue-50 text-blue-800 text-sm rounded-xl p-3 space-y-1">
            <div className="font-medium">影相小貼士（提升準確度）：</div>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>光線充足、平均，避免陰影同反光</li>
              <li>手機對準，文字盡量水平、清晰</li>
              <li>盡量只影文字區域，唔好太遠</li>
              <li>一次影一頁或一段會準啲</li>
            </ul>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrStatus === "loading"}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-lg font-semibold py-4 rounded-2xl"
          >
            {ocrStatus === "loading"
              ? `處理同識別中... ${ocrProgress}%`
              : "📷 影相 / 選擇相片"}
          </button>

          {ocrStatus === "loading" && (
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          )}

          {(ocrStatus === "done" || ocrStatus === "error") && (
            <>
              <label className="block text-sm font-medium text-gray-700">
                識別結果（請檢查同修改）：
              </label>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={10}
                className="w-full border-2 border-orange-200 rounded-xl p-3 text-lg focus:border-orange-400 outline-none"
                placeholder="識別出的文字會顯示在這裡..."
              />
              <button
                onClick={startFromOcr}
                className="w-full bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-4 rounded-2xl"
              >
                開始默寫呢段文字 →
              </button>
            </>
          )}

          <p className="text-xs text-gray-400">
            已加入圖像預處理（灰階 + 對比度 + 放大），有助提升繁體中文識別率。
          </p>
        </div>
      </div>
    );
  }

  // 練習頁面
  const item = practiceList[currentIndex];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
      <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md w-full text-center space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              stopAudio();
              setMode("menu");
            }}
            className="text-gray-500 text-sm"
          >
            ← 返回
          </button>
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {practiceList.length}　分數 {score}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 whitespace-nowrap">語速</span>
          <input
            type="range"
            min="0.6"
            max="1.2"
            step="0.05"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-10 text-right">{speechRate.toFixed(2)}</span>
        </div>

        <button
          onClick={togglePlayPause}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-semibold py-4 rounded-2xl"
        >
          {isPlaying ? "⏸ 暫停（空白鍵）" : "▶️ 播放（空白鍵）"}
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={item && item.text.length > 20 ? 4 : 2}
          className="w-full text-2xl border-4 border-orange-200 focus:border-orange-400 rounded-2xl px-4 py-3 text-center outline-none"
          placeholder="喺度輸入答案"
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={prevItem}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-2xl"
          >
            ← 上一句
          </button>
          <button
            onClick={checkAnswer}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-2xl"
          >
            檢查 ✅
          </button>
          <button
            onClick={nextItem}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-2xl"
          >
            下一句 →
          </button>
        </div>

        {result && item && (
          <div
            className={`text-xl font-bold p-4 rounded-2xl ${
              result === "correct"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {result === "correct" ? (
              "正確！👍"
            ) : (
              <>
                <div>正確答案：</div>
                <div className="mt-1 text-lg break-words">{item.text}</div>
                {item.jyutping && (
                  <div className="text-sm mt-1 text-gray-600">粵拼：{item.jyutping}</div>
                )}
              </>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400">提示：按空白鍵可快速暫停 / 播放</p>
      </div>
    </div>
  );
}
