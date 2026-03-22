# 8.3. fejezet: Admin panel modul építése

[Kezdőlap](../../README.md) | [<< Előző: Egyedi tárgy készítése](02-custom-item.md) | **Admin panel építése** | [Következő: Chat parancsok hozzáadása >>](04-chat-commands.md)

---

> **Összefoglalás:** Ez az oktatóanyag végigvezet egy komplett admin panel modul nulláról való felépítésén. Létrehozol egy UI layout-ot, widgeteket kötsz össze szkriptben, gombkattintásokat kezelsz, RPC-t küldesz kliensről szerverre, feldolgozod a kérést a szerveren, választ küldesz vissza, és megjeleníted az eredményt a UI-ban. Ez lefedi a teljes kliens-szerver-kliens körútat, amelyre minden hálózati modnak szüksége van.

---

## Tartalomjegyzék

- [Mit építünk](#mit-építünk)
- [Előfeltételek](#előfeltételek)
- [Architektúra áttekintés](#architektúra-áttekintés)
- [1. lépés: A modul osztály létrehozása](#1-lépés-a-modul-osztály-létrehozása)
- [2. lépés: A layout fájl létrehozása](#2-lépés-a-layout-fájl-létrehozása)
- [3. lépés: Widgetek kötése az OnActivated-ben](#3-lépés-widgetek-kötése-az-onactivated-ben)
- [4. lépés: Gombkattintások kezelése](#4-lépés-gombkattintások-kezelése)
- [5. lépés: RPC küldése a szerverre](#5-lépés-rpc-küldése-a-szerverre)
- [6. lépés: A szerver oldali válasz kezelése](#6-lépés-a-szerver-oldali-válasz-kezelése)
- [7. lépés: A UI frissítése a kapott adatokkal](#7-lépés-a-ui-frissítése-a-kapott-adatokkal)
- [8. lépés: A modul regisztrálása](#8-lépés-a-modul-regisztrálása)
- [Teljes fájl referencia](#teljes-fájl-referencia)
- [A teljes körút magyarázata](#a-teljes-körút-magyarázata)
- [Hibaelhárítás](#hibaelhárítás)
- [Következő lépések](#következő-lépések)

---

## Mit építünk

Egy **Admin Player Info** panelt készítünk, amely:

1. Egy "Refresh" gombot mutat egy egyszerű UI panelben
2. Amikor az admin a Refresh-re kattint, RPC-t küld a szerverre a játékosszám adatokat kérve
3. A szerver fogadja a kérést, összegyűjti az információkat, és visszaküldi
4. A kliens fogadja a választ és megjeleníti a játékosszámot és listát a UI-ban

Ez bemutatja azt az alapvető mintát, amelyet minden hálózati admin eszköz, mod konfigurációs panel és többjátékos UI használ a DayZ-ben.

---

## Előfeltételek

- Működő mod a [8.1. fejezetből](01-first-mod.md) vagy egy új mod a standard struktúrával
- Az [5 rétegű szkript hierarchia](../02-mod-structure/01-five-layers.md) megértése (a `3_Game`, `4_World` és `5_Mission` rétegeket fogjuk használni)
- Alapszintű kényelem az Enforce Script kód olvasásában

### Mod struktúra ehhez az oktatóanyaghoz

Ezeket az új fájlokat fogjuk létrehozni:

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

## Architektúra áttekintés

Kód írása előtt értsd meg az adatáramlást:

```
KLIENS                              SZERVER
------                              ------

1. Admin a "Refresh"-re kattint
2. Kliens RPC-t küld ------>  3. Szerver fogadja az RPC-t
   (AdminDemo_RequestInfo)       Összegyűjti a játékosadatokat
                             4. Szerver RPC-t küld ------>  KLIENS
                                (AdminDemo_ResponseInfo)
                                                     5. Kliens fogadja az RPC-t
                                                        Frissíti a UI szöveget
```

Az RPC (Remote Procedure Call) rendszer az, ahogy a kliens és szerver kommunikál a DayZ-ben. A motor biztosítja a `GetGame().RPCSingleParam()` és `GetGame().RPC()` metódusokat az adatküldéshez, és az `OnRPC()` felülírást a fogadáshoz.

**Kulcsfontosságú megkötések:**
- A kliensek nem tudnak közvetlenül szerver oldali adatokat olvasni (játékoslista, szerver állapot)
- Minden határ-átlépő kommunikációnak RPC-n keresztül kell mennie
- Az RPC üzeneteket egész szám ID-k azonosítják
- Az adatok `Param` osztályokkal szerializált paraméterekként kerülnek elküldésre

---

## 1. lépés: A modul osztály létrehozása

Először definiáld az RPC azonosítókat a `3_Game`-ben (a legkorábbi réteg, ahol a játéktípusok elérhetők). Az RPC ID-kat azért kell a `3_Game`-ben definiálni, mert mind a `4_World` (szerver kezelő), mind az `5_Mission` (kliens kezelő) hivatkozni akar rájuk.

### `Scripts/3_Game/AdminDemo/AdminDemoRPC.c` létrehozása

```c
class AdminDemoRPC
{
    // RPC ID-k -- válassz egyedi számokat, amelyek nem ütköznek más modokkal
    // Magas számok használata csökkenti az ütközés kockázatát
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

Ezeket a konstansokat mind a kliens (kérések küldéséhez), mind a szerver (bejövő kérések azonosításához és válaszok küldéséhez) használni fogja.

### Miért 3_Game?

Az RPC ID-k tiszta adatok -- egész számok, amelyeknek nincs függősége világ entitásoktól vagy UI-tól. A `3_Game`-be helyezésük mindkettő számára láthatóvá teszi őket: a `4_World` (ahol a szerver kezelő van) és az `5_Mission` (ahol a kliens UI van).

---

## 2. lépés: A layout fájl létrehozása

A layout fájl a panel vizuális struktúráját határozza meg. A DayZ egyedi szöveges formátumot használ (nem XML) a `.layout` fájlokhoz.

### `GUI/layouts/admin_player_info.layout` létrehozása

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

### Layout részletezés

| Widget | Cél |
|--------|-----|
| `AdminDemoPanel` | Gyökér keret, 40% széles és 50% magas, a képernyő közepén |
| `Background` | Sötét félig átlátszó háttér, amely kitölti a teljes panelt |
| `Title` | "Player Info Panel" szöveg felül |
| `RefreshButton` | Gomb, amelyre az admin kattint az adatok lekéréséhez |
| `PlayerCountText` | A játékosszámot jeleníti meg |
| `PlayerListText` | A játékosnevek listáját jeleníti meg |
| `CloseButton` | Bezárja a panelt |

Minden méret arányos koordinátákat használ (0.0-tól 1.0-ig a szülőhöz képest), mert a `hexactsize` és `vexactsize` értéke `0`.

---

## 3. lépés: Widgetek kötése az OnActivated-ben

Most hozd létre a kliens oldali panel szkriptet, amely betölti a layout-ot és összekapcsolja a widgeteket változókkal.

### `Scripts/5_Mission/AdminDemo/AdminDemoPanel.c` létrehozása

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
    // Panel megnyitása: widgetek létrehozása és hivatkozások kötése
    // -------------------------------------------------------
    void Open()
    {
        if (m_IsOpen)
            return;

        // A layout fájl betöltése és a gyökér widget lekérése
        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERROR: Failed to load layout file!");
            return;
        }

        // Widget hivatkozások kötése név alapján
        m_RefreshButton  = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton    = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        // Ez az osztály regisztrálása eseménykezelőként a widgetekhez
        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        // Egérkurzor megjelenítése, hogy az admin kattinthasson a gombokra
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Panel opened.");
    }

    // -------------------------------------------------------
    // Panel bezárása: widgetek megsemmisítése és vezérlők visszaállítása
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

        // Játékos vezérlők visszaállítása és kurzor elrejtése
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Panel closed.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -------------------------------------------------------
    // Nyitás/zárás váltása
    // -------------------------------------------------------
    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    // -------------------------------------------------------
    // Gombkattintás események kezelése
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
    // Meghívódik, amikor az admin a Refresh-re kattint
    // -------------------------------------------------------
    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh clicked, sending RPC to server...");

        // UI frissítése betöltési állapotra
        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Requesting data from server...");

        // RPC küldése a szerverre
        // Paraméterek: cél objektum, RPC ID, adat, címzett (null = szerver)
        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    // -------------------------------------------------------
    // Meghívódik, amikor megérkezik a szerver válasz (a mission OnRPC-ből)
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

### Kulcsfogalmak

A **`CreateWidgets()`** betölti a `.layout` fájlt és valós widget objektumokat hoz létre a memóriában. A gyökér widgetet adja vissza.

A **`FindAnyWidget("name")`** a widget fában keres egy adott nevű widgetet. A névnek pontosan meg kell egyeznie a layout fájlban szereplő widget névvel.

A **`Cast()`** az általános `Widget` hivatkozást konvertálja egy specifikus típusra (mint `ButtonWidget`). Erre azért van szükség, mert a `FindAnyWidget` az alap `Widget` típust adja vissza.

A **`SetHandler(this)`** regisztrálja ezt az osztályt eseménykezelőként a widgethez. Amikor a gombra kattintanak, a motor meghívja az `OnClick()` metódust ezen az objektumon.

A **`PlayerControlDisable` / `PlayerControlEnable`** letiltja/újra engedélyezi a játékos mozgását és akcióit. E nélkül a játékos sétálna, miközben gombokra próbál kattintani.

---

## 4. lépés: Gombkattintások kezelése

A gombkattintás kezelés már implementálva van a 3. lépés `OnClick()` metódusában. Vizsgáljuk meg közelebbről a mintát.

### Az OnClick minta

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_RefreshButton)
    {
        OnRefreshClicked();
        return true;    // Esemény feldolgozva -- továbbítás leállítása
    }

    if (w == m_CloseButton)
    {
        Close();
        return true;
    }

    return false;        // Esemény nem feldolgozva -- továbbítás engedélyezése
}
```

**Paraméterek:**
- `w` -- A kattintott widget
- `x`, `y` -- Az egér koordinátái a kattintás pillanatában
- `button` -- Melyik egérgomb (0 = bal, 1 = jobb, 2 = középső)

**Visszatérési érték:**
- `true` azt jelenti, hogy kezelted az eseményt. Leállítja a szülő widgetekhez való továbbítást.
- `false` azt jelenti, hogy nem kezelted. A motor átadja a következő kezelőnek.

**Minta:** Hasonlítsd össze a kattintott `w` widgetet az ismert widget hivatkozásaiddal. Hívj meg egy kezelő metódust minden felismert gombhoz. Adj vissza `true`-t a kezelt kattintásokra, `false`-ot minden másra.

---

## 5. lépés: RPC küldése a szerverre

Amikor az admin a Refresh-re kattint, üzenetet kell küldenünk a kliensről a szerverre. A DayZ az RPC rendszert biztosítja ehhez.

### RPC küldés (kliensről szerverre)

Az alapvető küldési hívás a 3. lépésből:

```c
Man player = GetGame().GetPlayer();
if (player)
{
    Param1<bool> params = new Param1<bool>(true);
    GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
}
```

**`GetGame().RPCSingleParam(target, rpcID, params, guaranteed)`:**

| Paraméter | Jelentés |
|-----------|----------|
| `target` | Az objektum, amelyhez ez az RPC társítva van. A játékos használata a standard. |
| `rpcID` | Az egyedi egész szám azonosítód (az `AdminDemoRPC`-ben definiálva). |
| `params` | Egy `Param` objektum, amely az adat payloadot hordozza. |
| `guaranteed` | `true` = TCP-szerű megbízható kézbesítés. `false` = UDP-szerű tűz és felejtsd el. Admin műveletekhez mindig használj `true`-t. |

### Param osztályok

A DayZ sablon `Param` osztályokat biztosít az adatküldéshez:

| Osztály | Használat |
|---------|-----------|
| `Param1<T>` | Egy érték |
| `Param2<T1, T2>` | Két érték |
| `Param3<T1, T2, T3>` | Három érték |

Küldhetsz stringeket, int-eket, float-okat, bool-okat és vektorokat. Példa több értékkel:

```c
Param3<string, int, float> data = new Param3<string, int, float>("hello", 42, 3.14);
GetGame().RPCSingleParam(player, MY_RPC_ID, data, true);
```

---

## 6. lépés: A szerver oldali válasz kezelése

A szerver fogadja a kliens RPC-jét, összegyűjti az adatokat, és választ küld vissza.

### `Scripts/4_World/AdminDemo/AdminDemoServer.c` létrehozása

```c
modded class PlayerBase
{
    // -------------------------------------------------------
    // Szerver oldali RPC kezelő
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Csak szerveren kezelendő
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
    // Játékosadatok összegyűjtése és válasz küldése
    // -------------------------------------------------------
    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Server received player info request from: " + requestor.GetName());

        // --- Jogosultság ellenőrzés (opcionális de ajánlott) ---
        // Éles modban ellenőrizd, hogy a kérelmező admin-e:
        // if (!IsAdmin(requestor))
        //     return;

        // --- Játékosadatok összegyűjtése ---
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

        // --- Válasz visszaküldése a kérelmező kliensnek ---
        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        // RPCSingleParam a kérelmező játékos objektumával azt a specifikus kliensnek küldi
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

### Hogyan működik a szerver oldali RPC fogadás

1. **Az `OnRPC()` a cél objektumon hívódik meg.** Amikor a kliens az RPC-t `target = player`-rel küldte, a szerver oldali `PlayerBase.OnRPC()` aktiválódik.

2. **Mindig hívd meg a `super.OnRPC()`-t.** Más modok és vanilla kód is kezelhet RPC-ket ezen az objektumon.

3. **Ellenőrizd a `GetGame().IsServer()`-t.** Ez a kód a `4_World`-ben van, amely mind kliens, mind szerveren kompilálódik. Az `IsServer()` ellenőrzés biztosítja, hogy csak a szerveren dolgozzuk fel a kérést.

4. **Kapcsolj az `rpc_type`-on.** Egyeztesd az RPC ID konstansaiddal.

5. **Küldd el a választ.** Használd az `RPCSingleParam`-ot az ötödik paraméterrel (`recipient`) a kérelmező játékos identitására állítva. Ez a választ csak az adott kliensnek küldi.

### RPCSingleParam válasz aláírás

```c
GetGame().RPCSingleParam(
    requestorPlayer,                        // Cél objektum (a játékos)
    AdminDemoRPC.RESPONSE_PLAYER_INFO,      // RPC ID
    responseData,                           // Adat payload
    true,                                   // Garantált kézbesítés
    requestor                               // Címzett identitás (specifikus kliens)
);
```

Az ötödik paraméter `requestor` (egy `PlayerIdentity`) az, ami célzott választ csinál ebből. Enélkül az RPC minden klienshez menne.

---

## 7. lépés: A UI frissítése a kapott adatokkal

Visszatérve a kliens oldalra, el kell fogadnunk a szerver válasz RPC-jét és a panelhez kell irányítanunk.

### `Scripts/5_Mission/AdminDemo/AdminDemoMission.c` létrehozása

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    // -------------------------------------------------------
    // Panel inicializálása a misszió indításakor
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Client mission initialized.");
    }

    // -------------------------------------------------------
    // Takarítás a misszió végén
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
    // Billentyűzet bevitel kezelése a panel váltásához
    // -------------------------------------------------------
    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // F5 billentyű váltja az admin panelt
        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    // -------------------------------------------------------
    // Szerver RPC-k fogadása a kliens oldalon
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
    // Szerver válasz deszerializálása és a panel frissítése
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

### Hogyan működik a kliens oldali RPC fogadás

1. A **`MissionGameplay.OnRPC()`** egy átfogó kezelő a kliens oldalon fogadott RPC-khez. Minden bejövő RPC-re aktiválódik.

2. A **`ParamsReadContext ctx`** tartalmazza a szerver által küldött szerializált adatokat. A `ctx.Read()` használatával kell deszerializálnod, egyező `Param` típussal.

3. **Az egyező Param típusok kritikusak.** A szerver `Param2<int, string>`-et küldött. A kliensnek `Param2<int, string>`-gel kell olvasnia. Eltérés esetén a `ctx.Read()` `false`-t ad vissza és nem kerül adat lekérésre.

4. **Irányítsd az adatokat a panelhoz.** A deszerializálás után hívj meg egy metódust a panel objektumon a UI frissítéséhez.

### Az OnKeyPress kezelő

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

Ez a misszió billentyűzet bemenetébe kapcsolódik. Amikor az admin megnyomja az F5-öt, a panel megnyílik vagy bezárul. A `KeyCode.KC_F5` az F5 billentyű beépített konstansa.

---

## 8. lépés: A modul regisztrálása

Végül, kösd össze mindent a config.cpp-ben.

### `AdminDemo/mod.cpp` létrehozása

```cpp
name = "Admin Demo";
author = "YourName";
version = "1.0";
overview = "Tutorial admin panel demonstrating the full RPC roundtrip pattern.";
```

### `AdminDemo/Scripts/config.cpp` létrehozása

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

### Miért három réteg?

| Réteg | Tartalmazza | Ok |
|-------|-------------|-----|
| `3_Game` | `AdminDemoRPC.c` | Az RPC ID konstansoknak láthatónak kell lenniük mind a `4_World`, mind az `5_Mission` számára |
| `4_World` | `AdminDemoServer.c` | Szerver oldali kezelő, amely a `PlayerBase`-t (egy világ entitást) moddolja |
| `5_Mission` | `AdminDemoPanel.c`, `AdminDemoMission.c` | Kliens UI és mission hookok |

---

## Teljes fájl referencia

### Végleges könyvtárstruktúra

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

## A teljes körút magyarázata

Íme az események pontos sorozata, amikor az admin megnyomja az F5-öt és a Refresh-re kattint:

```
1. [KLIENS] Admin megnyomja az F5-öt
   --> MissionGameplay.OnKeyPress(KC_F5) aktiválódik
   --> AdminDemoPanel.Toggle() meghívva
   --> Panel megnyílik, layout létrehozva, kurzor megjelenik

2. [KLIENS] Admin a "Refresh" gombra kattint
   --> AdminDemoPanel.OnClick() aktiválódik w == m_RefreshButton-tel
   --> OnRefreshClicked() meghívva
   --> UI "Loading..."-et mutat
   --> RPCSingleParam elküldi REQUEST_PLAYER_INFO-t (78001) a szerverre

3. [HÁLÓZAT] RPC utazik a klienstől a szerverre

4. [SZERVER] PlayerBase.OnRPC() aktiválódik
   --> rpc_type egyezik REQUEST_PLAYER_INFO-val
   --> HandlePlayerInfoRequest(sender) meghívva
   --> Szerver végigiterál az összes csatlakozott játékoson
   --> Összeállítja a játékosszámot és névlistát
   --> RPCSingleParam visszaküldi RESPONSE_PLAYER_INFO-t (78002) a kliensnek

5. [HÁLÓZAT] RPC utazik a szervertől a klienshez

6. [KLIENS] MissionGameplay.OnRPC() aktiválódik
   --> rpc_type egyezik RESPONSE_PLAYER_INFO-val
   --> HandlePlayerInfoResponse(ctx) meghívva
   --> Adatok deszerializálva a ParamsReadContext-ből
   --> AdminDemoPanel.OnPlayerInfoReceived() meghívva
   --> UI frissül játékosszámmal és nevekkel

Teljes idő: jellemzően 100ms alatt helyi hálózaton.
```

---

## Hibaelhárítás

### A panel nem nyílik meg az F5 lenyomásakor

- **Ellenőrizd az OnKeyPress felülírást:** Győződj meg róla, hogy először a `super.OnKeyPress(key)` hívódik meg.
- **Ellenőrizd a billentyűkódot:** A `KeyCode.KC_F5` a helyes konstans. Ha más billentyűt használsz, keresd meg a megfelelő konstanst az Enforce Script API-ban.
- **Ellenőrizd az inicializálást:** Győződj meg róla, hogy az `m_AdminDemoPanel` létre van hozva az `OnInit()`-ben.

### A panel megnyílik, de a gombok nem működnek

- **Ellenőrizd a SetHandler-t:** Minden gombnak szüksége van a `button.SetHandler(this)` hívásra.
- **Ellenőrizd a widget neveket:** A `FindAnyWidget("RefreshButton")` kis-nagybetű érzékeny. A névnek pontosan egyeznie kell a layout fájllal.
- **Ellenőrizd az OnClick visszatérési értéket:** Győződj meg róla, hogy az `OnClick` `true`-t ad vissza a kezelt gombokra.

### Az RPC soha nem éri el a szervert

- **Ellenőrizd az RPC ID egyediségét:** Ha egy másik mod ugyanazt az RPC ID számot használja, ütközések lesznek. Használj magas egyedi számokat.
- **Ellenőrizd a játékos hivatkozást:** A `GetGame().GetPlayer()` `null`-t ad vissza, ha a játékos teljes inicializálása előtt hívod meg. Győződj meg róla, hogy a panel csak a játékos spawnolása után nyílik meg.
- **Ellenőrizd, hogy a szerver kód kompilálódik:** Keresd a szerver szkript naplóban a `SCRIPT (E)` hibákat a `4_World` kódodban.

### A szerver válasz soha nem éri el a klienst

- **Ellenőrizd a címzett paramétert:** Az `RPCSingleParam` ötödik paraméterének a célkliens `PlayerIdentity`-jének kell lennie.
- **Ellenőrizd a Param típus egyezést:** A szerver `Param2<int, string>`-et küld, a kliens `Param2<int, string>`-gel olvas. Típus eltérés esetén a `ctx.Read()` sikertelen.
- **Ellenőrizd a MissionGameplay.OnRPC felülírást:** Győződj meg róla, hogy meghívod a `super.OnRPC()`-t és a metódus aláírás helyes.

### A UI megjelenik, de az adatok nem frissülnek

- **Null widget hivatkozások:** Ha a `FindAnyWidget` null-t ad vissza (widget név eltérés), a `SetText()` hívások csendben sikertelenek.
- **Ellenőrizd a panel hivatkozást:** Győződj meg róla, hogy a mission osztályban lévő `m_AdminDemoPanel` ugyanaz az objektum, amelyet megnyitottak.
- **Adj hozzá Print utasításokat:** Kövesd az adatáramlást `Print()` hívások hozzáadásával minden lépésnél.

---

## Következő lépések

1. **[8.4. fejezet: Chat parancsok hozzáadása](04-chat-commands.md)** -- Szerver oldali chat parancsok létrehozása admin műveletekhez.
2. **Jogosultságok hozzáadása** -- Ellenőrizd, hogy a kérelmező játékos admin-e, mielőtt feldolgoznád az RPC-ket.
3. **További funkciók hozzáadása** -- Bővítsd a panelt fülekkel az időjárás vezérléshez, játékos teleportáláshoz, tárgy spawnoláshoz.
4. **Keretrendszer használata** -- A MyMod Core-hoz hasonló keretrendszerek beépített RPC útválasztást, konfig kezelést és admin panel infrastruktúrát biztosítanak, amelyek kiküszöbölik ennek a sablonkódnak nagy részét.
5. **UI stílusozása** -- Tanuld meg a widget stílusokat, imageset-eket és betűtípusokat a [3. fejezet: GUI rendszer](../03-gui-system/01-widget-types.md) részben.

---

## Legjobb gyakorlatok

- **Validálj minden RPC adatot a szerveren a végrehajtás előtt.** Soha ne bízz a kliens adataiban -- mindig ellenőrizd a jogosultságokat, validáld a paramétereket, és védj a null értékek ellen bármely szerver művelet végrehajtása előtt.
- **Gyorsítótárazd a widget hivatkozásokat tagváltozókban ahelyett, hogy minden képkockában meghívnád a `FindAnyWidget`-et.** A widget keresés nem ingyenes; ismételt hívása az `OnUpdate`-ban vagy `OnClick`-ben teljesítményt pazarol.
- **Mindig hívd meg a `SetHandler(this)`-t az interaktív widgeteken.** Enélkül az `OnClick()` soha nem aktiválódik, és nincs hibaüzenet -- a gombok egyszerűen csendben nem csinálnak semmit.
- **Használj magas, egyedi RPC ID számokat.** A vanilla DayZ alacsony ID-kat használ. Más modok gyakori tartományokat választanak. Használj 70000 feletti számokat, és adj hozzá mod prefixet a megjegyzésekhez, hogy az ütközések nyomon követhetők legyenek.
- **Takaríts fel widgeteket az `OnMissionFinish`-ben.** A szivárgó widget gyökerek szerver váltások során halmozódnak, memóriát fogyasztva és szellem UI elemeket okozva.

---

## Elmélet vs gyakorlat

| Fogalom | Elmélet | Valóság |
|---------|---------|---------|
| `RPCSingleParam` kézbesítés | A `guaranteed=true` beállítás azt jelenti, hogy az RPC mindig megérkezik | Az RPC-k még mindig elveszhetnek, ha a játékos lecsatlakozik menet közben, vagy a szerver összeomlik. Mindig kezeld a "nincs válasz" esetet a UI-ban (pl. időtúllépési üzenet). |
| `OnClick` widget egyeztetés | Hasonlítsd össze: `w == m_Button` a kattintások azonosításához | Ha a `FindAnyWidget` NULL-t adott vissza (elírás a widget névben), az `m_Button` NULL és az összehasonlítás csendben sikertelen. Mindig naplózz figyelmeztetést, ha a widget kötés sikertelen az `Open()`-ban. |
| Param típus egyezés | A kliens és szerver ugyanazt a `Param2<int, string>`-et használja | Ha a típusok vagy sorrend nem egyezik pontosan, a `ctx.Read()` false-t ad vissza és az adatok csendben elvesznek. Nincs típusellenőrzési hibaüzenet futásidőben. |
| Listen szerver tesztelés | Elég jó a gyors iteráláshoz | A listen szerverek a klienst és szervert egy folyamatban futtatják, így az RPC-k azonnal megérkeznek és soha nem kelnek át a hálózaton. Időzítési hibák, csomagvesztés és autoritás problémák csak valódi dedikált szerveren jelennek meg. |

---

## Mit tanultál

Ebben az oktatóanyagban megtanultad:
- Hogyan hozz létre UI panelt layout fájlokkal és hogyan köss widgeteket szkriptben
- Hogyan kezeld a gombkattintásokat az `OnClick()` és `SetHandler()` segítségével
- Hogyan küldj RPC-ket kliensről szerverre és vissza az `RPCSingleParam` és `Param` osztályok használatával
- A teljes kliens-szerver-kliens körút mintát, amelyet minden hálózati admin eszköz használ
- Hogyan regisztráld a panelt a `MissionGameplay`-ben megfelelő életciklus kezeléssel

**Következő:** [8.4. fejezet: Chat parancsok hozzáadása](04-chat-commands.md)

---
