# Глава 3.7: Стили, шрифты и изображения

[Главная](../README.md) | [<< Назад: Обработка событий](06-event-handling.md) | **Стили, шрифты и изображения** | [Далее: Диалоги и модальные окна >>](08-dialogs-modals.md)

---

Эта глава охватывает визуальные строительные блоки UI DayZ: предопределённые стили, использование шрифтов, размеры текста, виджеты изображений с ссылками на imageset-ы и создание пользовательских imageset-ов для вашего мода.

---

## Стили

Стили — это предопределённые визуальные оформления, которые можно применять к виджетам через атрибут `style` в файлах layout. Они управляют отрисовкой фона, рамками и общим видом без необходимости ручной настройки цветов и изображений.

### Распространённые встроенные стили

| Имя стиля | Описание |
|---|---|
| `blank` | Без визуала — полностью прозрачный фон |
| `Empty` | Без отрисовки фона |
| `Default` | Стиль кнопки/виджета по умолчанию со стандартным оформлением DayZ |
| `Colorable` | Стиль, который можно тонировать через `SetColor()` |
| `rover_sim_colorable` | Стиль цветной панели, часто используется для фонов |
| `rover_sim_black` | Тёмный фон панели |
| `rover_sim_black_2` | Более тёмный вариант панели |
| `Outline_1px_BlackBackground` | Обводка 1 пиксель с чёрным фоном |
| `OutlineFilled` | Обводка с заполненным интерьером |
| `DayZDefaultPanelRight` | Стиль правой панели DayZ по умолчанию |
| `DayZNormal` | Нормальный стиль текста/виджета DayZ |
| `MenuDefault` | Стандартный стиль кнопки меню |

### Использование стилей в layout

```
ButtonWidgetClass MyButton {
 style Default
 text "Click Me"
 size 120 30
 hexactsize 1
 vexactsize 1
}

PanelWidgetClass Background {
 style rover_sim_colorable
 color 0.2 0.3 0.5 0.9
 size 1 1
}
```

### Паттерн стиль + цвет

Стили `Colorable` и `rover_sim_colorable` предназначены для тонирования. Задайте атрибут `color` в layout или вызовите `SetColor()` в коде:

```
PanelWidgetClass TitleBar {
 style rover_sim_colorable
 color 0.4196 0.6471 1 0.9412
 size 1 30
 hexactsize 0
 vexactsize 1
}
```

```c
// Изменить цвет во время выполнения
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### Стили в профессиональных модах

Диалоги DabsFramework используют `Outline_1px_BlackBackground` для контейнеров диалогов:

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

Colorful UI активно использует `rover_sim_colorable` для тематических панелей, где цвет управляется централизованным менеджером тем.

---

## Шрифты

DayZ включает несколько встроенных шрифтов. Пути шрифтов указываются в атрибуте `font`.

### Пути встроенных шрифтов

| Путь шрифта | Описание |
|---|---|
| `"gui/fonts/Metron"` | Стандартный шрифт UI |
| `"gui/fonts/Metron28"` | Стандартный шрифт, вариант 28pt |
| `"gui/fonts/Metron-Bold"` | Жирный вариант |
| `"gui/fonts/Metron-Bold58"` | Жирный вариант 58pt |
| `"gui/fonts/sdf_MetronBook24"` | SDF-шрифт (Signed Distance Field) — чёткий при любом размере |

### Использование шрифтов в layout

```
TextWidgetClass Title {
 text "Mission Briefing"
 font "gui/fonts/Metron-Bold"
 "text halign" center
 "text valign" center
}

TextWidgetClass Body {
 text "Objective: Secure the airfield"
 font "gui/fonts/Metron"
}
```

### Использование шрифтов в коде

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// Шрифт задаётся в layout, его нельзя изменить в рантайме через скрипт
```

### SDF-шрифты

SDF-шрифты (Signed Distance Field) отрисовываются чётко при любом уровне масштабирования, что делает их идеальными для элементов UI, которые могут отображаться при различных размерах. Шрифт `sdf_MetronBook24` — лучший выбор для текста, который должен выглядеть резко при различных настройках масштаба UI.

