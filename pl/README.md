# Kompletny przewodnik po moddingu DayZ

> Kompleksowa dokumentacja moddingu DayZ — 92 rozdzialy, od zera do opublikowanego moda.

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="../pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="../de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="../ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="../es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="../fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="../ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="../zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="../cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## Kompletny indeks stron

### Czesc 1: Jezyk Enforce Script (13 rozdzialow)

| # | Rozdzial | Opis |
|---|----------|------|
| 1.1 | [Zmienne i typy](01-enforce-script/01-variables-types.md) | Typy prymitywne, deklaracja zmiennych, konwersje i wartosci domyslne |
| 1.2 | [Tablice, mapy i zbiory](01-enforce-script/02-arrays-maps-sets.md) | Kolekcje danych: array, map, set — iteracja, wyszukiwanie, sortowanie |
| 1.3 | [Klasy i dziedziczenie](01-enforce-script/03-classes-inheritance.md) | Definicja klas, dziedziczenie, konstruktory, polimorfizm |
| 1.4 | [Klasy modded](01-enforce-script/04-modded-classes.md) | System modded class, nadpisywanie metod, wywolania super |
| 1.5 | [Sterowanie przeplywem](01-enforce-script/05-control-flow.md) | If/else, switch, petle while/for, break, continue |
| 1.6 | [Operacje na lancuchach](01-enforce-script/06-strings.md) | Manipulacja lancuchami, formatowanie, wyszukiwanie, porownywanie |
| 1.7 | [Matematyka i wektory](01-enforce-script/07-math-vectors.md) | Funkcje matematyczne, wektory 3D, odleglosci, kierunki |
| 1.8 | [Zarzadzanie pamiecia](01-enforce-script/08-memory-management.md) | Zliczanie referencji, ref, zapobieganie wyciekom, cykle referencji |
| 1.9 | [Rzutowanie i refleksja](01-enforce-script/09-casting-reflection.md) | Rzutowanie typow, Class.CastTo, sprawdzanie typu w czasie wykonania |
| 1.10 | [Enumeracje i preprocesor](01-enforce-script/10-enums-preprocessor.md) | Wyliczenia, #ifdef, #define, kompilacja warunkowa |
| 1.11 | [Obsluga bledow](01-enforce-script/11-error-handling.md) | Wzorce obslugi bledow bez try/catch, guard clauses |
| 1.12 | [Czego NIE MA](01-enforce-script/12-gotchas.md) | 30+ pulapek i ograniczen jezyka Enforce Script |
| 1.13 | [Funkcje i metody](01-enforce-script/13-functions-methods.md) | Deklaracja funkcji, parametry, zwracane wartosci, static, proto |

### Czesc 2: Struktura moda (6 rozdzialow)

| # | Rozdzial | Opis |
|---|----------|------|
| 2.1 | [Hierarchia 5 warstw](02-mod-structure/01-five-layers.md) | 5 warstw skryptow DayZ i kolejnosc kompilacji |
| 2.2 | [config.cpp szczegolowo](02-mod-structure/02-config-cpp.md) | Pelna struktura config.cpp, CfgPatches, CfgMods |
| 2.3 | [mod.cpp i Workshop](02-mod-structure/03-mod-cpp.md) | Plik mod.cpp, publikowanie na Steam Workshop |
| 2.4 | [Twoj pierwszy mod](02-mod-structure/04-minimum-viable-mod.md) | Minimalny funkcjonalny mod — podstawowe pliki i struktura |
| 2.5 | [Organizacja plikow](02-mod-structure/05-file-organization.md) | Konwencje nazewnictwa, zalecana struktura folderow |
| 2.6 | [Architektura serwer/klient](02-mod-structure/06-server-client-split.md) | Rozdzielenie kodu serwera i klienta, bezpieczenstwo |

### Czesc 3: System GUI i uklad (10 rozdzialow)

| # | Rozdzial | Opis |
|---|----------|------|
| 3.1 | [Typy widgetow](03-gui-system/01-widget-types.md) | Wszystkie dostepne typy widgetow: tekst, obraz, przycisk itd. |
| 3.2 | [Format plikow layout](03-gui-system/02-layout-files.md) | Struktura plikow XML .layout dla interfejsow |
| 3.3 | [Wymiarowanie i pozycjonowanie](03-gui-system/03-sizing-positioning.md) | System wspolrzednych, flagi rozmiaru, zakotwiczenie |
| 3.4 | [Kontenery](03-gui-system/04-containers.md) | Widgety kontenerowe: WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Tworzenie programowe](03-gui-system/05-programmatic-widgets.md) | Tworzenie widgetow kodem, GetWidgetUnderCursor, SetHandler |
| 3.6 | [Obsluga zdarzen](03-gui-system/06-event-handling.md) | Callbacki UI: OnClick, OnChange, OnMouseEnter |
| 3.7 | [Style, czcionki i obrazy](03-gui-system/07-styles-fonts.md) | Dostepne czcionki, style, ladowanie obrazow |
| 3.8 | [Dialogi i okna modalne](03-gui-system/08-dialogs-modals.md) | Tworzenie dialogow, menu modalne, potwierdzenia |
| 3.9 | [Prawdziwe wzorce UI](03-gui-system/09-real-mod-patterns.md) | Wzorce UI z COT, VPP, Expansion, Dabs Framework |
| 3.10 | [Zaawansowane widgety](03-gui-system/10-advanced-widgets.md) | MapWidget, RenderTargetWidget, specjalizowane widgety |

