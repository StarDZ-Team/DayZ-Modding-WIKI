# Capitulo 8.11: Creando Ropa Personalizada

[Inicio](../README.md) | [<< Anterior: Creando un Vehiculo Personalizado](10-vehicle-mod.md) | **Creando Ropa Personalizada** | [Siguiente: Construyendo un Sistema de Comercio >>](12-trading-system.md)

---

> **Resumen:** Este tutorial te guia a traves de la creacion de una chaqueta tactica personalizada para DayZ. Elegiras una clase base, definiras la ropa en config.cpp con propiedades de aislamiento y carga, la retexturaras con un patron de camuflaje usando selecciones ocultas, agregaras localizacion y spawn, y opcionalmente la extenderas con comportamiento mediante scripts. Al final, tendras una chaqueta usable que mantiene calientes a los jugadores, almacena items y aparece en el mundo.

---

## Tabla de Contenidos

- [Que Vamos a Construir](#que-vamos-a-construir)
- [Paso 1: Elegir una Clase Base](#paso-1-elegir-una-clase-base)
- [Paso 2: config.cpp para Ropa](#paso-2-configcpp-para-ropa)
- [Paso 3: Crear Texturas](#paso-3-crear-texturas)
- [Paso 4: Agregar Espacio de Carga](#paso-4-agregar-espacio-de-carga)
- [Paso 5: Localizacion y Spawn](#paso-5-localizacion-y-spawn)
- [Paso 6: Comportamiento por Script (Opcional)](#paso-6-comportamiento-por-script-opcional)
- [Paso 7: Compilar, Probar, Pulir](#paso-7-compilar-probar-pulir)
- [Referencia Completa de Codigo](#referencia-completa-de-codigo)
- [Errores Comunes](#errores-comunes)
- [Mejores Practicas](#mejores-practicas)
- [Teoria vs Practica](#teoria-vs-practica)
- [Lo Que Aprendiste](#lo-que-aprendiste)

---

## Que Vamos a Construir

Crearemos una **Chaqueta Tactica de Camuflaje** -- una chaqueta de estilo militar con camuflaje boscoso que los jugadores pueden encontrar y usar. Esta:

- Extendera el modelo de chaqueta Gorka vanilla (no se requiere modelado 3D)
- Tendra una retextura de camuflaje personalizada usando selecciones ocultas
- Proporcionara calor a traves de valores `heatIsolation`
- Almacenara items en sus bolsillos (espacio de carga)
- Recibira dano con degradacion visual a traves de estados de salud
- Aparecera en ubicaciones militares del mundo

**Prerrequisitos:** Una estructura de mod funcional (completar primero [Capitulo 8.1](01-first-mod.md) y [Capitulo 8.2](02-custom-item.md)), un editor de texto, DayZ Tools instalado (para TexView2), y un editor de imagenes para crear texturas de camuflaje.

---

## Paso 1: Elegir una Clase Base

La ropa en DayZ hereda de `Clothing_Base`, pero casi nunca se extiende directamente. DayZ proporciona clases base intermedias para cada slot del cuerpo:

| Clase Base | Slot del Cuerpo | Ejemplos |
|------------|-----------|----------|
| `Top_Base` | Cuerpo (torso) | Chaquetas, camisas, sudaderas |
| `Pants_Base` | Piernas | Jeans, pantalones cargo |
| `Shoes_Base` | Pies | Botas, zapatillas |
| `HeadGear_Base` | Cabeza | Cascos, gorros |
| `Mask_Base` | Cara | Mascaras de gas, pasamontanas |
| `Gloves_Base` | Manos | Guantes tacticos |
| `Vest_Base` | Slot de chaleco | Portaplacas, chalecos tacticos |
| `Glasses_Base` | Gafas | Gafas de sol |
| `Backpack_Base` | Espalda | Mochilas, bolsas |

La cadena de herencia completa es: `Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> TuChaqueta`

### Por que Extender un Item Vanilla Existente

Puedes extender en diferentes niveles:

1. **Extender un item especifico** (como `GorkaEJacket_ColorBase`) -- lo mas facil. Heredas el modelo, animaciones, slot y todas las propiedades. Solo cambias texturas y ajustas valores. Esto es lo que hace el ejemplo `Test_ClothingRetexture` de Bohemia.
2. **Extender una base de slot** (como `Top_Base`) -- punto de partida limpio, pero debes especificar un modelo y todas las propiedades.
3. **Extender `Clothing` directamente** -- solo para comportamiento de slot completamente personalizado. Raramente necesario.

Para nuestra chaqueta tactica, extenderemos `GorkaEJacket_ColorBase`. Mirando el script vanilla:

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

Nota el patron: una clase `_ColorBase` maneja el comportamiento compartido, y las variantes de color individuales la extienden sin codigo adicional. Sus entradas de config.cpp proporcionan diferentes texturas. Seguiremos el mismo patron.

Para encontrar clases base, busca en `scripts/4_world/entities/itembase/clothing_base.c` (define todas las bases de slot) y `scripts/4_world/entities/itembase/clothing/` (un archivo por familia de ropa).

---

## Paso 2: config.cpp para Ropa

Crea `MyClothingMod/Data/config.cpp`:

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

### Campos Especificos de Ropa Explicados

**Termicos y sigilo:**

| Campo | Valor | Explicacion |
|-------|-------|-------------|
| `heatIsolation` | `0.8` | Calor proporcionado (rango 0.0-1.0). El motor multiplica esto por factores de salud y humedad. Una chaqueta pristina seca da calor completo; una arruinada y empapada casi ninguno. |
| `visibilityModifier` | `0.7` | Visibilidad del jugador para la IA (menor = mas dificil de detectar). |
| `absorbency` | `0.3` | Absorcion de agua (0 = impermeable, 1 = esponja). Menor es mejor para resistencia a la lluvia. |

**Referencia vanilla de heatIsolation:** Camiseta 0.2, Sudadera 0.5, Chaqueta Gorka 0.7, Chaqueta de Campo 0.8, Abrigo de Lana 0.9.

**Reparacion:** `repairableWithKits[] = { 5, 2 }` lista tipos de kit (5=Kit de Costura, 2=Kit de Costura de Cuero). `repairCosts[]` da el material consumido por reparacion, en orden correspondiente.

**Armadura:** Un valor de `damage` de 0.8 significa que el jugador recibe el 80% del dano entrante (20% absorbido). Valores menores = mas proteccion.

**Humedad:** `Soaking` controla que tan rapido la lluvia/agua empapa el item. Los valores negativos de `Drying` representan perdida de humedad por calor corporal, fogatas y escurrimiento.

**Selecciones ocultas:** El modelo Gorka tiene 3 selecciones -- indice 0 es el modelo en el suelo, indices 1 y 2 son el modelo puesto. Sobreescribes `hiddenSelectionsTextures[]` con tus rutas PAA personalizadas.

**Niveles de salud:** Cada entrada es `{ umbralDeSalud, { rutaDeMaterial } }`. Cuando la salud baja de un umbral, el motor cambia el material. Los rvmats de dano vanilla agregan marcas de desgaste y desgarros.

---

## Paso 3: Crear Texturas

### Encontrar y Crear Texturas

Las texturas de la chaqueta Gorka estan en `DZ\characters\tops\data\` -- extrae `gorka_upper_summer_co.paa` (color), `gorka_upper_nohq.paa` (normal) y `gorka_upper_smdi.paa` (especular) desde la unidad P: para usarlas como plantillas.

**Creando el patron de camuflaje:**

1. Abre la textura vanilla `_co` en TexView2, exporta como TGA/PNG
2. Pinta tu camuflaje boscoso en tu editor de imagenes, siguiendo el layout UV
3. Manten las mismas dimensiones (tipicamente 2048x2048 o 1024x1024)
4. Guarda como TGA, convierte a PAA usando TexView2 (File > Save As > .paa)

### Tipos de Textura

| Sufijo | Proposito | Requerido? |
|--------|---------|-----------|
| `_co` | Color/patron principal | Si |
| `_nohq` | Mapa de normales (detalle de tela) | No -- usa el predeterminado vanilla |
| `_smdi` | Especular (brillo) | No -- usa el predeterminado vanilla |
| `_as` | Mascara alfa/superficie | No |

Para una retextura, solo necesitas texturas `_co`. Los mapas de normales y especulares del modelo vanilla continuan funcionando.

Para control total de material, crea archivos `.rvmat` y referencialos en `hiddenSelectionsMaterials[]`. Ve el ejemplo `Test_ClothingRetexture` de Bohemia para ejemplos funcionales de rvmat con variantes de dano y destruccion.

---

## Paso 4: Agregar Espacio de Carga

Al extender `GorkaEJacket_ColorBase`, heredas su cuadricula de carga (4x3) y slot de inventario (`"Body"`) automaticamente. La propiedad `itemSize[] = { 3, 4 }` define que tan grande es la chaqueta cuando se almacena como loot -- NO su capacidad de carga.

Slots comunes de ropa: `"Body"` (chaquetas), `"Legs"` (pantalones), `"Feet"` (botas), `"Headgear"` (gorros), `"Vest"` (chalecos tacticos), `"Gloves"`, `"Mask"`, `"Back"` (mochilas).

Alguna ropa acepta accesorios (como bolsas del Plate Carrier). Agregalos con `attachments[] = { "Shoulder", "Armband" };`. Para una chaqueta basica, la carga heredada es suficiente.

---

## Paso 5: Localizacion y Spawn

### Stringtable

Crea `MyClothingMod/Data/Stringtable.csv`:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### Spawn (types.xml)

Agrega al `types.xml` de la carpeta de mision de tu servidor:

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

Usa `category name="clothes"` para toda la ropa. Establece `usage` para coincidir con donde deberia aparecer el item (Military, Town, Police, etc.) y `value` para el tier del mapa (Tier1=costa hasta Tier4=interior profundo).

---

## Paso 6: Comportamiento por Script (Opcional)

Para una retextura simple, no necesitas scripts. Pero para agregar comportamiento cuando la chaqueta se usa, crea una clase de script.

### config.cpp de Scripts

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

### Script de Chaqueta Personalizada

Crea `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c`:

```c
class MCM_TacticalJacket_ColorBase extends GorkaEJacket_ColorBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Jugador equipo Chaqueta Tactica");
        }
    }

    override void OnWasDetached(EntityAI parent, int slot_id)
    {
        super.OnWasDetached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Jugador quito Chaqueta Tactica");
        }
    }

    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
```

### Eventos Clave de Ropa

| Evento | Cuando Se Dispara | Uso Comun |
|-------|---------------|------------|
| `OnWasAttached(parent, slot_id)` | El jugador equipa el item | Aplicar buffs, mostrar efectos |
| `OnWasDetached(parent, slot_id)` | El jugador desequipa el item | Remover buffs, limpiar |
| `EEItemAttached(item, slot_name)` | Item adjuntado a esta ropa | Mostrar/ocultar selecciones del modelo |
| `EEItemDetached(item, slot_name)` | Item separado de esta ropa | Revertir cambios visuales |
| `EEHealthLevelChanged(old, new, zone)` | La salud cruza un umbral | Actualizar estado visual |

**Importante:** Siempre llama `super` al inicio de cada override. La clase padre maneja comportamiento critico del motor.

---

## Paso 7: Compilar, Probar, Pulir

### Compilar y Generar

Empaca `Data/` y `Scripts/` como PBOs separados. Lanza DayZ con tu mod y genera la chaqueta:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### Lista de Verificacion

1. **Aparece en el inventario?** Si no, verifica `scope=2` y que el nombre de clase coincida.
2. **Textura correcta?** Textura Gorka predeterminada = rutas incorrectas. Blanco/rosa = archivo de textura faltante.
3. **Puedes equiparla?** Deberia ir al slot Body. Si no, verifica la cadena de clase padre.
4. **Se muestra el nombre?** Si ves texto `$STR_` crudo, la stringtable no esta cargando.
5. **Proporciona calor?** Verifica `heatIsolation` en el menu de debug/inspeccion.
6. **El dano degrada los visuales?** Prueba con: `ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### Agregar Variantes de Color

Sigue el patron `_ColorBase` -- agrega clases hermanas que solo difieren en texturas:

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

Cada variante necesita su propio `scope=2`, nombre de display, texturas, entradas de stringtable y entrada en types.xml.

---

## Referencia Completa de Codigo

### Estructura de Directorios

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- Definiciones de items (ver Paso 2)
        Stringtable.csv         <-- Nombres de display (ver Paso 5)
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- Solo necesario para comportamiento por script
        config.cpp              <-- Entrada CfgMods (ver Paso 6)
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

Todos los demas archivos se muestran completos en sus respectivos pasos arriba.

---

## Errores Comunes

| Error | Consecuencia | Solucion |
|---------|-------------|-----|
| Olvidar `scope=2` en variantes | El item no aparece ni se genera en herramientas de admin | Establecer `scope=0` en base, `scope=2` en cada variante generada |
| Conteo incorrecto de array de texturas | Texturas blancas/rosadas en algunas partes | Coincidir el conteo de `hiddenSelectionsTextures` con las selecciones ocultas del modelo (Gorka tiene 3) |
| Barras normales en rutas de texturas | Las texturas fallan al cargar silenciosamente | Usar barras invertidas: `"MyMod\Data\tex.paa"` |
| `requiredAddons` faltante | El parser de config no puede resolver la clase padre | Incluir `"DZ_Characters_Tops"` para prendas superiores |
| `heatIsolation` sobre 1.0 | El jugador se sobrecalienta en clima calido | Mantener valores en rango 0.0-1.0 |
| Materiales de `healthLevels` vacios | Sin degradacion visual de dano | Siempre referenciar al menos rvmats vanilla |
| Omitir `super` en overrides | Inventario, dano o comportamiento de adjuntos roto | Siempre llamar `super.NombreDelMetodo()` primero |

---

## Mejores Practicas

- **Comienza con una retextura simple.** Obtiene un mod funcional con cambio de textura antes de agregar propiedades o scripts personalizados. Esto aisla problemas de config de problemas de textura.
- **Usa el patron _ColorBase.** Propiedades compartidas en base `scope=0`, solo texturas y nombres en variantes `scope=2`. Sin duplicacion.
- **Mantiene valores de aislamiento realistas.** Referencia items vanilla con equivalentes similares del mundo real.
- **Prueba con consola de script antes de types.xml.** Confirma que el item funciona antes de depurar tablas de spawn.
- **Usa referencias `$STR_` para todo texto visible al jugador.** Permite localizacion futura sin cambios de config.
- **Empaca Data y Scripts como PBOs separados.** Actualiza texturas sin reconstruir scripts.
- **Proporciona texturas de suelo.** La textura `_g_` hace que los items tirados se vean correctos.

---

## Teoria vs Practica

| Concepto | Teoria | Realidad |
|---------|--------|---------|
| `heatIsolation` | Un numero simple de calor | El calor efectivo depende de la salud y humedad. El motor lo multiplica por factores en `MiscGameplayFunctions.GetCurrentItemHeatIsolation()`. |
| Valores de `damage` de armadura | Menor = mas proteccion | Un valor de 0.8 significa que el jugador recibe 80% de dano (solo 20% absorbido). Muchos modders leen 0.9 como "90% de proteccion" cuando realmente es 10%. |
| Herencia de `scope` | Los hijos heredan el scope del padre | NO lo hacen. Cada clase debe establecer `scope` explicitamente. El padre con `scope=0` deja a todos los hijos en `scope=0` por defecto. |
| `absorbency` | Controla la proteccion contra lluvia | Controla la absorcion de humedad, lo que REDUCE el calor. Impermeable = `absorbency` BAJO (0.1). `absorbency` alto (0.8+) = se empapa como una esponja. |
| Selecciones ocultas | Funcionan en cualquier modelo | No todos los modelos exponen las mismas selecciones. Verifica con Object Builder o config vanilla antes de elegir un modelo base. |

---

## Lo Que Aprendiste

En este tutorial aprendiste:

- Como la ropa de DayZ hereda de clases base especificas de slot (`Top_Base`, `Pants_Base`, etc.)
- Como definir un item de ropa en config.cpp con propiedades termicas, de armadura y humedad
- Como las selecciones ocultas permiten retexturizar modelos vanilla con patrones de camuflaje personalizados
- Como `heatIsolation`, `visibilityModifier` y `absorbency` afectan el gameplay
- Como el `DamageSystem` controla la degradacion visual y la proteccion de armadura
- Como crear variantes de color usando el patron `_ColorBase`
- Como agregar entradas de spawn con `types.xml` y nombres de display con `Stringtable.csv`
- Como opcionalmente agregar comportamiento por script con eventos `OnWasAttached` y `OnWasDetached`

**Siguiente:** Aplica las mismas tecnicas para crear pantalones (`Pants_Base`), botas (`Shoes_Base`) o un chaleco (`Vest_Base`). La estructura de config es identica -- solo cambian la clase padre y el slot de inventario.

---

**Anterior:** [Capitulo 8.8: HUD Overlay](08-hud-overlay.md)
**Siguiente:** Proximamente
