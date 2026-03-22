# 8.4. fejezet: Chat parancsok hozzáadása

[Főoldal](../README.md) | [<< Előző: Admin panel építése](03-admin-panel.md) | **Chat parancsok hozzáadása** | [Következő: A DayZ mod sablon használata >>](05-mod-template.md)

---

## Tartalomjegyzék

- [Mit építünk](#mit-építünk)
- [Előfeltételek](#előfeltételek)
- [Architektúra áttekintés](#architektúra-áttekintés)
- [1. lépés: Chat input elfogása](#1-lépés-chat-input-elfogása)
- [2. lépés: Parancs előtag és argumentumok elemzése](#2-lépés-parancs-előtag-és-argumentumok-elemzése)
- [3. lépés: Admin jogosultságok ellenőrzése](#3-lépés-admin-jogosultságok-ellenőrzése)
- [4. lépés: Szerver oldali művelet végrehajtása](#4-lépés-szerver-oldali-művelet-végrehajtása)
- [5. lépés: Visszajelzés küldése az adminnak](#5-lépés-visszajelzés-küldése-az-adminnak)
- [6. lépés: Parancsok regisztrálása](#6-lépés-parancsok-regisztrálása)
- [7. lépés: Hozzáadás az admin panel parancslistához](#7-lépés-hozzáadás-az-admin-panel-parancslistához)
- [Teljes működő kód: /heal parancs](#teljes-működő-kód-heal-parancs)
- [További parancsok hozzáadása](#további-parancsok-hozzáadása)
- [Hibaelhárítás](#hibaelhárítás)
- [Következő lépések](#következő-lépések)

---

## Mit építünk

Egy chat parancs rendszert a következőkkel:

- **`/heal`** -- Teljesen meggyógyítja az admin karakterét (életerő, vér, sokk, éhség, szomjúság)
- **`/heal PlayerName`** -- Meggyógyít egy adott játékost név alapján
- Újrafelhasználható keretrendszer `/kill`, `/teleport`, `/time`, `/weather` és bármilyen más parancs hozzáadásához
- Admin jogosultság ellenőrzés, hogy a hétköznapi játékosok ne használhassák az admin parancsokat
- Szerver oldali végrehajtás chat visszajelzés üzenetekkel

---

## Előfeltételek

- Működő mod struktúra (először végezd el a [8.1. fejezetet](01-first-mod.md))
- A [kliens-szerver RPC minta](03-admin-panel.md) megértése a 8.3. fejezetből

### Mod struktúra ehhez a bemutatóhoz

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

## Architektúra áttekintés

A chat parancsok a következő folyamatot követik:

```
KLIENS                                  SZERVER
------                                  ------

1. Az admin beírja a "/heal" szöveget a chatbe
2. A chat hook elfogja az üzenetet
   (megakadályozza, hogy chatként küldődjön)
3. A kliens elküldi a parancsot RPC-n  ---->  4. A szerver fogadja az RPC-t
   keresztül                                      Ellenőrzi az admin jogosultságokat
                                                  Kikeresi a parancs kezelőt
                                                  Végrehajtja a parancsot
                                              5. A szerver visszajelzést küld  ---->  KLIENS
                                                  (chat üzenet RPC)
                                                                                  6. Az admin látja
                                                                                     a visszajelzést
                                                                                     a chatben
```

**Miért dolgozzuk fel a parancsokat a szerveren?** Mert a szerver rendelkezik az autoritással a játékállapot felett. Csak a szerver tudja megbízhatóan meggyógyítani a játékosokat, megváltoztatni az időjárást, teleportálni a karaktereket és módosítani a világ állapotát. A kliens szerepe a parancs észlelésére és továbbítására korlátozódik.

---

## 1. lépés: Chat input elfogása

El kell fognunk a chat üzeneteket, mielőtt normál chatként elküldésre kerülnének. A DayZ biztosítja a `ChatInputMenu` osztályt erre a célra.

### A chat hook megközelítés

A `MissionGameplay` osztályt módosítjuk a chat input események elfogásához. Amikor a játékos `/` karakterrel kezdődő chat üzenetet küld, elfogajuk, megakadályozzuk a normál chatként való küldést, és helyette parancs RPC-ként küldjük a szervernek.

### Hozd létre a `Scripts/5_Mission/ChatCommands/CCmdChatHook.c` fájlt

```c
modded class MissionGameplay
{
    // -------------------------------------------------------
    // / karakterrel kezdődő chat üzenetek elfogása
    // -------------------------------------------------------
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        // A ChatMessageEventTypeID akkor aktiválódik, amikor a játékos chat üzenetet küld
        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                // Ellenőrizd, hogy / karakterrel kezdődik-e
                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    // Ez egy parancs -- küldd el a szervernek
                    SendChatCommand(message);
                }
            }
        }
    }

    // -------------------------------------------------------
    // A parancs sztring küldése a szervernek RPC-n keresztül
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
    // Parancs visszajelzés fogadása a szervertől
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

                // Visszajelzés megjelenítése rendszer chat üzenetként
                GetGame().Chat(prefix + " " + message, "colorStatusChannel");

                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

### Hogyan működik a chat elfogás

Az `OnEvent` metódus a `MissionGameplay` osztályon különböző játék eseményeknél hívódik meg. Amikor az `eventTypeId` értéke `ChatMessageEventTypeID`, az azt jelenti, hogy a játékos éppen chat üzenetet küldött. A `Param3` tartalmazza:

- `param1` -- Csatorna (int): a chat csatorna (globális, közvetlen, stb.)
- `param2` -- Küldő neve (string)
- `param3` -- Üzenet szövege (string)

Ellenőrizzük, hogy az üzenet `/` karakterrel kezdődik-e. Ha igen, az egész sztringet továbbítjuk a szervernek RPC-n keresztül. Az üzenet normál chatként is elküldésre kerül -- egy éles modban ezt elnyomnád (a megjegyzésekben a végén tárgyalva).

---

## 2. lépés: Parancs előtag és argumentumok elemzése

A szerver oldalon szét kell bontanunk egy parancs sztringet, mint a `/heal PlayerName`, a részeire: a parancs neve (`heal`) és az argumentumok (`["PlayerName"]`).

### Hozd létre a `Scripts/3_Game/ChatCommands/CCmdRPC.c` fájlt

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### Hozd létre a `Scripts/3_Game/ChatCommands/CCmdBase.c` fájlt

```c
// -------------------------------------------------------
// Alaposztály az összes chat parancshoz
// -------------------------------------------------------
class CCmdBase
{
    // A parancs neve a / előtag nélkül (pl. "heal")
    string GetName()
    {
        return "";
    }

    // Rövid leírás, ami a súgóban vagy parancslistában jelenik meg
    string GetDescription()
    {
        return "";
    }

    // Használati szintaxis, ami helytelen használatkor jelenik meg
    string GetUsage()
    {
        return "/" + GetName();
    }

    // Szükséges-e admin jogosultság ehhez a parancshoz
    bool RequiresAdmin()
    {
        return true;
    }

    // A parancs végrehajtása a szerveren
    // True-t ad vissza sikeres, false-t sikertelen esetben
    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    // -------------------------------------------------------
    // Segéd: visszajelzés üzenet küldése a parancs hívójának
    // -------------------------------------------------------
    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        // A hívó játékos objektumának megkeresése
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
    // Segéd: játékos keresése részleges név egyezés alapján
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

### Hozd létre a `Scripts/3_Game/ChatCommands/CCmdRegistry.c` fájlt

```c
// -------------------------------------------------------
// Nyilvántartás, amely tartalmazza az összes elérhető parancsot
// -------------------------------------------------------
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    // -------------------------------------------------------
    // A nyilvántartás inicializálása (egyszer hívd meg induláskor)
    // -------------------------------------------------------
    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    // -------------------------------------------------------
    // Parancs példány regisztrálása
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
    // Parancs kikeresése név alapján
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
    // Az összes regisztrált parancsnév lekérése
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
    // Nyers parancs sztring elemzése névre + argumentumokra
    // Példa: "/heal PlayerName" --> name="heal", args=["PlayerName"]
    // -------------------------------------------------------
    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        // A bevezető / eltávolítása
        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        // Szóközök mentén felosztás
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

### Az elemzési logika magyarázata

Adott a `/heal SomePlayer` bemenet, a `ParseCommand` a következőket teszi:

1. Eltávolítja a bevezető `/` jelet, hogy `"heal SomePlayer"` legyen
2. Szóközök mentén felosztja: `["heal", "SomePlayer"]`
3. Az első elemet veszi parancs névként: `"heal"`
4. Eltávolítja a tömbből, maradnak az argumentumok: `["SomePlayer"]`

A parancs neve kisbetűsre konvertálódik, így a `/Heal`, `/HEAL` és `/heal` mind működik.

---

## 3. lépés: Admin jogosultságok ellenőrzése

Az admin jogosultság ellenőrzés megakadályozza, hogy a hétköznapi játékosok admin parancsokat hajtsanak végre. A DayZ nem rendelkezik beépített admin jogosultsági rendszerrel a szkriptekben, ezért egy egyszerű admin lista alapján ellenőrzünk.

### Az admin ellenőrzés a szerver kezelőben

A legegyszerűbb megközelítés a játékos Steam64 ID-jának ellenőrzése az ismert admin ID-k listájával szemben. Éles modban ezt a listát konfigurációs fájlból töltenéd be.

```c
// Egyszerű admin ellenőrzés -- éles használatban JSON konfigurációs fájlból töltsd be
static bool IsAdmin(PlayerIdentity identity)
{
    if (!identity)
        return false;

    // A játékos sima ID-jának ellenőrzése (Steam64 ID)
    string playerId = identity.GetPlainId();

    // Hardkódolt admin lista -- éles használatban cseréld konfigurációs fájl betöltésre
    ref array<string> adminIds = new array<string>;
    adminIds.Insert("76561198000000001");    // Cseréld valódi Steam64 ID-kra
    adminIds.Insert("76561198000000002");

    return (adminIds.Find(playerId) != -1);
}
```

### Hol találod a Steam64 ID-kat

- Nyisd meg a Steam profilodat böngészőben
- Az URL tartalmazza a Steam64 ID-dat: `https://steamcommunity.com/profiles/76561198XXXXXXXXX`
- Vagy használj egy eszközt, mint a https://steamid.io bármely játékos kikeresésére

### Éles szintű jogosultságok

Valódi modban a következőket tennéd:

1. Admin ID-kat tárolnál JSON fájlban (`$profile:ChatCommands/admins.json`)
2. Betöltenéd a fájlt a szerver indításakor
3. Jogosultsági szinteket támogatnál (moderátor, admin, szuperadmin)
4. Keretrendszert használnál, mint a MyFramework `MyPermissions` rendszere hierarchikus jogosultságokhoz

---

## 4. lépés: Szerver oldali művelet végrehajtása

Most létrehozzuk a tényleges `/heal` parancsot és a szerver kezelőt, amely feldolgozza a bejövő parancs RPC-ket.

### Hozd létre a `Scripts/4_World/ChatCommands/commands/CCmdHeal.c` fájlt

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
    // A heal parancs végrehajtása
    // /heal         --> meggyógyítja a hívót
    // /heal Name    --> meggyógyítja a megnevezett játékost
    // -------------------------------------------------------
    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        // A céljátékos meghatározása
        if (args.Count() > 0)
        {
            // Adott játékos gyógyítása név alapján
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
            // A hívó saját magát gyógyítja
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

        // A gyógyítás végrehajtása
        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        // Naplózás és visszajelzés küldése
        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    // -------------------------------------------------------
    // Teljes gyógyítás alkalmazása egy játékosra
    // -------------------------------------------------------
    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        // Életerő visszaállítása maximumra
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // Vérmennyiség visszaállítása maximumra
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));

        // Sokk sérülés eltávolítása
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        // Éhség feltöltése (energia érték)
        // A PlayerBase stat rendszerrel rendelkezik -- az energia stat beállítása
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());

        // Szomjúság feltöltése (víz érték)
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        // Minden vérzésforrás eltávolítása
        player.GetBleedingManagerServer().RemoveAllSources();

        Print("[ChatCommands] Healed player: " + player.GetIdentity().GetName());
    }
};
```

### Miért a 4_World?

A heal parancs hivatkozik a `PlayerBase`-re, amely a `4_World` rétegben van definiálva. Szintén használja a játékos stat metódusokat (`GetStatEnergy`, `GetStatWater`, `GetBleedingManagerServer`), amelyek csak világ entitásokon érhetők el. A parancsnak **a `4_World`-ben vagy magasabb rétegben kell lennie**.

Az alaposztály `CCmdBase` a `3_Game`-ben van, mert nem hivatkozik világ típusokra. A konkrét parancs osztályok, amelyek világ entitásokat érintenek, a `4_World`-ben vannak.

---

## 5. lépés: Visszajelzés küldése az adminnak

A visszajelzést a `CCmdBase` `SendFeedback()` metódusa kezeli. Kövessük nyomon a teljes visszajelzési útvonalat:

### A szerver visszajelzést küld

```c
// A CCmdBase.SendFeedback() belsejében
Param2<string, string> data = new Param2<string, string>(prefix, message);
GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
```

A szerver `COMMAND_FEEDBACK` RPC-t küld annak az adott kliensnek, aki kiadta a parancsot. Az adat egy előtagot (mint `"[Heal]"`) és az üzenet szöveget tartalmazza.

### A kliens fogadja és megjeleníti a visszajelzést

Visszatérve a `CCmdChatHook.c` fájlba (1. lépés), az `OnRPC` kezelő elkapja ezt:

```c
if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
{
    // Az üzenet deszerializálása
    Param2<string, string> data = new Param2<string, string>("", "");
    if (ctx.Read(data))
    {
        string prefix = data.param1;
        string message = data.param2;

        // Megjelenítés a chat ablakban
        GetGame().Chat(prefix + " " + message, "colorStatusChannel");
    }
}
```

A `GetGame().Chat()` egy üzenetet jelenít meg a játékos chat ablakában. A második paraméter a szín csatorna:

| Csatorna | Szín | Tipikus használat |
|---------|-------|-------------|
| `"colorStatusChannel"` | Sárga/narancs | Rendszer üzenetek |
| `"colorAction"` | Fehér | Akció visszajelzés |
| `"colorFriendly"` | Zöld | Pozitív visszajelzés |
| `"colorImportant"` | Piros | Figyelmeztetések/hibák |

---

## 6. lépés: Parancsok regisztrálása

A szerver kezelő fogadja a parancs RPC-ket, kikeresi a parancsot a nyilvántartásban és végrehajtja.

### Hozd létre a `Scripts/4_World/ChatCommands/CCmdServerHandler.c` fájlt

```c
modded class MissionServer
{
    // -------------------------------------------------------
    // Összes parancs regisztrálása a szerver indításakor
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();

        // Minden parancs regisztrálása itt
        CCmdRegistry.Register(new CCmdHeal());

        // További parancsok hozzáadása:
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
        // CCmdRegistry.Register(new CCmdTime());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

// -------------------------------------------------------
// Szerver oldali RPC kezelő bejövő parancsokhoz
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

        // A parancs sztring olvasása
        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        // A parancs elemzése
        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        // A parancs kikeresése
        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        // Admin jogosultságok ellenőrzése
        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        // A parancs végrehajtása
        bool success = command.Execute(sender, args);

        if (success)
            Print("[ChatCommands] Command /" + commandName + " executed successfully by " + sender.GetName());
        else
            Print("[ChatCommands] Command /" + commandName + " failed for " + sender.GetName());
    }

    // -------------------------------------------------------
    // Ellenőrzés, hogy egy játékos admin-e
    // -------------------------------------------------------
    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ----------------------------------------------------------
        // FONTOS: Cseréld le ezeket a valódi admin Steam64 ID-idra
        // Éles használatban JSON konfigurációs fájlból töltsd be helyette
        // ----------------------------------------------------------
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    // -------------------------------------------------------
    // Visszajelzés küldése egy adott játékosnak
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

### A regisztrációs minta

A parancsok a `MissionServer.OnInit()` metódusban vannak regisztrálva:

```c
CCmdRegistry.Init();
CCmdRegistry.Register(new CCmdHeal());
```

Minden `Register()` hívás létrehoz egy példányt a parancs osztályból és eltárolja egy map-ben, a parancs neve alapján kulcsolva. Amikor parancs RPC érkezik, a kezelő kikeresi a nevet a nyilvántartásban és meghívja az `Execute()` metódust a megfelelő parancs objektumon.

Ez a minta triviálissá teszi új parancsok hozzáadását -- hozz létre egy új osztályt, amely kiterjeszti a `CCmdBase`-t, implementáld az `Execute()` metódust, és adj hozzá egy `Register()` sort.

---

## 7. lépés: Hozzáadás az admin panel parancslistához

Ha van admin paneled (a [8.3. fejezetből](03-admin-panel.md)), megjelenítheted az elérhető parancsok listáját az UI-ban.

### A parancslista kérése a szervertől

Adj hozzá egy új RPC ID-t a `CCmdRPC.c` fájlba:

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST   = 79001;
    static const int COMMAND_FEEDBACK  = 79002;
    static const int COMMAND_LIST_REQ  = 79003;
    static const int COMMAND_LIST_RESP = 79004;
};
```

### Szerver oldal: a parancslista küldése

Add hozzá ezt a kezelőt a szerver oldali kódodba:

```c
// A szerver kezelőben adj hozzá egy esetet a COMMAND_LIST_REQ-hez
if (rpc_type == CCmdRPC.COMMAND_LIST_REQ)
{
    HandleCommandListRequest(sender);
}

protected void HandleCommandListRequest(PlayerIdentity requestor)
{
    if (!requestor)
        return;

    // Az összes parancs formázott sztringjének összeállítása
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

    // Visszaküldés a kliensnek
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

### Kliens oldal: megjelenítés egy panelen

A kliensen fogd el a választ és jelenítsd meg egy szöveg widgetben:

```c
if (rpc_type == CCmdRPC.COMMAND_LIST_RESP)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        string commandList = data.param1;
        // Megjelenítés az admin panel szöveg widgetjében
        // m_CommandListText.SetText(commandList);
        Print("[ChatCommands] Command list received:\n" + commandList);
    }
}
```

---

## Teljes működő kód: /heal parancs

Itt van minden szükséges fájl a teljes működő rendszerhez. Hozd létre ezeket a fájlokat és a modod rendelkezni fog egy működő `/heal` paranccsal.

### config.cpp beállítás

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

        // CSERÉLD LE EZEKET A VALÓDI ADMIN STEAM64 ID-IDRA
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

## További parancsok hozzáadása

A nyilvántartási minta egyszerűvé teszi új parancsok hozzáadását. Íme néhány példa:

### /kill parancs

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

### /time parancs

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

### Új parancsok regisztrálása

Adj hozzá egy sort parancsonként a `MissionServer.OnInit()` metódusba:

```c
CCmdRegistry.Register(new CCmdHeal());
CCmdRegistry.Register(new CCmdKill());
CCmdRegistry.Register(new CCmdTime());
```

---

## Hibaelhárítás

### A parancs nem ismert ("Unknown command")

- **Regisztráció hiányzik:** Győződj meg róla, hogy a `CCmdRegistry.Register(new CCmdYourCommand())` meghívásra kerül a `MissionServer.OnInit()` metódusban.
- **GetName() elgépelés:** A `GetName()` által visszaadott sztringnek egyeznie kell azzal, amit a játékos beír (a `/` nélkül).
- **Kis/nagybetű eltérés:** A nyilvántartás kisbetűsre konvertálja a neveket. A `/Heal`, `/HEAL` és `/heal` mind működniük kell.

### Jogosultság megtagadva az adminoknak

- **Rossz Steam64 ID:** Ellenőrizd kétszer az admin ID-kat az `IsCommandAdmin()` metódusban. Pontos Steam64 ID-knak kell lenniük (17 jegyű számok, amelyek `7656`-tal kezdődnek).
- **GetPlainId() vs GetId():** A `GetPlainId()` a Steam64 ID-t adja vissza. A `GetId()` a DayZ session ID-t adja vissza. Használd a `GetPlainId()` metódust az admin ellenőrzésekhez.

### A visszajelzés üzenet nem jelenik meg a chatben

- **RPC nem éri el a klienst:** Adj hozzá `Print()` utasításokat a szerveren, hogy megerősítsd a visszajelzés RPC elküldését.
- **A kliens OnRPC nem kapja el:** Ellenőrizd, hogy az RPC ID egyezik-e (`CCmdRPC.COMMAND_FEEDBACK`).
- **A GetGame().Chat() nem működik:** Ez a funkció megköveteli, hogy a játék olyan állapotban legyen, ahol a chat elérhető. Lehet, hogy nem működik a betöltő képernyőn.

### A /heal valójában nem gyógyít

- **Csak szerver oldali végrehajtás:** A `SetHealth()` és stat változásoknak a szerveren kell futniuk. Ellenőrizd, hogy `GetGame().IsServer()` igaz-e az `Execute()` futásakor.
- **PlayerBase cast sikertelen:** Ha a `Class.CastTo(targetPlayer, targetMan)` false-t ad vissza, a cél nem érvényes PlayerBase. Ez előfordulhat AI-val vagy nem-játékos entitásokkal.
- **A stat lekérők null-t adnak vissza:** A `GetStatEnergy()` és `GetStatWater()` null-t adhatnak vissza, ha a játékos halott vagy nincs teljesen inicializálva. Adj hozzá null ellenőrzéseket az éles kódban.

### A parancs normál üzenetként jelenik meg a chatben

- Az `OnEvent` hook elfogja az üzenetet, de nem nyomja el a chatként való küldést. Éles modban módosítanod kellene a `ChatInputMenu` osztályt a `/` üzenetek szűréséhez, mielőtt elküldésre kerülnének:

```c
modded class ChatInputMenu
{
    override void OnChatInputSend()
    {
        string text = "";
        // Az aktuális szöveg lekérése a szerkesztő widgetből
        // Ha / karakterrel kezdődik, NE hívd meg a super-t (ami chatként küldi)
        // Ehelyett kezeld parancsként

        // Ez a megközelítés a DayZ verziótól függ -- ellenőrizd a vanilla forrásokat
        super.OnChatInputSend();
    }
};
```

A pontos implementáció a DayZ verziójától és attól függ, hogyan teszi elérhetővé a `ChatInputMenu` a szöveget. A bemutatóban használt `OnEvent` megközelítés egyszerűbb és működik fejlesztéshez, azzal a kompromisszummal, hogy a parancs szöveg chat üzenetként is megjelenik.

---

## Következő lépések

1. **Adminok betöltése konfigurációs fájlból** -- Használd a `JsonFileLoader`-t admin ID-k betöltésére JSON fájlból a hardkódolás helyett.
2. **Adj hozzá /help parancsot** -- Listázd az összes elérhető parancsot leírásaikkal és használatukkal.
3. **Adj hozzá naplózást** -- Írd ki a parancshasználatot naplófájlba audit célokra.
4. **Integrálj keretrendszerrel** -- A MyFramework biztosít `MyPermissions`-t hierarchikus jogosultságokhoz és `MyRPC`-t sztring-útválasztott RPC-khez, amelyek elkerülik az egész szám ID ütközéseket.
5. **Adj hozzá lehűlési időt** -- Akadályozd meg a parancs spammelést a játékosonkénti utolsó végrehajtási idő nyomon követésével.
6. **Építs parancs paletta UI-t** -- Hozz létre admin panelt, amely felsorolja az összes parancsot kattintható gombokkal (ennek a bemutatónak a kombinálása a [8.3. fejezettel](03-admin-panel.md)).

---

**Előző:** [8.3. fejezet: Admin panel modul építése](03-admin-panel.md)
