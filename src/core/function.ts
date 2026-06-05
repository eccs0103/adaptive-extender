"use strict";

//#region Function
declare global {
	export interface FunctionConstructor {
		/**
		 * A constant empty function.
		 */
		empty: () => void;
	}
}

Object.defineProperty(Function, "empty", {
	value: () => { },
	writable: false,
});
//#endregion
