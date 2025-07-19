我要模擬一種情境
假設我有個服務需要依賴3個不同的上游服務商
而它們各自要求的欄位不一樣

假設 provider A : 
```ts
type SchemaA = {
	shop: string,

	payload: {
		id: string;
		password: string;
	}[]
}
```
```ts
type SchemaB = {
	store: string, // uuid
	currency: string, // "TWD" | "HKD"

	payload: {
		paymentMethod: string; // "COD" | "CREDIT CARD"
		password: string; 
		count : number; // > 0
	}[]
}
```
```ts
type SchemaC = {
	orderId: string,
    orderNote: string,

	payload: {
		id: string;
		password: string;
	}[]
}
```
我希望我一個 plain object 
其 shape 可能是：
```ts
{
	providerA: any | null;
	providerB: any | null;
	providerC: any | null;
}
```
可以被很好的統一處理

可以不提供某個 providerA 值，但一但提供就醫定要遵守 schema
針對這種情境，你可以幫我補充一些實務上可能會遇到的細節，
你會怎麼設計？
若你認為需要拆分檔案，就拆分，幫我把這次的實作寫在 `@src/senario-1` 中