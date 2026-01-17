"use strict";

//#region Object
declare global {
	export interface ObjectConstructor {
		/**
		 * Validates that the source is a non-null object.
		 * @param source The raw data to check.
		 * @param name The field name for error context.
		 * @throws {TypeError} If the source is not an object or is null.
		 */
		import(source: any, name: string): object;
		/**
		 * Returns the object as-is for export purposes.
		 * @param source The object to export.
		 */
		export(source: object): object;
	}
}

Object.import = function (source: any, name: string): object {
	if (typeof (source) !== "object" || source === null) throw new TypeError(`Unable to import object from ${name} due its ${typename(source)} type`);
	return source;
};

Object.export = function (source: object): object {
	return source;
};
//#endregion
