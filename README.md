# 香港小學默書練習 App (Dictation)

幫助香港小學生練習中文默書的 Web 應用，支援廣東話朗讀。

## 功能（目前版本）

- 播放廣東話（目前使用瀏覽器 Web Speech API `zh-HK`）
- 輸入答案並即時檢查
- 分數計算
- 簡單詞彙列表（可之後擴充）

## 快速開始

```bash
npm install
npm run dev
```

開啟 http://localhost:3000

## 技術棧

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React 19

## 之後可擴充

- 接入 cantonese.ai / 其他粵語 TTS API
- 從教育局《香港小學學習字詞表》載入詞彙
- 家長/老師後台上傳詞彙
- 筆順練習 (Hanzi Writer)
- 登入與進度追蹤 (Supabase)

## 授權

Private repository.
