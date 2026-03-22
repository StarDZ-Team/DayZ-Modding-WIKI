# Chapter 8.5: Using the DayZ Mod Template

[Home](../README.md) | [<< Previous: Adding Chat Commands](04-chat-commands.md) | **Using the DayZ Mod Template** | [Next: Debugging & Testing >>](06-debugging-testing.md)

---

## Obsah

- [Co je šablona DayZ modu?](#co-je-šablona-dayz-modu)
- [Co šablona poskytuje](#co-šablona-poskytuje)
- [Krok 1: Klonování nebo stažení šablony](#krok-1-klonování-nebo-stažení-šablony)
- [Krok 2: Pochopení struktury souborů](#krok-2-pochopení-struktury-souborů)
- [Krok 3: Přejmenování modu](#krok-3-přejmenování-modu)
- [Krok 4: Aktualizace config.cpp](#krok-4-aktualizace-configcpp)
- [Krok 5: Aktualizace mod.cpp](#krok-5-aktualizace-modcpp)
- [Krok 6: Přejmenování skriptových složek a souborů](#krok-6-přejmenování-skriptových-složek-a-souborů)
- [Krok 7: Sestavení a testování](#krok-7-sestavení-a-testování)
- [Integrace s DayZ Tools a Workbench](#integrace-s-dayz-tools-a-workbench)
- [Šablona vs. ruční nastavení](#šablona-vs-ruční-nastavení)
- [Další kroky](#další-kroky)

---

## Co je šablona DayZ modu?

**Šablona DayZ modu** je open-source repozitář spravovaný InclementDabem, který poskytuje kompletní, připravenou kostru modu pro DayZ:

**Repozitář:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Místo vytváření každého souboru ručně (jak je popsáno v [Kapitole 8.1: Váš první mod](01-first-mod.md)) vám šablona poskytne předpřipravenou adresářovou strukturu se vším boilerplate kódem. Naklonujete ji, přejmenujete několik identifikátorů a můžete začít psát herní logiku.

Toto je doporučený výchozí bod pro každého, kdo již vytvořil Hello World mod a chce přejít ke složitějším projektům.

---

## Co šablona poskytuje

Šablona obsahuje vše, co DayZ mod potřebuje pro kompilaci a načtení:

| Soubor / složka | Účel |
|-----------------|------|
| `mod.cpp` | Metadata modu (název, autor, verze) zobrazená v DayZ launcheru |
| `config.cpp` | Deklarace CfgPatches a CfgMods, které registrují mod v enginu |
| `Scripts/3_Game/` | Zárodky skriptů herní vrstvy (výčty, konstanty, konfigurační třídy) |
| `Scripts/4_World/` | Zárodky skriptů světové vrstvy (entity, manažery, interakce se světem) |
| `Scripts/5_Mission/` | Zárodky skriptů misijní vrstvy (UI, háčky misí) |
| `.gitignore` | Předkonfigurované ignorování pro DayZ vývoj (PBO, logy, dočasné soubory) |

Šablona následuje standardní pětivrstvou hierarchii skriptů zdokumentovanou v [Kapitole 2.1: Pětivrstvá hierarchie skriptů](../02-mod-structure/01-five-layers.md). Všechny tři skriptové vrstvy jsou propojeny v config.cpp, takže můžete okamžitě umístit kód do kterékoli vrstvy bez další konfigurace.

---

## Krok 1: Klonování nebo stažení šablony

### Možnost A: Použití funkce GitHubu "Use this template"

1. Přejděte na [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Klikněte na zelené tlačítko **"Use this template"** v horní části repozitáře
3. Vyberte **"Create a new repository"**
4. Pojmenujte svůj repozitář (např. `MyAwesomeMod`)
5. Naklonujte svůj nový repozitář na disk P:

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### Možnost B: Přímé klonování

Pokud nepotřebujete vlastní GitHub repozitář, naklonujte šablonu přímo:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Možnost C: Stažení jako ZIP

1. Přejděte na stránku repozitáře
2. Klikněte na **Code** a poté **Download ZIP**
3. Rozbalte ZIP do `P:\MyAwesomeMod\`

---

## Krok 2: Pochopení struktury souborů

Po klonování vypadá adresář vašeho modu takto:

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (skripty herní vrstvy)
        4_World\
            ModName\
                (skripty světové vrstvy)
        5_Mission\
            ModName\
                (skripty misijní vrstvy)
```

### Jak jednotlivé části do sebe zapadají

**`mod.cpp`** je identifikační karta vašeho modu. Ovládá, co hráči vidí v seznamu modů DayZ launcheru. Všechna dostupná pole najdete v [Kapitole 2.3: mod.cpp a Workshop](../02-mod-structure/03-mod-cpp.md).

**`Scripts/config.cpp`** je nejkritičtější soubor. Říká enginu DayZ:
- Na čem váš mod závisí (`CfgPatches.requiredAddons[]`)
- Kde se nachází jednotlivé skriptové vrstvy (`CfgMods.class defs`)
- Jaké preprocesorové definice nastavit (`defines[]`)

Kompletní referenci najdete v [Kapitole 2.2: config.cpp do hloubky](../02-mod-structure/02-config-cpp.md).

**`Scripts/3_Game/`** se načítá jako první. Sem umístěte výčty, konstanty, RPC ID, konfigurační třídy a cokoli, co neodkazuje na světové entity.

**`Scripts/4_World/`** se načítá jako druhá. Sem umístěte třídy entit (`modded class ItemBase`), manažery a cokoli, co interaguje s herními objekty.

**`Scripts/5_Mission/`** se načítá jako poslední. Sem umístěte háčky misí (`modded class MissionServer`), UI panely a startovací logiku. Tato vrstva může odkazovat na typy ze všech nižších vrstev.

---

## Krok 3: Přejmenování modu

Šablona je dodávána s zástupnými názvy. Musíte je nahradit skutečným názvem vašeho modu. Zde je systematický přístup.

### Zvolte si názvy

Než začnete cokoli upravovat, rozhodněte se o:

| Identifikátor | Příklad | Použit v |
|----------------|---------|----------|
| **Zobrazovaný název modu** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Název adresáře** | `MyAwesomeMod` | Název složky, cesty v config.cpp |
| **Třída CfgPatches** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **Třída CfgMods** | `MyAwesomeMod` | config.cpp CfgMods |
| **Podadresář skriptů** | `MyAwesomeMod` | Uvnitř 3_Game/, 4_World/, 5_Mission/ |
| **Preprocesorová definice** | `MYAWESOMEMOD` | config.cpp defines[], kontroly #ifdef |

### Pravidla pojmenování

- **Žádné mezery ani speciální znaky** v názvech adresářů a tříd. Používejte PascalCase nebo podtržítka.
- **Názvy tříd CfgPatches musí být globálně unikátní.** Dva mody se stejným názvem třídy CfgPatches budou v konfliktu. Použijte název svého modu jako prefix.
- **Názvy podadresářů skriptů** uvnitř každé vrstvy by měly odpovídat názvu vašeho modu pro konzistenci.

---

## Krok 4: Aktualizace config.cpp

Otevřete `Scripts/config.cpp` a aktualizujte následující sekce.

### CfgPatches

Nahraďte název šablonové třídy vlastním:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Váš unikátní název patche
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Závislost na základní hře
        };
    };
};
```

Pokud váš mod závisí na jiném modu, přidejte jeho název třídy CfgPatches do `requiredAddons[]`:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Závisí na Community Framework
};
```

### CfgMods

Aktualizujte identitu modu a cesty ke skriptům:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**Klíčové body:**
- Hodnota `dir` musí přesně odpovídat názvu kořenové složky vašeho modu.
- Každá cesta v `files[]` je relativní vůči kořenu modu.
- Pole `dependencies[]` by mělo obsahovat seznam vanilla skriptových modulů, do kterých se napojujete. Většina modů používá všechny tři: `"Game"`, `"World"` a `"Mission"`.

### Preprocesorové definice (volitelné)

Pokud chcete, aby ostatní mody mohly detekovat přítomnost vašeho modu, přidejte pole `defines[]`:

```cpp
class MyAwesomeMod
{
    // ... (ostatní pole výše)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... ostatní moduly ...
    };

    // Povolení detekce mezi mody
    defines[] = { "MYAWESOMEMOD" };
};
```

Ostatní mody pak mohou použít `#ifdef MYAWESOMEMOD` k podmíněné kompilaci kódu, který se integruje s vaším modem.

---

## Krok 5: Aktualizace mod.cpp

Otevřete `mod.cpp` v kořenovém adresáři a aktualizujte jej informacemi o vašem modu:

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "Stručný popis toho, co váš mod dělá.";
picture      = "";             // Volitelné: cesta k náhledovému obrázku
logo         = "";             // Volitelné: cesta k logu
logoSmall    = "";             // Volitelné: cesta k malému logu
logoOver     = "";             // Volitelné: cesta k logu při najetí myší
tooltip      = "My Awesome Mod";
action       = "";             // Volitelné: URL na webové stránky modu
```

Minimálně nastavte `name`, `author` a `overview`. Ostatní pole jsou volitelná, ale zlepšují prezentaci v launcheru.

---

## Krok 6: Přejmenování skriptových složek a souborů

Přejmenujte podadresáře skriptů uvnitř každé vrstvy tak, aby odpovídaly názvu vašeho modu:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Uvnitř těchto složek přejmenujte všechny zástupné `.c` soubory a aktualizujte jejich názvy tříd. Například pokud šablona obsahuje soubor jako `ModInit.c` s třídou nazvanou `ModInit`, přejmenujte ho na `MyAwesomeModInit.c` a aktualizujte třídu:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## Krok 7: Sestavení a testování

### Použití File Patching (rychlá iterace)

Nejrychlejší způsob testování během vývoje:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

Toto načte vaše skripty přímo ze zdrojových složek bez balení PBO. Upravte `.c` soubor, restartujte hru a okamžitě uvidíte změny.

### Použití Addon Builderu (pro distribuci)

Když jste připraveni k distribuci:

1. Otevřete **DayZ Tools** ze Steamu
2. Spusťte **Addon Builder**
3. Nastavte **Source directory** na `P:\MyAwesomeMod\Scripts\`
4. Nastavte **Output directory** na `P:\@MyAwesomeMod\Addons\`
5. Nastavte **Prefix** na `MyAwesomeMod\Scripts`
6. Klikněte na **Pack**

Poté zkopírujte `mod.cpp` vedle složky `Addons`:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Ověření ve script logu

Po spuštění zkontrolujte script log pro vaše zprávy:

```
%localappdata%\DayZ\script_<datum>_<čas>.log
```

Hledejte prefix tag vašeho modu (např. `[MyAwesomeMod]`).

---

## Integrace s DayZ Tools a Workbench

### Workbench

DayZ Workbench umí otevřít a upravovat skripty vašeho modu se zvýrazňováním syntaxe:

1. Otevřete **Workbench** z DayZ Tools
2. Přejděte na **File > Open** a navigujte do složky `Scripts/` vašeho modu
3. Otevřete jakýkoli `.c` soubor pro úpravu se základní podporou Enforce Script

Workbench čte `config.cpp`, aby pochopil, které soubory patří ke kterému skriptovému modulu, takže správně nakonfigurovaný config.cpp je nezbytný.

### Nastavení disku P:

Šablona je navržena pro práci z disku P:. Pokud jste klonovali na jiné místo, vytvořte junction:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

Tím zpřístupníte mod na `P:\MyAwesomeMod` bez přesouvání souborů.

### Automatizace Addon Builderu

Pro opakované sestavení si můžete vytvořit batch soubor v kořenu vašeho modu:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Sestavení dokončeno.
pause
```

---

## Šablona vs. ruční nastavení

| Aspekt | Šablona | Ručně (Kapitola 8.1) |
|--------|---------|----------------------|
| **Čas do prvního sestavení** | ~2 minuty | ~15 minut |
| **Všechny 3 skriptové vrstvy** | Předkonfigurované | Přidáváte je podle potřeby |
| **config.cpp** | Kompletní se všemi moduly | Minimální (pouze mise) |
| **Připraveno pro Git** | .gitignore zahrnuto | Vytváříte vlastní |
| **Vzdělávací hodnota** | Nižší (soubory předpřipravené) | Vyšší (sestavujete vše sami) |
| **Doporučeno pro** | Zkušené moddery, nové projekty | Začátečníky, kteří se učí základy |

**Doporučení:** Pokud je toto váš úplně první DayZ mod, začněte s [Kapitolou 8.1](01-first-mod.md), abyste pochopili každý soubor. Jakmile se budete cítit pohodlně, používejte šablonu pro všechny budoucí projekty.

---

## Další kroky

S vaším modem založeným na šabloně v provozu můžete:

1. **Přidat vlastní předmět** -- Postupujte podle [Kapitoly 8.2: Vytvoření vlastního předmětu](02-custom-item.md) pro definici předmětů v config.cpp.
2. **Vytvořit admin panel** -- Postupujte podle [Kapitoly 8.3: Tvorba admin panelu](03-admin-panel.md) pro UI správy serveru.
3. **Přidat chatové příkazy** -- Postupujte podle [Kapitoly 8.4: Přidání chatových příkazů](04-chat-commands.md) pro herní textové příkazy.
4. **Prostudovat config.cpp do hloubky** -- Přečtěte si [Kapitolu 2.2: config.cpp do hloubky](../02-mod-structure/02-config-cpp.md), abyste pochopili každé pole.
5. **Naučit se možnosti mod.cpp** -- Přečtěte si [Kapitolu 2.3: mod.cpp a Workshop](../02-mod-structure/03-mod-cpp.md) pro publikování na Workshop.
6. **Přidat závislosti** -- Pokud váš mod používá Community Framework nebo jiný mod, aktualizujte `requiredAddons[]` a podívejte se na [Kapitolu 2.4: Váš první mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Předchozí:** [Kapitola 8.4: Přidání chatových příkazů](04-chat-commands.md) | [Domů](../README.md)
