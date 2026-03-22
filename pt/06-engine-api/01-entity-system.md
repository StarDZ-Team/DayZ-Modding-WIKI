# Chapter 6.1: Entity System

[Home](../README.md) | **Entity System** | [Next: Vehicles >>](02-vehicles.md)

---

## Introdução

Todo objeto no mundo do DayZ --- itens, jogadores, zumbis, animais, construções, veículos --- descende de uma única hierarquia de classes enraizada em `IEntity`. Entender essa hierarquia e os métodos disponíveis em cada nível é a base de todo modding no DayZ. Este capítulo é uma referência da API para as classes centrais de entidade: quais métodos existem, quais são suas assinaturas e como usá-los corretamente.

---

## Hierarquia de Classes

```
Class (raiz de todas as classes Enforce Script)
└── Managed
    └── IEntity                              // 1_Core/proto/enentity.c
        └── Object                           // 3_Game/entities/object.c
            └── ObjectTyped
                └── Entity
                    └── EntityAI             // 3_Game/entities/entityai.c
                        ├── InventoryItem    // 3_Game/entities/inventoryitem.c
                        │   └── ItemBase     // 4_World/entities/itembase.c
                        │       ├── Weapon_Base, Magazine_Base
                        │       └── (todos os itens de inventário)
                        ├── Man              // 3_Game/entities/man.c
                        │   └── DayZPlayer
                        │       └── DayZPlayerImplement
                        │           └── ManBase
                        │               └── PlayerBase  // 4_World/entities/manbase/playerbase.c
                        ├── Building         // 3_Game/entities/building.c
                        ├── DayZInfected
                        │   └── ZombieBase   // 4_World/entities/creatures/infected/zombiebase.c
                        ├── DayZAnimal
                        │   └── AnimalBase   // 4_World
                        └── AdvancedCommunication
```

Pontos-chave:

- **IEntity** é a base em nível de engine. Fornece métodos de transformação, física e hierarquia.
- **Object** adiciona helpers de posição/orientação, vida, acesso a config, hidden selections e verificação de tipo (`IsMan()`, `IsBuilding()`, etc.).
- **EntityAI** adiciona inventário, zonas de dano, attachments, energy manager, variáveis de sincronização de rede e eventos de ciclo de vida (`EEInit`, `EEKilled`, `EEHitBy`).
- **ItemBase**, **PlayerBase**, **ZombieBase** e **AnimalBase** são as bases concretas com as quais você trabalha no dia a dia.

---

## IEntity

**Arquivo:** `1_Core/proto/enentity.c`

A entidade nativa da engine. Todos são métodos proto native --- você não pode ver a implementação deles em script.

### Transformação

```mermaid
classDiagram
    IEntity <|-- Object
    Object <|-- ObjectTyped
    ObjectTyped <|-- Entity
    Entity <|-- EntityAI
    EntityAI <|-- ItemBase
    EntityAI <|-- ManBase
    EntityAI <|-- Building
    EntityAI <|-- DayZInfected
    EntityAI <|-- DayZAnimal
    EntityAI <|-- Transport
    ManBase <|-- PlayerBase
    ItemBase <|-- Weapon_Base
    ItemBase <|-- Magazine_Base
    ItemBase <|-- Clothing_Base
    Transport <|-- CarScript
    Transport <|-- BoatScript
    Weapon_Base <|-- Rifle_Base
    Weapon_Base <|-- Pistol_Base

    class EntityAI {
        +GetHealth()
        +SetHealth()
        +IsAlive()
        +Delete()
    }
    class PlayerBase {
        +GetIdentity()
        +GetBleeding()
        +IsRestrained()
    }
```

| Método | Assinatura | Descrição |
|--------|-----------|-------------|
| `GetOrigin` | `proto native vector GetOrigin()` | Posição no mundo da entidade |
| `SetOrigin` | `proto native external void SetOrigin(vector orig)` | Define a posição no mundo |
| `GetYawPitchRoll` | `proto native vector GetYawPitchRoll()` | Rotação como yaw/pitch/roll em graus |
| `GetTransform` | `proto native external void GetTransform(out vector mat[4])` | Matriz de transformação 4x3 completa |
| `SetTransform` | `proto native external void SetTransform(vector mat[4])` | Define a transformação completa |

### Conversão de Coordenadas

