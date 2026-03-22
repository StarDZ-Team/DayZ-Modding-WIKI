# Kapitel 1.1: Variablen & Typen

[Startseite](../../README.md) | **Variablen & Typen** | [Weiter: Arrays, Maps & Sets >>](02-arrays-maps-sets.md)

---

## Einführung

Enforce Script ist die Skriptsprache der Enfusion-Engine, die von DayZ Standalone verwendet wird. Es handelt sich um eine objektorientierte Sprache mit C-ähnlicher Syntax, die in vielen Aspekten C# ähnelt, aber ihre eigenen, speziellen Typen, Regeln und Einschränkungen mitbringt. Wenn Sie Erfahrung mit C#, Java oder C++ haben, werden Sie sich schnell zurechtfinden --- achten Sie jedoch genau auf die Unterschiede, denn genau dort, wo Enforce Script von diesen Sprachen abweicht, verbergen sich die Fehlerquellen.

Dieses Kapitel behandelt die grundlegenden Bausteine: primitive Typen, wie Variablen deklariert und initialisiert werden und wie die Typkonvertierung funktioniert. Jede Zeile DayZ-Mod-Code beginnt hier.

---

## Primitive Typen

Enforce Script besitzt eine kleine, feste Menge primitiver Typen. Sie können keine neuen Werttypen definieren --- nur Klassen (behandelt in [Kapitel 1.3](03-classes-inheritance.md)).

| Typ | Größe | Standardwert | Beschreibung |
|------|------|---------------|-------------|
| `int` | 32-Bit vorzeichenbehaftet | `0` | Ganzzahlen von -2.147.483.648 bis 2.147.483.647 |
| `float` | 32-Bit IEEE 754 | `0.0` | Gleitkommazahlen |
| `bool` | 1 Bit logisch | `false` | `true` oder `false` |
| `string` | Variabel | `""` (leer) | Text. Unveränderlicher Werttyp --- wird als Wert übergeben, nicht als Referenz |
| `vector` | 3x float | `"0 0 0"` | Drei-Komponenten-Float (x, y, z). Wird als Wert übergeben |
| `typename` | Engine-Referenz | `null` | Eine Referenz auf einen Typ selbst, verwendet für Reflexion |
| `void` | N/A | N/A | Wird nur als Rückgabetyp verwendet, um "gibt nichts zurück" anzuzeigen |

### Typ-Konstanten

Einige Typen stellen nützliche Konstanten bereit:

```c
// int-Grenzen
int maxInt = int.MAX;    // 2147483647
int minInt = int.MIN;    // -2147483648

// float-Grenzen
float smallest = float.MIN;     // kleinster positiver float (~1.175e-38)
float largest  = float.MAX;     // größter float (~3.403e+38)
float lowest   = float.LOWEST;  // negativster float (-3.403e+38)
```

---

## Variablen deklarieren

Variablen werden deklariert, indem der Typ gefolgt vom Namen geschrieben wird. Sie können in einer Anweisung deklarieren und zuweisen oder beides getrennt tun.

```c
void MyFunction()
{
    // Nur Deklaration (wird mit Standardwert initialisiert)
    int health;          // health == 0
    float speed;         // speed == 0.0
    bool isAlive;        // isAlive == false
    string name;         // name == ""

    // Deklaration mit Initialisierung
    int maxPlayers = 60;
    float gravity = 9.81;
    bool debugMode = true;
    string serverName = "My DayZ Server";
}
```

### Das `auto`-Schlüsselwort

Wenn der Typ offensichtlich aus der rechten Seite hervorgeht, können Sie `auto` verwenden, damit der Compiler ihn ableitet:

```c
void Example()
{
    auto count = 10;           // int
    auto ratio = 0.75;         // float
    auto label = "Hello";      // string
    auto player = GetGame().GetPlayer();  // DayZPlayer (oder was GetPlayer zurückgibt)
}
```

Dies ist rein eine Erleichterung --- der Compiler löst den Typ zur Kompilierzeit auf. Es gibt keinen Leistungsunterschied.

### Konstanten

Verwenden Sie das `const`-Schlüsselwort für Werte, die nach der Initialisierung nie geändert werden sollen:

```c
const int MAX_SQUAD_SIZE = 8;
const float SPAWN_RADIUS = 150.0;
const string MOD_PREFIX = "[MyMod]";

void Example()
{
    int a = MAX_SQUAD_SIZE;  // OK: Konstante lesen
    MAX_SQUAD_SIZE = 10;     // FEHLER: kann einer Konstante nicht zuweisen
}
```

