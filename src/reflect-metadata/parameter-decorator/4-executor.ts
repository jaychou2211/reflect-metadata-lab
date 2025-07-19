/**
 * 4-executor.ts
 * 
 * 實作「執行器 (Executor)」函式。
 * 這部分模擬了框架（如 NestJS）在接收到請求後所做的工作：
 * 1. 讀取控制器方法上由裝飾器附加的元資料。
 * 2. 根據元資料，從請求上下文中準備好參數。
 * 3. 用準備好的參數呼叫原始方法。
 */
import 'reflect-metadata';
import { INJECT_METADATA_KEY } from './1-metadata-key';
import { IInjectMetadata } from './2-inject-decorator';

/**
 * 執行器函式
 * @param instance 要執行方法的類別實例
 * @param methodName 要執行的方法名稱
 * @param context 模擬的請求上下文，提供資料來源
 */
export function callMethodWithInjections(instance: any, methodName: string, context: Record<string, any>): any {
  // 1. 從實例的方法上，讀取我們之前儲存的注入元資料
  const metadata: IInjectMetadata[] = Reflect.getOwnMetadata(
    INJECT_METADATA_KEY,
    Object.getPrototypeOf(instance), // 元資料是定義在原型上的
    methodName
  );

  // 如果這個方法沒有任何 @Inject 裝飾器，就直接執行它
  if (!metadata) {
    console.log(`方法 ${methodName} 沒有注入元資料，直接執行...`);
    return instance[methodName].apply(instance);
  }

  // 2. 根據元資料，從上下文中準備參數陣列
  //    先用 null 填滿一個固定長度的陣列，確保參數順序正確
  const args = new Array(metadata.length);
  
  console.log(`正在為方法 ${methodName} 準備注入參數...`);
  metadata.forEach(({ index, key }) => {
    const value = context[key];
    console.log(`  - 參數 #${index} (${key}) -> 值: "${value}"`);
    args[index] = value;
  });

  // 3. 使用準備好的參數陣列，透過 .apply() 呼叫實例的原始方法
  return instance[methodName].apply(instance, args);
}
