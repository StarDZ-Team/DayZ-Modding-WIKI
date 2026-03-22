# Глава 5.3: Credits.json

[Главная](../README.md) | [<< Назад: inputs.xml](02-inputs-xml.md) | **Credits.json** | [Далее: Формат ImageSet >>](04-imagesets.md)

---

> **Краткое описание:** Файл `Credits.json` определяет титры, которые DayZ отображает для вашего мода в игровом меню модов. В нём перечислены участники команды, контрибьюторы и благодарности, организованные по отделам и секциям. Хотя это чисто косметический файл, он является стандартным способом отдать должное вашей команде разработчиков.

---

## Содержание

- [Обзор](#обзор)
- [Расположение файла](#расположение-файла)
- [Структура JSON](#структура-json)
- [Как DayZ отображает титры](#как-dayz-отображает-титры)
- [Использование локализованных названий секций](#использование-локализованных-названий-секций)
- [Шаблоны](#шаблоны)
- [Реальные примеры](#реальные-примеры)
- [Распространённые ошибки](#распространённые-ошибки)

---

## Обзор

Когда игрок выбирает ваш мод в лаунчере DayZ или во внутриигровом меню модов, движок ищет файл `Credits.json` внутри PBO вашего мода. Если файл найден, титры отображаются в прокручиваемом виде, организованном по отделам и секциям --- аналогично титрам в кинофильмах.

Файл необязателен. Если он отсутствует, раздел титров для вашего мода не отображается. Однако его включение является хорошей практикой: это признание работы вашей команды и придание моду профессионального вида.

---

## Расположение файла

Поместите `Credits.json` в подпапку `Data` вашей директории Scripts или непосредственно в корень Scripts:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        Data/
          Credits.json       <-- Типичное расположение (COT, Expansion, DayZ Editor)
        Credits.json         <-- Тоже допустимо (DabsFramework, Colorful-UI)
```

Оба расположения работают. Движок сканирует содержимое PBO в поисках файла с именем `Credits.json` (регистр важен на некоторых платформах).

---

## Структура JSON

Файл использует простую JSON-структуру с тремя уровнями иерархии:

```json
{
    "Header": "My Mod Name",
    "Departments": [
        {
            "DepartmentName": "Department Title",
            "Sections": [
                {
                    "SectionName": "Section Title",
                    "Names": ["Person 1", "Person 2"]
                }
            ]
        }
    ]
}
```

### Поля верхнего уровня

| Поле | Тип | Обязательное | Описание |
|------|------|----------|-------------|
| `Header` | string | Нет | Основной заголовок, отображаемый вверху титров. Если опущен, заголовок не показывается. |
| `Departments` | array | Да | Массив объектов отделов |

### Объект отдела

| Поле | Тип | Обязательное | Описание |
|------|------|----------|-------------|
| `DepartmentName` | string | Да | Текст заголовка секции. Может быть пустым `""` для визуальной группировки без заголовка. |
| `Sections` | array | Да | Массив объектов секций внутри этого отдела |

### Объект секции

В реальных модах существуют два варианта перечисления имён. Движок поддерживает оба.

**Вариант 1: массив `Names`** (используется MyMod Core)

| Поле | Тип | Обязательное | Описание |
|------|------|----------|-------------|
| `SectionName` | string | Да | Подзаголовок внутри отдела |
| `Names` | array of strings | Да | Список имён контрибьюторов |

**Вариант 2: массив `SectionLines`** (используется COT, Expansion, DabsFramework)

| Поле | Тип | Обязательное | Описание |
|------|------|----------|-------------|
| `SectionName` | string | Да | Подзаголовок внутри отдела |
| `SectionLines` | array of strings | Да | Список имён контрибьюторов или текстовых строк |

И `Names`, и `SectionLines` выполняют одну и ту же функцию. Используйте тот, который предпочитаете --- движок отображает их одинаково.

---

## Как DayZ отображает титры

Визуальная иерархия титров:

```
╔══════════════════════════════════╗
║         MY MOD NAME              ║  <-- Header (крупный, по центру)
║                                  ║
║     DEPARTMENT NAME              ║  <-- DepartmentName (средний, по центру)
║                                  ║
║     Section Name                 ║  <-- SectionName (мелкий, по центру)
║     Person 1                     ║  <-- Names/SectionLines (список)
║     Person 2                     ║
║     Person 3                     ║
║                                  ║
║     Another Section              ║
║     Person A                     ║
║     Person B                     ║
║                                  ║
║     ANOTHER DEPARTMENT           ║
║     ...                          ║
╚══════════════════════════════════╝
```

- `Header` отображается один раз вверху
- Каждый `DepartmentName` выступает в роли основного разделителя секций
- Каждый `SectionName` выступает в роли подзаголовка
- Имена прокручиваются вертикально в виде титров

### Пустые строки для отступов

Expansion использует пустые строки `DepartmentName` и `SectionName`, а также записи только из пробелов в `SectionLines` для создания визуальных отступов:

```json
{
    "DepartmentName": "",
    "Sections": [{
        "SectionName": "",
        "SectionLines": ["           "]
    }]
}
```

Это распространённый приём для управления визуальной разметкой в прокрутке титров.

---

## Использование локализованных названий секций

Названия секций могут ссылаться на ключи stringtable с помощью префикса `#`, аналогично тексту UI:

```json
{
    "SectionName": "#STR_EXPANSION_CREDITS_SCRIPTERS",
    "SectionLines": ["Steve aka Salutesh", "LieutenantMaster"]
}
```

Когда движок отображает это, он разрешает `#STR_EXPANSION_CREDITS_SCRIPTERS` в локализованный текст, соответствующий языку игрока. Это полезно, если ваш мод поддерживает несколько языков и вы хотите, чтобы заголовки секций титров были переведены.

Названия отделов также могут использовать ссылки на stringtable:

```json
{
    "DepartmentName": "#legal_notices",
    "Sections": [...]
}
```

---

## Шаблоны

### Соло-разработчик

```json
{
    "Header": "My Awesome Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developer",
                    "Names": ["YourName"]
                }
            ]
        }
    ]
}
```

### Небольшая команда

```json
{
    "Header": "My Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developers",
                    "Names": ["Lead Dev", "Co-Developer"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Modeler1", "Modeler2"]
                },
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (French)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                }
            ]
        }
    ]
}
```

### Полная профессиональная структура

```json
{
    "Header": "My Big Mod",
    "Departments": [
        {
            "DepartmentName": "Core Team",
            "Sections": [
                {
                    "SectionName": "Lead Developer",
                    "Names": ["ProjectLead"]
                },
                {
                    "SectionName": "Scripters",
                    "Names": ["Dev1", "Dev2", "Dev3"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Artist1", "Artist2"]
                },
                {
                    "SectionName": "Mapping",
                    "Names": ["Mapper1"]
                }
            ]
        },
        {
            "DepartmentName": "Community",
            "Sections": [
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (Czech)",
                        "Translator2 (German)",
                        "Translator3 (Russian)"
                    ]
                },
                {
                    "SectionName": "Testers",
                    "Names": ["Tester1", "Tester2", "Tester3"]
                }
            ]
        },
        {
            "DepartmentName": "Legal Notices",
            "Sections": [
                {
                    "SectionName": "Licenses",
                    "Names": [
                        "Font Awesome - CC BY 4.0 License",
                        "Some assets licensed under ADPL-SA"
                    ]
                }
            ]
        }
    ]
}
```

---

## Реальные примеры

### MyMod Core

Минимальный, но полный файл титров, использующий вариант `Names`:

```json
{
    "Header": "MyMod Core",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Framework",
                    "Names": ["Documentation Team"]
                }
            ]
        }
    ]
}
```

### Community Online Tools (COT)

Использует вариант `SectionLines` с несколькими секциями и благодарностями:

```json
{
    "Departments": [
        {
            "DepartmentName": "Community Online Tools",
            "Sections": [
                {
                    "SectionName": "Active Developers",
                    "SectionLines": [
                        "LieutenantMaster",
                        "LAVA (liquidrock)"
                    ]
                },
                {
                    "SectionName": "Inactive Developers",
                    "SectionLines": [
                        "Jacob_Mango",
                        "Arkensor",
                        "DannyDog68",
                        "Thurston",
                        "GrosTon1"
                    ]
                },
                {
                    "SectionName": "Thank you to the following communities",
                    "SectionLines": [
                        "PIPSI.NET AU/NZ",
                        "1SKGaming",
                        "AWG",
                        "Expansion Mod Team",
                        "Bohemia Interactive"
                    ]
                }
            ]
        }
    ]
}
```

Примечание: COT полностью опускает поле `Header`. Название мода берётся из других метаданных (config.cpp `CfgMods`).

### DabsFramework

```json
{
    "Departments": [{
        "DepartmentName": "Development",
        "Sections": [{
                "SectionName": "Developers",
                "SectionLines": [
                    "InclementDab",
                    "Gormirn"
                ]
            },
            {
                "SectionName": "Translators",
                "SectionLines": [
                    "InclementDab",
                    "DanceOfJesus (French)",
                    "MarioE (Spanish)",
                    "Dubinek (Czech)",
                    "Steve AKA Salutesh (German)",
                    "Yuki (Russian)",
                    ".magik34 (Polish)",
                    "Daze (Hungarian)"
                ]
            }
        ]
    }]
}
```

### DayZ Expansion

Expansion демонстрирует наиболее продвинутое использование Credits.json, включая:
- Локализованные названия секций через ссылки на stringtable (`#STR_EXPANSION_CREDITS_SCRIPTERS`)
- Юридические уведомления в отдельном отделе
- Пустые названия отделов и секций для визуальных отступов
- Список спонсоров с десятками имён

---

## Распространённые ошибки

### Недопустимый синтаксис JSON

Самая частая проблема. JSON строг в отношении:
- **Завершающие запятые**: `["a", "b",]` --- это недопустимый JSON (завершающая запятая после `"b"`)
- **Одинарные кавычки**: используйте `"двойные кавычки"`, а не `'одинарные кавычки'`
- **Ключи без кавычек**: `DepartmentName` должен быть `"DepartmentName"`

Используйте валидатор JSON перед публикацией.

### Неправильное имя файла

Файл должен называться именно `Credits.json` (заглавная C). На файловых системах с учётом регистра `credits.json` или `CREDITS.JSON` не будут найдены.

### Смешивание Names и SectionLines

В рамках одной секции используйте что-то одно:

```json
{
    "SectionName": "Developers",
    "Names": ["Dev1"],
    "SectionLines": ["Dev2"]
}
```

Это неоднозначно. Выберите один формат и используйте его последовательно по всему файлу.

### Проблемы с кодировкой

Сохраняйте файл в UTF-8. Символы не из ASCII (имена с акцентами, CJK-символы) требуют кодировки UTF-8 для корректного отображения в игре.

---

## Лучшие практики

- Проверяйте ваш JSON внешним инструментом перед упаковкой в PBO --- движок не выдаёт полезных сообщений об ошибках для некорректного JSON.
- Используйте вариант `SectionLines` для единообразия, поскольку это формат, используемый COT, Expansion и DabsFramework.
- Включайте отдел "Legal Notices", если ваш мод содержит сторонние ассеты (шрифты, иконки, звуки) с требованиями указания авторства.
- Значение поля `Header` должно совпадать с `name` вашего мода в `mod.cpp` и `config.cpp` для единообразной идентификации.
- Используйте пустые строки `DepartmentName` и `SectionName` умеренно для визуальных отступов --- чрезмерное использование делает титры фрагментированными.

---

## Совместимость и влияние

- **Мульти-мод:** Каждый мод имеет собственный независимый `Credits.json`. Риск конфликтов отсутствует --- движок читает файл из PBO каждого мода отдельно.
- **Производительность:** Титры загружаются только когда игрок открывает экран деталей мода. Размер файла не влияет на игровую производительность.
