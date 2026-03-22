# Capítulo 6.19: Consultas de Terreno e Mundo

[Início](../README.md) | [<< Anterior: Sistema de Animação](18-animation-system.md) | **Consultas de Terreno e Mundo** | [Próximo: Sistema de Partículas e Efeitos >>](20-particle-effects.md)

---

## Introdução

Toda operação espacial no DayZ --- gerar objetos no chão, verificar linha de visão, detectar entidades próximas, determinar o tipo de superfície para sons de passos --- depende de consultar o mundo. O motor expõe três categorias de API espacial: **consultas de terreno** (altura, tipo de superfície, normais), **consultas de objetos** (encontrar entidades perto de uma posição) e **raycasting** (traçar uma linha através do mundo para detectar colisões). Este capítulo documenta cada método disponível, sua assinatura exata e os padrões práticos encontrados no código vanilla.

Todas as funções de terreno e superfície residem na classe `CGame`, acessada via `GetGame()` ou o global `g_Game`. Raycasting é fornecido pela classe estática `DayZPhysics`. Estado do mundo (hora, data, coordenadas) é acessado através do objeto `World` retornado por `GetGame().GetWorld()`.

---

## Consultas de Altura do Terreno

### SurfaceY --- Altura do Chão em X,Z

A consulta de terreno mais comumente usada. Retorna a coordenada Y (vertical) do terreno em uma posição X,Z dada. Isso ignora objetos, estradas e água --- retorna apenas a altura bruta do terreno.

```c
// Assinatura (CGame)
proto native float SurfaceY(float x, float z);
```

**Uso:**

```c
// Obter altura do terreno em uma posição do mundo
float groundY = GetGame().SurfaceY(x, z);

// Ajustar uma posição para o chão
vector pos = "100 0 200";
pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

// Padrão comum: ajuste de posição de spawn
vector spawnPos = somePosition;
spawnPos[1] = GetGame().SurfaceY(spawnPos[0], spawnPos[2]);
```

**Exemplo vanilla** (`effectarea.c`):

```c
partPos[1] = g_Game.SurfaceY(partPos[0], partPos[2]); // Ajustar partículas ao chão
```

### SurfaceRoadY --- Altura Incluindo Estradas

Retorna a altura incluindo superfícies de estrada (pontes, estradas elevadas). Use quando precisar da superfície real transitável, não do terreno bruto.

```c
// Assinaturas (CGame)
proto native float SurfaceRoadY(float x, float z, RoadSurfaceDetection rsd = RoadSurfaceDetection.LEGACY);
proto native float SurfaceRoadY3D(float x, float y, float z, RoadSurfaceDetection rsd);
```

O enum `RoadSurfaceDetection` controla a direção da busca:

```c
enum RoadSurfaceDetection
{
    UNDER,    // Encontrar superfície mais próxima abaixo do ponto dado
    ABOVE,    // Encontrar superfície mais próxima acima do ponto dado
    CLOSEST,  // Encontrar superfície mais próxima ao ponto dado
    LEGACY,   // UNDER mas sem suporte a proxy (padrão)
}
```

### GetSurface --- API Moderna de Detecção de Superfície

A API mais recente e flexível de detecção de superfície que combina altura, normal e tipo de superfície em uma única chamada.

```c
// Assinatura (CGame)
proto native bool GetSurface(SurfaceDetectionParameters params, SurfaceDetectionResult result);
```

**Classe de parâmetros:**

```c
class SurfaceDetectionParameters
{
    SurfaceDetectionType type = SurfaceDetectionType.Scenery; // Scenery ou Roadway
    vector position;                                          // posição 3D para traçar
    bool includeWater = false;                                // Retornar água se estiver mais alta que a superfície
    UseObjectsMode syncMode = UseObjectsMode.Wait;            // Wait, NoWait ou NoLock
    Object ignore = null;                                     // Objeto a ignorar (apenas Roadway)
    RoadSurfaceDetection rsd = RoadSurfaceDetection.ABOVE;    // Direção de busca (apenas Roadway)
};
```

**Classe de resultado:**

```c
class SurfaceDetectionResult
{
    float height = 0;          // posição Y da superfície detectada
    float normalX = 0;         // componente X da normal da superfície
    float normalZ = 0;         // componente Z da normal da superfície
    SurfaceInfo surface = null; // handle de info do material da superfície
    bool aboveWater = false;   // Se a água foi a superfície retornada
};
```

**Exemplo vanilla** (`transport.c`):

```c
VehicleFlippedContext ctx;
ctx.m_SurfaceParams = new SurfaceDetectionParameters();
ctx.m_SurfaceResult = new SurfaceDetectionResult();
ctx.m_SurfaceParams.rsd = RoadSurfaceDetection.CLOSEST;
ctx.m_SurfaceParams.position = corners[i];
g_Game.GetSurface(ctx.m_SurfaceParams, ctx.m_SurfaceResult);
```

### GetHighestSurfaceYDifference

Método utilitário em `CGame` que retorna a maior diferença de altura entre um conjunto de posições. Útil para verificações de inclinação.

```c
float GetHighestSurfaceYDifference(array<vector> positions);
```

---

## Consultas de Tipo de Superfície

### SurfaceGetType --- Material na Posição

Retorna o nome do material da superfície em uma coordenada X,Z dada. O valor de retorno é a posição Y onde a superfície foi encontrada.

