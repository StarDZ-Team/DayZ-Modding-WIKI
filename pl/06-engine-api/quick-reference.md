# Szybka referencja API silnika

[Strona główna](../README.md) | **Szybka referencja API silnika**

---

> Skondensowana jednostronicowa referencja najczęściej używanych metod silnika DayZ. Szczegółowe wyjaśnienia i przykłady znajdziesz w pełnych rozdziałach linkowanych w nagłówkach każdej sekcji.

---

## Spis treści

- [Metody encji](#metody-encji)
- [Zdrowie i obrażenia](#zdrowie-i-obrażenia)
- [Sprawdzanie typów](#sprawdzanie-typów)
- [Ekwipunek](#ekwipunek)
- [Tworzenie i usuwanie encji](#tworzenie-i-usuwanie-encji)
- [Metody gracza](#metody-gracza)
- [Metody pojazdów](#metody-pojazdów)
- [Metody pogody](#metody-pogody)
- [Metody I/O plików](#metody-io-plików)
- [Metody timerów i CallQueue](#metody-timerów-i-callqueue)
- [Metody tworzenia widgetów](#metody-tworzenia-widgetów)
- [Metody RPC / sieci](#metody-rpc--sieci)
- [Stałe i metody matematyczne](#stałe-i-metody-matematyczne)
- [Metody wektorów](#metody-wektorów)
- [Funkcje globalne](#funkcje-globalne)
- [Haki misji](#haki-misji)
- [System akcji](#system-akcji)

---

## Metody encji

*Pełna referencja: [Rozdział 6.1: System encji](01-entity-system.md)*

### Pozycja i orientacja (Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetPosition` | `vector GetPosition()` | Pozycja w świecie |
| `SetPosition` | `void SetPosition(vector pos)` | Ustaw pozycję w świecie |
| `GetOrientation` | `vector GetOrientation()` | Odchylenie, pochylenie, przechylenie w stopniach |
| `SetOrientation` | `void SetOrientation(vector ori)` | Ustaw odchylenie, pochylenie, przechylenie |
| `GetDirection` | `vector GetDirection()` | Wektor kierunku do przodu |
| `SetDirection` | `void SetDirection(vector dir)` | Ustaw kierunek do przodu |
| `GetScale` | `float GetScale()` | Aktualna skala |
| `SetScale` | `void SetScale(float scale)` | Ustaw skalę |

### Transformacje (IEntity)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetOrigin` | `vector GetOrigin()` | Pozycja w świecie (poziom silnika) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Ustaw pozycję w świecie (poziom silnika) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Rotacja jako odchylenie/pochylenie/przechylenie |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Pełna macierz transformacji 4x3 |
| `SetTransform` | `void SetTransform(vector mat[4])` | Ustaw pełną transformację |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Kierunek lokalny na światowy |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Punkt lokalny na światowy |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Kierunek światowy na lokalny |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Punkt światowy na lokalny |

### Hierarchia (IEntity)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Dołącz dziecko do kości |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Odłącz dziecko |
| `GetParent` | `IEntity GetParent()` | Encja rodzica lub null |
| `GetChildren` | `IEntity GetChildren()` | Pierwsza encja dziecka |
| `GetSibling` | `IEntity GetSibling()` | Następna encja rodzeństwa |

### Informacje wyświetlania (Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetType` | `string GetType()` | Nazwa klasy z konfiguracji (np. `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Zlokalizowana nazwa wyświetlana |
| `IsKindOf` | `bool IsKindOf(string type)` | Sprawdzenie dziedziczenia konfiguracji |

### Pozycje kości (Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Pozycja kości w przestrzeni lokalnej |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Pozycja kości w przestrzeni modelu |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Pozycja kości w przestrzeni świata |

### Dostęp do konfiguracji (Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Odczytaj bool z konfiguracji |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Odczytaj int z konfiguracji |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Odczytaj float z konfiguracji |
| `ConfigGetString` | `string ConfigGetString(string entry)` | Odczytaj string z konfiguracji |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | Odczytaj tablicę stringów |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Sprawdź czy wpis konfiguracji istnieje |

---

## Zdrowie i obrażenia

*Pełna referencja: [Rozdział 6.1: System encji](01-entity-system.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Pobierz wartość zdrowia |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Pobierz maksymalne zdrowie |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Ustaw zdrowie |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Ustaw na maksimum |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Dodaj zdrowie |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Zmniejsz zdrowie |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Włącz/wyłącz obrażenia |
| `GetAllowDamage` | `bool GetAllowDamage()` | Sprawdź czy obrażenia dozwolone |
| `IsAlive` | `bool IsAlive()` | Sprawdzenie życia (użyj na EntityAI) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Zadaj obrażenia (EntityAI) |

**Typowe pary strefa/typ:** `("", "Health")` globalne, `("", "Blood")` krew gracza, `("", "Shock")` szok gracza, `("Engine", "Health")` silnik pojazdu.

---

## Sprawdzanie typów

| Metoda | Klasa | Opis |
|--------|-------|------|
| `IsMan()` | Object | Czy to gracz? |
| `IsBuilding()` | Object | Czy to budynek? |
| `IsTransport()` | Object | Czy to pojazd? |
| `IsDayZCreature()` | Object | Czy to stworzenie (zombie/zwierzę)? |
| `IsKindOf(string)` | Object | Sprawdzenie dziedziczenia konfiguracji |
| `IsItemBase()` | EntityAI | Czy to przedmiot ekwipunku? |
| `IsWeapon()` | EntityAI | Czy to broń? |
| `IsMagazine()` | EntityAI | Czy to magazynek? |
| `IsClothing()` | EntityAI | Czy to ubranie? |
| `IsFood()` | EntityAI | Czy to jedzenie? |
| `Class.CastTo(out, obj)` | Class | Bezpieczne rzutowanie w dół (zwraca bool) |
| `ClassName.Cast(obj)` | Class | Rzutowanie inline (zwraca null przy niepowodzeniu) |

---

## Ekwipunek

*Pełna referencja: [Rozdział 6.1: System encji](01-entity-system.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetInventory` | `GameInventory GetInventory()` | Pobierz komponent ekwipunku (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Utwórz przedmiot w ładunku |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Utwórz przedmiot w ładunku |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Utwórz przedmiot jako załącznik |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Wylistuj wszystkie przedmioty |
| `CountInventory` | `int CountInventory()` | Policz przedmioty |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Sprawdź przedmiot |
| `AttachmentCount` | `int AttachmentCount()` | Liczba załączników |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Pobierz załącznik po indeksie |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Pobierz załącznik po slocie |

---

## Tworzenie i usuwanie encji

*Pełna referencja: [Rozdział 6.1: System encji](01-entity-system.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Utwórz encję |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Utwórz z flagami ECE |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Natychmiastowe usunięcie na serwerze |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Usunięcie tylko po stronie klienta |
| `Delete` | `void obj.Delete()` | Odroczone usunięcie (następna klatka) |

### Typowe flagi ECE

| Flaga | Wartość | Opis |
|-------|---------|------|
| `ECE_NONE` | `0` | Bez specjalnego zachowania |
| `ECE_CREATEPHYSICS` | `1024` | Utwórz kolizję |
| `ECE_INITAI` | `2048` | Zainicjalizuj AI |
| `ECE_EQUIP` | `24576` | Spawnuj z załącznikami + ładunkiem |
| `ECE_PLACE_ON_SURFACE` | łączone | Fizyka + ścieżka + ślad |
| `ECE_LOCAL` | `1073741824` | Tylko klient (niereplikowane) |
| `ECE_NOLIFETIME` | `4194304` | Nie zniknie |
| `ECE_KEEPHEIGHT` | `524288` | Zachowaj pozycję Y |

---

## Metody gracza

*Pełna referencja: [Rozdział 6.1: System encji](01-entity-system.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Obiekt tożsamości gracza |
| `GetIdentity().GetName()` | `string GetName()` | Nazwa wyświetlana Steam/platformy |
| `GetIdentity().GetId()` | `string GetId()` | Unikalne ID BI |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | Steam64 ID |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | Sesyjne ID gracza |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Przedmiot w rękach |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Prowadzony pojazd |
| `IsAlive` | `bool IsAlive()` | Sprawdzenie życia |
| `IsUnconscious` | `bool IsUnconscious()` | Sprawdzenie nieprzytomności |
| `IsRestrained` | `bool IsRestrained()` | Sprawdzenie skrępowania |
| `IsInVehicle` | `bool IsInVehicle()` | Sprawdzenie czy w pojeździe |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Spawnuj przed graczem |

---

## Metody pojazdów

*Pełna referencja: [Rozdział 6.2: System pojazdów](02-vehicles.md)*

### Załoga (Transport)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `CrewSize` | `int CrewSize()` | Łączna liczba siedzeń |
| `CrewMember` | `Human CrewMember(int idx)` | Pobierz człowieka na siedzeniu |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Pobierz siedzenie człowieka |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Wymuś wyrzucenie z siedzenia |
| `CrewDeath` | `void CrewDeath(int idx)` | Zabij członka załogi |

### Silnik (Car)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `EngineIsOn` | `bool EngineIsOn()` | Czy silnik działa? |
| `EngineStart` | `void EngineStart()` | Uruchom silnik |
| `EngineStop` | `void EngineStop()` | Zatrzymaj silnik |
| `EngineGetRPM` | `float EngineGetRPM()` | Aktualne obroty |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | Obroty czerwonej strefy |
| `GetGear` | `int GetGear()` | Aktualny bieg |
| `GetSpeedometer` | `float GetSpeedometer()` | Prędkość w km/h |

### Płyny (Car)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Maksymalna pojemność |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Poziom napełnienia 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Dodaj płyn |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Usuń płyn |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Opróżnij cały płyn |

**Enum CarFluid:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Sterowanie (Car)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = wszystkie |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Wejście kierownicy |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 przepustnica |

---

## Metody pogody

*Pełna referencja: [Rozdział 6.3: System pogody](03-weather.md)*

### Dostęp

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Pobierz singleton pogody |

### Zjawiska (Weather)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Zachmurzenie |
| `GetRain` | `WeatherPhenomenon GetRain()` | Deszcz |
| `GetFog` | `WeatherPhenomenon GetFog()` | Mgła |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Śnieg |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Prędkość wiatru |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Kierunek wiatru |
| `GetWind` | `vector GetWind()` | Wektor kierunku wiatru |
| `GetWindSpeed` | `float GetWindSpeed()` | Prędkość wiatru m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Konfiguracja błyskawic |

### WeatherPhenomenon

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetActual` | `float GetActual()` | Aktualna interpolowana wartość |
| `GetForecast` | `float GetForecast()` | Wartość docelowa |
| `GetDuration` | `float GetDuration()` | Pozostały czas trwania (sekundy) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Ustaw cel (tylko serwer) |
| `SetLimits` | `void SetLimits(float min, float max)` | Limity zakresu wartości |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Limity prędkości zmian |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Limity wielkości zmian |

---

## Metody I/O plików

*Pełna referencja: [Rozdział 6.8: I/O plików i JSON](08-file-io.md)*

### Prefiksy ścieżek

| Prefiks | Lokalizacja | Zapisywalny |
|---------|-------------|-------------|
| `$profile:` | Katalog profilu serwera/klienta | Tak |
| `$saves:` | Katalog zapisów | Tak |
| `$mission:` | Folder aktualnej misji | Zazwyczaj odczyt |
| `$CurrentDir:` | Katalog roboczy | Zależy |

### Operacje na plikach

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `FileExist` | `bool FileExist(string path)` | Sprawdź czy plik istnieje |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Utwórz katalog |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Otwórz plik (0 = niepowodzenie) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Zamknij plik |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Zapisz tekst (bez nowej linii) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Zapisz tekst + nowa linia |
| `FGets` | `int FGets(FileHandle fh, string line)` | Odczytaj jedną linię |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Odczytaj cały plik |
| `DeleteFile` | `bool DeleteFile(string path)` | Usuń plik |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Kopiuj plik |

### JSON (JsonFileLoader)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | Załaduj JSON do obiektu (**zwraca void**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Zapisz obiekt jako JSON |

### Enum FileMode

| Wartość | Opis |
|---------|------|
| `FileMode.READ` | Otwórz do odczytu |
| `FileMode.WRITE` | Otwórz do zapisu (tworzy/nadpisuje) |
| `FileMode.APPEND` | Otwórz do dopisywania |

---

## Metody timerów i CallQueue

*Pełna referencja: [Rozdział 6.7: Timery i CallQueue](07-timers.md)*

### Dostęp

| Wyrażenie | Zwraca | Opis |
|-----------|--------|------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Kolejka wywołań rozgrywki |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | Kolejka wywołań systemowych |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | Kolejka wywołań GUI |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Kolejka aktualizacji per-klatka |

### ScriptCallQueue

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Zaplanuj opóźnione/powtarzające wywołanie |
| `Call` | `void Call(func fn, param1..4)` | Wykonaj następną klatkę |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Wywołaj metodę po nazwie string |
| `Remove` | `void Remove(func fn)` | Anuluj zaplanowane wywołanie |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Anuluj po nazwie string |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Pobierz pozostały czas CallLater |

### Klasa Timer

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Konstruktor |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Uruchom timer |
| `Stop` | `void Stop()` | Zatrzymaj timer |
| `Pause` | `void Pause()` | Wstrzymaj timer |
| `Continue` | `void Continue()` | Wznów timer |
| `IsPaused` | `bool IsPaused()` | Czy timer wstrzymany? |
| `IsRunning` | `bool IsRunning()` | Czy timer aktywny? |
| `GetRemaining` | `float GetRemaining()` | Pozostałe sekundy |

### ScriptInvoker

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Insert` | `void Insert(func fn)` | Zarejestruj callback |
| `Remove` | `void Remove(func fn)` | Wyrejestruj callback |
| `Invoke` | `void Invoke(params...)` | Uruchom wszystkie callbacki |
| `Count` | `int Count()` | Liczba zarejestrowanych callbacków |
| `Clear` | `void Clear()` | Usuń wszystkie callbacki |

---

## Metody tworzenia widgetów

*Pełna referencja: [Rozdział 3.5: Programowe tworzenie](../03-gui-system/05-programmatic-widgets.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Pobierz przestrzeń roboczą UI |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | Załaduj plik .layout |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Znajdź dziecko po nazwie (rekurencyjnie) |
| `Show` | `void Show(bool show)` | Pokaż/ukryj widget |
| `SetText` | `void TextWidget.SetText(string text)` | Ustaw zawartość tekstową |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Ustaw indeks obrazu |
| `SetColor` | `void SetColor(int color)` | Ustaw kolor widgetu (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Ustaw przezroczystość 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Ustaw rozmiar widgetu |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Ustaw pozycję widgetu |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Rozdzielczość ekranu |
| `Destroy` | `void Widget.Destroy()` | Usuń i zniszcz widget |

### Pomocnik kolorów ARGB

| Funkcja | Sygnatura | Opis |
|---------|-----------|------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Utwórz int koloru (0-255 każdy) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Utwórz int koloru (0.0-1.0 każdy) |

---

## Metody RPC / sieci

*Pełna referencja: [Rozdział 6.9: Sieć i RPC](09-networking.md)*

### Sprawdzanie środowiska

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetGame().IsServer()` | `bool IsServer()` | True na serwerze / hoście listen-server |
| `GetGame().IsClient()` | `bool IsClient()` | True na kliencie |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | True w multiplayerze |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | True tylko na serwerze dedykowanym |

### ScriptRPC

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `ScriptRPC()` | `void ScriptRPC()` | Konstruktor |
| `Write` | `bool Write(void value)` | Serializuj wartość (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | Wyślij RPC |
| `Reset` | `void Reset()` | Wyczyść zapisane dane |

### Odbieranie (nadpisanie na Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | Handler odbierania RPC |

### ParamsReadContext

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Read` | `bool Read(out void value)` | Deserializuj wartość (te same typy co Write) |

### Starsze RPC (CGame)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Wyślij pojedynczy obiekt Param |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Wyślij wiele Paramów |

### ScriptInputUserData (weryfikowane wejście)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Sprawdź czy kolejka ma miejsce |
| `Write` | `bool Write(void value)` | Serializuj wartość |
| `Send` | `void Send()` | Wyślij do serwera (tylko klient) |

---

## Stałe i metody matematyczne

*Pełna referencja: [Rozdział 1.7: Matematyka i wektory](../01-enforce-script/07-math-vectors.md)*

### Stałe

| Stała | Wartość | Opis |
|-------|---------|------|
| `Math.PI` | `3.14159...` | Pi |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Mnożnik stopni na radiany |
| `Math.RAD2DEG` | `57.2957...` | Mnożnik radianów na stopnie |
| `int.MAX` | `2147483647` | Maksymalny int |
| `int.MIN` | `-2147483648` | Minimalny int |
| `float.MAX` | `3.4028e+38` | Maksymalny float |
| `float.MIN` | `1.175e-38` | Minimalny dodatni float |

### Losowe

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Losowy int [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Losowy int [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Losowy float [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | Losowy true/false |

### Zaokrąglanie

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.Round` | `float Round(float f)` | Zaokrąglij do najbliższego |
| `Math.Floor` | `float Floor(float f)` | Zaokrąglij w dół |
| `Math.Ceil` | `float Ceil(float f)` | Zaokrąglij w górę |

### Ograniczanie i interpolacja

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Ogranicz do zakresu |
| `Math.Min` | `float Min(float a, float b)` | Minimum z dwóch |
| `Math.Max` | `float Max(float a, float b)` | Maksimum z dwóch |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Interpolacja liniowa |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Odwrotna interpolacja |

### Wartość bezwzględna i potęga

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Wartość bezwzględna (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Wartość bezwzględna (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Potęga |
| `Math.Sqrt` | `float Sqrt(float f)` | Pierwiastek kwadratowy |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Kwadrat (f * f) |

### Trygonometria (radiany)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.Sin` | `float Sin(float rad)` | Sinus |
| `Math.Cos` | `float Cos(float rad)` | Kosinus |
| `Math.Tan` | `float Tan(float rad)` | Tangens |
| `Math.Asin` | `float Asin(float val)` | Arcus sinus |
| `Math.Acos` | `float Acos(float val)` | Arcus kosinus |
| `Math.Atan2` | `float Atan2(float y, float x)` | Kąt ze składowych |

### Płynne tłumienie

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Płynne tłumienie w kierunku celu (jak SmoothDamp w Unity) |

```c
// Użycie płynnego tłumienia
// val: aktualna wartość, target: wartość docelowa, velocity: ref prędkość (persystowana między wywołaniami)
// smoothTime: czas wygładzania, maxSpeed: limit prędkości, dt: delta czasu
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Kąt

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Zawiń do 0-360 |

---

## Metody wektorów

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Odległość między punktami |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Kwadrat odległości (szybszy) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Wektor kierunku |
| `vector.Dot` | `float Dot(vector a, vector b)` | Iloczyn skalarny |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Interpolacja pozycji |
| `v.Length()` | `float Length()` | Długość wektora |
| `v.LengthSq()` | `float LengthSq()` | Kwadrat długości (szybszy) |
| `v.Normalized()` | `vector Normalized()` | Wektor jednostkowy |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Kierunek na odchylenie/pochylenie |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Odchylenie/pochylenie na kierunek |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Mnożenie macierzowe |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Odwrotne mnożenie macierzowe |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Utwórz wektor |

---

## Funkcje globalne

| Funkcja | Sygnatura | Opis |
|---------|-----------|------|
| `GetGame()` | `CGame GetGame()` | Instancja gry |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Lokalny gracz (tylko KLIENT) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Wszyscy gracze (serwer) |
| `GetGame().GetWorld()` | `World GetWorld()` | Instancja świata |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Czas serwera (sekundy) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Przestrzeń robocza UI |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Wysokość terenu na pozycji |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Typ materiału powierzchni |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Znajdź obiekty w pobliżu pozycji |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Pobierz rozdzielczość ekranu |
| `GetGame().IsServer()` | `bool IsServer()` | Sprawdzenie serwera |
| `GetGame().IsClient()` | `bool IsClient()` | Sprawdzenie klienta |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Sprawdzenie multiplayera |
| `Print(string)` | `void Print(string msg)` | Zapisz do logu skryptu |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Zapisz błąd z ważnością |
| `DumpStackString()` | `string DumpStackString()` | Pobierz stos wywołań jako string |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | Formatuj string (`%1`..`%9`) |

---

## Haki misji

*Pełna referencja: [Rozdział 6.11: Haki misji](11-mission-hooks.md)*

### Strona serwera (modded MissionServer)

| Metoda | Opis |
|--------|------|
| `override void OnInit()` | Inicjalizuj managery, rejestruj RPC |
| `override void OnMissionStart()` | Po załadowaniu wszystkich modów |
| `override void OnUpdate(float timeslice)` | Per-klatka (użyj akumulatora!) |
| `override void OnMissionFinish()` | Czyszczenie singletonów, wypisanie z zdarzeń |
| `override void OnEvent(EventType eventTypeId, Param params)` | Zdarzenia czatu, głosu |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Gracz dołączył |
| `override void InvokeOnDisconnect(PlayerBase player)` | Gracz wyszedł |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Klient gotowy na dane |
| `override void PlayerRegistered(int peerId)` | Tożsamość zarejestrowana |

### Strona klienta (modded MissionGameplay)

| Metoda | Opis |
|--------|------|
| `override void OnInit()` | Inicjalizuj managery klienta, utwórz HUD |
| `override void OnUpdate(float timeslice)` | Aktualizacja klienta per-klatka |
| `override void OnMissionFinish()` | Czyszczenie |
| `override void OnKeyPress(int key)` | Klawisz naciśnięty |
| `override void OnKeyRelease(int key)` | Klawisz zwolniony |

---

## System akcji

*Pełna referencja: [Rozdział 6.12: System akcji](12-action-system.md)*

### Rejestracja akcji na przedmiocie

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Dodaj niestandardową akcję
    RemoveAction(ActionEat);       // Usuń waniliową akcję
}
```

### Kluczowe metody ActionBase

| Metoda | Opis |
|--------|------|
| `override void CreateConditionComponents()` | Ustaw warunki dystansu CCINone/CCTNone |
| `override bool ActionCondition(...)` | Niestandardowa logika walidacji |
| `override void OnExecuteServer(ActionData action_data)` | Wykonanie po stronie serwera |
| `override void OnExecuteClient(ActionData action_data)` | Efekty po stronie klienta |
| `override string GetText()` | Wyświetlana nazwa (obsługuje klucze `#STR_`) |

---

*Pełna dokumentacja: [Strona główna](../README.md) | [Ściągawka](../cheatsheet.md) | [System encji](01-entity-system.md) | [Pojazdy](02-vehicles.md) | [Pogoda](03-weather.md) | [Timery](07-timers.md) | [I/O plików](08-file-io.md) | [Sieć](09-networking.md) | [Haki misji](11-mission-hooks.md) | [System akcji](12-action-system.md)*
