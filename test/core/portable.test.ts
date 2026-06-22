import "adaptive-extender/core";
import { Deferred, Descendant, DiscriminatorKey, Enum, Field, Nullable, Optional, Model, Any } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

// --- Models for Testing ---

class SimpleModel extends Model {
	@Field(String)
	name!: string;

	@Field(Number, { name: "age_value" })
	age!: number;
}

class ComplexModel extends Model {
	@Field(SimpleModel)
	child!: SimpleModel;

	@Field(Array.Of(String))
	tags!: string[];

	@Field(Nullable.Of(Number))
	score!: number | null;

	@Field(Optional.Of(Boolean))
	active?: boolean;
}

// Recursive/Deferred Model
class Node extends Model {
	@Field(String)
	id!: string;

	@Field(Array.Of(Deferred(_ => Node)))
	children!: Node[];
}

// Polymorphic Models
interface AnimalScheme {
	name: string;
}

@Descendant(Deferred(_ => Dog))
@Descendant(Deferred(_ => Cat))
abstract class Animal extends Model {
	@Field(String)
	name!: string;
}

class Dog extends Animal {
	@Field(String)
	breed!: string;
}

class Cat extends Animal {
	@Field(Boolean)
	indoor!: boolean;
}

class Shelter extends Model {
	@Field(Array.Of(Deferred<Animal, AnimalScheme>(_ => Animal)))
	animals!: Animal[];
}

// Custom Discriminator Models
@Descendant(Deferred(_ => CustomTypeA), { discriminator: "type-a" })
@Descendant(Deferred(_ => CustomTypeB), { discriminator: "type-b" })
abstract class CustomBase extends Model {
	@Field(String)
	id!: string;
}

class CustomTypeA extends CustomBase {
	@Field(String)
	valueA!: string;
}

class CustomTypeB extends CustomBase {
	@Field(Number)
	valueB!: number;
}


// Custom Discriminator Key Models
@DiscriminatorKey("kind")
@Descendant(Deferred(_ => Notification), { discriminator: "msg" })
@Descendant(Deferred(_ => Alert), { discriminator: "alert" })
abstract class Event extends Model {
	@Field(Number)
	timestamp!: number;
}

class Notification extends Event {
	@Field(String)
	message!: string;
}

class Alert extends Event {
	@Field(Number)
	level!: number;
}

// Three-level hierarchy with decorator-less concrete leaves (regression test for
// metadata-inheritance infinite recursion — leaves without own @Field/@Descendant
// share the parent's Symbol.metadata object; descendant dispatch must not recurse).
@Descendant(Deferred(_ => RedShape))
@Descendant(Deferred(_ => BlueShape))
abstract class Shape extends Model {
	@Field(String)
	id!: string;
}

// LabeledShape is an abstract mid-class with its own @Field — owns metadata.
@Descendant(Deferred(_ => RedShape))
@Descendant(Deferred(_ => BlueShape))
abstract class LabeledShape extends Shape {
	@Field(String)
	label!: string;
}

// Concrete leaves have NO decorators; they inherit LabeledShape's Symbol.metadata.
class RedShape extends LabeledShape {
	constructor();
	constructor(id: string, label: string);
	constructor(id?: string, label?: string) {
		if (id === undefined || label === undefined) { super(); return; }
		super();
		this.id = id;
		this.label = label;
	}
}

class BlueShape extends LabeledShape {
	constructor();
	constructor(id: string, label: string);
	constructor(id?: string, label?: string) {
		if (id === undefined || label === undefined) { super(); return; }
		super();
		this.id = id;
		this.label = label;
	}
}

class Canvas extends Model {
	@Field(Array.Of(Deferred<Shape, object>(_ => Shape)))
	shapes!: Shape[];
}

// Map adapter models
class SettingsModel extends Model {
	@Field(Set.Of(String))
	tags!: Set<string>;

	@Field(Map.AsRecord(Boolean))
	preferences!: Map<string, boolean>;

	@Field(Map.AsTuples(Number, String))
	scores!: Map<number, string>;
}

