# Kapitel 1.5: Kontrollfluss

[Startseite](../README.md) | [<< Zurück: Modded-Klassen](04-modded-classes.md) | **Kontrollfluss** | [Weiter: String-Operationen >>](06-strings.md)

---

## Einführung

Der Kontrollfluss bestimmt die Reihenfolge, in der Ihr Code ausgeführt wird. Enforce Script bietet die bekannten Konstrukte `if/else`, `for`, `while`, `foreach` und `switch` -- allerdings mit mehreren wichtigen Unterschieden zu C/C++, die Sie überraschen werden, wenn Sie nicht darauf vorbereitet sind. Dieses Kapitel behandelt jeden verfügbaren Kontrollfluss-Mechanismus, einschließlich der Fallstricke, die für DayZs Script-Engine einzigartig sind.

---

## if / else / else if

Die `if`-Anweisung wertet einen booleschen Ausdruck aus und führt einen Codeblock aus, wenn das Ergebnis `true` ist. Sie können Bedingungen mit `else if` verketten und einen Fallback mit `else` bereitstellen.

```c
void CheckHealth(PlayerBase player)
{
    float health = player.GetHealth("", "Health");

    if (health > 75)
    {
        Print("Spieler ist gesund");
    }
    else if (health > 25)
    {
        Print("Spieler ist verwundet");
    }
    else
    {
        Print("Spieler ist kritisch");
    }
}
```

### Null-Prüfungen

In Enforce Script werden Objektreferenzen als `false` ausgewertet, wenn sie null sind. Dies ist der Standardweg, um sich gegen Null-Zugriffe zu schützen:

```c
void ProcessItem(EntityAI item)
{
    if (!item)
        return;

    string name = item.GetType();
    Print("Verarbeite: " + name);
}
```

### Logische Operatoren

Kombinieren Sie Bedingungen mit `&&` (UND) und `||` (ODER). Kurzschlussauswertung gilt: Wenn die linke Seite von `&&` `false` ist, wird die rechte Seite nie ausgewertet.

```c
void CheckPlayerState(PlayerBase player)
{
    if (player && player.IsAlive())
    {
        // Sicher -- player wird vor dem Aufruf von IsAlive() auf null geprüft
        Print("Spieler lebt");
    }

    if (player.GetHealth("", "Blood") < 3000 || player.GetHealth("", "Health") < 25)
    {
        Print("Spieler ist in Gefahr");
    }
}
```

### FALLSTRICK: Variablen-Neudeklaration in else-if-Blöcken

Dies ist einer der häufigsten Enforce-Script-Fehler. In den meisten Sprachen sind Variablen, die innerhalb eines `if`-Zweigs deklariert werden, unabhängig von Variablen in einem parallelen `else`-Zweig. **Nicht in Enforce Script.** Das Deklarieren desselben Variablennamens in parallelen `if`/`else if`/`else`-Blöcken verursacht einen **Mehrfachdeklarations-Fehler** zur Kompilierzeit.

```c
// FALSCH -- Kompilierfehler!
void BadExample(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        Car vehicle = Car.Cast(obj);
        vehicle.GetSpeedometer();
    }
    else if (obj.IsKindOf("ItemBase"))
    {
        ItemBase item = ItemBase.Cast(obj);    // OK -- anderer Name
        item.GetQuantity();
    }
    else
    {
        string msg = "Unbekanntes Objekt";         // Erste Deklaration von msg
        Print(msg);
    }
}
```

Moment -- das sieht doch in Ordnung aus, oder? Das Problem tritt auf, wenn Sie **denselben Variablennamen** in zwei Zweigen verwenden:

```c
// FALSCH -- Kompilierfehler: Mehrfachdeklaration von 'result'
void ProcessObject(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        string result = "Es ist ein Auto";
        Print(result);
    }
    else
    {
        string result = "Es ist etwas anderes";  // FEHLER! Gleicher Name wie im if-Block
        Print(result);
    }
}
```

