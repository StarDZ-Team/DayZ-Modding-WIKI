# Rozdział 8.8: Budowanie nakładki HUD

[Strona główna](../../README.md) | [<< Poprzedni: Publikacja na Steam Workshop](07-publishing-workshop.md) | **Budowanie nakładki HUD** | [Dalej: Profesjonalny szablon moda >>](09-professional-template.md)

---

> **Podsumowanie:** Ten samouczek przeprowadzi cię przez budowanie własnej nakładki HUD wyświetlającej informacje o serwerze w prawym górnym rogu ekranu. Utworzysz plik layoutu, napiszesz klasę kontrolera, podepniesz się do cyklu życia misji, zażądasz danych z serwera przez RPC, dodasz przełącznik za pomocą skrótu klawiszowego i wypolirujesz rezultat animacjami zanikania oraz inteligentną widocznością. Pod koniec będziesz mieć nieinwazyjny HUD informacji o serwerze wyświetlający nazwę serwera, liczbę graczy i aktualny czas w grze -- plus solidne zrozumienie jak nakładki HUD działają w DayZ.

---

## Spis treści

- [Co budujemy](#co-budujemy)
- [Wymagania wstępne](#wymagania-wstępne)
- [Struktura moda](#struktura-moda)
- [Krok 1: Tworzenie pliku layoutu](#krok-1-tworzenie-pliku-layoutu)
- [Krok 2: Tworzenie klasy kontrolera HUD](#krok-2-tworzenie-klasy-kontrolera-hud)
- [Krok 3: Podpięcie do MissionGameplay](#krok-3-podpięcie-do-missiongameplay)
- [Krok 4: Żądanie danych z serwera](#krok-4-żądanie-danych-z-serwera)
- [Krok 5: Dodanie przełącznika ze skrótem klawiszowym](#krok-5-dodanie-przełącznika-ze-skrótem-klawiszowym)
- [Krok 6: Polerowanie](#krok-6-polerowanie)
- [Kompletna referencja kodu](#kompletna-referencja-kodu)
- [Rozszerzanie HUD](#rozszerzanie-hud)
- [Częste błędy](#częste-błędy)
- [Następne kroki](#następne-kroki)

---

## Co budujemy

Mały, półprzezroczysty panel zakotwiczony w prawym górnym rogu ekranu, wyświetlający trzy linie informacji:

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

Panel znajduje się poniżej wskaźników statusu i powyżej paska szybkiego dostępu. Aktualizuje się raz na sekundę (nie co klatkę), pojawia się płynnie gdy jest pokazywany i zanika gdy jest ukrywany, oraz automatycznie chowa się gdy otwarty jest ekwipunek lub menu pauzy. Gracz może go włączać i wyłączać konfigurowalnym klawiszem (domyślnie: **F7**).

### Oczekiwany rezultat

Po załadowaniu zobaczysz ciemny, półprzezroczysty prostokąt w prawym górnym obszarze ekranu. Biały tekst pokazuje nazwę serwera w pierwszej linii, aktualną liczbę graczy w drugiej linii i czas świata gry w trzeciej linii. Naciśnięcie F7 płynnie go wygasza; ponowne naciśnięcie F7 płynnie go przywraca.

---

## Wymagania wstępne

- Działająca struktura moda (ukończ najpierw [Rozdział 8.1](01-first-mod.md))
- Podstawowe zrozumienie składni Enforce Script
- Znajomość modelu klient-serwer DayZ (HUD działa na kliencie; liczba graczy pochodzi z serwera)

---

## Struktura moda

Utwórz następujące drzewo katalogów:

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

Warstwa `3_Game` definiuje stałe (nasz identyfikator RPC). Warstwa `4_World` obsługuje odpowiedź po stronie serwera. Warstwa `5_Mission` zawiera klasę HUD i hook misji. Plik layoutu definiuje drzewo widgetów.

---

## Krok 1: Tworzenie pliku layoutu

Pliki layoutu (`.layout`) definiują hierarchię widgetów w XML. System GUI DayZ używa modelu współrzędnych, w którym każdy widget ma pozycję i rozmiar wyrażony jako wartości proporcjonalne (0.0 do 1.0 rodzica) plus przesunięcia pikselowe.

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- Ramka główna: pokrywa cały ekran, nie konsumuje wejścia -->
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
        <!-- Panel tła: prawy górny róg -->
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
            <!-- Tekst nazwy serwera -->
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
            <!-- Tekst liczby graczy -->
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
            <!-- Tekst czasu w grze -->
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

### Kluczowe koncepcje layoutu

| Atrybut | Znaczenie |
|---------|-----------|
| `halign="2"` | Wyrównanie poziome: **prawo**. Widget jest zakotwiczony do prawej krawędzi rodzica. |
| `valign="0"` | Wyrównanie pionowe: **góra**. |
| `hexactpos="0"` + `vexactpos="1"` | Pozycja pozioma jest proporcjonalna (1.0 = prawa krawędź), pozycja pionowa w pikselach. |
| `hexactsize="1"` + `vexactsize="1"` | Szerokość i wysokość w pikselach (220 x 70). |
| `color="0 0 0 0.55"` | RGBA jako ułamki. Czarny z 55% przezroczystości dla panelu tła. |

`ServerInfoPanel` jest pozycjonowany na proporcjonalnym X=1.0 (prawa krawędź) z `halign="2"` (wyrównanie do prawej), więc prawa krawędź panelu dotyka prawej strony ekranu. Pozycja Y to 0 pikseli od góry. To umieszcza nasz HUD w prawym górnym rogu.

**Dlaczego rozmiary pikselowe dla panelu?** Rozmiar proporcjonalny sprawiłby, że panel skalowałby się z rozdzielczością, ale dla małych widgetów informacyjnych chcesz stałego śladu pikselowego, aby tekst pozostał czytelny we wszystkich rozdzielczościach.

---

## Krok 2: Tworzenie klasy kontrolera HUD

Klasa kontrolera ładuje layout, znajduje widgety po nazwie i udostępnia metody do aktualizacji wyświetlanego tekstu. Rozszerza `ScriptedWidgetEventHandler`, aby mogła odbierać zdarzenia widgetów w razie potrzeby później.

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

    // Jak często odświeżać wyświetlane dane (w sekundach)
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

    // Utwórz i pokaż HUD
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

        // Zażądaj początkowych danych z serwera
        RequestServerInfo();
    }

    // Usuń wszystkie widgety
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // Wywoływane co klatkę z MissionGameplay.OnUpdate
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

    // Aktualizuj wyświetlanie czasu w grze (po stronie klienta, bez potrzeby RPC)
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

    // Wyślij RPC do serwera z żądaniem liczby graczy i nazwy serwera
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // Tryb offline: pokaż tylko lokalne informacje
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

    // --- Settery wywoływane gdy dane dotrą ---

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

    // Przełącz widoczność
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // Ukryj gdy menu są otwarte
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

### Ważne szczegóły

1. **Ścieżka `CreateWidgets`**: Ścieżka jest relatywna do katalogu głównego moda. Ponieważ pakujemy folder `GUI/` wewnątrz PBO, silnik rozwiązuje `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` używając prefiksu moda.
2. **`FindAnyWidget`**: Przeszukuje drzewo widgetów rekurencyjnie po nazwie. Zawsze sprawdzaj NULL po rzutowaniu.
3. **`Widget.Unlink()`**: Prawidłowo usuwa widget i wszystkie jego dzieci z drzewa UI. Zawsze wywołuj to przy czyszczeniu.
4. **Wzorzec akumulatora timera**: Dodajemy `timeslice` w każdej klatce i działamy tylko gdy skumulowany czas przekroczy `UPDATE_INTERVAL`. To zapobiega wykonywaniu pracy w każdej pojedynczej klatce.

---

## Krok 3: Podpięcie do MissionGameplay

Klasa `MissionGameplay` jest kontrolerem misji po stronie klienta. Używamy `modded class` do wstrzyknięcia naszego HUD w jego cykl życia bez zastępowania pliku vanilla.

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // Utwórz nakładkę HUD
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // Wyczyść PRZED wywołaniem super
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

        // Ukryj HUD gdy ekwipunek lub jakiekolwiek menu jest otwarte
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // Aktualizuj dane HUD (ograniczane wewnętrznie)
        m_ServerInfoHUD.Update(timeslice);

        // Sprawdź klawisz przełącznika
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // Akcesor, aby handler RPC mógł dotrzeć do HUD
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Dlaczego ten wzorzec działa

- **`OnInit`** wykonuje się raz, gdy gracz wchodzi do rozgrywki. Tworzymy i inicjalizujemy tu HUD.
- **`OnUpdate`** wykonuje się co klatkę. Przekazujemy `timeslice` do HUD, który wewnętrznie ogranicza się do raz na sekundę. Sprawdzamy tu również naciśnięcie klawisza przełącznika i widoczność menu.
- **`OnMissionFinish`** wykonuje się, gdy gracz rozłącza się lub misja się kończy. Niszczymy tu nasze widgety, aby zapobiec wyciekom pamięci.

### Krytyczna zasada: Zawsze sprzątaj

Jeśli zapomnisz zniszczyć swoje widgety w `OnMissionFinish`, korzeń widgetów wycieknie do następnej sesji. Po kilku przeskokach między serwerami gracz kończy ze spiętrzonymymi widgetami-duchami zużywającymi pamięć. Zawsze łącz `Init()` z `Destroy()`.

---

## Krok 4: Żądanie danych z serwera

Liczba graczy jest znana tylko na serwerze. Potrzebujemy prostego cyklu RPC (Remote Procedure Call): klient wysyła żądanie, serwer odczytuje dane i odsyła je z powrotem.

### Krok 4a: Zdefiniuj identyfikator RPC

Identyfikatory RPC muszą być unikalne we wszystkich modach. Definiujemy nasz w warstwie `3_Game`, aby zarówno kod klienta, jak i serwera mógł się do niego odwoływać.

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// Identyfikatory RPC dla Server Info HUD.
// Używanie wysokich numerów, aby uniknąć konfliktów z vanilla i innymi modami.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**Dlaczego `3_Game`?** Stałe i enumy należą do najniższej warstwy, do której zarówno klient, jak i serwer mają dostęp. Warstwa `3_Game` ładuje się przed `4_World` i `5_Mission`, więc obie strony widzą te wartości.

### Krok 4b: Handler po stronie serwera

Serwer nasłuchuje `SIH_RPC_REQUEST_INFO`, zbiera dane i odpowiada `SIH_RPC_RESPONSE_INFO`.

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

        // Zbierz informacje o serwerze
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // Pobierz listę graczy
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // Maksymalna liczba graczy z konfiguracji serwera
        maxPlayers = GetGame().GetMaxPlayers();

        // Wyślij odpowiedź z powrotem do żądającego klienta
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Krok 4c: Odbiornik RPC po stronie klienta

Klient odbiera odpowiedź i aktualizuje HUD.

Dodaj to do tego samego pliku `ServerInfoHUD.c` (na dole, poza klasą) lub utwórz osobny plik w `5_Mission/ServerInfoHUD/`:

Dodaj poniższe **pod** klasą `ServerInfoHUD` w `ServerInfoHUD.c`:

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

        // Dostęp do HUD przez MissionGameplay
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

### Jak działa przepływ RPC

```
KLIENT                           SERWER
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | odczytuje serverName, playerCount, maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | aktualizuje tekst HUD         |
```

Klient wysyła żądanie raz na sekundę (ograniczane przez timer aktualizacji). Serwer odpowiada trzema wartościami zapakowanymi w kontekst RPC. Klient odczytuje je w tej samej kolejności, w jakiej zostały zapisane.

**Ważne:** `rpc.Write()` i `ctx.Read()` muszą używać tych samych typów w tej samej kolejności. Jeśli serwer zapisuje `string` a potem dwie wartości `int`, klient musi odczytać `string` a potem dwie wartości `int`.

---

## Krok 5: Dodanie przełącznika ze skrótem klawiszowym

### Krok 5a: Zdefiniuj wejście w `inputs.xml`

DayZ używa `inputs.xml` do rejestrowania własnych akcji klawiszy. Plik musi być umieszczony w `Scripts/data/inputs.xml` i odwoływany z `config.cpp`.

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

| Element | Przeznaczenie |
|---------|---------------|
| `<actions>` | Deklaruje akcję wejścia po nazwie. `loc` to ciąg wyświetlany w menu opcji przypisywania klawiszy. |
| `<preset>` | Przypisuje domyślny klawisz. `kF7` mapuje się na klawisz F7. |

### Krok 5b: Odwołanie do `inputs.xml` w `config.cpp`

Twój `config.cpp` musi powiedzieć silnikowi, gdzie znaleźć plik inputs. Dodaj wpis `inputs` wewnątrz bloku `defs`:

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

### Krok 5c: Odczyt naciśnięcia klawisza

Obsługujemy to już w hooku `MissionGameplay` z Kroku 3:

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` zwraca singleton API wejścia. `GetInputByName` wyszukuje naszą zarejestrowaną akcję. `LocalPress()` zwraca `true` przez dokładnie jedną klatkę, gdy klawisz jest wciśnięty.

### Referencja nazw klawiszy

Popularne nazwy klawiszy dla `<btn>`:

| Nazwa klawisza | Klawisz |
|----------------|---------|
| `kF1` do `kF12` | Klawisze funkcyjne |
| `kH`, `kI` itp. | Klawisze literowe |
| `kNumpad0` do `kNumpad9` | Klawiatura numeryczna |
| `kLControl` | Lewy Control |
| `kLShift` | Lewy Shift |
| `kLAlt` | Lewy Alt |

Kombinacje z modyfikatorami używają zagnieżdżenia:

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

To oznacza "przytrzymaj lewy Control i naciśnij H."

---

## Krok 6: Polerowanie

### 6a: Animacja zanikania i pojawiania się

DayZ udostępnia `WidgetFadeTimer` do płynnych przejść alpha. Zaktualizuj klasę `ServerInfoHUD`, aby go używała:

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... istniejące pola ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // Zastąp metodę ToggleVisibility:
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

    // ... reszta klasy ...
};
```

`FadeIn(widget, duration)` animuje alpha widgetu od 0 do 1 w podanym czasie w sekundach. `FadeOut` przechodzi od 1 do 0 i ukrywa widget po zakończeniu.

### 6b: Panel tła z alpha

Ustawiliśmy to już w layoucie (`color="0 0 0 0.55"`), dając ciemną nakładkę z 55% przezroczystości. Jeśli chcesz dostosować alpha w czasie wykonania:

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

Funkcja `ARGB()` przyjmuje wartości całkowite 0-255 dla alpha, czerwonego, zielonego i niebieskiego.

### 6c: Wybór czcionek i kolorów

DayZ dostarcza kilka czcionek, do których można się odwoływać w layoutach:

| Ścieżka czcionki | Styl |
|-------------------|------|
| `gui/fonts/MetronBook` | Czysty sans-serif (używany w vanilla HUD) |
| `gui/fonts/MetronMedium` | Pogrubiona wersja MetronBook |
| `gui/fonts/Metron` | Najcieńszy wariant |
| `gui/fonts/luxuriousscript` | Dekoracyjny skrypt (unikaj w HUD) |

Aby zmienić kolor tekstu w czasie wykonania:

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d: Respektowanie innych elementów UI

Nasz `MissionHook.c` już wykrywa, gdy menu jest otwarte i wywołuje `SetMenuState(true)`. Oto dokładniejsze podejście, które sprawdza konkretnie ekwipunek:

```c
// W nadpisaniu OnUpdate zmodyfikowanego MissionGameplay:
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// Sprawdź również, czy ekwipunek jest otwarty
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

To zapewnia, że twój HUD chowa się za ekranem ekwipunku, menu pauzy, ekranem opcji i każdym innym menu skryptowym.

---

## Kompletna referencja kodu

Poniżej każdy plik w modzie, w jego finalnej formie ze wszystkimi udoskonaleniami.

### Plik 1: `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### Plik 2: `ServerInfoHUD/Scripts/config.cpp`

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

### Plik 3: `ServerInfoHUD/Scripts/data/inputs.xml`

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

### Plik 4: `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// Identyfikatory RPC dla Server Info HUD.
// Używanie wysokich numerów, aby uniknąć konfliktów z vanilla ERPC i innymi modami.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### Plik 5: `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

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

        // Tylko serwer obsługuje to RPC
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

        // Pobierz nazwę serwera
        string serverName = "";
        GetGame().GetHostName(serverName);

        // Policz graczy
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // Pobierz maksymalną liczbę slotów graczy
        int maxPlayers = GetGame().GetMaxPlayers();

        // Wyślij dane z powrotem do żądającego klienta
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Plik 6: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

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
// Odbiornik RPC po stronie klienta
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

### Plik 7: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

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

        // Wykryj otwarte menu
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

        // Klawisz przełącznika
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

### Plik 8: `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

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

## Rozszerzanie HUD

Gdy podstawowy HUD już działa, oto naturalne rozszerzenia.

### Dodawanie wyświetlania FPS

FPS można odczytać po stronie klienta bez żadnego RPC:

```c
// Dodaj pole TextWidget m_FPSText i znajdź je w Init()

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

Wywołuj `RefreshFPS()` obok `RefreshTime()` w metodzie aktualizacji. Zauważ, że `GetDeltaT()` zwraca czas bieżącej klatki, więc wartość FPS będzie fluktuować. Dla płynniejszego wyświetlania, uśredniaj po kilku klatkach:

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

    // Resetuj co sekundę (gdy główny timer się odpala)
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### Dodawanie pozycji gracza

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

### Wiele paneli HUD

Dla wielu paneli (kompas, status, minimapa) utwórz nadrzędną klasę menadżera, która przechowuje tablicę elementów HUD:

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

### Przeciągalne elementy HUD

Uczynienie widgetu przeciąganym wymaga obsługi zdarzeń myszy przez `ScriptedWidgetEventHandler`:

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

Uwaga: aby przeciąganie działało, widget musi mieć wywołane `SetHandler(this)`, aby handler zdarzeń odbierał zdarzenia. Ponadto kursor musi być widoczny, co ogranicza przeciągalne HUD do sytuacji, gdy aktywne jest menu lub tryb edycji.

---

## Częste błędy

### 1. Aktualizacja co klatkę zamiast z ograniczeniem

**Źle:**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // Wykonuje się 60+ razy na sekundę!
    m_ServerInfoHUD.RequestServerInfo(); // Wysyła 60+ RPC na sekundę!
}
```

**Dobrze:** Użyj akumulatora timera (jak pokazano w samouczku), aby kosztowne operacje wykonywały się najwyżej raz na sekundę. Tekst HUD zmieniający się co klatkę (jak licznik FPS) może być aktualizowany per klatkę, ale żądania RPC muszą być ograniczane.

### 2. Brak czyszczenia w OnMissionFinish

**Źle:**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // Brak czyszczenia gdziekolwiek -- widget wycieka przy rozłączeniu!
    }
};
```

**Dobrze:** Zawsze niszcz widgety i nulluj referencje w `OnMissionFinish()`. Destruktor (`~ServerInfoHUD`) jest siatką bezpieczeństwa, ale nie polegaj na nim -- `OnMissionFinish` jest właściwym miejscem na jawne czyszczenie.

### 3. HUD za innymi elementami UI

Widgety utworzone później renderują się nad widgetami utworzonymi wcześniej. Jeśli twój HUD pojawia się za vanilla UI, został utworzony zbyt wcześnie. Rozwiązania:

- Utwórz HUD później w sekwencji inicjalizacji (np. przy pierwszym wywołaniu `OnUpdate` zamiast w `OnInit`).
- Użyj `m_Root.SetSort(100)` aby wymusić wyższy porządek sortowania, przesuwając twój widget nad inne.

### 4. Żądanie danych zbyt często (spam RPC)

Wysyłanie RPC co klatkę tworzy 60+ pakietów sieciowych na sekundę na podłączonego gracza. Na serwerze z 60 graczami to 3600 pakietów na sekundę niepotrzebnego ruchu. Zawsze ograniczaj żądania RPC. Raz na sekundę jest rozsądne dla niekrytycznych informacji. Dla danych, które rzadko się zmieniają (jak nazwa serwera), możesz żądać ich tylko raz przy inicjalizacji i cachować.

### 5. Zapominanie o wywołaniu `super`

```c
// ŹLE: łamie funkcjonalność vanilla HUD
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // Brak super.OnInit()! Vanilla HUD nie zostanie zainicjalizowany.
}
```

Zawsze wywołuj `super.OnInit()` (oraz `super.OnUpdate()`, `super.OnMissionFinish()`) jako pierwsze. Pominięcie wywołania super łamie implementację vanilla i każdy inny mod, który hookuje tę samą metodę.

### 6. Użycie niewłaściwej warstwy skryptowej

Jeśli spróbujesz odwołać się do `MissionGameplay` z `4_World`, otrzymasz błąd "Undefined type", ponieważ typy `5_Mission` nie są widoczne dla `4_World`. Stałe RPC trafiają do `3_Game`, handler serwera do `4_World` (modyfikując `PlayerBase`, który tam mieszka), a klasa HUD i hook misji do `5_Mission`.

### 7. Zahardkodowana ścieżka layoutu

Ścieżka layoutu w `CreateWidgets()` jest relatywna do ścieżek wyszukiwania gry. Jeśli prefiks twojego PBO nie pasuje do ciągu ścieżki, layout się nie załaduje i `CreateWidgets` zwróci NULL. Zawsze sprawdzaj NULL po `CreateWidgets` i loguj błąd, jeśli się nie powiodło.

---

## Następne kroki

Teraz, gdy masz działającą nakładkę HUD, rozważ następujące progresje:

1. **Zapisuj preferencje użytkownika** -- Przechowuj, czy HUD jest widoczny w lokalnym pliku JSON, aby stan przełącznika był zachowany między sesjami.
2. **Dodaj konfigurację po stronie serwera** -- Pozwól administratorom serwera włączać/wyłączać HUD lub wybierać, które pola pokazywać przez plik JSON konfiguracji.
3. **Zbuduj nakładkę administratora** -- Rozszerz HUD o wyświetlanie informacji tylko dla administratorów (wydajność serwera, liczba encji, timer restartu) używając sprawdzania uprawnień.
4. **Utwórz HUD kompasu** -- Użyj `GetGame().GetCurrentCameraDirection()` do obliczenia kierunku i wyświetl pasek kompasu na górze ekranu.
5. **Przestudiuj istniejące mody** -- Spójrz na HUD questów DayZ Expansion i system nakładek Colorful UI dla implementacji HUD klasy produkcyjnej.

---

## Najlepsze praktyki

- **Ograniczaj `OnUpdate` do interwałów minimum 1-sekundowych.** Używaj akumulatora timera, aby uniknąć uruchamiania kosztownych operacji (żądania RPC, formatowanie tekstu) 60+ razy na sekundę. Tylko per-klatkowe wizualizacje jak liczniki FPS powinny być aktualizowane co klatkę.
- **Ukrywaj HUD gdy ekwipunek lub jakiekolwiek menu jest otwarte.** Sprawdzaj `GetGame().GetUIManager().GetMenu()` przy każdej aktualizacji i tłum swoją nakładkę. Nakładające się elementy UI dezorientują graczy i blokują interakcję.
- **Zawsze sprzątaj widgety w `OnMissionFinish`.** Wyciekające korzenie widgetów utrzymują się między przeskokami serwerów, piętrzą panele-duchy, które konsumują pamięć i ostatecznie powodują glicze wizualne.
- **Używaj `SetSort()` do kontrolowania kolejności renderowania.** Jeśli twój HUD pojawia się za elementami vanilla, wywołaj `m_Root.SetSort(100)`, aby go przesunąć wyżej. Bez jawnego porządku sortowania, czas tworzenia determinuje warstwowanie.
- **Cachuj dane serwera, które rzadko się zmieniają.** Nazwa serwera nie zmienia się podczas sesji. Zażądaj jej raz przy inicjalizacji i cachuj lokalnie zamiast ponownie żądać co sekundę.

---

## Teoria a praktyka

| Koncepcja | Teoria | Rzeczywistość |
|-----------|--------|---------------|
| `OnUpdate(float timeslice)` | Wywoływane raz na klatkę z deltą czasu klatki | Na kliencie z 144 FPS, to odpala się 144 razy na sekundę. Wysyłanie RPC przy każdym wywołaniu tworzy 144 pakiety sieciowe na sekundę na gracza. Zawsze akumuluj `timeslice` i działaj tylko gdy suma przekroczy twój interwał. |
| Ścieżka layoutu w `CreateWidgets()` | Ładuje layout ze wskazanej ścieżki | Ścieżka jest relatywna do prefiksu PBO, nie do systemu plików. Jeśli prefiks twojego PBO nie pasuje do ciągu ścieżki, `CreateWidgets` cicho zwraca NULL bez błędu w logu. |
| `WidgetFadeTimer` | Płynnie animuje przezroczystość widgetu | `FadeOut` ukrywa widget po zakończeniu animacji, ale `FadeIn` NIE wywołuje `Show(true)` jako pierwsze. Musisz ręcznie pokazać widget przed wywołaniem `FadeIn`, inaczej nic się nie pojawi. |
| `GetUApi().GetInputByName()` | Zwraca akcję wejścia dla twojego własnego skrótu klawiszowego | Jeśli `inputs.xml` nie jest odwoływany w `config.cpp` pod `class inputs`, nazwa akcji jest nieznana i `GetInputByName` zwraca null, powodując crash na `.LocalPress()`. |

---

## Czego się nauczyłeś

W tym samouczku nauczyłeś się:
- Jak tworzyć layout HUD z zakotwiczonymi, półprzezroczystymi panelami
- Jak budować klasę kontrolera, która ogranicza aktualizacje do stałego interwału
- Jak podpinać się do `MissionGameplay` do zarządzania cyklem życia HUD (inicjalizacja, aktualizacja, czyszczenie)
- Jak żądać danych serwera przez RPC i wyświetlać je na kliencie
- Jak rejestrować własny skrót klawiszowy przez `inputs.xml` i przełączać widoczność HUD z animacjami zanikania

**Poprzedni:** [Rozdział 8.7: Publikacja na Steam Workshop](07-publishing-workshop.md)
