# Engine API Quick Reference

[Home](../README.md) | **Engine API Quick Reference**

---

## Indice dei Contenuti

- [Metodi delle Entita'](#metodi-delle-entita)
- [Salute e Danni](#salute-e-danni)
- [Controllo del Tipo](#controllo-del-tipo)
- [Inventario](#inventario)
- [Creazione e Cancellazione di Entita'](#creazione-e-cancellazione-di-entita)
- [Metodi del Giocatore](#metodi-del-giocatore)
- [Metodi dei Veicoli](#metodi-dei-veicoli)
- [Metodi Meteo](#metodi-meteo)
- [Metodi I/O su File](#metodi-io-su-file)
- [Metodi Timer e CallQueue](#metodi-timer-e-callqueue)
- [Metodi di Creazione Widget](#metodi-di-creazione-widget)
- [Metodi RPC / Networking](#metodi-rpc--networking)
- [Costanti e Metodi Matematici](#costanti-e-metodi-matematici)
- [Metodi Vettoriali](#metodi-vettoriali)
- [Funzioni Globali](#funzioni-globali)
- [Hook della Missione](#hook-della-missione)
- [Sistema delle Azioni](#sistema-delle-azioni)

---

## Metodi delle Entita'

*Riferimento completo: [Capitolo 6.1: Sistema delle Entita'](01-entity-system.md)*

### Posizione e Orientamento (Object)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetPosition` | `vector GetPosition()` | Posizione nel mondo |
| `SetPosition` | `void SetPosition(vector pos)` | Imposta la posizione nel mondo |
| `GetOrientation` | `vector GetOrientation()` | Yaw, pitch, roll in gradi |
| `SetOrientation` | `void SetOrientation(vector ori)` | Imposta yaw, pitch, roll |
| `GetDirection` | `vector GetDirection()` | Vettore direzione avanti |
| `SetDirection` | `void SetDirection(vector dir)` | Imposta la direzione avanti |
| `GetScale` | `float GetScale()` | Scala corrente |
| `SetScale` | `void SetScale(float scale)` | Imposta la scala |

### Trasformazione (IEntity)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetOrigin` | `vector GetOrigin()` | Posizione nel mondo (livello motore) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Imposta la posizione nel mondo (livello motore) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Rotazione come yaw/pitch/roll |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Matrice di trasformazione completa 4x3 |
| `SetTransform` | `void SetTransform(vector mat[4])` | Imposta la trasformazione completa |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Direzione locale verso mondo |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Punto locale verso mondo |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Direzione mondo verso locale |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Punto mondo verso locale |

### Gerarchia (IEntity)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Collega un figlio a un bone |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Scollega un figlio |
| `GetParent` | `IEntity GetParent()` | Entita' genitore o null |
| `GetChildren` | `IEntity GetChildren()` | Prima entita' figlia |
| `GetSibling` | `IEntity GetSibling()` | Prossima entita' sorella |

### Info di Visualizzazione (Object)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetType` | `string GetType()` | Nome della classe config (es. `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Nome visualizzato localizzato |
| `IsKindOf` | `bool IsKindOf(string type)` | Controlla l'ereditarieta' config |

### Posizioni dei Bone (Object)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Posizione del bone nello spazio locale |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Posizione del bone nello spazio modello |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Posizione del bone nello spazio mondo |

### Accesso alla Config (Object)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Legge un bool dalla config |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Legge un int dalla config |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Legge un float dalla config |
| `ConfigGetString` | `string ConfigGetString(string entry)` | Legge una stringa dalla config |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | Legge un array di stringhe |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Controlla se esiste una voce config |

---

## Salute e Danni

*Riferimento completo: [Capitolo 6.1: Sistema delle Entita'](01-entity-system.md)*

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Ottieni il valore di salute |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Ottieni la salute massima |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Imposta la salute |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Imposta al massimo |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Aggiungi salute |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Riduci la salute |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Abilita/disabilita i danni |
| `GetAllowDamage` | `bool GetAllowDamage()` | Controlla se i danni sono abilitati |
| `IsAlive` | `bool IsAlive()` | Controlla se vivo (usare su EntityAI) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Applica danno (EntityAI) |

**Coppie zona/tipo comuni:** `("", "Health")` globale, `("", "Blood")` sangue del giocatore, `("", "Shock")` shock del giocatore, `("Engine", "Health")` motore del veicolo.

---

## Controllo del Tipo

| Metodo | Classe | Descrizione |
|--------|--------|-------------|
| `IsMan()` | Object | E' un giocatore? |
| `IsBuilding()` | Object | E' un edificio? |
| `IsTransport()` | Object | E' un veicolo? |
| `IsDayZCreature()` | Object | E' una creatura (zombie/animale)? |
| `IsKindOf(string)` | Object | Controllo ereditarieta' config |
| `IsItemBase()` | EntityAI | E' un oggetto dell'inventario? |
| `IsWeapon()` | EntityAI | E' un'arma? |
| `IsMagazine()` | EntityAI | E' un caricatore? |
| `IsClothing()` | EntityAI | E' un indumento? |
| `IsFood()` | EntityAI | E' cibo? |
| `Class.CastTo(out, obj)` | Class | Downcast sicuro (restituisce bool) |
| `ClassName.Cast(obj)` | Class | Cast inline (restituisce null in caso di fallimento) |

---

## Inventario

*Riferimento completo: [Capitolo 6.1: Sistema delle Entita'](01-entity-system.md)*

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetInventory` | `GameInventory GetInventory()` | Ottieni il componente inventario (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Crea un oggetto nel cargo |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Crea un oggetto nel cargo |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Crea un oggetto come accessorio |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Elenca tutti gli oggetti |
| `CountInventory` | `int CountInventory()` | Conta gli oggetti |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Controlla la presenza di un oggetto |
| `AttachmentCount` | `int AttachmentCount()` | Numero di accessori |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Ottieni accessorio per indice |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Ottieni accessorio per slot |

---

## Creazione e Cancellazione di Entita'

*Riferimento completo: [Capitolo 6.1: Sistema delle Entita'](01-entity-system.md)*

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Crea un'entita' |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Crea con flag ECE |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Cancellazione immediata lato server |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Cancellazione solo lato client |
| `Delete` | `void obj.Delete()` | Cancellazione differita (frame successivo) |

### Flag ECE Comuni

| Flag | Valore | Descrizione |
|------|--------|-------------|
| `ECE_NONE` | `0` | Nessun comportamento speciale |
| `ECE_CREATEPHYSICS` | `1024` | Crea collisione |
| `ECE_INITAI` | `2048` | Inizializza l'AI |
| `ECE_EQUIP` | `24576` | Genera con accessori + cargo |
| `ECE_PLACE_ON_SURFACE` | combinato | Fisica + percorso + traccia |
| `ECE_LOCAL` | `1073741824` | Solo client (non replicato) |
| `ECE_NOLIFETIME` | `4194304` | Non scomparira' |
| `ECE_KEEPHEIGHT` | `524288` | Mantieni la posizione Y |

---

## Metodi del Giocatore

*Riferimento completo: [Capitolo 6.1: Sistema delle Entita'](01-entity-system.md)*

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Oggetto identita' del giocatore |
| `GetIdentity().GetName()` | `string GetName()` | Nome visualizzato Steam/piattaforma |
| `GetIdentity().GetId()` | `string GetId()` | ID univoco BI |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | ID Steam64 |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | ID giocatore della sessione |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Oggetto in mano |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Veicolo guidato |
| `IsAlive` | `bool IsAlive()` | Controllo se vivo |
| `IsUnconscious` | `bool IsUnconscious()` | Controllo se incosciente |
| `IsRestrained` | `bool IsRestrained()` | Controllo se ammanettato |
| `IsInVehicle` | `bool IsInVehicle()` | Controllo se in un veicolo |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Genera davanti al giocatore |

---

## Metodi dei Veicoli

*Riferimento completo: [Capitolo 6.2: Sistema dei Veicoli](02-vehicles.md)*

### Equipaggio (Transport)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `CrewSize` | `int CrewSize()` | Numero totale di posti |
| `CrewMember` | `Human CrewMember(int idx)` | Ottieni l'umano al posto |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Ottieni il posto dell'umano |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Espelli forzatamente dal posto |
| `CrewDeath` | `void CrewDeath(int idx)` | Uccidi il membro dell'equipaggio |

### Motore (Car)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `EngineIsOn` | `bool EngineIsOn()` | Motore acceso? |
| `EngineStart` | `void EngineStart()` | Avvia il motore |
| `EngineStop` | `void EngineStop()` | Spegni il motore |
| `EngineGetRPM` | `float EngineGetRPM()` | RPM attuali |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | RPM fuorigiri |
| `GetGear` | `int GetGear()` | Marcia attuale |
| `GetSpeedometer` | `float GetSpeedometer()` | Velocita' in km/h |

### Fluidi (Car)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Capacita' massima |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Livello di riempimento 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Aggiungi fluido |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Rimuovi fluido |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Scarica tutto il fluido |

**Enum CarFluid:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Controlli (Car)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = tutte |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Input dello sterzo |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 acceleratore |

---

## Metodi Meteo

*Riferimento completo: [Capitolo 6.3: Sistema Meteo](03-weather.md)*

### Accesso

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Ottieni il singleton meteo |

### Fenomeni (Weather)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Copertura nuvolosa |
| `GetRain` | `WeatherPhenomenon GetRain()` | Pioggia |
| `GetFog` | `WeatherPhenomenon GetFog()` | Nebbia |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Neve |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Velocita' del vento |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Direzione del vento |
| `GetWind` | `vector GetWind()` | Vettore direzione del vento |
| `GetWindSpeed` | `float GetWindSpeed()` | Velocita' del vento m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Configurazione fulmini |

### WeatherPhenomenon

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetActual` | `float GetActual()` | Valore interpolato attuale |
| `GetForecast` | `float GetForecast()` | Valore obiettivo |
| `GetDuration` | `float GetDuration()` | Durata rimanente (secondi) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Imposta obiettivo (solo server) |
| `SetLimits` | `void SetLimits(float min, float max)` | Limiti dell'intervallo di valori |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Limiti della velocita' di cambiamento |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Limiti della grandezza del cambiamento |

---

## Metodi I/O su File

*Riferimento completo: [Capitolo 6.8: I/O su File e JSON](08-file-io.md)*

### Prefissi dei Percorsi

| Prefisso | Posizione | Scrivibile |
|----------|-----------|------------|
| `$profile:` | Directory profilo server/client | Si' |
| `$saves:` | Directory dei salvataggi | Si' |
| `$mission:` | Cartella della missione corrente | Tipicamente in lettura |
| `$CurrentDir:` | Directory di lavoro | Dipende |

### Operazioni sui File

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `FileExist` | `bool FileExist(string path)` | Controlla se il file esiste |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Crea una directory |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Apri un file (0 = fallimento) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Chiudi un file |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Scrivi testo (senza a capo) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Scrivi testo + a capo |
| `FGets` | `int FGets(FileHandle fh, string line)` | Leggi una riga |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Leggi l'intero file |
| `DeleteFile` | `bool DeleteFile(string path)` | Cancella un file |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Copia un file |

### JSON (JsonFileLoader)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | Carica JSON in un oggetto (**restituisce void**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Salva un oggetto come JSON |

### Enum FileMode

| Valore | Descrizione |
|--------|-------------|
| `FileMode.READ` | Apri in lettura |
| `FileMode.WRITE` | Apri in scrittura (crea/sovrascrive) |
| `FileMode.APPEND` | Apri in aggiunta |

---

## Metodi Timer e CallQueue

*Riferimento completo: [Capitolo 6.7: Timer e CallQueue](07-timers.md)*

### Accesso

| Espressione | Restituisce | Descrizione |
|-------------|-------------|-------------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Coda di chiamate gameplay |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | Coda di chiamate di sistema |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | Coda di chiamate GUI |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Coda di aggiornamento per frame |

### ScriptCallQueue

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Pianifica una chiamata differita/ripetuta |
| `Call` | `void Call(func fn, param1..4)` | Esegui al frame successivo |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Chiama un metodo per nome stringa |
| `Remove` | `void Remove(func fn)` | Annulla una chiamata pianificata |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Annulla per nome stringa |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Ottieni il tempo rimanente su CallLater |

### Classe Timer

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Costruttore |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Avvia il timer |
| `Stop` | `void Stop()` | Ferma il timer |
| `Pause` | `void Pause()` | Metti in pausa il timer |
| `Continue` | `void Continue()` | Riprendi il timer |
| `IsPaused` | `bool IsPaused()` | Timer in pausa? |
| `IsRunning` | `bool IsRunning()` | Timer attivo? |
| `GetRemaining` | `float GetRemaining()` | Secondi rimanenti |

### ScriptInvoker

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Insert` | `void Insert(func fn)` | Registra callback |
| `Remove` | `void Remove(func fn)` | Annulla registrazione callback |
| `Invoke` | `void Invoke(params...)` | Attiva tutti i callback |
| `Count` | `int Count()` | Numero di callback registrati |
| `Clear` | `void Clear()` | Rimuovi tutti i callback |

---

## Metodi di Creazione Widget

*Riferimento completo: [Capitolo 3.5: Creazione Programmatica](../03-gui-system/05-programmatic-widgets.md)*

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Ottieni lo spazio di lavoro UI |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | Carica un file .layout |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Trova un figlio per nome (ricorsivo) |
| `Show` | `void Show(bool show)` | Mostra/nascondi widget |
| `SetText` | `void TextWidget.SetText(string text)` | Imposta il contenuto del testo |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Imposta l'indice dell'immagine |
| `SetColor` | `void SetColor(int color)` | Imposta il colore del widget (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Imposta la trasparenza 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Imposta la dimensione del widget |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Imposta la posizione del widget |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Risoluzione dello schermo |
| `Destroy` | `void Widget.Destroy()` | Rimuovi e distruggi il widget |

### Helper Colore ARGB

| Funzione | Firma | Descrizione |
|----------|-------|-------------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Crea un intero colore (0-255 ciascuno) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Crea un intero colore (0.0-1.0 ciascuno) |

---

## Metodi RPC / Networking

*Riferimento completo: [Capitolo 6.9: Networking e RPC](09-networking.md)*

### Controlli dell'Ambiente

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `GetGame().IsServer()` | `bool IsServer()` | True sul server / host listen-server |
| `GetGame().IsClient()` | `bool IsClient()` | True sul client |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | True in multiplayer |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | True solo su server dedicato |

### ScriptRPC

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `ScriptRPC()` | `void ScriptRPC()` | Costruttore |
| `Write` | `bool Write(void value)` | Serializza un valore (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | Invia RPC |
| `Reset` | `void Reset()` | Cancella i dati scritti |

### Ricezione (Override su Object)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | Gestore di ricezione RPC |

### ParamsReadContext

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Read` | `bool Read(out void value)` | Deserializza un valore (stessi tipi di Write) |

### RPC Legacy (CGame)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Invia un singolo oggetto Param |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Invia piu' Param |

### ScriptInputUserData (Verificato dall'Input)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Controlla se la coda ha spazio |
| `Write` | `bool Write(void value)` | Serializza un valore |
| `Send` | `void Send()` | Invia al server (solo client) |

---

## Costanti e Metodi Matematici

*Riferimento completo: [Capitolo 1.7: Matematica e Vettori](../01-enforce-script/07-math-vectors.md)*

### Costanti

| Costante | Valore | Descrizione |
|----------|--------|-------------|
| `Math.PI` | `3.14159...` | Pi greco |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Moltiplicatore gradi a radianti |
| `Math.RAD2DEG` | `57.2957...` | Moltiplicatore radianti a gradi |
| `int.MAX` | `2147483647` | Intero massimo |
| `int.MIN` | `-2147483648` | Intero minimo |
| `float.MAX` | `3.4028e+38` | Float massimo |
| `float.MIN` | `1.175e-38` | Float positivo minimo |

### Casualita'

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Intero casuale [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Intero casuale [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Float casuale [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | True/false casuale |

### Arrotondamento

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Math.Round` | `float Round(float f)` | Arrotonda al piu' vicino |
| `Math.Floor` | `float Floor(float f)` | Arrotonda per difetto |
| `Math.Ceil` | `float Ceil(float f)` | Arrotonda per eccesso |

### Limitazione e Interpolazione

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Limita all'intervallo |
| `Math.Min` | `float Min(float a, float b)` | Minimo di due |
| `Math.Max` | `float Max(float a, float b)` | Massimo di due |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Interpolazione lineare |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Interpolazione lineare inversa |

### Valore Assoluto e Potenza

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Valore assoluto (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Valore assoluto (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Potenza |
| `Math.Sqrt` | `float Sqrt(float f)` | Radice quadrata |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Quadrato (f * f) |

### Trigonometria (Radianti)

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Math.Sin` | `float Sin(float rad)` | Seno |
| `Math.Cos` | `float Cos(float rad)` | Coseno |
| `Math.Tan` | `float Tan(float rad)` | Tangente |
| `Math.Asin` | `float Asin(float val)` | Arcoseno |
| `Math.Acos` | `float Acos(float val)` | Arcocoseno |
| `Math.Atan2` | `float Atan2(float y, float x)` | Angolo dai componenti |

### Smorzamento Morbido

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Smorzamento morbido verso il target (come SmoothDamp di Unity) |

```c
// Utilizzo dello smorzamento morbido
// val: valore corrente, target: valore obiettivo, velocity: velocita' ref (persistita tra le chiamate)
// smoothTime: tempo di smorzamento, maxSpeed: limite velocita', dt: delta time
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Angolo

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Normalizza a 0-360 |

---

## Metodi Vettoriali

| Metodo | Firma | Descrizione |
|--------|-------|-------------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Distanza tra punti |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Distanza al quadrato (piu' veloce) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Vettore direzione |
| `vector.Dot` | `float Dot(vector a, vector b)` | Prodotto scalare |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Interpola posizioni |
| `v.Length()` | `float Length()` | Magnitudine del vettore |
| `v.LengthSq()` | `float LengthSq()` | Magnitudine al quadrato (piu' veloce) |
| `v.Normalized()` | `vector Normalized()` | Vettore unitario |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Direzione a yaw/pitch |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Yaw/pitch a direzione |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Moltiplicazione per matrice |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Moltiplicazione inversa per matrice |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Crea un vettore |

---

## Funzioni Globali

| Funzione | Firma | Descrizione |
|----------|-------|-------------|
| `GetGame()` | `CGame GetGame()` | Istanza del gioco |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Giocatore locale (solo CLIENT) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Tutti i giocatori (server) |
| `GetGame().GetWorld()` | `World GetWorld()` | Istanza del mondo |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Tempo del server (secondi) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Spazio di lavoro UI |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Altezza del terreno alla posizione |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Tipo di materiale della superficie |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Trova oggetti vicino alla posizione |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Ottieni la risoluzione dello schermo |
| `GetGame().IsServer()` | `bool IsServer()` | Controllo server |
| `GetGame().IsClient()` | `bool IsClient()` | Controllo client |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Controllo multiplayer |
| `Print(string)` | `void Print(string msg)` | Scrivi nel log degli script |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Registra errore con gravita' |
| `DumpStackString()` | `string DumpStackString()` | Ottieni lo stack delle chiamate come stringa |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | Formatta stringa (`%1`..`%9`) |

---

## Hook della Missione

*Riferimento completo: [Capitolo 6.11: Hook della Missione](11-mission-hooks.md)*

### Lato Server (modded MissionServer)

| Metodo | Descrizione |
|--------|-------------|
| `override void OnInit()` | Inizializza i manager, registra gli RPC |
| `override void OnMissionStart()` | Dopo che tutti i mod sono caricati |
| `override void OnUpdate(float timeslice)` | Per-frame (usa un accumulatore!) |
| `override void OnMissionFinish()` | Pulisci i singleton, annulla la sottoscrizione agli eventi |
| `override void OnEvent(EventType eventTypeId, Param params)` | Eventi chat, voce |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Giocatore connesso |
| `override void InvokeOnDisconnect(PlayerBase player)` | Giocatore disconnesso |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Client pronto per i dati |
| `override void PlayerRegistered(int peerId)` | Identita' registrata |

### Lato Client (modded MissionGameplay)

| Metodo | Descrizione |
|--------|-------------|
| `override void OnInit()` | Inizializza i manager client, crea l'HUD |
| `override void OnUpdate(float timeslice)` | Aggiornamento client per-frame |
| `override void OnMissionFinish()` | Pulizia |
| `override void OnKeyPress(int key)` | Tasto premuto |
| `override void OnKeyRelease(int key)` | Tasto rilasciato |

---

## Sistema delle Azioni

*Riferimento completo: [Capitolo 6.12: Sistema delle Azioni](12-action-system.md)*

### Registrare Azioni su un Oggetto

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Aggiungi azione personalizzata
    RemoveAction(ActionEat);       // Rimuovi azione vanilla
}
```

### Metodi Chiave di ActionBase

| Metodo | Descrizione |
|--------|-------------|
| `override void CreateConditionComponents()` | Imposta le condizioni di distanza CCINone/CCTNone |
| `override bool ActionCondition(...)` | Logica di validazione personalizzata |
| `override void OnExecuteServer(ActionData action_data)` | Esecuzione lato server |
| `override void OnExecuteClient(ActionData action_data)` | Effetti lato client |
| `override string GetText()` | Nome visualizzato (supporta chiavi `#STR_`) |

---

*Documentazione completa: [Home](../README.md) | [Cheat Sheet](../cheatsheet.md) | [Sistema Entita'](01-entity-system.md) | [Veicoli](02-vehicles.md) | [Meteo](03-weather.md) | [Timer](07-timers.md) | [I/O su File](08-file-io.md) | [Networking](09-networking.md) | [Hook Missione](11-mission-hooks.md) | [Sistema Azioni](12-action-system.md)*
