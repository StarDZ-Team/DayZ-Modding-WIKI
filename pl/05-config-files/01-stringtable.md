# Rozdział 5.1: stringtable.csv --- Lokalizacja

[Strona główna](../README.md) | **stringtable.csv** | [Następny: inputs.xml >>](02-inputs-xml.md)

---

> **Podsumowanie:** Plik `stringtable.csv` zapewnia zlokalizowany tekst dla twojego moda DayZ. Silnik odczytuje ten plik CSV przy starcie i rozwiązuje klucze tłumaczeń na podstawie ustawienia językowego gracza. Każdy tekst widoczny dla użytkownika --- etykiety UI, nazwy przypisań klawiszy, opisy przedmiotów, tekst powiadomień --- powinien znajdować się w stringtable, a nie być zakodowany na stałe.

---

## Spis treści

- [Przegląd](#przegląd)
- [Format CSV](#format-csv)
- [Referencja kolumn](#referencja-kolumn)
- [Konwencja nazewnictwa kluczy](#konwencja-nazewnictwa-kluczy)
- [Odwoływanie się do łańcuchów](#odwoływanie-się-do-łańcuchów)
- [Tworzenie nowej tablicy łańcuchów](#tworzenie-nowej-tablicy-łańcuchów)
- [Obsługa pustych komórek i zachowanie awaryjne](#obsługa-pustych-komórek-i-zachowanie-awaryjne)
- [Przebieg pracy wielojęzycznej](#przebieg-pracy-wielojęzycznej)
- [Modularny stringtable (DayZ Expansion)](#modularny-stringtable-dayz-expansion)
- [Przykłady z praktyki](#przykłady-z-praktyki)
- [Najczęstsze błędy](#najczęstsze-błędy)

---

## Przegląd

DayZ używa systemu lokalizacji opartego na CSV. Gdy silnik napotyka klucz łańcucha z prefiksem `#` (na przykład `#STR_MYMOD_HELLO`), wyszukuje ten klucz we wszystkich załadowanych plikach stringtable i zwraca tłumaczenie pasujące do aktualnego języka gracza. Jeśli nie zostanie znalezione dopasowanie dla aktywnego języka, silnik przechodzi przez zdefiniowany łańcuch awaryjny.

Plik stringtable musi mieć dokładnie nazwę `stringtable.csv` i być umieszczony wewnątrz struktury PBO twojego moda. Silnik wykrywa go automatycznie --- rejestracja w config.cpp nie jest wymagana.

---

## Format CSV

Plik jest standardowym plikiem wartości rozdzielonych przecinkami z polami w cudzysłowach. Pierwszy wiersz to nagłówek, a każdy kolejny wiersz definiuje jeden klucz tłumaczenia.

### Wiersz nagłówka

Wiersz nagłówka definiuje kolumny. DayZ rozpoznaje do 15 kolumn:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Wiersze danych

Każdy wiersz zaczyna się od klucza łańcucha (bez prefiksu `#` w CSV), po którym następuje tłumaczenie dla każdego języka:

```csv
"STR_MYMOD_HELLO","Hello World","Hello World","Ahoj světe","Hallo Welt","Привет мир","Witaj świecie","Helló világ","Ciao mondo","Hola mundo","Bonjour le monde","你好世界","ハローワールド","Olá mundo","你好世界",
```

### Końcowy przecinek

Wiele plików stringtable zawiera końcowy przecinek po ostatniej kolumnie. Jest to konwencjonalne i bezpieczne --- silnik to toleruje.

### Zasady cudzysłowów

- Pola **muszą** być w podwójnych cudzysłowach, jeśli zawierają przecinki, znaki nowej linii lub podwójne cudzysłowy.
- W praktyce większość modów cytuje każde pole dla spójności.
- Niektóre mody (jak MyMod Missions) pomijają cudzysłowy całkowicie; silnik obsługuje oba style, o ile zawartość pola nie zawiera przecinków.

---

## Referencja kolumn

DayZ obsługuje 13 języków do wyboru przez gracza. CSV ma 15 kolumn, ponieważ pierwsza kolumna to nazwa klucza, a druga to kolumna `original` (ojczysty język autora moda lub domyślny tekst).

| # | Nazwa kolumny | Język | Uwagi |
|---|---------------|-------|-------|
| 1 | `Language` | --- | Identyfikator klucza łańcucha (np. `STR_MYMOD_HELLO`) |
| 2 | `original` | Ojczysty autora | Ostateczny awaryjny; używany jeśli żadna inna kolumna nie pasuje |
| 3 | `english` | Angielski | Najczęstszy główny język dla międzynarodowych modów |
| 4 | `czech` | Czeski | |
| 5 | `german` | Niemiecki | |
| 6 | `russian` | Rosyjski | |
| 7 | `polish` | Polski | |
| 8 | `hungarian` | Węgierski | |
| 9 | `italian` | Włoski | |
| 10 | `spanish` | Hiszpański | |
| 11 | `french` | Francuski | |
| 12 | `chinese` | Chiński (tradycyjny) | Tradycyjne znaki chińskie |
| 13 | `japanese` | Japoński | |
| 14 | `portuguese` | Portugalski | |
| 15 | `chinesesimp` | Chiński (uproszczony) | Uproszczone znaki chińskie |

### Kolejność kolumn ma znaczenie

Silnik identyfikuje kolumny po ich **nazwie nagłówka**, nie po pozycji. Jednak stosowanie standardowej kolejności pokazanej powyżej jest mocno zalecane dla kompatybilności i czytelności.

### Kolumny opcjonalne

Nie musisz dołączać wszystkich 15 kolumn. Jeśli twój mod obsługuje tylko angielski, możesz użyć minimalnego nagłówka:

```csv
"Language","english"
"STR_MYMOD_HELLO","Hello World"
```

Niektóre mody dodają niestandardowe kolumny jak `korean` (MyMod Missions to robi). Silnik ignoruje kolumny, których nie rozpoznaje jako obsługiwany język, ale te kolumny mogą służyć jako dokumentacja lub przygotowanie na przyszłe wsparcie językowe.

---

## Konwencja nazewnictwa kluczy

Klucze łańcuchów podążają za hierarchicznym wzorcem nazewnictwa:

```
STR_NAZWAMOD_KATEGORIA_ELEMENT
```

### Zasady

1. **Zawsze zaczynaj od `STR_`** --- to jest uniwersalna konwencja DayZ
2. **Prefiks moda** --- unikalnie identyfikuje twój mod (np. `MYMOD`, `COT`, `EXPANSION`, `VPP`)
3. **Kategoria** --- grupuje powiązane łańcuchy (np. `INPUT`, `TAB`, `CONFIG`, `DIR`)
4. **Element** --- konkretny łańcuch (np. `ADMIN_PANEL`, `NORTH`, `SAVE`)
5. **Używaj DUŻYCH LITER** --- konwencja we wszystkich głównych modach
6. **Używaj podkreśleń** jako separatorów, nigdy spacji ani myślników

### Przykłady z prawdziwych modów

```
STR_MYMOD_INPUT_ADMIN_PANEL       -- MyMod: etykieta przypisania klawisza
STR_MYMOD_CLOSE                   -- MyMod: ogólny przycisk "Zamknij"
STR_MYMOD_DIR_NORTH               -- MyMod: kierunek kompasu
STR_MYMOD_TAB_ONLINE              -- MyMod: nazwa zakładki panelu admina
STR_COT_ESP_MODULE_NAME            -- COT: nazwa wyświetlana modułu
STR_COT_CAMERA_MODULE_BLUR         -- COT: etykieta narzędzia kamery
STR_EXPANSION_ATM                  -- Expansion: nazwa funkcji
STR_EXPANSION_AI_COMMAND_MENU      -- Expansion: etykieta wejścia
```

### Anty-wzorce

```
STR_hello_world          -- Źle: małe litery, brak prefiksu moda
MY_STRING                -- Źle: brak prefiksu STR_
STR_MYMOD Hello World    -- Źle: spacje w kluczu
```

---

## Odwoływanie się do łańcuchów

Istnieją trzy odrębne konteksty, w których odwołujesz się do zlokalizowanych łańcuchów, i każdy używa nieco innej składni.

### W plikach layoutów (.layout)

Użyj prefiksu `#` przed nazwą klucza. Silnik rozwiązuje go w momencie tworzenia widgetu.

```
TextWidgetClass MyLabel {
 text "#STR_MYMOD_CLOSE"
 size 100 30
}
```

Prefiks `#` mówi parserowi layoutu "to jest klucz lokalizacji, nie dosłowny tekst."

### W Enforce Script (pliki .c)

Użyj `Widget.TranslateString()` do rozwiązania klucza w czasie wykonania. Prefiks `#` jest wymagany w argumencie.

```c
string translated = Widget.TranslateString("#STR_MYMOD_CLOSE");
// translated == "Close" (jeśli język gracza to angielski)
// translated == "Zamknij" (jeśli język gracza to polski)
```

Możesz także ustawić tekst widgetu bezpośrednio:

```c
TextWidget label = TextWidget.Cast(layoutRoot.FindAnyWidget("MyLabel"));
label.SetText(Widget.TranslateString("#STR_MYMOD_ADMIN_PANEL"));
```

Lub użyj kluczy łańcuchów bezpośrednio we właściwościach tekstu widgetu, a silnik je rozwiąże:

```c
label.SetText("#STR_MYMOD_ADMIN_PANEL");  // Też działa -- silnik auto-rozwiązuje
```

### W inputs.xml

Użyj atrybutu `loc` **bez** prefiksu `#`.

```xml
<input name="UAMyAction" loc="STR_MYMOD_INPUT_MY_ACTION" />
```

To jedyne miejsce, gdzie pomijasz `#`. System wejść dodaje go wewnętrznie.

### Tabela podsumowująca

| Kontekst | Składnia | Przykład |
|----------|----------|---------|
| Atrybut `text` w layoucie | `#STR_KLUCZ` | `text "#STR_MYMOD_CLOSE"` |
| Skrypt `TranslateString()` | `"#STR_KLUCZ"` | `Widget.TranslateString("#STR_MYMOD_CLOSE")` |
| Tekst widgetu w skrypcie | `"#STR_KLUCZ"` | `label.SetText("#STR_MYMOD_CLOSE")` |
| Atrybut `loc` w inputs.xml | `STR_KLUCZ` (bez #) | `loc="STR_MYMOD_INPUT_ADMIN_PANEL"` |

---

## Tworzenie nowej tablicy łańcuchów

### Krok 1: Utwórz plik

Utwórz `stringtable.csv` w katalogu głównym zawartości PBO twojego moda. Silnik przeszukuje wszystkie załadowane PBO w poszukiwaniu plików o nazwie dokładnie `stringtable.csv`.

Typowe umiejscowienie:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      config.cpp
      stringtable.csv        <-- Tutaj
      Scripts/
        3_Game/
        4_World/
        5_Mission/
```

### Krok 2: Napisz nagłówek

Zacznij od pełnego 15-kolumnowego nagłówka:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Krok 3: Dodaj swoje łańcuchy

Dodaj jeden wiersz na tłumaczalny łańcuch. Zacznij od angielskiego, wypełniaj inne języki w miarę dostępności tłumaczeń:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_TITLE","My Cool Mod","My Cool Mod","","","","","","","","","","","","",
"STR_MYMOD_OPEN","Open","Open","Otevřít","Öffnen","Открыть","Otwórz","Megnyitás","Apri","Abrir","Ouvrir","打开","開く","Abrir","打开",
```

### Krok 4: Spakuj i przetestuj

Zbuduj swoje PBO. Uruchom grę. Zweryfikuj, że `Widget.TranslateString("#STR_MYMOD_TITLE")` zwraca "My Cool Mod" w logach skryptów. Zmień język gry w ustawieniach, aby zweryfikować zachowanie awaryjne.

---

## Obsługa pustych komórek i zachowanie awaryjne

Gdy silnik wyszukuje klucz łańcucha dla aktualnego języka gracza i znajduje pustą komórkę, podąża za łańcuchem awaryjnym:

1. **Kolumna wybranego języka gracza** --- sprawdzana jako pierwsza
2. **Kolumna `english`** --- jeśli komórka języka gracza jest pusta
3. **Kolumna `original`** --- jeśli `english` też jest pusta
4. **Surowa nazwa klucza** --- jeśli wszystkie kolumny są puste, silnik wyświetla sam klucz (np. `STR_MYMOD_TITLE`)

Oznacza to, że możesz bezpiecznie zostawić kolumny inne niż angielski puste podczas rozwoju. Anglojęzyczni gracze widzą kolumnę `english`, a inni gracze widzą awaryjny angielski, dopóki nie zostanie dodane właściwe tłumaczenie.

### Praktyczna implikacja

Nie musisz kopiować angielskiego tekstu do każdej kolumny jako symbol zastępczy. Zostaw nieprzetłumaczone komórki puste:

```csv
"STR_MYMOD_HELLO","Hello","Hello","","","","","","","","","","","","",
```

Gracze, których język to niemiecki, zobaczą "Hello" (awaryjny angielski), dopóki nie zostanie dodane tłumaczenie niemieckie.

---

## Przebieg pracy wielojęzycznej

### Dla samodzielnych deweloperów

1. Napisz wszystkie łańcuchy po angielsku (w kolumnach `original` i `english`).
2. Wydaj moda. Angielski służy jako uniwersalny awaryjny.
3. W miarę jak członkowie społeczności będą zgłaszać się z tłumaczeniami, wypełniaj dodatkowe kolumny.
4. Przebuduj i wydaj aktualizacje.

### Dla zespołów z tłumaczami

1. Utrzymuj CSV w współdzielonym repozytorium lub arkuszu kalkulacyjnym.
2. Przypisz jednego tłumacza na język.
3. Używaj kolumny `original` dla ojczystego języka autora (np. portugalski dla brazylijskich deweloperów).
4. Kolumna `english` jest zawsze wypełniona --- to międzynarodowa baza.
5. Używaj narzędzia do porównywania, aby śledzić, które klucze zostały dodane od ostatniej sesji tłumaczeniowej.

### Użycie oprogramowania arkuszy kalkulacyjnych

Pliki CSV otwierają się naturalnie w Excelu, Google Sheets lub LibreOffice Calc. Bądź świadomy tych pułapek:

- **Excel może dodać BOM (Byte Order Mark)** do plików UTF-8. DayZ obsługuje BOM, ale może to powodować problemy z niektórymi narzędziami. Zapisuj jako "CSV UTF-8" dla bezpieczeństwa.
- **Auto-formatowanie Excela** może zniekształcić pola, które wyglądają jak daty lub liczby.
- **Znaki końca linii**: DayZ akceptuje zarówno `\r\n` (Windows), jak i `\n` (Unix).

---

## Modularny stringtable (DayZ Expansion)

DayZ Expansion demonstruje dobrą praktykę dla dużych modów: dzielenie tłumaczeń na wiele plików stringtable zorganizowanych według modułów funkcjonalnych. Ich struktura używa 20 oddzielnych plików stringtable wewnątrz katalogu `languagecore`:

```
DayZExpansion/
  languagecore/
    AI/stringtable.csv
    BaseBuilding/stringtable.csv
    Book/stringtable.csv
    Chat/stringtable.csv
    Core/stringtable.csv
    Garage/stringtable.csv
    Groups/stringtable.csv
    Hardline/stringtable.csv
    Licensed/stringtable.csv
    Main/stringtable.csv
    MapAssets/stringtable.csv
    Market/stringtable.csv
    Missions/stringtable.csv
    Navigation/stringtable.csv
    PersonalStorage/stringtable.csv
    PlayerList/stringtable.csv
    Quests/stringtable.csv
    SpawnSelection/stringtable.csv
    Vehicles/stringtable.csv
    Weapons/stringtable.csv
```

### Dlaczego dzielić?

- **Zarządzalność**: Pojedynczy stringtable dla dużego moda może urosnąć do tysięcy linii. Dzielenie według modułu funkcjonalnego sprawia, że każdy plik jest zarządzalny.
- **Niezależne aktualizacje**: Tłumacze mogą pracować nad jednym modułem na raz bez konfliktów łączenia.
- **Warunkowe dołączanie**: PBO każdego pod-moda zawiera tylko stringtable dla swojej własnej funkcji, utrzymując mniejsze rozmiary PBO.

### Jak to działa

Silnik przeszukuje każde załadowane PBO w poszukiwaniu `stringtable.csv`. Ponieważ każdy pod-moduł Expansion jest pakowany do własnego PBO, każdy naturalnie zawiera tylko własny stringtable. Żadna specjalna konfiguracja nie jest potrzebna --- po prostu nazwij plik `stringtable.csv` i umieść go wewnątrz PBO.

Nazwy kluczy nadal używają globalnego prefiksu (`STR_EXPANSION_`), aby uniknąć kolizji.

---

## Przykłady z praktyki

### MyMod Core

MyMod Core używa pełnego 15-kolumnowego formatu z portugalskim jako językiem `original` (ojczysty język zespołu deweloperskiego) i kompletnymi tłumaczeniami dla wszystkich 13 obsługiwanych języków:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod",
"STR_MYMOD_INPUT_ADMIN_PANEL","Painel Admin","Open Admin Panel","Otevřít Admin Panel","Admin-Panel öffnen","Открыть Админ Панель","Otwórz Panel Admina","Admin Panel megnyitása","Apri Pannello Admin","Abrir Panel Admin","Ouvrir le Panneau Admin","打开管理面板","管理パネルを開く","Abrir Painel Admin","打开管理面板",
"STR_MYMOD_CLOSE","Fechar","Close","Zavřít","Schließen","Закрыть","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","关闭","閉じる","Fechar","关闭",
"STR_MYMOD_SAVE","Salvar","Save","Uložit","Speichern","Сохранить","Zapisz","Mentés","Salva","Guardar","Sauvegarder","保存","保存","Salvar","保存",
```

Zauważalne wzorce:
- `original` zawiera tekst portugalski (ojczysty język zespołu)
- `english` jest zawsze wypełniony jako międzynarodowa baza
- Wszystkie 13 kolumn językowych jest wypełnionych

### COT (Community Online Tools)

COT używa tego samego 15-kolumnowego formatu. Jego klucze podążają za wzorcem `STR_COT_MODUŁ_KATEGORIA_ELEMENT`:

```csv
Language,original,english,czech,german,russian,polish,hungarian,italian,spanish,french,chinese,japanese,portuguese,chinesesimp,
STR_COT_CAMERA_MODULE_BLUR,Blur:,Blur:,Rozmazání:,Weichzeichner:,Размытие:,Rozmycie:,Elmosódás:,Sfocatura:,Desenfoque:,Flou:,模糊:,ぼかし:,Desfoque:,模糊:,
STR_COT_ESP_MODULE_NAME,Camera Tools,Camera Tools,Nástroje kamery,Kamera-Werkzeuge,Камера,Narzędzia Kamery,Kamera Eszközök,Strumenti Camera,Herramientas de Cámara,Outils Caméra,相機工具,カメラツール,Ferramentas da Câmera,相机工具,
```

### VPP Admin Tools

VPP używa zredukowanego zestawu kolumn (13 kolumn, bez kolumny `hungarian`) i nie poprzedza kluczy prefiksem `STR_`:

```csv
"Language","original","english","czech","german","russian","polish","italian","spanish","french","chinese","japanese","portuguese","chinesesimp"
"vpp_focus_on_game","[Hold/2xTap] Focus On Game","[Hold/2xTap] Focus On Game","...","...","...","...","...","...","...","...","...","...","..."
```

To demonstruje, że prefiks `STR_` jest konwencją, nie wymogiem. Jednak jego pominięcie oznacza, że nie możesz używać rozwiązywania prefiksu `#` w plikach layoutów. VPP odwołuje się do tych kluczy tylko przez kod skryptu. Prefiks `STR_` jest mocno zalecany dla wszystkich nowych modów.

### MyMod Missions

MyMod Missions używa niecytowanego CSV w stylu bez nagłówka (bez cudzysłowów wokół pól) z dodatkową kolumną `Korean`:

```csv
Language,English,Czech,German,Russian,Polish,Hungarian,Italian,Spanish,French,Chinese,Japanese,Portuguese,Korean
STR_MYMOD_MISSION_AVAILABLE,MISSION AVAILABLE,MISE K DISPOZICI,MISSION VERFÜGBAR,МИССИЯ ДОСТУПНА,...
```

Uwaga: kolumna `original` jest nieobecna, a `Korean` jest dodany jako dodatkowy język. Silnik ignoruje nierozpoznane nazwy kolumn, więc `Korean` służy jako dokumentacja, dopóki nie zostanie dodane oficjalne wsparcie koreańskiego.

---

## Najczęstsze błędy

### Zapomnienie o prefiksie `#` w skryptach

```c
// ŹLE -- wyświetla surowy klucz, nie tłumaczenie
label.SetText("STR_MYMOD_HELLO");

// POPRAWNIE
label.SetText("#STR_MYMOD_HELLO");
```

### Używanie `#` w inputs.xml

```xml
<!-- ŹLE -- system wejść dodaje # wewnętrznie -->
<input name="UAMyAction" loc="#STR_MYMOD_MY_ACTION" />

<!-- POPRAWNIE -->
<input name="UAMyAction" loc="STR_MYMOD_MY_ACTION" />
```

### Zduplikowane klucze między modami

Jeśli dwa mody definiują `STR_CLOSE`, silnik używa tego, którego PBO ładuje się ostatnie. Zawsze używaj prefiksu swojego moda:

```csv
"STR_MYMOD_CLOSE","Close","Close",...
```

### Niezgodna liczba kolumn

Jeśli wiersz ma mniej kolumn niż nagłówek, silnik może go cicho pominąć lub przypisać puste łańcuchy do brakujących kolumn. Zawsze upewnij się, że każdy wiersz ma taką samą liczbę pól jak nagłówek.

### Problemy z BOM

Niektóre edytory tekstu wstawiają BOM UTF-8 (byte order mark) na początku pliku. Może to spowodować, że pierwszy klucz łańcucha w CSV będzie cicho uszkodzony. Jeśli twój pierwszy klucz łańcucha nigdy się nie rozwiązuje, sprawdź i usuń BOM.

### Używanie przecinków wewnątrz niecytowanych pól

```csv
STR_MYMOD_MSG,Hello, World,Hello, World,...
```

To łamie parsowanie, ponieważ `Hello` i ` World` są odczytywane jako oddzielne kolumny. Cytuj pole lub unikaj przecinków w wartościach:

```csv
"STR_MYMOD_MSG","Hello, World","Hello, World",...
```

---

## Dobre praktyki

- Zawsze używaj prefiksu `STR_NAZWAMODA_` dla każdego klucza. Zapobiega to kolizjom, gdy wiele modów jest załadowanych razem.
- Cytuj każde pole w CSV, nawet jeśli zawartość nie ma przecinków. Zapobiega to subtelnym błędom parsowania, gdy tłumaczenia w innych językach zawierają przecinki lub znaki specjalne.
- Wypełniaj kolumnę `english` dla każdego klucza, nawet jeśli twój ojczysty język jest inny. Angielski jest uniwersalnym awaryjnym i bazą dla tłumaczy ze społeczności.
- Utrzymuj jeden stringtable na PBO dla małych modów. Dla dużych modów z 500+ kluczami, dziel na pliki stringtable per-funkcja w oddzielnych PBO (podążając za wzorcem Expansion).
- Zapisuj pliki jako UTF-8 bez BOM. Jeśli używasz Excela, jawnie wybierz format "CSV UTF-8" przy eksporcie.

---

## Kompatybilność i wpływ

- **Multi-Mod:** Kolizje kluczy łańcuchów to główne ryzyko. Dwa mody definiujące `STR_ADMIN_PANEL` będą kolidować cicho. Zawsze prefiksuj klucze nazwą swojego moda (`STR_MYMOD_ADMIN_PANEL`).
- **Wydajność:** Wyszukiwanie stringtable jest szybkie (oparte na haszu). Posiadanie tysięcy kluczy w wielu modach nie ma mierzalnego wpływu na wydajność. Cały stringtable jest ładowany do pamięci przy starcie.
- **Wersja:** Format stringtable oparty na CSV nie zmienił się od DayZ Standalone alpha. Układ 15 kolumn i zachowanie awaryjne pozostały stabilne we wszystkich wersjach.