// Enum adapter models
enum TaskStatus { Pending, Active, Closed }
enum Direction { Up = "UP", Down = "DOWN", Left = "LEFT" }
const Role = { admin: "admin", user: "user", guest: "guest" } as const;
const Priority = Object.freeze({ low: 1, medium: 2, high: 3 });

class TaskModel extends Model {
	@Field(Enum.Of(TaskStatus))
	status!: TaskStatus;

	@Field(Enum.Of(Direction))
	direction!: Direction;
}

class AccessModel extends Model {
	@Field(Enum.Of(Role))
	role!: "admin" | "user" | "guest";

	@Field(Optional.Of(Enum.Of(Priority)))
	priority?: 1 | 2 | 3;
}

// Early-return constructor model — no field initializers, matches the pattern
// where constructor args are optional and the no-arg path returns early after super().
class EarlyReturnModel extends Model {
	@Field(String)
	label!: string;

	@Field(Array.Of(Number), { name: "nums" })
	values!: number[];

	constructor();
	constructor(label: string, values: number[]);
	constructor(label?: string, values?: number[]) {
		if (label === undefined || values === undefined) { super(); return; }
		super();
		this.label = label;
		this.values = values;
	}
}

// Migration default models — absent source keys keep the field initializer (overlay import)
class MigrationModel extends Model {
	@Field(String)
	name!: string;

	@Field(Number)
	score: number = 42;  // initializer IS the migration default; absent key keeps this value

	@Field(Array.Of(Number))
	tags: number[] = [];

	@Field(String, { name: "alias_key" })
	aliased: string = "hello";
}

// Strictness model — required field with no initializer must be present in source
class StrictModel extends Model {
	@Field(String)
	theme!: string;

	@Field(Optional.Of(String))
	nickname?: string;

	@Field(Number)
	volume: number = 50;
}

