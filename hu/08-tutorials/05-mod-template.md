# Chapter 8.5: Using the DayZ Mod Template

[Home](../README.md) | [<< Previous: Adding Chat Commands](04-chat-commands.md) | **Using the DayZ Mod Template** | [Next: Debugging & Testing >>](06-debugging-testing.md)

---

## Tartalomjegyzek

- [Mi az a DayZ Mod Sablon?](#mi-az-a-dayz-mod-sablon)
- [Mit biztosit a sablon](#mit-biztosit-a-sablon)
- [1. lepes: Sablon klonozasa vagy letoltese](#1-lepes-sablon-klonozasa-vagy-letoltese)
- [2. lepes: A fajlszerkezet megertese](#2-lepes-a-fajlszerkezet-megertese)
- [3. lepes: A mod atnevezese](#3-lepes-a-mod-atnevezese)
- [4. lepes: A config.cpp frissitese](#4-lepes-a-configcpp-frissitese)
- [5. lepes: A mod.cpp frissitese](#5-lepes-a-modcpp-frissitese)
- [6. lepes: Script mappak es fajlok atnevezese](#6-lepes-script-mappak-es-fajlok-atnevezese)
- [7. lepes: Forditas es teszteles](#7-lepes-forditas-es-teszteles)
- [Integracio a DayZ Tools es Workbench eszkozokkel](#integracio-a-dayz-tools-es-workbench-eszkozokkel)
- [Sablon vs. kezi beallitas](#sablon-vs-kezi-beallitas)
- [Kovetkezo lepesek](#kovetkezo-lepesek)

---

## Mi az a DayZ Mod Sablon?

A **DayZ Mod Sablon** egy nyilt forraskodu tarolo, amelyet InclementDab tart karban, es teljes, hasznalatra kesz mod vazat biztosit a DayZ-hoz:

**Tarolo:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Ahelyett, hogy minden fajlt kezzel hoznal letre (ahogy a [8.1. fejezetben: Az elso modod](01-first-mod.md) lathato), a sablon egy elorekeszitett konyvtarszerkezetet ad az osszes boilerplate koddal. Klonozod, atnevezel nehany azonositot, es elkezdheted irni a jatek logikat.

Ez az ajanlott kiindulasi pont mindenkinek, aki mar keszitett egy Hello World modot es bonyolultabb projektekre akar atvaltani.

---

## Mit biztosit a sablon

A sablon mindent tartalmaz, amire egy DayZ modnak szuksege van a forditashoz es betolteshez:

| Fajl / mappa | Cel |
|--------------|-----|
| `mod.cpp` | Mod metaadatok (nev, szerzo, verzio) megjelenitve a DayZ launcherben |
| `config.cpp` | CfgPatches es CfgMods deklaraciok, amelyek regisztaljak a modot az engine-nel |
| `Scripts/3_Game/` | Jatek reteg script stubok (enumok, konstansok, konfiguracios osztalyok) |
| `Scripts/4_World/` | Vilag reteg script stubok (entitasok, menedzserek, vilag interakciok) |
| `Scripts/5_Mission/` | Misszio reteg script stubok (UI, misszio hookok) |
| `.gitignore` | Elorekonfiguralt kizarasok DayZ fejleszteshez (PBO, logok, ideiglenes fajlok) |

A sablon koveti a standard 5 retegu script hierarchiat, amelyet a [2.1. fejezetben: Az 5 retegu script hierarchia](../02-mod-structure/01-five-layers.md) dokumentaltunk. Mindharom script reteg be van kotozve a config.cpp-ben, igy azonnal elhelyezhetsz kodot barmely retegben tovabbi konfiguralás nelkul.

---

## 1. lepes: Sablon klonozasa vagy letoltese

### A opcio: A GitHub "Use this template" funkcio hasznalata

1. Menj a [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template) oldalra
2. Kattints a zold **"Use this template"** gombra a tarolo tetejen
3. Valaszd a **"Create a new repository"** lehetoseget
4. Nevezd el a tarolot (pl. `MyAwesomeMod`)
5. Klonozd az uj tarolot a P: meghajtora:

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### B opcio: Kozvetlen klonozas

Ha nincs szukseged sajat GitHub tarolora, klonozd kozvetlenul a sablont:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### C opcio: Letoltes ZIP-kent

1. Menj a tarolo oldalara
2. Kattints a **Code**, majd a **Download ZIP** gombra
3. Csomagold ki a ZIP-et a `P:\MyAwesomeMod\` mappaba

---

## 2. lepes: A fajlszerkezet megertese

Klonozas utan a mod konyvtarad igy nez ki:

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (jatek reteg scriptek)
        4_World\
            ModName\
                (vilag reteg scriptek)
        5_Mission\
            ModName\
                (misszio reteg scriptek)
```

### Hogyan illeszkednek ossze az egyes reszek

A **`mod.cpp`** a modod szemelyi igazolvanya. Azt szabalyozza, mit latnak a jatekosok a DayZ launcher modlistajaban. Az osszes elerheto mezoert lasd a [2.3. fejezetet: mod.cpp es Workshop](../02-mod-structure/03-mod-cpp.md).

A **`Scripts/config.cpp`** a legfontosabb fajl. Megmondja a DayZ engine-nek:
- Mitol fugg a modod (`CfgPatches.requiredAddons[]`)
- Hol talalhatok az egyes script retegek (`CfgMods.class defs`)
- Milyen preprocesszor definiciokat allitson be (`defines[]`)

A teljes referenciat lasd a [2.2. fejezetben: config.cpp melymerules](../02-mod-structure/02-config-cpp.md).

A **`Scripts/3_Game/`** toltodik be eloszor. Ide helyezd az enumokat, konstansokat, RPC azonositokat, konfiguracios osztalyokat es mindent, ami nem hivatkozik vilag entitasokra.

A **`Scripts/4_World/`** toltodik be masodikkent. Ide helyezd az entitas osztalyokat (`modded class ItemBase`), menedzsereket es mindent, ami jatek objektumokkal kerul interakcioba.

A **`Scripts/5_Mission/`** toltodik be utolsokent. Ide helyezd a misszio hookokat (`modded class MissionServer`), UI paneleket es indulo logikat. Ez a reteg hivatkozhat az osszes alacsonyabb reteg tipusaira.

---

## 3. lepes: A mod atnevezese

A sablon helyorzo nevekkel erkezik. Ezeket ki kell cserelned a modod tenyleges nevere. Ime egy szisztematikus megkozelites.

### Valaszd ki a neveket

Mielott barmit szerkesztenel, dontsd el:

| Azonosito | Pelda | Hasznalati hely |
|-----------|-------|-----------------|
| **Mod megjeleno neve** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Konyvtarnev** | `MyAwesomeMod` | Mappanev, config.cpp utvonalak |
| **CfgPatches osztaly** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **CfgMods osztaly** | `MyAwesomeMod` | config.cpp CfgMods |
| **Script almappa** | `MyAwesomeMod` | A 3_Game/, 4_World/, 5_Mission/ mappakban |
| **Preprocesszor definicio** | `MYAWESOMEMOD` | config.cpp defines[], #ifdef ellenorzesek |

### Elnevezesi szabalyok

- **Nincsenek szokozok vagy specialis karakterek** a konyvtar- es osztalynevekben. Hasznalj PascalCase-t vagy alahuzast.
- **A CfgPatches osztalyneveknek globalisan egyedinek kell lenniuk.** Ket mod ugyanazzal a CfgPatches osztalynevvel utkozni fog. Hasznald a mod nevedet prefixkent.
- **A script almappaneveknek** az egyes retegeken belul meg kell egyezniuk a mod neveddel a kovetkezetesseg erdekeben.

---

## 4. lepes: A config.cpp frissitese

Nyisd meg a `Scripts/config.cpp` fajlt es frissitsd a kovetkezo szekciokatl.

### CfgPatches

Csereld ki a sablon osztalynevet a sajatodra:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- A te egyedi patch neved
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Alapjatek fuggoseg
        };
    };
};
```

Ha a modod fugg egy masik modtol, add hozza annak CfgPatches osztalynevet a `requiredAddons[]` tombhoz:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Fugg a Community Frameworktol
};
```

### CfgMods

Frissitsd a mod identitasat es a script utvonalakat:

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

**Fontos pontok:**
- A `dir` erteknek pontosan meg kell egyeznie a mod gyoker mappajanak nevevel.
- Minden `files[]` utvonal a mod gyokerehez viszonyitott.
- A `dependencies[]` tombnek tartalmaznia kell, mely vanilla script modulokba kapcsolodsz be. A legtobb mod mindharmat hasznalja: `"Game"`, `"World"` es `"Mission"`.

### Preprocesszor definiciok (opcionalis)

Ha azt szeretned, hogy mas modok felismerjek a modod jelenletet, adj hozza egy `defines[]` tombot:

```cpp
class MyAwesomeMod
{
    // ... (tobbi mezo fentebb)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... tobbi modul ...
    };

    // Modok kozotti felismeres engedelyezese
    defines[] = { "MYAWESOMEMOD" };
};
```

Mas modok ezutan `#ifdef MYAWESOMEMOD` felteteles forditassal integralodhatatnak a mododdal.

---

## 5. lepes: A mod.cpp frissitese

Nyisd meg a `mod.cpp` fajlt a gyokerkonyvtarban es frissitsd a mod informacioival:

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "Rovid leiras arrol, mit csinal a modod.";
picture      = "";             // Opcionalis: utvonal az elozetesi kephez
logo         = "";             // Opcionalis: utvonal a logohoz
logoSmall    = "";             // Opcionalis: utvonal a kis logohoz
logoOver     = "";             // Opcionalis: utvonal a hover logohoz
tooltip      = "My Awesome Mod";
action       = "";             // Opcionalis: URL a mod weboldalara
```

Minimum allitsd be a `name`, `author` es `overview` mezoket. A tobbi mezo opcionalis, de javitja a megjelenest a launcherben.

---

## 6. lepes: Script mappak es fajlok atnevezese

Nevezd at a script almappakat az egyes retegeken belul, hogy megegyezzenek a mod neveddel:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Ezeken a mappakon belul nevezd at a helyorzo `.c` fajlokat es frissitsd az osztalyneveiket. Peldaul, ha a sablon tartalmaz egy `ModInit.c` fajlt `ModInit` nevu osztalynal, nevezd at `MyAwesomeModInit.c`-re es frissitsd az osztalyt:

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

## 7. lepes: Forditas es teszteles

### File Patching hasznalata (gyors iteracio)

A leggyorsabb tesztelesi mod fejlesztes kozben:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

Ez kozvetlenul a forrasmappakbol tolti be a scriptjeidet PBO csomagolas nelkul. Szerkeszts egy `.c` fajlt, inditsd ujra a jatekot es azonnal lasd a valtozasokat.

### Addon Builder hasznalata (terjeszteshez)

Amikor keszen allsz a terjesztesre:

1. Nyisd meg a **DayZ Tools**-t a Steambol
2. Inditsd el az **Addon Builder**-t
3. Allitsd a **Source directory**-t `P:\MyAwesomeMod\Scripts\`-ra
4. Allitsd az **Output directory**-t `P:\@MyAwesomeMod\Addons\`-ra
5. Allitsd a **Prefix**-et `MyAwesomeMod\Scripts`-re
6. Kattints a **Pack** gombra

Ezutan masold a `mod.cpp`-t az `Addons` mappa melle:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Ellenorzes a script logban

Inditas utan ellenorizd a script logot az uzeneteidert:

```
%localappdata%\DayZ\script_<datum>_<ido>.log
```

Keresd a modod prefix tagjat (pl. `[MyAwesomeMod]`).

---

## Integracio a DayZ Tools es Workbench eszkozokkel

### Workbench

A DayZ Workbench keppes megnyitni es szerkeszteni a modod scriptjeit szintaxis kiemelsessel:

1. Nyisd meg a **Workbench**-et a DayZ Toolsbol
2. Menj a **File > Open** menube es navigalj a modod `Scripts/` mappajaba
3. Nyiss meg barmely `.c` fajlt szerkesztesre alapszintu Enforce Script tamogatassal

A Workbench olvassa a `config.cpp`-t, hogy megertse, mely fajlok mely script modulhoz tartoznak, ezert a helyesen konfiguralt config.cpp elengedhetetlen.

### P: meghajtó beallitas

A sablon ugy lett tervezve, hogy a P: meghajtorol mukodjon. Ha mashova klonoztal, hozz letre egy junction-t:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

Ezzel a mod elerheto lesz a `P:\MyAwesomeMod` cimen fajlok athelyezese nelkul.

### Addon Builder automatizalas

Ismetelt forditasokhoz keszithetsz egy batch fajlt a modod gyokereben:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Forditas befejezve.
pause
```

---

## Sablon vs. kezi beallitas

| Szempont | Sablon | Kezi (8.1. fejezet) |
|----------|--------|---------------------|
| **Ido az elso forditasig** | ~2 perc | ~15 perc |
| **Mindharom script reteg** | Elorekonfiguralt | Szukseg szerint adod hozza |
| **config.cpp** | Teljes az osszes modullal | Minimalis (csak misszio) |
| **Git kesz** | .gitignore mellekelve | Te hozod letre |
| **Tanulasi ertek** | Alacsonyabb (fajlok elorekeszitettek) | Magasabb (mindent magad epitesz) |
| **Ajanlott** | Tapasztalt moddereknek, uj projektekhez | Eloszor modoloknak, akik tanulnak |

**Ajanlás:** Ha ez az elso DayZ modod, kezdd a [8.1. fejezettel](01-first-mod.md), hogy megertsd minden fajlt. Amint otthonosan erzed magad, hasznald a sablont minden jovobeli projekthez.

---

## Kovetkezo lepesek

A sablonon alapulo mododdal mukodve mar:

1. **Adj hozza egyeni targyat** -- Kovesd a [8.2. fejezetet: Egyeni targy letrehozasa](02-custom-item.md) a targyak definialasahoz a config.cpp-ben.
2. **Epitsd meg az admin panelt** -- Kovesd a [8.3. fejezetet: Admin panel epitese](03-admin-panel.md) a szerver kezelesi UI-hoz.
3. **Adj hozza chat parancsokat** -- Kovesd a [8.4. fejezetet: Chat parancsok hozzaadasa](04-chat-commands.md) jatekon beluli szoveges parancsokhoz.
4. **Tanulmanyozd a config.cpp-t melyen** -- Olvasd el a [2.2. fejezetet: config.cpp melymerules](../02-mod-structure/02-config-cpp.md) minden mezo megertesehez.
5. **Ismerd meg a mod.cpp lehetosegeit** -- Olvasd el a [2.3. fejezetet: mod.cpp es Workshop](../02-mod-structure/03-mod-cpp.md) a Workshop publikalashoz.
6. **Adj hozza fuggosegeket** -- Ha a modod hasznalj a Community Frameworkot vagy mas modot, frissitsd a `requiredAddons[]` tombot es lasd a [2.4. fejezetet: Az elso mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Elozo:** [8.4. fejezet: Chat parancsok hozzaadasa](04-chat-commands.md) | [Fooldal](../README.md)
