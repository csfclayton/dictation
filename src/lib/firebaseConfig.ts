/**
 * Firebase 設定檔
 * 請到 Firebase Console 建立專案後，把「網頁應用程式」的設定貼喻下面。
 * 未填妤前，龍虎榜會只用本機儲存（各裝置獨立）。
 *
 * 教學見：FIREBASE_SETUP.md
 */
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

/** 設為 true 而且上面欄位都填好，先會啟用雲端同步 */
export const FIREBASE_ENABLED =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);
