# Kapitel 9.6: Spieler-Spawning

[Home](../README.md) | [<< Zurueck: Fahrzeug-Spawning](05-vehicle-spawning.md) | [Weiter: Persistenz >>](07-persistence.md)

---

> **Zusammenfassung:** Spieler-Spawn-Orte werden durch **cfgplayerspawnpoints.xml** (Positionsblasen) und **init.c** (Startausruestung) gesteuert. Dieses Kapitel behandelt beide Dateien mit realen Vanilla-Werten von Chernarus.

---

## Inhaltsverzeichnis

- [cfgplayerspawnpoints.xml Ueberblick](#cfgplayerspawnpointsxml-ueberblick)
- [Spawn-Parameter](#spawn-parameter)
- [Generator-Parameter](#generator-parameter)
- [Gruppen-Parameter](#gruppen-parameter)
- [Frisch-Spawn-Blasen](#frisch-spawn-blasen)
- [Hop-Spawns](#hop-spawns)
- [init.c -- Startausruestung](#initc----startausruestung)
- [Eigene Spawn-Punkte hinzufuegen](#eigene-spawn-punkte-hinzufuegen)
- [Haeufige Fehler](#haeufige-fehler)

---

## cfgplayerspawnpoints.xml Ueberblick

Diese Datei befindet sich in Ihrem Missionsordner (z.B. `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). Sie hat zwei Abschnitte, jeweils mit eigenen Parametern und Positionsblasen:

- **`<fresh>`** -- brandneue Charaktere (erstes Leben oder nach dem Tod)
- **`<hop>`** -- Server-Hopper (Spieler hatte einen Charakter auf einem anderen Server)

---

## Spawn-Parameter

Vanilla-Werte fuer frische Spawns:

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

| Parameter | Wert | Bedeutung |
|-----------|------|-----------|
| `min_dist_infected` | 30 | Spieler muss mindestens 30m vom naechsten Infizierten entfernt spawnen |
| `max_dist_infected` | 70 | Wenn keine Position 30m+ entfernt existiert, bis zu 70m als Fallback akzeptieren |
| `min_dist_player` | 65 | Spieler muss mindestens 65m von jedem anderen Spieler entfernt spawnen |
| `max_dist_player` | 150 | Fallback-Bereich -- Positionen bis zu 150m von anderen Spielern akzeptieren |
| `min_dist_static` | 0 | Mindestabstand von statischen Objekten (Gebaeude, Mauern) |
| `max_dist_static` | 2 | Maximalabstand von statischen Objekten -- haelt Spieler nahe an Strukturen |

Die Engine versucht zuerst `min_dist_*`; wenn keine gueltige Position existiert, lockert sie in Richtung `max_dist_*`.

---

## Generator-Parameter

Der Generator erstellt ein Raster von Kandidatenpositionen um jede Blase:

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

| Parameter | Wert | Bedeutung |
|-----------|------|-----------|
| `grid_density` | 4 | Abstand zwischen Rasterpunkten in Metern -- niedriger = mehr Kandidaten, hoehere CPU-Last |
| `grid_width` | 200 | Raster erstreckt sich 200m auf der X-Achse um jedes Blasenzentrum |
| `grid_height` | 200 | Raster erstreckt sich 200m auf der Z-Achse um jedes Blasenzentrum |
| `min_steepness` / `max_steepness` | -45 / 45 | Gelaendeneigungsbereich in Grad -- lehnt Klippen und steile Huegel ab |

Jede Blase erhaelt ein 200x200m-Raster mit einem Punkt alle 4m (~2.500 Kandidaten). Die Engine filtert nach Neigung und statischem Abstand und wendet dann `spawn_params` zur Spawnzeit an.

#### `allow_in_water`-Parameter (1.28+)

Ab DayZ 1.28 wurde ein neuer boolescher `allow_in_water`-Parameter zu `generator_params` hinzugefuegt (Standard: `false`). Wenn auf `true` gesetzt, betrachtet der Spawnpunkt-Generator Positionen im Wasser als gueltige Spawnpunkte:

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

Standardmaessig lehnt die Engine jede Kandidatenposition ab, die im Wasser liegt (Teiche, Fluesse, Ozean). Das Setzen von `allow_in_water` auf `true` entfernt diesen Filter. Dies ist hauptsaechlich nuetzlich fuer benutzerdefinierte Karten mit Insel-Spawns oder Szenarien, in denen Kuesten-Wasser-Spawns beabsichtigt sind. Fuer die meisten Server lassen Sie dies auf `false`, um zu vermeiden, dass Spieler in Seen oder im Ozean spawnen.

---

## Gruppen-Parameter

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Parameter | Wert | Bedeutung |
|-----------|------|-----------|
| `enablegroups` | true | Positionsblasen sind in benannten Gruppen organisiert |
| `groups_as_regular` | true | Gruppen werden als regulaere Spawnpunkte behandelt (jede Gruppe kann ausgewaehlt werden) |
| `lifetime` | 240 | Sekunden, bevor ein genutzter Spawnpunkt wieder verfuegbar wird |
| `counter` | -1 | Wie oft ein Spawnpunkt genutzt werden kann. -1 = unbegrenzt |

Eine genutzte Position ist fuer 240 Sekunden gesperrt, um zu verhindern, dass zwei Spieler uebereinander spawnen.

---

## Frisch-Spawn-Blasen

Vanilla-Chernarus definiert 11 Gruppen entlang der Kueste fuer frische Spawns. Jede Gruppe buendelt 3-8 Positionen um eine Stadt:

| Gruppe | Positionen | Gebiet |
|--------|-----------|--------|
| WestCherno | 4 | Westseite von Chernogorsk |
| EastCherno | 4 | Ostseite von Chernogorsk |
| WestElektro | 5 | West-Elektrozavodsk |
| EastElektro | 4 | Ost-Elektrozavodsk |
| Kamyshovo | 5 | Kamyshovo-Kuestenlinie |
| Solnechny | 5 | Solnechniy-Fabrikgebiet |
| Orlovets | 4 | Zwischen Solnechniy und Nizhnoye |
| Nizhnee | 4 | Nizhnoye-Kueste |
| SouthBerezino | 3 | Suedliches Berezino |
| NorthBerezino | 8 | Noerdliches Berezino + erweiterte Kueste |
| Svetlojarsk | 3 | Svetlojarsk-Hafen |

### Reale Gruppenbeispiele

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

Koordinaten verwenden `x` (Ost-West) und `z` (Nord-Sued). Die Y-Achse (Hoehe) wird automatisch aus der Gelaende-Hoehenkarte berechnet.

---

## Hop-Spawns

Hop-Spawns sind beim Spielerabstand toleranter und verwenden kleinere Raster:

```xml
<!-- Hop spawn_params Unterschiede zu fresh -->
<min_dist_player>25.0</min_dist_player>   <!-- fresh: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- fresh: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- fresh: 0 -->

<!-- Hop generator_params Unterschiede -->
<grid_width>150</grid_width>              <!-- fresh: 200 -->
<grid_height>150</grid_height>            <!-- fresh: 200 -->

<!-- Hop group_params Unterschiede -->
<enablegroups>false</enablegroups>        <!-- fresh: true -->
<lifetime>360</lifetime>                  <!-- fresh: 240 -->
```

Hop-Gruppen sind **im Landesinneren** verteilt: Balota (6), Cherno (5), Pusta (5), Kamyshovo (4), Solnechny (5), Nizhnee (6), Berezino (5), Olsha (4), Svetlojarsk (5), Dobroye (5). Mit `enablegroups=false` behandelt die Engine alle 50 Positionen als flachen Pool.

---

## init.c -- Startausruestung

Die Datei **init.c** in Ihrem Missionsordner steuert Charaktererstellung und Startausruestung. Zwei Overrides sind relevant:

- **`CreateCharacter`** -- ruft `GetGame().CreatePlayer()` auf. Die Engine waehlt die Position aus **cfgplayerspawnpoints.xml**, bevor dies ausgefuehrt wird; Sie setzen hier keine Spawn-Position.
- **`StartingEquipSetup`** -- wird nach der Charaktererstellung ausgefuehrt. Der Spieler hat bereits Standardkleidung (Hemd, Jeans, Turnschuhe). Diese Methode fuegt Startitems hinzu.

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
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 Zustand

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

Was jeder Spieler erhaelt: **BandageDressing** (Schnellleiste 3), zufaelliges **Chemlight** (Schnellleiste 2), zufaelliges Obst -- 35% Apfel, 30% Pflaume, 35% Birne (Schnellleiste 1). `SetRandomHealth` setzt 45-65% Zustand bei allen Items.

### Eigene Startausruestung hinzufuegen

```c
// Nach dem Obst-Block hinzufuegen, innerhalb der Body-Slot-Pruefung
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Eigene Spawn-Punkte hinzufuegen

Um eine eigene Spawn-Gruppe hinzuzufuegen, bearbeiten Sie den `<fresh>`-Abschnitt von **cfgplayerspawnpoints.xml**:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Schritte:

1. Oeffnen Sie Ihre Karte im Spiel oder verwenden Sie iZurvive, um Koordinaten zu finden
2. Waehlen Sie 3-5 Positionen, verteilt ueber 100-200m in einem sicheren Gebiet (keine Klippen, kein Wasser)
3. Fuegen Sie den `<group>`-Block innerhalb von `<generator_posbubbles>` hinzu
4. Verwenden Sie `x` fuer Ost-West und `z` fuer Nord-Sued -- die Engine berechnet Y (Hoehe) vom Gelaende
5. Starten Sie den Server neu -- kein Persistenz-Wipe erforderlich

Fuer ausgewogenes Spawning halten Sie mindestens 4 Positionen pro Gruppe, damit die 240-Sekunden-Sperre nicht alle Positionen blockiert, wenn mehrere Spieler gleichzeitig sterben.

---

## Haeufige Fehler

### Spieler spawnen im Ozean

Sie haben `z` (Nord-Sued) mit Y (Hoehe) vertauscht oder Koordinaten ausserhalb des Bereichs 0-15360 verwendet. Kuestenpositionen haben niedrige `z`-Werte (Suedrand). Ueberpruefen Sie mit iZurvive.

### Nicht genug Spawn-Punkte

Mit nur 2-3 Positionen verursacht die 240-Sekunden-Sperre Ballung. Vanilla verwendet 49 frische Positionen in 11 Gruppen. Streben Sie mindestens 20 Positionen in 4+ Gruppen an.

### Hop-Abschnitt vergessen

Ein leerer `<hop>`-Abschnitt bedeutet, dass Server-Hopper bei `0,0,0` spawnen -- im Ozean auf Chernarus. Definieren Sie immer Hop-Punkte, auch wenn Sie sie von `<fresh>` kopieren.

### Spawn-Punkte auf steilem Gelaende

Der Generator lehnt Neigungen ueber 45 Grad ab. Wenn alle eigenen Positionen an Haengen liegen, existieren keine gueltigen Kandidaten. Verwenden Sie ebenen Boden in der Naehe von Strassen.

### Spieler spawnen immer am selben Ort

Gruppen mit 1-2 Positionen werden durch die 240-Sekunden-Abklingzeit blockiert. Fuegen Sie mehr Positionen pro Gruppe hinzu.

---

[Home](../README.md) | [<< Zurueck: Fahrzeug-Spawning](05-vehicle-spawning.md) | [Weiter: Persistenz >>](07-persistence.md)
