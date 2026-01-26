"use strict";

import "./number.js";
import "./string.js";
import "./boolean.js";
import "./array.js";
import "./object.js";
import "./reflect.js";
import { type Constructor } from "./global.js";

//#region Constructor
/**
 * Represents a constructor that supports facilitating the safe conversion between anonymous schemes and typed instances.
 */
export interface PortableConstructor<I = any, S = unknown> extends Constructor<I> {
	/**
	 * Imports an instance from a source.
	 * @param source The source value to import.
	 * @param name The name of the source value.
	 * @throws {TypeError} If the source is not of the expected type.
	 */
	import(source: any, name: string): I;
	/**
	 * Exports an instance to a source.
	 * @param source The instance to export.
	 */
	export(source: I): S;
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
//#region Descendant descriptor
class DescendantDescriptor {
	#type: PortableConstructor<Model, object>;
	#discriminator: string | undefined;

	constructor(type: PortableConstructor<Model, object>, discriminator: string | undefined) {
		this.#type = type;
		this.#discriminator = discriminator;
	}

	get type(): PortableConstructor<Model, object> {
		return this.#type;
	}

	get discriminator(): string {
		return this.#discriminator ?? this.#type.name;
	}
}
//#endregion
//#region Portability metadata
class PortabilityMetadata {
	static #registry: WeakMap<typeof Model, PortabilityMetadata> = new WeakMap();
	#model: typeof Model;
	#fields: Map<string, FieldDescriptor> = new Map();
	#descendants: DescendantDescriptor[] = [];

	constructor(model: typeof Model) {
		this.#model = model;
	}

	static read(model: typeof Model): PortabilityMetadata {
		const registry = PortabilityMetadata.#registry;
		let metadata = registry.get(model);
		if (metadata !== undefined) return metadata;
		metadata = new PortabilityMetadata(model);
		registry.set(model, metadata);
		return metadata;
	}

	get model(): typeof Model {
		return this.#model;
	}

	get fields(): Map<string, FieldDescriptor> {
		return this.#fields;
	}

	get descendants(): DescendantDescriptor[] {
		return this.#descendants;
	}
}
//#endregion
//#region Model
/**
 * The abstract base class for all portable data models.
 * Provides mechanism for type-safe import and export of data structures.
 */
export abstract class Model {
	/**
	 * Creates an instance of the model from a raw source.
	 * @param source The raw source object.
	 * @param name The context path for error reporting.
	 * @throws {TypeError} If validation fails or types do not match.
	 */
	static import<I extends Model>(this: Constructor<I>, source: any, name: string): I {
		const model = this as unknown as typeof Model;
		const { descendants } = PortabilityMetadata.read(model);
		if (descendants.length > 0) {
			const object = Object.import(source, name);
			const discriminator = String.import(Reflect.get(object, "$type"), `${name}.$type`);
			const descriptor = descendants.find(descriptor => descriptor.discriminator === discriminator);
			if (descriptor === undefined) throw new TypeError(`Invalid '${discriminator}' discriminator for ${name}`);
			return descriptor.type.import(source, name) as I;
		}

		const object = Object.import(source, name);
		const instance = Reflect.construct(this, []) as I;
		const { fields } = PortabilityMetadata.read(model);
		for (const { key, association, type } of fields.values()) {
			const raw = Reflect.get(object, association);
			const value = type.import(raw, `${name}.${association}`);
			Reflect.set(instance, key, value);
		}
		return instance;
	}

