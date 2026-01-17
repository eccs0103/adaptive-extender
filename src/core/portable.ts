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
export type Constructor<T = any, P extends readonly any[] = []> = abstract new (...args: P) => T;

/**
 * Represents a constructor that supports importing instances from a source.
 */
export interface ImportableConstructor<M = any> extends Constructor<M> {
	/**
	 * Imports an instance from a source.
	 * @param source The source value to import.
	 * @param name The name of the source value.
	 * @throws {TypeError} If the source is not of the expected type.
	 */
	import(source: any, name: string): M;
}

/**
 * Represents a constructor that supports exporting instances to a scheme.
 * @template S The type of scheme.
 */
export interface ExportableConstructor<M = any, S = unknown> extends Constructor<M> {
	/**
	 * Exports an instance to a source.
	 * @param source The instance to export.
	 */
	export(source: M): S;
}

/**
 * Represents a constructor that supports facilitating the safe conversion between anonymous schemes and typed instances.
 * @template S The type of scheme.
 */
export interface PortableConstructor<M = any, S = unknown> extends ImportableConstructor<M>, ExportableConstructor<M, S> {
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
//#region Portability metadata
class PortabilityMetadata {
	static #registry: Map<string, PortabilityMetadata> = new Map();
	#model: typeof PortableModel;
	#fields: FieldDescriptor[] = [];
	#descendants: PortableConstructor[] = [];

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

	get descendants(): PortableConstructor[] {
		return this.#descendants;
	}
}
//#endregion
//#region Portable model
export abstract class PortableModel {
	static import<T extends typeof PortableModel>(this: T, source: unknown, name: string): InstanceType<T> {
		const { descendants } = PortabilityMetadata.read(this);
		if (descendants.length > 0) {
			const object = Object.import(source, name);
			const descriminator = String.import(Reflect.get(object, "$type"), `${name}.$type`);
			const descendant = descendants.find(descendant => descendant.name === descriminator) as T | undefined;
			if (descendant === undefined) throw new TypeError(`Invalid '${descriminator}' descriminator for ${name}`);
			return descendant.import(source, name);
		}

		const object = Object.import(source, name);
		const instance: InstanceType<T> = Reflect.construct(this, []);
		const { fields } = PortabilityMetadata.read(this);
		for (const { key, association, type } of fields) {
			const raw = Reflect.get(object, association);
			const value = type.import(raw, `${name}.${association}`);
			Reflect.set(instance, key, value);
		}
		return instance;
	}

	static export<T extends typeof PortableModel>(this: T, source: InstanceType<T>): unknown {
		const { descendants } = PortabilityMetadata.read(this);
		if (descendants.length > 0) {
			const descendant = descendants.find(descendant => source instanceof descendant) as T | undefined;
			if (descendant === undefined) throw new TypeError(`Invalid '${typename(source)}' type for source`);
			return descendant.export(source);
		}

		const object = Object();
		Reflect.set(object, "$type", this.name);
		const { fields } = PortabilityMetadata.read(this);
		for (const { key, association, type } of fields) {
			const value = Reflect.get(source, key);
			const raw = type.export(value);
			Reflect.set(object, association, raw);
		}
		return object;
	}
}
//#endregion
//#region Decorators
export function Field<M, S>(type: PortableConstructor<M, S>, name?: string): (target: void, context: ClassFieldDecoratorContext<PortableModel, S>) => void {
	return function (_: void, context: ClassFieldDecoratorContext<PortableModel>): void {
		const key = context.name;
		if (typeof (key) === "symbol") throw new TypeError("Symbols are not supported as portable keys");
		const association = name ?? key;
		context.addInitializer(function () {
			const model = constructor(this) as typeof PortableModel; /** @todo Fix constructor */
			const { fields } = PortabilityMetadata.read(model);
			if (fields.some(field => field.key === key)) return;
			fields.push(new FieldDescriptor(key, association, type));
		});
	};
}

export function ArrayOf<M, S>(type: PortableConstructor<M, S>): PortableConstructor<M[], S[]> {
	return class {
		static import(source: any, name: string): M[] {
			return Array.import(source, name).map((item, index) => type.import(item, `${name}[${index}]`));
		}

		static export(source: M[]): S[] {
			return source.map(item => type.export(item));
		}
	} as unknown as PortableConstructor<M[], S[]>;
}

export function Nullable<M, S>(type: PortableConstructor<M, S>): PortableConstructor<M | null, S | null> {
	return class {
		static import(source: any, name: string): M | null {
			return Reflect.mapNull(source, source => type.import(source, name));
		}

		static export(source: M | null): S | null {
			return Reflect.mapNull(source, source => type.export(source));
		}
	} as unknown as PortableConstructor<M | null, S | null>;
}

export function Optional<M, S>(type: PortableConstructor<M, S>): PortableConstructor<M | undefined, S | undefined> {
	return class {
		static import(source: any, name: string): M | undefined {
			return Reflect.mapUndefined(source, source => type.import(source, name));
		}

		static export(source: M | undefined): S | undefined {
			return Reflect.mapUndefined(source, source => type.export(source));
		}
	} as unknown as PortableConstructor<M | undefined, S | undefined>;
}

export function Deferred<M, S>(resolver: (_: void) => PortableConstructor<M, S>): PortableConstructor<M, S> {
	return class {
		static [Symbol.hasInstance](instance: any): boolean {
			return instance instanceof resolver();
		}

		static get name(): string {
			return resolver().name;
		}

		static import(source: any, name: string): M {
			return resolver().import(source, name);
		}

		static export(source: M): S {
			return resolver().export(source);
		}
	} as unknown as PortableConstructor<M, S>;
}

export function PolymorphicBase<M extends typeof PortableModel>(descendant: PortableConstructor): (target: M, context: ClassDecoratorContext) => M {
	return function (model: M): M {
		const { descendants } = PortabilityMetadata.read(model);
		descendants.push(descendant);
		return model;
	};
}
//#endregion
