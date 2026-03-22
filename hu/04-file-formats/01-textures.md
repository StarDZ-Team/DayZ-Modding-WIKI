# 4.1. fejezet: Textúrák (.paa, .edds, .tga)

[Kezdőlap](../../README.md) | **Textúrák** | [Következő: 3D modellek >>](02-models.md)

---

## Bevezetés

Minden felület, amit a DayZ-ben látsz -- fegyver skinek, ruházat, terep, UI ikonok -- textúra fájlok határozzák meg. A motor egy szabadalmazott tömörített formátumot használ, a **PAA**-t futásidőben, de a fejlesztés során több forrásformátummal dolgozol, amelyek a build folyamat során konvertálódnak. Ezen formátumok megértése, az elnevezési konvenciók amelyek az anyagokhoz kötik őket, és a motor által megkövetelt felbontási szabályok alapvetőek a DayZ modok vizuális tartalmának létrehozásához.

Ez a fejezet lefed minden textúra formátumot, amellyel találkozni fogsz, az utótag elnevezési rendszert, amely megmondja a motornak hogyan értelmezze az egyes textúrákat, a felbontási és alfa csatorna követelményeket, és a formátumok közötti konvertálás gyakorlati munkafolyamatát.

---

## Tartalomjegyzék

- [Textúra formátumok áttekintése](#texture-formats-overview)
- [PAA formátum](#paa-format)
- [EDDS formátum](#edds-format)
- [TGA formátum](#tga-format)
- [PNG formátum](#png-format)
- [Textúra elnevezési konvenciók](#texture-naming-conventions)
- [Felbontási követelmények](#resolution-requirements)
- [Alfa csatorna támogatás](#alpha-channel-support)
- [Konvertálás formátumok között](#converting-between-formats)
- [Textúra minőség és tömörítés](#texture-quality-and-compression)
- [Valós példák](#real-world-examples)
- [Gyakori hibák](#common-mistakes)
- [Bevált gyakorlatok](#best-practices)

---

## Textúra formátumok áttekintése

A DayZ négy textúra formátumot használ a fejlesztési csővezeték különböző szakaszaiban:

| Formátum | Kiterjesztés | Szerep | Alfa támogatás | Használat helye |
|--------|-----------|------|---------------|---------|
| **PAA** | `.paa` | Futásidejű játék formátum (tömörített) | Igen | Végső build, PBO-kba csomagolva |
| **EDDS** | `.edds` | Szerkesztő/köztes DDS változat | Igen | Object Builder előnézet, automatikusan konvertál |
| **TGA** | `.tga` | Tömörítetlen forrás alkotás | Igen | Művész munkaterület, Photoshop/GIMP export |
| **PNG** | `.png` | Hordozható forrás formátum | Igen | UI textúrák, külső eszközök |

Az általános munkafolyamat: **Forrás (TGA/PNG) --> DayZ Tools konverzió --> PAA (játékra kész)**.

---

## PAA formátum

A **PAA** (PAcked Arma) az Enfusion motor által futásidőben használt natív tömörített textúra formátum. Minden textúrának, ami PBO-ban kerül szállításra, PAA formátumban kell lennie (vagy binarizálás során konvertálódik azzá).

### Jellemzők

- **Tömörített:** DXT1, DXT5 vagy ARGB8888 tömörítést használ belül az alfa csatorna jelenlététől és a minőségi beállításoktól függően.
- **Mipmap-olt:** A PAA fájlok teljes mipmap láncot tartalmaznak, amelyet a konverzió során automatikusan generálnak. Ez kritikus a renderelési teljesítményhez -- a motor a távolság alapján választja ki a megfelelő mip szintet.
- **Kettő hatványai méretű:** A motor megköveteli, hogy a PAA textúrák 2 hatványai méretűek legyenek (256, 512, 1024, 2048, 4096).
- **Futásidőben csak olvasható:** A motor közvetlenül a PBO-kból tölti be a PAA fájlokat. Soha nem szerkesztesz PAA fájlt -- a forrást szerkeszted és újrakonvertálod.

### Belső tömörítési típusok

| Típus | Alfa | Minőség | Felhasználási terület |
|------|-------|---------|----------|
| **DXT1** | Nem (1-bites) | Jó, 6:1 arány | Átlátszatlan textúrák, terep |
| **DXT5** | Teljes 8-bites | Jó, 4:1 arány | Sima alfával rendelkező textúrák (üveg, lombozat) |
| **ARGB4444** | Teljes 4-bites | Közepes | UI textúrák, kis ikonok |
| **ARGB8888** | Teljes 8-bites | Veszteségmentes | Hibakeresés, legmagasabb minőség (nagy fájlméret) |
| **AI88** | Szürkeárnyalatos + alfa | Jó | Normál térképek, szürkeárnyalatos maszkok |

---

## EDDS formátum

Az **EDDS** egy köztes textúra formátum, amelyet elsősorban a DayZ **Object Builder** és a szerkesztő eszközök használnak. Lényegében a szabványos DirectDraw Surface (DDS) formátum változata motor-specifikus metaadatokkal.

### Jellemzők

- **Előnézeti formátum:** Az Object Builder közvetlenül megjelenítheti az EDDS textúrákat, ami hasznossá teszi őket a modell készítés során.
- **Automatikusan konvertálódik PAA-vá:** Amikor a Binarize-t vagy az AddonBuilder-t futtatod (a `-packonly` nélkül), a forrásfában lévő EDDS fájlok automatikusan PAA-vá konvertálódnak.

> **Tipp:** Teljesen átugorhatod az EDDS-t, ha úgy tetszik. Konvertáld a forrás textúráidat közvetlenül PAA-vá a TexView2 használatával, és hivatkozz a PAA útvonalakra az anyagaidban. Az EDDS kényelmi funkció, nem követelmény.

---

## TGA formátum

A **TGA** (Truevision TGA / Targa) a hagyományos tömörítetlen forrásformátum a DayZ textúra munkához. Sok vanilla DayZ textúra eredetileg TGA fájlként készült.

### Mikor használjuk a TGA-t

- A nulláról készített textúráid mesterforrás fájljaként.
- Substance Painter-ből vagy Photoshop-ból való exportáláskor DayZ-hez.
- Amikor a DayZ-Samples dokumentáció vagy közösségi oktatóanyagok TGA-t adnak meg forrásformátumként.

---

## PNG formátum

A **PNG** (Portable Network Graphics) széles körben támogatott és alternatív forrásformátumként használható, különösen UI textúrákhoz.

### Mikor használjuk a PNG-t

- **UI textúrák és ikonok:** A PNG a praktikus választás imagesetekhez és HUD elemekhez.
- **Egyszerű újraszínezések:** Amikor csak szín/diffúz térképre van szükséged komplex alfa nélkül.
- **Eszközök közötti munkafolyamatok:** A PNG univerzálisan támogatott a képszerkesztők, web eszközök és scriptek között.

> **Megjegyzés:** A PNG nem hivatalos Bohemia forrásformátum -- ők a TGA-t preferálják. Azonban a konverziós eszközök probléma nélkül kezelik a PNG-t, és sok modder sikeresen használja.

---

## Textúra elnevezési konvenciók

A DayZ szigorú utótag rendszert használ az egyes textúrák szerepének azonosítására.

### Kötelező utótagok

| Utótag | Teljes név | Cél | Tipikus formátum |
|--------|-----------|---------|----------------|
| `_co` | **Color / Diffuse** | A felület alapszíne (albedo) | RGB, opcionális alfa |
| `_nohq` | **Normal Map (High Quality)** | Felületi részlet normálok, dudorodásokat és barázdákat definiál | RGB (érintőtér normál) |
| `_smdi` | **Specular / Metallic / Detail Index** | Fényességet és fémes tulajdonságokat szabályoz | RGB csatornák külön adatokat kódolnak |
| `_ca` | **Color with Alpha** | Szín textúra, ahol az alfa csatorna értelmes adatot hordoz (átlátszóság, maszk) | RGBA |
| `_as` | **Ambient Shadow** | Környezeti elzáródás / árnyék sütés | Szürkeárnyalatos |
| `_mc` | **Macro** | Nagyszabású szín variáció távolról látható | RGB |
| `_li` | **Light / Emissive** | Önvilágítási térkép (izzó részek) | RGB |

### Elnevezési konvenció a gyakorlatban

Egyetlen tárgynak jellemzően több textúrája van, amelyek mind közös alapnevet osztanak:

```
data/
  my_rifle_co.paa          <-- Alapszín (amit látsz)
  my_rifle_nohq.paa        <-- Normál térkép (felületi egyenetlenségek)
  my_rifle_smdi.paa         <-- Tükrözési/fémes (fényesség)
  my_rifle_as.paa           <-- Környezeti árnyék (sütött AO)
  my_rifle_ca.paa           <-- Szín alfával (ha átlátszóság szükséges)
```

---

## Felbontási követelmények

Az Enfusion motor megköveteli, hogy minden textúra **kettő hatványai méretű** legyen. A szélességnek és magasságnak egyenként kell 2 hatványa lennie, de nem kell egyenlőnek lenniük (nem négyzetes textúrák érvényesek).

### Érvényes méretek

| Méret | Tipikus használat |
|------|-------------|
| **64x64** | Apró ikonok, UI elemek |
| **128x128** | Kis ikonok, leltár miniatűrök |
| **256x256** | UI panelek, kis tárgy textúrák |
| **512x512** | Szabványos tárgy textúrák, ruházat |
| **1024x1024** | Fegyverek, részletes ruházat, járműalkatrészek |
| **2048x2048** | Nagy részletességű fegyverek, karakter modellek |
| **4096x4096** | Terep textúrák, nagy jármű textúrák |

> **Figyelmeztetés:** Ha egy textúra nem kettő hatványa méretű, a motor vagy nem tölti be, vagy magenta hibajelző textúrát jelenít meg. A TexView2 figyelmeztetést mutat a konverzió során.

---

## Alfa csatorna támogatás

A textúra alfa csatornája a színen túli további adatot hordoz. Az értelmezése a textúra utótagtól és az anyag shader-től függ.

### Textúrák készítése alfával

Képszerkesztődben (Photoshop, GIMP, Krita):

1. Készítsd el az RGB tartalmat a szokásos módon.
2. Adj hozzá alfa csatornát.
3. Fesd fehérre (255) ahol teljes átlátszatlanságot/hatást akarsz, feketére (0) ahol semmit.
4. Exportáld 32-bites TGA-ként vagy PNG-ként.
5. Konvertáld PAA-vá a TexView2 használatával -- automatikusan felismeri az alfa csatornát.

---

## Konvertálás formátumok között

### TexView2 (elsődleges eszköz)

A **TexView2** a DayZ Tools-szal együtt kerül telepítésre és a szabványos textúra konverziós segédprogram.

**Konvertálás PAA-vá:**
1. Nyisd meg a forrás textúrát a TexView2-ben.
2. Válaszd a **File --> Save As** menüt.
3. Válaszd a **PAA** kimeneti formátumot.
4. Válaszd a tömörítési típust:
   - **DXT1** átlátszatlan textúrákhoz (nincs szükség alfára)
   - **DXT5** alfa átlátszóságú textúrákhoz
   - **ARGB4444** kis UI textúrákhoz ahol a fájlméret számít
5. Kattints a **Save** gombra.

### Manuális konverziós táblázat

| Honnan | Hova | Eszköz | Megjegyzések |
|------|----|------|-------|
| TGA --> PAA | TexView2 | Szabványos munkafolyamat |
| PNG --> PAA | TexView2 | A TGA-val azonosan működik |
| EDDS --> PAA | TexView2 vagy Binarize | Automatikus build során |
| PAA --> TGA | TexView2 (Save As TGA) | Meglévő textúrák szerkesztéséhez |
| PAA --> PNG | TexView2 (Save As PNG) | Hordozható formátumba való kinyeréshez |
| PSD --> TGA/PNG | Photoshop/GIMP | Export a szerkesztőből, majd konvertálás |

---

## Textúra minőség és tömörítés

### Tömörítési típus kiválasztása

| Forgatókönyv | Ajánlott tömörítés | Ok |
|----------|------------------------|--------|
| Átlátszatlan diffúz (`_co`) | DXT1 | Legjobb arány, nincs szükség alfára |
| Átlátszó diffúz (`_ca`) | DXT5 | Teljes alfa támogatás |
| Normál térképek (`_nohq`) | DXT5 | Az alfa csatorna tükrözési erőt hordoz |
| Tükrözési térképek (`_smdi`) | DXT1 | Általában átlátszatlan, csak RGB csatornák |
| UI textúrák | ARGB4444 vagy DXT5 | Kis méret, tiszta élek |

---

## Valós példák

### Fegyver textúra készlet

Tipikus fegyvermod textúra fájljai:

```
MyMod_Weapons/data/weapons/m4a1/
  my_weapon_co.paa           <-- 2048x2048, DXT1, alapszín
  my_weapon_nohq.paa         <-- 2048x2048, DXT5, normál térkép
  my_weapon_smdi.paa          <-- 2048x2048, DXT1, tükrözési/fémes
  my_weapon_as.paa            <-- 1024x1024, DXT1, környezeti árnyék
```

---

## Gyakori hibák

### 1. Nem kettő hatványa méretű

**Tünet:** Magenta textúra a játékban, TexView2 figyelmeztetések.
**Javítás:** Méretezd át a forrásodat a legközelebbi 2 hatványára a konvertálás előtt.

### 2. Hiányzó utótag

**Tünet:** Az anyag nem találja a textúrát, vagy hibásan renderelődik.
**Javítás:** Mindig add meg a megfelelő utótagot (`_co`, `_nohq` stb.) a fájlnévben.

### 3. Rossz tömörítés az alfához

**Tünet:** Az átlátszóság blokkos vagy bináris (be/ki gradiens nélkül).
**Javítás:** Használj DXT5-öt DXT1 helyett olyan textúrákhoz, amelyeknek sima alfa gradiensre van szükségük.

### 4. Helytelen normál térkép formátum

**Tünet:** A megvilágítás a modellen fordítva vagy lapos.
**Javítás:** Győződj meg róla, hogy a normál térképed érintőtér formátumú DirectX-stílusú Y-tengely konvencióval (zöld csatorna: felfelé = világosabb).

### 5. Útvonal eltérés konverzió után

**Tünet:** A modell vagy anyag magentát mutat, mert `.tga` útvonalra hivatkozik, de a PBO `.paa`-t tartalmaz.
**Javítás:** Az anyagoknak a végleges `.paa` útvonalra kell hivatkozniuk.

---

## Bevált gyakorlatok

1. **Tartsd a forrásfájlokat verziókezelés alatt.** Tárold a TGA/PNG mestereket a mododdal együtt. A PAA fájlok generált kimenet -- a források az amik számítanak.

2. **Igazítsd a felbontást a fontossághoz.** Egy puska, amelyet a játékos órákig néz, megérdemli a 2048x2048-at. Egy konzerv a polc hátuljában megúszhatja az 512x512-vel.

3. **Mindig adj meg normál térképet.** Még egy lapos normál térkép is (128, 128, 255 egyszínű kitöltés) jobb, mint semmi -- a hiányzó normál térképek anyag hibákat okoznak.

4. **Nevezd el következetesen.** Egy alapnév, több utótag: `myitem_co.paa`, `myitem_nohq.paa`, `myitem_smdi.paa`. Soha ne keverj elnevezési sémákat.

5. **Nézd meg előnézetben a TexView2-ben a build előtt.** Nyisd meg a PAA kimenetedet és ellenőrizd, hogy jól néz ki. Vizsgáld meg külön-külön minden csatornát.

6. **Használj DXT1-et alapértelmezetten, DXT5-öt csak amikor alfa szükséges.** A DXT1 fele akkora fájlméretű mint a DXT5 és azonosnak tűnik átlátszatlan textúráknál.

7. **Tesztelj alacsony minőségi beállításoknál.** Ami Ultra-n remekül néz ki, az Low-on olvashatatlan lehet, mert a motor agresszíven csökkenti a mip szinteket.

---

## Navigáció

| Előző | Fel | Következő |
|----------|----|------|
| [3. rész: GUI rendszer](../03-gui-system/07-styles-fonts.md) | [4. rész: Fájlformátumok és DayZ Tools](../04-file-formats/01-textures.md) | [4.2 3D modellek](02-models.md) |
