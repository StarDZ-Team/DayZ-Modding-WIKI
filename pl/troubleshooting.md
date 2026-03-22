# Przewodnik rozwiazywania problemow

[Strona glowna](./README.md) | **Przewodnik rozwiazywania problemow**

---

> Gdy cos pojdzie nie tak, zacznij tutaj. Ten przewodnik jest zorganizowany wedlug **tego co widzisz** (objawu), nie wedlug systemu. Znajdz swoj problem, przeczytaj przyczyne, zastosuj rozwiazanie.

---

## Spis tresci

1. [Mod sie nie laduje](#1-mod-sie-nie-laduje)
2. [Bledy skryptow](#2-bledy-skryptow)
3. [Problemy z RPC i siecia](#3-problemy-z-rpc-i-siecia)
4. [Problemy z UI](#4-problemy-z-ui)
5. [Problemy z budowaniem i PBO](#5-problemy-z-budowaniem-i-pbo)
6. [Problemy z wydajnoscia](#6-problemy-z-wydajnoscia)
7. [Problemy z przedmiotami, pojazdami i encjami](#7-problemy-z-przedmiotami-pojazdami-i-encjami)
8. [Problemy z konfiguracja i typami](#8-problemy-z-konfiguracja-i-typami)
9. [Problemy z persistencja](#9-problemy-z-persistencja)
10. [Schematy decyzyjne](#10-schematy-decyzyjne)
11. [Szybka referencja komend debugowania](#11-szybka-referencja-komend-debugowania)
12. [Lokalizacje plikow logow](#12-lokalizacje-plikow-logow)
13. [Gdzie uzyskac pomoc](#13-gdzie-uzyskac-pomoc)

---

## 1. Mod sie nie laduje

Problemy, gdy mod sie nie pojawia, nie aktywuje lub jest odrzucany przez gre przy starcie.

| Objaw | Przyczyna | Rozwiazanie |
|-------|-----------|-------------|
| Blad "Addon requires addon X" przy starcie | Brakujacy lub niepoprawny wpis `requiredAddons[]` | Dodaj dokladna nazwe klasy `CfgPatches` zaleznosci do `requiredAddons[]`. Nazwy rozrozniaja wielkosc liter. Patrz [Rozdzial 2.2](02-mod-structure/02-config-cpp.md). |
| Mod nie jest widoczny w launcherze | Plik `mod.cpp` brakuje lub ma bledy skladni | Utworz lub napraw `mod.cpp` w katalogu glownym modu. Musi zawierac pola `name`, `author` i `dir`. Patrz [Rozdzial 2.3](02-mod-structure/03-mod-cpp.md). |
| "Config parse error" przy starcie | Blad skladni w `config.cpp` | Sprawdz brakujace sredniki po zamknieciach klas (`};`), niezamkniete nawiasy lub niezrownowaizone cudzystowy. |
| Brak wpisow w logu skryptow | Blok `CfgMods` `defs` wskazuje na zla sciezke | Zweryfikuj, ze wpis `CfgMods` w `config.cpp` ma poprawny `dir` i ze plik definicji skryptow pasuje do struktury folderow. Silnik cicho ignoruje zle sciezki. |
| Mod sie laduje, ale nic sie nie dzieje | Skrypty kompiluja sie, ale nigdy nie uruchamiaja | Sprawdz, czy twoj mod ma punkt wejscia: `modded class MissionServer` lub `MissionGameplay`, zarejestrowany modul lub plugin. Patrz [Rozdzial 7.2](07-patterns/02-module-systems.md). |
| Mod dziala tylko w trybie jednego gracza | Serwer nie ma zainstalowanego modu | Upewnij sie, ze parametr `-mod=` serwera zawiera sciezke do twojego modu, a PBO jest w folderze `@TwojMod/Addons/` serwera. |

---

## 2. Bledy skryptow

Pojawiaja sie w logu skryptow jako linie `SCRIPT (E):` lub `SCRIPT ERROR:`.

| Objaw | Przyczyna | Rozwiazanie |
|-------|-----------|-------------|
| `Null pointer access` | Dostep do zmiennej, ktora jest `null` | Dodaj sprawdzenie null przed uzyciem zmiennej: `if (myVar) { myVar.DoSomething(); }`. To najczestszy blad runtime. |
| `Cannot convert type 'X' to type 'Y'` | Bezposrednie rzutowanie miedzy niekompatybilnymi typami | Uzyj `Class.CastTo()` do bezpiecznego rzutowania: `Class.CastTo(result, source);`. Patrz [Rozdzial 1.9](01-enforce-script/09-casting-reflection.md). |
| `Undefined variable 'X'` | Literowka, zly zakres lub zla warstwa | Sprawdz najpierw pisownie. Jesli zmienna jest klasa z innego pliku, upewnij sie, ze jest zdefiniowana w tej samej lub nizszej warstwie. `3_Game` nie moze widziec typow z `4_World`. Patrz [Rozdzial 2.1](02-mod-structure/01-five-layers.md). |
| `Method 'X' not found` | Wywolanie metody, ktora nie istnieje na tej klasie | Zweryfikuj nazwe metody i sprawdz klase nadrzedna. Sprawdz vanilla skrypty w `P:\DZ\scripts\` pod katem poprawnego API. |
| `Division by zero` | Dzielenie przez zmienna rowna `0` | Dodaj guard: `if (divisor != 0) result = value / divisor;`. |
| `Redeclaration of variable 'X'` | Ta sama nazwa zmiennej zadeklarowana w sasiadujacych blokach `else if` | Zadeklaruj zmienna raz przed lancuchem `if`/`else`. Patrz [Rozdzial 1.12](01-enforce-script/12-gotchas.md). |
| `Stack overflow` | Nieskonczona rekurencja | Metoda wywoluje sama siebie bez warunku bazowego. Dodaj sprawdzenie glebokosci lub napraw rekurencyjna wywolanie. |
| `Index out of range` | Dostep do tablicy z nieprawidlowym indeksem | Zawsze sprawdzaj `array.Count()` lub uzyj `array.IsValidIndex(idx)` przed dostepem po indeksie. |
| Blad skladni bez jasnego komunikatu | Ukosnik wsteczny `\` lub cudzyslow w literale lancuchowym | CParser Enforce Script nie obsluguje `\\` ani `\"`. Uzyj ukosnikow dla sciezek. Patrz [Rozdzial 1.12](01-enforce-script/12-gotchas.md). |
| `JsonFileLoader` zwraca null | Przypisanie wartosci zwracanej `JsonLoadFile()` | `JsonLoadFile()` zwraca `void`. Pre-alokuj obiekt i przekaz go przez referencje. Patrz [Rozdzial 6.8](06-engine-api/08-file-io.md). |

---

## 3. Problemy z RPC i siecia

| Objaw | Przyczyna | Rozwiazanie |
|-------|-----------|-------------|
| RPC wyslane, ale nigdy nie odebrane | Niezgodnosc rejestracji | Nadawca i odbiorca musza zarejestrowac to samo ID RPC. Patrz [Rozdzial 6.9](06-engine-api/09-networking.md). |
| RPC odebrane, ale dane sa uszkodzone | Niezgodnosc parametrow odczytu/zapisu | Wywolania `Write()` nadawcy i `Read()` odbiorcy musza miec te same typy w tej samej kolejnosci. |
| Dane nie synchronizuja sie do klientow | Brakujacy `SetSynchDirty()` | Po zmianie zmiennej zarejestrowanej do synchronizacji wywolaj `SetSynchDirty()` na encji. |
| Dziala w trybie jednego gracza, nie na dedykowanym | Rozne sciezki kodu dla listen vs. dedykowany | Na listen serwerze klient i serwer dzialaja w jednym procesie. Zawsze testuj na dedykowanym serwerze. |
| Zalewanie RPC i lag serwera | Wysylanie RPC co klatke | Oronicuj wywolania RPC timerami. Grupuj male aktualizacje w jedno RPC. |

---

## 4. Problemy z UI

| Objaw | Przyczyna | Rozwiazanie |
|-------|-----------|-------------|
| Layout laduje sie, ale nic nie jest widoczne | Rozmiar widgetu wynosi zero | Sprawdz wartosci `hexactsize` i `vexactsize`. Bez ujemnych rozmiarow. Patrz [Rozdzial 3.3](03-gui-system/03-sizing-positioning.md). |
| `CreateWidgets()` zwraca null | Sciezka do pliku layout jest zla lub plik brakuje | Zweryfikuj sciezke do pliku `.layout` (ukosniki, bez literowek). Silnik cicho zwraca `null` przy zlych sciezkach. |
| Widgety istnieja, ale nie mozna ich kliknac | Inny widget zaslania przycisk | Sprawdz `priority` widgetu (porzadek z). Wyzszy priorytet = renderowane na wierzchu i przechwytuja wejscie jako pierwsze. |
| Wejscie gry jest zablokowane po zamknieciu UI | Wywolania `ChangeGameFocus()` sa niezrownowazone | Kazde `ChangeGameFocus(1)` musi miec odpowiadajace `ChangeGameFocus(-1)`. |
| Tekst pokazuje `#STR_some_key` dosloownie | Wpis stringtable brakuje | Dodaj klucz do `stringtable.csv`. |
| Kursor myszy nie pojawia sie | Nie wywolano `ShowUICursor()` | Wywolaj `GetGame().GetUIManager().ShowUICursor(true)` przy otwieraniu UI. |

---

## 5. Problemy z budowaniem i PBO

| Objaw | Przyczyna | Rozwiazanie |
|-------|-----------|-------------|
| PBO buduje sie poprawnie, ale mod crashuje przy ladowaniu | Blad binaryzacji `config.cpp` | Sprobuj budowac z wylaczona binaryzacja. |
| "Signature check failed" przy laczeniu z serwerem | PBO niepodpisane lub podpisane zlym kluczem | Ponownie podpisz PBO swoim kluczem prywatnym. Upewnij sie, ze serwer ma odpowiedni `.bikey`. |
| Zmiany file patchingu nie sa widoczne | Nie uzywa sie pliku diagnostycznego | File patching dziala tylko z `DayZDiag_x64.exe`, nie z retail `DayZ_x64.exe`. |
| Stara wersja modu sie laduje mimo zmian | Zcacheowane PBO lub wersja z warsztatu nadpisuje | Usun stare PBO. Sprawdz sciezke `-mod=`. |

---

## 6. Problemy z wydajnoscia

| Objaw | Przyczyna | Rozwiazanie |
|-------|-----------|-------------|
| Niskie FPS serwera (ponizej 20) | Ciezkie przetwarzanie w `OnUpdate()` | Uzyj akumulatora delta-czasu. Wykonuj logike co N sekund. Patrz [Rozdzial 7.7](07-patterns/07-performance.md). |
| Pamiec rosnie w czasie (wyciek pamieci) | Cykle referencji `ref` | Gdy dwa obiekty trzymaja `ref` na siebie, zaden nie jest zwalniany. Zrob jedna strone surowa (bez `ref`) referencja. Patrz [Rozdzial 1.8](01-enforce-script/08-memory-management.md). |
| Plik logu bardzo szybko rosnie | Nadmierne `Print()` | Usun lub guard debugowe `Print()` za `#ifdef DEVELOPER`. |

---

## 7. Problemy z przedmiotami, pojazdami i encjami

| Objaw | Przyczyna | Rozwiazanie |
|-------|-----------|-------------|
| Przedmiot nie spawnuje sie | `scope=0` w konfiguracji lub brakuje w `types.xml` | Ustaw `scope=2`. Dodaj wpis do `types.xml` serwera. |
| Przedmiot spawnuje sie, ale jest niewidoczny | Sciezka modelu (`.p3d`) jest zla | Sprawdz sciezke `model` w `CfgVehicles`. Uzywaj ukosnikow. |
| Przedmiot nie moze byc podniesiony | Niepoprawna geometria lub zly `inventorySlot` | Zweryfikuj Fire Geometry w modelu. Sprawdz `itemSize[]`. |
| Encja natychmiast usuwana po spawnie | `lifetime` wynosi zero w `types.xml` | Ustaw odpowiednia wartosc `lifetime`. |

---

## 8. Problemy z konfiguracja i typami

| Objaw | Przyczyna | Rozwiazanie |
|-------|-----------|-------------|
| Wartosci konfiguracji nie sa widoczne | Edycja zrodla przy zbinaryzowanej konfiguracji | Przebuduj PBO po zmianach konfiguracji. |
| Zmiany `types.xml` sa ignorowane | Edycja zlego pliku `types.xml` | Serwer laduje typy z `mpmissions/twoja_misja/db/types.xml`. |
| "Error loading types" przy starcie serwera | Blad skladni XML w `types.xml` | Zwaliduj XML. Czeste problemy: niezamkniete tagi, brakujace cudzyslow. |
| Plik konfiguracji JSON nie laduje sie | Niepoprawny JSON lub zla sciezka | Zwaliduj skladnie JSON. Uzyj prefiksu `$profile:`. |

---

## 9. Problemy z persistencja

| Objaw | Przyczyna | Rozwiazanie |
|-------|-----------|-------------|
| Dane gracza stracone przy restarcie | Nie zapisuje do katalogu `$profile:` | Uzyj `JsonFileLoader<T>.JsonSaveFile()` ze sciezka `$profile:`. |
| Zapisany plik jest pusty lub uszkodzony | Crash podczas zapisu | Zapisuj do pliku tymczasowego, potem zmien nazwe na docelowa sciezke. |
| Niezgodnosc `OnStoreSave`/`OnStoreLoad` | Wersja sie zmienila, ale brak migracji | Zawsze zapisuj numer wersji jako pierwszy. |

---

## 10. Schematy decyzyjne

### "Moj mod w ogole nie dziala"

1. **Sprawdz log skryptow** pod katem bledow `SCRIPT (E)`. Napraw pierwszy znaleziony blad. (Sekcja 2)
2. **Czy mod jest wymieniony w launcherze?** Jesli nie, sprawdz `mod.cpp`. (Sekcja 1)
3. **Czy log wspomina twoja klase CfgPatches?** Jesli nie, sprawdz skladnie `config.cpp` i parametr `-mod=`.
4. **Czy skrypty sie kompiluja?** Szukaj bledow kompilacji w RPT. (Sekcja 2)
5. **Czy jest punkt wejscia?** Potrzebujesz `modded class MissionServer`/`MissionGameplay`.
6. **Nadal nic?** Dodaj `Print("MY_MOD: Init reached");` w punkcie wejscia.

### "Dziala offline, ale nie na dedykowanym serwerze"

1. **Czy mod jest zainstalowany na serwerze?** Sprawdz `-mod=` i lokalizacje PBO.
2. **Kod tylko dla klienta na serwerze?** `GetGame().GetPlayer()` zwraca `null` przy inicjalizacji serwera. Dodaj guardy.
3. **RPC dzialaja?** Dodaj `Print()` po obu stronach. Sprawdz zgodnosc ID. (Sekcja 3)
4. **Synchronizacja danych?** Sprawdz `SetSynchDirty()`.
5. **Problemy z timingiem?** Listen servery ukrywaja race conditions.

### "Moje UI jest zepsute"

1. **Czy `CreateWidgets()` zwraca null?** Sciezka layoutu jest zla.
2. **Widgety istnieja, ale sa niewidoczne?** Sprawdz rozmiary (> 0, bez ujemnych). Sprawdz `Show(true)`.
3. **Widoczne, ale nieklikalne?** Sprawdz `priority` widgetu.
4. **Wejscie zablokowane po zamknieciu UI?** Wywolania `ChangeGameFocus()` sa niezrownowazone.

---

## 11. Szybka referencja komend debugowania

| Akcja | Komenda |
|-------|---------|
| Spawn przedmiotu na ziemi | `GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition());` |
| Teleport na wspolrzedne | `GetGame().GetPlayer().SetPosition("6543 0 2114".ToVector());` |
| Pelne leczenie | `GetGame().GetPlayer().SetHealth("", "", 5000);` |
| Ustawienie poludnia | `GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);` |
| Ustawienie nocy | `GetGame().GetWorld().SetDate(2024, 9, 15, 2, 0);` |
| Czysta pogoda | `GetGame().GetWeather().GetOvercast().Set(0,0,0); GetGame().GetWeather().GetRain().Set(0,0,0);` |
| Drukowanie pozycji | `Print(GetGame().GetPlayer().GetPosition());` |
| Sprawdzenie serwer/klient | `Print("IsServer: " + GetGame().IsServer().ToString());` |

**Popularne lokacje Chernarus:** Elektro `"10570 0 2354"`, Cherno `"6649 0 2594"`, NWAF `"4494 0 10365"`, Tisy `"1693 0 13575"`, Berezino `"12121 0 9216"`

### Parametry uruchamiania

| Parametr | Przeznaczenie |
|----------|---------------|
| `-filePatching` | Ladowanie rozpakowanych plikow (wymaga DayZDiag) |
| `-scriptDebug=true` | Wlaczenie funkcji debugowania skryptow |
| `-doLogs` | Wlaczenie szczegolowego logowania |
| `-profiles=<sciezka>` | Niestandardowy katalog profilu/logow |
| `-connect=<ip>` | Automatyczne laczenie z serwerem |
| `-port=<port>` | Port serwera (domyslnie 2302) |
| `-mod=@Mod1;@Mod2` | Ladowanie modow (rozdzielone srednikiem) |
| `-serverMod=@Mod` | Mody wylacznie serwerowe |

---

## 12. Lokalizacje plikow logow

### Logi klienckie

| Log | Lokalizacja | Zawartosc |
|-----|-------------|-----------|
| Log skryptow | `%localappdata%\DayZ\` (najnowszy plik `.RPT`) | Bledy skryptow, ostrzezenia, wynik `Print()` |
| Zrzuty crashow | `%localappdata%\DayZ\` (pliki `.mdmp`) | Dane do analizy crashow |

### Logi serwerowe

| Log | Lokalizacja | Zawartosc |
|-----|-------------|-----------|
| Log skryptow | `<server_root>\profiles\` (najnowszy plik `.RPT`) | Bledy skryptow, serwerowe `Print()` |
| Log administratora | `<server_root>\profiles\` (plik `.ADM`) | Polaczenia graczy, zabicia, chat |

### Efektywne czytanie logow

- Szukaj `SCRIPT (E)` aby znalezc bledy skryptow
- Szukaj nazwy swojego modu lub nazw klas aby filtrowac istotne wpisy
- Bledy czesto sie kaskaduja -- napraw **pierwszy** blad w logu, nie ostatni

---

## 13. Gdzie uzyskac pomoc

### Zasoby spolecznosci

| Zasob | URL | Najlepszy do |
|-------|-----|-------------|
| DayZ Modding Discord | `discord.gg/dayzmods` | Pomoc w czasie rzeczywistym |
| Fora Bohemia Interactive | `forums.bohemia.net/forums/forum/231-dayz-modding/` | Oficjalne fora |
| DayZ Workshop | Steam Workshop (DayZ) | Przegladanie opublikowanych modow |

### Referencyjny kod zrodlowy

| Mod | Czego sie nauczysz |
|-----|---------------------|
| **Community Framework (CF)** | Cykl zycia modulow, zarzadzanie RPC, logowanie |
| **DayZ Expansion** | Architektura duzych modow, system rynku, pojazdy |
| **Community Online Tools (COT)** | Narzedzia administracyjne, uprawnienia, wzorce UI |
| **VPP Admin Tools** | Administracja serwera, uprawnienia, ESP |
| **Dabs Framework** | Wzorzec MVC, wiazanie danych, framework komponentow UI |

### Vanilla referencja skryptow

- Zamontuj dysk P: przez DayZ Tools
- Przejdz do `P:\DZ\scripts\`
- Zorganizowane wedlug warstw: `3_Game/`, `4_World/`, `5_Mission/`

---

*Problem nadal nierozwiazany? Sprawdz [FAQ](faq.md), [Cheat Sheet](cheatsheet.md), lub zapytaj na DayZ Modding Discord.*
