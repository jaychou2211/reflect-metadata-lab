# 關於 Reflect-Metadata 的筆記

這份筆記旨在說明 `reflect-metadata` 在 JavaScript/TypeScript 世界中的角色，以及它為了解決何種痛點而被創造出來。

簡單來說，`reflect-metadata` 的誕生是為了解決一個核心痛點：

**JavaScript/TypeScript 在編譯後，型別資訊會被抹除，導致無法在「執行時期 (runtime)」獲取這些型別資訊。**

---

### 1. 痛點詳解：型別抹除 (Type Erasure)

讓我們先看一個簡單的 TypeScript 類別：

```typescript
class Person {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return `Hello, my name is ${this.name}`;
  }
}
```

當 TypeScript 編譯器 (tsc) 將這段程式碼轉換成 JavaScript 時，它會變成類似這樣：

```javascript
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return `Hello, my name is ${this.name}`;
  }
}
```

你會發現，所有 `string`, `number` 這些型別註記都消失了。這就是**型別抹除**。

這在一般情況下沒問題，但對於**框架**和**函式庫**的開發者來說，這是一個巨大的痛點。想像一下以下場景：

*   **依賴注入 (Dependency Injection):** 一個框架想在建立 `A` 類別的實例時，自動注入它所依賴的 `B` 服務。如果 `constructor(private service: B)` 中的 `: B` 型別資訊在執行時消失了，框架要怎麼知道該 new 一個 `B` 的實例出來並傳進去呢？
*   **ORM (物件關聯對應):** 一個 ORM 函式庫想根據你定義的 class property 型別（例如 `id: number`）自動對應到資料庫的欄位型別（例如 `INTEGER`）。如果 `: number` 資訊消失了，ORM 該如何猜測？
*   **驗證 (Validation):** 一個驗證函式庫想根據你宣告的型別（例如 `age: number`）自動檢查傳入的資料是否為數字。沒有型別資訊，這也辦不到。

在沒有 `reflect-metadata` 的年代，開發者必須手動提供這些資訊，程式碼會變得很冗長且容易出錯：

```typescript
// 想像中的手動設定
@Injectable()
class MyService {
  // 必須手動告訴框架 constructor 需要什麼
  static dependencies = [OtherService]; 
  
  constructor(private other: OtherService) {}
}
```

### 2. 解決方案：`reflect-metadata`

`reflect-metadata` 的目標就是為了解決這個問題。它是一個 Polyfill，實作了當時還在提案階段的 [ECMAScript Metadata Reflection API](https://github.com/rbuckton/reflect-metadata)。

它的核心功能是：**提供一個標準化的 API，讓我們可以為類別、方法、屬性等程式碼結構「附加」和「讀取」元數據 (Metadata)。**

你可以把元數據想像成貼在程式碼上的「隱形標籤」，這些標籤在程式執行時依然存在，並且可以被讀取。

### 3. 如何運作：與 Decorator 的完美結合

`reflect-metadata` 單獨使用意義不大，它真正的威力展現在與 **TypeScript Decorator (裝飾器)** 以及 **`tsconfig.json`** 的一個關鍵設定檔結合時。

這個關鍵設定就是：

```json
// tsconfig.json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true, // <-- 就是這個！
    "experimentalDecorators": true
  }
}
```

當 `emitDecoratorMetadata` 被設為 `true` 時，TypeScript 編譯器會做一件神奇的事：**當它看到一個裝飾器被用在某個地方時，它會自動將該處的「型別資訊」作為元數據，附加到目標上。**

它主要會附加以下幾種元數據：

*   `design:type`: 屬性的型別。
*   `design:paramtypes`: 方法或建構函式 (constructor) 的參數型別列表。
*   `design:returntype`: 方法的回傳值型別。

**範例：**

```typescript
import 'reflect-metadata'; // 必須在最頂層引入一次

function logType(target: any, propertyKey: string) {
  // 使用 Reflect.getMetadata 來讀取編譯器自動附加的元數據
  const type = Reflect.getMetadata('design:type', target, propertyKey);
  console.log(`${propertyKey} 的型別是: ${type.name}`);
}

class MyClass {
  @logType // <-- 因為有這個裝飾器
  public myProperty: string; // <-- 編譯器會把 string 這個型別資訊變成元數據
}

// 輸出:
// myProperty 的型別是: String
```

在這個例子中，即使編譯後的 JS 檔裡 `myProperty` 沒有型別，但 `reflect-metadata` 讓我們在執行時透過 `Reflect.getMetadata` 成功拿到了它的型別是 `String`。

---

### 總結：`reflect-metadata` 的角色

`reflect-metadata` 在 JS/TS 世界中扮演了**「執行時期型別反射系統的基石」**這個角色。

*   **痛點：** 解決了因「型別抹除」導致框架和函式庫無法在執行時期獲取型別資訊的痛點。
*   **角色：** 它提供了一套標準 API，用於在程式碼上附加和讀取元數據。
*   **運作方式：** 與 TypeScript 的裝飾器 (`Decorator`) 和 `emitDecoratorMetadata` 編譯選項緊密合作，將靜態的型別資訊「儲存」起來，以便在動態的執行環境中使用。
*   **應用場景：** 它是實現依賴注入 (DI)、ORM、序列化/反序列化、路由、驗證等許多進階功能的底層技術，是 Angular、NestJS、TypeORM 等現代框架不可或缺的一部分。
