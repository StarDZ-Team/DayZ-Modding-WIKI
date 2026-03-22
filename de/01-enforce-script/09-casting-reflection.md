# Kapitel 1.9: Casting & Reflexion

[Startseite](../README.md) | [<< Zurück: Speicherverwaltung](08-memory-management.md) | **Casting & Reflexion** | [Weiter: Enums & Präprozessor >>](10-enums-preprocessor.md)

---

> **Ziel:** Sicheres Typ-Casting, Laufzeit-Typprüfungen und die Reflexions-API von Enforce Script für dynamischen Eigenschaftszugriff meistern.

---

## Inhaltsverzeichnis

- [Warum Casting wichtig ist](#warum-casting-wichtig-ist)
- [Class.CastTo -- Sicheres Downcasting](#classcastto--sicheres-downcasting)
- [Type.Cast -- Alternatives Casting](#typecast--alternatives-casting)
- [CastTo vs Type.Cast -- Wann was verwenden](#castto-vs-typecast--wann-was-verwenden)
- [obj.IsInherited -- Laufzeit-Typprüfung](#obisinherited--laufzeit-typprüfung)
- [obj.IsKindOf -- String-basierte Typprüfung](#obiskindof--string-basierte-typprüfung)
- [obj.Type -- Laufzeittyp abrufen](#objtype--laufzeittyp-abrufen)
- [typename -- Typreferenzen speichern](#typename--typreferenzen-speichern)
- [Reflexions-API](#reflexions-api)
  - [Variablen inspizieren](#variablen-inspizieren)
  - [EnScript.GetClassVar / SetClassVar](#enscriptgetclassvar--setclassvar)
- [Praxisbeispiele](#praxisbeispiele)
  - [Alle Fahrzeuge in der Welt finden](#alle-fahrzeuge-in-der-welt-finden)
  - [Sicherer Objekt-Helfer mit Cast](#sicherer-objekt-helfer-mit-cast)
  - [Reflexionsbasiertes Konfigurationssystem](#reflexionsbasiertes-konfigurationssystem)
  - [Typsicherer Event-Dispatcher](#typsicherer-event-dispatcher)
- [Häufige Fehler](#häufige-fehler)
- [Zusammenfassung](#zusammenfassung)
- [Navigation](#navigation)

---

## Warum Casting wichtig ist

DayZ's Entity-Hierarchie ist tief. Die meisten Engine-APIs geben einen generischen Basistyp zurück (`Object`, `Man`, `Class`), aber du brauchst einen spezifischen Typ (`PlayerBase`, `ItemBase`, `CarScript`), um auf spezialisierte Methoden zuzugreifen. Casting konvertiert eine Basisreferenz in eine abgeleitete Referenz -- sicher.

```
Class (Wurzel)
  └─ Object
       └─ Entity
            └─ EntityAI
                 ├─ InventoryItem → ItemBase
                 ├─ DayZCreatureAI
                 │    ├─ DayZInfected
                 │    └─ DayZAnimal
                 └─ Man
                      └─ DayZPlayer → PlayerBase
```

Das Aufrufen einer Methode, die auf dem Basistyp nicht existiert, verursacht einen **Laufzeitabsturz** -- es gibt keinen Compilerfehler, weil Enforce Script virtuelle Aufrufe zur Laufzeit auflöst.

---

## Class.CastTo -- Sicheres Downcasting

`Class.CastTo` ist die **bevorzugte** Casting-Methode in DayZ. Es ist eine statische Methode, die das Ergebnis in einen `out`-Parameter schreibt und `bool` zurückgibt.

```c
// Signatur:
// static bool Class.CastTo(out Class target, Class source)

Object obj = GetSomeObject();
PlayerBase player;

if (Class.CastTo(player, obj))
{
    // Cast erfolgreich -- player ist gültig
    string name = player.GetIdentity().GetName();
    Print("Spieler gefunden: " + name);
}
else
{
    // Cast fehlgeschlagen -- obj ist kein PlayerBase
    // player ist hier null
}
```

**Warum bevorzugt:**
- Gibt `false` bei Fehlschlag zurück anstatt abzustürzen
- Der `out`-Parameter wird bei Fehlschlag auf `null` gesetzt -- sicher zu prüfen
- Funktioniert über die gesamte Klassenhierarchie (nicht nur `Object`)

### Muster: Cast-und-Weiter

In Schleifen verwende Cast-Fehlschlag, um irrelevante Objekte zu überspringen:

```c
array<Object> nearObjects = new array<Object>;
array<CargoBase> proxyCargos = new array<CargoBase>;
GetGame().GetObjectsAtPosition(pos, 50.0, nearObjects, proxyCargos);

foreach (Object obj : nearObjects)
{
    EntityAI entity;
    if (!Class.CastTo(entity, obj))
        continue;  // Nicht-EntityAI-Objekte überspringen (Gebäude, Terrain, etc.)

    // Jetzt sicher EntityAI-Methoden aufrufen
    if (entity.IsAlive())
    {
        Print(entity.GetType() + " ist lebendig bei " + entity.GetPosition().ToString());
    }
}
```

---

## Type.Cast -- Alternatives Casting

Jede Klasse hat eine statische `Cast`-Methode, die das Cast-Ergebnis direkt zurückgibt (oder `null` bei Fehlschlag).

```c
// Syntax: ZielTyp.Cast(quelle)

Object obj = GetSomeObject();
PlayerBase player = PlayerBase.Cast(obj);

if (player)
{
    player.DoSomething();
}
```

Dies ist ein Einzeiler, der Cast und Zuweisung kombiniert, aber du **musst** das Ergebnis trotzdem auf null prüfen.

### Casting von Primitiven und Params

`Type.Cast` wird auch mit `Param`-Klassen verwendet (stark genutzt in RPCs und Events):

```c
override void OnEvent(EventType eventTypeId, Param params)
{
    if (eventTypeId == ClientReadyEventTypeID)
    {
        Param2<PlayerIdentity, Man> readyParams = Param2<PlayerIdentity, Man>.Cast(params);
        if (readyParams)
        {
            PlayerIdentity identity = readyParams.param1;
            Man player = readyParams.param2;
        }
    }
}
```

---

## CastTo vs Type.Cast -- Wann was verwenden

| Eigenschaft | `Class.CastTo` | `Type.Cast` |
|---------|----------------|-------------|
| Rückgabetyp | `bool` | Zieltyp oder `null` |
| Null bei Fehlschlag | Ja (out-Param wird auf null gesetzt) | Ja (gibt null zurück) |
| Am besten für | if-Blöcke mit Verzweigungslogik | Einzeilige Zuweisungen |
| Verwendet in DayZ Vanilla | Überall | Überall |
| Funktioniert mit Nicht-Object | Ja (jede `Class`) | Ja (jede `Class`) |

**Faustregel:** Verwende `Class.CastTo`, wenn du auf Erfolg/Fehlschlag verzweigst. Verwende `Type.Cast`, wenn du nur die typisierte Referenz brauchst und später auf null prüfst.

```c
// CastTo -- Verzweigung basierend auf Ergebnis
PlayerBase player;
if (Class.CastTo(player, obj))
{
    // Spieler behandeln
}

// Type.Cast -- Zuweisen und später prüfen
PlayerBase player = PlayerBase.Cast(obj);
if (!player) return;
```

---

## obj.IsInherited -- Laufzeit-Typprüfung

`IsInherited` prüft, ob ein Objekt eine Instanz eines gegebenen Typs ist, **ohne** einen Cast durchzuführen. Es nimmt ein `typename`-Argument.

```c
Object obj = GetSomeObject();

if (obj.IsInherited(PlayerBase))
{
    Print("Das ist ein Spieler!");
}

if (obj.IsInherited(DayZInfected))
{
    Print("Das ist ein Zombie!");
}

if (obj.IsInherited(CarScript))
{
    Print("Das ist ein Fahrzeug!");
}
```

`IsInherited` gibt `true` für den exakten Typ **und** alle Elterntypen in der Hierarchie zurück. Ein `PlayerBase`-Objekt gibt `true` für `IsInherited(Man)`, `IsInherited(EntityAI)`, `IsInherited(Object)` usw. zurück.

---

## obj.IsKindOf -- String-basierte Typprüfung

`IsKindOf` macht dieselbe Prüfung, aber mit einem **String**-Klassennamen. Nützlich, wenn du den Typnamen als Daten hast (z.B. aus Konfigurationsdateien).

```c
Object obj = GetSomeObject();

if (obj.IsKindOf("ItemBase"))
{
    Print("Das ist ein Item");
}

if (obj.IsKindOf("DayZAnimal"))
{
    Print("Das ist ein Tier");
}
```

**Wichtig:** `IsKindOf` prüft die vollständige Vererbungskette, genau wie `IsInherited`. Ein `Mag_STANAG_30Rnd` gibt `true` für `IsKindOf("Magazine_Base")`, `IsKindOf("InventoryItem")`, `IsKindOf("EntityAI")` usw. zurück.

### IsInherited vs IsKindOf

| Eigenschaft | `IsInherited(typename)` | `IsKindOf(string)` |
|---------|------------------------|---------------------|
| Argument | Kompilierzeit-Typ | String-Name |
| Geschwindigkeit | Schneller (Typvergleich) | Langsamer (String-Lookup) |
| Verwenden wenn | Du den Typ zur Kompilierzeit kennst | Typ aus Daten/Konfiguration kommt |

---

## obj.Type -- Laufzeittyp abrufen

`Type()` gibt den `typename` der tatsächlichen Laufzeitklasse eines Objekts zurück -- nicht den deklarierten Variablentyp.

```c
Object obj = GetSomeObject();
typename t = obj.Type();

Print(t.ToString());  // z.B. "PlayerBase", "AK101", "LandRover"
```

Verwende dies für Logging, Debugging oder dynamische Typvergleiche:

```c
void ProcessEntity(EntityAI entity)
{
    typename t = entity.Type();
    Print("Verarbeite Entity vom Typ: " + t.ToString());

    if (t == PlayerBase)
    {
        Print("Es ist ein Spieler");
    }
}
```

---

## typename -- Typreferenzen speichern

`typename` ist ein erstklassiger Typ in Enforce Script. Du kannst ihn in Variablen speichern, als Parameter übergeben und vergleichen.

```c
// Eine typename-Variable deklarieren
typename playerType = PlayerBase;
typename vehicleType = CarScript;

// Vergleichen
typename objType = obj.Type();
if (objType == playerType)
{
    Print("Treffer!");
}

// In Sammlungen verwenden
array<typename> allowedTypes = new array<typename>;
allowedTypes.Insert(PlayerBase);
allowedTypes.Insert(DayZInfected);
allowedTypes.Insert(DayZAnimal);

// Zugehörigkeit prüfen
foreach (typename t : allowedTypes)
{
    if (obj.IsInherited(t))
    {
        Print("Objekt entspricht erlaubtem Typ: " + t.ToString());
        break;
    }
}
```

### Instanzen aus typename erstellen

Du kannst Objekte aus einem `typename` zur Laufzeit erstellen:

```c
typename t = PlayerBase;
Class instance = t.Spawn();  // Erstellt eine neue Instanz

// Oder verwende den string-basierten Ansatz:
Class instance2 = GetGame().CreateObjectEx("AK101", pos, ECE_PLACE_ON_SURFACE);
```

> **Hinweis:** `typename.Spawn()` funktioniert nur für Klassen mit einem parameterlosen Konstruktor. Für DayZ-Entities verwende `GetGame().CreateObject()` oder `CreateObjectEx()`.

---

## Reflexions-API

Enforce Script bietet grundlegende Reflexion -- die Fähigkeit, die Eigenschaften eines Objekts zur Laufzeit zu inspizieren und zu modifizieren, ohne seinen Typ zur Kompilierzeit zu kennen.

### Variablen inspizieren

Der `Type()` jedes Objekts gibt einen `typename` zurück, der Variablen-Metadaten offenlegt:

```c
void InspectObject(Class obj)
{
    typename t = obj.Type();

    int varCount = t.GetVariableCount();
    Print("Klasse: " + t.ToString() + " hat " + varCount.ToString() + " Variablen");

    for (int i = 0; i < varCount; i++)
    {
        string varName = t.GetVariableName(i);
        typename varType = t.GetVariableType(i);

        Print("  [" + i.ToString() + "] " + varName + " : " + varType.ToString());
    }
}
```

**Verfügbare Reflexionsmethoden auf `typename`:**

| Methode | Gibt zurück | Beschreibung |
|--------|---------|-------------|
| `GetVariableCount()` | `int` | Anzahl der Membervariablen |
| `GetVariableName(int index)` | `string` | Variablenname am Index |
| `GetVariableType(int index)` | `typename` | Variablentyp am Index |
| `ToString()` | `string` | Klassenname als String |

### EnScript.GetClassVar / SetClassVar

`EnScript.GetClassVar` und `EnScript.SetClassVar` ermöglichen es dir, Membervariablen zur Laufzeit per **Name** zu lesen/schreiben. Dies ist Enforce Scripts Äquivalent zum dynamischen Eigenschaftszugriff.

```c
// Signatur:
// static void EnScript.GetClassVar(Class instance, string varName, int index, out T value)
// static bool EnScript.SetClassVar(Class instance, string varName, int index, T value)
// 'index' ist der Array-Element-Index -- verwende 0 für Nicht-Array-Felder.

class MyConfig
{
    int MaxSpawns = 10;
    float SpawnRadius = 100.0;
    string WelcomeMsg = "Hello!";
}

void DemoReflection()
{
    MyConfig cfg = new MyConfig();

    // Werte nach Namen lesen
    int maxVal;
    EnScript.GetClassVar(cfg, "MaxSpawns", 0, maxVal);
    Print("MaxSpawns = " + maxVal.ToString());  // "MaxSpawns = 10"

    float radius;
    EnScript.GetClassVar(cfg, "SpawnRadius", 0, radius);
    Print("SpawnRadius = " + radius.ToString());  // "SpawnRadius = 100"

    string msg;
    EnScript.GetClassVar(cfg, "WelcomeMsg", 0, msg);
    Print("WelcomeMsg = " + msg);  // "WelcomeMsg = Hello!"

    // Werte nach Namen schreiben
    EnScript.SetClassVar(cfg, "MaxSpawns", 0, 50);
    EnScript.SetClassVar(cfg, "SpawnRadius", 0, 250.0);
    EnScript.SetClassVar(cfg, "WelcomeMsg", 0, "Welcome!");
}
```

> **Warnung:** `GetClassVar`/`SetClassVar` schlagen stillschweigend fehl, wenn der Variablenname falsch ist oder der Typ nicht übereinstimmt. Validiere Variablennamen immer vor der Verwendung.

---

## Praxisbeispiele

### Alle Fahrzeuge in der Welt finden

```c
static array<CarScript> FindAllVehicles()
{
    array<CarScript> vehicles = new array<CarScript>;
    array<Object> allObjects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // Einen großen Bereich durchsuchen (oder mission-spezifische Logik verwenden)
    vector center = "7500 0 7500";
    GetGame().GetObjectsAtPosition(center, 15000.0, allObjects, proxyCargos);

    foreach (Object obj : allObjects)
    {
        CarScript car;
        if (Class.CastTo(car, obj))
        {
            vehicles.Insert(car);
        }
    }

    Print("Gefunden: " + vehicles.Count().ToString() + " Fahrzeuge");
    return vehicles;
}
```

### Sicherer Objekt-Helfer mit Cast

Dieses Muster wird im gesamten DayZ-Modding verwendet -- eine Hilfsfunktion, die sicher prüft, ob ein `Object` lebendig ist, indem sie auf `EntityAI` castet:

```c
// Object.IsAlive() existiert NICHT auf der Basis-Object-Klasse!
// Du musst zuerst auf EntityAI casten.

static bool IsObjectAlive(Object obj)
{
    if (!obj)
        return false;

    EntityAI eai;
    if (Class.CastTo(eai, obj))
    {
        return eai.IsAlive();
    }

    return false;  // Nicht-EntityAI-Objekte (Gebäude, etc.) -- als "nicht lebendig" behandeln
}
```

### Reflexionsbasiertes Konfigurationssystem

Dieses Muster (verwendet in MyMod Core) baut ein generisches Konfigurationssystem, bei dem Felder nach Namen gelesen/geschrieben werden, was Admin-Panels ermöglicht, jede Konfiguration zu bearbeiten, ohne ihre spezifische Klasse zu kennen:

```c
class ConfigBase
{
    // Einen Membervariablen-Index nach Namen finden
    protected int FindVarIndex(string fieldName)
    {
        typename t = Type();
        int count = t.GetVariableCount();
        for (int i = 0; i < count; i++)
        {
            if (t.GetVariableName(i) == fieldName)
                return i;
        }
        return -1;
    }

    // Jeden Feldwert als String abrufen
    string GetFieldValue(string fieldName)
    {
        if (FindVarIndex(fieldName) == -1)
            return "";

        int iVal;
        EnScript.GetClassVar(this, fieldName, 0, iVal);
        return iVal.ToString();
    }

    // Jeden Feldwert aus einem String setzen
    void SetFieldValue(string fieldName, string value)
    {
        if (FindVarIndex(fieldName) == -1)
            return;

        int iVal = value.ToInt();
        EnScript.SetClassVar(this, fieldName, 0, iVal);
    }
}

class MyModConfig : ConfigBase
{
    int MaxPlayers = 60;
    int RespawnTime = 300;
}

void AdminPanelSave(ConfigBase config, string fieldName, string newValue)
{
    // Funktioniert für JEDE Konfig-Unterklasse -- kein typspezifischer Code nötig
    config.SetFieldValue(fieldName, newValue);
}
```

### Typsicherer Event-Dispatcher

Verwende `typename`, um einen Dispatcher zu bauen, der Events an den korrekten Handler weiterleitet:

```c
class EventDispatcher
{
    protected ref map<typename, ref array<ref EventHandler>> m_Handlers;

    void EventDispatcher()
    {
        m_Handlers = new map<typename, ref array<ref EventHandler>>;
    }

    void Register(typename eventType, EventHandler handler)
    {
        if (!m_Handlers.Contains(eventType))
        {
            m_Handlers.Insert(eventType, new array<ref EventHandler>);
        }

        m_Handlers.Get(eventType).Insert(handler);
    }

    void Dispatch(EventBase event)
    {
        typename eventType = event.Type();

        array<ref EventHandler> handlers;
        if (m_Handlers.Find(eventType, handlers))
        {
            foreach (EventHandler handler : handlers)
            {
                handler.Handle(event);
            }
        }
    }
}
```

---

## Bewährte Methoden

- Prüfe nach jedem Cast immer auf null -- sowohl `Class.CastTo` als auch `Type.Cast` geben bei Fehlschlag null zurück, und die Verwendung des Ergebnisses ohne Prüfung verursacht Abstürze.
- Verwende `Class.CastTo`, wenn du auf Erfolg/Fehlschlag verzweigen musst; verwende `Type.Cast` für kompakte Einzeiler-Zuweisungen gefolgt von einer Null-Prüfung.
- Bevorzuge `IsInherited(typename)` gegenüber `IsKindOf(string)`, wenn der Typ zur Kompilierzeit bekannt ist -- es ist schneller und fängt Tippfehler zur Kompilierzeit ab.
- Caste auf `EntityAI`, bevor du `IsAlive()` aufrufst -- die Basis-`Object`-Klasse hat diese Methode nicht.
- Validiere Variablennamen mit `GetVariableCount`/`GetVariableName` vor der Verwendung von `EnScript.GetClassVar` -- es schlägt stillschweigend bei falschen Namen fehl.

---

## In echten Mods beobachtet

> Muster bestätigt durch das Studium professioneller DayZ-Mod-Quellcodes.

| Muster | Mod | Detail |
|---------|-----|--------|
| `Class.CastTo` + `continue` in Entity-Schleifen | COT / Expansion | Jede Schleife über `Object`-Arrays verwendet Cast-und-Weiter, um nicht passende Typen zu überspringen |
| `IsKindOf` für konfigurationsgesteuerte Typprüfungen | Expansion Market | Aus JSON geladene Item-Kategorien verwenden string-basiertes `IsKindOf`, weil Typen Daten sind |
| `EnScript.GetClassVar`/`SetClassVar` für Admin-Panels | Dabs Framework | Generische Konfigurationseditoren lesen/schreiben Felder nach Namen, damit eine UI für alle Konfigurationsklassen funktioniert |
| `obj.Type().ToString()` für Logging | VPP Admin | Debug-Logs beinhalten immer `entity.Type().ToString()`, um zu identifizieren, was verarbeitet wurde |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|---------|---------|
| `Object.IsAlive()` | Erwartet, dass es auf `Object` existiert | Nur auf `EntityAI` und Unterklassen verfügbar -- der Aufruf auf `Object` stürzt ab |
| `EnScript.SetClassVar` gibt `bool` zurück | Sollte Erfolg/Fehlschlag anzeigen | Gibt stillschweigend `false` bei falschem Feldnamen zurück, ohne Fehlermeldung -- leicht zu übersehen |
| `typename.Spawn()` | Erstellt jede Klasseninstanz | Funktioniert nur für Klassen mit parameterlosem Konstruktor; für Spielentitäten verwende `CreateObject` |

---

## Häufige Fehler

### 1. Vergessen, nach dem Cast auf null zu prüfen

```c
// FALSCH -- stürzt ab, wenn obj kein PlayerBase ist
PlayerBase player = PlayerBase.Cast(obj);
player.GetIdentity();  // ABSTURZ wenn Cast fehlgeschlagen!

// RICHTIG
PlayerBase player = PlayerBase.Cast(obj);
if (player)
{
    player.GetIdentity();
}
```

### 2. IsAlive() auf Basis-Object aufrufen

```c
// FALSCH -- Object.IsAlive() existiert nicht
Object obj = GetSomeObject();
if (obj.IsAlive())  // Compilerfehler oder Laufzeitabsturz!

// RICHTIG
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Sicher
}
```

### 3. Reflexion mit falschem Variablennamen verwenden

```c
// STILLER FEHLSCHLAG -- kein Fehler, gibt nur Null/leer zurück
int val;
EnScript.GetClassVar(obj, "NonExistentField", 0, val);
// val ist 0, kein Fehler geworfen
```

Validiere immer zuerst mit `FindVarIndex` oder `GetVariableCount`/`GetVariableName`.

### 4. Type() mit typename-Literal verwechseln

```c
// Type() -- gibt den LAUFZEITTYP einer Instanz zurück
typename t = myObj.Type();  // z.B. PlayerBase

// typename-Literal -- eine Kompilierzeit-Typreferenz
typename t = PlayerBase;    // Immer PlayerBase

// Sie sind vergleichbar
if (myObj.Type() == PlayerBase)  // true wenn myObj EIN PlayerBase IST
```

---

## Zusammenfassung

| Operation | Syntax | Gibt zurück |
|-----------|--------|---------|
| Sicherer Downcast | `Class.CastTo(out target, source)` | `bool` |
| Inline-Cast | `TargetType.Cast(source)` | Ziel oder `null` |
| Typprüfung (typename) | `obj.IsInherited(typename)` | `bool` |
| Typprüfung (String) | `obj.IsKindOf("ClassName")` | `bool` |
| Laufzeittyp abrufen | `obj.Type()` | `typename` |
| Variablenanzahl | `obj.Type().GetVariableCount()` | `int` |
| Variablenname | `obj.Type().GetVariableName(i)` | `string` |
| Variablentyp | `obj.Type().GetVariableType(i)` | `typename` |
| Eigenschaft lesen | `EnScript.GetClassVar(obj, name, 0, out val)` | `void` |
| Eigenschaft schreiben | `EnScript.SetClassVar(obj, name, 0, val)` | `bool` |

---

## Navigation

| Vorheriges | Hoch | Nächstes |
|----------|----|------|
| [1.8 Speicherverwaltung](08-memory-management.md) | [Teil 1: Enforce Script](../README.md) | [1.10 Enums & Präprozessor](10-enums-preprocessor.md) |