```c
// Assinaturas (CGame)
proto float SurfaceGetType(float x, float z, out string type);
proto float SurfaceGetType3D(float x, float y, float z, out string type);
```

**Uso:**

```c
string surfaceType;
GetGame().SurfaceGetType(x, z, surfaceType);
// surfaceType agora é ex.: "cp_gravel", "cp_concrete", "cp_grass",
//   "cp_dirt", "cp_broadleaf_dense1", "cp_asphalt", etc.
```

**Exemplo vanilla** (`carscript.c`):

```c
string surface;
g_Game.SurfaceGetType(wheelPos[0], wheelPos[2], surface);
```

A variante `3D` traça para baixo a partir da posição Y dada, útil quando você quer detectar a superfície sob uma altura específica (por exemplo, sob uma ponte):

```c
// Detectar superfície em posição 3D exata
string surfaceType;
g_Game.SurfaceGetType3D(pos[0], pos[1], pos[2], surfaceType);
```

### SurfaceUnderObject --- Material Sob uma Entidade

Retorna o tipo de superfície e tipo de líquido diretamente sob um objeto específico.

```c
// Assinaturas (CGame)
proto void SurfaceUnderObject(notnull Object object, out string type, out int liquidType);
proto void SurfaceUnderObjectEx(notnull Object object, out string type, out string impact, out int liquidType);
proto void SurfaceUnderObjectByBone(notnull Object object, int boneType, out string type, out int liquidType);
```

Também existem variantes `CorrectedLiquid` que normalizam os valores de tipo de líquido:

```c
void SurfaceUnderObjectCorrectedLiquid(notnull Object object, out string type, out int liquidType);
void SurfaceUnderObjectExCorrectedLiquid(notnull Object object, out string type, out string impact, out int liquidType);
void SurfaceUnderObjectByBoneCorrectedLiquid(notnull Object object, int boneType, out string type, out int liquidType);
```

### Normal da Superfície --- Direção da Inclinação

Retorna o vetor normal da superfície do terreno, apontando para longe do chão. Essencial para alinhar objetos em encostas.

```c
// Assinatura (CGame)
proto native vector SurfaceGetNormal(float x, float z);
```

**Uso:**

```c
vector normal = GetGame().SurfaceGetNormal(x, z);
// normal é aproximadamente "0 1 0" em terreno plano
// Em uma encosta, os componentes X e Z indicam a direção da inclinação
```

**Exemplo vanilla** (`hologram.c` --- posicionamento de construção):

```c
normal = g_Game.SurfaceGetNormal(projection_position[0], projection_position[2]);
vector angles = normal.VectorToAngles();
angles[1] = angles[1] + 270; // Corrigir rotação para alinhamento vertical
```

### GetSurfaceOrientation --- Inclinação como Ângulos

Um método de conveniência em `CGame` que converte a normal da superfície para ângulos de Euler, prontos para `SetOrientation()`.

```c
vector GetSurfaceOrientation(float x, float z)
{
    vector normal = g_Game.SurfaceGetNormal(x, z);
    vector angles = normal.VectorToAngles();
    angles[1] = angles[1] + 270;
    return angles;
}
```

### SurfaceGetNoiseMultiplier

Retorna um multiplicador de ruído para uma superfície em uma posição dada, usado pelo sistema de furtividade/som.

```c
proto native float SurfaceGetNoiseMultiplier(Object directHit, vector pos, int componentIndex);
```

---

## Consultas de Água

### Detecção de Mar e Lago

```c
// Assinaturas (CGame)
proto native bool SurfaceIsSea(float x, float z);    // True se a posição está sobre o mar
proto native bool SurfaceIsPond(float x, float z);    // True se a posição está sobre um lago/lagoa
```

Não existe uma função `SurfaceIsWater` única no motor. Para verificar qualquer água, combine ambas:

```c
bool IsOverWater(float x, float z)
{
    return GetGame().SurfaceIsSea(x, z) || GetGame().SurfaceIsPond(x, z);
}
```

### Nível do Mar e Dados de Ondas

```c
// Assinaturas (CGame)
proto native float SurfaceGetSeaLevel();        // Nível atual do mar
proto native float SurfaceGetSeaLevelMin();     // Nível mínimo do mar
proto native float SurfaceGetSeaLevelMax();     // Nível máximo do mar
proto native float SurfaceGetSeaWaveMax();      // Altura máxima da onda do mar
proto native float SurfaceGetSeaWaveCurrent();  // Altura atual da onda do mar
```

### Profundidade da Água

```c
// Assinatura (CGame)
proto native float GetWaterDepth(vector posWS);
```

Retorna a profundidade da água em uma posição no espaço mundo. Retorna 0 ou negativo se a posição estiver acima da água.

### Altura da Superfície da Água

```c
proto native float GetWaterSurfaceHeightNoFakeWave(vector posWS); // Sem deslocamento visual de onda
proto native float GetWaterSurfaceHeight(vector posWS);           // Com deslocamento visual de onda
```

---

## Consultas de Objetos

### GetObjectsAtPosition --- Busca por Cilindro

Encontra todos os objetos dentro de um raio horizontal de uma posição. A busca é um cilindro vertical (altura infinita), o que significa que objetos acima e abaixo da posição são incluídos independentemente da distância vertical.

```c
// Assinaturas (CGame)
proto native void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargos);
proto native void GetObjectsAtPosition3D(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargos);
```

