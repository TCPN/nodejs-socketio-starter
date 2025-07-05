import { randomString } from "./random";

// 產生唯一 ID（v4 UUID 格式，支援現代瀏覽器）
function generateUserId() {
    // return crypto.randomUUID(); // e.g., "af0d9c5b-62f2-42f4-87df-18344d20519c"
    return randomString(16, 16); // e.g., "af0d9c5b-62f2-42f4-87df-18344d20519c"
  }
  
// 初始化使用者 ID（只做一次）
function getOrCreateUserId() {
  const key = 'userId';
  let id = localStorage.getItem(key);
  if (!id) {
    id = generateUserId();
    localStorage.setItem(key, id);
    console.log('🔐 建立新的 userId:', id);
  } else {
    console.log('🔒 已有 userId:', id);
  }
  return id;
}

export const userId = getOrCreateUserId(); // 在應用開始前執行
  