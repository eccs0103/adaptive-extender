// decorators.ts
import { type Converter, MetadataStorage } from "./infrastructure.js";
import type { Constructor, PortableConstructor } from "./portable.js";

// --- Декоратор Поля (@Scheme) ---
export function Scheme<T>(converter: Converter<T>, name?: string) {
	return function (target: undefined, context: ClassFieldDecoratorContext) {
		const propertyKey = String(context.name);
		const schemeKey = name ?? propertyKey;

		context.addInitializer(function () {
			// 'this' здесь - это экземпляр класса при инициализации.
			// Но схема одна на весь класс. Мы регистрируем её один раз для конструктора.
			// Проверка дубликатов внутри MetadataStorage возьмет на себя оптимизацию,
			// или мы можем проверять, зарегистрировано ли уже.
			// Более надежный способ для ES2022: регистрировать через prototype
			// this.constructor.prototype - это не совсем верно.
			// Надежнее брать конструктор.

			const constructor = (this as any).constructor;

			// Чтобы не дублировать регистрацию при создании каждого инстанса,
			// можно проверять наличие флага, но MetadataStorage это переживет.
			// Важно: context.name строгий.

			MetadataStorage.registerProperty(constructor, {
				propertyKey,
				schemeKey,
				converter: converter as Converter<unknown>
			});
		});
	};
}

// --- Декоратор Полиморфизма ---
export function PolymorphicBase(...subtypes: PortableConstructor[]) {
	return function (target: Constructor, context: ClassDecoratorContext) {
		MetadataStorage.registerPolymorphism(target, subtypes);
		return target; // Возвращаем как есть
	};
}

// --- Главный Декоратор (@Portable) ---
// Решаем проблему "Mixin abstract class".
// Вместо "extends target" мы динамически патчим целевой класс статическими методами.
// Это позволяет избежать ошибки TS о расширении абстрактного класса.

export function Portable<T extends Constructor>(target: T, context: ClassDecoratorContext): T {
	// 1. Реализация import
	const importMethod = function (source: unknown, name: string): any {
		// А. Проверка на полиморфизм
		const polymorphism = MetadataStorage.getPolymorphism(target);
		if (polymorphism) {
			// Используем Reflect для безопасного доступа
			if (typeof source !== 'object' || source === null) throw new TypeError(`Source for '${name}' is not an object`);

			const typeValue = Reflect.get(source, "$type");
			const typeName = StringConverter.import(typeValue, `${name}.$type`);

			const match = polymorphism.subtypes.find(s => s.name === typeName);
			if (match) return match.import(source, name);

			throw new TypeError(`Unknown polymorphic type: ${typeName} for base ${target.name}`);
		}

		// Б. Создание инстанса
		// Используем Object.create, чтобы обойти логику конструктора (так как у нас нет аргументов)
		// Это стандарт десериализации.
		const instance = Object.create(target.prototype);
		const schemas = MetadataStorage.getProperties(target);

		for (const schema of schemas) {
			if (typeof source !== 'object' || source === null) throw new TypeError(`Source for '${name}' must be an object`);

			const valueRaw = Reflect.get(source, schema.schemeKey);
			const valueImported = schema.converter.import(valueRaw, `${name}.${schema.schemeKey}`);

			// Устанавливаем значение поля
			Reflect.set(instance, schema.propertyKey, valueImported);
		}

		return instance;
	};

	// 2. Реализация export
	const exportMethod = function (source: any): unknown {
		const polymorphism = MetadataStorage.getPolymorphism(target);

		// Если это базовый класс и пришел наследник - делегируем
		if (polymorphism) {
			// Проверяем, является ли source инстансом одного из подтипов
			for (const subtype of polymorphism.subtypes) {
				if (source instanceof subtype) {
					return subtype.export(source);
				}
			}
			// Если мы здесь, значит это либо сам базовый класс (если не абстрактный),
			// либо неизвестный наследник.
		}

		const result = {};
		// Добавляем маркер типа
		Reflect.set(result, "$type", target.name);

		const schemas = MetadataStorage.getProperties(target);
		for (const schema of schemas) {
			const valueRaw = Reflect.get(source, schema.propertyKey);
			const valueExported = schema.converter.export(valueRaw);
			Reflect.set(result, schema.schemeKey, valueExported);
		}

		return result;
	};

	// Внедряем методы через Reflect.defineProperty
	// Это позволяет обойти ограничения типов TS на миксины абстрактных классов
	Reflect.defineProperty(target, "import", {
		value: importMethod,
		writable: true,
		configurable: true
	});

	Reflect.defineProperty(target, "export", {
		value: exportMethod,
		writable: true,
		configurable: true
	});

	return target;
}