Konstanten werden typischerweise auf Dateiebene (ausserhalb einer Funktion) oder als Klassenmitglieder deklariert. Namenskonvention: `UPPER_SNAKE_CASE`.

---

## Arbeiten mit `int`

Ganzzahlen sind der Arbeitstiertyp. DayZ verwendet sie für Artikelanzahlen, Spieler-IDs, Gesundheitswerte (wenn diskretisiert), Enum-Werte, Bitflags und mehr.

```c
void IntExamples()
{
    int count = 5;
    int total = count + 10;     // 15
    int doubled = count * 2;    // 10
    int remainder = 17 % 5;     // 2 (Modulo)

    // Inkrementieren und Dekrementieren
    count++;    // count ist jetzt 6
    count--;    // count ist wieder 5

    // Zusammengesetzte Zuweisung
    count += 3;  // count ist jetzt 8
    count -= 2;  // count ist jetzt 6
    count *= 4;  // count ist jetzt 24
    count /= 6;  // count ist jetzt 4

    // Ganzzahldivision schneidet ab (keine Rundung)
    int result = 7 / 2;    // result == 3, nicht 3.5

    // Bitweise Operationen (für Flags verwendet)
    int flags = 0;
    flags = flags | 0x01;   // Bit 0 setzen
    flags = flags | 0x04;   // Bit 2 setzen
    bool hasBit0 = (flags & 0x01) != 0;  // true
}
```

### Praxisbeispiel: Spieleranzahl

```c
void PrintPlayerCount()
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);
    int count = players.Count();
    Print(string.Format("Players online: %1", count));
}
```

---

## Arbeiten mit `float`

Gleitkommazahlen repräsentieren Dezimalzahlen. DayZ verwendet sie umfangreich für Positionen, Entfernungen, Gesundheitsprozente, Schadenswerte und Timer.

```c
void FloatExamples()
{
    float health = 100.0;
    float damage = 25.5;
    float remaining = health - damage;   // 74.5

    // DayZ-spezifisch: Schadensmultiplikator
    float headMultiplier = 3.0;
    float actualDamage = damage * headMultiplier;  // 76.5

    // Float-Division liefert Dezimalergebnisse
    float ratio = 7.0 / 2.0;   // 3.5

    // Nützliche Mathematik
    float dist = 150.7;
    float rounded = Math.Round(dist);    // 151
    float floored = Math.Floor(dist);    // 150
    float ceiled  = Math.Ceil(dist);     // 151
    float clamped = Math.Clamp(dist, 0.0, 100.0);  // 100
}
```

### Praxisbeispiel: Entfernungspruefung

```c
bool IsPlayerNearby(PlayerBase player, vector targetPos, float radius)
{
    if (!player)
        return false;

    vector playerPos = player.GetPosition();
    float distance = vector.Distance(playerPos, targetPos);
    return distance <= radius;
}
```

---

## Arbeiten mit `bool`

Booleans halten `true` oder `false`. Sie werden in Bedingungen, Flags und zur Zustandsverfolgung verwendet.

```c
void BoolExamples()
{
    bool isAdmin = true;
    bool isBanned = false;

    // Logische Operatoren
    bool canPlay = isAdmin || !isBanned;    // true (ODER, NICHT)
    bool isSpecial = isAdmin && !isBanned;  // true (UND)

    // Negation
    bool notAdmin = !isAdmin;   // false

    // Vergleichsergebnisse sind bool
    int health = 50;
    bool isLow = health < 25;       // false
    bool isHurt = health < 100;     // true
    bool isDead = health == 0;      // false
    bool isAlive = health != 0;     // true
}
```

### Wahrheitswerte in Bedingungen

In Enforce Script können Sie Nicht-Bool-Werte in Bedingungen verwenden. Die folgenden gelten als `false`:
- `0` (int)
- `0.0` (float)
- `""` (leerer String)
- `null` (Null-Objektreferenz)

Alles andere ist `true`. Dies wird häufig für Null-Pruefungen verwendet:

```c
void SafeCheck(PlayerBase player)
{
    // Diese beiden sind äquivalent:
    if (player != null)
        Print("Spieler existiert");

    if (player)
        Print("Spieler existiert");

    // Und diese beiden:
    if (player == null)
        Print("Kein Spieler");

    if (!player)
        Print("Kein Spieler");
}
```

