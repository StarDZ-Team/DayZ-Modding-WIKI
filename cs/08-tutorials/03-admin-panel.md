# Kapitola 8.3: Tvorba modulu administrátorského panelu

[Domů](../../README.md) | [<< Předchozí: Vytvoření vlastního předmětu](02-custom-item.md) | **Tvorba administrátorského panelu** | [Další: Přidání chatových příkazů >>](04-chat-commands.md)

---

> **Shrnutí:** Tento tutoriál vás provede tvorbou kompletního modulu administrátorského panelu od základu. Vytvoříte UI rozvržení, propojíte widgety ve skriptu, zpracujete kliknutí na tlačítka, odešlete RPC z klienta na server, zpracujete požadavek na serveru, odešlete odpověď zpět a zobrazíte výsledek v uživatelském rozhraní. Tím pokryjete kompletní komunikační cestu klient-server-klient, kterou potřebuje každý síťový mod.

---

## Obsah

- [Co budeme vytvářet](#co-budeme-vytvářet)
- [Předpoklady](#předpoklady)
- [Přehled architektury](#přehled-architektury)
- [Krok 1: Vytvoření třídy modulu](#krok-1-vytvoření-třídy-modulu)
- [Krok 2: Vytvoření souboru rozvržení](#krok-2-vytvoření-souboru-rozvržení)
- [Krok 3: Propojení widgetů v OnActivated](#krok-3-propojení-widgetů-v-onactivated)
- [Krok 4: Zpracování kliknutí na tlačítka](#krok-4-zpracování-kliknutí-na-tlačítka)
- [Krok 5: Odeslání RPC na server](#krok-5-odeslání-rpc-na-server)
- [Krok 6: Zpracování odpovědi na straně serveru](#krok-6-zpracování-odpovědi-na-straně-serveru)
- [Krok 7: Aktualizace UI přijatými daty](#krok-7-aktualizace-ui-přijatými-daty)
- [Krok 8: Registrace modulu](#krok-8-registrace-modulu)
- [Kompletní referenční soubory](#kompletní-referenční-soubory)
- [Vysvětlení kompletní komunikační cesty](#vysvětlení-kompletní-komunikační-cesty)
- [Řešení problémů](#řešení-problémů)
- [Další kroky](#další-kroky)

---

## Co budeme vytvářet

Vytvoříme panel **Admin Player Info**, který:

1. Zobrazí tlačítko "Refresh" v jednoduchém UI panelu
2. Když administrátor klikne na Refresh, odešle RPC na server s požadavkem na data o počtu hráčů
3. Server přijme požadavek, shromáždí informace a odešle je zpět
4. Klient přijme odpověď a zobrazí počet hráčů a jejich seznam v UI

Toto demonstruje základní vzor používaný každým síťovým administrátorským nástrojem, konfiguračním panelem modu a multiplayerovým UI v DayZ.

---

## Předpoklady

- Funkční mod z [Kapitoly 8.1](01-first-mod.md) nebo nový mod se standardní strukturou
- Pochopení [5-vrstvé hierarchie skriptů](../02-mod-structure/01-five-layers.md) (použijeme `3_Game`, `4_World` a `5_Mission`)
- Základní znalost čtení kódu v Enforce Script

### Struktura modu pro tento tutoriál

Vytvoříme tyto nové soubory:

```
AdminDemo/
    mod.cpp
    GUI/
        layouts/
            admin_player_info.layout
    Scripts/
        config.cpp
        3_Game/
            AdminDemo/
                AdminDemoRPC.c
        4_World/
            AdminDemo/
                AdminDemoServer.c
        5_Mission/
            AdminDemo/
                AdminDemoPanel.c
                AdminDemoMission.c
```

---

## Přehled architektury

Před psaním kódu pochopte tok dat:

```
KLIENT                              SERVER
------                              ------

1. Admin klikne na "Refresh"
2. Klient odešle RPC ------>  3. Server přijme RPC
   (AdminDemo_RequestInfo)       Shromáždí data hráčů
                             4. Server odešle RPC ------>  KLIENT
                                (AdminDemo_ResponseInfo)
                                                     5. Klient přijme RPC
                                                        Aktualizuje UI text
```

Systém RPC (Remote Procedure Call) je způsob, jakým klient a server komunikují v DayZ. Engine poskytuje metody `GetGame().RPCSingleParam()` a `GetGame().RPC()` pro odesílání dat a override `OnRPC()` pro jejich příjem.

**Klíčová omezení:**
- Klienti nemohou přímo číst data na straně serveru (seznam hráčů, stav serveru)
- Veškerá komunikace přes hranici musí probíhat přes RPC
- RPC zprávy jsou identifikovány celočíselnými ID
- Data se odesílají jako serializované parametry pomocí tříd `Param`

---

## Krok 1: Vytvoření třídy modulu

Nejprve definujte identifikátory RPC v `3_Game` (nejnižší vrstva, kde jsou dostupné herní typy). RPC ID musí být definována v `3_Game`, protože jak `4_World` (handler na serveru), tak `5_Mission` (handler na klientu) na ně potřebují odkazovat.

### Vytvořte `Scripts/3_Game/AdminDemo/AdminDemoRPC.c`

```c
class AdminDemoRPC
{
    // RPC ID -- zvolte unikátní čísla, která nekolidují s jinými mody
    // Použití vysokých čísel snižuje riziko kolize
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

Tyto konstanty budou používány jak klientem (pro odesílání požadavků), tak serverem (pro identifikaci příchozích požadavků a odesílání odpovědí).

### Proč 3_Game?

RPC ID jsou čistá data -- celá čísla bez závislosti na světových entitách nebo UI. Umístění do `3_Game` je zpřístupní jak pro `4_World` (kde žije handler serveru), tak pro `5_Mission` (kde žije klientské UI).

---

## Krok 2: Vytvoření souboru rozvržení

Soubor rozvržení definuje vizuální strukturu vašeho panelu. DayZ používá vlastní textový formát (ne XML) pro soubory `.layout`.

### Vytvořte `GUI/layouts/admin_player_info.layout`

```
FrameWidgetClass AdminDemoPanel {
 size 0.4 0.5
 position 0.3 0.25
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 0
 {
  ImageWidgetClass Background {
   size 1 1
   position 0 0
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   color 0.1 0.1 0.1 0.85
  }
  TextWidgetClass Title {
   size 1 0.08
   position 0 0.02
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Info Panel"
   "text halign" center
   "text valign" center
   color 1 1 1 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass RefreshButton {
   size 0.3 0.08
   position 0.35 0.12
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Refresh"
   "text halign" center
   "text valign" center
   color 0.2 0.6 1.0 1.0
  }
  TextWidgetClass PlayerCountText {
   size 1 0.06
   position 0 0.22
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Count: --"
   "text halign" center
   "text valign" center
   color 0.9 0.9 0.9 1
   font "gui/fonts/MetronBook"
  }
  TextWidgetClass PlayerListText {
   size 0.9 0.55
   position 0.05 0.3
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Click Refresh to load player data..."
   "text halign" left
   "text valign" top
   color 0.8 0.8 0.8 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass CloseButton {
   size 0.2 0.06
   position 0.4 0.9
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Close"
   "text halign" center
   "text valign" center
   color 1.0 0.3 0.3 1.0
  }
 }
}
```

### Popis rozvržení

| Widget | Účel |
|--------|------|
| `AdminDemoPanel` | Kořenový rámec, 40% šířky a 50% výšky, vycentrovaný na obrazovce |
| `Background` | Tmavé poloprůhledné pozadí vyplňující celý panel |
| `Title` | Text "Player Info Panel" nahoře |
| `RefreshButton` | Tlačítko, na které admin klikne pro vyžádání dat |
| `PlayerCountText` | Zobrazuje číslo počtu hráčů |
| `PlayerListText` | Zobrazuje seznam jmen hráčů |
| `CloseButton` | Zavře panel |

Všechny velikosti používají proporcionální souřadnice (0.0 až 1.0 relativně k rodiči), protože `hexactsize` a `vexactsize` jsou nastaveny na `0`.

---

## Krok 3: Propojení widgetů v OnActivated

Nyní vytvořte skript panelu na straně klienta, který načte rozvržení a propojí widgety s proměnnými.

### Vytvořte `Scripts/5_Mission/AdminDemo/AdminDemoPanel.c`

```c
class AdminDemoPanel extends ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_RefreshButton;
    protected ButtonWidget m_CloseButton;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_PlayerListText;

    protected bool m_IsOpen;

    void AdminDemoPanel()
    {
        m_IsOpen = false;
    }

    void ~AdminDemoPanel()
    {
        Close();
    }

    // -------------------------------------------------------
    // Otevření panelu: vytvoření widgetů a propojení referencí
    // -------------------------------------------------------
    void Open()
    {
        if (m_IsOpen)
            return;

        // Načtení souboru rozvržení a získání kořenového widgetu
        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERROR: Failed to load layout file!");
            return;
        }

        // Propojení referencí widgetů podle názvu
        m_RefreshButton  = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton    = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        // Registrace této třídy jako event handleru pro naše widgety
        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        // Zobrazení kurzoru myši, aby admin mohl klikat na tlačítka
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Panel opened.");
    }

    // -------------------------------------------------------
    // Zavření panelu: zničení widgetů a obnovení ovládání
    // -------------------------------------------------------
    void Close()
    {
        if (!m_IsOpen)
            return;

        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }

        m_IsOpen = false;

        // Obnovení ovládání hráče a skrytí kurzoru
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Panel closed.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -------------------------------------------------------
    // Přepnutí otevření/zavření
    // -------------------------------------------------------
    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    // -------------------------------------------------------
    // Zpracování událostí kliknutí na tlačítka
    // -------------------------------------------------------
    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_RefreshButton)
        {
            OnRefreshClicked();
            return true;
        }

        if (w == m_CloseButton)
        {
            Close();
            return true;
        }

        return false;
    }

    // -------------------------------------------------------
    // Voláno při kliknutí admina na Refresh
    // -------------------------------------------------------
    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh clicked, sending RPC to server...");

        // Aktualizace UI pro zobrazení stavu načítání
        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Requesting data from server...");

        // Odeslání RPC na server
        // Parametry: cílový objekt, RPC ID, data, příjemce (null = server)
        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    // -------------------------------------------------------
    // Voláno při příchodu odpovědi ze serveru (z mission OnRPC)
    // -------------------------------------------------------
    void OnPlayerInfoReceived(int playerCount, string playerNames)
    {
        Print("[AdminDemo] Received player info: " + playerCount.ToString() + " players");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: " + playerCount.ToString());

        if (m_PlayerListText)
            m_PlayerListText.SetText(playerNames);
    }
};
```

### Klíčové koncepty

**`CreateWidgets()`** načte soubor `.layout` a vytvoří skutečné objekty widgetů v paměti. Vrací kořenový widget.

**`FindAnyWidget("name")`** prohledá strom widgetů a najde widget s daným názvem. Název musí přesně odpovídat názvu widgetu v souboru rozvržení.

**`Cast()`** převádí obecnou referenci `Widget` na konkrétní typ (jako `ButtonWidget`). To je nutné, protože `FindAnyWidget` vrací základní typ `Widget`.

**`SetHandler(this)`** registruje tuto třídu jako event handler pro widget. Když je tlačítko stisknuto, engine zavolá `OnClick()` na tomto objektu.

**`PlayerControlDisable` / `PlayerControlEnable`** deaktivuje/reaktivuje pohyb a akce hráče. Bez toho by se hráč pohyboval, zatímco se snaží klikat na tlačítka.

---

## Krok 4: Zpracování kliknutí na tlačítka

Zpracování kliknutí na tlačítka je již implementováno v metodě `OnClick()` z kroku 3. Podívejme se na vzor podrobněji.

### Vzor OnClick

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_RefreshButton)
    {
        OnRefreshClicked();
        return true;    // Událost zpracována -- zastavit šíření
    }

    if (w == m_CloseButton)
    {
        Close();
        return true;
    }

    return false;        // Událost nezpracována -- nechat šířit dál
}
```

**Parametry:**
- `w` -- Widget, na který bylo kliknuto
- `x`, `y` -- Souřadnice myši v okamžiku kliknutí
- `button` -- Které tlačítko myši (0 = levé, 1 = pravé, 2 = střední)

**Návratová hodnota:**
- `true` znamená, že jste událost zpracovali. Zastaví se šíření k rodičovským widgetům.
- `false` znamená, že jste ji nezpracovali. Engine ji předá dalšímu handleru.

**Vzor:** Porovnejte kliknutý widget `w` s vašimi známými referencemi widgetů. Zavolejte metodu handleru pro každé rozpoznané tlačítko. Vraťte `true` pro zpracovaná kliknutí, `false` pro všechno ostatní.

---

## Krok 5: Odeslání RPC na server

Když admin klikne na Refresh, potřebujeme odeslat zprávu z klienta na server. DayZ pro to poskytuje systém RPC.

### Odesílání RPC (klient na server)

Klíčové volání odeslání z kroku 3:

```c
Man player = GetGame().GetPlayer();
if (player)
{
    Param1<bool> params = new Param1<bool>(true);
    GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
}
```

**`GetGame().RPCSingleParam(target, rpcID, params, guaranteed)`:**

| Parametr | Význam |
|----------|--------|
| `target` | Objekt, ke kterému je toto RPC přiřazeno. Použití hráče je standardní. |
| `rpcID` | Váš unikátní celočíselný identifikátor (definovaný v `AdminDemoRPC`). |
| `params` | Objekt `Param` nesoucí datový obsah. |
| `guaranteed` | `true` = spolehlivé doručení podobné TCP. `false` = doručení typu "vyslat a zapomenout" podobné UDP. Pro administrátorské operace vždy používejte `true`. |

### Třídy Param

DayZ poskytuje šablonové třídy `Param` pro odesílání dat:

| Třída | Použití |
|-------|---------|
| `Param1<T>` | Jedna hodnota |
| `Param2<T1, T2>` | Dvě hodnoty |
| `Param3<T1, T2, T3>` | Tři hodnoty |

Můžete posílat řetězce, celá čísla, čísla s plovoucí řádovou čárkou, booleany a vektory. Příklad s více hodnotami:

```c
Param3<string, int, float> data = new Param3<string, int, float>("hello", 42, 3.14);
GetGame().RPCSingleParam(player, MY_RPC_ID, data, true);
```

---

## Krok 6: Zpracování odpovědi na straně serveru

Server přijme RPC klienta, shromáždí data a odešle odpověď zpět.

### Vytvořte `Scripts/4_World/AdminDemo/AdminDemoServer.c`

```c
modded class PlayerBase
{
    // -------------------------------------------------------
    // RPC handler na straně serveru
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Zpracovat pouze na serveru
        if (!GetGame().IsServer())
            return;

        switch (rpc_type)
        {
            case AdminDemoRPC.REQUEST_PLAYER_INFO:
                HandlePlayerInfoRequest(sender);
                break;
        }
    }

    // -------------------------------------------------------
    // Shromáždění dat hráčů a odeslání odpovědi
    // -------------------------------------------------------
    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Server received player info request from: " + requestor.GetName());

        // --- Kontrola oprávnění (volitelná, ale doporučená) ---
        // Ve skutečném modu ověřte, zda je žadatel administrátor:
        // if (!IsAdmin(requestor))
        //     return;

        // --- Shromáždění dat hráčů ---
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        int playerCount = players.Count();
        string playerNames = "";

        for (int i = 0; i < playerCount; i++)
        {
            Man man = players.Get(i);
            if (man)
            {
                PlayerIdentity identity = man.GetIdentity();
                if (identity)
                {
                    if (playerNames != "")
                        playerNames = playerNames + "\n";

                    playerNames = playerNames + (i + 1).ToString() + ". " + identity.GetName();
                }
            }
        }

        if (playerNames == "")
            playerNames = "(No players connected)";

        // --- Odeslání odpovědi zpět žádajícímu klientovi ---
        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        // RPCSingleParam s objektem hráče žadatele odešle tomuto konkrétnímu klientovi
        Man requestorPlayer = null;
        for (int j = 0; j < players.Count(); j++)
        {
            Man candidate = players.Get(j);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
            {
                requestorPlayer = candidate;
                break;
            }
        }

        if (requestorPlayer)
        {
            GetGame().RPCSingleParam(requestorPlayer, AdminDemoRPC.RESPONSE_PLAYER_INFO, responseData, true, requestor);

            Print("[AdminDemo] Server sent player info response: " + playerCount.ToString() + " players");
        }
    }
};
```

### Jak funguje příjem RPC na straně serveru

1. **`OnRPC()` je volán na cílovém objektu.** Když klient odeslal RPC s `target = player`, spustí se `PlayerBase.OnRPC()` na straně serveru.

2. **Vždy volejte `super.OnRPC()`.** Ostatní mody a vanilkový kód mohou také zpracovávat RPC na tomto objektu.

3. **Zkontrolujte `GetGame().IsServer()`.** Tento kód je v `4_World`, který se kompiluje na klientu i serveru. Kontrola `IsServer()` zajistí, že požadavek zpracujeme pouze na serveru.

4. **Přepněte podle `rpc_type`.** Porovnejte s vašimi konstantami RPC ID.

5. **Odešlete odpověď.** Použijte `RPCSingleParam` s pátým parametrem (`recipient`) nastaveným na identitu žádajícího hráče. Tím se odpověď odešle pouze tomuto konkrétnímu klientovi.

### Signatura odpovědi RPCSingleParam

```c
GetGame().RPCSingleParam(
    requestorPlayer,                        // Cílový objekt (hráč)
    AdminDemoRPC.RESPONSE_PLAYER_INFO,      // RPC ID
    responseData,                           // Datový obsah
    true,                                   // Garantované doručení
    requestor                               // Identita příjemce (konkrétní klient)
);
```

Pátý parametr `requestor` (typu `PlayerIdentity`) je to, co z toho dělá cílenou odpověď. Bez něj by RPC šlo všem klientům.

---

## Krok 7: Aktualizace UI přijatými daty

Zpět na straně klienta potřebujeme zachytit odpověďové RPC ze serveru a směrovat ho do panelu.

### Vytvořte `Scripts/5_Mission/AdminDemo/AdminDemoMission.c`

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    // -------------------------------------------------------
    // Inicializace panelu při spuštění mise
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Client mission initialized.");
    }

    // -------------------------------------------------------
    // Úklid při ukončení mise
    // -------------------------------------------------------
    override void OnMissionFinish()
    {
        if (m_AdminDemoPanel)
        {
            m_AdminDemoPanel.Close();
            m_AdminDemoPanel = null;
        }

        super.OnMissionFinish();
    }

    // -------------------------------------------------------
    // Zpracování vstupu z klávesnice pro přepnutí panelu
    // -------------------------------------------------------
    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // Klávesa F5 přepíná administrátorský panel
        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    // -------------------------------------------------------
    // Příjem serverových RPC na straně klienta
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        switch (rpc_type)
        {
            case AdminDemoRPC.RESPONSE_PLAYER_INFO:
                HandlePlayerInfoResponse(ctx);
                break;
        }
    }

    // -------------------------------------------------------
    // Deserializace odpovědi serveru a aktualizace panelu
    // -------------------------------------------------------
    protected void HandlePlayerInfoResponse(ParamsReadContext ctx)
    {
        Param2<int, string> data = new Param2<int, string>(0, "");
        if (!ctx.Read(data))
        {
            Print("[AdminDemo] ERROR: Failed to read player info response!");
            return;
        }

        int playerCount = data.param1;
        string playerNames = data.param2;

        Print("[AdminDemo] Client received player info: " + playerCount.ToString() + " players");

        if (m_AdminDemoPanel)
            m_AdminDemoPanel.OnPlayerInfoReceived(playerCount, playerNames);
    }
};
```

### Jak funguje příjem RPC na straně klienta

1. **`MissionGameplay.OnRPC()`** je univerzální handler pro RPC přijatá na klientu. Spouští se pro každé příchozí RPC.

2. **`ParamsReadContext ctx`** obsahuje serializovaná data odeslaná serverem. Musíte je deserializovat pomocí `ctx.Read()` s odpovídajícím typem `Param`.

3. **Shoda typů Param je kritická.** Server odeslal `Param2<int, string>`. Klient musí číst s `Param2<int, string>`. Neshoda způsobí, že `ctx.Read()` vrátí `false` a žádná data nejsou načtena.

4. **Směrování dat do panelu.** Po deserializaci zavolejte metodu na objektu panelu pro aktualizaci UI.

### Handler OnKeyPress

```c
override void OnKeyPress(int key)
{
    super.OnKeyPress(key);

    if (key == KeyCode.KC_F5)
    {
        if (m_AdminDemoPanel)
            m_AdminDemoPanel.Toggle();
    }
}
```

Toto se napojuje na vstup z klávesnice mise. Když admin stiskne F5, panel se otevře nebo zavře. `KeyCode.KC_F5` je vestavěná konstanta pro klávesu F5.

---

## Krok 8: Registrace modulu

Nakonec vše propojte v config.cpp.

### Vytvořte `AdminDemo/mod.cpp`

```cpp
name = "Admin Demo";
author = "YourName";
version = "1.0";
overview = "Tutorial admin panel demonstrating the full RPC roundtrip pattern.";
```

### Vytvořte `AdminDemo/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class AdminDemo_Scripts
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
    class AdminDemo
    {
        dir = "AdminDemo";
        name = "Admin Demo";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/5_Mission" };
            };
        };
    };
};
```

### Proč tři vrstvy?

| Vrstva | Obsahuje | Důvod |
|--------|----------|-------|
| `3_Game` | `AdminDemoRPC.c` | Konstanty RPC ID musí být viditelné jak pro `4_World`, tak pro `5_Mission` |
| `4_World` | `AdminDemoServer.c` | Handler na straně serveru moddující `PlayerBase` (světovou entitu) |
| `5_Mission` | `AdminDemoPanel.c`, `AdminDemoMission.c` | Klientské UI a hooky mise |

---

## Kompletní referenční soubory

### Finální adresářová struktura

```
AdminDemo/
    mod.cpp
    GUI/
        layouts/
            admin_player_info.layout
    Scripts/
        config.cpp
        3_Game/
            AdminDemo/
                AdminDemoRPC.c
        4_World/
            AdminDemo/
                AdminDemoServer.c
        5_Mission/
            AdminDemo/
                AdminDemoPanel.c
                AdminDemoMission.c
```

### AdminDemo/Scripts/3_Game/AdminDemo/AdminDemoRPC.c

```c
class AdminDemoRPC
{
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

### AdminDemo/Scripts/4_World/AdminDemo/AdminDemoServer.c

```c
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        switch (rpc_type)
        {
            case AdminDemoRPC.REQUEST_PLAYER_INFO:
                HandlePlayerInfoRequest(sender);
                break;
        }
    }

    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Server received player info request from: " + requestor.GetName());

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        int playerCount = players.Count();
        string playerNames = "";

        for (int i = 0; i < playerCount; i++)
        {
            Man man = players.Get(i);
            if (man)
            {
                PlayerIdentity identity = man.GetIdentity();
                if (identity)
                {
                    if (playerNames != "")
                        playerNames = playerNames + "\n";

                    playerNames = playerNames + (i + 1).ToString() + ". " + identity.GetName();
                }
            }
        }

        if (playerNames == "")
            playerNames = "(No players connected)";

        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        Man requestorPlayer = null;
        for (int j = 0; j < players.Count(); j++)
        {
            Man candidate = players.Get(j);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
            {
                requestorPlayer = candidate;
                break;
            }
        }

        if (requestorPlayer)
        {
            GetGame().RPCSingleParam(requestorPlayer, AdminDemoRPC.RESPONSE_PLAYER_INFO, responseData, true, requestor);
            Print("[AdminDemo] Server sent player info response: " + playerCount.ToString() + " players");
        }
    }
};
```

### AdminDemo/Scripts/5_Mission/AdminDemo/AdminDemoPanel.c

```c
class AdminDemoPanel extends ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_RefreshButton;
    protected ButtonWidget m_CloseButton;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_PlayerListText;

    protected bool m_IsOpen;

    void AdminDemoPanel()
    {
        m_IsOpen = false;
    }

    void ~AdminDemoPanel()
    {
        Close();
    }

    void Open()
    {
        if (m_IsOpen)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERROR: Failed to load layout file!");
            return;
        }

        m_RefreshButton   = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton     = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Panel opened.");
    }

    void Close()
    {
        if (!m_IsOpen)
            return;

        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }

        m_IsOpen = false;

        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Panel closed.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_RefreshButton)
        {
            OnRefreshClicked();
            return true;
        }

        if (w == m_CloseButton)
        {
            Close();
            return true;
        }

        return false;
    }

    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh clicked, sending RPC to server...");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Requesting data from server...");

        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    void OnPlayerInfoReceived(int playerCount, string playerNames)
    {
        Print("[AdminDemo] Received player info: " + playerCount.ToString() + " players");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: " + playerCount.ToString());

        if (m_PlayerListText)
            m_PlayerListText.SetText(playerNames);
    }
};
```

### AdminDemo/Scripts/5_Mission/AdminDemo/AdminDemoMission.c

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Client mission initialized.");
    }

    override void OnMissionFinish()
    {
        if (m_AdminDemoPanel)
        {
            m_AdminDemoPanel.Close();
            m_AdminDemoPanel = null;
        }

        super.OnMissionFinish();
    }

    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        switch (rpc_type)
        {
            case AdminDemoRPC.RESPONSE_PLAYER_INFO:
                HandlePlayerInfoResponse(ctx);
                break;
        }
    }

    protected void HandlePlayerInfoResponse(ParamsReadContext ctx)
    {
        Param2<int, string> data = new Param2<int, string>(0, "");
        if (!ctx.Read(data))
        {
            Print("[AdminDemo] ERROR: Failed to read player info response!");
            return;
        }

        int playerCount = data.param1;
        string playerNames = data.param2;

        Print("[AdminDemo] Client received player info: " + playerCount.ToString() + " players");

        if (m_AdminDemoPanel)
            m_AdminDemoPanel.OnPlayerInfoReceived(playerCount, playerNames);
    }
};
```

---

## Vysvětlení kompletní komunikační cesty

Zde je přesná sekvence událostí, když admin stiskne F5 a klikne na Refresh:

```
1. [KLIENT] Admin stiskne F5
   --> MissionGameplay.OnKeyPress(KC_F5) se spustí
   --> AdminDemoPanel.Toggle() je zavolán
   --> Panel se otevře, rozvržení je vytvořeno, kurzor se objeví

2. [KLIENT] Admin klikne na tlačítko "Refresh"
   --> AdminDemoPanel.OnClick() se spustí s w == m_RefreshButton
   --> OnRefreshClicked() je zavolán
   --> UI zobrazí "Loading..."
   --> RPCSingleParam odešle REQUEST_PLAYER_INFO (78001) na server

3. [SÍŤ] RPC cestuje z klienta na server

4. [SERVER] PlayerBase.OnRPC() se spustí
   --> rpc_type odpovídá REQUEST_PLAYER_INFO
   --> HandlePlayerInfoRequest(sender) je zavolán
   --> Server projde všechny připojené hráče
   --> Sestaví počet hráčů a seznam jmen
   --> RPCSingleParam odešle RESPONSE_PLAYER_INFO (78002) zpět klientovi

5. [SÍŤ] RPC cestuje ze serveru na klienta

6. [KLIENT] MissionGameplay.OnRPC() se spustí
   --> rpc_type odpovídá RESPONSE_PLAYER_INFO
   --> HandlePlayerInfoResponse(ctx) je zavolán
   --> Data jsou deserializována z ParamsReadContext
   --> AdminDemoPanel.OnPlayerInfoReceived() je zavolán
   --> UI se aktualizuje s počtem a jmény hráčů

Celkový čas: typicky pod 100 ms v lokální síti.
```

---

## Řešení problémů

### Panel se neotevře po stisknutí F5

- **Zkontrolujte override OnKeyPress:** Ujistěte se, že `super.OnKeyPress(key)` je volán jako první.
- **Zkontrolujte kód klávesy:** `KeyCode.KC_F5` je správná konstanta. Pokud používáte jinou klávesu, najděte správnou konstantu v API Enforce Script.
- **Zkontrolujte inicializaci:** Ujistěte se, že `m_AdminDemoPanel` je vytvořen v `OnInit()`.

### Panel se otevře, ale tlačítka nefungují

- **Zkontrolujte SetHandler:** Každé tlačítko potřebuje, aby na něm bylo voláno `button.SetHandler(this)`.
- **Zkontrolujte názvy widgetů:** `FindAnyWidget("RefreshButton")` rozlišuje velká a malá písmena. Název musí přesně odpovídat souboru rozvržení.
- **Zkontrolujte návratovou hodnotu OnClick:** Ujistěte se, že `OnClick` vrací `true` pro zpracovaná tlačítka.

### RPC nikdy nedorazí na server

- **Zkontrolujte unikátnost RPC ID:** Pokud jiný mod používá stejné číslo RPC ID, dojde ke konfliktu. Používejte vysoká unikátní čísla.
- **Zkontrolujte referenci hráče:** `GetGame().GetPlayer()` vrací `null`, pokud je voláno před úplnou inicializací hráče. Ujistěte se, že panel se otevírá až po spawnu hráče.
- **Zkontrolujte, zda se kód serveru kompiluje:** Podívejte se do logu skriptů serveru na chyby `SCRIPT (E)` ve vašem kódu `4_World`.

### Odpověď serveru nikdy nedorazí ke klientovi

- **Zkontrolujte parametr příjemce:** Pátý parametr `RPCSingleParam` musí být `PlayerIdentity` cílového klienta.
- **Zkontrolujte shodu typů Param:** Server odesílá `Param2<int, string>`, klient čte `Param2<int, string>`. Neshoda typů způsobí selhání `ctx.Read()`.
- **Zkontrolujte override MissionGameplay.OnRPC:** Ujistěte se, že voláte `super.OnRPC()` a signatura metody je správná.

### UI se zobrazí, ale data se neaktualizují

- **Nulové reference widgetů:** Pokud `FindAnyWidget` vrátí `null` (nesoulad názvu widgetu), volání `SetText()` tiše selžou.
- **Zkontrolujte referenci panelu:** Ujistěte se, že `m_AdminDemoPanel` ve třídě mise je stejný objekt, který byl otevřen.
- **Přidejte příkazy Print:** Sledujte tok dat přidáním volání `Print()` v každém kroku.

---

## Další kroky

1. **[Kapitola 8.4: Přidání chatových příkazů](04-chat-commands.md)** -- Vytvořte chatové příkazy na straně serveru pro administrátorské operace.
2. **Přidejte oprávnění** -- Ověřte, zda je žádající hráč administrátor, než zpracujete RPC.
3. **Přidejte další funkce** -- Rozšiřte panel o záložky pro ovládání počasí, teleportaci hráčů, spawnování předmětů.
4. **Použijte framework** -- Frameworky jako MyMod Core poskytují vestavěné směrování RPC, správu konfigurace a infrastrukturu administrátorského panelu, která eliminuje velkou část tohoto opakujícího se kódu.
5. **Stylujte UI** -- Naučte se o stylech widgetů, imagesetech a fontech v [Kapitole 3: GUI systém](../03-gui-system/01-widget-types.md).

---

## Doporučené postupy

- **Ověřte všechna RPC data na serveru před provedením.** Nikdy nedůvěřujte datům od klienta -- vždy kontrolujte oprávnění, validujte parametry a ošetřete nulové hodnoty před provedením jakékoli serverové akce.
- **Cachujte reference widgetů v členských proměnných místo volání `FindAnyWidget` každý snímek.** Vyhledávání widgetů není zadarmo; opakované volání v `OnUpdate` nebo `OnClick` plýtvá výkonem.
- **Vždy volejte `SetHandler(this)` na interaktivních widgetech.** Bez toho se `OnClick()` nikdy nespustí a neobjeví se žádná chybová zpráva -- tlačítka prostě tiše nic nedělají.
- **Používejte vysoká, unikátní čísla RPC ID.** Vanilkové DayZ používá nízká ID. Jiné mody volí běžné rozsahy. Používejte čísla nad 70000 a přidejte prefix vašeho modu do komentářů, aby kolize byly dohledatelné.
- **Uklízejte widgety v `OnMissionFinish`.** Neuklizenékořeny widgetů se hromadí při přepínání serverů, spotřebovávají paměť a způsobují duchy UI prvků.

---

## Teorie vs praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| Doručení `RPCSingleParam` | Nastavení `guaranteed=true` znamená, že RPC vždy dorazí | RPC mohou být stále ztraceny, pokud se hráč odpojí během letu nebo server spadne. Vždy ošetřete případ "žádná odpověď" ve vašem UI (např. zpráva o vypršení časového limitu). |
| Porovnávání widgetů v `OnClick` | Porovnejte `w == m_Button` pro identifikaci kliknutí | Pokud `FindAnyWidget` vrátil NULL (překlep v názvu widgetu), `m_Button` je NULL a porovnání tiše selže. Vždy logujte varování, pokud se propojení widgetu v `Open()` nezdaří. |
| Shoda typů Param | Klient a server používají stejný `Param2<int, string>` | Pokud typy nebo pořadí přesně neodpovídají, `ctx.Read()` vrátí false a data jsou tiše ztracena. Za běhu se neobjeví žádná chybová zpráva o kontrole typů. |
| Testování na listen serveru | Dostatečné pro rychlou iteraci | Listen servery spouštějí klienta i server v jednom procesu, takže RPC dorazí okamžitě a nikdy neprocházejí sítí. Chyby v časování, ztráta paketů a problémy s autoritou se objeví pouze na skutečném dedikovaném serveru. |

---

## Co jste se naučili

V tomto tutoriálu jste se naučili:
- Jak vytvořit UI panel se soubory rozvržení a propojit widgety ve skriptu
- Jak zpracovávat kliknutí na tlačítka pomocí `OnClick()` a `SetHandler()`
- Jak odesílat RPC z klienta na server a zpět pomocí `RPCSingleParam` a tříd `Param`
- Kompletní vzor komunikační cesty klient-server-klient používaný každým síťovým administrátorským nástrojem
- Jak registrovat panel v `MissionGameplay` se správnou správou životního cyklu

**Další:** [Kapitola 8.4: Přidání chatových příkazů](04-chat-commands.md)

---

**Předchozí:** [Kapitola 8.2: Vytvoření vlastního předmětu](02-custom-item.md)
**Další:** [Kapitola 8.4: Přidání chatových příkazů](04-chat-commands.md)
