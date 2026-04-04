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
	#discriminator: string = "$type";

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

	get discriminator(): string {
		return this.#discriminator;
	}

	set discriminator(value: string) {
		this.#discriminator = value;
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
		const { descendants, discriminator: key } = PortabilityMetadata.read(model);
		if (descendants.length > 0) {
			const object = Object.import(source, name);
			const value = Reflect.get(object, key);
			if (value === undefined) throw new TypeError(`Missing '${key}' discriminator in ${name}`);
			const discriminator = String.import(value, `${name}.${key}`);
			const descriptor = descendants.find(descriptor => descriptor.discriminator === discriminator);
			if (descriptor === undefined) throw new TypeError(`Unknown '${discriminator}' discriminator for ${name}`);
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
		const { descendants, discriminator: key } = PortabilityMetadata.read(model);
		if (descendants.length > 0) {
			const descriptor = descendants.find(descriptor => source instanceof descriptor.type);
			if (descriptor === undefined) throw new TypeError(`Invalid '${typename(source)}' type for source`);
			const descendant = descriptor.type as PortableConstructor<I, S>;
			const exported = descendant.export(source);
			Reflect.set(exported, key, descriptor.discriminator);
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

/**
 * Decorator to register a custom discriminator key for the polymorphic model.
 * @param key The property key to use for the discriminator.
 */
export function DiscriminatorKey<M extends typeof Model>(key: string): (target: M, context: ClassDecoratorContext) => void {
	return function (model: M): void {
		const metadata = PortabilityMetadata.read(model);
		metadata.discriminator = key;
	};
}
//#endregion
//#region Adapters
/**
 * Creates a wrapper for circular or deferred type references.
 * @param resolver Function that returns the actual type constructor.
 */
export function Deferred<M, S>(resolver: (_: void) => PortableConstructor<M, S>): PortableConstructor<M, S> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return resolver()[Symbol.hasInstance](instance);
		},

		get name(): string {
			return resolver().name;
		},

		import(source: any, name: string): M {
			return resolver().import(source, name);
		},

		export(source: M): S {
			return resolver().export(source);
		},
	} as PortableConstructor<M, S>;
}

/**
 * Creates a portable wrapper for optional types.
 * @param type The inner portable type.
 */
export function Optional<M, S>(type: PortableConstructor<M, S>): PortableConstructor<M | undefined, S | undefined> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return instance === undefined || type[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `${type.name} | undefined`;
		},

		import(source: any, name: string): M | undefined {
			return Reflect.mapUndefined(source, source => type.import(source, name));
		},

		export(source: M | undefined): S | undefined {
			return Reflect.mapUndefined(source, source => type.export(source));
		},
	} as PortableConstructor<M | undefined, S | undefined>;
}

/**
 * Creates a portable wrapper for nullable types.
 * @param type The inner portable type.
 */
export function Nullable<M, S>(type: PortableConstructor<M, S>): PortableConstructor<M | null, S | null> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return instance === null || type[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `${type.name} | null`;
		},

		import(source: any, name: string): M | null {
			return Reflect.mapNull(source, source => type.import(source, name));
		},

		export(source: M | null): S | null {
			return Reflect.mapNull(source, source => type.export(source));
		},
	} as PortableConstructor<M | null, S | null>;
}

/**
 * Creates a portable wrapper for array types.
 * @param type The portable type of the array elements.
 */
export function ArrayOf<M, S>(type: PortableConstructor<M, S>): PortableConstructor<M[], S[]> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return Array[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `${type.name}[]`;
		},

		import(source: any, name: string): M[] {
			return Array.import(source, name).map((item, index) => type.import(item, `${name}[${index}]`));
		},

		export(source: M[]): S[] {
			return source.map(item => type.export(item));
		},
	} as PortableConstructor<M[], S[]>;
}

/**
 * Creates a portable wrapper for set types.
 * @param type The portable type of the set elements.
 */
export function SetOf<M, S>(type: PortableConstructor<M, S>): PortableConstructor<Set<M>, S[]> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return Set[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `Set<${type.name}>`;
		},

		import(source: any, name: string): Set<M> {
			return new Set(Array.import(source, name).map((item, index) => type.import(item, `${name}[${index}]`)));
		},

		export(source: Set<M>): S[] {
			return Array.from(source, item => type.export(item));
		},
	} as PortableConstructor<Set<M>, S[]>;
}

