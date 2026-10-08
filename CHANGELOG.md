## 1.1.2 (04.10.2026)
- `StaticEngine` now runs at a steady `limit` updates per second from the start. Before, its first tick was measured from page load, so it fired a burst of catch-up `trigger` events, and every catch-up moved its clock ahead by count² frames instead of count, so it then fell silent. An engine created 300 ms after load fired 36 triggers and then nothing for several seconds; it now delivers about 30 triggers per 250 ms at the default `limit` of `120`. It also schedules the next tick for when the next frame is due, instead of re-checking immediately.
- `StaticEngine.fps` and `delta` no longer drop to `0` and `Infinity` between ticks. At `limit = 30`, 1.1.0 reported `fps = 0` in about half of all samples.
- `Random.integer` is now uniform for ranges below or across zero. In 1.1.0, `integer(-5, -1)` never returned `-5` and returned `-0` instead, and `integer(-2, 2)` returned `0` twice as often and never `-2`. Seeded sequences for non-negative ranges are unchanged.
- `Random.number()` without arguments now returns a finite value across the whole number range, instead of always `Infinity`. Seeded results for every finite range are unchanged.
- `Random.case` now accepts one-shot iterables such as generators. Before, it read the input twice and threw "The cases must have at least 1 item". It is also 2.8× faster for 100 cases (1.33 µs → 469 ns).
- `Timespan.MIN_VALUE` and `Timespan.MAX_VALUE` no longer throw a `TypeError` when read through a subclass of `Timespan`.
- `Color.tryParse` and `Color.parse` are 18–54× faster for valid input (for example `"#ff8800"` 61.4 µs → 1.15 µs) and 360× faster for input that matches no format (99.8 µs → 276 ns), because a failed format no longer throws and catches an exception. Results are unchanged.
- `Map.AsTuples(…).import` is 1.5× faster (203 → 132 µs for 1000 entries) and `Set.Of(…).import` is 1.4× faster (83 → 59 µs for 1000 items), because they no longer build an intermediate array. `Array.prototype.resize` is 2.8× faster when growing (47.5 → 17.1 µs from 0 to 10 000 items). The `Timespan` component setters are 1.2× faster. Results are unchanged.
- The errors thrown by `Cell` serialization and by `PortableCell` schema validation and content restoration now carry the original error as `cause`.
- Corrected the `Engine.delta` documentation: it is measured in seconds, not milliseconds.

## 1.1.0 (03.10.2026)
- Added [database](./src/web/database.ts) module to the web and worker packages — `indexedDB.openStore<K>(database, store)` opens a `Store` of raw values under keys of type `K` — a `string` (the default), a `number` or a `Date`, one overload each — and `indexedDB.openPortableStore(database, store, model, key)` opens a `PortableStore` of model rows identified by the `key` property of the model, which must be a `string`, `number` or `Date` property. The database and the store are created on first use, and the connection steps aside when another context upgrades the database.
- Both stores provide `select()` (everything in key order — `[key, value]` pairs for `Store`, rows for `PortableStore`) and `select(key)` (one value or `null`), `insert` (rejects with a `ConstraintError` when the key exists), `update` (rejects with a `ReferenceError` when the record is missing), `delete`, and `count()`. `insert`, `update` and `delete` also take batches as any iterable (`[key, value]` pairs for `Store`), and every batch runs in one transaction, so it is stored completely or not at all.
- Added `KeysOf<T, V>` type to the core package — the keys of `T` whose property type is assignable to `V`.
- `Iterator.zip` allocates one tuple per step instead of three intermediate arrays, and stops at the first exhausted iterable. Results are unchanged.

## 1.0.8 (28.09.2026)
- `Number.prototype.clamp`, `lerp`, `mod`, `snap`, `insteadNaN`, `insteadInfinity`, and `insteadZero` are several times faster per call (for example `lerp` 9.3 → 1.6 ns, `clamp` 17.4 → 3.9 ns in V8) — the receiver is now unwrapped with unary `+` instead of a `this.valueOf()` call. Results are unchanged, including for boxed `Number` receivers. No public API change.

