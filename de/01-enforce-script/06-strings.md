# Kapitel 1.6: String-Operationen

[Startseite](../../README.md) | [<< Zurück: Kontrollfluss](05-control-flow.md) | **String-Operationen** | [Weiter: Mathematik & Vektoren >>](07-math-vectors.md)

---

## Einführung

Strings in Enforce Script sind ein **Werttyp**, wie `int` oder `float`. Sie werden per Wert übergeben und per Wert verglichen. Der `string`-Typ verfügt über eine umfangreiche Menge eingebauter Methoden zum Suchen, Aufteilen, Konvertieren und Formatieren von Text. Dieses Kapitel ist eine vollständige Referenz für jede verfügbare String-Operation in DayZ-Scripting, mit praxisnahen Beispielen aus der Mod-Entwicklung.

---

## String-Grundlagen

```c
// Deklaration und Initialisierung
string empty;                          // "" (leerer String standardmäßig)
string greeting = "Hallo, Chernarus!";
string combined = "Spieler: " + "John"; // Verkettung mit +

// Strings sind Werttypen -- Zuweisung erstellt eine Kopie
string original = "DayZ";
string copy = original;
copy = "Arma";
Print(original); // Immer noch "DayZ"
```

---

## Vollständige String-Methodenreferenz

### Length

Gibt die Anzahl der Zeichen im String zurück.

```c
string s = "Hello";
int len = s.Length(); // 5

string empty = "";
int emptyLen = empty.Length(); // 0
```

### Substring

Extrahiert einen Teil des Strings. Parameter: `start` (Index), `length` (Anzahl der Zeichen).

```c
string s = "Hello World";
string word = s.Substring(6, 5);  // "World"
string first = s.Substring(0, 5); // "Hello"

// Von einer Position bis zum Ende extrahieren
string rest = s.Substring(6, s.Length() - 6); // "World"
```

### IndexOf

Findet das erste Vorkommen eines Teilstrings. Gibt den Index zurück, oder `-1` wenn nicht gefunden.

```c
string s = "Hello World";
int idx = s.IndexOf("World");     // 6
int notFound = s.IndexOf("DayZ"); // -1
```

### IndexOfFrom

Findet das erste Vorkommen ab einem gegebenen Index.

```c
string s = "one-two-one-two";
int first = s.IndexOf("one");        // 0
int second = s.IndexOfFrom(1, "one"); // 8
```

### LastIndexOf

Findet das letzte Vorkommen eines Teilstrings.

```c
string path = "profiles/MyMod/Players/player.json";
int lastSlash = path.LastIndexOf("/"); // 23
```

### Contains

Gibt `true` zurück, wenn der String den gegebenen Teilstring enthält.

```c
string chatMsg = "!teleport 100 0 200";
if (chatMsg.Contains("!teleport"))
{
    Print("Teleport-Befehl erkannt");
}
```

### Replace

Ersetzt alle Vorkommen eines Teilstrings. **Ändert den String direkt** und gibt die Anzahl der vorgenommenen Ersetzungen zurück.

```c
string s = "Hello World World";
int count = s.Replace("World", "DayZ");
// s ist jetzt "Hello DayZ DayZ"
// count ist 2
```

### Split

Teilt einen String an einem Trennzeichen und füllt ein Array. Das Array sollte vorher erstellt werden.

```c
string csv = "AK101,M4A1,UMP45,Mosin9130";
TStringArray weapons = new TStringArray;
csv.Split(",", weapons);
// weapons = ["AK101", "M4A1", "UMP45", "Mosin9130"]

// Chat-Befehl nach Leerzeichen aufteilen
string chatLine = "!spawn Barrel_Green 5";
TStringArray parts = new TStringArray;
chatLine.Split(" ", parts);
// parts = ["!spawn", "Barrel_Green", "5"]
string command = parts.Get(0);   // "!spawn"
string itemType = parts.Get(1);  // "Barrel_Green"
int amount = parts.Get(2).ToInt(); // 5
```

### Join (statisch)

Verbindet ein Array von Strings mit einem Trennzeichen.

```c
TStringArray names = {"Alice", "Bob", "Charlie"};
string result = string.Join(", ", names);
// result = "Alice, Bob, Charlie"
```

### Format (statisch)

Erstellt einen String mit nummerierten Platzhaltern `%1` bis `%9`. Dies ist die primäre Art, formatierte Strings in Enforce Script zu erstellen.

