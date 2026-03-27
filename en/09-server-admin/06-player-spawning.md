# Chapter 9.6: Player Spawning

[Home](../README.md) | [<< Previous: Vehicle Spawning](05-vehicle-spawning.md) | [Next: Persistence >>](07-persistence.md)

---

> **Summary:** Player spawn locations are controlled by **cfgplayerspawnpoints.xml** (position bubbles) and **init.c** (starting gear). This chapter covers both files with real vanilla values from Chernarus.

---

## Table of Contents

- [cfgplayerspawnpoints.xml Overview](#cfgplayerspawnpointsxml-overview)
- [Spawn Parameters](#spawn-parameters)
- [Generator Parameters](#generator-parameters)
- [Group Parameters](#group-parameters)
- [Fresh Spawn Bubbles](#fresh-spawn-bubbles)
- [Hop Spawns](#hop-spawns)
- [init.c -- Starting Equipment](#initc----starting-equipment)
- [Adding Custom Spawn Points](#adding-custom-spawn-points)
- [Common Mistakes](#common-mistakes)

---

## cfgplayerspawnpoints.xml Overview

This file lives in your mission folder (e.g., `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). It has two sections, each with its own parameters and position bubbles:

- **`<fresh>`** -- brand new characters (first life or after death)
- **`<hop>`** -- server hoppers (player had a character on another server)

---

## Spawn Parameters

Vanilla fresh spawn values:

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

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `min_dist_infected` | 30 | Player must spawn at least 30m from the nearest infected |
| `max_dist_infected` | 70 | If no position exists 30m+ away, accept up to 70m as fallback range |
| `min_dist_player` | 65 | Player must spawn at least 65m from any other player |
| `max_dist_player` | 150 | Fallback range -- accept positions up to 150m from other players |
| `min_dist_static` | 0 | Minimum distance from static objects (buildings, walls) |
| `max_dist_static` | 2 | Maximum distance from static objects -- keeps players close to structures |

The engine tries `min_dist_*` first; if no valid position exists, it relaxes toward `max_dist_*`.

---

## Generator Parameters

The generator creates a grid of candidate positions around each bubble:

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

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `grid_density` | 4 | Spacing between grid points in meters -- lower = more candidates, higher CPU cost |
| `grid_width` | 200 | Grid extends 200m on the X axis around each bubble center |
| `grid_height` | 200 | Grid extends 200m on the Z axis around each bubble center |
| `min_steepness` / `max_steepness` | -45 / 45 | Terrain slope range in degrees -- rejects cliff faces and steep hills |

Each bubble gets a 200x200m grid with a point every 4m (~2,500 candidates). The engine filters by steepness and static distance, then applies `spawn_params` at spawn time.

#### `allow_in_water` Parameter (1.28+)

Starting in DayZ 1.28, a new boolean `allow_in_water` parameter was added to `generator_params` (default: `false`). When set to `true`, the spawn point generator will consider positions in water as valid spawn points:

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

By default, the engine rejects any candidate position that falls in water (ponds, rivers, ocean). Setting `allow_in_water` to `true` removes this filter. This is primarily useful for custom maps with island spawns or scenarios where coastal water spawns are intentional. For most servers, leave this at `false` to avoid players spawning in lakes or the ocean.

---

## Group Parameters

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `enablegroups` | true | Position bubbles are organized into named groups |
| `groups_as_regular` | true | Groups are treated as regular spawn points (any group can be selected) |
| `lifetime` | 240 | Seconds before a used spawn point becomes available again |
| `counter` | -1 | Number of times a spawn point can be used. -1 = unlimited |

A used position is locked for 240 seconds, preventing two players from spawning on top of each other.

---

## Fresh Spawn Bubbles

Vanilla Chernarus defines 11 groups along the coast for fresh spawns. Each group clusters 3-8 positions around a town:

| Group | Positions | Area |
|-------|-----------|------|
| WestCherno | 4 | West side of Chernogorsk |
| EastCherno | 4 | East side of Chernogorsk |
| WestElektro | 5 | West Elektrozavodsk |
| EastElektro | 4 | East Elektrozavodsk |
| Kamyshovo | 5 | Kamyshovo coastline |
| Solnechny | 5 | Solnechniy factory area |
| Orlovets | 4 | Between Solnechniy and Nizhnoye |
| Nizhnee | 4 | Nizhnoye coast |
| SouthBerezino | 3 | Southern Berezino |
| NorthBerezino | 8 | Northern Berezino + extended coast |
| Svetlojarsk | 3 | Svetlojarsk harbor |

### Real Group Examples

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

Coordinates use `x` (east-west) and `z` (north-south). The Y axis (altitude) is calculated automatically from the terrain heightmap.

---

## Hop Spawns

Hop spawns are more lenient on player distance and use smaller grids:

```xml
<!-- Hop spawn_params differences from fresh -->
<min_dist_player>25.0</min_dist_player>   <!-- fresh: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- fresh: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- fresh: 0 -->

<!-- Hop generator_params differences -->
<grid_width>150</grid_width>              <!-- fresh: 200 -->
<grid_height>150</grid_height>            <!-- fresh: 200 -->

<!-- Hop group_params differences -->
<enablegroups>false</enablegroups>        <!-- fresh: true -->
<lifetime>360</lifetime>                  <!-- fresh: 240 -->
```

Hop groups are spread **inland**: Balota (6), Cherno (5), Pusta (5), Kamyshovo (4), Solnechny (5), Nizhnee (6), Berezino (5), Olsha (4), Svetlojarsk (5), Dobroye (5). With `enablegroups=false`, the engine treats all 50 positions as a flat pool.

---

## init.c -- Starting Equipment

The **init.c** file in your mission folder controls character creation and starting gear. Two overrides matter:

- **`CreateCharacter`** -- calls `GetGame().CreatePlayer()`. The engine picks the position from **cfgplayerspawnpoints.xml** before this runs; you do not set spawn position here.
- **`StartingEquipSetup`** -- runs after character creation. The player already has default clothing (shirt, jeans, sneakers). This method adds starting items.

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
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 health

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

What this gives each player: **BandageDressing** (quickbar 3), random **Chemlight** (quickbar 2), random fruit -- 35% Apple, 30% Plum, 35% Pear (quickbar 1). `SetRandomHealth` sets 45-65% condition on all items.

### Adding custom starting gear

```c
// Add after the fruit block, inside the Body slot check
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Adding Custom Spawn Points

To add a custom spawn group, edit the `<fresh>` section of **cfgplayerspawnpoints.xml**:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Steps:

1. Open your map in-game or use iZurvive to find coordinates
2. Pick 3-5 positions spread across 100-200m in a safe area (no cliffs, no water)
3. Add the `<group>` block inside `<generator_posbubbles>`
4. Use `x` for east-west and `z` for north-south -- the engine calculates Y (altitude) from the terrain
5. Restart the server -- no persistence wipe required

For balanced spawning, keep at least 4 positions per group so the 240-second lockout does not block all positions when multiple players die at once.

---

## Common Mistakes

### Players spawning in the ocean

You swapped `z` (north-south) with Y (altitude), or used coordinates outside the 0-15360 range. Coast positions have low `z` values (south edge). Double-check with iZurvive.

### Not enough spawn points

With only 2-3 positions, the 240-second lockout causes clustering. Vanilla uses 49 fresh positions across 11 groups. Aim for at least 20 positions in 4+ groups.

### Forgetting the hop section

An empty `<hop>` section means server hoppers spawn at `0,0,0` -- the ocean on Chernarus. Always define hop points, even if you copy them from `<fresh>`.

### Spawn points on steep terrain

The generator rejects slopes beyond 45 degrees. If all custom positions are on hillsides, no valid candidates exist. Use flat ground near roads.

### Players always spawning at the same spot

Groups with 1-2 positions get locked by the 240-second cooldown. Add more positions per group.

---

[Home](../README.md) | [<< Previous: Vehicle Spawning](05-vehicle-spawning.md) | [Next: Persistence >>](07-persistence.md)
