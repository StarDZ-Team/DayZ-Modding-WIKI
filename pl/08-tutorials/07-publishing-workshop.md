# Rozdział 8.7: Publikacja w Steam Workshop

[Strona główna](../../README.md) | [<< Poprzedni: Debugowanie i testowanie](06-debugging-testing.md) | **Publikacja w Steam Workshop** | [Następny: Budowanie nakładki HUD >>](08-hud-overlay.md)

---

> **Podsumowanie:** Twój mod jest zbudowany, przetestowany i gotowy na świat. Ten poradnik przeprowadzi Cię przez cały proces publikacji od początku do końca: przygotowanie folderu moda, podpisywanie PBO dla kompatybilności wieloosobowej, tworzenie elementu Steam Workshop, przesyłanie przez DayZ Tools lub wiersz poleceń oraz utrzymywanie aktualizacji w czasie. Na końcu twój mod będzie na żywo w Workshop i grywalny dla każdego.

---

## Spis treści

- [Wprowadzenie](#introduction)
- [Lista kontrolna przed publikacją](#pre-publishing-checklist)
- [Krok 1: Przygotuj folder moda](#step-1-prepare-your-mod-folder)
- [Krok 2: Napisz kompletny mod.cpp](#step-2-write-a-complete-modcpp)
- [Krok 3: Przygotuj logo i obrazy podglądu](#step-3-prepare-logo-and-preview-images)
- [Krok 4: Wygeneruj parę kluczy](#step-4-generate-a-key-pair)
- [Krok 5: Podpisz swoje PBO](#step-5-sign-your-pbos)
- [Krok 6: Publikuj przez DayZ Tools Publisher](#step-6-publish-via-dayz-tools-publisher)
- [Publikacja przez wiersz poleceń (alternatywa)](#publishing-via-command-line-alternative)
- [Aktualizowanie moda](#updating-your-mod)
- [Najlepsze praktyki zarządzania wersjami](#version-management-best-practices)
- [Najlepsze praktyki strony Workshop](#workshop-page-best-practices)
- [Przewodnik dla operatorów serwerów](#guide-for-server-operators)
- [Dystrybucja bez Workshop](#distribution-without-the-workshop)
- [Częste problemy i rozwiązania](#common-problems-and-solutions)
- [Pełny cykl życia moda](#the-complete-mod-lifecycle)
- [Następne kroki](#next-steps)

---

## Wprowadzenie

Publikacja w Steam Workshop to ostatni krok w podróży moddingu DayZ. Wszystko, czego nauczyłeś się w poprzednich rozdziałach, kulminuje tutaj. Gdy twój mod znajdzie się w Workshop, każdy gracz DayZ może go subskrybować, pobrać i z nim grać. Ten rozdział obejmuje cały proces: przygotowanie moda, podpisywanie PBO, przesyłanie i utrzymywanie aktualizacji.

---

## Lista kontrolna przed publikacją

Zanim cokolwiek przesłasz, przejdź tę listę. Pomijanie elementów tutaj powoduje najczęstsze problemy po publikacji.

- [ ] Wszystkie funkcje przetestowane na **serwerze dedykowanym** (nie tylko w grze jednoosobowej)
- [ ] Przetestowano tryb wieloosobowy: inny klient może dołączyć i korzystać z funkcji moda
- [ ] Brak błędów krytycznych w logach skryptów (`DayZDiag_x64.RPT` lub `script_*.log`)
- [ ] Wszystkie instrukcje `Print()` debugowania usunięte lub opakowane w `#ifdef DEVELOPER`
- [ ] Brak zakodowanych na stałe wartości testowych lub pozostałości kodu eksperymentalnego
- [ ] `stringtable.csv` zawiera wszystkie ciągi znaków skierowane do użytkownika z tłumaczeniami
- [ ] `credits.json` wypełniony informacjami o autorze i współtwórcach
- [ ] Obraz logo przygotowany (patrz [Krok 3](#step-3-prepare-logo-and-preview-images) dla rozmiarów)
- [ ] Wszystkie tekstury przekonwertowane do formatu `.paa` (nie surowe `.png`/`.tga` w PBO)
- [ ] Opis Workshop i instrukcje instalacji napisane
- [ ] Dziennik zmian rozpoczęty (nawet jeśli tylko "1.0.0 - Pierwsze wydanie")

---

## Krok 1: Przygotuj folder moda

Twój końcowy folder moda musi dokładnie odpowiadać oczekiwanej strukturze DayZ.

### Wymagana struktura

```
@MyMod/
├── addons/
│   ├── MyMod_Scripts.pbo
│   ├── MyMod_Scripts.pbo.MyMod.bisign
│   ├── MyMod_Data.pbo
│   └── MyMod_Data.pbo.MyMod.bisign
├── keys/
│   └── MyMod.bikey
├── mod.cpp
└── meta.cpp  (generowany automatycznie przez DayZ Launcher przy pierwszym załadowaniu)
```

### Opis folderów

| Folder / Plik | Przeznaczenie |
|---------------|---------|
| `addons/` | Zawiera wszystkie pliki `.pbo` (spakowana zawartość moda) i ich pliki podpisów `.bisign` |
| `keys/` | Zawiera klucz publiczny (`.bikey`), którego serwery używają do weryfikacji twoich PBO |
| `mod.cpp` | Metadane moda: nazwa, autor, wersja, opis, ścieżki ikon |
| `meta.cpp` | Generowany automatycznie przez DayZ Launcher; zawiera ID Workshop po publikacji |

### Ważne zasady

- Nazwa folderu **musi** zaczynać się od `@`. W ten sposób DayZ identyfikuje katalogi modów.
- Każde `.pbo` w `addons/` musi mieć pasujący plik `.bisign` obok siebie.
- Plik `.bikey` w `keys/` musi odpowiadać kluczowi prywatnemu użytemu do tworzenia plików `.bisign`.
- **Nie** umieszczaj plików źródłowych (skrypty `.c`, surowe tekstury, projekty Workbench) w folderze do przesłania. Tylko spakowane PBO należą tutaj.

---

## Krok 2: Napisz kompletny mod.cpp

Plik `mod.cpp` informuje DayZ i launcher o wszystkim dotyczącym twojego moda. Niekompletny `mod.cpp` powoduje brakujące ikony, puste opisy i problemy z wyświetlaniem.

### Pełny przykład mod.cpp

```cpp
name         = "My Awesome Mod";
picture      = "MyMod/Data/Textures/logo_co.paa";
logo         = "MyMod/Data/Textures/logo_co.paa";
logoSmall    = "MyMod/Data/Textures/logo_small_co.paa";
logoOver     = "MyMod/Data/Textures/logo_co.paa";
tooltip      = "My Awesome Mod - Adds cool features to DayZ";
overview     = "A comprehensive mod that adds new items, mechanics, and UI elements to DayZ.";
author       = "YourName";
overviewPicture = "MyMod/Data/Textures/overview_co.paa";
action       = "https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_WORKSHOP_ID";
version      = "1.0.0";
versionPath  = "MyMod/Data/version.txt";
```

### Referencja pól

| Pole | Wymagane | Opis |
|-------|----------|-------------|
| `name` | Tak | Nazwa wyświetlana na liście modów DayZ Launcher |
| `picture` | Tak | Ścieżka do głównego obrazu logo (wyświetlany w launcherze). Względna do dysku P: lub głównego folderu moda |
| `logo` | Tak | To samo co picture w większości przypadków; używany w niektórych kontekstach UI |
| `logoSmall` | Nie | Mniejsza wersja logo dla widoków kompaktowych |
| `logoOver` | Nie | Stan najechania logo (często ten sam co `logo`) |
| `tooltip` | Tak | Krótki jednoliniowy opis wyświetlany po najechaniu w launcherze |
| `overview` | Tak | Dłuższy opis wyświetlany w panelu szczegółów moda |
| `author` | Tak | Twoje imię/nick lub nazwa zespołu |
| `overviewPicture` | Nie | Duży obraz wyświetlany w panelu przeglądu moda |
| `action` | Nie | URL otwierany, gdy gracz kliknie "Website" (zazwyczaj strona Workshop lub GitHub) |
| `version` | Tak | Aktualny ciąg wersji (np. `"1.0.0"`) |
| `versionPath` | Nie | Ścieżka do pliku tekstowego z numerem wersji (dla automatycznych buildów) |

### Częste błędy

- **Brakujące średniki** na końcu każdej linii. Każda linia musi kończyć się `;`.
- **Złe ścieżki obrazów.** Ścieżki są względne do korzenia dysku P: podczas budowania. Po spakowaniu ścieżka powinna odzwierciedlać prefiks PBO. Przetestuj, ładując mod lokalnie przed przesłaniem.
- **Zapomnienie o aktualizacji wersji** przed ponownym przesłaniem. Zawsze zwiększaj ciąg wersji.

---

## Krok 3: Przygotuj logo i obrazy podglądu

### Wymagania obrazów

| Obraz | Rozmiar | Format | Zastosowanie |
|-------|------|--------|----------|
| Logo moda (`picture` / `logo`) | 512 x 512 px | `.paa` (w grze) | Lista modów DayZ Launcher |
| Małe logo (`logoSmall`) | 128 x 128 px | `.paa` (w grze) | Kompaktowe widoki launchera |
| Podgląd Steam Workshop | 512 x 512 px | `.png` lub `.jpg` | Miniatura strony Workshop |
| Obraz przeglądu | 1024 x 512 px | `.paa` (w grze) | Panel szczegółów moda |

### Konwertowanie obrazów do PAA

DayZ używa wewnętrznie tekstur `.paa`. Aby przekonwertować obrazy PNG/TGA:

1. Otwórz **TexView2** (dołączony do DayZ Tools)
2. File > Open twój obraz `.png` lub `.tga`
3. File > Save As > wybierz format `.paa`
4. Zapisz do katalogu `Data/Textures/` twojego moda

Addon Builder może również automatycznie konwertować tekstury podczas pakowania PBO, jeśli jest skonfigurowany do binaryzacji.

### Wskazówki

- Używaj wyraźnej, rozpoznawalnej ikony, która dobrze czyta się w małych rozmiarach.
- Ogranicz tekst na logach do minimum -- staje się nieczytelny w 128x128.
- Obraz podglądu Steam Workshop (`.png`/`.jpg`) jest oddzielony od logo w grze (`.paa`). Przesyłasz go przez Publisher.

---

## Krok 4: Wygeneruj parę kluczy

Podpisywanie kluczem jest **niezbędne** dla trybu wieloosobowego. Prawie wszystkie publiczne serwery włączają weryfikację podpisów, więc bez prawidłowych podpisów gracze zostaną wyrzuceni podczas dołączania z twoim modem.

### Jak działa podpisywanie kluczem

- Tworzysz **parę kluczy**: `.biprivatekey` (prywatny) i `.bikey` (publiczny)
- Podpisujesz każde `.pbo` kluczem prywatnym, tworząc plik `.bisign`
- Dystrybuujesz `.bikey` z modem; operatorzy serwerów umieszczają go w folderze `keys/`
- Gdy gracz dołącza, serwer sprawdza każde `.pbo` względem jego `.bisign` używając `.bikey`

### Generowanie kluczy za pomocą DayZ Tools

1. Otwórz **DayZ Tools** ze Steam
2. W głównym oknie znajdź i kliknij **DS Create Key** (czasem wymieniony w Tools lub Utilities)
3. Wpisz **nazwę klucza** -- użyj nazwy swojego moda (np. `MyMod`)
4. Wybierz, gdzie zapisać pliki
5. Tworzone są dwa pliki:
   - `MyMod.bikey` -- **klucz publiczny** (dystrybuuj ten)
   - `MyMod.biprivatekey` -- **klucz prywatny** (zachowaj w tajemnicy)

### Generowanie kluczy przez wiersz poleceń

Możesz również użyć narzędzia `DSCreateKey` bezpośrednio z terminala:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSCreateKey.exe" MyMod
```

To tworzy `MyMod.bikey` i `MyMod.biprivatekey` w bieżącym katalogu.

### Krytyczna zasada bezpieczeństwa

> **NIGDY nie udostępniaj swojego pliku `.biprivatekey`.** Każdy, kto ma twój klucz prywatny, może podpisywać zmodyfikowane PBO, które serwery zaakceptują jako legalne. Przechowuj go bezpiecznie i rób kopie zapasowe. Jeśli go stracisz, musisz wygenerować nową parę kluczy, ponownie podpisać wszystko, a operatorzy serwerów muszą zaktualizować swoje klucze.

---

## Krok 5: Podpisz swoje PBO

Każdy plik `.pbo` w twoim modzie musi być podpisany twoim kluczem prywatnym. Tworzy to pliki `.bisign`, które znajdują się obok PBO.

### Podpisywanie za pomocą DayZ Tools

1. Otwórz **DayZ Tools**
2. Znajdź i kliknij **DS Sign File** (w Tools lub Utilities)
3. Wybierz swój plik `.biprivatekey`
4. Wybierz plik `.pbo` do podpisania
5. Plik `.bisign` jest tworzony obok PBO (np. `MyMod_Scripts.pbo.MyMod.bisign`)
6. Powtórz dla każdego `.pbo` w folderze `addons/`

### Podpisywanie przez wiersz poleceń

Dla automatyzacji lub wielu PBO użyj wiersza poleceń:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe" MyMod.biprivatekey MyMod_Scripts.pbo
```

Aby podpisać wszystkie PBO w folderze za pomocą skryptu wsadowego:

```batch
@echo off
set DSSIGN="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe"
set KEY="path\to\MyMod.biprivatekey"

for %%f in (addons\*.pbo) do (
    echo Signing %%f ...
    %DSSIGN% %KEY% "%%f"
)

echo All PBOs signed.
pause
```

### Po podpisaniu: zweryfikuj folder

Twój folder `addons/` powinien wyglądać tak:

```
addons/
├── MyMod_Scripts.pbo
├── MyMod_Scripts.pbo.MyMod.bisign
├── MyMod_Data.pbo
└── MyMod_Data.pbo.MyMod.bisign
```

Każde `.pbo` musi mieć odpowiadający `.bisign`. Jeśli brakuje jakiegokolwiek `.bisign`, gracze zostaną wyrzuceni z serwerów weryfikujących podpisy.

### Umieść klucz publiczny

Skopiuj `MyMod.bikey` do folderu `@MyMod/keys/`. To właśnie ten plik operatorzy serwerów skopiują do katalogu `keys/` swojego serwera, aby zezwolić na twój mod.

---

## Krok 6: Publikuj przez DayZ Tools Publisher

DayZ Tools zawiera wbudowany publisher Workshop -- najłatwiejszy sposób na umieszczenie moda na Steam.

### Otwórz Publisher

1. Otwórz **DayZ Tools** ze Steam
2. Kliknij **Publisher** w głównym oknie (może być też oznaczony jako "Workshop Tool")
3. Okno Publisher otwiera się z polami do wypełnienia szczegółów moda

### Wypełnij szczegóły

| Pole | Co wpisać |
|-------|---------------|
| **Title** | Nazwa wyświetlana twojego moda (np. "My Awesome Mod") |
| **Description** | Szczegółowy opis tego, co robi twój mod. Obsługuje formatowanie BB code Steam (patrz poniżej) |
| **Preview Image** | Wskaż swój obraz podglądu 512 x 512 `.png` lub `.jpg` |
| **Mod Folder** | Wskaż kompletny folder `@MyMod` |
| **Tags** | Wybierz odpowiednie tagi (np. Weapons, Vehicles, UI, Server, Gear, Maps) |
| **Visibility** | **Public** (każdy może go znaleźć), **Friends Only** lub **Unlisted** (dostęp tylko przez bezpośredni link) |

### Szybka referencja BB Code Steam

Opis Workshop obsługuje BB code:

```
[h1]Features[/h1]
[list]
[*] Feature one
[*] Feature two
[/list]

[b]Bold[/b]  [i]Italic[/i]  [code]Code[/code]
[url=https://example.com]Link text[/url]
[img]https://example.com/image.png[/img]
```

### Publikacja

1. Przejrzyj wszystkie pola po raz ostatni
2. Kliknij **Publish** (lub **Upload**)
3. Poczekaj na zakończenie przesyłania. Duże mody mogą zająć kilka minut w zależności od połączenia.
4. Po zakończeniu zobaczysz potwierdzenie z twoim **Workshop ID** (długi identyfikator numeryczny jak `2345678901`)
5. **Zapisz ten Workshop ID.** Będziesz go potrzebować do przesyłania aktualizacji później.

### Po publikacji: weryfikacja

Nie pomijaj tego. Przetestuj swój mod tak, jak zrobiłby to zwykły gracz:

1. Odwiedź `https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_ID` i zweryfikuj tytuł, opis, obraz podglądu
2. **Subskrybuj** swój własny mod w Workshop
3. Uruchom DayZ, potwierdź, że mod pojawia się w launcherze
4. Włącz go, uruchom grę, dołącz do serwera (lub uruchom własny serwer testowy)
5. Potwierdź, że wszystkie funkcje działają
6. Zaktualizuj pole `action` w `mod.cpp`, aby wskazywało na URL twojej strony Workshop

Jeśli cokolwiek jest zepsute, zaktualizuj i ponownie prześlij przed publicznym ogłoszeniem.

---

## Publikacja przez wiersz poleceń (alternatywa)

Dla automatyzacji, CI/CD lub wsadowych przesyłek, SteamCMD zapewnia alternatywę przez wiersz poleceń.

### Zainstaluj SteamCMD

Pobierz ze [strony deweloperskiej Valve](https://developer.valvesoftware.com/wiki/SteamCMD) i rozpakuj do folderu jak `C:\SteamCMD\`.

### Utwórz plik VDF

SteamCMD używa pliku `.vdf` do opisu tego, co przesłać. Utwórz plik o nazwie `workshop_publish.vdf`:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "0"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "previewfile"    "C:\\Path\\To\\preview.png"
    "visibility"     "0"
    "title"          "My Awesome Mod"
    "description"    "A comprehensive mod for DayZ."
    "changenote"     "Initial release"
}
```

### Referencja pól

| Pole | Wartość |
|-------|-------|
| `appid` | Zawsze `221100` dla DayZ |
| `publishedfileid` | `0` dla nowego elementu; użyj Workshop ID dla aktualizacji |
| `contentfolder` | Bezwzględna ścieżka do folderu `@MyMod` |
| `previewfile` | Bezwzględna ścieżka do obrazu podglądu |
| `visibility` | `0` = Publiczny, `1` = Tylko znajomi, `2` = Niewidoczny, `3` = Prywatny |
| `title` | Nazwa moda |
| `description` | Opis moda (zwykły tekst) |
| `changenote` | Tekst wyświetlany w historii zmian na stronie Workshop |

### Uruchom SteamCMD

```batch
C:\SteamCMD\steamcmd.exe +login YourSteamUsername +workshop_build_item "C:\Path\To\workshop_publish.vdf" +quit
```

SteamCMD poprosi o hasło i kod Steam Guard przy pierwszym użyciu. Po uwierzytelnieniu przesyła mod i wypisuje Workshop ID.

### Kiedy używać wiersza poleceń

- **Automatyczne buildy:** integracja ze skryptem budowania, który pakuje PBO, podpisuje je i przesyła w jednym kroku
- **Operacje wsadowe:** przesyłanie wielu modów naraz
- **Serwery bezgłowe:** środowiska bez GUI
- **Potoki CI/CD:** GitHub Actions lub podobne mogą wywoływać SteamCMD

---

## Aktualizowanie moda

### Proces aktualizacji krok po kroku

1. **Wprowadź zmiany w kodzie** i dokładnie przetestuj
2. **Zwiększ wersję** w `mod.cpp` (np. `"1.0.0"` staje się `"1.0.1"`)
3. **Przebuduj wszystkie PBO** za pomocą Addon Builder lub swojego skryptu budowania
4. **Ponownie podpisz wszystkie PBO** tym **samym kluczem prywatnym**, którego użyłeś pierwotnie
5. **Otwórz DayZ Tools Publisher**
6. Wpisz swoje istniejące **Workshop ID** (lub wybierz istniejący element)
7. Wskaż zaktualizowany folder `@MyMod`
8. Napisz **notatkę o zmianie** opisującą, co się zmieniło
9. Kliknij **Publish / Update**

### Używanie SteamCMD do aktualizacji

Zaktualizuj plik VDF z twoim Workshop ID i nową notatką o zmianie:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "2345678901"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "changenote"     "v1.0.1 - Fixed item duplication bug, added French translation"
}
```

Następnie uruchom SteamCMD jak wcześniej. `publishedfileid` informuje Steam, aby zaktualizować istniejący element zamiast tworzyć nowy.

### Ważne: Używaj tego samego klucza

Zawsze podpisuj aktualizacje tym **samym kluczem prywatnym**, którego użyłeś do oryginalnego wydania. Jeśli podpiszesz innym kluczem, operatorzy serwerów muszą zastąpić stary `.bikey` twoim nowym -- co oznacza przestój i zamieszanie. Generuj nową parę kluczy tylko wtedy, gdy twój klucz prywatny został skompromitowany.

---

## Najlepsze praktyki zarządzania wersjami

### Wersjonowanie semantyczne

Używaj formatu **MAJOR.MINOR.PATCH**:

| Komponent | Kiedy zwiększać | Przykład |
|-----------|-------------------|---------|
| **MAJOR** | Zmiany łamiące kompatybilność: zmiany formatu konfiguracji, usunięte funkcje, przebudowa API | `1.0.0` do `2.0.0` |
| **MINOR** | Nowe funkcje wstecznie kompatybilne | `1.0.0` do `1.1.0` |
| **PATCH** | Poprawki błędów, drobne poprawki, aktualizacje tłumaczeń | `1.0.0` do `1.0.1` |

### Format dziennika zmian

Utrzymuj dziennik zmian w opisie Workshop lub w osobnym pliku. Czysty format:

```
v1.2.0 (2025-06-15)
- Added: Night vision toggle keybind
- Added: German and Spanish translations
- Fixed: Inventory crash when dropping stacked items
- Changed: Reduced default spawn rate from 5 to 3

v1.1.0 (2025-05-01)
- Added: New crafting recipes for 4 items
- Fixed: Server crash on player disconnect during trade

v1.0.0 (2025-04-01)
- Initial release
```

### Kompatybilność wsteczna

Gdy twój mod zapisuje trwałe dane (konfiguracje JSON, pliki danych graczy), przemyśl dokładnie przed zmianą formatu:

- **Dodawanie nowych pól** jest bezpieczne. Używaj wartości domyślnych dla brakujących pól podczas ładowania starych plików.
- **Zmiana nazwy lub usuwanie pól** to zmiana łamiąca. Zwiększ wersję MAJOR.
- **Rozważ wzorzec migracji:** wykryj stary format, przekonwertuj na nowy, zapisz.

Przykład sprawdzenia migracji w Enforce Script:

```csharp
// W funkcji ładowania konfiguracji
if (config.configVersion < 2)
{
    // Migracja z v1 do v2: zmiana nazwy "oldField" na "newField"
    config.newField = config.oldField;
    config.configVersion = 2;
    SaveConfig(config);
    SDZ_Log.Info("MyMod", "Config migrated from v1 to v2");
}
```

### Tagowanie Git

Jeśli używasz Git do kontroli wersji (a powinieneś), taguj każde wydanie:

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

Tworzy to stały punkt odniesienia, dzięki czemu zawsze możesz wrócić do dokładnego kodu dowolnej opublikowanej wersji.

---

## Najlepsze praktyki strony Workshop

### Struktura opisu

Zorganizuj swój opis z następującymi sekcjami:

1. **Przegląd** -- co robi mod, w 2-3 zdaniach
2. **Funkcje** -- lista wypunktowana kluczowych funkcji
3. **Wymagania** -- wymień wszystkie mody zależne z linkami Workshop
4. **Instalacja** -- krok po kroku dla graczy (zazwyczaj po prostu "subskrybuj i włącz")
5. **Konfiguracja serwera** -- instrukcje dla operatorów serwerów (umieszczanie kluczy, pliki konfiguracyjne)
6. **FAQ** -- typowe pytania z odpowiedziami wyprzedzającymi
7. **Znane problemy** -- bądź szczery co do bieżących ograniczeń
8. **Wsparcie** -- link do twojego Discorda, GitHub issues lub wątku na forum
9. **Dziennik zmian** -- ostatnia historia wersji
10. **Licencja** -- jak inni mogą (lub nie mogą) używać twojej pracy

### Zrzuty ekranu i media

- Dołącz **3-5 zrzutów ekranu z gry** pokazujących twój mod w akcji
- Jeśli twój mod dodaje UI, pokaż wyraźnie panele UI
- Jeśli twój mod dodaje przedmioty, pokaż je w grze (nie tylko w edytorze)
- Krótki film z rozgrywki dramatycznie zwiększa liczbę subskrypcji

### Zależności

Jeśli twój mod wymaga innych modów, wymień je wyraźnie z linkami Workshop. Użyj funkcji "Required Items" Steam Workshop, aby launcher automatycznie ładował zależności.

### Harmonogram aktualizacji

Ustal oczekiwania. Jeśli aktualizujesz co tydzień, powiedz to. Jeśli aktualizacje są okazjonalne, powiedz "aktualizacje w miarę potrzeb." Gracze są bardziej wyrozumiali, gdy wiedzą, czego się spodziewać.

---

## Przewodnik dla operatorów serwerów

Dołącz te informacje do opisu Workshop dla administratorów serwerów.

### Instalowanie moda Workshop na serwerze dedykowanym

1. **Pobierz mod** za pomocą SteamCMD lub klienta Steam:
   ```batch
   steamcmd +login anonymous +workshop_download_item 221100 WORKSHOP_ID +quit
   ```
2. **Skopiuj** (lub utwórz dowiązanie symboliczne) folder `@ModName` do katalogu DayZ Server
3. **Skopiuj plik `.bikey`** z `@ModName/keys/` do folderu `keys/` serwera
4. **Dodaj mod** do parametru uruchomieniowego `-mod=`

### Składnia parametru uruchomieniowego

Mody są ładowane przez parametr `-mod=`, oddzielone średnikami:

```
-mod=@CF;@VPPAdminTools;@MyMod
```

Użyj **pełnej ścieżki względnej** od korzenia serwera. Na Linuksie ścieżki rozróżniają wielkość liter.

### Kolejność ładowania

Mody ładują się w kolejności podanej w `-mod=`. Ma to znaczenie, gdy mody zależą od siebie:

- **Zależności najpierw.** Jeśli `@MyMod` wymaga `@CF`, wymień `@CF` przed `@MyMod`.
- **Ogólna zasada:** frameworki najpierw, mody zawartości na końcu.
- Jeśli twój mod deklaruje `requiredAddons` w `config.cpp`, DayZ spróbuje automatycznie rozwiązać kolejność ładowania, ale jawna kolejność w `-mod=` jest bezpieczniejsza.

### Zarządzanie kluczami

- Umieść **jeden `.bikey` na mod** w katalogu `keys/` serwera
- Gdy mod aktualizuje się z tym samym kluczem, nie jest potrzebna żadna akcja -- istniejący `.bikey` nadal działa
- Jeśli autor moda zmieni klucze, musisz zastąpić stary `.bikey` nowym
- Ścieżka folderu `keys/` jest względna do korzenia serwera (np. `DayZServer/keys/`)

---

## Dystrybucja bez Workshop

### Kiedy pominąć Workshop

- **Prywatne mody** dla twojej własnej społeczności serwera
- **Testy beta** z małą grupą przed publicznym wydaniem
- **Mody komercyjne lub licencjonowane** dystrybuowane przez inne kanały
- **Szybka iteracja** podczas rozwoju (szybciej niż ponowne przesyłanie za każdym razem)

### Tworzenie archiwum ZIP wydania

Spakuj swój mod do ręcznej dystrybucji:

```
MyMod_v1.0.0.zip
└── @MyMod/
    ├── addons/
    │   ├── MyMod_Scripts.pbo
    │   ├── MyMod_Scripts.pbo.MyMod.bisign
    │   ├── MyMod_Data.pbo
    │   └── MyMod_Data.pbo.MyMod.bisign
    ├── keys/
    │   └── MyMod.bikey
    └── mod.cpp
```

Dołącz `README.txt` z instrukcjami instalacji:

```
INSTALLATION:
1. Extract the @MyMod folder into your DayZ game directory
2. (Server operators) Copy MyMod.bikey from @MyMod/keys/ to your server's keys/ folder
3. Add @MyMod to your -mod= launch parameter
```

### Wydania na GitHub

Jeśli twój mod jest open source, użyj GitHub Releases do hostowania wersjonowanych pobrań:

1. Otaguj wydanie w Git (`git tag v1.0.0`)
2. Zbuduj i podpisz PBO
3. Utwórz ZIP folderu `@MyMod`
4. Utwórz wydanie GitHub i załącz ZIP
5. Napisz notatki do wydania w opisie wydania

Daje to historię wersji, licznik pobrań i stabilny URL dla każdego wydania.

---

## Częste problemy i rozwiązania

| Problem | Przyczyna | Rozwiązanie |
|---------|-------|-----|
| "Addon rejected by server" | Serwer nie ma `.bikey` lub `.bisign` nie pasuje do `.pbo` | Potwierdź, że `.bikey` jest w folderze `keys/` serwera. Ponownie podpisz PBO poprawnym `.biprivatekey`. |
| "Signature check failed" | PBO zmodyfikowane po podpisaniu lub podpisane złym kluczem | Przebuduj PBO z czystego źródła. Ponownie podpisz tym **samym kluczem**, który wygenerował `.bikey` serwera. |
| Mod nie jest w DayZ Launcher | Zniekształcony `mod.cpp` lub zła struktura folderów | Sprawdź `mod.cpp` pod kątem błędów składniowych (brakujące `;`). Upewnij się, że folder zaczyna się od `@`. Uruchom ponownie launcher. |
| Przesyłanie nie powiodło się w Publisher | Problem z autoryzacją, połączeniem lub blokadą pliku | Zweryfikuj logowanie Steam. Zamknij Workbench/Addon Builder. Spróbuj uruchomić DayZ Tools jako Administrator. |
| Zła/brakująca ikona Workshop | Zła ścieżka w `mod.cpp` lub zły format obrazu | Zweryfikuj, że ścieżki `picture`/`logo` wskazują na rzeczywiste pliki `.paa`. Podgląd Workshop (`.png`) jest oddzielny. |
| Konflikty z innymi modami | Redefiniowanie waniliowych klas zamiast ich moddingu | Użyj `modded class`, wywołuj `super` w nadpisaniach, ustaw `requiredAddons` dla kolejności ładowania. |
| Gracze crashują przy ładowaniu | Błędy skryptów, uszkodzone PBO lub brakujące zależności | Sprawdź logi `.RPT`. Przebuduj PBO z czystego źródła. Zweryfikuj, że zależności ładują się najpierw. |

---

## Pełny cykl życia moda

```
POMYSŁ -> KONFIGURACJA (8.1) -> STRUKTURA (8.1, 8.5) -> KOD (8.2, 8.3, 8.4) -> BUDOWANIE (8.1)
  -> TEST -> DEBUG (8.6) -> DOPRACOWANIE -> PODPIS (8.7) -> PUBLIKACJA (8.7) -> UTRZYMANIE (8.7)
                                    ^                                    |
                                    +-------- pętla informacji zwrotnej -+
```

Po publikacji opinie graczy odsyłają cię do KODU, TESTU i DEBUGOWANIA. Ten cykl publikuj-zbierz opinie-poprawiaj jest sposobem, w jaki buduje się świetne mody.

---

## Następne kroki

Ukończyłeś pełną serię poradników moddingu DayZ -- od pustego miejsca pracy do opublikowanego, podpisanego i utrzymywanego moda w Steam Workshop. Stąd:

- **Poznaj rozdziały referencyjne** (Rozdziały 1-7), aby uzyskać głębszą wiedzę o systemie GUI, config.cpp i Enforce Script
- **Studiuj mody open source** takie jak CF, Community Online Tools i Expansion dla zaawansowanych wzorców
- **Dołącz do społeczności moddingu DayZ** na Discordzie i forach Bohemia Interactive
- **Buduj większe rzeczy.** Twój pierwszy mod to Hello World. Twój następny może być kompletną przebudową rozgrywki.

Narzędzia są w twoich rękach. Zbuduj coś wspaniałego.
