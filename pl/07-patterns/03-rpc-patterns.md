# Rozdział 7.3: Wzorce komunikacji RPC

[Strona główna](../README.md) | [<< Poprzedni: Systemy modułów](02-module-systems.md) | **Wzorce komunikacji RPC** | [Dalej: Trwałość konfiguracji >>](04-config-persistence.md)

---

## Wprowadzenie

Zdalne wywoływanie procedur (RPC) to jedyny sposób przesyłania danych między klientem a serwerem w DayZ. Każdy panel administracyjny, każde zsynchronizowane UI, każde powiadomienie serwer-klient i każde żądanie akcji klient-serwer przepływa przez RPC. Zrozumienie jak je poprawnie budować --- z właściwą kolejnością serializacji, sprawdzaniem uprawnień i obsługą błędów --- jest niezbędne dla każdego moda, który robi więcej niż dodaje przedmioty do CfgVehicles.

Ten rozdział obejmuje fundamentalny wzorzec `ScriptRPC`, cykl życia komunikacji klient-serwer, obsługę błędów, a następnie porównuje trzy główne podejścia do routingu RPC stosowane w społeczności moddingu DayZ.

---

## Spis treści

- [Podstawy ScriptRPC](#podstawy-scriptrpc)
- [Podróż w obie strony klient-serwer-klient](#podróż-w-obie-strony-klient-serwer-klient)
- [Sprawdzanie uprawnień przed wykonaniem](#sprawdzanie-uprawnień-przed-wykonaniem)
- [Obsługa błędów i powiadomienia](#obsługa-błędów-i-powiadomienia)
- [Serializacja: kontrakt Read/Write](#serializacja-kontrakt-readwrite)
- [Porównanie trzech podejść RPC](#porównanie-trzech-podejść-rpc)
- [Częste błędy](#częste-błędy)
- [Dobre praktyki](#dobre-praktyki)

---

## Podstawy ScriptRPC

Każdy RPC w DayZ używa klasy `ScriptRPC`. Wzorzec jest zawsze taki sam: utwórz, zapisz dane, wyślij.

### Strona wysyłająca

```c
void SendDamageReport(PlayerIdentity target, string weaponName, float damage)
{
    ScriptRPC rpc = new ScriptRPC();

    // Zapisz pola w określonej kolejności
    rpc.Write(weaponName);    // pole 1: string
    rpc.Write(damage);        // pole 2: float

    // Wyślij przez silnik
    // Parametry: obiekt docelowy, ID RPC, gwarantowana dostawa, odbiorca
    rpc.Send(null, MY_RPC_ID, true, target);
}
```

### Strona odbierająca

Odbiorca czyta pola w **dokładnie tej samej kolejności** w jakiej zostały zapisane:

```c
void OnRPC_DamageReport(PlayerIdentity sender, Object target, ParamsReadContext ctx)
{
    string weaponName;
    if (!ctx.Read(weaponName)) return;  // pole 1: string

    float damage;
    if (!ctx.Read(damage)) return;      // pole 2: float

    // Użyj danych
    Print("Hit by " + weaponName + " for " + damage.ToString() + " damage");
}
```

### Wyjaśnienie parametrów Send

```c
rpc.Send(object, rpcId, guaranteed, identity);
```

| Parametr | Typ | Opis |
|-----------|------|-------------|
| `object` | `Object` | Encja docelowa (np. gracz lub pojazd). Użyj `null` dla globalnych RPC. |
| `rpcId` | `int` | Liczba całkowita identyfikująca ten typ RPC. Musi pasować po obu stronach. |
| `guaranteed` | `bool` | `true` = niezawodna (TCP-like, retransmituje przy utracie). `false` = zawodna (wyślij i zapomnij). |
| `identity` | `PlayerIdentity` | Odbiorca. `null` od klienta = wyślij do serwera. `null` od serwera = rozgłoś do wszystkich klientów. Konkretna tożsamość = wyślij do tego klienta. |

### Kiedy używać `guaranteed`

- **`true` (niezawodna):** Zmiany konfiguracji, nadawanie uprawnień, komendy teleportacji, akcje banowania --- wszystko gdzie utracony pakiet pozostawiłby klienta i serwer niesynchronizowane.
- **`false` (zawodna):** Szybkie aktualizacje pozycji, efekty wizualne, stan HUD który odświeża się co kilka sekund. Mniejszy narzut, brak kolejki retransmisji.

---

## Podróż w obie strony klient-serwer-klient

Najczęstszy wzorzec RPC to podróż w obie strony: klient żąda akcji, serwer waliduje i wykonuje, serwer odsyła wynik.

```
KLIENT                          SERWER
  │                               │
  │  1. RPC żądania ───────────►  │
  │     (akcja + parametry)       │
  │                               │  2. Walidacja uprawnień
  │                               │  3. Wykonanie akcji
  │                               │  4. Przygotowanie odpowiedzi
  │  ◄─────────── 5. RPC odpowiedzi │
  │     (wynik + dane)            │
  │                               │
  │  6. Aktualizacja UI           │
```

### Pełny przykład: żądanie teleportacji

**Klient wysyła żądanie:**

```c
class TeleportClient
{
    void RequestTeleport(vector position)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(position);
        rpc.Send(null, MY_RPC_TELEPORT, true, null);  // null identity = wyślij do serwera
    }
};
```

**Serwer odbiera, waliduje, wykonuje, odpowiada:**

```c
class TeleportServer
{
    void OnRPC_TeleportRequest(PlayerIdentity sender, Object target, ParamsReadContext ctx)
    {
        // 1. Odczytaj dane żądania
        vector position;
        if (!ctx.Read(position)) return;

        // 2. Sprawdź uprawnienia
        if (!MyPermissions.GetInstance().HasPermission(sender.GetPlainId(), "MyMod.Admin.Teleport"))
        {
            SendError(sender, "No permission to teleport");
            return;
        }

        // 3. Zwaliduj dane
        if (position[1] < 0 || position[1] > 1000)
        {
            SendError(sender, "Invalid teleport height");
            return;
        }

        // 4. Wykonaj akcję
        PlayerBase player = PlayerBase.Cast(sender.GetPlayer());
        if (!player) return;

        player.SetPosition(position);

        // 5. Wyślij odpowiedź sukcesu
        ScriptRPC response = new ScriptRPC();
        response.Write(true);           // flaga sukcesu
        response.Write(position);       // odeślij pozycję
        response.Send(null, MY_RPC_TELEPORT_RESULT, true, sender);
    }
};
```

**Klient odbiera odpowiedź:**

```c
class TeleportClient
{
    void OnRPC_TeleportResult(PlayerIdentity sender, Object target, ParamsReadContext ctx)
    {
        bool success;
        if (!ctx.Read(success)) return;

        vector position;
        if (!ctx.Read(position)) return;

        if (success)
        {
            // Aktualizacja UI: "Teleportowano do X, Y, Z"
        }
    }
};
```

---

## Sprawdzanie uprawnień przed wykonaniem

Każdy serwerowy handler RPC wykonujący uprzywilejowaną akcję **musi** sprawdzać uprawnienia przed wykonaniem. Nigdy nie ufaj klientowi.

### Wzorzec

```c
void OnRPC_AdminAction(PlayerIdentity sender, Object target, ParamsReadContext ctx)
{
    // ZASADA 1: Zawsze waliduj czy nadawca istnieje
    if (!sender) return;

    // ZASADA 2: Sprawdź uprawnienia przed odczytem danych
    if (!MyPermissions.GetInstance().HasPermission(sender.GetPlainId(), "MyMod.Admin.Ban"))
    {
        MyLog.Warning("BanRPC", "Unauthorized ban attempt from " + sender.GetName());
        return;
    }

    // ZASADA 3: Dopiero teraz odczytaj i wykonaj
    string targetUid;
    if (!ctx.Read(targetUid)) return;

    // ... wykonaj bana
}
```

### Dlaczego sprawdzać przed odczytem?

Odczytywanie danych od nieautoryzowanego klienta marnuje cykle serwera. Co ważniejsze, zniekształcone dane od złośliwego klienta mogą powodować błędy parsowania. Sprawdzenie uprawnień najpierw jest tanim zabezpieczeniem, które natychmiast odrzuca złych aktorów.

### Loguj nieautoryzowane próby

Zawsze loguj nieudane sprawdzenia uprawnień. Tworzy to ścieżkę audytu i pomaga właścicielom serwerów wykrywać próby exploitów:

```c
if (!HasPermission(sender, "MyMod.Spawn"))
{
    MyLog.Warning("SpawnRPC", "Denied spawn request from "
        + sender.GetName() + " (" + sender.GetPlainId() + ")");
    return;
}
```

---

## Obsługa błędów i powiadomienia

RPC mogą zawieść na wiele sposobów: utrata sieci, zniekształcone dane, błędy walidacji po stronie serwera. Solidne mody obsługują wszystkie te przypadki.

### Błędy odczytu

Każdy `ctx.Read()` może się nie powieść. Zawsze sprawdzaj wartość zwrotną:

```c
// ŹLE: Ignorowanie błędów odczytu
string name;
ctx.Read(name);     // Jeśli to zawiedzie, name to "" — cicha korupcja
int count;
ctx.Read(count);    // To czyta złe bajty — wszystko po jest śmieciami

// DOBRZE: Wczesny powrót przy każdym błędzie odczytu
string name;
if (!ctx.Read(name)) return;
int count;
if (!ctx.Read(count)) return;
```

### Wzorzec odpowiedzi błędu

Gdy serwer odrzuca żądanie, wyślij strukturalny błąd z powrotem do klienta, aby UI mógł go wyświetlić:

```c
// Serwer: wyślij błąd
void SendError(PlayerIdentity target, string errorMsg)
{
    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(false);        // success = false
    rpc.Write(errorMsg);     // powód
    rpc.Send(null, MY_RPC_RESPONSE_ID, true, target);
}

// Klient: obsłuż błąd
void OnRPC_Response(PlayerIdentity sender, Object target, ParamsReadContext ctx)
{
    bool success;
    if (!ctx.Read(success)) return;

    if (!success)
    {
        string errorMsg;
        if (!ctx.Read(errorMsg)) return;

        // Pokaż błąd w UI
        MyLog.Warning("MyMod", "Server error: " + errorMsg);
        return;
    }

    // Obsłuż sukces...
}
```

### Rozgłaszanie powiadomień

Dla zdarzeń, które powinni widzieć wszyscy klienci (killfeed, ogłoszenia, zmiany pogody), serwer rozgłasza z `identity = null`:

```c
// Serwer: rozgłoś do wszystkich klientów
void BroadcastAnnouncement(string message)
{
    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(message);
    rpc.Send(null, RPC_ANNOUNCEMENT, true, null);  // null = wszyscy klienci
}
```

---

## Serializacja: kontrakt Read/Write

Najważniejsza zasada RPC w DayZ: **kolejność Read musi dokładnie odpowiadać kolejności Write, typ po typie.**

### Kontrakt

```c
// NADAWCA zapisuje:
rpc.Write("hello");      // 1. string
rpc.Write(42);           // 2. int
rpc.Write(3.14);         // 3. float
rpc.Write(true);         // 4. bool

// ODBIORCA czyta w TEJ SAMEJ kolejności:
string s;   ctx.Read(s);     // 1. string
int i;      ctx.Read(i);     // 2. int
float f;    ctx.Read(f);     // 3. float
bool b;     ctx.Read(b);     // 4. bool
```

### Co się dzieje gdy kolejność nie pasuje

Jeśli zamienisz kolejność odczytu, deserializator interpretuje bajty przeznaczone dla jednego typu jako inny. Odczyt `int` gdzie zapisano `string` zwróci śmieci, a każdy kolejny odczyt będzie przesunięty --- korupcja wszystkich pozostałych pól. Silnik nie rzuca wyjątku; cicho zwraca złe dane lub powoduje, że `Read()` zwraca `false`.

### Obsługiwane typy

| Typ | Uwagi |
|------|-------|
| `int` | 32-bitowy ze znakiem |
| `float` | 32-bitowy IEEE 754 |
| `bool` | Pojedynczy bajt |
| `string` | UTF-8 z prefiksem długości |
| `vector` | Trzy floaty (x, y, z) |
| `Object` (jako parametr target) | Referencja encji, rozwiązywana przez silnik |

### Serializacja kolekcji

Nie ma wbudowanej serializacji tablic. Zapisz najpierw liczbę, potem każdy element:

```c
// NADAWCA
array<string> names = {"Alice", "Bob", "Charlie"};
rpc.Write(names.Count());
for (int i = 0; i < names.Count(); i++)
{
    rpc.Write(names[i]);
}

// ODBIORCA
int count;
if (!ctx.Read(count)) return;

array<string> names = new array<string>();
for (int i = 0; i < count; i++)
{
    string name;
    if (!ctx.Read(name)) return;
    names.Insert(name);
}
```

### Serializacja złożonych obiektów

Dla złożonych danych serializuj pole po polu. Nie próbuj przekazywać obiektów bezpośrednio przez `Write()`:

```c
// NADAWCA: spłaszcz obiekt do prymitywów
rpc.Write(player.GetName());
rpc.Write(player.GetHealth());
rpc.Write(player.GetPosition());

// ODBIORCA: zrekonstruuj
string name;    ctx.Read(name);
float health;   ctx.Read(health);
vector pos;     ctx.Read(pos);
```

---

## Porównanie trzech podejść RPC

Społeczność moddingu DayZ używa trzech fundamentalnie różnych podejść do routingu RPC. Każde ma swoje kompromisy.

### 1. Nazwane RPC w CF

```mermaid
graph TB
    subgraph "Approach 1: Single ID + String Route"
        S1["All RPCs share<br/>one engine ID"]
        S1 --> S1D["Dispatcher reads<br/>route string from payload"]
        S1D --> S1H1["Handler A"]
        S1D --> S1H2["Handler B"]
        S1D --> S1H3["Handler C"]
    end

    subgraph "Approach 2: Integer Range per Module"
        S2M1["Module A<br/>IDs 10100-10119"]
        S2M2["Module B<br/>IDs 10200-10219"]
        S2M3["Module C<br/>IDs 10300-10319"]
    end

    subgraph "Approach 3: Hash-Based IDs"
        S3["ClassName::Method<br/>.Hash() → unique ID"]
        S3 --> S3C["Collision detection<br/>at registration"]
    end

    style S1 fill:#4A90D9,color:#fff
    style S2M1 fill:#2D8A4E,color:#fff
    style S3 fill:#D97A4A,color:#fff
```

Community Framework dostarcza `GetRPCManager()`, który routuje RPC po nazwach stringowych pogrupowanych według przestrzeni nazw moda.

```c
// Rejestracja (w OnInit):
GetRPCManager().AddRPC("MyMod", "RPC_SpawnItem", this, SingleplayerExecutionType.Server);

// Wysyłanie z klienta:
GetRPCManager().SendRPC("MyMod", "RPC_SpawnItem", new Param1<string>("AK74"), true);

// Handler odbiera:
void RPC_SpawnItem(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;

    Param1<string> data;
    if (!ctx.Read(data)) return;

    string className = data.param1;
    // ... spawnuj przedmiot
}
```

**Zalety:**
- Routing stringowy jest czytelny i wolny od kolizji
- Grupowanie przestrzenią nazw (`"MyMod"`) zapobiega konfliktom nazw między modami
- Szeroko używane --- jeśli integrujesz się z COT/Expansion, tego używasz

**Wady:**
- Wymaga CF jako zależności
- Używa wrapperów `Param` które są rozwlekłe dla złożonych danych
- Porównanie stringów przy każdym rozsyłaniu (minimalny narzut)

### 2. RPC z zakresem Integer (COT / Vanilla)

Vanilla DayZ i niektóre części COT używają surowych integerowych ID RPC. Każdy mod rezerwuje zakres integerów i rozsyła w zmoddowanym nadpisaniu `OnRPC`.

```c
// Zdefiniuj swoje ID RPC (wybierz unikalny zakres aby uniknąć kolizji)
const int MY_RPC_SPAWN_ITEM     = 90001;
const int MY_RPC_DELETE_ITEM    = 90002;
const int MY_RPC_TELEPORT       = 90003;

// Wysyłanie:
ScriptRPC rpc = new ScriptRPC();
rpc.Write("AK74");
rpc.Send(null, MY_RPC_SPAWN_ITEM, true, null);

// Odbieranie (w zmoddowanym DayZGame lub encji):
modded class DayZGame
{
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        switch (rpc_type)
        {
            case MY_RPC_SPAWN_ITEM:
                HandleSpawnItem(sender, ctx);
                return;
            case MY_RPC_DELETE_ITEM:
                HandleDeleteItem(sender, ctx);
                return;
        }

        super.OnRPC(sender, target, rpc_type, ctx);
    }
};
```

**Zalety:**
- Brak zależności --- działa z vanilla DayZ
- Porównanie integerów jest szybkie
- Pełna kontrola nad pipeline'em RPC

**Wady:**
- **Ryzyko kolizji ID**: dwa mody wybierające ten sam zakres integerów cicho przechwytują nawzajem swoje RPC
- Ręczna logika rozsyłania (switch/case) staje się nieporęczna przy wielu RPC
- Brak izolacji przestrzeni nazw
- Brak wbudowanego rejestru ani odkrywalności

### 3. Własne RPC routowane po stringach

Własny system routowany po stringach używa jednego ID RPC silnika i multipleksuje zapisując nazwę moda + nazwę funkcji jako nagłówek stringowy w każdym RPC. Cały routing odbywa się wewnątrz statycznej klasy managera (`MyRPC` w tym przykładzie).

```c
// Rejestracja:
MyRPC.Register("MyMod", "RPC_SpawnItem", this, MyRPCSide.SERVER);

// Wysyłanie (tylko nagłówek, bez danych):
MyRPC.Send("MyMod", "RPC_SpawnItem", null, true, null);

// Wysyłanie (z danymi):
ScriptRPC rpc = MyRPC.CreateRPC("MyMod", "RPC_SpawnItem");
rpc.Write("AK74");
rpc.Write(5);    // ilość
rpc.Send(null, MyRPC.FRAMEWORK_RPC_ID, true, null);

// Handler:
void RPC_SpawnItem(PlayerIdentity sender, Object target, ParamsReadContext ctx)
{
    string className;
    if (!ctx.Read(className)) return;

    int quantity;
    if (!ctx.Read(quantity)) return;

    // ... spawnuj przedmioty
}
```

**Zalety:**
- Zero ryzyka kolizji --- stringowa przestrzeń nazw + nazwa funkcji jest globalnie unikalna
- Zero zależności od CF (ale opcjonalnie mostuje do `GetRPCManager()` CF gdy CF jest obecny)
- Jedno ID silnika oznacza minimalny ślad hooków
- Helper `CreateRPC()` wstępnie zapisuje nagłówek routingu więc piszesz tylko dane
- Czysta sygnatura handlera: `(PlayerIdentity, Object, ParamsReadContext)`

**Wady:**
- Dwa dodatkowe odczyty stringów na RPC (nagłówek routingu) --- minimalny narzut w praktyce
- Własny system oznacza, że inne mody nie mogą odkryć twoich RPC przez rejestr CF
- Rozsyła tylko przez refleksję `CallFunctionParams`, która jest nieco wolniejsza od bezpośredniego wywołania metody

### Tabela porównawcza

| Cecha | Nazwane CF | Zakres Integer | Własne routowanie po stringach |
|---------|----------|---------------|---------------------|
| **Ryzyko kolizji** | Brak (przestrzenie nazw) | Wysokie | Brak (przestrzenie nazw) |
| **Zależności** | Wymaga CF | Brak | Brak |
| **Sygnatura handlera** | `(CallType, ctx, sender, target)` | Własna | `(sender, target, ctx)` |
| **Odkrywalność** | Rejestr CF | Brak | `MyRPC.s_Handlers` |
| **Narzut rozsyłania** | Wyszukiwanie stringowe | Switch integerowy | Wyszukiwanie stringowe |
| **Styl danych** | Wrappery Param | Surowe Write/Read | Surowe Write/Read |
| **Mostek CF** | Natywny | Ręczny | Automatyczny (`#ifdef`) |

### Którego użyć?

- **Twój mod i tak zależy od CF** (integracja COT/Expansion): użyj nazwanych RPC CF
- **Samodzielny mod, minimalne zależności**: użyj zakresu integerów lub zbuduj system routowany po stringach
- **Budujesz framework**: rozważ system routowany po stringach jak wzorzec własnego `MyRPC` powyżej
- **Nauka / prototypowanie**: zakres integerów jest najprostszy do zrozumienia

---

## Częste błędy

### 1. Zapomnienie o rejestracji handlera

Wysyłasz RPC ale nic się nie dzieje po drugiej stronie. Handler nigdy nie został zarejestrowany.

```c
// ŹŁLE: Brak rejestracji — serwer nigdy nie wie o tym handlerze
class MyModule
{
    void RPC_DoThing(PlayerIdentity sender, Object target, ParamsReadContext ctx) { ... }
};

// DOBRZE: Zarejestruj w OnInit
class MyModule
{
    void OnInit()
    {
        MyRPC.Register("MyMod", "RPC_DoThing", this, MyRPCSide.SERVER);
    }

    void RPC_DoThing(PlayerIdentity sender, Object target, ParamsReadContext ctx) { ... }
};
```

### 2. Niezgodność kolejności Read/Write

Najczęstszy błąd RPC. Nadawca zapisuje `(string, int, float)` ale odbiorca czyta `(string, float, int)`. Brak komunikatu o błędzie --- po prostu śmieciowe dane.

**Rozwiązanie:** Napisz blok komentarza dokumentujący kolejność pól zarówno po stronie wysyłania jak i odbierania:

```c
// Wire format: [string weaponName] [int damage] [float distance]
```

### 3. Wysyłanie danych tylko klienckich do serwera

Serwer nie może czytać stanu widgetów po stronie klienta, stanu wejścia ani zmiennych lokalnych. Jeśli musisz wysłać selekcję UI do serwera, serializuj odpowiednią wartość (string, indeks, ID) --- nie sam obiekt widgetu.

### 4. Rozgłaszanie gdy miałeś na myśli unicast

```c
// ŹŁLE: Wysyła do WSZYSTKICH klientów gdy chciałeś wysłać do jednego
rpc.Send(null, MY_RPC_ID, true, null);

// DOBRZE: Wyślij do konkretnego klienta
rpc.Send(null, MY_RPC_ID, true, targetIdentity);
```

### 5. Nieobsługiwanie nieaktualnych handlerów przez restarty misji

Jeśli moduł rejestruje handler RPC, a potem jest niszczony przy końcu misji, handler wciąż wskazuje na martwy obiekt. Następne rozsyłanie RPC spowoduje crash.

**Rozwiązanie:** Zawsze wyrejestruj lub wyczyść handlery przy końcu misji:

```c
override void OnMissionFinish()
{
    MyRPC.Unregister("MyMod", "RPC_DoThing");
}
```

Lub użyj scentralizowanego `Cleanup()` który czyści całą mapę handlerów (jak robi `MyRPC.Cleanup()`).

---

## Dobre praktyki

1. **Zawsze sprawdzaj wartości zwrotne `ctx.Read()`.** Każdy odczyt może się nie powieść. Natychmiast wracaj przy niepowodzeniu.

2. **Zawsze waliduj nadawcę na serwerze.** Sprawdź czy `sender` jest nie-null i ma wymagane uprawnienie przed zrobieniem czegokolwiek.

3. **Dokumentuj format danych.** Zarówno po stronie wysyłania jak i odbierania, napisz komentarz wymieniający pola w kolejności z ich typami.

4. **Używaj niezawodnej dostawy dla zmian stanu.** Zawodna dostawa jest odpowiednia tylko dla szybkich, ulotnych aktualizacji (pozycja, efekty).

5. **Utrzymuj małe dane.** DayZ ma praktyczny limit rozmiaru na RPC. Dla dużych danych (synchronizacja konfiguracji, listy graczy), podziel na wiele RPC lub użyj paginacji.

6. **Rejestruj handlery wcześnie.** `OnInit()` jest najbezpieczniejszym miejscem. Klienci mogą się połączyć zanim `OnMissionStart()` się zakończy.

7. **Czyść handlery przy zamykaniu.** Wyrejestruj indywidualnie lub wyczyść cały rejestr w `OnMissionFinish()`.

8. **Używaj `CreateRPC()` dla danych, `Send()` dla sygnałów.** Jeśli nie masz danych do wysłania (tylko sygnał "zrób to"), użyj `Send()` z samym nagłówkiem. Jeśli masz dane, użyj `CreateRPC()` + ręczne zapisy + ręczne `rpc.Send()`.

---

## Kompatybilność i wpływ

- **Wielomodowość:** RPC z zakresem integerów są podatne na kolizje --- dwa mody wybierające to samo ID cicho przechwytują nawzajem wiadomości. RPC routowane po stringach lub nazwane CF unikają tego używając przestrzeni nazw + nazwy funkcji jako klucza.
- **Kolejność ładowania:** Kolejność rejestracji handlerów RPC ma znaczenie tylko gdy wiele modów robi `modded class DayZGame` i nadpisuje `OnRPC`. Każdy musi wywołać `super.OnRPC()` dla nieobsłużonych ID, inaczej dalsze mody nigdy nie otrzymają swoich RPC. Systemy routowane po stringach unikają tego używając jednego ID silnika.
- **Listen Server:** Na listen serwerach zarówno klient jak i serwer działają w tym samym procesie. RPC wysłane z `identity = null` ze strony serwera będzie też odebrane lokalnie. Zabezpiecz handlery sprawdzeniem `if (type != CallType.Server) return;` lub sprawdź `GetGame().IsServer()` / `GetGame().IsClient()` odpowiednio.
- **Wydajność:** Narzut rozsyłania RPC jest minimalny (wyszukiwanie stringowe lub switch integerowy). Wąskim gardłem jest rozmiar danych --- DayZ ma praktyczny limit na RPC (~64 KB). Dla dużych danych (synchronizacja konfiguracji), paginuj na wiele RPC.
- **Migracja:** ID RPC są wewnętrznym szczegółem moda i nie są dotknięte aktualizacjami wersji DayZ. Jeśli zmienisz format danych RPC (dodasz/usuniesz pola), starzy klienci rozmawiający z nowym serwerem cicho się zdesynchronizują. Wersjonuj dane RPC lub wymuś aktualizacje klientów.

---

## Teoria vs praktyka

| Podręcznik mówi | Rzeczywistość DayZ |
|---------------|-------------|
| Używaj protocol buffers lub serializacji opartej na schemacie | Enforce Script nie wspiera protobuf; ręcznie `Write`/`Read` prymitywów w dopasowanej kolejności |
| Waliduj wszystkie wejścia z wymuszaniem schematu | Nie istnieje walidacja schematu; każda wartość zwrotna `ctx.Read()` musi być sprawdzana indywidualnie |
| RPC powinny być idempotentne | Praktyczne w DayZ tylko dla RPC zapytań; mutujące RPC (spawn, usunięcie, teleportacja) są z natury nieidempotentne --- zabezpiecz sprawdzeniami uprawnień |

---

[Strona główna](../README.md) | [<< Poprzedni: Systemy modułów](02-module-systems.md) | **Wzorce komunikacji RPC** | [Dalej: Trwałość konfiguracji >>](04-config-persistence.md)