**Die Lösung:** Deklarieren Sie die Variable **vor** der if-Anweisung, oder verwenden Sie eindeutige Namen pro Zweig.

```c
// KORREKT -- Vor dem if deklarieren
void ProcessObject(Object obj)
{
    string result;

    if (obj.IsKindOf("Car"))
    {
        result = "Es ist ein Auto";
    }
    else
    {
        result = "Es ist etwas anderes";
    }

    Print(result);
}
```

---

## for-Schleife

Die `for`-Schleife ist identisch mit der C-Syntax: Initialisierer, Bedingung und Inkrement.

```c
// Zahlen von 0 bis 9 ausgeben
void CountToTen()
{
    for (int i = 0; i < 10; i++)
    {
        Print(i);
    }
}
```

### Über ein Array mit for iterieren

```c
void ListInventory(PlayerBase player)
{
    array<EntityAI> items = new array<EntityAI>;
    player.GetInventory().EnumerateInventory(InventoryTraversalType.PREORDER, items);

    for (int i = 0; i < items.Count(); i++)
    {
        EntityAI item = items.Get(i);
        if (item)
        {
            Print(string.Format("[%1] %2", i, item.GetType()));
        }
    }
}
```

### Verschachtelte for-Schleifen

```c
// Ein Gitter von Objekten spawnen
void SpawnGrid(vector origin, int rows, int cols, float spacing)
{
    for (int r = 0; r < rows; r++)
    {
        for (int c = 0; c < cols; c++)
        {
            vector pos = origin;
            pos[0] = pos[0] + (c * spacing);
            pos[2] = pos[2] + (r * spacing);
            pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

            GetGame().CreateObject("Barrel_Green", pos, false, false, true);
        }
    }
}
```

> **Hinweis:** Deklarieren Sie die Schleifenvariable `i` nicht neu, wenn bereits eine Variable namens `i` im umschließenden Gültigkeitsbereich existiert. Enforce Script behandelt dies als Mehrfachdeklarations-Fehler, selbst in verschachtelten Gültigkeitsbereichen.

---

## while-Schleife

Die `while`-Schleife wiederholt einen Block, solange ihre Bedingung `true` ist. Die Bedingung wird **vor** jeder Iteration ausgewertet.

```c
// Alle toten Zombies aus einer Verfolgungsliste entfernen
void CleanupDeadZombies(array<DayZInfected> zombieList)
{
    int i = 0;
    while (i < zombieList.Count())
    {
        EntityAI eai;
        if (Class.CastTo(eai, zombieList.Get(i)) && !eai.IsAlive())
        {
            zombieList.RemoveOrdered(i);
            // i NICHT inkrementieren -- das nächste Element ist in diesen Index gerutscht
        }
        else
        {
            i++;
        }
    }
}
```

### WARNUNG: Es gibt KEIN do...while in Enforce Script

Das Schlüsselwort `do...while` existiert nicht. Der Compiler wird es ablehnen. Wenn Sie eine Schleife benötigen, die immer mindestens einmal ausgeführt wird, verwenden Sie das unten beschriebene Flag-Muster.

```c
// FALSCH -- Dies wird NICHT kompilieren
do
{
    // Körper
}
while (someCondition);
```

---

## do...while mit einem Flag simulieren

Die Standardlösung ist die Verwendung eines `bool`-Flags, das bei der ersten Iteration `true` ist:

```c
void SimulateDoWhile()
{
    bool first = true;
    int attempts = 0;
    vector spawnPos;

    while (first || !IsPositionSafe(spawnPos))
    {
        first = false;
        attempts++;
        spawnPos = GetRandomPosition();

        if (attempts > 100)
            break;
    }

    Print(string.Format("Sichere Position nach %1 Versuchen gefunden", attempts));
}
```

Ein alternativer Ansatz mit `break`:

```c
void AlternativeDoWhile()
{
    while (true)
    {
        // Körper wird mindestens einmal ausgeführt
        DoSomething();

        // Abbruchbedingung am ENDE prüfen
        if (!ShouldContinue())
            break;
    }
}
```

---

## foreach

