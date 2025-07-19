# Metadata Reflection API

**注意：** 由於 [Decorators](https://github.com/tc39/proposal-decorators) 和 [Decorator Metadata](https://github.com/tc39/proposal-decorator-metadata) 都已在 TC39 中達到 Stage 3，因此下面提出的 API 已不再考慮納入標準。然而，這個套件將繼續支援使用 TypeScript 舊版 `--experimentalDecorators` 選項的專案，因為某些專案可能無法遷移以使用標準的裝飾器。

* [詳細提案][metadata-spec]

## 安裝

```
npm install reflect-metadata
```

## 使用方式

### NodeJS/瀏覽器中的 ES 模組、TypeScript/Babel、打包工具
```ts
// - 修改全域 `Reflect` 物件（或在 ES5 執行環境中定義一個）。
// - 支援 ESM 和 CommonJS。
// - 為舊版執行環境包含 `Map`、`Set` 和 `WeakMap` 的內部 polyfill。
import "reflect-metadata";

// - 修改全域 `Reflect` 物件（或在 ES5 執行環境中定義一個）。
// - 支援 ESM 和 CommonJS。
// - 需要執行環境支援 `package.json` 中的 `"exports"`。
// - 不包含內部 polyfill。
import "reflect-metadata/lite";
```

### CommonJS
```ts
// - 修改全域 `Reflect` 物件（或在 ES5 執行環境中定義一個）。
// - 為舊版執行環境包含 `Map`、`Set` 和 `WeakMap` 的內部 polyfill。
require("reflect-metadata");

// - 修改全域 `Reflect` 物件（或在 ES5 執行環境中定義一個）。
// - 需要執行環境支援 `package.json` 中的 `"exports"`。
// - 不包含內部 polyfill。
require("reflect-metadata/lite");
```

### 在瀏覽器中透過 `<script>`
**HTML**
```html
<!-- 修改全域 `Reflect` 物件（或在 ES5 執行環境中定義一個）。 -->
<!-- 為舊版執行環境包含 `Map`、`Set` 和 `WeakMap` 的內部 polyfill。 -->
<script src="path/to/reflect-metadata/Reflect.js"></script>

<!-- 修改全域 `Reflect` 物件（或在 ES5 執行環境中定義一個）。 -->
<!-- 不包含內部 polyfill。 -->
<script src="path/to/reflect-metadata/ReflectLite.js"></script>
```

**Script**
```js
// - 讓類型在你的編輯器中可用。
/// <reference path="path/to/reflect-metadata/standalone.d.ts" />
```

## 背景

* 裝飾器（Decorators）增加了在定義類別時，透過宣告式語法來增強類別及其成員的能力。
* [Traceur][traceur] 將註解附加到類別的靜態屬性上。
* 像 C# (.NET) 和 Java 等語言支援屬性（attributes）或註解（annotations），可以將元資料（metadata）添加到類型中，並提供一個用於讀取元資料的反射 API。

## 目標

* 許多使用情境（組合/依賴注入、執行時期類型斷言、反射/鏡像、測試）希望能夠以一致的方式向類別添加額外的元資料。
* 需要一種一致的方法，讓各種工具和函式庫能夠理解元資料。
* 產生元資料的裝飾器（即「註解」）需要能夠與可變的裝飾器（mutating decorators）通用地組合。
* 元資料不僅應該在物件上可用，還應該可以透過 Proxy 及其相關的 traps 來存取。
* 對於開發人員來說，定義新的產生元資料的裝飾器不應該是費力或過於複雜的。
* 元資料應該與 ECMAScript 的其他語言和執行時期特性保持一致。

## 語法

* 宣告式定義元資料：
```JavaScript
class C {
  @Reflect.metadata(metadataKey, metadataValue)
  method() {
  }
}
```

* 命令式定義元資料：
```JavaScript
Reflect.defineMetadata(metadataKey, metadataValue, C.prototype, "method");
```

* 命令式內省元資料：
```JavaScript
let obj = new C();
let metadataValue = Reflect.getMetadata(metadataKey, obj, "method");
```

## 語意

* 物件有一個新的 `[[Metadata]]` 內部屬性，它將包含一個 Map，其鍵是屬性鍵（或 **undefined**），其值是元資料鍵到元資料值的 Map。
* 物件將有許多新的內部方法，用於 `[[DefineOwnMetadata]]`、`[[GetOwnMetadata]]`、`[[HasOwnMetadata]]` 等。
  * 這些內部方法可以被 Proxy 覆寫，以支援額外的 traps。
  * 這些內部方法預設會呼叫一組抽象操作來定義和讀取元資料。
* `Reflect` 物件將公開 MOP（元物件協定）操作，以允許命令式存取元資料。
* 在類別宣告 *C* 上定義的元資料儲存在 *C*`.[[Metadata]]` 中，鍵為 **undefined**。
* 在類別宣告 *C* 的靜態成員上定義的元資料儲存在 *C*`.[[Metadata]]` 中，鍵為屬性鍵。
* 在類別宣告 *C* 的實例成員上定義的元資料儲存在 *C*.prototype`.[[Metadata]]` 中，鍵為屬性鍵。

## API

```JavaScript
// 在物件或屬性上定義元資料
Reflect.defineMetadata(metadataKey, metadataValue, target);
Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);

// 檢查物件或屬性的原型鏈上是否存在元資料鍵
let result = Reflect.hasMetadata(metadataKey, target);
let result = Reflect.hasMetadata(metadataKey, target, propertyKey);

// 檢查物件或屬性自身是否存在元資料鍵
let result = Reflect.hasOwnMetadata(metadataKey, target);
let result = Reflect.hasOwnMetadata(metadataKey, target, propertyKey);

// 取得物件或屬性的原型鏈上元資料鍵的值
let result = Reflect.getMetadata(metadataKey, target);
let result = Reflect.getMetadata(metadataKey, target, propertyKey);

// 取得物件或屬性自身的元資料鍵的值
let result = Reflect.getOwnMetadata(metadataKey, target);
let result = Reflect.getOwnMetadata(metadataKey, target, propertyKey);

// 取得物件或屬性的原型鏈上所有的元資料鍵
let result = Reflect.getMetadataKeys(target);
let result = Reflect.getMetadataKeys(target, propertyKey);

// 取得物件或屬性自身所有的元資料鍵
let result = Reflect.getOwnMetadataKeys(target);
let result = Reflect.getOwnMetadataKeys(target, propertyKey);

// 從物件或屬性中刪除元資料
let result = Reflect.deleteMetadata(metadataKey, target);
let result = Reflect.deleteMetadata(metadataKey, target, propertyKey);

// 透過裝飾器將元資料應用於建構函式
@Reflect.metadata(metadataKey, metadataValue)
class C {
  // 透過裝飾器將元資料應用於方法（屬性）
  @Reflect.metadata(metadataKey, metadataValue)
  method() {
  }
}
```

## 替代方案

* 使用屬性而不是單獨的 API。
  * 明顯的缺點是這可能需要大量的程式碼：
```JavaScript
function ParamTypes(...types) {
  return (target, propertyKey) => {
    const symParamTypes = Symbol.for("design:paramtypes");
    if (propertyKey === undefined) {
      target[symParamTypes] = types;
    }
    else {
      const symProperties = Symbol.for("design:properties");
      let properties, property;
      if (Object.prototype.hasOwnProperty.call(target, symProperties)) {
        properties = target[symProperties];
      }
      else {
        properties = target[symProperties] = {};
      }
      if (Object.prototype.hasOwnProperty.call(properties, propertyKey)) {
        property = properties[propertyKey];
      }
      else {
        property = properties[propertyKey] = {};
      }
      property[symParamTypes] = types;
    }
  };
}
```

## 注意事項
* 雖然看起來可能違反直覺，但 `Reflect` 上的方法將元資料鍵和元資料值的參數放在目標或屬性鍵之前。這是因為屬性鍵是參數列表中唯一可選的參數。這也使得方法更容易使用 `Function#bind` 進行柯里化（currying）。這還有助於減少一個可能同時針對類別或屬性的元資料產生裝飾器的整體體積和複雜性：

```JavaScript
function ParamTypes(...types) {
  // 因為 propertyKey 實際上是可選的，所以在這裡更容易使用
  return (target, propertyKey) => { Reflect.defineMetadata("design:paramtypes", types, target, propertyKey); }

  // 相較於擁有多個將目標和鍵放在前面的多載：
  //
  // return (target, propertyKey) => {
  //    if (propertyKey === undefined) {
  //      Reflect.defineMetadata(target, "design:paramtypes", types);
  //    }
  //    else {
  //      Reflect.defineMetadata(target, propertyKey, "design:paramtypes", types);
  //    }
  // }
  //
  // 相較於為類別或屬性使用不同的方法：
  //
  // return (target, propertyKey) => {
  //    if (propertyKey === undefined) {
  //      Reflect.defineMetadata(target, "design:paramtypes", types);
  //    }
  //    else {
  //      Reflect.definePropertyMetadata(target, propertyKey, "design:paramtypes", types);
  //    }
  // }
}
```

* 要在您的 TypeScript 專案中啟用對元資料裝飾器的實驗性支援，您必須將 `"experimentalDecorators": true` 添加到您的 `tsconfig.json` 檔案中。
* 要在您的 TypeScript 專案中啟用對自動產生類型元資料的實驗性支援，您必須將 `"emitDecoratorMetadata": true` 添加到您的 `tsconfig.json` 檔案中。
  * 請注意，自動產生的類型元資料可能會在處理循環或前向參考的類型時出現問題。

## 問題

* 如果原型鏈沒有被維護，一個寫得不好的用於類別建構函式的可變裝飾器可能會導致元資料遺失。不過，在類別建構函式的可變裝飾器中不維護原型鏈也會有其他負面影響。@rbuckton
  * 如果可變裝飾器回傳一個繼承自目標的類別表達式，或者回傳該裝飾器的代理（proxy），則可以緩解此問題。@rbuckton
* 方法的元資料是透過屬性鍵附加到類別（或原型）上的。因此，如果嘗試在方法的函式上讀取元資料（例如，將方法從類別中「撕下」），則該元資料將不可用。@rbuckton

[metadata-spec]: https://rbuckton.github.io/reflect-metadata
[traceur]:       https://github.com/google/traceur-compiler
