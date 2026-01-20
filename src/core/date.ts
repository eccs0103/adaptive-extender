"use strict";

import "./global.js";

//#region Date
declare global {
	export interface DateConstructor {
		/**
		 * Validates and imports a date value from a raw source.
		 * @param source The raw value to check.
		 * @param name The field name for error context.
		 * @throws {TypeError} If the source is not a string.
		 */
		import(source: any, name: string): Date;
		/**
		 * Returns the ISO date string for export.
		 * @param source The date to export.
		 */
		export(source: Date): string;
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

Date.import = function (source: any, name: string): Date {
	if (typeof (source) !== "string") throw new TypeError(`Unable to import date from ${name} due its ${typename(source)} type`);
	return new Date(source);
};

Date.export = function (source: Date): string {
	return source.toISOString();
};

Date.isInvalid = function (date: unknown): boolean {
	if (!(date instanceof Date)) return false;
	return Number.isNaN(date.getTime());
};

Date.prototype.insteadInvalid = function <T>(value: T): Date | T {
	if (Date.isInvalid(this)) return value;
	return this;
};
//#endregion
