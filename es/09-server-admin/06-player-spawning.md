# Capitulo 9.6: Spawn de Jugadores

[Inicio](../README.md) | [<< Anterior: Spawn de Vehiculos](05-vehicle-spawning.md) | [Siguiente: Persistencia >>](07-persistence.md)

---

> **Resumen:** Las ubicaciones de spawn de jugadores son controladas por **cfgplayerspawnpoints.xml** (burbujas de posicion) e **init.c** (equipo inicial). Este capitulo cubre ambos archivos con valores reales vanilla de Chernarus.

---

## Tabla de Contenidos

- [Vista general de cfgplayerspawnpoints.xml](#vista-general-de-cfgplayerspawnpointsxml)
- [Parametros de spawn](#parametros-de-spawn)
- [Parametros del generador](#parametros-del-generador)
- [Parametros de grupo](#parametros-de-grupo)
- [Burbujas de spawn nuevo](#burbujas-de-spawn-nuevo)
- [Spawns de hop](#spawns-de-hop)
- [init.c -- Equipo inicial](#initc----equipo-inicial)
- [Agregar puntos de spawn personalizados](#agregar-puntos-de-spawn-personalizados)
- [Errores comunes](#errores-comunes)

---

## Vista general de cfgplayerspawnpoints.xml

Este archivo vive en tu carpeta de mision (por ejemplo, `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). Tiene dos secciones, cada una con sus propios parametros y burbujas de posicion:

- **`<fresh>`** -- personajes completamente nuevos (primera vida o despues de morir)
- **`<hop>`** -- saltadores de servidor (el jugador tenia un personaje en otro servidor)

---

## Parametros de spawn

Valores vanilla de spawn nuevo:

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

| Parametro | Valor | Significado |
|-----------|-------|---------|
| `min_dist_infected` | 30 | El jugador debe spawnear al menos a 30m del infectado mas cercano |
| `max_dist_infected` | 70 | Si no existe posicion a 30m+, aceptar hasta 70m como rango alternativo |
| `min_dist_player` | 65 | El jugador debe spawnear al menos a 65m de cualquier otro jugador |
| `max_dist_player` | 150 | Rango alternativo -- aceptar posiciones hasta 150m de otros jugadores |
| `min_dist_static` | 0 | Distancia minima de objetos estaticos (edificios, muros) |
| `max_dist_static` | 2 | Distancia maxima de objetos estaticos -- mantiene a los jugadores cerca de estructuras |

El motor intenta `min_dist_*` primero; si no existe posicion valida, relaja hacia `max_dist_*`.

---

## Parametros del generador

El generador crea una cuadricula de posiciones candidatas alrededor de cada burbuja:

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

| Parametro | Valor | Significado |
|-----------|-------|---------|
| `grid_density` | 4 | Espaciado entre puntos de cuadricula en metros -- mas bajo = mas candidatos, mayor costo de CPU |
| `grid_width` | 200 | La cuadricula se extiende 200m en el eje X alrededor del centro de cada burbuja |
| `grid_height` | 200 | La cuadricula se extiende 200m en el eje Z alrededor del centro de cada burbuja |
| `min_steepness` / `max_steepness` | -45 / 45 | Rango de pendiente del terreno en grados -- rechaza acantilados y colinas empinadas |

Cada burbuja obtiene una cuadricula de 200x200m con un punto cada 4m (~2,500 candidatos). El motor filtra por pendiente y distancia estatica, luego aplica `spawn_params` en el momento del spawn.

#### Parametro `allow_in_water` (1.28+)

A partir de DayZ 1.28, se agrego un nuevo parametro booleano `allow_in_water` a `generator_params` (predeterminado: `false`). Cuando se establece en `true`, el generador de puntos de spawn considerara posiciones en el agua como puntos de spawn validos:

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

Por defecto, el motor rechaza cualquier posicion candidata que caiga en agua (estanques, rios, oceano). Establecer `allow_in_water` en `true` elimina este filtro. Esto es principalmente util para mapas personalizados con spawns en islas o escenarios donde los spawns en agua costera son intencionales. Para la mayoria de servidores, deja esto en `false` para evitar que los jugadores spawneen en lagos o el oceano.

---

## Parametros de grupo

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Parametro | Valor | Significado |
|-----------|-------|---------|
| `enablegroups` | true | Las burbujas de posicion se organizan en grupos con nombre |
| `groups_as_regular` | true | Los grupos se tratan como puntos de spawn regulares (cualquier grupo puede ser seleccionado) |
| `lifetime` | 240 | Segundos antes de que un punto de spawn usado vuelva a estar disponible |
| `counter` | -1 | Numero de veces que un punto de spawn puede ser usado. -1 = ilimitado |

Una posicion usada queda bloqueada por 240 segundos, previniendo que dos jugadores spawneen uno encima del otro.

---

## Burbujas de spawn nuevo

Chernarus vanilla define 11 grupos a lo largo de la costa para spawns nuevos. Cada grupo agrupa 3-8 posiciones alrededor de un pueblo:

| Grupo | Posiciones | Area |
|-------|-----------|------|
| WestCherno | 4 | Lado oeste de Chernogorsk |
| EastCherno | 4 | Lado este de Chernogorsk |
| WestElektro | 5 | Oeste de Elektrozavodsk |
| EastElektro | 4 | Este de Elektrozavodsk |
| Kamyshovo | 5 | Costa de Kamyshovo |
| Solnechny | 5 | Area de fabrica de Solnechniy |
| Orlovets | 4 | Entre Solnechniy y Nizhnoye |
| Nizhnee | 4 | Costa de Nizhnoye |
| SouthBerezino | 3 | Sur de Berezino |
| NorthBerezino | 8 | Norte de Berezino + costa extendida |
| Svetlojarsk | 3 | Puerto de Svetlojarsk |

### Ejemplos reales de grupos

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

Las coordenadas usan `x` (este-oeste) y `z` (norte-sur). El eje Y (altitud) se calcula automaticamente desde el heightmap del terreno.

---

## Spawns de hop

Los spawns de hop son mas permisivos en distancia de jugador y usan cuadriculas mas pequenas:

```xml
<!-- Diferencias de spawn_params de hop respecto a fresh -->
<min_dist_player>25.0</min_dist_player>   <!-- fresh: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- fresh: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- fresh: 0 -->

<!-- Diferencias de generator_params de hop -->
<grid_width>150</grid_width>              <!-- fresh: 200 -->
<grid_height>150</grid_height>            <!-- fresh: 200 -->

<!-- Diferencias de group_params de hop -->
<enablegroups>false</enablegroups>        <!-- fresh: true -->
<lifetime>360</lifetime>                  <!-- fresh: 240 -->
```

Los grupos de hop estan distribuidos **tierra adentro**: Balota (6), Cherno (5), Pusta (5), Kamyshovo (4), Solnechny (5), Nizhnee (6), Berezino (5), Olsha (4), Svetlojarsk (5), Dobroye (5). Con `enablegroups=false`, el motor trata las 50 posiciones como un pool plano.

---

## init.c -- Equipo inicial

El archivo **init.c** en tu carpeta de mision controla la creacion de personajes y el equipo inicial. Dos sobreescrituras importan:

- **`CreateCharacter`** -- llama a `GetGame().CreatePlayer()`. El motor elige la posicion desde **cfgplayerspawnpoints.xml** antes de que esto se ejecute; no estableces la posicion de spawn aqui.
- **`StartingEquipSetup`** -- se ejecuta despues de la creacion del personaje. El jugador ya tiene ropa predeterminada (camisa, jeans, zapatillas). Este metodo agrega items iniciales.

### StartingEquipSetup vanilla (Chernarus)

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 de salud

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

Lo que esto da a cada jugador: **BandageDressing** (barra rapida 3), **Chemlight** aleatorio (barra rapida 2), fruta aleatoria -- 35% Apple, 30% Plum, 35% Pear (barra rapida 1). `SetRandomHealth` establece condicion de 45-65% en todos los items.

### Agregar equipo inicial personalizado

```c
// Agregar despues del bloque de fruta, dentro de la verificacion del slot Body
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Agregar puntos de spawn personalizados

Para agregar un grupo de spawn personalizado, edita la seccion `<fresh>` de **cfgplayerspawnpoints.xml**:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Pasos:

1. Abre tu mapa en el juego o usa iZurvive para encontrar coordenadas
2. Elige 3-5 posiciones distribuidas en 100-200m en un area segura (sin acantilados, sin agua)
3. Agrega el bloque `<group>` dentro de `<generator_posbubbles>`
4. Usa `x` para este-oeste y `z` para norte-sur -- el motor calcula Y (altitud) desde el terreno
5. Reinicia el servidor -- no se requiere borrado de persistencia

Para un spawn balanceado, manten al menos 4 posiciones por grupo para que el bloqueo de 240 segundos no bloquee todas las posiciones cuando multiples jugadores mueren a la vez.

---

## Errores comunes

### Jugadores spawneando en el oceano

Intercambiaste `z` (norte-sur) con Y (altitud), o usaste coordenadas fuera del rango 0-15360. Las posiciones de costa tienen valores bajos de `z` (borde sur). Verifica con iZurvive.

### No hay suficientes puntos de spawn

Con solo 2-3 posiciones, el bloqueo de 240 segundos causa agrupamiento. Vanilla usa 49 posiciones nuevas a traves de 11 grupos. Apunta a al menos 20 posiciones en 4+ grupos.

### Olvidar la seccion hop

Una seccion `<hop>` vacia significa que los saltadores de servidor spawnean en `0,0,0` -- el oceano en Chernarus. Siempre define puntos de hop, incluso si los copias de `<fresh>`.

### Puntos de spawn en terreno empinado

El generador rechaza pendientes superiores a 45 grados. Si todas las posiciones personalizadas estan en laderas, no existen candidatos validos. Usa terreno plano cerca de caminos.

### Jugadores siempre spawneando en el mismo punto

Los grupos con 1-2 posiciones quedan bloqueados por el enfriamiento de 240 segundos. Agrega mas posiciones por grupo.

---

[Inicio](../README.md) | [<< Anterior: Spawn de Vehiculos](05-vehicle-spawning.md) | [Siguiente: Persistencia >>](07-persistence.md)
