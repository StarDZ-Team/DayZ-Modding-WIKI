# 8.8. fejezet: HUD overlay készítése

[Főoldal](../README.md) | [<< Előző: Publikálás a Steam Workshopra](07-publishing-workshop.md) | **HUD overlay készítése** | [Következő: Professzionális mod sablon >>](09-professional-template.md)

---

> **Összefoglaló:** Ez az útmutató végigvezet egy egyéni HUD overlay készítésén, amely szerver információkat jelenít meg a képernyő jobb felső sarkában. Létre fogsz hozni egy layout fájlt, írni egy vezérlő osztályt, becsatlakozni a misszió életciklusba, adatokat kérni a szerverről RPC-n keresztül, hozzáadni egy átkapcsoló billentyűkötést, és csiszolni az eredményt halványítási animációkkal és intelligens láthatósággal. A végére egy nem tolakodó Szerver Infó HUD-od lesz, amely a szerver nevét, a játékosszámot és az aktuális játékon belüli időt mutatja -- plusz alapos megértésed arról, hogyan működnek a HUD overlayek a DayZ-ben.

---

## Tartalomjegyzék

- [Mit építünk](#mit-építünk)
- [Előfeltételek](#előfeltételek)
- [Mod struktúra](#mod-struktúra)
- [1. lépés: A layout fájl létrehozása](#1-lépés-a-layout-fájl-létrehozása)
- [2. lépés: A HUD vezérlő osztály létrehozása](#2-lépés-a-hud-vezérlő-osztály-létrehozása)
- [3. lépés: Becsatlakozás a MissionGameplay-be](#3-lépés-becsatlakozás-a-missiongameplay-be)
- [4. lépés: Adatok kérése a szerverről](#4-lépés-adatok-kérése-a-szerverről)
- [5. lépés: Átkapcsolás billentyűkötéssel](#5-lépés-átkapcsolás-billentyűkötéssel)
- [6. lépés: Csiszolás](#6-lépés-csiszolás)
- [Teljes kód referencia](#teljes-kód-referencia)
- [A HUD bővítése](#a-hud-bővítése)
- [Gyakori hibák](#gyakori-hibák)
- [Következő lépések](#következő-lépések)

---

## Mit építünk

Egy kicsi, félig átlátszó panel, amely a képernyő jobb felső sarkához van rögzítve, és három sor információt jelenít meg:

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

A panel az állapotjelzők alatt és a gyorselérési sáv felett helyezkedik el. Másodpercenként egyszer frissül (nem minden képkockánál), megjelenik behalványodva és eltűnik kihalványodva, és automatikusan elrejtőzik, amikor a felszerelés vagy a szüneteltetés menü nyitva van. A játékos ki- és bekapcsolhatja egy konfigurálható billentyűvel (alapértelmezett: **F7**).

### Várt eredmény

Betöltéskor egy sötét, félig átlátszó téglalapot fogsz látni a képernyő jobb felső területén. Fehér szöveg mutatja a szerver nevét az első sorban, az aktuális játékosszámot a második sorban, és a játékon belüli világidőt a harmadik sorban. Az F7 megnyomása simán kihalványítja; az F7 újbóli megnyomása visszahalványítja.

---

## Előfeltételek

- Működő mod struktúra (először végezd el a [8.1. fejezetet](01-first-mod.md))
- Alapvető Enforce Script szintaxis ismerete
- A DayZ kliens-szerver modelljének ismerete (a HUD a kliensen fut; a játékosszám a szerverről jön)

---

## Mod struktúra

Hozd létre a következő könyvtárfát:

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

A `3_Game` réteg definiálja a konstansokat (az RPC ID-nket). A `4_World` réteg kezeli a szerver oldali választ. Az `5_Mission` réteg tartalmazza a HUD osztályt és a misszió hookot. A layout fájl definiálja a widget fát.

---

## 1. lépés: A layout fájl létrehozása

A layout fájlok (`.layout`) XML-ben definiálják a widget hierarchiát. A DayZ GUI rendszere egy koordináta modellt használ, ahol minden widgetnek van pozíciója és mérete, arányos értékekkel (0.0 - 1.0 a szülő arányában) plusz pixel eltolásokkal kifejezve.

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- Gyökér keret: lefedi a teljes képernyőt, nem fogyaszt bemenetet -->
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
        <!-- Háttér panel: jobb felső sarok -->
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
            <!-- Szerver név szöveg -->
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
            <!-- Játékosszám szöveg -->
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
            <!-- Játékon belüli idő szöveg -->
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

### Főbb layout fogalmak

| Attribútum | Jelentés |
|-----------|---------|
| `halign="2"` | Vízszintes igazítás: **jobbra**. A widget a szülője jobb széléhez rögzül. |
| `valign="0"` | Függőleges igazítás: **felülre**. |
| `hexactpos="0"` + `vexactpos="1"` | A vízszintes pozíció arányos (1.0 = jobb szél), a függőleges pozíció pixelben van. |
| `hexactsize="1"` + `vexactsize="1"` | A szélesség és magasság pixelben van (220 x 70). |
| `color="0 0 0 0.55"` | RGBA lebegőpontos számokként. Fekete 55%-os átlátszatlansággal a háttér panelhez. |

A `ServerInfoPanel` az arányos X=1.0 pozícióra (jobb szél) van helyezve `halign="2"` (jobbra igazított) beállítással, így a panel jobb széle érinti a képernyő jobb oldalát. Az Y pozíció 0 pixel a tetejétől. Ez a jobb felső sarokba helyezi a HUD-unkat.

**Miért pixel méret a panelhez?** Az arányos méretezés a panelt a felbontással együtt méretezné, de kis infó widgeteknél rögzített pixel lábnyomot szeretnél, hogy a szöveg minden felbontáson olvasható maradjon.

---

## 2. lépés: A HUD vezérlő osztály létrehozása

A vezérlő osztály betölti a layoutot, név alapján megtalálja a widgeteket, és metódusokat biztosít a megjelenített szöveg frissítéséhez. A `ScriptedWidgetEventHandler`-t terjeszti ki, hogy később widget eseményeket fogadhasson, ha szükséges.

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

    // Milyen gyakran frissítse a megjelenített adatokat (másodperc)
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

    // HUD létrehozása és megjelenítése
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

        // Kezdeti adatok kérése a szerverről
        RequestServerInfo();
    }

    // Összes widget eltávolítása
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // Minden képkockánál meghívódik a MissionGameplay.OnUpdate-ből
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

    // A játékon belüli idő megjelenítés frissítése (kliens oldali, nincs szükség RPC-re)
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

    // RPC küldése a szervernek a játékosszám és szerver név kéréséhez
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // Offline mód: csak helyi infó megjelenítése
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

    // --- Beállítók, amelyek az adatok megérkezésekor hívódnak ---

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

    // Láthatóság átkapcsolása
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // Elrejtés, amikor menük nyitva vannak
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

### Fontos részletek

1. **`CreateWidgets` útvonal**: Az útvonal a mod gyökérhez képest relatív. Mivel a `GUI/` mappát a PBO-n belül csomagoljuk, a motor feloldja a `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` útvonalat a mod prefix segítségével.
2. **`FindAnyWidget`**: Rekurzívan keres a widget fában név alapján. Castolás után mindig ellenőrizd NULL-ra.
3. **`Widget.Unlink()`**: Megfelelően eltávolítja a widgetet és annak összes gyerekét az UI fából. Takarításnál mindig hívd meg.
4. **Időzítő akkumulátor minta**: Minden képkockánál hozzáadjuk a `timeslice`-ot, és csak akkor cselekszünk, amikor az összegyűjtött idő meghaladja az `UPDATE_INTERVAL`-t. Ez megakadályozza, hogy minden egyes képkockánál dolgozzunk.

---

## 3. lépés: Becsatlakozás a MissionGameplay-be

A `MissionGameplay` osztály a misszió vezérlő a kliens oldalon. A `modded class`-t használjuk, hogy a HUD-unkat beilleszthessük az életciklusába anélkül, hogy lecserélnénk a vanilla fájlt.

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // A HUD overlay létrehozása
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // Takarítás a super hívása ELŐTT
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

        // HUD elrejtése, amikor a felszerelés vagy bármilyen menü nyitva van
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // HUD adatok frissítése (belsőleg korlátozva)
        m_ServerInfoHUD.Update(timeslice);

        // Átkapcsoló billentyű ellenőrzése
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // Elérő, hogy az RPC kezelő elérhesse a HUD-ot
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Miért működik ez a minta

- Az **`OnInit`** egyszer fut le, amikor a játékos belép a játékmenetbe. Itt hozzuk létre és inicializáljuk a HUD-ot.
- Az **`OnUpdate`** minden képkockánál fut. Átadjuk a `timeslice`-ot a HUD-nak, amely belsőleg másodpercenként egyszer korlátozza. Itt ellenőrizzük az átkapcsoló billentyű lenyomását és a menü láthatóságot is.
- Az **`OnMissionFinish`** akkor fut, amikor a játékos lekapcsolódik vagy a misszió véget ér. Itt semmisítjük meg a widgetjeinket a memóriaszivárgás megelőzéséhez.

### Kritikus szabály: Mindig takaríts

Ha elfelejted megsemmisíteni a widgetjeidet az `OnMissionFinish`-ben, a widget gyökér átszivárog a következő munkamenetbe. Néhány szerverváltás után a játékosnál egymásra halmozódott szellem widgetek maradnak, amelyek memóriát fogyasztanak. Mindig párosítsd az `Init()`-et a `Destroy()`-jal.

---

## 4. lépés: Adatok kérése a szerverről

A játékosszámot csak a szerver ismeri. Szükségünk van egy egyszerű RPC (Remote Procedure Call) oda-visszaútra: a kliens küld egy kérést, a szerver beolvassa az adatokat és visszaküldi.

### 4a lépés: Az RPC ID definiálása

Az RPC ID-knek egyedinek kell lenniük az összes mod között. A mieinket a `3_Game` rétegben definiáljuk, hogy mind a kliens, mind a szerver kód hivatkozhasson rájuk.

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// RPC ID-k a Szerver Infó HUD-hoz.
// Magas számok használata az ütközések elkerüléséhez a vanillával és más modokkal.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**Miért `3_Game`?** A konstansok és enum-ok a legalsó rétegbe tartoznak, amelyet mind a kliens, mind a szerver elérhet. A `3_Game` réteg a `4_World` és `5_Mission` előtt töltődik be, így mindkét oldal láthatja ezeket az értékeket.

### 4b lépés: Szerver oldali kezelő

A szerver figyeli az `SIH_RPC_REQUEST_INFO`-t, összegyűjti az adatokat, és válaszol az `SIH_RPC_RESPONSE_INFO`-val.

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

        // Szerver infó összegyűjtése
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // Játékos lista lekérése
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // Maximum játékosok a szerver konfigból
        maxPlayers = GetGame().GetMaxPlayers();

        // Válasz küldése vissza a kérő kliensnek
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### 4c lépés: Kliens oldali RPC fogadó

A kliens fogadja a választ és frissíti a HUD-ot.

Add hozzá a `ServerInfoHUD` osztály **alá** a `ServerInfoHUD.c` fájlban:

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

        // A HUD elérése a MissionGameplay-en keresztül
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

### Hogyan működik az RPC folyamat

```
KLIENS                           SZERVER
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | beolvassa: serverName, playerCount, maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | frissíti a HUD szöveget       |
```

A kliens másodpercenként egyszer küldi a kérést (a frissítési időzítő korlátozza). A szerver három értékkel válaszol, amelyeket az RPC kontextusba csomagol. A kliens ugyanabban a sorrendben olvassa ki őket, ahogyan írva lettek.

**Fontos:** Az `rpc.Write()` és a `ctx.Read()` ugyanazokat a típusokat kell használja ugyanabban a sorrendben. Ha a szerver egy `string`-et, majd két `int` értéket ír, a kliensnek egy `string`-et, majd két `int` értéket kell olvasnia.

---

## 5. lépés: Átkapcsolás billentyűkötéssel

### 5a lépés: A bemenet definiálása az `inputs.xml`-ben

A DayZ az `inputs.xml`-t használja egyéni billentyű akciók regisztrálásához. A fájlt a `Scripts/data/inputs.xml` helyre kell tenni, és hivatkozni rá a `config.cpp`-ből.

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

| Elem | Cél |
|------|-----|
| `<actions>` | Deklarálja a beviteli akciót név alapján. A `loc` a billentyűkötési beállítások menüben megjelenített string. |
| `<preset>` | Az alapértelmezett billentyűt rendeli hozzá. A `kF7` az F7 billentyűhöz térképeződik. |

### 5b lépés: Az `inputs.xml` hivatkozása a `config.cpp`-ben

A `config.cpp`-nek meg kell mondania a motornak, hol találja a bemeneti fájlt. Adj hozzá egy `inputs` bejegyzést a `defs` blokkon belül:

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

### 5c lépés: A billentyű lenyomás olvasása

Ezt már kezeljük a `MissionGameplay` hookban a 3. lépésből:

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

A `GetUApi()` a beviteli API singletont adja vissza. A `GetInputByName` kikeresi a regisztrált akciónkat. A `LocalPress()` pontosan egy képkockára adja vissza a `true`-t, amikor a billentyű lenyomódik.

### Billentyű név referencia

Gyakori billentyű nevek a `<btn>`-hez:

| Billentyű név | Billentyű |
|---------------|-----------|
| `kF1` - `kF12` | Funkcióbillentyűk |
| `kH`, `kI`, stb. | Betűbillentyűk |
| `kNumpad0` - `kNumpad9` | Számbillentyűzet |
| `kLControl` | Bal Control |
| `kLShift` | Bal Shift |
| `kLAlt` | Bal Alt |

Módosító kombinációk beágyazást használnak:

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

Ez azt jelenti: "tartsd lenyomva a bal Control-t és nyomd meg a H-t."

---

## 6. lépés: Csiszolás

### 6a: Behalványodás/kihalványodás animáció

A DayZ `WidgetFadeTimer`-t biztosít sima alfa átmenetekhez. Frissítsd a `ServerInfoHUD` osztályt, hogy használja:

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... meglévő mezők ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // Cseréld le a ToggleVisibility metódust:
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

    // ... az osztály többi része ...
};
```

A `FadeIn(widget, duration)` a widget alfáját 0-ról 1-re animálja a megadott időtartam alatt másodpercben. A `FadeOut` 1-ről 0-ra megy és elrejti a widgetet, amikor kész.

### 6b: Háttér panel alfával

Ezt már beállítottuk a layoutban (`color="0 0 0 0.55"`), ami egy sötét overlayt ad 55%-os átlátszatlansággal. Ha futásidőben akarod módosítani az alfát:

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

Az `ARGB()` függvény 0-255 közötti egész értékeket fogad az alfa, piros, zöld és kék csatornákhoz.

### 6c: Betűtípus és szín választások

A DayZ több betűtípust szállít, amelyekre hivatkozhatsz a layoutokban:

| Betűtípus útvonal | Stílus |
|-------------------|--------|
| `gui/fonts/MetronBook` | Tiszta sans-serif (a vanilla HUD-ban használt) |
| `gui/fonts/MetronMedium` | Vastagabb változat a MetronBook-ból |
| `gui/fonts/Metron` | Legvékonyabb változat |
| `gui/fonts/luxuriousscript` | Dekoratív script (kerüld a HUD-nál) |

Szöveg szín megváltoztatása futásidőben:

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d: Más felületek tiszteletben tartása

A `MissionHook.c` fájlunk már észleli, amikor egy menü nyitva van, és meghívja a `SetMenuState(true)`-t. Íme egy alaposabb megközelítés, amely kifejezetten a felszerelést is ellenőrzi:

```c
// A modded MissionGameplay OnUpdate felülírásában:
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// A felszerelés nyitva van-e, szintén ellenőrizzük
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

Ez biztosítja, hogy a HUD-od elrejtőzik a felszerelés képernyő, a szüneteltetés menü, a beállítások képernyő és bármely más scriptelt menü mögött.

---

## Teljes kód referencia

Az alábbiakban a mod minden fájlja, végleges formájában az összes csiszolással.

### 1. fájl: `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### 2. fájl: `ServerInfoHUD/Scripts/config.cpp`

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

### 3. fájl: `ServerInfoHUD/Scripts/data/inputs.xml`

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

### 4. fájl: `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// RPC ID-k a Szerver Infó HUD-hoz.
// Magas számok használata az ütközések elkerüléséhez a vanilla ERPC-kkel és más modokkal.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### 5. fájl: `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

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

        // Csak a szerver kezeli ezt az RPC-t
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

        // Szerver név lekérése
        string serverName = "";
        GetGame().GetHostName(serverName);

        // Játékosok számlálása
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // Maximum játékos helyek lekérése
        int maxPlayers = GetGame().GetMaxPlayers();

        // Az adatok visszaküldése a kérő kliensnek
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### 6. fájl: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

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
// Kliens oldali RPC fogadó
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

### 7. fájl: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

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

        // Nyitott menük észlelése
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

        // Átkapcsoló billentyű
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

### 8. fájl: `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

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

## A HUD bővítése

Ha az alap HUD működik, íme természetes bővítések.

### FPS kijelzés hozzáadása

Az FPS kliens oldalon olvasható bármilyen RPC nélkül:

```c
// Adj hozzá egy TextWidget m_FPSText mezőt és keresd meg az Init()-ben

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

Hívd meg a `RefreshFPS()`-t a `RefreshTime()` mellett a frissítés metódusban. Vedd figyelembe, hogy a `GetDeltaT()` az aktuális képkocka idejét adja vissza, tehát az FPS érték ingadozni fog. Simább megjelenítéshez átlagolj több képkockán:

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

    // Visszaállítás másodpercenként (amikor a fő időzítő aktiválódik)
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### Játékos pozíció hozzáadása

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

### Több HUD panel

Több panelhez (iránytű, állapot, minitérkép) hozz létre egy szülő menedzser osztályt, amely HUD elemek tömbjét tartja:

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

### Húzható HUD elemek

Egy widget húzhatóvá tétele egér események kezelését igényli a `ScriptedWidgetEventHandler`-en keresztül:

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

Megjegyzés: a húzás működéséhez a widgeten meg kell hívni a `SetHandler(this)` metódust, hogy az eseménykezelő megkapja az eseményeket. Ezen kívül a kurzornak láthatónak kell lennie, ami korlátozza a húzható HUD-okat azokra a helyzetekre, amikor egy menü vagy szerkesztési mód aktív.

---

## Gyakori hibák

### 1. Frissítés minden képkockánál korlátozás helyett

**Helytelen:**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // Másodpercenként 60+ alkalommal fut!
    m_ServerInfoHUD.RequestServerInfo(); // Másodpercenként 60+ RPC-t küld!
}
```

**Helyes:** Használj időzítő akkumulátort (ahogyan az útmutatóban megmutatva), hogy a drága műveletek legfeljebb másodpercenként egyszer fussanak. A HUD szöveg, ami minden képkockánál változik (mint az FPS számláló) frissülhet képkockánként, de az RPC kéréseket korlátozni kell.

### 2. Takarítás hiánya az OnMissionFinish-ben

**Helytelen:**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // Sehol nincs takarítás -- widget szivárog lekapcsolódáskor!
    }
};
```

**Helyes:** Mindig semmisítsd meg a widgeteket és nullázd a referenciákat az `OnMissionFinish()`-ben. A destruktor (`~ServerInfoHUD`) egy biztonsági háló, de ne hagyatkozz rá -- az `OnMissionFinish` a helyes hely az explicit takarításra.

### 3. HUD más UI elemek mögött

A később létrehozott widgetek a korábban létrehozottak tetejére renderelődnek. Ha a HUD-od a vanilla UI mögött jelenik meg, túl korán hozták létre. Megoldások:

- Hozd létre a HUD-ot később az inicializálási sorrendben (pl. az első `OnUpdate` híváskor az `OnInit` helyett).
- Használd az `m_Root.SetSort(100)` metódust magasabb rendezési sorrend kényszerítéséhez, ami a widgetedet mások fölé tolja.

### 4. Túl gyakori adatkérés (RPC spam)

RPC küldése minden képkockánál csatlakozott játékosonként másodpercenként 60+ hálózati csomagot hoz létre. Egy 60 játékosos szerveren ez másodpercenként 3600 csomag felesleges forgalom. Mindig korlátozd az RPC kéréseket. Másodpercenként egyszer ésszerű nem kritikus információhoz. Ritkán változó adatokhoz (mint a szerver neve) kérheted csak egyszer az init-kor és gyorsítótárazhatod.

### 5. A `super` hívás elfelejtése

```c
// HELYTELEN: megtöri a vanilla HUD funkcionalitást
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // Hiányzik a super.OnInit()! A vanilla HUD nem fog inicializálódni.
}
```

Mindig hívd meg először a `super.OnInit()`-et (és `super.OnUpdate()`-et, `super.OnMissionFinish()`-t). A super hívás kihagyása megtöri a vanilla implementációt és minden más modot, amely ugyanazt a metódust hookolja.

### 6. Rossz script réteg használata

Ha megpróbálod hivatkozni a `MissionGameplay`-t a `4_World`-ből, "Undefined type" hibát kapsz, mert az `5_Mission` típusok nem láthatók a `4_World` számára. Az RPC konstansok a `3_Game`-be tartoznak, a szerver kezelő a `4_World`-be (a `PlayerBase` modolása, ami ott él), a HUD osztály és a misszió hook pedig az `5_Mission`-be.

### 7. Beégetett layout útvonal

A layout útvonal a `CreateWidgets()`-ben a játék keresési útvonalaihoz képest relatív. Ha a PBO prefixed nem egyezik az útvonal stringgel, a layout nem fog betöltődni és a `CreateWidgets` NULL-t ad vissza. Mindig ellenőrizd NULL-ra a `CreateWidgets` után és logolj hibát, ha sikertelen.

---

## Következő lépések

Most, hogy van egy működő HUD overlayd, fontold meg ezeket a továbblépéseket:

1. **Felhasználói preferenciák mentése** -- Tárold, hogy a HUD látható-e egy helyi JSON fájlban, így az átkapcsolási állapot megmarad a munkamenetek között.
2. **Szerver oldali konfiguráció hozzáadása** -- Engedd, hogy a szerver adminok engedélyezzék/letiltsák a HUD-ot, vagy válasszák ki, mely mezők jelenjenek meg egy JSON konfigurációs fájlon keresztül.
3. **Admin overlay készítése** -- Bővítsd a HUD-ot, hogy csak admin információkat mutasson (szerver teljesítmény, entitásszám, újraindítási időzítő) jogosultsági ellenőrzésekkel.
4. **Iránytű HUD készítése** -- Használd a `GetGame().GetCurrentCameraDirection()` metódust az irány kiszámításához és jeleníts meg egy iránytű sávot a képernyő tetején.
5. **Meglévő modok tanulmányozása** -- Nézd meg a DayZ Expansion quest HUD-ját és a Colorful UI overlay rendszerét produkciós minőségű HUD implementációkért.

---

## Legjobb gyakorlatok

- **Korlátozd az `OnUpdate`-et minimum 1 másodperces intervallumokra.** Használj időzítő akkumulátort, hogy elkerüld a drága műveletek (RPC kérések, szöveg formázás) másodpercenként 60+ alkalommal futtatását. Csak a képkockánkénti vizuális elemek, mint az FPS számláló frissüljenek minden képkockánál.
- **Rejtsd el a HUD-ot, amikor a felszerelés vagy bármilyen menü nyitva van.** Ellenőrizd a `GetGame().GetUIManager().GetMenu()` metódust minden frissítéskor és rejtsd el az overlayt. Az átfedő UI elemek összezavarják a játékosokat és blokkolják az interakciót.
- **Mindig takaríts el widgeteket az `OnMissionFinish`-ben.** A kiszivárgott widget gyökerek megmaradnak a szerverváltások között, egymásra halmozódott szellem paneleket halmozva, amelyek memóriát fogyasztanak és végül vizuális hibákat okoznak.
- **Használd a `SetSort()` metódust a renderelési sorrend vezérléséhez.** Ha a HUD-od vanilla elemek mögött jelenik meg, hívd meg az `m_Root.SetSort(100)` metódust, hogy fölé told. Explicit rendezési sorrend nélkül a létrehozási időzítés határozza meg a rétegezést.
- **Gyorsítótárazd a ritkán változó szerver adatokat.** A szerver neve nem változik egy munkamenet során. Kérd egyszer az init-kor és tárold helyileg ahelyett, hogy másodpercenként újra kérnéd.

---

## Elmélet vs gyakorlat

| Fogalom | Elmélet | Valóság |
|---------|---------|---------|
| `OnUpdate(float timeslice)` | Képkockánként egyszer hívódik a képkocka delta idővel | Egy 144 FPS-es kliensen ez másodpercenként 144-szer aktiválódik. RPC küldése minden híváskor játékosonként másodpercenként 144 hálózati csomagot hoz létre. Mindig gyűjtsd a `timeslice`-ot és csak akkor cselekedj, ha az összeg meghaladja az intervallumodat. |
| `CreateWidgets()` layout útvonal | Betölti a layoutot a megadott útvonalról | Az útvonal a PBO prefix-hez képest relatív, nem a fájlrendszerhez. Ha a PBO prefixed nem egyezik az útvonal stringgel, a `CreateWidgets` csendben NULL-t ad vissza hiba nélkül a logban. |
| `WidgetFadeTimer` | Simán animálja a widget átlátszóságát | A `FadeOut` elrejti a widgetet az animáció befejezése után, de a `FadeIn` NEM hívja meg először a `Show(true)` metódust. Manuálisan meg kell jelenítened a widgetet a `FadeIn` meghívása előtt, különben semmi sem jelenik meg. |
| `GetUApi().GetInputByName()` | Visszaadja a beviteli akciót az egyéni billentyűkötésedhez | Ha az `inputs.xml` nincs hivatkozva a `config.cpp`-ben a `class inputs` alatt, az akció név ismeretlen és a `GetInputByName` null-t ad vissza, ami összeomlást okoz a `.LocalPress()` hívásnál. |

---

## Amit tanultál

Ebben az útmutatóban megtanultad:
- Hogyan hozz létre HUD layoutot rögzített, félig átlátszó panelekkel
- Hogyan építs vezérlő osztályt, amely rögzített intervallumra korlátozza a frissítéseket
- Hogyan csatlakozz a `MissionGameplay`-be a HUD életciklus kezeléséhez (inicializálás, frissítés, takarítás)
- Hogyan kérj szerver adatokat RPC-n keresztül és jelenítsd meg a kliensen
- Hogyan regisztrálj egyéni billentyűkötést az `inputs.xml`-en keresztül és kapcsold a HUD láthatóságot halványítási animációkkal

**Előző:** [8.7. fejezet: Publikálás a Steam Workshopra](07-publishing-workshop.md)