	/**
	 * Serializes the model instance to a raw object.
	 * @param source The model instance to export.
	 */
	static export<I extends Model, S extends object>(this: Constructor<I>, source: I): S {
		const model = this as unknown as typeof Model;
		const { descendants } = PortabilityMetadata.read(model);
		if (descendants.length > 0) {
			const descriptor = descendants.find(descriptor => source instanceof descriptor.type);
			if (descriptor === undefined) throw new TypeError(`Invalid '${typename(source)}' type for source`);
			const descendant = descriptor.type as PortableConstructor<I, S>;
			const exported = descendant.export(source);
			Reflect.set(exported, "$type", descriptor.discriminator);
			return exported;
		}

		const object = new Object() as S;
		const { fields } = PortabilityMetadata.read(model);
		for (const { key, association, type } of fields.values()) {
			const value = Reflect.get(source, key);
			const raw = type.export(value);
			Reflect.set(object, association, raw);
		}
		return object;
	}
}
//#endregion
//#region Decorators
/**
 * Decorator to register a class field as part of the portable schema.
 * @param type The portable constructor to use for import/export.
 */
export function Field<M, S>(type: PortableConstructor<M, S>): (target: void, context: ClassFieldDecoratorContext<Model, M>) => void;
/**
 * Decorator to register a class field as part of the portable schema.
 * @param type The portable constructor to use for import/export.
 * @param name Alias for the field in the external source.
 */
export function Field<M, S>(type: PortableConstructor<M, S>, name: string): (target: void, context: ClassFieldDecoratorContext<Model, M>) => void;
export function Field<M, S>(type: PortableConstructor<M, S>, name?: string): (target: void, context: ClassFieldDecoratorContext<Model, M>) => void {
	return function (_: void, context: ClassFieldDecoratorContext<Model, M>): void {
		if (context.static) throw new TypeError("Portable fields cannot be static");
		const key = context.name;
		if (typeof (key) === "symbol") throw new TypeError("Symbols are not supported as portable keys");
		const association = name ?? key;
		context.addInitializer(function () {
			const model = constructor(this) as typeof Model;
			const { fields } = PortabilityMetadata.read(model);
			if (fields.has(key)) return;
			fields.set(key, new FieldDescriptor(key, association, type));
		});
	};
}

/**
 * Creates a portable wrapper for array types.
 * @param type The portable type of the array elements.
 */
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

/**
 * Creates a portable wrapper for nullable types.
 * @param type The inner portable type.
 */
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

/**
 * Creates a portable wrapper for optional types.
 * @param type The inner portable type.
 */
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

/**
 * Creates a wrapper for circular or deferred type references.
 * @param resolver Function that returns the actual type constructor.
 */
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

/**
 * Decorator to register a descendant class in the base class's polymorphic registry.
 * @param descendant The subclass constructor to register.
 */
export function Descendant<M extends typeof Model>(descendant: PortableConstructor<Model, object>): (target: M, context: ClassDecoratorContext) => void;
/**
 * Decorator to register a descendant class in the base class's polymorphic registry.
 * @param descendant The subclass constructor to register.
 * @param discriminator The custom discriminator value.
 */
export function Descendant<M extends typeof Model>(descendant: PortableConstructor<Model, object>, discriminator: string): (target: M, context: ClassDecoratorContext) => void;
export function Descendant<M extends typeof Model>(descendant: PortableConstructor<Model, object>, discriminator?: string): (target: M, context: ClassDecoratorContext) => void {
	return function (model: M): void {
		const { descendants } = PortabilityMetadata.read(model);
		descendants.push(new DescendantDescriptor(descendant, discriminator));
	};
}
//#endregion
//#region Adapters
/**
 * A portable adapter that facilitates the conversion between `Date` instances and millisecond timestamps.
 */
export const Timestamp = {
	[Symbol.hasInstance](instance: any): boolean {
		return instance instanceof Date;
	},

	get name(): string {
		return "Timestamp";
	},

	import(source: any, name: string): Date {
		if (typeof (source) !== "number") throw new TypeError(`Unable to import date from ${name} due its ${typename(source)} type`);
		return new Date(source);
	},

	export(source: Date): number {
		return source.getTime();
	},
} as unknown as PortableConstructor<Date, number>;

/**
 * A portable adapter that facilitates the conversion between `Date` instances and Unix second timestamps.
 */
export const UnixSeconds = {
	[Symbol.hasInstance](instance: any): boolean {
		return instance instanceof Date;
	},

	get name(): string {
		return "UnixSeconds";
	},

	import(source: any, name: string): Date {
		if (typeof (source) !== "number") throw new TypeError(`Unable to import date from ${name} due its ${typename(source)} type`);
		return new Date(source * 1000);
	},

	export(source: Date): number {
		return Math.trunc(source.getTime() / 1000);
	},
} as unknown as PortableConstructor<Date, number>;

/**
 * A portable adapter that allows any value to pass through without validation or transformation.
 */
export const Any = {
	[Symbol.hasInstance](instance: any): boolean {
		void instance;
		return true;
	},

	get name(): string {
		return "Any";
	},

	import(source: any, name: string): any {
		void name;
		return source;
	},

	export(source: any): any {
		return source;
	},
} as unknown as PortableConstructor<any, any>;
//#endregion
