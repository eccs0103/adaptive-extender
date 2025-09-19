"use strict";

import "../core/index.js";

//#region Parent node
declare global {
	interface ParentNode {
		getElement<T extends typeof Element>(type: T, selectors: string): InstanceType<T>;
		getElementAsync<T extends typeof Element>(type: T, selectors: string): Promise<InstanceType<T>>;
		getElements<T extends typeof Element>(type: T, selectors: string): NodeListOf<InstanceType<T>>;
		getElementsAsync<T extends typeof Element>(type: T, selectors: string): Promise<NodeListOf<InstanceType<T>>>;
	}
}

function getElement<T extends typeof Element>(parent: ParentNode, type: T, selectors: string): InstanceType<T> {
	const element: Element = ReferenceError.suppress(parent.querySelector(selectors), `Element ${selectors} is missing`);
	if (!(element instanceof type)) throw new TypeError(`Element ${selectors} has invalid type`);
	return element as InstanceType<T>;
}

function getElements<T extends typeof Element>(parent: ParentNode, type: T, selectors: string): NodeListOf<InstanceType<T>> {
	const elements: NodeListOf<Element> = parent.querySelectorAll(selectors);
	for (let index = 0; index < elements.length; index++) {
		const element = elements.item(0);
		if (!(element instanceof type)) throw new TypeError(`Element ${selectors} at ${index} has invalid type`);
	}
	return elements as NodeListOf<InstanceType<T>>;
}

Element.prototype.getElement = function <T extends typeof Element>(type: T, selectors: string): InstanceType<T> {
	return getElement(this, type, selectors);
};

Element.prototype.getElementAsync = async function <T extends typeof Element>(type: T, selectors: string): Promise<InstanceType<T>> {
	return getElement(this, type, selectors);
};

Element.prototype.getElements = function <T extends typeof Element>(type: T, selectors: string): NodeListOf<InstanceType<T>> {
	return getElements(this, type, selectors);
};

Element.prototype.getElementsAsync = async function <T extends typeof Element>(type: T, selectors: string): Promise<NodeListOf<InstanceType<T>>> {
	return getElements(this, type, selectors);
};

Document.prototype.getElement = function <T extends typeof Element>(type: T, selectors: string): InstanceType<T> {
	return getElement(this, type, selectors);
};

Document.prototype.getElementAsync = async function <T extends typeof Element>(type: T, selectors: string): Promise<InstanceType<T>> {
	return getElement(this, type, selectors);
};

Document.prototype.getElements = function <T extends typeof Element>(type: T, selectors: string): NodeListOf<InstanceType<T>> {
	return getElements(this, type, selectors);
};

Document.prototype.getElementsAsync = async function <T extends typeof Element>(type: T, selectors: string): Promise<NodeListOf<InstanceType<T>>> {
	return getElements(this, type, selectors);
};

DocumentFragment.prototype.getElement = function <T extends typeof Element>(type: T, selectors: string): InstanceType<T> {
	return getElement(this, type, selectors);
};

DocumentFragment.prototype.getElementAsync = async function <T extends typeof Element>(type: T, selectors: string): Promise<InstanceType<T>> {
	return getElement(this, type, selectors);
};

DocumentFragment.prototype.getElements = function <T extends typeof Element>(type: T, selectors: string): NodeListOf<InstanceType<T>> {
	return getElements(this, type, selectors);
};

DocumentFragment.prototype.getElementsAsync = async function <T extends typeof Element>(type: T, selectors: string): Promise<NodeListOf<InstanceType<T>>> {
	return getElements(this, type, selectors);
};
//#endregion

export { };
