import 'reflect-metadata'; // 必須在最頂層引入一次

function logType(target: any, propertyKey: string, descriptor?: PropertyDescriptor): void;
function logType(target: unknown, context: ClassFieldDecoratorContext): void;
function logType(target: any, propertyKeyOrContext: string | ClassFieldDecoratorContext, _descriptor?: PropertyDescriptor): void {
  let propertyKey: string;

  // 統一處理不同的 decorator 簽名
  if (typeof propertyKeyOrContext === 'string') {
    // 舊版簽名: (target: any, propertyKey: string)
    propertyKey = propertyKeyOrContext;
  } else {
    // 新版簽名: (target: unknown, context: ClassFieldDecoratorContext)
    propertyKey = propertyKeyOrContext.name as string;
  }

  const type = Reflect.getMetadata('design:type', target, propertyKey);

  if (type) {
    console.log(`${propertyKey} 的型別是: ${type.name}`);
  } else {
    console.log(`${propertyKey} 的型別無法被 reflect-metadata 識別`);
  }
}

class MyClass {
  @logType
  public name!: string;

  @logType
  public age!: number;

  @logType
  public isAdmin!: boolean;

  @logType
  public hobbies!: string[];

  @logType
  public address!: {
    city: string;
    street: string;
    zipCode: string;
  };
}