---

## Arbeiten mit `string`

Strings in Enforce Script sind **Werttypen** --- sie werden beim Zuweisen oder Übergeben an Funktionen kopiert, genau wie `int` oder `float`. Dies unterscheidet sich von C# oder Java, wo Strings Referenztypen sind.

```c
void StringExamples()
{
    string greeting = "Hello";
    string name = "Survivor";

    // Verkettung mit +
    string message = greeting + ", " + name + "!";  // "Hello, Survivor!"

    // String-Formatierung (1-indizierte Platzhalter)
    string formatted = string.Format("Player %1 has %2 health", name, 75);
    // Ergebnis: "Player Survivor has 75 health"

    // Länge
    int len = message.Length();    // 17

    // Vergleich
    bool same = (greeting == "Hello");  // true

    // Konvertierung von anderen Typen
    string fromInt = "Score: " + 42;     // funktioniert NICHT -- muss explizit konvertieren
    string correct = "Score: " + 42.ToString();  // "Score: 42"

    // Format verwenden ist der bevorzugte Ansatz
    string best = string.Format("Score: %1", 42);  // "Score: 42"
}
```

### Escape-Sequenzen

Strings unterstützen Standard-Escape-Sequenzen:

| Sequenz | Bedeutung |
|----------|---------|
| `\n` | Zeilenumbruch |
| `\r` | Wagenrücklauf |
| `\t` | Tabulator |
| `\\` | Literaler Backslash |
| `\"` | Literales Anführungszeichen |

**Warnung:** Obwohl diese dokumentiert sind, verursachen Backslash (`\\`) und escapte Anführungszeichen (`\"`) bekanntermaassen Probleme mit dem CParser in bestimmten Kontexten, insbesondere bei JSON-bezogenen Operationen. Wenn Sie mit Dateipfaden oder JSON-Strings arbeiten, vermeiden Sie Backslashes wenn möglich. Verwenden Sie für Pfade Schrägstriche --- DayZ akzeptiert sie auf allen Plattformen.

### Praxisbeispiel: Chat-Nachricht

```c
void SendAdminMessage(string adminName, string text)
{
    string msg = string.Format("[ADMIN] %1: %2", adminName, text);
    Print(msg);
}
```

---

## Arbeiten mit `vector`

Der `vector`-Typ hält drei `float`-Komponenten (x, y, z). Er ist DayZ's grundlegender Typ für Positionen, Richtungen, Rotationen und Geschwindigkeiten. Wie Strings und Primitive sind Vektoren **Werttypen** --- sie werden bei der Zuweisung kopiert.

### Initialisierung

Vektoren können auf zwei Arten initialisiert werden:

```c
void VectorInit()
{
    // Methode 1: String-Initialisierung (drei durch Leerzeichen getrennte Zahlen)
    vector pos1 = "100.5 0 200.3";

    // Methode 2: Vector()-Konstruktorfunktion
    vector pos2 = Vector(100.5, 0, 200.3);

    // Standardwert ist "0 0 0"
    vector empty;   // empty == <0, 0, 0>
}
```

**Wichtig:** Das String-Initialisierungsformat verwendet **Leerzeichen** als Trennzeichen, nicht Kommas. `"1 2 3"` ist gültig; `"1,2,3"` ist es nicht.

### Komponentenzugriff

Greifen Sie auf einzelne Komponenten über Array-ähnliche Indizierung zu:

```c
void VectorComponents()
{
    vector pos = Vector(100.5, 25.0, 200.3);

    // Komponenten lesen
    float x = pos[0];   // 100.5  (Ost/West)
    float y = pos[1];   // 25.0   (Oben/Unten, Höhe)
    float z = pos[2];   // 200.3  (Nord/Sued)

    // Komponenten schreiben
    pos[1] = 50.0;      // Höhe auf 50 ändern
}
```

DayZ-Koordinatensystem:
- `[0]` = X = Ost(+) / West(-)
- `[1]` = Y = Oben(+) / Unten(-) (Höhe über Meeresspiegel)
- `[2]` = Z = Nord(+) / Sued(-)

### Statische Konstanten