A variante `3D` busca em uma esfera em vez de cilindro, respeitando a distância vertical.

**Uso:**

```c
array<Object> objects = new array<Object>();
array<CargoBase> proxyCargo = new array<CargoBase>();
GetGame().GetObjectsAtPosition(position, radius, objects, proxyCargo);

// proxyCargo pode ser null se você não precisa de info de cargo
GetGame().GetObjectsAtPosition(position, radius, objects, null);
```

**Exemplos vanilla:**

```c
// GeyserArea --- matar entidades na área
array<Object> nearestObjects = new array<Object>();
g_Game.GetObjectsAtPosition(m_Position, m_Radius, nearestObjects, null);
foreach (Object obj : nearestObjects)
{
    // processar objetos...
}

// Sistema de caça de bots --- encontrar alvo mais próximo dentro de 100m
array<Object> objects = new array<Object>;
array<CargoBase> proxyCargos = new array<CargoBase>;
g_Game.GetObjectsAtPosition(pos, 100.0, objects, proxyCargos);
```

> **AVISO: Performance.** `GetObjectsAtPosition` consulta todos os objetos no alcance. Um raio de 100m em uma área populada pode retornar centenas ou milhares de objetos. Sempre:
> - Use o menor raio que atenda seu propósito
> - Faça cache dos resultados; não chame a cada frame
> - Filtre os resultados imediatamente e descarte o array
> - Prefira a variante `3D` quando filtragem vertical importar

---

## Raycasting --- DayZPhysics

Raycasting traça uma linha (ou linha grossa) através do mundo e reporta o que atingiu. DayZ fornece vários métodos de raycast na classe estática `DayZPhysics`, cada um adequado para diferentes casos de uso.

### Modos ObjIntersect

Todo raycast deve especificar qual geometria testar. Estes são definidos em `3_game/constants.c`:

```c
enum ObjIntersect
{
    Fire,   // ObjIntersectFire(0):  Geometria de Fogo (colisão de balas)
    View,   // ObjIntersectView(1):  Geometria de Visão (visual/renderização)
    Geom,   // ObjIntersectGeom(2):  Geometria (colisão física)
    IFire,  // ObjIntersectIFire(3): Geometria de Fogo Indireto
    None    // ObjIntersectNone(4):  Sem teste de geometria
}
```

| Modo | Caso de Uso |
|------|----------|
| `ObjIntersectFire` | Colisão de balas, rastreamento de dano |
| `ObjIntersectView` | Verificações de obstrução visual, direcionamento de ações |
| `ObjIntersectGeom` | Colisão física, validação de posicionamento |
| `ObjIntersectIFire` | Geometria de fogo indireto (rangefinder, item raycaster) |
| `ObjIntersectNone` | Raycasts apenas no chão |

### CollisionFlags

Controla o que o raycast reporta. Definido em `1_core/proto/endebug.c`:

```c
enum CollisionFlags
{
    FIRSTCONTACT,   // Parar no primeiro acerto (qualquer), mais rápido
    NEARESTCONTACT, // Retornar apenas o contato mais próximo (padrão)
    ONLYSTATIC,     // Apenas objetos estáticos/terreno
    ONLYDYNAMIC,    // Apenas objetos dinâmicos (jogadores, itens, veículos)
    ONLYWATER,      // Apenas componentes de água
    ALLOBJECTS,     // Retornar primeiro contato para CADA objeto atingido
}
```

### PhxInteractionLayers

Define quais camadas de física participam em raycasts tipo bala. Definido em `3_game/global/dayzphysics.c`:

```c
enum PhxInteractionLayers
{
    NOCOLLISION,
    DEFAULT,
    BUILDING,
    CHARACTER,
    VEHICLE,
    DYNAMICITEM,
    DYNAMICITEM_NOCHAR,
    ROADWAY,
    VEHICLE_NOTERRAIN,
    CHARACTER_NO_GRAVITY,
    RAGDOLL_NO_CHARACTER,
    FIREGEOM,       // Redefinição de RAGDOLL_NO_CHARACTER
    DOOR,
    RAGDOLL,
    WATERLAYER,
    TERRAIN,
    GHOST,
    WORLDBOUNDS,
    FENCE,
    AI,
    AI_NO_COLLISION,
    AI_COMPLEX,
    TINYCAPSULE,
    TRIGGER,
    TRIGGER_NOTERRAIN,
    ITEM_SMALL,
    ITEM_LARGE,
    CAMERA,
    TEMP
};
```

Camadas são combinadas com OR bit-a-bit para `RayCastBullet` e métodos relacionados:

```c
PhxInteractionLayers hitMask = PhxInteractionLayers.BUILDING
    | PhxInteractionLayers.DOOR
    | PhxInteractionLayers.VEHICLE
    | PhxInteractionLayers.ROADWAY
    | PhxInteractionLayers.TERRAIN;
```

---

### RaycastRV --- Raycast Simples

A função de raycast mais comumente usada. Traça uma linha e retorna o primeiro (ou mais próximo) acerto.