Die `foreach`-Anweisung ist die sauberste Art, über Arrays, Maps und statische Arrays zu iterieren. Sie kommt in zwei Formen.

### Einfaches foreach (nur Wert)

```c
void AnnounceItems(array<string> itemNames)
{
    foreach (string name : itemNames)
    {
        Print("Gegenstand gefunden: " + name);
    }
}
```

### foreach mit Index

Beim Iterieren über Arrays empfängt die erste Variable den Index:

```c
void ListPlayers(array<Man> players)
{
    foreach (int idx, Man player : players)
    {
        Print(string.Format("Spieler #%1: %2", idx, player.GetIdentity().GetName()));
    }
}
```

### foreach über Maps

Bei Maps empfängt die erste Variable den Schlüssel und die zweite den Wert:

```c
void PrintScoreboard(map<string, int> scores)
{
    foreach (string playerName, int score : scores)
    {
        Print(string.Format("%1: %2 Kills", playerName, score));
    }
}
```

Sie können auch über Maps nur mit dem Wert iterieren:

```c
void SumScores(map<string, int> scores)
{
    int total = 0;
    foreach (int score : scores)
    {
        total += score;
    }
    Print("Gesamte Kills: " + total);
}
```

### foreach über statische Arrays

```c
void PrintStaticArray()
{
    int numbers[] = {10, 20, 30, 40, 50};

    foreach (int value : numbers)
    {
        Print(value);
    }
}
```

---

## switch / case

Die `switch`-Anweisung vergleicht einen Wert mit einer Liste von `case`-Labels. Sie funktioniert mit `int`, `string`, Enum-Werten und Konstanten.

### Wichtig: KEIN Durchfallen

Anders als in C/C++ fällt Enforce Scripts `switch/case` **NICHT** von einem Case zum nächsten durch. Jeder `case` ist unabhängig. Sie können `break` zur Verdeutlichung einfügen, aber es ist nicht erforderlich, um ein Durchfallen zu verhindern.

```c
void HandleCommand(string command)
{
    switch (command)
    {
        case "heal":
            HealPlayer();
            break;

        case "kill":
            KillPlayer();
            break;

        case "teleport":
            TeleportPlayer();
            break;

        default:
            Print("Unbekannter Befehl: " + command);
            break;
    }
}
```

### switch mit Enums

```c
enum EDifficulty
{
    EASY = 0,
    MEDIUM,
    HARD
};

void SetDifficulty(EDifficulty difficulty)
{
    float zombieMultiplier;

    switch (difficulty)
    {
        case EDifficulty.EASY:
            zombieMultiplier = 0.5;
            break;

        case EDifficulty.MEDIUM:
            zombieMultiplier = 1.0;
            break;

        case EDifficulty.HARD:
            zombieMultiplier = 2.0;
            break;

        default:
            zombieMultiplier = 1.0;
            break;
    }

    Print(string.Format("Zombie-Multiplikator: %1", zombieMultiplier));
}
```

### switch mit Integer-Konstanten

```c
void DescribeWeaponSlot(int slotId)
{
    const int SLOT_SHOULDER = 0;
    const int SLOT_MELEE = 1;
    const int SLOT_PISTOL = 2;

    switch (slotId)
    {
        case SLOT_SHOULDER:
            Print("Primärwaffe");
            break;

        case SLOT_MELEE:
            Print("Nahkampfwaffe");
            break;

        case SLOT_PISTOL:
            Print("Sekundärwaffe");
            break;

        default:
            Print("Unbekannter Slot");
            break;
    }
}
```

> **Denken Sie daran:** Da es kein Durchfallen gibt, können Sie Cases nicht stapeln, um einen Handler zu teilen, wie Sie es in C tun würden. Jeder Case muss seinen eigenen Körper haben.

---

## break und continue

### break

`break` beendet die innerste Schleife (oder den switch-Case) sofort.

