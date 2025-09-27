import "../../src/web/element.js";
import { describe, it, expect, beforeEach } from "vitest";

describe("Element extensions", () => {
	let child: HTMLSpanElement;

	beforeEach(() => {
		document.body.innerHTML = `
			<main class="wrapper" lang="en">
				<div id="parent">
					<p>
						<span id="child">Click me</span>
					</p>
				</div>
			</main>
		`;
		child = document.getElementById("child") as HTMLSpanElement;
	});

	describe("getClosest", () => {
		it("should find the closest ancestor with the correct type", () => {
			const parent = child.getClosest(HTMLDivElement, "#parent");
			expect(parent).toBeInstanceOf(HTMLDivElement);
			expect(parent.id).toBe("parent");
		});

		it("should work with more general selectors", () => {
			const wrapper = child.getClosest(HTMLElement, ".wrapper");
			expect(wrapper).toBeInstanceOf(HTMLElement);
			expect(wrapper.lang).toBe("en");
		});

		it("should throw ReferenceError if no ancestor is found", () => {
			expect(() => {
				child.getClosest(HTMLBodyElement, "body > form");
			}).toThrow(ReferenceError);
		});

		it("should throw TypeError if the found ancestor has the wrong type", () => {
			expect(() => {
				child.getClosest(HTMLAudioElement, "#parent");
			}).toThrow(TypeError);
		});
	});

	describe("getClosestAsync", () => {
		it("should return a promise that resolves with the correct element", async () => {
			const parentPromise = child.getClosestAsync(HTMLDivElement, "#parent");
			await expect(parentPromise).resolves.toBeInstanceOf(HTMLDivElement);
		});
	});
});