```c
// Assinatura (DayZPhysics)
proto static bool RaycastRV(
    vector begPos,
    vector endPos,
    out vector contactPos,
    out vector contactDir,
    out int contactComponent,
    set<Object> results = NULL,
    Object with = NULL,
    Object ignore = NULL,
    bool sorted = false,
    bool ground_only = false,
    int iType = ObjIntersectView,
    float radius = 0.0,
    CollisionFlags flags = CollisionFlags.NEARESTCONTACT
);
```

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-------------|
| `begPos` | `vector` | Posição inicial do raio |
| `endPos` | `vector` | Posição final do raio |
| `contactPos` | `out vector` | Posição do mundo do primeiro contato |
| `contactDir` | `out vector` | Direção normal no ponto de contato |
| `contactComponent` | `out int` | Índice do componente atingido no objeto |
| `results` | `set<Object>` | Conjunto de todos os objetos atingidos (pode ser NULL) |
| `with` | `Object` | Ignorar colisões com este objeto |
| `ignore` | `Object` | Ignorar colisões com este objeto |
| `sorted` | `bool` | Ordenar resultados por distância (apenas se `ground_only = false`) |
| `ground_only` | `bool` | Testar apenas contra o chão, ignorar todos os objetos |
| `iType` | `int` | Modo de interseção (`ObjIntersectView`, etc.) |
| `radius` | `float` | Raio do raio (0 = linha, >0 = raio grosso) |
| `flags` | `CollisionFlags` | O que reportar |

**Retorna:** `true` se o raio atingiu algo.

**Exemplo vanilla** (rangefinder --- medir distância):

```c
vector from = g_Game.GetCurrentCameraPosition();
vector fromDirection = g_Game.GetCurrentCameraDirection();
vector to = from + (fromDirection * RANGEFINDER_MAX_DISTANCE);
vector contact_pos;
vector contact_dir;
int contactComponent;

bool hit = DayZPhysics.RaycastRV(
    from, to,
    contact_pos, contact_dir, contactComponent,
    NULL, NULL, player,
    false, false,
    ObjIntersectIFire
);

if (hit)
{
    float distance = vector.Distance(from, contact_pos);
}
```

**Exemplo vanilla** (item raycaster --- feixe visual):

```c
bool is_collision = DayZPhysics.RaycastRV(
    from, to,
    contact_pos, contact_dir, contactComponent,
    NULL, NULL, GetHierarchyRootPlayer(),
    false, false,
    ObjIntersectIFire
);
```

---

### RaycastRVProxy --- Raycast Estruturado

A versão estruturada de raycasting que retorna resultados detalhados incluindo objetos proxy (itens anexados, partes de veículos), níveis de hierarquia e informações de superfície. Preferido para consultas complexas como direcionamento de ações.

```c
// Assinatura (DayZPhysics)
proto static bool RaycastRVProxy(
    notnull RaycastRVParams in,
    out notnull array<ref RaycastRVResult> results,
    array<Object> excluded = null
);
```

**RaycastRVParams** (entrada):

```c
class RaycastRVParams
{
    vector begPos;          // Posição inicial
    vector endPos;          // Posição final
    Object ignore;          // Ignorar este objeto
    Object with;            // Ignorar colisões com este objeto
    float radius;           // Grossura do raio (0 = linha)
    CollisionFlags flags;   // Padrão: NEARESTCONTACT
    int type;               // Padrão: ObjIntersectView
    bool sorted;            // Padrão: false
    bool groundOnly;        // Padrão: false

    void RaycastRVParams(vector vBeg, vector vEnd, Object pIgnore = null, float fRadius = 0.0)
    {
        begPos = vBeg;
        endPos = vEnd;
        ignore = pIgnore;
        radius = fRadius;
        with       = null;
        flags      = CollisionFlags.NEARESTCONTACT;
        type       = ObjIntersectView;
        sorted     = false;
        groundOnly = false;
    }
};
```

**RaycastRVResult** (saída --- um por acerto):

```c
class RaycastRVResult
{
    Object obj;        // Objeto atingido (NULL se apenas terreno). Se hierLevel > 0, este é o proxy
    Object parent;     // Se hierLevel > 0, o pai raiz do proxy
    vector pos;        // Posição do mundo da colisão
    vector dir;        // Direção normal na colisão (ou direção de interseção)
    int hierLevel;     // 0 = paisagem/objeto do mundo, > 0 = proxy (anexo, componente)
    int component;     // Índice do componente no nível de geometria
    SurfaceInfo surface; // Handle de info do material da superfície
    bool entry;        // false se o ponto inicial estava dentro do objeto
    bool exit;         // false se o ponto final estava dentro do objeto
};
```

**Exemplo vanilla** (direcionamento de ação --- encontrar para o que o jogador está olhando):

```c
RaycastRVParams rayInput = new RaycastRVParams(m_RayStart, m_RayEnd, m_Player);
rayInput.flags = CollisionFlags.ALLOBJECTS;
array<ref RaycastRVResult> results = new array<ref RaycastRVResult>;

if (DayZPhysics.RaycastRVProxy(rayInput, results))
{
    for (int i = 0; i < results.Count(); i++)
    {
        float distance = vector.DistanceSq(results[i].pos, m_RayStart);
        Object cursorTarget = results[i].obj;

        // Verificar se o acerto é um proxy (anexo em outro objeto)
        if (results[i].hierLevel > 0)
        {
            // results[i].parent é o objeto raiz
        }
    }
}
```

**Exemplo vanilla** (flashbang --- verificação de linha de visão com exclusões):