| Método | Assinatura | Descrição |
|--------|-----------|-------------|
| `VectorToParent` | `proto native vector VectorToParent(vector vec)` | Transforma direção do espaço local para o mundo |
| `CoordToParent` | `proto native vector CoordToParent(vector coord)` | Transforma ponto do espaço local para o mundo |
| `VectorToLocal` | `proto native vector VectorToLocal(vector vec)` | Transforma direção do espaço mundo para o local |
| `CoordToLocal` | `proto native vector CoordToLocal(vector coord)` | Transforma ponto do espaço mundo para o local |

### Hierarquia

| Método | Assinatura | Descrição |
|--------|-----------|-------------|
| `AddChild` | `proto native external void AddChild(IEntity child, int pivot, bool positionOnly = false)` | Anexa entidade filha a um bone pivot |
| `RemoveChild` | `proto native external void RemoveChild(IEntity child, bool keepTransform = false)` | Desanexa entidade filha |
| `GetParent` | `proto native IEntity GetParent()` | Entidade pai (ou null) |
| `GetChildren` | `proto native IEntity GetChildren()` | Primeira entidade filha |
| `GetSibling` | `proto native IEntity GetSibling()` | Próxima entidade irmã |

### Eventos

| Método | Assinatura | Descrição |
|--------|-----------|-------------|
| `SetEventMask` | `proto native external void SetEventMask(EntityEvent e)` | Habilita callbacks de eventos |
| `ClearEventMask` | `proto native external void ClearEventMask(EntityEvent e)` | Desabilita callbacks de eventos |
| `SetFlags` | `proto native external EntityFlags SetFlags(EntityFlags flags, bool recursivelyApply)` | Define flags da entidade (VISIBLE, SOLID, etc.) |
| `ClearFlags` | `proto native external EntityFlags ClearFlags(EntityFlags flags, bool recursivelyApply)` | Limpa flags da entidade |

### Callbacks de Eventos

Estes são chamados pela engine quando a máscara de evento correspondente está definida:

```c
// Callback por frame (requer EntityEvent.FRAME)
event protected void EOnFrame(IEntity other, float timeSlice);

// Callback de contato (requer EntityEvent.CONTACT)
event protected void EOnContact(IEntity other, Contact extra);

// Callbacks de trigger (requer EntityEvent.ENTER / EntityEvent.LEAVE)
event protected void EOnEnter(IEntity other, int extra);
event protected void EOnLeave(IEntity other, int extra);
```

---

## Object

**Arquivo:** `3_Game/entities/object.c` (1455 linhas)

Classe base para todos os objetos espaciais no mundo do jogo. Este é o primeiro nível acessível por script da hierarquia --- `IEntity` é puramente nativo da engine.

### Posição e Orientação

```c
proto native void SetPosition(vector pos);
proto native vector GetPosition();
proto native void SetOrientation(vector ori);     // ori = "yaw pitch roll" em graus
proto native vector GetOrientation();              // retorna "yaw pitch roll"
proto native void SetDirection(vector direction);
proto native vector GetDirection();                // vetor de direção frontal
```

**Exemplo --- teleportar um objeto:**

```c
Object obj = GetSomeObject();
vector newPos = Vector(6543.0, 0, 2872.0);
newPos[1] = GetGame().SurfaceY(newPos[0], newPos[2]);
obj.SetPosition(newPos);
```

### Vida e Dano

```c
// Sistema de vida baseado em zonas. Use "" para zona global, "Health" para tipo de vida padrão.
proto native float GetHealth(string zoneName, string healthType);
proto native float GetMaxHealth(string zoneName, string healthType);
proto native void  SetHealth(string zoneName, string healthType, float value);
proto native void  SetHealthMax(string zoneName, string healthType);
proto native void  DecreaseHealth(string zoneName, string healthType, float value,
                                   bool auto_delete = false);
proto native void  AddHealth(string zoneName, string healthType, float value);
proto native void  SetAllowDamage(bool val);
proto native bool  GetAllowDamage();
```

| Parâmetro | Significado |
|-----------|---------|
| `zoneName` | Nome da zona de dano (ex: `""` para global, `"Engine"`, `"FuelTank"`, `"LeftArm"`) |
| `healthType` | Tipo de stat de vida (geralmente `"Health"`, mas também `"Blood"`, `"Shock"` para jogadores) |

**Exemplo --- definir um item com metade da vida:**

