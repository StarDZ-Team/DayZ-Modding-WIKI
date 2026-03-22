# Engine API gyors referencia

> Tomoritett egyoldalas referencia a leggyakrabban hasznalt DayZ engine metodusokhoz. Reszletes magyarazatokat es peldakat az egyes szekcio fejlecekben linkelt teljes fejezetekben talalsz.

---

## Tartalomjegyzek

- [Entitas metodusok](#entitas-metodusok)
- [Elet es sebzes](#elet-es-sebzes)
- [Tipusellenorzes](#tipusellenorzes)
- [Inventar](#inventar)
- [Entitas letrehozas es torles](#entitas-letrehozas-es-torles)
- [Jatekos metodusok](#jatekos-metodusok)
- [Jarmu metodusok](#jarmu-metodusok)
- [Idojaras metodusok](#idojaras-metodusok)
- [Fajl I/O metodusok](#fajl-io-metodusok)
- [Timer es CallQueue metodusok](#timer-es-callqueue-metodusok)
- [Widget letrehozo metodusok](#widget-letrehozo-metodusok)
- [RPC / halozati metodusok](#rpc--halozati-metodusok)
- [Matematikai konstansok es metodusok](#matematikai-konstansok-es-metodusok)
- [Vektor metodusok](#vektor-metodusok)
- [Globalis fuggvenyek](#globalis-fuggvenyek)
- [Misszio hookok](#misszio-hookok)
- [Akcio rendszer](#akcio-rendszer)

---

## Entitas metodusok

*Teljes referencia: [6.1. fejezet: Entitas rendszer](01-entity-system.md)*

### Pozicio es orientacio (Object)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetPosition` | `vector GetPosition()` | Vilagpozicio |
| `SetPosition` | `void SetPosition(vector pos)` | Vilagpozicio beallitasa |
| `GetOrientation` | `vector GetOrientation()` | Elfordulas (yaw, pitch, roll) fokban |
| `SetOrientation` | `void SetOrientation(vector ori)` | Elfordulas beallitasa (yaw, pitch, roll) |
| `GetDirection` | `vector GetDirection()` | Elore mutato iranyvektor |
| `SetDirection` | `void SetDirection(vector dir)` | Elore mutato irany beallitasa |
| `GetScale` | `float GetScale()` | Jelenlegi meret |
| `SetScale` | `void SetScale(float scale)` | Meret beallitasa |

### Transzformacio (IEntity)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetOrigin` | `vector GetOrigin()` | Vilagpozicio (engine szint) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Vilagpozicio beallitasa (engine szint) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Forgatas yaw/pitch/roll formaban |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Teljes 4x3 transzformacios matrix |
| `SetTransform` | `void SetTransform(vector mat[4])` | Teljes transzformacio beallitasa |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Lokalis irany vilagkoordinataba |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Lokalis pont vilagkoordinataba |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Vilag irany lokalis koordinataba |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Vilag pont lokalis koordinataba |

### Hierarchia (IEntity)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Gyermek csatolasa csonthoz |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Gyermek levalasztasa |
| `GetParent` | `IEntity GetParent()` | Szulo entitas vagy null |
| `GetChildren` | `IEntity GetChildren()` | Elso gyermek entitas |
| `GetSibling` | `IEntity GetSibling()` | Kovetkezo testver entitas |

### Megjelenito informaciok (Object)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetType` | `string GetType()` | Konfiguracios osztalynev (pl. `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Lokalizalt megjeleno nev |
| `IsKindOf` | `bool IsKindOf(string type)` | Konfiguracios oroklodes ellenorzese |

### Csontpoziciok (Object)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Csontpozicio lokalis terben |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Csontpozicio modellterben |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Csontpozicio vilagterben |

### Konfiguracio hozzaferes (Object)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Bool olvasasa konfiguraciobol |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Int olvasasa konfiguraciobol |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Float olvasasa konfiguraciobol |
| `ConfigGetString` | `string ConfigGetString(string entry)` | String olvasasa konfiguraciobol |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | String tomb olvasasa |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Konfiguracios bejegyzes letezese |

---

## Elet es sebzes

*Teljes referencia: [6.1. fejezet: Entitas rendszer](01-entity-system.md)*

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Elet ertek lekerdezese |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Maximalis elet lekerdezese |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Elet beallitasa |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Maximumra allitas |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Elet hozzaadasa |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Elet csokkentese |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Sebzes engedelyezese/tiltasa |
| `GetAllowDamage` | `bool GetAllowDamage()` | Sebzes engedelyezett-e |
| `IsAlive` | `bool IsAlive()` | Eletellenorzes (EntityAI-n hasznald) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Sebzes alkalmazasa (EntityAI) |

**Gyakori zona/tipus parok:** `("", "Health")` globalis, `("", "Blood")` jatekos ver, `("", "Shock")` jatekos sokk, `("Engine", "Health")` jarmu motor.

---

## Tipusellenorzes

| Metodus | Osztaly | Leiras |
|---------|---------|--------|
| `IsMan()` | Object | Ez jatekos? |
| `IsBuilding()` | Object | Ez epulet? |
| `IsTransport()` | Object | Ez jarmu? |
| `IsDayZCreature()` | Object | Ez leny (zombi/allat)? |
| `IsKindOf(string)` | Object | Konfiguracios oroklodes ellenorzese |
| `IsItemBase()` | EntityAI | Ez inventar targy? |
| `IsWeapon()` | EntityAI | Ez fegyver? |
| `IsMagazine()` | EntityAI | Ez tar? |
| `IsClothing()` | EntityAI | Ez ruha? |
| `IsFood()` | EntityAI | Ez etel? |
| `Class.CastTo(out, obj)` | Class | Biztonsagos lefele tipuskenyszerites (bool-t ad vissza) |
| `ClassName.Cast(obj)` | Class | Inline tipuskenyszerites (null-t ad vissza sikertelen esetben) |

---

## Inventar

*Teljes referencia: [6.1. fejezet: Entitas rendszer](01-entity-system.md)*

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetInventory` | `GameInventory GetInventory()` | Inventar komponens lekerdezese (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Targy letrehozasa cargoban |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Targy letrehozasa cargoban |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Targy letrehozasa csatolmanykent |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Osszes targy listazasa |
| `CountInventory` | `int CountInventory()` | Targyak szama |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Targy ellenorzese |
| `AttachmentCount` | `int AttachmentCount()` | Csatolmanyok szama |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Csatolmany lekerdezese index alapjan |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Csatolmany lekerdezese slot alapjan |

---

## Entitas letrehozas es torles

*Teljes referencia: [6.1. fejezet: Entitas rendszer](01-entity-system.md)*

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Entitas letrehozasa |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Letrehozas ECE flagekkel |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Azonnali szerveren torteno torles |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Csak kliens oldali torles |
| `Delete` | `void obj.Delete()` | Halasztott torles (kovetkezo frame) |

### Gyakori ECE flagek

| Flag | Ertek | Leiras |
|------|-------|--------|
| `ECE_NONE` | `0` | Nincs specialis viselkedes |
| `ECE_CREATEPHYSICS` | `1024` | Utkozes letrehozasa |
| `ECE_INITAI` | `2048` | AI inicializalasa |
| `ECE_EQUIP` | `24576` | Letrehozas csatolmanyokkal + cargo |
| `ECE_PLACE_ON_SURFACE` | kombinalt | Fizika + utvonal + kovetelmeny |
| `ECE_LOCAL` | `1073741824` | Csak kliens (nem replikalt) |
| `ECE_NOLIFETIME` | `4194304` | Nem tunik el |
| `ECE_KEEPHEIGHT` | `524288` | Y pozicio megtartasa |

---

## Jatekos metodusok

*Teljes referencia: [6.1. fejezet: Entitas rendszer](01-entity-system.md)*

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Jatekos identitas objektum |
| `GetIdentity().GetName()` | `string GetName()` | Steam/platform megjeleno nev |
| `GetIdentity().GetId()` | `string GetId()` | BI egyedi azonosito |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | Steam64 ID |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | Munkamenet jatekos ID |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Kezben tartott targy |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Vezetett jarmu |
| `IsAlive` | `bool IsAlive()` | Eletellenorzes |
| `IsUnconscious` | `bool IsUnconscious()` | Eszmeletlen ellenorzes |
| `IsRestrained` | `bool IsRestrained()` | Megkotozott ellenorzes |
| `IsInVehicle` | `bool IsInVehicle()` | Jarmuben van-e ellenorzes |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Letrehozas a jatekos elott |

---

## Jarmu metodusok

*Teljes referencia: [6.2. fejezet: Jarmu rendszer](02-vehicles.md)*

### Szemelyzet (Transport)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `CrewSize` | `int CrewSize()` | Osszes ulesszam |
| `CrewMember` | `Human CrewMember(int idx)` | Ember lekerdezese az ulesen |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Ember ulesszama |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Kenyszeritett kiszallas |
| `CrewDeath` | `void CrewDeath(int idx)` | Szemelyzet tag megolese |

### Motor (Car)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `EngineIsOn` | `bool EngineIsOn()` | Jar a motor? |
| `EngineStart` | `void EngineStart()` | Motor inditas |
| `EngineStop` | `void EngineStop()` | Motor leallitas |
| `EngineGetRPM` | `float EngineGetRPM()` | Jelenlegi fordulatszam |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | Piros zona fordulatszam |
| `GetGear` | `int GetGear()` | Jelenlegi sebessegfokozat |
| `GetSpeedometer` | `float GetSpeedometer()` | Sebesseg km/h-ban |

### Folyadékok (Car)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Maximalis kapacitas |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Toltottsegi szint 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Folyadek hozzaadasa |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Folyadek eltavolitasa |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Osszes folyadek leeresztese |

**CarFluid enum:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Vezerles (Car)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = mind |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Kormanyzas bemenet |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 gaz |

---

## Idojaras metodusok

*Teljes referencia: [6.3. fejezet: Idojaras rendszer](03-weather.md)*

### Hozzaferes

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Idojaras singleton lekerdezese |

### Jelensegek (Weather)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Felhozet |
| `GetRain` | `WeatherPhenomenon GetRain()` | Eso |
| `GetFog` | `WeatherPhenomenon GetFog()` | Kod |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Havazas |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Szelsebesseg |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Szelirany |
| `GetWind` | `vector GetWind()` | Szelirany vektor |
| `GetWindSpeed` | `float GetWindSpeed()` | Szelsebesseg m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Villam konfiguracio |

### WeatherPhenomenon

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetActual` | `float GetActual()` | Jelenlegi interpolalt ertek |
| `GetForecast` | `float GetForecast()` | Cel ertek |
| `GetDuration` | `float GetDuration()` | Hatralevo idotartam (masodpercben) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Cel beallitasa (csak szerver) |
| `SetLimits` | `void SetLimits(float min, float max)` | Ertekhatar korlatok |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Valtozasi sebesseg korlatok |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Valtozas mertek korlatok |

---

## Fajl I/O metodusok

*Teljes referencia: [6.8. fejezet: Fajl I/O es JSON](08-file-io.md)*

### Utvonal prefixek

| Prefix | Hely | Irhato |
|--------|------|--------|
| `$profile:` | Szerver/kliens profil konyvtar | Igen |
| `$saves:` | Mentes konyvtar | Igen |
| `$mission:` | Jelenlegi misszio mappa | Altalaban csak olvasas |
| `$CurrentDir:` | Munkaskonyvtar | Fugg |

### Fajlmuveletek

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `FileExist` | `bool FileExist(string path)` | Fajl letezik-e |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Konyvtar letrehozasa |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Fajl megnyitasa (0 = sikertelen) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Fajl bezarasa |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Szoveg irasa (ujsor nelkul) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Szoveg irasa + ujsor |
| `FGets` | `int FGets(FileHandle fh, string line)` | Egy sor olvasasa |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Teljes fajl olvasasa |
| `DeleteFile` | `bool DeleteFile(string path)` | Fajl torlese |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Fajl masolasa |

### JSON (JsonFileLoader)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | JSON betoltese objektumba (**void-ot ad vissza**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Objektum mentese JSON-kent |

### FileMode enum

| Ertek | Leiras |
|-------|--------|
| `FileMode.READ` | Megnyitas olvasasra |
| `FileMode.WRITE` | Megnyitas irasra (letrehozza/felulirja) |
| `FileMode.APPEND` | Megnyitas hozzafuzesre |

---

## Timer es CallQueue metodusok

*Teljes referencia: [6.7. fejezet: Idozitok es CallQueue](07-timers.md)*

### Hozzaferes

| Kifejezes | Visszateresi ertek | Leiras |
|-----------|---------------------|--------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Jatekmenet hivasi sor |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | Rendszer hivasi sor |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | GUI hivasi sor |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Framenkenti frissitesi sor |

### ScriptCallQueue

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Kesleltetett/ismetlodo hivas utemezese |
| `Call` | `void Call(func fn, param1..4)` | Vegrehajtas a kovetkezo frame-ben |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Metodus hivasa nev alapjan |
| `Remove` | `void Remove(func fn)` | Utemezett hivas torlese |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Torles nev alapjan |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | CallLater hatralevo ideje |

### Timer osztaly

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Konstruktor |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Timer inditasa |
| `Stop` | `void Stop()` | Timer megallitasa |
| `Pause` | `void Pause()` | Timer szuneteltetese |
| `Continue` | `void Continue()` | Timer folytatas |
| `IsPaused` | `bool IsPaused()` | Timer szunetel? |
| `IsRunning` | `bool IsRunning()` | Timer aktiv? |
| `GetRemaining` | `float GetRemaining()` | Hatralevo masodpercek |

### ScriptInvoker

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Insert` | `void Insert(func fn)` | Callback regisztralasa |
| `Remove` | `void Remove(func fn)` | Callback torlese |
| `Invoke` | `void Invoke(params...)` | Osszes callback hivasa |
| `Count` | `int Count()` | Regisztralt callbackok szama |
| `Clear` | `void Clear()` | Osszes callback eltavolitasa |

---

## Widget letrehozo metodusok

*Teljes referencia: [3.5. fejezet: Programozott letrehozas](../03-gui-system/05-programmatic-widgets.md)*

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | UI munkaterulet lekerdezese |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | .layout fajl betoltese |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Gyermek keresese nev alapjan (rekurziv) |
| `Show` | `void Show(bool show)` | Widget megjelenitese/elrejtese |
| `SetText` | `void TextWidget.SetText(string text)` | Szoveges tartalom beallitasa |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Kep index beallitasa |
| `SetColor` | `void SetColor(int color)` | Widget szin beallitasa (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Atlatszosag beallitasa 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Widget meret beallitasa |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Widget pozicio beallitasa |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Kepernyo felbontas |
| `Destroy` | `void Widget.Destroy()` | Widget eltavolitasa es megsemmisitese |

### ARGB szin segedo

| Fuggveny | Szignatura | Leiras |
|----------|------------|--------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Szin letrehozasa (0-255 mindegyik) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Szin letrehozasa (0.0-1.0 mindegyik) |

---

## RPC / halozati metodusok

*Teljes referencia: [6.9. fejezet: Halozat es RPC](09-networking.md)*

### Kornyezet ellenorzesek

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `GetGame().IsServer()` | `bool IsServer()` | True a szerveren / listen-server gazdagepe |
| `GetGame().IsClient()` | `bool IsClient()` | True a kliensen |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | True tobbszereployos modban |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | True csak dedikalt szerveren |

### ScriptRPC

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `ScriptRPC()` | `void ScriptRPC()` | Konstruktor |
| `Write` | `bool Write(void value)` | Ertek szerializalasa (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | RPC kuldese |
| `Reset` | `void Reset()` | Beirt adatok torlese |

### Fogadas (Override az Object-en)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | RPC fogadasi handler |

### ParamsReadContext

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Read` | `bool Read(out void value)` | Ertek deszerializalasa (ugyanazok a tipusok mint Write) |

### Regebbi RPC (CGame)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Egyetlen Param objektum kuldese |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Tobb Param objektum kuldese |

### ScriptInputUserData (ellenorzott bemenet)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Van-e hely a sorban |
| `Write` | `bool Write(void value)` | Ertek szerializalasa |
| `Send` | `void Send()` | Kuldes a szerverre (csak kliens) |

---

## Matematikai konstansok es metodusok

*Teljes referencia: [1.7. fejezet: Matematika es vektorok](../01-enforce-script/07-math-vectors.md)*

### Konstansok

| Konstans | Ertek | Leiras |
|----------|-------|--------|
| `Math.PI` | `3.14159...` | Pi |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Fok-radian szorzo |
| `Math.RAD2DEG` | `57.2957...` | Radian-fok szorzo |
| `int.MAX` | `2147483647` | Maximalis int |
| `int.MIN` | `-2147483648` | Minimalis int |
| `float.MAX` | `3.4028e+38` | Maximalis float |
| `float.MIN` | `1.175e-38` | Minimalis pozitiv float |

### Veletlen

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Veletlen int [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Veletlen int [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Veletlen float [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | Veletlen true/false |

### Kerekites

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Math.Round` | `float Round(float f)` | Kerekites a legkozelebbire |
| `Math.Floor` | `float Floor(float f)` | Lefele kerekites |
| `Math.Ceil` | `float Ceil(float f)` | Felfele kerekites |

### Szukites es interpolacio

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Szukites tartomanyra |
| `Math.Min` | `float Min(float a, float b)` | Ketto minimuma |
| `Math.Max` | `float Max(float a, float b)` | Ketto maximuma |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Linearis interpolacio |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Inverz lerp |

### Abszolut ertek es hatvany

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Abszolut ertek (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Abszolut ertek (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Hatvanyozas |
| `Math.Sqrt` | `float Sqrt(float f)` | Negyzetgyok |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Negyzet (f * f) |

### Trigonometria (radian)

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Math.Sin` | `float Sin(float rad)` | Szinusz |
| `Math.Cos` | `float Cos(float rad)` | Koszinusz |
| `Math.Tan` | `float Tan(float rad)` | Tangens |
| `Math.Asin` | `float Asin(float val)` | Arkusz szinusz |
| `Math.Acos` | `float Acos(float val)` | Arkusz koszinusz |
| `Math.Atan2` | `float Atan2(float y, float x)` | Szog osszetevokbol |

### Sima csillapitas

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Siman csillapit a cel fele (mint Unity SmoothDamp) |

```c
// Sima csillapitas hasznalata
// val: jelenlegi ertek, target: cel ertek, velocity: ref sebesseg (hivasok kozott megorzott)
// smoothTime: simitas ideje, maxSpeed: sebesseg korlat, dt: delta ido
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Szog

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Normalizalas 0-360 tartomanyra |

---

## Vektor metodusok

| Metodus | Szignatura | Leiras |
|---------|------------|--------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Tavolsag ket pont kozott |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Tavolsag negyzete (gyorsabb) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Iranyvektor |
| `vector.Dot` | `float Dot(vector a, vector b)` | Skalaris szorzat |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Poziciok interpolacioja |
| `v.Length()` | `float Length()` | Vektor nagysaga |
| `v.LengthSq()` | `float LengthSq()` | Nagysag negyzete (gyorsabb) |
| `v.Normalized()` | `vector Normalized()` | Egysevektor |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Irany yaw/pitch-re |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Yaw/pitch iranyra |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Matrix szorzas |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Inverz matrix szorzas |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Vektor letrehozasa |

---

## Globalis fuggvenyek

| Fuggveny | Szignatura | Leiras |
|----------|------------|--------|
| `GetGame()` | `CGame GetGame()` | Jatek peldany |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Lokalis jatekos (csak KLIENS) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Osszes jatekos (szerver) |
| `GetGame().GetWorld()` | `World GetWorld()` | Vilag peldany |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Szerver ido (masodpercben) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | UI munkaterulet |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Terep magassag a pozicion |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Felszini anyag tipusa |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Objektumok keresese pozicio kornyeken |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Kepernyo felbontas lekerdezese |
| `GetGame().IsServer()` | `bool IsServer()` | Szerver ellenorzes |
| `GetGame().IsClient()` | `bool IsClient()` | Kliens ellenorzes |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Tobbszereployos ellenorzes |
| `Print(string)` | `void Print(string msg)` | Iras a script logba |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Hiba logolasa sulyossagi szinttel |
| `DumpStackString()` | `string DumpStackString()` | Hivasverem lekerdezese stringkent |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | String formatazas (`%1`..`%9`) |

---

## Misszio hookok

*Teljes referencia: [6.11. fejezet: Misszio hookok](11-mission-hooks.md)*

### Szerver oldal (modded MissionServer)

| Metodus | Leiras |
|---------|--------|
| `override void OnInit()` | Menedzserek inicializalasa, RPC regisztralasa |
| `override void OnMissionStart()` | Miutan minden mod betoltodott |
| `override void OnUpdate(float timeslice)` | Framenkenti (hasznalj akkumulatort!) |
| `override void OnMissionFinish()` | Singletonok takaritasa, esemenyek leregisztralasa |
| `override void OnEvent(EventType eventTypeId, Param params)` | Chat, hang esemenyek |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Jatekos csatlakozott |
| `override void InvokeOnDisconnect(PlayerBase player)` | Jatekos killepett |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Kliens kesz az adatokra |
| `override void PlayerRegistered(int peerId)` | Identitas regisztralva |

### Kliens oldal (modded MissionGameplay)

| Metodus | Leiras |
|---------|--------|
| `override void OnInit()` | Kliens menedzserek inicializalasa, HUD letrehozasa |
| `override void OnUpdate(float timeslice)` | Framenkenti kliens frissites |
| `override void OnMissionFinish()` | Takaritas |
| `override void OnKeyPress(int key)` | Billentyu lenyomva |
| `override void OnKeyRelease(int key)` | Billentyu elengedve |

---

## Akcio rendszer

*Teljes referencia: [6.12. fejezet: Akcio rendszer](12-action-system.md)*

### Akciok regisztralasa egy targyra

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Egyeni akcio hozzaadasa
    RemoveAction(ActionEat);       // Vanilla akcio eltavolitasa
}
```

### ActionBase fontos metodusok

| Metodus | Leiras |
|---------|--------|
| `override void CreateConditionComponents()` | CCINone/CCTNone tavolsagi feltetelek beallitasa |
| `override bool ActionCondition(...)` | Egyeni validacios logika |
| `override void OnExecuteServer(ActionData action_data)` | Szerver oldali vegrehajtas |
| `override void OnExecuteClient(ActionData action_data)` | Kliens oldali effektek |
| `override string GetText()` | Megjeleno nev (`#STR_` kulcsokat tamogat) |

---

*Teljes dokumentacio: [Fooldal](../../README.md) | [Puska](../cheatsheet.md) | [Entitas rendszer](01-entity-system.md) | [Jarmuvek](02-vehicles.md) | [Idojaras](03-weather.md) | [Idozitok](07-timers.md) | [Fajl I/O](08-file-io.md) | [Halozat](09-networking.md) | [Misszio hookok](11-mission-hooks.md) | [Akcio rendszer](12-action-system.md)*
