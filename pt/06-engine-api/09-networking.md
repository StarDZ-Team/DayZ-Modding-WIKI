# Chapter 6.9: Networking & RPC

[Home](../README.md) | [<< Previous: File I/O & JSON](08-file-io.md) | **Networking & RPC** | [Next: Central Economy >>](10-central-economy.md)

---

## Introdução

DayZ é um jogo cliente-servidor. Toda lógica com autoridade roda no servidor, e clientes se comunicam com ele através de Remote Procedure Calls (RPCs). O mecanismo primário de RPC é o `ScriptRPC`, que permite escrever dados arbitrários de um lado e ler do outro. Este capítulo cobre a API de rede: enviando e recebendo RPCs, as classes de contexto de serialização, o método legado `CGame.RPC()` e `ScriptInputUserData` para mensagens cliente-para-servidor verificadas por input.

---

## Arquitetura Cliente-Servidor

```
┌────────────┐                    ┌────────────┐
│   Cliente   │  ──── RPC ────►   │   Servidor  │
│            │  ◄──── RPC ────   │            │
│ GetGame()  │                    │ GetGame()  │
│ .IsClient()│                    │ .IsServer()│
└────────────┘                    └────────────┘
```

### Verificações de Ambiente

```c
proto native bool GetGame().IsServer();          // true no servidor e host de listen-server
proto native bool GetGame().IsClient();          // true no cliente
proto native bool GetGame().IsMultiplayer();      // true em multiplayer
proto native bool GetGame().IsDedicatedServer();  // true apenas em servidor dedicado
```

**Padrão típico de guarda:**

```c
if (GetGame().IsServer())
{
    // Lógica apenas do servidor
}

if (!GetGame().IsServer())
{
    // Lógica apenas do cliente
}
```

---

## ScriptRPC

**Arquivo:** `3_Game/gameplay.c:104`

A classe RPC primária para enviar dados personalizados entre cliente e servidor. `ScriptRPC` estende `ParamsWriteContext`, então você chama `.Write()` diretamente nele para serializar dados.

### Definição da Classe

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

### Parâmetros de Send

| Parâmetro | Descrição |
|-----------|-------------|
| `target` | O objeto associado a este RPC (pode ser `null` para RPCs globais) |
| `rpc_type` | ID inteiro do RPC (deve coincidir entre emissor e receptor) |
| `guaranteed` | `true` = entrega confiável tipo TCP; `false` = não-confiável tipo UDP |
| `recipient` | `PlayerIdentity` do cliente alvo; `null` = broadcast para todos os clientes (apenas servidor) |

### Escrevendo Dados

`ParamsWriteContext` (que `ScriptRPC` estende) fornece:

```c
proto bool Write(void value_out);
```

Suporta todos os tipos primitivos, arrays e objetos serializáveis:

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

### Enviando: Servidor para Cliente

```c
// Enviar para um jogador específico
void SendDataToPlayer(PlayerBase player, int value, string message)
{
    if (!GetGame().IsServer())
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(value);
    rpc.Write(message);
    rpc.Send(player, MY_RPC_ID, true, player.GetIdentity());
}

// Broadcast para todos os jogadores
void BroadcastData(string message)
{
    if (!GetGame().IsServer())
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(message);
    rpc.Send(null, MY_RPC_ID, true, null);  // null recipient = todos os clientes
}
```

