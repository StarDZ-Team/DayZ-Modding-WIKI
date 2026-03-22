# Najczesciej zadawane pytania

[Strona glowna](./README.md) | **FAQ**

---

## Pierwsze kroki

### Q: Co potrzebuje, zeby zaczac moddowac DayZ?
**A:** Potrzebujesz Steam, DayZ (wersja retail), DayZ Tools (darmowe na Steam w sekcji Narzedzia) oraz edytor tekstu (polecamy VS Code). Doswiadczenie programistyczne nie jest scisle wymagane -- zacznij od [Rozdzialu 8.1: Twoj pierwszy mod](08-tutorials/01-first-mod.md). DayZ Tools zawiera Object Builder, Addon Builder, TexView2 i Workbench IDE.

### Q: Jakiego jezyka programowania uzywa DayZ?
**A:** DayZ uzywa **Enforce Script**, wlasnosci jezyka Bohemia Interactive. Ma skladnie podobna do C, zblizona do C#, ale z wlasnymi regulami i ograniczeniami (brak operatora ternarnego, brak try/catch, brak lambd). Zobacz [Czesc 1: Enforce Script](01-enforce-script/01-variables-types.md) po kompletny przewodnik po jezyku.

### Q: Jak skonfigurowac dysk P:?
**A:** Otworz DayZ Tools ze Steam, kliknij "Workdrive" lub "Setup Workdrive", aby zamontowac dysk P:. Tworzy to dysk wirtualny wskazujacy na twoja przestrzen robocza do moddingu, gdzie silnik szuka plikow zrodlowych podczas rozwoju. Mozesz tez uzyc polecenia `subst P: "C:\Twoja\Sciezka"` z wiersza polecen. Zobacz [Rozdzial 4.5](04-file-formats/05-dayz-tools.md).

### Q: Czy moge testowac moj mod bez dedykowanego serwera?
**A:** Tak. Uruchom DayZ z parametrem `-filePatching` i zaladowanym modem. Do szybkiego testowania uzyj Listen Server (hostowanie z menu gry). Do testowania produkcyjnego zawsze weryfikuj rowniez na dedykowanym serwerze, poniewaz niektore sciezki kodu sie roznia. Zobacz [Rozdzial 8.1](08-tutorials/01-first-mod.md).

