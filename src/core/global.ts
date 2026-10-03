"use strict";

//#region Global
/**
 * Represents a generic class constructor.
 */
export type Constructor<I = any, P extends readonly any[] = []> = abstract new (...args: P) => I;

/**
 * The keys of `T` whose property type is assignable to `V`.
 */
export type KeysOf<T, V> = { [P in keyof T]: T[P] extends V ? P : never }[keyof T];

declare global {
	/**
	 * Returns the constructor of the given non-nullable value.
	 */
	export function constructor<T>(value: NonNullable<T>): Constructor<T>;

	/**
	 * Gets the type name of a value.
	 */
	export function typename(value: any): string;
}

globalThis.constructor = function <T>(value: NonNullable<T>): Constructor<T> {
	return value.constructor as Constructor<T>;
};

globalThis.typename = function (value: any): string {
	switch (value) {
	case undefined: return "Undefined";
	case null: return "Null";
	default: return constructor(value).name;
	}
};
//#endregion
