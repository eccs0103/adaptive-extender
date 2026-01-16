import { type PortableSchema } from "./decorators.js";

export function ArrayOf<T>(type: PortableSchema<T>): PortableSchema<T[]> {
	return {
		import(source, name) {
			return Array.import(source, name).map((item, index) => type.import(item, `${name}[${index}]`));
		},

		export(source) {
			return source.map(item => type.export(item));
		}
	};
}

export function Nullable<T>(type: PortableSchema<T>): PortableSchema<T | null> {
	return {
		import(source, name) {
			return Reflect.mapNull(source, source => type.import(source, name));
		},

		export(source) {
			return Reflect.mapNull(source, source => type.export(source));
		}
	};
}

export function Optional<T>(type: PortableSchema<T>): PortableSchema<T | undefined> {
	return {
		import(source, name) {
			return Reflect.mapUndefined(source, source => type.import(source, name));
		},

		export(source) {
			return Reflect.mapUndefined(source, source => type.export(source));
		}
	};
}
