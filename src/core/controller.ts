"use strict";

import "./error.js";

//#region Controller
/**
 * Represents a controller that can be launched and handle errors.
 * @abstract
 */
class Controller {
	/**
	 * @throws {TypeError} If the constructor is called on ectly.
	 */
	constructor() {
		if (new.target === Controller) throw new TypeError("Unable to create an instance of an abstract class");
	}
	/**
	 * When overridden in a derived class, executes the controller's logic.
	 */
	async run(): Promise<void> {
	}
	/**
	 * When overridden in a derived class, handles an error that occurred during the controller's execution.
	 */
	async catch(error: Error): Promise<void> {
	}
	/**
	 * Creates an instance of the controller and runs it.
	 */
	static async launch(this: new () => Controller): Promise<void> {
		const controller = Reflect.construct(this, []);
		try {
			await controller.run();
		} catch (reason) {
			await controller.catch(Error.from(reason));
		}
	}
}
//#endregion

export { Controller };
