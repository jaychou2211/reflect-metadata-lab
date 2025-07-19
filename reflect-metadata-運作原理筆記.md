# `reflect-metadata` 運作原理筆記

這個問題問得非常好！它觸及了像 NestJS、TypeORM 和 `class-validator` 這類基於元資料的框架運作的真正核心。你已經正確地指出 `Reflect.getMetadata` 和 `Reflect.defineMetadata` 是實現這一切的工具，但其真正的魔法在於資料被*儲存的地點和方式*。

讓我們來深入拆解這個問題。

### 核心概念：一個「隱形的背包」

想像一下，在 JavaScript 中，每一個物件（包含類別的建構函式和它的原型 `prototype`）都有一個「隱形的背包」，可以用來存放額外的資訊。這個背包不屬於物件的常規屬性（你無法用 `Object.keys()` 或 `for...in` 迴圈看到它），但它卻與該物件在記憶體中的身份緊密相連。

`reflect-metadata` 這個套件（polyfill）就是用來建立和管理這些隱形背包的。

### 「儲存在哪裡？」：儲存機制

`reflect-metadata` 這個 polyfill 會建立一個隱藏的、全域的儲存空間。實現這個儲存最常見且最高效的方式是使用 `WeakMap`。

這是一個 `reflect-metadata` 內部機制的**極簡化**心智模型：

```typescript
// 這段程式碼由 `import 'reflect-metadata'` 在全域範圍內建立
// 這是一個非常簡化的表示

// 層級 1: 將一個目標物件 (target) 映射到它自己的元資料儲存庫。
// 使用 WeakMap 至關重要，因為如果 `target` 物件在其他地方不再被使用，
// WeakMap 不會阻止它被記憶體回收 (garbage-collected)。
const MetadataStorage = new WeakMap<object, Map<string | symbol, any>>();
```

所以，這個儲存機制本質上是一個 **`WeakMap`**，其中：
*   **鍵 (Keys)** 是 `target` 物件本身（例如 `User.prototype`、`MyService.prototype`）。
*   **值 (Values)** 是一個常規的 `Map` 物件，這個 `Map` 代表了該特定 `target` 的「個人元資料集合」。

這個內層的 `Map` 接著儲存了實際的元資料：
*   **鍵 (Keys)** 是 `metadataKey`（例如 `design:type`，或是你自訂的 `INJECT_METADATA_KEY`）。
*   **值 (Values)** 是 `metadataValue`（例如 `String` 建構函式，或是你那包著 `IInjectMetadata` 的陣列）。

### 「如何運作？」：`Reflect.defineMetadata` 的流程

當類別成員上的裝飾器執行時，它會呼叫 `Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey)`。以下是 polyfill 內部發生的事情：

讓我們用你的 `MyService` 中的 `@Inject('user')` 來追蹤這個流程：

```typescript
// 在 3-my-service.ts 中
class MyService {
  sendMessage(
    @Inject('user') recipient: string, // 這個裝飾器會執行
    /* ... */
  ): void { /* ... */ }
}
```

1.  **裝飾器執行**：當 JavaScript 引擎定義 `MyService` 這個類別時，`@Inject('user')` 這個裝飾器函式會被**立即呼叫**。
2.  **`defineMetadata` 被呼叫**：在你的 `Inject` 裝飾器內部，你呼叫了 `Reflect.defineMetadata`。
    *   `metadataKey`: `INJECT_METADATA_KEY` (你的 Symbol)
    *   `metadataValue`: `[{ index: 0, key: 'user' }]` (注入資訊的陣列)
    *   `target`: `MyService.prototype` (因為 `sendMessage` 是一個實例方法)
    *   `propertyKey`: `"sendMessage"`

3.  **`Reflect.defineMetadata` 內部**：
    a. **尋找目標的儲存庫**：polyfill 拿著 `target` (`MyService.prototype`)，並在全域的 `MetadataStorage` (`WeakMap`) 中查找它。
    b. **如果儲存庫不存在，就建立一個**：如果 `MetadataStorage.has(MyService.prototype)` 是 `false`，代表這是第一次為 `MyService.prototype` 添加元資料。polyfill 會為它建立一個新的、空的 `Map`：
        ```typescript
        const newTargetMetadata = new Map<string | symbol, any>();
        MetadataStorage.set(MyService.prototype, newTargetMetadata);
        ```
    c. **取得目標的個人 Map**：它取出內層的 map：`const targetMetadata = MetadataStorage.get(MyService.prototype);`
    d. **儲存元資料**：現在，它將真正的元資料儲存在這個個人 map 上。因為這次呼叫提供了 `propertyKey` (`"sendMessage"`)，儲存結構會再深一層，以便將元資料與特定的方法關聯起來。其邏輯實際上是：
        *   取得/建立一個用於存放所有 `sendMessage` 元資料的 map。
        *   在*那個* map 上設定 `INJECT_METADATA_KEY`。
        ```typescript
        // 簡化邏輯
        let propertyMetadata = targetMetadata.get("sendMessage");
        if (!propertyMetadata) {
            propertyMetadata = new Map();
            targetMetadata.set("sendMessage", propertyMetadata);
        }
        propertyMetadata.set(INJECT_METADATA_KEY, [{ index: 0, key: 'user' }]);
        ```

當所有裝飾器都執行完畢後，這個隱藏的全域儲存庫在記憶體中看起來會像這樣：

```
MetadataStorage (WeakMap)
  - Key: MyService.prototype (物件)
  - Value: (Map)
    - Key: "sendMessage"
    - Value: (Map)
      - Key: INJECT_METADATA_KEY (Symbol)
      - Value: [ { index: 0, key: 'user' }, { index: 1, key: 'message' } ]
    - Key: "broadcast"
    - Value: (undefined, 因為它沒有裝飾器)
  - Key: User.prototype (物件)
  - Value: (Map)
    - Key: "name"
    - Value: (Map)
      - Key: "design:type"
      - Value: String (建構函式)
      - Key: "class-validator:validators"
      - Value: [ { type: 'isString', ... } ] // class-validator 添加它自己的元資料
    - Key: "age"
    - Value: (Map)
      - Key: "design:type"
      - Value: Number (建構函式)
      - Key: "class-validator:validators"
      - Value: [ { type: 'isInt', ... }, { type: 'min', ... }, ... ]
```

### 總結：融會貫通

*   **它是什麼？** `reflect-metadata` 是一個 polyfill，它建立了一個隱藏的全域 `WeakMap`，讓我們可以在不污染物件本身的情況下，為物件附加元資料。
*   **儲存在哪裡？** 在這個全域的 `WeakMap` 中。資料並不在物件自身上，而是透過物件在 `WeakMap` 中的引用與之關聯。這就是為什麼它對標準的物件檢查方法來說是「隱形」的。
*   **如何運作？** 裝飾器只是在類別定義時執行的函式。它們使用 `Reflect.defineMetadata` 來填充這個隱藏的儲存庫。之後，像你的 `Executor` 或 `class-validator` 的 `validate` 函式，會使用 `Reflect.getMetadata` 從同一個隱藏儲存庫中讀取資料，以決定下一步該做什麼。

這個機制非常強大，因為它實現了**關注點分離 (Separation of Concerns)**。你的 `MyService` 類別只需用裝飾器*宣告*它的依賴，它不需要知道也不關心這些依賴是如何被滿足的。而 `Executor` 則是讀取這些宣告並執行它們的角色。這就是**控制反轉 (Inversion of Control, IoC)** 和 **依賴注入 (Dependency Injection, DI)** 的精髓。