### Q: Gdzie znajde vanilla pliki skryptowe DayZ do nauki?
**A:** Po zamontowaniu dysku P: przez DayZ Tools, vanilla skrypty sa w `P:\DZ\scripts\` zorganizowane wedlug warstw (`3_Game`, `4_World`, `5_Mission`). To jest autorytatywna referencja dla kazdej klasy silnika, metody i zdarzenia. Zobacz takze [Cheat Sheet](cheatsheet.md) i [API Quick Reference](06-engine-api/quick-reference.md).

---

## Czeste bledy i poprawki

### Q: Moj mod sie laduje, ale nic sie nie dzieje. Brak bledow w logu.
**A:** Najprawdopodobniej twoj `config.cpp` ma niepoprawny wpis `requiredAddons[]`, wiec twoje skrypty laduja sie za wczesnie lub wcale. Sprawdz, czy kazda nazwa addonu w `requiredAddons` dokladnie odpowiada istniejacej nazwie klasy `CfgPatches` (rozroznia wielkosc liter). Sprawdz log skryptow w `%localappdata%/DayZ/` pod katem cichych ostrzezen. Zobacz [Rozdzial 2.2](02-mod-structure/02-config-cpp.md).

### Q: Dostaje bledy "Cannot find variable" lub "Undefined variable".
**A:** Oznacza to zwykle odwolywanie sie do klasy lub zmiennej z wyzszej warstwy skryptowej. Nizsze warstwy (`3_Game`) nie moga widziec typow zdefiniowanych w wyzszych warstwach (`4_World`, `5_Mission`). Przenies definicje klasy do odpowiedniej warstwy lub uzyj refleksji `typename` do luznego wiazania. Zobacz [Rozdzial 2.1](02-mod-structure/01-five-layers.md).

### Q: Dlaczego `JsonFileLoader<T>.JsonLoadFile()` nie zwraca moich danych?
**A:** `JsonLoadFile()` zwraca `void`, a nie zaladowany obiekt. Musisz wstepnie zaalokowac obiekt i przekazac go jako parametr referencyjny: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Przypisanie wartosci zwracanej cicho da ci `null`. Zobacz [Rozdzial 6.8](06-engine-api/08-file-io.md).

### Q: Moje RPC jest wyslane, ale nigdy nie odebrane po drugiej stronie.
**A:** Sprawdz te czeste przyczyny: (1) ID RPC nie zgadza sie miedzy nadawca a odbiorca. (2) Wysylasz z klienta, ale nasluchujesz na kliencie (lub serwer-do-serwera). (3) Zapomniales zarejestrowac handler RPC w `OnRPC()` lub wlasnym handlerze. (4) Docelowa encja jest `null` lub nie jest zsynchronizowana sieciowo. Zobacz [Rozdzial 6.9](06-engine-api/09-networking.md) i [Rozdzial 7.3](07-patterns/03-rpc-patterns.md).

### Q: Dostaje "Error: Member already defined" w bloku else-if.
**A:** Enforce Script nie pozwala na ponowna deklaracje zmiennej w sasiadujacych blokach `else if` w tym samym zakresie. Zadeklaruj zmienna raz przed lancuchem `if`/`else` lub uzyj oddzielnych zakresow z nawiasami klamrowymi. Zobacz [Rozdzial 1.12](01-enforce-script/12-gotchas.md).

### Q: Moj layout UI nic nie wyswietla / widgety sa niewidoczne.
**A:** Czeste przyczyny: (1) Widget ma zerowy rozmiar -- sprawdz, czy szerokosc/wysokosc sa poprawnie ustawione (bez ujemnych wartosci). (2) Widget nie ma `Show(true)`. (3) Alfa koloru tekstu wynosi 0 (calkowicie przezroczysty). (4) Sciezka layoutu w `CreateWidgets()` jest bledna (nie wyrzuca bledu, po prostu zwraca `null`). Zobacz [Rozdzial 3.3](03-gui-system/03-sizing-positioning.md).

### Q: Moj mod powoduje crash przy starcie serwera.
**A:** Sprawdz: (1) Wywolywanie metod wylacznie klienckich (`GetGame().GetPlayer()`, kod UI) na serwerze. (2) Referencja `null` w `OnInit` lub `OnMissionStart` zanim swiat jest gotowy. (3) Nieskonczona rekurencja w overridzie `modded class`, gdzie zapomniano wywolac `super`. Zawsze dodawaj klauzule ochronne, poniewaz nie istnieje try/catch. Zobacz [Rozdzial 1.11](01-enforce-script/11-error-handling.md).

### Q: Znaki ukosnika wstecznego lub cudzyslowow w moich ciagach powoduja bledy parsowania.
**A:** Parser Enforce Script (CParser) nie obsluguje sekwencji ucieczki `\\` ani `\"` w literalach lancuchowych. Calkowicie unikaj ukosnikow wstecznych. Dla sciezek plikow uzywaj ukosnikow (`"my/path/file.json"`). Dla cudzyslowow w ciagach uzyj apostrofow lub konkatenacji lancuchow. Zobacz [Rozdzial 1.12](01-enforce-script/12-gotchas.md).

---

## Decyzje architektoniczne

### Q: Czym jest pieciowarstwowa hierarchia skryptow i dlaczego ma znaczenie?
**A:** Skrypty DayZ kompiluja sie w pieciu numerowanych warstwach: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Kazda warstwa moze odwolywac sie tylko do typow z tej samej lub nizszej numerowanej warstwy. Wymusza to granice architektoniczne -- wspoldzielone enumy i stale umieszczaj w `3_Game`, logike encji w `4_World`, a hooki UI/misji w `5_Mission`. Zobacz [Rozdzial 2.1](02-mod-structure/01-five-layers.md).

