# Szybka referencja API silnika

> Skondensowana jednostronicowa referencja najczesciej uzywanych metod silnika DayZ. Szczegolowe wyjasnienia i przyklady znajdziesz w pelnych rozdzialach, do ktorych linki sa w naglowkach poszczegolnych sekcji.

---

## Spis tresci

- [Metody encji](#metody-encji)
- [Zdrowie i obrazenia](#zdrowie-i-obrazenia)
- [Sprawdzanie typow](#sprawdzanie-typow)
- [Ekwipunek](#ekwipunek)
- [Tworzenie i usuwanie encji](#tworzenie-i-usuwanie-encji)
- [Metody gracza](#metody-gracza)
- [Metody pojazdow](#metody-pojazdow)
- [Metody pogody](#metody-pogody)
- [Metody plikowego I/O](#metody-plikowego-io)
- [Metody Timer i CallQueue](#metody-timer-i-callqueue)
- [Metody tworzenia widgetow](#metody-tworzenia-widgetow)
- [Metody RPC / sieciowe](#metody-rpc--sieciowe)
- [Stale i metody matematyczne](#stale-i-metody-matematyczne)
- [Metody wektorow](#metody-wektorow)
- [Funkcje globalne](#funkcje-globalne)
- [Hooki misji](#hooki-misji)
- [System akcji](#system-akcji)

---

## Metody encji

*Pelna referencja: [Rozdzial 6.1: System encji](01-entity-system.md)*

### Pozycja i orientacja (Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetPosition` | `vector GetPosition()` | Pozycja w swiecie |
| `SetPosition` | `void SetPosition(vector pos)` | Ustaw pozycje w swiecie |
| `GetOrientation` | `vector GetOrientation()` | Odchylenie, pochylenie, przechylenie w stopniach |
| `SetOrientation` | `void SetOrientation(vector ori)` | Ustaw odchylenie, pochylenie, przechylenie |
| `GetDirection` | `vector GetDirection()` | Wektor kierunku do przodu |
| `SetDirection` | `void SetDirection(vector dir)` | Ustaw kierunek do przodu |
| `GetScale` | `float GetScale()` | Aktualna skala |
| `SetScale` | `void SetScale(float scale)` | Ustaw skale |

### Transformacja (IEntity)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetOrigin` | `vector GetOrigin()` | Pozycja w swiecie (poziom silnika) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Ustaw pozycje w swiecie (poziom silnika) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Rotacja jako yaw/pitch/roll |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Pelna macierz transformacji 4x3 |
| `SetTransform` | `void SetTransform(vector mat[4])` | Ustaw pelna transformacje |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Kierunek lokalny do swiata |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Punkt lokalny do swiata |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Kierunek swiatowy do lokalnego |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Punkt swiatowy do lokalnego |

### Hierarchia (IEntity)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Dolacz potomka do kosci |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Odlacz potomka |
| `GetParent` | `IEntity GetParent()` | Encja rodzica lub null |
| `GetChildren` | `IEntity GetChildren()` | Pierwsza encja potomna |
| `GetSibling` | `IEntity GetSibling()` | Nastepna encja na tym samym poziomie |

### Informacje wyswietlane (Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetType` | `string GetType()` | Nazwa klasy konfiguracyjnej (np. `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Zlokalizowana nazwa wyswietlana |
| `IsKindOf` | `bool IsKindOf(string type)` | Sprawdz dziedziczenie konfiguracji |

### Pozycje kosci (Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Pozycja kosci w przestrzeni lokalnej |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Pozycja kosci w przestrzeni modelu |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Pozycja kosci w przestrzeni swiata |

### Dostep do konfiguracji (Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Odczytaj bool z konfiguracji |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Odczytaj int z konfiguracji |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Odczytaj float z konfiguracji |
| `ConfigGetString` | `string ConfigGetString(string entry)` | Odczytaj string z konfiguracji |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | Odczytaj tablice stringow |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Sprawdz czy wpis konfiguracji istnieje |

---

## Zdrowie i obrazenia

*Pelna referencja: [Rozdzial 6.1: System encji](01-entity-system.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Pobierz wartosc zdrowia |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Pobierz maksymalne zdrowie |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Ustaw zdrowie |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Ustaw na maksimum |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Dodaj zdrowie |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Zmniejsz zdrowie |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Wlacz/wylacz obrazenia |
| `GetAllowDamage` | `bool GetAllowDamage()` | Sprawdz czy obrazenia sa dozwolone |
| `IsAlive` | `bool IsAlive()` | Sprawdzenie zycia (uzywaj na EntityAI) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Zastosuj obrazenia (EntityAI) |

**Typowe pary strefa/typ:** `("", "Health")` globalne, `("", "Blood")` krew gracza, `("", "Shock")` szok gracza, `("Engine", "Health")` silnik pojazdu.

---

## Sprawdzanie typow

| Metoda | Klasa | Opis |
|--------|-------|------|
| `IsMan()` | Object | Czy to gracz? |
| `IsBuilding()` | Object | Czy to budynek? |
| `IsTransport()` | Object | Czy to pojazd? |
| `IsDayZCreature()` | Object | Czy to stworzenie (zombie/zwierze)? |
| `IsKindOf(string)` | Object | Sprawdzenie dziedziczenia konfiguracji |
| `IsItemBase()` | EntityAI | Czy to przedmiot ekwipunku? |
| `IsWeapon()` | EntityAI | Czy to bron? |
| `IsMagazine()` | EntityAI | Czy to magazynek? |
| `IsClothing()` | EntityAI | Czy to ubranie? |
| `IsFood()` | EntityAI | Czy to jedzenie? |
| `Class.CastTo(out, obj)` | Class | Bezpieczne rzutowanie w dol (zwraca bool) |
| `ClassName.Cast(obj)` | Class | Rzutowanie inline (zwraca null przy niepowodzeniu) |

---

## Ekwipunek

*Pelna referencja: [Rozdzial 6.1: System encji](01-entity-system.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetInventory` | `GameInventory GetInventory()` | Pobierz komponent ekwipunku (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Stworz przedmiot w cargo |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Stworz przedmiot w cargo |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Stworz przedmiot jako zalacznik |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Wylistuj wszystkie przedmioty |
| `CountInventory` | `int CountInventory()` | Policz przedmioty |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Sprawdz czy jest przedmiot |
| `AttachmentCount` | `int AttachmentCount()` | Liczba zalacznikow |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Pobierz zalacznik po indeksie |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Pobierz zalacznik po slocie |

---

## Tworzenie i usuwanie encji

*Pelna referencja: [Rozdzial 6.1: System encji](01-entity-system.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Stworz encje |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Stworz z flagami ECE |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Natychmiastowe usuniecie na serwerze |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Usuniecie tylko po stronie klienta |
| `Delete` | `void obj.Delete()` | Odlozone usuniecie (nastepna klatka) |

### Typowe flagi ECE

| Flaga | Wartosc | Opis |
|-------|---------|------|
| `ECE_NONE` | `0` | Brak specjalnego zachowania |
| `ECE_CREATEPHYSICS` | `1024` | Stworz kolizje |
| `ECE_INITAI` | `2048` | Zainicjalizuj AI |
| `ECE_EQUIP` | `24576` | Stworz z zalacznikami + cargo |
| `ECE_PLACE_ON_SURFACE` | polaczony | Fizyka + sciezka + sledzenie |
| `ECE_LOCAL` | `1073741824` | Tylko klient (niereplikowany) |
| `ECE_NOLIFETIME` | `4194304` | Nie zniknie |
| `ECE_KEEPHEIGHT` | `524288` | Zachowaj pozycje Y |

---

## Metody gracza

*Pelna referencja: [Rozdzial 6.1: System encji](01-entity-system.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Obiekt tozsamosci gracza |
| `GetIdentity().GetName()` | `string GetName()` | Nazwa wyswietlana Steam/platformy |
| `GetIdentity().GetId()` | `string GetId()` | Unikalny identyfikator BI |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | Steam64 ID |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | ID gracza w sesji |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Przedmiot w rekach |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Prowadzony pojazd |
| `IsAlive` | `bool IsAlive()` | Sprawdzenie zycia |
| `IsUnconscious` | `bool IsUnconscious()` | Sprawdzenie nieprzytomnosci |
| `IsRestrained` | `bool IsRestrained()` | Sprawdzenie skrepowania |
| `IsInVehicle` | `bool IsInVehicle()` | Sprawdzenie czy w pojezdzie |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Stworz przed graczem |

---

## Metody pojazdow

*Pelna referencja: [Rozdzial 6.2: System pojazdow](02-vehicles.md)*

### Zaloga (Transport)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `CrewSize` | `int CrewSize()` | Calkowita liczba miejsc |
| `CrewMember` | `Human CrewMember(int idx)` | Pobierz czlowieka na miejscu |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Pobierz miejsce czlowieka |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Wymus wyjscie z miejsca |
| `CrewDeath` | `void CrewDeath(int idx)` | Zabij czlonka zalogi |

### Silnik (Car)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `EngineIsOn` | `bool EngineIsOn()` | Czy silnik pracuje? |
| `EngineStart` | `void EngineStart()` | Uruchom silnik |
| `EngineStop` | `void EngineStop()` | Zatrzymaj silnik |
| `EngineGetRPM` | `float EngineGetRPM()` | Aktualne obroty |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | Obroty czerwonej strefy |
| `GetGear` | `int GetGear()` | Aktualny bieg |
| `GetSpeedometer` | `float GetSpeedometer()` | Predkosc w km/h |

### Plyny (Car)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Maksymalna pojemnosc |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Poziom napelnienia 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Dodaj plyn |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Usun plyn |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Oprozniij caly plyn |

**Enum CarFluid:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Sterowanie (Car)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = wszystkie |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Wejscie kierownicy |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 gaz |

---

## Metody pogody

*Pelna referencja: [Rozdzial 6.3: System pogody](03-weather.md)*

### Dostep

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Pobierz singleton pogody |

### Zjawiska (Weather)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Zachmurzenie |
| `GetRain` | `WeatherPhenomenon GetRain()` | Deszcz |
| `GetFog` | `WeatherPhenomenon GetFog()` | Mgla |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Snieg |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Predkosc wiatru |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Kierunek wiatru |
| `GetWind` | `vector GetWind()` | Wektor kierunku wiatru |
| `GetWindSpeed` | `float GetWindSpeed()` | Predkosc wiatru m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Konfiguracja blyskawic |

### WeatherPhenomenon

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetActual` | `float GetActual()` | Aktualna interpolowana wartosc |
| `GetForecast` | `float GetForecast()` | Wartosc docelowa |
| `GetDuration` | `float GetDuration()` | Pozostaly czas (sekundy) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Ustaw cel (tylko serwer) |
| `SetLimits` | `void SetLimits(float min, float max)` | Limity zakresu wartosci |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Limity predkosci zmiany |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Limity wielkosci zmiany |

---

## Metody plikowego I/O

*Pelna referencja: [Rozdzial 6.8: Plikowe I/O i JSON](08-file-io.md)*

### Prefiksy sciezek

| Prefiks | Lokalizacja | Zapisywalny |
|---------|-------------|-------------|
| `$profile:` | Katalog profilu serwera/klienta | Tak |
| `$saves:` | Katalog zapisow | Tak |
| `$mission:` | Folder aktualnej misji | Zazwyczaj odczyt |
| `$CurrentDir:` | Katalog roboczy | Zalezy |

### Operacje plikowe

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `FileExist` | `bool FileExist(string path)` | Sprawdz czy plik istnieje |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Stworz katalog |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Otworz plik (0 = niepowodzenie) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Zamknij plik |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Zapisz tekst (bez nowej linii) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Zapisz tekst + nowa linia |
| `FGets` | `int FGets(FileHandle fh, string line)` | Odczytaj jedna linie |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Odczytaj caly plik |
| `DeleteFile` | `bool DeleteFile(string path)` | Usun plik |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Skopiuj plik |

### JSON (JsonFileLoader)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | Zaladuj JSON do obiektu (**zwraca void**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Zapisz obiekt jako JSON |

### Enum FileMode

| Wartosc | Opis |
|---------|------|
| `FileMode.READ` | Otworz do odczytu |
| `FileMode.WRITE` | Otworz do zapisu (tworzy/nadpisuje) |
| `FileMode.APPEND` | Otworz do dopisywania |

---

## Metody Timer i CallQueue

*Pelna referencja: [Rozdzial 6.7: Timery i CallQueue](07-timers.md)*

### Dostep

| Wyrazenie | Zwraca | Opis |
|-----------|--------|------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Kolejka wywolan rozgrywki |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | Kolejka wywolan systemowych |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | Kolejka wywolan GUI |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Kolejka aktualizacji co klatke |

### ScriptCallQueue

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Zaplanuj opoznione/powtarzane wywolanie |
| `Call` | `void Call(func fn, param1..4)` | Wykonaj nastepna klatke |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Wywolaj metode po nazwie |
| `Remove` | `void Remove(func fn)` | Anuluj zaplanowane wywolanie |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Anuluj po nazwie |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Pobierz pozostaly czas CallLater |

### Klasa Timer

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Konstruktor |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Uruchom timer |
| `Stop` | `void Stop()` | Zatrzymaj timer |
| `Pause` | `void Pause()` | Wstrzymaj timer |
| `Continue` | `void Continue()` | Wznow timer |
| `IsPaused` | `bool IsPaused()` | Czy timer wstrzymany? |
| `IsRunning` | `bool IsRunning()` | Czy timer aktywny? |
| `GetRemaining` | `float GetRemaining()` | Pozostale sekundy |

### ScriptInvoker

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Insert` | `void Insert(func fn)` | Zarejestruj callback |
| `Remove` | `void Remove(func fn)` | Wyrejestruj callback |
| `Invoke` | `void Invoke(params...)` | Wywolaj wszystkie callbacki |
| `Count` | `int Count()` | Liczba zarejestrowanych callbackow |
| `Clear` | `void Clear()` | Usun wszystkie callbacki |

---

## Metody tworzenia widgetow

*Pelna referencja: [Rozdzial 3.5: Tworzenie programowe](../03-gui-system/05-programmatic-widgets.md)*

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Pobierz przestrzen robocza UI |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | Zaladuj plik .layout |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Znajdz potomka po nazwie (rekurencyjnie) |
| `Show` | `void Show(bool show)` | Pokaz/ukryj widget |
| `SetText` | `void TextWidget.SetText(string text)` | Ustaw zawartosc tekstowa |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Ustaw indeks obrazu |
| `SetColor` | `void SetColor(int color)` | Ustaw kolor widgetu (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Ustaw przezroczystosc 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Ustaw rozmiar widgetu |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Ustaw pozycje widgetu |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Rozdzielczosc ekranu |
| `Destroy` | `void Widget.Destroy()` | Usun i zniszcz widget |

### Pomocnik kolorow ARGB

| Funkcja | Sygnatura | Opis |
|---------|-----------|------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Stworz kolor (0-255 kazdy) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Stworz kolor (0.0-1.0 kazdy) |

---

## Metody RPC / sieciowe

*Pelna referencja: [Rozdzial 6.9: Siec i RPC](09-networking.md)*

### Sprawdzanie srodowiska

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `GetGame().IsServer()` | `bool IsServer()` | True na serwerze / hoscie listen-servera |
| `GetGame().IsClient()` | `bool IsClient()` | True na kliencie |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | True w trybie wieloosobowym |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | True tylko na dedykowanym serwerze |

### ScriptRPC

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `ScriptRPC()` | `void ScriptRPC()` | Konstruktor |
| `Write` | `bool Write(void value)` | Serializuj wartosc (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | Wyslij RPC |
| `Reset` | `void Reset()` | Wyczysc zapisane dane |

### Odbieranie (Override na Object)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | Handler odbioru RPC |

### ParamsReadContext

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Read` | `bool Read(out void value)` | Deserializuj wartosc (te same typy co Write) |

### Starsze RPC (CGame)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Wyslij pojedynczy obiekt Param |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Wyslij wiele obiektow Param |

### ScriptInputUserData (weryfikowane wejscie)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Sprawdz czy kolejka ma miejsce |
| `Write` | `bool Write(void value)` | Serializuj wartosc |
| `Send` | `void Send()` | Wyslij do serwera (tylko klient) |

---

## Stale i metody matematyczne

*Pelna referencja: [Rozdzial 1.7: Matematyka i wektory](../01-enforce-script/07-math-vectors.md)*

### Stale

| Stala | Wartosc | Opis |
|-------|---------|------|
| `Math.PI` | `3.14159...` | Pi |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Mnoznik stopni na radiany |
| `Math.RAD2DEG` | `57.2957...` | Mnoznik radianow na stopnie |
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
| `Math.RandomBool` | `bool RandomBool()` | Losowe true/false |

### Zaokraglanie

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.Round` | `float Round(float f)` | Zaokraglij do najblizszego |
| `Math.Floor` | `float Floor(float f)` | Zaokraglij w dol |
| `Math.Ceil` | `float Ceil(float f)` | Zaokraglij w gore |

### Ograniczanie i interpolacja

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Ogranicz do zakresu |
| `Math.Min` | `float Min(float a, float b)` | Minimum z dwoch |
| `Math.Max` | `float Max(float a, float b)` | Maksimum z dwoch |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Interpolacja liniowa |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Odwrotny lerp |

### Wartosc bezwzgledna i potegi

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Wartosc bezwzgledna (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Wartosc bezwzgledna (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Potega |
| `Math.Sqrt` | `float Sqrt(float f)` | Pierwiastek kwadratowy |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Kwadrat (f * f) |

### Trygonometria (radiany)

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.Sin` | `float Sin(float rad)` | Sinus |
| `Math.Cos` | `float Cos(float rad)` | Cosinus |
| `Math.Tan` | `float Tan(float rad)` | Tangens |
| `Math.Asin` | `float Asin(float val)` | Arcus sinus |
| `Math.Acos` | `float Acos(float val)` | Arcus cosinus |
| `Math.Atan2` | `float Atan2(float y, float x)` | Kat ze skladowych |

### Gladkie tlumienie

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Gladko tlum do celu (jak Unity SmoothDamp) |

```c
// Uzycie gladkiego tlumienia
// val: aktualna wartosc, target: wartosc docelowa, velocity: ref predkosc (zachowywana miedzy wywolaniami)
// smoothTime: czas wygladzania, maxSpeed: limit predkosci, dt: delta czasu
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Kat

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Normalizuj do 0-360 |

---

## Metody wektorow

| Metoda | Sygnatura | Opis |
|--------|-----------|------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Odleglosc miedzy punktami |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Kwadrat odleglosci (szybsze) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Wektor kierunku |
| `vector.Dot` | `float Dot(vector a, vector b)` | Iloczyn skalarny |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Interpolacja pozycji |
| `v.Length()` | `float Length()` | Dlugosc wektora |
| `v.LengthSq()` | `float LengthSq()` | Kwadrat dlugosci (szybsze) |
| `v.Normalized()` | `vector Normalized()` | Wektor jednostkowy |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Kierunek na yaw/pitch |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Yaw/pitch na kierunek |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Mnozenie macierzowe |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Odwrotne mnozenie macierzowe |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Stworz wektor |

---

## Funkcje globalne

| Funkcja | Sygnatura | Opis |
|---------|-----------|------|
| `GetGame()` | `CGame GetGame()` | Instancja gry |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Lokalny gracz (tylko KLIENT) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Wszyscy gracze (serwer) |
| `GetGame().GetWorld()` | `World GetWorld()` | Instancja swiata |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Czas serwera (sekundy) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Przestrzen robocza UI |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Wysokosc terenu na pozycji |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Typ materialu powierzchni |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Znajdz obiekty w poblizu pozycji |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Pobierz rozdzielczosc ekranu |
| `GetGame().IsServer()` | `bool IsServer()` | Sprawdzenie serwera |
| `GetGame().IsClient()` | `bool IsClient()` | Sprawdzenie klienta |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Sprawdzenie trybu wieloosobowego |
| `Print(string)` | `void Print(string msg)` | Zapisz do script logu |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Zaloguj blad z poziomem waznosci |
| `DumpStackString()` | `string DumpStackString()` | Pobierz stos wywolan jako string |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | Formatuj string (`%1`..`%9`) |

---

## Hooki misji

*Pelna referencja: [Rozdzial 6.11: Hooki misji](11-mission-hooks.md)*

### Strona serwera (modded MissionServer)

| Metoda | Opis |
|--------|------|
| `override void OnInit()` | Inicjalizacja menedzerow, rejestracja RPC |
| `override void OnMissionStart()` | Po zaladowaniu wszystkich modow |
| `override void OnUpdate(float timeslice)` | Co klatke (uzyj akumulatora!) |
| `override void OnMissionFinish()` | Czyszczenie singletonow, wyrejestrowanie zdarzen |
| `override void OnEvent(EventType eventTypeId, Param params)` | Zdarzenia czatu, glosu |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Gracz dolaczyl |
| `override void InvokeOnDisconnect(PlayerBase player)` | Gracz wyszedl |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Klient gotowy na dane |
| `override void PlayerRegistered(int peerId)` | Tozsamosc zarejestrowana |

### Strona klienta (modded MissionGameplay)

| Metoda | Opis |
|--------|------|
| `override void OnInit()` | Inicjalizacja menedzerow klienta, tworzenie HUD |
| `override void OnUpdate(float timeslice)` | Aktualizacja klienta co klatke |
| `override void OnMissionFinish()` | Czyszczenie |
| `override void OnKeyPress(int key)` | Klawisz wcisniety |
| `override void OnKeyRelease(int key)` | Klawisz zwolniony |

---

## System akcji

*Pelna referencja: [Rozdzial 6.12: System akcji](12-action-system.md)*

### Rejestracja akcji na przedmiocie

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Dodaj wlasna akcje
    RemoveAction(ActionEat);       // Usun waniliowa akcje
}
```

### Kluczowe metody ActionBase

| Metoda | Opis |
|--------|------|
| `override void CreateConditionComponents()` | Ustaw warunki odleglosci CCINone/CCTNone |
| `override bool ActionCondition(...)` | Wlasna logika walidacji |
| `override void OnExecuteServer(ActionData action_data)` | Wykonanie po stronie serwera |
| `override void OnExecuteClient(ActionData action_data)` | Efekty po stronie klienta |
| `override string GetText()` | Nazwa wyswietlana (obsluguje klucze `#STR_`) |

---

*Pelna dokumentacja: [Strona glowna](../../README.md) | [Sciaga](../cheatsheet.md) | [System encji](01-entity-system.md) | [Pojazdy](02-vehicles.md) | [Pogoda](03-weather.md) | [Timery](07-timers.md) | [Plikowe I/O](08-file-io.md) | [Siec](09-networking.md) | [Hooki misji](11-mission-hooks.md) | [System akcji](12-action-system.md)*