```c
array<Object> excluded = new array<Object>;
excluded.Insert(this); // Ignorar a própria granada
array<ref RaycastRVResult> results = new array<ref RaycastRVResult>;

RaycastRVParams rayParams = new RaycastRVParams(pos, headPos, excluded[0]);
rayParams.flags = CollisionFlags.ALLOBJECTS;
DayZPhysics.RaycastRVProxy(rayParams, results, excluded);
```

---

### RayCastBullet e SphereCastBullet --- Raycasts de Camada Física

Esses usam o sistema de camadas de interação física em vez de modos de interseção geométrica. São mais apropriados para simulação de trajetória de balas e consultas com consciência física.

```c
// Assinaturas (DayZPhysics)
proto static bool RayCastBullet(
    vector begPos, vector endPos,
    PhxInteractionLayers layerMask,
    Object ignoreObj,
    out Object hitObject,
    out vector hitPosition,
    out vector hitNormal,
    out float hitFraction
);

proto static bool SphereCastBullet(
    vector begPos, vector endPos,
    float radius,
    PhxInteractionLayers layerMask,
    Object ignoreObj,
    out Object hitObject,
    out vector hitPosition,
    out vector hitNormal,
    out float hitFraction
);
```

A saída `hitFraction` é um valor de 0.0 a 1.0 indicando onde ao longo do raio o acerto ocorreu (0 = no início, 1 = no fim).

**Exemplo vanilla** (teleporte de desenvolvedor):

```c
PhxInteractionLayers layers = 0;
layers |= PhxInteractionLayers.TERRAIN;
layers |= PhxInteractionLayers.BUILDING;
layers |= PhxInteractionLayers.VEHICLE;
layers |= PhxInteractionLayers.RAGDOLL;

Object hitObj;
vector hitPos, hitNormal;
float hitFraction;

if (DayZPhysics.SphereCastBullet(rayStart, rayEnd, 0.01, layers, ignore, hitObj, hitPos, hitNormal, hitFraction))
{
    // hitPos contém a posição do mundo do acerto
}
```

**Exemplo vanilla** (debug de temperatura alvo --- encontrar entidade sob o cursor):

```c
PhxInteractionLayers hitMask = PhxInteractionLayers.BUILDING
    | PhxInteractionLayers.DOOR
    | PhxInteractionLayers.VEHICLE
    | PhxInteractionLayers.ROADWAY
    | PhxInteractionLayers.TERRAIN
    | PhxInteractionLayers.CHARACTER
    | PhxInteractionLayers.AI
    | PhxInteractionLayers.RAGDOLL
    | PhxInteractionLayers.RAGDOLL_NO_CHARACTER;
DayZPhysics.RayCastBullet(from, to, hitMask, player, obj, hitPos, hitNormal, hitFraction);
```

---

### Consultas de Sobreposição --- Testes de Interseção de Volume

`DayZPhysics` também fornece testes de sobreposição que verificam se um volume intersecta quaisquer objetos de física. Todos usam o sistema de camadas de física bullet e retornam resultados através de um callback.

```c
// Assinaturas (DayZPhysics)
proto static bool SphereOverlapBullet(vector position, float radius, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool CylinderOverlapBullet(vector transform[4], vector extents, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool CapsuleOverlapBullet(vector transform[4], float radius, float height, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool BoxOverlapBullet(vector transform[4], vector extents, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool EntityOverlapBullet(vector transform[4], IEntity entity, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool EntityOverlapSingleBullet(vector transform[4], IEntity entity, IEntity other, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool GeometryOverlapBullet(vector transform[4], dGeom geometry, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
```

**Classe de callback:**

```c
class CollisionOverlapCallback : Managed
{
    bool OnContact(IEntity other, Contact contact)
    {
        return true; // Retorne true para continuar verificando, false para parar
    }
};
```

**Uso:**

```c
class MyOverlapCallback : CollisionOverlapCallback
{
    ref array<IEntity> m_Hits = new array<IEntity>();

    override bool OnContact(IEntity other, Contact contact)
    {
        m_Hits.Insert(other);
        return true; // Continuar verificando
    }
};

MyOverlapCallback callback = new MyOverlapCallback();
DayZPhysics.SphereOverlapBullet(position, 5.0, PhxInteractionLayers.CHARACTER, callback);

foreach (IEntity hit : callback.m_Hits)
{
    // Processar cada entidade na esfera
}
```

---

### GetHitSurface --- Superfície no Acerto do Raycast

Verifica se um tipo de superfície específico foi atingido entre dois pontos em um objeto.

```c
// Assinaturas (DayZPhysics)
proto static bool GetHitSurface(Object other, vector begPos, vector endPos, string surface);
proto static bool GetHitSurfaceAndLiquid(Object other, vector begPos, vector endPos, string surface, out int liquidType);
```

---

## Utilitários de Distância e Posição

### vector.Distance e vector.DistanceSq

```c
// Distância exata entre dois pontos
float dist = vector.Distance(posA, posB);

// Distância ao quadrado --- MUITO mais rápido, use para comparações
float distSq = vector.DistanceSq(posA, posB);
```

**Sempre prefira `DistanceSq` para comparações de distância.** Isso evita a cara operação de raiz quadrada:

```c
// BOM: comparar distâncias ao quadrado
float maxRangeSq = maxRange * maxRange;
if (vector.DistanceSq(myPos, targetPos) < maxRangeSq)
{
    // Dentro do alcance
}

// RUIM: calculando raiz quadrada a cada verificação
if (vector.Distance(myPos, targetPos) < maxRange)
{
    // Funciona mas é mais lento
}
```