```c
float maxHP = obj.GetMaxHealth("", "Health");
obj.SetHealth("", "Health", maxHP * 0.5);
```

### IsAlive

```c
proto native bool IsAlive();
```

> **Cuidado:** A referência vanilla mostra `IsAlive()` em `Object`, mas na prática muitos modders descobriram que é não-confiável na classe base `Object`. O padrão seguro é fazer cast para `EntityAI` primeiro:

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Confirmado vivo
}
```

### Verificação de Tipo

```c
proto native bool IsMan();
proto native bool IsDayZCreature();
proto native bool IsBuilding();
proto native bool IsTransport();
proto native bool IsKindOf(string type);     // Verifica herança de config
```

**Exemplo:**

```c
if (obj.IsKindOf("Weapon_Base"))
{
    Print("Isto é uma arma!");
}
```

### Tipo e Nome de Exibição

```c
// GetType() retorna o nome da classe config (ex: "AKM", "SurvivorM_Mirek")
string GetType();

// GetDisplayName() retorna o nome de exibição localizado
string GetDisplayName();
```

### Escala

```c
proto native void  SetScale(float scale);
proto native float GetScale();
```

### Posições de Bones

```c
proto native vector GetBonePositionLS(int pivot);   // Espaço local
proto native vector GetBonePositionMS(int pivot);   // Espaço do modelo
proto native vector GetBonePositionWS(int pivot);   // Espaço do mundo
```

### Hidden Selections (Trocas de Textura/Material)

```c
TStringArray GetHiddenSelections();
TStringArray GetHiddenSelectionsTextures();
TStringArray GetHiddenSelectionsMaterials();
```

### Acesso a Config (na própria entidade)

```c
proto native bool   ConfigGetBool(string entryName);
proto native int    ConfigGetInt(string entryName);
proto native float  ConfigGetFloat(string entryName);
proto native owned string ConfigGetString(string entryName);
proto native void   ConfigGetTextArray(string entryName, out TStringArray values);
proto native void   ConfigGetIntArray(string entryName, out TIntArray values);
proto native void   ConfigGetFloatArray(string entryName, out TFloatArray values);
proto native bool   ConfigIsExisting(string entryName);
```

### ID de Rede

```c
proto native int GetNetworkID(out int id_low, out int id_high);
```

### Exclusão

```c
void Delete();                    // Exclusão adiada (próximo frame, via CallQueue)
proto native bool ToDelete();     // Este objeto está marcado para exclusão?
```

### Geometria e Componentes

```c
proto native owned string GetActionComponentName(int componentIndex, string geometry = "");
proto native owned vector GetActionComponentPosition(int componentIndex, string geometry = "");
proto native owned string GetDamageZoneNameByComponentIndex(int componentIndex);
proto native vector GetBoundingCenter();
```

---

## EntityAI

**Arquivo:** `3_Game/entities/entityai.c` (4719 linhas)

A base de trabalho para todas as entidades interativas do jogo. Adiciona inventário, eventos de dano, temperatura, gerenciamento de energia e sincronização de rede.

### Acesso ao Inventário

```c
proto native GameInventory GetInventory();
```

Operações comuns de inventário através do `GameInventory` retornado:

```c
// Enumerar todos os itens no inventário desta entidade
array<EntityAI> items = new array<EntityAI>;
eai.GetInventory().EnumerateInventory(InventoryTraversalType.PREORDER, items);

// Contar itens
int count = eai.GetInventory().CountInventory();

// Verificar se a entidade tem um item específico
bool has = eai.GetInventory().HasEntityInInventory(someItem);

// Criar item no cargo
EntityAI newItem = eai.GetInventory().CreateEntityInCargo("BandageDressing");

// Criar item como attachment
EntityAI attachment = eai.GetInventory().CreateAttachment("ACOGOptic");

// Encontrar attachment por nome de slot
EntityAI att = eai.GetInventory().FindAttachmentByName("Hands");

// Obter contagem de attachments e iterar
int attCount = eai.GetInventory().AttachmentCount();
for (int i = 0; i < attCount; i++)
{
    EntityAI att = eai.GetInventory().GetAttachmentFromIndex(i);
}
```

### Sistema de Dano

```c
proto native void SetHealth(string zoneName, string healthType, float value);
proto native float GetHealth(string zoneName, string healthType);
proto native float GetMaxHealth(string zoneName, string healthType);
proto native void SetHealthMax(string zoneName, string healthType);
proto native void DecreaseHealth(string zoneName, string healthType, float value,
                                  bool auto_delete = false);
