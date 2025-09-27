import "adaptive-extender/web";
import { describe, it, expect, beforeEach } from "vitest";

describe("ParentNode extensions", () => {
	beforeEach(() => {
		document.body.innerHTML = `
			<div id="container">
				<p class="item">Paragraph 1</p>
				<a href="#" class="item">Link 1</a>
				<div class="item">
					<span id="nested-span">Nested</span>
				</div>
			</div>
		`;
	});

	describe("getElement", () => {
		it("should find and return the correct element by type", () => {
			const container = document.getElement(HTMLDivElement, "#container");
			expect(container).toBeInstanceOf(HTMLDivElement);
			expect(container.id).toBe("container");
		});

		it("should throw ReferenceError if element is not found", () => {
			expect(() => {
				document.getElement(HTMLDivElement, "#non-existent");
			}).toThrow(ReferenceError);
		});

		it("should throw TypeError if element is of the wrong type", () => {
			expect(() => {
				document.getElement(HTMLAnchorElement, "#container");
			}).toThrow(TypeError);
		});
	});

	describe("getElements", () => {
		it("should return a NodeListOf all matching elements", () => {
			const items = document.getElements(Element, ".item");
			expect(items).toBeInstanceOf(NodeList);
			expect(items.length).toBe(3);
		});

		it("should throw TypeError if any element in the list is of the wrong type", () => {
			document.body.innerHTML = `
				<div class="mixed"></div>
				<p class="mixed"></p> `;
			expect(() => {
				document.getElements(HTMLDivElement, ".mixed");
			}).toThrow(TypeError);
		});

		it("should return an empty NodeList if no elements are found", () => {
			const emptyList = document.getElements(Element, ".non-existent");
			expect(emptyList.length).toBe(0);
		});
	});

	describe("getElementAsync", () => {
		it("should return a promise that resolves with the correct element", async () => {
			const containerPromise = document.getElementAsync(HTMLDivElement, "#container");
			await expect(containerPromise).resolves.toBeInstanceOf(HTMLDivElement);
		});
	});
});