# Referencia Rápida de la API del Motor

[Inicio](../README.md) | **Referencia Rápida de la API del Motor**

---

> Referencia condensada de una sola página para los métodos más comúnmente usados del motor DayZ. Para explicaciones detalladas y ejemplos, consulta los capítulos completos enlazados en el encabezado de cada sección.

---

## Tabla de Contenidos

- [Métodos de Entidad](#entity-methods)
- [Salud y Daño](#health--damage)
- [Verificación de Tipos](#type-checking)
- [Inventario](#inventory)
- [Creación y Eliminación de Entidades](#entity-creation--deletion)
- [Métodos del Jugador](#player-methods)
- [Métodos de Vehículos](#vehicle-methods)
- [Métodos de Clima](#weather-methods)
- [Métodos de E/S de Archivos](#file-io-methods)
- [Métodos de Timer y CallQueue](#timer--callqueue-methods)
- [Métodos de Creación de Widgets](#widget-creation-methods)
- [Métodos de RPC / Red](#rpc--networking-methods)
- [Constantes y Métodos Matemáticos](#math-constants--methods)
- [Métodos de Vector](#vector-methods)
- [Funciones Globales](#global-functions)
- [Hooks de Misión](#mission-hooks)
- [Sistema de Acciones](#action-system)

---

## Métodos de Entidad

*Referencia completa: [Capítulo 6.1: Sistema de Entidades](01-entity-system.md)*

### Posición y Orientación (Object)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetPosition` | `vector GetPosition()` | World position |
| `SetPosition` | `void SetPosition(vector pos)` | Set world position |
| `GetOrientation` | `vector GetOrientation()` | Yaw, pitch, roll in degrees |
| `SetOrientation` | `void SetOrientation(vector ori)` | Set yaw, pitch, roll |
| `GetDirection` | `vector GetDirection()` | Forward direction vector |
| `SetDirection` | `void SetDirection(vector dir)` | Set forward direction |
| `GetScale` | `float GetScale()` | Current scale |
| `SetScale` | `void SetScale(float scale)` | Set scale |

### Transformación (IEntity)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetOrigin` | `vector GetOrigin()` | World position (engine level) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Set world position (engine level) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Rotation as yaw/pitch/roll |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Full 4x3 transform matrix |
| `SetTransform` | `void SetTransform(vector mat[4])` | Set full transform |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Local direction to world |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Local point to world |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | World direction to local |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | World point to local |

### Jerarquía (IEntity)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Attach child to bone |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Detach child |
| `GetParent` | `IEntity GetParent()` | Parent entity or null |
| `GetChildren` | `IEntity GetChildren()` | First child entity |
| `GetSibling` | `IEntity GetSibling()` | Next sibling entity |

### Información de Visualización (Object)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetType` | `string GetType()` | Config class name (e.g., `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Localized display name |
| `IsKindOf` | `bool IsKindOf(string type)` | Check config inheritance |

### Posiciones de Huesos (Object)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Bone position in local space |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Bone position in model space |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Bone position in world space |

### Acceso a Config (Object)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Read bool from config |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Read int from config |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Read float from config |
| `ConfigGetString` | `string ConfigGetString(string entry)` | Read string from config |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | Read string array |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Check if config entry exists |

---

## Salud y Daño

*Referencia completa: [Capítulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Get health value |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Get max health |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Set health |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Set to max |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Add health |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Reduce health |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Enable/disable damage |
| `GetAllowDamage` | `bool GetAllowDamage()` | Check if damage allowed |
| `IsAlive` | `bool IsAlive()` | Alive check (use on EntityAI) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Apply damage (EntityAI) |

**Pares comunes de zona/tipo:** `("", "Health")` global, `("", "Blood")` player blood, `("", "Shock")` player shock, `("Engine", "Health")` vehicle engine.

---

## Verificación de Tipos

| Método | Clase | Descripción |
|--------|-------|-------------|
| `IsMan()` | Object | Is this a player? |
| `IsBuilding()` | Object | Is this a building? |
| `IsTransport()` | Object | Is this a vehicle? |
| `IsDayZCreature()` | Object | Is this a creature (zombie/animal)? |
| `IsKindOf(string)` | Object | Config inheritance check |
| `IsItemBase()` | EntityAI | Is this an inventory item? |
| `IsWeapon()` | EntityAI | Is this a weapon? |
| `IsMagazine()` | EntityAI | Is this a magazine? |
| `IsClothing()` | EntityAI | Is this clothing? |
| `IsFood()` | EntityAI | Is this food? |
| `Class.CastTo(out, obj)` | Clase | Safe downcast (returns bool) |
| `ClassName.Cast(obj)` | Clase | Inline cast (returns null on failure) |

---

## Inventario

*Referencia completa: [Capítulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetInventory` | `GameInventory GetInventory()` | Get inventory component (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Create item in cargo |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Create item in cargo |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Create item as attachment |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | List all items |
| `CountInventory` | `int CountInventory()` | Count items |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Check for item |
| `AttachmentCount` | `int AttachmentCount()` | Number of attachments |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Get attachment by index |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Get attachment by slot |

---

## Creación y Eliminación de Entidades

*Referencia completa: [Capítulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Create entity |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Create with ECE flags |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Immediate server deletion |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Client-only deletion |
| `Delete` | `void obj.Delete()` | Deferred deletion (next frame) |

### Banderas ECE Comunes

| Bandera | Valor | Descripción |
|------|-------|-------------|
| `ECE_NONE` | `0` | No special behavior |
| `ECE_CREATEPHYSICS` | `1024` | Create collision |
| `ECE_INITAI` | `2048` | Initialize AI |
| `ECE_EQUIP` | `24576` | Spawn with attachments + cargo |
| `ECE_PLACE_ON_SURFACE` | combined | Physics + path + trace |
| `ECE_LOCAL` | `1073741824` | Client-only (not replicated) |
| `ECE_NOLIFETIME` | `4194304` | Will not despawn |
| `ECE_KEEPHEIGHT` | `524288` | Keep Y position |

---

## Métodos del Jugador

*Referencia completa: [Capítulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Player identity object |
| `GetIdentity().GetName()` | `string GetName()` | Steam/platform display name |
| `GetIdentity().GetId()` | `string GetId()` | BI unique ID |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | Steam64 ID |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | Session player ID |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Item in hands |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Vehicle being driven |
| `IsAlive` | `bool IsAlive()` | Alive check |
| `IsUnconscious` | `bool IsUnconscious()` | Unconscious check |
| `IsRestrained` | `bool IsRestrained()` | Restrained check |
| `IsInVehicle` | `bool IsInVehicle()` | In vehicle check |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Spawn in front of player |

---

## Métodos de Vehículos

*Referencia completa: [Capítulo 6.2: Sistema de Vehículos](02-vehicles.md)*

### Tripulación (Transport)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `CrewSize` | `int CrewSize()` | Total seat count |
| `CrewMember` | `Human CrewMember(int idx)` | Get human at seat |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Get seat of human |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Force eject from seat |
| `CrewDeath` | `void CrewDeath(int idx)` | Kill crew member |

### Motor (Car)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `EngineIsOn` | `bool EngineIsOn()` | Engine running? |
| `EngineStart` | `void EngineStart()` | Start engine |
| `EngineStop` | `void EngineStop()` | Stop engine |
| `EngineGetRPM` | `float EngineGetRPM()` | Current RPM |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | Redline RPM |
| `GetGear` | `int GetGear()` | Current gear |
| `GetSpeedometer` | `float GetSpeedometer()` | Speed in km/h |

### Fluidos (Car)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Max capacity |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Fill level 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Add fluid |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Remove fluid |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Drain all fluid |

**CarFluid enum:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Controles (Car)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = all |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Steering input |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 throttle |

---

## Métodos de Clima

*Referencia completa: [Capítulo 6.3: Sistema de Clima](03-weather.md)*

### Acceso

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Get weather singleton |

### Fenómenos (Weather)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Cloud cover |
| `GetRain` | `WeatherPhenomenon GetRain()` | Rain |
| `GetFog` | `WeatherPhenomenon GetFog()` | Fog |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Snow |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Wind speed |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Wind direction |
| `GetWind` | `vector GetWind()` | Wind direction vector |
| `GetWindSpeed` | `float GetWindSpeed()` | Wind speed m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Lightning config |

### WeatherPhenomenon

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetActual` | `float GetActual()` | Current interpolated value |
| `GetForecast` | `float GetForecast()` | Target value |
| `GetDuration` | `float GetDuration()` | Remaining duration (seconds) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Set target (server only) |
| `SetLimits` | `void SetLimits(float min, float max)` | Value range limits |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Change speed limits |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Magnitude change limits |

---

## Métodos de E/S de Archivos

*Referencia completa: [Capítulo 6.8: E/S de Archivos y JSON](08-file-io.md)*

### Prefijos de Ruta

| Prefijo | Ubicación | Escribible |
|--------|----------|----------|
| `$profile:` | Server/client profile directory | Yes |
| `$saves:` | Save directory | Yes |
| `$mission:` | Current mission folder | Read typically |
| `$CurrentDir:` | Working directory | Depends |

### Operaciones de Archivos

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `FileExist` | `bool FileExist(string path)` | Check if file exists |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Create directory |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Open file (0 = fail) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Close file |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Write text (no newline) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Write text + newline |
| `FGets` | `int FGets(FileHandle fh, string line)` | Read one line |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Read entire file |
| `DeleteFile` | `bool DeleteFile(string path)` | Delete file |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Copy file |

### JSON (JsonFileLoader)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | Load JSON into object (**returns void**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Save object as JSON |

### FileMode Enum

| Valor | Descripción |
|-------|-------------|
| `FileMode.READ` | Open for reading |
| `FileMode.WRITE` | Open for writing (creates/overwrites) |
| `FileMode.APPEND` | Open for appending |

---

## Métodos de Timer y CallQueue

*Referencia completa: [Capítulo 6.7: Timers y CallQueue](07-timers.md)*

### Acceso

| Expresión | Retorna | Descripción |
|------------|---------|-------------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Gameplay call queue |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | System call queue |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | GUI call queue |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Per-frame update queue |

### ScriptCallQueue

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Schedule delayed/repeating call |
| `Call` | `void Call(func fn, param1..4)` | Execute next frame |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Call method by string name |
| `Remove` | `void Remove(func fn)` | Cancel scheduled call |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Cancel by string name |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Get remaining time on CallLater |

### Timer Class

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Constructor |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Start timer |
| `Stop` | `void Stop()` | Stop timer |
| `Pause` | `void Pause()` | Pause timer |
| `Continue` | `void Continue()` | Resume timer |
| `IsPaused` | `bool IsPaused()` | Timer paused? |
| `IsRunning` | `bool IsRunning()` | Timer active? |
| `GetRemaining` | `float GetRemaining()` | Seconds remaining |

### ScriptInvoker

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Insert` | `void Insert(func fn)` | Register callback |
| `Remove` | `void Remove(func fn)` | Unregister callback |
| `Invoke` | `void Invoke(params...)` | Fire all callbacks |
| `Count` | `int Count()` | Number of registered callbacks |
| `Clear` | `void Clear()` | Remove all callbacks |

---

## Métodos de Creación de Widgets

*Referencia completa: [Capítulo 3.5: Creación Programática](../03-gui-system/05-programmatic-widgets.md)*

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Get UI workspace |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | Load .layout file |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Find child by name (recursive) |
| `Show` | `void Show(bool show)` | Show/hide widget |
| `SetText` | `void TextWidget.SetText(string text)` | Set text content |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Set image index |
| `SetColor` | `void SetColor(int color)` | Set widget color (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Set transparency 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Set widget size |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Set widget position |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Screen resolution |
| `Destroy` | `void Widget.Destroy()` | Remove and destroy widget |

### Ayudante de Color ARGB

| Función | Firma | Descripción |
|----------|-----------|-------------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Create color int (0-255 each) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Create color int (0.0-1.0 each) |

---

## Métodos de RPC / Red

*Referencia completa: [Capítulo 6.9: Red y RPC](09-networking.md)*

### Verificaciones de Entorno

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `GetGame().IsServer()` | `bool IsServer()` | True on server / listen-server host |
| `GetGame().IsClient()` | `bool IsClient()` | True on client |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | True in multiplayer |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | True only on dedicated server |

### ScriptRPC

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `ScriptRPC()` | `void ScriptRPC()` | Constructor |
| `Write` | `bool Write(void value)` | Serialize a value (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | Send RPC |
| `Reset` | `void Reset()` | Clear written data |

### Recibir (Override en Object)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | RPC receive handler |

### ParamsReadContext

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Read` | `bool Read(out void value)` | Deserialize a value (same types as Write) |

### Legacy RPC (CGame)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Send single Param object |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Send multiple Params |

### ScriptInputUserData (Input-Verified)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Check if queue has space |
| `Write` | `bool Write(void value)` | Serialize value |
| `Send` | `void Send()` | Send to server (client only) |

---

## Constantes y Métodos Matemáticos

*Referencia completa: [Capítulo 1.7: Matemáticas y Vectores](../01-enforce-script/07-math-vectors.md)*

### Constantes

| Constante | Valor | Descripción |
|----------|-------|-------------|
| `Math.PI` | `3.14159...` | Pi |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Degrees to radians multiplier |
| `Math.RAD2DEG` | `57.2957...` | Radians to degrees multiplier |
| `int.MAX` | `2147483647` | Maximum int |
| `int.MIN` | `-2147483648` | Minimum int |
| `float.MAX` | `3.4028e+38` | Maximum float |
| `float.MIN` | `1.175e-38` | Minimum positive float |

### Random

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Random int [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Random int [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Random float [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | Random true/false |

### Rounding

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Math.Round` | `float Round(float f)` | Round to nearest |
| `Math.Floor` | `float Floor(float f)` | Round down |
| `Math.Ceil` | `float Ceil(float f)` | Round up |

### Clamping & Interpolation

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Clamp to range |
| `Math.Min` | `float Min(float a, float b)` | Minimum of two |
| `Math.Max` | `float Max(float a, float b)` | Maximum of two |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Linear interpolation |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Inverse lerp |

### Absolute & Power

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Absolute value (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Absolute value (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Power |
| `Math.Sqrt` | `float Sqrt(float f)` | Square root |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Square (f * f) |

### Trigonometry (Radians)

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Math.Sin` | `float Sin(float rad)` | Sine |
| `Math.Cos` | `float Cos(float rad)` | Cosine |
| `Math.Tan` | `float Tan(float rad)` | Tangent |
| `Math.Asin` | `float Asin(float val)` | Arc sine |
| `Math.Acos` | `float Acos(float val)` | Arc cosine |
| `Math.Atan2` | `float Atan2(float y, float x)` | Angle from components |

### Smooth Damping

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Smooth damp toward target (like Unity's SmoothDamp) |

```c
// Smooth damping usage
// val: current value, target: target value, velocity: ref velocity (persisted between calls)
// smoothTime: smoothing time, maxSpeed: speed cap, dt: delta time
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Angle

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Wrap to 0-360 |

---

## Vector Methods

| Método | Firma | Descripción |
|--------|-----------|-------------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Distance between points |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Squared distance (faster) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Direction vector |
| `vector.Dot` | `float Dot(vector a, vector b)` | Dot product |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Interpolate positions |
| `v.Length()` | `float Length()` | Vector magnitude |
| `v.LengthSq()` | `float LengthSq()` | Squared magnitude (faster) |
| `v.Normalized()` | `vector Normalized()` | Unit vector |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Direction to yaw/pitch |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Yaw/pitch to direction |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Matrix multiply |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Inverse matrix multiply |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Create vector |

---

## Global Functions

| Función | Firma | Descripción |
|----------|-----------|-------------|
| `GetGame()` | `CGame GetGame()` | Game instance |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Local player (CLIENT only) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | All players (server) |
| `GetGame().GetWorld()` | `World GetWorld()` | World instance |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Server time (seconds) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | UI workspace |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Terrain height at position |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Surface material type |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Find objects near position |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Get screen resolution |
| `GetGame().IsServer()` | `bool IsServer()` | Server check |
| `GetGame().IsClient()` | `bool IsClient()` | Client check |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Multiplayer check |
| `Print(string)` | `void Print(string msg)` | Write to script log |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Log error with severity |
| `DumpStackString()` | `string DumpStackString()` | Get call stack as string |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | Format string (`%1`..`%9`) |

---

## Mission Hooks

*Referencia completa: [Chapter 6.11: Mission Hooks](11-mission-hooks.md)*

### Server-side (modded MissionServer)

| Método | Descripción |
|--------|-------------|
| `override void OnInit()` | Initialize managers, register RPCs |
| `override void OnMissionStart()` | After all mods loaded |
| `override void OnUpdate(float timeslice)` | Per-frame (use accumulator!) |
| `override void OnMissionFinish()` | Cleanup singletons, unsubscribe events |
| `override void OnEvent(EventType eventTypeId, Param params)` | Chat, voice events |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Player joined |
| `override void InvokeOnDisconnect(PlayerBase player)` | Player left |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Client ready for data |
| `override void PlayerRegistered(int peerId)` | Identity registered |

### Client-side (modded MissionGameplay)

| Método | Descripción |
|--------|-------------|
| `override void OnInit()` | Initialize client managers, create HUD |
| `override void OnUpdate(float timeslice)` | Per-frame client update |
| `override void OnMissionFinish()` | Cleanup |
| `override void OnKeyPress(int key)` | Key pressed |
| `override void OnKeyRelease(int key)` | Key released |

---

## Action System

*Referencia completa: [Chapter 6.12: Action System](12-action-system.md)*

### Register Actions on an Item

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Add custom action
    RemoveAction(ActionEat);       // Remove vanilla action
}
```

### ActionBase Key Methods

| Método | Descripción |
|--------|-------------|
| `override void CreateConditionComponents()` | Set CCINone/CCTNone distance conditions |
| `override bool ActionCondition(...)` | Custom validation logic |
| `override void OnExecuteServer(ActionData action_data)` | Server-side execution |
| `override void OnExecuteClient(ActionData action_data)` | Client-side effects |
| `override string GetText()` | Display name (supports `#STR_` keys) |

---

*Documentación completa: [Inicio](../README.md) | [Cheat Sheet](../cheatsheet.md) | [Entity System](01-entity-system.md) | [Vehicles](02-vehicles.md) | [Weather](03-weather.md) | [Timers](07-timers.md) | [File I/O](08-file-io.md) | [Networking](09-networking.md) | [Mission Hooks](11-mission-hooks.md) | [Action System](12-action-system.md)*
