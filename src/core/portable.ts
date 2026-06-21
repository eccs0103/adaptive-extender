"use strict";

import "./number.js";
import "./string.js";
import "./boolean.js";
import "./array.js";
import "./object.js";
import "./map.js";
import "./reflect.js";
import "./error.js";
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
//#region Descriptors
Reflect.set(Symbol, "metadata", Reflect.get(Symbol, "metadata") ?? Symbol.for("Symbol.metadata"));

/**
 * Options for the {@link Field} decorator.
 */
export interface FieldOptions<I> {
	/**
	 * Alias for the field key in the external source.
	 */
	name: string;
	/**
	 * Fallback value used when the source key is absent during import.
	 */
	fallback: I;
}

class FieldDescriptor {
	#key: string;
	#association: string;
	#type: PortableConstructor;
	#hasFallback: boolean = false;
	#fallback: unknown;

	constructor(key: string, association: string, type: PortableConstructor, options: Partial<FieldOptions<unknown>> = {}) {
		this.#key = key;
		this.#association = association;
		this.#type = type;
		if (!("fallback" in options)) return;
		this.#hasFallback = true;
		this.#fallback = type.export(options.fallback);
	}

	importInto(instance: object, object: object, name: string): void {
		const raw = Reflect.get(object, this.#association);
		const source = raw === undefined && this.#hasFallback ? this.#fallback : raw;
		Reflect.set(instance, this.#key, this.#type.import(source, `${name}.${this.#association}`));
	}

	exportFrom(source: object, target: object): void {
		Reflect.set(target, this.#association, this.#type.export(Reflect.get(source, this.#key)));
	}
}

class DescendantDescriptor {
	#type: PortableConstructor<Model, object>;
	#discriminator: string | undefined;

	constructor(type: PortableConstructor<Model, object>, discriminator: string | undefined) {
		this.#type = type;
		this.#discriminator = discriminator;
	}

	accepts(discriminator: string): boolean {
		return (this.#discriminator ?? this.#type.name) === discriminator;
	}

	owns(instance: unknown): boolean {
		return instance instanceof this.#type;
	}

	import(source: any, name: string): Model {
		return this.#type.import(source, name);
	}

	exportWith(source: Model, key: string): object {
		const type = this.#type;
		const exported = type.export(source);
		Reflect.set(exported, key, this.#discriminator ?? type.name);
		return exported;
	}
}

class ModelSchema {
	static #schemas: WeakMap<typeof Model, ModelSchema> = new WeakMap();
	#model: typeof Model;
	#fields: Map<string, FieldDescriptor>;
	#discriminator: string;
	#descendants: DescendantDescriptor[];

	constructor(model: typeof Model, fields: Map<string, FieldDescriptor>, discriminator: string, descendants: DescendantDescriptor[]) {
		this.#model = model;
		this.#fields = fields;
		this.#discriminator = discriminator;
		this.#descendants = descendants;
	}

	static resolve(model: typeof Model): ModelSchema {
		const schemas = ModelSchema.#schemas;
		let schema = schemas.get(model);
		if (schema !== undefined) return schema;
		const object: DecoratorMetadataObject = ReferenceError.suppress(model[Symbol.metadata], `Required an implementation of Symbol.metadata in '${model.name}' to use portability`);
		const fields = new Map<string, FieldDescriptor>();
		let current: DecoratorMetadataObject | null = object;
		while (current !== null) {
			for (const [key, descriptor] of PortabilityMetadata.for(current).fields) fields.add(key, descriptor);
			current = Object.getPrototypeOf(current);
		}
		const own = Object.hasOwn(model, Symbol.metadata)
			? PortabilityMetadata.for(object)
			: new PortabilityMetadata();
		schema = new ModelSchema(model, fields, own.discriminator, own.descendants);
		schemas.set(model, schema);
		return schema;
	}

	import(source: any, name: string): Model {
		const descendants = this.#descendants;
		if (descendants.length > 0) {
			const key = this.#discriminator;
			const object = Object.import(source, name);
			const value = Reflect.get(object, key);
			if (value === undefined) throw new TypeError(`Missing '${key}' discriminator in ${name}`);
			const discriminator = String.import(value, `${name}.${key}`);
			const descriptor = descendants.find(descendant => descendant.accepts(discriminator));
			if (descriptor === undefined) throw new TypeError(`Unknown '${discriminator}' discriminator for ${name}`);
			return descriptor.import(source, name);
		}

		const object = Object.import(source, name);
		const instance = Reflect.construct(this.#model, []);
		for (const descriptor of this.#fields.values()) descriptor.importInto(instance, object, name);
		return instance;
	}

	export(source: Model): object {
		const descendants = this.#descendants;
		if (descendants.length > 0) {
			const key = this.#discriminator;
			const descriptor = descendants.find(descendant => descendant.owns(source));
			if (descriptor === undefined) throw new TypeError(`Invalid '${typename(source)}' type for source`);
			return descriptor.exportWith(source, key);
		}

		const target = new Object();
		for (const descriptor of this.#fields.values()) descriptor.exportFrom(source, target);
		return target;
	}
}

class PortabilityMetadata {
	static #registry: WeakMap<DecoratorMetadataObject, PortabilityMetadata> = new WeakMap();
	#fields: Map<string, FieldDescriptor> = new Map();
	#descendants: DescendantDescriptor[] = [];
	#discriminator: string = "$type";

	static for(metadata: DecoratorMetadataObject): PortabilityMetadata {
		const registry = PortabilityMetadata.#registry;
		let entry = registry.get(metadata);
		if (entry !== undefined) return entry;
		entry = new PortabilityMetadata();
		registry.set(metadata, entry);
		return entry;
	}

	get fields(): Map<string, FieldDescriptor> { return this.#fields; }
	get descendants(): DescendantDescriptor[] { return this.#descendants; }
	get discriminator(): string { return this.#discriminator; }
	set discriminator(value: string) { this.#discriminator = value; }
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
		return ModelSchema.resolve(this as unknown as typeof Model).import(source, name) as I;
	}

	/**
	 * Serializes the model instance to a raw object.
	 * @param source The model instance to export.
	 */
	static export<I extends Model, S extends object>(this: Constructor<I>, source: I): S {
		return ModelSchema.resolve(this as unknown as typeof Model).export(source) as S;
	}
}
//#endregion
//#region Decorators
/**
 * Decorator to register a class field as part of the portable schema.
 * @param type The portable constructor to use for import/export.
 */
export function Field<I, S>(type: PortableConstructor<I, S>): (target: void, context: ClassFieldDecoratorContext<Model, I>) => void;
/**
 * Decorator to register a class field as part of the portable schema.
 * @param type The portable constructor to use for import/export.
 * @param options Configuration for aliasing and migration defaults.
 */
export function Field<I, S>(type: PortableConstructor<I, S>, options: Partial<FieldOptions<I>>): (target: void, context: ClassFieldDecoratorContext<Model, I>) => void;
export function Field<I, S>(type: PortableConstructor<I, S>, options: Partial<FieldOptions<I>> = {}): (target: void, context: ClassFieldDecoratorContext<Model, I>) => void {
	return function (_: void, context: ClassFieldDecoratorContext<Model, I>): void {
		if (context.static) throw new TypeError("Portable fields cannot be static");
		const key = context.name;
		if (typeof (key) === "symbol") throw new TypeError("Symbols are not supported as portable keys");
		const association = options.name ?? key;
		const { fields } = PortabilityMetadata.for(context.metadata);
		if (!fields.has(key)) fields.set(key, new FieldDescriptor(key, association, type, options));
	};
}

/**
 * Creates a wrapper for circular or deferred type references.
 * @param resolver Function that returns the actual type constructor.
 */
export function Deferred<I, S>(resolver: (_: void) => PortableConstructor<I, S>): PortableConstructor<I, S> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return resolver()[Symbol.hasInstance](instance);
		},

		get name(): string {
			return resolver().name;
		},

		import(source: any, name: string): I {
			return resolver().import(source, name);
		},

		export(source: I): S {
			return resolver().export(source);
		},
	} as PortableConstructor<I, S>;
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
	return function (model: M, context: ClassDecoratorContext): void {
		void model;
		const { descendants } = PortabilityMetadata.for(context.metadata);
		descendants.push(new DescendantDescriptor(descendant, discriminator));
	};
}

/**
 * Decorator to register a custom discriminator key for the polymorphic model.
 * @param key The property key to use for the discriminator.
 */
export function DiscriminatorKey<M extends typeof Model>(key: string): (target: M, context: ClassDecoratorContext) => void {
	return function (model: M, context: ClassDecoratorContext): void {
		void model;
		PortabilityMetadata.for(context.metadata).discriminator = key;
	};
}
//#endregion
//#region Adapters
/**
 * Portable adapter class for optional (possibly-undefined) types.
 * Use `Optional.Of(type)` to wrap an adapter, and `Optional.map` for conditional mapping.
 */
export class Optional {
	constructor() {
		throw new TypeError("Unable to create an instance of a static class");
	}

	/**
	 * Creates a portable wrapper for optional types.
	 * @param type The inner portable type.
	 */
	static Of<I, S>(type: PortableConstructor<I, S>): PortableConstructor<I | undefined, S | undefined> {
		return {
			[Symbol.hasInstance](instance: any): boolean {
				return type[Symbol.hasInstance](instance);
			},

			get name(): string {
				return `${type.name} | undefined`;
			},

			import(source: any, name: string): I | undefined {
				return Optional.map(source, source => type.import(source, name));
			},

			export(source: I | undefined): S | undefined {
				return Optional.map(source, source => type.export(source));
			},
		} as PortableConstructor<I | undefined, S | undefined>;
	}

	/**
	 * Applies a callback to a non-undefined value, or passes through `undefined` unchanged.
	 * @param value The value to map.
	 * @param callback The function to apply if the value is not undefined.
	 */
	static map<T, R>(value: T, callback: (value: Defined<T>) => R): R | UndefinedFrom<T> {
		if (value === undefined) return value as UndefinedFrom<T>;
		return callback(value as Defined<T>);
	}
}

/**
 * Portable adapter class for nullable (possibly-null) types.
 * Use `Nullable.Of(type)` to wrap an adapter, and `Nullable.map` for conditional mapping.
 */
export class Nullable {
	constructor() {
		throw new TypeError("Unable to create an instance of a static class");
	}

	/**
	 * Creates a portable wrapper for nullable types.
	 * @param type The inner portable type.
	 */
	static Of<I, S>(type: PortableConstructor<I, S>): PortableConstructor<I | null, S | null> {
		return {
			[Symbol.hasInstance](instance: any): boolean {
				return type[Symbol.hasInstance](instance);
			},

			get name(): string {
				return `${type.name} | null`;
			},

			import(source: any, name: string): I | null {
				return Nullable.map(source, source => type.import(source, name));
			},

			export(source: I | null): S | null {
				return Nullable.map(source, source => type.export(source));
			},
		} as PortableConstructor<I | null, S | null>;
	}

	/**
	 * Applies a callback to a non-null value, or passes through `null` unchanged.
	 * @param value The value to map.
	 * @param callback The function to apply if the value is not null.
	 */
	static map<T, R>(value: T, callback: (value: NotNull<T>) => R): R | NullFrom<T> {
		if (value === null) return value as NullFrom<T>;
		return callback(value as NotNull<T>);
	}
}

/**
 * Portable adapter class for enum types.
 * Use `Enum.Of(reference)` to create an adapter that validates against enum values.
 */
export class Enum {
	constructor() {
		throw new TypeError("Unable to create an instance of a static class");
	}

	/**
	 * Creates a portable wrapper for enum types, strictly operating only on enum values.
	 * @param reference The enum object reference.
	 */
	static Of<T extends Readonly<Record<string, unknown>>>(reference: T): PortableConstructor<T[keyof T], T[keyof T]> {
		const values: Set<T[keyof T]> = new Set();
		for (const [key, value] of Object.entries(reference)) {
			const index = Number(key);
			if (String(index) === key && typeof value === "string" && Reflect.get(reference, value) === index) continue;
			values.add(value as T[keyof T]);
		}
		return {
			[Symbol.hasInstance](instance: any): boolean {
				return values.has(instance as T[keyof T]);
			},

			get name(): string {
				return "Enum";
			},

			import(source: any, name: string): T[keyof T] {
				if (!values.has(source as T[keyof T])) throw new TypeError(`Unable to import enum from ${name} due to invalid value`);
				return source as T[keyof T];
			},

			export(source: T[keyof T]): T[keyof T] {
				return source;
			},
		} as PortableConstructor<T[keyof T], T[keyof T]>;
	}
}

/**
 * Portable adapter class for unknown/any types.
 * Pass `Any` directly to `@Field` to allow any value without validation or transformation.
 */
export class Any {
	constructor() {
		throw new TypeError("Unable to create an instance of a static class");
	}

	static [Symbol.hasInstance](instance: any): boolean {
		void instance;
		return true;
	}

	static import(source: any, name: string): any {
		void name;
		return source;
	}

	static export(source: any): any {
		return source;
	}
}
//#endregion