```c
vector zero    = vector.Zero;      // "0 0 0"
vector up      = vector.Up;        // "0 1 0"
vector right   = vector.Aside;     // "1 0 0"
vector forward = vector.Forward;   // "0 0 1"
```

### Häufige Vektor-Operationen

```c
void VectorOps()
{
    vector pos1 = Vector(100, 0, 200);
    vector pos2 = Vector(150, 0, 250);

    // Entfernung zwischen zwei Punkten
    float dist = vector.Distance(pos1, pos2);

    // Quadrierte Entfernung (schneller, gut für Vergleiche)
    float distSq = vector.DistanceSq(pos1, pos2);

    // Richtung von pos1 nach pos2
    vector dir = vector.Direction(pos1, pos2);

    // Vektor normalisieren (Länge = 1 machen)
    vector norm = dir.Normalized();

    // Länge eines Vektors
    float len = dir.Length();

    // Lineare Interpolation (50% zwischen pos1 und pos2)
    vector midpoint = vector.Lerp(pos1, pos2, 0.5);

    // Skalarprodukt
    float dot = vector.Dot(dir, vector.Up);
}
```

### Praxisbeispiel: Spawn-Position

```c
// Eine Position auf dem Boden bei gegebenen X,Z-Koordinaten erhalten
vector GetGroundPosition(float x, float z)
{
    vector pos = Vector(x, 0, z);
    pos[1] = GetGame().SurfaceY(x, z);  // Y auf Geländehöhe setzen
    return pos;
}

// Eine zufällige Position innerhalb eines Radius um einen Mittelpunkt erhalten
vector GetRandomPositionAround(vector center, float radius)
{
    float angle = Math.RandomFloat(0, Math.PI2);
    float dist = Math.RandomFloat(0, radius);

    vector offset = Vector(Math.Cos(angle) * dist, 0, Math.Sin(angle) * dist);
    vector pos = center + offset;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
    return pos;
}
```

---

## Arbeiten mit `typename`

Der `typename`-Typ hält eine Referenz auf einen Typ selbst. Er wird für Reflexion verwendet --- das Untersuchen und Arbeiten mit Typen zur Laufzeit. Sie werden ihm begegnen, wenn Sie generische Systeme, Config-Loader und Factory-Muster schreiben.

```c
void TypenameExamples()
{
    // Den typename einer Klasse erhalten
    typename t = PlayerBase;

    // typename aus einem String erhalten
    typename t2 = t.StringToEnum(PlayerBase, "PlayerBase");

    // Typen vergleichen
    if (t == PlayerBase)
        Print("Es ist PlayerBase!");

    // Den typename einer Objektinstanz erhalten
    PlayerBase player;
    // ... angenommen player ist gültig ...
    typename objType = player.Type();

    // Vererbung prüfen
    bool isMan = objType.IsInherited(Man);

    // typename in String umwandeln
    string name = t.ToString();  // "PlayerBase"

    // Eine Instanz aus typename erstellen (Factory-Muster)
    Class instance = t.Spawn();
}
```

### Enum-Konvertierung mit typename

```c
enum DamageType
{
    MELEE = 0,
    BULLET = 1,
    EXPLOSION = 2
};

void EnumConvert()
{
    // Enum zu String
    string name = typename.EnumToString(DamageType, DamageType.BULLET);
    // name == "BULLET"

    // String zu Enum
    int value;
    typename.StringToEnum(DamageType, "EXPLOSION", value);
    // value == 2
}
```

---

## Typkonvertierung

Enforce Script unterstützt sowohl implizite als auch explizite Konvertierungen zwischen Typen.

### Implizite Konvertierungen

Einige Konvertierungen geschehen automatisch:

```c
void ImplicitConversions()
{
    // int zu float (immer sicher, kein Datenverlust)
    int count = 42;
    float fCount = count;    // 42.0

    // float zu int (SCHNEIDET AB, rundet nicht!)
    float precise = 3.99;
    int truncated = precise;  // 3, NICHT 4

    // int/float zu bool
    bool fromInt = 5;      // true (nicht null)
    bool fromZero = 0;     // false
    bool fromFloat = 0.1;  // true (nicht null)

    // bool zu int
    int fromBool = true;   // 1
    int fromFalse = false; // 0
}
```

### Explizite Konvertierungen (Parsing)

Um zwischen Strings und numerischen Typen zu konvertieren, verwenden Sie Parsing-Methoden:

