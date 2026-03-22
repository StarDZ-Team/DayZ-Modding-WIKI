# Kapitola 8.4: Přidání chatových příkazů

[Domů](../../README.md) | [<< Předchozí: Tvorba administrátorského panelu](03-admin-panel.md) | **Přidání chatových příkazů** | [Další: Použití šablony DayZ modu >>](05-mod-template.md)

---

> **Shrnutí:** Tento tutoriál vás provede vytvořením systému chatových příkazů pro DayZ. Napojíte se na chatový vstup, zpracujete prefixy příkazů a argumenty, ověříte oprávnění administrátora, provedete akci na straně serveru a odešlete zpětnou vazbu hráči. Na konci budete mít funkční příkaz `/heal`, který plně vyléčí postavu administrátora, spolu s frameworkem pro přidávání dalších příkazů.

---

## Obsah

- [Co budeme vytvářet](#co-budeme-vytvářet)
- [Předpoklady](#předpoklady)
- [Přehled architektury](#přehled-architektury)
- [Krok 1: Napojení na chatový vstup](#krok-1-napojení-na-chatový-vstup)
- [Krok 2: Parsování prefixu příkazu a argumentů](#krok-2-parsování-prefixu-příkazu-a-argumentů)
- [Krok 3: Ověření oprávnění administrátora](#krok-3-ověření-oprávnění-administrátora)
- [Krok 4: Provedení akce na straně serveru](#krok-4-provedení-akce-na-straně-serveru)
- [Krok 5: Odeslání zpětné vazby administrátorovi](#krok-5-odeslání-zpětné-vazby-administrátorovi)
- [Krok 6: Registrace příkazů](#krok-6-registrace-příkazů)
- [Krok 7: Přidání do seznamu příkazů administrátorského panelu](#krok-7-přidání-do-seznamu-příkazů-administrátorského-panelu)
- [Kompletní funkční kód: příkaz /heal](#kompletní-funkční-kód-příkaz-heal)
- [Přidávání dalších příkazů](#přidávání-dalších-příkazů)
- [Řešení problémů](#řešení-problémů)
- [Další kroky](#další-kroky)

---

## Co budeme vytvářet

Systém chatových příkazů s:

- **`/heal`** -- Plně vyléčí postavu administrátora (zdraví, krev, šok, hlad, žízeň)
- **`/heal JménoHráče`** -- Vyléčí konkrétního hráče podle jména
- Znovupoužitelným frameworkem pro přidání `/kill`, `/teleport`, `/time`, `/weather` a jakéhokoli dalšího příkazu
- Ověřováním oprávnění administrátora, aby běžní hráči nemohli používat administrátorské příkazy
- Provedením na straně serveru se zpětnou vazbou do chatu

---

## Předpoklady

- Funkční struktura modu (nejprve dokončete [Kapitolu 8.1](01-first-mod.md))
- Pochopení [vzoru klient-server RPC](03-admin-panel.md) z Kapitoly 8.3

### Struktura modu pro tento tutoriál

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

## Přehled architektury

Chatové příkazy sledují tento tok:

```
KLIENT                                  SERVER
------                                  ------

1. Admin napíše "/heal" do chatu
2. Chat hook zachytí zprávu
   (zabrání odeslání jako normální chat)
3. Klient odešle příkaz přes RPC  ---->  4. Server přijme RPC
                                            Ověří oprávnění administrátora
                                            Vyhledá handler příkazu
                                            Provede příkaz
                                        5. Server odešle zpětnou vazbu  ---->  KLIENT
                                            (chatová zpráva RPC)
                                                                     6. Admin vidí
                                                                        zpětnou vazbu v chatu
```

**Proč zpracovávat příkazy na serveru?** Protože server má autoritu nad stavem hry. Pouze server může spolehlivě léčit hráče, měnit počasí, teleportovat postavy a upravovat stav světa. Role klienta je omezena na detekci příkazu a jeho přeposlání.

---

## Krok 1: Napojení na chatový vstup

Potřebujeme zachytit chatové zprávy před tím, než jsou odeslány jako běžný chat. DayZ pro tento účel poskytuje třídu `ChatInputMenu`.

### Přístup chat hooku

Budeme moddovat třídu `MissionGameplay` pro zachycení událostí chatového vstupu. Když hráč odešle chatovou zprávu začínající `/`, zachytíme ji, zabráníme odeslání jako normální chat a místo toho ji odešleme jako příkazové RPC na server.

### Vytvořte `Scripts/5_Mission/ChatCommands/CCmdChatHook.c`

```c
modded class MissionGameplay
{
    // -------------------------------------------------------
    // Zachycení chatových zpráv začínajících /
    // -------------------------------------------------------
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        // ChatMessageEventTypeID se spustí, když hráč odešle chatovou zprávu
        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                // Kontrola, zda začíná /
                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    // Toto je příkaz -- odeslat na server
                    SendChatCommand(message);
                }
            }
        }
    }

    // -------------------------------------------------------
    // Odeslání řetězce příkazu na server přes RPC
    // -------------------------------------------------------
    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    // -------------------------------------------------------
    // Příjem zpětné vazby příkazu ze serveru
    // -------------------------------------------------------
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

                // Zobrazení zpětné vazby jako systémové chatové zprávy
                GetGame().Chat(prefix + " " + message, "colorStatusChannel");

                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

### Jak funguje zachycení chatu

Metoda `OnEvent` na `MissionGameplay` se volá pro různé herní události. Když je `eventTypeId` roven `ChatMessageEventTypeID`, znamená to, že hráč právě odeslal chatovou zprávu. `Param3` obsahuje:

- `param1` -- Kanál (int): chatový kanál (globální, přímý atd.)
- `param2` -- Jméno odesílatele (string)
- `param3` -- Text zprávy (string)

Kontrolujeme, zda zpráva začíná `/`. Pokud ano, přepošleme celý řetězec na server přes RPC. Zpráva je stále odeslána i jako normální chat -- v produkčním modu byste ji potlačili (popsáno v poznámkách na konci).

---

## Krok 2: Parsování prefixu příkazu a argumentů

Na straně serveru potřebujeme rozdělit řetězec příkazu jako `/heal JménoHráče` na jeho části: název příkazu (`heal`) a argumenty (`["JménoHráče"]`).

### Vytvořte `Scripts/3_Game/ChatCommands/CCmdRPC.c`

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### Vytvořte `Scripts/3_Game/ChatCommands/CCmdBase.c`

```c
// -------------------------------------------------------
// Základní třída pro všechny chatové příkazy
// -------------------------------------------------------
class CCmdBase
{
    // Název příkazu bez prefixu / (např. "heal")
    string GetName()
    {
        return "";
    }

    // Krátký popis zobrazený v nápovědě nebo seznamu příkazů
    string GetDescription()
    {
        return "";
    }

    // Syntaxe použití zobrazená při nesprávném použití příkazu
    string GetUsage()
    {
        return "/" + GetName();
    }

    // Zda tento příkaz vyžaduje oprávnění administrátora
    bool RequiresAdmin()
    {
        return true;
    }

    // Provedení příkazu na serveru
    // Vrací true při úspěchu, false při selhání
    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    // -------------------------------------------------------
    // Pomocník: Odeslání zpětné vazby volajícímu příkazu
    // -------------------------------------------------------
    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        // Nalezení objektu hráče volajícího
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

    // -------------------------------------------------------
    // Pomocník: Nalezení hráče podle částečné shody jména
    // -------------------------------------------------------
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

### Vytvořte `Scripts/3_Game/ChatCommands/CCmdRegistry.c`

```c
// -------------------------------------------------------
// Registr obsahující všechny dostupné příkazy
// -------------------------------------------------------
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    // -------------------------------------------------------
    // Inicializace registru (zavolat jednou při spuštění)
    // -------------------------------------------------------
    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    // -------------------------------------------------------
    // Registrace instance příkazu
    // -------------------------------------------------------
    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        if (s_Commands.Contains(name))
        {
            Print("[ChatCommands] WARNING: Command '" + name + "' already registered, overwriting.");
        }

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    // -------------------------------------------------------
    // Vyhledání příkazu podle názvu
    // -------------------------------------------------------
    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    // -------------------------------------------------------
    // Získání všech registrovaných názvů příkazů
    // -------------------------------------------------------
    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    // -------------------------------------------------------
    // Parsování surového řetězce příkazu na název + argumenty
    // Příklad: "/heal JménoHráče" --> name="heal", args=["JménoHráče"]
    // -------------------------------------------------------
    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        // Odebrání úvodního /
        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        // Rozdělení podle mezer
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

### Vysvětlení logiky parsování

Pro vstup `/heal SomePlayer` metoda `ParseCommand` provede:

1. Odebere úvodní `/` a získá `"heal SomePlayer"`
2. Rozdělí podle mezer a získá `["heal", "SomePlayer"]`
3. Vezme první prvek jako název příkazu: `"heal"`
4. Odebere ho z pole, zbydou argumenty: `["SomePlayer"]`

Název příkazu se převede na malá písmena, takže `/Heal`, `/HEAL` a `/heal` všechny fungují.

---

## Krok 3: Ověření oprávnění administrátora

Ověření oprávnění administrátora zabraňuje běžným hráčům provádět administrátorské příkazy. DayZ nemá vestavěný systém oprávnění administrátora ve skriptech, takže kontrolujeme proti jednoduchému seznamu administrátorů.

### Kontrola administrátora v handleru serveru

Nejjednodušší přístup je kontrola Steam64 ID hráče proti seznamu známých ID administrátorů. V produkčním modu byste tento seznam načítali z konfiguračního souboru.

```c
// Jednoduchá kontrola administrátora -- v produkci načtěte z JSON konfiguračního souboru
static bool IsAdmin(PlayerIdentity identity)
{
    if (!identity)
        return false;

    // Kontrola plain ID hráče (Steam64 ID)
    string playerId = identity.GetPlainId();

    // Hardkódovaný seznam administrátorů -- v produkci nahraďte načítáním konfiguračního souboru
    ref array<string> adminIds = new array<string>;
    adminIds.Insert("76561198000000001");    // Nahraďte skutečnými Steam64 ID
    adminIds.Insert("76561198000000002");

    return (adminIds.Find(playerId) != -1);
}
```

### Kde najít Steam64 ID

- Otevřete svůj Steam profil v prohlížeči
- URL obsahuje vaše Steam64 ID: `https://steamcommunity.com/profiles/76561198XXXXXXXXX`
- Nebo použijte nástroj jako https://steamid.io pro vyhledání jakéhokoli hráče

### Oprávnění produkční úrovně

Ve skutečném modu byste:

1. Uložili ID administrátorů do JSON souboru (`$profile:ChatCommands/admins.json`)
2. Načetli soubor při startu serveru
3. Podporovali úrovně oprávnění (moderátor, administrátor, superadministrátor)
4. Použili framework jako systém `MyPermissions` z MyMod Core pro hierarchická oprávnění

---

## Krok 4: Provedení akce na straně serveru

Nyní vytvoříme skutečný příkaz `/heal` a handler serveru, který zpracovává příchozí příkazová RPC.

### Vytvořte `Scripts/4_World/ChatCommands/commands/CCmdHeal.c`

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    // -------------------------------------------------------
    // Provedení příkazu heal
    // /heal         --> vyléčí volajícího
    // /heal Name    --> vyléčí pojmenovaného hráče
    // -------------------------------------------------------
    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        // Určení cílového hráče
        if (args.Count() > 0)
        {
            // Vyléčení konkrétního hráče podle jména
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
            // Vyléčení sebe sama
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

        // Provedení léčení
        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        // Logování a odeslání zpětné vazby
        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    // -------------------------------------------------------
    // Aplikace plného léčení na hráče
    // -------------------------------------------------------
    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        // Obnovení zdraví na maximum
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // Obnovení krve na maximum
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));

        // Odstranění poškození šokem
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        // Nastavení hladu na plno (hodnota energie)
        // PlayerBase má systém statistik -- nastavení statistiky energie
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());

        // Nastavení žízně na plno (hodnota vody)
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        // Vyčištění všech zdrojů krvácení
        player.GetBleedingManagerServer().RemoveAllSources();

        Print("[ChatCommands] Healed player: " + player.GetIdentity().GetName());
    }
};
```

### Proč 4_World?

Příkaz heal odkazuje na `PlayerBase`, který je definován ve vrstvě `4_World`. Také používá metody statistik hráče (`GetStatEnergy`, `GetStatWater`, `GetBleedingManagerServer`), které jsou dostupné pouze na světových entitách. Příkaz **musí** žít ve `4_World` nebo výše.

Základní třída `CCmdBase` žije v `3_Game`, protože neodkazuje na žádné světové typy. Konkrétní třídy příkazů, které pracují se světovými entitami, žijí ve `4_World`.

---

## Krok 5: Odeslání zpětné vazby administrátorovi

Zpětná vazba je zpracována metodou `SendFeedback()` v `CCmdBase`. Sledujme kompletní cestu zpětné vazby:

### Server odesílá zpětnou vazbu

```c
// Uvnitř CCmdBase.SendFeedback()
Param2<string, string> data = new Param2<string, string>(prefix, message);
GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
```

Server odesílá RPC `COMMAND_FEEDBACK` konkrétnímu klientovi, který vydal příkaz. Data obsahují prefix (jako `"[Heal]"`) a text zprávy.

### Klient přijímá a zobrazuje zpětnou vazbu

Zpět v `CCmdChatHook.c` (Krok 1), handler `OnRPC` toto zachytí:

```c
if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
{
    // Deserializace zprávy
    Param2<string, string> data = new Param2<string, string>("", "");
    if (ctx.Read(data))
    {
        string prefix = data.param1;
        string message = data.param2;

        // Zobrazení v chatovém okně
        GetGame().Chat(prefix + " " + message, "colorStatusChannel");
    }
}
```

`GetGame().Chat()` zobrazí zprávu v chatovém okně hráče. Druhý parametr je barevný kanál:

| Kanál | Barva | Typické použití |
|-------|-------|-----------------|
| `"colorStatusChannel"` | Žlutá/oranžová | Systémové zprávy |
| `"colorAction"` | Bílá | Zpětná vazba akce |
| `"colorFriendly"` | Zelená | Pozitivní zpětná vazba |
| `"colorImportant"` | Červená | Varování/chyby |

---

## Krok 6: Registrace příkazů

Handler serveru přijímá příkazová RPC, vyhledá příkaz v registru a provede ho.

### Vytvořte `Scripts/4_World/ChatCommands/CCmdServerHandler.c`

```c
modded class MissionServer
{
    // -------------------------------------------------------
    // Registrace všech příkazů při startu serveru
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();

        // Registrace všech příkazů zde
        CCmdRegistry.Register(new CCmdHeal());

        // Přidání dalších příkazů:
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
        // CCmdRegistry.Register(new CCmdTime());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

// -------------------------------------------------------
// RPC handler na straně serveru pro příchozí příkazy
// -------------------------------------------------------
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        // Čtení řetězce příkazu
        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        // Parsování příkazu
        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        // Vyhledání příkazu
        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        // Ověření oprávnění administrátora
        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        // Provedení příkazu
        bool success = command.Execute(sender, args);

        if (success)
            Print("[ChatCommands] Command /" + commandName + " executed successfully by " + sender.GetName());
        else
            Print("[ChatCommands] Command /" + commandName + " failed for " + sender.GetName());
    }

    // -------------------------------------------------------
    // Ověření, zda je hráč administrátor
    // -------------------------------------------------------
    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ----------------------------------------------------------
        // DŮLEŽITÉ: Nahraďte tyto vašimi skutečnými Steam64 ID administrátorů
        // V produkci místo toho načtěte z JSON konfiguračního souboru
        // ----------------------------------------------------------
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    // -------------------------------------------------------
    // Odeslání zpětné vazby konkrétnímu hráči
    // -------------------------------------------------------
    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == target.GetId())
                {
                    Param2<string, string> data = new Param2<string, string>(prefix, message);
                    GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                    return;
                }
            }
        }
    }
};
```

### Vzor registrace

Příkazy se registrují v `MissionServer.OnInit()`:

```c
CCmdRegistry.Init();
CCmdRegistry.Register(new CCmdHeal());
```

Každé volání `Register()` vytvoří instanci třídy příkazu a uloží ji do mapy klíčované názvem příkazu. Když dorazí příkazové RPC, handler vyhledá název v registru a zavolá `Execute()` na odpovídajícím objektu příkazu.

Tento vzor usnadňuje přidávání nových příkazů -- vytvořte novou třídu rozšiřující `CCmdBase`, implementujte `Execute()` a přidejte jeden řádek `Register()`.

---

## Krok 7: Přidání do seznamu příkazů administrátorského panelu

Pokud máte administrátorský panel (z [Kapitoly 8.3](03-admin-panel.md)), můžete zobrazit seznam dostupných příkazů v UI.

### Vyžádání seznamu příkazů ze serveru

Přidejte nové RPC ID v `CCmdRPC.c`:

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST   = 79001;
    static const int COMMAND_FEEDBACK  = 79002;
    static const int COMMAND_LIST_REQ  = 79003;
    static const int COMMAND_LIST_RESP = 79004;
};
```

### Strana serveru: Odeslání seznamu příkazů

Přidejte tento handler do vašeho kódu na straně serveru:

```c
// V handleru serveru přidejte case pro COMMAND_LIST_REQ
if (rpc_type == CCmdRPC.COMMAND_LIST_REQ)
{
    HandleCommandListRequest(sender);
}

protected void HandleCommandListRequest(PlayerIdentity requestor)
{
    if (!requestor)
        return;

    // Sestavení formátovaného řetězce všech příkazů
    array<string> names = CCmdRegistry.GetCommandNames();
    string commandList = "Available Commands:\n";

    for (int i = 0; i < names.Count(); i++)
    {
        CCmdBase cmd = CCmdRegistry.GetCommand(names.Get(i));
        if (cmd)
        {
            commandList = commandList + cmd.GetUsage() + " - " + cmd.GetDescription() + "\n";
        }
    }

    // Odeslání zpět klientovi
    ref array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int j = 0; j < players.Count(); j++)
    {
        Man candidate = players.Get(j);
        if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
        {
            Param1<string> data = new Param1<string>(commandList);
            GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_LIST_RESP, data, true, requestor);
            return;
        }
    }
}
```

### Strana klienta: Zobrazení v panelu

Na klientu zachyťte odpověď a zobrazte ji v textovém widgetu:

```c
if (rpc_type == CCmdRPC.COMMAND_LIST_RESP)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        string commandList = data.param1;
        // Zobrazení v textovém widgetu administrátorského panelu
        // m_CommandListText.SetText(commandList);
        Print("[ChatCommands] Command list received:\n" + commandList);
    }
}
```

---

## Kompletní funkční kód: příkaz /heal

Zde je každý soubor potřebný pro kompletní funkční systém. Vytvořte tyto soubory a váš mod bude mít funkční příkaz `/heal`.

### Nastavení config.cpp

```cpp
class CfgPatches
{
    class ChatCommands_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
        };
    };
};

class CfgMods
{
    class ChatCommands
    {
        dir = "ChatCommands";
        name = "Chat Commands";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/5_Mission" };
            };
        };
    };
};
```

### 3_Game/ChatCommands/CCmdRPC.c

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### 3_Game/ChatCommands/CCmdBase.c

```c
class CCmdBase
{
    string GetName()
    {
        return "";
    }

    string GetDescription()
    {
        return "";
    }

    string GetUsage()
    {
        return "/" + GetName();
    }

    bool RequiresAdmin()
    {
        return true;
    }

    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

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

### 3_Game/ChatCommands/CCmdRegistry.c

```c
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

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

### 4_World/ChatCommands/commands/CCmdHeal.c

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

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

        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        player.GetBleedingManagerServer().RemoveAllSources();
    }
};
```

### 4_World/ChatCommands/CCmdServerHandler.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();
        CCmdRegistry.Register(new CCmdHeal());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        command.Execute(sender, args);
    }

    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // NAHRAĎTE TYTO VAŠIMI SKUTEČNÝMI STEAM64 ID ADMINISTRÁTORŮ
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == target.GetId())
            {
                Param2<string, string> data = new Param2<string, string>(prefix, message);
                GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                return;
            }
        }
    }
};
```

### 5_Mission/ChatCommands/CCmdChatHook.c

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
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

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
                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

---

## Přidávání dalších příkazů

Vzor registru činí přidávání nových příkazů přímočarým. Zde jsou příklady:

### Příkaz /kill

```c
class CCmdKill extends CCmdBase
{
    override string GetName()        { return "kill"; }
    override string GetDescription() { return "Kills a player"; }
    override string GetUsage()       { return "/kill [PlayerName]"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        Man targetMan = null;

        if (args.Count() > 0)
            targetMan = FindPlayerByName(args.Get(0));
        else
        {
            ref array<Man> players = new array<Man>;
            GetGame().GetPlayers(players);
            for (int i = 0; i < players.Count(); i++)
            {
                if (players.Get(i).GetIdentity() && players.Get(i).GetIdentity().GetId() == caller.GetId())
                {
                    targetMan = players.Get(i);
                    break;
                }
            }
        }

        if (!targetMan)
        {
            SendFeedback(caller, "[Kill]", "Player not found.");
            return false;
        }

        PlayerBase targetPlayer;
        if (Class.CastTo(targetPlayer, targetMan))
        {
            targetPlayer.SetHealth("GlobalHealth", "Health", 0);
            SendFeedback(caller, "[Kill]", "Killed " + targetMan.GetIdentity().GetName() + ".");
            return true;
        }

        return false;
    }
};
```

### Příkaz /time

```c
class CCmdTime extends CCmdBase
{
    override string GetName()        { return "time"; }
    override string GetDescription() { return "Sets the server time (0-23)"; }
    override string GetUsage()       { return "/time <hour>"; }

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
            SendFeedback(caller, "[Time]", "Hour must be between 0 and 23.");
            return false;
        }

        GetGame().GetWorld().SetDate(2024, 6, 15, hour, 0);
        SendFeedback(caller, "[Time]", "Server time set to " + hour.ToString() + ":00.");
        return true;
    }
};
```

### Registrace nových příkazů

Přidejte jeden řádek na příkaz v `MissionServer.OnInit()`:

```c
CCmdRegistry.Register(new CCmdHeal());
CCmdRegistry.Register(new CCmdKill());
CCmdRegistry.Register(new CCmdTime());
```

---

## Řešení problémů

### Příkaz není rozpoznán ("Unknown command")

- **Chybí registrace:** Ujistěte se, že `CCmdRegistry.Register(new CCmdVášPříkaz())` je voláno v `MissionServer.OnInit()`.
- **Překlep v GetName():** Řetězec vrácený `GetName()` musí odpovídat tomu, co hráč píše (bez `/`).
- **Nesoulad velkých písmen:** Registr převádí názvy na malá písmena. `/Heal`, `/HEAL` a `/heal` by měly všechny fungovat.

### Oprávnění zamítnuto pro administrátory

- **Špatné Steam64 ID:** Dvakrát zkontrolujte ID administrátorů v `IsCommandAdmin()`. Musí to být přesná Steam64 ID (17-místná čísla začínající `7656`).
- **GetPlainId() vs GetId():** `GetPlainId()` vrací Steam64 ID. `GetId()` vrací ID relace DayZ. Pro kontroly administrátora používejte `GetPlainId()`.

### Zpětná vazba se nezobrazuje v chatu

- **RPC nedorazí ke klientovi:** Přidejte příkazy `Print()` na serveru pro potvrzení, že RPC zpětné vazby je odesíláno.
- **Klient OnRPC to nezachytí:** Ověřte, že RPC ID odpovídá (`CCmdRPC.COMMAND_FEEDBACK`).
- **GetGame().Chat() nefunguje:** Tato funkce vyžaduje, aby hra byla ve stavu, kdy je chat dostupný. Na obrazovce načítání nemusí fungovat.

### /heal ve skutečnosti neléčí

- **Provádění pouze na serveru:** `SetHealth()` a změny statistik musí běžet na serveru. Ověřte, že `GetGame().IsServer()` je true, když se `Execute()` spouští.
- **Cast na PlayerBase selže:** Pokud `Class.CastTo(targetPlayer, targetMan)` vrátí false, cíl není platný PlayerBase. To se může stát s AI nebo nehráčskými entitami.
- **Gettery statistik vrací null:** `GetStatEnergy()` a `GetStatWater()` mohou vrátit null, pokud je hráč mrtvý nebo není plně inicializován. V produkčním kódu přidejte kontroly null.

### Příkaz se objeví v chatu jako běžná zpráva

- Hook `OnEvent` zachytí zprávu, ale nepotlačí ji z odeslání jako chat. Pro potlačení v produkčním modu byste potřebovali moddovat třídu `ChatInputMenu` pro filtrování zpráv s `/` před jejich odesláním:

```c
modded class ChatInputMenu
{
    override void OnChatInputSend()
    {
        string text = "";
        // Získání aktuálního textu z edit widgetu
        // Pokud začíná /, NEVOLEJTE super (který to pošle jako chat)
        // Místo toho zpracujte jako příkaz

        // Tento přístup se liší podle verze DayZ -- zkontrolujte vanilkové zdrojáky
        super.OnChatInputSend();
    }
};
```

Přesná implementace závisí na verzi DayZ a na tom, jak `ChatInputMenu` zpřístupňuje text. Přístup `OnEvent` v tomto tutoriálu je jednodušší a funguje pro vývoj, s kompromisem, že text příkazu se také objeví jako chatová zpráva.

---

## Další kroky

1. **Načtěte administrátory z konfiguračního souboru** -- Použijte `JsonFileLoader` pro načtení ID administrátorů z JSON souboru místo hardkódování.
2. **Přidejte příkaz /help** -- Vypište všechny dostupné příkazy s jejich popisy a použitím.
3. **Přidejte logování** -- Zapisujte použití příkazů do logovacího souboru pro auditní účely.
4. **Integrujte s frameworkem** -- MyMod Core poskytuje `MyPermissions` pro hierarchická oprávnění a `MyRPC` pro string-směrovaná RPC, která zabraňují kolizím celočíselných ID.
5. **Přidejte cooldowny** -- Zabraňte spamování příkazů sledováním času posledního provedení na hráče.
6. **Sestavte UI paletu příkazů** -- Vytvořte administrátorský panel, který zobrazí všechny příkazy s klikatelnými tlačítky (kombinace tohoto tutoriálu s [Kapitolou 8.3](03-admin-panel.md)).

---

## Doporučené postupy

- **Vždy ověřte oprávnění před provedením administrátorských příkazů.** Chybějící kontrola oprávnění znamená, že jakýkoli hráč může `/heal` nebo `/kill` kohokoli. Ověřte Steam64 ID volajícího (přes `GetPlainId()`) na serveru před zpracováním.
- **Odesílejte zpětnou vazbu administrátorovi i pro selhané příkazy.** Tichá selhání znemožňují ladění. Vždy odešlete chatovou zprávu vysvětlující, co se pokazilo ("Player not found", "Permission denied").
- **Používejte `GetPlainId()` pro kontroly administrátora, nikoli `GetId()`.** `GetId()` vrací ID specifické pro relaci DayZ, které se mění při každém opětovném připojení. `GetPlainId()` vrací trvalé Steam64 ID.
- **Ukládejte ID administrátorů v JSON konfiguračním souboru, nikoli v kódu.** Hardkódovaná ID vyžadují přestavbu PBO pro změnu. JSON soubor `$profile:` může být upraven administrátory serveru bez znalosti moddingu.
- **Převádějte názvy příkazů na malá písmena před porovnáváním.** Hráči mohou psát `/Heal`, `/HEAL` nebo `/heal`. Normalizace na malá písmena zabraňuje frustrujícím chybám "unknown command".

---

## Teorie vs praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| Chat hook přes `OnEvent` | Zachytit zprávu a zpracovat ji jako příkaz | Zpráva se stále zobrazí v chatu všem hráčům. Její potlačení vyžaduje moddování `ChatInputMenu`, což se liší podle verze DayZ. |
| `GetGame().Chat()` | Zobrazí zprávu v chatovém okně hráče | Funguje pouze tehdy, když je chatové UI aktivní. Na obrazovce načítání nebo v určitých stavech menu je zpráva tiše zahozena. |
| Vzor registru příkazů | Čistá architektura s jednou třídou na příkaz | Každý soubor třídy příkazu musí být ve správné skriptové vrstvě. `CCmdBase` v `3_Game`, konkrétní příkazy odkazující na `PlayerBase` ve `4_World`. Špatné umístění vrstvy způsobí "Undefined type" při načítání. |
| Vyhledávání hráče podle jména | `FindPlayerByName` porovnává částečná jména | Částečné porovnávání může cílit na špatného hráče na serveru s podobnými jmény. V produkci preferujte cílení pomocí Steam64 ID nebo přidejte krok potvrzení. |

---

## Co jste se naučili

V tomto tutoriálu jste se naučili:
- Jak se napojit na chatový vstup pomocí `MissionGameplay.OnEvent` s `ChatMessageEventTypeID`
- Jak parsovat prefixy příkazů a argumenty z textu chatu
- Jak ověřovat oprávnění administrátora na serveru pomocí Steam64 ID
- Jak odesílat zpětnou vazbu příkazů zpět hráči přes RPC a `GetGame().Chat()`
- Jak sestavit znovupoužitelný vzor registru příkazů pro přidávání nových příkazů

**Další:** [Kapitola 8.6: Ladění a testování vašeho modu](06-debugging-testing.md)

---

**Předchozí:** [Kapitola 8.3: Tvorba modulu administrátorského panelu](03-admin-panel.md)
