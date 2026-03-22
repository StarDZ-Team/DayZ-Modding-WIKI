# Chapter 8.4: Adding Chat Commands

[Home](../README.md) | [<< Previous: Building an Admin Panel](03-admin-panel.md) | **Adding Chat Commands** | [Next: Using the DayZ Mod Template >>](05-mod-template.md)

---

## O que Estamos Construindo

Um sistema de comandos de chat com:

- **`/heal`** -- Cura completamente o personagem do admin (vida, sangue, shock, fome, sede)
- **`/heal PlayerName`** -- Cura um jogador específico por nome
- Um framework reutilizável para adicionar `/kill`, `/teleport`, `/time`, `/weather` e qualquer outro comando
- Verificação de permissão admin para que jogadores comuns não possam usar comandos admin
- Execução server-side com mensagens de feedback no chat

---

## Pré-requisitos

- Uma estrutura de mod funcional (complete o [Capítulo 8.1](01-first-mod.md) primeiro)
- Entendimento do [padrão RPC cliente-servidor](03-admin-panel.md) do Capítulo 8.3

### Estrutura do Mod

```
ChatCommands/
    mod.cpp
    Scripts/
        config.cpp
        3_Game/
            ChatCommands/
                CCmdRPC.c
                CCmdBase.c
                CCmdRegistry.c
        4_World/
            ChatCommands/
                CCmdServerHandler.c
                commands/
                    CCmdHeal.c
        5_Mission/
            ChatCommands/
                CCmdChatHook.c
```

---

## Visão Geral da Arquitetura

```
CLIENT                                  SERVER
------                                  ------

1. Admin digita "/heal" no chat
2. Chat hook intercepta a mensagem
   (impede que seja enviada como chat)
3. Cliente envia comando via RPC  ---->  4. Servidor recebe RPC
                                            Verifica permissões admin
                                            Busca handler do comando
                                            Executa o comando
                                        5. Servidor envia feedback  ---->  CLIENT
                                            (RPC de mensagem no chat)
                                                                     6. Admin vê
                                                                        feedback no chat
```

**Por que processar comandos no servidor?** Porque o servidor tem autoridade sobre o estado do jogo. Apenas o servidor pode confiavelmente curar jogadores, mudar clima, teleportar personagens e modificar estado do mundo.

---

## Passo 1: Interceptar Input de Chat

```c
modded class MissionGameplay
{
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    SendChatCommand(message);
                }
            }
        }
    }

    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player) return;

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                GetGame().Chat(prefix + " " + message, "colorStatusChannel");
            }
        }
    }
};
```

### Como Funciona a Interceptação de Chat

O método `OnEvent` em `MissionGameplay` é chamado para vários eventos do jogo. Quando `eventTypeId` é `ChatMessageEventTypeID`, significa que o jogador acabou de enviar uma mensagem no chat. O `Param3` contém:

- `param1` -- Canal (int): o canal de chat
- `param2` -- Nome do sender (string)
- `param3` -- Texto da mensagem (string)

Verificamos se a mensagem começa com `/`. Se sim, encaminhamos a string inteira para o servidor via RPC.

---

## Passo 2: Parsear Prefixo e Argumentos do Comando

### Constantes RPC (3_Game)

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### Classe Base de Comando (3_Game)

```c
class CCmdBase
{
    string GetName() { return ""; }
    string GetDescription() { return ""; }
    string GetUsage() { return "/" + GetName(); }
    bool RequiresAdmin() { return true; }
    bool Execute(PlayerIdentity caller, array<string> args) { return false; }

    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller) return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### Registro de Comandos (3_Game)

```c
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    static void Init()
    {
        if (!s_Commands) s_Commands = new map<string, ref CCmdBase>;
    }

    static void Register(CCmdBase command)
    {
        if (!s_Commands) Init();
        if (!command) return;

        string name = command.GetName();
        name.ToLower();
        s_Commands.Set(name, command);
    }

    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands) return null;
        string nameLower = name;
        nameLower.ToLower();
        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd)) return cmd;
        return null;
    }

    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0) return;

        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### Lógica de Parse Explicada

Dado o input `/heal SomePlayer`, `ParseCommand` faz:

1. Remove o `/` inicial para obter `"heal SomePlayer"`
2. Divide por espaços para obter `["heal", "SomePlayer"]`
3. Pega o primeiro elemento como nome do comando: `"heal"`
4. Remove-o do array, deixando args: `["SomePlayer"]`

