# Capítulo 5.1: stringtable.csv --- Localization

[Inicio](../README.md) | **stringtable.csv** | [Siguiente: inputs.xml >>](02-inputs-xml.md)

---

> **Resumen:** The `stringtable.csv` file provides localized text for your DayZ mod. The engine reads this CSV at startup and resolves translation keys based on the player's language setting. Every user-facing string --- UI labels, input binding names, item descriptions, notification text --- should live in a stringtable rather than being hardcoded.

---

## Tabla de Contenidos

- [Overview](#overview)
- [CSV Format](#csv-format)
- [Column Reference](#column-reference)
- [Key Naming Convention](#key-naming-convention)
- [Referencing Strings](#referencing-strings)
- [Creating a New Stringtable](#creating-a-new-stringtable)
- [Empty Cell Handling and Fallback Behavior](#empty-cell-handling-and-fallback-behavior)
- [Multi-Language Workflow](#multi-language-workflow)
- [Modular Stringtable Approach (DayZ Expansion)](#modular-stringtable-approach-dayz-expansion)
- [Real Examples](#real-examples)
- [Common Mistakes](#common-mistakes)

---

## Descripción General

DayZ uses a CSV-based localization system. When the engine encounters a string key prefixed with `#` (for example, `#STR_MYMOD_HELLO`), it looks up that key in all loaded stringtable files and returns the translation matching the player's current language. If no match is found for the active language, the engine falls back through a defined chain.

The stringtable file must be named exactly `stringtable.csv` and placed inside your mod's PBO structure. The engine discovers it automatically --- no config.cpp registration is required.

---

## CSV Format

The file is a standard comma-separated values file with quoted fields. The first row is the header, and every subsequent row defines one translation key.

### Header Row

The header row defines the columns. DayZ recognizes up to 15 columns:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Data Rows

Each row starts with the string key (no `#` prefix in the CSV), followed by the translation for each language:

```csv
"STR_MYMOD_HELLO","Hello World","Hello World","Ahoj světe","Hallo Welt","Привет мир","Witaj świecie","Helló világ","Ciao mondo","Hola mundo","Bonjour le monde","你好世界","ハローワールド","Olá mundo","你好世界",
```

### Trailing Comma

Many stringtable files include a trailing comma after the last column. This is conventional and safe --- the engine tolerates it.

### Quoting Rules

- Fields **must** be quoted with double quotes if they contain commas, newlines, or double quotes.
- In practice, most mods quote every field for consistency.
- Some mods (like MyMod Missions) omit quotes entirely; the engine handles both styles as long as the field content does not contain commas.

---

## Column Reference

DayZ supports 13 player-selectable languages. The CSV has 15 columns because the first column is the key name and the second is the `original` column (the mod author's native language or default text).

| # | Column Name | Language | Notas |
|---|-------------|----------|-------|
| 1 | `Language` | --- | The string key identifier (e.g. `STR_MYMOD_HELLO`) |
| 2 | `original` | Author's native | Fallback of last resort; used if no other column matches |
| 3 | `english` | English | Most common primary language for international mods |
| 4 | `czech` | Czech | |
| 5 | `german` | German | |
| 6 | `russian` | Russian | |
| 7 | `polish` | Polish | |
| 8 | `hungarian` | Hungarian | |
| 9 | `italian` | Italian | |
| 10 | `spanish` | Spanish | |
| 11 | `french` | French | |
| 12 | `chinese` | Chinese (Traditional) | Traditional Chinese characters |
| 13 | `japanese` | Japanese | |
| 14 | `portuguese` | Portuguese | |
| 15 | `chinesesimp` | Chinese (Simplified) | Simplified Chinese characters |

### Column Order Matters

The engine identifies columns by their **header name**, not by position. However, following the standard order shown above is strongly recommended for compatibility and readability.

### Optional Columns

You do not need to include all 15 columns. If your mod only supports English, you can use a minimal header:

```csv
"Language","english"
"STR_MYMOD_HELLO","Hello World"
```

Some mods add non-standard columns like `korean` (MyMod Missions does this). The engine ignores columns it does not recognize as a supported language, but those columns can serve as documentation or preparation for future language support.

---

## Key Naming Convention

String keys follow a hierarchical naming pattern:

```
STR_MODNAME_CATEGORY_ELEMENT
```

### Rules

1. **Always start with `STR_`** --- this is a universal DayZ convention
2. **Mod prefix** --- uniquely identifies your mod (e.g., `MYMOD`, `COT`, `EXPANSION`, `VPP`)
3. **Category** --- groups related strings (e.g., `INPUT`, `TAB`, `CONFIG`, `DIR`)
4. **Element** --- the specific string (e.g., `ADMIN_PANEL`, `NORTH`, `SAVE`)
5. **Use UPPERCASE** --- the convention across all major mods
6. **Use underscores** as separators, never spaces or hyphens

### Examples from Real Mods

```
STR_MYMOD_INPUT_ADMIN_PANEL       -- MyMod: keybinding label
STR_MYMOD_CLOSE                   -- MyMod: generic "Close" button
STR_MYMOD_DIR_NORTH                  -- MyMod: compass direction
STR_MYMOD_TAB_ONLINE                 -- MyMod: admin panel tab name
STR_COT_ESP_MODULE_NAME            -- COT: module display name
STR_COT_CAMERA_MODULE_BLUR         -- COT: camera tool label
STR_EXPANSION_ATM                  -- Expansion: feature name
STR_EXPANSION_AI_COMMAND_MENU      -- Expansion: input label
```

### Anti-Patterns

```
STR_hello_world          -- Bad: lowercase, no mod prefix
MY_STRING                -- Bad: missing STR_ prefix
STR_MYMOD Hello World    -- Bad: spaces in key
```

---

## Referencing Strings

There are three distinct contexts where you reference localized strings, and each uses a slightly different syntax.

### In Layout Files (.layout)

Use the `#` prefix before the key name. The engine resolves it at widget creation time.

```
TextWidgetClass MyLabel {
 text "#STR_MYMOD_CLOSE"
 size 100 30
}
```

The `#` prefix tells the layout parser "this is a localization key, not literal text."

### In Enforce Script (.c files)

Use `Widget.TranslateString()` to resolve the key at runtime. The `#` prefix is required in the argument.

```c
string translated = Widget.TranslateString("#STR_MYMOD_CLOSE");
// translated == "Close" (if player language is English)
// translated == "Fechar" (if player language is Portuguese)
```

You can also set widget text directly:

```c
TextWidget label = TextWidget.Cast(layoutRoot.FindAnyWidget("MyLabel"));
label.SetText(Widget.TranslateString("#STR_MYMOD_ADMIN_PANEL"));
```

Or use string keys directly in widget text properties, and the engine resolves them:

```c
label.SetText("#STR_MYMOD_ADMIN_PANEL");  // Also works -- engine auto-resolves
```

### In inputs.xml

Use the `loc` attribute **without** the `#` prefix.

```xml
<input name="UAMyAction" loc="STR_MYMOD_INPUT_MY_ACTION" />
```

This is the one place where you omit the `#`. The input system adds it internally.

### Summary Table

| Context | Sintaxis | Ejemplo |
|---------|--------|---------|
| Layout file `text` attribute | `#STR_KEY` | `text "#STR_MYMOD_CLOSE"` |
| Script `TranslateString()` | `"#STR_KEY"` | `Widget.TranslateString("#STR_MYMOD_CLOSE")` |
| Script widget text | `"#STR_KEY"` | `label.SetText("#STR_MYMOD_CLOSE")` |
| inputs.xml `loc` attribute | `STR_KEY` (no #) | `loc="STR_MYMOD_INPUT_ADMIN_PANEL"` |

---

## Creating a New Stringtable

### Step 1: Create the File

Create `stringtable.csv` at the root of your mod's PBO content directory. The engine scans all loaded PBOs for files named exactly `stringtable.csv`.

Typical placement:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      config.cpp
      stringtable.csv        <-- Here
      Scripts/
        3_Game/
        4_World/
        5_Mission/
```

### Step 2: Write the Header

Start with the full 15-column header:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Step 3: Add Your Strings

Add one row per translatable string. Start with English, fill in other languages as translations become available:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_TITLE","My Cool Mod","My Cool Mod","","","","","","","","","","","","",
"STR_MYMOD_OPEN","Open","Open","Otevřít","Öffnen","Открыть","Otwórz","Megnyitás","Apri","Abrir","Ouvrir","打开","開く","Abrir","打开",
```

### Step 4: Pack and Test

Build your PBO. Launch the game. Verify that `Widget.TranslateString("#STR_MYMOD_TITLE")` returns "My Cool Mod" in your script logs. Change the game language in settings to verify fallback behavior.

---

## Empty Cell Handling and Fallback Behavior

When the engine looks up a string key for the player's current language and finds an empty cell, it follows a fallback chain:

1. **Player's selected language column** --- checked first
2. **`english` column** --- if the player's language cell is empty
3. **`original` column** --- if `english` is also empty
4. **Raw key name** --- if all columns are empty, the engine displays the key itself (e.g., `STR_MYMOD_TITLE`)

This means you can safely leave non-English columns empty during development. English-speaking players see the `english` column, and other players see the English fallback until a proper translation is added.

### Practical Implication

You do not need to copy the English text into every column as a placeholder. Leave untranslated cells empty:

```csv
"STR_MYMOD_HELLO","Hello","Hello","","","","","","","","","","","","",
```

Players whose language is German will see "Hello" (the English fallback) until a German translation is provided.

---

## Multi-Language Workflow

### For Solo Developers

1. Write all strings in English (both `original` and `english` columns).
2. Release the mod. English serves as the universal fallback.
3. As community members volunteer translations, fill in additional columns.
4. Rebuild and release updates.

### For Teams with Translators

1. Maintain the CSV in a shared repository or spreadsheet.
2. Assign one translator per language.
3. Use the `original` column for the author's native language (e.g., Portuguese for Brazilian developers).
4. The `english` column is always filled --- it is the international baseline.
5. Use a diff tool to track which keys have been added since the last translation pass.

### Using Spreadsheet Software

CSV files open naturally in Excel, Google Sheets, or LibreOffice Calc. Be aware of these pitfalls:

- **Excel may add BOM (Byte Order Mark)** to UTF-8 files. DayZ handles BOM, but it can cause issues with some tools. Save as "CSV UTF-8" to be safe.
- **Excel auto-formatting** can mangle fields that look like dates or numbers.
- **Line endings**: DayZ accepts both `\r\n` (Windows) and `\n` (Unix).

---

## Modular Stringtable Approach (DayZ Expansion)

DayZ Expansion demonstrates a best practice for large mods: splitting translations across multiple stringtable files organized by feature module. Their structure uses 20 separate stringtable files inside a `languagecore` directory:

```
DayZExpansion/
  languagecore/
    AI/stringtable.csv
    BaseBuilding/stringtable.csv
    Book/stringtable.csv
    Chat/stringtable.csv
    Core/stringtable.csv
    Garage/stringtable.csv
    Groups/stringtable.csv
    Hardline/stringtable.csv
    Licensed/stringtable.csv
    Main/stringtable.csv
    MapAssets/stringtable.csv
    Market/stringtable.csv
    Missions/stringtable.csv
    Navigation/stringtable.csv
    PersonalStorage/stringtable.csv
    PlayerList/stringtable.csv
    Quests/stringtable.csv
    SpawnSelection/stringtable.csv
    Vehicles/stringtable.csv
    Weapons/stringtable.csv
```

### Why Split?

- **Manageability**: A single stringtable for a large mod can grow to thousands of lines. Splitting by feature module makes each file manageable.
- **Independent updates**: Translators can work on one module at a time without merge conflicts.
- **Conditional inclusion**: Each sub-mod's PBO only includes the stringtable for its own feature, keeping PBO sizes smaller.

### How It Works

The engine scans every loaded PBO for `stringtable.csv`. Since each Expansion sub-module is packed into its own PBO, each one naturally includes only its own stringtable. No special configuration is needed --- just name the file `stringtable.csv` and place it inside the PBO.

Key names still use a global prefix (`STR_EXPANSION_`) to avoid collisions.

---

## Ejemplos Reales

### MyMod Core

MyMod Core uses the full 15-column format with Portuguese as the `original` language (the development team's native language) and comprehensive translations for all 13 supported languages:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod",
"STR_MYMOD_INPUT_ADMIN_PANEL","Painel Admin","Open Admin Panel","Otevřít Admin Panel","Admin-Panel öffnen","Открыть Админ Панель","Otwórz Panel Admina","Admin Panel megnyitása","Apri Pannello Admin","Abrir Panel Admin","Ouvrir le Panneau Admin","打开管理面板","管理パネルを開く","Abrir Painel Admin","打开管理面板",
"STR_MYMOD_CLOSE","Fechar","Close","Zavřít","Schließen","Закрыть","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","关闭","閉じる","Fechar","关闭",
"STR_MYMOD_SAVE","Salvar","Save","Uložit","Speichern","Сохранить","Zapisz","Mentés","Salva","Guardar","Sauvegarder","保存","保存","Salvar","保存",
```

Notable patterns:
- `original` contains Portuguese text (the team's native language)
- `english` is always filled as the international baseline
- All 13 language columns are populated

### COT (Community Online Tools)

COT uses the same 15-column format. Its keys follow the `STR_COT_MODULE_CATEGORY_ELEMENT` pattern:

```csv
Language,original,english,czech,german,russian,polish,hungarian,italian,spanish,french,chinese,japanese,portuguese,chinesesimp,
STR_COT_CAMERA_MODULE_BLUR,Blur:,Blur:,Rozmazání:,Weichzeichner:,Размытие:,Rozmycie:,Elmosódás:,Sfocatura:,Desenfoque:,Flou:,模糊:,ぼかし:,Desfoque:,模糊:,
STR_COT_ESP_MODULE_NAME,Camera Tools,Camera Tools,Nástroje kamery,Kamera-Werkzeuge,Камера,Narzędzia Kamery,Kamera Eszközök,Strumenti Camera,Herramientas de Cámara,Outils Caméra,相機工具,カメラツール,Ferramentas da Câmera,相机工具,
```

### VPP Admin Tools

VPP uses a reduced column set (13 columns, no `hungarian` column) and does not prefix keys with `STR_`:

```csv
"Language","original","english","czech","german","russian","polish","italian","spanish","french","chinese","japanese","portuguese","chinesesimp"
"vpp_focus_on_game","[Hold/2xTap] Focus On Game","[Hold/2xTap] Focus On Game","...","...","...","...","...","...","...","...","...","...","..."
```

This demonstrates that the `STR_` prefix is a convention, not a requirement. However, omitting it means you cannot use the `#` prefix resolution in layout files. VPP references these keys only through script code. The `STR_` prefix is strongly recommended for all new mods.

### MyMod Missions

MyMod Missions uses an unquoted, headerless-style CSV (no quotes around fields) with an extra `Korean` column:

```csv
Language,English,Czech,German,Russian,Polish,Hungarian,Italian,Spanish,French,Chinese,Japanese,Portuguese,Korean
STR_MYMOD_MISSION_AVAILABLE,MISSION AVAILABLE,MISE K DISPOZICI,MISSION VERFÜGBAR,МИССИЯ ДОСТУПНА,...
```

Notable: the `original` column is absent, and `Korean` is added as an extra language. The engine ignores unrecognized column names, so `Korean` serves as documentation until official Korean support is added.

---

## Errores Comunes

### Forgetting the `#` Prefix in Scripts

```c
// WRONG -- displays the raw key, not the translation
label.SetText("STR_MYMOD_HELLO");

// CORRECT
label.SetText("#STR_MYMOD_HELLO");
```

### Using `#` in inputs.xml

```xml
<!-- WRONG -- the input system adds # internally -->
<input name="UAMyAction" loc="#STR_MYMOD_MY_ACTION" />

<!-- CORRECT -->
<input name="UAMyAction" loc="STR_MYMOD_MY_ACTION" />
```

### Duplicate Keys Across Mods

If two mods define `STR_CLOSE`, the engine uses whichever PBO loads last. Always use your mod prefix:

```csv
"STR_MYMOD_CLOSE","Close","Close",...
```

### Mismatched Column Count

If a row has fewer columns than the header, the engine may silently skip it or assign empty strings to the missing columns. Always ensure every row has the same number of fields as the header.

### BOM Issues

Some text editors insert a UTF-8 BOM (byte order mark) at the start of the file. This can cause the first key in the CSV to be silently broken. If your first string key never resolves, check for and remove the BOM.

### Using Commas Inside Unquoted Fields

```csv
STR_MYMOD_MSG,Hello, World,Hello, World,...
```

This breaks parsing because `Hello` and ` World` are read as separate columns. Either quote the field or avoid commas in values:

```csv
"STR_MYMOD_MSG","Hello, World","Hello, World",...
```

---

## Mejores Prácticas

- Always use the `STR_MODNAME_` prefix for every key. This prevents collisions when multiple mods are loaded together.
- Quote every field in the CSV, even if the content has no commas. This prevents subtle parsing errors when translations in other languages contain commas or special characters.
- Fill the `english` column for every key, even if your native language is different. English is the universal fallback and the baseline for community translators.
- Keep one stringtable per PBO for small mods. For large mods with 500+ keys, split into per-feature stringtable files in separate PBOs (following the Expansion pattern).
- Save files as UTF-8 without BOM. If using Excel, explicitly choose "CSV UTF-8" format on export.

---

## Teoría vs Práctica

> What the documentation says versus how things actually work at runtime.

| Concepto | Teoría | Realidad |
|---------|--------|---------|
| Column order does not matter | Engine identifies columns by header name | True, but some community tools and spreadsheet exports reorder columns. Keeping the standard order prevents confusion |
| Fallback chain: language > english > original > raw key | Documented cascade | If both `english` and `original` are empty, the engine displays the raw key with the `#` prefix stripped -- useful for spotting missing translations in-game |
| `Widget.TranslateString()` | Resolves at call time | The result is cached per session. Changing the game language requires a restart for stringtable lookups to update |
| Multiple mods with same key | Last-loaded PBO wins | PBO load order is not guaranteed between mods. If two mods define `STR_CLOSE`, the displayed text depends on which mod loads last -- always use a mod prefix |
| `#` prefix in `SetText()` | Engine auto-resolves localization keys | Works, but only on the first call. If you call `SetText("#STR_KEY")` and later call `SetText("literal text")`, switching back to `SetText("#STR_KEY")` works fine -- no caching issue at the widget level |

---

## Compatibilidad e Impacto

- **Multi-Mod:** String key collisions are the primary risk. Two mods defining `STR_ADMIN_PANEL` will conflict silently. Always prefix keys with your mod name (`STR_MYMOD_ADMIN_PANEL`).
- **Performance:** Stringtable lookup is fast (hash-based). Having thousands of keys across multiple mods has no measurable performance impact. The entire stringtable is loaded into memory at startup.
- **Version:** The CSV-based stringtable format has been unchanged since DayZ Standalone alpha. The 15-column layout and fallback behavior have remained stable across all versions.
