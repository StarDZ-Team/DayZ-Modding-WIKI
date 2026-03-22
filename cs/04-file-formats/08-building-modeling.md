# Kapitola 4.8: Modelování budov -- Dveře a žebříky

[Domů](../README.md) | [<< Předchozí: Průvodce Workbench](07-workbench-guide.md) | **Modelování budov**

---

## Úvod

Budovy v DayZ jsou víc než statická kulisa. Hráči s nimi neustále interagují -- otevírají dveře, lezou po žebřících, kryjí se za zdmi. Vytvoření vlastní budovy, která tyto interakce podporuje, vyžaduje pečlivé nastavení modelu: dveře potřebují osy rotace a pojmenované selekce napříč více LODy, žebříky potřebují přesně umístěné cesty pro lezení definované výhradně prostřednictvím vertexů v Memory LOD.

Tato kapitola pokrývá kompletní pracovní postup pro přidání interaktivních dveří a žebříků k vlastním modelům budov, na základě oficiální dokumentace Bohemia Interactive.

### Předpoklady

- Fungující **Workdrive** s vlastní strukturou složek modu.
- **Object Builder** (z balíčku DayZ Tools) s nakonfigurovaným **Buldozerem** (náhled modelu).
- Schopnost binarizovat a zabalit vlastní soubory modu do PBO.
- Znalost systému LODů a pojmenovaných selekcí (popsáno v [Kapitole 4.2: 3D modely](02-models.md)).

---

## Obsah

