"use strict";

//#region Promise
/**
 * Represents a value that can be either a plain value or a Promise resolving to that value.
 */
export type Promisable<T> = T | Promise<T>;

declare global {
	export interface Promise<T> {
		/**
		 * Checks if the promise is settled.
		 */
		readonly isSettled: Promise<boolean>;
		/**
		 * Checks if the promise is resolved.
		 */
		readonly isResolved: Promise<boolean>;
		/**
		 * Checks if the promise is rejected.
		 */
		readonly isRejected: Promise<boolean>;
		/**
		 * Retrieves the value of a resolved promise.
		 * @throws {Error} Throws an error if the promise is rejected.
		 */
		readonly value: Promise<T>;
		/**
		 * Retrieves the reason of a rejected promise.
		 * @throws {Error} Throws an error if the promise is fulfilled.
		 */
		readonly reason: Promise<any>;
	}
}

Object.defineProperty(Promise.prototype, "isSettled", {
	async get<T>(this: Promise<T>): Promise<boolean> {
		const symbol = Symbol();
		try {
			const result = (await Promise.race([this, symbol]) !== symbol);
			return result;
		} catch {
			return true;
		}
	}
});

Object.defineProperty(Promise.prototype, "isResolved", {
	async get<T>(this: Promise<T>): Promise<boolean> {
		try {
			await this;
			return true;
		} catch {
			return false;
		}
	}
});

Object.defineProperty(Promise.prototype, "isRejected", {
	async get<T>(this: Promise<T>): Promise<boolean> {
		try {
			await this;
			return false;
		} catch {
			return true;
		}
	}
});

Object.defineProperty(Promise.prototype, "value", {
	async get<T>(this: Promise<T>): Promise<T> {
		try {
			return await this;
		} catch {
			throw new Error("Unable to get value of rejected promise");
		}
	}
});

Object.defineProperty(Promise.prototype, "reason", {
	async get<T>(this: Promise<T>): Promise<any> {
		try {
			await this;
		} catch (reason) {
			return reason;
		}
		throw new Error("Unable to get reason of resolved promise");
	}
});
//#endregion
