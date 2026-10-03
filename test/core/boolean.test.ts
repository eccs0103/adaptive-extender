"use strict";

import "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Boolean extensions", () => {
	describe("Boolean.import", () => {
		it("should import true as true", () => {
			expect(Boolean.import(true, "[source]")).toBe(true);
		});

		it("should import false as false", () => {
			expect(Boolean.import(false, "[source]")).toBe(false);
		});

		it("should throw TypeError for non-boolean values (number)", () => {
			const value = 1;
			const message = `Unable to import boolean from [source] due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "[source]")).toThrow(new TypeError(message));
		});

		it("should throw TypeError for non-boolean values (string)", () => {
			const value = "true";
			const message = `Unable to import boolean from [source] due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "[source]")).toThrow(new TypeError(message));
		});

		it("should throw TypeError for non-boolean values (object)", () => {
			const value = {};
			const message = `Unable to import boolean from [source] due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "[source]")).toThrow(new TypeError(message));
		});

		it("should throw TypeError for non-boolean values (undefined)", () => {
			const value = undefined;
			const message = `Unable to import boolean from [source] due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "[source]")).toThrow(new TypeError(message));
		});

		it("should use custom name in error message", () => {
			const value = 0;
			const message = `Unable to import boolean from customName due its ${typename(value)} type`;
			expect(() => Boolean.import(value as any, "customName")).toThrow(new TypeError(message));
		});
	});

	describe("Boolean.export", () => {
		it("should export true as true", () => {
			expect(Boolean.export(true)).toBe(true);
		});

		it("should export false as false", () => {
			expect(Boolean.export(false)).toBe(false);
		});
	});
});