### Enviando: Cliente para Servidor

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
    // Quando enviado do cliente, recipient é ignorado — sempre vai para o servidor
}
```

---

## Recebendo RPCs

RPCs são recebidos sobrescrevendo `OnRPC` no objeto alvo (ou qualquer classe pai na hierarquia).

### Assinatura do OnRPC

```c
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    super.OnRPC(sender, rpc_type, ctx);

    if (rpc_type == MY_RPC_ID)
    {
        // Ler dados na mesma ordem em que foram escritos
        int value;
        string message;

        if (!ctx.Read(value))
            return;
        if (!ctx.Read(message))
            return;

        // Processar os dados
        HandleData(value, message);
    }
}
```

### ParamsReadContext

`ParamsReadContext` é um typedef para `Serializer`:

```c
typedef Serializer ParamsReadContext;
typedef Serializer ParamsWriteContext;
```

O método `Read`:

```c
proto bool Read(void value_in);
```

Retorna `true` em caso de sucesso, `false` se a leitura falhar (tipo errado, dados insuficientes). Sempre verifique o valor de retorno.

### Onde Sobrescrever OnRPC

| Objeto Alvo | Recebe RPCs Para |
|---------------|-------------------|
| `PlayerBase` | RPCs enviados com `target = player` |
| `ItemBase` | RPCs enviados com `target = item` |
| Qualquer `Object` | RPCs enviados com aquele objeto como alvo |
| `MissionGameplay` / `MissionServer` | RPCs globais (`target = null`) via `OnRPC` na missão |

**Exemplo --- troca completa cliente-servidor:**

```c
// Constante compartilhada (camada 3_Game)
const int RPC_MY_CUSTOM_DATA = 87001;

// Lado do servidor: enviar dados para o cliente (4_World ou 5_Mission)
class MyServerHandler
{
    void SendScore(PlayerBase player, int score)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(score);
        rpc.Send(player, RPC_MY_CUSTOM_DATA, true, player.GetIdentity());
    }
}

// Lado do cliente: receber dados (PlayerBase modded)
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

## CGame.RPC (API Legada)

O sistema RPC mais antigo baseado em array. Ainda usado no código vanilla mas `ScriptRPC` é preferido para mods novos.

### Assinaturas

```c
// Enviar com array de objetos Param
proto native void GetGame().RPC(Object target, int rpcType,
                                 notnull array<ref Param> params,
                                 bool guaranteed,
                                 PlayerIdentity recipient = null);

// Enviar com um único Param
proto native void GetGame().RPCSingleParam(Object target, int rpc_type,
                                            Param param, bool guaranteed,
                                            PlayerIdentity recipient = null);
```

### Classes Param

```c
class Param1<Class T1> extends Param { T1 param1; };
class Param2<Class T1, Class T2> extends Param { T1 param1; T2 param2; };
// ... até Param8
```

**Exemplo --- RPC legado:**

```c
// Enviar
Param1<string> data = new Param1<string>("Hello World");
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true, player.GetIdentity());

// Receber (em OnRPC)
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

**Arquivo:** `3_Game/gameplay.c`

Um contexto de escrita especializado para enviar mensagens de input cliente-para-servidor que passam pelo pipeline de validação de input da engine. Usado para ações que precisam de verificação anti-cheat.

```c
class ScriptInputUserData : ParamsWriteContext
{
    proto native void Reset();
    proto native void Send();
    proto native static bool CanStoreInputUserData();
}
```

### Padrão de Uso

```c
// Lado do cliente
void SendAction(int actionId)
{
    if (!ScriptInputUserData.CanStoreInputUserData())
    {
        Print("Cannot send input data right now");
        return;
    }

    ScriptInputUserData ctx = new ScriptInputUserData();
    ctx.Write(actionId);
    ctx.Send();  // Automaticamente roteado para o servidor
}
```

> **Nota:** `ScriptInputUserData` tem limitação de taxa. Sempre verifique `CanStoreInputUserData()` antes de enviar.

---

## Gerenciamento de IDs de RPC

### Escolhendo IDs de RPC

O DayZ vanilla usa o enum `ERPCs` para RPCs integrados. Mods personalizados devem usar IDs que não conflitem com vanilla.

**Boas práticas:**

```c
// Definir na camada 3_Game (compartilhado entre cliente e servidor)
const int MY_MOD_RPC_BASE = 87000;  // Escolher um número alto improvável de conflitar
const int RPC_MY_FEATURE_A = MY_MOD_RPC_BASE + 1;
const int RPC_MY_FEATURE_B = MY_MOD_RPC_BASE + 2;
const int RPC_MY_FEATURE_C = MY_MOD_RPC_BASE + 3;
```

### Padrão de ID Único da Engine (Usado pelo MyFramework)

Para mods com muitos tipos de RPC, use um único ID de engine e roteie internamente por um identificador string:

```c
// Único ID de engine
const int MyRPC_ENGINE_ID = 83722;

