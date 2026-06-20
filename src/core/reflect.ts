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
}
//#endregion
