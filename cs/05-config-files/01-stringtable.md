# Kapitola 5.1: stringtable.csv --- Lokalizace

[Domů](../README.md) | **stringtable.csv** | [Další: inputs.xml >>](02-inputs-xml.md)

---

> **Shrnutí:** Soubor `stringtable.csv` poskytuje lokalizovaný text pro váš DayZ mod. Engine čte tento CSV při startu a překládá klíče na základě jazykového nastavení hráče. Každý řetězec viditelný uživatelem --- popisky UI, názvy klávesových zkratek, popisy předmětů, text notifikací --- by měl být ve stringtable místo natvrdo zapsaný v kódu.

---

## Obsah

- [Přehled](#přehled)
- [Formát CSV](#formát-csv)
- [Reference sloupců](#reference-sloupců)
- [Konvence pojmenování klíčů](#konvence-pojmenování-klíčů)
- [Odkazování na řetězce](#odkazování-na-řetězce)
- [Vytvoření nové stringtable](#vytvoření-nové-stringtable)
- [Zpracování prázdných buněk a záložní chování](#zpracování-prázdných-buněk-a-záložní-chování)
- [Pracovní postup pro více jazyků](#pracovní-postup-pro-více-jazyků)
- [Modulární přístup ke stringtable (DayZ Expansion)](#modulární-přístup-ke-stringtable-dayz-expansion)
- [Reálné příklady](#reálné-příklady)
- [Časté chyby](#časté-chyby)

---

## Přehled

DayZ používá lokalizační systém založený na CSV. Když engine narazí na klíč řetězce s předponou `#` (například `#STR_MYMOD_HELLO`), vyhledá tento klíč ve všech načtených souborech stringtable a vrátí překlad odpovídající aktuálnímu jazyku hráče. Pokud není nalezena shoda pro aktivní jazyk, engine projde záložním řetězcem.

Soubor stringtable musí být pojmenován přesně `stringtable.csv` a umístěn uvnitř struktury PBO vašeho modu. Engine ho objeví automaticky --- žádná registrace v config.cpp není nutná.

---

## Formát CSV

Soubor je standardní soubor s hodnotami oddělenými čárkami a poli v uvozovkách. První řádek je záhlaví a každý další řádek definuje jeden klíč překladu.

### Řádek záhlaví

Řádek záhlaví definuje sloupce. DayZ rozpoznává až 15 sloupců:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Datové řádky

Každý řádek začíná klíčem řetězce (bez předpony `#` v CSV), následovaným překladem pro každý jazyk:

```csv
"STR_MYMOD_HELLO","Hello World","Hello World","Ahoj světe","Hallo Welt","Привет мир","Witaj świecie","Helló világ","Ciao mondo","Hola mundo","Bonjour le monde","你好世界","ハローワールド","Olá mundo","你好世界",
```

### Koncová čárka

Mnoho souborů stringtable obsahuje koncovou čárku za posledním sloupcem. Toto je konvenční a bezpečné --- engine ji toleruje.

### Pravidla uvozovek

- Pole **musí** být v dvojitých uvozovkách, pokud obsahují čárky, nové řádky nebo dvojité uvozovky.
- V praxi většina modů uvozuje každé pole pro konzistenci.
- Některé mody (jako MyMod Missions) uvozovky zcela vynechávají; engine zvládne oba styly, pokud obsah pole neobsahuje čárky.

---

## Reference sloupců

DayZ podporuje 13 hráčem volitelných jazyků. CSV má 15 sloupců, protože první sloupec je název klíče a druhý je sloupec `original` (mateřský jazyk autora modu nebo výchozí text).

| # | Název sloupce | Jazyk | Poznámky |
|---|---------------|-------|----------|
| 1 | `Language` | --- | Identifikátor klíče řetězce (např. `STR_MYMOD_HELLO`) |
| 2 | `original` | Mateřský jazyk autora | Záloha poslední instance; použije se, pokud žádný jiný sloupec neodpovídá |
| 3 | `english` | Angličtina | Nejčastější primární jazyk pro mezinárodní mody |
| 4 | `czech` | Čeština | |
| 5 | `german` | Němčina | |
| 6 | `russian` | Ruština | |
| 7 | `polish` | Polština | |
| 8 | `hungarian` | Maďarština | |
| 9 | `italian` | Italština | |
| 10 | `spanish` | Španělština | |
| 11 | `french` | Francouzština | |
| 12 | `chinese` | Čínština (tradiční) | Tradiční čínské znaky |
| 13 | `japanese` | Japonština | |
| 14 | `portuguese` | Portugalština | |
| 15 | `chinesesimp` | Čínština (zjednodušená) | Zjednodušené čínské znaky |

### Na pořadí sloupců záleží

Engine identifikuje sloupce podle **názvu záhlaví**, nikoli podle pozice. Nicméně dodržování standardního pořadí uvedeného výše je důrazně doporučeno pro kompatibilitu a čitelnost.

### Volitelné sloupce

Nemusíte zahrnout všech 15 sloupců. Pokud váš mod podporuje pouze angličtinu, můžete použít minimální záhlaví:

```csv
"Language","english"
"STR_MYMOD_HELLO","Hello World"
```

Některé mody přidávají nestandardní sloupce jako `korean` (MyMod Missions to dělá). Engine ignoruje sloupce, které nerozpozná jako podporovaný jazyk, ale tyto sloupce mohou sloužit jako dokumentace nebo příprava na budoucí jazykovou podporu.

---

## Konvence pojmenování klíčů

Klíče řetězců sledují hierarchický vzor pojmenování:

```
STR_MODNAME_CATEGORY_ELEMENT
```

### Pravidla

1. **Vždy začínejte `STR_`** --- toto je univerzální konvence DayZ
2. **Předpona modu** --- jednoznačně identifikuje váš mod (např. `MYMOD`, `COT`, `EXPANSION`, `VPP`)
3. **Kategorie** --- seskupuje související řetězce (např. `INPUT`, `TAB`, `CONFIG`, `DIR`)
4. **Element** --- konkrétní řetězec (např. `ADMIN_PANEL`, `NORTH`, `SAVE`)
5. **Používejte VELKÁ PÍSMENA** --- konvence napříč všemi významnými mody
6. **Používejte podtržítka** jako oddělovače, nikdy mezery nebo pomlčky

### Příklady z reálných modů

```
STR_MYMOD_INPUT_ADMIN_PANEL       -- MyMod: popisek klávesové zkratky
STR_MYMOD_CLOSE                   -- MyMod: obecné tlačítko "Zavřít"
STR_MYMOD_DIR_NORTH                  -- MyMod: směr kompasu
STR_MYMOD_TAB_ONLINE                 -- MyMod: název záložky admin panelu
STR_COT_ESP_MODULE_NAME            -- COT: zobrazovaný název modulu
STR_COT_CAMERA_MODULE_BLUR         -- COT: popisek nástroje kamery
STR_EXPANSION_ATM                  -- Expansion: název funkce
STR_EXPANSION_AI_COMMAND_MENU      -- Expansion: popisek vstupu
```

### Anti-vzory

```
STR_hello_world          -- Špatně: malá písmena, chybí předpona modu
MY_STRING                -- Špatně: chybí předpona STR_
STR_MYMOD Hello World    -- Špatně: mezery v klíči
```

---

## Odkazování na řetězce

Existují tři odlišné kontexty, kde odkazujete na lokalizované řetězce, a každý používá mírně odlišnou syntaxi.

### V souborech layoutu (.layout)

Použijte předponu `#` před názvem klíče. Engine ho přeloží při vytváření widgetu.

```
TextWidgetClass MyLabel {
 text "#STR_MYMOD_CLOSE"
 size 100 30
}
```

Předpona `#` říká parseru layoutu "toto je lokalizační klíč, ne doslovný text."

### V Enforce Script (soubory .c)

Použijte `Widget.TranslateString()` k překladu klíče za běhu. Předpona `#` je povinná v argumentu.

```c
string translated = Widget.TranslateString("#STR_MYMOD_CLOSE");
// translated == "Close" (pokud je jazyk hráče angličtina)
// translated == "Fechar" (pokud je jazyk hráče portugalština)
```

Můžete také nastavit text widgetu přímo:

```c
TextWidget label = TextWidget.Cast(layoutRoot.FindAnyWidget("MyLabel"));
label.SetText(Widget.TranslateString("#STR_MYMOD_ADMIN_PANEL"));
```

Nebo použijte klíče řetězců přímo ve vlastnostech textu widgetu a engine je přeloží:

```c
label.SetText("#STR_MYMOD_ADMIN_PANEL");  // Také funguje -- engine automaticky překládá
```

### V inputs.xml

Použijte atribut `loc` **bez** předpony `#`.

```xml
<input name="UAMyAction" loc="STR_MYMOD_INPUT_MY_ACTION" />
```

Toto je jediné místo, kde vynecháváte `#`. Vstupní systém ji přidává interně.

### Souhrnná tabulka

| Kontext | Syntaxe | Příklad |
|---------|---------|---------|
| Atribut `text` v layoutu | `#STR_KEY` | `text "#STR_MYMOD_CLOSE"` |
| Script `TranslateString()` | `"#STR_KEY"` | `Widget.TranslateString("#STR_MYMOD_CLOSE")` |
| Text widgetu ve scriptu | `"#STR_KEY"` | `label.SetText("#STR_MYMOD_CLOSE")` |
| Atribut `loc` v inputs.xml | `STR_KEY` (bez #) | `loc="STR_MYMOD_INPUT_ADMIN_PANEL"` |

---

## Vytvoření nové stringtable

### Krok 1: Vytvořte soubor

Vytvořte `stringtable.csv` v kořeni adresáře obsahu PBO vašeho modu. Engine prohledává všechna načtená PBO a hledá soubory pojmenované přesně `stringtable.csv`.

Typické umístění:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      config.cpp
      stringtable.csv        <-- Zde
      Scripts/
        3_Game/
        4_World/
        5_Mission/
```

### Krok 2: Napište záhlaví

Začněte s plným 15sloupcovým záhlavím:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Krok 3: Přidejte řetězce

Přidejte jeden řádek na každý přeložitelný řetězec. Začněte s angličtinou a doplňte další jazyky, jakmile budou překlady k dispozici:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_TITLE","My Cool Mod","My Cool Mod","","","","","","","","","","","","",
"STR_MYMOD_OPEN","Open","Open","Otevřít","Öffnen","Открыть","Otwórz","Megnyitás","Apri","Abrir","Ouvrir","打开","開く","Abrir","打开",
```

### Krok 4: Zabalení a testování

Sestavte své PBO. Spusťte hru. Ověřte, že `Widget.TranslateString("#STR_MYMOD_TITLE")` vrací "My Cool Mod" ve skriptových logech. Změňte jazyk hry v nastavení pro ověření záložního chování.

---

## Zpracování prázdných buněk a záložní chování

Když engine vyhledá klíč řetězce pro aktuální jazyk hráče a najde prázdnou buňku, postupuje podle záložního řetězce:

1. **Sloupec vybraného jazyka hráče** --- kontroluje se jako první
2. **Sloupec `english`** --- pokud je buňka jazyka hráče prázdná
3. **Sloupec `original`** --- pokud je `english` také prázdný
4. **Holý název klíče** --- pokud jsou všechny sloupce prázdné, engine zobrazí samotný klíč (např. `STR_MYMOD_TITLE`)

To znamená, že můžete bezpečně ponechat neanglické sloupce prázdné během vývoje. Anglicky mluvící hráči uvidí sloupec `english` a ostatní hráči uvidí anglickou zálohu, dokud nebude přidán správný překlad.

### Praktický důsledek

Nemusíte kopírovat anglický text do každého sloupce jako zástupný text. Ponechte nepřeložené buňky prázdné:

```csv
"STR_MYMOD_HELLO","Hello","Hello","","","","","","","","","","","","",
```

Hráči s německým jazykem uvidí "Hello" (anglickou zálohu), dokud nebude poskytnuta německá překlad.

---

## Pracovní postup pro více jazyků

### Pro samostatné vývojáře

1. Napište všechny řetězce v angličtině (oba sloupce `original` a `english`).
2. Vydejte mod. Angličtina slouží jako univerzální záloha.
3. Jakmile členové komunity dobrovolně nabídnou překlady, doplňte další sloupce.
4. Přestavte a vydejte aktualizace.

### Pro týmy s překladateli

1. Udržujte CSV ve sdíleném repozitáři nebo tabulce.
2. Přiřaďte jednoho překladatele na jazyk.
3. Používejte sloupec `original` pro mateřský jazyk autora (např. portugalštinu pro brazilské vývojáře).
4. Sloupec `english` je vždy vyplněný --- je to mezinárodní základ.
5. Používejte nástroj pro porovnávání rozdílů ke sledování, které klíče byly přidány od posledního překladového průchodu.

### Použití tabulkového softwaru

Soubory CSV se přirozeně otevírají v Excelu, Google Sheets nebo LibreOffice Calc. Pozor na tyto úskalí:

- **Excel může přidat BOM (Byte Order Mark)** k souborům UTF-8. DayZ zvládne BOM, ale může to způsobit problémy s některými nástroji. Ukládejte jako "CSV UTF-8" pro jistotu.
- **Automatické formátování Excelu** může znehodnotit pole, která vypadají jako data nebo čísla.
- **Konce řádků**: DayZ přijímá jak `\r\n` (Windows), tak `\n` (Unix).

---

## Modulární přístup ke stringtable (DayZ Expansion)

DayZ Expansion demonstruje osvědčený postup pro velké mody: rozdělení překladů do více souborů stringtable organizovaných podle funkčních modulů. Jejich struktura používá 20 samostatných souborů stringtable uvnitř adresáře `languagecore`:

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

### Proč rozdělit?

- **Zvládnutelnost**: Jedna stringtable pro velký mod může narůst na tisíce řádků. Rozdělení podle funkčního modulu činí každý soubor zvládnutelným.
- **Nezávislé aktualizace**: Překladatelé mohou pracovat na jednom modulu najednou bez konfliktů při slučování.
- **Podmíněné zahrnutí**: PBO každého sub-modu obsahuje pouze stringtable pro svou vlastní funkci, čímž zůstávají velikosti PBO menší.

### Jak to funguje

Engine prohledává každé načtené PBO a hledá `stringtable.csv`. Protože každý sub-modul Expansion je zabalen do vlastního PBO, každý přirozeně obsahuje pouze svou vlastní stringtable. Není potřeba žádná speciální konfigurace --- stačí pojmenovat soubor `stringtable.csv` a umístit ho uvnitř PBO.

Názvy klíčů stále používají globální předponu (`STR_EXPANSION_`) k zamezení kolizí.

---

## Reálné příklady

### MyMod Core

MyMod Core používá plný 15sloupcový formát s portugalštinou jako jazykem `original` (mateřský jazyk vývojového týmu) a komplexními překlady pro všech 13 podporovaných jazyků:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod",
"STR_MYMOD_INPUT_ADMIN_PANEL","Painel Admin","Open Admin Panel","Otevřít Admin Panel","Admin-Panel öffnen","Открыть Админ Панель","Otwórz Panel Admina","Admin Panel megnyitása","Apri Pannello Admin","Abrir Panel Admin","Ouvrir le Panneau Admin","打开管理面板","管理パネルを開く","Abrir Painel Admin","打开管理面板",
"STR_MYMOD_CLOSE","Fechar","Close","Zavřít","Schließen","Закрыть","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","关闭","閉じる","Fechar","关闭",
"STR_MYMOD_SAVE","Salvar","Save","Uložit","Speichern","Сохранить","Zapisz","Mentés","Salva","Guardar","Sauvegarder","保存","保存","Salvar","保存",
```

Pozoruhodné vzory:
- `original` obsahuje portugalský text (mateřský jazyk týmu)
- `english` je vždy vyplněný jako mezinárodní základ
- Všech 13 jazykových sloupců je vyplněno

### COT (Community Online Tools)

COT používá stejný 15sloupcový formát. Jeho klíče sledují vzor `STR_COT_MODULE_CATEGORY_ELEMENT`:

```csv
Language,original,english,czech,german,russian,polish,hungarian,italian,spanish,french,chinese,japanese,portuguese,chinesesimp,
STR_COT_CAMERA_MODULE_BLUR,Blur:,Blur:,Rozmazání:,Weichzeichner:,Размытие:,Rozmycie:,Elmosódás:,Sfocatura:,Desenfoque:,Flou:,模糊:,ぼかし:,Desfoque:,模糊:,
STR_COT_ESP_MODULE_NAME,Camera Tools,Camera Tools,Nástroje kamery,Kamera-Werkzeuge,Камера,Narzędzia Kamery,Kamera Eszközök,Strumenti Camera,Herramientas de Cámara,Outils Caméra,相機工具,カメラツール,Ferramentas da Câmera,相机工具,
```

### VPP Admin Tools

VPP používá redukovanou sadu sloupců (13 sloupců, bez sloupce `hungarian`) a nepoužívá předponu `STR_` u klíčů:

```csv
"Language","original","english","czech","german","russian","polish","italian","spanish","french","chinese","japanese","portuguese","chinesesimp"
"vpp_focus_on_game","[Hold/2xTap] Focus On Game","[Hold/2xTap] Focus On Game","...","...","...","...","...","...","...","...","...","...","..."
```

Toto demonstruje, že předpona `STR_` je konvence, nikoli požadavek. Nicméně její vynechání znamená, že nemůžete používat překlad přes předponu `#` v souborech layoutu. VPP odkazuje na tyto klíče pouze prostřednictvím skriptového kódu. Předpona `STR_` je důrazně doporučena pro všechny nové mody.

### MyMod Missions

MyMod Missions používá CSV bez uvozovek v hlavičkovém stylu (žádné uvozovky kolem polí) s extra sloupcem `Korean`:

```csv
Language,English,Czech,German,Russian,Polish,Hungarian,Italian,Spanish,French,Chinese,Japanese,Portuguese,Korean
STR_MYMOD_MISSION_AVAILABLE,MISSION AVAILABLE,MISE K DISPOZICI,MISSION VERFÜGBAR,МИССИЯ ДОСТУПНА,...
```

Pozoruhodné: sloupec `original` chybí a `Korean` je přidána jako extra jazyk. Engine ignoruje nerozpoznané názvy sloupců, takže `Korean` slouží jako dokumentace, dokud nebude přidána oficiální podpora korejštiny.

---

## Časté chyby

### Zapomenutí předpony `#` ve skriptech

```c
// ŠPATNĚ -- zobrazí holý klíč, ne překlad
label.SetText("STR_MYMOD_HELLO");

// SPRÁVNĚ
label.SetText("#STR_MYMOD_HELLO");
```

### Použití `#` v inputs.xml

```xml
<!-- ŠPATNĚ -- vstupní systém přidává # interně -->
<input name="UAMyAction" loc="#STR_MYMOD_MY_ACTION" />

<!-- SPRÁVNĚ -->
<input name="UAMyAction" loc="STR_MYMOD_MY_ACTION" />
```

### Duplicitní klíče mezi mody

Pokud dva mody definují `STR_CLOSE`, engine použije ten, jehož PBO se načte jako poslední. Vždy používejte předponu svého modu:

```csv
"STR_MYMOD_CLOSE","Close","Close",...
```

### Nesouhlasící počet sloupců

Pokud řádek má méně sloupců než záhlaví, engine ho může tiše přeskočit nebo přiřadit prázdné řetězce chybějícím sloupcům. Vždy zajistěte, aby každý řádek měl stejný počet polí jako záhlaví.

### Problémy s BOM

Některé textové editory vkládají UTF-8 BOM (byte order mark) na začátek souboru. To může způsobit, že první klíč řetězce v CSV bude tiše nefunkční. Pokud se váš první klíč řetězce nikdy nepřeloží, zkontrolujte a odstraňte BOM.

### Použití čárek v polích bez uvozovek

```csv
STR_MYMOD_MSG,Hello, World,Hello, World,...
```

Toto rozbije parsování, protože `Hello` a ` World` se přečtou jako samostatné sloupce. Buď pole dejte do uvozovek, nebo se vyhněte čárkám v hodnotách:

```csv
"STR_MYMOD_MSG","Hello, World","Hello, World",...
```

---

## Osvědčené postupy

- Vždy používejte předponu `STR_MODNAME_` pro každý klíč. Tím se zabrání kolizím, když je načteno více modů současně.
- Dejte do uvozovek každé pole v CSV, i když obsah nemá čárky. Tím se zabrání jemným chybám parsování, když překlady v jiných jazycích obsahují čárky nebo speciální znaky.
- Vyplňte sloupec `english` pro každý klíč, i když váš mateřský jazyk je jiný. Angličtina je univerzální záloha a základ pro komunitní překladatele.
- Pro malé mody udržujte jednu stringtable na PBO. Pro velké mody s 500+ klíči rozdělte do souborů stringtable podle funkcí v samostatných PBO (podle vzoru Expansion).
- Ukládejte soubory jako UTF-8 bez BOM. Pokud používáte Excel, explicitně zvolte formát "CSV UTF-8" při exportu.

---

## Teorie vs praxe

> Co říká dokumentace versus jak věci skutečně fungují za běhu.

| Koncept | Teorie | Realita |
|---------|--------|---------|
| Na pořadí sloupců nezáleží | Engine identifikuje sloupce podle názvu záhlaví | Pravda, ale některé komunitní nástroje a exporty z tabulek přeřazují sloupce. Dodržování standardního pořadí předchází zmatkům |
| Záložní řetězec: jazyk > english > original > holý klíč | Dokumentovaná kaskáda | Pokud jsou oba sloupce `english` i `original` prázdné, engine zobrazí holý klíč s odstraněnou předponou `#` --- užitečné pro odhalení chybějících překladů ve hře |
| `Widget.TranslateString()` | Překládá v okamžiku volání | Výsledek je uložen v mezipaměti na jedno sezení. Změna jazyka hry vyžaduje restart, aby se vyhledávání ve stringtable aktualizovalo |
| Více modů se stejným klíčem | Vyhraje naposledy načtené PBO | Pořadí načítání PBO není garantováno mezi mody. Pokud dva mody definují `STR_CLOSE`, zobrazený text závisí na tom, který mod se načte jako poslední --- vždy používejte předponu modu |
| Předpona `#` v `SetText()` | Engine automaticky překládá lokalizační klíče | Funguje, ale pouze při prvním volání. Pokud zavoláte `SetText("#STR_KEY")` a později `SetText("doslovný text")`, přepnutí zpět na `SetText("#STR_KEY")` funguje bez problémů --- žádný problém s mezipamětí na úrovni widgetu |

---

## Kompatibilita a dopad

- **Více modů:** Kolize klíčů řetězců jsou hlavním rizikem. Dva mody definující `STR_ADMIN_PANEL` budou kolidovat tiše. Vždy přidávejte předponu klíčů s názvem vašeho modu (`STR_MYMOD_ADMIN_PANEL`).
- **Výkon:** Vyhledávání ve stringtable je rychlé (založené na hash). Tisíce klíčů napříč více mody nemají měřitelný dopad na výkon. Celá stringtable se načte do paměti při startu.
- **Verze:** Formát stringtable založený na CSV se nezměnil od alfa verze DayZ Standalone. 15sloupcové rozložení a záložní chování zůstalo stabilní napříč všemi verzemi.
