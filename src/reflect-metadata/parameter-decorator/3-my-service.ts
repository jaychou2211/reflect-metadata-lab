/**
 * 3-my-service.ts
 * 
 * 一個範例服務，演示如何使用 @Inject 裝飾器。
 * 注意：這個類別本身並不知道資料是從哪裡來的，它只負責宣告「我需要什麼」。
 * 這就是「控制反轉 (Inversion of Control)」和「依賴注入 (Dependency Injection)」的核心思想。
 */
import { Inject } from './2-inject-decorator';

export class MyService {
  /**
   * 發送訊息的方法。
   * @param recipient - 透過 @Inject('user') 宣告，表示需要注入名為 'user' 的資料。
   * @param text - 透過 @Inject('message') 宣告，表示需要注入名為 'message' 的資料。
   */
  sendMessage(
    @Inject('user') recipient: string,
    @Inject('message') text: string
  ): void {
    // 這個方法的主體只關心業務邏輯，不關心資料來源。
    console.log(`正在發送訊息給 ${recipient}: "${text}"`);
  }

  /**
   * 一個沒有使用裝飾器的範例方法，用於對照。
   */
  broadcast(): void {
    console.log("正在廣播一條通用訊息！");
  }
}
