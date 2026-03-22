# 8.13. fejezet: A diagnosztikai menü (Diag Menu)

[Kezdőlap](../../README.md) | [<< Előző: Kereskedési rendszer építése](12-trading-system.md) | **A diagnosztikai menü**

---

> **Összefoglalás:** A Diag Menu a DayZ beépített diagnosztikai eszköze, amely kizárólag a DayZDiag futtatható állományon keresztül érhető el. FPS-számlálót, szkript profilozást, renderelési hibakeresést, szabad kamerát, fizikai vizualizációt, időjárás-vezérlést, Central Economy eszközöket, AI navigációs hibakeresést és hangdiagnosztikát biztosít. Ez a fejezet a hivatalos Bohemia Interactive dokumentáció alapján minden menükategóriát, opciót és billentyűparancsot dokumentál.

---

## Tartalomjegyzék

- [Mi az a Diag Menu?](#mi-az-a-diag-menu)
- [Hogyan érhető el](#hogyan-érhető-el)
- [Navigációs vezérlők](#navigációs-vezérlők)
- [Gyorselérési billentyűparancsok](#gyorselérési-billentyűparancsok)
- [Menükategóriák áttekintése](#menükategóriák-áttekintése)
- [Statistics](#statistics)
- [Enfusion Renderer](#enfusion-renderer)
- [Enfusion World (Physics)](#enfusion-world-physics)
- [DayZ Render](#dayz-render)
- [Game](#game)
- [AI](#ai)
- [Sounds](#sounds)
- [Hasznos funkciók modderek számára](#hasznos-funkciók-modderek-számára)
- [Mikor használd a Diag Menüt](#mikor-használd-a-diag-menüt)
- [Gyakori hibák](#gyakori-hibák)
- [Következő lépések](#következő-lépések)

---

## Mi az a Diag Menu?

A Diag Menu egy hierarchikus hibakereső menü, amely a DayZ diagnosztikai futtatható állományába van beépítve. A játék szkriptelésének és eszközeinek hibakereséséhez használt opciókat sorolja fel hét fő kategóriában: Statistics, Enfusion Renderer, Enfusion World, DayZ Render, Game, AI és Sounds.

A Diag Menu **nem érhető el** a DayZ kereskedelmi futtatható állományában (`DayZ_x64.exe`). A `DayZDiag_x64.exe` fájlt kell használnod -- a diagnosztikai buildet, amely a kereskedelmi verzió mellett található meg a DayZ telepítési vagy DayZ Server könyvtáraiban.

---

## Hogyan érhető el

### Követelmények

- **DayZDiag_x64.exe** -- A diagnosztikai futtatható állomány. A DayZ telepítési mappádban található a szokásos `DayZ_x64.exe` mellett.
- A játéknak futnia kell (nem a betöltőképernyőn ülve). A menü bármely 3D nézetben elérhető.

### A menü megnyitása

Nyomd meg a **Win + Alt** billentyűkombinációt a Diag Menu megnyitásához.

Egy alternatív gyorsbillentyű a **Ctrl + Win**, de ez ütközik egy Windows 11 rendszer-gyorsbillentyűvel, ezért azon a platformon nem ajánlott.

### Egérkurzor engedélyezése

Néhány Diag Menu opció megköveteli, hogy az egérrel interakcióba lépj a képernyővel. Az egérkurzor a következő billentyűkombinációval kapcsolható:

**LCtrl + Numpad 9**

Ez a billentyűkiosztás szkripten keresztül van regisztrálva (`PluginKeyBinding`).

---

## Navigációs vezérlők

Amikor a Diag Menu meg van nyitva:

| Billentyű | Művelet |
|-----------|---------|
| **Fel / Le nyíl** | Navigálás a menüelemek között |
| **Jobbra nyíl** | Almenübe lépés, vagy az opció értékeinek léptetése |
| **Balra nyíl** | Az opció értékeinek visszafelé léptetése |
| **Backspace** | Kilépés az aktuális almenüből (vissza egy szinttel) |

Ha az opciók több értéket mutatnak, azok a menüben megjelenő sorrendben vannak felsorolva. Az első opció általában az alapértelmezett.

---

## Gyorselérési billentyűparancsok

Ezek a gyorsbillentyűk bármikor működnek a DayZDiag futtatása közben, anélkül, hogy meg kellene nyitni a menüt:

| Gyorsbillentyű | Funkció |
|----------------|---------|
| **LCtrl + Numpad 1** | FPS-számláló be-/kikapcsolása |
| **LCtrl + Numpad 9** | Egérkurzor be-/kikapcsolása a képernyőn |
| **RCtrl + RAlt + W** | Renderelési hibakeresési mód léptetése |
| **LCtrl + LAlt + P** | Utófeldolgozási effektek be-/kikapcsolása |
| **LAlt + Numpad 6** | Fizikai test vizualizáció be-/kikapcsolása |
| **Page Up** | Szabad kamera: játékos mozgásának be-/kikapcsolása |
| **Page Down** | Szabad kamera: kamera befagyasztása/feloldása |
| **Insert** | Játékos teleportálása a kurzor pozíciójára (szabad kamerában) |
| **Home** | Szabad kamera be-/kikapcsolása / kikapcsolás és játékos teleportálása a kurzorhoz |
| **Numpad /** | Szabad kamera be-/kikapcsolása (teleport nélkül) |
| **End** | Szabad kamera kikapcsolása (visszatérés a játékos kamerájára) |

> **Megjegyzés:** A hivatalos dokumentációban szereplő bármely "Cheat Inputs" hivatkozás a C++ oldalon beégetett bemenetekre vonatkozik, amelyek nem érhetők el szkripten keresztül.

---

## Menükategóriák áttekintése

A Diag Menu hét felső szintű kategóriát tartalmaz:

1. **Statistics** -- FPS-számláló és szkript profilozó
2. **Enfusion Renderer** -- Világítás, árnyékok, anyagok, takarás, utófeldolgozás, terep, widgetek
3. **Enfusion World** -- Fizikai motor (Bullet) vizualizáció és hibakeresés
4. **DayZ Render** -- Égbolt renderelés, geometria diagnosztika
5. **Game** -- Időjárás, szabad kamera, járművek, harc, Central Economy, felületi hangok
6. **AI** -- Navigációs háló, útvonalkeresés, AI ágens viselkedés
7. **Sounds** -- Lejátszott minták hibakeresése, hangrendszer információk

---

## Statistics

### Menüstruktúra

```
Statistics
  FPS                              [LCtrl + Numpad 1]
  Script profiler UI
  > Script profiler settings
      Always enabled
      Flags
      Module
      Update interval
      Average
      Time resolution
      (UI) Scale
```

### FPS

Engedélyezi az FPS-számlálót a képernyő bal felső sarkában.

Az FPS-érték az utolsó 10 képkocka közötti időből számított, tehát rövid gördülő átlagot tükröz, nem pillanatnyi értéket.

### Script Profiler UI

Bekapcsolja a képernyőn megjelenő Script Profiler-t, amely valós idejű teljesítményadatokat jelenít meg a szkriptvégrehajtásról.

A profilozó hat adatszekciót mutat:

| Szekció | Mit mutat |
|---------|-----------|
| **Time per class** | Egy osztályhoz tartozó összes függvényhívás összesített ideje (top 20) |
| **Time per function** | Egy adott függvény összes hívásának összesített ideje (top 20) |
| **Class allocations** | Egy osztály allokációinak száma (top 20) |
| **Count per function** | Egy függvény meghívásának száma (top 20) |
| **Class count** | Egy osztály élő példányainak száma (top 40) |
| **Stats and settings** | Aktuális profilozó konfiguráció és képkocka-számlálók |

A Stats and settings panel a következőket mutatja:

| Mező | Jelentés |
|------|----------|
| UI enabled (DIAG) | A szkript profilozó UI aktív-e |
| Profiling enabled (SCRP) | A profilozás fut-e akkor is, ha a UI nem aktív |
| Profiling enabled (SCRC) | Ténylegesen folyik-e profilozás |
| Flags | Aktuális adatgyűjtési jelzők |
| Module | Jelenleg profilozott modul |
| Interval | Aktuális frissítési intervallum |
| Time Resolution | Aktuális időfelbontás |
| Average | Az értékek átlagok-e |
| Game Frame | Összes eltelt képkocka |
| Session Frame | Összes képkocka ebben a profilozási munkamenetben |
| Total Frames | Összes képkocka az összes profilozási munkamenetben |
| Profiled Sess Frms | Ebben a munkamenetben profilozott képkockák |
| Profiled Frames | Az összes munkamenetben profilozott képkockák |

> **Fontos:** A Script Profiler csak szkriptkódot profiloz. A Proto (motorhoz kötött) metódusok nem jelennek meg külön bejegyzésként, de végrehajtási idejük benne van az őket hívó szkriptmetódus összesített idejében.

> **Fontos:** Az EnProfiler API és maga a szkript profilozó csak a diagnosztikai futtatható állományon érhető el.

### Script Profiler beállítások

Ezek a beállítások szabályozzák, hogyan történik a profilozási adatok gyűjtése. Programozottan is módosíthatók az `EnProfiler` API-n keresztül (dokumentálva az `EnProfiler.c` fájlban).

#### Always Enabled

A profilozási adatgyűjtés alapértelmezés szerint nem engedélyezett. Ez a kapcsoló mutatja, hogy jelenleg aktív-e.

A profilozás indításkor való engedélyezéséhez használd a `-profile` indítási paramétert.

A Script Profiler UI figyelmen kívül hagyja ezt a beállítást -- mindig kényszeríti a profilozást, amíg a UI látható. Amikor a UI-t kikapcsolod, a profilozás újra leáll (hacsak az "Always enabled" nincs true-ra állítva).

#### Flags

Szabályozza az adatgyűjtés módját. Négy kombináció érhető el:

| Jelző kombináció | Hatókör | Adatok élettartama |
|-----------------|---------|-------------------|
| `SPF_RESET \| SPF_RECURSIVE` | Kiválasztott modul + gyermekek | Képkockánkénti (minden képkockában visszaállítva) |
| `SPF_RECURSIVE` | Kiválasztott modul + gyermekek | Képkockákon átívelő halmozott |
| `SPF_RESET` | Csak a kiválasztott modul | Képkockánkénti (minden képkockában visszaállítva) |
| `SPF_NONE` | Csak a kiválasztott modul | Képkockákon átívelő halmozott |

- **SPF_RECURSIVE**: Engedélyezi a gyermekmodulok profilozását (rekurzívan)
- **SPF_RESET**: Törli az adatokat minden képkocka végén

#### Module

Kiválasztja, melyik szkriptmodult profilozzuk:

| Opció | Szkript réteg |
|-------|--------------|
| CORE | 1_Core |
| GAMELIB | 2_GameLib |
| GAME | 3_Game |
| WORLD | 4_World |
| MISSION | 5_Mission |
| MISSION_CUSTOM | init.c |

#### Update Interval

A képkockák száma, amelyet meg kell várni a rendezett adatmegjelenítés frissítése előtt. Ez késlelteti az `SPF_RESET` által okozott visszaállítást is.

Elérhető értékek: 0, 5, 10, 20, 30, 50, 60, 120, 144

#### Average

Átlagértékek megjelenítésének engedélyezése vagy letiltása.

- `SPF_RESET` esetén és intervallum nélkül: az értékek a nyers képkockánkénti értékek
- `SPF_RESET` nélkül: az összegyűjtött értéket elosztja a munkamenet képkockaszámával
- Beállított intervallummal: elosztja az intervallummal

Az osztályszám soha nem átlagolt -- mindig az aktuális példányszámot mutatja. Az allokációk az átlagos létrehozási számot mutatják.

#### Time Resolution

Beállítja az idő megjelenítési egységét. Az érték a nevezőt jelöli (a másodperc hányad része):

| Érték | Egység |
|-------|--------|
| 1 | Másodperc |
| 1000 | Ezredmásodperc |
| 1000000 | Mikroszekundum |

Elérhető értékek: 1, 10, 100, 1000, 10000, 100000, 1000000

#### (UI) Scale

A képernyőn megjelenő profilozó megjelenítésének vizuális méretezését állítja be különböző képernyőméretekhez és felbontásokhoz.

Tartomány: 0.5-től 1.5-ig (alapértelmezett: 1.0, lépés: 0.05)

---

## Enfusion Renderer

### Menüstruktúra

```
Enfusion Renderer
  Lights
  > Lighting
      Ambient lighting
      Ground lighting
      Directional lighting
      Bidirectional lighting
      Specular lighting
      Reflection
      Emission lighting
  Shadows
  Terrain shadows
  Render debug mode                [RCtrl + RAlt + W]
  Occluders
  Occlude entities
  Occlude proxies
  Show occluder volumes
  Show active occluders
  Show occluded
  Widgets
  Postprocess                      [LCtrl + LAlt + P]
  Terrain
  > Materials
      Common, TreeTrunk, TreeCrown, Grass, Basic, Normal,
      Super, Skin, Multi, Old Terrain, Old Roads, Water,
      Sky, Sky clouds, Sky stars, Sky flares,
      Particle Sprite, Particle Streak
```

### Lights

A tényleges fényforrásokat kapcsolja (például `PersonalLight` vagy játékbeli tárgyak, mint zseblámpák). Ez nem érinti a környezeti világítást -- ahhoz a Lighting almenüt használd.

### Lighting almenü

Minden kapcsoló egy adott világítási komponenst vezérel:

| Opció | Hatás kikapcsolt állapotban |
|-------|-----------------------------|
| **Ambient lighting** | Eltávolítja az általános környezeti fényt a jelenetből |
| **Ground lighting** | Eltávolítja a talajról visszaverődő fényt (tetőkön, karakter hónalj alatt látható) |
| **Directional lighting** | Eltávolítja a fő irányított (nap/hold) fényt. A kétirányú világítást is letiltja |
| **Bidirectional lighting** | Eltávolítja a kétirányú fénykomponenst |
| **Specular lighting** | Eltávolítja a tükrös fénycsúcsokat (fényes felületeken látható, mint szekrények, autók) |
| **Reflection** | Eltávolítja a visszaverődési világítást (fémes/fényes felületeken látható) |
| **Emission lighting** | Eltávolítja az emissziós (önvilágítás) anyagokból |

Ezek a kapcsolók hasznosak az egyes világítási hozzájárulások elkülönítéséhez, amikor vizuális problémákat debugolsz egyedi modellekben vagy jelenetekben.

### Shadows

Engedélyezi vagy letiltja az árnyékrenderelést. A letiltás eltávolítja az eső objektumokon belüli kiszűrését is (az eső áthullik a tetőkön).

### Terrain Shadows

Szabályozza a terepárnyékok generálásának módját.

Opciók: `on (slice)`, `on (full)`, `no update`, `disabled`

### Render Debug Mode

Renderelési vizualizációs módok között vált a háló geometria játékban történő vizsgálatához.

Opciók: `normal`, `wire`, `wire only`, `overdraw`, `overdrawZ`

A különböző anyagok különböző drótváz színekben jelennek meg:

| Anyag | Szín (RGB) |
|-------|------------|
| TreeTrunk | 179, 126, 55 |
| TreeCrown | 143, 227, 94 |
| Grass | 41, 194, 53 |
| Basic | 208, 87, 87 |
| Normal | 204, 66, 107 |
| Super | 234, 181, 181 |
| Skin | 252, 170, 18 |
| Multi | 143, 185, 248 |
| Terrain | 255, 127, 127 |
| Water | 51, 51, 255 |
| Ocean | 51, 128, 255 |
| Sky | 143, 185, 248 |

### Occluders

Kapcsolók az okkluziós kiválogatási rendszerhez:

| Opció | Hatás |
|-------|-------|
| **Occluders** | Objektum okkluziós be-/kikapcsolása |
| **Occlude entities** | Entitás okkluziós be-/kikapcsolása |
| **Occlude proxies** | Proxy okkluziós be-/kikapcsolása |
| **Show occluder volumes** | Pillanatfelvételt készít és hibakereső alakzatokat rajzol az okkluziós térfogatok vizualizálásához |
| **Show active occluders** | A jelenleg aktív okkludereket mutatja hibakereső alakzatokkal |
| **Show occluded** | Az okkludált objektumokat vizualizálja hibakereső alakzatokkal |

### Widgets

Az összes UI widget renderelésének engedélyezése vagy letiltása. Hasznos tiszta képernyőképek készítéséhez vagy renderelési problémák elkülönítéséhez.

### Postprocess

Utófeldolgozási effektek (bloom, színkorrekció, vignetta stb.) engedélyezése vagy letiltása.

### Terrain

A terepek renderelésének teljes engedélyezése vagy letiltása.

### Materials almenü

Adott anyagtípusok renderelésének be-/kikapcsolása. A legtöbb magától értetődő. Figyelemre méltó bejegyzések:

- **Super** -- Átfogó kapcsoló, amely minden "super" shaderhez kapcsolódó anyagot lefed
- **Old Terrain** -- Mind a Terrain, mind a Terrain Simple anyagokat lefedi
- **Water** -- Minden vízhez kapcsolódó anyagot lefed (óceán, part, folyók)

---

## Enfusion World (Physics)

### Menüstruktúra

```
Enfusion World
  Show Bullet
  > Bullet
      Draw Char Ctrl
      Draw Simple Char Ctrl
      Max. Collider Distance
      Draw Bullet shape
      Draw Bullet wireframe
      Draw Bullet shape AABB
      Draw obj center of mass
      Draw Bullet contacts
      Force sleep Bullet
      Show stats
  Show bodies                      [LAlt + Numpad 6]
```

> **Megjegyzés:** A "Bullet" itt a Bullet fizikai motorra utal, nem a lőszerre.

### Show Bullet

Bekapcsolja a Bullet fizikai motor hibakereső vizualizációját.

### Bullet almenü

| Opció | Leírás |
|-------|--------|
| **Draw Char Ctrl** | A játékos karaktervezérlő vizualizálása. A "Draw Bullet shape" opciótól függ |
| **Draw Simple Char Ctrl** | Az AI karaktervezérlő vizualizálása. A "Draw Bullet shape" opciótól függ |
| **Max. Collider Distance** | Maximális távolság a játékostól az ütközők vizualizálásához (értékek: 0, 1, 2, 5, 10, 20, 50, 100, 200, 500). Alapértelmezett: 0 |
| **Draw Bullet shape** | Fizikai ütköző alakzatok vizualizálása |
| **Draw Bullet wireframe** | Ütközők megjelenítése csak drótvázként. A "Draw Bullet shape" opciótól függ |
| **Draw Bullet shape AABB** | Az ütközők tengelyre igazított befoglaló dobozainak megjelenítése |
| **Draw obj center of mass** | Objektumok tömegközéppontjainak megjelenítése |
| **Draw Bullet contacts** | Érintkező ütközők vizualizálása |
| **Force sleep Bullet** | Az összes fizikai test alvásra kényszerítése |
| **Show stats** | Hibakereső statisztikák megjelenítése (opciók: disabled, basic, all). A statisztikák 10 másodpercig láthatók maradnak a kikapcsolás után |

> **Figyelmeztetés:** A Max. Collider Distance alapértelmezés szerint 0, mert ez a vizualizáció költséges. Nagy távolságra állítása jelentős teljesítményromlást okoz.

### Show Bodies

Bullet fizikai testek vizualizálása. Opciók: `disabled`, `only`, `all`

---

## DayZ Render

### Menüstruktúra

```
DayZ Render
  > Sky
      Space
      Stars
      > Planets
          Sun
          Moon
      Atmosphere
      > Clouds
          Far
          Near
          Physical
      Horizon
      > Post Process
          God Rays
  > Geometry diagnostic
      diagnostic mode
```

### Sky almenü

Egyedi égbolt renderelési komponensek be-/kikapcsolása:

| Opció | Mit vezérel |
|-------|------------|
| **Space** | A csillagok mögötti háttér textúra |
| **Stars** | Csillagok renderelése |
| **Sun** | A Nap és halóeffektje (nem az istensugarak) |
| **Moon** | A Hold és halóeffektje (nem az istensugarak) |
| **Atmosphere** | A légkör textúra az égen |
| **Far (Clouds)** | Felső/távoli felhők. Ezek nem befolyásolják a fénysugarakat (kevésbé sűrűek) |
| **Near (Clouds)** | Alsó/közelebbi felhők. Sűrűbbek és takarásként működnek a fénysugarakhoz |
| **Physical (Clouds)** | Elavult objektumalapú felhők. A Chernarus-ból és Livonia-ból eltávolítva a DayZ 1.23-ban |
| **Horizon** | Horizont renderelés. A horizont megakadályozza a fénysugarakat |
| **God Rays** | Fénysugár utófeldolgozási effekt |

### Geometry Diagnostic

Hibakereső alakzatrajzolást engedélyez, hogy vizualizáld, hogyan néz ki egy objektum geometriája a játékban.

Geometria típusok: `normal`, `roadway`, `geometry`, `viewGeometry`, `fireGeometry`, `paths`, `memory`, `wreck`

Rajzolási módok: `solid+wire`, `Zsolid+wire`, `wire`, `ZWire`, `geom only`

Ez rendkívül hasznos egyedi modelleket készítő modderek számára -- ellenőrizheted a tűz geometriát, nézet geometriát és memóriapontokat anélkül, hogy kilépnél a játékból.

---

## Game

### Menüstruktúra

```
Game
  > Weather & environment
      Display
      Force fog at camera
      Override fog
        Distance density
        Height density
        Distance offset
        Height bias
  Free Camera
    FrCam Player Move              [Page Up]
    FrCam NoClip
    FrCam Freeze                   [Page Down]
  > Vehicles
      Audio
      Simulation
  > Combat
      DECombat
      DEShots
      DEHitpoints
      DEExplosions
  > Legacy/obsolete
      DEAmbient
      DELight
  DESurfaceSound
  > Central Economy
      > Loot Spawn Edit
          Spawn Volume Vis
          Setup Vis
          Edit Volume
          Re-Trace Group Points
          Spawn Candy
          Spawn Rotation Test
          Placement Test
          Export Group
          Export All Groups
          Export Map
          Export Clusters
          Export Economy [csv]
          Export Respawn Queue [csv]
      > Loot Tool
          Deplete Lifetime
          Set Damage = 1.0
          Damage + Deplete
          Invert Avoidance
          Project Target Loot
      > Infected
          Infected Vis
          Infected Zone Info
          Infected Spawn
          Reset Cleanup
      > Animal
          Animal Vis
          Animal Spawn
          Ambient Spawn
      > Building
          Building Stats
      Vehicle&Wreck Vis
      Loot Vis
      Cluster Vis
      Dynamic Events Status
      Dynamic Events Vis
      Dynamic Events Spawn
      Export Dyn Event
      Overall Stats
      Updaters State
      Idle Mode
      Force Save
```

### Weather & Environment

Hibakereső funkciók az időjárásrendszerhez.

#### Display

Engedélyezi az időjárás hibakereső vizualizációt. Megjelenít egy képernyőn látható köd/látótávolság hibakeresőt, és megnyit egy külön valós idejű ablakot részletes időjárási adatokkal.

A külön ablak szerveren futtatva való engedélyezéséhez használd a `-debugweather` indítási paramétert.

Az ablak beállításai a profilokban tárolódnak: `weather_client_imgui.ini` / `weather_client_imgui.bin` (vagy szervereknél `weather_server_*`).

#### Force Fog at Camera

A köd magasságát a játékos kamera magasságához kényszeríti. Elsőbbséget élvez a Height bias beállítással szemben.

#### Override Fog

Engedélyezi a ködértékek kézi beállításokkal való felülírását:

| Paraméter | Tartomány | Lépés |
|-----------|-----------|-------|
| Distance density | 0 -- 1 | 0.01 |
| Height density | 0 -- 1 | 0.01 |
| Distance offset | 0 -- 1 | 0.01 |
| Height bias | -500 -- 500 | 5 |

### Free Camera

A szabad kamera leválasztja a nézetet a játékos karakteréről, és lehetővé teszi a világ átszelését repüléssel. Ez a modderek egyik leghasznosabb hibakereső eszköze.

#### Szabad kamera vezérlők

| Billentyű | Eredet | Funkció |
|-----------|--------|---------|
| **W / A / S / D** | Inputs (xml) | Előre / balra / hátra / jobbra mozgás |
| **Q** | Inputs (xml) | Felfelé mozgás |
| **Z** | Inputs (xml) | Lefelé mozgás |
| **Egér** | Inputs (xml) | Körülnézés |
| **Egérgörgő fel** | Inputs (C++) | Sebesség növelése |
| **Egérgörgő le** | Inputs (C++) | Sebesség csökkentése |
| **Szóköz** | Cheat Inputs (C++) | Célzott objektum képernyőn megjelenő hibakeresésének be-/kikapcsolása |
| **Ctrl / Shift** | Cheat Inputs (C++) | Aktuális sebesség x 10 |
| **Alt** | Cheat Inputs (C++) | Aktuális sebesség / 10 |
| **End** | Cheat Inputs (C++) | Szabad kamera kikapcsolása (visszatérés a játékoshoz) |
| **Enter** | Cheat Inputs (C++) | Kamera összekapcsolása a célzott objektummal |
| **Page Up** | Cheat Inputs (C++) | Játékos mozgásának be-/kikapcsolása szabad kamerában |
| **Page Down** | Cheat Inputs (C++) | Kamera pozíciójának befagyasztása/feloldása |
| **Insert** | PluginKeyBinding (Script) | Játékos teleportálása a kurzor pozíciójára |
| **Home** | PluginKeyBinding (Script) | Szabad kamera be-/kikapcsolása / kikapcsolás és teleportálás a kurzorhoz |
| **Numpad /** | PluginKeyBinding (Script) | Szabad kamera be-/kikapcsolása (teleport nélkül) |

#### Szabad kamera opciók

| Opció | Leírás |
|-------|--------|
| **FrCam Player Move** | A játékos bemenetek (WASD) mozgatják-e a játékost szabad kamerában |
| **FrCam NoClip** | A kamera áthaladhat-e a terepen |
| **FrCam Freeze** | A bemenetek mozgatják-e a kamerát |

### Vehicles

Kibővített hibakereső funkciók járművekhez. Ezek csak akkor működnek, ha a játékos járműben van.

- **Audio** -- Külön ablakot nyit hangbeállítások valós idejű módosításához. Audio vezérlők vizualizációját tartalmazza.
- **Simulation** -- Külön ablakot nyit autó szimulációs hibakereséssel: fizikai paraméterek módosítása és vizualizáció.

### Combat

Hibakereső eszközök harchoz, lövészethez és találati pontokhoz:

| Opció | Leírás |
|-------|--------|
| **DECombat** | Képernyőn megjelenő szöveget mutat autók, AI és játékosok távolságával |
| **DEShots** | Lövedék hibakereső almenü (lásd alább) |
| **DEHitpoints** | A játékos és a nézett objektum DamageSystem-jét jeleníti meg |
| **DEExplosions** | Robbanás behatolási adatokat mutat. A számok a lassulási értékeket jelölik. Piros kereszt = megállítva. Zöld kereszt = áthatolt |

**DEShots almenü:**

| Opció | Leírás |
|-------|--------|
| Clear vis. | Meglévő lövés vizualizáció törlése |
| Vis. trajectory | Lövés útvonalának nyomkövetése, kilépési és megállási pont megjelenítése |
| Always Deflect | Kényszeríti az összes kliens által leadott lövés elpattanását |

### Legacy/Obsolete

- **DEAmbient** -- A környezeti hangokat befolyásoló változókat jeleníti meg
- **DELight** -- Az aktuális világítási környezet statisztikáit jeleníti meg

### DESurfaceSound

A játékos alatt lévő felülettípust és a csillapítás típusát jeleníti meg.

### Central Economy

Átfogó hibakereső eszközkészlet a Central Economy (CE) rendszerhez.

> **Fontos:** A legtöbb CE hibakereső opció csak egyjátékos kliensben működik engedélyezett CE-vel. Csak a "Building Stats" működik többjátékos környezetben vagy kikapcsolt CE esetén.

> **Megjegyzés:** Ezek közül sok funkció szkripten keresztül is elérhető a `CEApi`-n át (`CentralEconomy.c`).

#### Loot Spawn Edit

Eszközök loot spawn pontok létrehozásához és szerkesztéséhez objektumokon. Az Edit Volume eszköz használatához a szabad kamerát engedélyezni kell.

| Opció | Leírás | Szkript megfelelő |
|-------|--------|-------------------|
| **Spawn Volume Vis** | Loot spawn pontok vizualizálása. Opciók: Off, Adaptive, Volume, Occupied | `GetCEApi().LootSetSpawnVolumeVisualisation()` |
| **Setup Vis** | CE beállítási tulajdonságok megjelenítése a képernyőn színkódolt konténerekkel | `GetCEApi().LootToggleSpawnSetup()` |
| **Edit Volume** | Interaktív loot pont szerkesztő (szabad kamera szükséges) | `GetCEApi().LootToggleVolumeEditing()` |
| **Re-Trace Group Points** | Loot pontok újrakövetése a lebegési problémák javítására | `GetCEApi().LootRetraceGroupPoints()` |
| **Spawn Candy** | Loot spawnolása a kiválasztott csoport összes spawn pontján | -- |
| **Spawn Rotation Test** | Forgatási jelzők tesztelése a kurzor pozíciójánál | -- |
| **Placement Test** | Elhelyezés vizualizálása gömb hengerrel | -- |
| **Export Group** | Kiválasztott csoport exportálása a `storage/export/mapGroup_CLASSNAME.xml` fájlba | `GetCEApi().LootExportGroup()` |
| **Export All Groups** | Összes csoport exportálása a `storage/export/mapgroupproto.xml` fájlba | `GetCEApi().LootExportAllGroups()` |
| **Export Map** | `storage/export/mapgrouppos.xml` generálása | `GetCEApi().LootExportMap()` |
| **Export Clusters** | `storage/export/mapgroupcluster.xml` generálása | `GetCEApi().ExportClusterData()` |
| **Export Economy [csv]** | Gazdaság exportálása a `storage/log/economy.csv` fájlba | `GetCEApi().EconomyLog(EconomyLogCategories.Economy)` |
| **Export Respawn Queue [csv]** | Újraspawn sor exportálása a `storage/log/respawn_queue.csv` fájlba | `GetCEApi().EconomyLog(EconomyLogCategories.RespawnQueue)` |

**Edit Volume billentyűkiosztás:**

| Billentyű | Funkció |
|-----------|---------|
| **[** | Visszafelé léptetés a konténerek között |
| **]** | Előre léptetés a konténerek között |
| **LMB** | Új pont beszúrása |
| **RMB** | Pont törlése |
| **;** | Pont méretének növelése |
| **'** | Pont méretének csökkentése |
| **Insert** | Loot spawnolása a pontnál |
| **M** | 48 db "AmmoBox_762x54_20Rnd" spawnolása |
| **Backspace** | Közeli loot megjelölése takarításra (élettartam lejártatása, nem azonnali) |

#### Loot Tool

| Opció | Leírás | Szkript megfelelő |
|-------|--------|-------------------|
| **Deplete Lifetime** | Élettartam 3 másodpercre csökkentése (takarításra ütemezve) | `GetCEApi().LootDepleteLifetime()` |
| **Set Damage = 1.0** | Életerő 0-ra állítása | `GetCEApi().LootSetDamageToOne()` |
| **Damage + Deplete** | A fenti kettő végrehajtása | `GetCEApi().LootDepleteAndDamage()` |
| **Invert Avoidance** | Játékos elkerülés (közeli játékosok érzékelése) be-/kikapcsolása | -- |
| **Project Target Loot** | Célzott tárgy spawnolásának emulálása, képek és naplók generálása. A "Loot Vis" engedélyezése szükséges | `GetCEApi().SpawnAnalyze()` és `GetCEApi().EconomyMap()` |

#### Infected

| Opció | Leírás | Szkript megfelelő |
|-------|--------|-------------------|
| **Infected Vis** | Zombi zónák, helyszínek, élő/halott állapot vizualizálása | `GetCEApi().InfectedToggleVisualisation()` |
| **Infected Zone Info** | Képernyőn megjelenő hibakeresés, amikor a kamera egy fertőzött zónában van | `GetCEApi().InfectedToggleZoneInfo()` |
| **Infected Spawn** | Fertőzött spawnolása a kiválasztott zónában (vagy "InfectedArmy" a kurzornál) | `GetCEApi().InfectedSpawn()` |
| **Reset Cleanup** | Takarítási időzítő 3 másodpercre állítása | `GetCEApi().InfectedResetCleanup()` |

#### Animal

| Opció | Leírás | Szkript megfelelő |
|-------|--------|-------------------|
| **Animal Vis** | Állat zónák, helyszínek, élő/halott állapot vizualizálása | `GetCEApi().AnimalToggleVisualisation()` |
| **Animal Spawn** | Állat spawnolása a kiválasztott zónában (vagy "AnimalGoat" a kurzornál) | `GetCEApi().AnimalSpawn()` |
| **Ambient Spawn** | "AmbientHen" spawnolása a kurzor célpontjánál | `GetCEApi().AnimalAmbientSpawn()` |

#### Building

A **Building Stats** képernyőn megjelenő hibakeresést mutat az épületek ajtóállapotairól:

- Bal oldal: minden ajtó nyitott/zárt és szabad/zárolt állapota
- Közép: statisztikák a `buildings.bin`-ről (épület perzisztencia)

Az ajtó véletlenszerűsítés az `initOpened` config értéket használja. Ha `rand < initOpened`, az ajtó nyitottan spawnol (tehát `initOpened=0` azt jelenti, hogy az ajtók soha nem spawnolnak nyitottan).

Gyakori `<building/>` beállítások az economy.xml-ben:

| Beállítás | Viselkedés |
|-----------|-----------|
| `init="0" load="0" respawn="0" save="0"` | Nincs perzisztencia, nincs véletlenszerűsítés, alapértelmezett állapot újraindítás után |
| `init="1" load="0" respawn="0" save="0"` | Nincs perzisztencia, ajtók véletlenszerűsítve az initOpened által |
| `init="1" load="1" respawn="0" save="1"` | Csak a zárolt ajtókat menti, ajtók véletlenszerűsítve az initOpened által |
| `init="0" load="1" respawn="0" save="1"` | Teljes perzisztencia, pontos ajtóállapot mentése, nincs véletlenszerűsítés |

#### Egyéb Central Economy eszközök

| Opció | Leírás | Szkript megfelelő |
|-------|--------|-------------------|
| **Vehicle&Wreck Vis** | "Vehicle" elkerülésre regisztrált objektumok vizualizálása. Sárga = Autó, Rózsaszín = Roncsok (Building), Kék = InventoryItem | `GetCEApi().ToggleVehicleAndWreckVisualisation()` |
| **Loot Vis** | Képernyőn megjelenő gazdasági adatok bármihez, amit nézel (loot, fertőzött, dinamikus események) | `GetCEApi().ToggleLootVisualisation()` |
| **Cluster Vis** | Képernyőn megjelenő trajektória DE statisztikák | `GetCEApi().ToggleClusterVisualisation()` |
| **Dynamic Events Status** | Képernyőn megjelenő DE statisztikák | `GetCEApi().ToggleDynamicEventStatus()` |
| **Dynamic Events Vis** | DE spawn pontok vizualizálása és szerkesztése | `GetCEApi().ToggleDynamicEventVisualisation()` |
| **Dynamic Events Spawn** | Dinamikus esemény spawnolása a legközelebbi pontnál vagy "StaticChristmasTree" tartalékként | `GetCEApi().DynamicEventSpawn()` |
| **Export Dyn Event** | DE pontok exportálása a `storage/export/eventSpawn_CLASSNAME.xml` fájlba | `GetCEApi().DynamicEventExport()` |
| **Overall Stats** | Képernyőn megjelenő CE statisztikák | `GetCEApi().ToggleOverallStats()` |
| **Updaters State** | Megmutatja, mit dolgoz fel jelenleg a CE | -- |
| **Idle Mode** | CE alvásra küldése (feldolgozás leállítása) | -- |
| **Force Save** | A teljes `storage/data` mappa kényszerített mentése (a játékos adatbázist nem tartalmazza) | -- |

**Dynamic Events Vis billentyűkiosztás:**

| Billentyű | Funkció |
|-----------|---------|
| **[** | Visszafelé léptetés az elérhető DE-k között |
| **]** | Előre léptetés az elérhető DE-k között |
| **LMB** | Új pont beszúrása a kiválasztott DE-hez |
| **RMB** | A kurzorhoz legközelebbi pont törlése |
| **MMB** | Tartva vagy kattintva szög forgatása |

---

## AI

### Menüstruktúra

```
AI
  Show NavMesh
  Debug Pathgraph World
  Debug Path Agent
  Debug AI Agent
```

> **Fontos:** Az AI hibakeresés jelenleg nem működik többjátékos környezetben.

### Show NavMesh

Hibakereső alakzatokat rajzol a navigációs háló vizualizálásához. Képernyőn megjelenő hibakeresőt mutat statisztikákkal.

| Billentyű | Funkció |
|-----------|---------|
| **Numpad 0** | "Teszt kezdete" regisztrálása a kamera pozíciójánál |
| **Numpad 1** | Csempe újragenerálása a kamera pozíciójánál |
| **Numpad 2** | Csempék újragenerálása a kamera pozíciója körül |
| **Numpad 3** | Előre léptetés a vizualizációs típusok között |
| **LAlt + Numpad 3** | Visszafelé léptetés a vizualizációs típusok között |
| **Numpad 4** | "Teszt vége" regisztrálása a kamera pozíciójánál. Gömböket és vonalat rajzol a kezdő és végpont között. Zöld = útvonal találva, Piros = nincs útvonal |
| **Numpad 5** | NavMesh legközelebbi pozíció teszt (SamplePosition). Kék gömb = lekérdezés, rózsaszín gömb = eredmény |
| **Numpad 6** | NavMesh raycast teszt. Kék gömb = lekérdezés, rózsaszín gömb = eredmény |

### Debug Pathgraph World

Képernyőn megjelenő hibakeresés, amely megmutatja, hány útvonalkérés fejeződött be és hány van folyamatban.

### Debug Path Agent

Képernyőn megjelenő hibakeresés és hibakereső alakzatok egy AI útvonalkereséshez. Célozz meg egy AI entitást a nyomkövetéshez való kiválasztásához. Használd ezt, amikor kifejezetten az érdekel, hogyan találja meg az útvonalát egy AI.

### Debug AI Agent

Képernyőn megjelenő hibakeresés és hibakereső alakzatok egy AI éberségi szintjéhez és viselkedéséhez. Célozz meg egy AI entitást a nyomkövetéshez való kiválasztásához. Használd ezt, amikor az AI döntéshozatalát és tudatossági állapotát akarod megérteni.

---

## Sounds

### Menüstruktúra

```
Sounds
  Show playing samples
  Show system info
```

### Show Playing Samples

Hibakereső vizualizáció a jelenleg lejátszott hangokhoz.

| Opció | Leírás |
|-------|--------|
| **none** | Alapértelmezett, nincs hibakeresés |
| **ImGui** | Külön ablak (legújabb iteráció). Szűrést és teljes kategória lefedettséget támogat. Beállítások mentése: `playing_sounds_imgui.ini` / `.bin` a profilokban |
| **DbgUI** | Régi. Kategóriaszűréssel rendelkezik, olvashatóbb, de kimegy a képernyőről és hiányzik a jármű kategória |
| **Engine** | Régi. Valós idejű színkódolt adatokat mutat statisztikákkal, de kimegy a képernyőről és nincs szín jelmagyarázat |

### Show System Info

A hangrendszer képernyőn megjelenő hibakereső statisztikái (pufferszámok, aktív források stb.).

---

## Hasznos funkciók modderek számára

Bár minden opciónak megvan a haszna, ezeket használják a modderek leggyakrabban:

### Teljesítményelemzés

1. **FPS-számláló** (LCtrl + Numpad 1) -- Gyors ellenőrzés, hogy a modod nem rontja-e tönkre a képkockasebességet
2. **Script Profiler** -- Keresd meg, mely osztályaid vagy függvényeid fogyasztják a legtöbb CPU-időt. Állítsd a modult WORLD-re vagy MISSION-re, hogy a modod szkript rétegére fókuszálj

### Vizuális hibakeresés

1. **Szabad kamera** -- Repülj körbe a spawnolt objektumok vizsgálatához, pozíciók ellenőrzéséhez, AI viselkedés távolról való megfigyeléséhez
2. **Geometry Diagnostic** -- Ellenőrizd az egyedi modelled tűz geometriáját, nézet geometriáját, roadway LOD-ját és memóriapontjait anélkül, hogy kilépnél a játékból
3. **Render Debug Mode** (RCtrl + RAlt + W) -- Drótváz átfedések megtekintése a háló sűrűség és anyag hozzárendelések ellenőrzéséhez

### Játékmenet tesztelés

1. **Szabad kamera + Insert** -- Teleportáld a játékosodat bárhová a térképen azonnal
2. **Időjárás felülírás** -- Kényszeríts ki konkrét ködkörülményeket a láthatóságfüggő funkciók teszteléséhez
3. **Central Economy eszközök** -- Fertőzöttek, állatok, loot és dinamikus események spawnolása igény szerint
4. **Harc hibakeresés** -- Lövés trajektóriák nyomkövetése, találati pont sérülési rendszerek vizsgálata, robbanás behatolás tesztelése

### AI fejlesztés

1. **Show NavMesh** -- Ellenőrizd, hogy az AI tényleg el tud-e navigálni oda, ahova várod
2. **Debug AI Agent** -- Lásd, mit gondol egy fertőzött vagy állat, milyen riasztási szinten van
3. **Debug Path Agent** -- Lásd az AI tényleges útvonalát és azt, hogy az útvonalkeresés sikeres-e

---

## Mikor használd a Diag Menüt

### Fejlesztés közben

- **Script Profiler** képkockánkénti kód optimalizálásakor (OnUpdate, EOnFrame)
- **Szabad kamera** objektumok pozicionálásához, spawn helyek ellenőrzéséhez, modell elhelyezés vizsgálatához
- **Geometry Diagnostic** közvetlenül egy új modell importálása után a LOD-ok és geometria típusok ellenőrzéséhez
- **FPS-számláló** alapértékként új funkciók hozzáadása előtt és után

### Tesztelés közben

- **Harc hibakeresés** fegyversérülés, lövedékviselkedés, robbanási effektek ellenőrzéséhez
- **CE eszközök** loot elosztás, spawn pontok, dinamikus események teszteléséhez
- **AI hibakeresés** a fertőzött/állat viselkedés játékos jelenlétére adott helyes válaszának ellenőrzéséhez
- **Időjárás hibakeresés** a mod különböző időjárási körülmények közötti teszteléséhez

### Hibajelentés vizsgálatakor

- **FPS-számláló + Script Profiler** amikor játékosok teljesítményproblémákat jelentenek
- **Szabad kamera + Szóköz** (objektum hibakeresés) a nem megfelelően viselkedő objektumok vizsgálatához
- **Render Debug Mode** vizuális hibák vagy anyagproblémák diagnosztizálásához
- **Show Bullet** fizikai ütközési problémák hibakereséséhez

---

## Gyakori hibák

**Kereskedelmi futtatható állomány használata.** A Diag Menu csak a `DayZDiag_x64.exe`-ben érhető el. Ha megnyomod a Win+Alt-ot és semmi nem történik, a kereskedelmi buildet futtatod.

**Elfelejteni, hogy a Max. Collider Distance 0.** A fizikai vizualizáció (Draw Bullet shape) semmit nem mutat, ha a Max. Collider Distance még az alapértelmezett 0-n van. Állítsd legalább 10-20-ra, hogy lásd a körülötted lévő ütközőket.

**CE eszközök többjátékos módban.** A legtöbb Central Economy hibakereső opció csak egyjátékos módban működik engedélyezett CE-vel. Ne várd, hogy dedikált szerveren működjenek.

**AI hibakeresés többjátékos módban.** Az AI hibakeresés jelenleg nem működik többjátékos környezetben. Teszteld az AI viselkedést egyjátékos módban.

**A "Bullet" összekeverése a lőszerrel.** Az "Enfusion World" kategória "Bullet" opciói a Bullet fizikai motorra vonatkoznak, nem a fegyver lőszerre. A harchoz kapcsolódó hibakeresés a Game > Combat alatt található.

**Profilozó bekapcsolva hagyása.** A Script Profiler mérhető terhelést jelent. Kapcsold ki, ha befejezted a profilozást, hogy pontos FPS-értékeket kapj.

**Nagy ütköző távolsági értékek.** A Max. Collider Distance 200-ra vagy 500-ra állítása drasztikusan csökkenti a képkockasebességet. Használd a legkisebb értéket, amely lefedi az érdeklődési területedet.

**Előfeltételek engedélyezésének elmulasztása.** Több opció is függ mások engedélyezésétől:
- A "Draw Char Ctrl" és "Draw Bullet wireframe" a "Draw Bullet shape"-től függ
- Az "Edit Volume" szabad kamerát igényel
- A "Project Target Loot" megköveteli a "Loot Vis" engedélyezését

---

## Következő lépések

- **8.6. fejezet: [Hibakeresés és tesztelés](06-debugging-testing.md)** -- Szkript naplók, Print hibakeresés, fájl foltozás és Workbench
- **8.7. fejezet: [Publikálás a Workshopra](07-publishing-workshop.md)** -- A tesztelt mod csomagolása és publikálása