// Enviar com roteamento por string
ScriptRPC rpc = new ScriptRPC();
rpc.Write("MyFeature.DoAction");  // Rota string
rpc.Write(payload);
rpc.Send(target, MyRPC_ENGINE_ID, true, recipient);

// Receber e rotear
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    if (rpc_type == MyRPC_ENGINE_ID)
    {
        string route;
        if (!ctx.Read(route))
            return;

        // Rotear para handler baseado na string
        HandleRoute(route, sender, ctx);
    }
}
```

---

## Variáveis de Sync de Rede (Alternativa a RPC)

Para sincronização simples de estado, `RegisterNetSyncVariable*()` é frequentemente mais simples que RPCs. Veja o [Capítulo 6.1](01-entity-system.md) para detalhes.

RPCs são melhores quando:
- Você precisa enviar eventos únicos (não estado contínuo)
- Os dados não pertencem a uma entidade específica
- Você precisa enviar dados complexos ou de tamanho variável
- Você precisa de comunicação cliente-para-servidor

Variáveis de sync de rede são melhores quando:
- Você tem um número pequeno de variáveis em uma entidade que mudam periodicamente
- Você quer interpolação automática
- Os dados naturalmente pertencem à entidade

---

## Considerações de Segurança

### Validação no Lado do Servidor

**Nunca confie em dados do cliente.** Sempre valide dados de RPC no servidor:

```c
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    super.OnRPC(sender, rpc_type, ctx);

    if (rpc_type == RPC_PLAYER_REQUEST && GetGame().IsServer())
    {
        int requestedAmount;
        if (!ctx.Read(requestedAmount))
            return;

        // VALIDAR: limitar ao range permitido
        requestedAmount = Math.Clamp(requestedAmount, 0, 100);

        // VALIDAR: verificar que a identidade do sender corresponde ao objeto do jogador
        PlayerBase senderPlayer = GetPlayerBySender(sender);
        if (!senderPlayer || !senderPlayer.IsAlive())
            return;

        // Agora processar a requisição validada
        ProcessRequest(senderPlayer, requestedAmount);
    }
}
```

### Limitação de Taxa

A engine tem limitação de taxa integrada para RPCs. Enviar muitos RPCs por frame pode causar descarte. Para dados de alta frequência, considere:

- Usar variáveis de sync de rede ao invés
- Agrupar múltiplos valores em um único RPC
- Limitar a frequência de envio com um timer

---

## Resumo

| Conceito | Ponto-chave |
|---------|-----------|
| ScriptRPC | Classe RPC primária: `Write()` dados, depois `Send(target, id, guaranteed, recipient)` |
| OnRPC | Sobrescrever no objeto alvo para receber: `OnRPC(sender, rpc_type, ctx)` |
| Read/Write | `ctx.Write(value)` / `ctx.Read(value)` --- sempre verificar retorno do Read |
| Direção | Cliente envia para servidor; servidor envia para cliente específico ou broadcast |
| Recipient | `null` = broadcast (servidor), ignorado (cliente) |
| Guaranteed | `true` = entrega confiável, `false` = não-confiável (mais rápido) |
| Legado | `GetGame().RPC()` / `RPCSingleParam()` com objetos Param |
| Dados de input | `ScriptInputUserData` para input validado do cliente |
| IDs | Usar números altos (87000+) para evitar conflitos com vanilla |
| Segurança | Sempre validar dados do cliente no servidor |

---

[<< Anterior: File I/O & JSON](08-file-io.md) | **Networking & RPC** | [Próximo: Central Economy >>](10-central-economy.md)
