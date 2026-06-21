## 0.11.1 (21.06.2026)
- Added `Array.Of(type)` portable adapter for typed arrays, alongside the existing `Array.import`/`Array.export`.
- Added `Set.Of(type)` portable adapter for typed sets.
- Added `Map.AsRecord(type)` and `Map.AsTuples(typeKey, typeValue)` portable adapters (moved from a separate module into [map](./src/core/map.ts)).
- Added `Date.AsTimestamp` and `Date.AsUnixSeconds` portable adapters converting `Date` to millisecond and Unix-second numbers respectively.
- Added `Number.prototype.snap(step)` — snaps a number to the nearest multiple of the given step.
- **Breaking:** Removed `Reflect.mapNull`, `Reflect.mapUndefined`, and `Reflect.mapNullable`. Use `Nullable.map`, `Optional.map` from the portable module instead.
- **Breaking:** Renamed `Archive`/`ArchiveManager`/`ArchiveRepository` to `Cell`/`PortableCell`/`BufferedCell`. Construction is now done via `Storage` factory methods (`localStorage.openCell`, `localStorage.openPortableCell`, `localStorage.openBufferedCell`) — the storage backend is no longer hardcoded to `localStorage`.
- **Breaking:** `@Field` decorator no longer accepts a positional string as the second argument. Use `{ name: "..." }` options object: `@Field(String, { name: "fieldName" })`.
- `PortableCell.save()` returns `Promise<boolean>` — resolves `true` when persisted, `false` if cancelled (superseded or aborted); rejects only on serialization failure.

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
