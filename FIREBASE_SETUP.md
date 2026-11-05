# Firebase 雲端龍虎榜設定教學

完成後，所有裝置開啟同一個網站，會看到**同一份**龍虎榜。

## 1. 建立 Firebase 專案

1. 開啟 https://console.firebase.google.com/
2. 登入 Google 帳戶 → **新增專案**
3. 專案名稱可填 `dictation-leaderboard`（任意）
4. Google Analytics 可先關閉 → 建立專案

## 2. 建立 Firestore 資料庫

1. 左側選 **Build → Firestore Database**
2. **建立資料庫**
3. 選 **以測試模式開始**（之後會改規則）
4. 地點建議 `asia-east1`（台灣）或 `asia-east2`（香港）

## 3. 設定安全規則

在 Firestore → **規則** 貼上：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{doc} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasAll(['name','score','date','time','topics','wrongCount','createdAt'])
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 20
        && request.resource.data.score is number
        && request.resource.data.score >= 0
        && request.resource.data.score <= 500;
      allow update: if false;
      allow delete: if true;
    }
  }
}
```

按 **發布**。

## 4. 註冊網頁應用程式

1. 專案總覽 → **</>**（Web）
2. App 暱稱：`dictation`
3. **唔使**勾選 Firebase Hosting
4. 複製顯示的 `firebaseConfig` 物件內容

## 5. 填入本專案設定

編輯：`src/lib/firebaseConfig.ts`

把 `apiKey`、`authDomain`、`projectId` 等貼上，例如：

```ts
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "xxx.firebaseapp.com",
  projectId: "xxx",
  storageBucket: "xxx.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123:web:abc",
};
```

存檔後 push 到 GitHub，等 GitHub Pages 重新部署。

## 6. 驗證

1. 用手機挑戰一次，寫入成績
2. 用另一部裝置開同一網址 → 龍虎榜應見到同一筆
3. 畫面會顯示「☁️ 雲端同步」

## 注意

- `apiKey` 出現在前端係 Firebase 正常設計，真正保護靠 **Firestore 規則**
- 若網站完全公開，建議之後把 `allow delete` 改成 `false`，清除改在 Console 做
- 未填設定前，App 會自動用本機儲存，唔會壞
