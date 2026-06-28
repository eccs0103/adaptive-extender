"use strict";

import "../core/index.js";
import { type WebWorkersEngine } from "./engine.js";

//#region Stopwatch
/**
 * Measures elapsed time driven by an engine's trigger events.
 */
export class Stopwatch {
	#elapsed: number = 0;
	#launched: boolean = false;

	/**
	 * @param engine The engine driving the stopwatch.
	 */
	constructor(engine: WebWorkersEngine) {
		engine.addEventListener("trigger", (event) => {
			if (!this.#launched) return;
			this.#elapsed += engine.delta;
		});
	}

	/**
	 * Gets the elapsed time in the same unit as the engine's delta.
	 */
	get elapsed(): number { return this.#elapsed; }
	/**
	 * Gets the launched state of the stopwatch.
	 */
	get launched(): boolean { return this.#launched; }
	/**
	 * Sets the launched state of the stopwatch.
	 */
	set launched(value: boolean) { this.#launched = value; }

	/**
	 * Resets the elapsed time to zero.
	 */
	reset(): void {
		this.#elapsed = 0;
	}
}
//#endregion