O nome do comando é convertido para minúsculo então `/Heal`, `/HEAL` e `/heal` todos funcionam.

---

## Passo 3: Implementar o Comando /heal (4_World)

```c
class CCmdHeal extends CCmdBase
{
    override string GetName() { return "heal"; }
    override string GetDescription() { return "Fully heals a player (health, blood, shock, hunger, thirst)"; }
    override string GetUsage() { return "/heal [PlayerName]"; }
    override bool RequiresAdmin() { return true; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller) return false;

        Man targetMan = null;
        string targetName = "";

        if (args.Count() > 0)
        {
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Player '" + searchName + "' not found.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Could not find your player object.");
                return false;
            }

            targetName = "yourself";
        }

        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");
        return true;
    }

    protected void HealPlayer(PlayerBase player)
    {
        if (!player) return;

        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());
        player.GetStatWater().Set(player.GetStatWater().GetMax());
        player.GetBleedingManagerServer().RemoveAllSources();
    }
};
```

### Por que 4_World?

O comando heal referencia `PlayerBase`, que é definido na camada `4_World`. Também usa métodos de stats do jogador (`GetStatEnergy`, `GetStatWater`, `GetBleedingManagerServer`) que só estão disponíveis em entidades do mundo.

---

## Passo 4: Handler Server-Side e Registro (4_World)

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();
        CCmdRegistry.Register(new CCmdHeal());
        // Adicionar mais comandos:
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
    }
};

modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer()) return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data)) return;

        string fullCommand = data.param1;

        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "") return;

        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command) return;

        // Verificação admin simples (substituir com sistema de permissão real)
        // if (command.RequiresAdmin() && !IsAdmin(sender)) return;

        command.Execute(sender, args);
    }
};
```

---

## Adicionando Mais Comandos

O framework facilita adicionar novos comandos. Basta criar uma nova classe estendendo `CCmdBase` e registrá-la:

```c
// Exemplo: comando /time
class CCmdTime extends CCmdBase
{
    override string GetName() { return "time"; }
    override string GetDescription() { return "Set server time"; }
    override string GetUsage() { return "/time <hour>"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (args.Count() < 1)
        {
            SendFeedback(caller, "[Time]", "Usage: " + GetUsage());
            return false;
        }

        int hour = args.Get(0).ToInt();
        if (hour < 0 || hour > 23)
        {
            SendFeedback(caller, "[Time]", "Hour must be 0-23.");
            return false;
        }

        int year, month, day, currentHour, minute;
        GetGame().GetWorld().GetDate(year, month, day, currentHour, minute);
        GetGame().GetWorld().SetDate(year, month, day, hour, 0);

        SendFeedback(caller, "[Time]", "Time set to " + hour.ToString() + ":00");
        return true;
    }
};
```

Depois registre em `MissionServer.OnInit()`:

```c
CCmdRegistry.Register(new CCmdTime());
```

---

## Resolução de Problemas

### Comando Não Faz Nada

- Verifique que o handler RPC está registrado no `PlayerBase.OnRPC()` server-side.
- Verifique que o comando está registrado em `CCmdRegistry`.
- Adicione instruções `Print()` para rastrear o fluxo de dados.

### Feedback Não Aparece no Chat

- Verifique que o RPC de feedback está sendo enviado do servidor.
- Verifique que `MissionGameplay.OnRPC()` está tratando `CCmdRPC.COMMAND_FEEDBACK`.
- Verifique correspondência do tipo Param.

### Comando Funciona Mas Heal Não Tem Efeito

- Verifique que `PlayerBase.SetHealth()` está sendo chamado com os nomes de zona corretos.
- Alguns métodos de stats podem não existir em todas as versões do DayZ --- verifique o log de script para erros.

---

## Próximos Passos

1. **Adicionar mais comandos** -- `/kill`, `/teleport <x> <y> <z>`, `/weather clear`, `/spawn <item>`
2. **Implementar sistema de permissão real** -- Carregar IDs admin de um arquivo JSON
3. **Suprimir mensagem de chat** -- Impedir que o comando `/heal` apareça como chat normal para outros jogadores
4. **Usar MyFramework** -- Integrar com `MyPermissions` para permissões hierárquicas e `MyRPC` para roteamento RPC

---

**Anterior:** [Capítulo 8.3: Construindo um Módulo de Painel Admin](03-admin-panel.md)