proto native void ProcessDirectDamage(int damageType, EntityAI source, string component,
                                       string ammoType, vector modelPos,
                                       float damageCoef = 1.0, int flags = 0);
```

### Eventos de Ciclo de Vida

Sobrescreva estes na sua subclasse para interceptar o ciclo de vida da entidade:

```c
void EEInit();                                    // Chamado após inicialização da entidade
void EEDelete(EntityAI parent);                   // Chamado antes da exclusão
void EEKilled(Object killer);                     // Chamado quando a entidade morre
void EEHitBy(TotalDamageResult damageResult,      // Chamado quando a entidade recebe dano
             int damageType, EntityAI source,
             int component, string dmgZone,
             string ammo, vector modelPos,
             float speedCoef);
void EEItemAttached(EntityAI item, string slot_name);   // Attachment adicionado
void EEItemDetached(EntityAI item, string slot_name);   // Attachment removido
```

### Variáveis de Sincronização de Rede

Registre variáveis no construtor para sincronizá-las automaticamente entre servidor e cliente:

```c
proto native void RegisterNetSyncVariableBool(string variableName);
proto native void RegisterNetSyncVariableInt(string variableName, int minValue = 0, int maxValue = 0);
proto native void RegisterNetSyncVariableFloat(string variableName, float minValue = 0, float maxValue = 0);
```

Sobrescreva `OnVariablesSynchronized()` no cliente para reagir a mudanças:

```c
void OnVariablesSynchronized();
```

**Exemplo --- variável de estado sincronizada:**

```c
class MyItem extends ItemBase
{
    protected int m_State;

    void MyItem()
    {
        RegisterNetSyncVariableInt("m_State", 0, 5);
    }

    override void OnVariablesSynchronized()
    {
        super.OnVariablesSynchronized();
        // Atualizar visuais baseado em m_State
        UpdateVisualState();
    }
}
```

### Energy Manager

```c
proto native ComponentEnergyManager GetCompEM();
```

Uso:

```c
ComponentEnergyManager em = eai.GetCompEM();
if (em)
{
    bool working = em.IsWorking();
    float energy = em.GetEnergy();
    em.SwitchOn();
    em.SwitchOff();
}
```

### ScriptInvokers (Hooks de Eventos)

```c
protected ref ScriptInvoker m_OnItemAttached;
protected ref ScriptInvoker m_OnItemDetached;
protected ref ScriptInvoker m_OnItemAddedIntoCargo;
protected ref ScriptInvoker m_OnItemRemovedFromCargo;
protected ref ScriptInvoker m_OnHitByInvoker;
protected ref ScriptInvoker m_OnKilledInvoker;
```

### Verificações de Tipo

```c
bool IsItemBase();
bool IsClothing();
bool IsContainer();
bool IsWeapon();
bool IsMagazine();
bool IsTransport();
bool IsFood();
```

### Criando Entidades

```c
EntityAI SpawnEntityOnGroundPos(string object_name, vector pos);
EntityAI SpawnEntity(string object_name, notnull InventoryLocation inv_loc,
                     int iSetupFlags, int iRotation);
```

---

## ItemBase

**Arquivo:** `4_World/entities/itembase.c` (4986 linhas)

Base para todos os itens de inventário. `typedef ItemBase Inventory_Base;` é usado em todo o código vanilla.

### Sistema de Quantidade

```c
void  SetQuantity(float value, bool destroy_config = true, bool destroy_forced = false);
float GetQuantity();
int   GetQuantityMin();
int   GetQuantityMax();
float GetQuantityNormalized();   // 0.0 - 1.0
bool  CanBeSplit();
void  SplitIntoStackMax(EntityAI destination_entity, int slot_id, PlayerBase player);
```

**Exemplo --- encher um cantil:**

```c
ItemBase canteen = ItemBase.Cast(player.GetInventory().CreateInInventory("Canteen"));
if (canteen)
{
    canteen.SetQuantity(canteen.GetQuantityMax());
}
```

### Condição / Umidade / Temperatura

```c
// Umidade
float m_VarWet, m_VarWetMin, m_VarWetMax;

// Temperatura
float m_VarTemperature;

// Limpeza
int m_Cleanness;

