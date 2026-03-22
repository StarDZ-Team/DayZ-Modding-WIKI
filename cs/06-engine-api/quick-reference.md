# Engine API Quick Reference

[Home](../README.md) | **Engine API Quick Reference**

---

## Obsah

- [Metody entit](#metody-entit)
- [Zdraví a poškození](#zdraví-a-poškození)
- [Kontrola typů](#kontrola-typů)
- [Inventář](#inventář)
- [Vytváření a mazání entit](#vytváření-a-mazání-entit)
- [Metody hráče](#metody-hráče)
- [Metody vozidel](#metody-vozidel)
- [Metody počasí](#metody-počasí)
- [Metody souborového I/O](#metody-souborového-io)
- [Metody Timer a CallQueue](#metody-timer-a-callqueue)
- [Metody vytváření widgetů](#metody-vytváření-widgetů)
- [Metody RPC / síťování](#metody-rpc--síťování)
- [Matematické konstanty a metody](#matematické-konstanty-a-metody)
- [Metody vektorů](#metody-vektorů)
- [Globální funkce](#globální-funkce)
- [Háčky misí](#háčky-misí)
- [Systém akcí](#systém-akcí)

---

## Metody entit

*Plná reference: [Kapitola 6.1: Entity systém](01-entity-system.md)*

### Pozice a orientace (Object)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetPosition` | `vector GetPosition()` | Pozice ve světě |
| `SetPosition` | `void SetPosition(vector pos)` | Nastavit pozici ve světě |
| `GetOrientation` | `vector GetOrientation()` | Natočení (yaw, pitch, roll) ve stupních |
| `SetOrientation` | `void SetOrientation(vector ori)` | Nastavit natočení (yaw, pitch, roll) |
| `GetDirection` | `vector GetDirection()` | Vektor směru vpřed |
| `SetDirection` | `void SetDirection(vector dir)` | Nastavit směr vpřed |
| `GetScale` | `float GetScale()` | Aktuální měřítko |
| `SetScale` | `void SetScale(float scale)` | Nastavit měřítko |

### Transformace (IEntity)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetOrigin` | `vector GetOrigin()` | Pozice ve světě (úroveň enginu) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Nastavit pozici ve světě (úroveň enginu) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Rotace jako yaw/pitch/roll |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Plná transformační matice 4x3 |
| `SetTransform` | `void SetTransform(vector mat[4])` | Nastavit plnou transformaci |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Lokální směr do světových souřadnic |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Lokální bod do světových souřadnic |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Světový směr do lokálních souřadnic |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Světový bod do lokálních souřadnic |

### Hierarchie (IEntity)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Připojit potomka ke kosti |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Odpojit potomka |
| `GetParent` | `IEntity GetParent()` | Rodičovská entita nebo null |
| `GetChildren` | `IEntity GetChildren()` | První potomek |
| `GetSibling` | `IEntity GetSibling()` | Další sourozenec |

### Zobrazovací informace (Object)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetType` | `string GetType()` | Název konfigurační třídy (např. `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Lokalizovaný zobrazovaný název |
| `IsKindOf` | `bool IsKindOf(string type)` | Kontrola dědičnosti v konfiguraci |

### Pozice kostí (Object)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Pozice kosti v lokálním prostoru |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Pozice kosti v prostoru modelu |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Pozice kosti ve světovém prostoru |

### Přístup ke konfiguraci (Object)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Načíst bool z konfigurace |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Načíst int z konfigurace |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Načíst float z konfigurace |
| `ConfigGetString` | `string ConfigGetString(string entry)` | Načíst string z konfigurace |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | Načíst pole řetězců |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Zkontrolovat existenci položky konfigurace |

---

## Zdraví a poškození

*Plná reference: [Kapitola 6.1: Entity systém](01-entity-system.md)*

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Získat hodnotu zdraví |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Získat maximální zdraví |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Nastavit zdraví |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Nastavit na maximum |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Přidat zdraví |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Snížit zdraví |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Povolit/zakázat poškození |
| `GetAllowDamage` | `bool GetAllowDamage()` | Zjistit, zda je povoleno poškození |
| `IsAlive` | `bool IsAlive()` | Kontrola, zda je naživu (použít na EntityAI) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Aplikovat poškození (EntityAI) |

**Běžné páry zóna/typ:** `("", "Health")` globální, `("", "Blood")` krev hráče, `("", "Shock")` šok hráče, `("Engine", "Health")` motor vozidla.

---

## Kontrola typů

| Metoda | Třída | Popis |
|--------|-------|-------|
| `IsMan()` | Object | Je to hráč? |
| `IsBuilding()` | Object | Je to budova? |
| `IsTransport()` | Object | Je to vozidlo? |
| `IsDayZCreature()` | Object | Je to stvoření (zombie/zvíře)? |
| `IsKindOf(string)` | Object | Kontrola dědičnosti v konfiguraci |
| `IsItemBase()` | EntityAI | Je to inventářový předmět? |
| `IsWeapon()` | EntityAI | Je to zbraň? |
| `IsMagazine()` | EntityAI | Je to zásobník? |
| `IsClothing()` | EntityAI | Je to oblečení? |
| `IsFood()` | EntityAI | Je to jídlo? |
| `Class.CastTo(out, obj)` | Class | Bezpečné přetypování dolů (vrací bool) |
| `ClassName.Cast(obj)` | Class | Inline přetypování (vrací null při neúspěchu) |

---

## Inventář

*Plná reference: [Kapitola 6.1: Entity systém](01-entity-system.md)*

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetInventory` | `GameInventory GetInventory()` | Získat komponentu inventáře (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Vytvořit předmět v cargo |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Vytvořit předmět v cargo |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Vytvořit předmět jako příslušenství |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Vypsat všechny předměty |
| `CountInventory` | `int CountInventory()` | Počet předmětů |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Zkontrolovat předmět |
| `AttachmentCount` | `int AttachmentCount()` | Počet příslušenství |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Získat příslušenství podle indexu |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Získat příslušenství podle slotu |

---

## Vytváření a mazání entit

*Plná reference: [Kapitola 6.1: Entity systém](01-entity-system.md)*

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Vytvořit entitu |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Vytvořit s ECE příznaky |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Okamžité smazání na serveru |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Smazání pouze na klientu |
| `Delete` | `void obj.Delete()` | Odložené smazání (další snímek) |

### Běžné ECE příznaky

| Příznak | Hodnota | Popis |
|---------|---------|-------|
| `ECE_NONE` | `0` | Žádné speciální chování |
| `ECE_CREATEPHYSICS` | `1024` | Vytvořit kolizi |
| `ECE_INITAI` | `2048` | Inicializovat AI |
| `ECE_EQUIP` | `24576` | Vytvořit s příslušenstvím + cargo |
| `ECE_PLACE_ON_SURFACE` | kombinovaný | Fyzika + cesta + trasování |
| `ECE_LOCAL` | `1073741824` | Pouze klient (nereplikováno) |
| `ECE_NOLIFETIME` | `4194304` | Nezmizí |
| `ECE_KEEPHEIGHT` | `524288` | Zachovat pozici Y |

---

## Metody hráče

*Plná reference: [Kapitola 6.1: Entity systém](01-entity-system.md)*

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Objekt identity hráče |
| `GetIdentity().GetName()` | `string GetName()` | Zobrazované jméno Steam/platformy |
| `GetIdentity().GetId()` | `string GetId()` | Unikátní BI ID |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | Steam64 ID |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | ID hráče v relaci |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Předmět v rukou |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Řízené vozidlo |
| `IsAlive` | `bool IsAlive()` | Kontrola, zda je naživu |
| `IsUnconscious` | `bool IsUnconscious()` | Kontrola bezvědomí |
| `IsRestrained` | `bool IsRestrained()` | Kontrola spoutání |
| `IsInVehicle` | `bool IsInVehicle()` | Kontrola, zda je ve vozidle |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Vytvořit před hráčem |

---

## Metody vozidel

*Plná reference: [Kapitola 6.2: Systém vozidel](02-vehicles.md)*

### Posádka (Transport)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `CrewSize` | `int CrewSize()` | Celkový počet sedadel |
| `CrewMember` | `Human CrewMember(int idx)` | Získat člověka na sedadle |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Získat sedadlo člověka |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Vyhodit ze sedadla |
| `CrewDeath` | `void CrewDeath(int idx)` | Zabít člena posádky |

### Motor (Car)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `EngineIsOn` | `bool EngineIsOn()` | Běží motor? |
| `EngineStart` | `void EngineStart()` | Nastartovat motor |
| `EngineStop` | `void EngineStop()` | Zastavit motor |
| `EngineGetRPM` | `float EngineGetRPM()` | Aktuální otáčky |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | Otáčky červené zóny |
| `GetGear` | `int GetGear()` | Aktuální rychlostní stupeň |
| `GetSpeedometer` | `float GetSpeedometer()` | Rychlost v km/h |

### Kapaliny (Car)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Maximální kapacita |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Úroveň naplnění 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Přidat kapalinu |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Ubrat kapalinu |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Vypustit veškerou kapalinu |

**Výčet CarFluid:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Ovládání (Car)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = všechna kola |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Vstup řízení |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 plyn |

---

## Metody počasí

*Plná reference: [Kapitola 6.3: Systém počasí](03-weather.md)*

### Přístup

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Získat singleton počasí |

### Jevy (Weather)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Oblačnost |
| `GetRain` | `WeatherPhenomenon GetRain()` | Déšť |
| `GetFog` | `WeatherPhenomenon GetFog()` | Mlha |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Sněžení |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Rychlost větru |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Směr větru |
| `GetWind` | `vector GetWind()` | Vektor směru větru |
| `GetWindSpeed` | `float GetWindSpeed()` | Rychlost větru m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Konfigurace blesků |

### WeatherPhenomenon

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetActual` | `float GetActual()` | Aktuální interpolovaná hodnota |
| `GetForecast` | `float GetForecast()` | Cílová hodnota |
| `GetDuration` | `float GetDuration()` | Zbývající doba (sekundy) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Nastavit cíl (pouze server) |
| `SetLimits` | `void SetLimits(float min, float max)` | Limity rozsahu hodnot |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Limity rychlosti změny |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Limity velikosti změny |

---

## Metody souborového I/O

*Plná reference: [Kapitola 6.8: Souborové I/O a JSON](08-file-io.md)*

### Prefixy cest

| Prefix | Umístění | Zapisovatelný |
|--------|----------|---------------|
| `$profile:` | Adresář profilu serveru/klienta | Ano |
| `$saves:` | Adresář uložených pozic | Ano |
| `$mission:` | Složka aktuální mise | Obvykle čtení |
| `$CurrentDir:` | Pracovní adresář | Záleží |

### Operace se soubory

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `FileExist` | `bool FileExist(string path)` | Zkontrolovat existenci souboru |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Vytvořit adresář |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Otevřít soubor (0 = neúspěch) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Zavřít soubor |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Zapsat text (bez nového řádku) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Zapsat text + nový řádek |
| `FGets` | `int FGets(FileHandle fh, string line)` | Přečíst jeden řádek |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Přečíst celý soubor |
| `DeleteFile` | `bool DeleteFile(string path)` | Smazat soubor |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Kopírovat soubor |

### JSON (JsonFileLoader)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | Načíst JSON do objektu (**vrací void**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Uložit objekt jako JSON |

### Výčet FileMode

| Hodnota | Popis |
|---------|-------|
| `FileMode.READ` | Otevřít pro čtení |
| `FileMode.WRITE` | Otevřít pro zápis (vytvoří/přepíše) |
| `FileMode.APPEND` | Otevřít pro připojení |

---

## Metody Timer a CallQueue

*Plná reference: [Kapitola 6.7: Časovače a CallQueue](07-timers.md)*

### Přístup

| Výraz | Vrací | Popis |
|-------|-------|-------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Herní fronta volání |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | Systémová fronta volání |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | GUI fronta volání |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Fronta aktualizací každý snímek |

### ScriptCallQueue

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Naplánovat zpožděné/opakující se volání |
| `Call` | `void Call(func fn, param1..4)` | Spustit příští snímek |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Zavolat metodu podle názvu řetězce |
| `Remove` | `void Remove(func fn)` | Zrušit naplánované volání |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Zrušit podle názvu řetězce |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Získat zbývající čas CallLater |

### Třída Timer

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Konstruktor |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Spustit časovač |
| `Stop` | `void Stop()` | Zastavit časovač |
| `Pause` | `void Pause()` | Pozastavit časovač |
| `Continue` | `void Continue()` | Pokračovat v časovači |
| `IsPaused` | `bool IsPaused()` | Je časovač pozastaven? |
| `IsRunning` | `bool IsRunning()` | Je časovač aktivní? |
| `GetRemaining` | `float GetRemaining()` | Zbývající sekundy |

### ScriptInvoker

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Insert` | `void Insert(func fn)` | Zaregistrovat callback |
| `Remove` | `void Remove(func fn)` | Odregistrovat callback |
| `Invoke` | `void Invoke(params...)` | Spustit všechny callbacky |
| `Count` | `int Count()` | Počet zaregistrovaných callbacků |
| `Clear` | `void Clear()` | Odebrat všechny callbacky |

---

## Metody vytváření widgetů

*Plná reference: [Kapitola 3.5: Programové vytváření](../03-gui-system/05-programmatic-widgets.md)*

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Získat pracovní prostor UI |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | Načíst soubor .layout |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Najít potomka podle názvu (rekurzivně) |
| `Show` | `void Show(bool show)` | Zobrazit/skrýt widget |
| `SetText` | `void TextWidget.SetText(string text)` | Nastavit textový obsah |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Nastavit index obrázku |
| `SetColor` | `void SetColor(int color)` | Nastavit barvu widgetu (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Nastavit průhlednost 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Nastavit velikost widgetu |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Nastavit pozici widgetu |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Rozlišení obrazovky |
| `Destroy` | `void Widget.Destroy()` | Odstranit a zničit widget |

### Pomocník ARGB barev

| Funkce | Signatura | Popis |
|--------|-----------|-------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Vytvořit barvu (0-255 každá) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Vytvořit barvu (0.0-1.0 každá) |

---

## Metody RPC / síťování

*Plná reference: [Kapitola 6.9: Síťování a RPC](09-networking.md)*

### Kontroly prostředí

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `GetGame().IsServer()` | `bool IsServer()` | True na serveru / hostiteli listen-serveru |
| `GetGame().IsClient()` | `bool IsClient()` | True na klientu |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | True v multiplayeru |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | True pouze na dedikovaném serveru |

### ScriptRPC

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `ScriptRPC()` | `void ScriptRPC()` | Konstruktor |
| `Write` | `bool Write(void value)` | Serializovat hodnotu (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | Odeslat RPC |
| `Reset` | `void Reset()` | Vymazat zapsaná data |

### Příjem (Override na Object)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | Handler přijetí RPC |

### ParamsReadContext

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Read` | `bool Read(out void value)` | Deserializovat hodnotu (stejné typy jako Write) |

### Starší RPC (CGame)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Odeslat jeden objekt Param |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Odeslat více objektů Param |

### ScriptInputUserData (ověřený vstup)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Zkontrolovat, zda má fronta místo |
| `Write` | `bool Write(void value)` | Serializovat hodnotu |
| `Send` | `void Send()` | Odeslat na server (pouze klient) |

---

## Matematické konstanty a metody

*Plná reference: [Kapitola 1.7: Matematika a vektory](../01-enforce-script/07-math-vectors.md)*

### Konstanty

| Konstanta | Hodnota | Popis |
|-----------|---------|-------|
| `Math.PI` | `3.14159...` | Pi |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Násobitel stupňů na radiány |
| `Math.RAD2DEG` | `57.2957...` | Násobitel radiánů na stupně |
| `int.MAX` | `2147483647` | Maximální int |
| `int.MIN` | `-2147483648` | Minimální int |
| `float.MAX` | `3.4028e+38` | Maximální float |
| `float.MIN` | `1.175e-38` | Minimální kladný float |

### Náhodné hodnoty

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Náhodný int [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Náhodný int [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Náhodný float [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | Náhodné true/false |

### Zaokrouhlování

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Math.Round` | `float Round(float f)` | Zaokrouhlit na nejbližší |
| `Math.Floor` | `float Floor(float f)` | Zaokrouhlit dolů |
| `Math.Ceil` | `float Ceil(float f)` | Zaokrouhlit nahoru |

### Omezení a interpolace

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Omezit na rozsah |
| `Math.Min` | `float Min(float a, float b)` | Minimum ze dvou |
| `Math.Max` | `float Max(float a, float b)` | Maximum ze dvou |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Lineární interpolace |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Inverzní lerp |

### Absolutní hodnota a mocniny

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Absolutní hodnota (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Absolutní hodnota (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Mocnina |
| `Math.Sqrt` | `float Sqrt(float f)` | Odmocnina |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Druhá mocnina (f * f) |

### Trigonometrie (radiány)

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Math.Sin` | `float Sin(float rad)` | Sinus |
| `Math.Cos` | `float Cos(float rad)` | Kosinus |
| `Math.Tan` | `float Tan(float rad)` | Tangens |
| `Math.Asin` | `float Asin(float val)` | Arkus sinus |
| `Math.Acos` | `float Acos(float val)` | Arkus kosinus |
| `Math.Atan2` | `float Atan2(float y, float x)` | Úhel ze složek |

### Plynulé tlumení

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Plynule tlumit k cíli (jako Unity SmoothDamp) |

```c
// Použití plynulého tlumení
// val: aktuální hodnota, target: cílová hodnota, velocity: ref rychlost (uchovávaná mezi voláními)
// smoothTime: čas vyhlazení, maxSpeed: omezení rychlosti, dt: delta čas
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Úhel

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Normalizovat na 0-360 |

---

## Metody vektorů

| Metoda | Signatura | Popis |
|--------|-----------|-------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Vzdálenost mezi body |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Kvadrát vzdálenosti (rychlejší) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Vektor směru |
| `vector.Dot` | `float Dot(vector a, vector b)` | Skalární součin |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Interpolace pozic |
| `v.Length()` | `float Length()` | Velikost vektoru |
| `v.LengthSq()` | `float LengthSq()` | Kvadrát velikosti (rychlejší) |
| `v.Normalized()` | `vector Normalized()` | Jednotkový vektor |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Směr na yaw/pitch |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Yaw/pitch na směr |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Násobení maticí |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Inverzní násobení maticí |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Vytvořit vektor |

---

## Globální funkce

| Funkce | Signatura | Popis |
|--------|-----------|-------|
| `GetGame()` | `CGame GetGame()` | Instance hry |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Lokální hráč (pouze KLIENT) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Všichni hráči (server) |
| `GetGame().GetWorld()` | `World GetWorld()` | Instance světa |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Čas serveru (sekundy) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Pracovní prostor UI |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Výška terénu na pozici |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Typ povrchového materiálu |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Najít objekty v okolí pozice |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Získat rozlišení obrazovky |
| `GetGame().IsServer()` | `bool IsServer()` | Kontrola serveru |
| `GetGame().IsClient()` | `bool IsClient()` | Kontrola klienta |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Kontrola multiplayeru |
| `Print(string)` | `void Print(string msg)` | Zapsat do script logu |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Zalogovat chybu se závažností |
| `DumpStackString()` | `string DumpStackString()` | Získat zásobník volání jako řetězec |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | Formátovat řetězec (`%1`..`%9`) |

---

## Háčky misí

*Plná reference: [Kapitola 6.11: Háčky misí](11-mission-hooks.md)*

### Serverová strana (modded MissionServer)

| Metoda | Popis |
|--------|-------|
| `override void OnInit()` | Inicializace manažerů, registrace RPC |
| `override void OnMissionStart()` | Po načtení všech modů |
| `override void OnUpdate(float timeslice)` | Každý snímek (použijte akumulátor!) |
| `override void OnMissionFinish()` | Úklid singletonů, odhlášení událostí |
| `override void OnEvent(EventType eventTypeId, Param params)` | Události chatu, hlasu |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Hráč se připojil |
| `override void InvokeOnDisconnect(PlayerBase player)` | Hráč se odpojil |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Klient připraven na data |
| `override void PlayerRegistered(int peerId)` | Identita zaregistrována |

### Klientská strana (modded MissionGameplay)

| Metoda | Popis |
|--------|-------|
| `override void OnInit()` | Inicializace klientských manažerů, vytvoření HUD |
| `override void OnUpdate(float timeslice)` | Aktualizace klienta každý snímek |
| `override void OnMissionFinish()` | Úklid |
| `override void OnKeyPress(int key)` | Klávesa stisknuta |
| `override void OnKeyRelease(int key)` | Klávesa uvolněna |

---

## Systém akcí

*Plná reference: [Kapitola 6.12: Systém akcí](12-action-system.md)*

### Registrace akcí na předmětu

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Přidat vlastní akci
    RemoveAction(ActionEat);       // Odebrat vanilla akci
}
```

### Klíčové metody ActionBase

| Metoda | Popis |
|--------|-------|
| `override void CreateConditionComponents()` | Nastavit podmínky vzdálenosti CCINone/CCTNone |
| `override bool ActionCondition(...)` | Vlastní validační logika |
| `override void OnExecuteServer(ActionData action_data)` | Spuštění na serveru |
| `override void OnExecuteClient(ActionData action_data)` | Efekty na klientu |
| `override string GetText()` | Zobrazovaný název (podporuje klíče `#STR_`) |

---

*Plná dokumentace: [Domů](../README.md) | [Tahák](../cheatsheet.md) | [Entity systém](01-entity-system.md) | [Vozidla](02-vehicles.md) | [Počasí](03-weather.md) | [Časovače](07-timers.md) | [Souborové I/O](08-file-io.md) | [Síťování](09-networking.md) | [Háčky misí](11-mission-hooks.md) | [Systém akcí](12-action-system.md)*
