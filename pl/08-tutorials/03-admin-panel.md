# Rozdział 8.3: Budowanie modułu panelu administracyjnego

[Strona główna](../../README.md) | [<< Poprzedni: Tworzenie niestandardowego przedmiotu](02-custom-item.md) | **Budowanie panelu administracyjnego** | [Następny: Dodawanie komend czatu >>](04-chat-commands.md)

---

> **Podsumowanie:** Ten tutorial przeprowadzi cię przez budowanie kompletnego modułu panelu administracyjnego od zera. Stworzysz layout UI, powiążesz widżety w skrypcie, obsłużysz kliknięcia przycisków, wyślesz RPC z klienta do serwera, przetworzysz żądanie na serwerze, odeślesz odpowiedź i wyświetlisz wynik w interfejsie. Obejmuje to pełny cykl klient-serwer-klient, który potrzebuje każdy mod sieciowy.

---

## Spis treści

- [Co budujemy](#what-we-are-building)
- [Wymagania wstępne](#prerequisites)
- [Przegląd architektury](#architecture-overview)
- [Krok 1: Tworzenie klasy modułu](#step-1-create-the-module-class)
- [Krok 2: Tworzenie pliku layoutu](#step-2-create-the-layout-file)
- [Krok 3: Wiązanie widżetów w OnActivated](#step-3-bind-widgets-in-onactivated)
- [Krok 4: Obsługa kliknięć przycisków](#step-4-handle-button-clicks)
- [Krok 5: Wysyłanie RPC do serwera](#step-5-send-an-rpc-to-the-server)
- [Krok 6: Obsługa odpowiedzi po stronie serwera](#step-6-handle-the-server-side-response)
- [Krok 7: Aktualizacja UI odebranymi danymi](#step-7-update-the-ui-with-received-data)
- [Krok 8: Rejestracja modułu](#step-8-register-the-module)
- [Kompletna dokumentacja plików](#complete-file-reference)
- [Pełny cykl roundtrip wyjaśniony](#the-full-roundtrip-explained)
- [Rozwiązywanie problemów](#troubleshooting)
- [Następne kroki](#next-steps)

---

## Co budujemy

Stworzymy panel **Admin Player Info**, który:

1. Wyświetla przycisk "Refresh" w prostym panelu UI
2. Gdy administrator kliknie Refresh, wysyła RPC do serwera z żądaniem danych o liczbie graczy
3. Serwer odbiera żądanie, zbiera informacje i odsyła je z powrotem
4. Klient odbiera odpowiedź i wyświetla liczbę graczy oraz ich listę w interfejsie

Demonstruje to podstawowy wzorzec używany przez każde sieciowe narzędzie administracyjne, panel konfiguracji moda i interfejs wieloosobowy w DayZ.

---

## Wymagania wstępne

- Działający mod z [Rozdziału 8.1](01-first-mod.md) lub nowy mod ze standardową strukturą
- Zrozumienie [5-warstwowej hierarchii skryptów](../02-mod-structure/01-five-layers.md) (użyjemy `3_Game`, `4_World` i `5_Mission`)
- Podstawowa umiejętność czytania kodu Enforce Script

### Struktura moda dla tego tutoriala

Stworzymy następujące nowe pliki:

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

## Przegląd architektury

Zanim zaczniesz pisać kod, zrozum przepływ danych:

```
KLIENT                              SERWER
------                              ------

1. Administrator klika "Refresh"
2. Klient wysyła RPC ------>  3. Serwer odbiera RPC
   (AdminDemo_RequestInfo)       Zbiera dane o graczach
                             4. Serwer wysyła RPC ------>  KLIENT
                                (AdminDemo_ResponseInfo)
                                                     5. Klient odbiera RPC
                                                        Aktualizuje tekst w UI
```

System RPC (Remote Procedure Call) to sposób, w jaki klient i serwer komunikują się w DayZ. Silnik udostępnia metody `GetGame().RPCSingleParam()` i `GetGame().RPC()` do wysyłania danych oraz nadpisanie `OnRPC()` do ich odbierania.

**Kluczowe ograniczenia:**
- Klienci nie mogą bezpośrednio odczytywać danych po stronie serwera (lista graczy, stan serwera)
- Cała komunikacja między stronami musi przechodzić przez RPC
- Wiadomości RPC są identyfikowane przez identyfikatory liczbowe
- Dane są wysyłane jako serializowane parametry za pomocą klas `Param`

---

## Krok 1: Tworzenie klasy modułu

Najpierw zdefiniuj identyfikatory RPC w `3_Game` (najwcześniejsza warstwa, w której dostępne są typy gry). Identyfikatory RPC muszą być zdefiniowane w `3_Game`, ponieważ zarówno `4_World` (handler serwera), jak i `5_Mission` (handler klienta) muszą się do nich odwoływać.

### Utwórz `Scripts/3_Game/AdminDemo/AdminDemoRPC.c`

```c
class AdminDemoRPC
{
    // Identyfikatory RPC -- wybierz unikalne numery, które nie kolidują z innymi modami
    // Używanie wysokich numerów zmniejsza ryzyko kolizji
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

Te stałe będą używane zarówno przez klienta (do wysyłania żądań), jak i przez serwer (do identyfikacji przychodzących żądań i wysyłania odpowiedzi).

### Dlaczego 3_Game?

Identyfikatory RPC to czyste dane -- liczby całkowite bez zależności od encji świata czy UI. Umieszczenie ich w `3_Game` czyni je widocznymi zarówno dla `4_World` (gdzie znajduje się handler serwera), jak i `5_Mission` (gdzie znajduje się UI klienta).

---

## Krok 2: Tworzenie pliku layoutu

Plik layoutu definiuje strukturę wizualną twojego panelu. DayZ używa niestandardowego formatu tekstowego (nie XML) dla plików `.layout`.

### Utwórz `GUI/layouts/admin_player_info.layout`

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

### Opis layoutu

| Widżet | Przeznaczenie |
|--------|---------------|
| `AdminDemoPanel` | Główna ramka, 40% szerokości i 50% wysokości, wyśrodkowana na ekranie |
| `Background` | Ciemne półprzezroczyste tło wypełniające cały panel |
| `Title` | Tekst "Player Info Panel" na górze |
| `RefreshButton` | Przycisk, który administrator klika, aby zażądać danych |
| `PlayerCountText` | Wyświetla liczbę graczy |
| `PlayerListText` | Wyświetla listę nazw graczy |
| `CloseButton` | Zamyka panel |

Wszystkie rozmiary używają współrzędnych proporcjonalnych (0.0 do 1.0 względem rodzica), ponieważ `hexactsize` i `vexactsize` są ustawione na `0`.

---

## Krok 3: Wiązanie widżetów w OnActivated

Teraz utwórz skrypt panelu po stronie klienta, który ładuje layout i łączy widżety ze zmiennymi.

### Utwórz `Scripts/5_Mission/AdminDemo/AdminDemoPanel.c`

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
    // Otwórz panel: utwórz widżety i powiąż referencje
    // -------------------------------------------------------
    void Open()
    {
        if (m_IsOpen)
            return;

        // Załaduj plik layoutu i pobierz główny widżet
        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERROR: Failed to load layout file!");
            return;
        }

        // Powiąż referencje widżetów po nazwie
        m_RefreshButton  = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton    = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        // Zarejestruj tę klasę jako handler zdarzeń dla widżetów
        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        // Pokaż kursor myszy, aby administrator mógł klikać przyciski
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Panel opened.");
    }

    // -------------------------------------------------------
    // Zamknij panel: zniszcz widżety i przywróć sterowanie
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

        // Przywróć sterowanie gracza i ukryj kursor
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Panel closed.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -------------------------------------------------------
    // Przełącz otwieranie/zamykanie
    // -------------------------------------------------------
    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    // -------------------------------------------------------
    // Obsługa zdarzeń kliknięcia przycisków
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
    // Wywoływane, gdy administrator kliknie Refresh
    // -------------------------------------------------------
    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh clicked, sending RPC to server...");

        // Zaktualizuj UI, aby pokazać stan ładowania
        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Requesting data from server...");

        // Wyślij RPC do serwera
        // Parametry: obiekt docelowy, ID RPC, dane, odbiorca (null = serwer)
        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    // -------------------------------------------------------
    // Wywoływane, gdy nadejdzie odpowiedź serwera (z OnRPC misji)
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

### Kluczowe koncepcje

**`CreateWidgets()`** ładuje plik `.layout` i tworzy rzeczywiste obiekty widżetów w pamięci. Zwraca główny widżet.

**`FindAnyWidget("name")`** przeszukuje drzewo widżetów w poszukiwaniu widżetu o podanej nazwie. Nazwa musi dokładnie odpowiadać nazwie widżetu w pliku layoutu.

**`Cast()`** konwertuje ogólną referencję `Widget` na konkretny typ (jak `ButtonWidget`). Jest to wymagane, ponieważ `FindAnyWidget` zwraca bazowy typ `Widget`.

**`SetHandler(this)`** rejestruje tę klasę jako handler zdarzeń dla widżetu. Gdy przycisk zostanie kliknięty, silnik wywoła `OnClick()` na tym obiekcie.

**`PlayerControlDisable` / `PlayerControlEnable`** wyłącza/ponownie włącza ruch i akcje gracza. Bez tego gracz chodziłby podczas próby klikania przycisków.

---

## Krok 4: Obsługa kliknięć przycisków

Obsługa kliknięć przycisków jest już zaimplementowana w metodzie `OnClick()` z Kroku 3. Przyjrzyjmy się bliżej temu wzorcowi.

### Wzorzec OnClick

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_RefreshButton)
    {
        OnRefreshClicked();
        return true;    // Zdarzenie obsłużone -- zatrzymaj propagację
    }

    if (w == m_CloseButton)
    {
        Close();
        return true;
    }

    return false;        // Zdarzenie nieobsłużone -- pozwól na propagację
}
```

**Parametry:**
- `w` -- Widżet, który został kliknięty
- `x`, `y` -- Współrzędne myszy w momencie kliknięcia
- `button` -- Który przycisk myszy (0 = lewy, 1 = prawy, 2 = środkowy)

**Wartość zwracana:**
- `true` oznacza, że obsłużyłeś zdarzenie. Zatrzymuje propagację do widżetów nadrzędnych.
- `false` oznacza, że go nie obsłużyłeś. Silnik przekazuje je do następnego handlera.

**Wzorzec:** Porównaj kliknięty widżet `w` z twoimi znanymi referencjami widżetów. Wywołaj metodę handlera dla każdego rozpoznanego przycisku. Zwróć `true` dla obsłużonych kliknięć, `false` dla wszystkiego innego.

---

## Krok 5: Wysyłanie RPC do serwera

Gdy administrator kliknie Refresh, musimy wysłać wiadomość z klienta do serwera. DayZ zapewnia do tego system RPC.

### Wysyłanie RPC (klient do serwera)

Główne wywołanie wysyłania z Kroku 3:

```c
Man player = GetGame().GetPlayer();
if (player)
{
    Param1<bool> params = new Param1<bool>(true);
    GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
}
```

**`GetGame().RPCSingleParam(target, rpcID, params, guaranteed)`:**

| Parametr | Znaczenie |
|-----------|---------|
| `target` | Obiekt, z którym to RPC jest powiązane. Używanie gracza to standard. |
| `rpcID` | Twój unikalny identyfikator liczbowy (zdefiniowany w `AdminDemoRPC`). |
| `params` | Obiekt `Param` niosący ładunek danych. |
| `guaranteed` | `true` = niezawodna dostawa typu TCP. `false` = typ UDP fire-and-forget. Zawsze używaj `true` dla operacji administracyjnych. |

### Klasy Param

DayZ udostępnia szablonowe klasy `Param` do wysyłania danych:

| Klasa | Użycie |
|-------|-------|
| `Param1<T>` | Jedna wartość |
| `Param2<T1, T2>` | Dwie wartości |
| `Param3<T1, T2, T3>` | Trzy wartości |

Możesz wysyłać ciągi znaków, inty, floaty, boole i wektory. Przykład z wieloma wartościami:

```c
Param3<string, int, float> data = new Param3<string, int, float>("hello", 42, 3.14);
GetGame().RPCSingleParam(player, MY_RPC_ID, data, true);
```

---

## Krok 6: Obsługa odpowiedzi po stronie serwera

Serwer odbiera RPC klienta, zbiera dane i wysyła odpowiedź z powrotem.

### Utwórz `Scripts/4_World/AdminDemo/AdminDemoServer.c`

```c
modded class PlayerBase
{
    // -------------------------------------------------------
    // Handler RPC po stronie serwera
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Obsługuj tylko na serwerze
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
    // Zbierz dane o graczach i wyślij odpowiedź
    // -------------------------------------------------------
    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Server received player info request from: " + requestor.GetName());

        // --- Sprawdzanie uprawnień (opcjonalne, ale zalecane) ---
        // W prawdziwym modzie sprawdź, czy żądający jest administratorem:
        // if (!IsAdmin(requestor))
        //     return;

        // --- Zbierz dane o graczach ---
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

        // --- Wyślij odpowiedź z powrotem do żądającego klienta ---
        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        // RPCSingleParam z obiektem gracza żądającego wysyła do tego konkretnego klienta
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

### Jak działa odbiór RPC po stronie serwera

1. **`OnRPC()` jest wywoływane na obiekcie docelowym.** Gdy klient wysłał RPC z `target = player`, uruchamia się `PlayerBase.OnRPC()` po stronie serwera.

2. **Zawsze wywołuj `super.OnRPC()`.** Inne mody i kod vanilla mogą również obsługiwać RPC na tym obiekcie.

3. **Sprawdź `GetGame().IsServer()`.** Ten kod jest w `4_World`, który kompiluje się zarówno na kliencie, jak i na serwerze. Sprawdzenie `IsServer()` zapewnia, że przetwarzamy żądanie tylko na serwerze.

4. **Przełączaj na `rpc_type`.** Dopasuj do swoich stałych identyfikatorów RPC.

5. **Wyślij odpowiedź.** Użyj `RPCSingleParam` z piątym parametrem (`recipient`) ustawionym na tożsamość żądającego gracza. Wysyła to odpowiedź tylko do tego konkretnego klienta.

### Sygnatura odpowiedzi RPCSingleParam

```c
GetGame().RPCSingleParam(
    requestorPlayer,                        // Obiekt docelowy (gracz)
    AdminDemoRPC.RESPONSE_PLAYER_INFO,      // ID RPC
    responseData,                           // Ładunek danych
    true,                                   // Gwarantowana dostawa
    requestor                               // Tożsamość odbiorcy (konkretny klient)
);
```

Piąty parametr `requestor` (`PlayerIdentity`) sprawia, że jest to odpowiedź skierowana. Bez niego RPC trafiłoby do wszystkich klientów.

---

## Krok 7: Aktualizacja UI odebranymi danymi

Po stronie klienta musimy przechwycić odpowiedź RPC serwera i przekierować ją do panelu.

### Utwórz `Scripts/5_Mission/AdminDemo/AdminDemoMission.c`

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    // -------------------------------------------------------
    // Zainicjalizuj panel przy starcie misji
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Client mission initialized.");
    }

    // -------------------------------------------------------
    // Wyczyść przy zakończeniu misji
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
    // Obsłuż wejście z klawiatury do przełączania panelu
    // -------------------------------------------------------
    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // Klawisz F5 przełącza panel administracyjny
        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    // -------------------------------------------------------
    // Odbieraj RPC serwera po stronie klienta
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
    // Deserializuj odpowiedź serwera i zaktualizuj panel
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

### Jak działa odbiór RPC po stronie klienta

1. **`MissionGameplay.OnRPC()`** to ogólny handler dla RPC odebranych na kliencie. Uruchamia się dla każdego przychodzącego RPC.

2. **`ParamsReadContext ctx`** zawiera serializowane dane wysłane przez serwer. Musisz je zdeserializować za pomocą `ctx.Read()` z odpowiadającym typem `Param`.

3. **Dopasowanie typów Param jest kluczowe.** Serwer wysłał `Param2<int, string>`. Klient musi odczytać za pomocą `Param2<int, string>`. Niezgodność powoduje, że `ctx.Read()` zwraca `false` i żadne dane nie są pobierane.

4. **Przekieruj dane do panelu.** Po deserializacji wywołaj metodę na obiekcie panelu, aby zaktualizować UI.

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

Podpina się to pod wejście klawiatury misji. Gdy administrator naciśnie F5, panel otwiera się lub zamyka. `KeyCode.KC_F5` to wbudowana stała dla klawisza F5.

---

## Krok 8: Rejestracja modułu

Na koniec połącz wszystko w config.cpp.

### Utwórz `AdminDemo/mod.cpp`

```cpp
name = "Admin Demo";
author = "YourName";
version = "1.0";
overview = "Tutorial admin panel demonstrating the full RPC roundtrip pattern.";
```

### Utwórz `AdminDemo/Scripts/config.cpp`

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

### Dlaczego trzy warstwy?

| Warstwa | Zawiera | Powód |
|---------|---------|-------|
| `3_Game` | `AdminDemoRPC.c` | Stałe identyfikatorów RPC muszą być widoczne zarówno dla `4_World`, jak i `5_Mission` |
| `4_World` | `AdminDemoServer.c` | Handler po stronie serwera modujący `PlayerBase` (encja świata) |
| `5_Mission` | `AdminDemoPanel.c`, `AdminDemoMission.c` | UI klienta i hooki misji |

---

## Kompletna dokumentacja plików

### Ostateczna struktura katalogów

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

## Pełny cykl roundtrip wyjaśniony

Oto dokładna sekwencja zdarzeń, gdy administrator naciśnie F5 i kliknie Refresh:

```
1. [KLIENT] Administrator naciska F5
   --> MissionGameplay.OnKeyPress(KC_F5) się uruchamia
   --> AdminDemoPanel.Toggle() jest wywoływane
   --> Panel się otwiera, layout jest tworzony, pojawia się kursor

2. [KLIENT] Administrator klika przycisk "Refresh"
   --> AdminDemoPanel.OnClick() się uruchamia z w == m_RefreshButton
   --> OnRefreshClicked() jest wywoływane
   --> UI pokazuje "Loading..."
   --> RPCSingleParam wysyła REQUEST_PLAYER_INFO (78001) do serwera

3. [SIEĆ] RPC podróżuje z klienta do serwera

4. [SERWER] PlayerBase.OnRPC() się uruchamia
   --> rpc_type pasuje do REQUEST_PLAYER_INFO
   --> HandlePlayerInfoRequest(sender) jest wywoływane
   --> Serwer iteruje po wszystkich połączonych graczach
   --> Buduje liczbę graczy i listę imion
   --> RPCSingleParam wysyła RESPONSE_PLAYER_INFO (78002) z powrotem do klienta

5. [SIEĆ] RPC podróżuje z serwera do klienta

6. [KLIENT] MissionGameplay.OnRPC() się uruchamia
   --> rpc_type pasuje do RESPONSE_PLAYER_INFO
   --> HandlePlayerInfoResponse(ctx) jest wywoływane
   --> Dane są deserializowane z ParamsReadContext
   --> AdminDemoPanel.OnPlayerInfoReceived() jest wywoływane
   --> UI aktualizuje się liczbą graczy i ich nazwami

Całkowity czas: typowo poniżej 100ms w sieci lokalnej.
```

---

## Rozwiązywanie problemów

### Panel nie otwiera się po naciśnięciu F5

- **Sprawdź nadpisanie OnKeyPress:** Upewnij się, że `super.OnKeyPress(key)` jest wywoływane jako pierwsze.
- **Sprawdź kod klawisza:** `KeyCode.KC_F5` to poprawna stała. Jeśli używasz innego klawisza, znajdź odpowiednią stałą w API Enforce Script.
- **Sprawdź inicjalizację:** Upewnij się, że `m_AdminDemoPanel` jest tworzony w `OnInit()`.

### Panel się otwiera, ale przyciski nie działają

- **Sprawdź SetHandler:** Każdy przycisk potrzebuje wywołania `button.SetHandler(this)`.
- **Sprawdź nazwy widżetów:** `FindAnyWidget("RefreshButton")` rozróżnia wielkość liter. Nazwa musi dokładnie odpowiadać plikowi layoutu.
- **Sprawdź zwracanie OnClick:** Upewnij się, że `OnClick` zwraca `true` dla obsłużonych przycisków.

### RPC nigdy nie dociera do serwera

- **Sprawdź unikalność identyfikatora RPC:** Jeśli inny mod używa tego samego numeru ID RPC, wystąpią konflikty. Używaj wysokich, unikalnych numerów.
- **Sprawdź referencję gracza:** `GetGame().GetPlayer()` zwraca `null`, jeśli jest wywoływane przed pełną inicjalizacją gracza. Upewnij się, że panel otwiera się dopiero po zrespawnowaniu gracza.
- **Sprawdź kompilację kodu serwera:** Sprawdź log skryptów serwera w poszukiwaniu błędów `SCRIPT (E)` w twoim kodzie `4_World`.

### Odpowiedź serwera nigdy nie dociera do klienta

- **Sprawdź parametr odbiorcy:** Piąty parametr `RPCSingleParam` musi być `PlayerIdentity` docelowego klienta.
- **Sprawdź dopasowanie typów Param:** Serwer wysyła `Param2<int, string>`, klient odczytuje `Param2<int, string>`. Niezgodność typów powoduje, że `ctx.Read()` zawodzi.
- **Sprawdź nadpisanie MissionGameplay.OnRPC:** Upewnij się, że wywołujesz `super.OnRPC()` i sygnatura metody jest poprawna.

### UI się wyświetla, ale dane się nie aktualizują

- **Puste referencje widżetów:** Jeśli `FindAnyWidget` zwróci `null` (niezgodność nazwy widżetu), wywołania `SetText()` cicho zawiodą.
- **Sprawdź referencję panelu:** Upewnij się, że `m_AdminDemoPanel` w klasie misji to ten sam obiekt, który został otwarty.
- **Dodaj instrukcje Print:** Śledź przepływ danych, dodając wywołania `Print()` na każdym etapie.

---

## Następne kroki

1. **[Rozdział 8.4: Dodawanie komend czatu](04-chat-commands.md)** -- Utwórz komendy czatu po stronie serwera dla operacji administracyjnych.
2. **Dodaj uprawnienia** -- Sprawdzaj, czy żądający gracz jest administratorem przed przetworzeniem RPC.
3. **Dodaj więcej funkcji** -- Rozszerz panel o zakładki do sterowania pogodą, teleportacji graczy, tworzenia przedmiotów.
4. **Użyj frameworka** -- Frameworki takie jak MyMod Core zapewniają wbudowany routing RPC, zarządzanie konfiguracją i infrastrukturę panelu administracyjnego, eliminując dużą część tego kodu szablonowego.
5. **Ostyluj UI** -- Poznaj style widżetów, zestawy obrazów i czcionki w [Rozdziale 3: System GUI](../03-gui-system/01-widget-types.md).

---

## Najlepsze praktyki

- **Waliduj wszystkie dane RPC na serwerze przed wykonaniem.** Nigdy nie ufaj danym od klienta -- zawsze sprawdzaj uprawnienia, waliduj parametry i zabezpieczaj się przed wartościami null przed wykonaniem jakiejkolwiek akcji na serwerze.
- **Cachuj referencje widżetów w zmiennych składowych zamiast wywoływać `FindAnyWidget` co klatkę.** Wyszukiwanie widżetów nie jest darmowe; wywoływanie go w `OnUpdate` lub `OnClick` wielokrotnie marnuje wydajność.
- **Zawsze wywołuj `SetHandler(this)` na interaktywnych widżetach.** Bez tego `OnClick()` nigdy się nie uruchomi i nie ma komunikatu o błędzie -- przyciski po prostu cicho nic nie robią.
- **Używaj wysokich, unikalnych numerów identyfikatorów RPC.** Vanilla DayZ używa niskich identyfikatorów. Inne mody wybierają popularne zakresy. Używaj numerów powyżej 70000 i dodawaj prefiks moda w komentarzach, aby kolizje były możliwe do śledzenia.
- **Sprzątaj widżety w `OnMissionFinish`.** Niezwolnione główne widżety narastają przy zmianach serwera, zużywając pamięć i powodując duchowe elementy UI.

---

## Teoria vs praktyka

| Koncepcja | Teoria | Rzeczywistość |
|---------|--------|---------|
| Dostawa `RPCSingleParam` | Ustawienie `guaranteed=true` oznacza, że RPC zawsze dotrze | RPC wciąż mogą być utracone, jeśli gracz rozłączy się w trakcie lotu lub serwer się zawiesi. Zawsze obsługuj przypadek "brak odpowiedzi" w swoim UI (np. komunikat o przekroczeniu limitu czasu). |
| Dopasowywanie widżetów w `OnClick` | Porównaj `w == m_Button`, aby zidentyfikować kliknięcia | Jeśli `FindAnyWidget` zwróciło NULL (literówka w nazwie widżetu), `m_Button` jest NULL i porównanie cicho zawiedzie. Zawsze loguj ostrzeżenie, jeśli wiązanie widżetu nie powiedzie się w `Open()`. |
| Dopasowanie typów Param | Klient i serwer używają tego samego `Param2<int, string>` | Jeśli typy lub kolejność nie pasują dokładnie, `ctx.Read()` zwraca false i dane są cicho utracone. Nie ma komunikatu o błędzie sprawdzania typów w czasie wykonywania. |
| Testowanie na listen server | Wystarczające do szybkiej iteracji | Listen servery uruchamiają klienta i serwer w jednym procesie, więc RPC docierają natychmiast i nigdy nie przechodzą przez sieć. Błędy synchronizacji, utrata pakietów i problemy z autoryzacją pojawiają się tylko na prawdziwym serwerze dedykowanym. |

---

## Czego się nauczyłeś

W tym tutorialu nauczyłeś się:
- Jak tworzyć panel UI z plikami layoutu i wiązać widżety w skrypcie
- Jak obsługiwać kliknięcia przycisków za pomocą `OnClick()` i `SetHandler()`
- Jak wysyłać RPC z klienta do serwera i z powrotem za pomocą `RPCSingleParam` i klas `Param`
- Pełny wzorzec roundtrip klient-serwer-klient używany przez każde sieciowe narzędzie administracyjne
- Jak rejestrować panel w `MissionGameplay` z właściwym zarządzaniem cyklem życia

**Następny:** [Rozdział 8.4: Dodawanie komend czatu](04-chat-commands.md)

---

**Poprzedni:** [Rozdział 8.2: Tworzenie niestandardowego przedmiotu](02-custom-item.md)
**Następny:** [Rozdział 8.4: Dodawanie komend czatu](04-chat-commands.md)
