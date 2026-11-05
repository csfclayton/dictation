/**
 * Firebase 設定檔
 * 請到 Firebase Console 建立專案後，把「網頁應用程式」的設定貼喻下面。
 * 未填妤前，龍虎榜會只用本機儲存（各裝置獨立）。
 *
 * 教學見：FIREBASE_SETUP.md
 */
const firebaseConfig = {
  apiKey: "AIzaSyBjWHGymWzvOjQ9W6ZU1qLuzF_W6CfoGaQ",
  authDomain: "dictation-leaderboard.firebaseapp.com",
  projectId: "dictation-leaderboard",
  storageBucket: "dictation-leaderboard.firebasestorage.app",
  messagingSenderId: "152529091432",
  appId: "1:152529091432:web:88f6c0ef6bb4f713b574dd"
};

/** 設為 true 而且上面欄位都填好，先會啟用雲端同步 */
export const FIREBASE_ENABLED =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);
