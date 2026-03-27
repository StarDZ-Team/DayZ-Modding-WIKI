# Chapter 9.6: Játékos spawnolás

[Kezdőlap](../README.md) | [<< Előző: Jármű spawnolás](05-vehicle-spawning.md) | [Következő: Perzisztencia >>](07-persistence.md)

---

> **Összefoglaló:** A játékos spawn helyeket a **cfgplayerspawnpoints.xml** (pozíció buborékok) és az **init.c** (induló felszerelés) szabályozza. Ez a fejezet mindkét fájlt tárgyalja valós vanilla értékekkel Chernarus-hoz.

---

## Tartalomjegyzék

- [cfgplayerspawnpoints.xml áttekintés](#cfgplayerspawnpointsxml-áttekintés)
- [Spawn paraméterek](#spawn-paraméterek)
- [Generátor paraméterek](#generátor-paraméterek)
- [Csoport paraméterek](#csoport-paraméterek)
- [Friss spawn buborékok](#friss-spawn-buborékok)
- [Hop spawnok](#hop-spawnok)
- [init.c -- Induló felszerelés](#initc----induló-felszerelés)
- [Egyedi spawn pontok hozzáadása](#egyedi-spawn-pontok-hozzáadása)
- [Gyakori hibák](#gyakori-hibák)

---

## cfgplayerspawnpoints.xml áttekintés

Ez a fájl a küldetés mappádban található (pl. `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). Két szekcióval rendelkezik, mindegyik saját paraméterekkel és pozíció buborékokkal:

- **`<fresh>`** -- vadonatúj karakterek (első élet vagy halál után)
- **`<hop>`** -- szerver hopperek (a játékosnak volt karaktere másik szerveren)

---

## Spawn paraméterek

Vanilla friss spawn értékek:

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

| Paraméter | Érték | Jelentés |
|-----------|-------|----------|
| `min_dist_infected` | 30 | A játékosnak legalább 30 m-re kell spawnolnia a legközelebbi fertőzöttől |
| `max_dist_infected` | 70 | Ha nem létezik 30 m+ távolságra pozíció, tartalékként max 70 m-ig elfogadható |
| `min_dist_player` | 65 | A játékosnak legalább 65 m-re kell spawnolnia bármely más játékostól |
| `max_dist_player` | 150 | Tartalék tartomány -- legfeljebb 150 m-ig elfogadható pozíciók más játékosoktól |
| `min_dist_static` | 0 | Minimális távolság statikus objektumoktól (épületek, falak) |
| `max_dist_static` | 2 | Maximális távolság statikus objektumoktól -- a játékosokat épületek közelében tartja |

A motor először a `min_dist_*` értékeket próbálja; ha nem létezik érvényes pozíció, lazít a `max_dist_*` irányába.

---

## Generátor paraméterek

A generátor egy jelölt pozíciók rácsot hoz létre minden buborék körül:

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

| Paraméter | Érték | Jelentés |
|-----------|-------|----------|
| `grid_density` | 4 | Rácspont távolság méterben -- alacsonyabb = több jelölt, magasabb CPU költség |
| `grid_width` | 200 | A rács 200 m-re nyúlik az X tengelyen minden buborék közép körül |
| `grid_height` | 200 | A rács 200 m-re nyúlik a Z tengelyen minden buborék közép körül |
| `min_steepness` / `max_steepness` | -45 / 45 | Terep meredekség tartomány fokban -- sziklafalakat és meredek dombokat elutasít |

Minden buborék egy 200x200 m-es rácsot kap 4 méterenként egy ponttal (~2500 jelölt). A motor szűr meredekség és statikus távolság alapján, majd spawn időben alkalmazza a `spawn_params` értékeit.

#### `allow_in_water` paraméter (1.28+)

A DayZ 1.28-tól egy új logikai `allow_in_water` paraméter került a `generator_params` blokkba (alapértelmezett: `false`). Ha `true` értékre állítod, a spawn pont generátor a vízben lévő pozíciókat is érvényes spawn pontokként kezeli:

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

Alapértelmezetten a motor elutasít minden olyan jelölt pozíciót, ami vízbe esik (tavak, folyók, óceán). Az `allow_in_water` `true`-ra állítása eltávolítja ezt a szűrőt. Ez elsősorban egyedi térképekhez hasznos sziget spawnokkal, vagy olyan forgatókönyvekhez, ahol a parti vízben való spawnolás szándékos. A legtöbb szerveren hagyd `false` értéken, hogy a játékosok ne spawnoljanak tavakban vagy az óceánban.

---

## Csoport paraméterek

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Paraméter | Érték | Jelentés |
|-----------|-------|----------|
| `enablegroups` | true | A pozíció buborékok elnevezett csoportokba vannak szervezve |
| `groups_as_regular` | true | A csoportok normál spawn pontokként kezelendők (bármely csoport kiválasztható) |
| `lifetime` | 240 | Másodpercek, mielőtt egy használt spawn pont újra elérhetővé válik |
| `counter` | -1 | Ahányszor egy spawn pont használható. -1 = korlátlan |

Egy használt pozíció 240 másodpercre zárolódik, megakadályozva, hogy két játékos egymásra spawnoljon.

---

## Friss spawn buborékok

A vanilla Chernarus 11 csoportot definiál a part mentén friss spawnokhoz. Minden csoport 3-8 pozíciót csoportosít egy város körül:

| Csoport | Pozíciók | Terület |
|---------|----------|--------|
| WestCherno | 4 | Chernogorsk nyugati oldala |
| EastCherno | 4 | Chernogorsk keleti oldala |
| WestElektro | 5 | Nyugat Elektrozavodsk |
| EastElektro | 4 | Kelet Elektrozavodsk |
| Kamyshovo | 5 | Kamyshovo parti vonal |
| Solnechny | 5 | Solnechniy gyári terület |
| Orlovets | 4 | Solnechniy és Nizhnoye között |
| Nizhnee | 4 | Nizhnoye part |
| SouthBerezino | 3 | Dél Berezino |
| NorthBerezino | 8 | Észak Berezino + kiterjesztett part |
| Svetlojarsk | 3 | Svetlojarsk kikötő |

### Valós csoport példák

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

A koordináták `x`-et (kelet-nyugat) és `z`-t (észak-dél) használnak. Az Y tengely (magasság) automatikusan kerül kiszámításra a terep magassági térképéből.

---

## Hop spawnok

A hop spawnok engedékenyebbek a játékos távolságra vonatkozóan és kisebb rácsokat használnak:

```xml
<!-- Hop spawn_params különbségek a freshhez képest -->
<min_dist_player>25.0</min_dist_player>   <!-- fresh: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- fresh: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- fresh: 0 -->

<!-- Hop generator_params különbségek -->
<grid_width>150</grid_width>              <!-- fresh: 200 -->
<grid_height>150</grid_height>            <!-- fresh: 200 -->

<!-- Hop group_params különbségek -->
<enablegroups>false</enablegroups>        <!-- fresh: true -->
<lifetime>360</lifetime>                  <!-- fresh: 240 -->
```

A hop csoportok **a szárazföld belsejébe** vannak szétszórva: Balota (6), Cherno (5), Pusta (5), Kamyshovo (4), Solnechny (5), Nizhnee (6), Berezino (5), Olsha (4), Svetlojarsk (5), Dobroye (5). Az `enablegroups=false` beállítással a motor az összes 50 pozíciót egyetlen készletként kezeli.

---

## init.c -- Induló felszerelés

Az **init.c** fájl a küldetés mappádban szabályozza a karakter létrehozást és az induló felszerelést. Két felülírás számít:

- **`CreateCharacter`** -- meghívja a `GetGame().CreatePlayer()` metódust. A motor kiválasztja a pozíciót a **cfgplayerspawnpoints.xml**-ből, mielőtt ez lefutna; itt nem állítod be a spawn pozíciót.
- **`StartingEquipSetup`** -- a karakter létrehozás után fut le. A játékosnak már van alapértelmezett ruházata (ing, farmer, tornacipő). Ez a metódus adja hozzá az induló tárgyakat.

### Vanilla StartingEquipSetup (Chernarus)

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 állapot

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

Amit minden játékos kap: **BandageDressing** (gyorssáv 3), véletlenszerű **Chemlight** (gyorssáv 2), véletlenszerű gyümölcs -- 35% Apple, 30% Plum, 35% Pear (gyorssáv 1). A `SetRandomHealth` 45-65%-os állapotot állít be minden tárgyra.

### Egyedi induló felszerelés hozzáadása

```c
// Add hozzá a gyümölcs blokk után, a Body slot ellenőrzésen belül
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Egyedi spawn pontok hozzáadása

Egyedi spawn csoport hozzáadásához szerkeszd a **cfgplayerspawnpoints.xml** `<fresh>` szekcióját:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Lépések:

1. Nyisd meg a térképet játékon belül vagy használd az iZurvive-ot koordináták kereséséhez
2. Válassz 3-5 pozíciót 100-200 m-en szétszórva egy biztonságos területen (nincs szikla, nincs víz)
3. Add hozzá a `<group>` blokkot a `<generator_posbubbles>` belsejébe
4. Használd az `x`-et kelet-nyugathoz és a `z`-t észak-délhez -- a motor automatikusan kiszámítja az Y-t (magasság) a terepből
5. Indítsd újra a szervert -- perzisztencia törlés nem szükséges

Kiegyensúlyozott spawnoláshoz tarts fenn legalább 4 pozíciót csoportonként, hogy a 240 másodperces zárolás ne blokkolja az összes pozíciót, ha több játékos egyszerre hal meg.

---

## Gyakori hibák

### Játékosok az óceánban spawnolnak

Felcserélted a `z`-t (észak-dél) az Y-nal (magasság), vagy a 0-15360 tartományon kívüli koordinátákat használtál. A parti pozícióknak alacsony `z` értékük van (déli szél). Ellenőrizd az iZurvive-val.

### Nem elég spawn pont

Mindössze 2-3 pozícióval a 240 másodperces zárolás csoportosulást okoz. A vanilla 49 friss pozíciót használ 11 csoportban. Tervezz legalább 20 pozíciót 4+ csoportban.

### Elfelejtett hop szekció

Egy üres `<hop>` szekció azt jelenti, hogy a szerver hopperek a `0,0,0` pozícióban spawnolnak -- az óceánban Chernarus-on. Mindig definiálj hop pontokat, még ha a `<fresh>` szekcióból másolod is.

### Spawn pontok meredek terepen

A generátor elutasítja a 45 foknál meredekebb lejtőket. Ha minden egyedi pozíció domboldalon van, nem létezik érvényes jelölt. Használj sík talajt utak közelében.

### Játékosok mindig ugyanazon a helyen spawnolnak

Az 1-2 pozíciós csoportok zárolódnak a 240 másodperces hűtéssel. Adj hozzá több pozíciót csoportonként.

---

[Kezdőlap](../README.md) | [<< Előző: Jármű spawnolás](05-vehicle-spawning.md) | [Következő: Perzisztencia >>](07-persistence.md)