```c
string name = "John";
int kills = 15;
float distance = 342.5;

string msg = string.Format("Spieler %1 hat %2 Kills (bester Schuss: %3m)", name, kills, distance);
// msg = "Spieler John hat 15 Kills (bester Schuss: 342.5m)"
```

Platzhalter sind **1-indiziert** (`%1` ist das erste Argument, nicht `%0`). Sie können bis zu 9 Platzhalter verwenden.

```c
string log = string.Format("[%1] %2 :: %3", "MyMod", "INFO", "Server gestartet");
// log = "[MyMod] INFO :: Server gestartet"
```

> **Hinweis:** Es gibt keine `printf`-Formatierung (`%d`, `%f`, `%s`). Nur `%1` bis `%9`.

### ToLower

Konvertiert den String in Kleinbuchstaben. **Ändert direkt** -- gibt KEINEN neuen String zurück.

```c
string s = "Hello WORLD";
s.ToLower();
Print(s); // "hello world"
```

### ToUpper

Konvertiert den String in Großbuchstaben. **Ändert direkt.**

```c
string s = "Hello World";
s.ToUpper();
Print(s); // "HELLO WORLD"
```

### Trim / TrimInPlace

Entfernt führende und abschließende Leerzeichen. **Ändert direkt.**

```c
string s = "  Hello World  ";
s.TrimInPlace();
Print(s); // "Hello World"
```

Es gibt auch `Trim()`, das einen neuen getrimmten String zurückgibt (verfügbar in einigen Engine-Versionen):

```c
string raw = "  padded  ";
string clean = raw.Trim();
// clean = "padded", raw unverändert
```

### Get

Holt ein einzelnes Zeichen an einem Index, zurückgegeben als String.

```c
string s = "DayZ";
string ch = s.Get(0); // "D"
string ch2 = s.Get(3); // "Z"
```

### Set

Setzt ein einzelnes Zeichen an einem Index.

```c
string s = "DayZ";
s.Set(0, "N");
Print(s); // "NayZ"
```

### ToInt

Konvertiert einen numerischen String in einen Integer.

```c
string s = "42";
int num = s.ToInt(); // 42

string bad = "hello";
int zero = bad.ToInt(); // 0 (nicht-numerische Strings geben 0 zurück)
```

### ToFloat

Konvertiert einen numerischen String in einen Float.

```c
string s = "3.14";
float f = s.ToFloat(); // 3.14
```

### ToVector

Konvertiert einen durch Leerzeichen getrennten String aus drei Zahlen in einen Vektor.

```c
string s = "100.5 0 200.3";
vector pos = s.ToVector(); // Vector(100.5, 0, 200.3)
```

---

## String-Vergleich

Strings werden per Wert mit Standardoperatoren verglichen. Der Vergleich ist **groß-/kleinschreibungsempfindlich** und folgt der lexikografischen (Wörterbuch-)Reihenfolge.

```c
string a = "Apple";
string b = "Banana";
string c = "Apple";

bool equal    = (a == c);  // true
bool notEqual = (a != b);  // true
bool less     = (a < b);   // true  ("Apple" < "Banana" lexikografisch)
bool greater  = (b > a);   // true
```

### Groß-/kleinschreibungsunabhängiger Vergleich

Es gibt keinen eingebauten groß-/kleinschreibungsunabhängigen Vergleich. Konvertieren Sie beide Strings zuerst in Kleinbuchstaben:

```c
bool EqualsIgnoreCase(string a, string b)
{
    string lowerA = a;
    string lowerB = b;
    lowerA.ToLower();
    lowerB.ToLower();
    return lowerA == lowerB;
}
```

---

## String-Verkettung

Verwenden Sie den `+`-Operator, um Strings zu verketten. Nicht-String-Typen werden automatisch konvertiert.

```c
string name = "John";
int health = 75;
float distance = 42.5;

string msg = "Spieler " + name + " hat " + health + " HP bei " + distance + "m";
// "Spieler John hat 75 HP bei 42.5m"
```

Für komplexe Formatierung bevorzugen Sie `string.Format()` gegenüber Verkettung -- es ist lesbarer und vermeidet mehrere Zwischenallokationen.

```c
// Bevorzugen Sie dies:
string msg = string.Format("Spieler %1 hat %2 HP bei %3m", name, health, distance);

// Gegenüber diesem:
string msg2 = "Spieler " + name + " hat " + health + " HP bei " + distance + "m";
```

