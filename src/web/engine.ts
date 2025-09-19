"use strict";

import "../core/index.js";
import { type Engine } from "../core/index.js";

const { trunc } = Math;

//#region Engine base
interface WebEngineEventMap {
	"trigger": Event;
	"launch": Event;
	"change": Event;
}

interface WebEngineOptions {
	launch: boolean;
}

/**
 * @abstract
 */
class WebEngine extends EventTarget implements Engine {
	#launched: boolean;
	get launched(): boolean {
		return this.#launched;
	}
	set launched(value: boolean) {
		const previous = this.#launched;
		this.#launched = value;
		if (previous !== value) this.dispatchEvent(new Event("change"));
		if (value) this.dispatchEvent(new Event("launch"));
	}
	#gap: number = 0;
	get limit(): number {
		return 1000 / this.#gap;
	}
	set limit(value: number) {
		if (Number.isNaN(value)) return;
		if (value <= 0) return;
		this.#gap = 1000 / value;
	}
	get fps(): number {
		throw new Error("Method not implemented");
	}
	get delta(): number {
		throw new Error("Method not implemented");
	}
	constructor();
	constructor(options: Partial<WebEngineOptions>);
	constructor(options: Partial<WebEngineOptions> = {}) {
		super();
		if (new.target === WebEngine) throw new TypeError("Unable to create an instance of an abstract class");

		const { launch } = options;
		this.#launched = launch ?? false;
	}
	addEventListener<K extends keyof WebEngineEventMap>(type: K, listener: (this: this, ev: WebEngineEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
		return super.addEventListener(type, listener, options);
	}
	removeEventListener<K extends keyof WebEngineEventMap>(type: K, listener: (this: WebEngine, ev: WebEngineEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
		return super.removeEventListener(type, listener, options);
	}
}
//#endregion

//#region Fast engine
class FastEngine extends WebEngine {
	#fps: number = 0;
	get fps(): number {
		return this.#fps;
	}
	get delta(): number {
		return 1 / this.#fps;
	}
	#previous: number = 0;
	constructor();
	constructor(options: Partial<WebEngineOptions>);
	constructor(options: Partial<WebEngineOptions> = {}) {
		super(options);

		requestAnimationFrame(this.#callback);
	}
	#callback: FrameRequestCallback = (current: DOMHighResTimeStamp) => {
		const difference = current - this.#previous;
		const fps = 1000 / difference;
		if (fps < this.limit) {
			if (this.launched) {
				this.#fps = fps;
				this.dispatchEvent(new Event("trigger"));
			} else {
				this.#fps = 0;
			}
			this.#previous = current;
		}
		requestAnimationFrame(this.#callback);
	};
}
//#endregion
//#region Precise engine
class PreciseEngine extends WebEngine {
	#fps: number = 0;
	get fps(): number {
		return this.#fps;
	}
	get delta(): number {
		return 1 / this.#fps;
	}
	#previous: number;
	constructor();
	constructor(options: Partial<WebEngineOptions>);
	constructor(options: Partial<WebEngineOptions> = {}) {
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
class StaticEngine extends WebEngine {
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
	constructor(options: Partial<WebEngineOptions>);
	constructor(options: Partial<WebEngineOptions> = {}) {
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

export { type WebEngineEventMap, type WebEngineOptions, WebEngine };
export { FastEngine, PreciseEngine, StaticEngine };