### Czesc 4: Formaty plikow i narzedzia (8 rozdzialow)

| # | Rozdzial | Opis |
|---|----------|------|
| 4.1 | [Tekstury](04-file-formats/01-textures.md) | Formaty .paa, .edds, .tga — konwersja i uzycie |
| 4.2 | [Modele 3D](04-file-formats/02-models.md) | Format .p3d, LODy, geometria, punkty pamieci |
| 4.3 | [Materialy](04-file-formats/03-materials.md) | Pliki .rvmat, shadery, wlasciwosci powierzchni |
| 4.4 | [Dzwiek](04-file-formats/04-audio.md) | Formaty .ogg i .wss, konfiguracja dzwieku |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Przepyw pracy z oficjalnymi DayZ Tools |
| 4.6 | [Pakowanie PBO](04-file-formats/06-pbo-packing.md) | Tworzenie i ekstrakcja plikow PBO |
| 4.7 | [Przewodnik po Workbench](04-file-formats/07-workbench-guide.md) | Uzycie Workbench do edycji skryptow i assetow |
| 4.8 | [Modelowanie budynkow](04-file-formats/08-building-modeling.md) | Modelowanie budynkow z drzwiami i drabinami |

### Czesc 5: Pliki konfiguracyjne (6 rozdzialow)

| # | Rozdzial | Opis |
|---|----------|------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Lokalizacja za pomoca stringtable.csv dla 13 jezykow |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | Konfiguracja klawiszy i wlasne skroty klawiszowe |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Plik creditow moda |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | Format ImageSet dla ikon i spritow |
| 5.5 | [Konfiguracja serwera](05-config-files/05-server-configs.md) | Pliki konfiguracyjne serwera DayZ |
| 5.6 | [Konfiguracja spawnu](05-config-files/06-spawning-gear.md) | Konfiguracja poczatkowego wyposazenia i punktow spawnu |

### Czesc 6: Dokumentacja API silnika (23 rozdzialy)

| # | Rozdzial | Opis |
|---|----------|------|
| 6.1 | [System encji](06-engine-api/01-entity-system.md) | Hierarchia encji, EntityAI, ItemBase, Object |
| 6.2 | [System pojazdow](06-engine-api/02-vehicles.md) | API pojazdow, silniki, plyny, symulacja fizyki |
| 6.3 | [System pogody](06-engine-api/03-weather.md) | Sterowanie pogoda, deszcz, mgla, zachmurzenie |
| 6.4 | [System kamer](06-engine-api/04-cameras.md) | Wlasne kamery, pozycja, rotacja, przejscia |
| 6.5 | [Efekty post-processingu](06-engine-api/05-ppe.md) | PPE: rozmycie, aberracja chromatyczna, korekcja kolorow |
| 6.6 | [System powiadomien](06-engine-api/06-notifications.md) | Powiadomienia na ekranie, wiadomosci dla graczy |
| 6.7 | [Timery i CallQueue](06-engine-api/07-timers.md) | Liczniki czasu, opoznione wywolania, powtarzanie |
| 6.8 | [Plikowe I/O i JSON](06-engine-api/08-file-io.md) | Odczyt/zapis plikow, parsowanie JSON |
| 6.9 | [Siec i RPC](06-engine-api/09-networking.md) | Komunikacja sieciowa, RPC, synchronizacja klient-serwer |
| 6.10 | [Centralna ekonomia](06-engine-api/10-central-economy.md) | System lootu, kategorie, flagi, min/max |
| 6.11 | [Hooki misji](06-engine-api/11-mission-hooks.md) | Hooki misji, MissionBase, MissionServer |
| 6.12 | [System akcji](06-engine-api/12-action-system.md) | Akcje gracza, ActionBase, cele, warunki |
| 6.13 | [System wejscia](06-engine-api/13-input-system.md) | Przechwytywanie klawiszy, mapowanie, UAInput |
| 6.14 | [System gracza](06-engine-api/14-player-system.md) | PlayerBase, ekwipunek, zdrowie, stamina, statystyki |
| 6.15 | [System dzwieku](06-engine-api/15-sound-system.md) | Odtwarzanie audio, SoundOnVehicle, otoczenie |
| 6.16 | [System craftowania](06-engine-api/16-crafting-system.md) | Receptury craftowania, skladniki, wyniki |
| 6.17 | [System budowania](06-engine-api/17-construction-system.md) | Budowanie bazy, czesci konstrukcyjne, stany |
| 6.18 | [System animacji](06-engine-api/18-animation-system.md) | Animacja gracza, ID komend, callbacki |
| 6.19 | [Zapytania o teren](06-engine-api/19-terrain-queries.md) | Raycasty, pozycja na terenie, powierzchnie |
| 6.20 | [Efekty czasteczkowe](06-engine-api/20-particle-effects.md) | System czastek, emitery, efekty wizualne |
| 6.21 | [System zombie i AI](06-engine-api/21-zombie-ai-system.md) | ZombieBase, AI zarazonych, zachowanie |
| 6.22 | [Admin i serwer](06-engine-api/22-admin-server.md) | Zarzadzanie serwerem, bany, kicki, RCON |
| 6.23 | [Systemy swiata](06-engine-api/23-world-systems.md) | Pora dnia, data, funkcje swiata |

