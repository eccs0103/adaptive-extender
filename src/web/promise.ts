"use strict";

import "../core/index.js";
import { type Promisable } from "../core/index.js";

//#region Promise
declare global {
	interface PromiseConstructor {
		/**
		 * Creates a promise that resolves after the specified timeout.
		 * @param timeout The timeout in milliseconds.
		 */
		asTimeout(timeout: number): Promise<void>;
		/**
		 * Creates a promise that can be controlled with an abort signal.
		 * @param callback The callback to execute with an abort signal, resolve, and reject functions.
		 */
		withSignal<T>(callback: (signal: AbortSignal, resolve: (value: Promisable<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;
	}
}

Promise.asTimeout = async function (timeout: number): Promise<void> {
	let index: number | undefined;
	try {
		return await new Promise((resolve) => {
			index = setTimeout(resolve, timeout);
		});
	} finally {
		clearTimeout(index);
	}
};

Promise.withSignal = async function <T>(callback: (signal: AbortSignal, resolve: (value: Promisable<T>) => void, reject: (reason?: any) => void) => void): Promise<T> {
	const controller = new AbortController();
	try {
		return await new Promise((resolve, reject) => callback(controller.signal, resolve, reject));
	} finally {
		controller.abort();
	}
};
//#endregion

export { };
