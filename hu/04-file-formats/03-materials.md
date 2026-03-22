# 4.3. fejezet: Anyagok (.rvmat)

[Kezdőlap](../README.md) | [<< Előző: 3D modellek](02-models.md) | **Anyagok** | [Következő: Hang >>](04-audio.md)

---

## Bevezetés

A DayZ-ben az anyag a 3D modell és annak vizuális megjelenése közötti híd. Míg a textúrák nyers képadatot biztosítanak, az **RVMAT** (Real Virtuality Material) fájl definiálja, hogyan kombinálódnak ezek a textúrák, melyik shader értelmezi őket, és milyen felületi tulajdonságokat szimuláljon a motor -- fényesség, átlátszóság, önvilágítás és egyebek. A játékban minden P3D modell minden felülete egy RVMAT fájlra hivatkozik, és létrehozásuk és konfigurálásuk megértése elengedhetetlen bármilyen vizuális modhoz.

Ez a fejezet az RVMAT fájlformátumot, shader típusokat, textúra szakasz konfigurációt, anyag tulajdonságokat, a sérülési szint anyagcsere rendszert és a DayZ-Samples-ből vett gyakorlati példákat tárgyalja.

---

## Tartalomjegyzék

- [RVMAT formátum áttekintése](#rvmat-format-overview)
- [Fájl felépítés](#file-structure)
- [Shader típusok](#shader-types)
- [Textúra szakaszok](#texture-stages)
- [Anyag tulajdonságok](#material-properties)
- [Egészség szintek (sérülési anyagcserék)](#health-levels-damage-material-swaps)
- [Hogyan hivatkoznak az anyagok textúrákra](#how-materials-reference-textures)
- [RVMAT létrehozása a nulláról](#creating-an-rvmat-from-scratch)
- [Valós példák](#real-examples)
- [Gyakori hibák](#common-mistakes)
- [Bevált gyakorlatok](#best-practices)

---

## RVMAT formátum áttekintése

Az **RVMAT** fájl egy szöveges konfigurációs fájl (nem bináris), amely egy anyagot definiál. Az egyéni kiterjesztés ellenére a formátum sima szöveg, Bohemia konfigurációs stílusú szintaxisát használva osztályokkal és kulcs-érték párokkal.

### Fő jellemzők

- **Szöveges formátum:** Bármilyen szövegszerkesztővel szerkeszthető (Notepad++, VS Code).
- **Shader kötés:** Minden RVMAT meghatározza, melyik renderelési shader-t használja.
- **Textúra hozzárendelés:** Definiálja, melyik textúra fájlok vannak hozzárendelve melyik shader bemenetekhez (diffúz, normál, tükrözési stb.).
- **Felületi tulajdonságok:** Tükrözési intenzitást, önvilágító fényt, átlátszóságot és egyebeket szabályoz.
- **P3D modellek hivatkoznak rá:** Az Object Builder Resolution LOD-jában a felületekhez RVMAT van hozzárendelve.
- **config.cpp hivatkozik rá:** A `hiddenSelectionsMaterials[]` felülírhatja az anyagokat futásidőben.

---

## Fájl felépítés

Egy RVMAT fájl konzisztens felépítéssel rendelkezik. Íme egy teljes, megjegyzésekkel ellátott példa:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};        // Környezeti fény szín szorzó (RGBA)
diffuse[] = {1.0, 1.0, 1.0, 1.0};        // Diffúz szín szorzó (RGBA)
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};  // Additív diffúz felülírás
emmisive[] = {0.0, 0.0, 0.0, 0.0};       // Önvilágítási (sugárzó) szín
specular[] = {0.7, 0.7, 0.7, 1.0};       // Tükrözési kiemelés szín
specularPower = 80;                        // Tükrözési élesség (magasabb = szűkebb kiemelés)
PixelShaderID = "Super";                   // Használandó shader program
VertexShaderID = "Super";                  // Vertex shader program

class Stage1                               // Textúra szakasz: normál térkép
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2                               // Textúra szakasz: diffúz/szín térkép
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3                               // Textúra szakasz: tükrözési/fémes térkép
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### Legfelső szintű tulajdonságok

| Tulajdonság | Típus | Leírás |
|----------|------|-------------|
| `ambient[]` | float[4] | Környezeti fény szín szorzó. `{1,1,1,1}` = teljes, `{0,0,0,0}` = nincs környezeti. |
| `diffuse[]` | float[4] | Diffúz fény szín szorzó. Általában `{1,1,1,1}`. |
| `forcedDiffuse[]` | float[4] | Additív felülírás a diffúzhoz. Általában `{0,0,0,0}`. |
| `emmisive[]` | float[4] | Önvilágítási szín. Nem nulla értékek fényessé teszik a felületet. Megjegyzés: a Bohemia az `emmisive` hibás írásmódot használja, nem az `emissive`-t. |
| `specular[]` | float[4] | Tükrözési kiemelés szín és intenzitás. |
| `specularPower` | float | Tükrözési kiemelések élessége. Tartomány 1-200. Magasabb = szűkebb, fókuszáltabb visszaverődés. |
| `PixelShaderID` | string | A pixel shader program neve. |
| `VertexShaderID` | string | A vertex shader program neve. |

---

## Shader típusok

### Elérhető shaderek

| Shader | Felhasználási terület | Szükséges textúra szakaszok |
|--------|----------|------------------------|
| **Super** | Szabványos átlátszatlan felületek (fegyverek, ruházat, tárgyak) | Normál, diffúz, tükrözési/fémes |
| **Glass** | Átlátszó és félig átlátszó felületek | Diffúz alfával |
| **AlphaTest** | Éles szélű átlátszóság (lombozat, kerítések) | Diffúz alfával |
| **AlphaBlend** | Sima átlátszóság (üveg, füst) | Diffúz alfával |

### Super shader (leggyakoribb)

A **Super** shader a szabványos fizikai alapú renderelési shader, amelyet a DayZ tárgyainak túlnyomó többsége használ. Három textúra szakaszt vár:

```
Stage1 = Normál térkép (_nohq)
Stage2 = Diffúz/szín térkép (_co)
Stage3 = Tükrözési/fémes térkép (_smdi)
```

---

## Anyag tulajdonságok

### Tükrözési szabályozás

| Anyag típus | specular[] | specularPower | Megjelenés |
|---------------|-----------|---------------|------------|
| **Matt műanyag** | `{0.1, 0.1, 0.1, 1.0}` | 10 | Tompa, széles kiemelés |
| **Kopott fém** | `{0.3, 0.3, 0.3, 1.0}` | 40 | Mérsékelt fényesség |
| **Polírozott fém** | `{0.8, 0.8, 0.8, 1.0}` | 120 | Fényes, szűk kiemelés |
| **Króm** | `{1.0, 1.0, 1.0, 1.0}` | 200 | Tükörszerű visszaverődés |
| **Gumi** | `{0.02, 0.02, 0.02, 1.0}` | 5 | Szinte nincs kiemelés |

### Önvilágítás (sugárzás)

Felület világítóvá tétele (LED fények, képernyők, izzó elemek):

```cpp
emmisive[] = {0.2, 0.8, 0.2, 1.0};   // Zöld izzás
```

---

## Egészség szintek (sérülési anyagcserék)

A DayZ tárgyak idővel degradálódnak. A motor támogatja az automatikus anyagcserét különböző sérülési küszöböknél, amelyet a `config.cpp`-ben a `healthLevels[]` tömbbel definiálunk.

### healthLevels[] felépítés

```cpp
class MyItem: Inventory_Base
{
    healthLevels[] =
    {
        {1.0, {"MyMod\data\my_item.rvmat"}},           // Érintetlen (100% életerő)
        {0.7, {"MyMod\data\my_item_worn.rvmat"}},       // Kopott (70% életerő)
        {0.5, {"MyMod\data\my_item_damaged.rvmat"}},     // Sérült (50% életerő)
        {0.3, {"MyMod\data\my_item_badly_damaged.rvmat"}},// Nagyon sérült (30% életerő)
        {0.0, {"MyMod\data\my_item_ruined.rvmat"}}       // Tönkrement (0% életerő)
    };
};
```

### Vanilla sérülési anyagok használata

A DayZ általános sérülési fedőanyagokat biztosít:

```cpp
healthLevels[] =
{
    {1.0, {"MyMod\data\my_item.rvmat"}},
    {0.7, {"DZ\data\data\default_worn.rvmat"}},
    {0.5, {"DZ\data\data\default_damaged.rvmat"}},
    {0.3, {"DZ\data\data\default_badly_damaged.rvmat"}},
    {0.0, {"DZ\data\data\default_ruined.rvmat"}}
};
```

---

## Gyakori hibák

### 1. Rossz szakasz sorrend

**Tünet:** A textúra kevert, a normál térkép színként jelenik meg, a szín dudorodásként jelenik meg.
**Javítás:** Győződj meg róla, hogy a Stage1 = normál, Stage2 = diffúz, Stage3 = tükrözési (a Super shader esetén).

### 2. Az `emmisive` hibás írásmódja

**Tünet:** Az önvilágítás nem működik.
**Javítás:** A Bohemia az `emmisive`-t használja (dupla m, szimpla s). A helyes angol `emissive` írásmód nem fog működni. Ez ismert történelmi furcsaság.

### 3. Textúra útvonal eltérés

**Tünet:** A modell alapértelmezett szürke vagy magenta anyaggal jelenik meg.
**Javítás:** Ellenőrizd, hogy az RVMAT-ban lévő textúra útvonalak pontosan egyeznek a fájlok P: meghajtóhoz viszonyított helyeivel.

### 4. Rossz shader átlátszó tárgyakhoz

**Tünet:** Az átlátszó textúra átlátszatlannak tűnik, vagy a teljes felület eltűnik.
**Javítás:** Használj `Glass`, `AlphaTest` vagy `AlphaBlend` shader-t `Super` helyett átlátszó felületekhez. Használj `_ca` utótagú textúrákat megfelelő alfa csatornákkal.

---

## Bevált gyakorlatok

1. **Kezdj egy működő példából.** Másolj egy RVMAT-ot a DayZ-Samples-ből vagy egy vanilla tárgyból és módosítsd. A nulláról indulás gépelési hibákra csábít.

2. **Tartsd együtt az anyagokat és textúrákat.** Tárold az RVMAT-ot ugyanabban a `data/` könyvtárban, mint a textúráit.

3. **Használd a Super shader-t, hacsak nincs okod másra.** Az esetek 95%-át helyesen kezeli.

4. **Készíts sérülési anyagokat még egyszerű tárgyakhoz is.** A játékosok észreveszik, amikor a tárgyak vizuálisan nem degradálódnak. Legalább használd a vanilla alapértelmezett sérülési anyagokat az alacsonyabb életerő szintekhez.

5. **Tesztelj tükrözést játékban, nem csak Object Builder-ben.** A szerkesztő és a játékbeli megvilágítás nagyon eltérő eredményeket produkál.

6. **Dokumentáld az anyag beállításaidat.** Amikor jól működő tükrözési/erő értékeket találsz egy felülettípushoz, jegyezd fel őket.

---

## Navigáció

| Előző | Fel | Következő |
|----------|----|------|
| [4.2 3D modellek](02-models.md) | [4. rész: Fájlformátumok és DayZ Tools](01-textures.md) | [4.4 Hang](04-audio.md) |
