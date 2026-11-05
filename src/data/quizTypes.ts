export type QuizQuestion = {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answer: number;
  /** 匯入／新增批次 ID */
  batchId?: string;
  /** 顯示用批次名稱，例如「2026-11-05 匯入」 */
  batchLabel?: string;
  /** 加入時間（毫秒） */
  importedAt?: number;
};
