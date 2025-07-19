/**
 * 2-inject-decorator.ts
 * 
 * 實作 @Inject 參數裝飾器。
 * 這個裝飾器唯一的目的，就是在類別被定義時，為目標方法的參數附加元資料。
 * 它告訴執行器：「未來呼叫這個方法時，第 N 個參數需要從上下文的某個地方注入資料。」
 */
import 'reflect-metadata';
import { INJECT_METADATA_KEY } from './1-metadata-key';

// 定義元資料的結構
export interface IInjectMetadata {
  index: number;      // 參數在方法中的索引
  key: string;        // 要從上下文中注入的資料鍵
}

/**
 * @Inject 裝飾器工廠
 * @param contextKey 要從請求上下文中注入資料的鍵名
 */
export function Inject(contextKey: string) {
  /**
   * 參數裝飾器本身
   * @param target 對於實例方法，這裡是類別的原型 (prototype)
   * @param propertyKey 參數所在的方法名稱
   * @param parameterIndex 參數在方法參數列表中的索引
   */
  return function(target: any, propertyKey: string, parameterIndex: number) {
    // 1. 讀取該方法上已經存在的元資料，如果沒有就初始化一個空陣列
    const existingMetadata: IInjectMetadata[] = Reflect.getOwnMetadata(
      INJECT_METADATA_KEY,
      target,
      propertyKey
    ) || [];

    // 2. 將這個新參數的注入資訊加到元資料陣列中
    existingMetadata.push({
      index: parameterIndex,
      key: contextKey,
    });

    // 3. 將更新後的元資料陣列存回去
    Reflect.defineMetadata(
      INJECT_METADATA_KEY,
      existingMetadata,
      target,
      propertyKey
    );
  };
}