// Líquido
int m_VarLiquidType;
```

### Ações

```c
void SetActions();                     // Sobrescreva para registrar ações para este item
void AddAction(typename actionName);   // Registrar uma ação
void RemoveAction(typename actionName);
```

**Exemplo --- item personalizado com ação:**

```c
class MyItem extends ItemBase
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionDrinkSelf);
    }
}
```

### Som

```c
void PlaySoundSet(out EffectSound effect_sound, string sound_set,
                  float fade_in, float fade_out);
void PlaySoundSetLoop(out EffectSound effect_sound, string sound_set,
                      float fade_in, float fade_out);
void StopSoundSet(EffectSound effect_sound);
```

### Economia / Persistência

```c
override void InitItemVariables();     // Lê todos os valores de config (quantidade, umidade, etc.)
```

Itens herdam o tempo de vida e persistência do CE (Central Economy) da sua entrada em `types.xml`. Use a flag `ECE_NOLIFETIME` ao criar objetos que nunca devem desaparecer.

---

## PlayerBase

**Arquivo:** `4_World/entities/manbase/playerbase.c` (9776 linhas)

A entidade do jogador. A maior classe no codebase.

### Identidade

```c
PlayerIdentity GetIdentity();
```

A partir de `PlayerIdentity`:

```c
string GetName();       // Nome de exibição Steam/plataforma
string GetId();         // ID único do jogador (BI ID)
string GetPlainId();    // Steam64 ID
int    GetPlayerId();   // ID do jogador na sessão (int)
```

**Exemplo --- obter informações do jogador no servidor:**

```c
PlayerBase player;  // do evento
PlayerIdentity identity = player.GetIdentity();
if (identity)
{
    string name = identity.GetName();
    string steamId = identity.GetPlainId();
    Print(string.Format("Player: %1 (Steam: %2)", name, steamId));
}
```

### Vida / Sangue / Shock

O jogador usa o sistema de vida baseado em zonas do EntityAI, com tipos de vida especiais:

```c
// Vida global (0-100 por padrão)
float hp = player.GetHealth("", "Health");

// Sangue (0-5000)
float blood = player.GetHealth("", "Blood");

// Shock (0-100)
float shock = player.GetHealth("", "Shock");

// Definir valores
player.SetHealth("", "Health", 100);
player.SetHealth("", "Blood", 5000);
player.SetHealth("", "Shock", 0);
```

### Posição e Inventário

```c
vector pos = player.GetPosition();
player.SetPosition(newPos);

// Item nas mãos
EntityAI inHands = player.GetHumanInventory().GetEntityInHands();

// Dirigindo veículo
EntityAI vehicle = player.GetDrivingVehicle();
bool inVehicle = player.IsInVehicle();
```

### Verificações de Estado

```c
bool IsAlive();
bool IsUnconscious();
bool IsRestrained();
bool IsInVehicle();
```

### Managers

`PlayerBase` mantém referências a muitos subsistemas de gameplay:

```c
ref ModifiersManager   m_ModifiersManager;
ref ActionManagerBase  m_ActionManager;
ref PlayerAgentPool    m_AgentPool;
ref Environment        m_Environment;
ref EmoteManager       m_EmoteManager;
ref StaminaHandler     m_StaminaHandler;
ref WeaponManager      m_WeaponManager;
```

### Eventos de Ciclo de Vida do Servidor

```c
void OnConnect();
void OnDisconnect();
void OnScheduledTick(float deltaTime);
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx);
```

### Criando Itens Perto do Jogador

```c
EntityAI SpawnEntityOnGroundOnCursorDir(string object_name, float distance);
```

---

## ZombieBase

**Arquivo:** `4_World/entities/creatures/infected/zombiebase.c` (1150 linhas)

Base para todas as entidades infectadas (zumbis).

### Propriedades Principais

```c
protected int   m_MindState;       // Estado da IA (-1 a 4)
protected float m_MovementSpeed;   // Velocidade de movimento (-1 a 3)
protected bool  m_IsCrawling;      // Zumbi rastejante
```

### Inicialização

```c
void Init()
{
    RegisterNetSyncVariableInt("m_MindState", -1, 4);
    RegisterNetSyncVariableFloat("m_MovementSpeed", -1, 3);
    RegisterNetSyncVariableBool("m_IsCrawling");

    m_TargetableObjects.Insert(PlayerBase);
    m_TargetableObjects.Insert(AnimalBase);
}
```

---

## AnimalBase

**Arquivo:** `4_World/entities/creatures/animals/`

Base para todas as entidades animais. Estende `DayZAnimal` que estende `EntityAI`.

Animais usam as mesmas APIs de vida, posição e dano que outras entidades. Seu comportamento é controlado pelo sistema de IA e por arquivos de território configurados pelo CE.

---

## Criando Entidades

### GetGame().CreateObject()

```c
proto native Object CreateObject(string type, vector pos,
                                  bool create_local = false,
                                  bool init_ai = false,
                                  bool create_physics = true);
