# Rozdział 5.3: Credits.json

[Strona główna](../README.md) | [<< Poprzedni: inputs.xml](02-inputs-xml.md) | **Credits.json** | [Następny: Format ImageSet >>](04-imagesets.md)

---

> **Podsumowanie:** Plik `Credits.json` definiuje napisy końcowe, które DayZ wyświetla dla twojego moda w menu modów gry. Wymienia członków zespołu, współpracowników i podziękowania zorganizowane według działów i sekcji. Choć czysto kosmetyczny, jest standardowym sposobem na wyrażenie uznania dla zespołu deweloperskiego.

---

## Spis treści

- [Przegląd](#przegląd)
- [Lokalizacja pliku](#lokalizacja-pliku)
- [Struktura JSON](#struktura-json)
- [Jak DayZ wyświetla napisy końcowe](#jak-dayz-wyświetla-napisy-końcowe)
- [Użycie zlokalizowanych nazw sekcji](#użycie-zlokalizowanych-nazw-sekcji)
- [Szablony](#szablony)
- [Prawdziwe przykłady](#prawdziwe-przykłady)
- [Częste błędy](#częste-błędy)

---

## Przegląd

Gdy gracz wybierze twojego moda w launcherze DayZ lub w menu modów w grze, silnik szuka pliku `Credits.json` wewnątrz PBO twojego moda. Jeśli go znajdzie, napisy końcowe są wyświetlane w przewijanym widoku podzielonym na działy i sekcje --- podobnie do napisów filmowych.

Plik jest opcjonalny. Jeśli go nie ma, dla twojego moda nie pojawia się sekcja napisów końcowych. Ale dołączenie go jest dobrą praktyką: uznaje pracę twojego zespołu i nadaje modowi profesjonalny wygląd.

---

## Lokalizacja pliku

Umieść `Credits.json` wewnątrz podfolderu `Data` katalogu Scripts lub bezpośrednio w korzeniu Scripts:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        Data/
          Credits.json       <-- Typowa lokalizacja (COT, Expansion, DayZ Editor)
        Credits.json         <-- Również prawidłowe (DabsFramework, Colorful-UI)
```

Obie lokalizacje działają. Silnik przeszukuje zawartość PBO w poszukiwaniu pliku o nazwie `Credits.json` (wielkość liter ma znaczenie na niektórych platformach).

---

## Struktura JSON

Plik używa prostej struktury JSON z trzema poziomami hierarchii:

```json
{
    "Header": "Nazwa mojego moda",
    "Departments": [
        {
            "DepartmentName": "Tytuł działu",
            "Sections": [
                {
                    "SectionName": "Tytuł sekcji",
                    "Names": ["Osoba 1", "Osoba 2"]
                }
            ]
        }
    ]
}
```

### Pola najwyższego poziomu

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `Header` | string | Nie | Główny tytuł wyświetlany na górze napisów. Jeśli pominięty, nagłówek się nie pojawia. |
| `Departments` | tablica | Tak | Tablica obiektów działów |

### Obiekt działu

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `DepartmentName` | string | Tak | Tekst nagłówka sekcji. Może być pusty `""` dla wizualnego grupowania bez nagłówka. |
| `Sections` | tablica | Tak | Tablica obiektów sekcji w tym dziale |

### Obiekt sekcji

W praktyce istnieją dwa warianty do wymieniania nazwisk. Silnik obsługuje oba.

**Wariant 1: tablica `Names`** (używany przez MyMod Core)

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `SectionName` | string | Tak | Pod-nagłówek w dziale |
| `Names` | tablica stringów | Tak | Lista nazwisk współpracowników |

**Wariant 2: tablica `SectionLines`** (używany przez COT, Expansion, DabsFramework)

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `SectionName` | string | Tak | Pod-nagłówek w dziale |
| `SectionLines` | tablica stringów | Tak | Lista nazwisk współpracowników lub linii tekstu |

Zarówno `Names`, jak i `SectionLines` służą temu samemu celowi. Używaj tego, co wolisz --- silnik renderuje je identycznie.

---

## Jak DayZ wyświetla napisy końcowe

Wyświetlanie napisów końcowych podąża za taką hierarchią wizualną:

```
╔══════════════════════════════════╗
║       NAZWA MOJEGO MODA          ║  <-- Header (duży, wyśrodkowany)
║                                  ║
║     NAZWA DZIAŁU                 ║  <-- DepartmentName (średni, wyśrodkowany)
║                                  ║
║     Nazwa sekcji                 ║  <-- SectionName (mały, wyśrodkowany)
║     Osoba 1                      ║  <-- Names/SectionLines (lista)
║     Osoba 2                      ║
║     Osoba 3                      ║
║                                  ║
║     Inna sekcja                  ║
║     Osoba A                      ║
║     Osoba B                      ║
║                                  ║
║     INNY DZIAŁ                   ║
║     ...                          ║
╚══════════════════════════════════╝
```

- `Header` pojawia się raz na górze
- Każdy `DepartmentName` działa jako główny separator sekcji
- Każdy `SectionName` działa jako pod-nagłówek
- Nazwiska przewijają się pionowo w widoku napisów

### Puste ciągi dla odstępów

Expansion używa pustych `DepartmentName` i `SectionName`, a także wpisów zawierających tylko białe znaki w `SectionLines`, aby tworzyć wizualne odstępy:

```json
{
    "DepartmentName": "",
    "Sections": [{
        "SectionName": "",
        "SectionLines": ["           "]
    }]
}
```

To popularny trik do kontrolowania wizualnego layoutu w przewijanym widoku napisów.

---

## Użycie zlokalizowanych nazw sekcji

Nazwy sekcji mogą odwoływać się do kluczy stringtable za pomocą prefiksu `#`, tak jak tekst UI:

```json
{
    "SectionName": "#STR_EXPANSION_CREDITS_SCRIPTERS",
    "SectionLines": ["Steve aka Salutesh", "LieutenantMaster"]
}
```

Gdy silnik to renderuje, rozwiązuje `#STR_EXPANSION_CREDITS_SCRIPTERS` na zlokalizowany tekst pasujący do języka gracza. Jest to przydatne, jeśli twój mod obsługuje wiele języków i chcesz, aby nagłówki sekcji napisów były przetłumaczone.

Nazwy działów mogą również używać referencji do stringtable:

```json
{
    "DepartmentName": "#legal_notices",
    "Sections": [...]
}
```

---

## Szablony

### Samodzielny deweloper

```json
{
    "Header": "My Awesome Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developer",
                    "Names": ["TwojaNazwa"]
                }
            ]
        }
    ]
}
```

### Mały zespół

```json
{
    "Header": "My Mod",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Developers",
                    "Names": ["Lead Dev", "Co-Developer"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Modeler1", "Modeler2"]
                },
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (francuski)",
                        "Translator2 (niemiecki)",
                        "Translator3 (rosyjski)"
                    ]
                }
            ]
        }
    ]
}
```

### Pełna profesjonalna struktura

```json
{
    "Header": "My Big Mod",
    "Departments": [
        {
            "DepartmentName": "Core Team",
            "Sections": [
                {
                    "SectionName": "Lead Developer",
                    "Names": ["ProjectLead"]
                },
                {
                    "SectionName": "Scripters",
                    "Names": ["Dev1", "Dev2", "Dev3"]
                },
                {
                    "SectionName": "3D Artists",
                    "Names": ["Artist1", "Artist2"]
                },
                {
                    "SectionName": "Mapping",
                    "Names": ["Mapper1"]
                }
            ]
        },
        {
            "DepartmentName": "Community",
            "Sections": [
                {
                    "SectionName": "Translators",
                    "Names": [
                        "Translator1 (czeski)",
                        "Translator2 (niemiecki)",
                        "Translator3 (rosyjski)"
                    ]
                },
                {
                    "SectionName": "Testers",
                    "Names": ["Tester1", "Tester2", "Tester3"]
                }
            ]
        },
        {
            "DepartmentName": "Legal Notices",
            "Sections": [
                {
                    "SectionName": "Licenses",
                    "Names": [
                        "Font Awesome - CC BY 4.0 License",
                        "Some assets licensed under ADPL-SA"
                    ]
                }
            ]
        }
    ]
}
```

---

## Prawdziwe przykłady

### MyMod Core

Minimalny, ale kompletny plik napisów końcowych używający wariantu `Names`:

```json
{
    "Header": "MyMod Core",
    "Departments": [
        {
            "DepartmentName": "Development",
            "Sections": [
                {
                    "SectionName": "Framework",
                    "Names": ["Documentation Team"]
                }
            ]
        }
    ]
}
```

### Community Online Tools (COT)

Używa wariantu `SectionLines` z wieloma sekcjami i podziękowaniami:

```json
{
    "Departments": [
        {
            "DepartmentName": "Community Online Tools",
            "Sections": [
                {
                    "SectionName": "Active Developers",
                    "SectionLines": [
                        "LieutenantMaster",
                        "LAVA (liquidrock)"
                    ]
                },
                {
                    "SectionName": "Inactive Developers",
                    "SectionLines": [
                        "Jacob_Mango",
                        "Arkensor",
                        "DannyDog68",
                        "Thurston",
                        "GrosTon1"
                    ]
                },
                {
                    "SectionName": "Thank you to the following communities",
                    "SectionLines": [
                        "PIPSI.NET AU/NZ",
                        "1SKGaming",
                        "AWG",
                        "Expansion Mod Team",
                        "Bohemia Interactive"
                    ]
                }
            ]
        }
    ]
}
```

Warto zauważyć: COT pomija pole `Header` całkowicie. Nazwa moda pochodzi z innych metadanych (config.cpp `CfgMods`).

### DabsFramework

```json
{
    "Departments": [{
        "DepartmentName": "Development",
        "Sections": [{
                "SectionName": "Developers",
                "SectionLines": [
                    "InclementDab",
                    "Gormirn"
                ]
            },
            {
                "SectionName": "Translators",
                "SectionLines": [
                    "InclementDab",
                    "DanceOfJesus (francuski)",
                    "MarioE (hiszpański)",
                    "Dubinek (czeski)",
                    "Steve AKA Salutesh (niemiecki)",
                    "Yuki (rosyjski)",
                    ".magik34 (polski)",
                    "Daze (węgierski)"
                ]
            }
        ]
    }]
}
```

### DayZ Expansion

Expansion demonstruje najbardziej zaawansowane użycie Credits.json, w tym:
- Zlokalizowane nazwy sekcji przez referencje stringtable (`#STR_EXPANSION_CREDITS_SCRIPTERS`)
- Informacje prawne jako oddzielny dział
- Puste nazwy działów i sekcji dla wizualnych odstępów
- Lista wspierających z dziesiątkami nazwisk

---

## Częste błędy

### Nieprawidłowa składnia JSON

Najczęstszy problem. JSON jest rygorystyczny w kwestii:
- **Końcowe przecinki**: `["a", "b",]` to nieprawidłowy JSON (końcowy przecinek po `"b"`)
- **Pojedyncze cudzysłowy**: Używaj `"podwójnych cudzysłowów"`, nie `'pojedynczych cudzysłowów'`
- **Niecytowane klucze**: `DepartmentName` musi być `"DepartmentName"`

Użyj walidatora JSON przed publikacją.

### Zła nazwa pliku

Plik musi mieć dokładną nazwę `Credits.json` (wielkie C). W systemach plików rozróżniających wielkość liter `credits.json` lub `CREDITS.JSON` nie zostaną znalezione.

### Mieszanie Names i SectionLines

W jednej sekcji używaj jednego lub drugiego:

```json
{
    "SectionName": "Developers",
    "Names": ["Dev1"],
    "SectionLines": ["Dev2"]
}
```

To jest niejednoznaczne. Wybierz jeden format i używaj go konsekwentnie w całym pliku.

### Problemy z kodowaniem

Zapisz plik jako UTF-8. Znaki spoza ASCII (nazwy z akcentami, znaki CJK) wymagają kodowania UTF-8, aby wyświetlały się prawidłowo w grze.

---

## Dobre praktyki

- Waliduj JSON zewnętrznym narzędziem przed spakowaniem do PBO -- silnik nie daje użytecznego komunikatu o błędzie dla zniekształconego JSON.
- Używaj wariantu `SectionLines` dla spójności, ponieważ jest to format używany przez COT, Expansion i DabsFramework.
- Dołącz dział "Legal Notices", jeśli twój mod zawiera zasoby stron trzecich (czcionki, ikony, dźwięki) z wymaganiami atrybucji.
- Utrzymuj pole `Header` zgodne z `name` twojego moda w `mod.cpp` i `config.cpp` dla spójnej tożsamości.
- Używaj pustych ciągów `DepartmentName` i `SectionName` oszczędnie dla wizualnych odstępów -- nadużywanie sprawia, że napisy wyglądają na rozczłonkowane.

---

## Kompatybilność i wpływ

- **Multi-Mod:** Każdy mod ma swój niezależny `Credits.json`. Nie ma ryzyka kolizji -- silnik czyta plik z wnętrza PBO każdego moda oddzielnie.
- **Wydajność:** Napisy końcowe są ładowane tylko wtedy, gdy gracz otwiera ekran szczegółów moda. Rozmiar pliku nie ma wpływu na wydajność rozgrywki.
