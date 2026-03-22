# Kapitola 5.5: Konfigurační soubory serveru

[Domů](../README.md) | [<< Předchozí: Formát ImageSet](04-imagesets.md) | **Konfigurační soubory serveru** | [Další: Konfigurace výbavy při spawnu >>](06-spawning-gear.md)

---

> **Shrnutí:** Servery DayZ se konfigurují prostřednictvím souborů XML, JSON a skriptů ve složce mise (např. `mpmissions/dayzOffline.chernarusplus/`). Tyto soubory řídí spawn předmětů, chování ekonomiky, herní pravidla a identitu serveru. Jejich pochopení je nezbytné pro přidávání vlastních předmětů do lootové ekonomiky, ladění parametrů serveru nebo vytváření vlastní mise.

---

## Obsah

- [Přehled](#přehled)
- [init.c --- Vstupní bod mise](#initc----vstupní-bod-mise)
- [types.xml --- Definice spawnu předmětů](#typesxml----definice-spawnu-předmětů)
- [cfgspawnabletypes.xml --- Příslušenství a náklad](#cfgspawnabletypesxml----příslušenství-a-náklad)
- [cfgrandompresets.xml --- Znovupoužitelné lootové pooly](#cfgrandompresetsxml----znovupoužitelné-lootové-pooly)
- [globals.xml --- Parametry ekonomiky](#globalsxml----parametry-ekonomiky)
- [cfggameplay.json --- Nastavení herních mechanik](#cfggameplayjson----nastavení-herních-mechanik)
- [serverDZ.cfg --- Nastavení serveru](#serverdzcfg----nastavení-serveru)
- [Jak mody interagují s ekonomikou](#jak-mody-interagují-s-ekonomikou)
- [Časté chyby](#časté-chyby)

---

## Přehled

Každý server DayZ načítá svou konfiguraci ze **složky mise**. Soubory Centrální ekonomiky (CE) definují, jaké předměty se spawnují, kde a jak dlouho. Samotný spustitelný soubor serveru se konfiguruje prostřednictvím `serverDZ.cfg`, který se nachází vedle spustitelného souboru.

| Soubor | Účel |
|--------|------|
| `init.c` | Vstupní bod mise --- inicializace Hive, datum/čas, výbava při spawnu |
| `db/types.xml` | Definice spawnu předmětů: množství, životnosti, lokace |
| `cfgspawnabletypes.xml` | Předem připojené předměty a náklad na spawnutých entitách |
| `cfgrandompresets.xml` | Znovupoužitelné pooly předmětů pro cfgspawnabletypes |
| `db/globals.xml` | Globální parametry ekonomiky: maximální počty, časy úklidu |
| `cfggameplay.json` | Ladění herních mechanik: stamina, stavění základen, UI |
| `cfgeconomycore.xml` | Registrace kořenových tříd a logování CE |
| `cfglimitsdefinition.xml` | Definice platných tagů kategorie, použití a hodnoty |
| `serverDZ.cfg` | Název serveru, heslo, maximální počet hráčů, načítání modů |

---

## init.c --- Vstupní bod mise

Skript `init.c` je první věc, kterou server spustí. Inicializuje Centrální ekonomiku a vytváří instanci mise.

```c
void main()
{
    Hive ce = CreateHive();
    if (ce)
        ce.InitOffline();

    GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);
    CreateCustomMission("dayzOffline.chernarusplus");
}

class CustomMission: MissionServer
{
    override PlayerBase CreateCharacter(PlayerIdentity identity, vector pos,
                                        ParamsReadContext ctx, string characterName)
    {
        Entity playerEnt;
        playerEnt = GetGame().CreatePlayer(identity, characterName, pos, 0, "NONE");
        Class.CastTo(m_player, playerEnt);
        GetGame().SelectPlayer(identity, m_player);
        return m_player;
    }

    override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
    {
        EntityAI itemClothing = player.FindAttachmentBySlotName("Body");
        if (itemClothing)
        {
            itemClothing.GetInventory().CreateInInventory("BandageDressing");
        }
    }
}

Mission CreateCustomMission(string path)
{
    return new CustomMission();
}
```

`Hive` spravuje databázi CE. Bez `CreateHive()` se nespawnují žádné předměty a perzistence je deaktivována. `CreateCharacter` vytváří entitu hráče při spawnu a `StartingEquipSetup` definuje předměty, které čerstvá postava obdrží. Další užitečné přepsání `MissionServer` zahrnují `OnInit()`, `OnUpdate()`, `InvokeOnConnect()` a `InvokeOnDisconnect()`.

---

## types.xml --- Definice spawnu předmětů

Nachází se v `db/types.xml`, tento soubor je srdcem CE. Každý předmět, který se může spawnovat, musí mít zde záznam.

### Kompletní záznam

```xml
<type name="AK74">
    <nominal>6</nominal>
    <lifetime>28800</lifetime>
    <restock>0</restock>
    <min>4</min>
    <quantmin>30</quantmin>
    <quantmax>80</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1"
           count_in_player="0" crafted="0" deloot="0"/>
    <category name="weapons"/>
    <usage name="Military"/>
    <value name="Tier3"/>
    <value name="Tier4"/>
</type>
```

### Reference polí

| Pole | Popis |
|------|-------|
| `nominal` | Cílový počet na mapě. CE spawnuje předměty, dokud není dosažen |
| `min` | Minimální počet před spuštěním doplňování ze strany CE |
| `lifetime` | Sekundy, po které předmět přetrvává na zemi před despawnem |
| `restock` | Minimální sekundy mezi pokusy o doplnění (0 = okamžité) |
| `quantmin/quantmax` | Procento naplnění pro předměty s množstvím (zásobníky, lahve). Použijte `-1` pro předměty bez množství |
| `cost` | Váha priority CE (vyšší = prioritizováno). Většina předmětů používá `100` |

### Příznaky

| Příznak | Účel |
|---------|------|
| `count_in_cargo` | Počítat předměty uvnitř kontejnerů směrem k nominal |
| `count_in_hoarder` | Počítat předměty ve skrýších/stanech/sudech směrem k nominal |
| `count_in_map` | Počítat předměty na zemi směrem k nominal |
| `count_in_player` | Počítat předměty v inventáři hráče směrem k nominal |
| `crafted` | Předmět se pouze vyrábí, nespawnuje se přirozeně |
| `deloot` | Loot z dynamických událostí (havárie vrtulníků atd.) |

### Tagy kategorie, použití a hodnoty

Tyto tagy řídí **kde** se předměty spawnují:

- **`category`** --- Typ předmětu. Vanilkové: `tools`, `containers`, `clothes`, `food`, `weapons`, `books`, `explosives`, `lootdispatch`.
- **`usage`** --- Typy budov. Vanilkové: `Military`, `Police`, `Medic`, `Firefighter`, `Industrial`, `Farm`, `Coast`, `Town`, `Village`, `Hunting`, `Office`, `School`, `Prison`, `ContaminatedArea`, `Historical`.
- **`value`** --- Zóny tierů mapy. Vanilkové: `Tier1` (pobřeží), `Tier2` (vnitrozemí), `Tier3` (vojenské), `Tier4` (hluboké vojenské), `Unique`.

Více tagů lze kombinovat. Žádné tagy `usage` = předmět se nespawnuje. Žádné tagy `value` = spawnuje se ve všech tierech.

### Deaktivace předmětu

Nastavte `nominal=0` a `min=0`. Předmět se nikdy nespawnuje, ale stále může existovat prostřednictvím skriptů nebo výroby.

---

## cfgspawnabletypes.xml --- Příslušenství a náklad

Řídí, co se spawnuje **již připojené k nebo uvnitř** jiných předmětů.

### Označení hoardera

Úložné kontejnery jsou označeny, aby CE věděla, že obsahují předměty hráčů:

```xml
<type name="SeaChest">
    <hoarder />
</type>
```

### Poškození při spawnu

```xml
<type name="NVGoggles">
    <damage min="0.0" max="0.32" />
</type>
```

Hodnoty se pohybují od `0.0` (bezvadný) do `1.0` (zničený).

### Příslušenství

```xml
<type name="PlateCarrierVest_Camo">
    <damage min="0.1" max="0.6" />
    <attachments chance="0.85">
        <item name="PlateCarrierHolster_Camo" chance="1.00" />
    </attachments>
    <attachments chance="0.85">
        <item name="PlateCarrierPouches_Camo" chance="1.00" />
    </attachments>
</type>
```

Vnější `chance` určuje, zda se skupina příslušenství vyhodnotí. Vnitřní `chance` vybírá konkrétní předmět, když je ve skupině uvedeno více předmětů.

### Presety nákladu

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

Každý řádek vyhodnocuje preset nezávisle --- tři řádky znamenají tři samostatné šance.

---

## cfgrandompresets.xml --- Znovupoužitelné lootové pooly

Definuje pojmenované pooly předmětů odkazované z `cfgspawnabletypes.xml`:

```xml
<randompresets>
    <cargo chance="0.16" name="foodVillage">
        <item name="SodaCan_Cola" chance="0.02" />
        <item name="TunaCan" chance="0.05" />
        <item name="PeachesCan" chance="0.05" />
        <item name="BakedBeansCan" chance="0.05" />
        <item name="Crackers" chance="0.05" />
    </cargo>

    <cargo chance="0.15" name="toolsHermit">
        <item name="WeaponCleaningKit" chance="0.10" />
        <item name="Matchbox" chance="0.15" />
        <item name="Hatchet" chance="0.07" />
    </cargo>
</randompresets>
```

`chance` presetu je celková pravděpodobnost, že se cokoli spawnuje. Pokud hod uspěje, jeden předmět je vybrán z poolu na základě individuálních šancí předmětů. Pro přidání modovaných předmětů vytvořte nový blok `cargo` a odkazujte na něj v `cfgspawnabletypes.xml`.

---

## globals.xml --- Parametry ekonomiky

Nachází se v `db/globals.xml`, tento soubor nastavuje globální parametry CE:

```xml
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="ZombieMaxCount" type="0" value="1000"/>
    <var name="CleanupLifetimeDeadPlayer" type="0" value="3600"/>
    <var name="CleanupLifetimeDeadAnimal" type="0" value="1200"/>
    <var name="CleanupLifetimeDeadInfected" type="0" value="330"/>
    <var name="CleanupLifetimeRuined" type="0" value="330"/>
    <var name="FlagRefreshFrequency" type="0" value="432000"/>
    <var name="FlagRefreshMaxDuration" type="0" value="3456000"/>
    <var name="FoodDecay" type="0" value="1"/>
    <var name="InitialSpawn" type="0" value="100"/>
    <var name="LootDamageMin" type="1" value="0.0"/>
    <var name="LootDamageMax" type="1" value="0.82"/>
    <var name="SpawnInitial" type="0" value="1200"/>
    <var name="TimeLogin" type="0" value="15"/>
    <var name="TimeLogout" type="0" value="15"/>
    <var name="TimePenalty" type="0" value="20"/>
    <var name="TimeHopping" type="0" value="60"/>
    <var name="ZoneSpawnDist" type="0" value="300"/>
</variables>
```

### Klíčové proměnné

| Proměnná | Výchozí | Popis |
|----------|---------|-------|
| `AnimalMaxCount` | 200 | Maximální počet zvířat na mapě |
| `ZombieMaxCount` | 1000 | Maximální počet infikovaných na mapě |
| `CleanupLifetimeDeadPlayer` | 3600 | Čas odstranění mrtvého těla (sekundy) |
| `CleanupLifetimeRuined` | 330 | Čas odstranění zničeného předmětu |
| `FlagRefreshFrequency` | 432000 | Interval obnovy teritoriální vlajky (5 dní) |
| `FlagRefreshMaxDuration` | 3456000 | Maximální životnost vlajky (40 dní) |
| `FoodDecay` | 1 | Přepínač kažení jídla (0=vypnuto, 1=zapnuto) |
| `InitialSpawn` | 100 | Procento nominal spawnovaného při startu |
| `LootDamageMax` | 0.82 | Maximální poškození na spawnovaném lootu |
| `TimeLogin` / `TimeLogout` | 15 | Časovač přihlášení/odhlášení (anti-combat-log) |
| `TimePenalty` | 20 | Časovač penalizace za combat log |
| `ZoneSpawnDist` | 300 | Vzdálenost hráče spouštějící spawn zombie/zvířat |

Atribut `type` je `0` pro celé číslo, `1` pro desetinné číslo. Použití nesprávného typu ořízne hodnotu.

---

## cfggameplay.json --- Nastavení herních mechanik

Načítá se pouze tehdy, když je `enableCfgGameplayFile = 1` nastaveno v `serverDZ.cfg`. Bez toho engine používá napevno zakódované výchozí hodnoty.

### Struktura

```json
{
    "version": 123,
    "GeneralData": {
        "disableBaseDamage": false,
        "disableContainerDamage": false,
        "disableRespawnDialog": false
    },
    "PlayerData": {
        "disablePersonalLight": false,
        "StaminaData": {
            "sprintStaminaModifierErc": 1.0,
            "staminaMax": 100.0,
            "staminaWeightLimitThreshold": 6000.0,
            "staminaMinCap": 5.0
        },
        "MovementData": {
            "timeToSprint": 0.45,
            "rotationSpeedSprint": 0.15,
            "allowStaminaAffectInertia": true
        }
    },
    "WorldsData": {
        "lightingConfig": 0,
        "environmentMinTemps": [-3, -2, 0, 4, 9, 14, 18, 17, 13, 11, 9, 0],
        "environmentMaxTemps": [3, 5, 7, 14, 19, 24, 26, 25, 18, 14, 10, 5]
    },
    "BaseBuildingData": {
        "HologramData": {
            "disableIsCollidingBBoxCheck": false,
            "disableIsCollidingAngleCheck": false,
            "disableHeightPlacementCheck": false,
            "disallowedTypesInUnderground": ["FenceKit", "TerritoryFlagKit"]
        }
    },
    "MapData": {
        "ignoreMapOwnership": false,
        "displayPlayerPosition": false,
        "displayNavInfo": true
    }
}
```

Klíčová nastavení: `disableBaseDamage` zabraňuje poškození základny, `disablePersonalLight` odstraňuje světlo čerstvě spawnutého hráče, `staminaWeightLimitThreshold` je v gramech (6000 = 6 kg), pole teplot mají 12 hodnot (leden--prosinec), `lightingConfig` přijímá `0` (výchozí) nebo `1` (tmavší noci) a `displayPlayerPosition` zobrazuje tečku hráče na mapě.

---

## serverDZ.cfg --- Nastavení serveru

Tento soubor se nachází vedle spustitelného souboru serveru, nikoli ve složce mise.

### Klíčová nastavení

```
hostname = "My DayZ Server";
password = "";
passwordAdmin = "adminpass123";
maxPlayers = 60;
verifySignatures = 2;
forceSameBuild = 1;
template = "dayzOffline.chernarusplus";
enableCfgGameplayFile = 1;
storeHouseStateDisabled = false;
storageAutoFix = 1;
```

| Parametr | Popis |
|----------|-------|
| `hostname` | Název serveru v prohlížeči |
| `password` | Heslo pro připojení (prázdné = otevřený) |
| `passwordAdmin` | RCON heslo administrátora |
| `maxPlayers` | Maximální počet současných hráčů |
| `template` | Název složky mise |
| `verifySignatures` | Úroveň kontroly podpisů (2 = přísná) |
| `enableCfgGameplayFile` | Načíst cfggameplay.json (0/1) |

### Načítání modů

Mody se specifikují přes parametry spuštění, ne v konfiguračním souboru:

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

Mody v `-mod=` musí mít nainstalovaní klienti. Mody v `-servermod=` běží pouze na straně serveru.

---

## Jak mody interagují s ekonomikou

### cfgeconomycore.xml --- Registrace kořenových tříd

Každá hierarchie třídy předmětu musí vést zpět k registrované kořenové třídě:

```xml
<economycore>
    <classes>
        <rootclass name="DefaultWeapon" />
        <rootclass name="DefaultMagazine" />
        <rootclass name="Inventory_Base" />
        <rootclass name="SurvivorBase" act="character" reportMemoryLOD="no" />
        <rootclass name="DZ_LightAI" act="character" reportMemoryLOD="no" />
        <rootclass name="CarScript" act="car" reportMemoryLOD="no" />
    </classes>
</economycore>
```

Pokud váš mod zavádí novou základní třídu, která nedědí z `Inventory_Base`, `DefaultWeapon` nebo `DefaultMagazine`, přidejte ji jako `rootclass`. Atribut `act` specifikuje typ entity: `character` pro AI, `car` pro vozidla.

### cfglimitsdefinition.xml --- Vlastní tagy

Každý tag `category`, `usage` nebo `value` použitý v `types.xml` musí být definován zde:

```xml
<lists>
    <categories>
        <category name="mymod_special"/>
    </categories>
    <usageflags>
        <usage name="MyModDungeon"/>
    </usageflags>
    <valueflags>
        <value name="MyModEndgame"/>
    </valueflags>
</lists>
```

Používejte `cfglimitsdefinitionuser.xml` pro doplňky, které by neměly přepisovat vanilkový soubor.

### economy.xml --- Řízení subsystémů

Řídí, které subsystémy CE jsou aktivní:

```xml
<economy>
    <dynamic init="1" load="1" respawn="1" save="1"/>
    <animals init="1" load="0" respawn="1" save="0"/>
    <zombies init="1" load="0" respawn="1" save="0"/>
    <vehicles init="1" load="1" respawn="1" save="1"/>
</economy>
```

Příznaky: `init` (spawn při startu), `load` (načíst perzistenci), `respawn` (respawn po úklidu), `save` (uložit do databáze).

### Interakce ekonomiky na straně skriptů

Předměty vytvořené přes `CreateInInventory()` jsou automaticky spravovány CE. Pro spawn ve světě používejte příznaky ECE:

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## Časté chyby

### Syntaktické chyby XML

Jediný neuzavřený tag rozbije celý soubor. Vždy ověřte XML před nasazením.

### Chybějící tagy v cfglimitsdefinition.xml

Použití tagu `usage` nebo `value` v types.xml, který není definován v cfglimitsdefinition.xml, způsobí, že se předmět tiše nespawnuje. Kontrolujte RPT logy kvůli varováním.

### Příliš vysoký nominal

Celkový nominal napříč všemi předměty by měl zůstat pod 10 000--15 000. Nadměrné hodnoty zhoršují výkon serveru.

### Příliš krátká životnost

Předměty s velmi krátkou životností zmizí dříve, než je hráči najdou. Používejte alespoň `3600` (1 hodina) pro běžné předměty, `28800` (8 hodin) pro zbraně.

### Chybějící kořenová třída

Předměty, jejichž hierarchie tříd nevede k registrované kořenové třídě v `cfgeconomycore.xml`, se nikdy nespawnují, i se správnými záznamy v types.xml.

### cfggameplay.json není povolen

Soubor je ignorován, pokud není nastaveno `enableCfgGameplayFile = 1` v `serverDZ.cfg`.

### Špatný typ v globals.xml

Použití `type="0"` (celé číslo) pro desetinnou hodnotu jako `0.82` ji ořízne na `0`. Pro desetinná čísla používejte `type="1"`.

### Přímá úprava vanilkových souborů

Úprava vanilkového types.xml funguje, ale rozbije se při aktualizacích hry. Raději dodávejte samostatné soubory typů a registrujte je přes cfgeconomycore, nebo používejte cfglimitsdefinitionuser.xml pro vlastní tagy.

---

## Osvědčené postupy

- Dodávejte složku `ServerFiles/` se svým modem obsahující předkonfigurované záznamy `types.xml`, aby administrátoři serverů mohli kopírovat a vkládat místo psaní od nuly.
- Používejte `cfglimitsdefinitionuser.xml` místo úpravy vanilkového `cfglimitsdefinition.xml` --- vaše doplňky přežijí aktualizace hry.
- Nastavte `count_in_hoarder="0"` pro běžné předměty (jídlo, munice), abyste zabránili hromadění blokujícímu respawn CE.
- Vždy nastavte `enableCfgGameplayFile = 1` v `serverDZ.cfg` před očekáváním, že se změny v `cfggameplay.json` projeví.
- Udržujte celkový `nominal` napříč všemi záznamy types.xml pod 12 000, abyste se vyhnuli degradaci výkonu CE na vytížených serverech.

---

## Teorie vs praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `nominal` je pevný cíl | CE spawnuje přesně tento počet předmětů | CE se k nominal přibližuje postupně, ale kolísá na základě interakce hráčů, cyklů úklidu a vzdálenosti zón |
| `restock=0` znamená okamžitý respawn | Předměty se znovu objeví okamžitě po despawnu | CE zpracovává doplňování v dávkách v cyklech (typicky každých 30-60 sekund), takže vždy existuje zpoždění bez ohledu na hodnotu restock |
| `cfggameplay.json` řídí veškerý gameplay | Veškeré ladění probíhá zde | Mnoho herních hodnot je napevno zakódováno ve skriptech nebo config.cpp a nelze je přepsat pomocí cfggameplay.json |
| `init.c` se spouští pouze při startu serveru | Jednorázová inicializace | `init.c` se spouští pokaždé, když se mise načte, včetně restartů serveru. Perzistentní stav je spravován Hive, ne init.c |
| Více souborů types.xml se čistě sloučí | CE čte všechny registrované soubory | Soubory musí být registrovány v cfgeconomycore.xml přes direktivy `<ce folder="custom">`. Pouhé umístění dalších XML souborů do `db/` nic neudělá |

---

## Kompatibilita a dopad

- **Více modů:** Více modů může přidávat záznamy do types.xml bez konfliktu, pokud jsou názvy tříd unikátní. Pokud dva mody definují stejný název třídy s různými hodnotami nominal/lifetime, vyhraje naposledy načtený záznam.
- **Výkon:** Nadměrné hodnoty nominal (15 000+) způsobují špičky CE ticku viditelné jako poklesy FPS serveru. Každý cyklus CE iteruje všechny registrované typy pro kontrolu podmínek spawnu.
