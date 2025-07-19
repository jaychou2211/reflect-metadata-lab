# JavaScript 核心概念：屬性描述符 (Property Descriptor) 深度解析

這份筆記旨在深入解釋 JavaScript 物件模型中的一個核心概念——屬性描述符，並闡述它為何是理解 TypeScript 裝飾器強大功能的關鍵。

## 1. 什麼是屬性描述符？

當我們在 JavaScript 中定義一個物件屬性時，例如 `let person = { name: "John" }`，我們看到的只是冰山一角。在 JavaScript 引擎內部，每個屬性都附帶著一本「設定手冊」，這本手冊就叫做**屬性描述符 (Property Descriptor)**。

它定義了這個屬性的**底層行為和元資料 (metadata)**。你可以把它想像成房地產的**權狀**，權狀上不只寫了地址 (`value`)，還規定了這塊地：
-   **能不能蓋房子 (`writable`)**
-   **地籍圖上會不會顯示 (`enumerable`)**
-   **權狀本身能不能被修改或註銷 (`configurable`)**

### 屬性描述符的四個關鍵欄位

1.  **`value`**: 屬性的值本身 (e.g., "John")。
2.  **`writable`**: (可寫的) 布林值。若為 `false`，則屬性的 `value` 不能被修改。
3.  **`enumerable`**: (可列舉的) 布林值。若為 `false`，則該屬性不會出現在 `for...in` 迴圈或 `Object.keys()` 的結果中。
4.  **`configurable`**: (可配置的) 布林值。這是最高權限開關。若為 `false`，則該屬性無法被刪除，其描述符本身（除了 `value`）也不能再被修改。

你可以使用 `Object.getOwnPropertyDescriptor(obj, propName)` 來親眼看見任何屬性的描述符。

---

## 2. 屬性描述符的實際應用【精準案例】

它的核心作用是讓你**精準地控制屬性的底層行為**。

### 案例 1：建立一個真正唯讀 (Read-only) 的屬性

透過將 `writable` 和 `configurable` 設為 `false`，我們可以創造一個比 `const` 更強大的物件級別常數。

```javascript
const config = {};

Object.defineProperty(config, 'API_URL', {
  value: "https://api.example.com",
  writable: false,      // <-- 關鍵：禁止修改 value
  configurable: false   // <-- 關鍵：禁止刪除或再次設定
});

// 任何修改或刪除的嘗試都會失敗
config.API_URL = "http://localhost"; // 靜默失敗或在嚴格模式下報錯
delete config.API_URL;             // 靜默失敗或在嚴格模式下報錯

console.log(config.API_URL); // 依然是 "https://api.example.com"
```

### 案例 2：在序列化時隱藏內部屬性

透過將 `enumerable` 設為 `false`，我們可以讓某些屬性在 `JSON.stringify` 或 `Object.keys` 中「隱形」，非常適合用來隱藏內部狀態或敏感資訊。

```javascript
const session = {
  userId: 1,
  token: "abc-xyz",
  _internalSocket: { /* ...一些複雜的物件... */ }
};

// 將 _internalSocket 設定為不可列舉
Object.defineProperty(session, '_internalSocket', {
  enumerable: false // <-- 關鍵：在列舉中隱藏
});

console.log(Object.keys(session));      // ["userId", "token"]
console.log(JSON.stringify(session)); // "{\"userId\":1,\"token\":\"abc-xyz\"}"
```

---

## 3. 為什麼裝飾器要作用在「屬性描述符」上？

這個問題是理解裝飾器本質的關鍵。

**因為裝飾器的目的，就是在不侵入原始程式碼的前提下，「增強」或「覆寫」一個類別成員（方法或屬性）的行為。**

要從根本上改變一個成員的行為，最直接、最有效的方式就是去修改它的「權狀」——也就是它的**屬性描述符**。

TypeScript 的 `__decorate` 函式在執行時，會把目標成員的屬性描述符作為第三個參數 (`descriptor`) 傳遞給你的裝飾器函式。這就給了你一個絕佳的機會去攔截並改寫它。

### 終極案例：`@confirmable` 方法裝飾器

這個裝飾器會讓一個方法在執行前彈出一個確認對話框，只有使用者確認後，原始方法才會執行。

```typescript
// 1. 定義裝飾器函式
function confirmable(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  // a. 保存對原始方法的引用
  const originalMethod = descriptor.value;

  // b. 修改屬性描述符的 `value`，用我們的新函式替換它
  descriptor.value = function(...args: any[]) {
    const message = `你確定要執行 ${propertyKey} 嗎？`;

    // c. 在新函式中加入我們的增強邏輯 (跳出確認框)
    if (confirm(message)) {
      // d. 如果使用者確認，就呼叫原始方法
      console.log("使用者已確認，執行原始方法...");
      return originalMethod.apply(this, args);
    } else {
      console.log("使用者取消了操作。");
      return null;
    }
  };

  // e. 回傳被修改後的屬性描述符，讓 __decorate 應用它
  return descriptor;
}

// 2. 使用裝飾器
class Document {
  @confirmable
  save() {
    console.log("文件已儲存！");
  }
}
```

在這個案例中，我們完美地展示了裝飾器的威力：

> 它提供了一個乾淨、可重用的方式，來**攔截並修改一個屬性或方法的底層定義（即屬性描述符）**，從而注入新的行為，而無需碰觸原始的業務邏輯程式碼。
