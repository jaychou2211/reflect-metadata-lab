/**
 * 1-metadata-key.ts
 * 
 * 定義一個獨一無二的 Symbol 作為元資料的鍵 (Key)。
 * 使用 Symbol 可以確保我們儲存的元資料不會與其他函式庫或程式碼產生衝突。
 */

export const INJECT_METADATA_KEY = Symbol("InjectMetadata");
