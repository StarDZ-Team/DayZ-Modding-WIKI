# Slownik moddingu DayZ

[Strona glowna](../README.md) | **Slownik**

---

Kompleksowy spis terminow uzywanych w tym wiki i moddingu DayZ.

---

## A

**Action (Akcja)** — Interakcja gracza z przedmiotem lub swiatem (jedzenie, otwieranie drzwi, naprawa). Akcje buduje sie uzywajac `ActionBase` z warunkami i etapami callbackow. Zobacz [Rozdzial 6.12](06-engine-api/12-action-system.md).

**Addon Builder** — Aplikacja DayZ Tools pakujaca pliki modow do archiwow PBO. Obsluguje binaryzacje, podpisywanie plikow i mapowanie prefiksow. Zobacz [Rozdzial 4.6](04-file-formats/06-pbo-packing.md).

**autoptr** — Silny wskaznik referencyjny z zakresem w Enforce Script. Obiekt, do ktorego sie odwoluje, jest automatycznie niszczony gdy `autoptr` opuszcza zakres. Rzadko uzywany w moddingu DayZ (preferuj jawne `ref`). Zobacz [Rozdzial 1.8](01-enforce-script/08-memory-management.md).

---

## B

**Binarize (Binaryzacja)** — Proces konwersji plikow zrodlowych (`config.cpp`, `.p3d`, `.tga`) do zoptymalizowanych formatow gotowych dla silnika (`.bin`, ODOL, `.paa`). Wykonywany automatycznie przez Addon Builder lub narzedzie Binarize w DayZ Tools. Zobacz [Rozdzial 4.6](04-file-formats/06-pbo-packing.md).

