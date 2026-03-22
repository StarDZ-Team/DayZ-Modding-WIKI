# Engine API Quick Reference

[Home](../README.md) | **Engine API Quick Reference**

---

## Inhaltsverzeichnis

- [Entity-Methoden](#entity-methoden)
- [Gesundheit & Schaden](#gesundheit--schaden)
- [Typüberprüfung](#typüberprüfung)
- [Inventar](#inventar)
- [Entity-Erstellung & -Löschung](#entity-erstellung--löschung)
- [Spieler-Methoden](#spieler-methoden)
- [Fahrzeug-Methoden](#fahrzeug-methoden)
- [Wetter-Methoden](#wetter-methoden)
- [Datei-I/O-Methoden](#datei-io-methoden)
- [Timer- & CallQueue-Methoden](#timer---callqueue-methoden)
- [Widget-Erstellungsmethoden](#widget-erstellungsmethoden)
- [RPC / Netzwerk-Methoden](#rpc--netzwerk-methoden)
- [Mathematische Konstanten & Methoden](#mathematische-konstanten--methoden)
- [Vektor-Methoden](#vektor-methoden)
- [Globale Funktionen](#globale-funktionen)
- [Mission Hooks](#mission-hooks)
- [Action-System](#action-system)

---

## Entity-Methoden

*Vollständige Referenz: [Kapitel 6.1: Entity-System](01-entity-system.md)*

### Position & Orientierung (Object)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetPosition` | `vector GetPosition()` | Weltposition |
| `SetPosition` | `void SetPosition(vector pos)` | Weltposition setzen |
| `GetOrientation` | `vector GetOrientation()` | Gieren, Nicken, Rollen in Grad |
| `SetOrientation` | `void SetOrientation(vector ori)` | Gieren, Nicken, Rollen setzen |
| `GetDirection` | `vector GetDirection()` | Vorwärtsrichtungsvektor |
| `SetDirection` | `void SetDirection(vector dir)` | Vorwärtsrichtung setzen |
| `GetScale` | `float GetScale()` | Aktuelle Skalierung |
| `SetScale` | `void SetScale(float scale)` | Skalierung setzen |

### Transformation (IEntity)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetOrigin` | `vector GetOrigin()` | Weltposition (Engine-Ebene) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Weltposition setzen (Engine-Ebene) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Rotation als Gieren/Nicken/Rollen |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Vollständige 4x3-Transformationsmatrix |
| `SetTransform` | `void SetTransform(vector mat[4])` | Vollständige Transformation setzen |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Lokale Richtung zu Welt |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Lokaler Punkt zu Welt |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Weltrichtung zu lokal |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Weltpunkt zu lokal |

### Hierarchie (IEntity)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Kind an Bone anhängen |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Kind lösen |
| `GetParent` | `IEntity GetParent()` | Eltern-Entity oder null |
| `GetChildren` | `IEntity GetChildren()` | Erstes Kind-Entity |
| `GetSibling` | `IEntity GetSibling()` | Nächstes Geschwister-Entity |

### Anzeigeinformationen (Object)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetType` | `string GetType()` | Konfigurations-Klassenname (z.B. `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Lokalisierter Anzeigename |
| `IsKindOf` | `bool IsKindOf(string type)` | Konfigurationsvererbung prüfen |

### Bone-Positionen (Object)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Bone-Position im lokalen Raum |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Bone-Position im Modellraum |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Bone-Position im Weltraum |

### Konfigurationszugriff (Object)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Bool aus Konfiguration lesen |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Int aus Konfiguration lesen |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Float aus Konfiguration lesen |
| `ConfigGetString` | `string ConfigGetString(string entry)` | String aus Konfiguration lesen |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | String-Array lesen |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Prüfen, ob Konfigurationseintrag existiert |

---

## Gesundheit & Schaden

*Vollständige Referenz: [Kapitel 6.1: Entity-System](01-entity-system.md)*

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Gesundheitswert abfragen |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Maximale Gesundheit abfragen |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Gesundheit setzen |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Auf Maximum setzen |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Gesundheit hinzufügen |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Gesundheit verringern |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Schaden aktivieren/deaktivieren |
| `GetAllowDamage` | `bool GetAllowDamage()` | Prüfen, ob Schaden erlaubt ist |
| `IsAlive` | `bool IsAlive()` | Lebendigkeitspruefung (auf EntityAI verwenden) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Schaden anwenden (EntityAI) |

**Häufige Zone/Typ-Paare:** `("", "Health")` global, `("", "Blood")` Spielerblut, `("", "Shock")` Spielerschock, `("Engine", "Health")` Fahrzeugmotor.

---

## Typüberprüfung

| Methode | Klasse | Beschreibung |
|---------|--------|--------------|
| `IsMan()` | Object | Ist dies ein Spieler? |
| `IsBuilding()` | Object | Ist dies ein Gebäude? |
| `IsTransport()` | Object | Ist dies ein Fahrzeug? |
| `IsDayZCreature()` | Object | Ist dies eine Kreatur (Zombie/Tier)? |
| `IsKindOf(string)` | Object | Konfigurationsvererbungspruefung |
| `IsItemBase()` | EntityAI | Ist dies ein Inventargegenstand? |
| `IsWeapon()` | EntityAI | Ist dies eine Waffe? |
| `IsMagazine()` | EntityAI | Ist dies ein Magazin? |
| `IsClothing()` | EntityAI | Ist dies Kleidung? |
| `IsFood()` | EntityAI | Ist dies Nahrung? |
| `Class.CastTo(out, obj)` | Class | Sicherer Downcast (gibt bool zurück) |
| `ClassName.Cast(obj)` | Class | Inline-Cast (gibt null bei Fehlschlag zurück) |

---

## Inventar

*Vollständige Referenz: [Kapitel 6.1: Entity-System](01-entity-system.md)*

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetInventory` | `GameInventory GetInventory()` | Inventarkomponente abfragen (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Gegenstand im Cargo erstellen |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Gegenstand im Cargo erstellen |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Gegenstand als Attachment erstellen |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Alle Gegenstände auflisten |
| `CountInventory` | `int CountInventory()` | Gegenstände zählen |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Nach Gegenstand suchen |
| `AttachmentCount` | `int AttachmentCount()` | Anzahl der Attachments |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Attachment nach Index abfragen |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Attachment nach Slot abfragen |

---

## Entity-Erstellung & -Löschung

*Vollständige Referenz: [Kapitel 6.1: Entity-System](01-entity-system.md)*

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Entity erstellen |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Mit ECE-Flags erstellen |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Sofortige Serverlöschung |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Nur clientseitige Löschung |
| `Delete` | `void obj.Delete()` | Verzögerte Löschung (nächster Frame) |

### Häufige ECE-Flags

| Flag | Wert | Beschreibung |
|------|------|--------------|
| `ECE_NONE` | `0` | Kein besonderes Verhalten |
| `ECE_CREATEPHYSICS` | `1024` | Kollision erstellen |
| `ECE_INITAI` | `2048` | KI initialisieren |
| `ECE_EQUIP` | `24576` | Mit Attachments + Cargo spawnen |
| `ECE_PLACE_ON_SURFACE` | kombiniert | Physik + Pfad + Trace |
| `ECE_LOCAL` | `1073741824` | Nur Client (nicht repliziert) |
| `ECE_NOLIFETIME` | `4194304` | Wird nicht despawnen |
| `ECE_KEEPHEIGHT` | `524288` | Y-Position beibehalten |

---

## Spieler-Methoden

*Vollständige Referenz: [Kapitel 6.1: Entity-System](01-entity-system.md)*

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Spieleridentitätsobjekt |
| `GetIdentity().GetName()` | `string GetName()` | Steam/Plattform-Anzeigename |
| `GetIdentity().GetId()` | `string GetId()` | BI eindeutige ID |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | Steam64 ID |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | Sitzungs-Spieler-ID |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Gegenstand in den Händen |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Gefahrenes Fahrzeug |
| `IsAlive` | `bool IsAlive()` | Lebendigkeitspruefung |
| `IsUnconscious` | `bool IsUnconscious()` | Bewusstlosigkeitsprüfung |
| `IsRestrained` | `bool IsRestrained()` | Fesselungspruefung |
| `IsInVehicle` | `bool IsInVehicle()` | In-Fahrzeug-Pruefung |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Vor dem Spieler spawnen |

---

## Fahrzeug-Methoden

*Vollständige Referenz: [Kapitel 6.2: Fahrzeugsystem](02-vehicles.md)*

### Besatzung (Transport)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `CrewSize` | `int CrewSize()` | Gesamtanzahl der Sitze |
| `CrewMember` | `Human CrewMember(int idx)` | Mensch auf Sitzplatz abfragen |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Sitzplatz des Menschen abfragen |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Erzwungener Ausstieg aus Sitz |
| `CrewDeath` | `void CrewDeath(int idx)` | Besatzungsmitglied töten |

### Motor (Car)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `EngineIsOn` | `bool EngineIsOn()` | Motor läuft? |
| `EngineStart` | `void EngineStart()` | Motor starten |
| `EngineStop` | `void EngineStop()` | Motor stoppen |
| `EngineGetRPM` | `float EngineGetRPM()` | Aktuelle Drehzahl |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | Drehzahl-Obergrenze |
| `GetGear` | `int GetGear()` | Aktueller Gang |
| `GetSpeedometer` | `float GetSpeedometer()` | Geschwindigkeit in km/h |

### Flüssigkeiten (Car)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Maximale Kapazität |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Fuellstand 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Flüssigkeit hinzufügen |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Flüssigkeit entfernen |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Alle Flüssigkeit ablassen |

**CarFluid Enum:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Steuerung (Car)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = alle |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Lenkungseingabe |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 Gas |

---

## Wetter-Methoden

*Vollständige Referenz: [Kapitel 6.3: Wettersystem](03-weather.md)*

### Zugriff

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Wetter-Singleton abfragen |

### Phänomene (Weather)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Bewölkung |
| `GetRain` | `WeatherPhenomenon GetRain()` | Regen |
| `GetFog` | `WeatherPhenomenon GetFog()` | Nebel |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Schnee |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Windstärke |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Windrichtung |
| `GetWind` | `vector GetWind()` | Windrichtungsvektor |
| `GetWindSpeed` | `float GetWindSpeed()` | Windgeschwindigkeit m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Blitz-Konfiguration |

### WeatherPhenomenon

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetActual` | `float GetActual()` | Aktueller interpolierter Wert |
| `GetForecast` | `float GetForecast()` | Zielwert |
| `GetDuration` | `float GetDuration()` | Verbleibende Dauer (Sekunden) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Ziel setzen (nur Server) |
| `SetLimits` | `void SetLimits(float min, float max)` | Wertebereichsgrenzen |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Änderungsgeschwindigkeitsgrenzen |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Änderungsstärkegrenzen |

---

## Datei-I/O-Methoden

*Vollständige Referenz: [Kapitel 6.8: Datei-I/O & JSON](08-file-io.md)*

### Pfad-Präfixe

| Präfix | Speicherort | Beschreibbar |
|---------|-------------|--------------|
| `$profile:` | Server/Client-Profilverzeichnis | Ja |
| `$saves:` | Speicherverzeichnis | Ja |
| `$mission:` | Aktueller Missionsordner | Normalerweise nur Lesen |
| `$CurrentDir:` | Arbeitsverzeichnis | Abhängig |

### Dateioperationen

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `FileExist` | `bool FileExist(string path)` | Prüfen, ob Datei existiert |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Verzeichnis erstellen |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Datei öffnen (0 = fehlgeschlagen) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Datei schliessen |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Text schreiben (ohne Zeilenumbruch) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Text + Zeilenumbruch schreiben |
| `FGets` | `int FGets(FileHandle fh, string line)` | Eine Zeile lesen |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Gesamte Datei lesen |
| `DeleteFile` | `bool DeleteFile(string path)` | Datei löschen |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Datei kopieren |

### JSON (JsonFileLoader)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | JSON in Objekt laden (**gibt void zurück**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Objekt als JSON speichern |

### FileMode Enum

| Wert | Beschreibung |
|------|--------------|
| `FileMode.READ` | Zum Lesen öffnen |
| `FileMode.WRITE` | Zum Schreiben öffnen (erstellt/überschreibt) |
| `FileMode.APPEND` | Zum Anhängen öffnen |

---

## Timer- & CallQueue-Methoden

*Vollständige Referenz: [Kapitel 6.7: Timer & CallQueue](07-timers.md)*

### Zugriff

| Ausdruck | Gibt zurück | Beschreibung |
|----------|--------------|--------------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Gameplay-Aufrufwarteschlange |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | System-Aufrufwarteschlange |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | GUI-Aufrufwarteschlange |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Pro-Frame-Aktualisierungswarteschlange |

### ScriptCallQueue

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Verzögerten/wiederholenden Aufruf planen |
| `Call` | `void Call(func fn, param1..4)` | Nächsten Frame ausführen |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Methode per String-Name aufrufen |
| `Remove` | `void Remove(func fn)` | Geplanten Aufruf abbrechen |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Per String-Name abbrechen |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Verbleibende Zeit von CallLater abfragen |

### Timer-Klasse

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Konstruktor |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Timer starten |
| `Stop` | `void Stop()` | Timer stoppen |
| `Pause` | `void Pause()` | Timer pausieren |
| `Continue` | `void Continue()` | Timer fortsetzen |
| `IsPaused` | `bool IsPaused()` | Timer pausiert? |
| `IsRunning` | `bool IsRunning()` | Timer aktiv? |
| `GetRemaining` | `float GetRemaining()` | Verbleibende Sekunden |

### ScriptInvoker

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Insert` | `void Insert(func fn)` | Callback registrieren |
| `Remove` | `void Remove(func fn)` | Callback deregistrieren |
| `Invoke` | `void Invoke(params...)` | Alle Callbacks auslösen |
| `Count` | `int Count()` | Anzahl registrierter Callbacks |
| `Clear` | `void Clear()` | Alle Callbacks entfernen |

---

## Widget-Erstellungsmethoden

*Vollständige Referenz: [Kapitel 3.5: Programmatische Erstellung](../03-gui-system/05-programmatic-widgets.md)*

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | UI-Workspace abfragen |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | .layout-Datei laden |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Kind per Name finden (rekursiv) |
| `Show` | `void Show(bool show)` | Widget ein-/ausblenden |
| `SetText` | `void TextWidget.SetText(string text)` | Textinhalt setzen |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Bildindex setzen |
| `SetColor` | `void SetColor(int color)` | Widget-Farbe setzen (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Transparenz setzen 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Widget-Größe setzen |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Widget-Position setzen |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Bildschirmauflösung |
| `Destroy` | `void Widget.Destroy()` | Widget entfernen und zerstören |

### ARGB-Farbhilfe

| Funktion | Signatur | Beschreibung |
|----------|----------|--------------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Farbwert erstellen (0-255 je) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Farbwert erstellen (0.0-1.0 je) |

---

## RPC / Netzwerk-Methoden

*Vollständige Referenz: [Kapitel 6.9: Netzwerk & RPC](09-networking.md)*

### Umgebungspruefungen

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `GetGame().IsServer()` | `bool IsServer()` | Wahr auf Server / Listen-Server-Host |
| `GetGame().IsClient()` | `bool IsClient()` | Wahr auf Client |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Wahr im Mehrspieler |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | Wahr nur auf dediziertem Server |

### ScriptRPC

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `ScriptRPC()` | `void ScriptRPC()` | Konstruktor |
| `Write` | `bool Write(void value)` | Einen Wert serialisieren (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | RPC senden |
| `Reset` | `void Reset()` | Geschriebene Daten löschen |

### Empfang (Override auf Object)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | RPC-Empfangshandler |

### ParamsReadContext

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Read` | `bool Read(out void value)` | Einen Wert deserialisieren (gleiche Typen wie Write) |

### Legacy-RPC (CGame)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Einzelnes Param-Objekt senden |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Mehrere Params senden |

### ScriptInputUserData (Eingabeverifiziert)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Prüfen, ob Warteschlange Platz hat |
| `Write` | `bool Write(void value)` | Wert serialisieren |
| `Send` | `void Send()` | An Server senden (nur Client) |

---

## Mathematische Konstanten & Methoden

*Vollständige Referenz: [Kapitel 1.7: Mathematik & Vektoren](../01-enforce-script/07-math-vectors.md)*

### Konstanten

| Konstante | Wert | Beschreibung |
|-----------|------|--------------|
| `Math.PI` | `3.14159...` | Pi |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Multiplikator Grad zu Radiant |
| `Math.RAD2DEG` | `57.2957...` | Multiplikator Radiant zu Grad |
| `int.MAX` | `2147483647` | Maximaler int-Wert |
| `int.MIN` | `-2147483648` | Minimaler int-Wert |
| `float.MAX` | `3.4028e+38` | Maximaler float-Wert |
| `float.MIN` | `1.175e-38` | Minimaler positiver float-Wert |

### Zufall

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Zufälliger int [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Zufälliger int [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Zufälliger float [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | Zufälliges true/false |

### Rundung

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Math.Round` | `float Round(float f)` | Auf nächsten Wert runden |
| `Math.Floor` | `float Floor(float f)` | Abrunden |
| `Math.Ceil` | `float Ceil(float f)` | Aufrunden |

### Begrenzung & Interpolation

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Auf Bereich begrenzen |
| `Math.Min` | `float Min(float a, float b)` | Minimum von zweien |
| `Math.Max` | `float Max(float a, float b)` | Maximum von zweien |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Lineare Interpolation |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Inverse Interpolation |

### Absolutwert & Potenz

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Absolutwert (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Absolutwert (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Potenz |
| `Math.Sqrt` | `float Sqrt(float f)` | Quadratwurzel |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Quadrat (f * f) |

### Trigonometrie (Radiant)

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Math.Sin` | `float Sin(float rad)` | Sinus |
| `Math.Cos` | `float Cos(float rad)` | Kosinus |
| `Math.Tan` | `float Tan(float rad)` | Tangens |
| `Math.Asin` | `float Asin(float val)` | Arkussinus |
| `Math.Acos` | `float Acos(float val)` | Arkuskosinus |
| `Math.Atan2` | `float Atan2(float y, float x)` | Winkel aus Komponenten |

### Smooth Damping

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Sanft zum Ziel dämpfen (wie Unitys SmoothDamp) |

```c
// Smooth-Damping-Verwendung
// val: aktueller Wert, target: Zielwert, velocity: Ref-Geschwindigkeit (zwischen Aufrufen beibehalten)
// smoothTime: Glättungszeit, maxSpeed: Geschwindigkeitslimit, dt: Delta-Zeit
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Winkel

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Auf 0-360 normalisieren |

---

## Vektor-Methoden

| Methode | Signatur | Beschreibung |
|---------|----------|--------------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Abstand zwischen Punkten |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Quadrierter Abstand (schneller) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Richtungsvektor |
| `vector.Dot` | `float Dot(vector a, vector b)` | Skalarprodukt |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Positionen interpolieren |
| `v.Length()` | `float Length()` | Vektorlänge |
| `v.LengthSq()` | `float LengthSq()` | Quadrierte Länge (schneller) |
| `v.Normalized()` | `vector Normalized()` | Einheitsvektor |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Richtung zu Gieren/Nicken |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Gieren/Nicken zu Richtung |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Matrixmultiplikation |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Inverse Matrixmultiplikation |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Vektor erstellen |

---

## Globale Funktionen

| Funktion | Signatur | Beschreibung |
|----------|----------|--------------|
| `GetGame()` | `CGame GetGame()` | Spielinstanz |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Lokaler Spieler (nur CLIENT) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Alle Spieler (Server) |
| `GetGame().GetWorld()` | `World GetWorld()` | Weltinstanz |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Serverzeit (Sekunden) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | UI-Workspace |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Geländehöhe an Position |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Oberflächenmaterialtyp |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Objekte in der Nähe finden |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Bildschirmauflösung abfragen |
| `GetGame().IsServer()` | `bool IsServer()` | Serverpruefung |
| `GetGame().IsClient()` | `bool IsClient()` | Clientpruefung |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Mehrspielerpruefung |
| `Print(string)` | `void Print(string msg)` | In Skriptlog schreiben |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Fehler mit Schweregrad protokollieren |
| `DumpStackString()` | `string DumpStackString()` | Aufrufstapel als String abfragen |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | String formatieren (`%1`..`%9`) |

---

## Mission Hooks

*Vollständige Referenz: [Kapitel 6.11: Mission Hooks](11-mission-hooks.md)*

### Serverseitig (modded MissionServer)

| Methode | Beschreibung |
|---------|--------------|
| `override void OnInit()` | Manager initialisieren, RPCs registrieren |
| `override void OnMissionStart()` | Nachdem alle Mods geladen sind |
| `override void OnUpdate(float timeslice)` | Pro Frame (Akkumulator verwenden!) |
| `override void OnMissionFinish()` | Singletons aufräumen, Events abmelden |
| `override void OnEvent(EventType eventTypeId, Param params)` | Chat-, Sprach-Events |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Spieler beigetreten |
| `override void InvokeOnDisconnect(PlayerBase player)` | Spieler verlassen |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Client bereit für Daten |
| `override void PlayerRegistered(int peerId)` | Identität registriert |

### Clientseitig (modded MissionGameplay)

| Methode | Beschreibung |
|---------|--------------|
| `override void OnInit()` | Client-Manager initialisieren, HUD erstellen |
| `override void OnUpdate(float timeslice)` | Pro-Frame-Client-Aktualisierung |
| `override void OnMissionFinish()` | Aufräumen |
| `override void OnKeyPress(int key)` | Taste gedrückt |
| `override void OnKeyRelease(int key)` | Taste losgelassen |

---

## Action-System

*Vollständige Referenz: [Kapitel 6.12: Action-System](12-action-system.md)*

### Actions auf einem Item registrieren

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Benutzerdefinierte Action hinzufügen
    RemoveAction(ActionEat);       // Vanilla-Action entfernen
}
```

### ActionBase Schlüssel-Methoden

| Methode | Beschreibung |
|---------|--------------|
| `override void CreateConditionComponents()` | CCINone/CCTNone Distanzbedingungen setzen |
| `override bool ActionCondition(...)` | Benutzerdefinierte Validierungslogik |
| `override void OnExecuteServer(ActionData action_data)` | Serverseitige Ausführung |
| `override void OnExecuteClient(ActionData action_data)` | Clientseitige Effekte |
| `override string GetText()` | Anzeigename (unterstützt `#STR_`-Schlüssel) |

---

*Vollständige Dokumentation: [Startseite](../README.md) | [Spickzettel](../cheatsheet.md) | [Entity-System](01-entity-system.md) | [Fahrzeuge](02-vehicles.md) | [Wetter](03-weather.md) | [Timer](07-timers.md) | [Datei-I/O](08-file-io.md) | [Netzwerk](09-networking.md) | [Mission Hooks](11-mission-hooks.md) | [Action-System](12-action-system.md)*
