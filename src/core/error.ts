"use strict";

//#region Error
declare global {
	export interface ErrorConstructor {
		/**
		 * Generates an error object from the provided input.
		 * @param reason The reason input.
		 */
		from(reason: any): Error;
	}

	export interface Error {
		/**
		 * Returns a string representation of the Error object.
		 * @returns A string representation of the Error object.
		 */
		toString(): string;
	}
}

Error.from = function (reason: any): Error {
	if (reason instanceof Error) return reason;
	return new Error(reason ?? "Undefined reason");
};

Error.prototype.toString = function (): string {
	return this.stack ?? `${this.name}: ${this.message}`;
};
//#endregion
//#region Reference error
declare global {
	export interface ReferenceErrorConstructor {
		/**
		 * Ensures the value is not null or undefined.
		 * @throws {ReferenceError} If the value is null or undefined.
		 */
		suppress<T>(value: T): NonNullable<T>;
		/**
		 * Ensures the value is not null or undefined with a custom message.
		 * @throws {ReferenceError} If the value is null or undefined.
		 */
		suppress<T>(value: T, message: string): NonNullable<T>;
	}
}

ReferenceError.suppress = function <T>(value: T, message: string = "Expected a reference with not missing value"): NonNullable<T> {
	if (value === undefined || value === null) throw new ReferenceError(message);
	return value;
};
//#endregion
//#region Implementation error
/**
 * Represents an error that indicates a method or functionality is not implemented.
 * Used as a sealed error type to prevent further extension.
 */
export class ImplementationError extends Error {
	constructor() {
		super("Method not implemented");
		if (new.target !== ImplementationError) throw new TypeError("Unable to create an instance of sealed-extended class");
		this.name = "ImplementationError";
	}
}
//#endregion
