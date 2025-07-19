# TypeScript 參數裝飾器與 `reflect-metadata` 實戰筆記

這份筆記旨在解釋 TypeScript 中的「參數裝飾器 (Parameter Decorator)」如何與 `reflect-metadata` 套件結合，來實現一個基礎的「依賴注入 (Dependency Injection, DI)」框架。

我們將透過一個完整的範例，從無到有拆解其背後的原理。這個概念是許多現代框架（如 NestJS、Angular）的核心。

## 核心概念

- **裝飾器 (Decorator):** 是一種特殊的宣告，可以附加到類別、方法、屬性或參數上，用來修改或觀察目標的行為。
- **元資料 (Metadata):** 是「關於資料的資料」。在這個情境下，我們用裝飾器將一些額外資訊（例如：「這個參數需要注入使用者名稱」）附加到類別的方法上，而這些資訊本身不影響方法的業務邏輯。
- **`reflect-metadata`:** 這是一個函式庫，它提供了一個標準化的 API，讓我們可以透過裝飾器來附加和讀取這些元資料。

## 目標

我們的目標是建立一個 `@Inject(key)` 裝飾器。當我們用它來裝飾一個方法的參數時，一個「執行器」函式能夠讀取到這個資訊，並從一個模擬的「請求上下文」中取出對應的資料，然後用這些資料來呼叫原始方法。

---

### **實作步驟拆解**

#### **第 1 步：定義元資料的唯一鍵 (Metadata Key)**

為了儲存和讀取我們的元資料，我們需要一個獨一無二的鍵，避免與其他函式庫衝突。使用 `Symbol` 是最佳選擇。

`1-metadata-key.ts`
```typescript
/**
 * 定義一個獨一無二的 Symbol 作為元資料的鍵 (Key)。
 * 使用 Symbol 可以確保我們儲存的元資料不會與其他函式庫或程式碼產生衝突。
 */
export const INJECT_METADATA_KEY = Symbol("InjectMetadata");
```

---

#### **第 2 步：建立 `@Inject` 參數裝飾器**

這是核心部分。我們建立一個 `@Inject(contextKey)` 裝飾器工廠，它會回傳一個真正的參數裝飾器。

這個裝飾器的任務是：
1.  讀取目標方法上已經存在的注入資訊。
2.  將**新的**參數資訊（包含它在參數列表中的索引 `parameterIndex` 和要注入的鍵 `contextKey`）新增進去。
3.  將更新後的資訊陣列寫回元資料中。

`2-inject-decorator.ts`
```typescript
import 'reflect-metadata';
import { INJECT_METADATA_KEY } from './1-metadata-key.js';

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
    // 讀取該方法上已經存在的元資料，如果沒有就初始化一個空陣列
    const existingMetadata: IInjectMetadata[] = Reflect.getOwnMetadata(
      INJECT_METADATA_KEY,
      target,
      propertyKey
    ) || [];

    // 將這個新參數的注入資訊加到元資料陣列中
    existingMetadata.push({
      index: parameterIndex,
      key: contextKey,
    });

    // 將更新後的元資料陣列存回去
    Reflect.defineMetadata(
      INJECT_METADATA_KEY,
      existingMetadata,
      target,
      propertyKey
    );
  };
}
```

---

#### **第 3 步：在服務中使用 `@Inject`**

現在我們可以在一個實際的服務中使用這個裝飾器。注意，`MyService` 類別只負責「宣告」它需要什麼，而不知道資料從何而來。這就是「控制反轉 (IoC)」思想的體現。

`3-my-service.ts`
```typescript
import { Inject } from './2-inject-decorator.js';

export class MyService {
  /**
   * @param recipient - 透過 @Inject('user') 宣告，需要注入名為 'user' 的資料。
   * @param text - 透過 @Inject('message') 宣告，需要注入名為 'message' 的資料。
   */
  sendMessage(
    @Inject('user') recipient: string,
    @Inject('message') text: string
  ): void {
    console.log(`正在發送訊息給 ${recipient}: "${text}"`);
  }
}
```

