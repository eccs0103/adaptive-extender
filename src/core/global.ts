"use strict";

//#region Global
declare global {
	/**
	 * Returns the constructor of the given non-nullable value.
	 */
	export function constructor<T>(value: NonNullable<T>): Function;

	/**
	 * Gets the type name of a value.
	 */
	export function typename(value: any): string;
}

globalThis.constructor = function <T>(value: NonNullable<T>): Function {
	return value.constructor;
};

globalThis.typename = function (value: any): string {
	switch (value) {
	case undefined: return "Undefined";
	case null: return "Null";
	default: return constructor(value).name;
	}
};
//#endregion
