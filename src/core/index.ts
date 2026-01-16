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

// feature.ts
import { Portable, PolymorphicBase, Scheme } from "./decorators.js";
import { StringConverter, ArrayOf, Nullable } from "./infrastructure.js";

// --- Абстрактный класс ---

// Обратите внимание: Abstract классы тоже помечаем @Portable,
// чтобы они получили статический метод import, который будет работать как диспетчер.
@Portable
@PolymorphicBase(SpotifyLikeActivity) // Здесь регистрируем наследников
export abstract class SpotifyActivity extends Activity {
	// Если в Activity есть поля, которые нужно сериализовать, 
	// добавьте @Scheme и туда, или переопределите их здесь с декоратором.

	constructor(platform: string, timestamp: Date) {
		super(platform, timestamp);
		if (new.target === SpotifyActivity) {
			throw new TypeError("Unable to create an instance of an abstract class");
		}
	}

	// Abstract класс не требует реализации import/export вручную,
	// декоратор @PolymorphicBase сделает всю работу.
}

// --- Конкретный класс ---

@Portable
export class SpotifyLikeActivity extends SpotifyActivity {
	@Scheme(StringConverter, "title")
	title: string;

	@Scheme(ArrayOf(StringConverter), "artists") // "artists" совпадает, второй аргумент можно опустить, но для явности оставим
	artists: string[];

	@Scheme(Nullable(StringConverter), "cover")
	cover: string | null;

	@Scheme(StringConverter, "url")
	url: string;
}