```c
// Den ersten Spieler innerhalb von 100 Metern finden
void FindNearbyPlayer(vector origin, array<Man> players)
{
    foreach (Man player : players)
    {
        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < 100)
        {
            Print("Spieler in der Nähe gefunden: " + player.GetIdentity().GetName());
            break; // Suche beenden
        }
    }
}
```

### continue

`continue` überspringt den Rest der aktuellen Iteration und springt zur nächsten.

```c
// Nur lebende Spieler verarbeiten
void HealAllPlayers(array<Man> players)
{
    foreach (Man man : players)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue; // Kein PlayerBase, überspringen

        if (!player.IsAlive())
            continue; // Tot, überspringen

        player.SetHealth("", "Health", 100);
        Print("Geheilt: " + player.GetIdentity().GetName());
    }
}
```

### Verschachtelte Schleifen mit break

`break` beendet nur die innerste Schleife. Um aus verschachtelten Schleifen auszubrechen, verwenden Sie eine Flag-Variable:

```c
void FindItemInGrid(array<array<string>> grid, string target)
{
    bool found = false;

    for (int row = 0; row < grid.Count(); row++)
    {
        for (int col = 0; col < grid.Get(row).Count(); col++)
        {
            if (grid.Get(row).Get(col) == target)
            {
                Print(string.Format("'%1' gefunden bei [%2, %3]", target, row, col));
                found = true;
                break; // Beendet nur die innere Schleife
            }
        }

        if (found)
            break; // Beendet die äußere Schleife
    }
}
```

---

## Thread-Schlüsselwort

Enforce Script hat ein `thread`-Schlüsselwort für asynchrone Ausführung:

```c
// Eine Thread-Funktion deklarieren
thread void LongOperation()
{
    // Dies läuft asynchron
    Sleep(5000);  // 5 Sekunden warten ohne zu blockieren
    Print("Fertig!");
}

// Aufrufen
thread LongOperation();  // Startet ohne den Aufrufer zu blockieren
```

**Wichtig:** `thread` in Enforce Script ist NICHT dasselbe wie Betriebssystem-Threads. Es ist eher wie eine Koroutine --- es läuft auf demselben Thread, kann aber yielden/schlafen, ohne das Spiel zu blockieren. Verwenden Sie für die meisten Mod-Anwendungsfälle `CallLater` anstelle von `thread` --- es ist einfacher und vorhersagbarer.

### Thread vs CallLater

| Eigenschaft | `thread` | `CallLater` |
|---------|----------|-------------|
| Syntax | `thread MyFunc();` | `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunc, delayMs, repeat);` |
| Kann schlafen/yielden | Ja (`Sleep()`) | Nein (feuert einmal oder wiederholt im Intervall) |
| Abbrechbar | Kein eingebauter Abbruch | Ja (`CallQueue.Remove()`) |
| Anwendungsfall | Sequenzielle asynchrone Logik mit Wartezeiten | Verzögerte oder wiederholte Callbacks |

Für die meisten DayZ-Modding-Szenarien ist `CallLater` mit einem Timer der bevorzugte Ansatz. Reservieren Sie `thread` für Fälle, in denen Sie wirklich sequenzielle Logik mit Zwischenpausen benötigen (z.B. eine mehrstufige Animationssequenz).

---

## Bewährte Vorgehensweisen

- Verwenden Sie Schutzklauseln (`if (!x) return;`) am Anfang von Funktionen anstelle tief verschachtelter `if`-Blöcke -- das hält den Happy Path flach und lesbar.
- Deklarieren Sie gemeinsame Variablen vor `if`/`else`-Blöcken, um den Enforce-Script-spezifischen Fehler bei Neudeklaration in parallelen Gültigkeitsbereichen zu vermeiden.
- Verwenden Sie `foreach` für einfache Iteration und `for` mit Index nur, wenn Sie Elemente entfernen oder auf Nachbarn zugreifen müssen.
- Ersetzen Sie `do...while` durch `while (first || condition)` mit einem `bool first = true`-Flag -- dies ist die Standard-Enforce-Script-Lösung.
- Bevorzugen Sie `CallLater` gegenüber `thread` für verzögerte oder wiederholte Aktionen -- es ist abbrechbar, einfacher und vorhersagbarer.

