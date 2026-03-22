# Capitulo 6.9: Redes y RPC

[Inicio](../README.md) | [<< Anterior: File I/O & JSON](08-file-io.md) | **Redes y RPC** | [Siguiente: Central Economy >>](10-central-economy.md)

---

## Introduccion

DayZ es un juego cliente-servidor. Toda la logica autoritativa se ejecuta en el servidor, y los clientes se comunican con el a traves de Llamadas a Procedimiento Remoto (RPCs). El mecanismo principal de RPC es `ScriptRPC`, que te permite escribir datos arbitrarios en un lado y leerlos en el otro. Este capitulo cubre la API de redes: enviar y recibir RPCs, las clases de contexto de serializacion, el metodo legacy `CGame.RPC()`, y `ScriptInputUserData` para mensajes verificados de cliente a servidor.

---

## Arquitectura Cliente-Servidor

```
┌────────────┐                    ┌────────────┐
│   Cliente  │  ──── RPC ────►   │  Servidor  │
│            │  ◄──── RPC ────   │            │
│ GetGame()  │                    │ GetGame()  │
│ .IsClient()│                    │ .IsServer()│
└────────────┘                    └────────────┘
```

### Verificaciones de Entorno

```c
proto native bool GetGame().IsServer();          // true en servidor y host de listen-server
proto native bool GetGame().IsClient();          // true en cliente
proto native bool GetGame().IsMultiplayer();      // true en multijugador
proto native bool GetGame().IsDedicatedServer();  // true solo en servidor dedicado
```

**Patron tipico de guarda:**

```c
if (GetGame().IsServer())
{
    // Logica solo del servidor
}

if (!GetGame().IsServer())
{
    // Logica solo del cliente
}
```

---

## ScriptRPC

**Archivo:** `3_Game/gameplay.c:104`

La clase de RPC principal para enviar datos personalizados entre cliente y servidor. `ScriptRPC` extiende `ParamsWriteContext`, asi que llamas a `.Write()` directamente en el para serializar datos.

### Definicion de Clase

```mermaid
sequenceDiagram
    participant Client as Client (Player)
    participant CHandler as Client RPC Handler
    participant Network as Network (Engine ID 83722)
    participant SHandler as Server RPC Handler
    participant Server as Server (Logic)

    Client->>CHandler: SendAction("HealPlayer", uid)
    CHandler->>Network: ScriptRPC.Send()
    Network->>SHandler: OnRPC dispatch by route name
    SHandler->>Server: Permission check + execute

    alt Authorized
        Server->>SHandler: Action success
        SHandler->>Network: ScriptRPC response
        Network->>CHandler: OnRPC dispatch
        CHandler->>Client: Update UI (OnDataReceived)
    else Unauthorized
        Server->>SHandler: Log warning
        Note over Client: No response sent
    end
```
```c
class ScriptRPC : ParamsWriteContext
{
    void ScriptRPC();
    void ~ScriptRPC();
    proto native void Reset();
    proto native void Send(Object target, int rpc_type, bool guaranteed,
                           PlayerIdentity recipient = NULL);
}
```

### Parametros de Send

| Parametro | Descripcion |
|-----------|-------------|
| `target` | El objeto con el que este RPC esta asociado (puede ser `null` para RPCs globales) |
| `rpc_type` | ID entero de RPC (debe coincidir entre emisor y receptor) |
| `guaranteed` | `true` = entrega confiable tipo TCP; `false` = no confiable tipo UDP |
| `recipient` | `PlayerIdentity` del cliente objetivo; `null` = broadcast a todos los clientes (solo servidor) |

### Escribir Datos

`ParamsWriteContext` (que `ScriptRPC` extiende) provee:

```c
proto bool Write(void value_out);
```

Soporta todos los tipos primitivos, arrays y objetos serializables:

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(42);                          // int
rpc.Write(3.14);                        // float
rpc.Write(true);                        // bool
rpc.Write("hello");                     // string
rpc.Write(Vector(100, 0, 200));         // vector

array<string> names = {"Alice", "Bob"};
rpc.Write(names);                       // array<string>
```

### Enviar: Servidor a Cliente

```c
// Enviar a un jugador especifico
void SendDataToPlayer(PlayerBase player, int value, string message)
{
    if (!GetGame().IsServer())
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(value);
    rpc.Write(message);
    rpc.Send(player, MY_RPC_ID, true, player.GetIdentity());
}

