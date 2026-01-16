import type { PortableSchema } from "./decorators.js";

export function ArrayOf<T>(type: PortableSchema<T>): PortableSchema<T[]> {
	return {
		import(source, name) {
			// Строго вызываем Array.import. TypeScript знает о нем благодаря твоему расширению.
			const array = Array.import(source, name);
			return array.map((item, index) =>
				type.import(item, `${name}[${index}]`)
			);
		},
		export(source) {
			return source.map(item => type.export(item));
		}
	};
}

export function Nullable<T>(type: PortableSchema<T>): PortableSchema<T | null> {
	return {
		import(source, name) {
			if (source === null) return null;
			return type.import(source, name);
		},
		export(source) {
			if (source === null) return null;
			return type.export(source);
		}
	};
}

export function Optional<T>(type: PortableSchema<T>): PortableSchema<T | undefined> {
	return {
		import(source, name) {
			if (source === undefined) return undefined;
			return type.import(source, name);
		},
		export(source) {
			if (source === undefined) return undefined;
			return type.export(source);
		}
	};
}