### Vetores de Direção

```c
// Obter direção de A para B (normalizada)
vector dir = targetPos - myPos;
dir.Normalize();

// Obter direção que o jogador está encarando
vector playerDir = player.GetDirection();

// Converter ângulos para vetor de direção
vector dir = orientation.AnglesToVector();

// Converter direção para ângulos
vector angles = direction.VectorToAngles();
```

### Aritmética de Posição

```c
// Deslocar uma posição ao longo de uma direção
vector newPos = origin + (direction * distance);

// Obter uma posição no nível dos olhos
vector eyePos = player.GetPosition() + "0 1.5 0";

// Acesso a componentes de vetor
float x = pos[0];
float y = pos[1];
float z = pos[2];

// Criar vetor a partir de componentes
vector v = Vector(x, y, z);
```

---

## Consultas de Mundo

O objeto `World` fornece acesso a hora, data, coordenadas geográficas e outros estados globais do mundo.

```c
World world = GetGame().GetWorld();
```

### Data e Hora

```c
// Obter data e hora atual no jogo
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);

// Definir data e hora no jogo (apenas servidor)
GetGame().GetWorld().SetDate(2024, 6, 15, 14, 30);

// Obter tempo do mundo em milissegundos (desde o início do mundo)
float worldTimeMs = GetWorldTime(); // Função global de 1_Core
```

### Dia/Noite e Celestial

```c
// Verificar se é atualmente noite
bool nighttime = GetGame().GetWorld().IsNight();

// Obter estado sol/lua (0 = sol pleno, 1 = lua plena)
float sunOrMoon = GetGame().GetWorld().GetSunOrMoon();

// Brilho da lua
float moonIntensity = GetGame().GetWorld().GetMoonIntensity();
```

### Coordenadas Geográficas

```c
// Obter latitude e longitude do mapa (afeta posição do sol, comportamento sazonal)
float lat = GetGame().GetWorld().GetLatitude();
float lon = GetGame().GetWorld().GetLongitude();
```

### Tamanho e Grade do Mundo

```c
// Obter tamanho do mundo em metros (ex.: 15360 para Chernarus)
int worldSize = GetGame().GetWorld().GetWorldSize();

// Converter posição do mundo para coordenadas de grade
int gridX, gridZ;
GetGame().GetWorld().GetGridCoords(player.GetPosition(), 100, gridX, gridZ);
```

### Nome do Mundo

```c
// Obter o nome do mundo atualmente carregado
string worldName;
GetGame().GetWorldName(worldName);
// Retorna: "chernarusplus", "enoch" (Livonia), etc.
```

---

## WorldData --- Configuração de Ambiente

A classe `WorldData` contém a configuração ambiental para o mapa atual: curvas de temperatura, horários de nascer/pôr do sol, configurações de clima. Ela é subclassificada por mapa (ex.: `ChernarusPlusData`, `EnochData`).

```c
// Acessar WorldData atual (disponível apenas em 4_World e acima)
WorldData worldData = g_Game.GetWorldData(); // se disponível
```

Propriedades-chave incluem temperaturas mínimas/máximas mensais, horários de nascer/pôr do sol e configurações de probabilidade de clima. Estas são definidas no método `Init()` por mapa:

```c
m_Sunrise_Jan = 8.54;
m_Sunset_Jan = 15.52;
m_Sunrise_Jul = 3.26;
m_Sunset_Jul = 20.73;
m_MaxTemps = {3,5,7,14,19,24,26,25,21,16,10,5};
m_MinTemps = {-3,-2,0,4,9,14,18,17,12,7,4,0};
```

---

## Exemplos Práticos

### Gerar um Objeto no Chão

```c
void SpawnOnGround(string className, vector pos)
{
    // Ajustar Y para o terreno
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

    Object obj = GetGame().CreateObjectEx(className, pos, ECE_CREATEPHYSICS | ECE_UPDATEPATHGRAPH);
}
```

### Verificar Linha de Visão Entre Dois Pontos

```c
bool HasLineOfSight(vector from, vector to, Object ignoreObj)
{
    vector contactPos;
    vector contactDir;
    int contactComponent;

    bool hit = DayZPhysics.RaycastRV(
        from, to,
        contactPos, contactDir, contactComponent,
        NULL, NULL, ignoreObj,
        false, false,
        ObjIntersectView
    );

    // Se nada foi atingido, há linha de visão livre
    return !hit;
}
```

### Encontrar Construção Mais Próxima

```c
Object FindNearestBuilding(vector pos, float searchRadius)
{
    array<Object> objects = new array<Object>();
    GetGame().GetObjectsAtPosition(pos, searchRadius, objects, null);

    Object nearest = null;
    float nearestDistSq = float.MAX;

    foreach (Object obj : objects)
    {
        if (!obj.IsBuilding())
            continue;

        float distSq = vector.DistanceSq(pos, obj.GetPosition());
        if (distSq < nearestDistSq)
        {
            nearestDistSq = distSq;
            nearest = obj;
        }
    }

    return nearest;
}
```

### Verificar se a Posição está em Ambiente Interno

Uma técnica comum é fazer raycast direto para cima. Se algo está acima de você dentro de uma distância razoável, você provavelmente está em ambiente interno.

