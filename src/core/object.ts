"use strict";

//#region Object
declare global {
	export interface ObjectConstructor {
		/**
		 * Imports an object from a source.
		 * @param source The source to import from.
		 * @param name The name of the source.
		 * @returns The imported object.
		 * @throws {TypeError} If the source is not an object or null.
		 */
		import(source: any, name: string): object;
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
