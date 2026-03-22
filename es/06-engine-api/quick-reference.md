# Referencia Rapida de la API del Motor

> Referencia condensada en una sola pagina para los metodos mas utilizados del motor DayZ. Para explicaciones detalladas y ejemplos, consulta los capitulos completos vinculados en el encabezado de cada seccion.

---

## Tabla de Contenidos

- [Metodos de Entidad](#metodos-de-entidad)
- [Salud y Dano](#salud-y-dano)
- [Verificacion de Tipo](#verificacion-de-tipo)
- [Inventario](#inventario)
- [Creacion y Eliminacion de Entidades](#creacion-y-eliminacion-de-entidades)
- [Metodos del Jugador](#metodos-del-jugador)
- [Metodos de Vehiculo](#metodos-de-vehiculo)
- [Metodos de Clima](#metodos-de-clima)
- [Metodos de E/S de Archivo](#metodos-de-es-de-archivo)
- [Metodos de Timer y CallQueue](#metodos-de-timer-y-callqueue)
- [Metodos de Creacion de Widget](#metodos-de-creacion-de-widget)
- [Metodos de RPC / Red](#metodos-de-rpc--red)
- [Constantes y Metodos Matematicos](#constantes-y-metodos-matematicos)
- [Metodos de Vector](#metodos-de-vector)
- [Funciones Globales](#funciones-globales)
- [Hooks de Mission](#hooks-de-mission)
- [Sistema de Acciones](#sistema-de-acciones)

---

## Metodos de Entidad

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

### Posicion y Orientacion (Object)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetPosition` | `vector GetPosition()` | Posicion en el mundo |
| `SetPosition` | `void SetPosition(vector pos)` | Establecer posicion en el mundo |
| `GetOrientation` | `vector GetOrientation()` | Yaw, pitch, roll en grados |
| `SetOrientation` | `void SetOrientation(vector ori)` | Establecer yaw, pitch, roll |
| `GetDirection` | `vector GetDirection()` | Vector de direccion frontal |
| `SetDirection` | `void SetDirection(vector dir)` | Establecer direccion frontal |
| `GetScale` | `float GetScale()` | Escala actual |
| `SetScale` | `void SetScale(float scale)` | Establecer escala |

### Transformacion (IEntity)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetOrigin` | `vector GetOrigin()` | Posicion en el mundo (nivel del motor) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Establecer posicion en el mundo (nivel del motor) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Rotacion como yaw/pitch/roll |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Matriz de transformacion 4x3 completa |
| `SetTransform` | `void SetTransform(vector mat[4])` | Establecer transformacion completa |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Direccion local a mundo |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Punto local a mundo |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Direccion mundo a local |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Punto mundo a local |

### Jerarquia (IEntity)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Adjuntar hijo a un hueso |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Desadjuntar hijo |
| `GetParent` | `IEntity GetParent()` | Entidad padre o null |
| `GetChildren` | `IEntity GetChildren()` | Primera entidad hija |
| `GetSibling` | `IEntity GetSibling()` | Siguiente entidad hermana |

### Informacion de Visualizacion (Object)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetType` | `string GetType()` | Nombre de clase de config (ej: `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Nombre de visualizacion localizado |
| `IsKindOf` | `bool IsKindOf(string type)` | Verificar herencia de config |

### Posiciones de Hueso (Object)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Posicion del hueso en espacio local |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Posicion del hueso en espacio del modelo |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Posicion del hueso en espacio del mundo |

### Acceso a Configuracion (Object)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Leer bool de config |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Leer int de config |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Leer float de config |
| `ConfigGetString` | `string ConfigGetString(string entry)` | Leer string de config |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | Leer array de strings |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Verificar si existe entrada de config |

---

## Salud y Dano

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Obtener valor de salud |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Obtener salud maxima |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Establecer salud |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Establecer al maximo |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Agregar salud |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Reducir salud |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Habilitar/deshabilitar dano |
| `GetAllowDamage` | `bool GetAllowDamage()` | Verificar si el dano esta permitido |
| `IsAlive` | `bool IsAlive()` | Verificacion de vivo (usar en EntityAI) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Aplicar dano (EntityAI) |

**Pares comunes zona/tipo:** `("", "Health")` global, `("", "Blood")` sangre del jugador, `("", "Shock")` shock del jugador, `("Engine", "Health")` motor del vehiculo.

---

## Verificacion de Tipo

| Metodo | Clase | Descripcion |
|--------|-------|-------------|
| `IsMan()` | Object | Es un jugador? |
| `IsBuilding()` | Object | Es un edificio? |
| `IsTransport()` | Object | Es un vehiculo? |
| `IsDayZCreature()` | Object | Es una criatura (zombie/animal)? |
| `IsKindOf(string)` | Object | Verificacion de herencia de config |
| `IsItemBase()` | EntityAI | Es un item de inventario? |
| `IsWeapon()` | EntityAI | Es un arma? |
| `IsMagazine()` | EntityAI | Es un cargador? |
| `IsClothing()` | EntityAI | Es ropa? |
| `IsFood()` | EntityAI | Es comida? |
| `Class.CastTo(out, obj)` | Class | Downcast seguro (retorna bool) |
| `ClassName.Cast(obj)` | Class | Cast inline (retorna null en caso de fallo) |

---

## Inventario

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetInventory` | `GameInventory GetInventory()` | Obtener componente de inventario (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Crear item en cargo |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Crear item en cargo |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Crear item como accesorio |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Listar todos los items |
| `CountInventory` | `int CountInventory()` | Contar items |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Verificar item |
| `AttachmentCount` | `int AttachmentCount()` | Numero de accesorios |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Obtener accesorio por indice |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Obtener accesorio por slot |

---

## Creacion y Eliminacion de Entidades

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Crear entidad |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Crear con flags ECE |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Eliminacion inmediata en servidor |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Eliminacion solo en cliente |
| `Delete` | `void obj.Delete()` | Eliminacion diferida (siguiente frame) |

### Flags ECE Comunes

| Flag | Valor | Descripcion |
|------|-------|-------------|
| `ECE_NONE` | `0` | Sin comportamiento especial |
| `ECE_CREATEPHYSICS` | `1024` | Crear colision |
| `ECE_INITAI` | `2048` | Inicializar IA |
| `ECE_EQUIP` | `24576` | Spawnear con accesorios + cargo |
| `ECE_PLACE_ON_SURFACE` | combinado | Fisica + ruta + trace |
| `ECE_LOCAL` | `1073741824` | Solo cliente (no replicado) |
| `ECE_NOLIFETIME` | `4194304` | No se eliminara automaticamente |
| `ECE_KEEPHEIGHT` | `524288` | Mantener posicion Y |

---

## Metodos del Jugador

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Objeto de identidad del jugador |
| `GetIdentity().GetName()` | `string GetName()` | Nombre de visualizacion Steam/plataforma |
| `GetIdentity().GetId()` | `string GetId()` | ID unico BI |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | ID Steam64 |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | ID del jugador en la sesion |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Item en las manos |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Vehiculo siendo conducido |
| `IsAlive` | `bool IsAlive()` | Verificacion de vivo |
| `IsUnconscious` | `bool IsUnconscious()` | Verificacion de inconsciente |
| `IsRestrained` | `bool IsRestrained()` | Verificacion de restringido |
| `IsInVehicle` | `bool IsInVehicle()` | Verificacion de dentro de vehiculo |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Spawnear frente al jugador |

---

## Metodos de Vehiculo

*Referencia completa: [Capitulo 6.2: Sistema de Vehiculos](02-vehicles.md)*

### Tripulacion (Transport)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `CrewSize` | `int CrewSize()` | Total de asientos |
| `CrewMember` | `Human CrewMember(int idx)` | Obtener humano en asiento |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Obtener asiento del humano |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Forzar eyeccion del asiento |
| `CrewDeath` | `void CrewDeath(int idx)` | Matar miembro de la tripulacion |

### Motor (Car)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `EngineIsOn` | `bool EngineIsOn()` | Motor encendido? |
| `EngineStart` | `void EngineStart()` | Encender motor |
| `EngineStop` | `void EngineStop()` | Apagar motor |
| `EngineGetRPM` | `float EngineGetRPM()` | RPM actual |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | RPM de redline |
| `GetGear` | `int GetGear()` | Marcha actual |
| `GetSpeedometer` | `float GetSpeedometer()` | Velocidad en km/h |

### Fluidos (Car)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Capacidad maxima |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Nivel de llenado 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Agregar fluido |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Remover fluido |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Drenar todo el fluido |

**Enum CarFluid:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Controles (Car)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = todos |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Entrada de direccion |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 acelerador |

---

## Metodos de Clima

*Referencia completa: [Capitulo 6.3: Sistema de Clima](03-weather.md)*

### Acceso

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Obtener singleton de clima |

### Fenomenos (Weather)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Cobertura de nubes |
| `GetRain` | `WeatherPhenomenon GetRain()` | Lluvia |
| `GetFog` | `WeatherPhenomenon GetFog()` | Niebla |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Nieve |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Velocidad del viento |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Direccion del viento |
| `GetWind` | `vector GetWind()` | Vector de direccion del viento |
| `GetWindSpeed` | `float GetWindSpeed()` | Velocidad del viento m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Configuracion de relampagos |

### WeatherPhenomenon

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetActual` | `float GetActual()` | Valor interpolado actual |
| `GetForecast` | `float GetForecast()` | Valor objetivo |
| `GetDuration` | `float GetDuration()` | Duracion restante (segundos) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Establecer objetivo (solo servidor) |
| `SetLimits` | `void SetLimits(float min, float max)` | Limites de rango de valor |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Limites de velocidad de cambio |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Limites de magnitud de cambio |

---

## Metodos de E/S de Archivo

*Referencia completa: [Capitulo 6.8: E/S de Archivo y JSON](08-file-io.md)*

### Prefijos de Ruta

| Prefijo | Ubicacion | Escritura |
|---------|-----------|-----------|
| `$profile:` | Directorio de perfil del servidor/cliente | Si |
| `$saves:` | Directorio de guardados | Si |
| `$mission:` | Carpeta de la mision actual | Generalmente lectura |
| `$CurrentDir:` | Directorio de trabajo | Depende |

### Operaciones de Archivo

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `FileExist` | `bool FileExist(string path)` | Verificar si el archivo existe |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Crear directorio |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Abrir archivo (0 = fallo) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Cerrar archivo |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Escribir texto (sin salto de linea) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Escribir texto + salto de linea |
| `FGets` | `int FGets(FileHandle fh, string line)` | Leer una linea |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Leer archivo completo |
| `DeleteFile` | `bool DeleteFile(string path)` | Eliminar archivo |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Copiar archivo |

### JSON (JsonFileLoader)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | Cargar JSON en objeto (**retorna void**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Guardar objeto como JSON |

### Enum FileMode

| Valor | Descripcion |
|-------|-------------|
| `FileMode.READ` | Abrir para lectura |
| `FileMode.WRITE` | Abrir para escritura (crea/sobrescribe) |
| `FileMode.APPEND` | Abrir para agregar al final |

---

## Metodos de Timer y CallQueue

*Referencia completa: [Capitulo 6.7: Timers y CallQueue](07-timers.md)*

### Acceso

| Expresion | Retorna | Descripcion |
|-----------|---------|-------------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Cola de llamadas de gameplay |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | Cola de llamadas de sistema |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | Cola de llamadas de GUI |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Cola de actualizacion por frame |

### ScriptCallQueue

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Programar llamada retrasada/repetida |
| `Call` | `void Call(func fn, param1..4)` | Ejecutar en el siguiente frame |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Llamar metodo por nombre de string |
| `Remove` | `void Remove(func fn)` | Cancelar llamada programada |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Cancelar por nombre de string |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Obtener tiempo restante del CallLater |

### Clase Timer

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Constructor |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Iniciar timer |
| `Stop` | `void Stop()` | Detener timer |
| `Pause` | `void Pause()` | Pausar timer |
| `Continue` | `void Continue()` | Reanudar timer |
| `IsPaused` | `bool IsPaused()` | Timer pausado? |
| `IsRunning` | `bool IsRunning()` | Timer activo? |
| `GetRemaining` | `float GetRemaining()` | Segundos restantes |

### ScriptInvoker

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Insert` | `void Insert(func fn)` | Registrar callback |
| `Remove` | `void Remove(func fn)` | Eliminar callback |
| `Invoke` | `void Invoke(params...)` | Disparar todos los callbacks |
| `Count` | `int Count()` | Numero de callbacks registrados |
| `Clear` | `void Clear()` | Eliminar todos los callbacks |

---

## Metodos de Creacion de Widget

*Referencia completa: [Capitulo 3.5: Creacion Programatica](../03-gui-system/05-programmatic-widgets.md)*

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Obtener workspace de UI |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | Cargar archivo .layout |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Buscar hijo por nombre (recursivo) |
| `Show` | `void Show(bool show)` | Mostrar/ocultar widget |
| `SetText` | `void TextWidget.SetText(string text)` | Establecer contenido de texto |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Establecer indice de imagen |
| `SetColor` | `void SetColor(int color)` | Establecer color del widget (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Establecer transparencia 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Establecer tamano del widget |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Establecer posicion del widget |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Resolucion de pantalla |
| `Destroy` | `void Widget.Destroy()` | Eliminar y destruir widget |

### Auxiliar de Color ARGB

| Funcion | Firma | Descripcion |
|---------|-------|-------------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Crear int de color (0-255 cada uno) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Crear int de color (0.0-1.0 cada uno) |

---

## Metodos de RPC / Red

*Referencia completa: [Capitulo 6.9: Red y RPC](09-networking.md)*

### Verificaciones de Entorno

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `GetGame().IsServer()` | `bool IsServer()` | Verdadero en servidor / host listen-server |
| `GetGame().IsClient()` | `bool IsClient()` | Verdadero en cliente |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Verdadero en multijugador |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | Verdadero solo en servidor dedicado |

### ScriptRPC

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `ScriptRPC()` | `void ScriptRPC()` | Constructor |
| `Write` | `bool Write(void value)` | Serializar un valor (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | Enviar RPC |
| `Reset` | `void Reset()` | Limpiar datos escritos |

### Recepcion (Override en Object)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | Handler de recepcion de RPC |

### ParamsReadContext

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Read` | `bool Read(out void value)` | Deserializar un valor (mismos tipos que Write) |

### RPC Legado (CGame)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Enviar un unico objeto Param |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Enviar multiples Params |

### ScriptInputUserData (Verificado por Entrada)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Verificar si la cola tiene espacio |
| `Write` | `bool Write(void value)` | Serializar valor |
| `Send` | `void Send()` | Enviar al servidor (solo cliente) |

---

## Constantes y Metodos Matematicos

*Referencia completa: [Capitulo 1.7: Matematicas y Vectores](../01-enforce-script/07-math-vectors.md)*

### Constantes

| Constante | Valor | Descripcion |
|-----------|-------|-------------|
| `Math.PI` | `3.14159...` | Pi |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Multiplicador de grados a radianes |
| `Math.RAD2DEG` | `57.2957...` | Multiplicador de radianes a grados |
| `int.MAX` | `2147483647` | Int maximo |
| `int.MIN` | `-2147483648` | Int minimo |
| `float.MAX` | `3.4028e+38` | Float maximo |
| `float.MIN` | `1.175e-38` | Float positivo minimo |

### Aleatorio

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Int aleatorio [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Int aleatorio [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Float aleatorio [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | Verdadero/falso aleatorio |

### Redondeo

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Math.Round` | `float Round(float f)` | Redondear al mas cercano |
| `Math.Floor` | `float Floor(float f)` | Redondear hacia abajo |
| `Math.Ceil` | `float Ceil(float f)` | Redondear hacia arriba |

### Limitacion e Interpolacion

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Limitar a un rango |
| `Math.Min` | `float Min(float a, float b)` | Minimo entre dos |
| `Math.Max` | `float Max(float a, float b)` | Maximo entre dos |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Interpolacion lineal |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Interpolacion lineal inversa |

### Absoluto y Potencia

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Valor absoluto (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Valor absoluto (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Potencia |
| `Math.Sqrt` | `float Sqrt(float f)` | Raiz cuadrada |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Cuadrado (f * f) |

### Trigonometria (Radianes)

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Math.Sin` | `float Sin(float rad)` | Seno |
| `Math.Cos` | `float Cos(float rad)` | Coseno |
| `Math.Tan` | `float Tan(float rad)` | Tangente |
| `Math.Asin` | `float Asin(float val)` | Arco seno |
| `Math.Acos` | `float Acos(float val)` | Arco coseno |
| `Math.Atan2` | `float Atan2(float y, float x)` | Angulo a partir de componentes |

### Amortiguacion Suave

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Amortiguacion suave hacia el objetivo (como SmoothDamp de Unity) |

```c
// Uso de amortiguacion suave
// val: valor actual, target: valor objetivo, velocity: velocidad ref (persistida entre llamadas)
// smoothTime: tiempo de suavizado, maxSpeed: limite de velocidad, dt: delta time
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Angulo

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Ajustar a 0-360 |

---

## Metodos de Vector

| Metodo | Firma | Descripcion |
|--------|-------|-------------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Distancia entre puntos |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Distancia al cuadrado (mas rapido) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Vector de direccion |
| `vector.Dot` | `float Dot(vector a, vector b)` | Producto escalar |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Interpolar posiciones |
| `v.Length()` | `float Length()` | Magnitud del vector |
| `v.LengthSq()` | `float LengthSq()` | Magnitud al cuadrado (mas rapido) |
| `v.Normalized()` | `vector Normalized()` | Vector unitario |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Direccion a yaw/pitch |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Yaw/pitch a direccion |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Multiplicacion por matriz |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Multiplicacion inversa por matriz |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Crear vector |

---

## Funciones Globales

| Funcion | Firma | Descripcion |
|---------|-------|-------------|
| `GetGame()` | `CGame GetGame()` | Instancia del juego |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Jugador local (solo CLIENTE) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Todos los jugadores (servidor) |
| `GetGame().GetWorld()` | `World GetWorld()` | Instancia del mundo |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Tiempo del servidor (segundos) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Workspace de UI |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Altura del terreno en posicion |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Tipo de material de la superficie |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Buscar objetos cerca de posicion |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Obtener resolucion de pantalla |
| `GetGame().IsServer()` | `bool IsServer()` | Verificacion de servidor |
| `GetGame().IsClient()` | `bool IsClient()` | Verificacion de cliente |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Verificacion de multijugador |
| `Print(string)` | `void Print(string msg)` | Escribir en log de scripts |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Registrar error con severidad |
| `DumpStackString()` | `string DumpStackString()` | Obtener pila de llamadas como string |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | Formatear string (`%1`..`%9`) |

---

## Hooks de Mission

*Referencia completa: [Capitulo 6.11: Hooks de Mission](11-mission-hooks.md)*

### Lado del Servidor (modded MissionServer)

| Metodo | Descripcion |
|--------|-------------|
| `override void OnInit()` | Inicializar managers, registrar RPCs |
| `override void OnMissionStart()` | Despues de que todos los mods esten cargados |
| `override void OnUpdate(float timeslice)` | Por frame (usa acumulador!) |
| `override void OnMissionFinish()` | Limpiar singletons, cancelar suscripciones de eventos |
| `override void OnEvent(EventType eventTypeId, Param params)` | Eventos de chat, voz |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Jugador se unio |
| `override void InvokeOnDisconnect(PlayerBase player)` | Jugador se fue |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Cliente listo para datos |
| `override void PlayerRegistered(int peerId)` | Identidad registrada |

### Lado del Cliente (modded MissionGameplay)

| Metodo | Descripcion |
|--------|-------------|
| `override void OnInit()` | Inicializar managers del cliente, crear HUD |
| `override void OnUpdate(float timeslice)` | Actualizacion por frame del cliente |
| `override void OnMissionFinish()` | Limpieza |
| `override void OnKeyPress(int key)` | Tecla presionada |
| `override void OnKeyRelease(int key)` | Tecla soltada |

---

## Sistema de Acciones

*Referencia completa: [Capitulo 6.12: Sistema de Acciones](12-action-system.md)*

### Registrar Acciones en un Item

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Agregar accion personalizada
    RemoveAction(ActionEat);       // Remover accion vanilla
}
```

### Metodos Principales de ActionBase

| Metodo | Descripcion |
|--------|-------------|
| `override void CreateConditionComponents()` | Establecer condiciones de distancia CCINone/CCTNone |
| `override bool ActionCondition(...)` | Logica de validacion personalizada |
| `override void OnExecuteServer(ActionData action_data)` | Ejecucion en el lado del servidor |
| `override void OnExecuteClient(ActionData action_data)` | Efectos en el lado del cliente |
| `override string GetText()` | Nombre de visualizacion (soporta claves `#STR_`) |

---

*Documentacion completa: [Inicio](../../README.md) | [Hoja de Referencia](../cheatsheet.md) | [Sistema de Entidades](01-entity-system.md) | [Vehiculos](02-vehicles.md) | [Clima](03-weather.md) | [Timers](07-timers.md) | [E/S de Archivo](08-file-io.md) | [Red](09-networking.md) | [Hooks de Mission](11-mission-hooks.md) | [Sistema de Acciones](12-action-system.md)*