### Q: Powinienem uzyc `modded class` czy tworzyc nowe klasy?
**A:** Uzyj `modded class`, gdy musisz zmienic lub rozszerzyc istniejace zachowanie vanilla (dodanie metody do `PlayerBase`, hookowanie do `MissionServer`). Tworzac nowe klasy dla samodzielnych systemow, ktore nie musza niczego nadpisywac. Modowane klasy automatycznie sie lancuchuja -- zawsze wywoluj `super`, aby nie psuc innych modow. Zobacz [Rozdzial 1.4](01-enforce-script/04-modded-classes.md).

### Q: Jak powinienem organizowac kod kliencki vs. serwerowy?
**A:** Uzyj dyrektyw preprocesora `#ifdef SERVER` i `#ifdef CLIENT` dla kodu, ktory musi dzialac tylko po jednej stronie. Dla wiekszych modow podziel je na oddzielne PBO: mod kliencki (UI, renderowanie, lokalne efekty) i mod serwerowy (spawnowanie, logika, persistencja). Zapobiega to wyciekowi logiki serwerowej do klientow. Zobacz [Rozdzial 2.5](02-mod-structure/05-file-organization.md) i [Rozdzial 6.9](06-engine-api/09-networking.md).

### Q: Kiedy uzyc Singleton vs. Modul/Plugin?
**A:** Uzyj Modulu (zarejestrowanego przez `PluginManager` z CF lub wlasny system modulow), gdy potrzebujesz zarzadzania cyklem zycia (`OnInit`, `OnUpdate`, `OnMissionFinish`). Uzyj samodzielnego Singletona dla bezstanowych uslug narzediowych, ktore potrzebuja tylko globalnego dostepu. Moduly sa preferowane dla wszystkiego ze stanem lub potrzebami oczyszczania. Zobacz [Rozdzial 7.1](07-patterns/01-singletons.md) i [Rozdzial 7.2](07-patterns/02-module-systems.md).

### Q: Jak bezpiecznie przechowywac dane per-gracz, ktore przetrwaja restart serwera?
**A:** Zapisuj pliki JSON do katalogu `$profile:` serwera uzywajac `JsonFileLoader`. Jako nazwe pliku uzyj Steam UID gracza (z `PlayerIdentity.GetId()`). Laduj przy polaczeniu gracza, zapisuj przy rozlaczeniu i okresowo podczas gry. Zawsze elegancko obsluguj brakujace/uszkodzone pliki za pomoca klauzul ochronnych. Zobacz [Rozdzial 7.4](07-patterns/04-config-persistence.md) i [Rozdzial 6.8](06-engine-api/08-file-io.md).

---

## Publikacja i dystrybucja

### Q: Jak spakowac moj mod do PBO?
**A:** Uzyj Addon Builder (z DayZ Tools) lub narzedzi zewnetrznych jak PBO Manager. Wskaz go na folder zrodlowy twojego modu, ustaw poprawny prefix (odpowiadajacy prefixowi addonu w `config.cpp`) i skompiluj. Wyjsciowy plik `.pbo` trafia do folderu `Addons/` twojego modu. Zobacz [Rozdzial 4.6](04-file-formats/06-pbo-packing.md).

### Q: Jak podpisac moj mod do uzycia na serwerze?
**A:** Wygeneruj pare kluczy za pomoca DSSignFile lub DSCreateKey z DayZ Tools: to produkuje `.biprivatekey` i `.bikey`. Podpisz kazde PBO kluczem prywatnym (tworzy pliki `.bisign` obok kazdego PBO). Dystrybuuj `.bikey` administratorom serwerow do ich folderu `keys/`. Nigdy nie udostepniaj `.biprivatekey`. Zobacz [Rozdzial 4.6](04-file-formats/06-pbo-packing.md).

### Q: Jak opublikowac na Steam Workshop?
**A:** Uzyj DayZ Tools Publisher lub uploadera Steam Workshop. Potrzebujesz pliku `mod.cpp` w katalogu glownym modu definiujacego nazwe, autora i opis. Publisher przesyla twoje spakowane PBO, a Steam przypisuje Workshop ID. Aktualizuj przez ponowna publikacje z tego samego konta. Zobacz [Rozdzial 2.3](02-mod-structure/03-mod-cpp.md) i [Rozdzial 8.7](08-tutorials/07-publishing-workshop.md).

