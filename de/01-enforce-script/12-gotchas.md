# Kapitel 1.12: Was NICHT existiert (Fallstricke)

[Startseite](../README.md) | [<< Zurück: Fehlerbehandlung](11-error-handling.md) | **Fallstricke** | [Weiter: Funktionen & Methoden >>](13-functions-methods.md)

---

## Inhaltsverzeichnis

- [Vollständige Fallstrick-Referenz](#vollständige-fallstrick-referenz)
  1. [Kein ternärer Operator](#1-kein-ternärer-operator)
  2. [Keine do...while-Schleife](#2-keine-dowhile-schleife)
  3. [Kein try/catch/throw](#3-kein-trycatchthrow)
  4. [Keine Mehrfachvererbung](#4-keine-mehrfachvererbung)
  5. [Kein Operator-Overloading (ausser Index)](#5-kein-operator-overloading-ausser-index)
  6. [Keine Lambdas / anonymen Funktionen](#6-keine-lambdas--anonymen-funktionen)
  7. [Keine Delegates / Funktionszeiger (nativ)](#7-keine-delegates--funktionszeiger-nativ)
  8. [Kein String-Escape für Backslash/Anführungszeichen](#8-kein-string-escape-für-backslashanführungszeichen)
  9. [Keine Variablen-Neudeklaration in else-if-Blöcken](#9-keine-variablen-neudeklaration-in-else-if-blöcken)
  10. [Kein Ternär in Variablendeklaration](#10-kein-ternär-in-variablendeklaration)
  11. [Keine mehrzeiligen Funktionsaufrufe](#11-keine-mehrzeiligen-funktionsaufrufe)
  12. [Kein nullptr — verwenden Sie NULL oder null](#12-kein-nullptr--verwenden-sie-null-oder-null)
  13. [switch/case HAT Fall-Through](#13-switchcase-hat-fall-through)
  14. [Keine Standard-Parameter-Ausdrücke](#14-keine-standard-parameter-ausdrücke)
  15. [JsonFileLoader.JsonLoadFile gibt void zurück](#15-jsonfileloaderjsonloadfile-gibt-void-zurück)
  16. [Kein #define-Wert-Substitution](#16-kein-define-wert-substitution)
  17. [Keine Interfaces / abstrakte Klassen (erzwungen)](#17-keine-interfaces--abstrakte-klassen-erzwungen)
  18. [Keine Generics-Einschränkungen](#18-keine-generics-einschränkungen)
  19. [Keine Enum-Validierung](#19-keine-enum-validierung)
  20. [Keine variadischen Parameter](#20-keine-variadischen-parameter)
  21. [Keine verschachtelten Klassendeklarationen](#21-keine-verschachtelten-klassendeklarationen)
  22. [Statische Arrays haben feste Größe](#22-statische-arrays-haben-feste-größe)
  23. [array.Remove ist unsortiert](#23-arrayremove-ist-unsortiert)
  24. [Kein #include — alles via config.cpp](#24-kein-include--alles-via-configcpp)
  25. [Keine Namespaces](#25-keine-namespaces)
  26. [String-Methoden modifizieren in-place](#26-string-methoden-modifizieren-in-place)
  27. [ref-Zyklen verursachen Speicherlecks](#27-ref-zyklen-verursachen-speicherlecks)
  28. [Keine Destruktor-Garantie beim Server-Shutdown](#28-keine-destruktor-garantie-beim-server-shutdown)
  29. [Kein Scope-basiertes Ressourcenmanagement (RAII)](#29-kein-scope-basiertes-ressourcenmanagement-raii)
  30. [GetGame().GetPlayer() gibt null auf dem Server zurück](#30-getgamegetplayer-gibt-null-auf-dem-server-zurück)
  31. [`sealed`-Klassen können nicht erweitert werden (1.28+)](#31-sealed-klassen-können-nicht-erweitert-werden-128)
  32. [Methodenparameter-Limit: Maximal 16 (1.28+)](#32-methodenparameter-limit-maximal-16-128)
  33. [`Obsolete`-Attribut-Warnungen (1.28+)](#33-obsolete-attribut-warnungen-128)
  34. [`int.MIN`-Vergleichsfehler](#34-intmin-vergleichsfehler)
  35. [Boolesche Negation von Array-Elementen schlägt fehl](#35-boolesche-negation-von-array-elementen-schlägt-fehl)
  36. [Komplexer Ausdruck in Array-Zuweisung stürzt ab](#36-komplexer-ausdruck-in-array-zuweisung-stürzt-ab)
  37. [`foreach` auf Methodenrückgabewert stürzt ab](#37-foreach-auf-methodenrückgabewert-stürzt-ab)
  38. [Bitweise vs. Vergleichsoperator-Priorität](#38-bitweise-vs-vergleichsoperator-priorität)
  39. [Leere `#ifdef`/`#ifndef`-Blöcke stürzen ab](#39-leere-ifdefifndef-blöcke-stürzen-ab)
  40. [`GetGame().IsClient()` gibt false während des Ladens zurück](#40-getgameisclient-gibt-false-während-des-ladens-zurück)
  41. [Kompilierfehler-Meldungen zeigen falsche Datei](#41-kompilierfehler-meldungen-zeigen-falsche-datei)
  42. [`crash_*.log`-Dateien sind keine Abstürze](#42-crashlog-dateien-sind-keine-abstürze)
- [Kommend von C++](#kommend-von-c)
- [Kommend von C#](#kommend-von-c-1)
- [Kommend von Java](#kommend-von-java)
- [Kommend von Python](#kommend-von-python)
- [Schnellreferenz-Tabelle](#schnellreferenz-tabelle)
- [Navigation](#navigation)

---

## Vollständige Fallstrick-Referenz

### 1. Kein ternärer Operator

**Was Sie schreiben würden:**
```c
int x = (condition) ? valueA : valueB;
```

**Was passiert:** Kompilierfehler. Der `? :`-Operator existiert nicht.

**Korrekte Lösung:**
```c
int x;
if (condition)
    x = valueA;
else
    x = valueB;
```

---

### 2. Keine do...while-Schleife

**Was Sie schreiben würden:**
```c
do {
    Process();
} while (HasMore());
```

**Was passiert:** Kompilierfehler. Das `do`-Schlüsselwort existiert nicht.

**Korrekte Lösung — Flag-Muster:**
```c
bool first = true;
while (first || HasMore())
{
    first = false;
    Process();
}
```

**Korrekte Lösung — Break-Muster:**
```c
while (true)
{
    Process();
    if (!HasMore())
        break;
}
```

---

### 3. Kein try/catch/throw

**Was Sie schreiben würden:**
```c
try {
    RiskyOperation();
} catch (Exception e) {
    HandleError(e);
}
```

**Was passiert:** Kompilierfehler. Diese Schlüsselwörter existieren nicht.

**Korrekte Lösung:** Guard-Klauseln mit frühzeitigem Return.
```c
void DoOperation()
{
    if (!CanDoOperation())
    {
        ErrorEx("Kann Operation nicht ausführen", ErrorExSeverity.WARNING);
        return;
    }

    // Sicher fortfahren
    RiskyOperation();
}
```

Siehe [Kapitel 1.11 — Fehlerbehandlung](11-error-handling.md) für vollständige Muster.

---

### 4. Keine Mehrfachvererbung

**Was Sie schreiben würden:**
```c
class MyClass extends BaseA, BaseB  // Zwei Basisklassen
```

**Was passiert:** Kompilierfehler. Nur Einfachvererbung wird unterstützt.

**Korrekte Lösung:** Von einer Klasse erben, die andere zusammensetzen:
```c
class MyClass extends BaseA
{
    ref BaseB m_Helper;

    void MyClass()
    {
        m_Helper = new BaseB();
    }
}
```

---

### 5. Kein Operator-Overloading (ausser Index)

**Was Sie schreiben würden:**
```c
Vector3 operator+(Vector3 a, Vector3 b) { ... }
bool operator==(MyClass other) { ... }
```

**Was passiert:** Kompilierfehler. Eigene Operatoren können nicht definiert werden.

**Korrekte Lösung:** Benannte Methoden verwenden:
```c
class MyVector
{
    float x, y, z;

    MyVector Add(MyVector other)
    {
        MyVector result = new MyVector();
        result.x = x + other.x;
        result.y = y + other.y;
        result.z = z + other.z;
        return result;
    }

    bool Equals(MyVector other)
    {
        return (x == other.x && y == other.y && z == other.z);
    }
}
```

**Ausnahme:** Der Index-Operator `[]` kann über `Get(index)`- und `Set(index, value)`-Methoden überladen werden:
```c
class MyContainer
{
    int data[10];

    int Get(int index) { return data[index]; }
    void Set(int index, int value) { data[index] = value; }
}

MyContainer c = new MyContainer();
c[3] = 42;        // Ruft Set(3, 42) auf
int v = c[3];     // Ruft Get(3) auf
```

---

### 6. Keine Lambdas / anonymen Funktionen

**Was Sie schreiben würden:**
```c
array.Sort((a, b) => a.name.CompareTo(b.name));
button.OnClick += () => { DoSomething(); };
```

**Was passiert:** Kompilierfehler. Lambda-Syntax existiert nicht.

**Korrekte Lösung:** Benannte Methoden definieren und als `ScriptCaller` übergeben oder string-basierte Callbacks verwenden:
```c
// Benannte Methode
void OnButtonClick()
{
    DoSomething();
}

// String-basierter Callback (von CallLater, Timern etc. verwendet)
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.OnButtonClick, 1000, false);
```

---

### 7. Keine Delegates / Funktionszeiger (nativ)

**Was Sie schreiben würden:**
```c
delegate void MyCallback(int value);
MyCallback cb = SomeFunction;
cb(42);
```

**Was passiert:** Kompilierfehler. Das `delegate`-Schlüsselwort existiert nicht.

**Korrekte Lösung:** `ScriptCaller`, `ScriptInvoker` oder string-basierte Methodennamen verwenden:
```c
// ScriptCaller (einzelner Callback)
ScriptCaller caller = ScriptCaller.Create(MyFunction);

// ScriptInvoker (Event mit mehreren Abonnenten)
ref ScriptInvoker m_OnEvent = new ScriptInvoker();
m_OnEvent.Insert(MyHandler);
m_OnEvent.Invoke();  // Ruft alle registrierten Handler auf
```

---

### 8. Kein String-Escape für Backslash/Anführungszeichen

**Was Sie schreiben würden:**
```c
string path = "C:\\Users\\folder";
string quote = "He said \"hello\"";
```

**Was passiert:** CParser stürzt ab oder erzeugt fehlerhaften Output. Die `\\`- und `\"`-Escape-Sequenzen brechen den String-Parser.

**Korrekte Lösung:** Backslash- und Anführungszeichen in String-Literalen vollständig vermeiden:
```c
// Schrägstriche für Pfade verwenden
string path = "C:/Users/folder";

// Einfache Anführungszeichen verwenden oder umformulieren, um eingebettete doppelte Anführungszeichen zu vermeiden
string quote = "He said 'hello'";

// String-Verkettung verwenden, wenn Sie absolut Sonderzeichen brauchen
// (immer noch riskant — gruendlich testen)
```

> **Hinweis:** `\n`-, `\r`- und `\t`-Escape-Sequenzen funktionieren. Nur `\\` und `\"` sind fehlerhaft.

---

### 9. Keine Variablen-Neudeklaration in else-if-Blöcken

**Was Sie schreiben würden:**
```c
if (condA)
{
    string msg = "Fall A";
    Print(msg);
}
else if (condB)
{
    string msg = "Fall B";  // Gleicher Variablenname im Geschwisterblock
    Print(msg);
}
```

**Was passiert:** Kompilierfehler: "multiple declaration of variable 'msg'". Enforce Script behandelt Variablen in geschwisterlichen `if`/`else if`/`else`-Blöcken als im selben Scope befindlich.

**Korrekte Lösung — eindeutige Namen:**
```c
if (condA)
{
    string msgA = "Fall A";
    Print(msgA);
}
else if (condB)
{
    string msgB = "Fall B";
    Print(msgB);
}
```

**Korrekte Lösung — vor dem if deklarieren:**
```c
string msg;
if (condA)
{
    msg = "Fall A";
}
else if (condB)
{
    msg = "Fall B";
}
Print(msg);
```

---

### 10. Kein Ternär in Variablendeklaration

Verwandt mit Fallstrick #1, aber spezifisch für Deklarationen:

**Was Sie schreiben würden:**
```c
string label = isAdmin ? "Admin" : "Player";
```

**Korrekte Lösung:**
```c
string label;
if (isAdmin)
    label = "Admin";
else
    label = "Player";
```

---

### 11. Keine mehrzeiligen Funktionsaufrufe

**Was Sie schreiben würden:**
```c
string msg = string.Format(
    "Player %1 at %2",
    name,
    pos
);
```

**Was passiert:** Kompilierfehler. Der Parser von Enforce Script kann Funktionsaufrufe, die über mehrere Zeilen verteilt sind, nicht zuverlässig verarbeiten.

**Korrekte Lösung:**
```c
string msg = string.Format("Player %1 at %2", name, pos);
```

Halten Sie Funktionsaufrufe auf einer einzigen Zeile. Wenn die Zeile zu lang ist, teilen Sie die Arbeit in Zwischenvariablen auf.

---

### 12. Kein nullptr — verwenden Sie NULL oder null

**Was Sie schreiben würden:**
```c
if (obj == nullptr)
```

**Was passiert:** Kompilierfehler. Das `nullptr`-Schlüsselwort existiert nicht.

**Korrekte Lösung:**
```c
if (obj == null)    // Kleinbuchstaben funktioniert
if (obj == NULL)    // Großbuchstaben funktioniert auch
if (!obj)           // Idiomatische Null-Pruefung (bevorzugt)
```

---

### 13. switch/case HAT Fall-Through

Enforce Script switch/case **HAT** Fall-Through, wenn `break` weggelassen wird, genau wie C/C++. Vanilla-Code nutzt Fall-Through absichtlich (biossessionservice.c:182 enthält den Kommentar "Intentionally no break, fall through to connecting").

**Was Sie schreiben würden:**
```c
switch (value)
{
    case 1:
    case 2:
    case 3:
        Print("1, 2 oder 3");  // Alle drei Cases erreichen dies — Fall-Through funktioniert
        break;
}
```

**Dies funktioniert wie erwartet.** Cases 1 und 2 fallen durch zum Handler von Case 3.

**Der Fallstrick:** `break` vergessen, wenn Sie Fall-Through NICHT wollen:
```c
switch (state)
{
    case 0:
        Print("Null");
        // Fehlendes break! Fällt durch zu Case 1
    case 1:
        Print("Eins");
        break;
}
// Wenn state == 0, gibt BEIDES "Null" und "Eins" aus
```

**Regel:** Verwenden Sie immer `break` am Ende jedes Cases, es sei denn, Sie wollen absichtlich Fall-Through. Wenn Sie Fall-Through wollen, fügen Sie einen Kommentar hinzu, um dies klarzustellen.

---

### 14. Keine Standard-Parameter-Ausdrücke

**Was Sie schreiben würden:**
```c
void Spawn(vector pos = GetDefaultPos())    // Ausdruck als Standard
void Spawn(vector pos = Vector(0, 100, 0))  // Konstruktor als Standard
```

**Was passiert:** Kompilierfehler. Standardparameterwerte müssen **Literale** oder `NULL` sein.

**Korrekte Lösung:**
```c
void Spawn(vector pos = "0 100 0")    // String-Literal für Vektor — OK
void Spawn(int count = 5)             // Integer-Literal — OK
void Spawn(float radius = 10.0)      // Float-Literal — OK
void Spawn(string name = "default")   // String-Literal — OK
void Spawn(Object obj = NULL)         // NULL — OK

// Für komplexe Standards, Überladungen verwenden:
void Spawn()
{
    Spawn(GetDefaultPos());  // Die parametrische Version aufrufen
}

void Spawn(vector pos)
{
    // Eigentliche Implementierung
}
```

---

### 15. JsonFileLoader.JsonLoadFile gibt void zurück

**Was Sie schreiben würden:**
```c
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);
// oder:
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg))
```

**Was passiert:** Kompilierfehler. `JsonLoadFile` gibt `void` zurück, nicht das geladene Objekt oder einen bool.

**Korrekte Lösung:**
```c
MyConfig cfg = new MyConfig();  // Zuerst Instanz mit Standardwerten erstellen
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Befüllt cfg in-place
// cfg enthält jetzt geladene Werte (oder hat immer noch Standards, wenn die Datei ungültig war)
```

> **Hinweis:** Die neuere `JsonFileLoader<T>.LoadFile()`-Methode gibt `bool` zurück, aber `JsonLoadFile` (die häufig gesehene Version) tut dies nicht.

---

### 16. Kein #define-Wert-Substitution

**Was Sie schreiben würden:**
```c
#define MAX_PLAYERS 60
#define VERSION_STRING "1.0.0"
int max = MAX_PLAYERS;
```

**Was passiert:** Kompilierfehler. Enforce Script `#define` erstellt nur Existenz-Flags für `#ifdef`-Pruefungen. Es unterstützt keine Wert-Substitution.

**Korrekte Lösung:**
```c
// const für Werte verwenden
const int MAX_PLAYERS = 60;
const string VERSION_STRING = "1.0.0";

// #define nur für bedingte Kompilierungs-Flags verwenden
#define MY_MOD_ENABLED
```

---

### 17. Keine Interfaces / abstrakte Klassen (erzwungen)

**Was Sie schreiben würden:**
```c
interface ISerializable
{
    void Serialize();
    void Deserialize();
}

abstract class BaseProcessor
{
    abstract void Process();
}
```

**Was passiert:** Die Schlüsselwörter `interface` und `abstract` existieren nicht.

**Korrekte Lösung:** Reguläre Klassen mit leeren Basismethoden verwenden:
```c
// "Interface" — Basisklasse mit leeren Methoden
class ISerializable
{
    void Serialize() {}     // In Unterklasse überschreiben
    void Deserialize() {}   // In Unterklasse überschreiben
}

// "Abstrakte" Klasse — gleiches Muster
class BaseProcessor
{
    void Process()
    {
        ErrorEx("BaseProcessor.Process() muss überschrieben werden!", ErrorExSeverity.ERROR);
    }
}

class ConcreteProcessor extends BaseProcessor
{
    override void Process()
    {
        // Tatsächliche Implementierung
    }
}
```

Der Compiler erzwingt NICHT, dass Unterklassen die Basismethoden überschreiben. Das Vergessen des Überschreibens verwendet stillschweigend die leere Basisimplementierung.

---

### 18. Keine Generics-Einschränkungen

**Was Sie schreiben würden:**
```c
class Container<T> where T : EntityAI  // T auf EntityAI einschränken
```

**Was passiert:** Kompilierfehler. Die `where`-Klausel existiert nicht. Template-Parameter akzeptieren jeden Typ.

**Korrekte Lösung:** Zur Laufzeit validieren:
```c
class EntityContainer<Class T>
{
    void Add(T item)
    {
        // Laufzeit-Typpruefung statt Kompilierzeit-Einschränkung
        EntityAI eai;
        if (!Class.CastTo(eai, item))
        {
            ErrorEx("EntityContainer akzeptiert nur EntityAI-Unterklassen");
            return;
        }
        // fortfahren
    }
}
```

---

### 19. Keine Enum-Validierung

**Was Sie schreiben würden:**
```c
EDamageState state = (EDamageState)999;  // Fehler oder Ausnahme erwarten
```

**Was passiert:** Kein Fehler. Jeder `int`-Wert kann einer Enum-Variable zugewiesen werden, auch Werte ausserhalb des definierten Bereichs.

**Korrekte Lösung:** Manuell validieren:
```c
bool IsValidDamageState(int value)
{
    return (value >= EDamageState.PRISTINE && value <= EDamageState.RUINED);
}

int rawValue = LoadFromConfig();
if (IsValidDamageState(rawValue))
{
    EDamageState state = rawValue;
}
else
{
    Print("Ungültiger Schadenszustand: " + rawValue.ToString());
    EDamageState state = EDamageState.PRISTINE;  // Fallback
}
```

---

### 20. Keine variadischen Parameter

**Was Sie schreiben würden:**
```c
void Log(string format, params object[] args)
void Printf(string fmt, ...)
```

**Was passiert:** Kompilierfehler. Variadische Parameter existieren nicht.

**Korrekte Lösung:** `string.Format` mit fester Parameteranzahl verwenden, oder `Param`-Klassen nutzen:
```c
// string.Format unterstützt bis zu 9 Positionsargumente
string msg = string.Format("Spieler %1 bei %2 mit %3 HP", name, pos, hp);

// Für variable Datenmenge ein Array übergeben
void LogMultiple(string tag, array<string> messages)
{
    foreach (string msg : messages)
    {
        Print("[" + tag + "] " + msg);
    }
}
```

---

### 21. Keine verschachtelten Klassendeklarationen

**Was Sie schreiben würden:**
```c
class Outer
{
    class Inner  // Verschachtelte Klasse
    {
        int value;
    }
}
```

**Was passiert:** Kompilierfehler. Klassen können nicht innerhalb anderer Klassen deklariert werden.

**Korrekte Lösung:** Alle Klassen auf oberster Ebene deklarieren, Namenskonventionen verwenden, um Beziehungen zu zeigen:
```c
class MySystem_Config
{
    int value;
}

class MySystem
{
    ref MySystem_Config m_Config;
}
```

---

### 22. Statische Arrays haben feste Größe

**Was Sie schreiben würden:**
```c
int size = GetCount();
int arr[size];  // Dynamische Größe zur Laufzeit
```

**Was passiert:** Kompilierfehler. Statische Array-Größen müssen Kompilierzeit-Konstanten sein.

**Korrekte Lösung:**
```c
// Eine Konstante für statische Arrays verwenden
const int BUFFER_SIZE = 64;
int arr[BUFFER_SIZE];

// Oder dynamische Arrays für Laufzeit-Größenanpassung verwenden
array<int> arr = new array<int>;
arr.Resize(GetCount());
```

---

### 23. array.Remove ist unsortiert

**Was Sie schreiben würden (Reihenfolge-Erhaltung erwartend):**
```c
array<string> items = {"A", "B", "C", "D"};
items.Remove(1);  // Erwartet: {"A", "C", "D"}
```

**Was passiert:** `Remove(index)` tauscht das Element mit dem **letzten** Element und entfernt dann das letzte. Ergebnis: `{"A", "D", "C"}`. Die Reihenfolge wird NICHT beibehalten.

**Korrekte Lösung:**
```c
// RemoveOrdered für Reihenfolge-Erhaltung verwenden (langsamer — verschiebt Elemente)
items.RemoveOrdered(1);  // {"A", "C", "D"} — korrekte Reihenfolge

// RemoveItem zum Finden und Entfernen nach Wert verwenden (ebenfalls geordnet)
items.RemoveItem("B");   // {"A", "C", "D"}
```

---

### 24. Kein #include — alles via config.cpp

**Was Sie schreiben würden:**
```c
#include "MyHelper.c"
#include "Utils/StringUtils.c"
```

**Was passiert:** Keine Wirkung oder Kompilierfehler. Es gibt keine `#include`-Direktive.

**Korrekte Lösung:** Alle Skriptdateien werden über `config.cpp` im `CfgMods`-Eintrag der Mod geladen. Die Dateiladereihenfolge wird durch die Skriptschicht (`3_Game`, `4_World`, `5_Mission`) und die alphabetische Reihenfolge innerhalb jeder Schicht bestimmt.

```cpp
// config.cpp
class CfgMods
{
    class MyMod
    {
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                files[] = { "MyMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

### 25. Keine Namespaces

**Was Sie schreiben würden:**
```c
namespace MyMod { class Config { } }
namespace MyMod.Utils { class StringHelper { } }
```

**Was passiert:** Kompilierfehler. Das `namespace`-Schlüsselwort existiert nicht. Alle Klassen teilen einen einzigen globalen Scope.

**Korrekte Lösung:** Namenspräfixe verwenden, um Konflikte zu vermeiden:
```c
class MyConfig { }          // MyFramework
class MyAI_Config { }       // MyAI-Mod
class MyM_MissionData { }   // MyMissions-Mod
class VPP_AdminConfig { }     // VPP Admin
```

---

### 26. String-Methoden modifizieren in-place

**Was Sie schreiben würden (einen Rückgabewert erwartend):**
```c
string upper = myString.ToUpper();  // Erwartet: gibt neuen String zurück
```

**Was passiert:** `ToUpper()` und `ToLower()` modifizieren den String **in-place** und geben `int` zurück (die Laenge des geaenderten Strings), nicht einen neuen String. Aus enstring.c: `proto int ToLower();` und `proto int ToUpper();`.

**Korrekte Lösung:**
```c
// Zuerst eine Kopie machen, wenn Sie das Original beibehalten müssen
string original = "Hello World";
string upper = original;
upper.ToUpper();  // upper ist jetzt "HELLO WORLD", original unverändert

// Gleich für TrimInPlace
string trimmed = "  hello  ";
trimmed.TrimInPlace();  // "hello"
```

---

### 27. ref-Zyklen verursachen Speicherlecks

**Was Sie schreiben würden:**
```c
class Parent
{
    ref Child m_Child;
}
class Child
{
    ref Parent m_Parent;  // Zirkuläre ref — beide referenzieren einander
}
```

**Was passiert:** Keines der Objekte wird jemals vom Garbage Collector erfasst. Die Referenzzähler erreichen nie Null, weil jedes eine `ref` auf das andere hält.

**Korrekte Lösung:** Eine Seite muss einen rohen (nicht-ref) Zeiger verwenden:
```c
class Parent
{
    ref Child m_Child;  // Parent BESITZT das Kind (ref)
}
class Child
{
    Parent m_Parent;    // Kind REFERENZIERT das Elternteil (roh — kein ref)
}
```

---

### 28. Keine Destruktor-Garantie beim Server-Shutdown

**Was Sie schreiben würden (Bereinigung erwartend):**
```c
void ~MyManager()
{
    SaveData();  // Erwartet, dass dies beim Shutdown läuft
}
```

**Was passiert:** Server-Shutdown kann den Prozess beenden, bevor Destruktoren laufen. Ihr Speichern geschieht nie.

**Korrekte Lösung:** Proaktiv in regelmäßigen Abständen und bei bekannten Lebenszyklus-Events speichern:
```c
class MyManager
{
    void OnMissionFinish()  // Wird vor dem Shutdown aufgerufen
    {
        SaveData();  // Zuverlässiger Speicherpunkt
    }

    void OnUpdate(float dt)
    {
        m_SaveTimer += dt;
        if (m_SaveTimer > 300.0)  // Alle 5 Minuten
        {
            SaveData();
            m_SaveTimer = 0;
        }
    }
}
```

---

### 29. Kein Scope-basiertes Ressourcenmanagement (RAII)

**Was Sie schreiben würden (in C++):**
```c
{
    FileHandle f = OpenFile("test.txt", FileMode.WRITE);
    // f wird automatisch geschlossen, wenn der Scope endet
}
```

**Was passiert:** Enforce Script schliesst Dateihandles nicht, wenn Variablen den Scope verlassen (auch nicht mit `autoptr`).

**Korrekte Lösung:** Ressourcen immer explizit schliessen:
```c
FileHandle fh = OpenFile("$profile:MyMod/data.txt", FileMode.WRITE);
if (fh != 0)
{
    FPrintln(fh, "data");
    CloseFile(fh);  // Muss manuell geschlossen werden!
}
```

---

### 30. GetGame().GetPlayer() gibt null auf dem Server zurück

**Was Sie schreiben würden:**
```c
PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
player.DoSomething();  // ABSTURZ auf dem Server!
```

**Was passiert:** `GetGame().GetPlayer()` gibt den **lokalen** Spieler zurück. Auf einem dedizierten Server gibt es keinen lokalen Spieler — es gibt `null` zurück.

**Korrekte Lösung:** Auf dem Server die Spielerliste durchiterieren:
```c
#ifdef SERVER
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);
    foreach (Man man : players)
    {
        PlayerBase player;
        if (Class.CastTo(player, man))
        {
            player.DoSomething();
        }
    }
#else
    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    if (player)
    {
        player.DoSomething();
    }
#endif
```

---

### 31. `sealed`-Klassen können nicht erweitert werden (1.28+)

Ab DayZ 1.28 erzwingt der Enforce-Script-Compiler das `sealed`-Schlüsselwort. Eine Klasse oder Methode, die als `sealed` markiert ist, kann nicht vererbt oder überschrieben werden. Wenn Sie versuchen, eine sealed-Klasse zu erweitern:

```c
// Wenn BI SomeVanillaClass als sealed markiert:
class MyClass : SomeVanillaClass  // KOMPILIERFEHLER in 1.28+
{
}
```

Prüfen Sie den Vanilla-Script-Dump auf Klassen, die als `sealed` markiert sind, bevor Sie versuchen, von ihnen zu erben. Wenn Sie das Verhalten einer sealed-Klasse ändern müssen, verwenden Sie Komposition (umschliessen Sie die Klasse als Mitglied) anstelle von Vererbung.

---

### 32. Methodenparameter-Limit: Maximal 16 (1.28+)

Enforce Script hatte schon immer ein 16-Parameter-Limit für Methoden, aber vor 1.28 war es ein stiller Pufferüberlauf, der zufällige Abstürze verursachte. Ab 1.28 erzeugt der Compiler einen **harten Fehler**:

```c
// KOMPILIERFEHLER in 1.28+ — überschreitet 16 Parameter
void MyMethod(int a, int b, int c, int d, int e, int f, int g, int h,
              int i, int j, int k, int l, int m, int n, int o, int p,
              int q)  // 17. Parameter = Fehler
{
}
```

**Lösung:** Refaktorieren Sie, um stattdessen eine Klasse oder ein Array zu übergeben.

---

### 33. `Obsolete`-Attribut-Warnungen (1.28+)

DayZ 1.28 führte das `Obsolete`-Attribut ein. Funktionen und Klassen, die mit `[Obsolete]` markiert sind, erzeugen Compiler-Warnungen. Diese APIs funktionieren noch, sind aber für die Entfernung in einem zukünftigen Update vorgesehen. Prüfen Sie Ihre Build-Ausgabe auf Obsolete-Warnungen und migrieren Sie zum empfohlenen Ersatz.

---

### 34. `int.MIN`-Vergleichsfehler

Vergleiche mit `int.MIN` (-2147483648) erzeugen falsche Ergebnisse:

```c
int val = 1;
if (val < int.MIN)  // Ergibt TRUE — sollte false sein
{
    // Dieser Block wird fälschlicherweise ausgeführt
}
```

Vermeiden Sie direkte Vergleiche mit `int.MIN`. Verwenden Sie stattdessen eine gespeicherte Konstante oder vergleichen Sie mit einem bestimmten negativen Wert.

---

### 35. Boolesche Negation von Array-Elementen schlägt fehl

Direkte boolesche Negation von Array-Elementen kompiliert nicht:

```c
array<int> list = {0, 1, 2};
if (!list[1])          // KOMPILIERT NICHT
if (list[1] == 0)      // Funktioniert — expliziten Vergleich verwenden
```

Verwenden Sie immer explizite Gleichheitsprüfungen, wenn Sie Array-Elemente auf Wahrheitswert testen.

---

### 36. Komplexer Ausdruck in Array-Zuweisung stürzt ab

Das direkte Zuweisen eines komplexen Ausdrucks zu einem Array-Element kann einen Segmentierungsfehler verursachen:

```c
// STUERZT ZUR LAUFZEIT AB
m_Values[index] = vector.DistanceSq(posA, posB) <= distSq;

// SICHER — Zwischenvariable verwenden
bool result = vector.DistanceSq(posA, posB) <= distSq;
m_Values[index] = result;
```

Speichern Sie Ergebnisse komplexer Ausdrücke immer in einer lokalen Variablen, bevor Sie sie einem Array zuweisen.

---

### 37. `foreach` auf Methodenrückgabewert stürzt ab

Die Verwendung von `foreach` direkt auf dem Rückgabewert einer Methode verursacht eine Null-Zeiger-Ausnahme bei der zweiten Iteration:

```c
// STUERZT BEIM 2. ELEMENT AB
foreach (string item : GetMyArray())
{
}

// SICHER — zuerst in lokaler Variable speichern
array<string> items = GetMyArray();
foreach (string item : items)
{
}
```

---

### 38. Bitweise vs. Vergleichsoperator-Priorität

Bitweise Operatoren haben **niedrigere** Priorität als Vergleichsoperatoren, nach C/C++-Regeln:

```c
int flags = 5;
int mask = 4;
if (flags & mask == mask)      // FALSCH: wird als flags & (mask == mask) ausgewertet
if ((flags & mask) == mask)    // RICHTIG: immer Klammern verwenden
```

---

### 39. Leere `#ifdef`/`#ifndef`-Blöcke stürzen ab

Leere Präprozessor-Bedingungsblöcke — selbst solche, die nur Kommentare enthalten — verursachen Segmentierungsfehler:

```c
#ifdef SOME_DEFINE
    // Dieser nur-Kommentar-Block verursacht einen SEGFAULT
#endif
```

Fügen Sie immer mindestens eine ausführbare Anweisung ein oder entfernen Sie den Block vollständig.

---

### 40. `GetGame().IsClient()` gibt false während des Ladens zurück

Während der Client-Ladephase gibt `GetGame().IsClient()` **false** und `GetGame().IsServer()` **true** zurück — selbst auf Clients. Verwenden Sie stattdessen `IsDedicatedServer()`:

```c
// UNZUVERLAESSIG während der Ladephase
if (GetGame().IsClient()) { }   // false während des Ladens!
if (GetGame().IsServer()) { }   // true während des Ladens, selbst auf dem Client!

// ZUVERLAESSIG
if (!GetGame().IsDedicatedServer()) { /* Client-Code */ }
if (GetGame().IsDedicatedServer())  { /* Server-Code */ }
```

**Ausnahme:** Wenn Sie Offline-/Singleplayer-Modus unterstützen müssen, gibt `IsDedicatedServer()` auch für Listen-Server false zurück.

---

### 41. Kompilierfehler-Meldungen zeigen falsche Datei

Wenn der Compiler auf eine undefinierte Klasse oder einen Variablen-Namenskonflikt stösst, meldet er den Fehler am **EOF der zuletzt erfolgreich geparsten Datei** — nicht am tatsächlichen Fehlerort. Wenn Sie einen Fehler sehen, der auf eine Datei zeigt, die Sie nicht geändert haben, liegt der echte Fehler in einer Datei, die direkt nach ihr geparst wurde.

---

### 42. `crash_*.log`-Dateien sind keine Abstürze

Log-Dateien mit dem Namen `crash_<datum>_<zeit>.log` enthalten **Laufzeit-Ausnahmen**, keine tatsächlichen Segmentierungsfehler. Die Benennung ist irreführend — es handelt sich um Script-Fehler, nicht um Engine-Abstürze.

---

## Kommend von C++

Wenn Sie C++-Entwickler sind, hier die größten Umstellungen:

| C++-Feature | Enforce-Script-Äquivalent |
|-------------|--------------------------|
| `std::vector` | `array<T>` |
| `std::map` | `map<K,V>` |
| `std::unique_ptr` | `ref` / `autoptr` |
| `dynamic_cast<T*>` | `Class.CastTo()` oder `T.Cast()` |
| `try/catch` | Guard-Klauseln |
| `operator+` | Benannte Methoden (`Add()`) |
| `namespace` | Namenspräfixe (`My`, `VPP_`) |
| `#include` | config.cpp `files[]` |
| RAII | Manuelle Bereinigung in Lebenszyklus-Methoden |
| Mehrfachvererbung | Einfachvererbung + Komposition |
| `nullptr` | `null` / `NULL` |
| Templates mit Einschränkungen | Templates ohne Einschränkungen + Laufzeitpruefungen |
| `do...while` | `while (true) { ... if (!cond) break; }` |

---

## Kommend von C#

| C#-Feature | Enforce-Script-Äquivalent |
|-------------|--------------------------|
| `interface` | Basisklasse mit leeren Methoden |
| `abstract` | Basisklasse + ErrorEx in Basismethoden |
| `delegate` / `event` | `ScriptInvoker` |
| Lambda `=>` | Benannte Methoden |
| `?.` Null-Bedingung | Manuelle Null-Pruefungen |
| `??` Null-Koaleszenz | `if (!x) x = default;` |
| `try/catch` | Guard-Klauseln |
| `using` (IDisposable) | Manuelle Bereinigung |
| Properties `{ get; set; }` | Öffentliche Felder oder explizite Getter/Setter-Methoden |
| LINQ | Manuelle Schleifen |
| `nameof()` | Fest kodierte Strings |
| `async/await` | CallLater / Timer |

---

## Kommend von Java

| Java-Feature | Enforce-Script-Äquivalent |
|-------------|--------------------------|
| `interface` | Basisklasse mit leeren Methoden |
| `try/catch/finally` | Guard-Klauseln |
| Garbage Collection | `ref` + Referenzzählung (kein GC für Zyklen) |
| `@Override` | `override`-Schlüsselwort |
| `instanceof` | `obj.IsInherited(typename)` |
| `package` | Namenspräfixe |
| `import` | config.cpp `files[]` |
| `enum` mit Methoden | `enum` (nur int) + Hilfsklasse |
| `final` | `const` (nur für Variablen) |
| Annotations | Nicht verfügbar |

---

## Kommend von Python

| Python-Feature | Enforce-Script-Äquivalent |
|-------------|--------------------------|
| Dynamische Typisierung | Statische Typisierung (alle Variablen typisiert) |
| `try/except` | Guard-Klauseln |
| `lambda` | Benannte Methoden |
| List Comprehension | Manuelle Schleifen |
| `**kwargs` / `*args` | Feste Parameter |
| Duck Typing | `IsInherited()` / `Class.CastTo()` |
| `__init__` | Konstruktor (gleicher Name wie Klasse) |
| `__del__` | Destruktor (`~ClassName()`) |
| `import` | config.cpp `files[]` |
| Mehrfachvererbung | Einfachvererbung + Komposition |
| `None` | `null` / `NULL` |
| Einrückungsbasierte Blöcke | `{ }`-Klammern |
| f-strings | `string.Format("text %1 %2", a, b)` |

---

## Schnellreferenz-Tabelle

| Feature | Existiert? | Workaround |
|---------|---------|------------|
| Ternär `? :` | Nein | if/else |
| `do...while` | Nein | while + break |
| `try/catch` | Nein | Guard-Klauseln |
| Mehrfachvererbung | Nein | Komposition |
| Operator-Overloading | Nur Index | Benannte Methoden |
| Lambdas | Nein | Benannte Methoden |
| Delegates | Nein | `ScriptInvoker` |
| `\\` / `\"` in Strings | Fehlerhaft | Vermeiden |
| Variablen-Neudeklaration | Fehlerhaft in else-if | Eindeutige Namen oder vor if deklarieren |
| Mehrzeilige Funktionsaufrufe | Unzuverlässiges Parsing | Aufrufe auf einer Zeile halten |
| `nullptr` | Nein | `null` / `NULL` |
| switch Fall-Through | Ja (wie C/C++) | Immer `break` verwenden, ausser bei Absicht |
| Standard-Param-Ausdrücke | Nein | Nur Literale oder NULL |
| `#define`-Werte | Nein | `const` |
| Interfaces | Nein | Leere Basisklasse |
| Generic-Einschränkungen | Nein | Laufzeit-Typpruefungen |
| Enum-Validierung | Nein | Manuelle Bereichsprüfung |
| Variadische Params | Nein | `string.Format` oder Arrays |
| Verschachtelte Klassen | Nein | Oberste Ebene mit Namenspräfixen |
| Variable statische Arrays | Nein | `array<T>` |
| `#include` | Nein | config.cpp `files[]` |
| Namespaces | Nein | Namenspräfixe |
| RAII | Nein | Manuelle Bereinigung |
| `GetGame().GetPlayer()` Server | Gibt null zurück | `GetPlayers()` iterieren |
| `sealed`-Klassenvererbung (1.28+) | Kompilierfehler | Stattdessen Komposition verwenden |
| 17+ Methodenparameter (1.28+) | Kompilierfehler | Klasse oder Array übergeben |
| `[Obsolete]`-APIs (1.28+) | Compiler-Warnung | Zum Ersatz-API migrieren |
| `int.MIN`-Vergleiche | Falsche Ergebnisse | Gespeicherte Konstante verwenden |
| `!array[i]`-Negation | Kompilierfehler | `array[i] == 0` verwenden |
| Komplexer Ausdruck in Array-Zuweisung | Segfault | Zwischenvariable verwenden |
| `foreach` auf Methodenrückgabewert | Null-Zeiger-Absturz | Zuerst in lokaler Variable speichern |
| Bitweise vs. Vergleichspriorität | Falsche Auswertung | Immer Klammern verwenden |
| Leere `#ifdef`-Blöcke | Segfault | Anweisung einfügen oder Block entfernen |
| `IsClient()` während des Ladens | Gibt false zurück | `IsDedicatedServer()` verwenden |
| Kompilierfehler falsche Datei | Irreführender Ort | Datei prüfen, die nach der gemeldeten geparst wird |
| `crash_*.log`-Dateien | Keine echten Abstürze | Es sind Laufzeit-Script-Ausnahmen |

---

## Navigation

| Zurück | Hoch | Weiter |
|----------|----|------|
| [1.11 Fehlerbehandlung](11-error-handling.md) | [Teil 1: Enforce Script](../README.md) | [1.13 Funktionen & Methoden](13-functions-methods.md) |
