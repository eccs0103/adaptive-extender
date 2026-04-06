"use strict";

import "./global.js";

//#region Big int
declare global {
	export interface BigIntConstructor {
		/**
		 * Validates and imports a bigint from a raw string source.
		 * @param source The raw value to check.
		 * @param name The field name for error context.
		 * @throws {TypeError} If the source is not a string.
		 */
		import(source: any, name: string): bigint;
		/**
		 * Returns the string representation of the bigint value for export.
		 * @param source The bigint to export.
		 */
		export(source: bigint): string;
	}
}

BigInt.import = function (source: any, name: string): bigint {
	if (typeof source !== "string") throw new TypeError(`Unable to import bigint from ${name} due its ${typename(source)} type`);
	return BigInt(source);
};

BigInt.export = function (source: bigint): string {
	return source.toString();
};
//#endregion
