# Kapitola 4.6: Balení PBO

[Domů](../README.md) | [<< Předchozí: Pracovní postup s DayZ Tools](05-dayz-tools.md) | **Balení PBO** | [Další: Průvodce Workbench >>](07-workbench-guide.md)

---

## Úvod

**PBO** (Packed Bank of Objects) je archivní formát DayZ -- ekvivalent souboru `.zip` pro herní obsah. Každý mod, který hra načítá, je dodáván jako jeden nebo více souborů PBO. Když se hráč přihlásí k odběru modu na Steam Workshopu, stahuje PBO. Když server načítá mody, čte PBO. PBO je konečný výstup celé moddingové pipeline.

Pochopení, jak správně vytvářet PBO -- kdy binarizovat, jak nastavit prefixy, jak strukturovat výstup a jak automatizovat proces -- je posledním krokem mezi vašimi zdrojovými soubory a funkčním modem. Tato kapitola pokrývá vše od základního konceptu po pokročilé automatizované build postupy.

---

## Obsah

- [Co je PBO?](#co-je-pbo)
- [Interní struktura PBO](#interní-struktura-pbo)
- [AddonBuilder: Nástroj pro balení](#addonbuilder-nástroj-pro-balení)
- [Příznak -packonly](#příznak--packonly)
- [Příznak -prefix](#příznak--prefix)
- [Binarizace: kdy je potřeba a kdy ne](#binarizace-kdy-je-potřeba-a-kdy-ne)
- [Podepisování klíčem](#podepisování-klíčem)
- [Struktura složky @mod](#struktura-složky-mod)
- [Automatizované build skripty](#automatizované-build-skripty)
- [Buildy modů s více PBO](#buildy-modů-s-více-pbo)
- [Časté chyby buildu a řešení](#časté-chyby-buildu-a-řešení)
- [Testování: File Patching vs. načítání PBO](#testování-file-patching-vs-načítání-pbo)
- [Osvědčené postupy](#osvědčené-postupy)

---

## Co je PBO?

PBO je plochý archivní soubor, který obsahuje adresářový strom herních assetů. Neobsahuje kompresi (na rozdíl od ZIP) -- soubory uvnitř jsou uloženy v původní velikosti. "Balení" je čistě organizační: mnoho souborů se stane jedním souborem s interní strukturou cest.

### Klíčové charakteristiky

- **Bez komprese:** Soubory jsou uloženy doslovně. Velikost PBO se rovná součtu jeho obsahu plus malé záhlaví.
- **Ploché záhlaví:** Seznam položek souborů s cestami, velikostmi a offsety.
- **Metadata prefixu:** Každé PBO deklaruje interní prefix cesty, který mapuje jeho obsah do virtuálního souborového systému enginu.
- **Pouze ke čtení za běhu:** Engine čte z PBO, ale nikdy do nich nezapisuje.
- **Podepsané pro multiplayer:** PBO mohou být podepsány párem klíčů ve stylu Bohemia pro ověření podpisů serverem.

### Proč PBO místo volných souborů

- **Distribuce:** Jeden soubor na komponentu modu je jednodušší než tisíce volných souborů.
- **Integrita:** Podepisování klíčem zajišťuje, že mod nebyl pozměněn.
- **Výkon:** I/O operace enginu jsou optimalizovány pro čtení z PBO.
- **Organizace:** Systém prefixů zajišťuje, že nedojde ke kolizím cest mezi mody.

---

## Interní struktura PBO

Když otevřete PBO (pomocí nástroje jako PBO Manager nebo MikeroTools), uvidíte adresářový strom:

```
MyMod.pbo
  $PBOPREFIX$                    <-- Textový soubor obsahující cestu prefixu
  config.bin                      <-- Binarizovaný config.cpp (nebo config.cpp při -packonly)
  Scripts/
    3_Game/
      MyConstants.c
    4_World/
      MyManager.c
    5_Mission/
      MyUI.c
  data/
    models/
      my_item.p3d                 <-- Binarizovaný ODOL (nebo MLOD při -packonly)
    textures/
      my_item_co.paa
      my_item_nohq.paa
      my_item_smdi.paa
    materials/
      my_item.rvmat
  sound/
    gunshot_01.ogg
  GUI/
    layouts/
      my_panel.layout
```

### $PBOPREFIX$

Soubor `$PBOPREFIX$` je malý textový soubor v kořenu PBO, který deklaruje prefix cesty modu. Například:

```
MyMod
```

To říká enginu: "Když něco odkazuje na `MyMod\data\textures\my_item_co.paa`, hledej uvnitř tohoto PBO na `data\textures\my_item_co.paa`."

### config.bin vs. config.cpp

- **config.bin:** Binarizovaná (binární) verze config.cpp, vytvořená Binarize. Rychlejší parsování při načítání.
- **config.cpp:** Původní textový formát konfigurace. Funguje v enginu, ale je mírně pomalejší na parsování.

Když buildíte s binarizací, config.cpp se stane config.bin. Když použijete `-packonly`, config.cpp je zahrnut tak, jak je.

---

## AddonBuilder: Nástroj pro balení

**AddonBuilder** je oficiální nástroj Bohemia pro balení PBO, zahrnutý v DayZ Tools. Může pracovat v GUI režimu nebo v režimu příkazového řádku.

### GUI režim

1. Spusťte AddonBuilder z DayZ Tools Launcheru.
2. **Source directory:** Procházejte do složky vašeho modu na P: (např. `P:\MyMod`).
3. **Output directory:** Procházejte do vaší výstupní složky (např. `P:\output`).
4. **Options:**
   - **Binarize:** Zaškrtněte pro spuštění Binarize na obsahu (konvertuje P3D, textury, configy).
   - **Sign:** Zaškrtněte a vyberte klíč pro podepsání PBO.
   - **Prefix:** Zadejte prefix modu (např. `MyMod`).
5. Klikněte na **Pack**.

### Režim příkazového řádku

Režim příkazového řádku je preferován pro automatizované buildy:

```bash
AddonBuilder.exe [source_path] [output_path] [options]
```

**Kompletní příklad:**
```bash
"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe" ^
    "P:\MyMod" ^
    "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyKey"
```

### Možnosti příkazového řádku

| Příznak | Popis |
|---------|-------|
| `-prefix=<path>` | Nastaví interní prefix PBO (kritický pro rozlišení cest) |
| `-packonly` | Přeskočí binarizaci, zabalí soubory tak, jak jsou |
| `-sign=<key_path>` | Podepíše PBO specifikovaným BI klíčem (cesta k privátnímu klíči, bez přípony) |
| `-include=<path>` | Seznam zahrnutých souborů -- zabalí pouze soubory odpovídající tomuto filtru |
| `-exclude=<path>` | Seznam vyloučených souborů -- přeskočí soubory odpovídající tomuto filtru |
| `-binarize=<path>` | Cesta k Binarize.exe (pokud není ve výchozím umístění) |
| `-temp=<path>` | Dočasný adresář pro výstup Binarize |
| `-clear` | Vyčistí výstupní adresář před balením |
| `-project=<path>` | Cesta k projektovému disku (obvykle `P:\`) |

---

## Příznak -packonly

Příznak `-packonly` je jednou z nejdůležitějších možností v AddonBuilderu. Říká nástroji, aby přeskočil veškerou binarizaci a zabalil zdrojové soubory přesně tak, jak jsou.

### Kdy použít -packonly

| Obsah modu | Použít -packonly? | Důvod |
|------------|-------------------|-------|
| Pouze skripty (.c soubory) | **Ano** | Skripty se nikdy nebinarizují |
| UI layouty (.layout) | **Ano** | Layouty se nikdy nebinarizují |
| Pouze audio (.ogg) | **Ano** | OGG je již připravený pro hru |
| Předem konvertované textury (.paa) | **Ano** | Již v konečném formátu |
| Config.cpp (bez CfgVehicles) | **Ano** | Jednoduché configy fungují nebinarizované |
| Config.cpp (s CfgVehicles) | **Ne** | Definice předmětů vyžadují binarizovaný config |
| P3D modely (MLOD) | **Ne** | Měly by být binarizovány do ODOL pro výkon |
| TGA/PNG textury (potřebují konverzi) | **Ne** | Musí být konvertovány do PAA |

### Praktické vodítko

Pro **mod obsahující pouze skripty** (jako framework nebo utilitní mod bez vlastních předmětů):
```bash
AddonBuilder.exe "P:\MyScriptMod" "P:\output" -prefix="MyScriptMod" -packonly
```

Pro **mod předmětů** (zbraně, oblečení, vozidla s modely a texturami):
```bash
AddonBuilder.exe "P:\MyItemMod" "P:\output" -prefix="MyItemMod" -sign="P:\keys\MyKey"
```

> **Tip:** Mnoho modů se dělí do více PBO právě kvůli optimalizaci procesu buildu. Skriptová PBO používají `-packonly` (rychlé), zatímco datová PBO s modely a texturami procházejí plnou binarizací (pomalejší, ale nezbytná).

---

## Příznak -prefix

Příznak `-prefix` nastavuje interní prefix cesty PBO, který je zapsán do souboru `$PBOPREFIX$` uvnitř PBO. Tento prefix je kritický -- určuje, jak engine rozlišuje cesty k obsahu uvnitř PBO.

### Jak prefix funguje

```
Zdroj: P:\MyMod\data\textures\item_co.paa
Prefix: MyMod
Interní cesta PBO: data\textures\item_co.paa

Rozlišení enginem: MyMod\data\textures\item_co.paa
  --> Hledá v MyMod.pbo: data\textures\item_co.paa
  --> Nalezeno!
```

### Víceúrovňové prefixy

Pro mody, které používají strukturu podsložek, může prefix obsahovat více úrovní:

```bash
# Zdroj na disku P:
P:\MyMod\MyMod\Scripts\3_Game\MyClass.c

# Pokud je prefix "MyMod\MyMod\Scripts"
# Interní PBO: 3_Game\MyClass.c
# Cesta enginu: MyMod\MyMod\Scripts\3_Game\MyClass.c
```

### Prefix musí odpovídat referencím

Pokud váš config.cpp odkazuje na `MyMod\data\texture_co.paa`, pak PBO obsahující tuto texturu musí mít prefix `MyMod` a soubor musí být na `data\texture_co.paa` uvnitř PBO. Nesoulad způsobí, že engine soubor nenajde.

### Běžné vzory prefixů

| Struktura modu | Zdrojová cesta | Prefix | Reference v configu |
|----------------|----------------|--------|---------------------|
| Jednoduchý mod | `P:\MyMod\` | `MyMod` | `MyMod\data\item.p3d` |
| Mod s prostorem jmen | `P:\MyMod_Weapons\` | `MyMod_Weapons` | `MyMod_Weapons\data\rifle.p3d` |
| Skriptový pod-balíček | `P:\MyFramework\MyMod\Scripts\` | `MyFramework\MyMod\Scripts` | (odkazováno přes config.cpp `CfgMods`) |

---

## Binarizace: kdy je potřeba a kdy ne

Binarizace je konverze lidsky čitelných zdrojových formátů do binárních formátů optimalizovaných pro engine. Je to nejčasově náročnější krok v procesu buildu a nejčastější zdroj chyb buildu.

### Co se binarizuje

| Typ souboru | Binarizuje se na | Povinné? |
|-------------|------------------|----------|
| `config.cpp` | `config.bin` | Povinné pro mody definující předměty (CfgVehicles, CfgWeapons) |
| `.p3d` (MLOD) | `.p3d` (ODOL) | Doporučeno -- ODOL se načítá rychleji a je menší |
| `.tga` / `.png` | `.paa` | Povinné -- engine potřebuje PAA za běhu |
| `.edds` | `.paa` | Povinné -- stejné jako výše |
| `.rvmat` | `.rvmat` (zpracovaný) | Vyřešení cest, menší optimalizace |
| `.wrp` | `.wrp` (optimalizovaný) | Povinné pro mody terénů/map |

### Co se NEBINARIZUJE

| Typ souboru | Důvod |
|-------------|-------|
| `.c` skripty | Skripty se načítají jako text enginem |
| `.ogg` audio | Již ve formátu připraveném pro hru |
| `.layout` soubory | Již ve formátu připraveném pro hru |
| `.paa` textury | Již v konečném formátu (předem konvertované) |
| `.json` data | Čteny jako text skriptovým kódem |

### Detaily binarizace Config.cpp

Binarizace config.cpp je krok, se kterým se většina modderů setkává s problémy. Binarizér parsuje text config.cpp, validuje jeho strukturu, řeší řetězce dědičnosti a výstupem je binární config.bin.

**Kdy je binarizace povinná pro config.cpp:**
- Config definuje položky `CfgVehicles` (předměty, zbraně, vozidla, budovy).
- Config definuje položky `CfgWeapons`.
- Config definuje položky, které odkazují na modely nebo textury.

**Kdy binarizace NENÍ povinná:**
- Config pouze definuje `CfgPatches` a `CfgMods` (registrace modu).
- Config pouze definuje zvukové konfigurace.
- Mody obsahující pouze skripty s minimálním configem.

> **Pravidlo:** Pokud váš config.cpp přidává fyzické předměty do herního světa, potřebujete binarizaci. Pokud pouze registruje skripty a definuje data, která nejsou předměty, `-packonly` funguje bez problémů.

---

## Podepisování klíčem

PBO mohou být podepsány kryptografickým párem klíčů. Servery používají ověření podpisů k zajištění, že všichni připojení klienti mají stejné (nemodifikované) soubory modů.

### Komponenty páru klíčů

| Soubor | Přípona | Účel | Kdo ho má |
|--------|---------|------|-----------|
| Privátní klíč | `.biprivatekey` | Podepisuje PBO během buildu | Pouze autor modu (UCHOVÁVEJTE V TAJNOSTI) |
| Veřejný klíč | `.bikey` | Ověřuje podpisy | Administrátoři serverů, distribuováno s modem |

### Generování klíčů

Použijte utility **DSSignFile** nebo **DSCreateKey** z DayZ Tools:

```bash
# Generování páru klíčů
DSCreateKey.exe MyModKey

# Toto vytvoří:
#   MyModKey.biprivatekey   (uchovávejte v tajnosti, nedistribuujte)
#   MyModKey.bikey          (distribuujte administrátorům serverů)
```

### Podepisování během buildu

```bash
AddonBuilder.exe "P:\MyMod" "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyModKey"
```

Toto vytvoří:
```
P:\output\
  MyMod.pbo
  MyMod.pbo.MyModKey.bisign    <-- Soubor podpisu
```

### Instalace klíče na straně serveru

Administrátoři serverů umístí veřejný klíč (`.bikey`) do adresáře `keys/` serveru:

```
DayZServer/
  keys/
    MyModKey.bikey             <-- Povolí klientům s tímto modem připojení
```

---

## Struktura složky @mod

DayZ očekává, že mody budou organizovány ve specifické adresářové struktuře s konvencí prefixu `@`:

```
@MyMod/
  addons/
    MyMod.pbo                  <-- Zabalený obsah modu
    MyMod.pbo.MyKey.bisign     <-- Podpis PBO (volitelné)
  keys/
    MyKey.bikey                <-- Veřejný klíč pro servery (volitelné)
  mod.cpp                      <-- Metadata modu
```

### mod.cpp

Soubor `mod.cpp` poskytuje metadata zobrazená v launcheru DayZ:

```cpp
name = "My Awesome Mod";
author = "ModAuthor";
version = "1.0.0";
url = "https://steamcommunity.com/sharedfiles/filedetails/?id=XXXXXXXXX";
```

### Mody s více PBO

Velké mody se často dělí do více PBO v rámci jedné složky `@mod`:

```
@MyFramework/
  addons/
    MyMod_Core_Scripts.pbo        <-- Vrstva skriptů
    MyMod_Core_Data.pbo           <-- Textury, modely, materiály
    MyMod_Core_GUI.pbo            <-- Soubory layoutů, imagesety
  keys/
    MyMod.bikey
  mod.cpp
```

### Načítání modů

Mody se načítají přes parametr `-mod`:

```bash
# Jeden mod
DayZDiag_x64.exe -mod="@MyMod"

# Více modů (oddělené středníkem)
DayZDiag_x64.exe -mod="@MyFramework;@MyMod_Weapons;@MyMod_Missions"
```

Složka `@` musí být v kořenovém adresáři hry, nebo musí být poskytnuta absolutní cesta.

---

## Automatizované build skripty

Ruční balení PBO přes GUI AddonBuilderu je přijatelné pro malé, jednoduché mody. Pro větší projekty s více PBO jsou automatizované build skripty nezbytné.

### Vzor batch skriptu

Typický `build_pbos.bat`:

```batch
@echo off
setlocal

set TOOLS="P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
set OUTPUT="P:\@MyMod\addons"
set KEY="P:\keys\MyKey"

echo === Building Scripts PBO ===
%TOOLS% "P:\MyMod\Scripts" %OUTPUT% -prefix="MyMod\Scripts" -packonly -clear

echo === Building Data PBO ===
%TOOLS% "P:\MyMod\Data" %OUTPUT% -prefix="MyMod\Data" -sign=%KEY% -clear

echo === Build Complete ===
pause
```

### Vzor Python build skriptu (dev.py)

Pro sofistikovanější buildy poskytuje Python skript lepší zpracování chyb, logování a podmíněnou logiku:

```python
import subprocess
import os
import sys

ADDON_BUILDER = r"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
OUTPUT_DIR = r"P:\@MyMod\addons"
KEY_PATH = r"P:\keys\MyKey"

PBOS = [
    {
        "name": "Scripts",
        "source": r"P:\MyMod\Scripts",
        "prefix": r"MyMod\Scripts",
        "packonly": True,
    },
    {
        "name": "Data",
        "source": r"P:\MyMod\Data",
        "prefix": r"MyMod\Data",
        "packonly": False,
    },
]

def build_pbo(pbo_config):
    """Build a single PBO."""
    cmd = [
        ADDON_BUILDER,
        pbo_config["source"],
        OUTPUT_DIR,
        f"-prefix={pbo_config['prefix']}",
    ]

    if pbo_config.get("packonly"):
        cmd.append("-packonly")
    else:
        cmd.append(f"-sign={KEY_PATH}")

    print(f"Building {pbo_config['name']}...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR building {pbo_config['name']}:")
        print(result.stderr)
        return False

    print(f"  {pbo_config['name']} built successfully.")
    return True

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = True
    for pbo in PBOS:
        if not build_pbo(pbo):
            success = False

    if success:
        print("\nAll PBOs built successfully.")
    else:
        print("\nBuild completed with errors.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Integrace s dev.py

Projekt MyMod používá `dev.py` jako centrální build orchestrátor:

```bash
python dev.py build          # Build všech PBO
python dev.py server         # Build + spuštění serveru + monitoring logů
python dev.py full           # Build + server + klient
```

Tento vzor je doporučen pro jakýkoli workspace s více mody. Jeden příkaz buildí vše, spustí server a zahájí monitoring -- eliminuje ruční kroky a snižuje lidské chyby.

---

## Buildy modů s více PBO

Velké mody těží z rozdělení do více PBO. To má několik výhod:

### Proč dělit do více PBO

1. **Rychlejší rebuildy.** Pokud změníte pouze skript, rebuildíte pouze skriptové PBO (s `-packonly`, což trvá sekundy). Datové PBO (s binarizací) trvá minuty a nepotřebuje rebuilding.
2. **Modulární načítání.** Serverová PBO mohou být vyloučena ze stahování klienty.
3. **Čistší organizace.** Skripty, data a GUI jsou jasně odděleny.
4. **Paralelní buildy.** Nezávislá PBO mohou být buildována současně.

### Typický vzor rozdělení

```
@MyMod/
  addons/
    MyMod_Core.pbo           <-- config.cpp, CfgPatches (binarizované)
    MyMod_Scripts.pbo         <-- Všechny .c skriptové soubory (-packonly)
    MyMod_Data.pbo            <-- Modely, textury, materiály (binarizované)
    MyMod_GUI.pbo             <-- Layouty, imagesety (-packonly)
    MyMod_Sounds.pbo          <-- OGG audio soubory (-packonly)
```

### Závislosti mezi PBO

Když jedno PBO závisí na jiném (např. skripty odkazují na předměty definované v config PBO), `requiredAddons[]` v `CfgPatches` zajišťuje správné pořadí načítání:

```cpp
// V MyMod_Scripts config.cpp
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = {"MyMod_Core"};   // Načíst po core PBO
    };
};
```

---

## Časté chyby buildu a řešení

### Chyba: "Include file not found"

**Příčina:** Config.cpp odkazuje na soubor (model, texturu), který neexistuje na očekávané cestě.
**Řešení:** Ověřte, že soubor existuje na P: na přesné odkazované cestě. Zkontrolujte pravopis a velikost písmen.

### Chyba: "Binarize failed" bez detailů

**Příčina:** Binarize havaroval na poškozeném nebo neplatném zdrojovém souboru.
**Řešení:**
1. Zkontrolujte, který soubor Binarize zpracovával (podívejte se na výstup logu).
2. Otevřete problematický soubor v příslušném nástroji (Object Builder pro P3D, TexView2 pro textury).
3. Zvalidujte soubor.
4. Běžní viníci: textury, které nejsou mocninou 2, poškozené soubory P3D, neplatná syntaxe config.cpp.

### Chyba: "Addon requires addon X"

**Příčina:** `requiredAddons[]` v CfgPatches uvádí addon, který není přítomen.
**Řešení:** Buď nainstalujte požadovaný addon, přidejte ho do buildu, nebo odstraňte požadavek, pokud není skutečně potřebný.

### Chyba: Chyba parsování Config.cpp (řádek X)

**Příčina:** Syntaktická chyba v config.cpp.
**Řešení:** Otevřete config.cpp v textovém editoru a zkontrolujte řádek X. Běžné problémy:
- Chybějící středníky po definicích tříd.
- Neuzavřené závorky `{}`.
- Chybějící uvozovky kolem řetězcových hodnot.
- Zpětné lomítko na konci řádku (pokračování řádku není podporováno).

### Chyba: Nesoulad prefixu PBO

**Příčina:** Prefix v PBO neodpovídá cestám použitým v config.cpp nebo materiálech.
**Řešení:** Zajistěte, aby `-prefix` odpovídal struktuře cest očekávané všemi referencemi. Pokud config.cpp odkazuje na `MyMod\data\item.p3d`, prefix PBO musí být `MyMod` a soubor musí být na `data\item.p3d` uvnitř PBO.

### Chyba: "Signature check failed" na serveru

**Příčina:** PBO klienta neodpovídá očekávanému podpisu serveru.
**Řešení:**
1. Zajistěte, aby server i klient měli stejnou verzi PBO.
2. V případě potřeby znovu podepište PBO novým klíčem.
3. Aktualizujte `.bikey` na serveru.

### Chyba: "Cannot open file" během Binarize

**Příčina:** Disk P: není připojen nebo je cesta k souboru nesprávná.
**Řešení:** Připojte disk P: a ověřte, že zdrojová cesta existuje.

---

## Testování: File Patching vs. načítání PBO

Vývoj zahrnuje dva testovací režimy. Volba správného pro každou situaci šetří značný čas.

### File Patching (Vývoj)

| Aspekt | Detail |
|--------|--------|
| **Rychlost** | Okamžité -- editace souboru, restart hry |
| **Nastavení** | Připojit disk P:, spustit s příznakem `-filePatching` |
| **Spustitelný soubor** | `DayZDiag_x64.exe` (vyžadován Diag build) |
| **Podepisování** | Neaplikuje se (žádná PBO k podepsání) |
| **Omezení** | Žádné binarizované configy, pouze Diag build |
| **Nejlepší pro** | Vývoj skriptů, iterace UI, rychlé prototypování |

### Načítání PBO (Testování vydání)

| Aspekt | Detail |
|--------|--------|
| **Rychlost** | Pomalejší -- musí se rebuildovat PBO pro každou změnu |
| **Nastavení** | Buildnout PBO, umístit do `@mod/addons/` |
| **Spustitelný soubor** | `DayZDiag_x64.exe` nebo retailový `DayZ_x64.exe` |
| **Podepisování** | Podporováno (povinné pro multiplayer) |
| **Omezení** | Rebuild vyžadován pro každou změnu |
| **Nejlepší pro** | Finální testování, multiplayerové testování, validace vydání |

### Doporučený pracovní postup

1. **Vývoj s file patching:** Pište skripty, upravujte layouty, iterujte na texturách. Restartujte hru pro test. Žádný krok buildu.
2. **Pravidelné buildy PBO:** Testujte binarizovaný build pro zachycení problémů specifických pro binarizaci (chyby parsování configu, problémy s konverzí textur).
3. **Finální test pouze s PBO:** Před vydáním testujte výhradně z PBO, abyste zajistili, že zabalený mod funguje identicky jako file-patchovaná verze.
4. **Podepište a distribuujte PBO:** Vygenerujte podpisy pro kompatibilitu s multiplayerem.

---

## Osvědčené postupy

1. **Používejte `-packonly` pro skriptová PBO.** Skripty se nikdy nebinarizují, takže `-packonly` je vždy správné a mnohem rychlejší.

2. **Vždy nastavte prefix.** Bez prefixu engine nemůže rozlišit cesty k obsahu vašeho modu. Každé PBO musí mít správný `-prefix`.

3. **Automatizujte vaše buildy.** Vytvořte build skript (batch nebo Python) od prvního dne. Ruční balení se neškáluje a je náchylné k chybám.

4. **Udržujte zdroj a výstup odděleně.** Zdroj na P:, buildnutá PBO v odděleném výstupním adresáři nebo `@mod/addons/`. Nikdy nebalte z výstupního adresáře.

5. **Podepisujte vaše PBO pro jakékoli multiplayerové testování.** Nepodepsaná PBO jsou odmítnuta servery s povoleným ověřením podpisů. Podepisujte při vývoji, i když se to zdá zbytečné -- předchází problémům "u mě to funguje", když ostatní testují.

6. **Verzujte vaše klíče.** Když provádíte zásadní změny, vygenerujte nový pár klíčů. To donutí všechny klienty a servery aktualizovat společně.

7. **Testujte oba režimy -- file patching i PBO.** Některé chyby se objeví pouze v jednom režimu. Binarizované configy se chovají odlišně od textových configů v okrajových případech.

8. **Pravidelně čistěte výstupní adresář.** Zastaralá PBO z předchozích buildů mohou způsobit matoucí chování. Používejte příznak `-clear` nebo ručně čistěte před buildem.

9. **Dělte velké mody do více PBO.** Ušetřený čas na inkrementálních rebuildech se vyplatí již během prvního dne vývoje.

10. **Čtěte logy buildu.** Binarize a AddonBuilder produkují log soubory. Když se něco pokazí, odpověď je téměř vždy v logách. Zkontrolujte `%TEMP%\AddonBuilder\` a `%TEMP%\Binarize\` pro podrobný výstup.

---

## Pozorováno v reálných modech

| Vzor | Mod | Detail |
|------|-----|--------|
| 20+ PBO na mod s jemným dělením | Expansion (všechny moduly) | Dělí se do oddělených PBO pro Scripts, Data, GUI, Vehicles, Book, Market atd., umožňující nezávislé rebuildy a volitelné oddělení klient/server |
| Trojité dělení Scripts/Data/GUI | StarDZ (Core, Missions, AI) | Každý mod produkuje 2-3 PBO: `_Scripts.pbo` (packonly), `_Data.pbo` (binarizované modely/textury), `_GUI.pbo` (packonly layouty) |
| Jedno monolitické PBO | Jednoduché retexture mody | Malé mody s pouze config.cpp a několika PAA texturami zabalí vše do jednoho PBO s binarizací |
| Verzování klíčů per hlavní vydání | Expansion | Generuje nové páry klíčů pro zásadní aktualizace, čímž nutí všechny klienty a servery aktualizovat synchronně |

---

## Kompatibilita a dopad

- **Více modů:** Kolize prefixů PBO způsobí, že engine načte soubory jednoho modu místo druhého. Každý mod musí používat unikátní prefix. Pečlivě kontrolujte `$PBOPREFIX$` při ladění chyb "file not found" v prostředí s více mody.
- **Výkon:** Načítání PBO je rychlé (sekvenční čtení souborů), ale mody s mnoha velkými PBO zvyšují dobu startu serveru. Binarizovaný obsah se načítá rychleji než nebinarizovaný. Používejte ODOL modely a PAA textury pro release buildy.
- **Verze:** Formát PBO sám o sobě se nezměnil. AddonBuilder dostává periodické opravy přes aktualizace DayZ Tools, ale příznaky příkazového řádku a chování balení jsou stabilní od DayZ 1.0.

---

## Navigace

| Předchozí | Nahoru | Další |
|-----------|--------|-------|
| [4.5 Pracovní postup s DayZ Tools](05-dayz-tools.md) | [Část 4: Formáty souborů a DayZ Tools](01-textures.md) | [Další: Průvodce Workbench](07-workbench-guide.md) |
