"use strict";

import "./error.js";
import { type Constructor } from "./global.js";

//#region Controller
/**
 * Represents a controller that can be launched and handle errors.
 */
export abstract class Controller<A extends readonly any[] = []> {
	/**
	 * @throws {TypeError} If the constructor is called directly.
	 */
	constructor() {
		if (new.target === Controller) throw new TypeError("Unable to create an instance of an abstract class");
	}
	/**
	 * When overridden in a derived class, executes the controller's logic.
	 * @param args The arguments forwarded from {@link launch}.
	 */
	async run(...args: A): Promise<void> {
		void args;
	}
	/**
	 * When overridden in a derived class, handles an error that occurred during the controller's execution.
	 */
	async catch(error: Error): Promise<void> {
		void error;
	}
	/**
	 * When overridden in a derived class, runs unconditionally after {@link run} and {@link catch}.
	 */
	async finally(): Promise<void> {
	}
	/**
	 * Creates an instance of the controller and runs it.
	 * @param args The arguments to forward to {@link run}.
	 */
	static async launch<A extends readonly any[]>(this: Constructor<Controller<A>>, ...args: A): Promise<void> {
		const controller = Reflect.construct(this, []);
		if (!(controller instanceof this)) throw new TypeError(`Unable to construct an instance of ${this.name}`);
		try {
			await controller.run(...args);
		} catch (reason) {
			await controller.catch(Error.from(reason));
		} finally {
			await controller.finally();
		}
	}
}
//#endregion
