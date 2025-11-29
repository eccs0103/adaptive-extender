"use strict";

import "./global.js";

//#region Boolean
declare global {
	export interface BooleanConstructor {
		/**
		 * Imports a boolean value from a source.
		 * @param source The source value to import.
		 * @param name The name of the source value.
		 * @returns The imported boolean value.
		 * @throws {TypeError} If the source is not a boolean.
		 */
		import(source: any, name?: string): boolean;
	}
}

Boolean.import = function (source: any, name: string = "[source]"): boolean {
	if (typeof (source) !== "boolean") throw new TypeError(`Unable to import boolean from ${name} due its ${typename(source)} type`);
	return source.valueOf();
};
//#endregion
