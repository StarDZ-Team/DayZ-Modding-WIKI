# Rozdział 5.2: inputs.xml --- Własne skróty klawiszowe

[Strona główna](../README.md) | [<< Poprzedni: stringtable.csv](01-stringtable.md) | **inputs.xml** | [Następny: Credits.json >>](03-credits-json.md)

---

> **Podsumowanie:** Plik `inputs.xml` pozwala twojemu modowi rejestrować własne skróty klawiszowe, które pojawiają się w menu Ustawienia > Sterowanie gracza. Gracze mogą przeglądać, przypisywać i przełączać te skróty tak samo jak vanilla akcje. Jest to standardowy mechanizm dodawania klawiszy skrótów do modów DayZ.

---

## Spis treści

- [Przegląd](#przegląd)
- [Lokalizacja pliku](#lokalizacja-pliku)
- [Kompletna struktura XML](#kompletna-struktura-xml)
- [Blok akcji](#blok-akcji)
- [Blok sortowania](#blok-sortowania)
- [Blok presetów (domyślne przypisania klawiszy)](#blok-presetów-domyślne-przypisania-klawiszy)
- [Kombinacje z modyfikatorami](#kombinacje-z-modyfikatorami)
- [Ukryte dane wejściowe](#ukryte-dane-wejściowe)
- [Wiele domyślnych klawiszy](#wiele-domyślnych-klawiszy)
- [Dostęp do danych wejściowych w skrypcie](#dostęp-do-danych-wejściowych-w-skrypcie)
- [Referencja metod wejściowych](#referencja-metod-wejściowych)
- [Tłumienie i wyłączanie danych wejściowych](#tłumienie-i-wyłączanie-danych-wejściowych)
- [Referencja nazw klawiszy](#referencja-nazw-klawiszy)
- [Przykłady z praktyki](#przykłady-z-praktyki)
- [Najczęstsze błędy](#najczęstsze-błędy)

---

## Przegląd

Gdy twój mod wymaga od gracza naciśnięcia klawisza --- otwarcia menu, przełączenia funkcji, wydania rozkazu jednostce AI --- rejestrujesz własną akcję wejściową w `inputs.xml`. Silnik odczytuje ten plik przy starcie i integruje twoje akcje z uniwersalnym systemem wejść. Gracze widzą twoje przypisania klawiszy w menu gry Ustawienia > Sterowanie, pogrupowane pod nagłówkiem, który definiujesz.

Własne wejścia są identyfikowane przez unikalną nazwę akcji (konwencjonalnie z prefiksem `UA` od "User Action") i mogą mieć domyślne przypisania klawiszy, które gracze mogą dowolnie zmieniać.

---

## Lokalizacja pliku

Umieść `inputs.xml` w podfolderze `data` katalogu Scripts:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        data/
          inputs.xml        <-- Tutaj
        3_Game/
        4_World/
        5_Mission/
```

Niektóre mody umieszczają go bezpośrednio w folderze `Scripts/`. Obie lokalizacje działają. Silnik wykrywa plik automatycznie --- rejestracja w config.cpp nie jest wymagana.

---

## Kompletna struktura XML

Plik `inputs.xml` ma trzy sekcje, wszystkie opakowane w element główny `<modded_inputs>`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <!-- Definicje akcji tutaj -->
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <!-- Kolejność sortowania dla menu ustawień -->
        </sorting>
    </inputs>
    <preset>
        <!-- Domyślne przypisania klawiszy tutaj -->
    </preset>
</modded_inputs>
```

Wszystkie trzy sekcje --- `<actions>`, `<sorting>` i `<preset>` --- współpracują, ale służą różnym celom.

---

## Blok akcji

Blok `<actions>` deklaruje każdą akcję wejściową, którą zapewnia twój mod. Każda akcja to pojedynczy element `<input>`.

### Składnia

```xml
<actions>
    <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
    <input name="UAMyModToggleHUD" loc="STR_MYMOD_INPUT_TOGGLE_HUD" />
</actions>
```

### Atrybuty

| Atrybut | Wymagany | Opis |
|---------|----------|------|
| `name` | Tak | Unikalny identyfikator akcji. Konwencja: prefiks `UA` (User Action). Używany w skryptach do odpytywania tego wejścia. |
| `loc` | Nie | Klucz stringtable dla nazwy wyświetlanej w menu Sterowanie. **Bez prefiksu `#`** --- system dodaje go sam. |
| `visible` | Nie | Ustaw na `"false"`, aby ukryć w menu Sterowanie. Domyślnie `true`. |

### Konwencja nazewnictwa

Nazwy akcji muszą być globalnie unikalne wśród wszystkich załadowanych modów. Używaj prefiksu swojego moda:

```xml
<input name="UAMyModAdminPanel" loc="STR_MYMOD_INPUT_ADMIN_PANEL" />
<input name="UAExpansionBookToggle" loc="STR_EXPANSION_BOOK_TOGGLE" />
<input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU" />
```

Prefiks `UA` jest konwencjonalny, ale nie wymagany. Expansion AI używa `eAI` jako prefiksu, co również działa.

---

## Blok sortowania

Blok `<sorting>` kontroluje, jak twoje wejścia pojawiają się w ustawieniach Sterowanie gracza. Definiuje nazwaną grupę (która staje się nagłówkiem sekcji) i wymienia wejścia w kolejności wyświetlania.

### Składnia

```xml
<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModOpenMenu" />
    <input name="UAMyModToggleHUD" />
    <input name="UAMyModSpecialAction" />
</sorting>
```

### Atrybuty

| Atrybut | Wymagany | Opis |
|---------|----------|------|
| `name` | Tak | Wewnętrzny identyfikator tej grupy sortowania |
| `loc` | Tak | Klucz stringtable dla nagłówka grupy wyświetlanego w Ustawienia > Sterowanie |

### Jak to wygląda

W ustawieniach Sterowanie gracz widzi:

```
[MyMod]                          <-- z loc sortowania
  Open Menu .............. [Y]   <-- z loc wejścia + preset
  Toggle HUD ............. [H]   <-- z loc wejścia + preset
```

Tylko wejścia wymienione w bloku `<sorting>` pojawiają się w menu ustawień. Wejścia zdefiniowane w `<actions>`, ale nie wymienione w `<sorting>`, są cicho zarejestrowane, ale niewidoczne dla gracza (nawet jeśli `visible` nie jest jawnie ustawione na `false`).

---

## Blok presetów (domyślne przypisania klawiszy)

Blok `<preset>` przypisuje domyślne klawisze do twoich akcji. To są klawisze, z którymi gracz zaczyna przed jakąkolwiek personalizacją.

### Proste przypisanie klawisza

```xml
<preset>
    <input name="UAMyModOpenMenu">
        <btn name="kY"/>
    </input>
</preset>
```

To przypisuje klawisz `Y` jako domyślny dla `UAMyModOpenMenu`.

### Brak domyślnego klawisza

Jeśli pominiesz akcję w bloku `<preset>`, nie ma domyślnego przypisania. Gracz musi ręcznie przypisać klawisz w Ustawienia > Sterowanie. Jest to odpowiednie dla opcjonalnych lub zaawansowanych przypisań.

---

## Kombinacje z modyfikatorami

Aby wymagać klawisza modyfikatora (Ctrl, Shift, Alt), zagnieźdź elementy `<btn>`:

### Ctrl + Lewy przycisk myszy

```xml
<input name="eAISetWaypoint">
    <btn name="kLControl">
        <btn name="mBLeft"/>
    </btn>
</input>
```

Zewnętrzny `<btn>` to modyfikator; wewnętrzny `<btn>` to klawisz główny. Gracz musi przytrzymać modyfikator, a następnie nacisnąć klawisz główny.

### Shift + Klawisz

```xml
<input name="UAMyModQuickAction">
    <btn name="kLShift">
        <btn name="kQ"/>
    </btn>
</input>
```

### Zasady zagnieżdżania

- **Zewnętrzny** `<btn>` to zawsze modyfikator (przytrzymywany)
- **Wewnętrzny** `<btn>` to wyzwalacz (naciskany podczas przytrzymywania modyfikatora)
- Typowy jest tylko jeden poziom zagnieżdżenia; głębsze zagnieżdżanie jest nietestowane i niezalecane

---

## Ukryte dane wejściowe

Użyj `visible="false"`, aby zarejestrować wejście, którego gracz nie może zobaczyć ani przypisać w menu Sterowanie. Jest to przydatne dla wewnętrznych wejść używanych przez kod twojego moda, które nie powinny być konfigurowane przez gracza.

```xml
<actions>
    <input name="eAITestInput" visible="false" />
    <input name="UAExpansionConfirm" loc="" visible="false" />
</actions>
```

Ukryte wejścia nadal mogą mieć domyślne przypisania klawiszy w bloku `<preset>`:

```xml
<preset>
    <input name="eAITestInput">
        <btn name="kY"/>
    </input>
</preset>
```

---

## Wiele domyślnych klawiszy

Akcja może mieć wiele domyślnych klawiszy. Wymień wiele elementów `<btn>` jako rodzeństwo:

```xml
<input name="UAExpansionConfirm">
    <btn name="kReturn" />
    <btn name="kNumpadEnter" />
</input>
```

Zarówno `Enter`, jak i `Numpad Enter` wyzwolą `UAExpansionConfirm`. Jest to przydatne dla akcji, gdzie wiele fizycznych klawiszy powinno mapować na tę samą logiczną akcję.

---

## Dostęp do danych wejściowych w skrypcie

### Uzyskanie API wejścia

Cały dostęp do wejść odbywa się przez `GetUApi()`, który zwraca globalne API User Action:

```c
UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");
```

### Odpytywanie w OnUpdate

Własne wejścia są zwykle odpytywane w `MissionGameplay.OnUpdate()` lub podobnych callbackach wywoływanych co klatkę:

```c
modded class MissionGameplay
{
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");

        if (input.LocalPress())
        {
            // Klawisz został właśnie naciśnięty w tej klatce
            OpenMyModMenu();
        }
    }
}
```

### Alternatywa: użycie nazwy wejścia bezpośrednio

Wiele modów sprawdza wejścia inline używając metod `UAInputAPI` z nazwami stringów:

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);

    Input input = GetGame().GetInput();

    if (input.LocalPress("UAMyModOpenMenu", false))
    {
        OpenMyModMenu();
    }
}
```

Parametr `false` w `LocalPress("nazwa", false)` oznacza, że sprawdzenie nie powinno konsumować zdarzenia wejścia.

---

## Referencja metod wejściowych

Gdy masz referencję `UAInput` (z `GetUApi().GetInputByName()`) lub używasz klasy `Input` bezpośrednio, te metody wykrywają różne stany wejścia:

| Metoda | Zwraca | Kiedy true |
|--------|--------|------------|
| `LocalPress()` | `bool` | Klawisz został naciśnięty **w tej klatce** (pojedyncze wyzwolenie przy wciśnięciu) |
| `LocalRelease()` | `bool` | Klawisz został zwolniony **w tej klatce** (pojedyncze wyzwolenie przy zwolnieniu) |
| `LocalClick()` | `bool` | Klawisz został naciśnięty i szybko zwolniony (tapnięcie) |
| `LocalHold()` | `bool` | Klawisz był przytrzymywany przez progowy czas |
| `LocalDoubleClick()` | `bool` | Klawisz został szybko tapnięty dwukrotnie |
| `LocalValue()` | `float` | Aktualna wartość analogowa (0.0 lub 1.0 dla klawiszy cyfrowych; zmienna dla osi analogowych) |

### Wzorce użycia

**Przełączanie przy naciśnięciu:**
```c
if (input.LocalPress("UAMyModToggle", false))
{
    m_IsEnabled = !m_IsEnabled;
}
```

**Przytrzymaj aby aktywować, zwolnij aby dezaktywować:**
```c
if (input.LocalPress("eAICommandMenu", false))
{
    ShowCommandWheel();
}

if (input.LocalRelease("eAICommandMenu", false) || input.LocalValue("eAICommandMenu", false) == 0)
{
    HideCommandWheel();
}
```

**Akcja na podwójne tapnięcie:**
```c
if (input.LocalDoubleClick("UAMyModSpecial", false))
{
    PerformSpecialAction();
}
```

**Przytrzymanie dla rozszerzonej akcji:**
```c
if (input.LocalHold("UAExpansionGPSToggle"))
{
    ToggleGPSMode();
}
```

---

## Tłumienie i wyłączanie danych wejściowych

### ForceDisable

Tymczasowo wyłącza konkretne wejście. Powszechnie używane przy otwieraniu menu, aby zapobiec wyzwalaniu akcji gry, gdy UI jest aktywne:

```c
// Wyłącz wejście gdy menu jest otwarte
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(true);

// Włącz ponownie gdy menu się zamknie
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(false);
```

### SupressNextFrame

Tłumi całe przetwarzanie wejść na następną klatkę. Używane podczas przejść kontekstu wejścia (np. zamykanie menu), aby zapobiec jednoklatkowemu "przenikaniu" wejścia:

```c
GetUApi().SupressNextFrame(true);
```

### UpdateControls

Po modyfikacji stanów wejścia wywołaj `UpdateControls()`, aby natychmiast zastosować zmiany:

```c
GetUApi().GetInputByName("UAExpansionBookToggle").ForceDisable(false);
GetUApi().UpdateControls();
```

### Wykluczenia wejść

System misji vanilla udostępnia grupy wykluczeń. Gdy menu jest aktywne, możesz wykluczyć kategorie wejść:

```c
// Tłum wejścia rozgrywki gdy ekwipunek jest otwarty
AddActiveInputExcludes({"inventory"});

// Przywróć przy zamknięciu
RemoveActiveInputExcludes({"inventory"});
```

---

## Referencja nazw klawiszy

Nazwy klawiszy używane w atrybucie `<btn name="">` podążają za określoną konwencją nazewnictwa. Oto kompletna referencja.

### Klawisze klawiatury

| Kategoria | Nazwy klawiszy |
|-----------|----------------|
| Litery | `kA`, `kB`, `kC`, `kD`, `kE`, `kF`, `kG`, `kH`, `kI`, `kJ`, `kK`, `kL`, `kM`, `kN`, `kO`, `kP`, `kQ`, `kR`, `kS`, `kT`, `kU`, `kV`, `kW`, `kX`, `kY`, `kZ` |
| Cyfry (górny rząd) | `k0`, `k1`, `k2`, `k3`, `k4`, `k5`, `k6`, `k7`, `k8`, `k9` |
| Klawisze funkcyjne | `kF1`, `kF2`, `kF3`, `kF4`, `kF5`, `kF6`, `kF7`, `kF8`, `kF9`, `kF10`, `kF11`, `kF12` |
| Modyfikatory | `kLControl`, `kRControl`, `kLShift`, `kRShift`, `kLAlt`, `kRAlt` |
| Nawigacja | `kUp`, `kDown`, `kLeft`, `kRight`, `kHome`, `kEnd`, `kPageUp`, `kPageDown` |
| Edycja | `kReturn`, `kBackspace`, `kDelete`, `kInsert`, `kSpace`, `kTab`, `kEscape` |
| Klawiatura numeryczna | `kNumpad0` ... `kNumpad9`, `kNumpadEnter`, `kNumpadPlus`, `kNumpadMinus`, `kNumpadMultiply`, `kNumpadDivide`, `kNumpadDecimal` |
| Interpunkcja | `kMinus`, `kEquals`, `kLBracket`, `kRBracket`, `kBackslash`, `kSemicolon`, `kApostrophe`, `kComma`, `kPeriod`, `kSlash`, `kGrave` |
| Blokady | `kCapsLock`, `kNumLock`, `kScrollLock` |

### Przyciski myszy

| Nazwa | Przycisk |
|-------|----------|
| `mBLeft` | Lewy przycisk myszy |
| `mBRight` | Prawy przycisk myszy |
| `mBMiddle` | Środkowy przycisk myszy (kliknięcie kółkiem) |
| `mBExtra1` | Przycisk myszy 4 (boczny przycisk wstecz) |
| `mBExtra2` | Przycisk myszy 5 (boczny przycisk naprzód) |

### Osie myszy

| Nazwa | Oś |
|-------|-----|
| `mAxisX` | Ruch myszy w poziomie |
| `mAxisY` | Ruch myszy w pionie |
| `mWheelUp` | Kółko przewijania w górę |
| `mWheelDown` | Kółko przewijania w dół |

### Wzorzec nazewnictwa

- **Klawiatura**: prefiks `k` + nazwa klawisza (np. `kT`, `kF5`, `kLControl`)
- **Przyciski myszy**: prefiks `mB` + nazwa przycisku (np. `mBLeft`, `mBRight`)
- **Osie myszy**: prefiks `m` + nazwa osi (np. `mAxisX`, `mWheelUp`)

---

## Przykłady z praktyki

### DayZ Expansion AI

Dobrze zorganizowany inputs.xml z widocznymi przypisaniami klawiszy, ukrytymi wejściami debugowymi i kombinacjami modyfikatorów:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU"/>
            <input name="eAISetWaypoint" loc="STR_EXPANSION_AI_SET_WAYPOINT"/>
            <input name="eAITestInput" visible="false" />
            <input name="eAITestLRIncrease" visible="false" />
            <input name="eAITestLRDecrease" visible="false" />
            <input name="eAITestUDIncrease" visible="false" />
            <input name="eAITestUDDecrease" visible="false" />
        </actions>

        <sorting name="expansion" loc="STR_EXPANSION_LABEL">
            <input name="eAICommandMenu" />
            <input name="eAISetWaypoint" />
            <input name="eAITestInput" />
            <input name="eAITestLRIncrease" />
            <input name="eAITestLRDecrease" />
            <input name="eAITestUDIncrease" />
            <input name="eAITestUDDecrease" />
        </sorting>
    </inputs>
    <preset>
        <input name="eAICommandMenu">
            <btn name="kT"/>
        </input>
        <input name="eAISetWaypoint">
            <btn name="kLControl">
                <btn name="mBLeft"/>
            </btn>
        </input>
        <input name="eAITestInput">
            <btn name="kY"/>
        </input>
        <input name="eAITestLRIncrease">
            <btn name="kRight"/>
        </input>
        <input name="eAITestLRDecrease">
            <btn name="kLeft"/>
        </input>
        <input name="eAITestUDIncrease">
            <btn name="kUp"/>
        </input>
        <input name="eAITestUDDecrease">
            <btn name="kDown"/>
        </input>
    </preset>
</modded_inputs>
```

Kluczowe obserwacje:
- `eAICommandMenu` przypisany do `T` --- widoczny w ustawieniach, gracz może zmienić
- `eAISetWaypoint` używa kombinacji **Ctrl + Lewy Klik** z modyfikatorem
- Wejścia testowe są `visible="false"` --- ukryte przed graczami, ale dostępne w kodzie

### DayZ Expansion Market

Minimalny inputs.xml dla ukrytego wejścia narzędziowego z wieloma domyślnymi klawiszami:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAExpansionConfirm" loc="" visible="false" />
        </actions>
    </inputs>
    <preset>
        <input name="UAExpansionConfirm">
            <btn name="kReturn" />
            <btn name="kNumpadEnter" />
        </input>
    </preset>
</modded_inputs>
```

Kluczowe obserwacje:
- Ukryte wejście (`visible="false"`) z pustym `loc` --- nigdy nie wyświetlane w ustawieniach
- Dwa domyślne klawisze: zarówno Enter, jak i Numpad Enter wyzwalają tę samą akcję
- Brak bloku `<sorting>` --- nie jest potrzebny, ponieważ wejście jest ukryte

### Kompletny szablon startowy

Minimalny, ale kompletny szablon dla nowego moda:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
            <input name="UAMyModQuickAction" loc="STR_MYMOD_INPUT_QUICK_ACTION" />
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModOpenMenu" />
            <input name="UAMyModQuickAction" />
        </sorting>
    </inputs>
    <preset>
        <input name="UAMyModOpenMenu">
            <btn name="kF6"/>
        </input>
        <!-- UAMyModQuickAction nie ma domyślnego klawisza; gracz musi go przypisać -->
    </preset>
</modded_inputs>
```

Z odpowiadającym stringtable.csv:

```csv
"Language","original","english"
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod"
"STR_MYMOD_INPUT_OPEN_MENU","Open Menu","Open Menu"
"STR_MYMOD_INPUT_QUICK_ACTION","Quick Action","Quick Action"
```

---

## Najczęstsze błędy

### Używanie `#` w atrybucie loc

```xml
<!-- ŹLE -->
<input name="UAMyAction" loc="#STR_MYMOD_ACTION" />

<!-- POPRAWNIE -->
<input name="UAMyAction" loc="STR_MYMOD_ACTION" />
```

System wejść dodaje `#` wewnętrznie. Dodanie go samodzielnie powoduje podwójny prefiks i wyszukiwanie się nie udaje.

### Kolizje nazw akcji

Jeśli dwa mody definiują `UAOpenMenu`, tylko jeden zadziała. Zawsze używaj prefiksu swojego moda:

```xml
<input name="UAMyModOpenMenu" />     <!-- Dobrze -->
<input name="UAOpenMenu" />          <!-- Ryzykowne -->
```

### Brakujący wpis sortowania

Jeśli zdefiniujesz akcję w `<actions>`, ale zapomnisz wymienić ją w `<sorting>`, akcja działa w kodzie, ale jest niewidoczna w menu Sterowanie. Gracz nie ma możliwości zmiany przypisania.

### Zapomnienie o definicji w akcjach

Jeśli wymienisz wejście w `<sorting>` lub `<preset>`, ale nigdy nie zdefiniujesz go w `<actions>`, silnik cicho je zignoruje.

### Przypisywanie kolidujących klawiszy

Wybieranie klawiszy, które kolidują z vanilla przypisaniami (jak `W`, `A`, `S`, `D`, `Tab`, `I`) powoduje, że zarówno twoja akcja, jak i vanilla akcja wyzwalają się jednocześnie. Używaj mniej popularnych klawiszy (F5-F12, klawiatura numeryczna) lub kombinacji z modyfikatorami dla bezpieczeństwa.

---

## Dobre praktyki

- Zawsze prefiksuj nazwy akcji `UA` + nazwa twojego moda (np. `UAMyModOpenMenu`). Ogólne nazwy jak `UAOpenMenu` będą kolidować z innymi modami.
- Udostępniaj atrybut `loc` dla każdego widocznego wejścia i zdefiniuj odpowiadający klucz stringtable. Bez niego menu Sterowanie wyświetla surową nazwę akcji.
- Wybieraj mało popularne domyślne klawisze (F5-F12, klawiatura numeryczna) lub kombinacje modyfikatorów (Ctrl+klawisz), aby zminimalizować konflikty z vanilla i popularnymi modami.
- Zawsze wymieniaj widoczne wejścia w bloku `<sorting>`. Wejście zdefiniowane w `<actions>`, ale brakujące w `<sorting>` jest niewidoczne dla gracza i nie może być przypisane.
- Cachuj referencję `UAInput` z `GetUApi().GetInputByName()` w zmiennej składowej zamiast wywoływać ją co klatkę w `OnUpdate`. Wyszukiwanie stringowe ma narzut.

---

## Kompatybilność i wpływ

- **Multi-Mod:** Kolizje nazw akcji to główne ryzyko. Jeśli dwa mody definiują `UAOpenMenu`, tylko jeden działa, a konflikt jest cichy. Silnik nie daje ostrzeżenia o zduplikowanych nazwach akcji między modami.
- **Wydajność:** Odpytywanie wejścia przez `GetUApi().GetInputByName()` obejmuje wyszukiwanie hasza stringowego. Odpytywanie 5-10 wejść na klatkę jest znikome, ale cachowanie referencji `UAInput` jest nadal zalecane dla modów z wieloma wejściami.
- **Wersja:** Format `inputs.xml` i struktura `<modded_inputs>` są stabilne od DayZ 1.0. Atrybut `visible` został dodany później (około 1.08) -- w starszych wersjach wszystkie wejścia są zawsze widoczne w menu Sterowanie.
