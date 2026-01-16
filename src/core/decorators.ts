import { type PortableConstructor } from "./portable.js";

export const SCHEMAS = Symbol.for("Portable.Schemas");
export const POLYMORPHISM = Symbol.for("Portable.Polymorphism");

declare global {
	export interface Function {
		[SCHEMAS]: FieldMetadata[];
		[POLYMORPHISM]?: PolymorphicResolver;
	}
}

Function.prototype[SCHEMAS] = [];

export interface PortableSchema<T> {
	import(source: unknown, name: string): T;
	export(source: T): unknown;
}

export type PolymorphicResolver = () => PortableConstructor[];

export interface FieldMetadata {
	key: string;
	mapping: string;
	type: PortableSchema<any>;
}

export function Scheme<T>(type: PortableSchema<T>, name?: string) {
	return function (target: undefined, context: ClassFieldDecoratorContext): void {
		const key = context.name;
		if (typeof key === "symbol") throw new TypeError("");
		const mapping = name ?? key;
		context.addInitializer(function () {
			const instance = ReferenceError.suppress(this);
			const Type = constructor(instance);
			const schemas = Type[SCHEMAS];
			schemas.push({ key, mapping, type });
		});
	};
}

export function PolymorphicBase(resolver: PolymorphicResolver) {
	return function (target: any, context: ClassDecoratorContext) {
		target[POLYMORPHISM] = resolver;
		return target;
	};
}