describe("Model Tests", () => {

	describe("Constructor Patterns", () => {
		it("should import a model with an early-return constructor (cold — no prior construction with args)", () => {
			const m = EarlyReturnModel.import({ label: "x", nums: [1, 2, 3] }, "early");
			expect(m).toBeInstanceOf(EarlyReturnModel);
			expect(m.label).toBe("x");
			expect(m.values).toEqual([1, 2, 3]);
		});

		it("should export a model constructed with args", () => {
			const m = new EarlyReturnModel("hello", [10, 20]);
			const raw: any = EarlyReturnModel.export(m);
			expect(raw.label).toBe("hello");
			expect(raw.nums).toEqual([10, 20]);
		});

		it("should round-trip through import then export", () => {
			const m = EarlyReturnModel.import({ label: "round", nums: [7] }, "rt");
			const raw: any = EarlyReturnModel.export(m);
			expect(raw).toEqual({ label: "round", nums: [7] });
		});
	});

	describe("Basic Field Mapping", () => {
		it("should import simple fields", () => {
			const raw = { name: "John", age_value: 30 };
			const model = SimpleModel.import(raw, "test");

			expect(model).toBeInstanceOf(SimpleModel);
			expect(model.name).toBe("John");
			expect(model.age).toBe(30);
		});

		it("should export simple fields", () => {
			const model = new SimpleModel();
			model.name = "Jane";
			model.age = 25;

			const raw = SimpleModel.export(model);
			expect(raw).toEqual({
				name: "Jane",
				age_value: 25
			});
		});

		it("should throw on missing required fields during import", () => {
			const raw = { name: "John" }; // Missing age_value
			// Note: The behavior depends on Number.import throwing when undefined is passed
			expect(() => SimpleModel.import(raw, "test")).toThrow();
		});
	});

	describe("Complex Types (Array.Of, Nullable.Of, Optional.Of)", () => {
		it("should handle nested models and arrays", () => {
			const raw = {
				child: { name: "Kid", age_value: 5 },
				tags: ["one", "two"],
				score: 100,
				active: true
			};
			const model = ComplexModel.import(raw, "complex");

			expect(model.child).toBeInstanceOf(SimpleModel);
			expect(model.child.name).toBe("Kid");
			expect(model.tags).toEqual(["one", "two"]);
			expect(model.score).toBe(100);
			expect(model.active).toBe(true);
		});

		it("should handle nullable fields", () => {
			const raw = {
				child: { name: "Ghost", age_value: 999 },
				tags: [],
				score: null
				// active is optional/undefined
			};
			const model = ComplexModel.import(raw, "complex");
			expect(model.score).toBeNull();
			expect(model.active).toBeUndefined();
		});

		it("should export complex structures", () => {
			const model = new ComplexModel();
			model.child = new SimpleModel();
			model.child.name = "Baby";
			model.child.age = 1;
			model.tags = ["a"];
			model.score = null;
			model.active = undefined;

			const raw: any = ComplexModel.export(model);
			expect(raw.child).toBeDefined();
			expect(raw.child.name).toBe("Baby");
			expect(raw.tags).toEqual(["a"]);
			expect(raw.score).toBeNull();
			expect(raw.active).toBeUndefined();
		});
	});

	describe("Deferred / Recursive Models", () => {
		it("should valid self-referencing models", () => {
			const raw = {
				id: "root",
				children: [
					{ id: "c1", children: [] },
					{ id: "c2", children: [{ id: "c2.1", children: [] }] }
				]
			};

			const root = Node.import(raw, "tree");
			expect(root).toBeInstanceOf(Node);
			expect(root.children).toHaveLength(2);
			expect(root.children[0]).toBeInstanceOf(Node);
			expect(root.children[1].children[0].id).toBe("c2.1");
		});
	});

	describe("Polymorphism (Descendants)", () => {
		it("should import correct subclass based on $type", () => {
			const raw = {
				animals: [
					{ $type: "Dog", name: "Buddy", breed: "Golden" },
					{ $type: "Cat", name: "Whiskers", indoor: true }
				]
			};

			const shelter = Shelter.import(raw, "shelter");
			expect(shelter.animals).toHaveLength(2);

			const dog = shelter.animals[0];
			const cat = shelter.animals[1];

			expect(dog).toBeInstanceOf(Dog);
			expect((dog as Dog).breed).toBe("Golden");

			expect(cat).toBeInstanceOf(Cat);
			expect((cat as Cat).indoor).toBe(true);
		});

		it("should throw on unknown discriminator", () => {
			const raw = {
				$type: "Bird",
				name: "Tweety"
			};
			expect(() => Animal.import(raw, "bird")).toThrow(`Unknown 'Bird' discriminator for bird`);
		});

		it("should export with $type discriminator", () => {
			const dog = new Dog();
			dog.name = "Rex";
			dog.breed = "Pug";

			const raw: any = Animal.export(dog);
			expect(raw.$type).toBe("Dog");
			expect(raw.breed).toBe("Pug");
		});
	});

	describe("Polymorphism — decorator-less concrete leaves (metadata-inheritance regression)", () => {
		it("should export a decorator-less leaf without infinite recursion", () => {
			const red = new RedShape("r1", "Red");
			const raw: any = Shape.export(red);
			expect(raw.$type).toBe("RedShape");
			expect(raw.id).toBe("r1");
			expect(raw.label).toBe("Red");
		});

		it("should import a decorator-less leaf without infinite recursion", () => {
			const raw = { $type: "BlueShape", id: "b1", label: "Blue" };
			const shape = Shape.import(raw, "canvas.shapes[0]");
			expect(shape).toBeInstanceOf(BlueShape);
			expect(shape.id).toBe("b1");
			expect((shape as BlueShape).label).toBe("Blue");
		});

		it("should round-trip decorator-less leaves inside an Array.Of container", () => {
			const canvas = new Canvas();
			canvas.shapes = [new RedShape("r1", "Red"), new BlueShape("b2", "Blue")];
			const raw: any = Canvas.export(canvas);
			expect(raw.shapes).toHaveLength(2);
			expect(raw.shapes[0].$type).toBe("RedShape");
			expect(raw.shapes[1].$type).toBe("BlueShape");

			const imported = Canvas.import(raw, "canvas");
			expect(imported.shapes[0]).toBeInstanceOf(RedShape);
			expect(imported.shapes[1]).toBeInstanceOf(BlueShape);
			expect((imported.shapes[1] as BlueShape).label).toBe("Blue");
		});
	});

	describe("Adapters", () => {
		describe("Set.Of", () => {
			it("should identify as Set and convert elements", () => {
				expect(Set.Of(String)[Symbol.hasInstance](new Set())).toBe(true);
				const raw = ["a", "b"];
				const set = Set.Of(String).import(raw, "s");
				expect(set).toBeInstanceOf(Set);
				expect(Array.from(set)).toEqual(["a", "b"]);
			});

			it("should export Set to array", () => {
				const set = new Set(["x", "y"]);
				const arr = Set.Of(String).export(set);
				expect(arr).toEqual(["x", "y"]);
			});

			it("should import Set of models", () => {
				const raw = [{ name: "S1", age_value: 10 }];
				const set = Set.Of(SimpleModel).import(raw, "models");
				const first = Array.from(set)[0];
				expect(first).toBeInstanceOf(SimpleModel);
				expect((first as SimpleModel).name).toBe("S1");
			});
		});

		describe("Date.AsTimestamp", () => {
			it("should identify as Timestamp", () => {
				expect(Date.AsTimestamp.name).toBe("Timestamp");
				expect(Date.AsTimestamp[Symbol.hasInstance](new Date())).toBe(true);
			});

			it("should import number as Date", () => {
				const time = 1705752000000; // 2024-01-20T12:00:00.000Z
				const date = Date.AsTimestamp.import(time, "ts");
				expect(date).toBeInstanceOf(Date);
				expect(date.getTime()).toBe(time);
			});

			it("should throw on invalid import type", () => {
				expect(() => Date.AsTimestamp.import("invalid", "ts")).toThrow(TypeError);
			});

			it("should export Date as number (milliseconds)", () => {
				const time = 1705752000000;
				const date = new Date(time);
				expect(Date.AsTimestamp.export(date)).toBe(time);
			});
		});

		describe("Date.AsUnixSeconds", () => {
			it("should identify as UnixSeconds", () => {
				expect(Date.AsUnixSeconds.name).toBe("UnixSeconds");
				expect(Date.AsUnixSeconds[Symbol.hasInstance](new Date())).toBe(true);
			});

			it("should import seconds number as Date", () => {
				const seconds = 1705752000; // 2024-01-20T12:00:00.000Z
				const date = Date.AsUnixSeconds.import(seconds, "unix");
				expect(date).toBeInstanceOf(Date);
				expect(date.getTime()).toBe(seconds * 1000);
			});

			it("should throw on invalid import type", () => {
				expect(() => Date.AsUnixSeconds.import("invalid", "unix")).toThrow(TypeError);
			});

			it("should export Date as number (seconds)", () => {
				const seconds = 1705752000;
				const date = new Date(seconds * 1000 + 500); // +500ms (should be truncated)
				expect(Date.AsUnixSeconds.export(date)).toBe(seconds);
			});
		});

		describe("Any", () => {
			it("should identify as Any", () => {
				expect(Any.name).toBe("Any");
				expect(Any[Symbol.hasInstance]({})).toBe(true);
				expect(Any[Symbol.hasInstance](null)).toBe(true);
			});

			it("should pass through any value on import", () => {
				const obj = { context: "data" };
				expect(Any.import(obj, "any")).toBe(obj);
				expect(Any.import(123, "any")).toBe(123);
				expect(Any.import(null, "any")).toBe(null);
			});

			it("should pass through any value on export", () => {
				const obj = { context: "data" };
				expect(Any.export(obj)).toBe(obj);
			});

			it("should not be instantiable", () => {
				expect(() => new (Any as any)()).toThrow(TypeError);
			});
		});

		describe("Map.AsRecord", () => {
			it("should import Record<string, S> as Map<string, M> via @Field decorator", () => {
				const raw = {
					tags: [],
					preferences: { dark: true, notifications: false },
					scores: []
				};
				const model = SettingsModel.import(raw, "settings");
				expect(model.preferences).toBeInstanceOf(Map);
				expect(model.preferences.get("dark")).toBe(true);
				expect(model.preferences.get("notifications")).toBe(false);
			});

			it("should export Map<string, M> as Record<string, S> via @Field decorator", () => {
				const model = new SettingsModel();
				model.tags = new Set();
				model.preferences = new Map([["dark", true], ["animations", false]]);
				model.scores = new Map();

				const raw: any = SettingsModel.export(model);
				expect(raw.preferences).toEqual({ dark: true, animations: false });
			});

			it("should import and export Map of models", () => {
				const raw = { first: { name: "Alice", age_value: 30 } };
				const map = Map.AsRecord(SimpleModel).import(raw, "m");
				expect(map.get("first")).toBeInstanceOf(SimpleModel);
				expect((map.get("first") as SimpleModel).name).toBe("Alice");

				const exported: any = Map.AsRecord(SimpleModel).export(map);
				expect(exported.first).toEqual({ name: "Alice", age_value: 30 });
			});

			it("should import an empty object as an empty map", () => {
				const map = Map.AsRecord(String).import({}, "m");
				expect(map.size).toBe(0);
			});

			it("should throw when source is not an object", () => {
				expect(() => Map.AsRecord(Number).import("string", "m")).toThrow(TypeError);
				expect(() => Map.AsRecord(Number).import(null, "m")).toThrow(TypeError);
			});
		});

		describe("Map.AsTuples", () => {
			it("should import [SK, SV][] as Map<MK, MV> via @Field decorator", () => {
				const raw = {
					tags: [],
					preferences: {},
					scores: [[1, "gold"], [2, "silver"], [3, "bronze"]]
				};
				const model = SettingsModel.import(raw, "settings");
				expect(model.scores).toBeInstanceOf(Map);
				expect(model.scores.get(1)).toBe("gold");
				expect(model.scores.get(3)).toBe("bronze");
			});

			it("should export Map<MK, MV> as [SK, SV][] via @Field decorator", () => {
				const model = new SettingsModel();
				model.tags = new Set();
				model.preferences = new Map();
				model.scores = new Map([[10, "alpha"], [20, "beta"]]);

				const raw: any = SettingsModel.export(model);
				expect(raw.scores).toEqual([[10, "alpha"], [20, "beta"]]);
			});

			it("should import and export Map of models as tuples", () => {
				const raw = [["key1", { name: "Bob", age_value: 25 }]];
				const map = Map.AsTuples(String, SimpleModel).import(raw, "m");
				expect(map.get("key1")).toBeInstanceOf(SimpleModel);
				expect((map.get("key1") as SimpleModel).age).toBe(25);

				const exported = Map.AsTuples(String, SimpleModel).export(map);
				expect(exported).toEqual([["key1", { name: "Bob", age_value: 25 }]]);
			});

			it("should import an empty array as an empty map", () => {
				const map = Map.AsTuples(String, Number).import([], "m");
				expect(map.size).toBe(0);
			});

			it("should throw when source is not an array", () => {
				expect(() => Map.AsTuples(String, Number).import({}, "m")).toThrow(TypeError);
				expect(() => Map.AsTuples(String, Number).import("bad", "m")).toThrow(TypeError);
			});
		});
	});

	describe("Enum.Of", () => {
		describe("TS numeric enum (TaskStatus)", () => {
			it("should import valid numeric members via @Field", () => {
				const model = TaskModel.import({ status: TaskStatus.Active, direction: Direction.Up }, "task");
				expect(model.status).toBe(TaskStatus.Active);
			});

			it("should reject reverse-mapping string keys as values", () => {
				expect(() => TaskModel.import({ status: "Active", direction: Direction.Up }, "task")).toThrow(TypeError);
			});

			it("should reject out-of-range numeric values", () => {
				expect(() => TaskModel.import({ status: 99, direction: Direction.Up }, "task")).toThrow(TypeError);
			});

			it("should export the numeric value unchanged", () => {
				const model = new TaskModel();
				model.status = TaskStatus.Closed;
				model.direction = Direction.Down;
				const raw: any = TaskModel.export(model);
				expect(raw.status).toBe(TaskStatus.Closed);
			});
		});

		describe("TS string enum (Direction)", () => {
			it("should import valid string members via @Field", () => {
				const model = TaskModel.import({ status: TaskStatus.Pending, direction: "LEFT" }, "task");
				expect(model.direction).toBe(Direction.Left);
			});

			it("should reject unknown string values", () => {
				expect(() => TaskModel.import({ status: TaskStatus.Pending, direction: "RIGHT" }, "task")).toThrow(TypeError);
			});

			it("should reject enum key names as values", () => {
				expect(() => TaskModel.import({ status: TaskStatus.Pending, direction: "Up" }, "task")).toThrow(TypeError);
			});

			it("should export the string value unchanged", () => {
				const model = new TaskModel();
				model.status = TaskStatus.Pending;
				model.direction = Direction.Up;
				const raw: any = TaskModel.export(model);
				expect(raw.direction).toBe("UP");
			});
		});

		describe("JS const-object with string values (Role)", () => {
			it("should import valid role string via @Field", () => {
				const model = AccessModel.import({ role: "admin", priority: undefined }, "access");
				expect(model.role).toBe("admin");
			});

			it("should reject key names as values", () => {
				expect(() => AccessModel.import({ role: "moderator" }, "access")).toThrow(TypeError);
			});

			it("should export the string value unchanged", () => {
				const model = new AccessModel();
				model.role = "guest";
				const raw: any = AccessModel.export(model);
				expect(raw.role).toBe("guest");
			});
		});

		describe("JS const-object with numeric values (Priority) wrapped in Optional.Of", () => {
			it("should import valid numeric priority", () => {
				const model = AccessModel.import({ role: "user", priority: 2 }, "access");
				expect(model.priority).toBe(2);
			});

			it("should pass through undefined when priority is absent", () => {
				const model = AccessModel.import({ role: "user" }, "access");
				expect(model.priority).toBeUndefined();
			});

			it("should reject values not in the const object", () => {
				expect(() => AccessModel.import({ role: "user", priority: 99 }, "access")).toThrow(TypeError);
			});

			it("should export the numeric value unchanged", () => {
				const model = new AccessModel();
				model.role = "user";
				model.priority = 3;
				const raw: any = AccessModel.export(model);
				expect(raw.priority).toBe(3);
			});
		});
	});

	describe("Custom Discriminator Polymorphism", () => {
		it("should export with custom discriminator", () => {
			const instance = new CustomTypeA();
			instance.id = "1";
			instance.valueA = "test";
			const exported = CustomBase.export<CustomBase, any>(instance);
			expect(exported.$type).toBe("type-a");
			expect(exported.id).toBe("1");
			expect(exported.valueA).toBe("test");
		});

		it("should import with custom discriminator", () => {
			const source = { $type: "type-b", id: "2", valueB: 123 };
			const instance = CustomBase.import(source, "root") as CustomTypeB;
			expect(instance).toBeInstanceOf(CustomTypeB);
			expect(instance.id).toBe("2");
			expect(instance.valueB).toBe(123);
		});

		it("should throw for unknown custom discriminator", () => {
			const source = { $type: "type-z", id: "3" };
			expect(() => CustomBase.import(source, "root")).toThrow(`Unknown 'type-z' discriminator for root`);
		});
	});

	describe("Custom Discriminator Key ($type override)", () => {
		it("should export with custom key 'kind'", () => {
			const notification = new Notification();
			notification.timestamp = 12345;
			notification.message = "Hello";

			const exported: any = Event.export(notification);
			expect(exported.kind).toBe("msg");
			expect(exported.$type).toBeUndefined();
			expect(exported.message).toBe("Hello");
		});

		it("should import with custom key 'kind'", () => {
			const source = { kind: "alert", timestamp: 555, level: 1 };
			const event = Event.import(source, "event") as Alert;
			expect(event).toBeInstanceOf(Alert);
			expect(event.level).toBe(1);
			expect(event.timestamp).toBe(555);
		});

		it("should throw if custom key is missing", () => {
			const source = { $type: "alert", timestamp: 555, level: 1 };
			// Should fail because it looks for 'kind', not '$type'
			expect(() => Event.import(source, "event")).toThrow("Missing 'kind' discriminator in event");
		});
	});

	describe("Validation Tests", () => {
		it("should throw error when Field is used on static property", () => {
			expect(() => {
				class InvalidModel extends Model {
					@Field(String)
					static staticField: string;
				}
				void InvalidModel;
			}).toThrow("Portable fields cannot be static");
		});
	});

	describe("Optional and Nullable classes", () => {
		it("Optional.Of should not be instantiable", () => {
			expect(() => new (Optional as any)()).toThrow(TypeError);
		});

		it("Nullable.Of should not be instantiable", () => {
			expect(() => new (Nullable as any)()).toThrow(TypeError);
		});

		it("Optional.map should pass undefined through", () => {
			const result = Optional.map(undefined, (v: number) => v * 2);
			expect(result).toBeUndefined();
		});

		it("Optional.map should apply callback to non-undefined values", () => {
			const result = Optional.map(5, (v: number) => v * 2);
			expect(result).toBe(10);
		});

		it("Optional.map should treat null as a valid value and apply callback", () => {
			const result = Optional.map(null, (v: null) => "was null");
			expect(result).toBe("was null");
		});

		it("Nullable.map should pass null through", () => {
			const result = Nullable.map(null, (v: number) => v + 1);
			expect(result).toBeNull();
		});

		it("Nullable.map should apply callback to non-null values", () => {
			const result = Nullable.map(5, (v: number) => v * 2);
			expect(result).toBe(10);
		});

		it("Nullable.map should treat undefined as a valid value and apply callback", () => {
			const result = Nullable.map(undefined, (v: undefined) => "was undefined");
			expect(result).toBe("was undefined");
		});
	});

	describe("overlay import — migration defaults via field initializers", () => {
		it("should keep the field initializer when the source key is absent", () => {
			const model = MigrationModel.import({ name: "Alice" }, "m");
			expect(model.score).toBe(42);
		});

		it("should overwrite the initializer when the source key is present", () => {
			const model = MigrationModel.import({ name: "Alice", score: 99 }, "m");
			expect(model.score).toBe(99);
		});

		it("should give independent array instances across imports without any clone trick", () => {
			const a = MigrationModel.import({ name: "A" }, "a");
			const b = MigrationModel.import({ name: "B" }, "b");
			expect(a.tags).toEqual([]);
			expect(b.tags).toEqual([]);
			// Reflect.construct re-runs the initializer for each import — no shared reference
			a.tags.push(1);
			expect(b.tags).toEqual([]);
		});

		it("should respect an aliased name alongside an initializer default", () => {
			const model = MigrationModel.import({ name: "C" }, "c");
			expect(model.aliased).toBe("hello");

			const model2 = MigrationModel.import({ name: "D", alias_key: "world" }, "d");
			expect(model2.aliased).toBe("world");
		});

		it("should export the live field value regardless", () => {
			const model = MigrationModel.import({ name: "E" }, "e");
			const raw: any = MigrationModel.export(model);
			expect(raw.score).toBe(42);
			expect(raw.tags).toEqual([]);
			expect(raw.alias_key).toBe("hello");
		});
	});

	describe("overlay import — strictness (delegate rule)", () => {
		it("should throw when a required field (no initializer, strict type) is absent", () => {
			expect(() => StrictModel.import({ volume: 30 }, "s")).toThrow(TypeError);
		});

		it("should throw on a completely empty source for a required-field model", () => {
			expect(() => StrictModel.import({}, "s")).toThrow(TypeError);
		});

		it("should yield undefined for an Optional.Of field that is absent", () => {
			const model = StrictModel.import({ theme: "dark" }, "s");
			expect(model.nickname).toBeUndefined();
		});

		it("should keep the initializer default for a defaulted field that is absent", () => {
			const model = StrictModel.import({ theme: "dark" }, "s");
			expect(model.volume).toBe(50);
		});

		it("should import all fields when all keys are present", () => {
			const model = StrictModel.import({ theme: "light", nickname: "ace", volume: 70 }, "s");
			expect(model.theme).toBe("light");
			expect(model.nickname).toBe("ace");
			expect(model.volume).toBe(70);
		});
	});
});
