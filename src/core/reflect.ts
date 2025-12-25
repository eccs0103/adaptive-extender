"use strict";

//#region Reflect
declare global {
	/**
	 * Extracts the non-null part of T.
	 */
	export type NotNull<T> = Exclude<T, null>;

	/**
	 * Extracts the defined (non-undefined) part of T.
	 */
	export type Defined<T> = Exclude<T, undefined>;

	/**
	 * Extracts the null part of T (if present).
	 */
	export type NullFrom<T> = T & null;

	/**
	 * Extracts the undefined part of T (if present).
	 */
	export type UndefinedFrom<T> = T & undefined;

	/**
	 * Extracts the nullable (null or undefined) part of T (if present).
	 */
	export type NullableFrom<T> = T & (null | undefined);

	export namespace Reflect {
		/**
		 * Applies a callback function to a non-null value, or returns the original null value.
		 * @param value The value to map.
		 * @param callback The function to apply if the value is non-null.
		 */
		function mapNull<T, R>(value: T, callback: (value: NotNull<T>) => R): R | NullFrom<T>;
		/**
		 * Applies a callback function to a non-undefined value, or returns the original undefined value.
		 * @param value The value to map.
		 * @param callback The function to apply if the value is non-undefined.
		 */
		function mapUndefined<T, R>(value: T, callback: (value: Defined<T>) => R): R | UndefinedFrom<T>;
		/**
		 * Applies a callback function to a non-nullable value, or returns the original nullable value.
		 * @param value The value to map.
		 * @param callback The function to apply if the value is non-nullable.
		 */
		function mapNullable<T, R>(value: T, callback: (value: NonNullable<T>) => R): R | NullableFrom<T>;
	}
}

Reflect.mapNull = function <T, R>(value: T, callback: (value: NotNull<T>) => R): R | NullFrom<T> {
	if (value === null) return value as NullFrom<T>;
	return callback(value as NotNull<T>);
};

Reflect.mapUndefined = function <T, R>(value: T, callback: (value: Defined<T>) => R): R | UndefinedFrom<T> {
	if (value === undefined) return value as UndefinedFrom<T>;
	return callback(value as Defined<T>);
};

Reflect.mapNullable = function <T, R>(value: T, callback: (value: NonNullable<T>) => R): R | NullableFrom<T> {
	if (value === null || value === undefined) return value as NullableFrom<T>;
	return callback(value as NonNullable<T>);
};
//#endregion
