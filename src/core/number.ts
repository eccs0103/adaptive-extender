"use strict";

import "./global.js";

//#region Number
declare global {
	export interface NumberConstructor {
		/**
		 * Imports a number from a source.
		 * @param source The source value to import.
		 * @param name The name of the source value.
		 * @returns The imported number value.
		 * @throws {TypeError} If the source is not a number.
		 */
		import(source: any, name?: string): number;
	}

	export interface Number {
		/**
		 * Returns the current number unless it is NaN, replacing it with the provided value.
		 * @param value The fallback value.
		 * @returns The original number or the fallback.
		 */
		insteadNaN<T>(value: T): number | T;
		/**
		 * Returns the current number unless it is NaN or infinite, replacing it with the provided value.
		 * @param value The fallback value.
		 * @returns The original number or the fallback.
		 */
		insteadInfinity<T>(value: T): number | T;
		/**
		 * Returns the current number unless it is zero, NaN, or infinite, replacing it with the provided value.
		 * @param value The fallback value.
		 * @returns The original number or the fallback.
		 */
		insteadZero<T>(value: T): number | T;
	}
}

Number.import = function (source: any, name: string = "[source]"): number {
	if (typeof (source) !== "number") throw new TypeError(`Unable to import number from ${name} due its ${typename(source)} type`);
	return source.valueOf();
};

Number.prototype.insteadNaN = function <T>(value: T): number | T {
	const current = this.valueOf();
	if (Number.isNaN(current)) return value;
	return current;
};

Number.prototype.insteadInfinity = function <T>(value: T): number | T {
	const current = this.valueOf();
	if (!Number.isFinite(current)) return value;
	return current;
};

Number.prototype.insteadZero = function <T>(value: T): number | T {
	const current = this.valueOf();
	if (current === 0) return value;
	return current;
};
//#endregion
