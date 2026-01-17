"use strict";

import "./global.js";

//#region Boolean
declare global {
	export interface BooleanConstructor {
		/**
		 * Validates and imports a boolean value from a raw source.
		 * @param source The raw value to check.
		 * @param name The field name for error context.
		 * @throws {TypeError} If the source is not a boolean.
		 */
		import(source: any, name: string): boolean;
		/**
		 * Returns the primitive boolean value for export.
		 * @param source The boolean to export.
		 */
		export(source: boolean): boolean;
	}
}

Boolean.import = function (source: any, name: string): boolean {
	if (typeof (source) !== "boolean") throw new TypeError(`Unable to import boolean from ${name} due its ${typename(source)} type`);
	return source.valueOf();
};

Boolean.export = function (source: boolean): boolean {
	return source.valueOf();
};
//#endregion
