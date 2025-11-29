"use strict";

//#region Reflect
declare global {
	export namespace Reflect {
		/**
		 * Applies a callback function to a non-null value, or returns the original null value.
		 * @param value The value to map.
		 * @param callback The function to apply if the value is non-null.
		 * @returns The mapped result.
		 */
		function mapNull<T, N extends Exclude<T, NonNull<T>>, R>(value: NonNull<T> | N, callback: (value: NonNull<T>) => R): R | N;
		/**
		 * Applies a callback function to a non-undefined value, or returns the original undefined value.
		 * @param value The value to map.
		 * @param callback The function to apply if the value is non-undefined.
		 * @returns The mapped result.
		 */
		function mapUndefined<T, N extends Exclude<T, NonUndefined<T>>, R>(value: NonUndefined<T> | N, callback: (value: NonUndefined<T>) => R): R | N;
		/**
		 * Applies a callback function to a non-nullable value, or returns the original nullable value.
		 * @param value The value to map.
		 * @param callback The function to apply if the value is non-nullable.
		 * @returns The mapped result.
		 */
		function mapNullable<T, N extends Exclude<T, NonNullable<T>>, R>(value: NonNullable<T> | N, callback: (object: NonNullable<T>) => R): R | N;
	}
}

Reflect.mapNull = function <T, N extends Exclude<T, NonNull<T>>, R>(value: NonNull<T> | N, callback: (value: NonNull<T>) => R): R | N {
	if (value === null) return value;
	return callback(value) as NonNull<R>;
};

Reflect.mapUndefined = function <T, N extends Exclude<T, NonUndefined<T>>, R>(value: NonUndefined<T> | N, callback: (value: NonUndefined<T>) => R): R | N {
	if (value === undefined) return value;
	return callback(value) as NonUndefined<R>;
};

Reflect.mapNullable = function <T, N extends Exclude<T, NonNullable<T>>, R>(value: NonNullable<T> | N, callback: (value: NonNullable<T>) => R): R | N {
	if (value === null || value === undefined) return value;
	return callback(value) as NonNullable<R>;
};
//#endregion