---

## Размер текста: «exact text» и пропорциональный

Текстовые виджеты DayZ поддерживают два режима размера, управляемых атрибутом `"exact text"`:

### Пропорциональный текст (по умолчанию)

При `"exact text" 0` (по умолчанию) размер шрифта определяется высотой виджета. Текст масштабируется вместе с виджетом. Это поведение по умолчанию.

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "I scale with my parent"
}
```

### Точный размер текста

При `"exact text" 1` размер шрифта — фиксированное пиксельное значение, задаваемое через `"exact text size"`:

```
TextWidgetClass FixedText {
 size 1 30
 hexactsize 0
 vexactsize 1
 text "I am always 16 pixels"
 "exact text" 1
 "exact text size" 16
}
```

### Что использовать?

| Сценарий | Рекомендация |
|---|---|
| Элементы HUD, масштабируемые с экраном | Пропорциональный (по умолчанию) |
| Текст меню определённого размера | `"exact text" 1` с `"exact text size"` |
| Текст, который должен соответствовать определённому пиксельному размеру шрифта | `"exact text" 1` |
| Текст внутри spacer-ов/сеток | Часто пропорциональный, определяется высотой ячейки |

### Атрибуты размера текста

| Атрибут | Эффект |
|---|---|
| `"size to text h" 1` | Ширина виджета подстраивается под текст |
| `"size to text v" 1` | Высота виджета подстраивается под текст |
| `"text sharpness"` | Значение float, управляющее резкостью отрисовки |
| `wrap 1` | Включить перенос слов для текста, превышающего ширину виджета |

Атрибуты `"size to text"` полезны для меток и тегов, где виджет должен быть точно такого размера, как его текстовое содержимое.

---

## Выравнивание текста

Управляйте расположением текста внутри виджета с помощью атрибутов выравнивания:

```
TextWidgetClass CenteredLabel {
 text "Centered"
 "text halign" center
 "text valign" center
}
```

| Атрибут | Значения | Эффект |
|---|---|---|
| `"text halign"` | `left`, `center`, `right` | Горизонтальная позиция текста внутри виджета |
| `"text valign"` | `top`, `center`, `bottom` | Вертикальная позиция текста внутри виджета |

---

## Обводка текста

Добавьте обводку к тексту для читаемости на загруженных фонах:

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // обводка 1px чёрная

int size = tw.GetOutlineSize();           // Прочитать размер обводки
int color = tw.GetOutlineColor();         // Прочитать цвет обводки (ARGB)
```

---

## ImageWidget

`ImageWidget` отображает изображения из двух источников: ссылки на imageset-ы и динамически загружаемые файлы.

### Ссылки на imageset-ы

Самый распространённый способ отображения изображений. Imageset — это атлас спрайтов — один файл текстуры с несколькими именованными подизображениями.

В файле layout:

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

Формат: `"set:<имя_imageset> image:<имя_изображения>"`.

Распространённые ванильные imageset-ы и изображения:

```
"set:dayz_gui image:icon_pin"           -- Иконка маркера на карте
"set:dayz_gui image:icon_refresh"       -- Иконка обновления
"set:dayz_gui image:icon_x"            -- Иконка закрытия/крестик
"set:dayz_gui image:icon_missing"      -- Иконка предупреждения/отсутствия
"set:dayz_gui image:iconHealth0"       -- Иконка здоровья/плюс
"set:dayz_gui image:DayZLogo"          -- Логотип DayZ
"set:dayz_gui image:Expand"            -- Стрелка разворачивания
"set:dayz_gui image:Gradient"          -- Полоса градиента
```

### Множественные слоты изображений

Один `ImageWidget` может содержать несколько изображений в разных слотах (`image0`, `image1` и т.д.) и переключаться между ними:

```
ImageWidgetClass StatusIcon {
 image0 "set:dayz_gui image:icon_missing"
 image1 "set:dayz_gui image:iconHealth0"
}
```

```c
ImageWidget icon;
icon.SetImage(0);    // Показать image0 (иконка отсутствия)
icon.SetImage(1);    // Показать image1 (иконка здоровья)
```

