"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_TOPICS } from "@/lib/quizHelpers";
import {
  getManagedList,
  addCustomQuestion,
  updateCustomQuestion,
  deleteCustomQuestion,
  setBuiltinDisabled,
  clearAllCustom,
  parseImportLines,
  importCustomQuestions,
  exportCustomAsText,
  topicStats,
  type ManagedQuestion,
} from "@/lib/quizBankStore";

const emptyForm = {
  topic: "科學",
  question: "",
  options: ["", "", "", ""],
  answer: 0,
};

export default function QuizBankManager({ onBack }: { onBack: () => void }) {
  const [list, setList] = useState<ManagedQuestion[]>([]);
  const [topic, setTopic] = useState<string>("全部");
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = () => setList(getManagedList());

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return list.filter((item) => {
      if (topic !== "全部" && item.topic !== topic) return false;
      if (!kw) return true;
      return (
        item.question.toLowerCase().includes(kw) ||
        item.options.some((o) => o.toLowerCase().includes(kw))
      );
    });
  }, [list, topic, q]);

  const stats = useMemo(() => topicStats(list), [list]);
  const activeCount = list.filter((x) => !x.disabled).length;
  const customCount = list.filter((x) => !x.builtin).length;

  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 2500);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, options: ["", "", "", ""] });
    setShowForm(true);
  };

  const openEdit = (item: ManagedQuestion) => {
    if (item.builtin) {
      flash("內建題目不能改內容，可改為「停用」");
      return;
    }
    setEditingId(item.id);
    setForm({
      topic: item.topic,
      question: item.question,
      options: [...item.options],
      answer: item.answer,
    });
    setShowForm(true);
  };

  const saveForm = () => {
    if (!form.question.trim()) return flash("請填寫題目");
    if (form.options.some((o) => !o.trim())) return flash("請填滿四個選項");
    if (editingId) {
      updateCustomQuestion(editingId, {
        topic: form.topic,
        question: form.question.trim(),
        options: form.options.map((o) => o.trim()),
        answer: form.answer,
      });
      flash("已更新題目");
    } else {
      addCustomQuestion({
        topic: form.topic,
        question: form.question.trim(),
        options: form.options.map((o) => o.trim()),
        answer: form.answer,
      });
      flash("已新增題目");
    }
    setShowForm(false);
    refresh();
  };

  const remove = (item: ManagedQuestion) => {
    if (item.builtin) {
      setBuiltinDisabled(item.id, true);
      flash("已停用內建題");
      refresh();
      return;
    }
    if (!confirm("確定刪除此自訂題？")) return;
    deleteCustomQuestion(item.id);
    flash("已刪除");
    refresh();
  };

  const restore = (item: ManagedQuestion) => {
    setBuiltinDisabled(item.id, false);
    flash("已重新啟用");
    refresh();
  };

  const doImport = () => {
    const { ok, errors } = parseImportLines(importText);
    if (errors.length) {
      flash(errors[0] + (errors.length > 1 ? `（另有 ${errors.length - 1} 個錯誤）` : ""));
    }
    if (ok.length) {
      importCustomQuestions(ok);
      flash(`成功匯入 ${ok.length} 題`);
      setImportText("");
      setShowImport(false);
      refresh();
    } else if (!errors.length) {
      flash("沒有可匯入的內容");
    }
  };

  const doExport = () => {
    const text = exportCustomAsText();
    if (!text) return flash("未有自訂題可匯出");
    setImportText(text);
    setShowImport(true);
    flash("已填入匯出內容，可複製保存");
  };

  return (
    <div className="min-h-screen p-4 bg-amber-50">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-3xl shadow-xl p-5 space-y-3 anim-fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-teal-600">📝 題庫管理</h2>
            <button type="button" onClick={onBack} className="text-sm text-gray-500">
              ← 返回
            </button>
          </div>
          <p className="text-xs text-gray-500">
            生效題目 <b className="text-teal-700">{activeCount}</b>　自訂{" "}
            <b className="text-orange-600">{customCount}</b>　內建可停用、自訂可刪改
          </p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {Object.entries(stats).map(([t, s]) => (
              <span key={t} className="bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">
                {t} {s.active}/{s.total}
              </span>
            ))}
          </div>
          {msg && (
            <div className="text-sm text-center bg-teal-50 text-teal-700 rounded-xl py-2">{msg}</div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={openAdd}
              className="bg-teal-500 text-white font-semibold py-2.5 rounded-xl btn-press"
            >
              ＋ 新增題目
            </button>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className="border-2 border-teal-400 text-teal-700 font-semibold py-2.5 rounded-xl btn-press"
            >
              批量匯入／匯出
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-3xl shadow-xl p-5 space-y-3 anim-slide-up">
            <h3 className="font-bold text-gray-800">{editingId ? "編輯自訂題" : "新增題目"}</h3>
            <label className="block text-sm">
              <span className="text-gray-500">主題</span>
              <select
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                className="mt-1 w-full border-2 rounded-xl px-3 py-2"
              >
                {ALL_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-gray-500">題目</span>
              <textarea
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                rows={2}
                className="mt-1 w-full border-2 rounded-xl px-3 py-2"
                placeholder="輸入題目內容"
              />
            </label>
            {form.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="ans"
                  checked={form.answer === i}
                  onChange={() => setForm((f) => ({ ...f, answer: i }))}
                />
                <span className="w-5 font-bold text-teal-600">{String.fromCharCode(65 + i)}</span>
                <input
                  value={opt}
                  onChange={(e) => {
                    const options = [...form.options];
                    options[i] = e.target.value;
                    setForm((f) => ({ ...f, options }));
                  }}
                  className="flex-1 border-2 rounded-xl px-3 py-2"
                  placeholder={`選項 ${String.fromCharCode(65 + i)}`}
                />
              </label>
            ))}
            <p className="text-xs text-gray-400">點選左邊圓點 = 正確答案</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveForm}
                className="flex-1 bg-teal-500 text-white font-semibold py-2.5 rounded-xl"
              >
                儲存
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 font-semibold py-2.5 rounded-xl"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {showImport && (
          <div className="bg-white rounded-3xl shadow-xl p-5 space-y-3 anim-slide-up">
            <h3 className="font-bold text-gray-800">批量匯入／匯出</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              支援 <b>CSV</b> 或用 <code className="bg-gray-100 px-1">|</code> 分隔。每行一題，7 欄：
              <br />
              <code className="text-[11px] bg-gray-50 block p-2 rounded-lg mt-1 break-all">
                主題,題目,選項A,選項B,選項C,選項D,正確答案
              </code>
              正確答案：A–D 或 0–3。可有表頭列。例：
              <br />
              <code className="text-[11px] bg-gray-50 block p-2 rounded-lg mt-1 break-all">
                科學,地球繞什麼轉？,太陽,月球,火星,金星,A
              </code>
            </p>
            <div className="space-y-2">
              <label className="block">
                <span className="text-sm text-gray-600">上載 CSV 檔案</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="mt-1 block w-full text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      setImportText(text);
                      flash(`已讀取「${file.name}」，請按匯入`);
                    } catch {
                      flash("讀取檔案失敗");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="text-xs text-gray-400">
                Excel：另存為「CSV UTF-8（逗號分隔）」再上載。Google 試算表：檔案 → 下載 → CSV。
              </p>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              className="w-full border-2 rounded-xl px-3 py-2 text-sm font-mono"
              placeholder="貼上 CSV / 管道格式，或先上載檔案…"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={doImport}
                className="bg-teal-500 text-white font-semibold py-2.5 rounded-xl"
              >
                匯入為自訂題
              </button>
              <button
                type="button"
                onClick={doExport}
                className="border-2 border-orange-400 text-orange-600 font-semibold py-2.5 rounded-xl"
              >
                匯出為文字
              </button>
            </div>
            {customCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("清除全部自訂題？內建題不受影響。")) {
                    clearAllCustom();
                    refresh();
                    flash("已清除全部自訂題");
                  }
                }}
                className="w-full text-red-500 text-sm py-2"
              >
                清除全部自訂題
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl p-5 space-y-3">
          <div className="flex gap-2">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="border-2 rounded-xl px-2 py-2 text-sm"
            >
              <option value="全部">全部主題</option>
              {ALL_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜尋題目／選項…"
              className="flex-1 border-2 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <p className="text-xs text-gray-400">顯示 {filtered.length} 題</p>
          <div className="space-y-2 max-h-[55vh] overflow-y-auto">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl p-3 border ${
                  item.disabled
                    ? "bg-gray-50 border-gray-200 opacity-60"
                    : item.builtin
                      ? "bg-white border-gray-100"
                      : "bg-orange-50 border-orange-200"
                }`}
              >
                <div className="flex justify-between gap-2 text-xs mb-1">
                  <span className="text-teal-600 font-medium">{item.topic}</span>
                  <span className="text-gray-400">
                    {item.builtin ? "內建" : "自訂"}
                    {item.disabled ? " · 已停用" : ""}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-800 mb-1">{item.question}</div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  {item.options.map((o, i) => (
                    <div key={i} className={i === item.answer ? "text-green-700 font-medium" : ""}>
                      {String.fromCharCode(65 + i)}. {o}
                      {i === item.answer ? " ✓" : ""}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {!item.builtin && (
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-xs text-teal-600 underline"
                    >
                      編輯
                    </button>
                  )}
                  {item.disabled ? (
                    <button
                      type="button"
                      onClick={() => restore(item)}
                      className="text-xs text-green-600 underline"
                    >
                      重新啟用
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="text-xs text-red-500 underline"
                    >
                      {item.builtin ? "停用" : "刪除"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">沒有符合的題目</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