---

#### **第 4 步：建立執行器 (Executor)**

執行器是模擬框架行為的部分。它負責：
1.  接收一個類別實例和要呼叫的方法名稱。
2.  使用 `Reflect.getOwnMetadata` 和我們先前定義的 `INJECT_METADATA_KEY` 來讀取儲存的元資料。
3.  根據元資料，從一個模擬的 `context` 物件中準備好參數陣列。
4.  使用 `apply` 方法，將準備好的參數傳入並呼叫原始方法。

`4-executor.ts`
```typescript
import 'reflect-metadata';
import { INJECT_METADATA_KEY } from './1-metadata-key.js';
import { IInjectMetadata } from './2-inject-decorator.js';

/**
 * @param instance 要執行方法的類別實例
 * @param methodName 要執行的方法名稱
 * @param context 模擬的請求上下文，提供資料來源
 */
export function callMethodWithInjections(instance: any, methodName: string, context: Record<string, any>): any {
  // 從實例的方法上，讀取我們之前儲存的注入元資料
  const metadata: IInjectMetadata[] = Reflect.getOwnMetadata(
    INJECT_METADATA_KEY,
    Object.getPrototypeOf(instance), // 元資料是定義在原型上的
    methodName
  );

  // 如果沒有元資料，直接執行
  if (!metadata) {
    return instance[methodName].apply(instance);
  }

  // 根據元資料，從上下文中準備參數陣列
  const args = new Array(metadata.length);
  metadata.forEach(({ index, key }) => {
    args[index] = context[key];
  });

  // 使用準備好的參數陣列，呼叫原始方法
  return instance[methodName].apply(instance, args);
}
```

---

#### **第 5 步：組合與執行**

最後，我們將所有部分組合起來，模擬一次完整的請求處理流程。

`index.ts`
```typescript
import { MyService } from './3-my-service.js';
import { callMethodWithInjections } from './4-executor.js';

// 1. 模擬一個外部傳入的請求上下文
const requestContext = {
  user: "Alice",
  message: "你好，這是一條透過依賴注入傳遞的訊息！",
};

// 2. 建立服務的實例
const service = new MyService();

// 3. 使用執行器來呼叫帶有 @Inject 裝飾器的方法
callMethodWithInjections(service, 'sendMessage', requestContext);
```

---

### **關於編譯後的 `(0, ...)` 語法**

您在編譯後的 JavaScript 檔案中看到類似 `(0, _2_inject_decorator_1.Inject)('user')` 的程式碼。

這個 `(0, ...)` 是一種編譯器技巧，目的是**確保 `Inject` 函式在被呼叫時，其內部的 `this` 指向的是全域物件（或在嚴格模式下是 `undefined`），而不是它所屬的模組物件 `_2_inject_decorator_1`**。

這是利用 JavaScript 的「逗號運算子」實現的。它會執行所有運算式並回傳最後一個的結果。`(0, someFunction)` 的結果就是 `someFunction` 本身，但它切斷了函式與其原始物件的關聯，使其像一個獨立的函式被呼叫，從而確保了 `this` 的上下文是中立的。這是編譯器為了保證程式碼穩健性而採用的通用策略。

### **總結**

透過這個範例，我們可以看到「參數裝飾器」與 `reflect-metadata` 的強大組合：
- **解耦 (Decoupling):** 服務 (`MyService`) 與資料來源 (`requestContext`) 完全分離。服務只宣告依賴，不關心如何獲取。
- **宣告式程式設計 (Declarative Programming):** 我們用 `@Inject` 來「宣告」意圖，而不是編寫繁瑣的指令式程式碼來手動傳遞參數。
- **框架的基石:** 這個模式是許多強大框架實現 IoC 容器、依賴注入、請求路由等功能的基礎。
