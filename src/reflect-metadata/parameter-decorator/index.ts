/**
 * index.ts
 * 
 * 主入口檔案，將所有部分組合在一起並執行。
 */

import { MyService } from './3-my-service';
import { callMethodWithInjections } from './4-executor';

// --- 執行流程 ---

console.log("--- 參數裝飾器範例 ---");

// 1. 模擬一個外部傳入的請求上下文 (Request Context)
const requestContext = {
  user: "Alice",
  message: "你好，這是一條透過依賴注入傳遞的訊息！",
  timestamp: Date.now(),
  source: "web",
};

console.log("\n[步驟 1] 模擬的請求上下文:", requestContext);

// 2. 建立服務的實例
const service = new MyService();
console.log("\n[步驟 2] MyService 實例已建立。");

// 3. 使用我們的執行器來呼叫帶有 @Inject 裝飾器的方法
console.log("\n[步驟 3] 準備使用執行器呼叫 service.sendMessage...");
callMethodWithInjections(service, 'sendMessage', requestContext);

console.log("\n----------------------------------------");

// 4. 作為對照，呼叫一個沒有使用裝飾器的方法
console.log("\n[對照組] 準備使用執行器呼叫 service.broadcast...");
callMethodWithInjections(service, 'broadcast', requestContext);

console.log("\n--- 範例執行完畢 ---");