/**
 * Creates a portable wrapper for maps with string keys, converting them to and from plain objects.
 * @param value The portable type of the map values.
 */
export function RecordOf<M, S>(type: PortableConstructor<M, S>): PortableConstructor<Map<string, M>, Record<string, S>> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return Map[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `Map<string, ${type.name}>`;
		},

		import(source: any, name: string): Map<string, M> {
			const record = Object.import(source, name) as Record<string, unknown>;
			const map = new Map<string, M>();
			for (const key of Object.keys(record)) {
				map.set(key, type.import(Reflect.get(record, key), `${name}[${JSON.stringify(key)}]`));
			}
			return map;
		},

		export(source: Map<string, M>): Record<string, S> {
			const record: Record<string, S> = {};
			for (const [key, value] of source) {
				Reflect.set(record, key, type.export(value));
			}
			return record;
		},
	} as PortableConstructor<Map<string, M>, Record<string, S>>;
}

/**
 * Creates a portable wrapper for maps with arbitrary key and value types, converting them to and from arrays of `[key, value]` tuples.
 * @param key The portable type of the map keys.
 * @param value The portable type of the map values.
 */
export function MapOf<MK, SK, MV, SV>(typeKey: PortableConstructor<MK, SK>, typeValue: PortableConstructor<MV, SV>): PortableConstructor<Map<MK, MV>, [SK, SV][]> {
	return {
		[Symbol.hasInstance](instance: any): boolean {
			return Map[Symbol.hasInstance](instance);
		},

		get name(): string {
			return `Map<${typeKey.name}, ${typeValue.name}>`;
		},

		import(source: any, name: string): Map<MK, MV> {
			return new Map<MK, MV>(Array.import(source, name).map((item, index) => {
				const tuple = Array.import(item, `${name}[${index}]`);
				const key = typeKey.import(tuple[0], `${name}[${index}][0]`);
				const value = typeValue.import(tuple[1], `${name}[${index}][1]`);
				return [key, value] as [MK, MV];
			}));
		},

		export(source: Map<MK, MV>): [SK, SV][] {
			return Array.from(source, ([key, value]) => [typeKey.export(key), typeValue.export(value)] as [SK, SV]);
		},
	} as PortableConstructor<Map<MK, MV>, [SK, SV][]>;
}

/**
 * Creates a portable wrapper for enum types, strictly operating only on enum values.
 * @param reference The enum object reference.
 */
export function EnumFrom<T extends Readonly<Record<string, unknown>>>(reference: T): PortableConstructor<T[keyof T], T[keyof T]> {
	const values: Set<T[keyof T]> = new Set();
	for (const [key, value] of Object.entries(reference)) {
		const index = Number(key);
		if (String(index) === key && typeof value === "string" && Reflect.get(reference, value) === index) continue;
		values.add(value as T[keyof T]);
	}
	return {
		[Symbol.hasInstance](instance: unknown): boolean {
			return values.has(instance as T[keyof T]);
		},

		get name(): string {
			return "Enum";
		},

		import(source: unknown, name: string): T[keyof T] {
			if (!values.has(source as T[keyof T])) throw new TypeError(`Unable to import enum from ${name} due to invalid value`);
			return source as T[keyof T];
		},

		export(source: T[keyof T]): T[keyof T] {
			if (!values.has(source)) throw new TypeError(`Unable to export enum due to invalid value`);
			return source;
		},
	} as PortableConstructor<T[keyof T], T[keyof T]>;
}

/**
 * A portable adapter that facilitates the conversion between `Date` instances and millisecond timestamps.
 */
export const Timestamp = {
	[Symbol.hasInstance](instance: any): boolean {
		return Date[Symbol.hasInstance](instance);
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
} as PortableConstructor<Date, number>;

/**
 * A portable adapter that facilitates the conversion between `Date` instances and Unix second timestamps.
 */
export const UnixSeconds = {
	[Symbol.hasInstance](instance: any): boolean {
		return Date[Symbol.hasInstance](instance);
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
} as PortableConstructor<Date, number>;

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
} as PortableConstructor<any, any>;
//#endregion
