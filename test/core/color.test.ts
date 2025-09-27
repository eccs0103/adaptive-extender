import { Color, ColorFormats } from "adaptive-extender/core";
import { strict as assert } from "assert";

const { abs } = Math;

function approxEqual(a: number, b: number, epsilon = 1): boolean {
	return abs(a - b) <= epsilon;
}

describe("Color", () => {
	describe("fromRGB", () => {
		it("creates color from RGB", () => {
			const color = Color.fromRGB(10, 20, 30);
			assert.equal(color.red, 10);
			assert.equal(color.green, 20);
			assert.equal(color.blue, 30);
			assert.equal(color.alpha, 1);
		});

		it("creates color from RGB with alpha", () => {
			const color = Color.fromRGB(10, 20, 30, 0.5);
			assert.equal(color.alpha, 0.5);
		});

		it("throws on invalid RGB", () => {
			assert.throws(() => Color.fromRGB(NaN, 20, 30));
			assert.throws(() => Color.fromRGB(10, Infinity, 30));
			assert.throws(() => Color.fromRGB(10, 20, "a" as any));
			assert.throws(() => Color.fromRGB(10, 20, 30, "a" as any));
		});
	});

	describe("fromHSL", () => {
		it("creates color from HSL", () => {
			const color = Color.fromHSL(120, 50, 50);
			assert.equal(color.hue, 120);
			assert.equal(color.saturation, 50);
			assert.equal(color.lightness, 50);
			assert.equal(color.alpha, 1);
		});

		it("creates color from HSL with alpha", () => {
			const color = Color.fromHSL(120, 50, 50, 0.3);
			assert.equal(color.alpha, 0.3);
		});

		it("throws on invalid HSL", () => {
			assert.throws(() => Color.fromHSL(NaN, 50, 50));
			assert.throws(() => Color.fromHSL(120, "a" as any, 50));
			assert.throws(() => Color.fromHSL(120, 50, Infinity));
			assert.throws(() => Color.fromHSL(120, 50, 50, "a" as any));
		});
	});

	describe("parse and tryParse", () => {
		it("parses rgb string", () => {
			const color = Color.parse("rgb(10, 20, 30)");
			assert.equal(color.red, 10);
			assert.equal(color.green, 20);
			assert.equal(color.blue, 30);
			assert.equal(color.alpha, 1);
		});

		it("parses rgba string", () => {
			const color = Color.parse("rgba(10, 20, 30, 0.5)");
			assert.equal(color.alpha, 0.5);
		});

		it("parses hsl string", () => {
			const color = Color.parse("hsl(120, 50%, 50%)");
			assert.equal(color.hue, 120);
			assert.equal(color.saturation, 50);
			assert.equal(color.lightness, 50);
		});

		it("parses hsla string", () => {
			const color = Color.parse("hsla(120, 50%, 50%, 0.7)");
			assert.equal(color.alpha, 0.7);
		});

		it("parses hex string", () => {
			const color = Color.parse("#0a141e");
			assert.equal(color.red, 10);
			assert.equal(color.green, 20);
			assert.equal(color.blue, 30);
			assert.equal(color.alpha, 1);
		});

		it("parses hexa string", () => {
			const color = Color.parse("#0a141e80");
			assert.equal(color.red, 10);
			assert.equal(color.green, 20);
			assert.equal(color.blue, 30);
			assert(approxEqual(color.alpha, 128 / 255));
		});

		it("returns null for invalid tryParse", () => {
			assert.equal(Color.tryParse("notacolor"), null);
		});

		it("throws for invalid parse", () => {
			assert.throws(() => Color.parse("notacolor"));
		});

		it("parses with options", () => {
			const color = Color.parse("rgba(1,2,3,0.4)", { format: ColorFormats.rgb, deep: true });
			assert.equal(color.red, 1);
			assert.equal(color.green, 2);
			assert.equal(color.blue, 3);
			assert.equal(color.alpha, 0.4);
		});
	});

	describe("toString", () => {
		it("returns rgb string by default", () => {
			const color = Color.fromRGB(1, 2, 3, 0.4);
			assert.equal(color.toString(), "rgba(1, 2, 3, 0.4)");
		});

		it("returns rgb string without alpha", () => {
			const color = Color.fromRGB(1, 2, 3, 0.4);
			assert.equal(color.toString({ format: ColorFormats.rgb, deep: false }), "rgb(1, 2, 3)");
		});

		it("returns hsl string", () => {
			const color = Color.fromHSL(120, 50, 50, 0.7);
			assert.equal(color.toString({ format: ColorFormats.hsl, deep: true }), `hsla(120deg, 50%, 50%, 0.7)`);
		});

		it("returns hex string", () => {
			const color = Color.fromRGB(10, 20, 30, 0.5);
			assert.equal(color.toString({ format: ColorFormats.hex, deep: true }), "#0a141e7f");
			assert.equal(color.toString({ format: ColorFormats.hex, deep: false }), "#0a141e");
		});

		it("throws for invalid format", () => {
			const color = Color.fromRGB(1, 2, 3);
			assert.throws(() => color.toString({ format: "BAD" as any }));
		});
	});

	describe("presets", () => {
		it("returns correct preset colors", () => {
			assert.equal(Color.newRed.red, 255);
			assert.equal(Color.newGreen.green, 128);
			assert.equal(Color.newBlue.blue, 255);
			assert.equal(Color.newBlack.red, 0);
			assert.equal(Color.newWhite.red, 255);
			assert.equal(Color.newTransparent.alpha, 0);
		});
	});

	describe("modifiers", () => {
		it("mixes two colors evenly", () => {
			const c1 = Color.fromRGB(0, 0, 0);
			const c2 = Color.fromRGB(255, 255, 255);
			const mixed = Color.mix(c1, c2);
			assert(approxEqual(mixed.red, 128));
			assert(approxEqual(mixed.green, 128));
			assert(approxEqual(mixed.blue, 128));
		});

		it("mixes two colors by ratio", () => {
			const c1 = Color.fromRGB(0, 0, 0);
			const c2 = Color.fromRGB(255, 255, 255);
			const mixed = Color.mix(c1, c2, 0.25);
			assert(approxEqual(mixed.red, 64));
			assert(approxEqual(mixed.green, 64));
			assert(approxEqual(mixed.blue, 64));
		});

		it("throws on invalid mix ratio", () => {
			const c1 = Color.fromRGB(0, 0, 0);
			const c2 = Color.fromRGB(255, 255, 255);
			assert.throws(() => Color.mix(c1, c2, NaN));
		});

		it("grayscale works", () => {
			const color = Color.fromRGB(100, 200, 50);
			color.grayscale();
			assert(approxEqual(color.red, color.green));
			assert(approxEqual(color.green, color.blue));
		});

		it("redEmphasis works", () => {
			const color = Color.fromRGB(100, 200, 50);
			color.redEmphasis();
			assert(approxEqual(color.green, color.blue));
		});

		it("greenEmphasis works", () => {
			const color = Color.fromRGB(100, 200, 50);
			color.greenEmphasis();
			assert(approxEqual(color.red, color.blue));
		});

		it("blueEmphasis works", () => {
			const color = Color.fromRGB(100, 200, 50);
			color.blueEmphasis();
			assert(approxEqual(color.red, color.green));
		});

		it("invert works", () => {
			const color = Color.fromRGB(10, 20, 30);
			color.invert();
			assert(approxEqual(color.red, 245));
			assert(approxEqual(color.green, 235));
			assert(approxEqual(color.blue, 225));
		});

		it("sepia works", () => {
			const color = Color.fromRGB(100, 150, 200);
			color.sepia();
			assert(color.red > color.green && color.green > color.blue);
		});

		it("rotate works", () => {
			const color = Color.fromHSL(10, 50, 50);
			color.rotate(30);
			assert.equal(color.hue, 40);
		});

		it("saturate works", () => {
			const color = Color.fromHSL(10, 50, 50);
			color.saturate(0.8);
			assert.equal(color.saturation, 80);
		});

		it("illuminate works", () => {
			const color = Color.fromHSL(10, 50, 50);
			color.illuminate(0.2);
			assert.equal(color.lightness, 20);
		});

		it("pass works", () => {
			const color = Color.fromRGB(10, 20, 30, 1);
			color.pass(0.3);
			assert.equal(color.alpha, 0.3);
		});

		it("throws on invalid modifier input", () => {
			const color = Color.fromRGB(10, 20, 30);
			assert.throws(() => color.grayscale(NaN));
			assert.throws(() => color.redEmphasis(NaN));
			assert.throws(() => color.greenEmphasis(NaN));
			assert.throws(() => color.blueEmphasis(NaN));
			assert.throws(() => color.invert(NaN));
			assert.throws(() => color.sepia(NaN));
			assert.throws(() => color.rotate(NaN));
			assert.throws(() => color.saturate(NaN));
			assert.throws(() => color.illuminate(NaN));
			assert.throws(() => color.pass(NaN));
		});
	});

	describe("copy constructor", () => {
		it("copies another color", () => {
			const c1 = Color.fromRGB(10, 20, 30, 0.5);
			const c2 = new Color(c1);
			assert.equal(c2.red, 10);
			assert.equal(c2.green, 20);
			assert.equal(c2.blue, 30);
			assert.equal(c2.alpha, 0.5);
		});

		it("default constructor is black", () => {
			const c = new Color();
			assert.equal(c.red, 0);
			assert.equal(c.green, 0);
			assert.equal(c.blue, 0);
			assert.equal(c.alpha, 1);
		});
	});
});