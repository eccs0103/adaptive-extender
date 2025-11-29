"use strict";

//#region Global
declare global {
	/**
	 * Exclude null from T
	 */
	type NonNull<T> = T & ({} | undefined);

	/**
	 * Exclude undefined from T
	 */
	type NonUndefined<T> = T & ({} | null);

	/**
	 * Returns the prototype of the given non-nullable value.
	 * @param value The value whose prototype is to be retrieved. It cannot be null or undefined.
	 */
	function prototype<T>(value: NonNullable<T>): Function;
	
	/**
	 * Gets the type name of a value.
	 * @param value The value to get the type name of.
	 * @returns The type name of the value.
	 */
	function typename(value: any): string;
}

globalThis.prototype = function <T>(value: NonNullable<T>): Function {
	return value.constructor;
};

globalThis.typename = function (value: any): string {
	switch (value) {
		case undefined: return "Undefined";
		case null: return "Null";
		default: return prototype(value).name;
	}
};
//#endregion

export { };