```c
void ExplicitConversions()
{
    // String zu int
    int num = "42".ToInt();           // 42
    int bad = "hello".ToInt();        // 0 (scheitert stillschweigend)

    // String zu float
    float f = "3.14".ToFloat();       // 3.14

    // String zu vector
    vector v = "100 25 200".ToVector();  // <100, 25, 200>

    // Zahl zu String (mit Format)
    string s1 = string.Format("%1", 42);       // "42"
    string s2 = string.Format("%1", 3.14);     // "3.14"

    // int/float .ToString()
    string s3 = (42).ToString();     // "42"
}
```

### Objekt-Casting

Für Klassentypen verwenden Sie `Class.CastTo()` oder `ClassName.Cast()`. Dies wird ausführlich in [Kapitel 1.3](03-classes-inheritance.md) behandelt, aber hier ist das wesentliche Muster:

```c
void CastExample()
{
    Object obj = GetSomeObject();

    // Sicherer Cast (bevorzugt)
    PlayerBase player;
    if (Class.CastTo(player, obj))
    {
        // player ist gültig und sicher verwendbar
        string name = player.GetIdentity().GetName();
    }

    // Alternative Cast-Syntax
    PlayerBase player2 = PlayerBase.Cast(obj);
    if (player2)
    {
        // player2 ist gültig
    }
}
```

---

## Variablen-Gültigkeitsbereich

Variablen existieren nur innerhalb des Codeblocks (geschweifte Klammern), in dem sie deklariert werden. Enforce Script erlaubt es **nicht**, einen Variablennamen in verschachtelten oder geschwisterlichen Scopes erneut zu deklarieren.

```c
void ScopeExample()
{
    int x = 10;

    if (true)
    {
        // int x = 20;  // FEHLER: Neudeklaration von 'x' im verschachtelten Scope
        x = 20;         // OK: das äußere x modifizieren
        int y = 30;     // OK: neue Variable in diesem Scope
    }

    // y ist hier NICHT zugänglich (im inneren Scope deklariert)
    // Print(y);  // FEHLER: undeclared identifier 'y'

    // WICHTIG: dies gilt auch für for-Schleifen
    for (int i = 0; i < 5; i++)
    {
        // i existiert hier
    }
    // for (int i = 0; i < 3; i++)  // FEHLER in DayZ: 'i' bereits deklariert
    // Verwenden Sie einen anderen Namen:
    for (int j = 0; j < 3; j++)
    {
        // j existiert hier
    }
}
```

### Die Geschwister-Scope-Falle

Dies ist eine der berühmtesten Eigenheiten von Enforce Script. Die Deklaration desselben Variablennamens in `if`- und `else`-Blöcken verursacht einen Kompilierfehler:

```c
void SiblingTrap()
{
    if (someCondition)
    {
        int result = 10;    // Hier deklariert
        Print(result);
    }
    else
    {
        // int result = 20; // FEHLER: Mehrfachdeklaration von 'result'
        // Obwohl dies ein Geschwister-Scope ist, nicht derselbe Scope
    }

    // LOESUNG: oberhalb des if/else deklarieren
    int result;
    if (someCondition)
    {
        result = 10;
    }
    else
    {
        result = 20;
    }
}
```

---

## Häufige Fehler

### 1. Nicht initialisierte Variablen in Logik verwendet

Primitive erhalten Standardwerte (`0`, `0.0`, `false`, `""`), aber sich darauf zu verlassen macht Code fragil und schwer lesbar. Initialisieren Sie immer explizit.

```c
// SCHLECHT: auf implizite Null verlassen
int count;
if (count > 0)  // Das funktioniert weil count == 0, aber die Absicht ist unklar
    DoThing();

// GUT: explizite Initialisierung
int count = 0;
if (count > 0)
    DoThing();
```

### 2. Float-zu-Int-Abschneidung

Die Float-zu-Int-Konvertierung schneidet ab (rundet Richtung Null), rundet nicht zur nächsten Zahl:

```c
float f = 3.99;
int i = f;         // i == 3, NICHT 4

// Wenn Sie Rundung wollen:
int rounded = Math.Round(f);  // 4
```

### 3. Float-Präzision bei Vergleichen

Vergleichen Sie Floats niemals auf exakte Gleichheit:

```c
float a = 0.1 + 0.2;
// SCHLECHT: kann aufgrund der Gleitkommadarstellung fehlschlagen
if (a == 0.3)
    Print("Gleich");

// GUT: eine Toleranz (Epsilon) verwenden
if (Math.AbsFloat(a - 0.3) < 0.001)
    Print("Nah genug");
```

### 4. String-Verkettung mit Zahlen

Sie können eine Zahl nicht einfach mit `+` an einen String anhängen. Verwenden Sie `string.Format()`:

```c
int kills = 5;
// Potenziell problematisch:
// string msg = "Kills: " + kills;

// KORREKT: Format verwenden
string msg = string.Format("Kills: %1", kills);
```

### 5. Vektor-String-Format

Die Vektor-String-Initialisierung erfordert Leerzeichen, nicht Kommas:

```c
vector good = "100 25 200";     // KORREKT
// vector bad = "100, 25, 200"; // FALSCH: Kommas werden nicht korrekt geparst
// vector bad2 = "100,25,200";  // FALSCH
```

### 6. Vergessen, dass Strings und Vektoren Werttypen sind

Anders als Klassenobjekte werden Strings und Vektoren bei der Zuweisung kopiert. Das Modifizieren einer Kopie beeinflusst nicht das Original:

```c
vector posA = "10 20 30";
vector posB = posA;       // posB ist eine KOPIE
posB[1] = 99;             // Nur posB ändert sich
// posA ist immer noch "10 20 30"
```

---

## Uebungsaufgaben

### Uebung 1: Variablen-Grundlagen
Deklarieren Sie Variablen zum Speichern von:
- Dem Namen eines Spielers (string)
- Seinem Gesundheitsprozentsatz (float, 0-100)
- Seiner Abschussanzahl (int)
- Ob er ein Admin ist (bool)
- Seiner Weltposition (vector)

Geben Sie eine formatierte Zusammenfassung mit `string.Format()` aus.

### Uebung 2: Temperaturumrechner
Schreiben Sie eine Funktion `float CelsiusToFahrenheit(float celsius)` und ihr Gegenstück `float FahrenheitToCelsius(float fahrenheit)`. Testen Sie mit dem Siedepunkt (100C = 212F) und dem Gefrierpunkt (0C = 32F).

### Uebung 3: Entfernungsrechner
Schreiben Sie eine Funktion, die zwei Vektoren nimmt und zurückgibt:
- Die 3D-Entfernung zwischen ihnen
- Die 2D-Entfernung (Höhe/Y-Achse ignorierend)
- Den Höhenunterschied

Hinweis: Für die 2D-Entfernung erstellen Sie neue Vektoren mit `[1]` auf `0` gesetzt, bevor Sie die Entfernung berechnen.

### Uebung 4: Typ-Jonglieren
Gegeben den String `"42"`, konvertieren Sie ihn zu:
1. Einem `int`
2. Einem `float`
3. Zurück zu einem `string` mit `string.Format()`
4. Einem `bool` (sollte `true` sein, da der int-Wert ungleich null ist)

### Uebung 5: Bodenposition
Schreiben Sie eine Funktion `vector SnapToGround(vector pos)`, die eine beliebige Position nimmt und sie mit der Y-Komponente auf die Geländehöhe an dieser X,Z-Position gesetzt zurückgibt. Verwenden Sie `GetGame().SurfaceY()`.

---

## Zusammenfassung

| Konzept | Kernpunkt |
|---------|-----------|
| Typen | `int`, `float`, `bool`, `string`, `vector`, `typename`, `void` |
| Standardwerte | `0`, `0.0`, `false`, `""`, `"0 0 0"`, `null` |
| Konstanten | `const`-Schlüsselwort, `UPPER_SNAKE_CASE`-Konvention |
| Vektoren | Initialisierung mit `"x y z"`-String oder `Vector(x,y,z)`, Zugriff mit `[0]`, `[1]`, `[2]` |
| Scope | Variablen auf `{}`-Blöcke beschränkt; keine Neudeklaration in verschachtelten/geschwisterlichen Blöcken |
| Konvertierung | `float`-zu-`int` schneidet ab; verwenden Sie `.ToInt()`, `.ToFloat()`, `.ToVector()` für String-Parsing |
| Formatierung | Verwenden Sie immer `string.Format()` zum Erstellen von Strings aus gemischten Typen |

---

[Startseite](../../README.md) | **Variablen & Typen** | [Weiter: Arrays, Maps & Sets >>](02-arrays-maps-sets.md)
