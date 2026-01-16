"use strict";

export * from "./global.js";
export * from "./primitives.js";
export * from "./number.js";
export * from "./string.js";
export * from "./boolean.js";
export * from "./date.js";
export * from "./math.js";
export * from "./array.js";
export * from "./object.js";
export * from "./reflect.js";
export * from "./portable.js";
export * from "./error.js";
export * from "./promise.js";
export * from "./random.js";
export * from "./color.js";
export * from "./vector.js";
export * from "./vector-1.js";
export * from "./vector-2.js";
export * from "./vector-3.js";
export * from "./timespan.js";
export * from "./engine.js";
export * from "./controller.js";

import { Portable, PolymorphicBase, Scheme } from "./decorators.js";
import { ArrayOf, Nullable, Optional, Deferred } from "./infrastructure.js";
import { Activity } from "./activity.js";

// Пример сложной вложенности для демонстрации
@Portable
class Artist {
	@Scheme(String) name: string;

	// Циклическая зависимость: Артист может иметь похожих артистов
	@Scheme(Optional(ArrayOf(Deferred(() => Artist))))
	similar: Artist[] | undefined;
}

@Portable
@PolymorphicBase(SpotifyLikeActivity)
export abstract class SpotifyActivity extends Activity {
	// ... конструктор ...
}

@Portable
export class SpotifyLikeActivity extends SpotifyActivity {

	@Scheme(String) // schemeKey = "title"
	title: string;

	// Рекурсия: ArrayOf вызывает String.import
	@Scheme(ArrayOf(String))
	artists: string[];

	// Комбинация: Nullable вызывает String.import
	@Scheme(Nullable(String))
	cover: string | null;

	@Scheme(String)
	url: string;

	// Пример рекурсивного микса:
	// Опциональный массив нуллабельных строк
	@Scheme(Optional(ArrayOf(Nullable(String))), "extra_tags")
	tags: (string | null)[] | undefined;
}