**bikey / biprivatekey / bisign** — Zobacz [Podpisywanie kluczy](#k).

---

## C

**CallQueue** — Narzedzie silnika DayZ do planowania opoznionych lub powtarzajacych sie wywolan funkcji. Dostepne przez `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)`. Zobacz [Rozdzial 6.7](06-engine-api/07-timers.md).

**CastTo** — Zobacz [Class.CastTo](#classcasto).

**Central Economy (CE) — Centralna Ekonomia** — System dystrybucji lootu i persystencji DayZ. Konfigurowany przez pliki XML (`types.xml`, `mapgrouppos.xml`, `cfglimitsdefinition.xml`), ktore definiuja co sie spawnuje, gdzie i jak czesto. Zobacz [Rozdzial 6.10](06-engine-api/10-central-economy.md).

**CfgMods** — Klasa najwyzszego poziomu w config.cpp rejestrujaca mod w silniku. Definiuje nazwe moda, katalogi skryptow, wymagane zaleznosci i kolejnosc ladowania addonow. Zobacz [Rozdzial 2.2](02-mod-structure/02-config-cpp.md).

**CfgPatches** — Klasa w config.cpp rejestrujaca poszczegolne addony (pakiety skryptow, modele, tekstury) w ramach moda. Tablica `requiredAddons[]` kontroluje kolejnosc ladowania miedzy modami. Zobacz [Rozdzial 2.2](02-mod-structure/02-config-cpp.md).

**CfgVehicles** — Hierarchia klas w config.cpp definiujaca wszystkie encje gry: przedmioty, budynki, pojazdy, zwierzeta i graczy. Mimo nazwy zawiera duzo wiecej niz tylko pojazdy. Zobacz [Rozdzial 2.2](02-mod-structure/02-config-cpp.md).

**Class.CastTo** — Metoda statyczna do bezpiecznego rzutowania w dol w Enforce Script. Zwraca `true` jesli rzutowanie sie powiodlo. Wymagana poniewaz Enforce Script nie ma slowa kluczowego `as`. Uzycie: `Class.CastTo(result, source)`. Zobacz [Rozdzial 1.9](01-enforce-script/09-casting-reflection.md).

**CommunityFramework (CF)** — Mod frameworka od Jacob_Mango zapewniajacy zarzadzanie cyklem zycia modulow, logowanie, helpery RPC, narzedzia I/O plikow i struktury danych list dwukierunkowych. Wiele popularnych modow od niego zalezy. Zobacz [Rozdzial 7.2](07-patterns/02-module-systems.md).

**config.cpp** — Centralny plik konfiguracyjny kazdego moda DayZ. Definiuje `CfgPatches`, `CfgMods`, `CfgVehicles` i inne hierarchie klas odczytywane przez silnik przy starcie. To NIE jest kod C++ mimo rozszerzenia. Zobacz [Rozdzial 2.2](02-mod-structure/02-config-cpp.md).

---

## D

**DamageSystem (System obrazen)** — Podsystem silnika obslugujacy rejestracje trafien, strefy obrazen, wartosci zdrowia/krwi/szoku i obliczenia pancerza na encjach. Konfigurowany przez klase `DamageSystem` w config.cpp ze strefami i komponentami trafien. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**DayZ Tools** — Darmowa aplikacja Steam zawierajaca oficjalny zestaw narzedzi moddingu: Object Builder, Terrain Builder, Addon Builder, TexView2, Workbench i zarzadzanie dyskiem P:. Zobacz [Rozdzial 4.5](04-file-formats/05-dayz-tools.md).

**DayZPlayer** — Klasa bazowa dla wszystkich encji graczy w silniku. Zapewnia dostep do systemow ruchu, animacji, ekwipunku i wejscia. `PlayerBase` rozszerza te klase i jest typowym punktem wejscia do moddingu. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**Dedicated Server (Serwer dedykowany)** — Samodzielny bezinterfejsowy proces serwera (`DayZServer_x64.exe`) uzywany do hostingu wieloosobowego. Uruchamia tylko skrypty serwerowe. Kontrast z [Listen Server](#l).

---

## E

**EEInit** — Metoda zdarzenia silnika wywolywana przy inicjalizacji encji po utworzeniu. Nadpisz ja w swojej klasie encji aby wykonac logike konfiguracji. Wywolywana zarowno na kliencie jak i serwerze. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**EEKilled** — Metoda zdarzenia silnika wywolywana gdy zdrowie encji osiaga zero. Uzywana do logiki smierci, dropowania lootu i sledzenia zabojstw. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**EEHitBy** — Metoda zdarzenia silnika wywolywana gdy encja otrzymuje obrazenia. Parametry obejmuja zrodlo obrazen, trafiony komponent, typ obrazen i strefy obrazen. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**EEItemAttached** — Metoda zdarzenia silnika wywolywana gdy przedmiot jest dolaczany do slotu ekwipunku encji (np. dolaczanie lunety do broni). Sparowana z `EEItemDetached`. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**Enforce Script** — Wlasny jezyk skryptowy Bohemia Interactive uzywany w DayZ i grach na silniku Enfusion. Skladnia podobna do C, zblizona do C#, ale z unikalnymi ograniczeniami (brak ternarnego, brak try/catch, brak lambd). Zobacz [Czesc 1](01-enforce-script/01-variables-types.md).

**EntityAI** — Klasa bazowa dla wszystkich "inteligentnych" encji w DayZ (gracze, zwierzeta, zombie, przedmioty). Rozszerza `Entity` o ekwipunek, system obrazen i interfejsy AI. Wiekszosc moddingu przedmiotow i postaci zaczyna sie tutaj. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**EventBus (Szyna zdarzen)** — Wzorzec publish-subscribe do oddzielonej komunikacji miedzy systemami. Moduly subskrybuja nazwane zdarzenia i otrzymuja callbacki przy ich wywoaniu, bez bezposrednich zaleznosci. Zobacz [Rozdzial 7.6](07-patterns/06-events.md).

---

## F

**File Patching (Latanie plikow)** — Parametr uruchomienia (`-filePatching`) pozwalajacy silnikowi ladowac luźne pliki z dysku P: zamiast spakowanych PBO. Niezbedny do szybkiej iteracji rozwoju. Musi byc wlaczony zarowno na kliencie jak i serwerze. Zobacz [Rozdzial 4.6](04-file-formats/06-pbo-packing.md).

**Fire Geometry** — Specjalizowany LOD w modelu 3D (`.p3d`) definiujacy powierzchnie, na ktorych moga uderzac pociski i zadawac obrazenia. Odrozniany od View Geometry i Geometry LOD. Zobacz [Rozdzial 4.2](04-file-formats/02-models.md).

---

## G

**GameInventory** — Klasa silnika zarzadzajaca systemem ekwipunku encji. Zapewnia metody dodawania, usuwania, wyszukiwania i przesylania przedmiotow miedzy pojemnikami i slotami. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**GetGame()** — Funkcja globalna zwracajaca singleton `CGame`. Punkt wejscia do dostepu do misji, graczy, kolejek wywolan, RPC, pogody i innych systemow silnika. Dostepna wszedzie w skrypcie. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**GetUApi()** — Funkcja globalna zwracajaca singleton `UAInputAPI` dla systemu wejscia. Uzywana do rejestrowania i odpytywania wlasnych skrotow klawiszowych. Zobacz [Rozdzial 6.13](06-engine-api/13-input-system.md).

**Geometry LOD** — LOD modelu 3D uzywany do fizycznej detekcji kolizji (ruch gracza, fizyka pojazdow). Oddzielny od View Geometry i Fire Geometry. Zobacz [Rozdzial 4.2](04-file-formats/02-models.md).

**Guard Clause (Klauzula ochronna)** — Wzorzec programowania defensywnego: sprawdzanie warunkow wstepnych na poczatku metody i wczesny powrot jesli sie nie powioda. Niezbedny w Enforce Script poniewaz nie ma try/catch. Zobacz [Rozdzial 1.11](01-enforce-script/11-error-handling.md).

---

## H

**Hidden Selections (Ukryte selekcje)** — Nazwane sloty tekstur/materialow na modelu 3D, ktore moga byc zamieniane w czasie wykonywania przez skrypt. Uzywane do wariantow kamuflazu, kolorow druzyn, stanow obrazen i dynamicznych zmian wygladu. Definiowane w config.cpp i nazwanych selekcjach modelu. Zobacz [Rozdzial 4.2](04-file-formats/02-models.md).

**HUD** — Heads-Up Display: elementy interfejsu na ekranie widoczne podczas rozgrywki (wskazniki zdrowia, hotbar, kompas, powiadomienia). Budowane za pomoca plikow `.layout` i skryptowanych klas widgetow. Zobacz [Rozdzial 3.1](03-gui-system/01-widget-types.md).

---

## I

**IEntity** — Interfejs encji najnizszego poziomu w silniku Enfusion. Zapewnia dostep do transformacji (pozycja/rotacja), wizualizacji i fizyki. Wiekszosc modderow pracuje z `EntityAI` lub wyzszymi klasami. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**ImageSet** — Plik XML (`.imageset`) definiujacy nazwane prostokatne regiony w atlasie tekstur (`.edds` lub `.paa`). Uzywany do odwolywania sie do ikon, grafik przyciskow i elementow UI bez oddzielnych plikow obrazow. Zobacz [Rozdzial 5.4](05-config-files/04-imagesets.md).

**InventoryLocation** — Klasa silnika opisujaca konkretna pozycje w systemie ekwipunku: ktora encja, ktory slot, ktory wiersz/kolumna cargo. Uzywana do precyzyjnej manipulacji i transferow ekwipunku. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**ItemBase** — Standardowa klasa bazowa dla wszystkich przedmiotow w grze (rozszerza `EntityAI`). Bronie, narzedzia, jedzenie, ubrania, pojemniki i akcesoria dziedzicza z `ItemBase`. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

---

## J

**JsonFileLoader** — Klasa narzedziowa silnika do ladowania i zapisywania plikow JSON w Enforce Script. Wazna uwaga: `JsonLoadFile()` zwraca `void` — musisz przekazac wcze sniej zaalokowany obiekt przez referencje, a nie przypisywac wartosc zwracana. Zobacz [Rozdzial 6.8](06-engine-api/08-file-io.md).

---

## K

**Key Signing — Podpisywanie kluczy (.bikey, .biprivatekey, .bisign)** — System weryfikacji modow DayZ. `.biprivatekey` sluzy do podpisywania PBO (tworzac pliki `.bisign`). Odpowiadajacy klucz publiczny `.bikey` umieszcza sie w folderze `keys/` serwera. Serwery laduja tylko mody, ktorych podpisy pasuja do zainstalowanego klucza. Zobacz [Rozdzial 4.6](04-file-formats/06-pbo-packing.md).

---

## L

**Layout (plik .layout)** — Plik definicji UI oparty na XML uzywany przez system GUI DayZ. Definiuje hierarchie widgetow, pozycjonowanie, wymiarowanie i wlasciwosci stylu. Ladowany w czasie wykonywania za pomoca `GetGame().GetWorkspace().CreateWidgets()`. Zobacz [Rozdzial 3.2](03-gui-system/02-layout-files.md).

**Listen Server** — Serwer hostowany wewnatrz klienta gry (gracz dziala jako serwer i klient). Przydatny do samodzielnego testowania. Niektore sciezki kodu roznia sie od serwerow dedykowanych — zawsze testuj oba. Zobacz [Rozdzial 8.1](08-tutorials/01-first-mod.md).

**LOD (Level of Detail — Poziom szczegolowosci)** — Wiele wersji modelu 3D o roznej liczbie wielokatow. Silnik przelacza miedzy nimi w zaleznosci od odleglosci kamery w celu optymalizacji wydajnosci. Modele DayZ maja rowniez specjalne LOD-y: Geometry, Fire Geometry, View Geometry, Memory i Shadow. Zobacz [Rozdzial 4.2](04-file-formats/02-models.md).

---

## M

**Managed** — Slowo kluczowe Enforce Script wskazujace klase, ktorej instancje sa liczone referencjami i automatycznie zbierane przez garbage collector. Wiekszosc klas DayZ dziedziczy z `Managed`. Kontrast z `Class` (zarzadzane recznie). Zobacz [Rozdzial 1.8](01-enforce-script/08-memory-management.md).

**Memory Point (Punkt pamieci)** — Nazwany punkt osadzony w LOD pamieci modelu 3D. Uzywany przez skrypty do lokalizowania pozycji na obiekcie (zrodlo blysku lufy, punkty mocowania, pozycje proxy). Dostepny przez `GetMemoryPointPosition()`. Zobacz [Rozdzial 4.2](04-file-formats/02-models.md).

**Mission (MissionServer / MissionGameplay)** — Kontroler stanu gry najwyzszego poziomu. `MissionServer` dziala na serwerze, `MissionGameplay` dziala na kliencie. Nadpisz je aby hookowac sie w start gry, polaczenia graczy i zamykanie. Zobacz [Rozdzial 6.11](06-engine-api/11-mission-hooks.md).

**mod.cpp** — Plik umieszczony w glownym folderze moda definiujacy metadane Steam Workshop: nazwe, autora, opis, ikone i URL akcji. Nie mylic z `config.cpp`. Zobacz [Rozdzial 2.3](02-mod-structure/03-mod-cpp.md).

**Modded Class (Klasa modowana)** — Mechanizm Enforce Script (`modded class X extends X`) do rozszerzania lub nadpisywania istniejacych klas bez modyfikowania oryginalnych plikow. Silnik laczy wszystkie definicje modowanych klas razem. Jest to glowny sposob interakcji modow z vanilla i innymi modami. Zobacz [Rozdzial 1.4](01-enforce-script/04-modded-classes.md).

**Module (Modul)** — Samodzielna jednostka funkcjonalnosci zarejestrowana w menedzerze modulow (jak CF `PluginManager`). Moduly maja metody cyklu zycia (`OnInit`, `OnUpdate`, `OnMissionFinish`) i sa standardowa architektura dla systemow modow. Zobacz [Rozdzial 7.2](07-patterns/02-module-systems.md).

---

## N

**Named Selection (Nazwana selekcja)** — Nazwana grupa wierzcholkow/scian w modelu 3D, utworzona w Object Builder. Uzywana do ukrytych selekcji (zamiana tekstur), stref obrazen i celow animacji. Zobacz [Rozdzial 4.2](04-file-formats/02-models.md).

**Net Sync Variable (Sieciowa zmienna synchronizacji)** — Zmienna automatycznie synchronizowana z serwera do wszystkich klientow przez system replikacji sieciowej silnika. Rejestrowana za pomoca metod `RegisterNetSyncVariable*()` i odbierana w `OnVariablesSynchronized()`. Zobacz [Rozdzial 6.9](06-engine-api/09-networking.md).

**notnull** — Modyfikator parametru Enforce Script informujacy kompilator, ze parametr referencyjny nie moze byc `null`. Zapewnia bezpieczenstwo kompilacji i dokumentuje intencje. Uzycie: `void DoWork(notnull MyClass obj)`. Zobacz [Rozdzial 1.3](01-enforce-script/03-classes-inheritance.md).

---

## O

**Object Builder** — Aplikacja DayZ Tools do tworzenia i edycji modeli 3D (`.p3d`). Uzywana do definiowania LOD-ow, nazwanych selekcji, punktow pamieci i komponentow geometrii. Zobacz [Rozdzial 4.5](04-file-formats/05-dayz-tools.md).

**OnInit** — Metoda cyklu zycia wywolywana przy pierwszej inicjalizacji modulu lub pluginu. Uzywana do rejestracji, subskrypcji zdarzen i jednorazowej konfiguracji. Zobacz [Rozdzial 7.2](07-patterns/02-module-systems.md).

**OnUpdate** — Metoda cyklu zycia wywolywana co klatke (lub w stalym interwale) na modulach i okreslonych encjach. Uzywaj oszczednie — kod per-klatke jest problemem wydajnosciowym. Zobacz [Rozdzial 7.7](07-patterns/07-performance.md).

**OnMissionFinish** — Metoda cyklu zycia wywolywana po zakonczeniu misji (zamkniecie serwera, rozlaczenie). Uzywana do sprzatania, zapisywania stanu i zwalniania zasobow. Zobacz [Rozdzial 6.11](06-engine-api/11-mission-hooks.md).

**Override (Nadpisanie)** — Slowo kluczowe `override` w Enforce Script oznaczajace metode zastepujaca metode klasy nadrzednej. Wymagane (lub mocno zalecane) przy nadpisywaniu metod wirtualnych. Zawsze wywoluj `super.NazwaMetody()` aby zachowac zachowanie rodzica, chyba ze celowo chcesz je pominac. Zobacz [Rozdzial 1.3](01-enforce-script/03-classes-inheritance.md).

---

## P

**P: Drive (Workdrive)** — Wirtualna litera dysku mapowana przez DayZ Tools na katalog projektu moda. Silnik uzywa sciezek `P:\` wewnetrznie do lokalizowania plikow zrodlowych podczas rozwoju. Konfigurowane przez DayZ Tools lub reczne polecenia `subst`. Zobacz [Rozdzial 4.5](04-file-formats/05-dayz-tools.md).

**PAA** — Wlasny format tekstur Bohemii (`.paa`). Konwertowany z plikow zrodlowych `.tga` lub `.png` za pomoca TexView2 lub kroku binaryzacji Addon Builder. Obsluguje kompresje DXT1, DXT5 i ARGB. Zobacz [Rozdzial 4.1](04-file-formats/01-textures.md).

**PBO** — Packed Bohemia Object (`.pbo`): format archiwum do dystrybucji zawartosci modow DayZ. Zawiera skrypty, konfiguracje, tekstury, modele i pliki danych. Budowany Addon Builderem lub narzedziami firm trzecich. Zobacz [Rozdzial 4.6](04-file-formats/06-pbo-packing.md).

**PlayerBase** — Glowna klasa encji gracza, z ktora pracuja modderzy. Rozszerza `DayZPlayer` i zapewnia dostep do ekwipunku, obrazen, efektow statusu i calej funkcjonalnosci zwiazanej z graczem. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**PlayerIdentity** — Klasa silnika zawierajaca metadane polaczonego gracza: Steam UID, nazwe, identyfikator sieciowy i ping. Dostepna po stronie serwera z `PlayerBase.GetIdentity()`. Niezbedna dla narzedzi administracyjnych i persystencji. Zobacz [Rozdzial 6.9](06-engine-api/09-networking.md).

**PPE (Post-Process Effects — Efekty postprocessingu)** — System silnika do wizualnych efektow przestrzeni ekranowej: rozmycie, korekcja kolorow, aberracja chromatyczna, winieta, ziarno filmowe. Kontrolowany przez klasy `PPERequester`. Zobacz [Rozdzial 6.5](06-engine-api/05-ppe.md).

**Print** — Wbudowana funkcja do wypisywania tekstu do logu skryptow (pliki logow w `%localappdata%/DayZ/`). Przydatna do debugowania, ale powinna byc usunieta lub zabezpieczona w kodzie produkcyjnym. Zobacz [Rozdzial 1.11](01-enforce-script/11-error-handling.md).

**Proto Native** — Funkcje zadeklarowane z `proto native` sa zaimplementowane w silniku C++, nie w skrypcie. Laczac Enforce Script z wnetrzem silnika i nie moga byc nadpisywane. Zobacz [Rozdzial 1.3](01-enforce-script/03-classes-inheritance.md).

---

## Q

**Quaternion** — Czteroskludnikowa reprezentacja rotacji uzywana wewnetrznie przez silnik. W praktyce modderzy DayZ zazwyczaj pracuja z katami Eulera (`vector` pitch/yaw/roll) a silnik konwertuje wewnetrznie. Zobacz [Rozdzial 1.7](01-enforce-script/07-math-vectors.md).

---

## R

**ref** — Slowo kluczowe Enforce Script deklarujace silna referencje do zarzadzanego obiektu. Zapobiega garbage collection dopoki referencja istnieje. Uzyj `ref` do wlasnosci; surowe referencje do niewlascicielskich wskaznikow. Uwazaj na cykle `ref` (A odwoluje sie do B, B odwoluje sie do A), ktore powoduja wycieki pamieci. Zobacz [Rozdzial 1.8](01-enforce-script/08-memory-management.md).

**requiredAddons** — Tablica w `CfgPatches` okreslajaca ktore addony musza byc zaladowane przed twoim. Kontroluje kolejnosc kompilacji skryptow i dziedziczenia konfiguracji miedzy modami. Bledne ustawienie powoduje "missing class" lub ciche niepowodzenie ladowania. Zobacz [Rozdzial 2.2](02-mod-structure/02-config-cpp.md).

**RPC (Remote Procedure Call — Zdalne wywolanie procedury)** — Mechanizm przesylania danych miedzy serwerem a klientem. DayZ zapewnia `GetGame().RPCSingleParam()` i `ScriptRPC` do wlasnej komunikacji. Wymaga odpowiedniego nadawcy i odbiorcy na wlasciwej maszynie. Zobacz [Rozdzial 6.9](06-engine-api/09-networking.md).

**RVMAT** — Plik definicji materialu (`.rvmat`) uzywany przez renderer DayZ. Okresla tekstury, shadery i wlasciwosci powierzchni dla modeli 3D. Zobacz [Rozdzial 4.3](04-file-formats/03-materials.md).

---

## S

**Scope (config)** — Wartosc calkowita w `CfgVehicles` kontrolujaca widocznosc przedmiotu: `0` = ukryty/abstrakcyjny (nigdy nie spawnuje), `1` = dostepny tylko przez skrypt, `2` = widoczny w grze i spawnowalny przez Centralna Ekonomie. Zobacz [Rozdzial 2.2](02-mod-structure/02-config-cpp.md).

**ScriptRPC** — Klasa Enforce Script do budowania i wysylania wlasnych wiadomosci RPC. Pozwala zapisywac wiele parametrow (int, float, string, vector) w jednym pakiecie sieciowym. Zobacz [Rozdzial 6.9](06-engine-api/09-networking.md).

**SEffectManager** — Menedzer singletonowy dla efektow wizualnych i dzwiekowych. Obsluguje tworzenie czasteczek, odtwarzanie dzwiekow i cykl zycia efektow. Uzyj `SEffectManager.PlayInWorld()` do efektow pozycjonowanych. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**Singleton** — Wzorzec projektowy zapewniajacy istnienie tylko jednej instancji klasy. W Enforce Script powszechnie implementowany z statyczna metoda `GetInstance()` przechowujaca instancje w zmiennej `static ref`. Zobacz [Rozdzial 7.1](07-patterns/01-singletons.md).

**Slot** — Nazwany punkt mocowania na encji (np. `"Shoulder"`, `"Hands"`, `"Slot_Magazine"`). Definiowany w config.cpp pod `InventorySlots` i tablicy `attachments[]` encji. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

**stringtable.csv** — Plik CSV zapewniajacy zlokalizowane lancuchy dla do 13 jezykow. Odwolywany w kodzie przez klucze z prefiksem `#STR_`. Silnik automatycznie wybiera poprawna kolumne jezykowa. Zobacz [Rozdzial 5.1](05-config-files/01-stringtable.md).

**super** — Slowo kluczowe uzywane wewnatrz nadpisanej metody do wywolania implementacji klasy nadrzednej. Zawsze wywoluj `super.NazwaMetody()` w nadpisanych metodach, chyba ze celowo chcesz pominac logike rodzica. Zobacz [Rozdzial 1.3](01-enforce-script/03-classes-inheritance.md).

---

## T

**TexView2** — Narzedzie DayZ Tools do przegladania i konwersji tekstur miedzy formatami `.tga`, `.png`, `.paa` i `.edds`. Uzywane rowniez do inspekcji kompresji PAA, mipmap i kanalow alfa. Zobacz [Rozdzial 4.5](04-file-formats/05-dayz-tools.md).

**typename** — Typ Enforce Script reprezentujacy referencje do klasy w czasie wykonywania. Uzywany do refleksji, wzorocow fabrycznych i dynamicznego sprawdzania typow. Uzyskiwany z instancji przez `obj.Type()` lub z nazwy klasy bezposrednio: `typename t = PlayerBase;`. Zobacz [Rozdzial 1.9](01-enforce-script/09-casting-reflection.md).

**types.xml** — Plik XML Centralnej Ekonomii definiujacy nominaln a ilosc, czas zycia, zachowanie uzupelniania, kategorie spawnu i strefy tierowe kazdego spawnowalnego przedmiotu. Znajduje sie w folderze `db/` misji. Zobacz [Rozdzial 6.10](06-engine-api/10-central-economy.md).

---

## U

**UAInput** — Klasa silnika reprezentujaca pojedyncza akcje wejsciowa (skrot klawiszowy). Tworzona z `GetUApi().RegisterInput()` i uzywana do wykrywania naciskniec, przytrzyman i zwolnien klawiszy. Definiowana razem z `inputs.xml`. Zobacz [Rozdzial 6.13](06-engine-api/13-input-system.md).

**Unlink** — Metoda do bezpiecznego niszczenia i dereferencji zarzadzanego obiektu. Preferowana nad ustawianiem na `null` gdy potrzebujesz natychmiastowego sprzatania. Wywolywana jako `GetGame().ObjectDelete(obj)` dla encji. Zobacz [Rozdzial 1.8](01-enforce-script/08-memory-management.md).

---

## V

**View Geometry** — LOD modelu 3D uzywany do testow okluzji wizualnej (sprawdzanie wzroku AI, linia widzenia gracza). Okresla czy obiekt blokuje widocznosc. Oddzielny od Geometry LOD (kolizja) i Fire Geometry (balistyka). Zobacz [Rozdzial 4.2](04-file-formats/02-models.md).

---

## W

**Widget** — Klasa bazowa dla wszystkich elementow UI w systemie GUI DayZ. Podtypy obejmuja `TextWidget`, `ImageWidget`, `ButtonWidget`, `EditBoxWidget`, `ScrollWidget` i typy kontenerowe jak `WrapSpacerWidget`. Zobacz [Rozdzial 3.1](03-gui-system/01-widget-types.md).

**Workbench** — IDE DayZ Tools do edycji skryptow, konfiguracji i uruchamiania gry w trybie deweloperskim. Zapewnia kompilacje skryptow, breakpointy i przegladarke zasobow. Zobacz [Rozdzial 4.5](04-file-formats/05-dayz-tools.md).

**WrapSpacer** — Widget kontenerowy zawijajacy swoje dzieci w wiersze/kolumny (jak CSS flexbox wrap). Niezbedny do dynamicznych list, siatek ekwipunku i kazdego layoutu gdzie liczba dzieci jest zmienna. Zobacz [Rozdzial 3.4](03-gui-system/04-containers.md).

---

## X

**XML Configs (Konfiguracje XML)** — Zbiorczy termin dla wielu plikow konfiguracyjnych XML uzywanych przez serwery DayZ: `types.xml`, `globals.xml`, `economy.xml`, `events.xml`, `cfglimitsdefinition.xml`, `mapgrouppos.xml` i inne. Zobacz [Rozdzial 6.10](06-engine-api/10-central-economy.md).

---

## Z

**Zone (Damage Zone — Strefa obrazen)** — Nazwany region na modelu encji otrzymujacy niezalezne sledzenie zdrowia. Definiowany w config.cpp pod `DamageSystem` z `class DamageZones`. Typowe strefy na graczach: `Head`, `Torso`, `LeftArm`, `LeftLeg` itp. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

---

*Brakuje terminu? Otworz issue lub wyslij pull request.*
