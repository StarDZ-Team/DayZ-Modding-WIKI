# Rozdział 5.5: Pliki konfiguracyjne serwera

[Strona główna](../README.md) | [<< Poprzedni: Format ImageSet](04-imagesets.md) | **Pliki konfiguracyjne serwera** | [Następny: Konfiguracja ekwipunku startowego >>](06-spawning-gear.md)

---

> **Podsumowanie:** Serwery DayZ są konfigurowane za pomocą plików XML, JSON i skryptów w folderze misji (np. `mpmissions/dayzOffline.chernarusplus/`). Pliki te kontrolują spawny przedmiotów, zachowanie ekonomii, zasady rozgrywki i tożsamość serwera. Zrozumienie ich jest niezbędne do dodawania niestandardowych przedmiotów do ekonomii łupów, dostrajania parametrów serwera lub budowania niestandardowej misji.

---

## Spis treści

- [Przegląd](#przegląd)
- [init.c --- Punkt wejścia misji](#initc--punkt-wejścia-misji)
- [types.xml --- Definicje spawnów przedmiotów](#typesxml--definicje-spawnów-przedmiotów)
- [cfgspawnabletypes.xml --- Załączniki i ładunek](#cfgspawnabletypesxml--załączniki-i-ładunek)
- [cfgrandompresets.xml --- Pule łupów wielokrotnego użytku](#cfgrandompresetsxml--pule-łupów-wielokrotnego-użytku)
- [globals.xml --- Parametry ekonomii](#globalsxml--parametry-ekonomii)
- [cfggameplay.json --- Ustawienia rozgrywki](#cfggameplayjson--ustawienia-rozgrywki)
- [serverDZ.cfg --- Ustawienia serwera](#serverdzcfg--ustawienia-serwera)
- [Interakcja modów z ekonomią](#interakcja-modów-z-ekonomią)
- [Typowe błędy](#typowe-błędy)

---

## Przegląd

Każdy serwer DayZ wczytuje swoją konfigurację z **folderu misji**. Pliki Centralnej Ekonomii (CE) definiują, jakie przedmioty się pojawiają, gdzie i jak długo. Sam plik wykonywalny serwera jest konfigurowany przez `serverDZ.cfg`, który znajduje się obok pliku wykonywalnego.

| Plik | Przeznaczenie |
|------|---------------|
| `init.c` | Punkt wejścia misji --- inicjalizacja Hive, data/czas, ekwipunek startowy |
| `db/types.xml` | Definicje spawnów przedmiotów: ilości, czas życia, lokalizacje |
| `cfgspawnabletypes.xml` | Wstępnie dołączone przedmioty i ładunek na spawnowanych obiektach |
| `cfgrandompresets.xml` | Pule przedmiotów wielokrotnego użytku dla cfgspawnabletypes |
| `db/globals.xml` | Globalne parametry ekonomii: maksymalne ilości, timery czyszczenia |
| `cfggameplay.json` | Dostrajanie rozgrywki: wytrzymałość, budowanie bazy, UI |
| `cfgeconomycore.xml` | Rejestracja klas bazowych i logowanie CE |
| `cfglimitsdefinition.xml` | Definicje prawidłowych tagów kategorii, użycia i wartości |
| `serverDZ.cfg` | Nazwa serwera, hasło, maks. graczy, ładowanie modów |

---

## init.c --- Punkt wejścia misji

Skrypt `init.c` jest pierwszą rzeczą wykonywaną przez serwer. Inicjalizuje Centralną Ekonomię i tworzy instancję misji.

```c
void main()
{
    Hive ce = CreateHive();
    if (ce)
        ce.InitOffline();

    GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);
    CreateCustomMission("dayzOffline.chernarusplus");
}

class CustomMission: MissionServer
{
    override PlayerBase CreateCharacter(PlayerIdentity identity, vector pos,
                                        ParamsReadContext ctx, string characterName)
    {
        Entity playerEnt;
        playerEnt = GetGame().CreatePlayer(identity, characterName, pos, 0, "NONE");
        Class.CastTo(m_player, playerEnt);
        GetGame().SelectPlayer(identity, m_player);
        return m_player;
    }

    override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
    {
        EntityAI itemClothing = player.FindAttachmentBySlotName("Body");
        if (itemClothing)
        {
            itemClothing.GetInventory().CreateInInventory("BandageDressing");
        }
    }
}

Mission CreateCustomMission(string path)
{
    return new CustomMission();
}
```

`Hive` zarządza bazą danych CE. Bez `CreateHive()` żadne przedmioty się nie pojawiają, a trwałość jest wyłączona. `CreateCharacter` tworzy encję gracza przy spawnie, a `StartingEquipSetup` definiuje przedmioty, które otrzymuje świeża postać. Inne przydatne nadpisania `MissionServer` to `OnInit()`, `OnUpdate()`, `InvokeOnConnect()` i `InvokeOnDisconnect()`.

---

## types.xml --- Definicje spawnów przedmiotów

Znajduje się w `db/types.xml` i jest sercem CE. Każdy przedmiot, który może się pojawić, musi mieć tutaj wpis.

### Kompletny wpis

```xml
<type name="AK74">
    <nominal>6</nominal>
    <lifetime>28800</lifetime>
    <restock>0</restock>
    <min>4</min>
    <quantmin>30</quantmin>
    <quantmax>80</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1"
           count_in_player="0" crafted="0" deloot="0"/>
    <category name="weapons"/>
    <usage name="Military"/>
    <value name="Tier3"/>
    <value name="Tier4"/>
</type>
```

### Opis pól

| Pole | Opis |
|------|------|
| `nominal` | Docelowa ilość na mapie. CE spawnuje przedmioty, aż osiągnie tę wartość |
| `min` | Minimalna ilość, zanim CE uruchomi uzupełnianie |
| `lifetime` | Sekundy, przez które przedmiot trwa na ziemi przed despawnem |
| `restock` | Minimalny czas w sekundach między próbami uzupełnienia (0 = natychmiast) |
| `quantmin/quantmax` | Procent wypełnienia dla przedmiotów z ilością (magazynki, butelki). Użyj `-1` dla przedmiotów bez ilości |
| `cost` | Waga priorytetu CE (wyższa = priorytetyzowany). Większość przedmiotów używa `100` |

### Flagi

| Flaga | Przeznaczenie |
|-------|---------------|
| `count_in_cargo` | Licz przedmioty w kontenerach do nominału |
| `count_in_hoarder` | Licz przedmioty w schowkach/namiotach/beczkach do nominału |
| `count_in_map` | Licz przedmioty na ziemi do nominału |
| `count_in_player` | Licz przedmioty w ekwipunku gracza do nominału |
| `crafted` | Przedmiot jest tylko wytwarzany, nie spawnuje się naturalnie |
| `deloot` | Łup z Dynamicznych Wydarzeń (wraki helikopterów itp.) |

### Tagi Category, Usage i Value

Te tagi kontrolują **gdzie** przedmioty się pojawiają:

- **`category`** --- Typ przedmiotu. Vanilla: `tools`, `containers`, `clothes`, `food`, `weapons`, `books`, `explosives`, `lootdispatch`.
- **`usage`** --- Typy budynków. Vanilla: `Military`, `Police`, `Medic`, `Firefighter`, `Industrial`, `Farm`, `Coast`, `Town`, `Village`, `Hunting`, `Office`, `School`, `Prison`, `ContaminatedArea`, `Historical`.
- **`value`** --- Strefy tier mapy. Vanilla: `Tier1` (wybrzeże), `Tier2` (interior), `Tier3` (wojskowe), `Tier4` (głębokie wojskowe), `Unique`.

Wiele tagów można łączyć. Brak tagów `usage` = przedmiot się nie pojawi. Brak tagów `value` = spawnuje się we wszystkich strefach.

### Wyłączanie przedmiotu

Ustaw `nominal=0` i `min=0`. Przedmiot nigdy się nie pojawi, ale wciąż może istnieć poprzez skrypty lub wytwarzanie.

---

## cfgspawnabletypes.xml --- Załączniki i ładunek

Kontroluje, co spawnuje się **już dołączone do lub wewnątrz** innych przedmiotów.

### Oznaczanie pojemników

Kontenery magazynowe są oznaczane, aby CE wiedział, że przechowują przedmioty graczy:

```xml
<type name="SeaChest">
    <hoarder />
</type>
```

### Uszkodzenie przy spawnie

```xml
<type name="NVGoggles">
    <damage min="0.0" max="0.32" />
</type>
```

Wartości mieszczą się w zakresie od `0.0` (nienaruszony) do `1.0` (zniszczony).

### Załączniki

```xml
<type name="PlateCarrierVest_Camo">
    <damage min="0.1" max="0.6" />
    <attachments chance="0.85">
        <item name="PlateCarrierHolster_Camo" chance="1.00" />
    </attachments>
    <attachments chance="0.85">
        <item name="PlateCarrierPouches_Camo" chance="1.00" />
    </attachments>
</type>
```

Zewnętrzne `chance` określa, czy grupa załączników jest oceniana. Wewnętrzne `chance` wybiera konkretny przedmiot, gdy w jednej grupie jest kilka przedmiotów.

### Presety ładunku

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

Każda linia losuje preset niezależnie --- trzy linie oznaczają trzy osobne szanse.

---

## cfgrandompresets.xml --- Pule łupów wielokrotnego użytku

Definiuje nazwane pule przedmiotów, do których odwołuje się `cfgspawnabletypes.xml`:

```xml
<randompresets>
    <cargo chance="0.16" name="foodVillage">
        <item name="SodaCan_Cola" chance="0.02" />
        <item name="TunaCan" chance="0.05" />
        <item name="PeachesCan" chance="0.05" />
        <item name="BakedBeansCan" chance="0.05" />
        <item name="Crackers" chance="0.05" />
    </cargo>

    <cargo chance="0.15" name="toolsHermit">
        <item name="WeaponCleaningKit" chance="0.10" />
        <item name="Matchbox" chance="0.15" />
        <item name="Hatchet" chance="0.07" />
    </cargo>
</randompresets>
```

`chance` presetu to ogólne prawdopodobieństwo, że cokolwiek się pojawi. Jeśli losowanie się powiedzie, jeden przedmiot jest wybierany z puli na podstawie indywidualnych szans. Aby dodać przedmioty z modów, utwórz nowy blok `cargo` i odwołaj się do niego w `cfgspawnabletypes.xml`.

---

## globals.xml --- Parametry ekonomii

Znajduje się w `db/globals.xml` i ustawia globalne parametry CE:

```xml
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="ZombieMaxCount" type="0" value="1000"/>
    <var name="CleanupLifetimeDeadPlayer" type="0" value="3600"/>
    <var name="CleanupLifetimeDeadAnimal" type="0" value="1200"/>
    <var name="CleanupLifetimeDeadInfected" type="0" value="330"/>
    <var name="CleanupLifetimeRuined" type="0" value="330"/>
    <var name="FlagRefreshFrequency" type="0" value="432000"/>
    <var name="FlagRefreshMaxDuration" type="0" value="3456000"/>
    <var name="FoodDecay" type="0" value="1"/>
    <var name="InitialSpawn" type="0" value="100"/>
    <var name="LootDamageMin" type="1" value="0.0"/>
    <var name="LootDamageMax" type="1" value="0.82"/>
    <var name="SpawnInitial" type="0" value="1200"/>
    <var name="TimeLogin" type="0" value="15"/>
    <var name="TimeLogout" type="0" value="15"/>
    <var name="TimePenalty" type="0" value="20"/>
    <var name="TimeHopping" type="0" value="60"/>
    <var name="ZoneSpawnDist" type="0" value="300"/>
</variables>
```

### Kluczowe zmienne

| Zmienna | Domyślnie | Opis |
|---------|-----------|------|
| `AnimalMaxCount` | 200 | Maksymalna liczba zwierząt na mapie |
| `ZombieMaxCount` | 1000 | Maksymalna liczba zarażonych na mapie |
| `CleanupLifetimeDeadPlayer` | 3600 | Czas usuwania martwych ciał (sekundy) |
| `CleanupLifetimeRuined` | 330 | Czas usuwania zniszczonych przedmiotów |
| `FlagRefreshFrequency` | 432000 | Interwał odświeżania flagi terytorium (5 dni) |
| `FlagRefreshMaxDuration` | 3456000 | Maks. czas życia flagi (40 dni) |
| `FoodDecay` | 1 | Przełącznik psucia się jedzenia (0=wyłączone, 1=włączone) |
| `InitialSpawn` | 100 | Procent nominału spawnowanego przy starcie |
| `LootDamageMax` | 0.82 | Maksymalne uszkodzenie spawnowanych łupów |
| `TimeLogin` / `TimeLogout` | 15 | Timer logowania/wylogowania (anty-combat-log) |
| `TimePenalty` | 20 | Timer kary za combat log |
| `ZoneSpawnDist` | 300 | Odległość gracza uruchamiająca spawn zombie/zwierząt |

Atrybut `type` to `0` dla liczby całkowitej, `1` dla zmiennoprzecinkowej. Użycie złego typu obcina wartość.

---

## cfggameplay.json --- Ustawienia rozgrywki

Wczytywany tylko gdy `enableCfgGameplayFile = 1` jest ustawione w `serverDZ.cfg`. Bez tego silnik używa wartości zakodowanych na stałe.

### Struktura

```json
{
    "version": 123,
    "GeneralData": {
        "disableBaseDamage": false,
        "disableContainerDamage": false,
        "disableRespawnDialog": false
    },
    "PlayerData": {
        "disablePersonalLight": false,
        "StaminaData": {
            "sprintStaminaModifierErc": 1.0,
            "staminaMax": 100.0,
            "staminaWeightLimitThreshold": 6000.0,
            "staminaMinCap": 5.0
        },
        "MovementData": {
            "timeToSprint": 0.45,
            "rotationSpeedSprint": 0.15,
            "allowStaminaAffectInertia": true
        }
    },
    "WorldsData": {
        "lightingConfig": 0,
        "environmentMinTemps": [-3, -2, 0, 4, 9, 14, 18, 17, 13, 11, 9, 0],
        "environmentMaxTemps": [3, 5, 7, 14, 19, 24, 26, 25, 18, 14, 10, 5]
    },
    "BaseBuildingData": {
        "HologramData": {
            "disableIsCollidingBBoxCheck": false,
            "disableIsCollidingAngleCheck": false,
            "disableHeightPlacementCheck": false,
            "disallowedTypesInUnderground": ["FenceKit", "TerritoryFlagKit"]
        }
    },
    "MapData": {
        "ignoreMapOwnership": false,
        "displayPlayerPosition": false,
        "displayNavInfo": true
    }
}
```

Kluczowe ustawienia: `disableBaseDamage` zapobiega uszkodzeniom bazy, `disablePersonalLight` usuwa światło świeżego spawnu, `staminaWeightLimitThreshold` podaje się w gramach (6000 = 6kg), tablice temperatur mają 12 wartości (styczeń--grudzień), `lightingConfig` akceptuje `0` (domyślny) lub `1` (ciemniejsze noce), a `displayPlayerPosition` pokazuje punkt gracza na mapie.

---

## serverDZ.cfg --- Ustawienia serwera

Ten plik znajduje się obok pliku wykonywalnego serwera, nie w folderze misji.

### Kluczowe ustawienia

```
hostname = "My DayZ Server";
password = "";
passwordAdmin = "adminpass123";
maxPlayers = 60;
verifySignatures = 2;
forceSameBuild = 1;
template = "dayzOffline.chernarusplus";
enableCfgGameplayFile = 1;
storeHouseStateDisabled = false;
storageAutoFix = 1;
```

| Parametr | Opis |
|----------|------|
| `hostname` | Nazwa serwera w przeglądarce |
| `password` | Hasło dołączenia (puste = otwarty) |
| `passwordAdmin` | Hasło administratora RCON |
| `maxPlayers` | Maksymalna liczba jednoczesnych graczy |
| `template` | Nazwa folderu misji |
| `verifySignatures` | Poziom sprawdzania sygnatur (2 = ścisły) |
| `enableCfgGameplayFile` | Wczytaj cfggameplay.json (0/1) |

### Ładowanie modów

Mody są określane przez parametry uruchomienia, nie w pliku konfiguracyjnym:

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

Mody `-mod=` muszą być zainstalowane przez klientów. Mody `-servermod=` działają tylko po stronie serwera.

---

## Interakcja modów z ekonomią

### cfgeconomycore.xml --- Rejestracja klas bazowych

Każda hierarchia klas przedmiotów musi prowadzić do zarejestrowanej klasy bazowej:

```xml
<economycore>
    <classes>
        <rootclass name="DefaultWeapon" />
        <rootclass name="DefaultMagazine" />
        <rootclass name="Inventory_Base" />
        <rootclass name="SurvivorBase" act="character" reportMemoryLOD="no" />
        <rootclass name="DZ_LightAI" act="character" reportMemoryLOD="no" />
        <rootclass name="CarScript" act="car" reportMemoryLOD="no" />
    </classes>
</economycore>
```

Jeśli twój mod wprowadza nową klasę bazową niedziedziaczącą z `Inventory_Base`, `DefaultWeapon` lub `DefaultMagazine`, dodaj ją jako `rootclass`. Atrybut `act` określa typ encji: `character` dla AI, `car` dla pojazdów.

### cfglimitsdefinition.xml --- Niestandardowe tagi

Każde `category`, `usage` lub `value` użyte w `types.xml` musi być tutaj zdefiniowane:

```xml
<lists>
    <categories>
        <category name="mymod_special"/>
    </categories>
    <usageflags>
        <usage name="MyModDungeon"/>
    </usageflags>
    <valueflags>
        <value name="MyModEndgame"/>
    </valueflags>
</lists>
```

Użyj `cfglimitsdefinitionuser.xml` dla dodatków, które nie powinny nadpisywać oryginalnego pliku.

### economy.xml --- Kontrola podsystemów

Kontroluje, które podsystemy CE są aktywne:

```xml
<economy>
    <dynamic init="1" load="1" respawn="1" save="1"/>
    <animals init="1" load="0" respawn="1" save="0"/>
    <zombies init="1" load="0" respawn="1" save="0"/>
    <vehicles init="1" load="1" respawn="1" save="1"/>
</economy>
```

Flagi: `init` (spawn przy starcie), `load` (wczytaj trwałość), `respawn` (respawn po czyszczeniu), `save` (zapisz do bazy danych).

### Interakcja z ekonomią po stronie skryptu

Przedmioty tworzone przez `CreateInInventory()` są automatycznie zarządzane przez CE. Do spawnów w świecie użyj flag ECE:

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## Typowe błędy

### Błędy składni XML

Pojedynczy niezamknięty tag psuje cały plik. Zawsze waliduj XML przed wdrożeniem.

### Brakujące tagi w cfglimitsdefinition.xml

Użycie `usage` lub `value` w types.xml, które nie jest zdefiniowane w cfglimitsdefinition.xml, powoduje ciche niepojawianie się przedmiotu. Sprawdź logi RPT pod kątem ostrzeżeń.

### Zbyt wysoki nominał

Łączny nominał wszystkich przedmiotów powinien pozostać poniżej 10 000--15 000. Nadmierne wartości pogarszają wydajność serwera.

### Zbyt krótki czas życia

Przedmioty ze zbyt krótkimi czasami życia znikają, zanim gracze je znajdą. Używaj co najmniej `3600` (1 godzina) dla zwykłych przedmiotów, `28800` (8 godzin) dla broni.

### Brakująca klasa bazowa

Przedmioty, których hierarchia klas nie prowadzi do zarejestrowanej klasy bazowej w `cfgeconomycore.xml`, nigdy się nie pojawią, nawet z poprawnymi wpisami w types.xml.

### cfggameplay.json nie jest włączony

Plik jest ignorowany, chyba że `enableCfgGameplayFile = 1` jest ustawione w `serverDZ.cfg`.

### Zły typ w globals.xml

Użycie `type="0"` (liczba całkowita) dla wartości zmiennoprzecinkowej jak `0.82` obcina ją do `0`. Użyj `type="1"` dla liczb zmiennoprzecinkowych.

### Bezpośrednia edycja plików vanilla

Modyfikacja oryginalnego types.xml działa, ale psuje się przy aktualizacjach gry. Preferuj dostarczanie oddzielnych plików typów i rejestrowanie ich przez cfgeconomycore, lub używaj cfglimitsdefinitionuser.xml dla niestandardowych tagów.

---

## Dobre praktyki

- Dołącz folder `ServerFiles/` do swojego moda z prekonfigurowanymi wpisami `types.xml`, aby administratorzy serwerów mogli je skopiować zamiast pisać od zera.
- Używaj `cfglimitsdefinitionuser.xml` zamiast edytować oryginalny `cfglimitsdefinition.xml` -- twoje dodatki przetrwają aktualizacje gry.
- Ustaw `count_in_hoarder="0"` dla powszechnych przedmiotów (jedzenie, amunicja), aby zapobiec blokowaniu respawnów CE przez gromadzenie.
- Zawsze ustaw `enableCfgGameplayFile = 1` w `serverDZ.cfg` przed oczekiwaniem, że zmiany w `cfggameplay.json` zaczną działać.
- Utrzymuj łączny `nominal` we wszystkich wpisach types.xml poniżej 12 000, aby uniknąć degradacji wydajności CE na zaludnionych serwerach.

---

## Teoria a praktyka

| Koncepcja | Teoria | Rzeczywistość |
|-----------|--------|---------------|
| `nominal` to twarda wartość docelowa | CE spawnuje dokładnie tyle przedmiotów | CE zbliża się do nominału z czasem, ale waha się w zależności od interakcji graczy, cykli czyszczenia i odległości stref |
| `restock=0` oznacza natychmiastowy respawn | Przedmioty pojawiają się ponownie natychmiast po despawnie | CE przetwarza uzupełnianie w cyklach (zazwyczaj co 30-60 sekund), więc zawsze jest opóźnienie, niezależnie od wartości restock |
| `cfggameplay.json` kontroluje całą rozgrywkę | Wszystkie ustawienia trafiają tutaj | Wiele wartości rozgrywki jest zakodowanych na stałe w skryptach lub config.cpp i nie można ich nadpisać przez cfggameplay.json |
| `init.c` uruchamia się tylko przy starcie serwera | Jednorazowa inicjalizacja | `init.c` uruchamia się za każdym razem, gdy misja się wczytuje, w tym po restartach serwera. Stan trwały jest zarządzany przez Hive, nie init.c |
| Wiele plików types.xml łączy się płynnie | CE czyta wszystkie zarejestrowane pliki | Pliki muszą być zarejestrowane w cfgeconomycore.xml za pomocą dyrektyw `<ce folder="custom">`. Samo umieszczenie dodatkowych plików XML w `db/` nic nie daje |

---

## Kompatybilność i wpływ

- **Multi-Mod:** Wiele modów może dodawać wpisy do types.xml bez konfliktów, o ile nazwy klas są unikalne. Jeśli dwa mody definiują tę samą nazwę klasy z różnymi wartościami nominal/lifetime, wygrywa ostatni wczytany wpis.
- **Wydajność:** Nadmierne ilości nominalne (15 000+) powodują skoki ticków CE widoczne jako spadki FPS serwera. Każdy cykl CE iteruje po wszystkich zarejestrowanych typach, aby sprawdzić warunki spawnu.
