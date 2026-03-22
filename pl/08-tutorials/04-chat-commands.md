# Rozdział 8.4: Dodawanie komend czatu

[Strona główna](../README.md) | [<< Poprzedni: Budowanie panelu administratora](03-admin-panel.md) | **Dodawanie komend czatu** | [Dalej: Używanie szablonu moda DayZ >>](05-mod-template.md)

---

> **Podsumowanie:** Ten samouczek przeprowadzi cię przez tworzenie systemu komend czatu dla DayZ. Podepniesz się do wejścia czatu, napiszesz parsowanie prefiksów i argumentów komend, dodasz sprawdzanie uprawnień administratora, wykonasz akcję po stronie serwera i wyślesz informację zwrotną do gracza. Pod koniec będziesz mieć działającą komendę `/heal`, która w pełni leczy postać administratora, wraz z frameworkiem do dodawania kolejnych komend.

---

## Spis treści

- [Co budujemy](#co-budujemy)
- [Wymagania wstępne](#wymagania-wstępne)
- [Przegląd architektury](#przegląd-architektury)
- [Krok 1: Podpięcie do wejścia czatu](#krok-1-podpięcie-do-wejścia-czatu)
- [Krok 2: Parsowanie prefiksu i argumentów komendy](#krok-2-parsowanie-prefiksu-i-argumentów-komendy)
- [Krok 3: Sprawdzanie uprawnień administratora](#krok-3-sprawdzanie-uprawnień-administratora)
- [Krok 4: Wykonanie akcji po stronie serwera](#krok-4-wykonanie-akcji-po-stronie-serwera)
- [Krok 5: Wysyłanie informacji zwrotnej do administratora](#krok-5-wysyłanie-informacji-zwrotnej-do-administratora)
- [Krok 6: Rejestracja komend](#krok-6-rejestracja-komend)
- [Krok 7: Dodanie do listy komend panelu administratora](#krok-7-dodanie-do-listy-komend-panelu-administratora)
- [Kompletny działający kod: komenda /heal](#kompletny-działający-kod-komenda-heal)
- [Dodawanie kolejnych komend](#dodawanie-kolejnych-komend)
- [Rozwiązywanie problemów](#rozwiązywanie-problemów)
- [Następne kroki](#następne-kroki)

---

## Co budujemy

System komend czatu z:

- **`/heal`** -- Całkowicie leczy postać administratora (zdrowie, krew, szok, głód, pragnienie)
- **`/heal PlayerName`** -- Leczy konkretnego gracza po nazwie
- Wielokrotnym frameworkiem do dodawania `/kill`, `/teleport`, `/time`, `/weather` i dowolnych innych komend
- Sprawdzaniem uprawnień administratora, aby zwykli gracze nie mogli używać komend administracyjnych
- Wykonywaniem po stronie serwera z wiadomościami zwrotnymi na czacie

---

## Wymagania wstępne

- Działająca struktura moda (ukończ najpierw [Rozdział 8.1](01-first-mod.md))
- Zrozumienie [wzorca RPC klient-serwer](03-admin-panel.md) z Rozdziału 8.3

### Struktura moda dla tego samouczka

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

## Przegląd architektury

Komendy czatu podążają za następującym przepływem:

```
KLIENT                                  SERWER
------                                  ------

1. Administrator wpisuje "/heal" na czacie
2. Hook czatu przechwytuje wiadomość
   (zapobiega wysłaniu jako zwykły czat)
3. Klient wysyła komendę przez RPC  ---->  4. Serwer odbiera RPC
                                               Sprawdza uprawnienia administratora
                                               Wyszukuje handler komendy
                                               Wykonuje komendę
                                           5. Serwer wysyła informację zwrotną  ---->  KLIENT
                                               (RPC wiadomości czatu)
                                                                                    6. Administrator
                                                                                       widzi informację
                                                                                       zwrotną na czacie
```

**Dlaczego komendy przetwarzamy na serwerze?** Ponieważ serwer ma autorytet nad stanem gry. Tylko serwer może niezawodnie leczyć graczy, zmieniać pogodę, teleportować postacie i modyfikować stan świata. Rola klienta ogranicza się do wykrywania komendy i przekazywania jej dalej.

---

## Krok 1: Podpięcie do wejścia czatu

Musimy przechwytywać wiadomości czatu zanim zostaną wysłane jako zwykły czat. DayZ udostępnia klasę `ChatInputMenu` do tego celu.

### Podejście z hookiem czatu

Zmodyfikujemy klasę `MissionGameplay`, aby przechwytywać zdarzenia wejścia czatu. Gdy gracz wysyła wiadomość czatu zaczynającą się od `/`, przechwytujemy ją, zapobiegamy wysłaniu jako zwykły czat i zamiast tego wysyłamy ją jako RPC komendy do serwera.

### Utwórz `Scripts/5_Mission/ChatCommands/CCmdChatHook.c`

```c
modded class MissionGameplay
{
    // -------------------------------------------------------
    // Przechwytywanie wiadomości czatu zaczynających się od /
    // -------------------------------------------------------
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        // ChatMessageEventTypeID jest wywoływany, gdy gracz wysyła wiadomość czatu
        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                // Sprawdź, czy zaczyna się od /
                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    // To jest komenda -- wyślij ją do serwera
                    SendChatCommand(message);
                }
            }
        }
    }

    // -------------------------------------------------------
    // Wyślij ciąg komendy do serwera przez RPC
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
    // Odbieranie informacji zwrotnej o komendzie z serwera
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

                // Wyświetl informację zwrotną jako systemową wiadomość czatu
                GetGame().Chat(prefix + " " + message, "colorStatusChannel");

                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

### Jak działa przechwytywanie czatu

Metoda `OnEvent` w `MissionGameplay` jest wywoływana dla różnych zdarzeń gry. Gdy `eventTypeId` to `ChatMessageEventTypeID`, oznacza to, że gracz właśnie wysłał wiadomość czatu. `Param3` zawiera:

- `param1` -- Kanał (int): kanał czatu (globalny, bezpośredni itp.)
- `param2` -- Nazwa nadawcy (string)
- `param3` -- Treść wiadomości (string)

Sprawdzamy, czy wiadomość zaczyna się od `/`. Jeśli tak, przekazujemy cały ciąg do serwera przez RPC. Wiadomość jest nadal wysyłana jako zwykły czat -- w produkcyjnym modzie należałoby ją wytłumić (omówione w uwagach na końcu).

---

## Krok 2: Parsowanie prefiksu i argumentów komendy

Po stronie serwera musimy rozbić ciąg komendy jak `/heal PlayerName` na jego części: nazwę komendy (`heal`) i argumenty (`["PlayerName"]`).

### Utwórz `Scripts/3_Game/ChatCommands/CCmdRPC.c`

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### Utwórz `Scripts/3_Game/ChatCommands/CCmdBase.c`

```c
// -------------------------------------------------------
// Klasa bazowa dla wszystkich komend czatu
// -------------------------------------------------------
class CCmdBase
{
    // Nazwa komendy bez prefiksu / (np. "heal")
    string GetName()
    {
        return "";
    }

    // Krótki opis wyświetlany w pomocy lub liście komend
    string GetDescription()
    {
        return "";
    }

    // Składnia użycia wyświetlana przy nieprawidłowym użyciu komendy
    string GetUsage()
    {
        return "/" + GetName();
    }

    // Czy ta komenda wymaga uprawnień administratora
    bool RequiresAdmin()
    {
        return true;
    }

    // Wykonaj komendę na serwerze
    // Zwraca true jeśli sukces, false jeśli niepowodzenie
    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    // -------------------------------------------------------
    // Helper: Wyślij wiadomość zwrotną do wywołującego komendę
    // -------------------------------------------------------
    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        // Znajdź obiekt gracza wywołującego
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
    // Helper: Znajdź gracza po częściowym dopasowaniu nazwy
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

### Utwórz `Scripts/3_Game/ChatCommands/CCmdRegistry.c`

```c
// -------------------------------------------------------
// Rejestr przechowujący wszystkie dostępne komendy
// -------------------------------------------------------
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    // -------------------------------------------------------
    // Inicjalizacja rejestru (wywołaj raz przy starcie)
    // -------------------------------------------------------
    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    // -------------------------------------------------------
    // Zarejestruj instancję komendy
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
    // Wyszukaj komendę po nazwie
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
    // Pobierz nazwy wszystkich zarejestrowanych komend
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
    // Parsuj surowy ciąg komendy na nazwę + argumenty
    // Przykład: "/heal PlayerName" --> name="heal", args=["PlayerName"]
    // -------------------------------------------------------
    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        // Usuń początkowy /
        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        // Podziel po spacjach
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

### Wyjaśnienie logiki parsowania

Dla wejścia `/heal SomePlayer`, `ParseCommand` wykonuje:

1. Usuwa początkowy `/`, otrzymując `"heal SomePlayer"`
2. Dzieli po spacjach, otrzymując `["heal", "SomePlayer"]`
3. Bierze pierwszy element jako nazwę komendy: `"heal"`
4. Usuwa go z tablicy, pozostawiając argumenty: `["SomePlayer"]`

Nazwa komendy jest konwertowana na małe litery, więc `/Heal`, `/HEAL` i `/heal` wszystkie działają.

---

## Krok 3: Sprawdzanie uprawnień administratora

Sprawdzanie uprawnień administratora zapobiega wykonywaniu komend administracyjnych przez zwykłych graczy. DayZ nie posiada wbudowanego systemu uprawnień administratora w skryptach, więc sprawdzamy na podstawie prostej listy administratorów.

### Sprawdzanie administratora w handlerze serwera

Najprostszym podejściem jest sprawdzanie Steam64 ID gracza na liście znanych identyfikatorów administratorów. W produkcyjnym modzie ładowałoby się tę listę z pliku konfiguracyjnego.

```c
// Proste sprawdzanie administratora -- w produkcji ładuj z pliku JSON konfiguracji
static bool IsAdmin(PlayerIdentity identity)
{
    if (!identity)
        return false;

    // Sprawdź zwykły ID gracza (Steam64 ID)
    string playerId = identity.GetPlainId();

    // Zahardkodowana lista administratorów -- zastąp ładowaniem z pliku konfiguracji w produkcji
    ref array<string> adminIds = new array<string>;
    adminIds.Insert("76561198000000001");    // Zastąp prawdziwymi Steam64 ID
    adminIds.Insert("76561198000000002");

    return (adminIds.Find(playerId) != -1);
}
```

### Gdzie znaleźć Steam64 ID

- Otwórz swój profil Steam w przeglądarce
- URL zawiera twoje Steam64 ID: `https://steamcommunity.com/profiles/76561198XXXXXXXXX`
- Lub użyj narzędzia takiego jak https://steamid.io do wyszukania dowolnego gracza

### Uprawnienia klasy produkcyjnej

W prawdziwym modzie należałoby:

1. Przechowywać ID administratorów w pliku JSON (`$profile:ChatCommands/admins.json`)
2. Ładować plik przy starcie serwera
3. Obsługiwać poziomy uprawnień (moderator, administrator, superadministrator)
4. Używać frameworka takiego jak system `MyPermissions` z MyMod Core do hierarchicznych uprawnień

---

## Krok 4: Wykonanie akcji po stronie serwera

Teraz tworzymy właściwą komendę `/heal` i handler serwera przetwarzający przychodzące RPC komend.

### Utwórz `Scripts/4_World/ChatCommands/commands/CCmdHeal.c`

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
    // Wykonaj komendę leczenia
    // /heal         --> leczy wywołującego
    // /heal Name    --> leczy wskazanego gracza
    // -------------------------------------------------------
    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        // Określ docelowego gracza
        if (args.Count() > 0)
        {
            // Ulecz konkretnego gracza po nazwie
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
            // Ulecz samego wywołującego
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

        // Wykonaj leczenie
        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        // Loguj i wyślij informację zwrotną
        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    // -------------------------------------------------------
    // Zastosuj pełne leczenie na graczu
    // -------------------------------------------------------
    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        // Przywróć zdrowie do maksimum
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // Przywróć krew do maksimum
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));

        // Usuń obrażenia od szoku
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        // Ustaw głód na pełny (wartość energii)
        // PlayerBase ma system statystyk -- ustaw statystykę energii
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());

        // Ustaw pragnienie na pełne (wartość wody)
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        // Wyczyść wszystkie źródła krwawienia
        player.GetBleedingManagerServer().RemoveAllSources();

        Print("[ChatCommands] Healed player: " + player.GetIdentity().GetName());
    }
};
```

### Dlaczego 4_World?

Komenda leczenia odwołuje się do `PlayerBase`, który jest zdefiniowany w warstwie `4_World`. Używa również metod statystyk gracza (`GetStatEnergy`, `GetStatWater`, `GetBleedingManagerServer`), które są dostępne tylko na encjach świata. Komenda **musi** znajdować się w `4_World` lub wyżej.

Klasa bazowa `CCmdBase` znajduje się w `3_Game`, ponieważ nie odwołuje się do żadnych typów świata. Konkretne klasy komend, które operują na encjach świata, znajdują się w `4_World`.

---

## Krok 5: Wysyłanie informacji zwrotnej do administratora

Informacja zwrotna jest obsługiwana przez metodę `SendFeedback()` w `CCmdBase`. Prześledźmy kompletną ścieżkę informacji zwrotnej:

### Serwer wysyła informację zwrotną

```c
// Wewnątrz CCmdBase.SendFeedback()
Param2<string, string> data = new Param2<string, string>(prefix, message);
GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
```

Serwer wysyła RPC `COMMAND_FEEDBACK` do konkretnego klienta, który wydał komendę. Dane zawierają prefiks (jak `"[Heal]"`) i treść wiadomości.

### Klient odbiera i wyświetla informację zwrotną

Z powrotem w `CCmdChatHook.c` (Krok 1), handler `OnRPC` przechwytuje to:

```c
if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
{
    // Deserializuj wiadomość
    Param2<string, string> data = new Param2<string, string>("", "");
    if (ctx.Read(data))
    {
        string prefix = data.param1;
        string message = data.param2;

        // Wyświetl w oknie czatu
        GetGame().Chat(prefix + " " + message, "colorStatusChannel");
    }
}
```

`GetGame().Chat()` wyświetla wiadomość w oknie czatu gracza. Drugi parametr to kanał kolorów:

| Kanał | Kolor | Typowe użycie |
|-------|-------|---------------|
| `"colorStatusChannel"` | Żółty/pomarańczowy | Wiadomości systemowe |
| `"colorAction"` | Biały | Informacja zwrotna o akcji |
| `"colorFriendly"` | Zielony | Pozytywna informacja zwrotna |
| `"colorImportant"` | Czerwony | Ostrzeżenia/błędy |

---

## Krok 6: Rejestracja komend

Handler serwera odbiera RPC komend, wyszukuje komendę w rejestrze i wykonuje ją.

### Utwórz `Scripts/4_World/ChatCommands/CCmdServerHandler.c`

```c
modded class MissionServer
{
    // -------------------------------------------------------
    // Zarejestruj wszystkie komendy podczas startu serwera
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();

        // Zarejestruj wszystkie komendy tutaj
        CCmdRegistry.Register(new CCmdHeal());

        // Dodaj więcej komend:
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
        // CCmdRegistry.Register(new CCmdTime());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

// -------------------------------------------------------
// Serwerowy handler RPC dla przychodzących komend
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

        // Odczytaj ciąg komendy
        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        // Parsuj komendę
        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        // Wyszukaj komendę
        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        // Sprawdź uprawnienia administratora
        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        // Wykonaj komendę
        bool success = command.Execute(sender, args);

        if (success)
            Print("[ChatCommands] Command /" + commandName + " executed successfully by " + sender.GetName());
        else
            Print("[ChatCommands] Command /" + commandName + " failed for " + sender.GetName());
    }

    // -------------------------------------------------------
    // Sprawdź, czy gracz jest administratorem
    // -------------------------------------------------------
    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ----------------------------------------------------------
        // WAŻNE: Zastąp te wartości swoimi rzeczywistymi Steam64 ID administratorów
        // W produkcji ładuj z pliku JSON konfiguracji
        // ----------------------------------------------------------
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    // -------------------------------------------------------
    // Wyślij informację zwrotną do konkretnego gracza
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

### Wzorzec rejestracji

Komendy są rejestrowane w `MissionServer.OnInit()`:

```c
CCmdRegistry.Init();
CCmdRegistry.Register(new CCmdHeal());
```

Każde wywołanie `Register()` tworzy instancję klasy komendy i przechowuje ją w mapie z kluczem będącym nazwą komendy. Gdy przychodzi RPC komendy, handler wyszukuje nazwę w rejestrze i wywołuje `Execute()` na odpowiednim obiekcie komendy.

Ten wzorzec sprawia, że dodawanie nowych komend jest banalne -- utwórz nową klasę rozszerzającą `CCmdBase`, zaimplementuj `Execute()` i dodaj jedną linię `Register()`.

---

## Krok 7: Dodanie do listy komend panelu administratora

Jeśli masz panel administratora (z [Rozdziału 8.3](03-admin-panel.md)), możesz wyświetlić listę dostępnych komend w interfejsie użytkownika.

### Żądanie listy komend z serwera

Dodaj nowy identyfikator RPC w `CCmdRPC.c`:

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST   = 79001;
    static const int COMMAND_FEEDBACK  = 79002;
    static const int COMMAND_LIST_REQ  = 79003;
    static const int COMMAND_LIST_RESP = 79004;
};
```

### Strona serwera: Wysyłanie listy komend

Dodaj ten handler w swoim kodzie po stronie serwera:

```c
// W handlerze serwera dodaj przypadek dla COMMAND_LIST_REQ
if (rpc_type == CCmdRPC.COMMAND_LIST_REQ)
{
    HandleCommandListRequest(sender);
}

protected void HandleCommandListRequest(PlayerIdentity requestor)
{
    if (!requestor)
        return;

    // Zbuduj sformatowany ciąg wszystkich komend
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

    // Wyślij z powrotem do klienta
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

### Strona klienta: Wyświetlanie w panelu

Po stronie klienta przechwyć odpowiedź i wyświetl ją w widgecie tekstowym:

```c
if (rpc_type == CCmdRPC.COMMAND_LIST_RESP)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        string commandList = data.param1;
        // Wyświetl w widgecie tekstowym panelu administratora
        // m_CommandListText.SetText(commandList);
        Print("[ChatCommands] Command list received:\n" + commandList);
    }
}
```

---

## Kompletny działający kod: komenda /heal

Oto każdy plik potrzebny do kompletnego działającego systemu. Utwórz te pliki, a twój mod będzie miał funkcjonalną komendę `/heal`.

### Konfiguracja config.cpp

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

        // ZASTĄP TE WARTOŚCI SWOIMI RZECZYWISTYMI STEAM64 ID ADMINISTRATORÓW
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

## Dodawanie kolejnych komend

Wzorzec rejestru sprawia, że dodawanie nowych komend jest proste. Oto przykłady:

### Komenda /kill

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

### Komenda /time

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

### Rejestracja nowych komend

Dodaj jedną linię na komendę w `MissionServer.OnInit()`:

```c
CCmdRegistry.Register(new CCmdHeal());
CCmdRegistry.Register(new CCmdKill());
CCmdRegistry.Register(new CCmdTime());
```

---

## Rozwiązywanie problemów

### Komenda nie jest rozpoznawana ("Unknown command")

- **Brak rejestracji:** Upewnij się, że `CCmdRegistry.Register(new CCmdYourCommand())` jest wywołane w `MissionServer.OnInit()`.
- **Literówka w GetName():** Ciąg zwracany przez `GetName()` musi odpowiadać temu, co gracz wpisuje (bez `/`).
- **Niezgodność wielkości liter:** Rejestr konwertuje nazwy na małe litery. `/Heal`, `/HEAL` i `/heal` powinny wszystkie działać.

### Brak dostępu dla administratorów

- **Nieprawidłowe Steam64 ID:** Sprawdź dokładnie ID administratorów w `IsCommandAdmin()`. Muszą to być dokładne Steam64 ID (17-cyfrowe numery zaczynające się od `7656`).
- **GetPlainId() vs GetId():** `GetPlainId()` zwraca Steam64 ID. `GetId()` zwraca ID sesji DayZ. Używaj `GetPlainId()` do sprawdzania administratorów.

### Wiadomość zwrotna nie pojawia się na czacie

- **RPC nie dociera do klienta:** Dodaj instrukcje `Print()` na serwerze, aby potwierdzić, że RPC informacji zwrotnej jest wysyłany.
- **OnRPC klienta nie przechwytuje go:** Zweryfikuj, czy ID RPC się zgadza (`CCmdRPC.COMMAND_FEEDBACK`).
- **GetGame().Chat() nie działa:** Ta funkcja wymaga, aby gra była w stanie, w którym czat jest dostępny. Może nie działać na ekranie ładowania.

### /heal faktycznie nie leczy

- **Wykonywanie tylko po stronie serwera:** `SetHealth()` i zmiany statystyk muszą być uruchamiane na serwerze. Zweryfikuj, że `GetGame().IsServer()` jest true gdy `Execute()` się wykonuje.
- **Rzutowanie PlayerBase się nie powodzi:** Jeśli `Class.CastTo(targetPlayer, targetMan)` zwraca false, cel nie jest prawidłowym PlayerBase. Może się to zdarzyć z AI lub encjami innymi niż gracze.
- **Gettery statystyk zwracają null:** `GetStatEnergy()` i `GetStatWater()` mogą zwrócić null, jeśli gracz jest martwy lub nie jest w pełni zainicjalizowany. Dodaj sprawdzanie null w kodzie produkcyjnym.

### Komenda pojawia się na czacie jako zwykła wiadomość

- Hook `OnEvent` przechwytuje wiadomość, ale nie tłumi jej przed wysłaniem jako czat. Aby to wytłumić w produkcyjnym modzie, należałoby zmodyfikować klasę `ChatInputMenu`, aby filtrować wiadomości z `/` przed ich wysłaniem:

```c
modded class ChatInputMenu
{
    override void OnChatInputSend()
    {
        string text = "";
        // Pobierz aktualny tekst z widgetu edycji
        // Jeśli zaczyna się od /, NIE wywołuj super (który wysyła jako czat)
        // Zamiast tego obsłuż jako komendę

        // To podejście różni się w zależności od wersji DayZ -- sprawdź źródła vanilla
        super.OnChatInputSend();
    }
};
```

Dokładna implementacja zależy od wersji DayZ i tego, jak `ChatInputMenu` udostępnia tekst. Podejście z `OnEvent` w tym samouczku jest prostsze i działa do celów deweloperskich, z kompromisem, że tekst komendy pojawia się również jako wiadomość czatu.

---

## Następne kroki

1. **Ładuj administratorów z pliku konfiguracji** -- Użyj `JsonFileLoader` do ładowania ID administratorów z pliku JSON zamiast ich hardkodowania.
2. **Dodaj komendę /help** -- Wylistuj wszystkie dostępne komendy z ich opisami i składnią użycia.
3. **Dodaj logowanie** -- Zapisuj użycie komend do pliku dziennika w celach audytowych.
4. **Integruj z frameworkiem** -- MyMod Core dostarcza `MyPermissions` dla hierarchicznych uprawnień i `MyRPC` dla routowania ciągów RPC, które unikają kolizji identyfikatorów liczbowych.
5. **Dodaj cooldowny** -- Zapobiegaj spamowaniu komend poprzez śledzenie czasu ostatniego wykonania na gracza.
6. **Zbuduj interfejs palety komend** -- Utwórz panel administratora, który wylistuje wszystkie komendy z klikanymi przyciskami (łącząc ten samouczek z [Rozdziałem 8.3](03-admin-panel.md)).

---

## Najlepsze praktyki

- **Zawsze sprawdzaj uprawnienia przed wykonaniem komend administracyjnych.** Brak sprawdzania uprawnień oznacza, że dowolny gracz może `/heal` lub `/kill` kogokolwiek. Waliduj Steam64 ID wywołującego (przez `GetPlainId()`) na serwerze przed przetwarzaniem.
- **Wysyłaj informację zwrotną do administratora nawet przy nieudanych komendach.** Ciche niepowodzenia uniemożliwiają debugowanie. Zawsze wysyłaj wiadomość czatu wyjaśniającą, co poszło nie tak ("Player not found", "Permission denied").
- **Używaj `GetPlainId()` do sprawdzania administratorów, nie `GetId()`.** `GetId()` zwraca ID specyficzne dla sesji DayZ, które zmienia się przy każdym ponownym połączeniu. `GetPlainId()` zwraca permanentne Steam64 ID.
- **Przechowuj ID administratorów w pliku JSON konfiguracji, nie w kodzie.** Zahardkodowane ID wymagają przebudowy PBO do zmiany. Plik JSON w `$profile:` może być edytowany przez administratorów serwera bez wiedzy o moddingu.
- **Konwertuj nazwy komend na małe litery przed dopasowaniem.** Gracze mogą wpisywać `/Heal`, `/HEAL` lub `/heal`. Normalizacja do małych liter zapobiega frustrującym błędom "unknown command".

---

## Teoria a praktyka

| Koncepcja | Teoria | Rzeczywistość |
|-----------|--------|---------------|
| Hook czatu przez `OnEvent` | Przechwyć wiadomość i obsłuż ją jako komendę | Wiadomość nadal pojawia się na czacie dla wszystkich graczy. Wytłumienie jej wymaga modyfikacji `ChatInputMenu`, co różni się w zależności od wersji DayZ. |
| `GetGame().Chat()` | Wyświetla wiadomość w oknie czatu gracza | Działa tylko gdy interfejs czatu jest aktywny. Na ekranie ładowania lub w niektórych stanach menu wiadomość jest cicho odrzucana. |
| Wzorzec rejestru komend | Czysta architektura z jedną klasą na komendę | Każdy plik klasy komendy musi trafić do właściwej warstwy skryptowej. `CCmdBase` w `3_Game`, konkretne komendy odwołujące się do `PlayerBase` w `4_World`. Nieprawidłowe umieszczenie warstwy powoduje "Undefined type" przy ładowaniu. |
| Wyszukiwanie gracza po nazwie | `FindPlayerByName` dopasowuje częściowe nazwy | Częściowe dopasowanie może trafić w niewłaściwego gracza na serwerze z podobnymi nazwami. W produkcji preferuj celowanie po Steam64 ID lub dodaj krok potwierdzenia. |

---

## Czego się nauczyłeś

W tym samouczku nauczyłeś się:
- Jak podpinać się do wejścia czatu używając `MissionGameplay.OnEvent` z `ChatMessageEventTypeID`
- Jak parsować prefiksy i argumenty komend z tekstu czatu
- Jak sprawdzać uprawnienia administratora na serwerze używając Steam64 ID
- Jak wysyłać informację zwrotną o komendzie z powrotem do gracza przez RPC i `GetGame().Chat()`
- Jak budować wielokrotny wzorzec rejestru komend do dodawania nowych komend

**Dalej:** [Rozdział 8.6: Debugowanie i testowanie twojego moda](06-debugging-testing.md)

---

**Poprzedni:** [Rozdział 8.3: Budowanie modułu panelu administratora](03-admin-panel.md)