### Czesc 7: Wzorce i najlepsze praktyki (7 rozdzialow)

| # | Rozdzial | Opis |
|---|----------|------|
| 7.1 | [Wzorzec Singleton](07-patterns/01-singletons.md) | Pojedyncze instancje, globalny dostep, inicjalizacja |
| 7.2 | [Systemy modulow](07-patterns/02-module-systems.md) | Rejestracja modulow, cykl zycia, moduly CF |
| 7.3 | [Komunikacja RPC](07-patterns/03-rpc-patterns.md) | Wzorce dla bezpiecznych i wydajnych RPC |
| 7.4 | [Trwalosc konfiguracji](07-patterns/04-config-persistence.md) | Zapis/odczyt konfiguracji JSON, wersjonowanie |
| 7.5 | [Systemy uprawnien](07-patterns/05-permissions.md) | Hierarchiczne uprawnienia, wildcards, grupy |
| 7.6 | [Architektura zdarzeniowa](07-patterns/06-events.md) | Event bus, publish/subscribe, rozlaczanie |
| 7.7 | [Optymalizacja wydajnosci](07-patterns/07-performance.md) | Profilowanie, cache, pooling, redukcja RPC |

### Czesc 8: Samouczki (13 rozdzialow)

| # | Rozdzial | Opis |
|---|----------|------|
| 8.1 | [Twoj pierwszy mod (Hello World)](08-tutorials/01-first-mod.md) | Krok po kroku: stworz i zaladuj mod |
| 8.2 | [Tworzenie wlasnego przedmiotu](08-tutorials/02-custom-item.md) | Stworz przedmiot z modelem, tekstura i konfiguracja |
| 8.3 | [Budowanie panelu admina](08-tutorials/03-admin-panel.md) | UI admina z teleportem, spawnem, zarzadzaniem |
| 8.4 | [Dodawanie komend czatu](08-tutorials/04-chat-commands.md) | Wlasne komendy w czacie gry |
| 8.5 | [Uzywanie szablonu moda](08-tutorials/05-mod-template.md) | Jak uzywac oficjalnego szablonu modow DayZ |
| 8.6 | [Debugowanie i testowanie](08-tutorials/06-debugging-testing.md) | Logi, debug, narzedzia diagnostyczne |
| 8.7 | [Publikowanie na Workshop](08-tutorials/07-publishing-workshop.md) | Opublikuj swoj mod na Steam Workshop |
| 8.8 | [Budowanie HUD overlay](08-tutorials/08-hud-overlay.md) | Wlasny HUD overlay nad gra |
| 8.9 | [Profesjonalny szablon moda](08-tutorials/09-professional-template.md) | Kompletny szablon gotowy do produkcji |
| 8.10 | [Tworzenie moda pojazdu](08-tutorials/10-vehicle-mod.md) | Wlasny pojazd z fizyka i konfiguracja |
| 8.11 | [Tworzenie moda ubran](08-tutorials/11-clothing-mod.md) | Wlasne ubrania z teksturami i slotami |
| 8.12 | [Budowanie systemu handlu](08-tutorials/12-trading-system.md) | System handlu miedzy graczami/NPC |
| 8.13 | [Dokumentacja Diag Menu](08-tutorials/13-diag-menu.md) | Menu diagnostyczne do tworzenia modow |

### Szybka dokumentacja

| Strona | Opis |
|--------|------|
| [Sciagawka](cheatsheet.md) | Szybki przeglad skladni Enforce Script |
| [Szybka dokumentacja API](06-engine-api/quick-reference.md) | Najczesciej uzywane metody API silnika |
| [Slownik](glossary.md) | Definicje terminow uzywanych w moddingu DayZ |
| [FAQ](faq.md) | Czesto zadawane pytania o modding |
| [Rozwiazywanie problemow](troubleshooting.md) | 91 typowych problemow z rozwiazaniami |

---

## Autorzy

| Deweloper | Projekty | Glowne wklady |
|-----------|----------|----------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | System modulow, RPC, uprawnienia, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, UI edytora |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Rynek, grupy, znaczniki mapy, pojazdy |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Centralna ekonomia, wersjonowanie ustawien |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Zarzadzanie graczami, webhooks, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Uprawnienia, zarzadzanie serwerem |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Motywy kolorystyczne, wzorce modded class UI |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | Systemy kolorow UI, ulepszenia wizualne |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, skrypty vanilla, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | Ta wiki | Dokumentacja, tlumaczenie i organizacja |

## Licencja

Dokumentacja jest licencjonowana na [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/).
Przyklady kodu sa licencjonowane na [**MIT**](../LICENCE).
