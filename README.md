# Adaptive Extender

[![NPM Version](https://img.shields.io/npm/v/adaptive-extender.svg)](https://www.npmjs.com/package/adaptive-extender)
[![License](https://img.shields.io/npm/l/adaptive-extender.svg)](./LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/adaptive-extender)](https://bundlephobia.com/package/adaptive-extender)
[![TypeScript](https://img.shields.io/badge/types-included-3178c6.svg)](https://www.typescriptlang.org/)

The missing pieces of the JavaScript standard library — from `clamp` on a number to typed models that travel between JSON, environment variables, `localStorage` and IndexedDB. Strictly typed, no dependencies, built on itself.

[Change log](./CHANGELOG.md)

## Install

```bash
npm install adaptive-extender
```

| Entry point                | Runtime    | Adds                                                                                       |
| :------------------------- | :--------- | :----------------------------------------------------------------------------------------- |
| `adaptive-extender/core`   | Anywhere   | Native extensions, value objects, `Controller`, `EnvironmentProvider`, the portable system |
| `adaptive-extender/node`   | Node.js    | Everything from `core`                                                                     |
| `adaptive-extender/web`    | Browser    | `core` + DOM queries, engines, `Stopwatch`, storage cells, IndexedDB, `MetadataInjector`   |
| `adaptive-extender/worker` | Web Worker | `core` + engines, `Stopwatch`, IndexedDB                                                   |

Import your entry point once at the start of the program. The extensions are then active everywhere, and every class is exported from the same entry:

```typescript
import "adaptive-extender/web";
import { Model, Field, Timespan } from "adaptive-extender/web";
```

The decorators are standard (TC39) decorators — do not enable `experimentalDecorators`.

---

## 1. Single values

A volume slider that must stay in range, a carousel that wraps, a ratio that must not become `NaN`:

```typescript
volume = (volume + step).clamp(0, 1);
index = (index - 1).mod(slides.length); // -1 → last slide, true modulo for negatives

const x = angle.lerp(0, 360, 0, width); // remap one range onto another
const progress = loaded.lerp(0, total); // normalize into [0, 1]
const position = (37).snap(16); // → 32, nearest grid step

const ratio = (hits / shots).insteadNaN(0); // 0 / 0 → 0
const speed = (distance / time).insteadInfinity(0); // NaN or ±Infinity → 0
```

Text from a user, keys from an API, a deadline typed into a form:

```typescript
if (String.isWhitespace(query)) return;
const title = input.value.insteadWhitespace("Untitled");

"max width".toCamelCase(); // → "maxWidth"
"maxWidth".toSnakeCase(); // → "max_width"
"MaxWidth".toKebabCase(); // → "max-width"
"max-width".toUpperSnakeCase(); // → "MAX_WIDTH"
"hello world".toTitleCase(); // → "Hello World"
"istanbul".toLocalTitleCase("tr"); // → "İstanbul"

const deadline = new Date(input.value).insteadInvalid(null); // Date | null
```

## 2. Absence and errors

A value that must exist, a value that may not, and whatever was thrown:

```typescript
const user = ReferenceError.suppress(users.get(id), `User ${id} not found`); // throws ReferenceError on null / undefined

const label = Nullable.map(user.nickname, nickname => nickname.toUpperCase()); // string | null
const size = Optional.map(options.size, size => size.clamp(8, 72)); // number | undefined

try {
	await save();
} catch (reason) {
	const error = Error.from(reason); // a thrown string, undefined or object becomes an Error
	console.error(`${typename(reason)} thrown:\n${error}`); // Error toString includes the stack
}
```

`typename(value)` returns `"Null"`, `"String"`, `"User"`… `throw new ImplementationError()` marks code that is not written yet. `Function.empty` and `String.empty` are shared constants.

## 3. Collections and math

Loops without counters, two lists side by side, small edits without index juggling:

```typescript
for (const index of Iterator.range(0, 10)) { } // lazy, allocates nothing
const months = Array.range(1, 13); // [1 … 12]

for (const [name, score] of Iterator.zip(names, scores)) { } // stops at the shortest

items.swap(0, items.length - 1);
slots.resize(8, null); // grows with null, or truncates
cart.remove(product); // → true if it was there

selected.toggle(id); // like classList.toggle
selected.toggle(id, true); // force on
cache.add(key, value); // sets only if absent → false if the key exists
```

```typescript
const [whole, fraction] = Math.split(3.75); // [3, 0.75]
const diagonal = Math.sqrt(Math.sqpw(width) + Math.sqpw(height));
Math.toRadians(90); // π / 2
Math.meanArithmetic(...ratings);
Math.meanGeometric(...rates);
Math.meanHarmonic(...speeds);
```

## 4. Value objects

### Casing

Convert identifiers between conventions — even ones with acronyms:

```typescript
import { Casing } from "adaptive-extender/core";

Casing.words("XMLHttpRequest"); // → ["XML", "Http", "Request"]
Casing.snake.convert("XMLHttpRequest"); // → "xml_http_request"

const dotted = new Casing(word => word.toLowerCase(), word => word.toLowerCase(), ".");
dotted.convert("UserSettingsPanel"); // → "user.settings.panel"
```

Presets: `camel`, `pascal`, `snake`, `upperSnake`, `kebab`, `upperKebab`, `lower`, `upper`, `title`, `sentence`. The `String` casing methods from part 1 are these presets.

### Version

Sort releases correctly — a string sort puts `1.10.0` before `1.2.0`:

```typescript
import { Version } from "adaptive-extender/core";

const versions = ["1.10.0", "1.2.0", "1.9.3"].map(Version.parse).sort(Version.compare); // 1.2.0, 1.9.3, 1.10.0
const version = Version.tryParse(input.value); // Version | null
```

### Timespan

Durations without millisecond arithmetic:

```typescript
import { Timespan } from "adaptive-extender/core";

const timeout = Timespan.fromComponents(0, 30, 0); // 30 minutes
const backup = Timespan.parse("1.02:30:00.500"); // 1 day, 2 h 30 min 0.5 s

timeout.minutes = 90; // overflow carries: "0.01:30:00.000"
timeout.toString({ full: false }); // → "01:30:00"

if (Timespan.fromValue(performance.now()).valueOf() > timeout.valueOf()) { }
```

### Color

Theme colors that are edited, mixed and printed in any format:

```typescript
import { Color, ColorFormats } from "adaptive-extender/core";

const brand = Color.parse("#ff8800");
brand.hue += 180; // complementary — RGB follows
const hover = Color.mix(brand, Color.newWhite, 0.2);

hover.toString({ format: ColorFormats.hex, deep: false }); // "#rrggbb"
hover.toString({ format: ColorFormats.hsl }); // "hsla(…deg, …%, …%, 1)"
```

Also `grayscale`, `invert`, `sepia`, `rotate`, `saturate`, `illuminate`, `pass` (alpha), and named presets like `Color.newNavy`.

### Vector

Points and directions that parse, iterate and guard themselves:

```typescript
import { Vector2D, Vector3D } from "adaptive-extender/core";

const point = Vector2D.parse("(10, 20)");
const length = Math.hypot(...point); // vectors are iterable
const doubled = Array.from(point.map(value => value * 2)); // [20, 40]
const lifted = Vector3D.fromVector(point); // (10, 20, 0)
const safe = point.insteadInfinity(Vector2D.newZero);
```

`map`, `filter`, `reduce`, `every`, `some`, `find` work over the components.

### Random

Reproducible procedural content, weighted loot, shuffled decks:

```typescript
import { Random } from "adaptive-extender/core";

const random = Random.global;
const dice = new Random(42); // seeded — the same rolls every run

dice.integer(1, 6);
random.boolean(0.1); // true 10% of the time
random.item(quotes);
random.shuffle(deck);
random.subarray(players, 3);

const loot = random.case([["common", 70], ["rare", 25], ["legendary", 5]]);
```

Everything in this part stands on parts 1–3: `Color` clamps and wraps its channels with `clamp` and `mod`, `Version` clamps with `clamp`, `Timespan` uses `insteadZero`, `Random.shuffle` uses `swap`, and the string casings are `Casing`.

## 5. Async

Ask a promise about its state without blocking on it:

```typescript
const request = fetch("/api/profile");

if (await request.isSettled) { }
if (await request.isRejected) console.error(await request.reason);
const response = await request.value; // throws a clear error if it was rejected
```

Wait for one of several events, then clean up every listener (`web` and `worker`):

```typescript
await Promise.asTimeout(300);

const accepted = await Promise.withSignal<boolean>((signal, resolve) => {
	buttonAccept.addEventListener("click", event => resolve(true), { signal });
	buttonDecline.addEventListener("click", event => resolve(false), { signal });
}); // the signal aborts as soon as the promise settles — both listeners are gone
```

## 6. Program shape

One place for the work, the failure and the cleanup:

```typescript
import { Controller } from "adaptive-extender/core";

class Import extends Controller<[url: string]> {
	async run(url: string): Promise<void> {
		const response = await fetch(url);
		// ...
	}

	async catch(error: Error): Promise<void> {
		console.error(`Import failed:\n${error}`);
	}

	async finally(): Promise<void> {
		console.log("Import finished");
	}
}

await Import.launch("/data.json"); // arguments go to run()
```

Anything thrown in `run` reaches `catch` as an `Error` (through `Error.from`). Without a `catch` override, the error is rethrown after `finally`.

## 7. Browser and workers

### DOM queries

Typed queries that throw instead of returning `null` or the wrong element:

```typescript
const formLogin = document.getElement(HTMLFormElement, "#login");
const buttonSubmit = formLogin.getElement(HTMLButtonElement, "button[type=submit]");
const inputsRequired = formLogin.getElements(HTMLInputElement, "input[required]");
const sectionCard = buttonSubmit.getClosest(HTMLElement, "section.card");
```

A missing element is a `ReferenceError`, a wrong type is a `TypeError`. Works on `Document`, `Element` and `DocumentFragment` (shadow roots), with `…Async` variants.

### Engines

Animation and game loops with a real time step:

```typescript
import { FastEngine, Vector2D } from "adaptive-extender/web";

const ball = new Vector2D(0, 0);
const engine = new FastEngine({ launch: true });
engine.limit = 60;

engine.addEventListener("trigger", event => {
	ball.x += 120 * engine.delta; // delta in seconds — 120 px per second at any frame rate
});

buttonPause.addEventListener("click", event => engine.launched = !engine.launched);
```

| Engine          | Ticks with                                             | Available in    |
| :-------------- | :----------------------------------------------------- | :-------------- |
| `FastEngine`    | `requestAnimationFrame`, variable step                 | `web`           |
| `PreciseEngine` | `setTimeout`, variable step                            | `web`, `worker` |
| `StaticEngine`  | fixed step, `limit` updates per second (default `120`) | `web`, `worker` |

### Stopwatch

A timer that pauses with the game, not with the wall clock:

```typescript
import { Stopwatch, Timespan } from "adaptive-extender/web";

const stopwatch = new Stopwatch(engine);
stopwatch.launched = true; // false pauses, reset() zeroes

const elapsed = Timespan.fromValue(stopwatch.elapsed * 1000); // seconds → Timespan
```

## 8. The portable system

Everything so far works on values in memory. This part moves values in and out — from JSON, environment variables, `localStorage` and IndexedDB — without ever trusting what comes in.

### One contract

Every type that crosses a boundary has a static `import(source, name)` that validates and a static `export(instance)` that serializes. The built-ins already do:

```typescript
String.import("Ada", "user.name"); // → "Ada"
Number.import("42", "user.age"); // TypeError: Unable to import number from user.age due its String type
Date.import("2026-10-03T00:00:00.000Z", "user.joined"); // → Date
Date.export(new Date()); // → ISO string
BigInt.import("9007199254740993", "user.id"); // → 9007199254740993n, kept as a JSON-safe string
```

A type with this pair is a `PortableConstructor`. `String`, `Number`, `Boolean`, `BigInt`, `Date`, `Object`, `Array` and `Version` are. Everything below is built from them.

### Models

A response from an API becomes a real class instance, or fails with the exact path:

```typescript
import { Model, Field, Nullable, Optional } from "adaptive-extender/core";

class Author extends Model {
	@Field(String)
	name: string;
}

class Article extends Model {
	@Field(String)
	title: string;

	@Field(Author)
	author: Author;

	@Field(Array.Of(String))
	tags: string[];

	@Field(Nullable.Of(Date))
	published: Date | null;

	@Field(Optional.Of(String))
	subtitle?: string;
}

const article = Article.import(await response.json(), "article");
article.author instanceof Author; // true
article.published?.getFullYear(); // a real Date

const json = JSON.stringify(Article.export(article));
```

`{ "author": { "name": 7 }, … }` fails with `TypeError: Unable to import string from article.author.name due its Number type`. Fields without an initializer are required (the library itself builds with `strictPropertyInitialization: false`).

### Composing types

Adapters wrap any portable type, including each other and your models:

| Adapter              | In memory              | In JSON             |
| :------------------- | :--------------------- | :------------------ |
| `Array.Of(T)`        | `T[]`                  | `T[]`               |
| `Set.Of(T)`          | `Set<T>`               | `T[]`               |
| `Map.AsRecord(T)`    | `Map<string, T>`       | `Record<string, T>` |
| `Map.AsTuples(K, V)` | `Map<K, V>`            | `[K, V][]`          |
| `Optional.Of(T)`     | `T \| undefined`       | `T \| undefined`    |
| `Nullable.Of(T)`     | `T \| null`            | `T \| null`         |
| `Enum.Of(E)`         | `enum` or const object | its values          |
| `Date.AsTimestamp`   | `Date`                 | milliseconds        |
| `Date.AsUnixSeconds` | `Date`                 | Unix seconds        |
| `Deferred(_ => T)`   | `T`, resolved lazily   | `T`                 |
| `Any`                | anything               | anything, unchecked |

```typescript
enum Platform { web = "web", node = "node", worker = "worker" }

class Release extends Model {
	@Field(Version)
	version: Version;

	@Field(Optional.Of(Array.Of(Version)))
	previous?: Version[];

	@Field(Map.AsRecord(Date.AsTimestamp))
	builds: Map<string, Date>;

	@Field(Set.Of(Enum.Of(Platform)))
	platforms: Set<Platform>;
}
// { "version": "2.1.0", "previous": ["2.0.0"], "builds": { "linux": 1759449600000 }, "platforms": ["web", "worker"] }
```

### Data that evolves

The JSON key differs from your property, and older payloads lack a newer field:

```typescript
class Profile extends Model {
	@Field(String, { name: "display_name" })
	name: string;

	@Field(Date.AsUnixSeconds, { name: "created_at" })
	created: Date;

	@Field(Boolean)
	verified: boolean = false; // absent in old data → keeps false
}
```

`import` lays the source over a fresh instance: a missing key keeps the field's initializer. Without an initializer, a missing key is an error — unless the type is `Optional.Of`. The same rule lets data saved by an older version of your app load after you add a field.

### Your own types

Any class with the `import`/`export` pair joins the system. A point stored as the compact string `"(10, 20)"`, built from the pieces of part 4 and the contract above:

```typescript
import { Vector2D } from "adaptive-extender/core";

class Point extends Vector2D {
	constructor();
	constructor(x: number, y: number);
	constructor(x: number = 0, y: number = 0) {
		super(x, y);
	}

	static import(source: unknown, name: string): Point {
		const { x, y } = Vector2D.parse(String.import(source, name));
		return new Point(x, y);
	}

	static export(point: Point): string {
		return point.toString();
	}
}
```

`Point` now works with `@Field`, every adapter, and every destination below — exactly like `Version`, which is built the same way.

### Polymorphism

One list, several shapes — the right subclass is chosen from a discriminator:

```typescript
import { Model, Field, Descendant, DiscriminatorKey, Deferred } from "adaptive-extender/core";

@DiscriminatorKey("kind")
@Descendant(Deferred(_ => Circle), { discriminator: "circle" })
@Descendant(Deferred(_ => Label), { discriminator: "label" })
abstract class Shape extends Model {
	@Field(Point)
	center: Point;
}

class Circle extends Shape {
	@Field(Number)
	radius: number;
}

class Label extends Shape {
	@Field(String)
	text: string;
}

class Drawing extends Model {
	@Field(Array.Of(Shape))
	shapes: Shape[];
}

const drawing = Drawing.import({
	shapes: [
		{ kind: "circle", center: "(0, 0)", radius: 5 },
		{ kind: "label", center: "(10, 20)", text: "Hi" },
	],
}, "drawing"); // → [Circle, Label]
```

`Deferred` lets a class reference one declared later — or itself, for trees: `@Field(Array.Of(Deferred(_ => Folder))) children: Folder[]`. Without `@DiscriminatorKey` the key is `$type`; without `discriminator` the value is the class name. An unknown value fails with `Unknown 'square' discriminator for drawing.shapes[2]`.

### One contract, every destination

Each destination below takes **any** portable type — a `Model`, `Version`, your `Point`, `Array.Of(...)` — and validates on the way in.

**Environment variables** (`core`) — configuration that is typed, checked at startup and frozen:

```typescript
import { EnvironmentProvider } from "adaptive-extender/core";

class Config extends Model {
	@Field(String, { name: "DATABASE_URL" })
	database: string;

	@Field(Number, { name: "PORT" })
	port: number = 3000;

	@Field(Boolean, { name: "DEBUG" })
	debug: boolean = false;
}

const config = EnvironmentProvider.resolve(process.env, Config);
config.port; // a number — "8080" was parsed as JSON
```

A missing `DATABASE_URL` fails with `Unable to import string from Config.DATABASE_URL due its Undefined type`. Values are JSON-parsed first, so a `String` field holding digits must be quoted (`TOKEN='"123"'`).

**`localStorage` / `sessionStorage`** (`web`) — user settings that survive reloads and app updates:

```typescript
enum Theme { light = "light", dark = "dark", system = "system" }

class Settings extends Model {
	@Field(Number)
	volume: number = 0.8;

	@Field(Enum.Of(Theme))
	theme: Theme = Theme.system;
}

const settings = localStorage.openBufferedCell("settings", Settings, new Settings());

inputVolume.addEventListener("input", (event) => {
	settings.content.volume = inputVolume.valueAsNumber.clamp(0, 1);
	settings.save(500); // debounced — only the last change within 500 ms is written
});
```

`save()` resolves `true` once written and `false` when a newer save or `abort()` replaced it. `reset()` restores the initial instance. Leaving the page with a save pending asks for confirmation. For direct access without a buffer, `openPortableCell(key, type, initial)` reads and writes `content` on every access, and `openCell(key, initial)` stores raw JSON. Any portable type fits: `localStorage.openPortableCell("seen", Version, new Version())`.

**IndexedDB** (`web` and `worker`) — collections of records, queried by key:

```typescript
class Note extends Model {
	@Field(String)
	id: string;

	@Field(String)
	text: string;

	@Field(Date)
	edited: Date;
}

const notes = indexedDB.openPortableStore("Notebook", "Notes", Note, "id");

await notes.insert(note); // ConstraintError if the id exists
await notes.update(note); // ReferenceError if it does not
await notes.select("a1"); // a real Note, or null
await notes.select(); // every Note, in key order
await notes.delete(["a1", "b2"]);
await notes.insert(imported); // a batch is one transaction — all or nothing
await notes.count();
```

For files, blobs and binary data, a raw store keeps values by structured clone:

```typescript
const covers = indexedDB.openStore("Library", "Covers"); // string keys
await covers.insert(book.id, file);
const cover = await covers.select(book.id); // unknown — narrow with instanceof Blob

const scores: Store<number> = indexedDB.openStore("Game", "Scores"); // number keys
await scores.insert([[1, 9000], [2, 7500]]);
```

The database and the store are created on first use, a new store in an existing database upgrades it automatically, and the connection steps aside when another tab upgrades it. Keys must be strings, finite numbers or valid dates; the key property of `openPortableStore` is checked at compile time.

### The library uses it too

Search-engine and social metadata for a page in one call (`web`):

```typescript
import { MetadataInjector } from "adaptive-extender/web";

MetadataInjector.inject({
	type: "Person",
	name: "Jane Doe",
	webpage: new URL("https://janedoe.dev"),
	preview: new URL("https://janedoe.dev/avatar.jpg"),
	description: "Developer.",
	associations: [new URL("https://github.com/janedoe")],
	job: "Software Engineer",
	knowledge: ["TypeScript", "Rust"],
});
```

It writes a schema.org `application/ld+json` script, `description` / `author` / `keywords` meta tags, Open Graph `og:*` tags and a `rel="me"` link per association. `"Application"` (`category`, `os`, `version`) and `"Organization"` (`logo`, `email`, `foundation`) are supported too, and repeated calls are ignored. Inside, it is the system from this part: a polymorphic `Model` keyed on `@type`, `Deferred` descendants, a URL adapter, and `Optional.Of(Array.Of(...))` fields.

## License

Apache-2.0
