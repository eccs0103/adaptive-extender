// infrastructure.ts
import { type PortableConstructor } from "./portable.js";

// Символы скрыты от пользователя
export const SCHEMAS = Symbol.for("Portable.Schemas");
export const POLYMORPHISM = Symbol.for("Portable.Polymorphism");

// Интерфейс для всего, что умеет импортировать (примитивы, классы, обертки)
export interface PortableSchema<T> {
	import(source: unknown, name: string): T;
	export(source: T): unknown;
}

// Тип для отложенного получения списка наследников
export type PolymorphicResolver = () => PortableConstructor[];

export interface FieldMetadata {
	propertyKey: string;
	schemeKey: string;
	type: PortableSchema<any>;
}


// @Scheme(String, "title")
export function Scheme<T>(type: PortableSchema<T>, name?: string) {
	return function (target: undefined, context: ClassFieldDecoratorContext) {
		const propertyKey = String(context.name);
		const schemeKey = name ?? propertyKey;

		context.addInitializer(function () {
			const constructor = (this as any).constructor;
			// Инициализируем массив схем, если его нет
			if (!Object.prototype.hasOwnProperty.call(constructor, SCHEMAS)) {
				Object.defineProperty(constructor, SCHEMAS, {
					value: [],
					enumerable: false,
					writable: true,
					configurable: true
				});
			}
			const schemas: FieldMetadata[] = constructor[SCHEMAS];
			schemas.push({ propertyKey, schemeKey, type });
		});
	};
}

// @PolymorphicBase(() => [Derived1, Derived2])
export function PolymorphicBase(resolver: PolymorphicResolver) {
	return function (target: any, context: ClassDecoratorContext) {
		// Сохраняем резолвер, не вызывая его сразу!
		Object.defineProperty(target, POLYMORPHISM, {
			value: resolver,
			enumerable: false,
			writable: true,
			configurable: true
		});
		return target;
	};
}