```c
bool IsIndoors(vector pos)
{
    vector from = pos + "0 0.5 0";   // Ligeiramente acima do chão
    vector to = pos + "0 20.0 0";    // 20m direto para cima
    vector contactPos, contactDir;
    int contactComponent;

    return DayZPhysics.RaycastRV(
        from, to,
        contactPos, contactDir, contactComponent,
        NULL, NULL, null,
        false, false,
        ObjIntersectGeom
    );
}
```

### Verificação de Inclinação do Terreno para Posicionamento

```c
bool IsSlopeTooSteep(vector pos, float maxSlopeDegrees)
{
    vector normal = GetGame().SurfaceGetNormal(pos[0], pos[2]);

    // O componente Y da normal indica quão vertical é a superfície
    // Y = 1.0 significa perfeitamente plano, Y = 0.0 significa parede vertical
    float slopeAngle = Math.Acos(normal[1]) * Math.RAD2DEG;

    return slopeAngle > maxSlopeDegrees;
}
```

### Verificar se a Posição está Sobre Água

```c
bool IsOverWater(vector pos)
{
    float x = pos[0];
    float z = pos[2];

    if (GetGame().SurfaceIsSea(x, z))
        return true;

    if (GetGame().SurfaceIsPond(x, z))
        return true;

    return false;
}
```

### Verificação de Obstrução (Padrão Vanilla)

A classe vanilla `MiscGameplayFunctions` fornece verificações de obstrução prontas que combinam `RaycastRVProxy` e `RaycastRV`:

```c
// Verificação simples de obstrução
bool obstructed = MiscGameplayFunctions.IsObjectObstructed(targetObject);

// Com verificação de distância
bool obstructed = MiscGameplayFunctions.IsObjectObstructed(
    targetObject,
    true,            // doDistanceCheck
    playerPos,       // distanceCheckPos
    5.0              // maxDist
);
```

### Máscara de Camadas para Alvo de Corpo-a-corpo

O sistema vanilla de corpo-a-corpo define uma máscara prática de camadas para verificações de obstrução. Esta é uma boa referência para quais camadas incluir:

```c
// De meleetargeting.c
const static PhxInteractionLayers MELEE_TARGET_OBSTRUCTION_LAYERS =
    PhxInteractionLayers.BUILDING
    | PhxInteractionLayers.DOOR
    | PhxInteractionLayers.VEHICLE
    | PhxInteractionLayers.ROADWAY
    | PhxInteractionLayers.TERRAIN
    | PhxInteractionLayers.ITEM_SMALL
    | PhxInteractionLayers.ITEM_LARGE
    | PhxInteractionLayers.FENCE;
```

---

## Boas Práticas

- **Use `DistanceSq` em vez de `Distance` para comparações.** A raiz quadrada em `Distance` é cara. Pré-compute `maxRange * maxRange` e compare com `DistanceSq`. O código vanilla faz isso extensivamente em direcionamento de ações e verificações de proximidade.
- **Mantenha o raio de `GetObjectsAtPosition` o menor possível.** Cada metro de raio aumenta dramaticamente o número de objetos retornados. Um raio de 100m em uma cidade pode retornar milhares de objetos. Faça cache dos resultados e reutilize-os dentro do mesmo frame.
- **Nunca faça raycast a cada frame sem limitação.** Mesmo `RaycastRV` é caro em escala. Use timers (intervalos de 0.1--0.5 segundos) para verificações periódicas. O rangefinder usa um timer de 0.5 segundos para suas medições.
- **Prefira `RaycastRVProxy` ao `RaycastRV` para consultas complexas.** A versão proxy retorna resultados estruturados com informações de hierarquia, dados de superfície e índices de componentes. É o que o sistema vanilla de ações usa para direcionamento por cursor.
- **Use `ground_only = true` quando precisar apenas da altura do terreno.** Isso pula todos os testes de interseção de objetos e é significativamente mais rápido que um raycast completo.
- **Combine `SurfaceIsSea` e `SurfaceIsPond` para verificações de água.** Não existe uma função `SurfaceIsWater` única. Sempre verifique ambas, a menos que precise especificamente distinguir entre mar e lagoa.

---

## Compatibilidade e Impacto

> **Compatibilidade de Mods:** Consultas de terreno e raycast são operações somente-leitura que não modificam o estado do mundo. Múltiplos mods podem chamar essas funções simultaneamente com segurança, sem conflitos.

- **Servidor/Cliente:** Todas as consultas de terreno (`SurfaceY`, `SurfaceGetType`, `SurfaceGetNormal`, `SurfaceIsSea`, `SurfaceIsPond`) são seguras para chamar tanto no servidor quanto no cliente. Métodos de modificação de mundo como `SetDate()` são autoritativos do servidor.
- **Impacto na Performance:** `GetObjectsAtPosition` com grandes raios é o erro de performance mais comum. Um mod que chama isso a cada frame com raio de 50m+ causará lag perceptível no servidor. Operações de raycast são mais baratas, mas ainda não devem ser executadas a cada frame em muitas entidades.
- **Dependência de Mapa:** `SurfaceGetType` retorna nomes de superfície diferentes dependendo do mapa. Chernarus e Livonia compartilham a maioria dos nomes de tipos de superfície (`cp_gravel`, `cp_concrete`, etc.), mas mapas customizados podem definir os seus próprios. Sempre trate tipos de superfície desconhecidos de forma elegante.
- **Subclassificação de WorldData:** Se seu mod precisa ler ou sobrescrever dados de temperatura ou clima, note que `WorldData` é subclassificada por mapa. Modificar a classe base afeta todos os mapas; modificar `ChernarusPlusData` afeta apenas Chernarus.

