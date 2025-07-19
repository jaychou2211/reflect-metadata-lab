# 深入解析 TypeScript 裝飾器核心：`__decorate` 函式完全指南

這份筆記統整了 TypeScript 裝飾器 (Decorator) 在編譯後的 JavaScript 中如何運作的核心機制，特別聚焦在由 TypeScript 編譯器 (tsc) 自動產生的 `__decorate` 輔助函式。

## 為什麼需要 `__decorate`？

當我們在 TypeScript 中使用 `@` 語法來宣告一個裝飾器時，我們使用的是一個尚未成為標準 JavaScript 的語法。為了讓這段程式碼能在標準的 JavaScript 環境中執行，TypeScript 編譯器必須將其「翻譯」成合法的 JavaScript。

`__decorate` 和 `__metadata` 這兩個函式就是這個翻譯過程的產物，是連接 TypeScript 優雅語法與底層 JavaScript 物件操作的橋樑。

要啟用這個機制，你的 `tsconfig.json` 中必須設定：
- `"experimentalDecorators": true`: 允許使用 `@` 裝飾器語法。
- `"emitDecoratorMetadata": true`: 讓編譯器發出額外的類型元資料，供 `reflect-metadata` 這類函式庫使用。

---

## 從 TypeScript 到 JavaScript：一個實例

理解 `__decorate` 最好的方式，就是看它如何被使用。

**原始 TypeScript 程式碼 (`.ts`)：**
```typescript
import 'reflect-metadata';

function logType(target: any, propertyKey: string) {
  const type = Reflect.getMetadata('design:type', target, propertyKey);
  console.log(`${propertyKey} 的型別是: ${type.name}`);
}

class MyClass {
  @logType
  public name!: string;
}
```

**編譯後的 JavaScript 程式碼 (`.js`)：**
> 可以看到，`@logType` 消失了，取而代之的是對 `__decorate` 的直接呼叫。
```javascript
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) { ... };
var __metadata = (this && this.__metadata) || function (k, v) { ... };

// ... logType 函式定義 ...

class MyClass {}

__decorate([
    logType,
    __metadata("design:type", String)
], MyClass.prototype, "name", void 0);
```
這段編譯後的程式碼揭示了兩個重點：
1.  `__metadata("design:type", String)` 被自動產生，用來記錄 `name` 屬性的類型是 `String`。
2.  `logType` 函式和 `__metadata` 的回傳值被放進一個陣列，作為 `__decorate` 的第一個參數。

---

## `__decorate` 函式內部流程詳解

`__decorate` 函式就像一個**裝飾器調度中心**。以下是它經過排版和變數重新命名後的版本，以及其運作流程的拆解。

### 程式碼解析
```javascript
/**
 * @param {Array<Function>} decorators - 裝飾器函式陣列。
 * @param {object} target - 被裝飾的目標 (類別本身或類別的原型)。
 * @param {string | symbol} key - 被裝飾的屬性或方法名稱。
 * @param {PropertyDescriptor | null} desc - 屬性描述符。
 */
function __decorate(decorators, target, key, desc) {
  // --- 第 1 部分：初始化 ---
  const argumentCount = arguments.length;
  let result;

  // 根據傳入的參數數量，決定「被裝飾的初始對象」是什麼。
  // 這是為了區分「類別裝飾器」和「成員(屬性/方法)裝飾器」。
  if (argumentCount < 3) {
    // 參數少於 3 個 (只有 decorators, target)，表示是「類別裝飾器」。
    result = target;
  } else {
    // 參數大於等於 3 個，表示是「成員裝飾器」。
    // 如果 desc 是 null (屬性裝飾器)，就動態取得它的屬性描述符。
    result = desc === null ? Object.getOwnPropertyDescriptor(target, key) : desc;
  }

  // --- 第 2 部分：執行裝飾 ---
  let decorator;

  // 檢查環境中是否存在一個標準的 Reflect.decorate 實作 (為了未來相容性)。
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
    result = Reflect.decorate(decorators, target, key, desc);
  } else {
    // Polyfill 邏輯：裝飾器需要「由後往前」執行。
    for (let i = decorators.length - 1; i >= 0; i--) {
      decorator = decorators[i];
      if (decorator) {
        let decoratedValue;
        // 根據參數數量，用不同的簽名呼叫裝飾器函式。
        if (argumentCount < 3) { // 類別裝飾器: decorator(target)
          decoratedValue = decorator(result);
        } else if (argumentCount > 3) { // 方法裝飾器: decorator(target, key, descriptor)
          decoratedValue = decorator(target, key, result);
        } else { // 屬性裝飾器: decorator(target, key)
          decoratedValue = decorator(target, key);
        }

        // 如果裝飾器有回傳值，就用它的回傳值更新 result。
        result = decoratedValue || result;
      }
    }
  }

  // --- 第 3 部分：完成與返回 ---
  // 如果是成員裝飾器且 result 有值 (裝飾器回傳了新的描述符)，
  // 就用 Object.defineProperty 將更新後的屬性描述符應用回目標物件上。
  if (argumentCount > 3 && result) {
    Object.defineProperty(target, key, result);
  }

  // 回傳最終的裝飾結果。
  return result;
}
```

### 核心運作流程

1.  **判斷裝飾器類型 (第 1 部分)**
    - 透過檢查傳入的參數數量 (`arguments.length`)，`__decorate` 能分辨出自己正在處理的是**類別裝飾器**還是**成員裝飾器**，從而決定要操作的對象是類別本身，還是成員的**屬性描述符 (Property Descriptor)**。

2.  **倒序執行裝飾器 (第 2 部分)**
    - 這是最關鍵的一步。裝飾器的應用順序是**由下到上，由內到外**。如果你寫了 `@g @f`，實際執行順序是 `g(f(x))`。
    - `for` 迴圈從 `decorators` 陣列的**末尾向前**遍歷，確保了這個執行順序。
    - 在我們的例子中，`__metadata` 會先被執行，將類型資訊附加到目標上。然後，`logType` 才執行，此時它就能透過 `Reflect.getMetadata` 讀取到剛剛附加的資訊。
    - `result = decoratedValue || result;` 這行確保了如果一個裝飾器回傳了新的值（例如一個修改過的類別或屬性描述符），這個新值會被傳遞給下一個裝飾器。

3.  **應用最終結果 (第 3 部分)**
    - 對於成員裝飾器，在所有裝飾器執行完畢後，最終得到的 `result` (可能是被修改過的屬性描述符) 會透過 `Object.defineProperty` **正式應用**到類別的原型上。
    - 最後，函式回傳最終的結果。

## 總結

`__decorate` 是 TypeScript 裝飾器魔法背後的無名英雄。它是一個由編譯器提供的、健壯的調度函式，負責：
-   **識別**不同類型的裝飾器。
-   以**正確的順序**和**正確的參數**執行它們。
-   **串聯**多個裝飾器的執行結果。
-   將最終的修改**應用**到目標物件上。

理解了 `__decorate` 的運作原理，就等於揭開了 TypeScript 裝飾器神秘的面紗，讓我們能更深刻地掌握這項強大的語言特性。
