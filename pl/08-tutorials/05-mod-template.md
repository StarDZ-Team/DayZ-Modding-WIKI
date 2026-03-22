# Rozdzial 8.5: Uzycie szablonu moda DayZ

> **Podsumowanie:** Ten poradnik pokazuje, jak uzyc open-source'owego szablonu moda DayZ od InclementDaba, aby w kilka sekund uruchomic nowy projekt moda. Zamiast tworzyc kazdy plik od zera, klonujesz gotowy szkielet, ktory juz zawiera poprawna strukture folderow, config.cpp, mod.cpp i stuby warstw skryptow. Nastepnie zmieniasz nazwe kilku rzeczy i od razu zaczynasz pisac kod.

---

## Spis tresci

- [Czym jest szablon moda DayZ?](#czym-jest-szablon-moda-dayz)
- [Co zawiera szablon](#co-zawiera-szablon)
- [Krok 1: Klonowanie lub pobranie szablonu](#krok-1-klonowanie-lub-pobranie-szablonu)
- [Krok 2: Zrozumienie struktury plikow](#krok-2-zrozumienie-struktury-plikow)
- [Krok 3: Zmiana nazwy moda](#krok-3-zmiana-nazwy-moda)
- [Krok 4: Aktualizacja config.cpp](#krok-4-aktualizacja-configcpp)
- [Krok 5: Aktualizacja mod.cpp](#krok-5-aktualizacja-modcpp)
- [Krok 6: Zmiana nazw folderow i plikow skryptow](#krok-6-zmiana-nazw-folderow-i-plikow-skryptow)
- [Krok 7: Budowanie i testowanie](#krok-7-budowanie-i-testowanie)
- [Integracja z DayZ Tools i Workbench](#integracja-z-dayz-tools-i-workbench)
- [Szablon vs. reczna konfiguracja](#szablon-vs-reczna-konfiguracja)
- [Nastepne kroki](#nastepne-kroki)

---

## Czym jest szablon moda DayZ?

**Szablon moda DayZ** to open-source'owe repozytorium prowadzone przez InclementDaba, ktore zapewnia kompletny, gotowy do uzycia szkielet moda DayZ:

**Repozytorium:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Zamiast tworzyc kazdy plik recznie (jak opisano w [Rozdziale 8.1: Twoj pierwszy mod](01-first-mod.md)), szablon daje ci gotowa strukture katalogow z calym boilerplate'em. Klonujesz go, zmieniasz kilka identyfikatorow i mozesz zaczac pisac logike gry.

To zalecany punkt wyjscia dla kazdego, kto juz zbudowal mod Hello World i chce przejsc do bardziej zlozonych projektow.

---

## Co zawiera szablon

Szablon zawiera wszystko, czego mod DayZ potrzebuje do kompilacji i zaladowania:

| Plik / folder | Przeznaczenie |
|---------------|---------------|
| `mod.cpp` | Metadane moda (nazwa, autor, wersja) wyswietlane w launcherze DayZ |
| `config.cpp` | Deklaracje CfgPatches i CfgMods rejestrujace mod w silniku |
| `Scripts/3_Game/` | Stuby skryptow warstwy gry (enumy, stale, klasy konfiguracyjne) |
| `Scripts/4_World/` | Stuby skryptow warstwy swiata (encje, menedzery, interakcje ze swiatem) |
| `Scripts/5_Mission/` | Stuby skryptow warstwy misji (UI, hooki misji) |
| `.gitignore` | Wstepnie skonfigurowane ignorowania dla DayZ (PBO, logi, pliki tymczasowe) |

Szablon stosuje standardowa 5-warstwowa hierarchie skryptow udokumentowana w [Rozdziale 2.1: Pieciowarstwowa hierarchia skryptow](../02-mod-structure/01-five-layers.md). Wszystkie trzy warstwy skryptow sa podlaczone w config.cpp, wiec mozesz natychmiast umieszczac kod w dowolnej warstwie bez dodatkowej konfiguracji.

---

## Krok 1: Klonowanie lub pobranie szablonu

### Opcja A: Uzycie funkcji GitHuba "Use this template"

1. Przejdz do [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Kliknij zielony przycisk **"Use this template"** na gorze repozytorium
3. Wybierz **"Create a new repository"**
4. Nazwij swoje repozytorium (np. `MyAwesomeMod`)
5. Sklonuj nowe repozytorium na dysk P:

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### Opcja B: Bezposrednie klonowanie

Jesli nie potrzebujesz wlasnego repozytorium GitHub, sklonuj szablon bezposrednio:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Opcja C: Pobranie jako ZIP

1. Przejdz do strony repozytorium
2. Kliknij **Code**, a nastepnie **Download ZIP**
3. Rozpakuj ZIP do `P:\MyAwesomeMod\`

---

## Krok 2: Zrozumienie struktury plikow

Po sklonowaniu katalog twojego moda wyglada tak:

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (skrypty warstwy gry)
        4_World\
            ModName\
                (skrypty warstwy swiata)
        5_Mission\
            ModName\
                (skrypty warstwy misji)
```

### Jak poszczegolne czesci pasuja do siebie

**`mod.cpp`** to karta identyfikacyjna twojego moda. Kontroluje to, co gracze widza na liscie modow w launcherze DayZ. Wszystkie dostepne pola znajdziesz w [Rozdziale 2.3: mod.cpp i Workshop](../02-mod-structure/03-mod-cpp.md).

**`Scripts/config.cpp`** to najwazniejszy plik. Mowi silnikowi DayZ:
- Od czego twoj mod zalezy (`CfgPatches.requiredAddons[]`)
- Gdzie znajduja sie poszczegolne warstwy skryptow (`CfgMods.class defs`)
- Jakie definicje preprocesora ustawic (`defines[]`)

Pelna referencje znajdziesz w [Rozdziale 2.2: config.cpp -- szczegolowo](../02-mod-structure/02-config-cpp.md).

**`Scripts/3_Game/`** laduje sie jako pierwsza. Umieszczaj tu enumy, stale, identyfikatory RPC, klasy konfiguracyjne i wszystko, co nie odwoluje sie do encji swiata.

**`Scripts/4_World/`** laduje sie jako druga. Umieszczaj tu klasy encji (`modded class ItemBase`), menedzery i wszystko, co wchodzi w interakcje z obiektami gry.

**`Scripts/5_Mission/`** laduje sie jako ostatnia. Umieszczaj tu hooki misji (`modded class MissionServer`), panele UI i logike startowa. Ta warstwa moze odwolywac sie do typow ze wszystkich nizszych warstw.

---

## Krok 3: Zmiana nazwy moda

Szablon jest dostarczany z tymczasowymi nazwami. Musisz je zamienic na rzeczywista nazwe swojego moda. Oto systematyczne podejscie.

### Wybierz swoje nazwy

Zanim zaczniesz edytowac, zdecyduj o:

| Identyfikator | Przyklad | Uzywany w |
|---------------|----------|-----------|
| **Nazwa wyswietlana moda** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Nazwa katalogu** | `MyAwesomeMod` | Nazwa folderu, sciezki config.cpp |
| **Klasa CfgPatches** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **Klasa CfgMods** | `MyAwesomeMod` | config.cpp CfgMods |
| **Podfolder skryptow** | `MyAwesomeMod` | Wewnatrz 3_Game/, 4_World/, 5_Mission/ |
| **Definicja preprocesora** | `MYAWESOMEMOD` | config.cpp defines[], sprawdzenia #ifdef |

### Zasady nazewnictwa

- **Bez spacji i znakow specjalnych** w nazwach katalogow i klas. Uzywaj PascalCase lub podkreslnikow.
- **Nazwy klas CfgPatches musza byc globalnie unikalne.** Dwa mody z ta sama nazwa klasy CfgPatches beda w konflikcie. Uzywaj nazwy moda jako prefiksu.
- **Nazwy podfolderow skryptow** wewnatrz kazdej warstwy powinny odpowiadac nazwie moda dla spojnosci.

---

## Krok 4: Aktualizacja config.cpp

Otworz `Scripts/config.cpp` i zaktualizuj nastepujace sekcje.

### CfgPatches

Zamien nazwe klasy szablonu na wlasna:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Twoja unikalna nazwa patcha
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Zaleznosc od podstawowej gry
        };
    };
};
```

Jesli twoj mod zalezy od innego moda, dodaj jego nazwe klasy CfgPatches do `requiredAddons[]`:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Zalezy od Community Framework
};
```

### CfgMods

Zaktualizuj tozsamosc moda i sciezki do skryptow:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**Kluczowe punkty:**
- Wartosc `dir` musi dokladnie odpowiadac nazwie folderu glownego moda.
- Kazda sciezka w `files[]` jest wzgledna do korzenia moda.
- Tablica `dependencies[]` powinna wymieniac, do ktorych waniliowych modulow skryptow sie podpinasz. Wiekszosc modow uzywa wszystkich trzech: `"Game"`, `"World"` i `"Mission"`.

### Definicje preprocesora (opcjonalne)

Jesli chcesz, zeby inne mody mogly wykryc obecnosc twojego moda, dodaj tablice `defines[]`:

```cpp
class MyAwesomeMod
{
    // ... (pozostale pola powyzej)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... inne moduly ...
    };

    // Wlacz wykrywanie miedzy modami
    defines[] = { "MYAWESOMEMOD" };
};
```

Inne mody moga nastepnie uzyc `#ifdef MYAWESOMEMOD` do warunkowej kompilacji kodu integrujacego sie z twoim modem.

---

## Krok 5: Aktualizacja mod.cpp

Otworz `mod.cpp` w katalogu glownym i zaktualizuj go informacjami o swoim modzie:

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "Krotki opis tego, co robi twoj mod.";
picture      = "";             // Opcjonalnie: sciezka do obrazu podgladu
logo         = "";             // Opcjonalnie: sciezka do logo
logoSmall    = "";             // Opcjonalnie: sciezka do malego logo
logoOver     = "";             // Opcjonalnie: sciezka do logo po najechaniu
tooltip      = "My Awesome Mod";
action       = "";             // Opcjonalnie: URL strony moda
```

Minimalnie ustaw `name`, `author` i `overview`. Pozostale pola sa opcjonalne, ale poprawiaja prezentacje w launcherze.

---

## Krok 6: Zmiana nazw folderow i plikow skryptow

Zmien nazwy podfolderow skryptow wewnatrz kazdej warstwy, aby odpowiadaly nazwie moda:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Wewnatrz tych folderow zmien nazwy wszelkich tymczasowych plikow `.c` i zaktualizuj ich nazwy klas. Na przyklad, jesli szablon zawiera plik `ModInit.c` z klasa o nazwie `ModInit`, zmien go na `MyAwesomeModInit.c` i zaktualizuj klase:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## Krok 7: Budowanie i testowanie

### Uzycie File Patching (szybka iteracja)

Najszybszy sposob testowania podczas tworzenia:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

To laduje twoje skrypty bezposrednio z folderow zrodlowych bez pakowania PBO. Edytuj plik `.c`, zrestartuj gre i natychmiast zobacz zmiany.

### Uzycie Addon Buildera (do dystrybucji)

Gdy jestes gotowy do dystrybucji:

1. Otworz **DayZ Tools** ze Steam
2. Uruchom **Addon Builder**
3. Ustaw **Source directory** na `P:\MyAwesomeMod\Scripts\`
4. Ustaw **Output directory** na `P:\@MyAwesomeMod\Addons\`
5. Ustaw **Prefix** na `MyAwesomeMod\Scripts`
6. Kliknij **Pack**

Nastepnie skopiuj `mod.cpp` obok folderu `Addons`:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Weryfikacja w script logu

Po uruchomieniu sprawdz script log pod katem swoich wiadomosci:

```
%localappdata%\DayZ\script_<data>_<czas>.log
```

Szukaj tagu prefiksu swojego moda (np. `[MyAwesomeMod]`).

---

## Integracja z DayZ Tools i Workbench

### Workbench

DayZ Workbench moze otwierac i edytowac skrypty twojego moda z podswietlaniem skladni:

1. Otworz **Workbench** z DayZ Tools
2. Przejdz do **File > Open** i nawiguj do folderu `Scripts/` twojego moda
3. Otworz dowolny plik `.c` do edycji z podstawowa obsluga Enforce Script

Workbench czyta `config.cpp`, aby zrozumiec, ktore pliki naleza do ktorego modulu skryptow, wiec poprawnie skonfigurowany config.cpp jest niezbedny.

### Konfiguracja dysku P:

Szablon jest zaprojektowany do pracy z dysku P:. Jesli klonowales do innej lokalizacji, stworz junction:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

To udostepnia mod pod `P:\MyAwesomeMod` bez przenoszenia plikow.

### Automatyzacja Addon Buildera

Do powtarzalnych budowan mozesz stworzyc plik batch w korzeniu moda:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Budowanie zakonczone.
pause
```

---

## Szablon vs. reczna konfiguracja

| Aspekt | Szablon | Recznie (Rozdzial 8.1) |
|--------|---------|------------------------|
| **Czas do pierwszego builda** | ~2 minuty | ~15 minut |
| **Wszystkie 3 warstwy skryptow** | Wstepnie skonfigurowane | Dodajesz w miare potrzeb |
| **config.cpp** | Kompletny ze wszystkimi modulami | Minimalny (tylko misja) |
| **Gotowosc Git** | .gitignore dolaczony | Tworzysz wlasny |
| **Wartosc edukacyjna** | Nizsza (pliki gotowe) | Wyzsza (budujesz wszystko sam) |
| **Zalecany dla** | Doswiadczonych modderow, nowych projektow | Poczatkujacych uczacych sie podstaw |

**Zalecenie:** Jesli to twoj pierwszy mod DayZ, zacznij od [Rozdzialu 8.1](01-first-mod.md), zeby zrozumiec kazdy plik. Gdy poczujesz sie pewnie, uzywaj szablonu do wszystkich przyszlych projektow.

---

## Nastepne kroki

Z modem opartym na szablonie dzialajacym, mozesz:

1. **Dodac niestandardowy przedmiot** -- Postepuj wedlug [Rozdzialu 8.2: Tworzenie niestandardowego przedmiotu](02-custom-item.md), aby zdefiniowac przedmioty w config.cpp.
2. **Zbudowac panel admina** -- Postepuj wedlug [Rozdzialu 8.3: Budowanie panelu admina](03-admin-panel.md) dla UI zarzadzania serwerem.
3. **Dodac komendy czatu** -- Postepuj wedlug [Rozdzialu 8.4: Dodawanie komend czatu](04-chat-commands.md) dla komend tekstowych w grze.
4. **Przestudiowac config.cpp szczegolowo** -- Przeczytaj [Rozdzial 2.2: config.cpp -- szczegolowo](../02-mod-structure/02-config-cpp.md), aby zrozumiec kazde pole.
5. **Poznac opcje mod.cpp** -- Przeczytaj [Rozdzial 2.3: mod.cpp i Workshop](../02-mod-structure/03-mod-cpp.md) o publikowaniu na Workshop.
6. **Dodac zaleznosci** -- Jesli twoj mod uzywa Community Framework lub innego moda, zaktualizuj `requiredAddons[]` i zobacz [Rozdzial 2.4: Twoj pierwszy mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Poprzedni:** [Rozdzial 8.4: Dodawanie komend czatu](04-chat-commands.md) | [Strona glowna](../../README.md)