// Broadcast a todos los jugadores
void BroadcastData(string message)
{
    if (!GetGame().IsServer())
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(message);
    rpc.Send(null, MY_RPC_ID, true, null);  // recipient null = todos los clientes
}
```

### Enviar: Cliente a Servidor

```c
void SendRequestToServer(int requestType)
{
    if (!GetGame().IsClient())
        return;

    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    if (!player)
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(requestType);
    rpc.Send(player, MY_REQUEST_RPC, true, null);
    // Cuando se envia desde cliente, recipient se ignora — siempre va al servidor
}
```

---

## Recibir RPCs

Los RPCs se reciben sobreescribiendo `OnRPC` en el objeto objetivo (o cualquier clase padre en la jerarquia).

### Firma de OnRPC

```c
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    super.OnRPC(sender, rpc_type, ctx);

    if (rpc_type == MY_RPC_ID)
    {
        // Leer datos en el mismo orden en que fueron escritos
        int value;
        string message;

        if (!ctx.Read(value))
            return;
        if (!ctx.Read(message))
            return;

        // Procesar los datos
        HandleData(value, message);
    }
}
```

### ParamsReadContext

`ParamsReadContext` es un typedef para `Serializer`:

```c
typedef Serializer ParamsReadContext;
typedef Serializer ParamsWriteContext;
```

El metodo `Read`:

```c
proto bool Read(void value_in);
```

Retorna `true` en exito, `false` si la lectura falla (tipo incorrecto, datos insuficientes). Siempre verifica el valor de retorno.

### Donde Sobreescribir OnRPC

| Objeto Objetivo | Recibe RPCs Para |
|---------------|-------------------|
| `PlayerBase` | RPCs enviados con `target = player` |
| `ItemBase` | RPCs enviados con `target = item` |
| Cualquier `Object` | RPCs enviados con ese objeto como target |
| `MissionGameplay` / `MissionServer` | RPCs globales (`target = null`) via `OnRPC` en mision |

**Ejemplo --- intercambio completo cliente-servidor:**

```c
// Constante compartida (capa 3_Game)
const int RPC_MY_CUSTOM_DATA = 87001;

// Lado del servidor: enviar datos al cliente (4_World o 5_Mission)
class MyServerHandler
{
    void SendScore(PlayerBase player, int score)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(score);
        rpc.Send(player, RPC_MY_CUSTOM_DATA, true, player.GetIdentity());
    }
}

// Lado del cliente: recibir datos (modded PlayerBase)
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (rpc_type == RPC_MY_CUSTOM_DATA)
        {
            int score;
            if (!ctx.Read(score))
                return;

            Print(string.Format("Received score: %1", score));
        }
    }
}
```

---

## CGame.RPC (API Legacy)

El sistema de RPC antiguo basado en arrays. Aun se usa en codigo vanilla pero `ScriptRPC` es preferido para mods nuevos.

### Firmas

```c
// Enviar con array de objetos Param
proto native void GetGame().RPC(Object target, int rpcType,
                                 notnull array<ref Param> params,
                                 bool guaranteed,
                                 PlayerIdentity recipient = null);

// Enviar con un solo Param
proto native void GetGame().RPCSingleParam(Object target, int rpc_type,
                                            Param param, bool guaranteed,
                                            PlayerIdentity recipient = null);
```

### Clases Param

```c
class Param1<Class T1> extends Param { T1 param1; };
class Param2<Class T1, Class T2> extends Param { T1 param1; T2 param2; };
// ... hasta Param8
```

**Ejemplo --- RPC legacy:**

```c
// Enviar
Param1<string> data = new Param1<string>("Hello World");
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true, player.GetIdentity());

// Recibir (en OnRPC)
if (rpc_type == MY_RPC_ID)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        Print(data.param1);  // "Hello World"
    }
}
```

---

## ScriptInputUserData

**Archivo:** `3_Game/gameplay.c`

Un contexto de escritura especializado para enviar mensajes de entrada de cliente a servidor que pasan por el pipeline de validacion de entrada del motor. Se usa para acciones que necesitan verificacion anti-cheat.

```c
class ScriptInputUserData : ParamsWriteContext
{
    proto native void Reset();
    proto native void Send();
    proto native static bool CanStoreInputUserData();
}
```

### Patron de Uso

```c
// Lado del cliente
void SendAction(int actionId)
{
    if (!ScriptInputUserData.CanStoreInputUserData())
    {
        Print("Cannot send input data right now");
        return;
    }

    ScriptInputUserData ctx = new ScriptInputUserData();
    ctx.Write(actionId);
    ctx.Send();  // Automaticamente enrutado al servidor
}
```

> **Nota:** `ScriptInputUserData` tiene limitacion de tasa. Siempre verifica `CanStoreInputUserData()` antes de enviar.

---

## Gestion de IDs de RPC

### Elegir IDs de RPC

DayZ vanilla usa el enum `ERPCs` para RPCs incorporados. Los mods personalizados deben usar IDs que no conflictuen con vanilla.

**Mejores practicas:**

```c
// Definir en la capa 3_Game (compartido entre cliente y servidor)
const int MY_MOD_RPC_BASE = 87000;  // Elegir un numero alto poco probable de conflicto
const int RPC_MY_FEATURE_A = MY_MOD_RPC_BASE + 1;
const int RPC_MY_FEATURE_B = MY_MOD_RPC_BASE + 2;
const int RPC_MY_FEATURE_C = MY_MOD_RPC_BASE + 3;
```

### Patron de ID Unico del Motor (Usado por MyFramework)

Para mods con muchos tipos de RPC, usa un solo ID de RPC del motor y enruta internamente por un identificador de string:

```c
// ID unico del motor
const int MyRPC_ENGINE_ID = 83722;