### Q: Czy moj mod moze wymagac innych modow jako zaleznosci?
**A:** Tak. W `config.cpp` dodaj nazwe klasy `CfgPatches` modu zaleznego do swojej tablicy `requiredAddons[]`. W `mod.cpp` nie ma formalnego systemu zaleznosci -- wymagane mody dokumentuj w opisie na Workshopie. Gracze musza zasubskrybowac i zaladowac wszystkie wymagane mody. Zobacz [Rozdzial 2.2](02-mod-structure/02-config-cpp.md).

---

## Zaawansowane tematy

### Q: Jak stworzyc wlasne akcje gracza (interakcje)?
**A:** Rozszerz `ActionBase` (lub podklase jak `ActionInteractBase`), zdefiniuj `CreateConditionComponents()` dla warunkow wstepnych, nadpisz `OnStart`/`OnExecute`/`OnEnd` dla logiki i zarejestruj ja w `SetActions()` na docelowej encji. Akcje obsluguja tryby ciagle (przytrzymanie) i natychmiastowe (klikniecie). Zobacz [Rozdzial 6.12](06-engine-api/12-action-system.md).

### Q: Jak dziala system obrazen dla wlasnych przedmiotow?
**A:** Zdefiniuj klase `DamageSystem` w config.cpp twojego przedmiotu z `DamageZones` (nazwane regiony) i wartosciami `ArmorType`. Kazda strefa sledzi swoje wlasne punkty zdrowia. Nadpisz `EEHitBy()` i `EEKilled()` w skrypcie dla niestandardowych reakcji na obrazenia. Silnik mapuje komponenty Fire Geometry modelu na nazwy stref. Zobacz [Rozdzial 6.1](06-engine-api/01-entity-system.md).

### Q: Jak dodac niestandardowe skroty klawiszowe do mojego modu?
**A:** Stworz plik `inputs.xml` definiujacy twoje akcje wejsciowe z domyslnymi przypisaniami klawiszy. Zarejestruj je w skrypcie przez `GetUApi().RegisterInput()`. Sprawdzaj stan za pomoca `GetUApi().GetInputByName("your_action").LocalPress()`. Dodaj zlokalizowane nazwy w `stringtable.csv`. Zobacz [Rozdzial 5.2](05-config-files/02-inputs-xml.md) i [Rozdzial 6.13](06-engine-api/13-input-system.md).

### Q: Jak zapewnic kompatybilnosc mojego modu z innymi modami?
**A:** Przestrzegaj tych zasad: (1) Zawsze wywoluj `super` w overridach modded class. (2) Uzywaj unikalnych nazw klas z prefixem modu (np. `MyMod_Manager`). (3) Uzywaj unikalnych ID RPC. (4) Nie nadpisuj metod vanilla bez wywolywania `super`. (5) Uzywaj `#ifdef` do wykrywania opcjonalnych zaleznosci. (6) Testuj z popularnymi kombinacjami modow (CF, Expansion itp.). Zobacz [Rozdzial 7.2](07-patterns/02-module-systems.md).

### Q: Jak zoptymalizowac moj mod pod katem wydajnosci serwera?
**A:** Kluczowe strategie: (1) Unikaj logiki per-klatka (`OnUpdate`) -- uzywaj timerow lub architektury zdarzeniowej. (2) Cachuj referencje zamiast wielokrotnie wywolywac `GetGame().GetPlayer()`. (3) Uzywaj guardy `GetGame().IsServer()` / `GetGame().IsClient()` do pomijania zbednego kodu. (4) Profiluj za pomoca benchmarkow `int start = TickCount(0);`. (5) Ogranicz ruch sieciowy -- grupuj RPC i uzywaj Net Sync Variables dla czestych malych aktualizacji. Zobacz [Rozdzial 7.7](07-patterns/07-performance.md).

---

*Masz pytanie, ktore nie jest tutaj ujete? Otworz issue w repozytorium.*