```

| Parâmetro | Descrição |
|-----------|-------------|
| `type` | Nome da classe config (ex: `"AKM"`, `"ZmbF_JournalistNormal_Blue"`) |
| `pos` | Posição no mundo |
| `create_local` | `true` = apenas no cliente, não replicado para o servidor |
| `init_ai` | `true` = inicializar IA (para zumbis, animais) |
| `create_physics` | `true` = criar geometria de colisão |

**Exemplo:**

```c
Object obj = GetGame().CreateObject("AKM", player.GetPosition(), false, false, true);
```

### GetGame().CreateObjectEx()

```c
proto native Object CreateObjectEx(string type, vector pos, int iFlags,
                                    int iRotation = RF_DEFAULT);
```

Esta é a API preferida. O parâmetro `iFlags` usa flags ECE (Entity Creation Event).

### Flags ECE

| Flag | Valor | Descrição |
|------|-------|-------------|
| `ECE_NONE` | `0` | Sem comportamento especial |
| `ECE_SETUP` | `2` | Setup completo da entidade |
| `ECE_TRACE` | `4` | Posicionar na superfície por trace |
| `ECE_CENTER` | `8` | Usar centro do model shape |
| `ECE_UPDATEPATHGRAPH` | `32` | Atualizar malha de navegação |
| `ECE_CREATEPHYSICS` | `1024` | Criar física/colisão |
| `ECE_INITAI` | `2048` | Inicializar IA |
| `ECE_EQUIP_ATTACHMENTS` | `8192` | Spawnar attachments configurados |
| `ECE_EQUIP_CARGO` | `16384` | Spawnar cargo configurado |
| `ECE_EQUIP` | `24576` | `ATTACHMENTS + CARGO` |
| `ECE_LOCAL` | `1073741824` | Criar apenas localmente (não replicado) |
| `ECE_NOSURFACEALIGN` | `262144` | Não alinhar à normal da superfície |
| `ECE_KEEPHEIGHT` | `524288` | Manter posição Y (sem trace) |
| `ECE_NOLIFETIME` | `4194304` | Sem tempo de vida do CE (não vai desaparecer) |
| `ECE_DYNAMIC_PERSISTENCY` | `33554432` | Persistente apenas após interação do jogador |

### Combinações Pré-definidas de Flags

| Constante | Flags | Caso de Uso |
|----------|-------|----------|
| `ECE_IN_INVENTORY` | `CREATEPHYSICS \| KEEPHEIGHT \| NOSURFACEALIGN` | Itens criados no inventário |
| `ECE_PLACE_ON_SURFACE` | `CREATEPHYSICS \| UPDATEPATHGRAPH \| TRACE` | Itens colocados no chão |
| `ECE_FULL` | `SETUP \| TRACE \| ROTATIONFLAGS \| UPDATEPATHGRAPH \| EQUIP` | Setup completo com equipamento |

### Flags RF (Rotação)

| Flag | Valor | Descrição |
|------|-------|-------------|
| `RF_DEFAULT` | `512` | Usar posicionamento padrão da config |
| `RF_ORIGINAL` | `128` | Usar posicionamento padrão da config |
| `RF_IGNORE` | `64` | Spawnar como o modelo foi criado |
| `RF_ALL` | `63` | Todas as direções de rotação |

### Padrões Comuns

**Spawnar item no chão:**

```c
vector pos = player.GetPosition();
Object item = GetGame().CreateObjectEx("AKM", pos, ECE_PLACE_ON_SURFACE);
```

**Spawnar zumbi com IA:**

```c
EntityAI zombie = EntityAI.Cast(
    GetGame().CreateObjectEx("ZmbF_JournalistNormal_Blue", pos,
                              ECE_PLACE_ON_SURFACE | ECE_INITAI)
);
```

**Spawnar construção persistente:**

```c
int flags = ECE_SETUP | ECE_UPDATEPATHGRAPH | ECE_CREATEPHYSICS | ECE_NOLIFETIME;
Object building = GetGame().CreateObjectEx("Land_House", pos, flags, RF_IGNORE);
```

**Spawnar apenas local (lado do cliente):**

```c
Object local = GetGame().CreateObjectEx("HelpDeskItem", pos, ECE_LOCAL | ECE_CREATEPHYSICS);
```

**Spawnar item direto no inventário do jogador:**

```c
EntityAI item = player.GetInventory().CreateInInventory("BandageDressing");
```

---

## Destruindo Entidades

### Object.Delete()

```c
void Delete();
```

Exclusão adiada --- o objeto é removido no próximo frame via `CallQueue`. Esta é a forma mais segura de deletar objetos porque evita problemas ao deletar objetos enquanto estão sendo iterados.

### GetGame().ObjectDelete()

```c
proto native void ObjectDelete(Object obj);
```

Exclusão imediata com autoridade do servidor. Remove o objeto do servidor e replica a remoção para todos os clientes.

### GetGame().ObjectDeleteOnClient()

```c
proto native void ObjectDeleteOnClient(Object obj);
```

Deleta o objeto apenas nos clientes. O servidor ainda mantém o objeto.

**Exemplo --- limpar objetos spawnados:**

```c
// Preferido: exclusão adiada
obj.Delete();

