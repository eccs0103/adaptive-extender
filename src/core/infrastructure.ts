// infrastructure.ts
import { type PortableConstructor, type Constructor } from "./portable.js";

// Внутренний тип для всего, что умеет импортировать/экспортировать.
// Это может быть как реальный Класс, так и наша Объект-обертка.
export interface PortableSchema<T> {
	import(source: unknown, name: string): T;
	export(source: T): unknown;
}

// --- Хранилище метаданных ---
const SCHEMAS = new WeakMap<object, FieldMetadata[]>();
const POLYMORPHISM = new WeakMap<object, PortableConstructor[]>();

interface FieldMetadata {
	propertyKey: string;
	schemeKey: string;
	type: PortableSchema<any>; // Здесь теперь лежит либо Класс, либо Обертка
}

export const MetadataStorage = {
	registerField(target: object, metadata: FieldMetadata) {
		const existing = SCHEMAS.get(target) ?? [];
		SCHEMAS.set(target, [...existing, metadata]);
	},

	getFields(target: object): FieldMetadata[] {
		let result: FieldMetadata[] = [];
		let current = target;
		while (current && current !== Object.prototype) {
			const schemas = SCHEMAS.get(current);
			if (schemas) result = [...schemas, ...result];
			current = Reflect.getPrototypeOf(current) as object;
		}
		return result;
	},

	registerPolymorphism(target: object, subtypes: PortableConstructor[]) {
		POLYMORPHISM.set(target, subtypes);
	},

	getPolymorphism(target: object) {
		return POLYMORPHISM.get(target);
	}
};

// --- Wrappers (Композиторы типов) ---

// 1. ArrayOf - использует Array.import для проверки массива, затем мапит элементы
export function ArrayOf<T>(inner: PortableSchema<T>): PortableSchema<T[]> {
	return {
		import(source: unknown, name: string): T[] {
			// Используем нативный Array.import из вашего расширения
			const array = (Array as any).import(source, name);
			return array.map((item: any, index: number) =>
				inner.import(item, `${name}[${index}]`)
			);
		},
		export(source: T[]): unknown[] {
			return source.map(item => inner.export(item));
		}
	};
}

// 2. Nullable - пропускает null, иначе вызывает inner.import
export function Nullable<T>(inner: PortableSchema<T>): PortableSchema<T | null> {
	return {
		import(source: unknown, name: string): T | null {
			if (source === null) return null;
			// Делегируем undefined проверку в inner или вызываем ошибку там, 
			// но если пришел undefined, а ожидаем null | T, поведение зависит от бизнес-логики.
			// Обычно undefined -> ошибка, если поле не Optional.
			return inner.import(source, name);
		},
		export(source: T | null): unknown {
			if (source === null) return null;
			return inner.export(source);
		}
	};
}

// 3. Optional - пропускает undefined, иначе вызывает inner.import
export function Optional<T>(inner: PortableSchema<T>): PortableSchema<T | undefined> {
	return {
		import(source: unknown, name: string): T | undefined {
			if (source === undefined) return undefined;
			return inner.import(source, name);
		},
		export(source: T | undefined): unknown {
			if (source === undefined) return undefined;
			return inner.export(source);
		}
	};
}

// 4. Deferred - для циклических зависимостей
// Принимает функцию, возвращающую PortableSchema
export function Deferred<T>(loader: () => PortableSchema<T>): PortableSchema<T> {
	// Кешируем результат, чтобы не вызывать loader каждый раз
	let resolved: PortableSchema<T>;
	const getInner = () => {
		if (!resolved) resolved = loader();
		return resolved;
	};

	return {
		import(source: unknown, name: string): T {
			return getInner().import(source, name);
		},
		export(source: T): unknown {
			return getInner().export(source);
		}
	};
}
