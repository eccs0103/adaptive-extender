import { Timespan } from "adaptive-extender/core";
import { strict as assert } from "assert";

describe("Timespan", () => {
	describe("constructor", () => {
		it("should create zero timespan by default", () => {
			const t = new Timespan();
			assert.equal(t.valueOf(), 0);
			assert.equal(t.days, 0);
			assert.equal(t.hours, 0);
			assert.equal(t.minutes, 0);
			assert.equal(t.seconds, 0);
			assert.equal(t.milliseconds, 0);
		});

		it("should copy another Timespan", () => {
			const t1 = Timespan.fromComponents(1, 2, 3, 4, 5);
			const t2 = new Timespan(t1);
			assert.equal(t2.valueOf(), t1.valueOf());
			assert.equal(t2.days, t1.days);
			assert.equal(t2.hours, t1.hours);
			assert.equal(t2.minutes, t1.minutes);
			assert.equal(t2.seconds, t1.seconds);
			assert.equal(t2.milliseconds, t1.milliseconds);
		});
	});

	describe("fromValue", () => {
		it("should create from finite value", () => {
			const t = Timespan.fromValue(90061005); // 1d 1h 1m 1s 5ms
			assert.equal(t.days, 1);
			assert.equal(t.hours, 1);
			assert.equal(t.minutes, 1);
			assert.equal(t.seconds, 1);
			assert.equal(t.milliseconds, 5);
		});

		it("should throw on non-finite value", () => {
			assert.throws(() => Timespan.fromValue(Infinity));
			assert.throws(() => Timespan.fromValue(NaN));
		});
	});

	describe("fromComponents", () => {
		it("should create from h:m:s", () => {
			const t = Timespan.fromComponents(1, 2, 3);
			assert.equal(t.days, 0);
			assert.equal(t.hours, 1);
			assert.equal(t.minutes, 2);
			assert.equal(t.seconds, 3);
			assert.equal(t.milliseconds, 0);
		});

		it("should create from d:h:m:s", () => {
			const t = Timespan.fromComponents(2, 3, 4, 5);
			assert.equal(t.days, 2);
			assert.equal(t.hours, 3);
			assert.equal(t.minutes, 4);
			assert.equal(t.seconds, 5);
			assert.equal(t.milliseconds, 0);
		});

		it("should create from d:h:m:s:ms", () => {
			const t = Timespan.fromComponents(-1, -2, -3, -4, -5);
			assert.equal(t.days, -1);
			assert.equal(t.hours, -2);
			assert.equal(t.minutes, -3);
			assert.equal(t.seconds, -4);
			assert.equal(t.milliseconds, -5);
		});

		it("should throw on non-finite arguments", () => {
			assert.throws(() => Timespan.fromComponents(NaN, 1, 1, 1, 1));
			assert.throws(() => Timespan.fromComponents(1, Infinity, 1, 1, 1));
			assert.throws(() => Timespan.fromComponents(1, 1, NaN, 1, 1));
			assert.throws(() => Timespan.fromComponents(1, 1, 1, NaN, 1));
			assert.throws(() => Timespan.fromComponents(1, 1, 1, 1, NaN));
		});
	});

	describe("tryParse and parse", () => {
		it("should parse valid timespan strings", () => {
			const t1 = Timespan.tryParse("1.02:03:04.005");
			assert.ok(t1 instanceof Timespan);
			assert.equal(t1!.days, 1);
			assert.equal(t1!.hours, 2);
			assert.equal(t1!.minutes, 3);
			assert.equal(t1!.seconds, 4);
			assert.equal(t1!.milliseconds, 5);

			const t2 = Timespan.tryParse("-1.02:03:04.005");
			assert.ok(t2 instanceof Timespan);
			assert.equal(t2!.days, -1);
			assert.equal(t2!.hours, -2);
			assert.equal(t2!.minutes, -3);
			assert.equal(t2!.seconds, -4);
			assert.equal(t2!.milliseconds, -5);

			const t3 = Timespan.tryParse("02:03:04");
			assert.ok(t3 instanceof Timespan);
			assert.equal(t3!.days, 0);
			assert.equal(t3!.hours, 2);
			assert.equal(t3!.minutes, 3);
			assert.equal(t3!.seconds, 4);
			assert.equal(t3!.milliseconds, 0);

			const t4 = Timespan.tryParse("02:03:04.123");
			assert.ok(t4 instanceof Timespan);
			assert.equal(t4!.milliseconds, 123);
		});

		it("should return null for invalid strings", () => {
			assert.equal(Timespan.tryParse("not a timespan"), null);
			assert.equal(Timespan.tryParse(""), null);
			assert.equal(Timespan.tryParse("1:2"), null);
		});

		it("should throw on invalid parse", () => {
			assert.throws(() => Timespan.parse("not a timespan"), SyntaxError);
		});
	});

	describe("valueOf and toString", () => {
		it("should return correct numeric value", () => {
			const t = Timespan.fromComponents(1, 2, 3, 4, 5);
			const expected = (((((1 * 24 + 2) * 60 + 3) * 60 + 4) * 1000) + 5);
			assert.equal(t.valueOf(), expected);
		});

		it("should return correct string representation (full)", () => {
			const t = Timespan.fromComponents(1, 2, 3, 4, 5);
			assert.equal(t.toString(), "1.02:03:04.005");
		});

		it("should return correct string representation (compact)", () => {
			const t = Timespan.fromComponents(0, 2, 3, 4, 0);
			assert.equal(t.toString({ full: false }), "02:03:04");
		});

		it("should show negative sign for negative value", () => {
			const t = Timespan.fromValue(-90061005);
			assert.ok(t.toString().startsWith("-"));
		});
	});

	describe("Symbol.toPrimitive", () => {
		it("should return value for 'number' hint", () => {
			const t = Timespan.fromComponents(1, 0, 0, 0, 0);
			assert.equal((t as any)[Symbol.toPrimitive]("number"), t.valueOf());
		});

		it("should return string for 'string' hint", () => {
			const t = Timespan.fromComponents(1, 0, 0, 0, 0);
			assert.equal((t as any)[Symbol.toPrimitive]("string"), t.toString());
		});

		it("should return boolean for 'boolean' hint", () => {
			const t = Timespan.fromComponents(1, 0, 0, 0, 0);
			assert.equal((t as any)[Symbol.toPrimitive]("boolean"), true);
			const t0 = Timespan.fromComponents(0, 0, 0, 0, 0);
			assert.equal((t0 as any)[Symbol.toPrimitive]("boolean"), false);
		});

		it("should throw for invalid hint", () => {
			const t = Timespan.fromComponents(1, 0, 0, 0, 0);
			assert.throws(() => (t as any)[Symbol.toPrimitive]("invalid"));
		});
	});

	describe("property getters/setters", () => {
		it("should set and get days", () => {
			const t = new Timespan();
			t.days = 5;
			assert.equal(t.days, 5);
		});

		it("should set and get hours", () => {
			const t = new Timespan();
			t.hours = 10;
			assert.equal(t.hours, 10);
		});

		it("should set and get minutes", () => {
			const t = new Timespan();
			t.minutes = 30;
			assert.equal(t.minutes, 30);
		});

		it("should set and get seconds", () => {
			const t = new Timespan();
			t.seconds = 45;
			assert.equal(t.seconds, 45);
		});

		it("should set and get milliseconds", () => {
			const t = new Timespan();
			t.milliseconds = 123;
			assert.equal(t.milliseconds, 123);
		});

		it("should ignore non-finite values", () => {
			const t = new Timespan();
			t.days = Infinity;
			assert.equal(t.days, 0);
			t.hours = NaN;
			assert.equal(t.hours, 0);
			t.minutes = undefined as any;
			assert.equal(t.minutes, 0);
		});
	});

	describe("presets", () => {
		it("MIN_VALUE and MAX_VALUE should be correct", () => {
			assert.equal(Timespan.MIN_VALUE.valueOf(), Number.MIN_SAFE_INTEGER);
			assert.equal(Timespan.MAX_VALUE.valueOf(), Number.MAX_SAFE_INTEGER);
		});

		it("newZero should be zero", () => {
			assert.equal(Timespan.newZero.valueOf(), 0);
		});

		it("newMillisecond should be 1 ms", () => {
			assert.equal(Timespan.newMillisecond.valueOf(), 1);
		});

		it("newSecond should be 1 s", () => {
			assert.equal(Timespan.newSecond.valueOf(), 1000);
		});

		it("newMinute should be 1 min", () => {
			assert.equal(Timespan.newMinute.valueOf(), 60000);
		});

		it("newHour should be 1 hour", () => {
			assert.equal(Timespan.newHour.valueOf(), 3600000);
		});

		it("newDay should be 1 day", () => {
			assert.equal(Timespan.newDay.valueOf(), 86400000);
		});
	});

	describe("modifiers", () => {
		it("duration should return absolute value", () => {
			const t = Timespan.fromValue(-12345);
			assert.equal(t.duration().valueOf(), 12345);
		});

		it("invert should return negative value", () => {
			const t = Timespan.fromValue(12345);
			assert.equal(t.invert().valueOf(), -12345);
		});
	});
});