---

## Praxisbeispiele

### Chat-Befehle parsen

```c
void ProcessChatMessage(string sender, string message)
{
    // Leerzeichen trimmen
    message.TrimInPlace();

    // Muss mit ! beginnen
    if (message.Length() == 0 || message.Get(0) != "!")
        return;

    // In Teile aufteilen
    TStringArray parts = new TStringArray;
    message.Split(" ", parts);

    if (parts.Count() == 0)
        return;

    string command = parts.Get(0);
    command.ToLower();

    switch (command)
    {
        case "!heal":
            Print(string.Format("[CMD] %1 verwendet !heal", sender));
            break;

        case "!spawn":
            if (parts.Count() >= 2)
            {
                string itemType = parts.Get(1);
                int quantity = 1;
                if (parts.Count() >= 3)
                    quantity = parts.Get(2).ToInt();

                Print(string.Format("[CMD] %1 spawnt %2 x%3", sender, itemType, quantity));
            }
            break;

        case "!tp":
            if (parts.Count() >= 4)
            {
                float x = parts.Get(1).ToFloat();
                float y = parts.Get(2).ToFloat();
                float z = parts.Get(3).ToFloat();
                vector pos = Vector(x, y, z);
                Print(string.Format("[CMD] %1 teleportiert sich zu %2", sender, pos.ToString()));
            }
            break;
    }
}
```

### Spielernamen für die Anzeige formatieren

```c
string FormatPlayerTag(string name, string clanTag, bool isAdmin)
{
    string result = "";

    if (clanTag.Length() > 0)
    {
        result = "[" + clanTag + "] ";
    }

    result = result + name;

    if (isAdmin)
    {
        result = result + " (Admin)";
    }

    return result;
}
// FormatPlayerTag("John", "DZR", true) => "[DZR] John (Admin)"
// FormatPlayerTag("Jane", "", false)   => "Jane"
```

### Dateipfade erstellen

```c
string BuildPlayerFilePath(string steamId)
{
    return "$profile:MyMod/Players/" + steamId + ".json";
}
```

### Log-Nachrichten bereinigen

```c
string SanitizeForLog(string input)
{
    string safe = input;
    safe.Replace("\n", " ");
    safe.Replace("\r", "");
    safe.Replace("\t", " ");

    // Auf maximale Länge kürzen
    if (safe.Length() > 200)
    {
        safe = safe.Substring(0, 197) + "...";
    }

    return safe;
}
```

### Dateinamen aus einem Pfad extrahieren

```c
string GetFileName(string path)
{
    int lastSlash = path.LastIndexOf("/");
    if (lastSlash == -1)
        lastSlash = path.LastIndexOf("\\");

    if (lastSlash >= 0 && lastSlash < path.Length() - 1)
    {
        return path.Substring(lastSlash + 1, path.Length() - lastSlash - 1);
    }

    return path;
}
// GetFileName("profiles/MyMod/config.json") => "config.json"
```

---

## Bewährte Vorgehensweisen

- Verwenden Sie `string.Format()` mit `%1`..`%9`-Platzhaltern für alle formatierte Ausgaben -- es ist lesbarer und vermeidet Typkonvertierungsfallen der `+`-Verkettung.
- Denken Sie daran, dass `ToLower()`, `ToUpper()` und `Replace()` den String direkt ändern -- kopieren Sie den String zuerst, wenn Sie das Original bewahren müssen.
- Erstellen Sie immer das Zielarray mit `new TStringArray` bevor Sie `Split()` aufrufen -- ein null-Array zu übergeben verursacht einen Absturz.
- Verwenden Sie `Contains()` für einfache Teilstring-Prüfungen und `IndexOf()` nur, wenn Sie die Position benötigen.
- Für groß-/kleinschreibungsunabhängige Vergleiche kopieren Sie beide Strings und rufen `ToLower()` auf jedem auf, bevor Sie vergleichen -- es gibt keinen eingebauten case-insensitiven Vergleich.

---

## In echten Mods beobachtet

> Muster bestätigt durch das Studium professionellen DayZ-Mod-Quellcodes.