## 1.0.7 (17.09.2026)
- Updated development dependencies to clear a high-severity `nanoid` advisory ([GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8)) pulled in transitively via `postcss` — pinned via `overrides` in `package.json`. No public API change.

## 1.0.6 (24.07.2026)
- Added `Version.compare(left, right)` — orders two versions by major, then minor, then patch.
- `Version` is now a `PortableConstructor<Version, string>` — added `Version.import`/`Version.export`, so it can be used directly as a `@Field(Version, …)` type.
- Added a seeded `Random` constructor — `new Random(seed)` produces a deterministic sequence of values; `new Random()` continues to use the platform's native entropy. Throws if `seed` is not a finite number.

## 1.0.3 (01.07.2026)
- Hardened `Vector1D.tryParse`, `Vector2D.tryParse`, and `Vector3D.tryParse` against polynomial-time regex backtracking on adversarial input — token capture class tightened from `\S+` to `[^\s,()]+` so no component token can overlap a delimiter or terminator.
- Hardened `Casing.words` against polynomial-time regex backtracking on adversarial input — replaced the acronym alternative's positive lookahead `[A-Z]+(?=[A-Z][a-z])` (which backtracks across an entire uppercase run when no capitalised word follows) with the negative-lookahead form `[A-Z]+(?![a-z])` that backs off at most one character; `Casing.words` output is unchanged for all inputs.

## 1.0.2 (29.06.2026)
- Added [casing](./src/core/casing.ts) module to the core package — the `Casing` class with preset getters (`Casing.camel`, `pascal`, `snake`, `upperSnake`, `kebab`, `upperKebab`, `lower`, `upper`, `title`, `sentence`), plus `Casing.words(text)`, `casing.format(words)`, and `casing.convert(text)`.
- Added `String.prototype.toCamelCase`, `toPascalCase`, `toSnakeCase`, `toUpperSnakeCase`, `toKebabCase`, `toUpperKebabCase`, and `toSentenceCase` — convert a string to the named casing.
- Added `Iterator.range(min, max)` and `Iterator.zip(...iterables)` static methods.
- Added [stopwatch](./src/web/stopwatch.ts) module to the web and worker packages — the `Stopwatch` class accumulates elapsed time from an engine's `trigger` events (`elapsed`, `launched`, `reset()`).
- **Breaking:** `Vector`'s `map`, `filter`, `flatMap`, `forEach`, `some`, `every`, and `find` callbacks no longer receive the element index — remove the index parameter from those callbacks.
- **Breaking:** Removed `Array.zip`. Use the new `Iterator.zip(...iterables)` instead.
- **Breaking:** Removed the custom `Array.fromAsync` extension. Use the native `Array.fromAsync` (available at the ES2025 lib target).

## 0.12.0 (22.06.2026)
- `Model.import` is now an overlay — when a source key is absent, the field's class initializer value is kept (migration default). Absent keys with no initializer delegate to their type: `Optional.Of` yields `undefined`, strict types (`String`, `Number`, nested `Model`, …) throw as before.
- **Breaking:** `FieldOptions.fallback` removed from `@Field` options. Replace `@Field(type, { fallback: value })` with a field initializer: `field: T = value`.
- **Breaking:** `FieldOptions<I>` type parameter removed — the interface is now non-generic `FieldOptions`. Update any explicit `FieldOptions<T>` references to `FieldOptions`.

## 0.11.3 (22.06.2026)
- Added `DescendantOptions` interface — configure `@Descendant` via `{ discriminator }` options instead of a positional string.
- `Random.case()` now accepts any `Iterable<readonly [T, number]>` instead of `Readonly<Map<T, number>>`.
- **Breaking:** `@Descendant(type, "name")` positional discriminator string removed — use `@Descendant(type, { discriminator: "name" })` instead.

