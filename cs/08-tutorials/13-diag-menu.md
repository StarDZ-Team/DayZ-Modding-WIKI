# Kapitola 8.13: Diagnostické menu (Diag Menu)

[Domů](../README.md) | [<< Předchozí: Vytváření obchodního systému](12-trading-system.md) | **Diagnostické menu**

---

> **Shrnutí:** Diag Menu je vestavěný diagnostický nástroj DayZ, dostupný pouze prostřednictvím spustitelného souboru DayZDiag. Poskytuje počítadla FPS, profilování skriptů, ladění rendereru, volnou kameru, vizualizaci fyziky, ovládání počasí, nástroje Central Economy, ladění navigace AI a diagnostiku zvuků. Tato kapitola dokumentuje každou kategorii menu, volbu a klávesovou zkratku na základě oficiální dokumentace Bohemia Interactive.

---

## Obsah

- [Co je Diag Menu?](#what-is-the-diag-menu)
- [Jak získat přístup](#how-to-access)
- [Ovládání navigace](#navigation-controls)
- [Rychlé klávesové zkratky](#quick-access-keyboard-shortcuts)
- [Přehled kategorií menu](#menu-categories-overview)
- [Statistiky](#statistics)
- [Enfusion Renderer](#enfusion-renderer)
- [Enfusion World (Fyzika)](#enfusion-world-physics)
- [DayZ Render](#dayz-render)
- [Game](#game)
- [AI](#ai)
- [Zvuky](#sounds)
- [Užitečné funkce pro moddery](#useful-features-for-modders)
- [Kdy používat Diag Menu](#when-to-use-the-diag-menu)
- [Časté chyby](#common-mistakes)
- [Další kroky](#next-steps)

---

## Co je Diag Menu?

Diag Menu je hierarchické ladící menu zabudované v diagnostickém spustitelném souboru DayZ. Obsahuje volby používané k ladění herních skriptů a assetů v sedmi hlavních kategoriích: Statistics, Enfusion Renderer, Enfusion World, DayZ Render, Game, AI a Sounds.

Diag Menu **není dostupné** v retailové verzi DayZ (`DayZ_x64.exe`). Musíte použít `DayZDiag_x64.exe` -- diagnostický build, který je dodáván společně s retailovou verzí v instalační složce DayZ nebo ve složkách DayZ Serveru.

---

## Jak získat přístup

### Požadavky

- **DayZDiag_x64.exe** -- Diagnostický spustitelný soubor. Nachází se ve vaší instalační složce DayZ vedle běžného `DayZ_x64.exe`.
- Musíte běžet ve hře (ne na načítací obrazovce). Menu je dostupné v jakémkoli 3D zobrazení.

### Otevření menu

Stiskněte **Win + Alt** pro otevření Diag Menu.

Alternativní zkratka je **Ctrl + Win**, ale ta koliduje se systémovou zkratkou Windows 11 a na této platformě se nedoporučuje.

### Povolení kurzoru myši

Některé volby Diag Menu vyžadují interakci s obrazovkou pomocí myši. Kurzor myši lze přepínat stisknutím:

**LCtrl + Numpad 9**

Tato klávesová zkratka je registrována prostřednictvím skriptu (`PluginKeyBinding`).

---

## Ovládání navigace

Jakmile je Diag Menu otevřeno:

| Klávesa | Akce |
|-----|--------|
| **Šipka nahoru/dolů** | Navigace mezi položkami menu |
| **Šipka doprava** | Vstup do podmenu nebo cyklování mezi hodnotami voleb |
| **Šipka doleva** | Cyklování hodnot voleb v opačném směru |
| **Backspace** | Opuštění aktuálního podmenu (návrat o jednu úroveň) |

Když volby zobrazují více hodnot, jsou uvedeny v pořadí, v jakém se objevují v menu. První volba je typicky výchozí.

---

## Rychlé klávesové zkratky

Tyto zkratky fungují kdykoli během běhu DayZDiag, bez nutnosti otevírat menu:

| Zkratka | Funkce |
|----------|----------|
| **LCtrl + Numpad 1** | Přepnutí počítadla FPS |
| **LCtrl + Numpad 9** | Přepnutí kurzoru myši na obrazovce |
| **RCtrl + RAlt + W** | Cyklování režimu ladění renderování |
| **LCtrl + LAlt + P** | Přepnutí postprocess efektů |
| **LAlt + Numpad 6** | Přepnutí vizualizace fyzikálních těles |
| **Page Up** | Volná kamera: přepnutí pohybu hráče |
| **Page Down** | Volná kamera: zmrazení/rozmrazení kamery |
| **Insert** | Teleportace hráče na pozici kurzoru (ve volné kameře) |
| **Home** | Přepnutí volné kamery / vypnutí a teleportace hráče na kurzor |
| **Numpad /** | Přepnutí volné kamery (bez teleportace) |
| **End** | Vypnutí volné kamery (návrat ke kameře hráče) |

> **Poznámka:** Jakákoli zmínka o "Cheat Inputs" v oficiální dokumentaci odkazuje na vstupy pevně zakódované na straně C++, nepřístupné prostřednictvím skriptu.

---

## Přehled kategorií menu

Diag Menu obsahuje sedm hlavních kategorií:

1. **Statistics** -- Počítadlo FPS a profilování skriptů
2. **Enfusion Renderer** -- Osvětlení, stíny, materiály, okluze, postprocess, terén, widgety
3. **Enfusion World** -- Vizualizace a ladění fyzikálního enginu (Bullet)
4. **DayZ Render** -- Renderování oblohy, diagnostika geometrie
5. **Game** -- Počasí, volná kamera, vozidla, boj, Central Economy, povrchové zvuky
6. **AI** -- Navigační mesh, hledání cest, chování AI agentů
7. **Sounds** -- Ladění přehrávaných vzorků, informace o zvukovém systému

---

## Statistiky

### Struktura menu

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

Povolí počítadlo FPS v levém horním rohu obrazovky.

Hodnota FPS se počítá z času mezi posledními 10 snímky, takže odráží krátký klouzavý průměr spíše než okamžité čtení.

### Script Profiler UI

Zapne skriptový profiler zobrazovaný na obrazovce, který ukazuje výkonnostní data skriptů v reálném čase.

Profiler zobrazuje šest datových sekcí:

| Sekce | Co zobrazuje |
|---------|---------------|
| **Time per class** | Celkový čas všech volání funkcí patřících třídě (top 20) |
| **Time per function** | Celkový čas všech volání konkrétní funkce (top 20) |
| **Class allocations** | Počet alokací třídy (top 20) |
| **Count per function** | Počet volání funkce (top 20) |
| **Class count** | Počet živých instancí třídy (top 40) |
| **Stats and settings** | Aktuální konfigurace profileru a počítadla snímků |

Panel Stats and settings zobrazuje:

| Pole | Význam |
|-------|---------|
| UI enabled (DIAG) | Zda je UI skriptového profileru aktivní |
| Profiling enabled (SCRP) | Zda profilování běží i když UI není aktivní |
| Profiling enabled (SCRC) | Zda profilování skutečně probíhá |
| Flags | Aktuální příznaky sběru dat |
| Module | Aktuálně profilovaný modul |
| Interval | Aktuální interval aktualizace |
| Time Resolution | Aktuální časové rozlišení |
| Average | Zda zobrazované hodnoty jsou průměry |
| Game Frame | Celkový počet proběhlých snímků |
| Session Frame | Celkový počet snímků v této profilovací relaci |
| Total Frames | Celkový počet snímků ve všech profilovacích relacích |
| Profiled Sess Frms | Profilované snímky v této relaci |
| Profiled Frames | Profilované snímky ve všech relacích |

> **Důležité:** Skriptový profiler profiluje pouze skriptový kód. Proto (engine-bound) metody nejsou měřeny jako samostatné záznamy, ale jejich doba provádění je zahrnuta v celkovém čase skriptové metody, která je volá.

> **Důležité:** API EnProfiler a samotný skriptový profiler jsou dostupné pouze na diagnostickém spustitelném souboru.

### Nastavení skriptového profileru

Tato nastavení řídí, jak jsou sbírána profilová data. Lze je také upravovat programově prostřednictvím API `EnProfiler` (dokumentováno v `EnProfiler.c`).

#### Always Enabled

Sběr profilových dat není ve výchozím nastavení povolen. Tento přepínač ukazuje, zda je aktuálně aktivní.

Pro povolení profilování při startu použijte spouštěcí parametr `-profile`.

UI skriptového profileru toto nastavení ignoruje -- vždy vynucuje profilování, když je UI viditelné. Když je UI vypnuto, profilování se opět zastaví (pokud není "Always enabled" nastaveno na true).

#### Příznaky (Flags)

Řídí způsob sběru dat. K dispozici jsou čtyři kombinace:

| Kombinace příznaků | Rozsah | Životnost dat |
|-----------------|-------|---------------|
| `SPF_RESET \| SPF_RECURSIVE` | Vybraný modul + potomci | Jeden snímek (reset každý snímek) |
| `SPF_RECURSIVE` | Vybraný modul + potomci | Kumulováno napříč snímky |
| `SPF_RESET` | Pouze vybraný modul | Jeden snímek (reset každý snímek) |
| `SPF_NONE` | Pouze vybraný modul | Kumulováno napříč snímky |

- **SPF_RECURSIVE**: Povoluje profilování potomkovských modulů (rekurzivně)
- **SPF_RESET**: Vymaže data na konci každého snímku

#### Module

Vybírá, který skriptový modul profilovat:

| Volba | Skriptová vrstva |
|--------|-------------|
| CORE | 1_Core |
| GAMELIB | 2_GameLib |
| GAME | 3_Game |
| WORLD | 4_World |
| MISSION | 5_Mission |
| MISSION_CUSTOM | init.c |

#### Update Interval

Počet snímků, které je třeba počkat před aktualizací zobrazení seřazených dat. Také zpožďuje reset způsobený `SPF_RESET`.

Dostupné hodnoty: 0, 5, 10, 20, 30, 50, 60, 120, 144

#### Average

Povolení nebo zakázání zobrazování průměrných hodnot.

- S `SPF_RESET` a bez intervalu: hodnoty jsou surové hodnoty za snímek
- Bez `SPF_RESET`: dělí kumulovanou hodnotu počtem snímků relace
- S nastaveným intervalem: dělí intervalem

Počet tříd se nikdy neprůměruje -- vždy ukazuje aktuální počet instancí. Alokace zobrazí průměrný počet vytvoření instance.

#### Time Resolution

Nastavuje časovou jednotku pro zobrazení. Hodnota představuje jmenovatel (n-tina sekundy):

| Hodnota | Jednotka |
|-------|------|
| 1 | Sekundy |
| 1000 | Milisekundy |
| 1000000 | Mikrosekundy |

Dostupné hodnoty: 1, 10, 100, 1000, 10000, 100000, 1000000

#### (UI) Scale

Upravuje vizuální měřítko zobrazení profileru na obrazovce pro různé velikosti obrazovek a rozlišení.

Rozsah: 0.5 až 1.5 (výchozí: 1.0, krok: 0.05)

---

## Enfusion Renderer

### Struktura menu

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

Přepíná skutečné zdroje světla (jako `PersonalLight` nebo herní předměty jako baterky). Neovlivňuje osvětlení prostředí -- k tomu použijte podmenu Lighting.

### Podmenu Lighting

Každý přepínač ovládá specifickou složku osvětlení:

| Volba | Efekt při vypnutí |
|--------|---------------------|
| **Ambient lighting** | Odstraní obecné ambientní světlo ve scéně |
| **Ground lighting** | Odstraní světlo odražené od země (viditelné na střechách, pod pažemi postavy) |
| **Directional lighting** | Odstraní hlavní směrové (slunce/měsíc) světlo. Také zakáže obousměrné osvětlení |
| **Bidirectional lighting** | Odstraní komponentu obousměrného osvětlení |
| **Specular lighting** | Odstraní spekulární odlesky (viditelné na lesklých površích jako skříňky, auta) |
| **Reflection** | Odstraní reflexní osvětlení (viditelné na kovových/lesklých površích) |
| **Emission lighting** | Odstraní emisi (samo-podsvícení) z materiálů |

Tyto přepínače jsou užitečné pro izolaci konkrétních příspěvků osvětlení při ladění vizuálních problémů ve vlastních modelech nebo scénách.

### Shadows

Povoluje nebo zakazuje renderování stínů. Vypnutí také odstraní culling deště uvnitř objektů (déšť bude propadat střechami).

### Terrain Shadows

Řídí způsob generování stínů terénu.

Volby: `on (slice)`, `on (full)`, `no update`, `disabled`

### Render Debug Mode

Přepíná mezi režimy vizualizace renderování pro kontrolu geometrie meshe přímo ve hře.

Volby: `normal`, `wire`, `wire only`, `overdraw`, `overdrawZ`

Různé materiály se zobrazují v různých barvách drátového modelu:

| Materiál | Barva (RGB) |
|----------|-------------|
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

Sada přepínačů pro systém okluzního cullingu:

| Volba | Efekt |
|--------|--------|
| **Occluders** | Povolení/zakázání okluze objektů |
| **Occlude entities** | Povolení/zakázání okluze entit |
| **Occlude proxies** | Povolení/zakázání okluze proxy objektů |
| **Show occluder volumes** | Pořídí snímek a vykreslí ladicí tvary vizualizující okluzní objemy |
| **Show active occluders** | Zobrazí aktuálně aktivní okluzory s ladicími tvary |
| **Show occluded** | Vizualizuje okluzované objekty ladicími tvary |

### Widgets

Povolení nebo zakázání renderování všech UI widgetů. Užitečné pro pořizování čistých screenshotů nebo izolaci renderovacích problémů.

### Postprocess

Povolení nebo zakázání post-processing efektů (bloom, korekce barev, viněta atd.).

### Terrain

Povolení nebo zakázání renderování terénu.

### Podmenu Materials

Přepínání renderování specifických typů materiálů. Většina je samovysvětlující. Pozoruhodné položky:

- **Super** -- Zastřešující přepínač pokrývající každý materiál související se "super" shaderem
- **Old Terrain** -- Pokrývá jak Terrain, tak Terrain Simple materiály
- **Water** -- Pokrývá každý materiál související s vodou (oceán, břehy, řeky)

---

## Enfusion World (Fyzika)

### Struktura menu

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

> **Poznámka:** "Bullet" zde odkazuje na fyzikální engine Bullet, ne na munici.

### Show Bullet

Zapne ladicí vizualizaci fyzikálního enginu Bullet.

### Podmenu Bullet

| Volba | Popis |
|--------|-------------|
| **Draw Char Ctrl** | Vizualizace kontroleru hráčské postavy. Závisí na "Draw Bullet shape" |
| **Draw Simple Char Ctrl** | Vizualizace kontroleru AI postavy. Závisí na "Draw Bullet shape" |
| **Max. Collider Distance** | Maximální vzdálenost od hráče pro vizualizaci kolizních objektů (hodnoty: 0, 1, 2, 5, 10, 20, 50, 100, 200, 500). Výchozí je 0 |
| **Draw Bullet shape** | Vizualizace tvarů fyzikálních kolizních objektů |
| **Draw Bullet wireframe** | Zobrazení kolizních objektů pouze drátovým modelem. Závisí na "Draw Bullet shape" |
| **Draw Bullet shape AABB** | Zobrazení osově zarovnaných ohraničujících boxů kolizních objektů |
| **Draw obj center of mass** | Zobrazení těžišť objektů |
| **Draw Bullet contacts** | Vizualizace kolizních objektů v kontaktu |
| **Force sleep Bullet** | Vynucení spánku všech fyzikálních těles |
| **Show stats** | Zobrazení ladicích statistik (volby: disabled, basic, all). Statistiky zůstávají viditelné 10 sekund po zakázání |

> **Varování:** Max. Collider Distance je ve výchozím nastavení 0, protože tato vizualizace je náročná. Nastavení na velkou vzdálenost způsobí výrazné snížení výkonu.

### Show Bodies

Vizualizace fyzikálních těles Bullet. Volby: `disabled`, `only`, `all`

---

## DayZ Render

### Struktura menu

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

### Podmenu Sky

Přepínání jednotlivých složek renderování oblohy:

| Volba | Co ovládá |
|--------|-----------------|
| **Space** | Textura pozadí za hvězdami |
| **Stars** | Renderování hvězd |
| **Sun** | Slunce a jeho halo efekt (ne god rays) |
| **Moon** | Měsíc a jeho halo efekt (ne god rays) |
| **Atmosphere** | Textura atmosféry na obloze |
| **Far (Clouds)** | Horní/vzdálené mraky. Neovlivňují paprsky světla (méně husté) |
| **Near (Clouds)** | Nižší/bližší mraky. Hustší a slouží jako okluze pro paprsky světla |
| **Physical (Clouds)** | Zastaralé objektové mraky. Odstraněny z Chernarus a Livonia v DayZ 1.23 |
| **Horizon** | Renderování horizontu. Horizont bude bránit paprskům světla |
| **God Rays** | Post-process efekt světelných paprsků |

### Diagnostika geometrie

Povoluje kreslení ladicích tvarů pro vizualizaci, jak vypadá geometrie objektu přímo ve hře.

Typy geometrie: `normal`, `roadway`, `geometry`, `viewGeometry`, `fireGeometry`, `paths`, `memory`, `wreck`

Režimy kreslení: `solid+wire`, `Zsolid+wire`, `wire`, `ZWire`, `geom only`

Toto je extrémně užitečné pro moddery vytvářející vlastní modely -- můžete ověřit, že vaše fire geometry, view geometry a memory pointy jsou správně nakonfigurovány bez opuštění hry.

---

## Game

### Struktura menu

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

Ladicí funkcionalita pro systém počasí.

#### Display

Povoluje ladicí vizualizaci počasí. Zobrazuje na obrazovce ladicí informace o mlze/dohlednosti a otevírá samostatné okno s detailními daty počasí v reálném čase.

Pro povolení samostatného okna při běhu jako server použijte spouštěcí parametr `-debugweather`.

Nastavení okna jsou uložena v profilech jako `weather_client_imgui.ini` / `weather_client_imgui.bin` (nebo `weather_server_*` pro servery).

#### Force Fog at Camera

Vynucuje výšku mlhy na shodnou s výškou kamery hráče. Má prioritu nad nastavením Height bias.

#### Override Fog

Povoluje přepsání hodnot mlhy ručním nastavením:

| Parametr | Rozsah | Krok |
|-----------|-------|------|
| Distance density | 0 -- 1 | 0.01 |
| Height density | 0 -- 1 | 0.01 |
| Distance offset | 0 -- 1 | 0.01 |
| Height bias | -500 -- 500 | 5 |

### Volná kamera

Volná kamera odpojí pohled od postavy hráče a umožňuje létat světem. Toto je jeden z nejužitečnějších ladicích nástrojů pro moddery.

#### Ovládání volné kamery

| Klávesa | Původ | Funkce |
|-----|--------|----------|
| **W / A / S / D** | Inputs (xml) | Pohyb vpřed / vlevo / vzad / vpravo |
| **Q** | Inputs (xml) | Pohyb nahoru |
| **Z** | Inputs (xml) | Pohyb dolů |
| **Myš** | Inputs (xml) | Rozhlížení |
| **Kolečko myši nahoru** | Inputs (C++) | Zvýšení rychlosti |
| **Kolečko myši dolů** | Inputs (C++) | Snížení rychlosti |
| **Mezerník** | Cheat Inputs (C++) | Přepnutí ladicího zobrazení cílového objektu na obrazovce |
| **Ctrl / Shift** | Cheat Inputs (C++) | Aktuální rychlost x 10 |
| **Alt** | Cheat Inputs (C++) | Aktuální rychlost / 10 |
| **End** | Cheat Inputs (C++) | Vypnutí volné kamery (návrat k hráči) |
| **Enter** | Cheat Inputs (C++) | Propojení kamery s cílovým objektem |
| **Page Up** | Cheat Inputs (C++) | Přepnutí pohybu hráče ve volné kameře |
| **Page Down** | Cheat Inputs (C++) | Zmrazení/rozmrazení pozice kamery |
| **Insert** | PluginKeyBinding (Script) | Teleportace hráče na pozici kurzoru |
| **Home** | PluginKeyBinding (Script) | Přepnutí volné kamery / vypnutí a teleportace na kurzor |
| **Numpad /** | PluginKeyBinding (Script) | Přepnutí volné kamery (bez teleportace) |

#### Volby volné kamery

| Volba | Popis |
|--------|-------------|
| **FrCam Player Move** | Povolení/zakázání vstupů hráče (WASD) pohybujících hráčem ve volné kameře |
| **FrCam NoClip** | Povolení/zakázání průchodu kamery terénem |
| **FrCam Freeze** | Povolení/zakázání vstupů pohybujících kamerou |

### Vehicles

Rozšířená ladicí funkcionalita pro vozidla. Funguje pouze když je hráč uvnitř vozidla.

- **Audio** -- Otevře samostatné okno pro úpravu nastavení zvuku v reálném čase. Zahrnuje vizualizaci audio kontrolerů.
- **Simulation** -- Otevře samostatné okno s laděním simulace auta: úprava fyzikálních parametrů a vizualizace.

### Combat

Ladicí nástroje pro boj, střelbu a hitpointy:

| Volba | Popis |
|--------|-------------|
| **DECombat** | Zobrazuje na obrazovce text se vzdálenostmi k autům, AI a hráčům |
| **DEShots** | Podmenu ladění projektilů (viz níže) |
| **DEHitpoints** | Zobrazuje DamageSystem hráče a objektu, na který se dívá |
| **DEExplosions** | Zobrazuje data penetrace exploze. Čísla ukazují hodnoty zpomalení. Červený kříž = zastaveno. Zelený kříž = proniklo |

**Podmenu DEShots:**

| Volba | Popis |
|--------|-------------|
| Clear vis. | Vymazání existující vizualizace střel |
| Vis. trajectory | Trasování dráhy střely, zobrazení výstupních a koncových bodů |
| Always Deflect | Vynucení odrazu všech klientem vystřelených střel |

### Legacy/Obsolete

- **DEAmbient** -- Zobrazuje proměnné ovlivňující ambientní zvuky
- **DELight** -- Zobrazuje statistiky aktuálního osvětlení prostředí

### DESurfaceSound

Zobrazuje typ povrchu, na kterém hráč stojí, a typ útlumu.

### Central Economy

Kompletní sada ladicích nástrojů pro systém Central Economy (CE).

> **Důležité:** Většina ladicích voleb CE funguje pouze v single-player klientovi s povoleným CE. Pouze "Building Stats" funguje v multiplayerovém prostředí nebo když je CE vypnuto.

> **Poznámka:** Mnohé z těchto funkcí jsou také dostupné prostřednictvím `CEApi` ve skriptu (`CentralEconomy.c`).

#### Loot Spawn Edit

Nástroje pro vytváření a úpravu loot spawn bodů na objektech. Pro použití nástroje Edit Volume musí být povolena volná kamera.

| Volba | Popis | Ekvivalent ve skriptu |
|--------|-------------|-------------------|
| **Spawn Volume Vis** | Vizualizace loot spawn bodů. Volby: Off, Adaptive, Volume, Occupied | `GetCEApi().LootSetSpawnVolumeVisualisation()` |
| **Setup Vis** | Zobrazení vlastností CE nastavení na obrazovce s barevně odlišenými kontejnery | `GetCEApi().LootToggleSpawnSetup()` |
| **Edit Volume** | Interaktivní editor loot bodů (vyžaduje volnou kameru) | `GetCEApi().LootToggleVolumeEditing()` |
| **Re-Trace Group Points** | Přetrasování loot bodů pro opravu problémů se vznášením | `GetCEApi().LootRetraceGroupPoints()` |
| **Spawn Candy** | Spawn lootu ve všech spawn bodech vybrané skupiny | -- |
| **Spawn Rotation Test** | Testování rotačních příznaků na pozici kurzoru | -- |
| **Placement Test** | Vizualizace umístění válcovou koulí | -- |
| **Export Group** | Export vybrané skupiny do `storage/export/mapGroup_CLASSNAME.xml` | `GetCEApi().LootExportGroup()` |
| **Export All Groups** | Export všech skupin do `storage/export/mapgroupproto.xml` | `GetCEApi().LootExportAllGroups()` |
| **Export Map** | Generování `storage/export/mapgrouppos.xml` | `GetCEApi().LootExportMap()` |
| **Export Clusters** | Generování `storage/export/mapgroupcluster.xml` | `GetCEApi().ExportClusterData()` |
| **Export Economy [csv]** | Export ekonomiky do `storage/log/economy.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.Economy)` |
| **Export Respawn Queue [csv]** | Export fronty respawnu do `storage/log/respawn_queue.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.RespawnQueue)` |

**Klávesové zkratky Edit Volume:**

| Klávesa | Funkce |
|-----|----------|
| **[** | Iterace kontejnery zpět |
| **]** | Iterace kontejnery vpřed |
| **LMB** | Vložení nového bodu |
| **RMB** | Smazání bodu |
| **;** | Zvětšení velikosti bodu |
| **'** | Zmenšení velikosti bodu |
| **Insert** | Spawn lootu v bodě |
| **M** | Spawn 48 "AmmoBox_762x54_20Rnd" |
| **Backspace** | Označení blízkého lootu k úklidu (vyčerpá životnost, ne okamžitý) |

#### Loot Tool

| Volba | Popis | Ekvivalent ve skriptu |
|--------|-------------|-------------------|
| **Deplete Lifetime** | Vyčerpá životnost na 3 sekundy (naplánováno k úklidu) | `GetCEApi().LootDepleteLifetime()` |
| **Set Damage = 1.0** | Nastaví zdraví na 0 | `GetCEApi().LootSetDamageToOne()` |
| **Damage + Deplete** | Provede obojí výše uvedené | `GetCEApi().LootDepleteAndDamage()` |
| **Invert Avoidance** | Přepíná vyhýbání hráčům (detekce blízkých hráčů) | -- |
| **Project Target Loot** | Emuluje spawning cílového předmětu, generuje obrázky a logy. Vyžaduje povolené "Loot Vis" | `GetCEApi().SpawnAnalyze()` a `GetCEApi().EconomyMap()` |

#### Infected

| Volba | Popis | Ekvivalent ve skriptu |
|--------|-------------|-------------------|
| **Infected Vis** | Vizualizace zón zombie, lokací, stavu živý/mrtvý | `GetCEApi().InfectedToggleVisualisation()` |
| **Infected Zone Info** | Ladicí informace na obrazovce, když je kamera uvnitř zóny nakažených | `GetCEApi().InfectedToggleZoneInfo()` |
| **Infected Spawn** | Spawn nakažených ve vybrané zóně (nebo "InfectedArmy" na kurzoru) | `GetCEApi().InfectedSpawn()` |
| **Reset Cleanup** | Nastaví časovač úklidu na 3 sekundy | `GetCEApi().InfectedResetCleanup()` |

#### Animal

| Volba | Popis | Ekvivalent ve skriptu |
|--------|-------------|-------------------|
| **Animal Vis** | Vizualizace zón zvířat, lokací, stavu živý/mrtvý | `GetCEApi().AnimalToggleVisualisation()` |
| **Animal Spawn** | Spawn zvířete ve vybrané zóně (nebo "AnimalGoat" na kurzoru) | `GetCEApi().AnimalSpawn()` |
| **Ambient Spawn** | Spawn "AmbientHen" na cíli kurzoru | `GetCEApi().AnimalAmbientSpawn()` |

#### Building

**Building Stats** zobrazuje ladicí informace na obrazovce o stavu dveří budov:

- Levá strana: zda jsou jednotlivé dveře otevřené/zavřené a volné/zamčené
- Střed: statistiky ohledně `buildings.bin` (persistence budov)

Randomizace dveří používá konfigurační hodnotu `initOpened`. Když `rand < initOpened`, dveře se spawnují otevřené (takže `initOpened=0` znamená, že dveře se nikdy nespawnují otevřené).

Běžná nastavení `<building/>` v economy.xml:

| Nastavení | Chování |
|-------|----------|
| `init="0" load="0" respawn="0" save="0"` | Žádná persistence, žádná randomizace, výchozí stav po restartu |
| `init="1" load="0" respawn="0" save="0"` | Žádná persistence, dveře randomizovány podle initOpened |
| `init="1" load="1" respawn="0" save="1"` | Ukládá pouze zamčené dveře, dveře randomizovány podle initOpened |
| `init="0" load="1" respawn="0" save="1"` | Plná persistence, ukládá přesný stav dveří, žádná randomizace |

#### Další nástroje Central Economy

| Volba | Popis | Ekvivalent ve skriptu |
|--------|-------------|-------------------|
| **Vehicle&Wreck Vis** | Vizualizace objektů registrovaných jako "Vehicle" avoidance. Žlutá = Auto, Růžová = Vraky (Building), Modrá = InventoryItem | `GetCEApi().ToggleVehicleAndWreckVisualisation()` |
| **Loot Vis** | Economy Data na obrazovce pro cokoli, na co se díváte (loot, nakažení, dynamické události) | `GetCEApi().ToggleLootVisualisation()` |
| **Cluster Vis** | Trajectory DE statistiky na obrazovce | `GetCEApi().ToggleClusterVisualisation()` |
| **Dynamic Events Status** | DE statistiky na obrazovce | `GetCEApi().ToggleDynamicEventStatus()` |
| **Dynamic Events Vis** | Vizualizace a úprava DE spawn bodů | `GetCEApi().ToggleDynamicEventVisualisation()` |
| **Dynamic Events Spawn** | Spawn dynamické události na nejbližším bodě nebo "StaticChristmasTree" jako záloha | `GetCEApi().DynamicEventSpawn()` |
| **Export Dyn Event** | Export DE bodů do `storage/export/eventSpawn_CLASSNAME.xml` | `GetCEApi().DynamicEventExport()` |
| **Overall Stats** | CE statistiky na obrazovce | `GetCEApi().ToggleOverallStats()` |
| **Updaters State** | Zobrazuje, co CE aktuálně zpracovává | -- |
| **Idle Mode** | Uspí CE (zastaví zpracování) | -- |
| **Force Save** | Vynucuje uložení celé složky `storage/data` (vylučuje databázi hráčů) | -- |

**Klávesové zkratky Dynamic Events Vis:**

| Klávesa | Funkce |
|-----|----------|
| **[** | Iterace dostupnými DE zpět |
| **]** | Iterace dostupnými DE vpřed |
| **LMB** | Vložení nového bodu pro vybrané DE |
| **RMB** | Smazání bodu nejbližšího kurzoru |
| **MMB** | Podržení nebo klik pro otáčení úhlu |

---

## AI

### Struktura menu

```
AI
  Show NavMesh
  Debug Pathgraph World
  Debug Path Agent
  Debug AI Agent
```

> **Důležité:** Ladění AI v současnosti nefunguje v multiplayerovém prostředí.

### Show NavMesh

Vykresluje ladicí tvary pro vizualizaci navigačního meshe. Zobrazuje ladicí informace se statistikami na obrazovce.

| Klávesa | Funkce |
|-----|----------|
| **Numpad 0** | Registrace "Test start" na pozici kamery |
| **Numpad 1** | Regenerace dlaždice na pozici kamery |
| **Numpad 2** | Regenerace dlaždic kolem pozice kamery |
| **Numpad 3** | Iterace typy vizualizace vpřed |
| **LAlt + Numpad 3** | Iterace typy vizualizace zpět |
| **Numpad 4** | Registrace "Test end" na pozici kamery. Kreslí koule a čáru mezi startem a koncem. Zelená = cesta nalezena, Červená = žádná cesta |
| **Numpad 5** | Test nejbližší pozice na NavMesh (SamplePosition). Modrá koule = dotaz, růžová koule = výsledek |
| **Numpad 6** | Test raycaatu NavMesh. Modrá koule = dotaz, růžová koule = výsledek |

### Debug Pathgraph World

Ladicí informace na obrazovce ukazující, kolik požadavků na cestu bylo dokončeno a kolik jich aktuálně čeká.

### Debug Path Agent

Ladicí informace na obrazovce a ladicí tvary pro hledání cesty AI. Zamiřte na AI entitu pro výběr k sledování. Použijte toto, když se konkrétně zajímáte o to, jak AI nachází svou cestu.

### Debug AI Agent

Ladicí informace na obrazovce a ladicí tvary pro bdělost a chování AI. Zamiřte na AI entitu pro výběr k sledování. Použijte toto, když chcete porozumět rozhodování AI a stavu povědomí.

---

## Zvuky

### Struktura menu

```
Sounds
  Show playing samples
  Show system info
```

### Show Playing Samples

Ladicí vizualizace pro aktuálně přehrávané zvuky.

| Volba | Popis |
|--------|-------------|
| **none** | Výchozí, žádné ladění |
| **ImGui** | Samostatné okno (nejnovější iterace). Podporuje filtrování, plné pokrytí kategorií. Nastavení uloženo jako `playing_sounds_imgui.ini` / `.bin` v profilech |
| **DbgUI** | Starší verze. Má filtrování kategorií, čitelnější, ale přesahuje obrazovku a chybí kategorie vozidel |
| **Engine** | Starší verze. Zobrazuje barevně kódovaná data v reálném čase se statistikami, ale přesahuje obrazovku a chybí legenda barev |

### Show System Info

Ladicí statistiky zvukového systému na obrazovce (počty bufferů, aktivní zdroje atd.).

---

## Užitečné funkce pro moddery

I když má každá volba své využití, tyto jsou ty, po kterých moddeři sahají nejčastěji:

### Analýza výkonu

1. **Počítadlo FPS** (LCtrl + Numpad 1) -- Rychlá kontrola, že váš mod neničí snímkovou frekvenci
2. **Skriptový profiler** -- Zjistěte, které z vašich tříd nebo funkcí spotřebovávají nejvíce CPU času. Nastavte modul na WORLD nebo MISSION pro zaměření na skriptovou vrstvu vašeho modu

### Vizuální ladění

1. **Volná kamera** -- Létejte kolem pro kontrolu spawnovaných objektů, ověřování pozic, kontrolu chování AI z dálky
2. **Diagnostika geometrie** -- Ověřte fire geometry, view geometry, roadway LOD a memory pointy vašeho vlastního modelu bez opuštění hry
3. **Render Debug Mode** (RCtrl + RAlt + W) -- Zobrazte drátové překryvy pro kontrolu hustoty meshe a přiřazení materiálů

### Testování hratelnosti

1. **Volná kamera + Insert** -- Teleportujte hráče kamkoli na mapě okamžitě
2. **Přepsání počasí** -- Vynuťte specifické podmínky mlhy pro testování funkcí závislých na viditelnosti
3. **Nástroje Central Economy** -- Spawnujte nakažené, zvířata, loot a dynamické události na vyžádání
4. **Ladění boje** -- Trasujte dráhy střel, kontrolujte systémy poškození hitpointů, testujte penetraci explozí

### Vývoj AI

1. **Show NavMesh** -- Ověřte, že AI skutečně může navigovat tam, kam očekáváte
2. **Debug AI Agent** -- Podívejte se, co nakažený nebo zvíře "přemýšlí", na jaké úrovni bdělosti je
3. **Debug Path Agent** -- Podívejte se na skutečnou cestu, kterou AI používá, a zda hledání cesty uspěje

---

## Kdy používat Diag Menu

### Během vývoje

- **Skriptový profiler** při optimalizaci kódu na každý snímek (OnUpdate, EOnFrame)
- **Volná kamera** pro umisťování objektů, ověřování spawn lokací, kontrolu umístění modelů
- **Diagnostika geometrie** ihned po importu nového modelu pro ověření LOD a typů geometrie
- **Počítadlo FPS** jako základ před a po přidání nových funkcí

### Během testování

- **Ladění boje** pro ověření poškození zbraní, chování projektilů, efektů explozí
- **Nástroje CE** pro testování distribuce lootu, spawn bodů, dynamických událostí
- **Ladění AI** pro ověření, že chování nakažených/zvířat správně reaguje na přítomnost hráče
- **Ladění počasí** pro testování vašeho modu za různých povětrnostních podmínek

### Při vyšetřování chyb

- **Počítadlo FPS + Skriptový profiler** když hráči hlásí problémy s výkonem
- **Volná kamera + Mezerník** (ladění objektu) pro kontrolu objektů, které se nechovají správně
- **Render Debug Mode** pro diagnostiku vizuálních artefaktů nebo problémů s materiály
- **Show Bullet** pro ladění problémů s fyzikálními kolizemi

---

## Časté chyby

**Používání retailového spustitelného souboru.** Diag Menu je dostupné pouze v `DayZDiag_x64.exe`. Pokud stisknete Win+Alt a nic se nestane, používáte retailový build.

**Zapomenutí, že Max. Collider Distance je 0.** Vizualizace fyziky (Draw Bullet shape) nic nezobrazí, pokud Max. Collider Distance je stále na výchozí hodnotě 0. Nastavte alespoň na 10-20 pro zobrazení kolizních objektů kolem vás.

**Nástroje CE v multiplayeru.** Většina ladicích voleb Central Economy funguje pouze v single-playeru s povoleným CE. Neočekávejte, že budou fungovat na dedikovaném serveru.

**Ladění AI v multiplayeru.** Ladění AI v současnosti nefunguje v multiplayerovém prostředí. Testujte chování AI v single-playeru.

**Záměna "Bullet" s municí.** Volby "Bullet" v kategorii "Enfusion World" odkazují na fyzikální engine Bullet, ne na munici do zbraní. Ladění boje je pod Game > Combat.

**Ponechání profileru zapnutého.** Skriptový profiler má měřitelnou režii. Vypněte ho, když dokončíte profilování, abyste získali přesné hodnoty FPS.

**Velké hodnoty vzdálenosti kolizních objektů.** Nastavení Max. Collider Distance na 200 nebo 500 zničí vaši snímkovou frekvenci. Použijte nejmenší hodnotu pokrývající vaši oblast zájmu.

**Nepovolení předpokladů.** Některé volby závisí na povolení jiných:
- "Draw Char Ctrl" a "Draw Bullet wireframe" závisí na "Draw Bullet shape"
- "Edit Volume" vyžaduje volnou kameru
- "Project Target Loot" vyžaduje povolené "Loot Vis"

---

## Další kroky

- **Kapitola 8.6: [Ladění a testování](06-debugging-testing.md)** -- Skriptové logy, Print ladění, file patching a Workbench
- **Kapitola 8.7: [Publikování na Workshop](07-publishing-workshop.md)** -- Zabalení a publikování vašeho otestovaného modu
