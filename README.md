# Adaptive Extender

[![NPM Version](https://img.shields.io/npm/v/adaptive-extender.svg)](https://www.npmjs.com/package/adaptive-extender)
[![License](https://img.shields.io/npm/l/adaptive-extender.svg)](./LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/adaptive-extender)](https://bundlephobia.com/package/adaptive-extender)
[![TypeScript](https://img.shields.io/badge/types-included-3178c6.svg)](https://www.typescriptlang.org/)

Extends native prototypes and provides missing standard utilities — with a focus on strict typing, safety, and code readability.

[Change log](./CHANGELOG.md)

## Installation

```bash
npm install adaptive-extender
```

## Packages

| Package                    | Environment                |
| :------------------------- | :------------------------- |
| `adaptive-extender/core`   | Browser, Node.js, Deno     |
| `adaptive-extender/node`   | Node.js (includes core)    |
| `adaptive-extender/web`    | Browser (includes core)    |
| `adaptive-extender/worker` | Web Worker (includes core) |

- - -

```typescript
// Import once — extensions are active everywhere
import "adaptive-extender/core";
import "adaptive-extender/web";    // Browser only
import "adaptive-extender/worker"; // Web Worker only
```

## Native Extensions

### Number

```typescript
volume = volume.clamp(0, 1);

// Normalize into [0, 1] or remap between ranges
const normalized = currentValue.lerp(sourceMin, sourceMax);
const pixelX = angle.lerp(0, 360, 0, canvasWidth);

// True mathematical modulo — works correctly with negative numbers
const wrappedIndex = (-1).mod(items.length); // → items.length - 1

// Snap to a grid step
const snapped = (3.7).snap(0.5); // → 4

// Chainable fallback for invalid values
const ratio = (numerator / denominator).insteadNaN(0).insteadInfinity(1);
```

### String

```typescript
if (String.isWhitespace(userInput)) return;

const displayName = username.insteadEmpty("Anonymous");

"hello world".toTitleCase(); // → "Hello World"
"île-de-france".toLocalTitleCase("fr"); // → "Île-De-France"
```

### Array

```typescript
for (const index of Array.range(0, 10)) { ... }

for (const [user, role] of Array.zip(users, roles)) {
	console.log(`${user.name}: ${role}`);
}

// Collect an async iterable into an array
const packets = await Array.fromAsync(readableStream);

items.swap(0, items.length - 1);
items.resize(10, null);
const wasRemoved = items.remove(targetItem);
```

### Math

```typescript
const [integer, fractional] = Math.split(3.75); // → [3, 0.75]
Math.sqpw(sideLength); // sideLength²
Math.toRadians(90); // → Math.PI / 2
Math.toDegrees(Math.PI); // → 180

Math.meanArithmetic(1, 2, 3, 4); // → 2.5
Math.meanGeometric(4, 16);
Math.meanHarmonic(1, 2, 4);
```

### Set / Map / Date

```typescript
// Like classList.toggle
selected.toggle(item); // add if absent, remove if present
selected.toggle(item, true); // force add
selected.toggle(item, false); // force remove

// Add only if key is not already present
cache.add(requestKey, response); // → false if key exists

// Detect and replace invalid dates
const safeDate = new Date("invalid").insteadInvalid(new Date());
```

### Promise

```typescript
const request = fetch("/api/data");

if (await request.isSettled) { ... }
if (await request.isResolved) { ... }
if (await request.isRejected) { ... }

const responseData = await request.value; // throws if rejected
const rejectReason = await request.reason; // throws if resolved
```

### Error / Global

```typescript
// Wrap anything into an Error (string, undefined, object)
const error = Error.from(thrown);

// Assert non-null — throws ReferenceError with a message
const appRoot = ReferenceError.suppress(document.getElementById("app"));

throw new ImplementationError(); // sealed, cannot be subclassed

// Get type name without typeof / manual checks
typename(value); // → "String", "Null", "User", ...
```

## Classes

### Timespan

Value object for time intervals. Eliminates raw millisecond arithmetic.

```typescript
import { Timespan } from "adaptive-extender/core";

const sessionDuration = Timespan.fromComponents(0, 30, 0); // 30 minutes
const uptime = Timespan.fromValue(process.uptime() * 1000);
const parsed = Timespan.parse("1.02:30:00.500"); // 1d 2h 30m 0.5s

console.log(uptime.toString()); // "0.00:12:45.123"

uptime.minutes = 0; // other components recalculate automatically

if (uptime.valueOf() > sessionDuration.valueOf()) {
	console.log("Session expired");
}
```

### Color

Full color object with RGB, HSL, HEX support and alpha channel. Changing a component in one color space automatically recalculates the other.

```typescript
import { Color, ColorFormats } from "adaptive-extender/core";

const orange = Color.fromRGB(255, 128, 0);
const parsed = Color.parse("#ff8800");

orange.hue = 200; // RGB recalculates automatically
orange.alpha = 0.8;

console.log(orange.toString({ format: ColorFormats.hsl, deep: true }));
// → "hsla(200, 100%, 50%, 0.8)"
```

### Random

```typescript
import { Random } from "adaptive-extender/core";

const random = Random.global;

random.boolean(0.9); // true with 90% probability
random.number(0, 1); // float [0, 1)
random.integer(1, 6); // int [1, 6]
random.item(options); // random element from array
random.subarray(items, 3); // 3 random elements
random.shuffle(array); // shuffle in place

// Weighted selection
const loot = random.case([
	["common", 70],
	["rare", 25],
	["legendary", 5],
]);
```

### Vector

Mathematical vectors with a LINQ-style iteration API.

```typescript
import { Vector, Vector2D, Vector3D } from "adaptive-extender/core";

const position = new Vector2D(3, 4);
const direction = Vector3D.fromScalar(1); // (1, 1, 1)

// LINQ-like methods over components
const normalized = Vector3D.fromVector(direction.map(component => component / Math.sqrt(3)));

Vector.isFinite(position);
const safePosition = position.insteadNaN(Vector2D.newZero);
const point = Vector2D.parse("(10, 20)"); // → Vector2D { x: 10, y: 20 }
```

### Version

Immutable semantic version with `major.minor.patch` format.

```typescript
import { Version } from "adaptive-extender/core";

const v = new Version(1, 2, 3);
console.log(v.toString()); // → "1.2.3"

const parsed = Version.parse("2.0.0");
const safe = Version.tryParse(userInput); // → Version | null
```

### Controller

Abstract base class for async tasks with centralized error handling.

```typescript
import { Controller } from "adaptive-extender/core";

class InitTask extends Controller<[port: number]> {
	async run(port: number): Promise<void> {
		const response = await fetch(`/api/init?port=${port}`);
		// ...
	}

	async catch(error: Error): Promise<void> {
		console.error("Init failed:", error.message);
	}

	async finally(): Promise<void> {
		console.log("Done.");
	}
}

// Creates an instance and runs it — errors are routed to catch(), finally() always runs
await InitTask.launch(8080);
```

### EnvironmentProvider

Deserializes environment variables into a strictly typed model. JSON values are parsed automatically.

```typescript
import { EnvironmentProvider, Model, Field, Optional } from "adaptive-extender/core";

class AppConfig extends Model {
	@Field(String)
	DB_HOST: string = "localhost";
	
	@Field(Number)
	DB_PORT: number = 5432;
	
	@Field(Optional.Of(String))
	LOG_LEVEL?: string;
}

const config = EnvironmentProvider.resolve(process.env, AppConfig);
// config.DB_PORT is a number, not a string
// Throws TypeError if a required variable is missing or has the wrong type
```

## Portable Data System

Binds classes to their schema via decorators. Importing from JSON validates types automatically and returns a real class instance.

### Basic Usage

```typescript
import { Model, Field, Optional, Nullable } from "adaptive-extender/core";

class Tag extends Model {
	@Field(String)
	name: string = "";
}

class Article extends Model {
	@Field(String)
	title: string = "";
	
	@Field(Number)
	views: number = 0;
	
	@Field(Array.Of(Tag))
	tags: Tag[] = [];
	
	@Field(Optional.Of(String))
	subtitle?: string;
	
	@Field(Nullable.Of(String))
	draft: string | null = null;
}

const article = Article.import(json, "api.article");
// article instanceof Article → true
// TypeError with exact path on failure: "api.article.tags[2].name"

const raw = Article.export(article); // → plain object, ready for JSON.stringify
```

### Polymorphism

```typescript
import { Model, Field, Descendant, DiscriminatorKey } from "adaptive-extender/core";

@DiscriminatorKey("kind")
@Descendant(Dog, { discriminator: "dog" })
@Descendant(Cat, { discriminator: "cat" })
abstract class Animal extends Model {
}

class Dog extends Animal {
	@Field(String)
	breed: string = "";
}

class Cat extends Animal {
	@Field(Boolean)
	indoor: boolean = true;
}

// { kind: "dog", breed: "Husky" } → Dog instance
// { kind: "cat", indoor: true } → Cat instance
const animal = Animal.import(json, "api.animal");
```

### Adapters

| Adapter              | Type                                   |
| :------------------- | :------------------------------------- |
| `Array.Of(T)`        | `T[]`                                  |
| `Set.Of(T)`          | `Set<T>` ↔ `T[]`                       |
| `Map.AsRecord(T)`    | `Map<string, T>` ↔ `Record<string, T>` |
| `Map.AsTuples(K, V)` | `Map<K, V>` ↔ `[K, V][]`               |
| `Optional.Of(T)`     | `T \| undefined`                       |
| `Nullable.Of(T)`     | `T \| null`                            |
| `Deferred(_ => T)`   | Circular references                    |
| `Enum.Of(E)`         | TypeScript `enum` or const-object enum |
| `Date.AsTimestamp`   | `Date` ↔ milliseconds (`number`)       |
| `Date.AsUnixSeconds` | `Date` ↔ Unix seconds (`number`)       |

## Web

### DOM Queries

Type-safe wrappers over `querySelector` — throw instead of returning `null`.

```typescript
import "adaptive-extender/web";

const loginForm = document.getElement(HTMLFormElement, "#login-form");
const requiredInputs = loginForm.getElements(HTMLInputElement, "input[required]");
const container = loginForm.getClosest(HTMLDivElement, ".wrapper");

// Async variants — useful with Shadow DOM
const canvas = await document.getElementAsync(HTMLCanvasElement, "#scene");
```

### Game Engines

Three update-loop engines for UI animation or game logic:

```typescript
import { FastEngine, StaticEngine } from "adaptive-extender/web";

// Fast — requestAnimationFrame based
const engine = new FastEngine({ launch: true });
engine.limit = 60;

engine.addEventListener("trigger", () => {
	const deltaTime = engine.delta; // seconds since last frame
	// update scene...
});

// Static — fixed fps via setTimeout
const fixedEngine = new StaticEngine({ launch: true });
fixedEngine.limit = 30;
```

### Storage (localStorage)

Type-safe storage with buffered access and auto-save. Use the factory methods on any `Storage` instance (`localStorage`, `sessionStorage`, or custom) to create typed cells.

```typescript
import { Model, Field } from "adaptive-extender/web";

class Settings extends Model {
	@Field(Boolean)
	darkMode: boolean = false;
	
	@Field(Number)
	volume: number = 1;
}

// BufferedCell — buffered read/write with debounced auto-save
const cell = localStorage.openBufferedCell("settings", Settings, new Settings());

const settings = cell.content;
settings.volume = 0.5;

// save() resolves true when persisted, false if cancelled (superseded or aborted), rejects only on serialization failure
const saved = await cell.save(); // save immediately
await cell.save(3000); // debounced — save after 3 seconds
// A pending save resolves false when superseded by a new call or cancelled by abort()
cell.reset(); // abort pending save and revert to initial state

// PortableCell — direct typed read/write without buffering
const typed = localStorage.openPortableCell("config", Settings, new Settings());
typed.content = settings;

// Cell — raw JSON storage
const raw = localStorage.openCell("flags", { debug: false });
raw.data = { debug: true };
```

### Promise Utilities

```typescript
await Promise.asTimeout(1000);

// AbortController is created and aborted automatically on completion
const result = await Promise.withSignal((signal, resolve, reject) => {
	buttonAccept.addEventListener("click", event => resolve(event.result), { signal });
	buttonDecline.addEventListener("click", event => reject(event.error), { signal });
});
```

## License

Apache-2.0