---

## Teoria vs Prática

| Documentação/Expectativa | Comportamento Real |
|--------------------------|-----------------|
| `SurfaceY` retorna altura do chão | Retorna altura bruta do terreno, ignorando estradas, pontes e objetos. Use `SurfaceRoadY` para superfícies que incluem estradas. |
| O parâmetro `ignore` de `RaycastRV` ignora um objeto | Ignora apenas um objeto. Para múltiplas exclusões, use `RaycastRVProxy` com o parâmetro de array `excluded`. |
| `GetObjectsAtPosition` retorna todos os objetos | Retorna objetos com corpos físicos. Objetos puramente visuais (partículas, efeitos) não são retornados. |
| `RaycastRVResult.obj` é sempre o objeto do mundo | Quando `hierLevel > 0`, `obj` é o proxy (anexo/componente) e `parent` é o objeto real do mundo. Sempre verifique `hierLevel`. |
| `CollisionFlags.ALLOBJECTS` retorna tudo | Retorna o primeiro contato por objeto, não todos os contatos por objeto. Múltiplos resultados vêm de múltiplos objetos distintos. |
| Nomes de tipos de superfície são padronizados | Nomes de superfície são valores de configuração dependentes do mapa de CfgSurfaces. Mapas customizados definem nomes de superfície customizados. |

---

## Erros Comuns

| Erro | Correção |
|---------|-----|
| Chamar `GetObjectsAtPosition` a cada frame com raio grande | Use um timer (intervalo de 0.25--1.0 segundo). Faça cache do array de resultados. |
| Usar `vector.Distance` em loop comparando muitos objetos | Use `vector.DistanceSq` e compare com `maxRange * maxRange`. |
| Ignorar o campo `hierLevel` em `RaycastRVResult` | Quando `hierLevel > 0`, o acerto está em um proxy. Use `parent` para obter a entidade real do mundo. |
| Usar `SurfaceY` para posicionamento de spawn em pontes ou construções | `SurfaceY` retorna apenas altura do terreno. Para estruturas, faça raycast para baixo com `ObjIntersectGeom` ou use `SurfaceRoadY`. |
| Assumir que `contactDir` de `RaycastRV` é sempre válido | `contactDir` só é preenchido quando um objeto é atingido, não ao atingir terreno nu com `ground_only = true`. |
| Não verificar null em `RaycastRVResult.obj` | Acertos apenas no terreno retornam `obj = NULL`. Sempre verifique antes de fazer cast ou acessar propriedades. |
| Passar `null` para `ignore` quando o jogador poderia auto-intersectar | Sempre passe o jogador (ou a entidade que faz o cast) como `ignore` para prevenir que o raio atinja a própria geometria de colisão do emissor. |
| Usar `ObjIntersectFire` para verificações de obstrução visual | Geometria `Fire` é otimizada para caminhos de balas e pode ter lacunas que a geometria `View` cobre. Use `ObjIntersectView` para verificações de linha de visão. |

---

## Observado em Mods Reais

> Esses padrões foram confirmados estudando o código-fonte de mods profissionais de DayZ e scripts vanilla do jogo.

| Padrão | Fonte | Arquivo/Localização |
|---------|--------|---------------|
| Ajuste `SurfaceY` para posicionamento de partículas ao nível do chão | Vanilla | `4_World/classes/contaminatedarea/effectarea.c` |
| `SurfaceGetType` para detecção de superfície de roda de veículo | Vanilla | `4_World/entities/vehicles/carscript.c` |
| `SurfaceGetNormal` + `VectorToAngles` para posicionamento alinhado ao terreno | Vanilla | `4_World/classes/hologram.c` |
| `RaycastRV` com `ObjIntersectIFire` para medição de rangefinder | Vanilla | `4_World/entities/itembase/rangefinder.c` |
| `RaycastRVProxy` com `ALLOBJECTS` para direcionamento de cursor de ação | Vanilla | `4_World/classes/useractionscomponent/actiontargets.c` |
| `RayCastBullet` com `PhxInteractionLayers` combinadas para teleporte | Vanilla | `4_World/plugins/plugindeveloper/developerteleport.c` |
| `SphereCastBullet` com raio pequeno para detecção precisa de acerto | Vanilla | `4_World/plugins/plugindeveloper/developerteleport.c` |
| `GetObjectsAtPosition` com `null` proxyCargo para zonas de morte por área | Vanilla | `4_World/classes/contaminatedarea/geyserarea.c` |
| `IsObjectObstructedCache` para agrupar chamadas de raycast por frame | Vanilla | `4_World/static/miscgameplayfunctions.c` |
| Bitmask combinada de `PhxInteractionLayers` para obstrução de corpo-a-corpo | Vanilla | `4_World/classes/meleetargeting.c` |

---

[Início](../README.md) | [<< Anterior: Sistema de Animação](18-animation-system.md) | **Consultas de Terreno e Mundo** | [Próximo: Sistema de Partículas e Efeitos >>](20-particle-effects.md)
