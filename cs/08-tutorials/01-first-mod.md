# Kapitola 8.1: Váš první mod (Hello World)

[Domů](../README.md) | **Váš první mod** | [Další: Vytvoření vlastního předmětu >>](02-custom-item.md)

---

> **Shrnutí:** Tento tutoriál vás provede vytvořením vašeho úplně prvního DayZ modu od absolutní nuly. Nainstalujete nástroje, nastavíte pracovní prostředí, napíšete tři soubory, zabalíte PBO, načtete mod v DayZ a ověříte, že funguje čtením skriptového logu. Není vyžadována žádná předchozí zkušenost s moddingem DayZ.

---

## Obsah

- [Předpoklady](#předpoklady)
- [Krok 1: Instalace DayZ Tools](#krok-1-instalace-dayz-tools)
- [Krok 2: Nastavení P: disku (Workdrive)](#krok-2-nastavení-p-disku-workdrive)
- [Krok 3: Vytvoření adresářové struktury modu](#krok-3-vytvoření-adresářové-struktury-modu)
- [Krok 4: Napsání mod.cpp](#krok-4-napsání-modcpp)
- [Krok 5: Napsání config.cpp](#krok-5-napsání-configcpp)
- [Krok 6: Napsání vašeho prvního skriptu](#krok-6-napsání-vašeho-prvního-skriptu)
- [Krok 7: Zabalení PBO pomocí Addon Builderu](#krok-7-zabalení-pbo-pomocí-addon-builderu)
- [Krok 8: Načtení modu v DayZ](#krok-8-načtení-modu-v-dayz)
- [Krok 9: Ověření ve skriptovém logu](#krok-9-ověření-ve-skriptovém-logu)
- [Krok 10: Řešení běžných problémů](#krok-10-řešení-běžných-problémů)
- [Kompletní reference souborů](#kompletní-reference-souborů)
- [Další kroky](#další-kroky)

---

## Předpoklady

Než začnete, ujistěte se, že máte:

- Nainstalovaný **Steam** a přihlášení
- Nainstalovanou hru **DayZ** (plná verze ze Steamu)
- **Textový editor** (VS Code, Notepad++ nebo i Poznámkový blok)
- Přibližně **15 GB volného místa na disku** pro DayZ Tools

To je vše. Pro tento tutoriál není vyžadována žádná programátorská zkušenost -- každý řádek kódu je vysvětlen.

---

## Krok 1: Instalace DayZ Tools

DayZ Tools je bezplatná aplikace na Steamu, která obsahuje vše potřebné pro tvorbu modů: skriptový editor Workbench, Addon Builder pro balení PBO, Terrain Builder a Object Builder.

### Jak nainstalovat

1. Otevřete **Steam**
2. Přejděte do **Knihovny**
3. V rozbalovacím filtru nahoře změňte **Hry** na **Nástroje**
4. Vyhledejte **DayZ Tools**
5. Klikněte na **Instalovat**
6. Počkejte na dokončení stahování (přibližně 12-15 GB)

Po instalaci najdete DayZ Tools ve své Steam knihovně pod Nástroji. Výchozí instalační cesta je:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
```

### Co se nainstaluje

| Nástroj | Účel |
|------|---------|
| **Addon Builder** | Balí soubory vašeho modu do archivů `.pbo` |
| **Workbench** | Skriptový editor se zvýrazněním syntaxe |
| **Object Builder** | Prohlížeč a editor 3D modelů pro soubory `.p3d` |
| **Terrain Builder** | Editor map/terénu |
| **TexView2** | Prohlížeč/konvertor textur (`.paa`, `.edds`) |

Pro tento tutoriál potřebujete pouze **Addon Builder**. Ostatní se hodí později.

---

## Krok 2: Nastavení P: disku (Workdrive)

Modding DayZ používá virtuální písmeno disku **P:** jako sdílený pracovní prostor. Všechny mody a herní data odkazují na cesty začínající P:, což udržuje cesty konzistentní na různých počítačích.

### Vytvoření P: disku

1. Otevřete **DayZ Tools** ze Steamu
2. V hlavním okně DayZ Tools klikněte na **P: Drive Management** (nebo hledejte tlačítko s nápisem "Mount P drive" / "Setup P drive")
3. Klikněte na **Create/Mount P: Drive**
4. Zvolte umístění pro data P: disku (výchozí je v pořádku, nebo vyberte disk s dostatkem místa)
5. Počkejte na dokončení procesu

### Ověření funkčnosti

Otevřete **Průzkumník souborů** a přejděte na `P:\`. Měli byste vidět adresář obsahující herní data DayZ. Pokud P: disk existuje a můžete ho procházet, jste připraveni pokračovat.

### Alternativa: Ruční P: disk

Pokud GUI DayZ Tools nefunguje, můžete P: disk vytvořit ručně pomocí příkazového řádku Windows (spuštěného jako Správce):

```batch
subst P: "C:\DayZWorkdrive"
```

Nahraďte `C:\DayZWorkdrive` libovolnou složkou. Toto vytvoří dočasné mapování disku, které vydrží do restartu. Pro trvalé mapování použijte `net use` nebo GUI DayZ Tools.

### Co když nechci používat P: disk?

Můžete vyvíjet bez P: disku umístěním složky modu přímo do adresáře hry DayZ a použitím režimu `-filePatching`. Nicméně P: disk je standardní pracovní postup a veškerá oficiální dokumentace ho předpokládá. Důrazně doporučujeme ho nastavit.

---

## Krok 3: Vytvoření adresářové struktury modu

Každý DayZ mod následuje specifickou adresářovou strukturu. Vytvořte následující adresáře a soubory na vašem P: disku (nebo v adresáři hry DayZ, pokud nepoužíváte P:):

```
P:\MyFirstMod\
    mod.cpp
    Scripts\
        config.cpp
        5_Mission\
            MyFirstMod\
                MissionHello.c
```

### Vytvoření složek

1. Otevřete **Průzkumník souborů**
2. Přejděte na `P:\`
3. Vytvořte novou složku s názvem `MyFirstMod`
4. Uvnitř `MyFirstMod` vytvořte složku `Scripts`
5. Uvnitř `Scripts` vytvořte složku `5_Mission`
6. Uvnitř `5_Mission` vytvořte složku `MyFirstMod`

### Pochopení struktury

| Cesta | Účel |
|------|---------|
| `MyFirstMod/` | Kořen vašeho modu |
| `mod.cpp` | Metadata (název, autor) zobrazená v launcheru DayZ |
| `Scripts/config.cpp` | Říká enginu, na čem váš mod závisí a kde jsou skripty |
| `Scripts/5_Mission/` | Skriptová vrstva misí (UI, startovací hooky) |
| `Scripts/5_Mission/MyFirstMod/` | Podsložka pro misijní skripty vašeho modu |
| `Scripts/5_Mission/MyFirstMod/MissionHello.c` | Váš skutečný skriptový soubor |

Potřebujete přesně **3 soubory**. Vytvořme je jeden po druhém.

---

## Krok 4: Napsání mod.cpp

Vytvořte soubor `P:\MyFirstMod\mod.cpp` ve vašem textovém editoru a vložte tento obsah:

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Co dělá každý řádek

- **`name`** -- Zobrazovaný název v seznamu modů launcheru DayZ. Hráči ho vidí při výběru modů.
- **`author`** -- Vaše jméno nebo název týmu.
- **`version`** -- Libovolný řetězec verze. Engine ho neparsuje.
- **`overview`** -- Popis zobrazený při rozbalení detailů modu.

Uložte soubor. To je vizitka vašeho modu.

---

## Krok 5: Napsání config.cpp

Vytvořte soubor `P:\MyFirstMod\Scripts\config.cpp` a vložte tento obsah:

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Co dělá každá sekce

**CfgPatches** deklaruje váš mod enginu DayZ:

- `class MyFirstMod_Scripts` -- Unikátní identifikátor balíčku skriptů vašeho modu. Nesmí kolidovat s žádným jiným modem.
- `units[] = {}; weapons[] = {};` -- Seznamy entit a zbraní, které váš mod přidává. Prozatím prázdné.
- `requiredVersion = 0.1;` -- Minimální verze hry. Vždy `0.1`.
- `requiredAddons[] = { "DZ_Data" };` -- Závislosti. `DZ_Data` jsou základní herní data. Toto zajistí, že se váš mod načte **po** základní hře.

**CfgMods** říká enginu, kde jsou vaše skripty:

- `dir = "MyFirstMod";` -- Kořenový adresář modu.
- `type = "mod";` -- Toto je mod pro klient+server (na rozdíl od `"servermod"` pouze pro server).
- `dependencies[] = { "Mission" };` -- Váš kód se napojuje na skriptový modul Mission.
- `class missionScriptModule` -- Říká enginu, aby zkompiloval všechny soubory `.c` nalezené v `MyFirstMod/Scripts/5_Mission/`.

**Proč pouze `5_Mission`?** Protože náš skript Hello World se napojuje na událost spuštění mise, která žije ve vrstvě misí. Většina jednoduchých modů zde začíná.

---

## Krok 6: Napsání vašeho prvního skriptu

Vytvořte soubor `P:\MyFirstMod\Scripts\5_Mission\MyFirstMod\MissionHello.c` a vložte tento obsah:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

### Vysvětlení řádek po řádku

```c
modded class MissionServer
```
Klíčové slovo `modded` je srdcem moddingu DayZ. Říká: "Vezmi existující třídu `MissionServer` z vanilkové hry a přidej mé změny na vrch." Nevytváříte novou třídu -- rozšiřujete existující.

```c
    override void OnInit()
```
`OnInit()` je volán enginem, když se mise spustí. `override` říká kompilátoru, že tato metoda již existuje v rodičovské třídě a my ji nahrazujeme naší verzí.

```c
        super.OnInit();
```
**Tento řádek je kritický.** `super.OnInit()` volá původní vanilkovou implementaci. Pokud ho vynecháte, vanilkový inicializační kód mise se nikdy nespustí a hra se rozbije. Vždy volejte `super` jako první.

```c
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
```
`Print()` zapisuje zprávu do souboru skriptového logu DayZ. Prefix `[MyFirstMod]` usnadňuje nalezení vašich zpráv v logu.

```c
modded class MissionGameplay
```
`MissionGameplay` je klientský ekvivalent `MissionServer`. Když se hráč připojí k serveru, `MissionGameplay.OnInit()` se spustí na jeho stroji. Moddingem obou tříd se vaše zpráva objeví v logu serveru i klienta.

### O souborech `.c`

DayZ skripty používají příponu `.c`. Přestože vypadají jako C, jedná se o **Enforce Script**, vlastní skriptovací jazyk DayZ. Má třídy, dědičnost, pole a mapy, ale není to C, C++ ani C#. Vaše IDE může ukazovat chyby syntaxe -- to je normální a očekávané.

---

## Krok 7: Zabalení PBO pomocí Addon Builderu

DayZ načítá mody ze souborů archivů `.pbo` (podobné .zip, ale ve formátu, kterému engine rozumí). Potřebujete zabalit vaši složku `Scripts` do PBO.

### Použití Addon Builderu (GUI)

1. Otevřete **DayZ Tools** ze Steamu
2. Klikněte na **Addon Builder** pro jeho spuštění
3. Nastavte **Source directory** na: `P:\MyFirstMod\Scripts\`
4. Nastavte **Output/Destination directory** na novou složku: `P:\@MyFirstMod\Addons\`

   Vytvořte složku `@MyFirstMod\Addons\` nejdříve, pokud neexistuje.

5. V **Addon Builder Options**:
   - Nastavte **Prefix** na: `MyFirstMod\Scripts`
   - Ostatní volby nechte na výchozích hodnotách
6. Klikněte na **Pack**

Pokud je vše úspěšné, uvidíte soubor na:

```
P:\@MyFirstMod\Addons\Scripts.pbo
```

### Nastavení finální struktury modu

Nyní zkopírujte váš `mod.cpp` vedle složky `Addons`:

```
P:\@MyFirstMod\
    mod.cpp                         <-- Kopie z P:\MyFirstMod\mod.cpp
    Addons\
        Scripts.pbo                 <-- Vytvořen Addon Builderem
```

Prefix `@` na názvu složky je konvence pro distribuovatelné mody. Signalizuje správcům serverů a launcheru, že se jedná o balíček modu.

### Alternativa: Testování bez balení (File Patching)

Během vývoje můžete balení PBO zcela přeskočit pomocí režimu file patching. Ten načítá skripty přímo z vašich zdrojových složek:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

File patching je rychlejší pro iteraci, protože upravíte soubor `.c`, restartujete hru a okamžitě vidíte změny. Žádný krok balení není potřeba. Nicméně file patching funguje pouze s diagnostickým spustitelným souborem (`DayZDiag_x64.exe`) a není vhodný pro distribuci.

---

## Krok 8: Načtení modu v DayZ

Existují dva způsoby, jak načíst váš mod: přes launcher nebo pomocí parametrů příkazového řádku.

### Možnost A: DayZ Launcher

1. Otevřete **DayZ Launcher** ze Steamu
2. Přejděte na kartu **Mods**
3. Klikněte na **Add local mod** (nebo "Add mod from local storage")
4. Přejděte na `P:\@MyFirstMod\`
5. Aktivujte mod zaškrtnutím jeho zaškrtávacího políčka
6. Klikněte na **Play** (ujistěte se, že se připojujete k lokálnímu/offline serveru nebo spouštíte režim jednoho hráče)

### Možnost B: Příkazový řádek (doporučeno pro vývoj)

Pro rychlejší iteraci spusťte DayZ přímo s parametry příkazového řádku. Vytvořte zástupce nebo batch soubor:

**Použití diagnostického spustitelného souboru (s file patchingem, bez potřeby PBO):**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\MyFirstMod -filePatching -server -config=serverDZ.cfg -port=2302
```

**Použití zabaleného PBO:**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\@MyFirstMod -server -config=serverDZ.cfg -port=2302
```

Příznak `-server` spustí lokální listen server. Příznak `-filePatching` umožňuje načítání skriptů z nebalených složek.

### Rychlý test: Offline režim

Nejrychlejší způsob testování je spustit DayZ v offline režimu:

```batch
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

Poté v hlavním menu klikněte na **Play** a vyberte **Offline Mode** (nebo **Community Offline**). Tím se spustí lokální relace jednoho hráče bez potřeby serveru.

---

## Krok 9: Ověření ve skriptovém logu

Po spuštění DayZ s vaším modem engine zapisuje veškerý výstup `Print()` do souborů logů.

### Nalezení souborů logů

DayZ ukládá logy ve vašem lokálním adresáři AppData:

```
C:\Users\<VašeWindowsUživatelskéJméno>\AppData\Local\DayZ\
```

Pro rychlý přístup:
1. Stiskněte **Win + R** pro otevření dialogu Spustit
2. Zadejte `%localappdata%\DayZ` a stiskněte Enter

Hledejte nejnovější soubor pojmenovaný takto:

```
script_<datum>_<čas>.log
```

Například: `script_2025-01-15_14-30-22.log`

### Co hledat

Otevřete soubor logu ve vašem textovém editoru a vyhledejte `[MyFirstMod]`. Měli byste vidět jednu z těchto zpráv:

```
[MyFirstMod] Hello World! The SERVER mission has started.
```

nebo (pokud jste načetli jako klient):

```
[MyFirstMod] Hello World! The CLIENT mission has started.
```

**Pokud vidíte svou zprávu: gratulujeme.** Váš první DayZ mod funguje. Úspěšně jste:

1. Vytvořili adresářovou strukturu modu
2. Napsali konfiguraci, kterou engine čte
3. Napojili se na vanilkový herní kód pomocí `modded class`
4. Vytiskli výstup do skriptového logu

### Co když vidíte chyby?

Pokud log obsahuje řádky začínající `SCRIPT (E):`, něco se pokazilo. Přečtěte si další sekci.

---

## Krok 10: Řešení běžných problémů

### Problém: Žádný výstup v logu (mod se zdá, že se nenačítá)

**Zkontrolujte parametry spuštění.** Cesta `-mod=` musí ukazovat na správnou složku. Pokud používáte file patching, ověřte, že cesta ukazuje na složku obsahující `Scripts/config.cpp` přímo (ne na složku `@`).

**Zkontrolujte, zda config.cpp existuje na správné úrovni.** Musí být v `Scripts/config.cpp` uvnitř kořene vašeho modu. Pokud je ve špatné složce, engine váš mod tiše ignoruje.

**Zkontrolujte název třídy CfgPatches.** Pokud neexistuje blok `CfgPatches`, nebo je jeho syntaxe špatná, celé PBO je přeskočeno.

**Podívejte se na hlavní log DayZ** (nejen na skriptový log). Zkontrolujte:
```
C:\Users\<VašeJméno>\AppData\Local\DayZ\DayZ_<datum>_<čas>.RPT
```
Vyhledejte název vašeho modu. Můžete vidět zprávy jako "Addon MyFirstMod_Scripts requires addon DZ_Data which is not loaded."

### Problém: `SCRIPT (E): Undefined variable` nebo `Undefined type`

To znamená, že váš kód odkazuje na něco, co engine nerozpoznává. Běžné příčiny:

- **Překlep v názvu třídy.** `MisionServer` místo `MissionServer` (všimněte si dvojitého 's').
- **Špatná skriptová vrstva.** Pokud odkazujete na `PlayerBase` z `5_Mission`, mělo by to fungovat. Ale pokud jste svůj soubor omylem umístili do `3_Game` a odkazujete na typy misí, dostanete tuto chybu.
- **Chybějící volání `super.OnInit()`.** Jeho vynechání může způsobit kaskádové selhání.

### Problém: `SCRIPT (E): Member not found`

Metoda, kterou voláte, na třídě neexistuje. Dvakrát zkontrolujte název metody a ujistěte se, že přepisujete skutečnou vanilkovou metodu. `OnInit` existuje na `MissionServer` a `MissionGameplay` -- ale ne na každé třídě.

### Problém: Mod se načte, ale skript se nikdy nespustí

- **Přípona souboru:** Ujistěte se, že váš skriptový soubor končí na `.c` (ne `.c.txt` nebo `.cs`). Windows může skrývat přípony ve výchozím nastavení.
- **Nesoulad cesty ke skriptu:** Cesta `files[]` v `config.cpp` musí odpovídat vaší skutečné adresářové struktuře. `"MyFirstMod/Scripts/5_Mission"` znamená, že engine hledá složku na přesně této cestě relativní ke kořenu modu.
- **Název třídy:** `modded class MissionServer` rozlišuje velká a malá písmena. Musí přesně odpovídat vanilkovému názvu třídy.

### Problém: Chyby při balení PBO

- Ujistěte se, že `config.cpp` je na kořenové úrovni toho, co balíte (složka `Scripts/`).
- Zkontrolujte, zda prefix v Addon Builderu odpovídá cestě vašeho modu.
- Ujistěte se, že ve složce Scripts nejsou zamíchány ne-textové soubory (žádné `.exe`, `.dll` nebo binární soubory).

### Problém: Hra padá při spuštění

- Zkontrolujte chyby syntaxe v `config.cpp`. Chybějící středník, závorka nebo uvozovka může způsobit pád parseru konfigurace.
- Ověřte, že `requiredAddons` uvádí platné názvy addonů. Chybně napsaný název addonu způsobí tvrdé selhání.
- Odstraňte váš mod z parametrů spuštění a potvrďte, že se hra spustí bez něj. Poté ho přidejte zpět pro izolaci problému.

---

## Kompletní reference souborů

Zde jsou všechny tři soubory v kompletní formě, pro snadné kopírování:

### Soubor 1: `MyFirstMod/mod.cpp`

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Soubor 2: `MyFirstMod/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Soubor 3: `MyFirstMod/Scripts/5_Mission/MyFirstMod/MissionHello.c`

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

---

## Další kroky

Nyní, když máte fungující mod, zde jsou přirozené další směry:

1. **[Kapitola 8.2: Vytvoření vlastního předmětu](02-custom-item.md)** -- Definujte nový herní předmět s texturami a spawnováním.
2. **Přidejte další skriptové vrstvy** -- Vytvořte složky `3_Game` a `4_World` pro organizaci konfigurace, datových tříd a logiky entit. Viz [Kapitola 2.1: Pětivrstvá skriptová hierarchie](../02-mod-structure/01-five-layers.md).
3. **Přidejte klávesové zkratky** -- Vytvořte soubor `Inputs.xml` a zaregistrujte vlastní klávesové akce.
4. **Vytvořte UI** -- Sestavte herní panely pomocí souborů rozložení a `ScriptedWidgetEventHandler`. Viz [Kapitola 3: GUI systém](../03-gui-system/01-widget-types.md).
5. **Použijte framework** -- Integrujte se s Community Framework (CF) nebo jiným frameworkem pro pokročilé funkce jako RPC, správa konfigurace a admin panely.

---

## Osvědčené postupy

- **Vždy testujte s `-filePatching` před vytvářením PBO.** Odstraní to cyklus balení-kopírování-restartování a sníží čas iterace z minut na sekundy.
- **Začněte s vrstvou `5_Mission` pro nejrychlejší iteraci.** Hooky misí jako `OnInit()` jsou nejjednodušší způsob, jak prokázat, že se váš mod načítá a běží. Přidejte `3_Game` a `4_World` teprve když je skutečně potřebujete.
- **Vždy volejte `super` jako první v přepsaných metodách.** Vynechání `super.OnInit()` tiše rozbije vanilkové chování a každý další mod hookující stejnou metodu.
- **Používejte unikátní prefix v Print výstupu** (např. `[MyFirstMod]`). Skriptové logy obsahují tisíce řádků z vanilky a dalších modů -- prefix je jediný způsob, jak rychle najít váš výstup.
- **Udržujte syntaxi `config.cpp` jednoduchou a validní.** Chybějící středník nebo závorka v config.cpp způsobí tvrdý pád nebo tiché přeskočení modu bez jasné chybové zprávy.

---

## Teorie vs. praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| Pole `mod.cpp` | `version` se používá pro řešení závislostí | Engine řetězec verze zcela ignoruje -- je čistě kosmetický pro launcher. |
| CfgPatches `requiredAddons` | Uvádí závislosti, aby se váš mod načetl ve správném pořadí | Pokud chybně napíšete název addonu, celé PBO je tiše přeskočeno bez chyby ve skriptovém logu. Zkontrolujte soubor `.RPT`. |
| File patching | Upravte soubor `.c` a připojte se znovu pro okamžité zobrazení změn | `config.cpp` a nově přidané soubory NEJSOU pokryty file patchingem. Pro ty stále potřebujete přestavbu PBO. |
| Testování v offline režimu | Rychlý způsob ověření funkčnosti modu | Některá API (jako `GetGame().GetPlayer().GetIdentity()`) vrací NULL v offline režimu, což způsobuje pády, které se na skutečném serveru nestávají. |

---

## Co jste se naučili

V tomto tutoriálu jste se naučili:
- Jak nainstalovat DayZ Tools a nastavit pracovní prostor P: disku
- Tři základní soubory, které každý mod potřebuje: `mod.cpp`, `config.cpp` a alespoň jeden skript `.c`
- Jak `modded class` rozšiřuje vanilkové třídy bez jejich nahrazení
- Jak zabalit PBO, načíst mod a ověřit, že funguje čtením skriptového logu

**Další:** [Kapitola 8.2: Vytvoření vlastního předmětu](02-custom-item.md)
