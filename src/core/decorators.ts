// decorators.ts
import { type Constructor, type PortableConstructor } from "./portable.js";
import { MetadataStorage, type PortableSchema } from "./infrastructure.js";

// @Scheme(String, "my_name")
// @Scheme(ArrayOf(Number)) -> имя берется из свойства
export function Scheme(type: PortableSchema<any>, name?: string) {
	return function (target: undefined, context: ClassFieldDecoratorContext) {
		const propertyKey = String(context.name);
		const schemeKey = name ?? propertyKey;
		context.addInitializer(function () {
			const instance = ReferenceError.suppress(this);
			const Type = constructor(instance);
			MetadataStorage.registerField(Type, { propertyKey, schemeKey, type });
		});
	};
}

// @PolymorphicBase(Child1, Child2)
export function PolymorphicBase(...subtypes: PortableConstructor[]) {
	return function (target: Constructor, context: ClassDecoratorContext) {
		MetadataStorage.registerPolymorphism(target, subtypes);
		return target;
	};
}

// @Portable
export function Portable<T extends Constructor>(target: T, context: ClassDecoratorContext): T {

	// IMPORT
	const importMethod = function (source: any, name: string): any {
		// 1. Полиморфизм
		const subtypes = MetadataStorage.getPolymorphism(target);
		if (subtypes) {
			// Используем Object.import (из вашего расширения) для безопасного получения объекта
			const object = Object.import(source, name);
			// Используем String.import для получения типа
			const typeName = String.import(Reflect.get(object, "$type"), `${name}.$type`);

			const match = subtypes.find(s => s.name === typeName);
			if (match) return match.import(source, name);

			throw new TypeError(`Unknown polymorphic type '${typeName}' for '${target.name}'`);
		}

		// 2. Десериализация полей
		// Важно: вызываем Object.import, чтобы удостовериться что source это объект
		const object = Object.import(source, name);
		const instance = Object.create(target.prototype);

		const fields = MetadataStorage.getFields(target);

		for (const field of fields) {
			const rawValue = Reflect.get(object, field.schemeKey);
			// Вся магия рекурсии здесь: field.type может быть ArrayOf(Optional(Type)).
			// Он сам развернет цепочку вызовов.
			const importedValue = field.type.import(rawValue, `${name}.${field.schemeKey}`);
			Reflect.set(instance, field.propertyKey, importedValue);
		}

		return instance;
	};

	// EXPORT
	const exportMethod = function (source: any): unknown {
		// 1. Полиморфизм
		const subtypes = MetadataStorage.getPolymorphism(target);
		if (subtypes) {
			for (const subtype of subtypes) {
				if (source instanceof subtype) {
					return subtype.export(source);
				}
			}
		}

		// 2. Сериализация
		const result: any = {};
		// $type нужен только если есть полиморфизм или это требование контракта. 
		// Добавим его всегда для консистентности, или можно проверять наличие subtypes у base class.
		// Для точного соответствия вашему примеру StackOverflowAnswerActivityScheme, $type нужен.
		Reflect.set(result, "$type", target.name);

		const fields = MetadataStorage.getFields(target);
		for (const field of fields) {
			const value = Reflect.get(source, field.propertyKey);
			const exportedValue = field.type.export(value);
			Reflect.set(result, field.schemeKey, exportedValue);
		}

		return result;
	};

	// Патчим класс
	Reflect.defineProperty(target, "import", { value: importMethod, writable: true });
	Reflect.defineProperty(target, "export", { value: exportMethod, writable: true });

	return target;
}
