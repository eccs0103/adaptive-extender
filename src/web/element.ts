"use strict";

import "../core/index.js";

//#region Element
declare global {
	interface Element {
		getClosest<T extends typeof Element>(type: T, selectors: string): InstanceType<T>;
		getClosestAsync<T extends typeof Element>(type: T, selectors: string): Promise<InstanceType<T>>;
	}
}

Element.prototype.getClosest = function <T extends typeof Element>(type: T, selectors: string): InstanceType<T> {
	const element: Element = ReferenceError.suppress(this.closest(selectors), `Element ${selectors} is missing`);
	if (!(element instanceof type)) throw new TypeError(`Element ${selectors} has invalid type`);
	return element as InstanceType<T>;
};

Element.prototype.getClosestAsync = async function <T extends typeof Element>(type: T, selectors: string): Promise<InstanceType<T>> {
	return this.getClosest(type, selectors);
};
//#endregion

export { };