## 0.11.2 (21.06.2026)
- Added `Number.prototype.snap(step)` — snaps a number to the nearest multiple of `step`.
- Added `Array.Of(type)` portable adapter for typed arrays, as a `PortableConstructor` wrapper usable with `@Field`.
- Added `Set.Of(type)` portable adapter for typed sets, serialized as arrays.
- Added `Map.AsRecord(type)` portable adapter — converts `Map<string, T>` to and from a plain `Record<string, S>`.
- Added `Map.AsTuples(typeKey, typeValue)` portable adapter — converts `Map<K, V>` to and from `[K, V][]` tuple arrays.
- Added `Date.AsTimestamp` portable adapter — converts between `Date` instances and millisecond timestamps.
- Added `Date.AsUnixSeconds` portable adapter — converts between `Date` instances and Unix-second integers.
- Added `Optional.Of(type)` and `Optional.map(value, fn)` static methods on the `Optional` class.
- Added `Nullable.Of(type)` and `Nullable.map(value, fn)` static methods on the `Nullable` class.
- Added `Enum.Of(reference)` static method on the new `Enum` class.
- Added `Storage.openCell(key, initial)`, `Storage.openPortableCell(key, model, instance)`, and `Storage.openBufferedCell(key, model, instance)` factory methods on the `Storage` prototype.
- `BufferedCell.save()` returns `Promise<boolean>` — resolves `true` when persisted, `false` if cancelled (superseded or aborted); rejects only on serialization failure.
- **Breaking:** Renamed `Archive` → `Cell`, `ArchiveManager` → `PortableCell`, `ArchiveRepository` → `BufferedCell`. All three constructors now require an explicit `storage` as their first argument (e.g. `localStorage.openBufferedCell(key, model, instance)`) — the backend is no longer hardcoded to `localStorage`.
- **Breaking:** `Optional(type)` and `Nullable(type)` call syntax removed — use `Optional.Of(type)` and `Nullable.Of(type)` instead.
- **Breaking:** `ArrayOf(type)`, `SetOf(type)`, `RecordOf(type)`, `MapOf(K, V)` adapter functions removed — use `Array.Of(type)`, `Set.Of(type)`, `Map.AsRecord(type)`, `Map.AsTuples(K, V)` instead.
- **Breaking:** `EnumAs(reference)` function removed — use `Enum.Of(reference)` instead.
- **Breaking:** `Timestamp` and `UnixSeconds` portable constants removed — use `Date.AsTimestamp` and `Date.AsUnixSeconds` instead.
- **Breaking:** Removed `Reflect.mapNull`, `Reflect.mapUndefined`, and `Reflect.mapNullable` — use `Nullable.map(value, fn)` and `Optional.map(value, fn)` instead.
- **Breaking:** `@Field(type, "name")` positional string shorthand removed — use `@Field(type, { name: "name" })` options object instead.

## 0.10.5 (13.06.2026)
- Bugfix at [portable](./src/core/portable.ts).

## 0.10.3 (05.06.2026)
- Added `Function.empty` constant — a shared no-op function available via `Function.empty`.
- Added [function](./src/core/function.ts) module to the core package.
- Added [metadata-injector](./src/web/metadata-injector.ts) module to the web package. Provides `MetadataInjector.inject()` for one-shot injection of structured JSON-LD metadata, Open Graph meta tags, and `rel=me` links into the document head. Supports `Person`, `Application`, and `Organization` entity types.
- `Controller.catch()` now re-throws the error by default instead of silently ignoring it.

## 0.10.1 (02.06.2026)
- Vitest vulnerability fixed.

## 0.10.0 (20.05.2026)
- Added `adaptive-extender/worker` package for Web Worker environments. Includes [promise](./src/worker/promise.ts) and [engine](./src/worker/engine.ts) modules.

## 0.9.13 (06.04.2026)
- Added `Version` class for semantic versioning with `parse()`, `tryParse()` support.
- Added `BigInt` portable support via `BigInt.import()` and `BigInt.export()`.
- `ArchiveRepository.save()` is now `async` and returns `Promise<boolean>`. The promise resolves `true` when the save completes, `false` if cancelled (superseded by a subsequent call or aborted via `abort()`), and rejects only on serialization failure.
- `Promise.withSignal` now has a default type parameter `T = void`.
- Renamed `EnumFrom` adapter to `EnumAs`.

