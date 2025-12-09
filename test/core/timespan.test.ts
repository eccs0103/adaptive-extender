import { Timespan } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

describe("Timespan", () => {
	describe("constructor", () => {
		it("should create zero timespan by default", () => {
			const t = new Timespan();
			expect(t.valueOf()).toBe(0);
			expect(t.days).toBe(0);
			expect(t.hours).toBe(0);
			expect(t.minutes).toBe(0);
			expect(t.seconds).toBe(0);
			expect(t.milliseconds).toBe(0);
		});

		it("should copy another Timespan", () => {
			const t1 = Timespan.fromComponents(1, 2, 3, 4, 5);
			const t2 = new Timespan(t1);
			expect(t2.valueOf()).toBe(t1.valueOf());
			expect(t2.days).toBe(t1.days);
			expect(t2.hours).toBe(t1.hours);
			expect(t2.minutes).toBe(t1.minutes);
			expect(t2.seconds).toBe(t1.seconds);
			expect(t2.milliseconds).toBe(t1.milliseconds);
		});
	});

	describe("fromValue", () => {
		it("should create from finite value", () => {
			const t = Timespan.fromValue(90061005); // 1d 1h 1m 1s 5ms
			expect(t.days).toBe(1);
			expect(t.hours).toBe(1);
			expect(t.minutes).toBe(1);
			expect(t.seconds).toBe(1);
			expect(t.milliseconds).toBe(5);
		});

		it("should throw on non-finite value", () => {
			expect(() => Timespan.fromValue(Infinity)).toThrow();
			expect(() => Timespan.fromValue(NaN)).toThrow();
		});
	});

	describe("fromComponents", () => {
		it("should create from h:m:s", () => {
			const t = Timespan.fromComponents(1, 2, 3);
			expect(t.days).toBe(0);
			expect(t.hours).toBe(1);
			expect(t.minutes).toBe(2);
			expect(t.seconds).toBe(3);
			expect(t.milliseconds).toBe(0);
		});

		it("should create from d:h:m:s", () => {
			const t = Timespan.fromComponents(2, 3, 4, 5);
			expect(t.days).toBe(2);
			expect(t.hours).toBe(3);
			expect(t.minutes).toBe(4);
			expect(t.seconds).toBe(5);
			expect(t.milliseconds).toBe(0);
		});

		it("should create from d:h:m:s:ms", () => {
			const t = Timespan.fromComponents(-1, -2, -3, -4, -5);
			expect(t.days).toBe(-1);
			expect(t.hours).toBe(-2);
			expect(t.minutes).toBe(-3);
			expect(t.seconds).toBe(-4);
			expect(t.milliseconds).toBe(-5);
		});

		it("should throw on non-finite arguments", () => {
			expect(() => Timespan.fromComponents(NaN, 1, 1, 1, 1)).toThrow();
			expect(() => Timespan.fromComponents(1, Infinity, 1, 1, 1)).toThrow();
			expect(() => Timespan.fromComponents(1, 1, NaN, 1, 1)).toThrow();
			expect(() => Timespan.fromComponents(1, 1, 1, NaN, 1)).toThrow();
			expect(() => Timespan.fromComponents(1, 1, 1, 1, NaN)).toThrow();
		});
	});

	describe("tryParse and parse", () => {
		it("should parse valid timespan strings", () => {
			const t1 = Timespan.tryParse("1.02:03:04.005");
			expect(t1).toBeInstanceOf(Timespan);
			expect(t1!.days).toBe(1);
			expect(t1!.hours).toBe(2);
			expect(t1!.minutes).toBe(3);
			expect(t1!.seconds).toBe(4);
			expect(t1!.milliseconds).toBe(5);

			const t2 = Timespan.tryParse("-1.02:03:04.005");
			expect(t2).toBeInstanceOf(Timespan);
			expect(t2!.days).toBe(-1);
			expect(t2!.hours).toBe(-2);
			expect(t2!.minutes).toBe(-3);
			expect(t2!.seconds).toBe(-4);
			expect(t2!.milliseconds).toBe(-5);

			const t3 = Timespan.tryParse("02:03:04");
			expect(t3).toBeInstanceOf(Timespan);
			expect(t3!.days).toBe(0);
			expect(t3!.hours).toBe(2);
			expect(t3!.minutes).toBe(3);
			expect(t3!.seconds).toBe(4);
			expect(t3!.milliseconds).toBe(0);

			const t4 = Timespan.tryParse("02:03:04.123");
			expect(t4).toBeInstanceOf(Timespan);
			expect(t4!.milliseconds).toBe(123);
		});

		it("should return null for invalid strings", () => {
			expect(Timespan.tryParse("not a timespan")).toBeNull();
			expect(Timespan.tryParse("")).toBeNull();
			expect(Timespan.tryParse("1:2")).toBeNull();
		});

		it("should throw on invalid parse", () => {
			expect(() => Timespan.parse("not a timespan")).toThrow(SyntaxError);
		});
	});

	describe("valueOf and toString", () => {
		it("should return correct numeric value", () => {
			const t = Timespan.fromComponents(1, 2, 3, 4, 5);
			const expected = (((((1 * 24 + 2) * 60 + 3) * 60 + 4) * 1000) + 5);
			expect(t.valueOf()).toBe(expected);
		});

		it("should return correct string representation (full)", () => {
			const t = Timespan.fromComponents(1, 2, 3, 4, 5);
			expect(t.toString()).toBe("1.02:03:04.005");
		});

		it("should return correct string representation (compact)", () => {
			const t = Timespan.fromComponents(0, 2, 3, 4, 0);
			expect(t.toString({ full: false })).toBe("02:03:04");
		});

		it("should show negative sign for negative value", () => {
			const t = Timespan.fromValue(-90061005);
			expect(t.toString().startsWith("-")).toBe(true);
		});
	});

	describe("Symbol.toPrimitive", () => {
		it("should return value for 'number' hint", () => {
			const t = Timespan.fromComponents(1, 0, 0, 0, 0);
			expect((t as any)[Symbol.toPrimitive]("number")).toBe(t.valueOf());
		});

		it("should return string for 'string' hint", () => {
			const t = Timespan.fromComponents(1, 0, 0, 0, 0);
			expect((t as any)[Symbol.toPrimitive]("string")).toBe(t.toString());
		});

		it("should return boolean for 'boolean' hint", () => {
			const t = Timespan.fromComponents(1, 0, 0, 0, 0);
			expect((t as any)[Symbol.toPrimitive]("boolean")).toBe(true);
			const t0 = Timespan.fromComponents(0, 0, 0, 0, 0);
			expect((t0 as any)[Symbol.toPrimitive]("boolean")).toBe(false);
		});

		it("should throw for invalid hint", () => {
			const t = Timespan.fromComponents(1, 0, 0, 0, 0);
			expect(() => (t as any)[Symbol.toPrimitive]("invalid")).toThrow();
		});
	});

	describe("property getters/setters", () => {
		it("should set and get days", () => {
			const t = new Timespan();
			t.days = 5;
			expect(t.days).toBe(5);
		});

		it("should set and get hours", () => {
			const t = new Timespan();
			t.hours = 10;
			expect(t.hours).toBe(10);
		});

		it("should set and get minutes", () => {
			const t = new Timespan();
			t.minutes = 30;
			expect(t.minutes).toBe(30);
		});

		it("should set and get seconds", () => {
			const t = new Timespan();
			t.seconds = 45;
			expect(t.seconds).toBe(45);
		});

		it("should set and get milliseconds", () => {
			const t = new Timespan();
			t.milliseconds = 123;
			expect(t.milliseconds).toBe(123);
		});

		it("should ignore non-finite values", () => {
			const t = new Timespan();
			t.days = Infinity;
			expect(t.days).toBe(0);
			t.hours = NaN;
			expect(t.hours).toBe(0);
			t.minutes = undefined as any;
			expect(t.minutes).toBe(0);
		});
	});

	describe("presets", () => {
		it("MIN_VALUE and MAX_VALUE should be correct", () => {
			expect(Timespan.MIN_VALUE.valueOf()).toBe(Number.MIN_SAFE_INTEGER);
			expect(Timespan.MAX_VALUE.valueOf()).toBe(Number.MAX_SAFE_INTEGER);
		});

		it("newZero should be zero", () => {
			expect(Timespan.newZero.valueOf()).toBe(0);
		});

		it("newMillisecond should be 1 ms", () => {
			expect(Timespan.newMillisecond.valueOf()).toBe(1);
		});

		it("newSecond should be 1 s", () => {
			expect(Timespan.newSecond.valueOf()).toBe(1000);
		});

		it("newMinute should be 1 min", () => {
			expect(Timespan.newMinute.valueOf()).toBe(60000);
		});

		it("newHour should be 1 hour", () => {
			expect(Timespan.newHour.valueOf()).toBe(3600000);
		});

		it("newDay should be 1 day", () => {
			expect(Timespan.newDay.valueOf()).toBe(86400000);
		});
	});

	describe("modifiers", () => {
		it("duration should return absolute value", () => {
			const t = Timespan.fromValue(-12345);
			expect(t.duration().valueOf()).toBe(12345);
		});

		it("invert should return negative value", () => {
			const t = Timespan.fromValue(12345);
			expect(t.invert().valueOf()).toBe(-12345);
		});
	});
});
