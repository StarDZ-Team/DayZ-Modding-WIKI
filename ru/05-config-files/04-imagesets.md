# Глава 5.4: Формат ImageSet

[Главная](../README.md) | [<< Предыдущая: Credits.json](03-credits-json.md) | **Формат ImageSet** | [Следующая: Серверные конфигурационные файлы >>](05-server-configs.md)

---

## Содержание

- [Обзор](#обзор)
- [Как работают ImageSet](#как-работают-imageset)
- [Нативный формат ImageSet в DayZ](#нативный-формат-imageset-в-dayz)
- [XML-формат ImageSet](#xml-формат-imageset)
- [Регистрация ImageSet в config.cpp](#регистрация-imageset-в-configcpp)
- [Ссылки на изображения в макетах](#ссылки-на-изображения-в-макетах)
- [Ссылки на изображения в скриптах](#ссылки-на-изображения-в-скриптах)
- [Флаги изображений](#флаги-изображений)
- [Многоразрешённые текстуры](#многоразрешённые-текстуры)
- [Создание пользовательских наборов иконок](#создание-пользовательских-наборов-иконок)
- [Паттерн интеграции Font Awesome](#паттерн-интеграции-font-awesome)
- [Реальные примеры](#реальные-примеры)
- [Распространённые ошибки](#распространённые-ошибки)

---

## Обзор

Атлас текстур --- это одно большое изображение (обычно в формате `.edds`), содержащее множество маленьких иконок, расположенных в сетке или произвольным образом. Файл imageset сопоставляет человекочитаемые имена с прямоугольными областями внутри этого атласа.

Например, текстура 1024x1024 может содержать 64 иконки размером 64x64 пикселей каждая. Файл imageset говорит: «иконка с именем `arrow_down` находится в позиции (128, 64) и имеет размер 64x64 пикселей». Ваши файлы макетов и скрипты ссылаются на `arrow_down` по имени, а движок извлекает нужный под-прямоугольник из атласа при рендеринге.

Этот подход эффективен: одна загрузка текстуры GPU обслуживает все иконки, сокращая количество вызовов отрисовки и расход памяти.

---

## Как работают ImageSet

Поток данных:

1. **Атлас текстур** (файл `.edds`) --- одно изображение, содержащее все иконки
2. **Определение ImageSet** (файл `.imageset`) --- сопоставляет имена с областями в атласе
3. **Регистрация в config.cpp** --- указывает движку загрузить imageset при запуске
4. **Ссылка в макете/скрипте** --- использует синтаксис `set:имя image:имяИконки` для рендеринга конкретной иконки

После регистрации любой виджет в любом файле макета может ссылаться на любое изображение из набора по имени.

---

## Нативный формат ImageSet в DayZ

Нативный формат использует классовый синтаксис движка Enfusion (аналогичный config.cpp). Это формат, используемый ванильной игрой и большинством устоявшихся модов.

### Структура

```
ImageSetClass {
 Name "my_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_name {
   Name "icon_name"
   Pos 0 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Поля верхнего уровня

| Поле | Описание |
|------|----------|
| `Name` | Имя набора. Используется в части `set:` ссылок на изображения. Должно быть уникальным среди всех загруженных модов. |
| `RefSize` | Эталонные размеры текстуры (ширина высота). Используется для маппинга координат. |
| `Textures` | Содержит одну или несколько записей `ImageSetTextureClass` для разных уровней разрешения (mip). |

### Поля записи текстуры

| Поле | Описание |
|------|----------|
| `mpix` | Минимальный уровень пикселей (mip-уровень). `0` = самое низкое разрешение, `1` = стандартное разрешение. |
| `path` | Путь к файлу текстуры `.edds`, относительно корня мода. Может использовать формат GUID Enfusion (`{GUID}путь`) или простые относительные пути. |

### Поля записи изображения

Каждое изображение --- это `ImageSetDefClass` внутри блока `Images`:

| Поле | Описание |
|------|----------|
| Имя класса | Должно совпадать с полем `Name` (используется для поиска движком) |
| `Name` | Идентификатор изображения. Используется в части `image:` ссылок. |
| `Pos` | Позиция верхнего левого угла в атласе (x y), в пикселях |
| `Size` | Размеры (ширина высота), в пикселях |
| `Flags` | Флаги поведения тайлинга (см. [Флаги изображений](#флаги-изображений)) |

### Полный пример (ванильный DayZ)

```
ImageSetClass {
 Name "dayz_gui"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "{534691EE0479871C}Gui/imagesets/dayz_gui.edds"
  }
  ImageSetTextureClass {
   mpix 1
   path "{C139E49FD0ECAF9E}Gui/imagesets/dayz_gui@2x.edds"
  }
 }
 Images {
  ImageSetDefClass Gradient {
   Name "Gradient"
   Pos 0 317
   Size 75 5
   Flags ISVerticalTile
  }
  ImageSetDefClass Expand {
   Name "Expand"
   Pos 121 257
   Size 20 20
   Flags 0
  }
 }
}
```

---

## XML-формат ImageSet

Существует альтернативный формат на основе XML, используемый некоторыми модами. Он проще, но предлагает меньше возможностей (нет поддержки многоразрешённости).

### Структура

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="MyMod/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
</imageset>
```

### XML-атрибуты

**Элемент `<imageset>`:**

| Атрибут | Описание |
|---------|----------|
| `name` | Имя набора (эквивалент нативного `Name`) |
| `file` | Путь к файлу текстуры (эквивалент нативного `path`) |

**Элемент `<image>`:**

| Атрибут | Описание |
|---------|----------|
| `name` | Идентификатор изображения |
| `pos` | Позиция верхнего левого угла как `"x y"` |
| `size` | Размеры как `"ширина высота"` |

### Когда какой формат использовать

| Возможность | Нативный формат | XML-формат |
|-------------|-----------------|------------|
| Многоразрешённость (mip-уровни) | Да | Нет |
| Флаги тайлинга | Да | Нет |
| GUID-пути Enfusion | Да | Да |
| Простота | Ниже | Выше |
| Используется ванильным DayZ | Да | Нет |
| Используется Expansion, MyMod, VPP | Да | Иногда |

**Рекомендация:** Используйте нативный формат для продакшн-модов. Используйте XML-формат для быстрого прототипирования или простых наборов иконок, которым не нужен тайлинг или поддержка многоразрешённости.

---

## Регистрация ImageSet в config.cpp

Файлы ImageSet должны быть зарегистрированы в `config.cpp` вашего мода в блоке `CfgMods` > `class defs` > `class imageSets`. Без этой регистрации движок никогда не загрузит imageset, и все ссылки на изображения будут молча неуспешными.

### Синтаксис

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
                files[] =
                {
                    "MyMod/GUI/imagesets/my_icons.imageset",
                    "MyMod/GUI/imagesets/my_other_icons.imageset"
                };
            };
        };
    };
};
```

### Реальный пример: MyFramework

MyFramework регистрирует семь наборов изображений, включая наборы иконок Font Awesome:

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
};
```

### Реальный пример: VPP Admin Tools

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "VPPAdminTools/GUI/Textures/dayz_gui_vpp.imageset"
        };
    };
};
```

### Реальный пример: DayZ Editor

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "DayZEditor/gui/imagesets/dayz_editor_gui.imageset"
        };
    };
};
```

---

## Ссылки на изображения в макетах

В файлах `.layout` используйте свойство `image0` с синтаксисом `set:имя image:имяИзображения`:

```
ImageWidgetClass MyIcon {
 size 32 32
 hexactsize 1
 vexactsize 1
 image0 "set:dayz_gui image:icon_refresh"
}
```

### Разбор синтаксиса

```
set:ИМЯНАБОРА image:ИМЯИЗОБРАЖЕНИЯ
```

- `ИМЯНАБОРА` --- поле `Name` из определения imageset (например, `dayz_gui`, `solid`, `brands`)
- `ИМЯИЗОБРАЖЕНИЯ` --- поле `Name` из конкретной записи `ImageSetDefClass` (например, `icon_refresh`, `arrow_down`)

### Несколько состояний изображения

Некоторые виджеты поддерживают несколько состояний изображения (нормальное, при наведении, нажатое):

```
ImageWidgetClass icon {
 image0 "set:solid image:circle"
}

ButtonWidgetClass btn {
 image0 "set:dayz_gui image:icon_expand"
}
```

### Примеры из реальных модов

```
image0 "set:regular image:arrow_down_short_wide"     -- MyMod: иконка Font Awesome regular
image0 "set:dayz_gui image:icon_minus"                -- MyMod: ванильная иконка DayZ
image0 "set:dayz_gui image:icon_collapse"             -- MyMod: ванильная иконка DayZ
image0 "set:dayz_gui image:circle"                    -- MyMod: ванильная фигура DayZ
image0 "set:dayz_editor_gui image:eye_open"           -- DayZ Editor: пользовательская иконка
```

---

## Ссылки на изображения в скриптах

В Enforce Script используйте `ImageWidget.LoadImageFile()` или задавайте свойства изображений на виджетах:

### LoadImageFile

```c
ImageWidget icon = ImageWidget.Cast(layoutRoot.FindAnyWidget("MyIcon"));
icon.LoadImageFile(0, "set:solid image:circle");
```

Параметр `0` --- это индекс изображения (соответствует `image0` в макетах).

### Несколько состояний через индекс

```c
ImageWidget collapseIcon;
collapseIcon.LoadImageFile(0, "set:regular image:square_plus");    // Нормальное состояние
collapseIcon.LoadImageFile(1, "set:solid image:square_minus");     // Переключённое состояние
```

Переключение между состояниями с помощью `SetImage(index)`:

```c
collapseIcon.SetImage(isExpanded ? 1 : 0);
```

### Использование строковых переменных

```c
// Из DayZ Editor
string icon = "set:dayz_editor_gui image:search";
searchBarIcon.LoadImageFile(0, icon);

// Позже, динамическое изменение
searchBarIcon.LoadImageFile(0, "set:dayz_gui image:icon_x");
```

---

## Флаги изображений

Поле `Flags` в записях imageset нативного формата управляет поведением тайлинга при растягивании изображения за пределы его естественного размера.

| Флаг | Значение | Описание |
|------|----------|----------|
| `0` | 0 | Без тайлинга. Изображение растягивается для заполнения виджета. |
| `ISHorizontalTile` | 1 | Тайлинг по горизонтали, когда виджет шире изображения. |
| `ISVerticalTile` | 2 | Тайлинг по вертикали, когда виджет выше изображения. |
| Оба | 3 | Тайлинг в обоих направлениях (`ISHorizontalTile` + `ISVerticalTile`). |

### Использование

```
ImageSetDefClass Gradient {
 Name "Gradient"
 Pos 0 317
 Size 75 5
 Flags ISVerticalTile
}
```

Это изображение `Gradient` имеет размер 75x5 пикселей. При использовании в виджете высотой более 5 пикселей оно тайлится вертикально для заполнения высоты, создавая повторяющуюся градиентную полосу.

Большинство иконок используют `Flags 0` (без тайлинга). Флаги тайлинга используются в основном для элементов UI, таких как границы, разделители и повторяющиеся паттерны.

---

## Многоразрешённые текстуры

Нативный формат поддерживает несколько текстур разного разрешения для одного imageset. Это позволяет движку использовать изображения более высокого разрешения на дисплеях с высокой плотностью пикселей.

```
Textures {
 ImageSetTextureClass {
  mpix 0
  path "Gui/imagesets/dayz_gui.edds"
 }
 ImageSetTextureClass {
  mpix 1
  path "Gui/imagesets/dayz_gui@2x.edds"
 }
}
```

- `mpix 0` --- низкое разрешение (используется при низких настройках качества или для удалённых элементов UI)
- `mpix 1` --- стандартное/высокое разрешение (по умолчанию)

Соглашение о наименовании `@2x` заимствовано из системы Retina Display от Apple, но не является обязательным --- вы можете назвать файл как угодно.

### На практике

Большинство модов включают только `mpix 1` (одно разрешение). Поддержка многоразрешённости используется в основном ванильной игрой:

```
Textures {
 ImageSetTextureClass {
  mpix 1
  path "MyFramework/GUI/icons/solid.edds"
 }
}
```

---

## Создание пользовательских наборов иконок

### Пошаговый рабочий процесс

**1. Создание атласа текстур**

Используйте графический редактор (Photoshop, GIMP и т.д.) для размещения иконок на одном холсте:
- Выберите размер, кратный степени двойки (256x256, 512x512, 1024x1024 и т.д.)
- Расположите иконки в сетке для удобного расчёта координат
- Оставьте некоторый отступ между иконками для предотвращения «растекания» текстур
- Сохраните как `.tga` или `.png`

**2. Конвертация в EDDS**

DayZ использует формат `.edds` (Enfusion DDS) для текстур. Используйте DayZ Workbench или инструменты Mikero для конвертации:
- Импортируйте ваш `.tga` в DayZ Workbench
- Или используйте `Pal2PacE.exe` для конвертации `.paa` в `.edds`
- Результат должен быть файлом `.edds`

**3. Написание определения ImageSet**

Сопоставьте каждую иконку с именованной областью. Если ваши иконки расположены с шагом 64 пикселя:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass settings {
   Name "settings"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass player {
   Name "player"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass map_marker {
   Name "map_marker"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

**4. Регистрация в config.cpp**

Добавьте путь к imageset в config.cpp вашего мода:

```cpp
class imageSets
{
    files[] =
    {
        "MyMod/GUI/imagesets/mymod_icons.imageset"
    };
};
```

**5. Использование в макетах и скриптах**

```
ImageWidgetClass SettingsIcon {
 image0 "set:mymod_icons image:settings"
 size 32 32
 hexactsize 1
 vexactsize 1
}
```

---

## Паттерн интеграции Font Awesome

MyFramework (унаследованный от DabsFramework) демонстрирует мощный паттерн: конвертация шрифтов иконок Font Awesome в imageset DayZ. Это даёт модам доступ к тысячам профессиональных иконок без создания собственных изображений.

### Как это работает

1. Иконки Font Awesome рендерятся в атлас текстур с фиксированным размером сетки (64x64 на иконку)
2. Каждый стиль иконок получает свой imageset: `solid`, `regular`, `light`, `thin`, `brands`
3. Имена иконок в imageset совпадают с именами иконок Font Awesome (например, `circle`, `arrow_down`, `discord`)
4. Наборы imageset регистрируются в config.cpp и доступны для любого макета или скрипта

### Наборы иконок MyFramework / DabsFramework

```
MyFramework/GUI/icons/
  solid.imageset       -- Заполненные иконки (атлас 3648x3712, 64x64 на иконку)
  regular.imageset     -- Контурные иконки
  light.imageset       -- Облегчённые контурные иконки
  thin.imageset        -- Ультратонкие контурные иконки
  brands.imageset      -- Логотипы брендов (Discord, GitHub и т.д.)
```

### Использование в макетах

```
image0 "set:solid image:circle"
image0 "set:solid image:gear"
image0 "set:regular image:arrow_down_short_wide"
image0 "set:brands image:discord"
image0 "set:brands image:500px"
```

### Использование в скриптах

```c
// DayZ Editor использует набор solid
CollapseIcon.LoadImageFile(1, "set:solid image:square_minus");
CollapseIcon.LoadImageFile(0, "set:regular image:square_plus");
```

### Почему этот паттерн хорошо работает

- **Огромная библиотека иконок**: Тысячи иконок доступны без создания изображений
- **Единый стиль**: Все иконки имеют одинаковый визуальный вес и стиль
- **Несколько начертаний**: Выбирайте solid, regular, light или thin для различных визуальных контекстов
- **Иконки брендов**: Готовые логотипы Discord, Steam, GitHub и т.д.
- **Стандартные имена**: Имена иконок следуют соглашениям Font Awesome, что упрощает поиск

### Структура атласа

Набор solid, например, имеет `RefSize` 3648x3712 с иконками, расположенными с интервалом 64 пикселя:

```
ImageSetClass {
 Name "solid"
 RefSize 3648 3712
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyFramework/GUI/icons/solid.edds"
  }
 }
 Images {
  ImageSetDefClass circle {
   Name "circle"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass 360_degrees {
   Name "360_degrees"
   Pos 320 0
   Size 64 64
   Flags 0
  }
  ...
 }
}
```

---

## Реальные примеры

### VPP Admin Tools

VPP упаковывает все иконки админ-инструментов в один атлас 1920x1080 с произвольным расположением (не строгая сетка):

```
ImageSetClass {
 Name "dayz_gui_vpp"
 RefSize 1920 1080
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{534691EE0479871E}VPPAdminTools/GUI/Textures/dayz_gui_vpp.edds"
  }
 }
 Images {
  ImageSetDefClass vpp_icon_cloud {
   Name "vpp_icon_cloud"
   Pos 1206 108
   Size 62 62
   Flags 0
  }
  ImageSetDefClass vpp_icon_players {
   Name "vpp_icon_players"
   Pos 391 112
   Size 62 62
   Flags 0
  }
 }
}
```

Ссылка в макетах:
```
image0 "set:dayz_gui_vpp image:vpp_icon_cloud"
```

### MyWeapons Mod

Иконки оружия и вложений, упакованные в большие атласы с различными размерами иконок:

```
ImageSetClass {
 Name "SNAFU_Weapons_Icons"
 RefSize 2048 2048
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{7C781F3D4B1173D4}SNAFU_Guns_01/gui/Imagesets/SNAFU_Weapons_Icons.edds"
  }
 }
 Images {
  ImageSetDefClass SNAFUFGRIP {
   Name "SNAFUFGRIP"
   Pos 123 19
   Size 300 300
   Flags 0
  }
  ImageSetDefClass SNAFU_M14Optic {
   Name "SNAFU_M14Optic"
   Pos 426 20
   Size 300 300
   Flags 0
  }
 }
}
```

Это показывает, что иконки не обязаны быть одинакового размера --- иконки инвентаря для оружия используют 300x300, тогда как иконки UI обычно 64x64.

### Префабы MyFramework

UI-примитивы (скруглённые углы, альфа-градиенты), упакованные в маленький атлас 256x256:

```
ImageSetClass {
 Name "prefabs"
 RefSize 256 256
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{82F14D6B9D1AA1CE}MyFramework/GUI/imagesets/prefabs.edds"
  }
 }
 Images {
  ImageSetDefClass Round_Outline_TopLeft {
   Name "Round_Outline_TopLeft"
   Pos 24 21
   Size 8 8
   Flags 0
  }
  ImageSetDefClass "Alpha 10" {
   Name "Alpha 10"
   Pos 0 15
   Size 1 1
   Flags 0
  }
 }
}
```

Примечательно: имена изображений могут содержать пробелы в кавычках (например, `"Alpha 10"`). Однако ссылка на них в макетах требует точного имени, включая пробел.

### MyMod Market Hub (XML-формат)

Простой XML-imageset для модуля торговой площадки:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="DayZMarketHub/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
  <image name="icon_vip" pos="192 0" size="64 64" />
  <image name="icon_weapons" pos="0 64" size="64 64" />
  <image name="icon_success" pos="0 192" size="64 64" />
  <image name="icon_error" pos="64 192" size="64 64" />
</imageset>
```

Ссылка:
```
image0 "set:mh_icons image:icon_store"
```

---

## Распространённые ошибки

### Забыта регистрация в config.cpp

Самая частая проблема. Если ваш файл imageset существует, но не указан в `class imageSets { files[] = { ... }; };` в config.cpp, движок его никогда не загрузит. Все ссылки на изображения будут молча неуспешными (виджеты отображаются пустыми).

### Коллизии имён наборов

Если два мода регистрируют imageset с одинаковым `Name`, загружается только один (последний побеждает). Используйте уникальный префикс:

```
Name "mymod_icons"     -- Хорошо
Name "icons"           -- Рискованно, слишком общее
```

### Неверный путь к текстуре

`path` должен быть относительным к корню PBO (как файл выглядит внутри упакованного PBO):

```
path "MyMod/GUI/imagesets/icons.edds"     -- Правильно, если MyMod — корень PBO
path "GUI/imagesets/icons.edds"            -- Неправильно, если корень PBO — MyMod/
path "C:/Users/dev/icons.edds"            -- Неправильно: абсолютные пути не работают
```

### Несовпадение RefSize

`RefSize` должен совпадать с фактическими пиксельными размерами вашей текстуры. Если вы укажете `RefSize 512 512`, но ваша текстура 1024x1024, все позиции иконок будут смещены в два раза.

### Координаты Pos смещены на один пиксель

`Pos` --- это верхний левый угол области иконки. Если ваши иконки расположены с интервалом 64 пикселя, но вы случайно сместились на 1 пиксель, иконки будут иметь тонкую полоску соседней иконки.

### Использование .png или .tga напрямую

Движок требует формат `.edds` для атласов текстур, на которые ссылаются imageset. Сырые файлы `.png` или `.tga` не загрузятся. Всегда конвертируйте в `.edds` с помощью DayZ Workbench или инструментов Mikero.

### Пробелы в именах изображений

Хотя движок поддерживает пробелы в именах изображений (например, `"Alpha 10"`), они могут вызвать проблемы в некоторых контекстах парсинга. Предпочитайте подчёркивания: `Alpha_10`.
