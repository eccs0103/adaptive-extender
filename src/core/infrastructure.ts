// infrastructure.ts
import { type Constructor, type PortableConstructor } from "./portable.js";

// --- Строгие типы ---

export interface Converter<T> {
	import(source: unknown, name: string): T;
	export(source: T): unknown;
}

// Тип для схемы поля
interface PropertySchema {
	propertyKey: string;
	schemeKey: string;
	converter: Converter<unknown>;
}

// Тип для хранения полиморфных связей
interface PolymorphicSchema {
	subtypes: PortableConstructor[];
}

// --- Хранилище Метаданных (Singleton) ---
// Используем WeakMap, чтобы не удерживать классы в памяти и не засорять сами классы полями
const SCHEMAS = new WeakMap<object, PropertySchema[]>();
const POLYMORPHISM = new WeakMap<object, PolymorphicSchema>();

export const MetadataStorage = {
	registerProperty(target: object, schema: PropertySchema): void {
		const existing = SCHEMAS.get(target) ?? [];
		SCHEMAS.set(target, [...existing, schema]);
	},

	getProperties(target: object): PropertySchema[] {
		// Рекурсивно собираем схемы по цепочке прототипов
		let result: PropertySchema[] = [];
		let current = target;

		while (current && current !== Object.prototype) {
			const schemas = SCHEMAS.get(current);
			if (schemas) {
				// Добавляем в начало, чтобы переопределенные поля (если будут) были корректны
				result = [...schemas, ...result];
			}
			current = Reflect.getPrototypeOf(current) as object;
		}
		return result;
	},

	registerPolymorphism(target: object, subtypes: PortableConstructor[]): void {
		POLYMORPHISM.set(target, { subtypes });
	},

	getPolymorphism(target: object): PolymorphicSchema | undefined {
		return POLYMORPHISM.get(target);
	}
};

// --- Базовые Конвертеры (Strict) ---

export const StringConverter: Converter<string> = {
	import(source: unknown, name: string): string {
		// Здесь вызываем ваш существующий String.import (предполагаем его наличие)
		// Если его нет в контексте, вот строгая реализация:
		if (typeof source !== "string") throw new TypeError(`Field '${name}' must be a string, got ${typeof source}`);
		return source;
	},
	export(source: string): unknown {
		return source;
	}
};

export const NumberConverter: Converter<number> = {
	import(source: unknown, name: string): number {
		if (typeof source !== "number") throw new TypeError(`Field '${name}' must be a number`);
		return source;
	},
	export(source: number): unknown {
		return source;
	}
};

export function ArrayOf<T>(converter: Converter<T>): Converter<T[]> {
	return {
		import(source: unknown, name: string): T[] {
			if (!Array.isArray(source)) throw new TypeError(`Field '${name}' must be an array`);
			return source.map((item, index) => converter.import(item, `${name}[${index}]`));
		},
		export(source: T[]): unknown {
			return source.map(item => converter.export(item));
		}
	};
}

export function Nullable<T>(converter: Converter<T>): Converter<T | null> {
	return {
		import(source: unknown, name: string): T | null {
			if (source === null || source === undefined) return null;
			return converter.import(source, name);
		},
		export(source: T | null): unknown {
			if (source === null) return null;
			return converter.export(source);
		}
	};
}
