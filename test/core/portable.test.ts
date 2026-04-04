import "adaptive-extender/core";
import { ArrayOf, Deferred, Descendant, DiscriminatorKey, EnumFrom, Field, Nullable, Optional, Model, Any, Timestamp, UnixSeconds, SetOf, MapOf, RecordOf } from "adaptive-extender/core";
import { describe, it, expect } from "vitest";

// --- Models for Testing ---

class SimpleModel extends Model {
	@Field(String)
	name!: string;

	@Field(Number, "age_value")
	age!: number;
}

class ComplexModel extends Model {
	@Field(SimpleModel)
	child!: SimpleModel;

	@Field(ArrayOf(String))
	tags!: string[];

	@Field(Nullable(Number))
	score!: number | null;

	@Field(Optional(Boolean))
	active?: boolean;
}

// Recursive/Deferred Model
class Node extends Model {
	@Field(String)
	id!: string;

	@Field(ArrayOf(Deferred(_ => Node)))
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
	@Field(ArrayOf(Deferred<Animal, AnimalScheme>(_ => Animal)))
	animals!: Animal[];
}

// Custom Discriminator Models
@Descendant(Deferred(_ => CustomTypeA), "type-a")
@Descendant(Deferred(_ => CustomTypeB), "type-b")
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
@Descendant(Deferred(_ => Notification), "msg")
@Descendant(Deferred(_ => Alert), "alert")
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

// Map adapter models
class SettingsModel extends Model {
	@Field(SetOf(String))
	tags!: Set<string>;

	@Field(RecordOf(Boolean))
	preferences!: Map<string, boolean>;

	@Field(MapOf(Number, String))
	scores!: Map<number, string>;
}

// EnumFrom adapter models
enum TaskStatus { Pending, Active, Closed }
enum Direction { Up = "UP", Down = "DOWN", Left = "LEFT" }
const Role = { admin: "admin", user: "user", guest: "guest" } as const;
const Priority = Object.freeze({ low: 1, medium: 2, high: 3 });

class TaskModel extends Model {
	@Field(EnumFrom(TaskStatus))
	status!: TaskStatus;

	@Field(EnumFrom(Direction))
	direction!: Direction;
}

class AccessModel extends Model {
	@Field(EnumFrom(Role))
	role!: "admin" | "user" | "guest";

	@Field(Optional(EnumFrom(Priority)))
	priority?: 1 | 2 | 3;
}

describe("Model Tests", () => {

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

	describe("Complex Types (ArrayOf, Nullable, Optional)", () => {
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

	describe("Adapters", () => {
		describe("SetOf", () => {
			it("should identify as Set and convert elements", () => {
				expect(SetOf(String)[Symbol.hasInstance](new Set())).toBe(true);
				const raw = ["a", "b"];
				const set = SetOf(String).import(raw, "s");
				expect(set).toBeInstanceOf(Set);
				expect(Array.from(set)).toEqual(["a", "b"]);
			});

			it("should export Set to array", () => {
				const set = new Set(["x", "y"]);
				const arr = SetOf(String).export(set);
				expect(arr).toEqual(["x", "y"]);
			});

			it("should import Set of models", () => {
				const raw = [{ name: "S1", age_value: 10 }];
				const set = SetOf(SimpleModel).import(raw, "models");
				const first = Array.from(set)[0];
				expect(first).toBeInstanceOf(SimpleModel);
				expect((first as SimpleModel).name).toBe("S1");
			});
		});

		describe("Timestamp", () => {
			it("should identify as Timestamp", () => {
				expect(Timestamp.name).toBe("Timestamp");
				expect(Timestamp[Symbol.hasInstance](new Date())).toBe(true);
			});

			it("should import number as Date", () => {
				const time = 1705752000000; // 2024-01-20T12:00:00.000Z
				const date = Timestamp.import(time, "ts");
				expect(date).toBeInstanceOf(Date);
				expect(date.getTime()).toBe(time);
			});

			it("should throw on invalid import type", () => {
				expect(() => Timestamp.import("invalid", "ts")).toThrow(TypeError);
			});

			it("should export Date as number (milliseconds)", () => {
				const time = 1705752000000;
				const date = new Date(time);
				expect(Timestamp.export(date)).toBe(time);
			});
		});

		describe("UnixSeconds", () => {
			it("should identify as UnixSeconds", () => {
				expect(UnixSeconds.name).toBe("UnixSeconds");
				expect(UnixSeconds[Symbol.hasInstance](new Date())).toBe(true);
			});

			it("should import seconds number as Date", () => {
				const seconds = 1705752000; // 2024-01-20T12:00:00.000Z
				const date = UnixSeconds.import(seconds, "unix");
				expect(date).toBeInstanceOf(Date);
				expect(date.getTime()).toBe(seconds * 1000);
			});

			it("should throw on invalid import type", () => {
				expect(() => UnixSeconds.import("invalid", "unix")).toThrow(TypeError);
			});

			it("should export Date as number (seconds)", () => {
				const seconds = 1705752000;
				const date = new Date(seconds * 1000 + 500); // +500ms (should be truncated)
				expect(UnixSeconds.export(date)).toBe(seconds);
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
		});

		describe("RecordOf", () => {
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
				const map = RecordOf(SimpleModel).import(raw, "m");
				expect(map.get("first")).toBeInstanceOf(SimpleModel);
				expect((map.get("first") as SimpleModel).name).toBe("Alice");

				const exported: any = RecordOf(SimpleModel).export(map);
				expect(exported.first).toEqual({ name: "Alice", age_value: 30 });
			});

			it("should import an empty object as an empty map", () => {
				const map = RecordOf(String).import({}, "m");
				expect(map.size).toBe(0);
			});

			it("should throw when source is not an object", () => {
				expect(() => RecordOf(Number).import("string", "m")).toThrow(TypeError);
				expect(() => RecordOf(Number).import(null, "m")).toThrow(TypeError);
			});
		});

		describe("MapOf", () => {
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
				const map = MapOf(String, SimpleModel).import(raw, "m");
				expect(map.get("key1")).toBeInstanceOf(SimpleModel);
				expect((map.get("key1") as SimpleModel).age).toBe(25);

				const exported = MapOf(String, SimpleModel).export(map);
				expect(exported).toEqual([["key1", { name: "Bob", age_value: 25 }]]);
			});

			it("should import an empty array as an empty map", () => {
				const map = MapOf(String, Number).import([], "m");
				expect(map.size).toBe(0);
			});

			it("should throw when source is not an array", () => {
				expect(() => MapOf(String, Number).import({}, "m")).toThrow(TypeError);
				expect(() => MapOf(String, Number).import("bad", "m")).toThrow(TypeError);
			});
		});
	});

	describe("EnumFrom", () => {
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

		describe("JS const-object with numeric values (Priority) wrapped in Optional", () => {
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
});
