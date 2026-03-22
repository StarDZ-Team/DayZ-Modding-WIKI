# 4.6. fejezet: PBO csomagolás

[Főoldal](../README.md) | [<< Előző: DayZ Tools munkafolyamat](05-dayz-tools.md) | **PBO csomagolás** | [Következő: Workbench útmutató >>](07-workbench-guide.md)

---

## Bevezetés

A **PBO** (Packed Bank of Objects) a DayZ archívum formátuma -- a játéktartalom `.zip` fájljának megfelelője. Minden mod, amelyet a játék betölt, egy vagy több PBO fájlként kerül átadásra. Amikor egy játékos feliratkozik egy modra a Steam Workshopon, PBO-kat tölt le. Amikor egy szerver modokat tölt be, PBO-kat olvas. A PBO a teljes modding pipeline végső terméke.

Annak megértése, hogyan kell helyesen PBO-kat létrehozni -- mikor kell binarizálni, hogyan kell a prefixeket beállítani, hogyan kell strukturálni a kimenetet, és hogyan kell automatizálni a folyamatot -- az utolsó lépés a forrásfájlaid és egy működő mod között. Ez a fejezet mindent lefed az alapfogalomtól a haladó automatizált build munkafolyamatokig.

---

## Tartalomjegyzék

- [Mi az a PBO?](#what-is-a-pbo)
- [PBO belső struktúra](#pbo-internal-structure)
- [AddonBuilder: a csomagoló eszköz](#addonbuilder-the-packing-tool)
- [A -packonly jelző](#the--packonly-flag)
- [A -prefix jelző](#the--prefix-flag)
- [Binarizálás: mikor szükséges és mikor nem](#binarization-when-needed-vs-not)
- [Kulcs aláírás](#key-signing)
- [@mod mappa struktúra](#mod-folder-structure)
- [Automatizált build szkriptek](#automated-build-scripts)
- [Több-PBO-s mod buildek](#multi-pbo-mod-builds)
- [Gyakori fordítási hibák és megoldások](#common-build-errors-and-solutions)
- [Tesztelés: File Patching vs. PBO betöltés](#testing-file-patching-vs-pbo-loading)
- [Bevált gyakorlatok](#best-practices)

---

## Mi az a PBO?

A PBO egy lapos archívum fájl, amely játék assetek könyvtárfáját tartalmazza. Nincs tömörítése (a ZIP-pel ellentétben) -- a benne lévő fájlok eredeti méretükben vannak tárolva. A "csomagolás" tisztán szervezési célú: sok fájl egyetlen fájllá válik belső elérési út struktúrával.

### Fő jellemzők

- **Nincs tömörítés:** A fájlok változatlanul vannak tárolva. A PBO mérete egyenlő tartalmainak összegével plusz egy kis fejléc.
- **Lapos fejléc:** Fájl bejegyzések listája elérési utakkal, méretekkel és eltolásokkal.
- **Prefix metaadat:** Minden PBO deklarál egy belső elérési út prefixet, amely tartalmait a motor virtuális fájlrendszerébe térképezi.
- **Csak olvasható futásidőben:** A motor PBO-kból olvas, de soha nem ír beléjük.
- **Aláírt többjátékos módhoz:** A PBO-k Bohemia-stílusú kulcspárral aláírhatók szerver aláírás ellenőrzéshez.

### Miért PBO-k különálló fájlok helyett

- **Terjesztés:** Mod komponensenként egy fájl egyszerűbb, mint több ezer különálló fájl.
- **Integritás:** A kulcs aláírás biztosítja, hogy a mod nem lett módosítva.
- **Teljesítmény:** A motor fájl I/O-ja PBO-kból való olvasásra van optimalizálva.
- **Szervezés:** A prefix rendszer biztosítja, hogy ne legyenek elérési út ütközések a modok között.

---

## PBO belső struktúra

Amikor megnyitsz egy PBO-t (olyan eszközzel, mint a PBO Manager vagy MikeroTools), egy könyvtárfát látsz:

```
MyMod.pbo
  $PBOPREFIX$                    <-- A prefix elérési utat tartalmazó szövegfájl
  config.bin                      <-- Binarizált config.cpp (vagy config.cpp, ha -packonly)
  Scripts/
    3_Game/
      MyConstants.c
    4_World/
      MyManager.c
    5_Mission/
      MyUI.c
  data/
    models/
      my_item.p3d                 <-- Binarizált ODOL (vagy MLOD, ha -packonly)
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

A `$PBOPREFIX$` fájl egy apró szövegfájl a PBO gyökerében, amely deklarálja a mod elérési út prefixét. Például:

```
MyMod
```

Ez azt mondja a motornak: "Amikor valami hivatkozik a `MyMod\data\textures\my_item_co.paa`-ra, keresd ebben a PBO-ban a `data\textures\my_item_co.paa`-t."

### config.bin vs. config.cpp

- **config.bin:** A config.cpp binarizált (bináris) verziója, amelyet a Binarize hoz létre. Gyorsabb az elemzése betöltéskor.
- **config.cpp:** Az eredeti szöveges formátumú konfiguráció. Működik a motorban, de valamivel lassabb az elemzése.

Amikor binarizálással építesz, a config.cpp config.bin-né válik. Amikor `-packonly`-t használsz, a config.cpp változatlanul kerül bele.

---

## AddonBuilder: a csomagoló eszköz

Az **AddonBuilder** a Bohemia hivatalos PBO csomagoló eszköze, amely a DayZ Tools-szal érkezik. GUI módban és parancssori módban is működhet.

### GUI mód

1. Indítsd el az AddonBuildert a DayZ Tools Launcherből.
2. **Forrás könyvtár:** Tallózz a mod mappádhoz a P:-n (pl. `P:\MyMod`).
3. **Kimeneti könyvtár:** Tallózz a kimeneti mappádhoz (pl. `P:\output`).
4. **Opciók:**
   - **Binarize:** Jelöld be a Binarize futtatásához a tartalmon (P3D-ket, textúrákat, konfigokat konvertál).
   - **Sign:** Jelöld be és válassz kulcsot a PBO aláírásához.
   - **Prefix:** Add meg a mod prefixet (pl. `MyMod`).
5. Kattints a **Pack** gombra.

### Parancssori mód

A parancssori mód preferált az automatizált buildekhez:

```bash
AddonBuilder.exe [forrás_elérési_út] [kimenet_elérési_út] [opciók]
```

**Teljes példa:**
```bash
"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe" ^
    "P:\MyMod" ^
    "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyKey"
```

### Parancssori opciók

| Jelző | Leírás |
|-------|--------|
| `-prefix=<elérési_út>` | A PBO belső prefixének beállítása (kritikus az elérési út feloldáshoz) |
| `-packonly` | Binarizálás kihagyása, fájlok csomagolása változatlanul |
| `-sign=<kulcs_elérési_út>` | A PBO aláírása a megadott BI kulccsal (privát kulcs elérési útja, kiterjesztés nélkül) |
| `-include=<elérési_út>` | Fájl befoglalási lista -- csak a szűrőnek megfelelő fájlok csomagolása |
| `-exclude=<elérési_út>` | Fájl kizárási lista -- a szűrőnek megfelelő fájlok kihagyása |
| `-binarize=<elérési_út>` | A Binarize.exe elérési útja (ha nem az alapértelmezett helyen van) |
| `-temp=<elérési_út>` | Ideiglenes könyvtár a Binarize kimenetéhez |
| `-clear` | Kimeneti könyvtár törlése csomagolás előtt |
| `-project=<elérési_út>` | Projekt meghajtó elérési útja (általában `P:\`) |

---

## A -packonly jelző

A `-packonly` jelző az AddonBuilder egyik legfontosabb opciója. Azt utasítja az eszközt, hogy hagyja ki az összes binarizálást és csomagolja a forrásfájlokat pontosan úgy, ahogy vannak.

### Mikor használjuk a -packonly-t

| Mod tartalom | -packonly használata? | Ok |
|--------------|----------------------|-----|
| Csak szkriptek (.c fájlok) | **Igen** | A szkriptek soha nem binarizálódnak |
| UI layout-ok (.layout) | **Igen** | A layout-ok soha nem binarizálódnak |
| Csak hang (.ogg) | **Igen** | Az OGG már játékra kész |
| Előre konvertált textúrák (.paa) | **Igen** | Már végleges formátumban vannak |
| Config.cpp (CfgVehicles nélkül) | **Igen** | Az egyszerű konfigok binarizálatlanul is működnek |
| Config.cpp (CfgVehicles-szel) | **Nem** | A tárgy definíciók binarizált konfigot igényelnek |
| P3D modellek (MLOD) | **Nem** | ODOL-ra kell binarizálni a teljesítmény érdekében |
| TGA/PNG textúrák (konverzió szükséges) | **Nem** | PAA-ra kell konvertálni |

### Gyakorlati útmutató

Egy **csak szkript mod** esetén (mint egy keretrendszer vagy segédprogram mod egyéni tárgyak nélkül):
```bash
AddonBuilder.exe "P:\MyScriptMod" "P:\output" -prefix="MyScriptMod" -packonly
```

Egy **tárgy mod** esetén (fegyverek, ruházat, járművek modellekkel és textúrákkal):
```bash
AddonBuilder.exe "P:\MyItemMod" "P:\output" -prefix="MyItemMod" -sign="P:\keys\MyKey"
```

> **Tipp:** Sok mod pontosan azért válik szét több PBO-ra, hogy optimalizálja a build folyamatot. A szkript PBO-k `-packonly`-t használnak (gyors), míg az adatot tartalmazó PBO-k modellekkel és textúrákkal teljes binarizálást kapnak (lassabb, de szükséges).

---

## A -prefix jelző

A `-prefix` jelző beállítja a PBO belső elérési út prefixét, amelyet a PBO-n belüli `$PBOPREFIX$` fájlba ír. Ez a prefix kritikus -- meghatározza, hogyan oldja fel a motor az elérési utakat a PBO tartalmához.

### Hogyan működik a prefix

```
Forrás: P:\MyMod\data\textures\item_co.paa
Prefix: MyMod
PBO belső elérési út: data\textures\item_co.paa

Motor feloldás: MyMod\data\textures\item_co.paa
  --> Keres a MyMod.pbo-ban: data\textures\item_co.paa
  --> Megtalálva!
```

### Többszintű prefixek

A mappa alstruktúrát használó modok esetén a prefix több szintet is tartalmazhat:

```bash
# Forrás a P: meghajtón
P:\MyMod\MyMod\Scripts\3_Game\MyClass.c

# Ha a prefix "MyMod\MyMod\Scripts"
# PBO belső: 3_Game\MyClass.c
# Motor elérési út: MyMod\MyMod\Scripts\3_Game\MyClass.c
```

### A prefixnek egyeznie kell a hivatkozásokkal

Ha a config.cpp hivatkozik a `MyMod\data\texture_co.paa`-ra, akkor az adott textúrát tartalmazó PBO-nak `MyMod` prefixűnek kell lennie, és a fájlnak a `data\texture_co.paa` helyen kell lennie a PBO-n belül. Eltérés esetén a motor nem találja meg a fájlt.

### Gyakori prefix minták

| Mod struktúra | Forrás elérési út | Prefix | Config hivatkozás |
|---------------|-------------------|--------|-------------------|
| Egyszerű mod | `P:\MyMod\` | `MyMod` | `MyMod\data\item.p3d` |
| Névteres mod | `P:\MyMod_Weapons\` | `MyMod_Weapons` | `MyMod_Weapons\data\rifle.p3d` |
| Szkript alcsomag | `P:\MyFramework\MyMod\Scripts\` | `MyFramework\MyMod\Scripts` | (a config.cpp `CfgMods`-on keresztül hivatkozott) |

---

## Binarizálás: mikor szükséges és mikor nem

A binarizálás az ember által olvasható forrás formátumok motor-optimalizált bináris formátumokká történő konvertálása. Ez a build folyamat legidőigényesebb lépése és a build hibák leggyakoribb forrása.

### Mi kerül binarizálásra

| Fájl típus | Binarizálva erre | Szükséges? |
|-----------|-----------------|------------|
| `config.cpp` | `config.bin` | Szükséges a tárgyakat definiáló modokhoz (CfgVehicles, CfgWeapons) |
| `.p3d` (MLOD) | `.p3d` (ODOL) | Ajánlott -- az ODOL gyorsabban töltődik és kisebb |
| `.tga` / `.png` | `.paa` | Szükséges -- a motor futásidőben PAA-t igényel |
| `.edds` | `.paa` | Szükséges -- ugyanaz, mint fent |
| `.rvmat` | `.rvmat` (feldolgozott) | Elérési utak feloldva, kisebb optimalizálás |
| `.wrp` | `.wrp` (optimalizált) | Szükséges terep/térkép modokhoz |

### Mi NEM kerül binarizálásra

| Fájl típus | Ok |
|-----------|-----|
| `.c` szkriptek | A motor szövegként tölti be a szkripteket |
| `.ogg` hang | Már játékra kész formátumban |
| `.layout` fájlok | Már játékra kész formátumban |
| `.paa` textúrák | Már végleges formátumban (előre konvertálva) |
| `.json` adatok | A szkript kód szövegként olvassa |

### Config.cpp binarizálás részletei

A config.cpp binarizálás az a lépés, amellyel a legtöbb modder problémákat tapasztal. A binarizáló elemzi a config.cpp szöveget, érvényesíti a struktúráját, feloldja az öröklési láncokat, és bináris config.bin-t hoz létre kimenetként.

**Mikor szükséges a config.cpp binarizálása:**
- A konfig `CfgVehicles` bejegyzéseket definiál (tárgyak, fegyverek, járművek, épületek).
- A konfig `CfgWeapons` bejegyzéseket definiál.
- A konfig modellekre vagy textúrákra hivatkozó bejegyzéseket definiál.

**Mikor NEM szükséges a binarizálás:**
- A konfig csak `CfgPatches`-t és `CfgMods`-ot definiál (mod regisztráció).
- A konfig csak hang konfigurációkat definiál.
- Csak szkript modok minimális konfiggal.

> **Ökölszabály:** Ha a config.cpp fizikai tárgyakat ad a játékvilághoz, binarizálásra van szükséged. Ha csak szkripteket regisztrál és nem-tárgy adatokat definiál, a `-packonly` tökéletesen működik.

---

## Kulcs aláírás

A PBO-k kriptográfiai kulcspárral aláírhatók. A szerverek aláírás ellenőrzést használnak annak biztosítására, hogy minden csatlakozott kliens ugyanazokkal a (nem módosított) mod fájlokkal rendelkezik.

### Kulcspár összetevők

| Fájl | Kiterjesztés | Cél | Ki birtokolja |
|------|-------------|-----|--------------|
| Privát kulcs | `.biprivatekey` | PBO-k aláírása a build során | Csak a mod szerző (TARTSD TITOKBAN) |
| Nyilvános kulcs | `.bikey` | Aláírások ellenőrzése | Szerver adminok, a moddal terjesztve |

### Kulcsok generálása

Használd a DayZ Tools **DSSignFile** vagy **DSCreateKey** segédprogramjait:

```bash
# Kulcspár generálása
DSCreateKey.exe MyModKey

# Ez létrehozza:
#   MyModKey.biprivatekey   (tartsd titokban, ne terjeszd)
#   MyModKey.bikey          (terjeszd a szerver adminoknak)
```

### Aláírás a build során

```bash
AddonBuilder.exe "P:\MyMod" "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyModKey"
```

Ez a következőt hozza létre:
```
P:\output\
  MyMod.pbo
  MyMod.pbo.MyModKey.bisign    <-- Aláírás fájl
```

### Szerver oldali kulcs telepítés

A szerver adminok a nyilvános kulcsot (`.bikey`) a szerver `keys/` könyvtárába helyezik:

```
DayZServer/
  keys/
    MyModKey.bikey             <-- Lehetővé teszi az ezzel a moddal rendelkező kliensek csatlakozását
```

---

## @mod mappa struktúra

A DayZ elvárja, hogy a modok egy meghatározott könyvtárstruktúrában legyenek szervezve az `@` prefix konvencióval:

```
@MyMod/
  addons/
    MyMod.pbo                  <-- Csomagolt mod tartalom
    MyMod.pbo.MyKey.bisign     <-- PBO aláírás (opcionális)
  keys/
    MyKey.bikey                <-- Nyilvános kulcs szervereknek (opcionális)
  mod.cpp                      <-- Mod metaadatok
```

### mod.cpp

A `mod.cpp` fájl metaadatokat biztosít, amelyek a DayZ indítóban jelennek meg:

```cpp
name = "My Awesome Mod";
author = "ModAuthor";
version = "1.0.0";
url = "https://steamcommunity.com/sharedfiles/filedetails/?id=XXXXXXXXX";
```

### Több-PBO-s modok

A nagy modok gyakran több PBO-ra oszlanak egyetlen `@mod` mappán belül:

```
@MyFramework/
  addons/
    MyMod_Core_Scripts.pbo        <-- Szkript réteg
    MyMod_Core_Data.pbo           <-- Textúrák, modellek, anyagok
    MyMod_Core_GUI.pbo            <-- Layout fájlok, imageset-ek
  keys/
    MyMod.bikey
  mod.cpp
```

### Modok betöltése

A modok a `-mod` paraméteren keresztül töltődnek be:

```bash
# Egyetlen mod
DayZDiag_x64.exe -mod="@MyMod"

# Több mod (pontosvesszővel elválasztva)
DayZDiag_x64.exe -mod="@MyFramework;@MyMod_Weapons;@MyMod_Missions"
```

Az `@` mappának a játék gyökérkönyvtárában kell lennie, vagy abszolút elérési utat kell megadni.

---

## Automatizált build szkriptek

A kézi PBO csomagolás az AddonBuilder GUI-ján keresztül elfogadható kis, egyszerű modokhoz. Nagyobb projekteknél több PBO-val az automatizált build szkriptek elengedhetetlenek.

### Batch szkript minta

Egy tipikus `build_pbos.bat`:

```batch
@echo off
setlocal

set TOOLS="P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
set OUTPUT="P:\@MyMod\addons"
set KEY="P:\keys\MyKey"

echo === Szkript PBO építése ===
%TOOLS% "P:\MyMod\Scripts" %OUTPUT% -prefix="MyMod\Scripts" -packonly -clear

echo === Adat PBO építése ===
%TOOLS% "P:\MyMod\Data" %OUTPUT% -prefix="MyMod\Data" -sign=%KEY% -clear

echo === Építés kész ===
pause
```

### Python build szkript minta (dev.py)

Kifinomultabb buildekhez egy Python szkript jobb hibakezelést, naplózást és feltételes logikát biztosít:

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
    """Egyetlen PBO építése."""
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

### Integráció a dev.py-vel

A MyMod projekt a `dev.py`-t használja központi build orkesztrátorként:

```bash
python dev.py build          # Minden PBO építése
python dev.py server         # Építés + szerver indítás + napló figyelés
python dev.py full           # Építés + szerver + kliens
```

Ez a minta ajánlott bármely több-moddal dolgozó munkaterülethez. Egyetlen parancs mindent megépít, elindítja a szervert, és elkezdi a figyelést -- kiküszöbölve a kézi lépéseket és csökkentve az emberi hibákat.

---

## Több-PBO-s mod buildek

A nagy modok profitálnak a több PBO-ra való felosztásból. Ennek több előnye van:

### Miért érdemes több PBO-ra bontani

1. **Gyorsabb újraépítések.** Ha csak egy szkriptet változtatsz, csak a szkript PBO-t kell újraépíteni (a `-packonly`-val, ami másodperceket vesz igénybe). Az adat PBO (binarizálással) percekig tart és nem kell újraépíteni.
2. **Moduláris betöltés.** A csak szerver oldali PBO-k kizárhatók a kliens letöltésekből.
3. **Tisztább szervezés.** A szkriptek, adatok és GUI világosan elkülönülnek.
4. **Párhuzamos buildek.** A független PBO-k egyidejűleg építhetők.

### Tipikus felosztási minta

```
@MyMod/
  addons/
    MyMod_Core.pbo           <-- config.cpp, CfgPatches (binarizált)
    MyMod_Scripts.pbo         <-- Minden .c szkript fájl (-packonly)
    MyMod_Data.pbo            <-- Modellek, textúrák, anyagok (binarizált)
    MyMod_GUI.pbo             <-- Layout-ok, imageset-ek (-packonly)
    MyMod_Sounds.pbo          <-- OGG hangfájlok (-packonly)
```

### PBO-k közötti függőségek

Amikor egy PBO függ egy másiktól (pl. a szkriptek hivatkoznak a konfig PBO-ban definiált tárgyakra), a `CfgPatches`-ben lévő `requiredAddons[]` biztosítja a helyes betöltési sorrendet:

```cpp
// A MyMod_Scripts config.cpp-ben
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = {"MyMod_Core"};   // Betöltés a core PBO után
    };
};
```

---

## Gyakori fordítási hibák és megoldások

### Hiba: "Include file not found"

**Ok:** A config.cpp hivatkozik egy fájlra (modell, textúra), amely nem létezik a várt elérési úton.
**Megoldás:** Ellenőrizd, hogy a fájl létezik a P:-n a pontosan hivatkozott elérési úton. Ellenőrizd a helyesírást és a kis-/nagybetűket.

### Hiba: "Binarize failed" részletek nélkül

**Ok:** A Binarize összeomlott egy sérült vagy érvénytelen forrásfájlon.
**Megoldás:**
1. Ellenőrizd, melyik fájlt dolgozta fel a Binarize (nézd meg a napló kimenetét).
2. Nyisd meg a problémás fájlt a megfelelő eszközben (Object Builder a P3D-hez, TexView2 a textúrákhoz).
3. Validáld a fájlt.
4. Gyakori okok: nem kettő hatványának megfelelő méretű textúrák, sérült P3D fájlok, érvénytelen config.cpp szintaxis.

### Hiba: "Addon requires addon X"

**Ok:** A CfgPatches `requiredAddons[]` olyan addont sorol fel, amely nincs jelen.
**Megoldás:** Vagy telepítsd a szükséges addont, add hozzá a buildhez, vagy távolítsd el a követelményt, ha valójában nem szükséges.

### Hiba: Config.cpp elemzési hiba (X. sor)

**Ok:** Szintaxis hiba a config.cpp-ben.
**Megoldás:** Nyisd meg a config.cpp-t egy szövegszerkesztőben és ellenőrizd az X. sort. Gyakori problémák:
- Hiányzó pontosvesszők az osztály definíciók után.
- Le nem zárt kapcsos zárójelek `{}`.
- Hiányzó idézőjelek a sztring értékek körül.
- Visszaper jel a sor végén (a sor folytatás nem támogatott).

### Hiba: PBO prefix eltérés

**Ok:** A PBO-ban lévő prefix nem egyezik a config.cpp-ben vagy anyagokban használt elérési utakkal.
**Megoldás:** Győződj meg, hogy a `-prefix` egyezik az összes hivatkozás által várt elérési út struktúrával. Ha a config.cpp hivatkozik a `MyMod\data\item.p3d`-re, a PBO prefixnek `MyMod`-nak kell lennie, és a fájlnak a `data\item.p3d` helyen kell lennie a PBO-n belül.

### Hiba: "Signature check failed" a szerveren

**Ok:** A kliens PBO-ja nem egyezik a szerver várt aláírásával.
**Megoldás:**
1. Győződj meg, hogy a szerver és a kliens is ugyanazt a PBO verziót használja.
2. Ha szükséges, írd alá újra a PBO-t friss kulccsal.
3. Frissítsd a `.bikey`-t a szerveren.

### Hiba: "Cannot open file" a Binarize során

**Ok:** A P: meghajtó nincs csatolva vagy a fájl elérési útja helytelen.
**Megoldás:** Csatold a P: meghajtót és ellenőrizd, hogy a forrás elérési út létezik.

---

## Tesztelés: File Patching vs. PBO betöltés

A fejlesztés két tesztelési módot foglal magában. A megfelelő kiválasztása minden helyzetben jelentős időt takarít meg.

### File Patching (fejlesztés)

| Szempont | Részlet |
|----------|---------|
| **Sebesség** | Azonnali -- fájl szerkesztése, játék újraindítása |
| **Beállítás** | P: meghajtó csatolása, indítás `-filePatching` jelzővel |
| **Futtatható fájl** | `DayZDiag_x64.exe` (Diag build szükséges) |
| **Aláírás** | Nem alkalmazható (nincsenek PBO-k aláírásra) |
| **Korlátozások** | Nincs binarizált konfig, csak Diag build |
| **Legjobb ehhez** | Szkript fejlesztés, UI iteráció, gyors prototípus készítés |

### PBO betöltés (kiadási tesztelés)

| Szempont | Részlet |
|----------|---------|
| **Sebesség** | Lassabb -- minden változtatáshoz újra kell építeni a PBO-t |
| **Beállítás** | PBO építése, elhelyezés a `@mod/addons/`-ban |
| **Futtatható fájl** | `DayZDiag_x64.exe` vagy kereskedelmi `DayZ_x64.exe` |
| **Aláírás** | Támogatott (többjátékos módhoz szükséges) |
| **Korlátozások** | Minden változtatáshoz újraépítés szükséges |
| **Legjobb ehhez** | Végső tesztelés, többjátékos tesztelés, kiadás validálás |

### Ajánlott munkafolyamat

1. **Fejlessz file patching-gel:** Írj szkripteket, igazítsd a layout-okat, iterálj a textúrákon. Indítsd újra a játékot a teszteléshez. Nincs build lépés.
2. **Építs PBO-kat rendszeresen:** Teszteld a binarizált buildet a binarizálás-specifikus problémák felderítéséhez (konfig elemzési hibák, textúra konverziós problémák).
3. **Végső teszt csak PBO-val:** Kiadás előtt tesztelj kizárólag PBO-kból, hogy biztosítsd, a csomagolt mod azonosan működik a file-patching-elt verzióval.
4. **Írd alá és terjeszd a PBO-kat:** Generálj aláírásokat a többjátékos kompatibilitáshoz.

---

## Bevált gyakorlatok

1. **Használj `-packonly`-t a szkript PBO-khoz.** A szkriptek soha nem binarizálódnak, tehát a `-packonly` mindig helyes és sokkal gyorsabb.

2. **Mindig állíts be prefixet.** Prefix nélkül a motor nem tudja feloldani az elérési utakat a mod tartalmához. Minden PBO-nak helyes `-prefix`-szel kell rendelkeznie.

3. **Automatizáld a buildeket.** Hozz létre build szkriptet (batch vagy Python) az első naptól. A kézi csomagolás nem skálázódik és hibalehetőségeket rejt.

4. **Tartsd külön a forrást és a kimenetet.** Forrás a P:-n, elkészült PBO-k külön kimeneti könyvtárban vagy `@mod/addons/`-ban. Soha ne csomagolj a kimeneti könyvtárból.

5. **Írd alá a PBO-idat bármely többjátékos teszteléshez.** Az aláíratlan PBO-kat az aláírás-ellenőrzéses szerverek elutasítják. Írd alá fejlesztés közben is, még ha feleslegesnek tűnik -- megelőzi a "nálam működik" problémákat, amikor mások tesztelnek.

6. **Verziózd a kulcsaidat.** Amikor törő változtatásokat végzel, generálj új kulcspárt. Ez arra kényszeríti az összes klienst és szervert, hogy együtt frissítsenek.

7. **Tesztelj mind file patching, mind PBO módban.** Egyes hibák csak az egyik módban jelennek meg. A binarizált konfigok szélsőséges esetekben eltérően viselkednek a szöveges konfigoktól.

8. **Tisztítsd rendszeresen a kimeneti könyvtárat.** A korábbi buildekből származó elavult PBO-k zavaró viselkedést okozhatnak. Használd a `-clear` jelzőt vagy tisztítsd kézzel az építés előtt.

9. **Bontsd több PBO-ra a nagy modokat.** Az inkrementális újraépítéseknél megtakarított idő az első fejlesztési napon belül megtérül.

10. **Olvasd a build naplókat.** A Binarize és az AddonBuilder naplófájlokat állít elő. Amikor valami rosszul megy, a válasz szinte mindig a naplókban van. Ellenőrizd a `%TEMP%\AddonBuilder\` és `%TEMP%\Binarize\` mappákat a részletes kimenetért.

---

## Valós modokban megfigyelt minták

| Minta | Mod | Részlet |
|-------|-----|---------|
| 20+ PBO modonként finom felosztással | Expansion (minden modul) | Külön PBO-kra bontja a Scripts, Data, GUI, Vehicles, Book, Market stb. elemeket, lehetővé téve a független újraépítést és az opcionális kliens/szerver szétválasztást |
| Scripts/Data/GUI hármas felosztás | StarDZ (Core, Missions, AI) | Minden mod 2-3 PBO-t hoz létre: `_Scripts.pbo` (packonly), `_Data.pbo` (binarizált modellek/textúrák), `_GUI.pbo` (packonly layout-ok) |
| Egyetlen monolitikus PBO | Egyszerű retextúra modok | A kis modok, amelyek csak egy config.cpp-t és néhány PAA textúrát tartalmaznak, mindent egyetlen PBO-ba csomagolnak binarizálással |
| Kulcs verziózás főbb kiadásonként | Expansion | Új kulcspárokat generál a törő frissítésekhez, arra kényszerítve az összes klienst és szervert, hogy szinkronban frissítsenek |

---

## Kompatibilitás és hatás

- **Több mod:** A PBO prefix ütközések azt okozzák, hogy a motor az egyik mod fájljait tölti be a másik helyett. Minden modnak egyedi prefixet kell használnia. Ellenőrizd gondosan a `$PBOPREFIX$`-et, amikor "file not found" hibákat debugolsz több-moddal rendelkező környezetekben.
- **Teljesítmény:** A PBO betöltés gyors (szekvenciális fájl olvasások), de a sok nagy PBO-val rendelkező modok növelik a szerver indítási idejét. A binarizált tartalom gyorsabban töltődik be, mint a binarizálatlan. Használj ODOL modelleket és PAA textúrákat a kiadási buildekhez.
- **Verzió:** Maga a PBO formátum nem változott. Az AddonBuilder rendszeres javításokat kap a DayZ Tools frissítéseken keresztül, de a parancssori jelzők és a csomagolási viselkedés stabil a DayZ 1.0 óta.

---

## Navigáció

| Előző | Fel | Következő |
|-------|-----|-----------|
| [4.5 DayZ Tools munkafolyamat](05-dayz-tools.md) | [4. rész: Fájlformátumok és DayZ Tools](01-textures.md) | [Következő: Workbench útmutató](07-workbench-guide.md) |
