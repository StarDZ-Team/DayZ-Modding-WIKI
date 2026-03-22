# Kapitola 8.8: Tvorba HUD překryvu

[Domů](../../README.md) | [<< Předchozí: Publikování na Steam Workshop](07-publishing-workshop.md) | **Tvorba HUD překryvu** | [Další: Profesionální šablona modu >>](09-professional-template.md)

---

> **Shrnutí:** Tento tutoriál vás provede tvorbou HUD (Heads-Up Display) překryvu pro DayZ. Vytvoříte poloprůhledný informační panel ukotvený v pravém horním rohu obrazovky, který zobrazuje název serveru, počet hráčů a herní čas. Panel se automaticky skrývá při otevřeném inventáři a lze ho přepínat klávesovou zkratkou s plynulou animací prolínání.

---

## Obsah

- [Co budeme vytvářet](#co-budeme-vytvářet)
- [Předpoklady](#předpoklady)
- [Struktura modu](#struktura-modu)
- [Krok 1: Vytvoření souboru rozvržení](#krok-1-vytvoření-souboru-rozvržení)
- [Krok 2: Vytvoření třídy HUD řadiče](#krok-2-vytvoření-třídy-hud-řadiče)
- [Krok 3: Napojení na MissionGameplay](#krok-3-napojení-na-missiongameplay)
- [Krok 4: Vyžádání dat ze serveru](#krok-4-vyžádání-dat-ze-serveru)
- [Krok 5: Přidání přepínání klávesovou zkratkou](#krok-5-přidání-přepínání-klávesovou-zkratkou)
- [Krok 6: Doladění](#krok-6-doladění)
- [Kompletní referenční kód](#kompletní-referenční-kód)
- [Rozšíření HUD](#rozšíření-hud)
- [Časté chyby](#časté-chyby)
- [Další kroky](#další-kroky)

---

## Co budeme vytvářet

Malý, poloprůhledný panel ukotvený v pravém horním rohu obrazovky, který zobrazuje tři řádky informací:

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

Panel sedí pod stavovými indikátory a nad rychlou lištou. Aktualizuje se jednou za sekundu (ne každý snímek), plynule se zobrazí při zobrazení a plynule zmizí při skrytí a automaticky se skryje, když je otevřený inventář nebo pauza menu. Hráč ho může zapínat a vypínat konfigurovatelnou klávesou (výchozí: **F7**).

### Očekávaný výsledek

Po načtení uvidíte tmavý poloprůhledný obdélník v pravé horní oblasti obrazovky. Bílý text zobrazuje název serveru na prvním řádku, aktuální počet hráčů na druhém řádku a herní světový čas na třetím řádku. Stisknutí F7 ho plynule zneviditelní; opětovné stisknutí F7 ho plynule vrátí zpět.

---

## Předpoklady

- Funkční struktura modu (nejprve dokončete [Kapitolu 8.1](01-first-mod.md))
- Základní pochopení syntaxe Enforce Script
- Znalost modelu klient-server v DayZ (HUD běží na klientu; počet hráčů přichází ze serveru)

---

## Struktura modu

Vytvořte následující adresářový strom:

```
ServerInfoHUD/
    mod.cpp
    Scripts/
        config.cpp
        data/
            inputs.xml
        3_Game/
            ServerInfoHUD/
                ServerInfoRPC.c
        4_World/
            ServerInfoHUD/
                ServerInfoServer.c
        5_Mission/
            ServerInfoHUD/
                ServerInfoHUD.c
                MissionHook.c
    GUI/
        layouts/
            ServerInfoHUD.layout
```

Vrstva `3_Game` definuje konstanty (naše RPC ID). Vrstva `4_World` zpracovává odpověď na straně serveru. Vrstva `5_Mission` obsahuje třídu HUD a hook mise. Soubor rozvržení definuje strom widgetů.

---

## Krok 1: Vytvoření souboru rozvržení

Soubory rozvržení (`.layout`) definují hierarchii widgetů v XML. GUI systém DayZ používá souřadnicový model, kde každý widget má pozici a velikost vyjádřenou jako proporcionální hodnoty (0.0 až 1.0 z rodiče) plus pixelové offsety.

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- Kořenový rámec: pokrývá celou obrazovku, nespotřebovává vstup -->
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <!-- Panel pozadí: pravý horní roh -->
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <!-- Text názvu serveru -->
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Text počtu hráčů -->
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Text herního času -->
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

### Klíčové koncepty rozvržení

| Atribut | Význam |
|---------|--------|
| `halign="2"` | Horizontální zarovnání: **doprava**. Widget se kotví k pravému okraji rodiče. |
| `valign="0"` | Vertikální zarovnání: **nahoru**. |
| `hexactpos="0"` + `vexactpos="1"` | Horizontální pozice je proporcionální (1.0 = pravý okraj), vertikální pozice je v pixelech. |
| `hexactsize="1"` + `vexactsize="1"` | Šířka a výška jsou v pixelech (220 x 70). |
| `color="0 0 0 0.55"` | RGBA jako desetinná čísla. Černá na 55% průhlednosti pro panel pozadí. |

`ServerInfoPanel` je umístěn na proporcionální X=1.0 (pravý okraj) s `halign="2"` (zarovnání doprava), takže pravý okraj panelu se dotýká pravé strany obrazovky. Pozice Y je 0 pixelů od vrchu. Tím se náš HUD umístí do pravého horního rohu.

**Proč pixelové velikosti pro panel?** Proporcionální dimenzování by panel škálovalo s rozlišením, ale pro malé informační widgety chcete pevnou pixelovou stopu, aby text zůstal čitelný při všech rozlišeních.

---

## Krok 2: Vytvoření třídy HUD řadiče

Třída řadiče načte rozvržení, najde widgety podle názvu a zpřístupní metody pro aktualizaci zobrazeného textu. Rozšiřuje `ScriptedWidgetEventHandler`, aby mohla v případě potřeby přijímat události widgetů.

### `Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;

    // Jak často obnovovat zobrazená data (sekundy)
    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    // Vytvoření a zobrazení HUD
    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout file.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        // Vyžádání počátečních dat ze serveru
        RequestServerInfo();
    }

    // Odebrání všech widgetů
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // Voláno každý snímek z MissionGameplay.OnUpdate
    void Update(float timeslice)
    {
        if (!m_Root)
            return;

        if (!m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    // Aktualizace zobrazení herního času (na straně klienta, bez potřeby RPC)
    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    // Odeslání RPC na server s žádostí o počet hráčů a název serveru
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // Offline režim: jen zobrazit lokální info
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    // --- Settery volané při příchodu dat ---

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    // Přepnutí viditelnosti
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // Skrytí při otevřených menu
    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};
```

### Důležité detaily

1. **Cesta `CreateWidgets`**: Cesta je relativní ke kořenu modu. Jelikož balíme složku `GUI/` uvnitř PBO, engine vyřeší `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` pomocí prefixu modu.
2. **`FindAnyWidget`**: Prohledává strom widgetů rekurzivně podle názvu. Vždy kontrolujte NULL po přetypování.
3. **`Widget.Unlink()`**: Správně odebere widget a všechny jeho potomky ze stromu UI. Vždy volejte při úklidu.
4. **Vzor akumulátoru časovače**: Přidáváme `timeslice` každý snímek a jednáme pouze tehdy, když akumulovaný čas překročí `UPDATE_INTERVAL`. Tím se zabrání provádění práce každý jednotlivý snímek.

---

## Krok 3: Napojení na MissionGameplay

Třída `MissionGameplay` je řadič mise na straně klienta. Použijeme `modded class` pro vložení našeho HUD do jejího životního cyklu bez nahrazení vanilkového souboru.

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // Vytvoření HUD překryvu
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // Úklid PŘED voláním super
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Skrytí HUD, když je otevřený inventář nebo jakékoli menu
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // Aktualizace dat HUD (interně omezená)
        m_ServerInfoHUD.Update(timeslice);

        // Kontrola klávesy přepnutí
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // Přístupová metoda, aby RPC handler mohl dosáhnout na HUD
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Proč tento vzor funguje

- **`OnInit`** se spustí jednou, když hráč vstoupí do hry. Zde vytváříme a inicializujeme HUD.
- **`OnUpdate`** se spouští každý snímek. Předáváme `timeslice` do HUD, který interně omezuje na jednou za sekundu. Také zde kontrolujeme stisk přepínací klávesy a viditelnost menu.
- **`OnMissionFinish`** se spustí, když se hráč odpojí nebo mise skončí. Zde ničíme naše widgety, abychom zabránili únikům paměti.

### Kritické pravidlo: Vždy ukliďte

Pokud zapomenete zničit vaše widgety v `OnMissionFinish`, kořen widgetu unikne do další relace. Po několika přepnutích serverů hráč skončí se naskládanými duchy widgetů spotřebovávajícími paměť. Vždy párujte `Init()` s `Destroy()`.

---

## Krok 4: Vyžádání dat ze serveru

Počet hráčů je znám pouze na serveru. Potřebujeme jednoduchý RPC (Remote Procedure Call) obousměrný přenos: klient odešle požadavek, server přečte data a odešle je zpět.

### Krok 4a: Definování RPC ID

RPC ID musí být unikátní napříč všemi mody. Definujeme naše ve vrstvě `3_Game`, aby na ně mohl odkazovat jak klientský, tak serverový kód.

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// RPC ID pro Server Info HUD.
// Použití vysokých čísel pro zamezení konfliktů s vanilkou a jinými mody.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**Proč `3_Game`?** Konstanty a enumy patří do nejnižší vrstvy, ke které mají přístup jak klient, tak server. Vrstva `3_Game` se načítá před `4_World` a `5_Mission`, takže obě strany vidí tyto hodnoty.

### Krok 4b: Handler na straně serveru

Server naslouchá `SIH_RPC_REQUEST_INFO`, shromáždí data a odpoví `SIH_RPC_RESPONSE_INFO`.

### `Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Shromáždění informací o serveru
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // Získání seznamu hráčů
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // Maximum hráčů z konfigurace serveru
        maxPlayers = GetGame().GetMaxPlayers();

        // Odeslání odpovědi zpět žádajícímu klientovi
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Krok 4c: Přijímač RPC na straně klienta

Klient přijme odpověď a aktualizuje HUD.

Přidejte toto do stejného souboru `ServerInfoHUD.c` (na konec, mimo třídu), nebo vytvořte samostatný soubor v `5_Mission/ServerInfoHUD/`:

Přidejte následující **pod** třídu `ServerInfoHUD` v `ServerInfoHUD.c`:

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        // Přístup k HUD přes MissionGameplay
        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );

        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Jak funguje tok RPC

```
KLIENT                           SERVER
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | čte serverName, playerCount, maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | aktualizuje text HUD          |
```

Klient odešle požadavek jednou za sekundu (omezeno aktualizačním časovačem). Server odpoví třemi hodnotami zabalenými do kontextu RPC. Klient je čte ve stejném pořadí, v jakém byly zapsány.

**Důležité:** `rpc.Write()` a `ctx.Read()` musí používat stejné typy ve stejném pořadí. Pokud server zapíše `string` a poté dvě hodnoty `int`, klient musí přečíst `string` a poté dvě hodnoty `int`.

---

## Krok 5: Přidání přepínání klávesovou zkratkou

### Krok 5a: Definování vstupu v `inputs.xml`

DayZ používá `inputs.xml` pro registraci vlastních klávesových akcí. Soubor musí být umístěn v `Scripts/data/inputs.xml` a odkazován z `config.cpp`.

### `Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

| Prvek | Účel |
|-------|------|
| `<actions>` | Deklaruje vstupní akci podle názvu. `loc` je zobrazovaný řetězec uvedený v menu nastavení klávesových zkratek. |
| `<preset>` | Přiřazuje výchozí klávesu. `kF7` mapuje na klávesu F7. |

### Krok 5b: Odkaz na `inputs.xml` v `config.cpp`

Váš `config.cpp` musí říci enginu, kde najít soubor vstupů. Přidejte záznam `inputs` dovnitř bloku `defs`:

```cpp
class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/3_Game" };
    };

    class worldScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/4_World" };
    };

    class missionScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/5_Mission" };
    };

    class inputs
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/data" };
    };
};
```

### Krok 5c: Čtení stisku klávesy

Toto již zpracováváme v hooku `MissionGameplay` z kroku 3:

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` vrací singleton vstupního API. `GetInputByName` vyhledá naši registrovanou akci. `LocalPress()` vrací `true` přesně pro jeden snímek při stisknutí klávesy.

### Referenční seznam názvů kláves

Běžné názvy kláves pro `<btn>`:

| Název klávesy | Klávesa |
|---------------|---------|
| `kF1` až `kF12` | Funkční klávesy |
| `kH`, `kI` atd. | Písmenkové klávesy |
| `kNumpad0` až `kNumpad9` | Číselná klávesnice |
| `kLControl` | Levý Control |
| `kLShift` | Levý Shift |
| `kLAlt` | Levý Alt |

Kombinace modifikátorů používají vnořování:

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

To znamená "podržte levý Control a stiskněte H."

---

## Krok 6: Doladění

### 6a: Animace zobrazení/skrytí

DayZ poskytuje `WidgetFadeTimer` pro plynulé přechody průhlednosti. Aktualizujte třídu `ServerInfoHUD` pro jeho použití:

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... existující pole ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // Nahrazení metody ToggleVisibility:
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    // ... zbytek třídy ...
};
```

`FadeIn(widget, duration)` animuje průhlednost widgetu od 0 do 1 po danou dobu v sekundách. `FadeOut` jde od 1 do 0 a po dokončení widget skryje.

### 6b: Panel pozadí s průhledností

Toto jsme již nastavili v rozvržení (`color="0 0 0 0.55"`), což dává tmavý překryv na 55% průhlednosti. Pokud chcete upravit průhlednost za běhu:

```c
void SetBackgroundAlpha(float alpha)
{
    if (m_Panel)
    {
        int color = ARGB(
            (int)(alpha * 255),
            0, 0, 0
        );
        m_Panel.SetColor(color);
    }
}
```

Funkce `ARGB()` přijímá celočíselné hodnoty 0-255 pro průhlednost, červenou, zelenou a modrou.

### 6c: Výběr fontu a barev

DayZ obsahuje několik fontů, na které můžete odkazovat v rozvrženích:

| Cesta fontu | Styl |
|-------------|------|
| `gui/fonts/MetronBook` | Čistý sans-serif (používaný ve vanilkovém HUD) |
| `gui/fonts/MetronMedium` | Tučnější verze MetronBook |
| `gui/fonts/Metron` | Nejtenčí varianta |
| `gui/fonts/luxuriousscript` | Dekorativní skript (vyhněte se pro HUD) |

Pro změnu barvy textu za běhu:

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d: Respektování ostatního UI

Náš `MissionHook.c` již detekuje otevřené menu a volá `SetMenuState(true)`. Zde je důkladnější přístup, který kontroluje specificky inventář:

```c
// V override OnUpdate moddované MissionGameplay:
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// Také kontrola, zda je otevřený inventář
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

Tím zajistíte, že se váš HUD skryje za obrazovkou inventáře, menu pauzy, obrazovkou nastavení a jakýmkoli dalším skriptovaným menu.

---

## Kompletní referenční kód

Níže je každý soubor v modu ve své finální podobě se všemi vylepšeními.

### Soubor 1: `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### Soubor 2: `ServerInfoHUD/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class ServerInfoHUD_Scripts
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
    class ServerInfoHUD
    {
        dir = "ServerInfoHUD";
        name = "Server Info HUD";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/5_Mission" };
            };

            class inputs
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/data" };
            };
        };
    };
};
```

### Soubor 3: `ServerInfoHUD/Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

### Soubor 4: `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// RPC ID pro Server Info HUD.
// Použití vysokých čísel pro zamezení kolizí s vanilkovými ERPC a jinými mody.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### Soubor 5: `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Pouze server zpracovává toto RPC
        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Získání názvu serveru
        string serverName = "";
        GetGame().GetHostName(serverName);

        // Spočítání hráčů
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // Získání maximálního počtu slotů hráčů
        int maxPlayers = GetGame().GetMaxPlayers();

        // Odeslání dat zpět žádajícímu klientovi
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Soubor 6: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;
    protected ref WidgetFadeTimer m_FadeTimer;

    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        RequestServerInfo();
    }

    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    void Update(float timeslice)
    {
        if (!m_Root || !m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};

// -----------------------------------------------
// Přijímač RPC na straně klienta
// -----------------------------------------------
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );
        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Soubor 7: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Detekce otevřených menu
        bool menuOpen = false;
        UIManager uiMgr = GetGame().GetUIManager();
        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);
        m_ServerInfoHUD.Update(timeslice);

        // Přepínací klávesa
        if (GetUApi().GetInputByName(
            "UAServerInfoToggle"
        ).LocalPress())
        {
            m_ServerInfoHUD.ToggleVisibility();
        }
    }

    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Soubor 8: `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
            </Widget>
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

---

## Rozšíření HUD

Jakmile máte základní HUD funkční, zde jsou přirozená rozšíření.

### Přidání zobrazení FPS

FPS lze číst na straně klienta bez jakéhokoli RPC:

```c
// Přidejte pole TextWidget m_FPSText a najděte ho v Init()

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

Volejte `RefreshFPS()` spolu s `RefreshTime()` v aktualizační metodě. Poznámka: `GetDeltaT()` vrací čas aktuálního snímku, takže hodnota FPS bude kolísat. Pro hladší zobrazení průměrujte přes několik snímků:

```c
protected float m_FPSAccum;
protected int m_FPSFrames;

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    m_FPSAccum += GetGame().GetDeltaT();
    m_FPSFrames++;

    float avgFPS = m_FPSFrames / m_FPSAccum;
    m_FPSText.SetText("FPS: " + Math.Round(avgFPS).ToString());

    // Reset každou sekundu (když se spustí hlavní časovač)
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### Přidání pozice hráče

```c
protected void RefreshPosition()
{
    if (!m_PositionText)
        return;

    Man player = GetGame().GetPlayer();
    if (!player)
        return;

    vector pos = player.GetPosition();
    string text = "Pos: " + Math.Round(pos[0]).ToString()
        + " / " + Math.Round(pos[2]).ToString();
    m_PositionText.SetText(text);
}
```

### Více HUD panelů

Pro více panelů (kompas, stav, minimapa) vytvořte nadřazenou třídu manažera, která drží pole HUD prvků:

```c
class HUDManager
{
    protected ref array<ref ServerInfoHUD> m_Panels;

    void HUDManager()
    {
        m_Panels = new array<ref ServerInfoHUD>();
    }

    void AddPanel(ServerInfoHUD panel)
    {
        m_Panels.Insert(panel);
    }

    void UpdateAll(float timeslice)
    {
        int count = m_Panels.Count();
        int i = 0;
        while (i < count)
        {
            m_Panels.Get(i).Update(timeslice);
            i++;
        }
    }
};
```

### Přetahovatelné HUD prvky

Zpřístupnění widgetu pro přetahování vyžaduje zpracování událostí myši přes `ScriptedWidgetEventHandler`:

```c
class DraggableHUD : ScriptedWidgetEventHandler
{
    protected bool m_Dragging;
    protected float m_OffsetX;
    protected float m_OffsetY;
    protected Widget m_DragWidget;

    override bool OnMouseButtonDown(Widget w, int x, int y, int button)
    {
        if (w == m_DragWidget && button == 0)
        {
            m_Dragging = true;
            float wx, wy;
            m_DragWidget.GetScreenPos(wx, wy);
            m_OffsetX = x - wx;
            m_OffsetY = y - wy;
            return true;
        }
        return false;
    }

    override bool OnMouseButtonUp(Widget w, int x, int y, int button)
    {
        if (button == 0)
            m_Dragging = false;
        return false;
    }

    override bool OnUpdate(Widget w, int x, int y, int oldX, int oldY)
    {
        if (m_Dragging && m_DragWidget)
        {
            m_DragWidget.SetPos(x - m_OffsetX, y - m_OffsetY);
            return true;
        }
        return false;
    }
};
```

Poznámka: aby přetahování fungovalo, widget musí mít voláno `SetHandler(this)`, aby event handler přijímal události. Také kurzor musí být viditelný, což omezuje přetahovatelné HUD na situace, kdy je aktivní menu nebo editační režim.

---

## Časté chyby

### 1. Aktualizace každý snímek místo omezené

**Špatně:**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // Běží 60+ krát za sekundu!
    m_ServerInfoHUD.RequestServerInfo(); // Odesílá 60+ RPC za sekundu!
}
```

**Správně:** Použijte akumulátor časovače (jak je ukázáno v tutoriálu), aby nákladné operace běžely maximálně jednou za sekundu. HUD text, který se mění každý snímek (jako počítadlo FPS), je v pořádku aktualizovat každý snímek, ale požadavky RPC musí být omezeny.

### 2. Neúklid v OnMissionFinish

**Špatně:**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // Žádný úklid nikde -- widget uniká při odpojení!
    }
};
```

**Správně:** Vždy zničte widgety a vynulujte reference v `OnMissionFinish()`. Destruktor (`~ServerInfoHUD`) je záchranná síť, ale nespoléhejte se na něj -- `OnMissionFinish` je správné místo pro explicitní úklid.

### 3. HUD za ostatními UI prvky

Widgety vytvořené později se vykreslují nad widgety vytvořenými dříve. Pokud se váš HUD zobrazuje za vanilkovým UI, byl vytvořen příliš brzy. Řešení:

- Vytvořte HUD později v inicializační sekvenci (např. při prvním volání `OnUpdate` místo v `OnInit`).
- Použijte `m_Root.SetSort(100)` pro vynucení vyššího pořadí řazení, čímž se váš widget posune nad ostatní.

### 4. Příliš časté vyžadování dat (RPC spam)

Odesílání RPC každý snímek vytváří 60+ síťových paketů za sekundu na připojeného hráče. Na serveru s 60 hráči je to 3 600 paketů za sekundu zbytečného provozu. Vždy omezujte požadavky RPC. Jednou za sekundu je rozumné pro nekritické informace. Pro data, která se zřídka mění (jako název serveru), můžete požádat pouze jednou při inicializaci a uložit do cache.

### 5. Zapomenutí volání `super`

```c
// ŠPATNĚ: rozbije vanilkovou funkčnost HUD
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // Chybí super.OnInit()! Vanilkový HUD se neinicializuje.
}
```

Vždy volejte `super.OnInit()` (a `super.OnUpdate()`, `super.OnMissionFinish()`) jako první. Vynechání volání super rozbije vanilkovou implementaci a každý další mod, který hookuje stejnou metodu.

### 6. Použití špatné skriptové vrstvy

Pokud se pokusíte odkazovat na `MissionGameplay` z `4_World`, dostanete chybu "Undefined type", protože typy `5_Mission` nejsou viditelné pro `4_World`. RPC konstanty jdou do `3_Game`, handler serveru jde do `4_World` (moddování `PlayerBase`, který tam žije) a třída HUD a hook mise jdou do `5_Mission`.

### 7. Hardkódovaná cesta rozvržení

Cesta rozvržení v `CreateWidgets()` je relativní k vyhledávacím cestám hry. Pokud prefix vašeho PBO neodpovídá řetězci cesty, rozvržení se nenačte a `CreateWidgets` vrátí NULL. Vždy kontrolujte NULL po `CreateWidgets` a logujte chybu, pokud selže.

---

## Další kroky

Nyní, když máte funkční HUD překryv, zvažte tato pokročení:

1. **Uložení uživatelských předvoleb** -- Uložte, zda je HUD viditelný, do lokálního JSON souboru, aby stav přepnutí přetrval mezi relacemi.
2. **Přidání konfigurace na straně serveru** -- Umožněte administrátorům serveru zapnout/vypnout HUD nebo vybrat, která pole zobrazovat přes JSON konfigurační soubor.
3. **Sestavení administrátorského překryvu** -- Rozšiřte HUD o zobrazení informací pouze pro administrátory (výkon serveru, počet entit, časovač restartu) pomocí kontrol oprávnění.
4. **Vytvoření HUD kompasu** -- Použijte `GetGame().GetCurrentCameraDirection()` pro výpočet směru a zobrazte lištu kompasu v horní části obrazovky.
5. **Studium existujících modů** -- Podívejte se na quest HUD DayZ Expansion a překryvový systém Colorful UI pro produkčně kvalitní implementace HUD.

---

## Doporučené postupy

- **Omezte `OnUpdate` na minimálně 1-sekundové intervaly.** Použijte akumulátor časovače, abyste se vyhnuli spouštění nákladných operací (požadavky RPC, formátování textu) 60+ krát za sekundu. Pouze vizuály každý snímek jako počítadla FPS by se měly aktualizovat každý snímek.
- **Skryjte HUD, když je otevřený inventář nebo jakékoli menu.** Kontrolujte `GetGame().GetUIManager().GetMenu()` při každé aktualizaci a potlačte váš překryv. Překrývající se UI prvky matou hráče a blokují interakci.
- **Vždy ukliďte widgety v `OnMissionFinish`.** Neuklizenékořeny widgetů přetrvávají mezi přepnutími serverů, hromadí duchové panely, které spotřebovávají paměť a nakonec způsobují vizuální závady.
- **Použijte `SetSort()` pro řízení pořadí vykreslování.** Pokud se váš HUD zobrazuje za vanilkovými prvky, volejte `m_Root.SetSort(100)` pro jeho posunutí nad. Bez explicitního pořadí řazení o vrstvení rozhoduje načasování vytvoření.
- **Cachujte serverová data, která se zřídka mění.** Název serveru se během relace nemění. Vyžádejte ho jednou při inicializaci a uložte lokálně do cache místo opětovného vyžádání každou sekundu.

---

## Teorie vs praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `OnUpdate(float timeslice)` | Voláno jednou za snímek s delta časem snímku | Na klientu se 144 FPS se toto spustí 144krát za sekundu. Odeslání RPC při každém volání vytváří 144 síťových paketů/sekundu na hráče. Vždy akumulujte `timeslice` a jednejte pouze tehdy, když součet překročí váš interval. |
| Cesta rozvržení `CreateWidgets()` | Načte rozvržení z cesty, kterou poskytnete | Cesta je relativní k PBO prefixu, nikoliv k souborovému systému. Pokud PBO prefix neodpovídá řetězci cesty, `CreateWidgets` tiše vrátí NULL bez chyby v logu. |
| `WidgetFadeTimer` | Plynule animuje průhlednost widgetu | `FadeOut` skryje widget po dokončení animace, ale `FadeIn` NEVOLÁ `Show(true)` jako první. Musíte widget ručně zobrazit před voláním `FadeIn`, jinak se nic neobjeví. |
| `GetUApi().GetInputByName()` | Vrací vstupní akci pro vaši vlastní klávesovou zkratku | Pokud `inputs.xml` není odkázán v `config.cpp` pod `class inputs`, název akce je neznámý a `GetInputByName` vrátí null, což způsobí pád při volání `.LocalPress()`. |

---

## Co jste se naučili

V tomto tutoriálu jste se naučili:
- Jak vytvořit rozvržení HUD s ukotvenými, poloprůhlednými panely
- Jak sestavit třídu řadiče, která omezuje aktualizace na pevný interval
- Jak se napojit na `MissionGameplay` pro správu životního cyklu HUD (inicializace, aktualizace, úklid)
- Jak vyžádat serverová data přes RPC a zobrazit je na klientu
- Jak zaregistrovat vlastní klávesovou zkratku přes `inputs.xml` a přepínat viditelnost HUD s animacemi prolínání

**Předchozí:** [Kapitola 8.7: Publikování na Steam Workshop](07-publishing-workshop.md)
