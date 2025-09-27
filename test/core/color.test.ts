import { Color, ColorFormats } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Color", () => {
	describe("fromRGB", () => {
		it("creates color from RGB", () => {
			const color = Color.fromRGB(10, 20, 30);
			expect(color.red).toBe(10);
			expect(color.green).toBe(20);
			expect(color.blue).toBe(30);
			expect(color.alpha).toBe(1);
		});

		it("creates color from RGB with alpha", () => {
			const color = Color.fromRGB(10, 20, 30, 0.5);
			expect(color.alpha).toBe(0.5);
		});

		it("throws on invalid RGB", () => {
			expect(() => Color.fromRGB(NaN, 20, 30)).toThrow();
			expect(() => Color.fromRGB(10, Infinity, 30)).toThrow();
			expect(() => Color.fromRGB(10, 20, "a" as any)).toThrow();
			expect(() => Color.fromRGB(10, 20, 30, "a" as any)).toThrow();
		});
	});

	describe("fromHSL", () => {
		it("creates color from HSL", () => {
			const color = Color.fromHSL(120, 50, 50);
			expect(color.hue).toBe(120);
			expect(color.saturation).toBe(50);
			expect(color.lightness).toBe(50);
			expect(color.alpha).toBe(1);
		});

		it("creates color from HSL with alpha", () => {
			const color = Color.fromHSL(120, 50, 50, 0.3);
			expect(color.alpha).toBe(0.3);
		});

		it("throws on invalid HSL", () => {
			expect(() => Color.fromHSL(NaN, 50, 50)).toThrow();
			expect(() => Color.fromHSL(120, "a" as any, 50)).toThrow();
			expect(() => Color.fromHSL(120, 50, Infinity)).toThrow();
			expect(() => Color.fromHSL(120, 50, 50, "a" as any)).toThrow();
		});
	});

	describe("parse and tryParse", () => {
		it("parses rgb string", () => {
			const color = Color.parse("rgb(10, 20, 30)");
			expect(color.red).toBe(10);
			expect(color.green).toBe(20);
			expect(color.blue).toBe(30);
			expect(color.alpha).toBe(1);
		});

		it("parses rgba string", () => {
			const color = Color.parse("rgba(10, 20, 30, 0.5)");
			expect(color.alpha).toBe(0.5);
		});

		it("parses hsl string", () => {
			const color = Color.parse("hsl(120, 50%, 50%)");
			expect(color.hue).toBe(120);
			expect(color.saturation).toBe(50);
			expect(color.lightness).toBe(50);
		});

		it("parses hsla string", () => {
			const color = Color.parse("hsla(120, 50%, 50%, 0.7)");
			expect(color.alpha).toBe(0.7);
		});

		it("parses hex string", () => {
			const color = Color.parse("#0a141e");
			expect(color.red).toBe(10);
			expect(color.green).toBe(20);
			expect(color.blue).toBe(30);
			expect(color.alpha).toBe(1);
		});

		it("parses hexa string", () => {
			const color = Color.parse("#0a141e80");
			expect(color.red).toBe(10);
			expect(color.green).toBe(20);
			expect(color.blue).toBe(30);
			expect(color.alpha).toBeCloseTo(128 / 255);
		});

		it("returns null for invalid tryParse", () => {
			expect(Color.tryParse("notacolor")).toBeNull();
		});

		it("throws for invalid parse", () => {
			expect(() => Color.parse("notacolor")).toThrow();
		});

		it("parses with options", () => {
			const color = Color.parse("rgba(1,2,3,0.4)", { format: ColorFormats.rgb, deep: true });
			expect(color.red).toBe(1);
			expect(color.green).toBe(2);
			expect(color.blue).toBe(3);
			expect(color.alpha).toBe(0.4);
		});
	});

	describe("toString", () => {
		it("returns rgb string by default", () => {
			const color = Color.fromRGB(1, 2, 3, 0.4);
			expect(color.toString()).toBe("rgba(1, 2, 3, 0.4)");
		});

		it("returns rgb string without alpha", () => {
			const color = Color.fromRGB(1, 2, 3, 0.4);
			expect(color.toString({ format: ColorFormats.rgb, deep: false })).toBe("rgb(1, 2, 3)");
		});

		it("returns hsl string", () => {
			const color = Color.fromHSL(120, 50, 50, 0.7);
			expect(color.toString({ format: ColorFormats.hsl, deep: true })).toBe(`hsla(120deg, 50%, 50%, 0.7)`);
		});

		it("returns hex string", () => {
			const color = Color.fromRGB(10, 20, 30, 0.5);
			expect(color.toString({ format: ColorFormats.hex, deep: true })).toBe("#0a141e7f");
			expect(color.toString({ format: ColorFormats.hex, deep: false })).toBe("#0a141e");
		});

		it("throws for invalid format", () => {
			const color = Color.fromRGB(1, 2, 3);
			expect(() => color.toString({ format: "BAD" as any })).toThrow();
		});
	});

	describe("presets", () => {
		it("returns correct preset colors", () => {
			expect(Color.newRed.red).toBe(255);
			expect(Color.newGreen.green).toBe(128);
			expect(Color.newBlue.blue).toBe(255);
			expect(Color.newBlack.red).toBe(0);
			expect(Color.newWhite.red).toBe(255);
			expect(Color.newTransparent.alpha).toBe(0);
		});
	});

	describe("modifiers", () => {
		it("mixes two colors evenly", () => {
			const c1 = Color.fromRGB(0, 0, 0);
			const c2 = Color.fromRGB(255, 255, 255);
			const mixed = Color.mix(c1, c2);
			expect(mixed.red).toBeCloseTo(127.5, -1);
			expect(mixed.green).toBeCloseTo(127.5, -1);
			expect(mixed.blue).toBeCloseTo(127.5, -1);
		});

		it("mixes two colors by ratio", () => {
			const c1 = Color.fromRGB(0, 0, 0);
			const c2 = Color.fromRGB(255, 255, 255);
			const mixed = Color.mix(c1, c2, 0.25);
			expect(mixed.red).toBeCloseTo(63.75, 0);
			expect(mixed.green).toBeCloseTo(63.75, 0);
			expect(mixed.blue).toBeCloseTo(63.75, 0);
		});

		it("throws on invalid mix ratio", () => {
			const c1 = Color.fromRGB(0, 0, 0);
			const c2 = Color.fromRGB(255, 255, 255);
			expect(() => Color.mix(c1, c2, NaN)).toThrow();
		});

		it("grayscale works", () => {
			const color = Color.fromRGB(100, 200, 50);
			color.grayscale();
			expect(color.red).toBeCloseTo(color.green);
			expect(color.green).toBeCloseTo(color.blue);
		});

		it("redEmphasis works", () => {
			const color = Color.fromRGB(100, 200, 50);
			color.redEmphasis();
			expect(color.green).toBeCloseTo(color.blue);
		});

		it("greenEmphasis works", () => {
			const color = Color.fromRGB(100, 200, 50);
			color.greenEmphasis();
			expect(color.red).toBeCloseTo(color.blue);
		});

		it("blueEmphasis works", () => {
			const color = Color.fromRGB(100, 200, 50);
			color.blueEmphasis();
			expect(color.red).toBeCloseTo(color.green);
		});

		it("invert works", () => {
			const color = Color.fromRGB(10, 20, 30);
			color.invert();
			expect(color.red).toBeCloseTo(245);
			expect(color.green).toBeCloseTo(235);
			expect(color.blue).toBeCloseTo(225);
		});

		it("sepia works", () => {
			const color = Color.fromRGB(100, 150, 200);
			color.sepia();
			expect(color.red).toBeGreaterThan(color.green);
			expect(color.green).toBeGreaterThan(color.blue);
		});

		it("rotate works", () => {
			const color = Color.fromHSL(10, 50, 50);
			color.rotate(30);
			expect(color.hue).toBe(40);
		});

		it("saturate works", () => {
			const color = Color.fromHSL(10, 50, 50);
			color.saturate(0.8);
			expect(color.saturation).toBeCloseTo(80);
		});

		it("illuminate works", () => {
			const color = Color.fromHSL(10, 50, 50);
			color.illuminate(0.2);
			expect(color.lightness).toBeCloseTo(20);
		});

		it("pass works", () => {
			const color = Color.fromRGB(10, 20, 30, 1);
			color.pass(0.3);
			expect(color.alpha).toBeCloseTo(0.3);
		});

		it("throws on invalid modifier input", () => {
			const color = Color.fromRGB(10, 20, 30);
			expect(() => color.grayscale(NaN)).toThrow();
			expect(() => color.redEmphasis(NaN)).toThrow();
			expect(() => color.greenEmphasis(NaN)).toThrow();
			expect(() => color.blueEmphasis(NaN)).toThrow();
			expect(() => color.invert(NaN)).toThrow();
			expect(() => color.sepia(NaN)).toThrow();
			expect(() => color.rotate(NaN)).toThrow();
			expect(() => color.saturate(NaN)).toThrow();
			expect(() => color.illuminate(NaN)).toThrow();
			expect(() => color.pass(NaN)).toThrow();
		});
	});

	describe("copy constructor", () => {
		it("copies another color", () => {
			const c1 = Color.fromRGB(10, 20, 30, 0.5);
			const c2 = new Color(c1);
			expect(c2.red).toBe(10);
			expect(c2.green).toBe(20);
			expect(c2.blue).toBe(30);
			expect(c2.alpha).toBe(0.5);
		});

		it("default constructor is black", () => {
			const c = new Color();
			expect(c.red).toBe(0);
			expect(c.green).toBe(0);
			expect(c.blue).toBe(0);
			expect(c.alpha).toBe(1);
		});
	});
});