# Kapitel 1.13: Funktionen & Methoden

[Startseite](../README.md) | [<< Zurück: Fallstricke](12-gotchas.md) | **Funktionen & Methoden**

---

## Einführung

Funktionen sind die grundlegende Verhaltenseinheit in Enforce Script. Jede Aktion, die ein Mod ausführt --- ein Item spawnen, die Gesundheit eines Spielers prüfen, einen RPC senden, ein UI-Element zeichnen --- lebt in einer Funktion. Zu verstehen, wie man sie deklariert, Daten hinein- und herausgibt und mit den speziellen Modifikatoren der Engine arbeitet, ist essenziell für das Schreiben korrekter DayZ-Mods.

Dieses Kapitel behandelt Funktionsmechaniken im Detail: Deklarationssyntax, Parameterübergabemodi, Rückgabewerte, Standardparameter, Proto-Native-Bindungen, statische vs. Instanzmethoden, Überschreibung, das `thread`-Schlüsselwort und das `event`-Schlüsselwort. Wenn Kapitel 1.3 (Klassen) gelehrt hat, wo Funktionen leben, lehrt dieses Kapitel, wie sie funktionieren.

---

## Inhaltsverzeichnis

- [Funktionsdeklarationssyntax](#funktionsdeklarationssyntax)
  - [Eigenständige Funktionen](#eigenständige-funktionen)
  - [Instanzmethoden](#instanzmethoden)
  - [Statische Methoden](#statische-methoden)
- [Parameterübergabemodi](#parameterübergabemodi)
  - [Per Wert (Standard)](#per-wert-standard)
  - [out-Parameter](#out-parameter)
  - [inout-Parameter](#inout-parameter)
  - [notnull-Parameter](#notnull-parameter)
- [Rückgabewerte](#rückgabewerte)
- [Standard-Parameterwerte](#standard-parameterwerte)
- [Proto-Native-Methoden (Engine-Bindungen)](#proto-native-methoden-engine-bindungen)
- [Statisch vs. Instanz-Methoden](#statisch-vs-instanz-methoden)
- [Methodenüberschreibung](#methodenüberschreibung)
- [Methodenüberladung (nicht unterstützt)](#methodenüberladung-nicht-unterstützt)
- [Das event-Schlüsselwort](#das-event-schlüsselwort)
- [Thread-Methoden (Coroutinen)](#thread-methoden-coroutinen)
- [Verzögerte Aufrufe mit CallLater](#verzögerte-aufrufe-mit-calllater)
- [Bewährte Praktiken](#bewährte-praktiken)
- [In echten Mods beobachtet](#in-echten-mods-beobachtet)
- [Theorie vs. Praxis](#theorie-vs-praxis)
- [Häufige Fehler](#häufige-fehler)
- [Kurzreferenztabelle](#kurzreferenztabelle)

---

## Funktionsdeklarationssyntax

Jede Funktion hat einen Rückgabetyp, einen Namen und eine Parameterliste. Der Rumpf ist in geschweifte Klammern eingeschlossen.

```
RückgabeTyp FunktionsName(ParamTyp paramName, ...)
{
    // Rumpf
}
```

### Eigenständige Funktionen

Eigenständige (globale) Funktionen existieren außerhalb jeder Klasse. Sie sind im DayZ-Modding selten --- fast der gesamte Code lebt in Klassen --- aber Sie werden einigen in den Vanilla-Scripts begegnen.

```c
// Eigenständige Funktion (globaler Gültigkeitsbereich)
void PrintPlayerCount()
{
    int count = GetGame().GetPlayers().Count();
    Print(string.Format("Spieler online: %1", count));
}

// Eigenständige Funktion mit Rückgabewert
string FormatTimestamp(int hours, int minutes)
{
    return string.Format("%1:%2", hours.ToStringLen(2), minutes.ToStringLen(2));
}
```

Die Vanilla-Engine definiert mehrere eigenständige Hilfsfunktionen:

```c
// Aus enscript.c -- Hilfsfunktion für String-Ausdrücke
string String(string s)
{
    return s;
}
```

### Instanzmethoden

Die große Mehrheit der Funktionen in DayZ-Mods sind Instanzmethoden --- sie gehören zu einer Klasse und operieren auf den Daten dieser Instanz.

```c
class LootSpawner
{
    protected vector m_Position;
    protected float m_Radius;

    void SetPosition(vector pos)
    {
        m_Position = pos;
    }

    float GetRadius()
    {
        return m_Radius;
    }

    bool IsNearby(vector testPos)
    {
        return vector.Distance(m_Position, testPos) <= m_Radius;
    }
}
```

Instanzmethoden haben impliziten Zugriff auf `this` --- eine Referenz auf das aktuelle Objekt. Sie müssen selten `this.` explizit schreiben, aber es kann bei der Unterscheidung helfen, wenn ein Parameter einen ähnlichen Namen hat.

### Statische Methoden

Statische Methoden gehören zur Klasse selbst, nicht zu einer Instanz. Sie werden über `KlassenName.Methode()` aufgerufen. Sie können nicht auf Instanzfelder oder `this` zugreifen.

```c
class MathHelper
{
    static float Clamp01(float value)
    {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    static float Lerp(float a, float b, float t)
    {
        return a + (b - a) * Clamp01(t);
    }
}

// Verwendung:
float result = MathHelper.Lerp(0, 100, 0.75);  // 75.0
```

Statische Methoden sind ideal für Hilfsfunktionen, Factory-Methoden und Singleton-Zugriffsmehtoden. DayZs Vanilla-Code nutzt sie ausgiebig:

```c
// Aus DamageSystem (3_game/damagesystem.c)
class DamageSystem
{
    static bool GetDamageZoneMap(EntityAI entity, out DamageZoneMap zoneMap)
    {
        // ...
    }

    static string GetDamageDisplayName(EntityAI entity, string zone)
    {
        // ...
    }
}
```

---

## Parameterübergabemodi

Enforce Script unterstützt vier Parameterübergabemodi. Sie zu verstehen ist kritisch, weil der falsche Modus zu stillen Fehlern führt, bei denen Daten den Aufrufer nie erreichen.

### Per Wert (Standard)

Wenn kein Modifikator angegeben ist, wird der Parameter **per Wert** übergeben. Für Primitive (`int`, `float`, `bool`, `string`, `vector`) wird eine Kopie erstellt. Änderungen innerhalb der Funktion beeinflussen die Variable des Aufrufers nicht.

```c
void DoubleValue(int x)
{
    x = x * 2;  // ändert nur die lokale Kopie
}

// Verwendung:
int n = 5;
DoubleValue(n);
Print(n);  // immer noch 5 --- das Original ist unverändert
```

Bei Klassentypen (Objekten) wird per-Wert-Übergabe trotzdem eine **Referenz auf das Objekt** übergeben --- aber die Referenz selbst wird kopiert. Sie können die Felder des Objekts ändern, aber Sie können die Referenz nicht auf ein anderes Objekt umleiten.

```c
void RenameZone(SpawnZone zone)
{
    zone.SetName("NeuerName");  // das FUNKTIONIERT --- ändert dasselbe Objekt
    zone = null;              // das beeinflusst die Variable des Aufrufers NICHT
}
```

### out-Parameter

Das Schlüsselwort `out` markiert einen Parameter als **nur-Ausgabe**. Die Funktion schreibt einen Wert hinein, und der Aufrufer erhält diesen Wert. Der Anfangswert des Parameters ist undefiniert --- lesen Sie ihn nicht, bevor Sie schreiben.

```c
// out-Parameter -- Funktion füllt den Wert
bool TryFindPlayer(string name, out PlayerBase player)
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int i = 0; i < players.Count(); i++)
    {
        PlayerBase pb = PlayerBase.Cast(players[i]);
        if (pb && pb.GetIdentity() && pb.GetIdentity().GetName() == name)
        {
            player = pb;
            return true;
        }
    }

    player = null;
    return false;
}

// Verwendung:
PlayerBase result;
if (TryFindPlayer("John", result))
{
    Print(result.GetIdentity().GetName());
}
```

Die Vanilla-Scripts verwenden `out` ausgiebig für den Engine-zu-Script-Datenfluss:

```c
// Aus DayZPlayer (3_game/dayzplayer.c)
proto native void GetCurrentCameraTransform(out vector position, out vector direction, out vector rotation);

// Aus AIWorld (3_game/ai/aiworld.c)
proto native bool RaycastNavMesh(vector from, vector to, PGFilter pgFilter, out vector hitPos, out vector hitNormal);

// Mehrere out-Parameter für Blickgrenzen
proto void GetLookLimits(out float pDown, out float pUp, out float pLeft, out float pRight);
```

### inout-Parameter

Das Schlüsselwort `inout` markiert einen Parameter, der von der Funktion sowohl **gelesen als auch geschrieben** wird. Der Wert des Aufrufers ist innerhalb der Funktion verfügbar, und alle Änderungen sind danach für den Aufrufer sichtbar.

```c
// inout -- die Funktion liest den aktuellen Wert und ändert ihn
void ClampHealth(inout float health)
{
    if (health < 0)
        health = 0;
    if (health > 100)
        health = 100;
}

// Verwendung:
float hp = 150.0;
ClampHealth(hp);
Print(hp);  // 100.0
```

Vanilla-Beispiele für `inout`:

```c
// Aus enmath.c -- Glättungsfunktion liest und schreibt Geschwindigkeit
proto static float SmoothCD(float val, float target, inout float velocity[],
    float smoothTime, float maxVelocity, float dt);

// Aus enscript.c -- Parsing ändert den Eingabestring
proto int ParseStringEx(inout string input, string token);

// Aus Pawn (3_game/entities/pawn.c) -- Transform wird gelesen und geändert
event void GetTransform(inout vector transform[4])
```

### notnull-Parameter

Das Schlüsselwort `notnull` teilt dem Compiler (und der Engine) mit, dass der Parameter nicht `null` sein darf. Wenn ein null-Wert übergeben wird, stürzt das Spiel mit einem Fehler ab, anstatt stillschweigend mit ungültigen Daten fortzufahren.

```c
void ProcessEntity(notnull EntityAI entity)
{
    // Sicher entity ohne Null-Prüfung zu verwenden -- Engine garantiert es
    string name = entity.GetType();
    Print(name);
}
```

Vanilla verwendet `notnull` stark in engine-nahen Funktionen:

```c
// Aus envisual.c
proto native void SetBone(notnull IEntity ent, int bone, vector angles, vector trans, float scale);
proto native bool GetBoneMatrix(notnull IEntity ent, int bone, vector mat[4]);

// Aus DamageSystem
static bool GetDamageZoneFromComponentName(notnull EntityAI entity, string component, out string damageZone);
```

Sie können `notnull` mit `out` kombinieren:

```c
// Aus universaltemperaturesourcelambdabaseimpl.c
override void DryItemsInVicinity(UniversalTemperatureSourceSettings pSettings, vector position,
    out notnull array<EntityAI> nearestObjects);
```

---

## Rückgabewerte

### Einzelner Rückgabewert

Funktionen geben einen einzelnen Wert zurück. Der Rückgabetyp wird vor dem Funktionsnamen deklariert.

```c
float GetDistanceBetween(vector a, vector b)
{
    return vector.Distance(a, b);
}
```

### void (Keine Rückgabe)

Verwenden Sie `void` für Funktionen, die eine Aktion ausführen, ohne Daten zurückzugeben.

```c
void LogMessage(string msg)
{
    Print(string.Format("[MyMod] %1", msg));
}
```

### Objekte zurückgeben

Wenn eine Funktion ein Objekt zurückgibt, gibt sie eine **Referenz** zurück (keine Kopie). Der Aufrufer erhält einen Zeiger auf dasselbe Objekt im Speicher.

```c
EntityAI SpawnItem(string className, vector pos)
{
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    return item;  // Aufrufer erhält eine Referenz auf dasselbe Objekt
}
```

### Mehrere Rückgabewerte über out-Parameter

Wenn Sie mehr als einen Wert zurückgeben müssen, verwenden Sie `out`-Parameter. Dies ist ein universelles Muster im DayZ-Scripting.

```c
void GetTimeComponents(float totalSeconds, out int hours, out int minutes, out int seconds)
{
    hours = (int)(totalSeconds / 3600);
    minutes = (int)((totalSeconds % 3600) / 60);
    seconds = (int)(totalSeconds % 60);
}

// Verwendung:
int h, m, s;
GetTimeComponents(3725, h, m, s);
// h == 1, m == 2, s == 5
```

### ACHTUNG: JsonFileLoader gibt void zurück

Eine häufige Falle: `JsonFileLoader<T>.JsonLoadFile()` gibt `void` zurück, nicht das geladene Objekt. Sie müssen ein vorab erstelltes Objekt als `ref`-Parameter übergeben.

```c
// FALSCH -- wird nicht kompilieren
MyConfig config = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// RICHTIG -- ein ref-Objekt übergeben
MyConfig config = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
```

---

## Standard-Parameterwerte

Enforce Script unterstützt Standardwerte für Parameter. Parameter mit Standardwerten müssen **nach** allen erforderlichen Parametern kommen.

```c
void SpawnItem(string className, vector pos, float quantity = -1, bool withAttachments = true)
{
    // quantity ist standardmäßig -1 (voll), withAttachments standardmäßig true
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    if (item && quantity >= 0)
        item.SetQuantity(quantity);
}

// Alle diese Aufrufe sind gültig:
SpawnItem("AKM", myPos);                   // verwendet beide Standardwerte
SpawnItem("AKM", myPos, 0.5);             // benutzerdefinierte Menge, Standard-Attachments
SpawnItem("AKM", myPos, -1, false);        // Menge muss angegeben werden, um Attachments zu erreichen
```

### Standardwerte aus Vanilla

Die Vanilla-Scripts verwenden Standardparameter ausgiebig:

```c
// Aus Weather (3_game/weather.c)
proto native void Set(float forecast, float time = 0, float minDuration = 0);
proto native void SetDynVolFogDistanceDensity(float value, float time = 0);

// Aus UAInput (3_game/inputapi/uainput.c)
proto native float SyncedValue_ID(int action, bool check_focus = true);
proto native bool SyncedPress(string action, bool check_focus = true);

// Aus DbgUI (1_core/proto/dbgui.c)
static bool FloatOverride(string id, inout float value, float min, float max,
    int precision = 1000, bool sameLine = true);

// Aus InputManager (2_gamelib/inputmanager.c)
proto native external bool ActivateAction(string actionName, int duration = 0);
```

### Einschränkungen

1. **Nur Literalwerte** --- Sie können keine Ausdrücke, Funktionsaufrufe oder andere Variablen als Standardwerte verwenden:

```c
// FALSCH -- keine Ausdrücke in Standardwerten
void MyFunc(float speed = Math.PI * 2)  // KOMPILIERFEHLER

// RICHTIG -- verwenden Sie ein Literal
void MyFunc(float speed = 6.283)
```

2. **Keine benannten Parameter** --- Sie können keinen Parameter nach Namen überspringen. Um den dritten Standardwert zu setzen, müssen Sie alle vorhergehenden Parameter angeben:

```c
void Configure(int a = 1, int b = 2, int c = 3) {}

Configure(1, 2, 10);  // muss a und b angeben, um c zu setzen
// Es gibt keine Syntax wie Configure(c: 10)
```

3. **Standardwerte für Klassentypen sind auf `null` oder `NULL` beschränkt:**

```c
void DoWork(EntityAI target = null, string name = "")
{
    if (!target) return;
    // ...
}
```

---

## Proto-Native-Methoden (Engine-Bindungen)

Proto-Native-Methoden werden im Script deklariert, aber **in der C++-Engine implementiert**. Sie bilden die Brücke zwischen Ihrem Enforce-Script-Code und der DayZ-Spiel-Engine. Sie rufen sie wie normale Methoden auf, können aber ihre Implementierung nicht sehen oder ändern.

### Modifikator-Referenz

| Modifikator | Bedeutung | Beispiel |
|----------|---------|---------|
| `proto native` | In C++-Engine-Code implementiert | `proto native void SetPosition(vector pos);` |
| `proto native owned` | Gibt einen Wert zurück, den der Aufrufer besitzt (Speicher verwaltet) | `proto native owned string GetType();` |
| `proto native external` | In einem anderen Modul definiert | `proto native external bool AddSettings(typename cls);` |
| `proto volatile` | Hat Seiteneffekte; Compiler darf nicht optimieren | `proto volatile int Call(Class inst, string fn, void parm);` |
| `proto` (ohne `native`) | Interne Funktion, kann native sein oder auch nicht | `proto int ParseString(string input, out string tokens[]);` |

### proto native

Der häufigste Modifikator. Dies sind einfache Engine-Aufrufe.

```c
// Position setzen/abrufen (Object)
proto native void SetPosition(vector pos);
proto native vector GetPosition();

// KI-Pfadfindung (AIWorld)
proto native bool FindPath(vector from, vector to, PGFilter pgFilter, out TVectorArray waypoints);
proto native bool SampleNavmeshPosition(vector position, float maxDistance, PGFilter pgFilter,
    out vector sampledPosition);
```

### proto native owned

Der `owned`-Modifikator bedeutet, dass der Rückgabewert von der Engine allokiert wird und **das Eigentum an das Script übertragen wird**. Dies wird hauptsächlich für `string`-Rückgaben verwendet, bei denen die Engine einen neuen String erstellt, den der Garbage Collector des Scripts später freigeben muss.

```c
// Aus Class (enscript.c) -- gibt einen String zurück, den das Script nun besitzt
proto native owned external string ClassName();

// Aus Widget (enwidgets.c)
proto native owned string GetName();
proto native owned string GetTypeName();
proto native owned string GetStyleName();

// Aus Object (3_game/entities/object.c)
proto native owned string GetLODName(LOD lod);
proto native owned string GetActionComponentName(int componentIndex, string geometry = "");
```

### proto native external

Der `external`-Modifikator zeigt an, dass die Funktion in einem anderen Script-Modul definiert ist. Dies ermöglicht modulübergreifende Methodendeklarationen.

```c
// Aus Settings (2_gamelib/settings.c)
proto native external bool AddSettings(typename settingsClass);

// Aus InputManager (2_gamelib/inputmanager.c)
proto native external bool RegisterAction(string actionName);
proto native external float LocalValue(string actionName);
proto native external bool ActivateAction(string actionName, int duration = 0);
```

### proto volatile

Der `volatile`-Modifikator teilt dem Compiler mit, dass die Funktion **Seiteneffekte** haben kann oder **in das Script zurückrufen** kann (Re-Entrancy erzeugt). Der Compiler muss den vollständigen Kontext beim Aufruf beibehalten.

```c
// Aus ScriptModule (enscript.c) -- dynamische Funktionsaufrufe, die Script aufrufen können
proto volatile int Call(Class inst, string function, void parm);
proto volatile int CallFunction(Class inst, string function, out void returnVal, void parm);

// Aus typename (enconvert.c) -- erstellt eine neue Instanz dynamisch
proto volatile Class Spawn();

// Kontrolle abgeben
proto volatile void Idle();
```

### Proto-Native-Methoden aufrufen

Sie rufen sie wie jede andere Methode auf. Die Schlüsselregel: **Versuchen Sie nie, eine proto-native-Methode zu überschreiben oder neu zu definieren**. Sie sind feste Engine-Bindungen.

```c
// Proto-Native-Methoden aufrufen -- kein Unterschied zu Script-Methoden
Object obj = GetGame().CreateObject("AKM", pos, false, false, true);
vector position = obj.GetPosition();
string typeName = obj.GetType();     // owned string -- wird Ihnen zurückgegeben
obj.SetPosition(newPos);             // native void -- keine Rückgabe
```

---

## Statisch vs. Instanz-Methoden

### Wann Statisch verwenden

Verwenden Sie statische Methoden, wenn die Funktion keine Instanzdaten benötigt:

```c
class StringUtils
{
    // Reine Hilfsfunktion -- kein Zustand benötigt
    static bool IsNullOrEmpty(string s)
    {
        return s == "" || s.Length() == 0;
    }

    static string PadLeft(string s, int totalWidth, string padChar = "0")
    {
        while (s.Length() < totalWidth)
            s = padChar + s;
        return s;
    }
}
```

**Häufige statische Anwendungsfälle:**
- **Hilfsfunktionen** --- Mathematik-Helfer, String-Formatierer, Validierungsprüfungen
- **Factory-Methoden** --- `Create()`, die eine neue konfigurierte Instanz zurückgibt
- **Singleton-Zugriffsmethoden** --- `GetInstance()`, die die einzelne Instanz zurückgibt
- **Konstanten/Lookups** --- `Init()` + `Cleanup()` für statische Datentabellen

### Singleton-Muster (Statisch + Instanz)

Viele DayZ-Manager kombinieren statisch und Instanz:

```c
class NotificationManager
{
    private static ref NotificationManager s_Instance;

    static NotificationManager GetInstance()
    {
        if (!s_Instance)
            s_Instance = new NotificationManager;
        return s_Instance;
    }

    // Instanzmethoden für die eigentliche Arbeit
    void ShowNotification(string text, float duration)
    {
        // ...
    }
}

// Verwendung:
NotificationManager.GetInstance().ShowNotification("Hallo", 5.0);
```

### Wann Instanz verwenden

Verwenden Sie Instanzmethoden, wenn die Funktion Zugriff auf den Zustand des Objekts benötigt:

```c
class SupplyDrop
{
    protected vector m_DropPosition;
    protected float m_DropRadius;
    protected ref array<string> m_LootTable;

    // Benötigt m_DropPosition, m_DropRadius -- muss Instanz sein
    bool IsInDropZone(vector testPos)
    {
        return vector.Distance(m_DropPosition, testPos) <= m_DropRadius;
    }

    // Benötigt m_LootTable -- muss Instanz sein
    string GetRandomItem()
    {
        return m_LootTable.GetRandomElement();
    }
}
```

---

## Methodenüberschreibung

Wenn eine Kindklasse das Verhalten einer Elternmethode ändern muss, verwendet sie das Schlüsselwort `override`.

### Grundlegende Überschreibung

```c
class BaseModule
{
    void OnInit()
    {
        Print("[BaseModule] Initialisiert");
    }

    void OnUpdate(float dt)
    {
        // Standard: nichts tun
    }
}

class CombatModule extends BaseModule
{
    override void OnInit()
    {
        super.OnInit();  // zuerst Eltern aufrufen
        Print("[CombatModule] Kampfsystem bereit");
    }

    override void OnUpdate(float dt)
    {
        super.OnUpdate(dt);
        // benutzerdefinierte Kampflogik
        CheckCombatState();
    }
}
```

### Regeln für Überschreibung

1. **`override`-Schlüsselwort ist erforderlich** --- ohne es erstellen Sie eine neue Methode, die die Elternmethode verdeckt, anstatt sie zu ersetzen.

2. **Signatur muss exakt übereinstimmen** --- gleicher Rückgabetyp, gleiche Parametertypen, gleiche Parameteranzahl.

3. **`super.MethodenName()` ruft das Elternteil auf** --- verwenden Sie dies, um Verhalten zu erweitern, anstatt es komplett zu ersetzen.

4. **Private Methoden können nicht überschrieben werden** --- sie sind für Kindklassen unsichtbar.

5. **Protected-Methoden können überschrieben werden** --- Kindklassen sehen sie und können sie überschreiben.

```c
class Parent
{
    private void SecretMethod() {}    // kann nicht überschrieben werden
    protected void InternalWork() {}  // kann von Kindern überschrieben werden
    void PublicWork() {}              // kann von jedem überschrieben werden
}

class Child extends Parent
{
    // override void SecretMethod() {}   // KOMPILIERFEHLER -- private
    override void InternalWork() {}      // OK -- protected ist sichtbar
    override void PublicWork() {}        // OK -- public
}
```

### ACHTUNG: override vergessen

Wenn Sie `override` weglassen, kann der Compiler eine Warnung ausgeben, wird aber **keinen Fehler** erzeugen. Ihre Methode wird stillschweigend zu einer neuen Methode, anstatt die des Elternteils zu ersetzen. Die Version des Elternteils läuft, wann immer das Objekt über eine Elterntyp-Variable referenziert wird.

```c
class Animal
{
    void Speak() { Print("..."); }
}

class Dog extends Animal
{
    // SCHLECHT: Fehlendes override -- erstellt eine NEUE Methode
    void Speak() { Print("Wuff!"); }

    // GUT: Überschreibt korrekt
    override void Speak() { Print("Wuff!"); }
}
```

---

## Methodenüberladung (nicht unterstützt)

**Enforce Script unterstützt keine Methodenüberladung.** Sie können nicht zwei Methoden mit demselben Namen aber unterschiedlichen Parameterlisten haben. Der Versuch verursacht einen Kompilierfehler.

```c
class Calculator
{
    // KOMPILIERFEHLER -- doppelter Methodenname
    int Add(int a, int b) { return a + b; }
    float Add(float a, float b) { return a + b; }  // NICHT ERLAUBT
}
```

### Workaround 1: Verschiedene Methodennamen

Der häufigste Ansatz ist die Verwendung beschreibender Namen:

```c
class Calculator
{
    int AddInt(int a, int b) { return a + b; }
    float AddFloat(float a, float b) { return a + b; }
}
```

### Workaround 2: Die Ex()-Konvention

DayZ-Vanilla und Mods folgen einer Namenskonvention, bei der eine erweiterte Version einer Methode `Ex` an den Namen anhängt:

```c
// Aus Vanilla-Scripts -- Basisversion vs. erweiterte Version
void ExplosionEffects(Object source, Object directHit, int componentIndex);
void ExplosionEffectsEx(Object source, Object directHit, int componentIndex,
    float energyFactor, float explosionFactor, HitInfo hitInfo);

// Aus EntityAI
void SplitIntoStackMax(EntityAI destination_entity, int slot_id);
void SplitIntoStackMaxEx(EntityAI destination_entity, int slot_id);
```

### Workaround 3: Standardparameter

Wenn der Unterschied nur optionale Parameter sind, verwenden Sie stattdessen Standardwerte:

```c
class Spawner
{
    // Statt Überladungen Standardwerte verwenden
    void SpawnAt(vector pos, float radius = 0, string filter = "")
    {
        // eine Methode behandelt alle Fälle
    }
}
```

---

## Das event-Schlüsselwort

Das `event`-Schlüsselwort markiert eine Methode als **Engine-Event-Handler** --- eine Funktion, die die C++-Engine zu bestimmten Zeitpunkten aufruft (Entity-Erstellung, Animations-Events, Physik-Callbacks, usw.). Es ist ein Hinweis für Tools (wie Workbench), dass die Methode als Script-Event exponiert werden sollte.

```c
// Aus Pawn (3_game/entities/pawn.c)
protected event void OnPossess()
{
    // wird von der Engine aufgerufen, wenn ein Controller diesen Pawn übernimmt
}

protected event void OnUnPossess()
{
    // wird von der Engine aufgerufen, wenn der Controller diesen Pawn freigibt
}

event void GetTransform(inout vector transform[4])
{
    // Engine ruft dies auf, um den Transform der Entity abzurufen
}
```

Sie überschreiben typischerweise Event-Methoden in Kindklassen, anstatt sie von Grund auf zu definieren:

```c
class MyVehicle extends Transport
{
    override event void GetTransform(inout vector transform[4])
    {
        // benutzerdefinierte Transform-Logik bereitstellen
        super.GetTransform(transform);
    }
}
```

Die wichtigste Erkenntnis: `event` ist ein Deklarationsmodifikator, nichts, das Sie aufrufen. Die Engine ruft Event-Methoden zum passenden Zeitpunkt auf.

---

## Thread-Methoden (Coroutinen)

Das Schlüsselwort `thread` erstellt eine **Coroutine** --- eine Funktion, die die Ausführung yielden und später fortsetzen kann. Trotz des Namens ist Enforce Script **single-threaded**. Thread-Methoden sind kooperative Coroutinen, keine Betriebssystem-Threads.

### Deklarieren und Starten eines Threads

Sie starten einen Thread, indem Sie eine Funktion mit dem `thread`-Schlüsselwort vor dem Aufruf aufrufen:

```c
class Monitor
{
    void Start()
    {
        thread MonitorLoop();
    }

    void MonitorLoop()
    {
        while (true)
        {
            CheckStatus();
            Sleep(1000);  // für 1000 Millisekunden yielden
        }
    }
}
```

Das `thread`-Schlüsselwort steht beim **Aufruf**, nicht bei der Funktionsdeklaration. Die Funktion selbst ist eine normale Funktion --- was sie zur Coroutine macht, ist, wie Sie sie aufrufen.

### Sleep() und Yielding

Innerhalb einer Thread-Funktion pausiert `Sleep(milliseconds)` die Ausführung und yieldet zu anderem Code. Wenn die Schlafzeit abgelaufen ist, wird der Thread an der Stelle fortgesetzt, an der er aufgehört hat.

### Threads beenden

Sie können einen laufenden Thread mit `KillThread()` beenden:

```c
// Aus enscript.c
proto native int KillThread(Class owner, string name);

// Verwendung:
KillThread(this, "MonitorLoop");  // stoppt die MonitorLoop-Coroutine
```

Der `owner` ist das Objekt, das den Thread gestartet hat (oder `null` für globale Threads). Der `name` ist der Funktionsname.

### Wann Threads verwenden (und wann nicht)

**Bevorzugen Sie `CallLater` und Timer gegenüber Threads.** Thread-Coroutinen haben Einschränkungen:
- Sie sind schwerer zu debuggen (Stack-Traces sind weniger klar)
- Sie verbrauchen einen Coroutinen-Slot, der bis zur Fertigstellung oder zum Kill bestehen bleibt
- Sie können nicht serialisiert oder über Netzwerkgrenzen übertragen werden

Verwenden Sie Threads nur, wenn Sie wirklich eine langläufige Schleife mit Zwischen-Yields benötigen. Für einmalige verzögerte Aktionen verwenden Sie `CallLater` (siehe unten).

---

## Verzögerte Aufrufe mit CallLater

`CallLater` plant einen Funktionsaufruf, der nach einer Verzögerung ausgeführt wird. Es ist die primäre Alternative zu Thread-Coroutinen und wird im Vanilla-DayZ ausgiebig verwendet.

### Syntax

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(FunktionZumAufrufen, delayMs, repeat, ...params);
```

| Parameter | Typ | Beschreibung |
|-----------|------|-------------|
| Function | `func` | Die aufzurufende Methode |
| Delay | `int` | Millisekunden vor dem Aufruf |
| Repeat | `bool` | `true` für Wiederholung im Intervall, `false` für einmalig |
| Params | variadisch | Parameter, die an die Funktion übergeben werden |

### Aufrufkategorien

| Kategorie | Zweck |
|----------|---------|
| `CALL_CATEGORY_SYSTEM` | Allgemeiner Zweck, läuft jeden Frame |
| `CALL_CATEGORY_GUI` | UI-bezogene Callbacks |
| `CALL_CATEGORY_GAMEPLAY` | Gameplay-Logik-Callbacks |

### Beispiele aus Vanilla

```c
// Einmaliger verzögerter Aufruf (3_game/entities/entityai.c)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeferredInit, 34);

// Wiederholter Aufruf -- Login-Countdown jede Sekunde (3_game/dayzgame.c)
GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.LoginTimeCountdown, 1000, true);

// Verzögerte Löschung mit Parameter (4_world/entities/explosivesbase)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeleteSafe, delayFor * 1000, false);

// UI verzögerter Callback (3_game/gui/hints/uihintpanel.c)
m_Game.GetCallQueue(CALL_CATEGORY_GUI).CallLater(SlideshowThread, m_SlideShowDelay);
```

### Geplante Aufrufe entfernen

Um einen geplanten Aufruf vor seiner Ausführung abzubrechen:

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).Remove(FunktionZumAufrufen);
```

---

## Bewährte Praktiken

1. **Halten Sie Funktionen kurz** --- zielen Sie auf unter 50 Zeilen. Wenn eine Funktion länger ist, extrahieren Sie Hilfsmethoden.

2. **Verwenden Sie Guard-Klauseln für frühzeitige Rückkehr** --- prüfen Sie Vorbedingungen am Anfang und kehren Sie frühzeitig zurück. Das reduziert Verschachtelung und macht den "glücklichen Pfad" leichter lesbar.

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player) return;
    if (!player.IsAlive()) return;
    if (!player.GetIdentity()) return;

    // eigentliche Logik hier, unverschachtelt
    string name = player.GetIdentity().GetName();
    // ...
}
```

3. **Bevorzugen Sie out-Parameter gegenüber komplexen Rückgabetypen** --- wenn eine Funktion Erfolg/Misserfolg plus Daten kommunizieren muss, verwenden Sie einen `bool`-Rückgabewert mit `out`-Parametern.

4. **Verwenden Sie statisch für zustandslose Hilfsfunktionen** --- wenn eine Methode nicht auf `this` zugreift, machen Sie sie `static`. Das dokumentiert die Absicht und ermöglicht Aufrufe ohne Instanz.

5. **Dokumentieren Sie proto-native-Einschränkungen** --- wenn Sie einen proto-native-Aufruf wrappen, notieren Sie in Kommentaren, was die Engine-Funktion kann und was nicht.

6. **Bevorzugen Sie CallLater gegenüber Thread-Coroutinen** --- `CallLater` ist einfacher, leichter abzubrechen und weniger fehleranfällig.

7. **Rufen Sie immer super in Überschreibungen auf** --- es sei denn, Sie möchten absichtlich das Elternverhalten komplett ersetzen. DayZs tiefe Vererbungsketten hängen davon ab, dass `super`-Aufrufe durch die Hierarchie propagieren.

---

## In echten Mods beobachtet

> Muster bestätigt durch die Untersuchung professioneller DayZ-Mod-Quellcodes.

| Muster | Mod | Detail |
|---------|-----|--------|
| `TryGet___()` gibt `bool` mit `out`-Param zurück | COT / Expansion | Konsistentes Muster für nullable Lookups: `true`/`false` zurückgeben, `out`-Param bei Erfolg füllen |
| `MethodEx()` für erweiterte Signaturen | Vanilla / Expansion Market | Wenn eine API mehr Parameter braucht, `Ex` anhängen statt bestehende Aufrufer zu brechen |
| Statische `Init()` + `Cleanup()`-Klassenmethoden | Expansion / VPP | Manager-Klassen initialisieren statische Daten in `Init()` und räumen in `Cleanup()` auf, aufgerufen aus dem Missions-Lebenszyklus |
| Guard-Klausel `if (!GetGame()) return` am Methodenanfang | COT Admin Tools | Jede Methode, die die Engine berührt, beginnt mit Null-Prüfungen, um Abstürze beim Shutdown zu vermeiden |
| Singleton `GetInstance()` mit Lazy-Erstellung | COT / Expansion / Dabs | Manager exponieren `static ref`-Instanz mit `GetInstance()`-Zugriff, erstellt beim ersten Zugriff |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|---------|---------|
| Methodenüberladung | Standard-OOP-Feature | Nicht unterstützt; verwenden Sie `Ex()`-Suffix oder Standardparameter stattdessen |
| `thread` erstellt OS-Threads | Schlüsselwort suggeriert Parallelismus | Single-threaded Coroutinen mit kooperativem Yielding via `Sleep()` |
| `out`-Parameter sind nur-schreiben | Sollten den Anfangswert nicht lesen | Mancher Vanilla-Code liest den `out`-Param vor dem Schreiben; sicherer ist, ihn immer defensiv als `inout` zu behandeln |
| `override` ist optional | Könnte abgeleitet werden | Weglassen erstellt stillschweigend eine neue Methode statt zu überschreiben; immer einschließen |
| Standardparameter-Ausdrücke | Sollten Funktionsaufrufe unterstützen | Nur Literalwerte (`42`, `true`, `null`, `""`) sind erlaubt; keine Ausdrücke |

---

## Häufige Fehler

### 1. override beim Ersetzen einer Elternmethode vergessen

Ohne `override` wird Ihre Methode zu einer neuen Methode, die die des Elternteils verdeckt. Die Version des Elternteils wird weiterhin aufgerufen, wenn das Objekt über einen Elterntyp referenziert wird.

```c
// SCHLECHT -- erstellt stillschweigend eine neue Methode
class CustomPlayer extends PlayerBase
{
    void OnConnect() { Print("Benutzerdefiniert!"); }
}

// GUT -- überschreibt korrekt
class CustomPlayer extends PlayerBase
{
    override void OnConnect() { Print("Benutzerdefiniert!"); }
}
```

### 2. Erwarten, dass out-Parameter vorinitialisiert sind

Ein `out`-Parameter hat keinen garantierten Anfangswert. Lesen Sie ihn nie, bevor Sie schreiben.

```c
// SCHLECHT -- out-Param lesen, bevor er gesetzt ist
void GetData(out int value)
{
    if (value > 0)  // FALSCH -- value ist hier undefiniert
        return;
    value = 42;
}

// GUT -- immer zuerst schreiben, dann lesen
void GetData(out int value)
{
    value = 42;
}
```

### 3. Versuchen, Methoden zu überladen

Enforce Script unterstützt keine Überladung. Zwei Methoden mit demselben Namen verursachen einen Kompilierfehler.

```c
// KOMPILIERFEHLER
void Process(int id) {}
void Process(string name) {}

// RICHTIG -- verschiedene Namen verwenden
void ProcessById(int id) {}
void ProcessByName(string name) {}
```

### 4. Rückgabe einer void-Funktion zuweisen

Manche Funktionen (insbesondere `JsonFileLoader.JsonLoadFile`) geben `void` zurück. Den Versuch, ihr Ergebnis zuzuweisen, verursacht einen Kompilierfehler.

```c
// KOMPILIERFEHLER -- JsonLoadFile gibt void zurück
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// RICHTIG
MyConfig cfg = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
```

### 5. Ausdrücke in Standardparametern verwenden

Standardparameterwerte müssen Kompilierzeit-Literale sein. Ausdrücke, Funktionsaufrufe und Variablenreferenzen sind nicht erlaubt.

```c
// KOMPILIERFEHLER -- Ausdruck im Standardwert
void SetTimeout(float seconds = GetDefaultTimeout()) {}
void SetAngle(float rad = Math.PI) {}

// RICHTIG -- nur Literalwerte
void SetTimeout(float seconds = 30.0) {}
void SetAngle(float rad = 3.14159) {}
```

### 6. super in Überschreibungsketten vergessen

DayZs Klassenhierarchien sind tief. Das Weglassen von `super` in einer Überschreibung kann Funktionalität mehrere Ebenen weiter oben in der Kette brechen, von der Sie nicht einmal wussten, dass sie existiert.

```c
// SCHLECHT -- bricht Eltern-Initialisierung
class MyMission extends MissionServer
{
    override void OnInit()
    {
        // super.OnInit() vergessen -- Vanilla-Initialisierung läuft nie!
        Print("Meine Mission gestartet");
    }
}

// GUT
class MyMission extends MissionServer
{
    override void OnInit()
    {
        super.OnInit();  // Vanilla + andere Mods zuerst initialisieren lassen
        Print("Meine Mission gestartet");
    }
}
```

---

## Kurzreferenztabelle

| Feature | Syntax | Anmerkungen |
|---------|--------|-------|
| Instanzmethode | `void DoWork()` | Hat Zugriff auf `this` |
| Statische Methode | `static void DoWork()` | Aufgerufen über `ClassName.DoWork()` |
| Per-Wert-Param | `void Fn(int x)` | Kopie für Primitive; Ref-Kopie für Objekte |
| `out`-Param | `void Fn(out int x)` | Nur-Schreiben; Aufrufer erhält Wert |
| `inout`-Param | `void Fn(inout float x)` | Lesen + Schreiben; Aufrufer sieht Änderungen |
| `notnull`-Param | `void Fn(notnull EntityAI e)` | Stürzt bei null ab |
| Standardwert | `void Fn(int x = 5)` | Nur Literale, keine Ausdrücke |
| Überschreibung | `override void Fn()` | Muss Eltern-Signatur entsprechen |
| Eltern aufrufen | `super.Fn()` | Innerhalb des Override-Rumpfes |
| Proto Native | `proto native void Fn()` | In C++ implementiert |
| Owned-Rückgabe | `proto native owned string Fn()` | Script verwaltet zurückgegebenen Speicher |
| External | `proto native external void Fn()` | In anderem Modul definiert |
| Volatile | `proto volatile void Fn()` | Kann in Script zurückrufen |
| Event | `event void Fn()` | Von der Engine aufgerufener Callback |
| Thread starten | `thread MyFunc()` | Startet Coroutine (kein OS-Thread) |
| Thread beenden | `KillThread(owner, "FnName")` | Stoppt eine laufende Coroutine |
| Verzögerter Aufruf | `CallLater(Fn, delay, repeat)` | Gegenüber Threads bevorzugt |
| `Ex()`-Konvention | `void FnEx(...)` | Erweiterte Version von `Fn` |

---

## Navigation

| Zurück | Hoch | Weiter |
|----------|----|------|
| [1.12 Fallstricke](12-gotchas.md) | [Teil 1: Enforce Script](../README.md) | -- |
