"use strict";

import "./number.js";
import "./string.js";
import "./boolean.js";
import "./array.js";
import "./object.js";
import "./reflect.js";

//#region Constructor
/**
 * Represents a generic class constructor.
 */
export type Constructor<T = any> = abstract new (...args: any[]) => T;

/**
 * Represents a constructor that supports importing instances from a source.
 */
export interface ImportableConstructor<T = any> extends Constructor<T> {
	/**
	 * Imports an instance from a source.
	 * @param source The source value to import.
	 * @param name The name of the source value.
	 * @throws {TypeError} If the source is not of the expected type.
	 */
	import(source: any, name: string): T;
}

/**
 * Represents a constructor that supports exporting instances to a scheme.
 * @template S The type of scheme.
 */
export interface ExportableConstructor<T = any, S = unknown> extends Constructor<T> {
	/**
	 * Exports an instance to a source.
	 * @param source The instance to export.
	 */
	export(source: T): S;
}

/**
 * Represents a constructor that supports facilitating the safe conversion between anonymous schemes and typed instances.
 * @template S The type of scheme.
 */
export interface PortableConstructor<T = any, S = unknown> extends ImportableConstructor<T>, ExportableConstructor<T, S> {
}
//#endregion
//#region Field descriptor
class FieldDescriptor {
	#key: string;
	#association: string;
	#type: PortableConstructor;

	constructor(key: string, association: string, type: PortableConstructor) {
		this.#key = key;
		this.#association = association;
		this.#type = type;
	}

	get key(): string {
		return this.#key;
	}

	get association(): string {
		return this.#association;
	}

	get type(): PortableConstructor {
		return this.#type;
	}
}
//#endregion
//#region Deferred resolver
export interface DeferredCallback<T> {
	(): T;
}
//#endregion
//#region Portability metadata
class PortabilityMetadata {
	static #registry: Map<string, PortabilityMetadata> = new Map();
	#model: typeof PortableModel;
	#fields: FieldDescriptor[] = [];
	#callback: DeferredCallback<PortableConstructor[]> | null = null;

	constructor(model: typeof PortableModel) {
		this.#model = model;
	}

	static read(model: typeof PortableModel): PortabilityMetadata {
		const registry = PortabilityMetadata.#registry;
		let metadata = registry.get(model.name);
		if (metadata !== undefined) return metadata;
		metadata = new PortabilityMetadata(model);
		registry.set(model.name, metadata);
		return metadata;
	}

	get model(): typeof PortableModel {
		return this.#model;
	}

	get fields(): FieldDescriptor[] {
		return this.#fields;
	}

	get callback(): DeferredCallback<PortableConstructor[]> | null {
		return this.#callback;
	}

	set callback(value: DeferredCallback<PortableConstructor[]> | null) {
		this.#callback = value;
	}
}
//#endregion

export function Field<T>(type: PortableConstructor<T>, name?: string): (target: void, context: ClassFieldDecoratorContext<PortableModel, unknown>) => void {
	return function (target: void, context: ClassFieldDecoratorContext<PortableModel>): void {
		const key = context.name;
		if (typeof key === "symbol") throw new TypeError("Symbols are not supported as portable keys");
		const association = name ?? key;
		context.addInitializer(function () {
			const Type = constructor(this) as typeof PortableModel; /** @todo Fix constructor */
			const { fields } = PortabilityMetadata.read(Type);
			if (fields.some(field => field.key === key)) return;
			fields.push(new FieldDescriptor(key, association, type));
		});
	};
}

export function ArrayOf<T>(type: PortableConstructor<T>): PortableConstructor<T[]> {
	return class {
		static import(source: any, name: string): T[] {
			return Array.import(source, name).map((item, index) => type.import(item, `${name}[${index}]`));
		}

		static export(source: T[]): unknown {
			return source.map(item => type.export(item));
		}
	} as unknown as PortableConstructor<T[]>;
}

export function Nullable<T>(type: PortableConstructor<T>): PortableConstructor<T | null> {
	return class {
		static import(source: any, name: string): T | null {
			return Reflect.mapNull(source, source => type.import(source, name));
		}

		static export(source: T | null): unknown {
			return Reflect.mapNull(source, source => type.export(source));
		}
	} as unknown as PortableConstructor<T | null>;
}

export function Optional<T>(type: PortableConstructor<T>): PortableConstructor<T | undefined> {
	return class {
		static import(source: any, name: string): T | undefined {
			return Reflect.mapUndefined(source, source => type.import(source, name));
		}

		static export(source: T | undefined): unknown {
			return Reflect.mapUndefined(source, source => type.export(source));
		}
	} as unknown as PortableConstructor<T | undefined>;
}

export function PolymorphicBase<T extends typeof PortableModel>(resolver: DeferredCallback<PortableConstructor[]>): (target: T, context: ClassDecoratorContext) => T {
	return function (target: T): T {
		const metadata = PortabilityMetadata.read(target);
		metadata.callback = resolver;
		return target;
	};
}

//#region Portable model
export abstract class PortableModel {
	static import<T extends typeof PortableModel>(this: T, source: unknown, name: string): InstanceType<T> {
		const { callback } = PortabilityMetadata.read(this);
		if (callback !== null) {
			const descendants = callback();
			if (descendants.length > 0) {
				const object = Object.import(source, name);
				const descriminator = String.import(Reflect.get(object, "$type"), `${name}.$type`);
				const subtype = descendants.find(subtype => subtype.name === descriminator) as T | undefined;
				if (subtype === undefined) throw new TypeError(`Invalid '${descriminator}' descriminator for ${name}`);
				return subtype.import(source, name);
			}
		}

		const object = Object.import(source, name);
		const instance: InstanceType<T> = Reflect.construct(this, []);
		const { fields } = PortabilityMetadata.read(this);
		for (const { key, association, type } of fields) {
			const rawValue = Reflect.get(object, association);
			const importedValue = type.import(rawValue, `${name}.${association}`);
			Reflect.set(instance, key, importedValue);
		}
		return instance;
	}

	static export<T extends typeof PortableModel>(this: T, source: InstanceType<T>): unknown {
		const { callback } = PortabilityMetadata.read(this);
		if (callback !== null) {
			const descendants = callback();
			if (descendants.length > 0) {
				const subtype = descendants.find(subtype => source instanceof subtype) as T | undefined;
				if (subtype === undefined) throw new TypeError(`Invalid '${typename(source)}' type for source`);
				return subtype.export(source);
			}
		}

		const result = Object();
		Reflect.set(result, "$type", this.name);
		const { fields } = PortabilityMetadata.read(this);
		for (const { key, association, type } of fields) {
			const value = Reflect.get(source, key);
			const exportedValue = type.export(value);
			Reflect.set(result, association, exportedValue);
		}
		return result;
	}
}
//#endregion
