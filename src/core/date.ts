"use strict";

import "./global.js";

//#region Date
declare global {
	export interface DateConstructor {
		/**
		 * Checks whether a given date is invalid.
		 * @returns `true` if the value is a `Date` and is invalid; otherwise, `false`.
		 */
		isInvalid(date: unknown): boolean;
	}

	export interface Date {
		/**
		 * Returns the current date unless it is invalid, replacing it with the provided value.
		 * @param value The fallback value.
		 * @returns The original date or the fallback.
		 */
		insteadInvalid<T>(value: T): Date | T;
	}
}

Date.isInvalid = function (date: unknown): boolean {
	if (!(date instanceof Date)) return false;
	return Number.isNaN(date.getTime());
};

Date.prototype.insteadInvalid = function <T>(value: T): Date | T {
	if (Date.isInvalid(this)) return value;
	return this;
};
//#endregion
