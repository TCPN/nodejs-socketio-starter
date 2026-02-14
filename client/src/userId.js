import { randomString } from "./random";

const USER_ID_STORAGE_KEY = 'userId';

// 產生唯一 ID（v4 UUID 格式，支援現代瀏覽器）
function generateUserId() {
  // return crypto.randomUUID(); // e.g., "af0d9c5b-62f2-42f4-87df-18344d20519c"
  return randomString(16, 16); // e.g., "af0d9c5b-62f2-42f4-87df-18344d20519c"
}

// 初始化使用者 ID（只做一次）
function getOrCreateUserId() {
  let id = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (!id) {
    return createUserId();
  } else {
    console.log('🔒 已有 userId:', id);
    return id;
  }
}

function createUserId() {
  const id = generateUserId();
  localStorage.setItem(USER_ID_STORAGE_KEY, id);
  console.log('🔐 建立新的 userId:', id);
  return id;
}

export function removeUserId() {
  localStorage.removeItem(USER_ID_STORAGE_KEY);
  dispatchChangeEvent();
}

export function setUserId(id) {
  localStorage.setItem(USER_ID_STORAGE_KEY, id);
  console.log('🔐 設定 userId:', id);
  dispatchChangeEvent();
}

export const userId = getOrCreateUserId(); // 在應用開始前執行

// events

const USER_ID_CHANGE_EVENT = 'userIdChange';

export function onUserIdChange(handler) {
  window.addEventListener(USER_ID_CHANGE_EVENT, handler);
}

function dispatchChangeEvent() {
  window.dispatchEvent(new Event(USER_ID_CHANGE_EVENT, { userId }));
}