## 0.9.12 (03.04.2026)
- `Controller` now accepts typed arguments via the generic parameter `A`; arguments are forwarded from `launch()` to `run()`.
- Added `finally()` lifecycle hook to `Controller`, called unconditionally after `run()` and `catch()`.
- Added `EnumAs` adapter for portable enum fields, supporting both TypeScript `enum` declarations (numeric and string) and plain const-object enums.

## 0.9.11 (17.03.2026)
- Moved `environment` module from [node](./src/node/environment.ts) to [core](./src/core/environment.ts).
- Added `EnvironmentProvider` class for resolving environment variables.
- Added `RecordOf` and `MapOf` adapters for portable maps in [portable](./src/core/portable.ts) module.

## 0.9.9 (13.03.2026)
- Added `map.add`, `set.toggle` and `array.remove` extensions.

## 0.9.8 (10.03.2026)
- Improved `Optional`, `Nullable`, and `ArrayOf` adapters.
- Added the `SetOf` adapter.

## 0.9.5 (27.01.2026)
- Added the ability to specify custom keys (via `DiscriminatorKey`) and values (via `Descendant`) for discriminators.
- Fixed an issue where static fields could be marked for porting.
- Improved descriptions for certain porting-related errors.

## 0.9.4 (23.01.2026)
- Ported models no longer automatically receive a discriminator unless they are polymorphic descendants.
- Improved typing for `Model.export` and its descendants in `Descendant`, ensuring that data is handled as at least an `object` type.

## 0.9.2 (20.01.2026)
- Unified the `ImportableConstructor` and `ExportableConstructor` interfaces into `PortableConstructor`.
- Improved typing for object porting; decorators now possess better context inference.
- Moved `Constructor` to [global](./src/core/global.ts).
- The built-in `Date` class now complies with the `PortableConstructor` contract. Additionally, `Timestamp` and `UnixSeconds` adapters have been added for comprehensive `Date` porting.
- Added the `Any` adapter for porting arbitrary types.

## 0.9.0 (18.01.2026)
- Added automatic model porting using decorators in [portable](./src/core/portable.ts).
- Built-in types now implement the `PortableConstructor` interface.
- Improved `ArchiveManager` and `ArchiveRepository` classes for working with archives.

## 0.8.7 (09.12.2025)
- Added `Array.fromAsync` function.

## 0.8.5 (04.12.2025)
- Added [reflect](./src/core/reflect.ts), [environment](./src/node/environment.ts) modules.

## 0.8.0 (03.11.2025)
- Added missing documentation.
- Used `ImplementationError` errors for parts where implementation is missing.
- Added [controller](./src/core/controller.ts) module.

## 0.7.3 (20.10.2025)
- Added module [archive](./src/web/archive.ts).

## 0.6.1 (27.09.2025)
- Added modules [promise](./src/web/promise.ts), [engine](./src/web/engine.ts), [parent-node](./src/web/parent-node.ts), [element](./src/web/element.ts).

## 0.5.0 (19.09.2025)
- Added [timespan](./src/core/timespan.ts) module.
- Improved module separation.
- Optimized `Color.newBlack`.
- Added tests.
- Fixed multiple bugs.
- Improved documentation and function descriptions.
- Split many functions into overloads for optimal usage.

## 0.4.0 (26.08.2025)
- Improved package structure.
- Configured package for the latest stable ES version.
- Added modules [vector](./src/core/vector.ts), [vector-1](./src/core/vector-1.ts), [vector-2](./src/core/vector-2.ts), [vector-3](./src/core/vector-3.ts).

## 0.2.14 (20.08.2025)
- Added import support for `CommonJS` modules.

## 0.2.8 (16.08.2025)
- Fixed root import error.

## 0.2.7 (14.08.2025)
- Fixed alpha channel bug when converting color to string.

## 0.2.5 (14.08.2025)
*First stable version*
