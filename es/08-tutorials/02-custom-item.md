# Capitulo 8.2: Crear un Item Personalizado

[Inicio](../README.md) | [<< Anterior: Tu Primer Mod](01-first-mod.md) | **Crear un Item Personalizado** | [Siguiente: Construir un Panel de Admin >>](03-admin-panel.md)

---

## Tabla de Contenidos

- [Que Estamos Construyendo](#que-estamos-construyendo)
- [Requisitos Previos](#requisitos-previos)
- [Paso 1: Definir la Clase del Item en config.cpp](#paso-1-definir-la-clase-del-item-en-configcpp)
- [Paso 2: Configurar Hidden Selections para Texturas](#paso-2-configurar-hidden-selections-para-texturas)
- [Paso 3: Crear Texturas Basicas](#paso-3-crear-texturas-basicas)
- [Paso 4: Agregar a types.xml para Spawn en Servidor](#paso-4-agregar-a-typesxml-para-spawn-en-servidor)
- [Paso 5: Crear un Nombre con Stringtable](#paso-5-crear-un-nombre-con-stringtable)
- [Paso 6: Probar en el Juego](#paso-6-probar-en-el-juego)
- [Paso 7: Pulir -- Modelo, Texturas y Sonidos](#paso-7-pulir----modelo-texturas-y-sonidos)
- [Referencia Completa de Archivos](#referencia-completa-de-archivos)
- [Solucion de Problemas](#solucion-de-problemas)
- [Siguientes Pasos](#siguientes-pasos)

---

## Que Estamos Construyendo

Crearemos un item llamado **Field Journal** -- un pequeno cuaderno que los jugadores pueden encontrar en el mundo, recoger y guardar en su inventario. Tendra:

- Un modelo vanilla (prestado de un item existente) para no necesitar modelado 3D
- Una apariencia retexturizada personalizada usando hidden selections
- Aparecera en la tabla de spawn del servidor
- Un nombre y descripcion apropiados

Este es el flujo de trabajo estandar para crear cualquier item en DayZ, ya sea comida, herramientas, ropa o materiales de construccion.

---

## Requisitos Previos

- Una estructura de mod funcional (completa primero el [Capitulo 8.1](01-first-mod.md))
- Un editor de texto
- DayZ Tools instalado (para conversion de texturas, opcional)

Construiremos sobre el mod del Capitulo 8.1. Tu estructura actual deberia verse asi:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        5_Mission/
            MyFirstMod/
                MissionHello.c
```

---

## Paso 1: Definir la Clase del Item en config.cpp

Los items en DayZ se definen en la clase de config `CfgVehicles`. A pesar del nombre "Vehicles", esta clase contiene TODOS los tipos de entidades: items, edificios, vehiculos, animales y todo lo demas.

### Crear un config.cpp de Datos

Es buena practica mantener las definiciones de items en un PBO separado de tus scripts. Crea una nueva estructura de carpetas:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp              <-- Ya existe (scripts)
    Data/
        config.cpp              <-- NUEVO (definiciones de items)
```

Crea el archivo `MyFirstMod/Data/config.cpp` con este contenido:

```cpp
class CfgPatches
{
    class MyFirstMod_Data
    {
        units[] = { "MFM_FieldJournal" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Characters"
        };
    };
};

class CfgVehicles
{
    class Inventory_Base;

    class MFM_FieldJournal : Inventory_Base
    {
        scope = 2;
        displayName = "$STR_MFM_FieldJournal";
        descriptionShort = "$STR_MFM_FieldJournal_Desc";
        model = "\DZ\characters\accessories\data\Notebook\Notebook.p3d";
        rotationFlags = 17;
        weight = 200;
        itemSize[] = { 1, 2 };
        absorbency = 0.5;

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 100;
                    healthLevels[] =
                    {
                        { 1.0, {} },
                        { 0.7, {} },
                        { 0.5, {} },
                        { 0.3, {} },
                        { 0.0, {} }
                    };
                };
            };
        };

        hiddenSelections[] = { "camoGround" };
        hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
    };
};
```

### Que Hace Cada Campo

| Campo | Valor | Explicacion |
|-------|-------|-------------|
| `scope` | `2` | Hace el item publico -- spawneable y visible en herramientas de admin. Usa `0` para clases base que nunca deberian spawnearse directamente. |
| `displayName` | `"$STR_MFM_FieldJournal"` | Referencia una entrada de string table para el nombre del item. El prefijo `$STR_` le dice al motor que lo busque en `stringtable.csv`. |
| `descriptionShort` | `"$STR_MFM_FieldJournal_Desc"` | Descripcion corta mostrada en el tooltip del inventario. |
| `model` | Ruta a `.p3d` | El modelo 3D. Tomamos prestado el modelo Notebook de vanilla. El prefijo `\DZ\` referencia archivos del juego vanilla. |
| `rotationFlags` | `17` | Bitmask que controla como el item puede rotar en el inventario. `17` permite rotacion estandar. |
| `weight` | `200` | Peso en gramos. |
| `itemSize[]` | `{ 1, 2 }` | Tamano de cuadricula de inventario: 1 columna de ancho, 2 filas de alto. |
| `absorbency` | `0.5` | Cuanto absorbe agua el item (0 = nada, 1 = completamente). Afecta al item cuando llueve. |
| `hiddenSelections[]` | `{ "camoGround" }` | Slots de textura nombrados en el modelo que pueden ser sobreescritos. |
| `hiddenSelectionsTextures[]` | Ruta a `.paa` | Tu textura personalizada para cada hidden selection. |

### Sobre la Clase Padre

```cpp
class Inventory_Base;
```

Esta linea es una **declaracion anticipada**. Le dice al parser de config que `Inventory_Base` existe (esta definida en DayZ vanilla). Tu clase de item luego hereda de ella:

```cpp
class MFM_FieldJournal : Inventory_Base
```

`Inventory_Base` es el padre estandar para items pequenos que van en el inventario del jugador. Otras clases padre comunes incluyen:

| Clase Padre | Usar Para |
|-------------|---------|
| `Inventory_Base` | Items de inventario genericos |
| `Edible_Base` | Comida y bebida |
| `Clothing_Base` | Ropa/armadura usable |
| `Weapon_Base` | Armas de fuego |
| `Magazine_Base` | Cargadores y cajas de municion |
| `HouseNoDestruct` | Edificios y estructuras |

### Sobre DamageSystem

El bloque `DamageSystem` define como el item recibe dano y se degrada. El array `healthLevels` mapea porcentajes de salud a estados de textura:

- `1.0` = pristine (perfecto)
- `0.7` = worn (usado)
- `0.5` = damaged (danado)
- `0.3` = badly damaged (muy danado)
- `0.0` = ruined (arruinado)

Los `{}` vacios despues de cada nivel son donde especificarias texturas de overlay de dano. Por simplicidad, los dejamos vacios.

---

## Paso 2: Configurar Hidden Selections para Texturas

Las hidden selections son el mecanismo que DayZ usa para intercambiar texturas en un modelo 3D sin modificar el archivo del modelo. El modelo Notebook de vanilla tiene una hidden selection llamada `"camoGround"` que controla su textura principal.

### Como Funcionan las Hidden Selections

1. El modelo 3D (`.p3d`) define regiones nombradas llamadas **selections**
2. En config.cpp, `hiddenSelections[]` lista que selections quieres sobreescribir
3. `hiddenSelectionsTextures[]` provee tus texturas de reemplazo, en orden correspondiente

```cpp
hiddenSelections[] = { "camoGround" };
hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
```

La primera entrada en `hiddenSelectionsTextures` reemplaza la primera entrada en `hiddenSelections`. Si tuvieras multiples selections:

```cpp
hiddenSelections[] = { "camoGround", "camoMale", "camoFemale" };
hiddenSelectionsTextures[] = { "path\tex1.paa", "path\tex2.paa", "path\tex3.paa" };
```

### Encontrar Nombres de Hidden Selections

Para descubrir que hidden selections soporta un modelo vanilla:

1. Abre **Object Builder** (desde DayZ Tools)
2. Carga el archivo `.p3d` del modelo
3. Mira la lista de **Named Selections**
4. Las selections que empiezan con `"camo"` son tipicamente las que puedes sobreescribir

Alternativamente, mira el `config.cpp` vanilla para el item en el que basas tu item. El array `hiddenSelections[]` muestra que esta disponible.

---

## Paso 3: Crear Texturas Basicas

DayZ usa el formato `.paa` para texturas. Durante el desarrollo, puedes empezar con una imagen coloreada simple y convertirla despues.

### Crear la Carpeta de Texturas

```
MyFirstMod/
    Data/
        config.cpp
        Textures/
            field_journal_co.paa
```

### Opcion A: Usar un Placeholder (Lo Mas Rapido)

Para pruebas iniciales, puedes apuntar `hiddenSelectionsTextures` a una textura vanilla en lugar de crear la tuya:

```cpp
hiddenSelectionsTextures[] = { "\DZ\characters\accessories\data\Notebook\notebook_co.paa" };
```

Esto usa la textura vanilla del notebook. Tu item se vera identico al notebook vanilla pero funcionara como tu item personalizado. Reemplazala con tu propia textura una vez que confirmes que todo funciona.

### Opcion B: Crear una Textura Personalizada

1. **Crea una imagen fuente:**
   - Abre cualquier editor de imagenes (GIMP, Photoshop, Paint.NET o incluso MS Paint)
   - Crea una nueva imagen de **512x512 pixeles** (las dimensiones deben ser potencia de 2: 256, 512, 1024, 2048)
   - Rellenala con un color o diseno. Para un diario de campo, prueba un marron oscuro o verde.
   - Guarda como `.tga` (formato TGA) o `.png`

2. **Convierte a `.paa`:**
   - Abre **TexView2** desde DayZ Tools
   - Ve a **File > Open** y selecciona tu `.tga` o `.png`
   - Ve a **File > Save As** y guarda en formato `.paa`
   - Guardalo en `MyFirstMod/Data/Textures/field_journal_co.paa`

   El sufijo `_co` es una convencion de nombres que significa "color" (la textura diffuse/albedo). Otros sufijos incluyen `_nohq` (mapa de normales), `_smdi` (especular) y `_as` (alfa/transparencia).

### Convenciones de Nombres de Texturas

| Sufijo | Tipo | Proposito |
|--------|------|---------|
| `_co` | Color (Diffuse) | La textura principal de color/apariencia |
| `_nohq` | Mapa de Normales | Detalle de superficie y normales de iluminacion |
| `_smdi` | Especular | Brillo y propiedades metalicas |
| `_as` | Alfa/Superficie | Transparencia o mascara de superficie |
| `_de` | Detalle | Overlay de detalle adicional |

Para un primer item, solo necesitas la textura `_co`. El modelo usara valores predeterminados para las demas.

---

## Paso 4: Agregar a types.xml para Spawn en Servidor

El archivo `types.xml` controla que items aparecen en el mundo, cuantos existen a la vez y donde aparecen. Este archivo vive en la **carpeta de mision** del servidor (no en tu mod).

### Localizar types.xml

Para un servidor DayZ estandar, `types.xml` esta en:

```
<DayZ Server>\mpmissions\dayzOffline.chernarusplus\db\types.xml
```

### Agregar la Entrada de Tu Item

Abre `types.xml` y agrega este bloque dentro del elemento raiz `<types>`:

```xml
<type name="MFM_FieldJournal">
    <nominal>10</nominal>
    <lifetime>14400</lifetime>
    <restock>1800</restock>
    <min>5</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="tools" />
    <usage name="Town" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
</type>
```

### Que Significa Cada Tag

| Tag | Valor | Explicacion |
|-----|-------|-------------|
| `name` | `"MFM_FieldJournal"` | Debe coincidir exactamente con el nombre de clase de tu config.cpp |
| `nominal` | `10` | Numero objetivo de este item en el mundo en cualquier momento |
| `lifetime` | `14400` | Segundos antes de que un item tirado desaparezca (14400 = 4 horas) |
| `restock` | `1800` | Segundos entre verificaciones de respawn (1800 = 30 minutos) |
| `min` | `5` | Numero minimo que el Central Economy intenta mantener |
| `quantmin` / `quantmax` | `-1` | Rango de cantidad (-1 = no aplica, usado para items con cantidad variable como botellas de agua) |
| `cost` | `100` | Peso de prioridad de economia (mayor = spawnea mas facilmente) |
| `flags` | Varios | Que cuenta hacia el limite nominal |
| `category` | `"tools"` | Categoria del item para balanceo de economia |
| `usage` | `"Town"`, `"Village"` | Donde spawnea el item (categorias de ubicacion) |
| `value` | `"Tier1"`, `"Tier2"` | Zonas de tier del mapa donde aparece el item |

### Tags Comunes de Usage y Value

**Usage (donde spawnea):**
- `Town`, `Village`, `Farm`, `Industrial`, `Military`, `Hunting`, `Medical`, `Coast`, `Firefighter`, `Prison`, `Police`, `School`, `ContaminatedArea`

**Value (tier del mapa):**
- `Tier1` -- costa/areas iniciales
- `Tier2` -- pueblos del interior
- `Tier3` -- militar/noroeste
- `Tier4` -- interior mas profundo/endgame

---

## Paso 5: Crear un Nombre con Stringtable

La string table provee texto localizado para nombres y descripciones de items. DayZ lee string tables de archivos `stringtable.csv`.

### Crear la Stringtable

Crea el archivo `MyFirstMod/Data/Stringtable.csv` con este contenido:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MFM_FieldJournal","Field Journal","","","","","","","","","","","","",""
"STR_MFM_FieldJournal_Desc","A weathered leather journal used to record field notes and observations.","","","","","","","","","","","","",""
```

Cada fila tiene columnas para cada idioma soportado. Solo necesitas llenar la columna `"English"`. Las otras columnas pueden ser strings vacios -- el motor recurre al ingles cuando falta una traduccion.

### Como Funcionan las Referencias de String

En tu config.cpp, escribiste:

```cpp
displayName = "$STR_MFM_FieldJournal";
```

El prefijo `$STR_` le dice al motor: "Busca una entrada de string table llamada `STR_MFM_FieldJournal`." El motor busca en todos los archivos `Stringtable.csv` cargados una fila que coincida y retorna el texto para el idioma del jugador.

### Reglas del Formato CSV

- La primera fila debe ser el encabezado con nombres de idiomas (en el orden exacto mostrado arriba)
- Cada fila subsiguiente es: `"CLAVE","Texto en ingles","Texto en checo",...`
- Todos los valores deben estar entre comillas dobles
- Los valores se separan con comas
- Sin coma al final despues del ultimo valor
- Guardar con codificacion UTF-8 (importante para caracteres no ASCII en otros idiomas)

---

## Paso 6: Probar en el Juego

### Actualizar Tu Scripts config.cpp

Antes de probar, necesitas actualizar tu `Scripts/config.cpp` para tambien empaquetar la carpeta Data, O empaquetar la carpeta Data como un PBO separado.

**Opcion A: PBO Separado (Recomendado)**

Empaqueta `MyFirstMod/Data/` como un segundo PBO:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Contiene Scripts/config.cpp y 5_Mission/
        Data.pbo             <-- Contiene Data/config.cpp, Textures/, Stringtable.csv
```

Usa Addon Builder con:
- Source: `MyFirstMod/Data/`
- Prefix: `MyFirstMod/Data`

**Opcion B: File Patching (Desarrollo)**

Durante el desarrollo con `-filePatching`, el motor lee directamente de tus carpetas. No se necesita empaquetado PBO adicional:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Spawnear el Item Usando la Consola de Script

La forma mas rapida de probar tu item sin esperar a que spawnee naturalmente:

1. Lanza DayZ con tu mod cargado
2. Unete a tu servidor local o inicia el modo offline
3. Abre la **consola de script** (si usas DayZDiag, esta disponible desde el menu de debug)
4. En la consola de script, escribe:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MFM_FieldJournal");
```

5. Presiona **Execute** (o el boton de ejecutar)

El item deberia aparecer en el inventario de tu personaje.

### Alternativa: Spawnear Cerca del Jugador

Si tu inventario esta lleno, spawnea el item en el suelo cerca de tu personaje:

```c
vector pos = GetGame().GetPlayer().GetPosition();
GetGame().CreateObject("MFM_FieldJournal", pos, false, false, true);
```

### Que Verificar

1. **Aparece el item?** Si es asi, la definicion de clase en config.cpp es correcta.
2. **Tiene el nombre correcto?** Verifica que "Field Journal" aparezca (no `$STR_MFM_FieldJournal`). Si ves la referencia de string cruda, la stringtable no esta cargando.
3. **Tiene la textura correcta?** Si usas una textura personalizada, verifica que los colores coincidan. Si el item aparece todo blanco o rosa, la ruta de textura esta mal.
4. **Puedes recogerlo?** Si el item spawnea pero no puede ser recogido, verifica `itemSize` y `scope`.
5. **Se ve correcto el icono de inventario?** El tamano deberia coincidir con tu definicion de `itemSize[]`.

---

## Paso 7: Pulir -- Modelo, Texturas y Sonidos

Una vez que tu item funciona con un modelo prestado, puedes mejorarlo con assets personalizados.

### Modelo 3D Personalizado

Crear un modelo `.p3d` personalizado requiere:

1. **Blender o 3DS Max** con el plugin de herramientas DayZ (Blender es gratuito)
2. Exportar el modelo como `.p3d` usando Object Builder
3. Definir geometria adecuada (mesh visual), geometria de fuego (colision) y geometria de vista (LODs)
4. Crear mapas UV para tus texturas
5. Definir named selections para hidden selections

Esto es un emprendimiento significativo. Para la mayoria de items, retexturizar un modelo vanilla (como hicimos arriba) es suficiente.

### Texturas Mejoradas

Para un item con apariencia profesional:

1. Crea una textura de **2048x2048** para detalle de cerca (o 1024x1024 para items pequenos)
2. Incluye un **mapa de normales** (`_nohq.paa`) para detalle de superficie sin poligonos extra
3. Incluye un **mapa especular** (`_smdi.paa`) para propiedades de material (brillo, rugosidad)
4. Actualiza tu config:

```cpp
hiddenSelections[] = { "camoGround" };
hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
hiddenSelectionsMaterials[] = { "MyFirstMod\Data\Textures\field_journal.rvmat" };
```

Un archivo `.rvmat` (archivo de material Rvmat) une todos los mapas de textura:

```cpp
ambient[] = { 1.0, 1.0, 1.0, 1.0 };
diffuse[] = { 1.0, 1.0, 1.0, 1.0 };
forcedDiffuse[] = { 0.0, 0.0, 0.0, 0.0 };
emmisive[] = { 0.0, 0.0, 0.0, 0.0 };
specular[] = { 0.2, 0.2, 0.2, 1.0 };
specularPower = 40;

PixelShaderID = "NormalMap";
VertexShaderID = "NormalMap";

class Stage1
{
    texture = "MyFirstMod\Data\Textures\field_journal_nohq.paa";
    uvSource = "tex";
};

class Stage2
{
    texture = "MyFirstMod\Data\Textures\field_journal_smdi.paa";
    uvSource = "tex";
};
```

### Sonidos Personalizados

Para agregar un sonido cuando el item se usa o se recoge:

1. Crea un archivo de audio `.ogg` (formato OGG Vorbis, el unico formato que DayZ soporta para sonidos personalizados)
2. Define `CfgSoundShaders` y `CfgSoundSets` en tu Data config.cpp:

```cpp
class CfgSoundShaders
{
    class MFM_JournalOpen_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\journal_open", 1 }};
        volume = 0.6;
        range = 3;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MFM_JournalOpen_SoundSet
    {
        soundShaders[] = { "MFM_JournalOpen_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
};
```

Nota: Las rutas de archivos de sonido en `samples[]` NO incluyen la extension `.ogg`.

### Agregar Comportamiento con Script

Para darle a tu item comportamiento personalizado (por ejemplo, una accion cuando el jugador lo usa), crea una clase de script en `4_World`:

```
MyFirstMod/
    Scripts/
        config.cpp              <-- Agregar entrada de worldScriptModule
        4_World/
            MyFirstMod/
                MFM_FieldJournal.c
        5_Mission/
            MyFirstMod/
                MissionHello.c
```

Actualiza `Scripts/config.cpp` para incluir la nueva capa:

```cpp
dependencies[] = { "World", "Mission" };

class defs
{
    class worldScriptModule
    {
        value = "";
        files[] = { "MyFirstMod/Scripts/4_World" };
    };
    class missionScriptModule
    {
        value = "";
        files[] = { "MyFirstMod/Scripts/5_Mission" };
    };
};
```

Crea `4_World/MyFirstMod/MFM_FieldJournal.c`:

```c
class MFM_FieldJournal extends Inventory_Base
{
    override bool CanPutInCargo(EntityAI parent)
    {
        if (!super.CanPutInCargo(parent))
            return false;

        return true;
    }

    override void SetActions()
    {
        super.SetActions();
        // Agregar acciones personalizadas aqui
        // AddAction(ActionReadJournal);
    }

    override void OnInventoryEnter(Man player)
    {
        super.OnInventoryEnter(player);
        Print("[MyFirstMod] Player picked up the Field Journal!");
    }

    override void OnInventoryExit(Man player)
    {
        super.OnInventoryExit(player);
        Print("[MyFirstMod] Player dropped the Field Journal.");
    }
};
```

---

## Referencia Completa de Archivos

### Estructura Final de Directorios

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_FieldJournal.c
        5_Mission/
            MyFirstMod/
                MissionHello.c
    Data/
        config.cpp
        Stringtable.csv
        Textures/
            field_journal_co.paa
```

### MyFirstMod/mod.cpp

```cpp
name = "My First Mod";
author = "YourName";
version = "1.1";
overview = "My first DayZ mod with a custom item: the Field Journal.";
```

### MyFirstMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "World", "Mission" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### MyFirstMod/Data/config.cpp

```cpp
class CfgPatches
{
    class MyFirstMod_Data
    {
        units[] = { "MFM_FieldJournal" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Characters"
        };
    };
};

class CfgVehicles
{
    class Inventory_Base;

    class MFM_FieldJournal : Inventory_Base
    {
        scope = 2;
        displayName = "$STR_MFM_FieldJournal";
        descriptionShort = "$STR_MFM_FieldJournal_Desc";
        model = "\DZ\characters\accessories\data\Notebook\Notebook.p3d";
        rotationFlags = 17;
        weight = 200;
        itemSize[] = { 1, 2 };
        absorbency = 0.5;

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 100;
                    healthLevels[] =
                    {
                        { 1.0, {} },
                        { 0.7, {} },
                        { 0.5, {} },
                        { 0.3, {} },
                        { 0.0, {} }
                    };
                };
            };
        };

        hiddenSelections[] = { "camoGround" };
        hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
    };
};
```

### MyFirstMod/Data/Stringtable.csv

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MFM_FieldJournal","Field Journal","","","","","","","","","","","","",""
"STR_MFM_FieldJournal_Desc","A weathered leather journal used to record field notes and observations.","","","","","","","","","","","","",""
```

### Entrada de types.xml (Carpeta de Mision del Servidor)

```xml
<type name="MFM_FieldJournal">
    <nominal>10</nominal>
    <lifetime>14400</lifetime>
    <restock>1800</restock>
    <min>5</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="tools" />
    <usage name="Town" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
</type>
```

---

## Solucion de Problemas

### El Item No Aparece Al Spawnearlo Via Consola de Script

- **Desajuste de nombre de clase:** El nombre en el comando de spawn debe coincidir exactamente con el nombre de clase de tu config.cpp: `"MFM_FieldJournal"` (distingue mayusculas).
- **config.cpp no cargado:** Verifica que tu PBO de Data esta empaquetado y cargado, o que el file patching esta activo.
- **Falta CfgPatches:** Todo config.cpp debe tener un bloque `CfgPatches` valido.

### El Nombre del Item Se Muestra como `$STR_MFM_FieldJournal` (Referencia de String Cruda)

- **Stringtable no encontrada:** Asegurate de que `Stringtable.csv` esta en el mismo PBO que la config que la referencia, o en la raiz del mod.
- **Nombre de clave incorrecto:** La clave en el CSV debe coincidir exactamente (sin el prefijo `$`): `"STR_MFM_FieldJournal"`.
- **Error de formato CSV:** Asegurate de que todos los valores esten entre comillas dobles y que la fila de encabezado sea correcta.

### El Item Aparece Todo Blanco, Rosa o Invisible

- **Ruta de textura incorrecta:** Verifica que `hiddenSelectionsTextures[]` apunte al archivo `.paa` correcto. Las rutas usan barras invertidas en config.cpp.
- **Nombre de hidden selection incorrecto:** El nombre de la selection debe coincidir con lo que el modelo define. Verifica usando Object Builder.
- **Textura no esta en el PBO:** Si usas PBOs empaquetados, el archivo de textura debe estar dentro del PBO.

### El Item No Puede Ser Recogido

- **`scope` no establecido en 2:** Asegurate de que `scope = 2;` este en tu clase de item.
- **`itemSize` demasiado grande:** Si el tamano del item excede el espacio de inventario del jugador, no pueden recogerlo.
- **Clase padre incorrecta:** Asegurate de estar heredando de `Inventory_Base` u otro padre de item valido.

### El Item Spawnea Pero Tiene Tamano Incorrecto en el Inventario

- **`itemSize[]`:** Los valores son `{ columnas, filas }`. `{ 1, 2 }` significa 1 de ancho y 2 de alto. `{ 2, 3 }` significa 2 de ancho y 3 de alto.

---

## Siguientes Pasos

1. **[Capitulo 8.3: Construir un Modulo de Panel de Admin](03-admin-panel.md)** -- Crear un panel de UI con comunicacion servidor-cliente.
2. **Agregar variantes** -- Crea variantes de color de tu item usando diferentes texturas de hidden selection.
3. **Agregar recetas de crafteo** -- Define combinaciones de crafteo en config.cpp usando `CfgRecipes`.
4. **Crear ropa** -- Extiende `Clothing_Base` en lugar de `Inventory_Base` para items usables.
5. **Construir un arma** -- Extiende `Weapon_Base` para armas de fuego con accesorios y animaciones.

---

**Anterior:** [Capitulo 8.1: Tu Primer Mod (Hello World)](01-first-mod.md)
**Siguiente:** [Capitulo 8.3: Construir un Modulo de Panel de Admin](03-admin-panel.md)
