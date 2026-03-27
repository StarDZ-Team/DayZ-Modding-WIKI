# Chapter 9.6: Spawnovani hracu

[Domu](../README.md) | [<< Predchozi: Spawnovani vozidel](05-vehicle-spawning.md) | [Dalsi: Persistence >>](07-persistence.md)

---

> **Shrnuti:** Lokace spawnu hracu jsou rizeny souborem **cfgplayerspawnpoints.xml** (pozicni bubliny) a **init.c** (pocatecni vybaveni). Tato kapitola pokryva oba soubory s realnymi vanilkovymi hodnotami z Chernarusu.

---

## Obsah

- [Prehled cfgplayerspawnpoints.xml](#prehled-cfgplayerspawnpointsxml)
- [Parametry spawnu](#parametry-spawnu)
- [Parametry generatoru](#parametry-generatoru)
- [Parametry skupin](#parametry-skupin)
- [Bubliny pro cerstve spawny](#bubliny-pro-cerstve-spawny)
- [Hop spawny](#hop-spawny)
- [init.c -- pocatecni vybaveni](#initc----pocatecni-vybaveni)
- [Pridani vlastnich spawnovacich bodu](#pridani-vlastnich-spawnovacich-bodu)
- [Caste chyby](#caste-chyby)

---

## Prehled cfgplayerspawnpoints.xml

Tento soubor se nachazi ve slozce vasi mise (napr. `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). Ma dve sekce, kazda s vlastnimi parametry a pozicnimi bublinami:

- **`<fresh>`** -- zcela nove postavy (prvni zivot nebo po smrti)
- **`<hop>`** -- server hopperi (hrac mel postavu na jinem serveru)

---

## Parametry spawnu

Vanilkove hodnoty pro cerstvy spawn:

```xml
<spawn_params>
    <min_dist_infected>30</min_dist_infected>
    <max_dist_infected>70</max_dist_infected>
    <min_dist_player>65</min_dist_player>
    <max_dist_player>150</max_dist_player>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
</spawn_params>
```

| Parametr | Hodnota | Vyznam |
|-----------|-------|---------|
| `min_dist_infected` | 30 | Hrac se musi spawnit alespon 30 m od nejblizsiho nakazeneho |
| `max_dist_infected` | 70 | Pokud neexistuje pozice 30 m+ daleko, prijmout az 70 m jako zakladni rozsah |
| `min_dist_player` | 65 | Hrac se musi spawnit alespon 65 m od jakehokoliv jineho hrace |
| `max_dist_player` | 150 | Zakladni rozsah -- prijmout pozice az 150 m od ostatnich hracu |
| `min_dist_static` | 0 | Minimalni vzdalenost od statickych objektu (budovy, zdi) |
| `max_dist_static` | 2 | Maximalni vzdalenost od statickych objektu -- udrzuje hrace blizko struktur |

Engine nejprve zkusi `min_dist_*`; pokud neexistuje zadna platna pozice, uvolni se smerem k `max_dist_*`.

---

## Parametry generatoru

Generator vytvari mrizku kandidatnich pozic kolem kazde bubliny:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
</generator_params>
```

| Parametr | Hodnota | Vyznam |
|-----------|-------|---------|
| `grid_density` | 4 | Rozestup mezi body mrizky v metrech -- nizsi = vice kandidatu, vyssi zatez CPU |
| `grid_width` | 200 | Mrizka se roztahuje 200 m na ose X kolem stredu kazde bubliny |
| `grid_height` | 200 | Mrizka se roztahuje 200 m na ose Z kolem stredu kazde bubliny |
| `min_steepness` / `max_steepness` | -45 / 45 | Rozsah sklonu terenu ve stupnich -- odmita utesy a strme kopce |

Kazda bublina dostane mrizku 200x200 m s bodem kazdych 4 m (~2 500 kandidatu). Engine filtruje podle sklonu a vzdalenosti od statickych objektu, pote aplikuje `spawn_params` pri spawnu.

#### Parametr `allow_in_water` (1.28+)

Od DayZ 1.28 byl do `generator_params` přidán nový booleovský parametr `allow_in_water` (výchozí: `false`). Když je nastaven na `true`, generátor spawnových bodů bude považovat pozice ve vodě za platné spawnové body:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
    <allow_in_water>false</allow_in_water>
</generator_params>
```

Ve výchozím nastavení engine odmítne jakoukoli kandidátní pozici, která spadá do vody (rybníky, řeky, oceán). Nastavení `allow_in_water` na `true` tento filtr odstraní. Toto je primárně užitečné pro vlastní mapy se spawny na ostrovech nebo scénáře, kde jsou spawny v pobřežní vodě záměrné. Pro většinu serverů ponechte hodnotu na `false`, abyste zabránili spawnování hráčů v jezerech nebo oceánu.

---

## Parametry skupin

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Parametr | Hodnota | Vyznam |
|-----------|-------|---------|
| `enablegroups` | true | Pozicni bubliny jsou organizovany do pojmenovanych skupin |
| `groups_as_regular` | true | Skupiny jsou zpracovavany jako bezne spawnovaci body (jakakoliv skupina muze byt vybrana) |
| `lifetime` | 240 | Sekundy pred tim, nez se pouzity spawnovaci bod stane opet dostupnym |
| `counter` | -1 | Pocet pouziti spawnovaciho bodu. -1 = neomezene |

Pouzita pozice je zamcena na 240 sekund, coz zabranuje dvema hracum spawnit se na sobe.

---

## Bubliny pro cerstve spawny

Vanilkovy Chernarus definuje 11 skupin podél pobrezi pro cerstve spawny. Kazda skupina shlukuje 3-8 pozic kolem mesta:

| Skupina | Pozice | Oblast |
|-------|-----------|------|
| WestCherno | 4 | Zapadni strana Chernogorsku |
| EastCherno | 4 | Vychodni strana Chernogorsku |
| WestElektro | 5 | Zapadni Elektrozavodsk |
| EastElektro | 4 | Vychodni Elektrozavodsk |
| Kamyshovo | 5 | Pobrezi Kamyshova |
| Solnechny | 5 | Oblast tovarny Solnechniy |
| Orlovets | 4 | Mezi Solnechniy a Nizhnoye |
| Nizhnee | 4 | Pobrezi Nizhnoye |
| SouthBerezino | 3 | Jizni Berezino |
| NorthBerezino | 8 | Severni Berezino + rozsirene pobrezi |
| Svetlojarsk | 3 | Pristav Svetlojarsk |

### Realne priklady skupin

```xml
<generator_posbubbles>
    <group name="WestCherno">
        <pos x="6063.018555" z="1931.907227" />
        <pos x="5933.964844" z="2171.072998" />
        <pos x="6199.782715" z="2241.805176" />
        <pos x="13552.5654" z="5955.893066" />
    </group>
    <group name="WestElektro">
        <pos x="8747.670898" z="2357.187012" />
        <pos x="9363.6533" z="2017.953613" />
        <pos x="9488.868164" z="1898.900269" />
        <pos x="9675.2216" z="1817.324585" />
        <pos x="9821.274414" z="2194.003662" />
    </group>
    <group name="Kamyshovo">
        <pos x="11830.744141" z="3400.428955" />
        <pos x="11930.805664" z="3484.882324" />
        <pos x="11961.211914" z="3419.867676" />
        <pos x="12222.977539" z="3454.867188" />
        <pos x="12336.774414" z="3503.847168" />
    </group>
</generator_posbubbles>
```

Souradnice pouzivaji `x` (vychod-zapad) a `z` (sever-jih). Osa Y (nadmorska vyska) se pocita automaticky z vyskove mapy terenu.

---

## Hop spawny

Hop spawny jsou shovivavejsi na vzdalenost od hracu a pouzivaji mensi mrizky:

```xml
<!-- Rozdily spawn_params hopu oproti cerstvemu -->
<min_dist_player>25.0</min_dist_player>   <!-- cerstvy: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- cerstvy: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- cerstvy: 0 -->

<!-- Rozdily generator_params hopu -->
<grid_width>150</grid_width>              <!-- cerstvy: 200 -->
<grid_height>150</grid_height>            <!-- cerstvy: 200 -->

<!-- Rozdily group_params hopu -->
<enablegroups>false</enablegroups>        <!-- cerstvy: true -->
<lifetime>360</lifetime>                  <!-- cerstvy: 240 -->
```

Hop skupiny jsou rozlozeny **do vnitrozemí**: Balota (6), Cherno (5), Pusta (5), Kamyshovo (4), Solnechny (5), Nizhnee (6), Berezino (5), Olsha (4), Svetlojarsk (5), Dobroye (5). S `enablegroups=false` engine zachazi se vsemi 50 pozicemi jako s plochou zasobou.

---

## init.c -- pocatecni vybaveni

Soubor **init.c** ve slozce vasi mise ridi vytvareni postav a pocatecni vybaveni. Dva prepisy jsou dulezite:

- **`CreateCharacter`** -- vola `GetGame().CreatePlayer()`. Engine vybere pozici z **cfgplayerspawnpoints.xml** pred spustenim teto funkce; pozici spawnu zde nenastavujete.
- **`StartingEquipSetup`** -- spusten po vytvoreni postavy. Hrac jiz ma vychozi obleceni (tricko, dziny, tenisky). Tato metoda pridava pocatecni predmety.

### Vanilkovy StartingEquipSetup (Chernarus)

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 zdravi

        itemEnt = itemClothing.GetInventory().CreateInInventory( "BandageDressing" );
        player.SetQuickBarEntityShortcut(itemEnt, 2);

        string chemlightArray[] = { "Chemlight_White", "Chemlight_Yellow", "Chemlight_Green", "Chemlight_Red" };
        int rndIndex = Math.RandomInt( 0, 4 );
        itemEnt = itemClothing.GetInventory().CreateInInventory( chemlightArray[rndIndex] );
        SetRandomHealth( itemEnt );
        player.SetQuickBarEntityShortcut(itemEnt, 1);

        rand = Math.RandomFloatInclusive( 0.0, 1.0 );
        if ( rand < 0.35 )
            itemEnt = player.GetInventory().CreateInInventory( "Apple" );
        else if ( rand > 0.65 )
            itemEnt = player.GetInventory().CreateInInventory( "Pear" );
        else
            itemEnt = player.GetInventory().CreateInInventory( "Plum" );
        player.SetQuickBarEntityShortcut(itemEnt, 3);
        SetRandomHealth( itemEnt );
    }

    itemClothing = player.FindAttachmentBySlotName( "Legs" );
    if ( itemClothing )
        SetRandomHealth( itemClothing );
}
```

Co kazdy hrac dostane: **BandageDressing** (rychly panel 3), nahodny **Chemlight** (rychly panel 2), nahodne ovoce -- 35 % Apple, 30 % Plum, 35 % Pear (rychly panel 1). `SetRandomHealth` nastavuje 45-65 % stav na vsech predmetech.

### Pridani vlastniho pocatecniho vybaveni

```c
// Pridejte za blok ovoce, uvnitr kontroly slotu Body
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Pridani vlastnich spawnovacich bodu

Pro pridani vlastni skupiny spawnu upravte sekci `<fresh>` souboru **cfgplayerspawnpoints.xml**:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Kroky:

1. Otevrte mapu ve hre nebo pouzijte iZurvive pro nalezeni souradnic
2. Vyberte 3-5 pozic rozmístenych v okruhu 100-200 m v bezpecne oblasti (zadne utesy, zadna voda)
3. Pridejte blok `<group>` dovnitr `<generator_posbubbles>`
4. Pouzijte `x` pro vychod-zapad a `z` pro sever-jih -- engine pocita Y (nadmorskou vysku) z terenu
5. Restartujte server -- wipe persistence neni potreba

Pro vyvazene spawnovani udrzujte alespon 4 pozice na skupinu, aby 240sekundovy zamek neblokoval vsechny pozice, kdyz zemre vice hracu soucasne.

---

## Caste chyby

### Hraci se spawnuji v oceanu

Zamenili jste `z` (sever-jih) s Y (nadmorska vyska), nebo jste pouzili souradnice mimo rozsah 0-15360. Pozice na pobrezi maji nizke hodnoty `z` (jizni okraj). Dvojitou kontrolu provedte s iZurvive.

### Nedostatek spawnovacich bodu

S pouze 2-3 pozicemi zpusobi 240sekundovy zamek shlukovani. Vanilka pouziva 49 cerstvych pozic v 11 skupinach. Cilte na alespon 20 pozic ve 4+ skupinach.

### Zapomenuti na hop sekci

Prazdna sekce `<hop>` znamena, ze se server hopperi spawnuji na `0,0,0` -- na Chernarusu to je ocean. Vzdy definujte hop body, i kdyz je zkopirujete z `<fresh>`.

### Spawnovaci body na strmen terenu

Generator odmita sklony nad 45 stupnu. Pokud jsou vsechny vlastni pozice na svazich, neexistuji zadni platni kandidati. Pouzijte rovny teren blizko silnic.

### Hraci se vzdy spawnuji na stejnem miste

Skupiny s 1-2 pozicemi se zamknou 240sekundovym cooldownem. Pridejte vice pozic na skupinu.

---

[Domu](../README.md) | [<< Predchozi: Spawnovani vozidel](05-vehicle-spawning.md) | [Dalsi: Persistence >>](07-persistence.md)
