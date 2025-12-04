"use strict";

import { type PrimitivesHintMap } from "./primitives.js";

const { trunc, abs, sign } = Math;

//#region Timespan
export interface TimespanProperties {
	/**
	 * Whether to include all components (days, milliseconds) even if zero.
	 */
	full: boolean;
}

/**
 * Represents a time interval with precision up to milliseconds.
 * Provides utilities for creating, parsing, converting, and modifying time intervals.
 */
export class Timespan {
	//#region Properties
	#value: number = 0;
	#dm: Int32Array = new Int32Array(2);
	#hms: Int8Array = new Int8Array(3);
	/**
	 * Gets the days component of the timespan.
	 */
	get days(): number {
		return this.#dm[0];
	}
	/**
	 * Sets the days component of the timespan.
	 */
	set days(value: number) {
		if (!Number.isFinite(value)) return;
		this.#value += Timespan.#toValue(value - this.#dm[0], 0, 0, 0, 0);
		Timespan.#toComponents(this.#value, this.#dm, this.#hms);
	}
	/**
	 * Gets the hours component of the timespan.
	 */
	get hours(): number {
		return this.#hms[0];
	}
	/**
	 * Sets the hours component of the timespan.
	 */
	set hours(value: number) {
		if (!Number.isFinite(value)) return;
		this.#value += Timespan.#toValue(0, value - this.#hms[0], 0, 0, 0);
		Timespan.#toComponents(this.#value, this.#dm, this.#hms);
	}
	/**
	 * Gets the minutes component of the timespan.
	 */
	get minutes(): number {
		return this.#hms[1];
	}
	/**
	 * Sets the minutes component of the timespan.
	 */
	set minutes(value: number) {
		if (!Number.isFinite(value)) return;
		this.#value += Timespan.#toValue(0, 0, value - this.#hms[1], 0, 0);
		Timespan.#toComponents(this.#value, this.#dm, this.#hms);
	}
	/**
	 * Gets the seconds component of the timespan.
	 */
	get seconds(): number {
		return this.#hms[2];
	}
	/**
	 * Sets the seconds component of the timespan.
	 */
	set seconds(value: number) {
		if (!Number.isFinite(value)) return;
		this.#value += Timespan.#toValue(0, 0, 0, value - this.#hms[2], 0);
		Timespan.#toComponents(this.#value, this.#dm, this.#hms);
	}
	/**
	 * Gets the milliseconds component of the timespan.
	 */
	get milliseconds(): number {
		return this.#dm[1];
	}
	/**
	 * Sets the milliseconds component of the timespan.
	 */
	set milliseconds(value: number) {
		if (!Number.isFinite(value)) return;
		this.#value += Timespan.#toValue(0, 0, 0, 0, value - this.#dm[1]);
		Timespan.#toComponents(this.#value, this.#dm, this.#hms);
	}
	//#endregion
	//#region Builders
	static #patternTimespan: RegExp = /^(-)?(?:(\d+)\.)?(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?$/i;
	/**
	 * Creates a new zero timespan instance.
	 */
	constructor();
	/**
	 * Clones an existing timespan instance.
	 */
	constructor(source: Readonly<Timespan>);
	constructor(source?: Readonly<Timespan>) {
		if (!(source instanceof Timespan)) return;
		this.#value = source.#value;
		this.#dm = Int32Array.from(source.#dm);
		this.#hms = Int8Array.from(source.#hms);
	}
	/** Creates a Timespan from a total millisecond value. */
	static fromValue(value: number): Timespan {
		if (!Number.isFinite(value)) throw new Error(`The value ${value} must be a finite number`);
		const timespan = new Timespan();
		timespan.#value = trunc(value);
		Timespan.#toComponents(timespan.#value, timespan.#dm, timespan.#hms);
		return timespan;
	}
	static #fromComponents(days: number, hours: number, minutes: number, seconds: number, milliseconds: number): Timespan {
		if (!Number.isFinite(days)) throw new Error(`The days ${days} must be a finite number`);
		if (!Number.isFinite(hours)) throw new Error(`The hours ${hours} must be a finite number`);
		if (!Number.isFinite(minutes)) throw new Error(`The minutes ${minutes} must be a finite number`);
		if (!Number.isFinite(seconds)) throw new Error(`The seconds ${seconds} must be a finite number`);
		if (!Number.isFinite(milliseconds)) throw new Error(`The milliseconds ${milliseconds} must be a finite number`);
		const timespan = new Timespan();
		timespan.#value = Timespan.#toValue(days, hours, minutes, seconds, milliseconds);
		Timespan.#toComponents(timespan.#value, timespan.#dm, timespan.#hms);
		return timespan;
	}
	/**
	 * Creates a timespan from hours, minutes, and seconds.
	 */
	static fromComponents(hours: number, minutes: number, seconds: number): Timespan;
	/**
	 * Creates a timespan from days, hours, minutes, and seconds.
	 */
	static fromComponents(days: number, hours: number, minutes: number, seconds: number): Timespan;
	/**
	 * Creates a timespan from days, hours, minutes, seconds, and milliseconds.
	 */
	static fromComponents(days: number, hours: number, minutes: number, seconds: number, milliseconds: number): Timespan;
	static fromComponents(arg1: number, arg2: number, arg3: number, arg4?: number, arg5?: number): Timespan {
		if (arg4 === undefined) return Timespan.#fromComponents(0, arg1, arg2, arg3, 0);
		if (arg5 === undefined) return Timespan.#fromComponents(arg1, arg2, arg3, arg4, 0);
		return Timespan.#fromComponents(arg1, arg2, arg3, arg4, arg5);
	}
	/**
	 * Attempts to parse a string into a timespan.
	 * @returns The parsed timespan, or null if parsing failed.
	 */
	static tryParse(string: string): Timespan | null {
		const regex = Timespan.#patternTimespan;
		const match = regex.exec(string.trim());
		if (match === null) return null;
		const sign: number = (match[1] === undefined ? 1 : -1);
		const [, , days, hours, minutes, seconds, milliseconds] = match.map(part => Number(part ?? 0));
		return Timespan.fromComponents(sign * days, sign * hours, sign * minutes, sign * seconds, sign * milliseconds);
	}
	/**
	 * Parses a string into a timespan.
	 * @throws {SyntaxError} If the string cannot be parsed.
	 */
	static parse(string: string): Timespan {
		const color = Timespan.tryParse(string);
		if (color === null) throw new SyntaxError(`Unable to parse '${string}' as timespan`);
		return color;
	}
	//#endregion
	//#region Converters
	static #toValue(days: number, hours: number, minutes: number, seconds: number, milliseconds: number): number {
		let value: number = 0;
		value = (value + days) * 24;
		value = (value + hours) * 60;
		value = (value + minutes) * 60;
		value = (value + seconds) * 1000;
		value = (value + milliseconds);
		return trunc(value);
	}
	static #toComponents(value: number, dm: Int32Array, hms: Int8Array): void {
		const multiplier: number = sign(value).insteadZero(1);
		value = abs(value);
		dm[1] = (value % 1000) * multiplier;
		value = Math.trunc(value / 1000);
		hms[2] = (value % 60) * multiplier;
		value = Math.trunc(value / 60);
		hms[1] = (value % 60) * multiplier;
		value = Math.trunc(value / 60);
		hms[0] = (value % 24) * multiplier;
		value = Math.trunc(value / 24);
		dm[0] = (value) * multiplier;
	}
	/**
	 * Returns the total millisecond value of the timespan.
	 */
	valueOf(): number {
		return this.#value;
	}
	/**
	 * Returns the timespan as a string.
	 */
	toString(): string;
	/**
	 * Returns the timespan as a string with formatting options.
	 */
	toString(options: Partial<TimespanProperties>): string;
	toString(options: Partial<TimespanProperties> = {}): string {
		let { full } = options;
		full ??= true;
		const [days, milliseconds] = this.#dm;
		const [hours, minutes, seconds] = this.#hms;
		let string = String.empty;
		if (this.#value < 0) string += "-";
		if (days !== 0 || full) string += `${days.toString()}.`;
		string += `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
		if (milliseconds !== 0 || full) string += `.${milliseconds.toString().padStart(3, "0")}`;
		return string;
	}
	[Symbol.toPrimitive]<K extends keyof PrimitivesHintMap>(hint: K): PrimitivesHintMap[K];
	[Symbol.toPrimitive]<K extends keyof PrimitivesHintMap>(hint: K): PrimitivesHintMap[keyof PrimitivesHintMap] {
		switch (hint) {
		case "number": return this.valueOf();
		case "boolean": return Boolean(this.#value);
		case "string": return this.toString();
		default: throw new Error(`Invalid '${hint}' hint for primitive`);
		}
	}
	//#endregion
	//#region Presets
	static #MIN_VALUE: Readonly<Timespan> = Object.freeze(Timespan.fromValue(Number.MIN_SAFE_INTEGER));
	/**
	 * The minimum representable timespan.
	 */
	static get MIN_VALUE(): Readonly<Timespan> {
		return this.#MIN_VALUE;
	}
	static #MAX_VALUE: Readonly<Timespan> = Object.freeze(Timespan.fromValue(Number.MAX_SAFE_INTEGER));
	/**
	 * The maximum representable timespan.
	 */
	static get MAX_VALUE(): Readonly<Timespan> {
		return this.#MAX_VALUE;
	}
	/**
	 * Creates a new zero timespan.
	 */
	static get newZero(): Timespan { return new Timespan(); };
	/**
	 * Creates a new timespan representing one millisecond.
	 */
	static get newMillisecond(): Timespan { return Timespan.fromComponents(0, 0, 0, 0, 1); };
	/**
	 * Creates a new timespan representing one second.
	 */
	static get newSecond(): Timespan { return Timespan.fromComponents(0, 0, 0, 1, 0); };
	/**
	 * Creates a new timespan representing one minute.
	 */
	static get newMinute(): Timespan { return Timespan.fromComponents(0, 0, 1, 0, 0); };
	/**
	 * Creates a new timespan representing one hour.
	 */
	static get newHour(): Timespan { return Timespan.fromComponents(0, 1, 0, 0, 0); };
	/**
	 * Creates a new timespan representing one day.
	 */
	static get newDay(): Timespan { return Timespan.fromComponents(1, 0, 0, 0, 0); };
	//#endregion
	//#region Modifiers
	/**
	 * Returns the absolute duration of this timespan.
	 */
	duration(): Timespan {
		return Timespan.fromValue(abs(this.#value));
	}
	/**
	 * Returns a new timespan with inverted sign.
	 */
	invert(): Timespan {
		return Timespan.fromValue(-this.#value);
	}
	//#endregion
}
//#endregion
