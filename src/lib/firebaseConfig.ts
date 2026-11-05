/**
 * Firebase 設定檔
 * 已接上 dictation-leaderboard 專案，龍虎榜會雲端同步。
 * 教學見：FIREBASE_SETUP.md
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBjWHGymWzvOjQ9W6ZU1qLuzF_W6CfoGaQ",
  authDomain: "dictation-leaderboard.firebaseapp.com",
  projectId: "dictation-leaderboard",
  storageBucket: "dictation-leaderboard.firebasestorage.app",
  messagingSenderId: "152529091432",
  appId: "1:152529091432:web:88f6c0ef6bb4f713b574dd",
};

/** 設為 true 而且上面欄位都填好，先會啟用雲端同步 */
export const FIREBASE_ENABLED =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);