- [Přehled](#úvod)
- [Konfigurace dveří](#konfigurace-dveří)
  - [Nastavení modelu](#nastavení-modelu-pro-dveře)
  - [model.cfg -- Kostry a animace](#modelcfg----kostry-a-animace)
  - [Herní konfigurace (config.cpp)](#herní-konfigurace-configcpp)
  - [Dvoukřídlé dveře](#dvoukřídlé-dveře)
  - [Posuvné dveře](#posuvné-dveře)
  - [Problémy s obalovou koulí](#problémy-s-obalovou-koulí)
- [Konfigurace žebříku](#konfigurace-žebříku)
  - [Podporované typy žebříků](#podporované-typy-žebříků)
  - [Pojmenované selekce Memory LOD](#pojmenované-selekce-memory-lod)
  - [Požadavky na View Geometry](#požadavky-na-view-geometry)
  - [Rozměry žebříku](#rozměry-žebříku)
  - [Kolizní prostor](#kolizní-prostor)
  - [Konfigurační požadavky pro žebříky](#konfigurační-požadavky-pro-žebříky)
- [Shrnutí požadavků na model](#shrnutí-požadavků-na-model)
- [Osvědčené postupy](#osvědčené-postupy)
- [Časté chyby](#časté-chyby)
- [Reference](#reference)

---

## Konfigurace dveří

Interaktivní dveře vyžadují spojení tří věcí: P3D model se správně pojmenovanými selekcemi a paměťovými body, `model.cfg` definující animační kostru a parametry rotace, a `config.cpp` herní konfigurace, která propojí dveře se zvuky, zónami poškození a herní logikou.

### Nastavení modelu pro dveře

Dveře v P3D modelu musí obsahovat následující:

1. **Pojmenované selekce napříč všemi relevantními LODy.** Geometrie reprezentující dveře musí být přiřazena k pojmenované selekci (např. `door1`) v každém z těchto LODů:
   - **Resolution LOD** -- vizuální mesh, který hráč vidí.
   - **Geometry LOD** -- fyzický kolizní tvar. Musí také obsahovat pojmenovanou vlastnost `class` s hodnotou `house`.
   - **View Geometry LOD** -- používá se pro kontroly viditelnosti a ray-casting akcí. Název selekce zde odpovídá parametru `component` v herní konfiguraci.
   - **Fire Geometry LOD** -- používá se pro balistickou detekci zásahů.

2. **Vertexy Memory LOD**, které definují:
   - **Osu rotace** -- Dva vertexy tvořící osu rotace, přiřazené k pojmenované selekci jako `door1_axis`. Tato osa definuje linii závěsu, kolem které se dveře otáčejí.
   - **Pozici zvuku** -- Vertex přiřazený k pojmenované selekci jako `door1_action`, označující místo, odkud zvuky dveří pochází.
   - **Pozici widgetu akce** -- Kde se hráči zobrazí interakční widget.

#### Doporučené rozměry dveří

Téměř všechny dveře ve vanilkovém DayZ jsou **120 x 220 cm** (šířka x výška). Použití těchto standardních rozměrů zajišťuje, že animace vypadají správně a postavy přirozeně projdou otvorem. Modelujte dveře **výchozí zavřené** a animujte je do otevřené pozice -- Bohemia plánuje v budoucnu podporovat otevírání dveří oběma směry.

### model.cfg -- Kostry a animace

Každé animované dveře vyžadují soubor `model.cfg`. Tento config definuje strukturu kostí (kostru) a parametry animace. Umístěte `model.cfg` blízko souboru modelu, nebo výše ve struktuře složek -- přesné umístění je flexibilní, pokud ho binarizér najde.

`model.cfg` má dvě sekce:

#### CfgSkeletons

Definuje animované kosti. Každé dveře dostanou záznam kosti. Kosti jsou uvedeny jako páry: název kosti následovaný jeho rodičem (prázdný řetězec `""` pro kosti kořenové úrovně).

```cpp
class CfgSkeletons
{
    class Default
    {
        isDiscrete = 1;
        skeletonInherit = "";
        skeletonBones[] = {};
    };
    class Skeleton_2door: Default
    {
        skeletonInherit = "Default";
        skeletonBones[] =
        {
            "door1", "",
            "door2", ""
        };
    };
};
```

#### CfgModels

Definuje animace pro každou kost. Název třídy pod `CfgModels` **musí odpovídat názvu souboru vašeho modelu** (bez přípony), aby propojení fungovalo.

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };
    class yourmodelname: Default
    {
        skeletonName = "Skeleton_2door";
        class Animations
        {
            class Door1
            {
                type = "rotation";
                selection = "door1";
                source = "door1";
                axis = "door1_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = 1.4;
            };
            class Door2
            {
                type = "rotation";
                selection = "door2";
                source = "door2";
                axis = "door2_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -1.4;
            };
        };
    };
};
```

**Vysvětlení klíčových parametrů:**

| Parametr | Popis |
|----------|-------|
| `type` | Typ animace. Použijte `"rotation"` pro otočné dveře, `"translation"` pro posuvné dveře. |
| `selection` | Pojmenovaná selekce v modelu, která má být animována. |
| `source` | Propojení s třídou `Doors` v herní konfiguraci. Musí odpovídat názvu třídy v `config.cpp`. |
| `axis` | Pojmenovaná selekce v Memory LOD definující osu rotace (dva vertexy). |
| `memory` | Nastavte na `1` pro indikaci, že osa je definována v Memory LOD. |
| `minValue` / `maxValue` | Rozsah fáze animace. Typicky `0` až `1`. |
| `angle0` / `angle1` | Úhly rotace v **radiánech**. `angle1` definuje, jak daleko se dveře otevřou. Použijte záporné hodnoty pro obrácení směru. Hodnota `1.4` radiánů je přibližně 80 stupňů. |

#### Ověření v Buldozeru

Po napsání `model.cfg` otevřete model v Object Builderu s běžícím Buldozerem. Použijte klávesy `[` a `]` pro procházení dostupných zdrojů animací a `;` / `'` (nebo kolečko myši nahoru/dolů) pro posunutí animace vpřed nebo vzad. Toto umožňuje ověřit, že se dveře správně otáčejí kolem své osy.

### Herní konfigurace (config.cpp)

Herní konfigurace propojuje animovaný model s herními systémy -- zvuky, poškozením a logikou stavu dveří. Název třídy konfigurace **musí** dodržovat vzor `land_modelname` pro správné propojení s modelem.

```cpp
class CfgPatches
{
    class yourcustombuilding
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Data"};
        author = "yourname";
        name = "addonname";
        url = "";
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class land_modelname: HouseNoDestruct
    {
        model = "\path\to\your\model\file.p3d";
        class Doors
        {
            class Door1
            {
                displayName = "door 1";
                component = "Door1";
                soundPos = "door1_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
            class Door2
            {
                displayName = "door 2";
                component = "Door2";
                soundPos = "door2_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
        };
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                };
            };
            class GlobalArmor
            {
                class Projectile
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
                class Melee
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
            };
            class DamageZones
            {
                class Door1
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door1"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
                class Door2
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door2"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
            };
        };
    };
};
```

**Vysvětlení parametrů konfigurace dveří:**

| Parametr | Popis |
|----------|-------|
| `component` | Pojmenovaná selekce ve **View Geometry LOD** použitá pro tyto dveře. |
| `soundPos` | Pojmenovaná selekce v **Memory LOD**, kde se přehrávají zvuky dveří. |
| `animPeriod` | Rychlost animace dveří (v sekundách). |
| `initPhase` | Počáteční fáze animace (`0` = zavřeno, `1` = plně otevřeno). Otestujte v Buldozeru, abyste ověřili, která hodnota odpovídá kterému stavu. |
| `initOpened` | Pravděpodobnost, že se dveře ve světě spawnou otevřené. `0.5` znamená 50% šanci. |
| `soundOpen` | Třída zvuku z `CfgActionSounds` přehrávaná při otevření dveří. Viz `DZ\sounds\hpp\config.cpp` pro dostupné sady zvuků. |
| `soundClose` | Třída zvuku přehrávaná při zavření dveří. |
| `soundLocked` | Třída zvuku přehrávaná, když se hráč pokusí otevřít zamčené dveře. |
| `soundOpenABit` | Třída zvuku přehrávaná, když hráč vyrazí zamčené dveře. |

**Důležité poznámky ke konfiguraci:**

- Všechny budovy v DayZ dědí z `HouseNoDestruct`.
- Každý název třídy pod `class Doors` musí odpovídat parametru `source` definovanému v `model.cfg`.
- Sekce `DamageSystem` musí obsahovat podtřídu `DamageZones` pro každé dveře. Pole `componentNames[]` odkazuje na pojmenovanou selekci z Fire Geometry LOD modelu.
- Přidání pojmenované vlastnosti `class=house` a třídy herní konfigurace vyžaduje, aby byl váš terén znovu binarizován (cesty modelů v souborech `.wrp` jsou nahrazeny referencemi na třídy herní konfigurace).

### Dvoukřídlé dveře

Dvoukřídlé dveře (dvě křídla, která se otevírají společně jednou interakcí) jsou v DayZ běžné. Vyžadují speciální nastavení:

**V modelu:**
- Nakonfigurujte každé křídlo jako individuální dveře s vlastní pojmenovanou selekcí (např. `door3_1` a `door3_2`).
- V **Memory LOD** musí být akční bod **sdílený** mezi oběma křídly -- použijte jednu pojmenovanou selekci a jeden vertex pro pozici akce.
- Pojmenovaná selekce bez přípony (např. `door3` bez přípony křídla) musí pokrývat **obě** kliky dveří.
- **View Geometry** a **Fire Geometry** vyžadují další pojmenovanou selekci, která pokrývá obě křídla dohromady.

**V model.cfg:**
- Definujte každé křídlo jako samostatnou třídu animace, ale nastavte **stejný parametr `source`** pro obě křídla (např. `"doors34"` pro obě).
- Nastavte `angle1` na **kladnou** hodnotu pro jedno křídlo a **zápornou** pro druhé, aby se otáčela v opačných směrech.

**V config.cpp:**
- Definujte pouze **jednu** třídu pod `class Doors` s názvem odpovídajícím sdílenému parametru `source`.
- Obdobně definujte pouze **jednu** položku v `DamageZones` pro pár dvoukřídlých dveří.

### Posuvné dveře

Pro dveře, které se posouvají po kolejnici místo otáčení (jako stodolní dveře nebo posuvné panely), změňte `type` animace v `model.cfg` z `"rotation"` na `"translation"`. Vertexy osy v Memory LOD pak definují směr pohybu místo otočné linie.

### Problémy s obalovou koulí

Ve výchozím nastavení je obalová koule modelu dimenzována tak, aby obsahovala celý objekt. Když jsou dveře modelovány v zavřené pozici, otevřená pozice může přesahovat **mimo** tuto obalovou kouli. To způsobuje problémy:

- **Akce přestanou fungovat** -- ray-casting pro interakce s dveřmi selže z určitých úhlů.
- **Balistika ignoruje dveře** -- kulky projdou geometrií, která leží mimo obalovou kouli.

**Řešení:** Vytvořte pojmenovanou selekci v Memory LOD, která pokrývá větší oblast, kterou budova zabírá, když jsou dveře plně otevřené. Pak přidejte parametr `bounding` do vaší třídy herní konfigurace:

```cpp
class land_modelname: HouseNoDestruct
{
    bounding = "selection_name";
    // ... zbytek konfigurace
};
```

Toto přepíše automatický výpočet obalové koule jedním, který zahrnuje všechny pozice dveří.

---

## Konfigurace žebříku

Na rozdíl od dveří žebříky v DayZ nevyžadují **žádnou konfiguraci animací** a **žádné speciální položky herní konfigurace** kromě základní třídy budovy. Celé nastavení žebříku se provádí prostřednictvím umístění vertexů v Memory LOD a jedné selekce View Geometry. To činí žebříky jednodušší na nastavení než dveře, ale umístění vertexů musí být přesné.

### Podporované typy žebříků

DayZ podporuje dva typy žebříků:

1. **Vstup zespodu zepředu s výstupem do strany nahoře** -- Hráč přistupuje zepředu dole a vystupuje do strany nahoře (u zdi).
2. **Vstup zespodu zepředu s výstupem vpřed nahoře** -- Hráč přistupuje zepředu dole a vystupuje vpřed nahoře (na střechu nebo plošinu).

Oba typy také podporují **boční vstupní a výstupní body uprostřed**, umožňující hráčům nastoupit a sestoupit ze žebříku v mezilehlých patrech. Žebříky mohou být také umístěny **pod úhlem** místo striktně vertikálně.

### Pojmenované selekce Memory LOD

Žebřík je definován výhradně pojmenovanými vertexy v Memory LOD. Každý název selekce začíná `ladderN_`, kde **N** je ID žebříku, počínaje od `1`. Budova může mít více žebříků (`ladder1_`, `ladder2_`, `ladder3_` atd.).

Zde je kompletní sada pojmenovaných selekcí pro žebřík:

| Pojmenovaná selekce | Popis |
|---------------------|-------|
| `ladderN_bottom_front` | Definuje spodní vstupní stupeň -- kde hráč začíná lézt. |
| `ladderN_middle_left` | Definuje střední vstupní/výstupní bod (levá strana). Může obsahovat více vertexů, pokud žebřík prochází více patry. |
| `ladderN_middle_right` | Definuje střední vstupní/výstupní bod (pravá strana). Může obsahovat více vertexů pro vícepatrové žebříky. |
| `ladderN_top_front` | Definuje horní výstupní stupeň -- kde hráč dokončí lezení (typ předního výstupu). |
| `ladderN_top_left` | Definuje horní směr výstupu pro žebříky na zdi (levá strana). Musí být alespoň **5 stupňů žebříku výše** než podlaha (přibližně výška stojícího hráče na žebříku). |
| `ladderN_top_right` | Definuje horní směr výstupu pro žebříky na zdi (pravá strana). Stejný požadavek na výšku jako `top_left`. |
| `ladderN` | Definuje, kde se hráči zobrazí widget akce "Nastoupit na žebřík". |
| `ladderN_dir` | Definuje směr, ze kterého lze na žebřík lézt (směr přístupu). |
| `ladderN_con` | Měřicí bod pro akci vstupu. **Musí být umístěn na úrovni podlahy.** |
| `ladderN_con_dir` | Definuje směr 180stupňového kužele (vycházejícího z `ladderN_con`), ve kterém je dostupná akce vstupu na žebřík. |

Každý z nich je vertex (nebo sada vertexů pro střední body), který ručně umístíte v Memory LOD Object Builderu.

### Požadavky na View Geometry

Kromě nastavení Memory LOD musíte vytvořit komponentu **View Geometry** s pojmenovanou selekcí nazvanou `ladderN`. Tato selekce musí pokrývat **celý objem** žebříku -- celou výšku a šířku lezecké oblasti. Bez této selekce View Geometry žebřík nebude správně fungovat.

### Rozměry žebříku

Animace lezení jsou navrženy pro **pevné rozměry**. Příčle a rozestupy vašeho žebříku by měly odpovídat vanilkovým proporcím žebříku, aby se animace správně zarovnaly. Prostudujte oficiální repozitář DayZ Samples pro přesná měření -- vzorové díly žebříku jsou stejné, jaké se používají na většině vanilkových budov.

### Kolizní prostor

Postavy **kolidují s geometrií při lezení po žebříku**. To znamená, že musíte zajistit dostatečný volný prostor kolem žebříku pro lezoucí postavu v obou:

- **Geometry LOD** -- fyzická kolize.
- **Roadway LOD** -- interakce s povrchem.

Pokud je prostor příliš těsný, postava se bude proklipovat zdmi nebo se zasekne během animace lezení.

### Konfigurační požadavky pro žebříky

Na rozdíl od série Arma, DayZ **nevyžaduje** pole `ladders[]` ve třídě herní konfigurace. Dvě věci jsou však stále nutné:

1. Váš model musí mít **reprezentaci v konfiguraci** -- `config.cpp` s třídou `CfgVehicles` (stejná základní třída použitá pro dveře; viz sekce konfigurace dveří výše).
2. **Geometry LOD** musí obsahovat pojmenovanou vlastnost `class` s hodnotou `house`.

Mimo tyto dva požadavky je žebřík plně definován vertexy Memory LOD a selekcí View Geometry. Žádné položky animací v `model.cfg` nejsou potřeba.

---

## Shrnutí požadavků na model

Budovy s dveřmi a žebříky musí obsahovat několik LODů, z nichž každý slouží odlišnému účelu. Tabulka níže shrnuje, co musí každý LOD obsahovat:

| LOD | Účel | Požadavky pro dveře | Požadavky pro žebříky |
|-----|------|---------------------|----------------------|
| **Resolution LOD** | Vizuální mesh zobrazený hráči. | Pojmenovaná selekce pro geometrii dveří (např. `door1`). | Žádné specifické požadavky. |
| **Geometry LOD** | Fyzická detekce kolizí. | Pojmenovaná selekce pro geometrii dveří. Pojmenovaná vlastnost `class = "house"`. | Pojmenovaná vlastnost `class = "house"`. Dostatečný prostor kolem žebříku pro lezoucí postavy. |
| **Fire Geometry LOD** | Balistická detekce zásahů (kulky, projektily). | Pojmenovaná selekce odpovídající `componentNames[]` v konfiguraci zóny poškození. | Žádné specifické požadavky. |
| **View Geometry LOD** | Kontroly viditelnosti, ray-casting akcí. | Pojmenovaná selekce odpovídající parametru `component` v konfiguraci dveří. | Pojmenovaná selekce `ladderN` pokrývající celý objem žebříku. |
| **Memory LOD** | Definice os, akční body, pozice zvuků. | Vertexy os (`door1_axis`), pozice zvuku (`door1_action`), pozice widgetu akce. | Kompletní sada vertexů žebříku (`ladderN_bottom_front`, `ladderN_top_left`, `ladderN_dir`, `ladderN_con` atd.). |
| **Roadway LOD** | Interakce povrchu pro postavy. | Typicky není vyžadováno. | Dostatečný prostor kolem žebříku pro lezoucí postavy. |

### Konzistence pojmenovaných selekcí

Kritickým požadavkem je, že **pojmenované selekce musí být konzistentní napříč všemi LODy**, které na ně odkazují. Pokud se selekce nazývá `door1` v Resolution LOD, musí se také nazývat `door1` v Geometry, Fire Geometry a View Geometry LOD. Neshodné názvy mezi LODy způsobí tiché selhání dveří nebo žebříku.

---

## Osvědčené postupy

1. **Modelujte dveře výchozí zavřené.** Animujte od zavřených k otevřeným. Bohemia plánuje podporovat otevírání dveří oběma směry, takže začínání od zavřených je připravené do budoucna.

2. **Používejte standardní rozměry dveří.** Držte se 120 x 220 cm pro otvory dveří, pokud nemáte specifický designový důvod. To odpovídá vanilkovým budovám a zajišťuje, že animace postav vypadají správně.

3. **Testujte animace v Buldozeru před balením.** Použijte `[` / `]` pro procházení zdrojů a `;` / `'` nebo kolečko myši pro posouvání animace. Zachycení chyb os nebo úhlů zde šetří značný čas.

4. **Přepište obalové koule pro velké budovy.** Pokud má vaše budova dveře, které se významně otáčejí ven, vytvořte selekci Memory LOD pokrývající plný animovaný rozsah a propojte ji s konfiguračním parametrem `bounding`.

5. **Umísťujte vertexy žebříku přesně.** Animace lezení jsou fixovány na konkrétní rozměry. Vertexy, které jsou příliš daleko od sebe nebo špatně zarovnané, způsobí, že postava bude levitat, proklipovat nebo se zasekne.

6. **Zajistěte prostor kolem žebříků.** Ponechte dostatečný prostor v Geometry a Roadway LODech pro model postavy během lezení.

7. **Udržujte jeden `model.cfg` na model nebo složku.** `model.cfg` nemusí být vedle souboru `.p3d`, ale udržování blízko usnadňuje organizaci. Může být také umístěn výše ve struktuře složek pro pokrytí více modelů.

8. **Používejte repozitář DayZ Samples.** Bohemia poskytuje funkční vzorky pro dveře (`Test_Building`) i žebříky (`Test_Ladders`) na `https://github.com/BohemiaInteractive/DayZ-Samples`. Prostudujte je před vytvářením vlastních.

9. **Znovu binarizujte terén po přidání konfigurací budov.** Přidání `class=house` a třídy herní konfigurace znamená, že cesty modelů v souborech `.wrp` jsou nahrazeny referencemi tříd. Váš terén musí být znovu binarizován, aby se to projevilo.

10. **Aktualizujte navmesh po umístění budov.** Přestavěný terén bez aktualizovaného navmeshe může způsobit, že AI bude procházet dveřmi místo jejich správného používání.

---

## Časté chyby

### Dveře

| Chyba | Příznak | Řešení |
|-------|---------|--------|
| Název třídy `CfgModels` neodpovídá názvu souboru modelu. | Animace dveří se nepřehraje. | Přejmenujte třídu tak, aby přesně odpovídala názvu souboru `.p3d` (bez přípony). |
| Chybějící pojmenovaná selekce v jednom nebo více LODech. | Dveře jsou viditelné, ale ne interaktivní, nebo kulky procházejí. | Zajistěte, aby selekce existovala v Resolution, Geometry, View Geometry a Fire Geometry LOD. |
| Chybějící vertexy osy nebo definován pouze jeden vertex. | Dveře se otáčejí ze špatného bodu nebo se vůbec neotáčejí. | Umístěte přesně dva vertexy v Memory LOD pro selekci osy (např. `door1_axis`). |
| `source` v `model.cfg` neodpovídá názvu třídy v `config.cpp` Doors. | Dveře nejsou propojeny s herní logikou -- žádné zvuky, žádné změny stavu. | Zajistěte, aby parametr `source` a název třídy Doors byly identické. |
| Zapomenutí pojmenované vlastnosti `class = "house"` v Geometry LOD. | Budova není rozpoznána jako interaktivní struktura. | Přidejte pojmenovanou vlastnost v Geometry LOD Object Builderu. |
| Příliš malá obalová koule. | Akce dveří nebo balistika selhávají z určitých úhlů. | Přidejte selekci `bounding` v Memory LOD a odkazujte na ni v konfiguraci. |
| Záměna záporného vs. kladného `angle1` u dvoukřídlých dveří. | Obě křídla se otáčejí stejným směrem a proklipují se navzájem. | Jedno křídlo potřebuje kladný `angle1`, druhé záporný. |

### Žebříky

| Chyba | Příznak | Řešení |
|-------|---------|--------|
| `ladderN_con` není umístěn na úrovni podlahy. | Akce "Nastoupit na žebřík" se nezobrazí nebo se zobrazí ve špatné výšce. | Přesuňte vertex na úroveň země/podlahy. |
| Chybějící selekce View Geometry `ladderN`. | Žebřík nelze použít. | Vytvořte komponentu View Geometry s pojmenovanou selekcí pokrývající celý objem žebříku. |
| `ladderN_top_left` / `ladderN_top_right` příliš nízko. | Postava proklipuje zdí nebo podlahou na horním výstupu. | Tyto musí být alespoň 5 stupňů žebříku výše než úroveň podlahy. |
| Nedostatečný prostor v Geometry LOD. | Postava se zasekne nebo proklipuje zdmi při lezení. | Rozšiřte mezeru kolem žebříku v Geometry a Roadway LODech. |
| Číslování žebříků začíná na 0. | Žebřík nefunguje. | Číslování začíná od `1` (`ladder1_`, nikoli `ladder0_`). |
| Specifikace `ladders[]` v herní konfiguraci. | Zbytečná práce (neškodná, ale zbytečná). | DayZ nepoužívá pole `ladders[]`. Odstraňte ho a spoléhejte na umístění vertexů v Memory LOD. |

---

## Reference

- [Bohemia Interactive -- Doors on buildings](https://community.bistudio.com/wiki/DayZ:Doors_on_buildings) (oficiální dokumentace BI)
- [Bohemia Interactive -- Ladders on buildings](https://community.bistudio.com/wiki/DayZ:Ladders_on_buildings) (oficiální dokumentace BI)
- [DayZ Samples -- Test_Building](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Building) (funkční vzor dveří)
- [DayZ Samples -- Test_Ladders](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Ladders) (funkční vzor žebříku)
- [Kapitola 4.2: 3D modely](02-models.md) -- Systém LOD, pojmenované selekce, základy `model.cfg`

---

## Navigace

| Předchozí | Nahoru | Další |
|-----------|--------|-------|
| [4.7 Průvodce Workbench](07-workbench-guide.md) | [Část 4: Formáty souborů a DayZ Tools](01-textures.md) | -- |
