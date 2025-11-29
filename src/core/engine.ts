"use strict";

//#region Engine
/**
 * Represents the engine that controls update cycles and performance limits.
 */
export interface Engine {
	/**
	 * Gets whether the engine is launched.
	 */
	get launched(): boolean;
	/**
	 * Sets whether the engine is launched.
	 */
	set launched(value: boolean);
	/**
	 * Gets the maximum limit of updates per second.
	 */
	get limit(): number;
	/**
	 * Sets the maximum limit of updates per second.
	 */
	set limit(value: number);
	/**
	 * Gets the actual frames per second.
	 */
	get fps(): number;
	/**
	 * Gets the time elapsed since the last update, in milliseconds.
	 */
	get delta(): number;
}
//#endregion
