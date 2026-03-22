# Rozdział 8.11: Tworzenie niestandardowej odzieży

[Strona główna](../README.md) | [<< Poprzedni: Tworzenie niestandardowego pojazdu](10-vehicle-mod.md) | **Tworzenie niestandardowej odzieży** | [Następny: Budowanie systemu handlowego >>](12-trading-system.md)

---

> **Podsumowanie:** Ten poradnik przeprowadzi Cię przez proces tworzenia niestandardowej kurtki taktycznej dla DayZ. Wybierzesz klasę bazową, zdefiniujesz odzież w config.cpp z właściwościami izolacji cieplnej i ładowności, nałożysz reteksturę z wzorem kamuflażu za pomocą ukrytych selekcji, dodasz lokalizację i spawnowanie, a opcjonalnie rozszerzysz ją o zachowanie skryptowe. Na końcu będziesz mieć noszalną kurtkę, która ogrzewa graczy, przechowuje przedmioty i pojawia się na świecie.

---

## Spis treści

- [Co budujemy](#what-we-are-building)
- [Krok 1: Wybierz klasę bazową](#step-1-choose-a-base-class)
- [Krok 2: config.cpp dla odzieży](#step-2-configcpp-for-clothing)
- [Krok 3: Tworzenie tekstur](#step-3-create-textures)
- [Krok 4: Dodanie miejsca na ładunek](#step-4-add-cargo-space)
- [Krok 5: Lokalizacja i spawnowanie](#step-5-localization-and-spawning)
- [Krok 6: Zachowanie skryptowe (opcjonalne)](#step-6-script-behavior-optional)
- [Krok 7: Budowanie, testowanie, dopracowanie](#step-7-build-test-polish)
- [Kompletna dokumentacja kodu](#complete-code-reference)
- [Częste błędy](#common-mistakes)
- [Najlepsze praktyki](#best-practices)
- [Teoria a praktyka](#theory-vs-practice)
- [Czego się nauczyłeś](#what-you-learned)

---

## Co budujemy

Stworzymy **Taktyczną kurtkę kamuflażową** -- kurtkę w stylu wojskowym z leśnym kamuflażem, którą gracze mogą znaleźć i nosić. Będzie ona:

- Rozszerzać waniliowy model kurtki Gorka (bez konieczności modelowania 3D)
- Mieć niestandardową reteksturę kamuflażową z użyciem ukrytych selekcji
- Zapewniać ciepło poprzez wartości `heatIsolation`
- Przechowywać przedmioty w kieszeniach (miejsce na ładunek)
- Ulegać uszkodzeniom z wizualną degradacją w zależności od stanu zdrowia
- Pojawiać się w lokalizacjach wojskowych na świecie

**Wymagania wstępne:** Działająca struktura moda (najpierw ukończ [Rozdział 8.1](01-first-mod.md) i [Rozdział 8.2](02-custom-item.md)), edytor tekstu, zainstalowane DayZ Tools (dla TexView2) oraz edytor graficzny do tworzenia tekstur kamuflażu.

---

## Krok 1: Wybierz klasę bazową

Odzież w DayZ dziedziczy po `Clothing_Base`, ale prawie nigdy nie rozszerzasz tej klasy bezpośrednio. DayZ udostępnia pośrednie klasy bazowe dla każdego slotu na ciele:

| Klasa bazowa | Slot na ciele | Przykłady |
|------------|-----------|----------|
| `Top_Base` | Ciało (tułów) | Kurtki, koszule, bluzy |
| `Pants_Base` | Nogi | Dżinsy, spodnie cargo |
| `Shoes_Base` | Stopy | Buty, trampki |
| `HeadGear_Base` | Głowa | Hełmy, czapki |
| `Mask_Base` | Twarz | Maski przeciwgazowe, kominiarki |
| `Gloves_Base` | Ręce | Rękawice taktyczne |
| `Vest_Base` | Slot na kamizelkę | Kamizelki kuloodporne, rigsy |
| `Glasses_Base` | Okulary | Okulary przeciwsłoneczne |
| `Backpack_Base` | Plecy | Plecaki, torby |

Pełny łańcuch dziedziczenia to: `Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> TwojaKurtka`

### Dlaczego warto rozszerzać istniejący waniliowy przedmiot

Możesz rozszerzać na różnych poziomach:

1. **Rozszerz konkretny przedmiot** (jak `GorkaEJacket_ColorBase`) -- najłatwiejsze. Dziedziczysz model, animacje, slot i wszystkie właściwości. Wystarczy zmienić tekstury i dostroić wartości. Tak właśnie robi przykład Bohemii `Test_ClothingRetexture`.
2. **Rozszerz bazę slotu** (jak `Top_Base`) -- czysty punkt wyjścia, ale musisz określić model i wszystkie właściwości.
3. **Rozszerz bezpośrednio `Clothing`** -- tylko dla całkowicie niestandardowego zachowania slotu. Rzadko potrzebne.

Dla naszej kurtki taktycznej rozszerzymy `GorkaEJacket_ColorBase`. Spójrzmy na waniliowy skrypt:

```c
class GorkaEJacket_ColorBase extends Top_Base
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
class GorkaEJacket_Summer extends GorkaEJacket_ColorBase {};
class GorkaEJacket_Flat extends GorkaEJacket_ColorBase {};
```

Zwróć uwagę na wzorzec: klasa `_ColorBase` obsługuje wspólne zachowanie, a poszczególne warianty kolorystyczne rozszerzają ją bez dodatkowego kodu. Ich wpisy w config.cpp dostarczają różne tekstury. Będziemy podążać tym samym wzorcem.

Aby znaleźć klasy bazowe, zajrzyj do `scripts/4_world/entities/itembase/clothing_base.c` (definiuje wszystkie bazy slotów) i `scripts/4_world/entities/itembase/clothing/` (jeden plik na rodzinę odzieży).

---

## Krok 2: config.cpp dla odzieży

Utwórz `MyClothingMod/Data/config.cpp`:

```cpp
class CfgPatches
{
    class MyClothingMod_Data
    {
        units[] = { "MCM_TacticalJacket_Woodland" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgVehicles
{
    class GorkaEJacket_ColorBase;

    class MCM_TacticalJacket_ColorBase : GorkaEJacket_ColorBase
    {
        scope = 0;
        displayName = "";
        descriptionShort = "";

        weight = 1800;
        itemSize[] = { 3, 4 };
        absorbency = 0.3;
        heatIsolation = 0.8;
        visibilityModifier = 0.7;

        repairableWithKits[] = { 5, 2 };
        repairCosts[] = { 30.0, 25.0 };

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 200;
                    healthLevels[] =
                    {
                        { 1.0,  { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.70, { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.50, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.30, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.01, { "DZ\characters\tops\Data\GorkaUpper_destruct.rvmat" } }
                    };
                };
            };
            class GlobalArmor
            {
                class Melee
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
                class Infected
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
            };
        };

        class EnvironmentWetnessIncrements
        {
            class Soaking
            {
                rain = 0.015;
                water = 0.1;
            };
            class Drying
            {
                playerHeat = -0.08;
                fireBarrel = -0.25;
                wringing = -0.15;
            };
        };
    };

    class MCM_TacticalJacket_Woodland : MCM_TacticalJacket_ColorBase
    {
        scope = 2;
        displayName = "$STR_MCM_TacticalJacket_Woodland";
        descriptionShort = "$STR_MCM_TacticalJacket_Woodland_Desc";
        hiddenSelectionsTextures[] =
        {
            "MyClothingMod\Data\Textures\tactical_jacket_g_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa"
        };
    };
};
```

### Wyjaśnienie pól specyficznych dla odzieży

**Właściwości termiczne i ukrycia:**

| Pole | Wartość | Wyjaśnienie |
|-------|-------|-------------|
| `heatIsolation` | `0.8` | Zapewniane ciepło (zakres 0.0-1.0). Silnik mnoży tę wartość przez współczynniki zdrowia i wilgotności. Nieskazitelna sucha kurtka daje pełne ciepło; zniszczona, przemoczona -- prawie żadnego. |
| `visibilityModifier` | `0.7` | Widoczność gracza dla SI (niższe = trudniejszy do wykrycia). |
| `absorbency` | `0.3` | Absorpcja wody (0 = wodoodporne, 1 = gąbka). Niższe jest lepsze dla ochrony przed deszczem. |

**Waniliowe wartości referencyjne heatIsolation:** T-shirt 0.2, Bluza 0.5, Kurtka Gorka 0.7, Kurtka polowa 0.8, Płaszcz wełniany 0.9.

**Naprawa:** `repairableWithKits[] = { 5, 2 }` wymienia typy zestawów (5=Zestaw do szycia, 2=Skórzany zestaw do szycia). `repairCosts[]` podaje zużyty materiał na naprawę, w odpowiedniej kolejności.

**Pancerz:** Wartość `damage` 0.8 oznacza, że gracz otrzymuje 80% przychodzących obrażeń (20% pochłoniętych). Niższe wartości = większa ochrona.

**Wilgotność:** `Soaking` kontroluje, jak szybko deszcz/woda moczy przedmiot. Ujemne wartości `Drying` reprezentują utratę wilgoci z ciepła ciała, ognisk i wykręcania.

**Ukryte selekcje:** Model Gorka ma 3 selekcje -- indeks 0 to model naziemny, indeksy 1 i 2 to model noszony. Nadpisujesz `hiddenSelectionsTextures[]` swoimi niestandardowymi ścieżkami PAA.

**Poziomy zdrowia:** Każdy wpis to `{ prógZdrowia, { ścieżkaMateriału } }`. Gdy zdrowie spadnie poniżej progu, silnik zamienia materiał. Waniliowe rvmaty uszkodzeń dodają ślady zużycia i rozdarcia.

---

## Krok 3: Tworzenie tekstur

### Znajdowanie i tworzenie tekstur

Tekstury kurtki Gorka znajdują się w `DZ\characters\tops\data\` -- wyodrębnij `gorka_upper_summer_co.paa` (kolor), `gorka_upper_nohq.paa` (normalna) i `gorka_upper_smdi.paa` (specular) z dysku P:, aby użyć ich jako szablonów.

**Tworzenie wzoru kamuflażu:**

1. Otwórz waniliową teksturę `_co` w TexView2, wyeksportuj jako TGA/PNG
2. Namaluj swój leśny kamuflaż w edytorze graficznym, podążając za układem UV
3. Zachowaj te same wymiary (zazwyczaj 2048x2048 lub 1024x1024)
4. Zapisz jako TGA, przekonwertuj na PAA za pomocą TexView2 (File > Save As > .paa)

### Typy tekstur

| Sufiks | Przeznaczenie | Wymagane? |
|--------|---------|-----------|
| `_co` | Główny kolor/wzór | Tak |
| `_nohq` | Mapa normalnych (detale tkaniny) | Nie -- używa waniliowej domyślnej |
| `_smdi` | Specular (połysk) | Nie -- używa waniliowej domyślnej |
| `_as` | Maska alfa/powierzchni | Nie |

Dla retekstury potrzebujesz tylko tekstur `_co`. Mapy normalnych i specular z waniliowego modelu nadal działają.

Aby uzyskać pełną kontrolę nad materiałem, utwórz pliki `.rvmat` i odwołaj się do nich w `hiddenSelectionsMaterials[]`. Zobacz przykład Bohemii `Test_ClothingRetexture` dla działających przykładów rvmat z wariantami uszkodzeń i zniszczeń.

---

## Krok 4: Dodanie miejsca na ładunek

Rozszerzając `GorkaEJacket_ColorBase`, dziedziczysz automatycznie jego siatkę ładunku (4x3) i slot ekwipunku (`"Body"`). Właściwość `itemSize[] = { 3, 4 }` definiuje, jak duża jest kurtka przechowywana jako łup -- NIE jej pojemność ładunku.

Typowe sloty odzieży: `"Body"` (kurtki), `"Legs"` (spodnie), `"Feet"` (buty), `"Headgear"` (czapki), `"Vest"` (rigsy), `"Gloves"`, `"Mask"`, `"Back"` (plecaki).

Niektóra odzież przyjmuje załączniki (jak kieszenie kamizelki kuloodpornej). Dodaj je za pomocą `attachments[] = { "Shoulder", "Armband" };`. Dla podstawowej kurtki dziedziczony ładunek jest wystarczający.

---

## Krok 5: Lokalizacja i spawnowanie

### Stringtable

Utwórz `MyClothingMod/Data/Stringtable.csv`:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### Spawnowanie (types.xml)

Dodaj do pliku `types.xml` w folderze misji serwera:

```xml
<type name="MCM_TacticalJacket_Woodland">
    <nominal>8</nominal>
    <lifetime>14400</lifetime>
    <restock>3600</restock>
    <min>3</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="clothes" />
    <usage name="Military" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

Użyj `category name="clothes"` dla całej odzieży. Ustaw `usage` tak, aby odpowiadało miejscu spawnu przedmiotu (Military, Town, Police itp.) oraz `value` dla strefy mapy (Tier1=wybrzeże przez Tier4=głębokie wnętrze lądu).

---

## Krok 6: Zachowanie skryptowe (opcjonalne)

Dla prostej retekstury nie potrzebujesz skryptów. Ale aby dodać zachowanie po założeniu kurtki, utwórz klasę skryptową.

### Scripts config.cpp

```cpp
class CfgPatches
{
    class MyClothingMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgMods
{
    class MyClothingMod
    {
        dir = "MyClothingMod";
        name = "My Clothing Mod";
        author = "YourName";
        type = "mod";
        dependencies[] = { "World" };
        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyClothingMod/Scripts/4_World" };
            };
        };
    };
};
```

### Skrypt niestandardowej kurtki

Utwórz `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c`:

```c
class MCM_TacticalJacket_ColorBase extends GorkaEJacket_ColorBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player equipped Tactical Jacket");
        }
    }

    override void OnWasDetached(EntityAI parent, int slot_id)
    {
        super.OnWasDetached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player removed Tactical Jacket");
        }
    }

    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
```

### Kluczowe zdarzenia odzieży

| Zdarzenie | Kiedy się wyzwala | Typowe zastosowanie |
|-------|---------------|------------|
| `OnWasAttached(parent, slot_id)` | Gracz zakłada przedmiot | Zastosuj bonusy, pokaż efekty |
| `OnWasDetached(parent, slot_id)` | Gracz zdejmuje przedmiot | Usuń bonusy, posprzątaj |
| `EEItemAttached(item, slot_name)` | Przedmiot dołączony do tej odzieży | Pokaż/ukryj selekcje modelu |
| `EEItemDetached(item, slot_name)` | Przedmiot odłączony od tej odzieży | Odwróć zmiany wizualne |
| `EEHealthLevelChanged(old, new, zone)` | Zdrowie przekracza próg | Zaktualizuj stan wizualny |

**Ważne:** Zawsze wywołuj `super` na początku każdego nadpisania. Klasa nadrzędna obsługuje krytyczne zachowanie silnika.

---

## Krok 7: Budowanie, testowanie, dopracowanie

### Budowanie i spawnowanie

Spakuj `Data/` i `Scripts/` jako osobne PBO. Uruchom DayZ ze swoim modem i zaspawnuj kurtkę:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### Lista kontrolna weryfikacji

1. **Czy pojawia się w ekwipunku?** Jeśli nie, sprawdź `scope=2` i dopasowanie nazwy klasy.
2. **Prawidłowa tekstura?** Domyślna tekstura Gorka = złe ścieżki. Biała/różowa = brakujący plik tekstury.
3. **Czy można ją założyć?** Powinna trafić do slotu Body. Jeśli nie, sprawdź łańcuch klas nadrzędnych.
4. **Wyświetla się nazwa?** Jeśli widzisz surowy tekst `$STR_`, tabela stringów się nie ładuje.
5. **Zapewnia ciepło?** Sprawdź `heatIsolation` w menu debug/inspect.
6. **Uszkodzenia degradują wygląd?** Przetestuj za pomocą: `ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### Dodawanie wariantów kolorystycznych

Podążaj za wzorcem `_ColorBase` -- dodaj klasy rodzeństwa, które różnią się tylko teksturami:

```cpp
class MCM_TacticalJacket_Desert : MCM_TacticalJacket_ColorBase
{
    scope = 2;
    displayName = "$STR_MCM_TacticalJacket_Desert";
    descriptionShort = "$STR_MCM_TacticalJacket_Desert_Desc";
    hiddenSelectionsTextures[] =
    {
        "MyClothingMod\Data\Textures\tactical_jacket_g_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa"
    };
};
```

Każdy wariant potrzebuje własnego `scope=2`, nazwy wyświetlanej, tekstur, wpisów w tabeli stringów i wpisu w types.xml.

---

## Kompletna dokumentacja kodu

### Struktura katalogów

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- Definicje przedmiotów (patrz Krok 2)
        Stringtable.csv         <-- Nazwy wyświetlane (patrz Krok 5)
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- Potrzebne tylko dla zachowania skryptowego
        config.cpp              <-- Wpis CfgMods (patrz Krok 6)
        4_World/
            MyClothingMod/
                MCM_TacticalJacket.c
```

### mod.cpp

```cpp
name = "My Clothing Mod";
author = "YourName";
version = "1.0";
overview = "Adds a tactical jacket with camo variants to DayZ.";
```

Wszystkie pozostałe pliki są pokazane w pełni w odpowiednich krokach powyżej.

---

## Częste błędy

| Błąd | Konsekwencja | Rozwiązanie |
|---------|-------------|-----|
| Zapomnienie o `scope=2` na wariantach | Przedmiot się nie spawnuje ani nie pojawia w narzędziach admina | Ustaw `scope=0` na bazie, `scope=2` na każdym spawnowalnym wariancie |
| Zła liczba elementów tablicy tekstur | Białe/różowe tekstury na niektórych częściach | Dopasuj liczbę `hiddenSelectionsTextures` do ukrytych selekcji modelu (Gorka ma 3) |
| Ukośniki w przód w ścieżkach tekstur | Tekstury nie ładują się cicho | Używaj ukośników wstecznych: `"MyMod\Data\tex.paa"` |
| Brakujące `requiredAddons` | Parser konfiguracji nie może rozwiązać klasy nadrzędnej | Dołącz `"DZ_Characters_Tops"` dla topów |
| `heatIsolation` powyżej 1.0 | Gracz przegrzewa się w ciepłej pogodzie | Trzymaj wartości w zakresie 0.0-1.0 |
| Puste materiały `healthLevels` | Brak wizualnej degradacji uszkodzeń | Zawsze odwołuj się przynajmniej do waniliowych rvmatów |
| Pomijanie `super` w nadpisaniach | Zepsute zachowanie ekwipunku, obrażeń lub załączników | Zawsze wywołuj `super.NazwaMetody()` jako pierwsze |

---

## Najlepsze praktyki

- **Zacznij od prostej retekstury.** Uzyskaj działający mod z zamianą tekstury, zanim dodasz niestandardowe właściwości lub skrypty. To izoluje problemy konfiguracji od problemów z teksturami.
- **Używaj wzorca _ColorBase.** Wspólne właściwości w bazie `scope=0`, tylko tekstury i nazwy w wariantach `scope=2`. Bez duplikacji.
- **Utrzymuj realistyczne wartości izolacji.** Odwołuj się do waniliowych przedmiotów o podobnych odpowiednikach w rzeczywistości.
- **Testuj za pomocą konsoli skryptowej przed types.xml.** Potwierdź, że przedmiot działa, zanim zaczniesz debugować tabele spawnów.
- **Używaj odwołań `$STR_` dla całego tekstu skierowanego do gracza.** Umożliwia przyszłą lokalizację bez zmian w konfiguracji.
- **Pakuj Data i Scripts jako osobne PBO.** Aktualizuj tekstury bez przebudowywania skryptów.
- **Dostarczaj tekstury naziemne.** Tekstura `_g_` sprawia, że upuszczone przedmioty wyglądają poprawnie.

---

## Teoria a praktyka

| Koncepcja | Teoria | Rzeczywistość |
|---------|--------|---------|
| `heatIsolation` | Prosta liczba ciepła | Efektywne ciepło zależy od zdrowia i wilgotności. Silnik mnoży ją przez czynniki w `MiscGameplayFunctions.GetCurrentItemHeatIsolation()`. |
| Wartości `damage` pancerza | Niższe = większa ochrona | Wartość 0.8 oznacza, że gracz otrzymuje 80% obrażeń (tylko 20% pochłoniętych). Wielu modderów odczytuje 0.9 jako "90% ochrony", podczas gdy w rzeczywistości jest to 10%. |
| Dziedziczenie `scope` | Klasy potomne dziedziczą scope rodzica | NIE dziedziczą. Każda klasa musi jawnie ustawić `scope`. Rodzic z `scope=0` domyślnie ustawia wszystkie klasy potomne na `scope=0`. |
| `absorbency` | Kontroluje ochronę przed deszczem | Kontroluje absorpcję wilgoci, która ZMNIEJSZA ciepło. Wodoodporne = NISKA absorpcja (0.1). Wysoka absorpcja (0.8+) = nasiąka jak gąbka. |
| Ukryte selekcje | Działają na każdym modelu | Nie wszystkie modele eksponują te same selekcje. Sprawdź w Object Builder lub waniliowej konfiguracji przed wyborem modelu bazowego. |

---

## Czego się nauczyłeś

W tym poradniku nauczyłeś się:

- Jak odzież DayZ dziedziczy po klasach bazowych specyficznych dla slotów (`Top_Base`, `Pants_Base` itp.)
- Jak zdefiniować element odzieży w config.cpp z właściwościami termicznymi, pancerza i wilgotności
- Jak ukryte selekcje umożliwiają reteksturowanie waniliowych modeli niestandardowymi wzorami kamuflażu
- Jak `heatIsolation`, `visibilityModifier` i `absorbency` wpływają na rozgrywkę
- Jak `DamageSystem` kontroluje wizualną degradację i ochronę pancerza
- Jak tworzyć warianty kolorystyczne za pomocą wzorca `_ColorBase`
- Jak dodawać wpisy spawnów za pomocą `types.xml` i nazwy wyświetlane za pomocą `Stringtable.csv`
- Jak opcjonalnie dodać zachowanie skryptowe za pomocą zdarzeń `OnWasAttached` i `OnWasDetached`

**Następny:** Zastosuj te same techniki do tworzenia spodni (`Pants_Base`), butów (`Shoes_Base`) lub kamizelki (`Vest_Base`). Struktura konfiguracji jest identyczna -- zmienia się tylko klasa nadrzędna i slot ekwipunku.

---

**Poprzedni:** [Rozdział 8.8: Nakładka HUD](08-hud-overlay.md)
**Następny:** Wkrótce