---

## In echten Mods beobachtet

> Muster bestätigt durch das Studium professionellen DayZ-Mod-Quellcodes.

| Muster | Mod | Detail |
|---------|-----|--------|
| Schutzklausel + `continue` in Schleifen | COT / Expansion | Schleifen über Spieler verwenden immer `continue` bei fehlgeschlagenem Cast oder `!IsAlive()` bevor Arbeit getan wird |
| `switch` auf String-Befehle | VPP Admin | Chat-Befehlshandler verwenden `switch(command)` mit String-Cases wie `"!heal"`, `"!tp"` |
| Flag-Variable zum Verlassen verschachtelter Schleifen | Expansion Market | Verwendet `bool found = false` mit Prüfung nach der inneren Schleife, um die äußere Schleife zu verlassen |
| `CallLater` für verzögertes Spawnen | Dabs Framework | Bevorzugt `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater()` gegenüber `thread` |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|--------|---------|
| `do...while`-Schleife | Standard in den meisten C-ähnlichen Sprachen | Existiert nicht in Enforce Script; verursacht einen verwirrenden Kompilierfehler |
| `switch`-Durchfallen | C/C++ Cases fallen ohne `break` durch | Enforce Script Cases sind unabhängig -- Cases zu stapeln teilt keine Handler |
| `thread`-Schlüsselwort | Klingt nach Multithreading | Tatsächlich eine Koroutine auf dem Hauptthread; `Sleep()` yieldet, blockiert nicht |
| Variablengültigkeitsbereich in `if`/`else` | Parallele Blöcke sollten unabhängigen Gültigkeitsbereich haben | Enforce Script behandelt sie als gemeinsamen Gültigkeitsbereich -- derselbe Variablenname in beiden Blöcken ist ein Kompilierfehler |

---

## Häufige Fehler

| Fehler | Problem | Lösung |
|---------|---------|-----|
| `do...while` verwenden | Existiert nicht in Enforce Script | `while` mit einem `bool first = true`-Flag verwenden |
| Gleiche Variable in `if`- und `else`-Blöcken deklarieren | Mehrfachdeklarations-Fehler | Variable vor dem `if` deklarieren |
| Schleifenvariable `i` im verschachtelten Gültigkeitsbereich neu deklarieren | Mehrfachdeklarations-Fehler | Verschiedene Namen verwenden (`i`, `j`, `k`) oder außerhalb deklarieren |
| `switch`-Durchfallen erwarten | Cases sind unabhängig, kein Durchfallen | Jeder Case braucht seinen eigenen vollständigen Handler |
| Array während der Iteration mit `foreach` ändern | Undefiniertes Verhalten, möglicher Absturz | Indexbasierte `for`-Schleife verwenden, wenn Elemente entfernt werden |
| Endlose `while`-Schleife ohne `break` | Server-Freeze / Client-Hänger | Immer sicherstellen, dass die Bedingung schließlich `false` wird, oder `break` verwenden |

---

## Kurzreferenz

```c
// if / else if / else
if (condition) { } else if (other) { } else { }

// for-Schleife
for (int i = 0; i < count; i++) { }

// while-Schleife
while (condition) { }

// do...while simulieren
bool first = true;
while (first || condition) { first = false; /* Körper */ }

// foreach (nur Wert)
foreach (Type value : collection) { }

// foreach (Index + Wert)
foreach (int i, Type value : array) { }

// foreach (Schlüssel + Wert bei Map)
foreach (KeyType key, ValueType val : someMap) { }

// switch/case (kein Durchfallen)
switch (value) { case X: /* ... */ break; default: break; }

// thread (Koroutinen-Stil asynchron)
thread void MyFunc() { Sleep(1000); }
thread MyFunc();  // nicht-blockierender Aufruf
```

---

[<< 1.4: Modded-Klassen](04-modded-classes.md) | [Startseite](../README.md) | [1.6: String-Operationen >>](06-strings.md)
