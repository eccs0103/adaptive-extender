// portable-model.ts
// import { PortableConstructor } from "./portable.js";
// import { SCHEMAS, POLYMORPHISM, PortableSchema, FieldMetadata, PolymorphicResolver } from "./infrastructure.js";

import { POLYMORPHISM, SCHEMAS, type FieldMetadata, type PolymorphicResolver } from "./decorators.js";

export abstract class PortableModel {

	/**
	 * Превращает "сырой" объект в экземпляр класса.
	 */
	static import<T extends typeof PortableModel>(this: T, source: unknown, name: string): InstanceType<T> {
		// 1. Полиморфизм
		// Читаем резолвер с текущего класса (this)
		const resolver: PolymorphicResolver | undefined = (this as any)[POLYMORPHISM];

		if (resolver) {
			// Вызываем резолвер ТОЛЬКО сейчас, когда классы точно загружены
			const subtypes = resolver();

			// Используем Object.import для безопасности (из вашей либы)
			const object = (Object as any).import(source, name);
			// Получаем $type через String.import
			const typeName = (String as any).import(Reflect.get(object, "$type"), `${name}.$type`);

			const match = subtypes.find(s => s.name === typeName);
			if (match) {
				// Делегируем импорт наследнику
				return match.import(source, name) as InstanceType<T>;
			}

			throw new TypeError(`Unknown polymorphic type '${typeName}' for '${this.name}'`);
		}

		// 2. Обычная десериализация
		const object = (Object as any).import(source, name);

		// Создаем инстанс без вызова конструктора
		const instance = Object.create(this.prototype);

		// Собираем схемы по цепочке прототипов
		let current = this;
		while (current && current !== PortableModel) { // Останавливаемся на PortableModel
			const schemas: FieldMetadata[] = (current as any)[SCHEMAS];
			if (schemas) {
				for (const field of schemas) {
					const rawValue = Reflect.get(object, field.schemeKey);
					// Рекурсивный вызов import у типа поля
					const importedValue = field.type.import(rawValue, `${name}.${field.schemeKey}`);
					Reflect.set(instance, field.propertyKey, importedValue);
				}
			}
			// Поднимаемся вверх по статическому прототипу (к родительскому классу)
			current = Object.getPrototypeOf(current);
		}

		return instance as InstanceType<T>;
	}

	/**
	 * Превращает экземпляр класса в простой объект.
	 */
	static export(source: any): unknown {
		const resolver: PolymorphicResolver | undefined = (this as any)[POLYMORPHISM];

		// 1. Полиморфизм (проверка наследников)
		if (resolver) {
			const subtypes = resolver();
			for (const subtype of subtypes) {
				if (source instanceof subtype) {
					return subtype.export(source);
				}
			}
		}

		// 2. Сериализация
		const result: any = {};

		// Добавляем $type всегда (как часть контракта Portable)
		Reflect.set(result, "$type", this.name);

		let current = this;
		while (current && current !== PortableModel) {
			const schemas: FieldMetadata[] = (current as any)[SCHEMAS];
			if (schemas) {
				for (const field of schemas) {
					const value = Reflect.get(source, field.propertyKey);
					const exportedValue = field.type.export(value);
					Reflect.set(result, field.schemeKey, exportedValue);
				}
			}
			current = Object.getPrototypeOf(current);
		}

		return result;
	}
}