// Enviar con enrutamiento por string
ScriptRPC rpc = new ScriptRPC();
rpc.Write("MyFeature.DoAction");  // Ruta de string
rpc.Write(payload);
rpc.Send(target, MyRPC_ENGINE_ID, true, recipient);

// Recibir y enrutar
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    if (rpc_type == MyRPC_ENGINE_ID)
    {
        string route;
        if (!ctx.Read(route))
            return;

        // Enrutar al handler basado en string
        HandleRoute(route, sender, ctx);
    }
}
```

---

## Variables de Sincronizacion de Red (Alternativa a RPC)

Para sincronizacion de estado simple, `RegisterNetSyncVariable*()` a menudo es mas simple que RPCs. Consulta el [Capitulo 6.1](01-entity-system.md) para detalles.

Los RPCs son mejores cuando:
- Necesitas enviar eventos unicos (no estado continuo)
- Los datos no pertenecen a una entidad especifica
- Necesitas enviar datos complejos o de longitud variable
- Necesitas comunicacion de cliente a servidor

Las variables de sincronizacion de red son mejores cuando:
- Tienes un numero pequeno de variables en una entidad que cambian periodicamente
- Quieres interpolacion automatica
- Los datos naturalmente pertenecen a la entidad

---

## Consideraciones de Seguridad

### Validacion del Lado del Servidor

**Nunca confies en datos del cliente.** Siempre valida datos de RPC en el servidor:

```c
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    super.OnRPC(sender, rpc_type, ctx);

    if (rpc_type == RPC_PLAYER_REQUEST && GetGame().IsServer())
    {
        int requestedAmount;
        if (!ctx.Read(requestedAmount))
            return;

        // VALIDAR: limitar al rango permitido
        requestedAmount = Math.Clamp(requestedAmount, 0, 100);

        // VALIDAR: verificar que la identidad del emisor coincida con el objeto jugador
        PlayerBase senderPlayer = GetPlayerBySender(sender);
        if (!senderPlayer || !senderPlayer.IsAlive())
            return;

        // Ahora procesar la solicitud validada
        ProcessRequest(senderPlayer, requestedAmount);
    }
}
```

### Limitacion de Tasa

El motor tiene limitacion de tasa incorporada para RPCs. Enviar demasiados RPCs por frame puede causar que se descarten. Para datos de alta frecuencia, considera:

- Usar variables de sincronizacion de red en su lugar
- Agrupar multiples valores en un solo RPC
- Limitar la frecuencia de envio con un timer

---

## Resumen

| Concepto | Punto Clave |
|---------|-----------|
| ScriptRPC | Clase de RPC principal: `Write()` datos, luego `Send(target, id, guaranteed, recipient)` |
| OnRPC | Sobreescribir en el objeto objetivo para recibir: `OnRPC(sender, rpc_type, ctx)` |
| Read/Write | `ctx.Write(value)` / `ctx.Read(value)` --- siempre verificar el valor de retorno de Read |
| Direccion | Cliente envia al servidor; servidor envia a cliente especifico o broadcast |
| Recipient | `null` = broadcast (servidor), ignorado (cliente) |
| Guaranteed | `true` = entrega confiable, `false` = no confiable (mas rapido) |
| Legacy | `GetGame().RPC()` / `RPCSingleParam()` con objetos Param |
| Datos de entrada | `ScriptInputUserData` para entrada validada del cliente |
| IDs | Usar numeros altos (87000+) para evitar conflictos con vanilla |
| Seguridad | Siempre validar datos del cliente en el servidor |

---

[<< Anterior: File I/O & JSON](08-file-io.md) | **Redes y RPC** | [Siguiente: Central Economy >>](10-central-economy.md)