### Загрузка изображений из файлов

Загрузка изображений динамически во время выполнения:

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

Путь указывается относительно корневого каталога мода. Поддерживаемые форматы включают `.edds`, `.paa` и `.tga` (хотя `.edds` — стандарт для DayZ).

### Режимы смешивания изображений

Атрибут `mode` управляет тем, как изображение смешивается с тем, что находится за ним:

| Режим | Эффект |
|---|---|
| `blend` | Стандартное альфа-смешивание (самый распространённый) |
| `additive` | Цвета складываются (эффекты свечения) |
| `stretch` | Растягивание для заполнения без смешивания |

### Переходы с маской изображения

`ImageWidget` поддерживает переходы раскрытия на основе маски:

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 50% раскрыто
```

Это полезно для полос загрузки, отображения здоровья и анимаций раскрытия.

---

## Формат ImageSet

Файл imageset (`.imageset`) определяет именованные регионы внутри текстуры атласа спрайтов. DayZ поддерживает два формата imageset.

### Нативный формат DayZ

Используется ванильным DayZ и большинством модов. Это **не** XML — используется тот же формат с фигурными скобками, что и у файлов layout.

```
ImageSetClass {
 Name "my_mod_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_sword {
   Name "icon_sword"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_shield {
   Name "icon_shield"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_potion {
   Name "icon_potion"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

Ключевые поля:
- `Name` — Имя imageset-а (используется в `"set:<имя>"`)
- `RefSize` — Эталонный размер исходной текстуры в пикселях (ширина высота)
- `path` — Путь к файлу текстуры (`.edds`)
- `mpix` — Уровень мипмэп (0 = стандартное разрешение, 1 = разрешение 2x)
- Каждая запись изображения определяет `Name`, `Pos` (x y в пикселях) и `Size` (ширина высота в пикселях)

### XML-формат

Некоторые моды (включая некоторые модули DayZ Expansion) используют формат imageset на основе XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
  <image name="icon_potion" pos="128 0" size="64 64" />
</imageset>
```

Оба формата делают одно и то же. Нативный формат используется ванильным DayZ; XML-формат иногда проще читать и редактировать вручную.

---

## Создание пользовательских imageset-ов

Чтобы создать собственный imageset для мода:

### Шаг 1: Создание текстуры атласа спрайтов

Используйте графический редактор (Photoshop, GIMP и т.д.) для создания одной текстуры, содержащей все ваши иконки/изображения, расположенные на сетке. Типичные размеры: 256x256, 512x512 или 1024x1024 пикселей.

Сохраните как `.tga`, затем конвертируйте в `.edds` с помощью DayZ Tools (TexView2 или ImageTool).

### Шаг 2: Создание файла imageset

Создайте файл `.imageset`, который сопоставляет именованные регионы с позициями в текстуре:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyFramework/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_mission {
   Name "icon_mission"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_waypoint {
   Name "icon_waypoint"
   Pos 64 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Шаг 3: Регистрация в config.cpp

В `config.cpp` вашего мода зарегистрируйте imageset в `CfgMods`:

```cpp
class CfgMods
{
    class MyMod
    {
        // ... другие поля ...
        class defs
        {
            class imageSets
            {
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... скриптовые модули ...
        };
    };
};
```

### Шаг 4: Использование в layout и коде

В файлах layout:

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

В коде:

```c
ImageWidget icon;
// Изображения из зарегистрированных imageset-ов доступны по set:имя image:имя
// Дополнительный шаг загрузки после регистрации в config.cpp не нужен
```

---

## Паттерн цветовой темы

Профессиональные моды централизуют определения цветов в классе темы, а затем применяют цвета во время выполнения. Это позволяет легко переоформить весь UI, изменив один файл.

```c
class UIColor
{
    static int White()        { return ARGB(255, 255, 255, 255); }
    static int Black()        { return ARGB(255, 0, 0, 0); }
    static int Primary()      { return ARGB(255, 75, 119, 190); }
    static int Secondary()    { return ARGB(255, 60, 60, 60); }
    static int Accent()       { return ARGB(255, 100, 200, 100); }
    static int Danger()       { return ARGB(255, 200, 50, 50); }
    static int Transparent()  { return ARGB(1, 0, 0, 0); }
    static int SemiBlack()    { return ARGB(180, 0, 0, 0); }
}
```

Применение в коде:

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

Этот паттерн (используемый Colorful UI, MyMod и другими) означает, что для изменения всей цветовой схемы UI нужно отредактировать только класс темы.

---

## Сводка визуальных атрибутов по типам виджетов

| Виджет | Ключевые визуальные атрибуты |
|---|---|
| Любой виджет | `color`, `visible`, `style`, `priority`, `inheritalpha` |
| TextWidget | `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `wrap` |
| ImageWidget | `image0`, `mode`, `"src alpha"`, `stretch`, `"flip u"`, `"flip v"` |
| ButtonWidget | `text`, `style`, `switch toggle` |
| PanelWidget | `color`, `style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## Лучшие практики

1. **Используйте ссылки на imageset-ы** вместо прямых путей к файлам, где возможно — imageset-ы более эффективно батчатся движком.

2. **Используйте SDF-шрифты** (`sdf_MetronBook24`) для текста, который должен выглядеть резко при любом масштабе.

3. **Используйте `"exact text" 1`** для текста UI с определёнными пиксельными размерами; используйте пропорциональный текст для элементов HUD, которые должны масштабироваться.

4. **Централизуйте цвета** в классе темы, а не разбрасывайте значения ARGB по всему коду.

5. **Устанавливайте `"src alpha" 1`** на виджетах изображений для правильной прозрачности.

6. **Регистрируйте пользовательские imageset-ы** в `config.cpp`, чтобы они были доступны глобально без ручной загрузки.

7. **Держите атласы спрайтов разумного размера** — 512x512 или 1024x1024 типично. Текстуры большего размера тратят память, если большая часть пространства пуста.

---

## Следующие шаги

- [3.8 Диалоги и модальные окна](08-dialogs-modals.md) — Всплывающие окна, запросы подтверждения и панели наложения
- [3.1 Типы виджетов](01-widget-types.md) — Обзор полного каталога виджетов
- [3.6 Обработка событий](06-event-handling.md) — Сделайте ваши стилизованные виджеты интерактивными

---

## Теория и практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| SDF-шрифты масштабируются до любого размера | `sdf_MetronBook24` чёткий при всех размерах | Верно для размеров выше ~10px. Ниже этого SDF-шрифты могут выглядеть размыто по сравнению с растровыми шрифтами при их нативном размере |
| `"exact text" 1` даёт пиксельно-точный размер | Шрифт отрисовывается с точно указанным пиксельным размером | DayZ применяет внутреннее масштабирование, поэтому `"exact text size" 16` может отрисовываться слегка по-разному на разных разрешениях. Тестируйте на 1080p и 1440p |
| Встроенные стили покрывают все потребности | `Default`, `blank`, `Colorable` достаточно | Большинство профессиональных модов определяют собственные файлы `.styles`, потому что встроенные стили имеют ограниченное визуальное разнообразие |
| XML и нативный форматы imageset эквивалентны | Оба определяют регионы спрайтов | Нативный формат с фигурными скобками обрабатывается движком быстрее всего. XML-формат работает, но добавляет шаг парсинга; используйте нативный формат для продакшна |
| `SetColor()` переопределяет цвет layout | Цвет времени выполнения заменяет значение layout | `SetColor()` тонирует существующий визуал виджета. На стилизованных виджетах тонирование умножается на базовый цвет стиля, давая неожиданные результаты |

---

## Совместимость и влияние

- **Мультимод:** Имена стилей глобальны. Если два мода регистрируют файл `.styles` с одинаковым именем стиля, побеждает последний загруженный мод. Добавляйте к пользовательским именам стилей идентификатор вашего мода (например, `MyMod_PanelDark`).
- **Производительность:** Imageset-ы загружаются один раз в память GPU при запуске. Добавление больших атласов спрайтов (2048x2048+) увеличивает использование VRAM. Держите атласы на 512x512 или 1024x1024 и разделяйте на несколько imageset-ов при необходимости.
