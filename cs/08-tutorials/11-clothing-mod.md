# Kapitola 8.11: Vytváření vlastního oblečení

[Domů](../../README.md) | [<< Předchozí: Vytváření vlastního vozidla](10-vehicle-mod.md) | **Vytváření vlastního oblečení** | [Další: Vytváření obchodního systému >>](12-trading-system.md)

---

> **Shrnutí:** Tento tutoriál vás provede vytvořením vlastní taktické bundy pro DayZ. Vyberete základní třídu, definujete oblečení v config.cpp s izolačními a kapacitními vlastnostmi, přetexturujete ho kamufláží pomocí skrytých výběrů, přidáte lokalizaci a spawning a volitelně ho rozšíříte o skriptové chování. Na konci budete mít nositelnou bundu, která hráče zahřívá, pojme předměty a spawnuje se ve světě.

---

## Obsah

- [Co budeme vytvářet](#what-we-are-building)
- [Krok 1: Výběr základní třídy](#step-1-choose-a-base-class)
- [Krok 2: config.cpp pro oblečení](#step-2-configcpp-for-clothing)
- [Krok 3: Vytvoření textur](#step-3-create-textures)
- [Krok 4: Přidání úložného prostoru](#step-4-add-cargo-space)
- [Krok 5: Lokalizace a spawning](#step-5-localization-and-spawning)
- [Krok 6: Skriptové chování (volitelné)](#step-6-script-behavior-optional)
- [Krok 7: Build, testování, doladění](#step-7-build-test-polish)
- [Kompletní reference kódu](#complete-code-reference)
- [Časté chyby](#common-mistakes)
- [Doporučené postupy](#best-practices)
- [Teorie vs praxe](#theory-vs-practice)
- [Co jste se naučili](#what-you-learned)

---

## Co budeme vytvářet

Vytvoříme **Taktickou maskáčovou bundu** -- bundu vojenského stylu s lesním maskovacím vzorem, kterou hráči mohou najít a nosit. Bude:

- Rozšiřovat vanilla model bundy Gorka (není potřeba 3D modelování)
- Mít vlastní maskáčovou přetexturu pomocí skrytých výběrů
- Poskytovat teplo prostřednictvím hodnot `heatIsolation`
- Pojmout předměty v kapsách (úložný prostor)
- Degradovat vizuálně při poškození napříč stavy zdraví
- Spawnovat se na vojenských lokacích ve světě

**Předpoklady:** Funkční struktura modu (nejprve dokončete [Kapitolu 8.1](01-first-mod.md) a [Kapitolu 8.2](02-custom-item.md)), textový editor, nainstalované DayZ Tools (pro TexView2) a grafický editor pro tvorbu maskáčových textur.

---

## Krok 1: Výběr základní třídy

Oblečení v DayZ dědí z `Clothing_Base`, ale tuto třídu téměř nikdy nerozšiřujete přímo. DayZ poskytuje mezilehlé základní třídy pro každý slot na těle:

| Základní třída | Slot na těle | Příklady |
|------------|-----------|----------|
| `Top_Base` | Tělo (trup) | Bundy, košile, mikiny |
| `Pants_Base` | Nohy | Džíny, cargo kalhoty |
| `Shoes_Base` | Nohy (chodidla) | Boty, tenisky |
| `HeadGear_Base` | Hlava | Helmy, čepice |
| `Mask_Base` | Obličej | Plynové masky, kukly |
| `Gloves_Base` | Ruce | Taktické rukavice |
| `Vest_Base` | Slot pro vestu | Nosičky plátů, taktické vesty |
| `Glasses_Base` | Brýle | Sluneční brýle |
| `Backpack_Base` | Záda | Batohy, tašky |

Kompletní řetězec dědičnosti je: `Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> VašeBunda`

### Proč rozšířit existující vanilla předmět

Můžete rozšiřovat na různých úrovních:

1. **Rozšíření konkrétního předmětu** (jako `GorkaEJacket_ColorBase`) -- nejjednodušší. Zdědíte model, animace, slot a všechny vlastnosti. Pouze změníte textury a upravíte hodnoty. Přesně tak to dělá Bohemia v ukázce `Test_ClothingRetexture`.
2. **Rozšíření základní třídy slotu** (jako `Top_Base`) -- čistý výchozí bod, ale musíte specifikovat model a všechny vlastnosti.
3. **Rozšíření `Clothing` přímo** -- pouze pro zcela vlastní chování slotu. Zřídka potřebné.

Pro naši taktickou bundu rozšíříme `GorkaEJacket_ColorBase`. Podívejme se na vanilla skript:

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

Všimněte si vzoru: třída `_ColorBase` obstarává sdílené chování a jednotlivé barevné varianty ji rozšiřují bez dalšího kódu. Jejich záznamy v config.cpp poskytují různé textury. Budeme následovat stejný vzor.

Základní třídy najdete v `scripts/4_world/entities/itembase/clothing_base.c` (definuje všechny základní třídy slotů) a `scripts/4_world/entities/itembase/clothing/` (jeden soubor na rodinu oblečení).

---

## Krok 2: config.cpp pro oblečení

Vytvořte `MyClothingMod/Data/config.cpp`:

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

### Vysvětlení polí specifických pro oblečení

**Tepelné a maskování:**

| Pole | Hodnota | Vysvětlení |
|-------|-------|-------------|
| `heatIsolation` | `0.8` | Poskytované teplo (rozsah 0.0-1.0). Engine tuto hodnotu násobí faktory zdraví a vlhkosti. Nepoškozená suchá bunda poskytuje plné teplo; zničená promáčená téměř žádné. |
| `visibilityModifier` | `0.7` | Viditelnost hráče pro AI (nižší = těžší detekce). |
| `absorbency` | `0.3` | Absorpce vody (0 = vodotěsné, 1 = houba). Nižší je lepší pro odolnost proti dešti. |

**Vanilla reference heatIsolation:** Tričko 0.2, Mikina 0.5, Bunda Gorka 0.7, Polní bunda 0.8, Vlněný kabát 0.9.

**Opravy:** `repairableWithKits[] = { 5, 2 }` uvádí typy sad (5=Šicí sada, 2=Kožedělnická šicí sada). `repairCosts[]` udává spotřebovaný materiál na opravu v odpovídajícím pořadí.

**Zbroj:** Hodnota `damage` 0.8 znamená, že hráč obdrží 80 % příchozího poškození (20 % absorbováno). Nižší hodnoty = větší ochrana.

**Vlhkost:** `Soaking` řídí, jak rychle déšť/voda namočí předmět. Záporné hodnoty `Drying` představují ztrátu vlhkosti z tělesného tepla, ohňů a ždímání.

**Skryté výběry:** Model Gorka má 3 výběry -- index 0 je model na zemi, indexy 1 a 2 jsou nošený model. Přepíšete `hiddenSelectionsTextures[]` vlastními cestami k PAA souborům.

**Úrovně zdraví:** Každý záznam je `{ práhZdraví, { cestaMaterialu } }`. Když zdraví klesne pod práh, engine vymění materiál. Vanilla damage rvmaty přidávají stopy opotřebení a trhliny.

---

## Krok 3: Vytvoření textur

### Hledání a tvorba textur

Textury bundy Gorka se nachází v `DZ\characters\tops\data\` -- extrahujte `gorka_upper_summer_co.paa` (barva), `gorka_upper_nohq.paa` (normálová mapa) a `gorka_upper_smdi.paa` (spekulární mapa) z P: disku jako šablony.

**Vytvoření maskáčového vzoru:**

1. Otevřete vanilla `_co` texturu v TexView2, exportujte jako TGA/PNG
2. Namalujte svůj lesní maskáč v grafickém editoru, sledujte UV rozložení
3. Zachovejte stejné rozměry (typicky 2048x2048 nebo 1024x1024)
4. Uložte jako TGA, převeďte na PAA pomocí TexView2 (File > Save As > .paa)

### Typy textur

| Přípona | Účel | Povinná? |
|--------|---------|-----------|
| `_co` | Hlavní barva/vzor | Ano |
| `_nohq` | Normálová mapa (detail tkaniny) | Ne -- používá výchozí vanilla |
| `_smdi` | Spekulární (lesklost) | Ne -- používá výchozí vanilla |
| `_as` | Alpha/povrchová maska | Ne |

Pro přetexturu potřebujete pouze `_co` textury. Normálové a spekulární mapy z vanilla modelu fungují nadále.

Pro úplnou kontrolu materiálu vytvořte `.rvmat` soubory a odkazujte je v `hiddenSelectionsMaterials[]`. Pro fungující příklady rvmat s variantami poškození a destrukce se podívejte na Bohemia ukázku `Test_ClothingRetexture`.

---

## Krok 4: Přidání úložného prostoru

Při rozšíření `GorkaEJacket_ColorBase` automaticky zdědíte jeho mřížku úložného prostoru (4x3) a inventářový slot (`"Body"`). Vlastnost `itemSize[] = { 3, 4 }` definuje, jak velká je bunda při uložení jako loot -- NE její kapacitu úložného prostoru.

Běžné sloty oblečení: `"Body"` (bundy), `"Legs"` (kalhoty), `"Feet"` (boty), `"Headgear"` (čepice), `"Vest"` (taktické vesty), `"Gloves"`, `"Mask"`, `"Back"` (batohy).

Některé oblečení akceptuje příslušenství (jako pouzdra na Plate Carrier). Přidejte je pomocí `attachments[] = { "Shoulder", "Armband" };`. Pro základní bundu je zděděný úložný prostor dostačující.

---

## Krok 5: Lokalizace a spawning

### Stringtable

Vytvořte `MyClothingMod/Data/Stringtable.csv`:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### Spawning (types.xml)

Přidejte do `types.xml` ve složce mise vašeho serveru:

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

Použijte `category name="clothes"` pro veškeré oblečení. Nastavte `usage` podle toho, kde se má předmět spawnovat (Military, Town, Police atd.) a `value` pro tier mapy (Tier1=pobřeží až Tier4=hluboko ve vnitrozemí).

---

## Krok 6: Skriptové chování (volitelné)

Pro jednoduchou přetexturu nepotřebujete skripty. Ale pro přidání chování při nošení bundy vytvořte skriptovou třídu.

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

### Skript vlastní bundy

Vytvořte `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c`:

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

### Klíčové události oblečení

| Událost | Kdy se spouští | Běžné použití |
|-------|---------------|------------|
| `OnWasAttached(parent, slot_id)` | Hráč si nasadí předmět | Aplikace buffů, zobrazení efektů |
| `OnWasDetached(parent, slot_id)` | Hráč si sundá předmět | Odebrání buffů, úklid |
| `EEItemAttached(item, slot_name)` | Předmět připojen k tomuto oblečení | Zobrazení/skrytí výběrů modelu |
| `EEItemDetached(item, slot_name)` | Předmět odpojen z tohoto oblečení | Vrácení vizuálních změn |
| `EEHealthLevelChanged(old, new, zone)` | Zdraví překročí práh | Aktualizace vizuálního stavu |

**Důležité:** Vždy volejte `super` na začátku každého přepsání. Rodičovská třída obstarává kritické chování enginu.

---

## Krok 7: Build, testování, doladění

### Build a spawn

Zabalte `Data/` a `Scripts/` jako samostatná PBO. Spusťte DayZ s vaším modem a spawněte bundu:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### Kontrolní seznam ověření

1. **Objeví se v inventáři?** Pokud ne, zkontrolujte `scope=2` a shodu názvu třídy.
2. **Správná textura?** Výchozí Gorka textura = špatné cesty. Bílá/růžová = chybějící soubor textury.
3. **Můžete si ji obléct?** Měla by jít do slotu Body. Pokud ne, zkontrolujte řetězec rodičovské třídy.
4. **Zobrazuje se název?** Pokud vidíte surový text `$STR_`, stringtable se nenačítá.
5. **Poskytuje teplo?** Zkontrolujte `heatIsolation` v debug/inspect menu.
6. **Poškození degraduje vizuál?** Otestujte pomocí: `ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### Přidání barevných variant

Následujte vzor `_ColorBase` -- přidejte sourozenecké třídy, které se liší pouze v texturách:

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

Každá varianta potřebuje vlastní `scope=2`, zobrazovaný název, textury, záznamy ve stringtable a záznam v types.xml.

---

## Kompletní reference kódu

### Adresářová struktura

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- Definice předmětů (viz Krok 2)
        Stringtable.csv         <-- Zobrazované názvy (viz Krok 5)
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- Potřebné pouze pro skriptové chování
        config.cpp              <-- Záznam CfgMods (viz Krok 6)
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

Všechny ostatní soubory jsou zobrazeny celé v příslušných krocích výše.

---

## Časté chyby

| Chyba | Důsledek | Oprava |
|---------|-------------|-----|
| Zapomenutí `scope=2` na variantách | Předmět se nespawnuje ani se nezobrazí v admin nástrojích | Nastavte `scope=0` na základ, `scope=2` na každou spawnovatelnou variantu |
| Špatný počet textur v poli | Bílé/růžové textury na některých částech | Srovnejte počet `hiddenSelectionsTextures` s počtem skrytých výběrů modelu (Gorka má 3) |
| Lomítka v cestách textur | Textury se tiše nenačtou | Používejte zpětná lomítka: `"MyMod\Data\tex.paa"` |
| Chybějící `requiredAddons` | Parser configu nemůže rozpoznat rodičovskou třídu | Zahrňte `"DZ_Characters_Tops"` pro vršky |
| `heatIsolation` nad 1.0 | Hráč se přehřívá v teplém počasí | Udržujte hodnoty v rozsahu 0.0-1.0 |
| Prázdné materiály v `healthLevels` | Žádná vizuální degradace poškozením | Vždy odkazujte alespoň vanilla rvmaty |
| Vynechání `super` v přepsáních | Nefunkční inventář, poškození nebo chování příloh | Vždy volejte `super.NázevMetody()` jako první |

---

## Doporučené postupy

- **Začněte jednoduchou přetexturou.** Zprovozněte mod s výměnou textury, než přidáte vlastní vlastnosti nebo skripty. Tím izolujete problémy configu od problémů s texturami.
- **Používejte vzor _ColorBase.** Sdílené vlastnosti v `scope=0` základu, pouze textury a názvy ve variantách se `scope=2`. Žádná duplikace.
- **Udržujte izolační hodnoty realistické.** Odkazujte vanilla předměty s podobnými reálnými ekvivalenty.
- **Testujte pomocí skriptové konzole před types.xml.** Potvrďte, že předmět funguje, než začnete ladit tabulky spawnů.
- **Používejte `$STR_` reference pro veškerý text směřující k hráčům.** Umožňuje budoucí lokalizaci bez změn v configu.
- **Balte Data a Scripts jako samostatná PBO.** Aktualizujte textury bez přestavby skriptů.
- **Poskytujte textury pro zem.** Textura `_g_` zajistí správný vzhled odhozených předmětů.

---

## Teorie vs praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `heatIsolation` | Jednoduché číslo tepla | Efektivní teplo závisí na zdraví a vlhkosti. Engine ho násobí faktory v `MiscGameplayFunctions.GetCurrentItemHeatIsolation()`. |
| Hodnoty `damage` zbroje | Nižší = větší ochrana | Hodnota 0.8 znamená, že hráč obdrží 80 % poškození (pouze 20 % absorbováno). Mnoho modderů čte 0.9 jako "90% ochrana", když je to ve skutečnosti 10 %. |
| Dědičnost `scope` | Děti dědí scope rodiče | NEDĚDÍ. Každá třída musí explicitně nastavit `scope`. Rodičovský `scope=0` nastaví všechny děti na výchozí `scope=0`. |
| `absorbency` | Řídí ochranu před deštěm | Řídí absorpci vlhkosti, která SNIŽUJE teplo. Vodotěsný = NÍZKÁ absorbency (0.1). Vysoká absorbency (0.8+) = nasákne jako houba. |
| Skryté výběry | Fungují na jakémkoli modelu | Ne všechny modely zpřístupňují stejné výběry. Před výběrem základního modelu zkontrolujte v Object Builder nebo vanilla configu. |

---

## Co jste se naučili

V tomto tutoriálu jste se naučili:

- Jak oblečení v DayZ dědí ze základních tříd specifických pro sloty (`Top_Base`, `Pants_Base` atd.)
- Jak definovat kus oblečení v config.cpp s tepelnými, zbrojovými a vlhkostními vlastnostmi
- Jak skryté výběry umožňují přetexturu vanilla modelů vlastními maskáčovými vzory
- Jak `heatIsolation`, `visibilityModifier` a `absorbency` ovlivňují gameplay
- Jak `DamageSystem` řídí vizuální degradaci a ochranu zbrojí
- Jak vytvořit barevné varianty pomocí vzoru `_ColorBase`
- Jak přidat záznamy spawnování s `types.xml` a zobrazované názvy se `Stringtable.csv`
- Jak volitelně přidat skriptové chování s událostmi `OnWasAttached` a `OnWasDetached`

**Další:** Použijte stejné techniky k vytvoření kalhot (`Pants_Base`), bot (`Shoes_Base`) nebo vesty (`Vest_Base`). Struktura configu je identická -- mění se pouze rodičovská třída a inventářový slot.

---

**Předchozí:** [Kapitola 8.8: HUD overlay](08-hud-overlay.md)
**Další:** Již brzy
