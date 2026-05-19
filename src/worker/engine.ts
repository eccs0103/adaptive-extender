"use strict";

import "../core/index.js";
import { ImplementationError, type Engine } from "../core/index.js";

const { trunc } = Math;

//#region Engine base
interface WebWorkersEngineEventMap {
	"trigger": Event;
	"change": Event;
}

export interface WebWorkersEngineOptions {
	launch: boolean;
}

/**
 * Represents the base class for web-workers-based engines.
 */
export abstract class WebWorkersEngine extends EventTarget implements Engine {
	#launched: boolean;
	/**
	 * Gets a value indicating whether the engine is running.
	 */
	get launched(): boolean {
		return this.#launched;
	}
	/**
	 * Sets a value indicating whether the engine is running.
	 */
	set launched(value: boolean) {
		if (this.#launched === value) return;
		this.#launched = value;
		this.dispatchEvent(new Event("change"));
	}
	#gap: number = 0;
	/**
	 * Gets the target frame rate limit for the engine.
	 */
	get limit(): number {
		return 1000 / this.#gap;
	}
	/**
	 * Sets the target frame rate limit for the engine.
	 */
	set limit(value: number) {
		if (Number.isNaN(value)) return;
		if (value <= 0) return;
		this.#gap = 1000 / value;
	}
	/**
	 * Gets the current frames per second (FPS) of the engine.
	 * @throws {ImplementationError} If the method is not implemented in a derived class.
	 */
	get fps(): number {
		throw new ImplementationError();
	}
	/**
	 * Gets the time elapsed between the current and previous frame, in seconds.
	 * @throws {ImplementationError} If the method is not implemented in a derived class.
	 */
	get delta(): number {
		throw new ImplementationError();
	}
	/**
	 * @throws {TypeError} If this constructor is called directly on the `WebWorkersEngine` class.
	 */
	constructor();
	/**
	 * @param options An object that specifies options for the engine.
	 * @throws {TypeError} If this constructor is called directly on the `WebWorkersEngine` class.
	 */
	constructor(options: Partial<WebWorkersEngineOptions>);
	constructor(options: Partial<WebWorkersEngineOptions> = {}) {
		super();
		if (new.target === WebWorkersEngine) throw new TypeError("Unable to create an instance of an abstract class");

		const { launch } = options;
		this.#launched = launch ?? false;
	}
	addEventListener<K extends keyof WebWorkersEngineEventMap>(type: K, listener: (this: this, ev: WebWorkersEngineEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
		return super.addEventListener(type, listener, options);
	}
	removeEventListener<K extends keyof WebWorkersEngineEventMap>(type: K, listener: (this: WebWorkersEngine, ev: WebWorkersEngineEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
		return super.removeEventListener(type, listener, options);
	}
}
//#endregion

//#region Precise engine
/**
 * A variable frame rate engine.
 */
export class PreciseEngine extends WebWorkersEngine {
	#fps: number = 0;
	get fps(): number {
		return this.#fps;
	}
	get delta(): number {
		return 1 / this.#fps;
	}
	#previous: number;
	constructor();
	/**
	 * @param options An object that specifies options for the engine.
	 */
	constructor(options: Partial<WebWorkersEngineOptions>);
	constructor(options: Partial<WebWorkersEngineOptions> = {}) {
		super(options);

		this.#previous = performance.now();
		setTimeout(this.#callback, 1000 / this.limit);
	};
	#callback: TimerHandler = () => {
		const current = performance.now();
		const difference = current - this.#previous;
		if (this.launched) {
			this.#fps = (1000 / difference);
			this.dispatchEvent(new Event("trigger"));
		} else {
			this.#fps = 0;
		}
		this.#previous = current;
		setTimeout(this.#callback, 1000 / this.limit);
	};
}
//#endregion
//#region Static engine
/**
 * A fixed frame rate engine.
 */
export class StaticEngine extends WebWorkersEngine {
	get limit(): number {
		return super.limit;
	}
	set limit(value: number) {
		super.limit = value;
		this.#fps = value;
	}
	#fps = 0;
	get fps(): number {
		return this.#fps;
	}
	get delta(): number {
		return 1 / this.#fps;
	}
	#previous: number = 0;
	constructor();
	/**
	 * @param options An object that specifies options for the engine.
	 */
	constructor(options: Partial<WebWorkersEngineOptions>);
	constructor(options: Partial<WebWorkersEngineOptions> = {}) {
		super(options);
		super.limit = 120;

		this.#previous = 0;
		setTimeout(this.#callback);
	}
	#callback: TimerHandler = () => {
		const difference = performance.now() - this.#previous;
		const delta = 1000 / this.limit;
		const count = trunc(difference / delta);
		this.#fps = (1000 * count) / difference;
		for (let index = 0; index < count; index++) {
			if (this.launched) this.dispatchEvent(new Event("trigger"));
			this.#previous += count * delta;
		}
		setTimeout(this.#callback);
	};
}
//#endregion