| Muster | Mod | Detail |
|---------|-----|--------|
| `Split(" ", parts)` für Chat-Befehl-Parsing | VPP / COT | Alle Chat-Befehlssysteme teilen nach Leerzeichen, dann switch auf `parts.Get(0)` |
| `string.Format` mit `[TAG]`-Präfix | Expansion / Dabs | Log-Nachrichten verwenden immer `string.Format("[%1] %2", tag, msg)` statt Verkettung |
| `"$profile:ModName/"`-Pfadkonvention | COT / Expansion | Dateipfade, die mit `+` erstellt werden, verwenden Schrägstriche und `$profile:`-Präfix, um Backslash-Probleme zu vermeiden |
| `ToLower()` vor Befehlsabgleich | VPP Admin | Benutzereingabe wird vor `switch`/Vergleich in Kleinbuchstaben konvertiert, um gemischte Groß-/Kleinschreibung zu handhaben |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|--------|---------|
| `ToLower()` / `Replace()` Rückgabewert | Erwartet einen neuen String zurückzugeben (wie C#) | Sie ändern direkt und geben `void` oder Anzahl zurück -- eine ständige Fehlerquelle |
| `string.Format`-Platzhalter | `%d`, `%f`, `%s` wie C printf | Nur `%1` bis `%9` funktionieren; C-Stil-Bezeichner werden stillschweigend ignoriert |
| Backslash `\\` in Strings | Standard-Escape-Zeichen | Kann DayZs CParser in JSON-Kontexten beschädigen -- bevorzugen Sie Schrägstriche für Pfade |

---

## Häufige Fehler

| Fehler | Problem | Lösung |
|---------|---------|-----|
| Erwarten, dass `ToLower()` einen neuen String zurückgibt | `ToLower()` ändert direkt, gibt `void` zurück | String zuerst kopieren, dann `ToLower()` auf der Kopie aufrufen |
| Erwarten, dass `ToUpper()` einen neuen String zurückgibt | Wie oben -- ändert direkt | Zuerst kopieren, dann `ToUpper()` auf der Kopie aufrufen |
| Erwarten, dass `Replace()` einen neuen String zurückgibt | `Replace()` ändert direkt, gibt Ersetzungsanzahl zurück | String zuerst kopieren, wenn Sie das Original benötigen |
| `%0` in `string.Format()` verwenden | Platzhalter sind 1-indiziert (`%1` bis `%9`) | Ab `%1` beginnen |
| `%d`, `%f`, `%s` Format-Bezeichner verwenden | C-Stil-Format-Bezeichner funktionieren nicht | `%1`, `%2` usw. verwenden |
| Strings ohne Normalisierung der Groß-/Kleinschreibung vergleichen | `"Hello" != "hello"` | `ToLower()` auf beiden vor dem Vergleich aufrufen |
| Strings als Referenztypen behandeln | Strings sind Werttypen; Zuweisung erstellt eine Kopie | Das ist normalerweise in Ordnung -- beachten Sie nur, dass das Ändern einer Kopie das Original nicht beeinflusst |
| Vergessen, das Array vor `Split()` zu erstellen | `Split()` auf einem null-Array aufzurufen verursacht einen Absturz | Immer: `TStringArray parts = new TStringArray;` vor `Split()` |

---

## Kurzreferenz

```c
// Länge
int len = s.Length();

// Suche
int idx = s.IndexOf("sub");
int idx = s.IndexOfFrom(startIdx, "sub");
int idx = s.LastIndexOf("sub");
bool has = s.Contains("sub");

// Extrahieren
string sub = s.Substring(start, length);
string ch  = s.Get(index);

// Ändern (direkt)
s.Set(index, "x");
int count = s.Replace("old", "new");
s.ToLower();
s.ToUpper();
s.TrimInPlace();

// Teilen & Verbinden
TStringArray parts = new TStringArray;
s.Split(delimiter, parts);
string joined = string.Join(sep, parts);

// Format (statisch, %1-%9 Platzhalter)
string msg = string.Format("Hallo %1, du hast %2 Gegenstände", name, count);

// Konvertierung
int n    = s.ToInt();
float f  = s.ToFloat();
vector v = s.ToVector();

// Vergleich (groß-/kleinschreibungsempfindlich, lexikografisch)
bool eq = (a == b);
bool lt = (a < b);
```

---

[<< 1.5: Kontrollfluss](05-control-flow.md) | [Startseite](../../README.md) | [1.7: Mathematik & Vektoren >>](07-math-vectors.md)