// Imediata: quando você precisa que suma agora
GetGame().ObjectDelete(obj);
```

---

## Exemplos Práticos

### Encontrar Todos os Jogadores Perto de uma Posição

```c
void FindNearbyPlayers(vector center, float radius, out array<PlayerBase> result)
{
    result = new array<PlayerBase>;
    array<Man> allPlayers = new array<Man>;
    GetGame().GetPlayers(allPlayers);

    foreach (Man man : allPlayers)
    {
        if (vector.Distance(man.GetPosition(), center) <= radius)
        {
            PlayerBase pb;
            if (Class.CastTo(pb, man))
            {
                result.Insert(pb);
            }
        }
    }
}
```

### Spawnar uma Arma Totalmente Equipada

```c
void SpawnEquippedAKM(vector pos)
{
    EntityAI weapon = EntityAI.Cast(
        GetGame().CreateObjectEx("AKM", pos, ECE_PLACE_ON_SURFACE)
    );
    if (!weapon)
        return;

    // Adicionar attachments
    weapon.GetInventory().CreateAttachment("AK_WoodBttstck");
    weapon.GetInventory().CreateAttachment("AK_WoodHndgrd");

    // Criar um carregador no cargo
    weapon.GetInventory().CreateEntityInCargo("Mag_AKM_30Rnd");
}
```

### Causar Dano e Matar uma Entidade

```c
void DamageEntity(EntityAI target, float amount)
{
    float currentHP = target.GetHealth("", "Health");
    float newHP = currentHP - amount;

    if (newHP <= 0)
    {
        target.SetHealth("", "Health", 0);
        // EEKilled será chamado automaticamente pela engine
    }
    else
    {
        target.SetHealth("", "Health", newHP);
    }
}
```

---

## Resumo

| Conceito | Ponto-chave |
|---------|-----------|
| Hierarquia | `IEntity` > `Object` > `EntityAI` > `ItemBase` / `PlayerBase` / `ZombieBase` |
| Posição | `GetPosition()` / `SetPosition()` disponível a partir de `Object` para cima |
| Vida | Baseada em zonas: `GetHealth(zone, type)` / `SetHealth(zone, type, value)` |
| IsAlive | Use em `EntityAI` ou faça cast primeiro: `EntityAI eai; Class.CastTo(eai, obj)` |
| Inventário | `eai.GetInventory()` retorna `GameInventory` com CRUD completo |
| Criação | `GetGame().CreateObjectEx(type, pos, ECE_flags)` é a API preferida |
| Exclusão | `obj.Delete()` (adiada) ou `GetGame().ObjectDelete(obj)` (imediata) |
| Sync de Rede | `RegisterNetSyncVariable*()` no construtor, reagir em `OnVariablesSynchronized()` |
| Verif. de Tipo | `obj.IsKindOf("ClassName")`, `obj.IsMan()`, `obj.IsBuilding()` |

---

[Início](../README.md) | **Sistema de Entidades** | [Próximo: Veículos >>](02-vehicles.md)
