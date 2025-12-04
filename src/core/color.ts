"use strict";

import "./number.js";
import "./string.js";

const { min, max, trunc, abs } = Math;

//#region Color formats
/**
 * Represents available color formats.
 */
export enum ColorFormats {
	rgb = "RGB",
	hsl = "HSL",
	hex = "HEX",
}
//#endregion
//#region Color
export interface ColorProperties {
	/**
	 * Indicates whether the alpha channel is included.
	 */
	deep: boolean;
	/**
	 * The output format of the color.
	 */
	format: ColorFormats;
}

/**
 * Represents a color in RGB, HSL, or HEX format with support for alpha channel,
 * conversion between formats, creation from components, and parsing from strings.
 */
export class Color {
	//#region Properties
	#rgb: Uint8ClampedArray = new Uint8ClampedArray([0, 0, 0]);
	/**
	 * Gets the red color component.
	 */
	get red(): number {
		return this.#rgb[0];
	}
	/**
	 * Sets the red color component.
	 */
	set red(value: number) {
		if (!Number.isFinite(value)) return;
		this.#rgb[0] = value;
		Color.#RGBtoHSL(this.#rgb, this.#hsl);
	}
	/**
	 * Gets the green color component.
	 */
	get green(): number {
		return this.#rgb[1];
	}
	/**
	 * Sets the green color component.
	 */
	set green(value: number) {
		if (!Number.isFinite(value)) return;
		this.#rgb[1] = value;
		Color.#RGBtoHSL(this.#rgb, this.#hsl);
	}
	/**
	 * Gets the blue color component.
	 */
	get blue(): number {
		return this.#rgb[2];
	}
	/**
	 * Sets the blue color component.
	 */
	set blue(value: number) {
		if (!Number.isFinite(value)) return;
		this.#rgb[2] = value;
		Color.#RGBtoHSL(this.#rgb, this.#hsl);
	}
	#hsl: Uint16Array = new Uint16Array([0, 0, 0]);
	/**
	 * Gets the hue color component.
	 */
	get hue(): number {
		return this.#hsl[0];
	}
	/**
	 * Sets the hue color component.
	 */
	set hue(value: number) {
		if (!Number.isFinite(value)) return;
		this.#hsl[0] = value.mod(360);
		Color.#HSLtoRGB(this.#hsl, this.#rgb);
	}
	/**
	 * Gets the saturation color component.
	 */
	get saturation(): number {
		return this.#hsl[1];
	}
	/**
	 * Sets the saturation color component.
	 */
	set saturation(value: number) {
		if (!Number.isFinite(value)) return;
		this.#hsl[1] = value.clamp(0, 100);
		Color.#HSLtoRGB(this.#hsl, this.#rgb);
	}
	/**
	 * Gets the lightness color component.
	 */
	get lightness(): number {
		return this.#hsl[2];
	}
	/**
	 * Sets the lightness color component.
	 */
	set lightness(value: number) {
		if (!Number.isFinite(value)) return;
		this.#hsl[2] = value.clamp(0, 100);
		Color.#HSLtoRGB(this.#hsl, this.#rgb);
	}
	#alpha: number = 1;
	/**
	 * Gets the alpha color component.
	 */
	get alpha(): number {
		return this.#alpha;
	}
	/**
	 * Sets the alpha color component.
	 */
	set alpha(value: number) {
		if (!Number.isFinite(value)) return;
		this.#alpha = value.clamp(0, 1);
	}
	//#endregion
	//#region Builders
	static #patternRGB: RegExp = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i;
	static #patternRGBA: RegExp = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\S+)\s*\)$/i;
	static #patternHSL: RegExp = /^hsl\(\s*(\d+)(?:deg)?\s*,\s*(\d+)(?:%)?\s*,\s*(\d+)(?:%)?\s*\)$/i;
	static #patternHSLA: RegExp = /^hsla\(\s*(\d+)(?:deg)?\s*,\s*(\d+)(?:%)?\s*,\s*(\d+)(?:%)?\s*,\s*(\S+)\s*\)$/i;
	static #patternHEX: RegExp = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
	static #patternHEXA: RegExp = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
	static #variations: ColorProperties[] = Object.values(ColorFormats).flatMap<ColorProperties>(format => [{ format, deep: false }, { format, deep: true }]);
	/**
	 * Creates a new black color.
	 */
	constructor();
	/**
	 * Copies values from another color.
	 * @param source The source color to copy from.
	 */
	constructor(source: Readonly<Color>);
	constructor(source?: Readonly<Color>) {
		if (!(source instanceof Color)) return;
		this.#rgb = Uint8ClampedArray.from(source.#rgb);
		this.#hsl = Uint16Array.from(source.#hsl);
		this.#alpha = source.#alpha;
	}
	/**
	 * Creates a color from RGB components.
	 * @throws {Error} If any component is not a finite number.
	 */
	static fromRGB(red: number, green: number, blue: number): Color;
	/**
	 * Creates a color from RGB components with alpha channel.
	 * @throws {Error} If any component is not a finite number.
	 */
	static fromRGB(red: number, green: number, blue: number, alpha: number): Color;
	static fromRGB(red: number, green: number, blue: number, alpha: number = 1): Color {
		if (!Number.isFinite(red)) throw new Error(`The red ${red} must be a finite number`);
		if (!Number.isFinite(green)) throw new Error(`The green ${green} must be a finite number`);
		if (!Number.isFinite(blue)) throw new Error(`The blue ${blue} must be a finite number`);
		if (!Number.isFinite(alpha)) throw new Error(`The alpha ${alpha} must be a finite number`);
		const color = new Color();
		color.#rgb[0] = red;
		color.#rgb[1] = green;
		color.#rgb[2] = blue;
		color.#alpha = alpha.clamp(0, 1);
		Color.#RGBtoHSL(color.#rgb, color.#hsl);
		return color;
	}
	/**
	 * Creates a color from HSL components.
	 * @param hue The hue component.
	 * @param saturation The saturation component.
	 * @param lightness The lightness component.
	 * @returns A new color instance.
	 * @throws {Error} If any component is not a finite number.
	 */
	static fromHSL(hue: number, saturation: number, lightness: number): Color;
	/**
	 * Creates a color from HSL components with alpha channel.
	 * @param hue The hue component.
	 * @param saturation The saturation component.
	 * @param lightness The lightness component.
	 * @param alpha The alpha channel value.
	 * @returns A new color instance.
	 * @throws {Error} If any component is not a finite number.
	 */
	static fromHSL(hue: number, saturation: number, lightness: number, alpha: number): Color;
	static fromHSL(hue: number, saturation: number, lightness: number, alpha: number = 1): Color {
		if (!Number.isFinite(hue)) throw new Error(`The hue ${hue} must be a finite number`);
		if (!Number.isFinite(saturation)) throw new Error(`The saturation ${saturation} must be a finite number`);
		if (!Number.isFinite(lightness)) throw new Error(`The lightness ${lightness} must be a finite number`);
		if (!Number.isFinite(alpha)) throw new Error(`The alpha ${alpha} must be a finite number`);
		const color = new Color();
		hue %= 360;
		if (hue < 0) hue += 360;
		color.#hsl[0] = hue;
		color.#hsl[1] = saturation.clamp(0, 100);
		color.#hsl[2] = lightness.clamp(0, 100);
		color.#alpha = alpha.clamp(0, 1);
		Color.#HSLtoRGB(color.#hsl, color.#rgb);
		return color;
	}
	static #parse(string: string, deep: boolean, format: ColorFormats): Color {
		switch (format) {
		case ColorFormats.rgb: {
			const regex = (deep ? Color.#patternRGBA : Color.#patternRGB);
			const match = regex.exec(string.trim());
			if (match === null) throw new SyntaxError(`Invalid ${format} color '${string}' syntax`);
			const [, red, green, blue, alpha] = match.map(part => Number(part));
			return Color.fromRGB(red, green, blue, deep ? alpha : 1);
		};
		case ColorFormats.hsl: {
			const regex = (deep ? Color.#patternHSLA : Color.#patternHSL);
			const match = regex.exec(string.trim());
			if (match === null) throw new SyntaxError(`Invalid ${format} color '${string}' syntax`);
			const [, hue, saturation, lightness, alpha] = match.map(part => Number(part));
			return Color.fromHSL(hue, saturation, lightness, deep ? alpha : 1);
		};
		case ColorFormats.hex: {
			const regex = (deep ? Color.#patternHEXA : Color.#patternHEX);
			const match = regex.exec(string.trim());
			if (match === null) throw new SyntaxError(`Invalid ${format} color '${string}' syntax`);
			const [, red, green, blue, alpha] = match.map(part => Number.parseInt(part, 16));
			return Color.fromRGB(red, green, blue, deep ? (alpha / 255) : 1);
		};
		default: throw new Error(`Invalid '${format}' format for color`);
		}
	}
	/**
	 * Attempts to create a color from a string using all color variations.
	 * @param string The string to parse.
	 * @returns The parsed color or null if parsing fails.
	 */
	static tryParse(string: string): Color | null;
	/**
	 * Attempts to create a color from a string using the specified variations.
	 * @param string The string to parse.
	 * @param options The options for variations.
	 * @returns The parsed color or null if parsing fails.
	 */
	static tryParse(string: string, options: Partial<ColorProperties>): Color | null;
	static tryParse(string: string, options: Partial<ColorProperties> = {}): Color | null {
		let variations = Color.#variations;
		for (const key in options) {
			const value = Reflect.get(options, key);
			if (value === undefined) continue;
			variations = variations.filter(properties => Reflect.get(properties, key) === value);
		}
		for (const { format, deep } of variations) {
			try {
				return Color.#parse(string, deep, format);
			} catch {
				continue;
			}
		}
		return null;
	}
	/**
	 * Parses a color from a string using all color variations.
	 * @param string The string to parse.
	 * @returns The parsed color.
	 * @throws {SyntaxError} If parsing fails for all color variations.
	 */
	static parse(string: string): Color;
	/**
	 * Parses a color from a string using the specified variations.
	 * @param string The string to parse.
	 * @param options The options for variations.
	 * @returns The parsed color.
	 * @throws {SyntaxError} If parsing fails for the specified variations.
	 */
	static parse(string: string, options: Partial<ColorProperties>): Color;
	static parse(string: string, options: Partial<ColorProperties> = {}): Color {
		const color = Color.tryParse(string, options);
		if (color === null) throw new SyntaxError(`Unable to parse '${string}' of any selected variation`);
		return color;
	}
	//#endregion
	//#region Converters
	static #toChannel(offset: number, hue: number, saturation: number, lightness: number): number {
		const sector = (offset + hue) % 12;
		return lightness - (saturation * min(lightness, 1 - lightness)) * min(sector - 3, 9 - sector).clamp(-1, 1);
	}
	/**
	 * @param hsl [0 - 360], [0 - 100], [0 - 100]
	 * @param rgb [0 - 255], [0 - 255], [0 - 255]
	 */
	static #HSLtoRGB(hsl: Readonly<Uint16Array>, rgb: Uint8ClampedArray): void {
		const hue = hsl[0] / 30;
		const saturation = hsl[1] / 100;
		const lightness = hsl[2] / 100;
		rgb[0] = Color.#toChannel(0, hue, saturation, lightness) * 255;
		rgb[1] = Color.#toChannel(8, hue, saturation, lightness) * 255;
		rgb[2] = Color.#toChannel(4, hue, saturation, lightness) * 255;
	}
	static #toHue(maximum: number, red: number, green: number, blue: number, difference: number): number {
		switch (maximum) {
		case red: return (green - blue) / difference + 0;
		case green: return (blue - red) / difference + 2;
		case blue: return (red - green) / difference + 4;
		default: throw new Error(`Invalid '${maximum}' maximum for colors`);
		}
	}
	/**
	 * @param rgb [0 - 255], [0 - 255], [0 - 255]
	 * @param hsl [0 - 360], [0 - 100], [0 - 100]
	 */
	static #RGBtoHSL(rgb: Readonly<Uint8ClampedArray>, hsl: Uint16Array): void {
		const red = rgb[0] / 255;
		const green = rgb[1] / 255;
		const blue = rgb[2] / 255;
		const minimum = min(red, green, blue);
		const maximum = max(red, green, blue);
		const difference = maximum - minimum;
		let hue = Color.#toHue(maximum, red, green, blue, difference);
		hue = difference && hue;
		if (hue < 0) hue += 6;
		hsl[0] = hue * 60;
		const median = 1 - abs(maximum + minimum - 1);
		hsl[1] = (median && (difference / median)) * 100;
		hsl[2] = (maximum + minimum) / 2 * 100;
	}
	static #toHEXString(byte: number): string {
		return byte.toString(16).padStart(2, "0");
	}
	/**
	 * Returns a string representation of the color in RGB format by default.
	 * @returns The string representation of the color.
	 */
	toString(): string;
	/**
	 * Returns a string representation of the color using the specified options.
	 * @param options The options to define the output format and alpha channel inclusion.
	 * @returns The string representation of the color.
	 * @throws {Error} If the specified color format is invalid.
	 */
	toString(options: Partial<ColorProperties>): string;
	toString(options: Partial<ColorProperties> = {}): string {
		let { format, deep } = options;
		format ??= ColorFormats.rgb;
		deep ??= true;
		switch (format) {
		case ColorFormats.rgb: return `rgb${deep ? "a" : String.empty}(${this.red}, ${this.green}, ${this.blue}${deep ? `, ${this.alpha}` : String.empty})`;
		case ColorFormats.hsl: return `hsl${deep ? "a" : String.empty}(${this.hue}deg, ${this.saturation}%, ${this.lightness}%${deep ? `, ${this.alpha}` : String.empty})`;
		case ColorFormats.hex: return `#${Color.#toHEXString(this.red)}${Color.#toHEXString(this.green)}${Color.#toHEXString(this.blue)}${deep ? Color.#toHEXString(trunc(this.alpha * 255)) : String.empty}`;
		default: throw new Error(`Invalid '${format}' format for color`);
		}
	}
	//#endregion
	//#region Presets
	/**
	 * Transparent color preset.
	 */
	static get newTransparent(): Color { return Color.fromRGB(0, 0, 0, 0); };
	/**
	 * Maroon color preset.
	 */
	static get newMaroon(): Color { return Color.fromRGB(128, 0, 0); };
	/**
	 * Red color preset.
	 */
	static get newRed(): Color { return Color.fromRGB(255, 0, 0); };
	/**
	 * Orange color preset.
	 */
	static get newOrange(): Color { return Color.fromRGB(255, 165, 0); };
	/**
	 * Yellow color preset.
	 */
	static get newYellow(): Color { return Color.fromRGB(255, 255, 0); };
	/**
	 * Olive color preset.
	 */
	static get newOlive(): Color { return Color.fromRGB(128, 128, 0); };
	/**
	 * Green color preset.
	 */
	static get newGreen(): Color { return Color.fromRGB(0, 128, 0); };
	/**
	 * Purple color preset.
	 */
	static get newPurple(): Color { return Color.fromRGB(128, 0, 128); };
	/**
	 * Fuchsia color preset.
	 */
	static get newFuchsia(): Color { return Color.fromRGB(255, 0, 255); };
	/**
	 * Lime color preset.
	 */
	static get newLime(): Color { return Color.fromRGB(0, 255, 0); };
	/**
	 * Teal color preset.
	 */
	static get newTeal(): Color { return Color.fromRGB(0, 128, 128); };
	/**
	 * Aqua color preset.
	 */
	static get newAqua(): Color { return Color.fromRGB(0, 255, 255); };
	/**
	 * Blue color preset.
	 */
	static get newBlue(): Color { return Color.fromRGB(0, 0, 255); };
	/**
	 * Navy color preset.
	 */
	static get newNavy(): Color { return Color.fromRGB(0, 0, 128); };
	/**
	 * Black color preset.
	 */
	static get newBlack(): Color { return new Color(); };
	/**
	 * Gray color preset.
	 */
	static get newGray(): Color { return Color.fromRGB(128, 128, 128); };
	/**
	 * Silver color preset.
	 */
	static get newSilver(): Color { return Color.fromRGB(192, 192, 192); };
	/**
	 * White color preset.
	 */
	static get newWhite(): Color { return Color.fromRGB(255, 255, 255); };
	//#endregion
	//#region Modifiers
	/**
	 * Creates a new color by mixing two colors evenly.
	 * @param first The first color.
	 * @param second The second color.
	 * @returns The new mixed color.
	 */
	static mix(first: Readonly<Color>, second: Readonly<Color>): Color;
	/**
	 * Creates a new color by mixing two colors by the given ratio.
	 * @param first The first color.
	 * @param second The second color.
	 * @param ratio Ratio between the first and second color [0 - 1].
	 * @returns The new mixed color.
	 * @throws {Error} If `ratio` is not a finite number.
	 */

	static mix(first: Readonly<Color>, second: Readonly<Color>, ratio: number): Color;
	static mix(first: Readonly<Color>, second: Readonly<Color>, ratio: number = 0.5): Color {
		if (!Number.isFinite(ratio)) throw new Error(`The ratio ${ratio} must be a finite number`);
		ratio = ratio.clamp(0, 1);
		const red = first.red + (second.red - first.red) * ratio;
		const green = first.green + (second.green - first.green) * ratio;
		const blue = first.blue + (second.blue - first.blue) * ratio;
		const alpha = first.alpha + (second.alpha - first.alpha) * ratio;
		return Color.fromRGB(red, green, blue, alpha);
	}
	/**
	 * Converts the current color to grayscale with full scale.
	 * @returns The modified current color.
	 */
	grayscale(): Color;
	/**
	 * Converts the current color to grayscale by the given scale.
	 * @param scale Grayscale scale [0 - 1].
	 * @returns The modified current color.
	 * @throws {Error} If `scale` is not a finite number.
	 */
	grayscale(scale: number): Color;
	grayscale(scale: number = 1): Color {
		if (!Number.isFinite(scale)) throw new Error(`The scale ${scale} must be a finite number`);
		scale = scale.clamp(0, 1);
		const { red, green, blue } = this;
		const achromatic = (red + green + blue) / 3;
		this.#rgb[0] = red + (achromatic - red) * scale;
		this.#rgb[1] = green + (achromatic - green) * scale;
		this.#rgb[2] = blue + (achromatic - blue) * scale;
		Color.#RGBtoHSL(this.#rgb, this.#hsl);
		return this;
	}
	/**
	 * Emphasizes the red channel fully on the current color.
	 * @returns The modified current color.
	 */
	redEmphasis(): Color;
	/**
	 * Emphasizes the red channel by the given scale on the current color.
	 * @param scale Emphasis scale [0 - 1].
	 * @returns The modified current color.
	 * @throws {Error} If `scale` is not a finite number.
	 */
	redEmphasis(scale: number): Color;
	redEmphasis(scale: number = 1): Color {
		if (!Number.isFinite(scale)) throw new Error(`The scale ${scale} must be a finite number`);
		scale = scale.clamp(0, 1);
		const { green, blue } = this;
		const average = (green + blue) / 2;
		this.#rgb[1] = green + (average - green) * scale;
		this.#rgb[2] = blue + (average - blue) * scale;
		Color.#RGBtoHSL(this.#rgb, this.#hsl);
		return this;
	}
	/**
	 * Emphasizes the green channel fully on the current color.
	 * @returns The modified current color.
	 */
	greenEmphasis(): Color;
	/**
	 * Emphasizes the green channel by the given scale on the current color.
	 * @param scale Emphasis scale [0 - 1].
	 * @returns The modified current color.
	 * @throws {Error} If `scale` is not a finite number.
	 */
	greenEmphasis(scale: number): Color;
	greenEmphasis(scale: number = 1): Color {
		if (!Number.isFinite(scale)) throw new Error(`The scale ${scale} must be a finite number`);
		scale = scale.clamp(0, 1);
		const { red, blue } = this;
		const average = (red + blue) / 2;
		this.#rgb[0] = red + (average - red) * scale;
		this.#rgb[2] = blue + (average - blue) * scale;
		Color.#RGBtoHSL(this.#rgb, this.#hsl);
		return this;
	}
	/**
	 * Emphasizes the blue channel fully on the current color.
	 * @returns The modified current color.
	 */
	blueEmphasis(): Color;
	/**
	 * Emphasizes the blue channel by the given scale on the current color.
	 * @param scale Emphasis scale [0 - 1].
	 * @returns The modified current color.
	 * @throws {Error} If `scale` is not a finite number.
	 */
	blueEmphasis(scale: number): Color;
	blueEmphasis(scale: number = 1): Color {
		if (!Number.isFinite(scale)) throw new Error(`The scale ${scale} must be a finite number`);
		scale = scale.clamp(0, 1);
		const { red, green } = this;
		const average = (red + green) / 2;
		this.#rgb[0] = red + (average - red) * scale;
		this.#rgb[1] = green + (average - green) * scale;
		Color.#RGBtoHSL(this.#rgb, this.#hsl);
		return this;
	}
	/**
	 * Inverts the current color fully.
	 * @returns The modified current color.
	 */
	invert(): Color;
	/**
	 * Inverts the current color by the given scale.
	 * @param scale Inversion scale [0 - 1].
	 * @returns The modified current color.
	 * @throws {Error} If `scale` is not a finite number.
	 */
	invert(scale: number): Color;
	invert(scale: number = 1): Color {
		if (!Number.isFinite(scale)) throw new Error(`The scale ${scale} must be a finite number`);
		scale = scale.clamp(0, 1);
		const { red, green, blue } = this;
		this.#rgb[0] = red + ((255 - red) - red) * scale;
		this.#rgb[1] = green + ((255 - green) - green) * scale;
		this.#rgb[2] = blue + ((255 - blue) - blue) * scale;
		Color.#RGBtoHSL(this.#rgb, this.#hsl);
		return this;
	}
	/**
	 * Applies full sepia filter on the current color.
	 * @returns The modified current color.
	 */
	sepia(): Color;
	/**
	 * Applies sepia filter by the given scale on the current color.
	 * @param scale Sepia scale [0 - 1].
	 * @returns The modified current color.
	 * @throws {Error} If `scale` is not a finite number.
	 */
	sepia(scale: number): Color;
	sepia(scale: number = 1): Color {
		if (!Number.isFinite(scale)) throw new Error(`The scale ${scale} must be a finite number`);
		scale = scale.clamp(0, 1);
		const { red, green, blue } = this;
		const redness = (red * 0.393) + (green * 0.769) + (blue * 0.189);
		const greenness = (red * 0.349) + (green * 0.686) + (blue * 0.168);
		const blueness = (red * 0.272) + (green * 0.534) + (blue * 0.131);
		this.#rgb[0] = red + (redness - red) * scale;
		this.#rgb[1] = green + (greenness - green) * scale;
		this.#rgb[2] = blue + (blueness - blue) * scale;
		Color.#RGBtoHSL(this.#rgb, this.#hsl);
		return this;
	}
	/**
	 * Rotates the hue of the current color by the given angle in degrees.
	 * @param angle Rotation angle in degrees.
	 * @returns The modified current color.
	 * @throws {Error} If `angle` is not a finite number.
	 */
	rotate(angle: number): Color {
		if (!Number.isFinite(angle)) throw new Error(`The angle ${angle} must be a finite number`);
		this.hue += angle;
		return this;
	}
	/**
	 * Sets the saturation of the current color by scale.
	 * @param scale Saturation scale [0 - 1].
	 * @returns The modified current color.
	 * @throws {Error} If `scale` is not a finite number.
	 */
	saturate(scale: number): Color {
		if (!Number.isFinite(scale)) throw new Error(`The scale ${scale} must be a finite number`);
		this.saturation = 100 * scale;
		return this;
	}
	/**
	 * Sets the lightness of the current color by scale.
	 * @param scale Lightness scale [0 - 1].
	 * @returns The modified current color.
	 * @throws {Error} If `scale` is not a finite number.
	 */
	illuminate(scale: number): Color {
		if (!Number.isFinite(scale)) throw new Error(`The scale ${scale} must be a finite number`);
		this.lightness = 100 * scale;
		return this;
	}
	/**
	 * Sets the alpha of the current color.
	 * @param scale Alpha value [0 - 1].
	 * @returns The modified current color.
	 * @throws {Error} If `scale` is not a finite number.
	 */
	pass(scale: number): Color {
		if (!Number.isFinite(scale)) throw new Error(`The scale ${scale} must be a finite number`);
		this.alpha = scale;
		return this;
	}
	//#endregion
}
//#endregion
