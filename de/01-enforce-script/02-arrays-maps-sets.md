# Kapitel 1.2: Arrays, Maps & Sets

[Startseite](../README.md) | [<< Zurück: Variablen & Typen](01-variables-types.md) | **Arrays, Maps & Sets** | [Weiter: Klassen & Vererbung >>](03-classes-inheritance.md)

---

## Einführung

Echte DayZ-Mods arbeiten mit Sammlungen von Dingen: Listen von Spielern, Inventare von Gegenständen, Zuordnungen von Spieler-IDs zu Berechtigungen, Mengen aktiver Zonen. Enforce Script bietet drei Sammlungstypen, um diese Anforderungen zu erfüllen:

- **`array<T>`** --- Dynamische, geordnete, größenveränderbare Liste (die am häufigsten verwendete Sammlung)
- **`map<K,V>`** --- Schlüssel-Wert-Assoziativcontainer (Hash Map)
- **`set<T>`** --- Geordnete Sammlung mit wertbasiertem Entfernen

Es gibt auch **statische Arrays** (`int arr[5]`) für Daten fester Größe, die zur Kompilierzeit bekannt sind. Dieses Kapitel behandelt alle ausführlich, einschließlich jeder verfügbaren Methode, Iterationsmuster und der subtilen Fallstricke, die echte Fehler in Produktions-Mods verursachen.

---

## Statische Arrays

Statische Arrays haben eine feste Größe, die zur Kompilierzeit festgelegt wird. Sie können nicht wachsen oder schrumpfen. Sie sind nützlich für kleine Sammlungen bekannter Größe und sind speichereffizienter als dynamische Arrays.

### Deklaration und Verwendung

```c
void StaticArrayBasics()
{
    // Mit Literalgröße deklarieren
    int numbers[5];
    numbers[0] = 10;
    numbers[1] = 20;
    numbers[2] = 30;
    numbers[3] = 40;
    numbers[4] = 50;

    // Mit Initialisierungsliste deklarieren
    float damages[3] = {10.5, 25.0, 50.0};

    // Mit const-Größe deklarieren
    const int GRID_SIZE = 4;
    string labels[GRID_SIZE];

    // Auf Elemente zugreifen
    int first = numbers[0];     // 10
    float maxDmg = damages[2];  // 50.0

    // Mit for-Schleife iterieren
    for (int i = 0; i < 5; i++)
    {
        Print(numbers[i]);
    }
}
```

### Regeln für statische Arrays

1. Die Größe muss eine Kompilierzeitkonstante sein (Literal oder `const int`)
2. Sie **können keine** Variable als Größe verwenden: `int arr[myVar]` ist ein Kompilierfehler
3. Der Zugriff auf einen Index außerhalb der Grenzen verursacht undefiniertes Verhalten (keine Laufzeit-Grenzenprüfung)
4. Statische Arrays werden per Referenz an Funktionen übergeben (anders als primitive Typen)

```c
// Statische Arrays als Funktionsparameter
void FillArray(int arr[3])
{
    arr[0] = 100;
    arr[1] = 200;
    arr[2] = 300;
}

void Test()
{
    int myArr[3];
    FillArray(myArr);
    Print(myArr[0]);  // 100 -- das Original wurde geändert (per Referenz übergeben)
}
```

### Wann statische Arrays verwenden

Verwenden Sie statische Arrays für:
- Vektor-/Matrixdaten (`vector mat[3]` für 3x3-Rotationsmatrizen)
- Kleine feste Nachschlagetabellen
- Leistungskritische Hotpaths, bei denen die Allokation wichtig ist

Verwenden Sie dynamische `array<T>` für alles andere.

---

## Dynamische Arrays: `array<T>`

Dynamische Arrays sind die am häufigsten verwendete Sammlung im DayZ-Modding. Sie können zur Laufzeit wachsen und schrumpfen, unterstützen Generics und bieten eine umfangreiche Menge an Methoden.

### Erstellung

```c
void CreateArrays()
{
    // Methode 1: new-Operator
    array<string> names = new array<string>;

    // Methode 2: Initialisierungsliste
    array<int> scores = {100, 85, 92, 78};

    // Methode 3: Typedef verwenden
    TStringArray items = new TStringArray;  // dasselbe wie array<string>

    // Arrays beliebiger Typen
    array<float> distances = new array<float>;
    array<bool> flags = new array<bool>;
    array<vector> positions = new array<vector>;
    array<PlayerBase> players = new array<PlayerBase>;
}
```

### Vordefinierte Typedefs

DayZ bietet Kurzform-Typedefs für die häufigsten Array-Typen:

```c
typedef array<string>  TStringArray;
typedef array<float>   TFloatArray;
typedef array<int>     TIntArray;
typedef array<bool>    TBoolArray;
typedef array<vector>  TVectorArray;
```

`TStringArray` begegnet Ihnen ständig im DayZ-Code --- Config-Parsing, Chat-Nachrichten, Loot-Tabellen und mehr.

---

## Vollständige Array-Methodenreferenz

### Elemente hinzufügen

```c
void AddingElements()
{
    array<string> items = new array<string>;

    // Insert: am Ende anfügen, gibt den neuen Index zurück
    int idx = items.Insert("Bandage");     // idx == 0
    idx = items.Insert("Morphine");        // idx == 1
    idx = items.Insert("Saline");          // idx == 2
    // items: ["Bandage", "Morphine", "Saline"]

    // InsertAt: an bestimmter Position einfügen, verschiebt bestehende Elemente nach rechts
    items.InsertAt("Epinephrine", 1);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline"]

    // InsertAll: alle Elemente aus einem anderen Array anfügen
    array<string> moreItems = {"Tetracycline", "Charcoal"};
    items.InsertAll(moreItems);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline", "Tetracycline", "Charcoal"]
}
```

### Auf Elemente zugreifen

```c
void AccessingElements()
{
    array<string> items = {"Apple", "Banana", "Cherry", "Date"};

    // Get: Zugriff per Index
    string first = items.Get(0);       // "Apple"
    string third = items.Get(2);       // "Cherry"

    // Klammeroperator: dasselbe wie Get
    string second = items[1];          // "Banana"

    // Set: Element an Index ersetzen
    items.Set(1, "Blueberry");         // items[1] ist jetzt "Blueberry"

    // Count: Anzahl der Elemente
    int count = items.Count();         // 4

    // IsValidIndex: Grenzenprüfung
    bool valid = items.IsValidIndex(3);   // true
    bool invalid = items.IsValidIndex(4); // false
    bool negative = items.IsValidIndex(-1); // false
}
```

### Suchen

```c
void SearchingArrays()
{
    array<string> weapons = {"AKM", "M4A1", "Mosin", "IZH18", "AKM"};

    // Find: gibt den ersten Index des Elements zurück, oder -1 wenn nicht gefunden
    int idx = weapons.Find("Mosin");    // 2
    int notFound = weapons.Find("FAL");  // -1

    // Existenz prüfen
    if (weapons.Find("M4A1") != -1)
        Print("M4A1 gefunden!");

    // GetRandomElement: gibt ein zufälliges Element zurück
    string randomWeapon = weapons.GetRandomElement();

    // GetRandomIndex: gibt einen zufälligen gültigen Index zurück
    int randomIdx = weapons.GetRandomIndex();
}
```

### Elemente entfernen

Hier treten die häufigsten Fehler auf. Achten Sie genau auf den Unterschied zwischen `Remove` und `RemoveOrdered`.

```c
void RemovingElements()
{
    array<string> items = {"A", "B", "C", "D", "E"};

    // Remove(index): SCHNELL aber UNGEORDNET
    // Tauscht das Element am Index mit dem LETZTEN Element, verkleinert dann das Array
    items.Remove(1);  // Entfernt "B" durch Tausch mit "E"
    // items ist jetzt: ["A", "E", "C", "D"]  -- REIHENFOLGE GEÄNDERT!

    // RemoveOrdered(index): LANGSAM aber behält die Reihenfolge bei
    // Verschiebt alle Elemente nach dem Index um eins nach links
    items = {"A", "B", "C", "D", "E"};
    items.RemoveOrdered(1);  // Entfernt "B", verschiebt C,D,E nach links
    // items ist jetzt: ["A", "C", "D", "E"]  -- Reihenfolge beibehalten

    // RemoveItem(value): findet das Element und entfernt es (geordnet)
    items = {"A", "B", "C", "D", "E"};
    items.RemoveItem("C");
    // items ist jetzt: ["A", "B", "D", "E"]

    // Clear: alle Elemente entfernen
    items.Clear();
    // items.Count() == 0
}
```

### Größe und Kapazität

```c
void SizingArrays()
{
    array<int> data = new array<int>;

    // Reserve: interne Kapazität vorallokieren (ändert NICHT Count)
    // Verwenden, wenn Sie wissen, wie viele Elemente Sie hinzufügen werden
    data.Reserve(100);
    // data.Count() == 0, aber der interne Puffer ist für 100 Elemente bereit

    // Resize: Count ändern, neue Plätze mit Standardwerten füllen
    data.Resize(10);
    // data.Count() == 10, alle Elemente sind 0

    // Resize kleiner schneidet ab
    data.Resize(5);
    // data.Count() == 5
}
```

### Sortierung und Mischung

```c
void OrderingArrays()
{
    array<int> numbers = {5, 2, 8, 1, 9, 3};

    // Aufsteigend sortieren
    numbers.Sort();
    // numbers: [1, 2, 3, 5, 8, 9]

    // Absteigend sortieren
    numbers.Sort(true);
    // numbers: [9, 8, 5, 3, 2, 1]

    // Invertieren (umkehren) des Arrays
    numbers = {1, 2, 3, 4, 5};
    numbers.Invert();
    // numbers: [5, 4, 3, 2, 1]

    // Zufällig mischen
    numbers.ShuffleArray();
    // numbers: [3, 1, 5, 2, 4]  (zufällige Reihenfolge)
}
```

### Kopieren

```c
void CopyingArrays()
{
    array<string> original = {"A", "B", "C"};

    // Copy: ersetzt den gesamten Inhalt durch eine Kopie eines anderen Arrays
    array<string> copy = new array<string>;
    copy.Copy(original);
    // copy: ["A", "B", "C"]
    // Das Ändern von copy beeinflusst NICHT original

    // InsertAll: fügt an (ersetzt nicht)
    array<string> combined = {"X", "Y"};
    combined.InsertAll(original);
    // combined: ["X", "Y", "A", "B", "C"]
}
```

### Debugging

```c
void DebuggingArrays()
{
    array<string> items = {"Bandage", "Morphine", "Saline"};

    // Debug: gibt alle Elemente im Script-Log aus
    items.Debug();
    // Ausgabe:
    // [0] => Bandage
    // [1] => Morphine
    // [2] => Saline
}
```

---

## Arrays iterieren

### for-Schleife (Indexbasiert)

```c
void ForLoopIteration()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    for (int i = 0; i < items.Count(); i++)
    {
        Print(string.Format("[%1] %2", i, items[i]));
    }
    // [0] AKM
    // [1] M4A1
    // [2] Mosin
}
```

### foreach (nur Wert)

```c
void ForEachValue()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    foreach (string weapon : items)
    {
        Print(weapon);
    }
    // AKM
    // M4A1
    // Mosin
}
```

### foreach (Index + Wert)

```c
void ForEachIndexValue()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    foreach (int i, string weapon : items)
    {
        Print(string.Format("[%1] %2", i, weapon));
    }
    // [0] AKM
    // [1] M4A1
    // [2] Mosin
}
```

### Praxisbeispiel: Den nächsten Spieler finden

```c
PlayerBase FindNearestPlayer(vector origin, float maxRange)
{
    array<Man> allPlayers = new array<Man>;
    GetGame().GetPlayers(allPlayers);

    PlayerBase nearest = null;
    float nearestDist = maxRange;

    foreach (Man man : allPlayers)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue;

        if (!player.IsAlive())
            continue;

        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < nearestDist)
        {
            nearestDist = dist;
            nearest = player;
        }
    }

    return nearest;
}
```

---

## Maps: `map<K,V>`

Maps speichern Schlüssel-Wert-Paare. Sie werden verwendet, wenn Sie einen Wert anhand eines Schlüssels nachschlagen müssen --- Spielerdaten nach UID, Artikelpreise nach Klassenname, Berechtigungen nach Rollenname usw.

### Erstellung

```c
void CreateMaps()
{
    // Standarderstellung
    map<string, int> prices = new map<string, int>;

    // Maps verschiedener Typen
    map<string, float> multipliers = new map<string, float>;
    map<int, string> idToName = new map<int, string>;
    map<string, ref array<string>> categories = new map<string, ref array<string>>;
}
```

### Vordefinierte Map-Typedefs

```c
typedef map<string, int>     TStringIntMap;
typedef map<string, string>  TStringStringMap;
typedef map<int, string>     TIntStringMap;
typedef map<string, float>   TStringFloatMap;
```

---

## Vollständige Map-Methodenreferenz

### Einfügen und Aktualisieren

```c
void MapInsertUpdate()
{
    map<string, int> inventory = new map<string, int>;

    // Insert: ein neues Schlüssel-Wert-Paar hinzufügen
    // Gibt true zurück wenn der Schlüssel neu war, false wenn er bereits existierte
    bool isNew = inventory.Insert("Bandage", 5);    // true (neuer Schlüssel)
    isNew = inventory.Insert("Bandage", 10);         // false (Schlüssel existiert, Wert NICHT aktualisiert)
    // inventory["Bandage"] ist immer noch 5!

    // Set: einfügen ODER aktualisieren (das ist was Sie normalerweise wollen)
    inventory.Set("Bandage", 10);    // Jetzt ist inventory["Bandage"] == 10
    inventory.Set("Morphine", 3);    // Neuer Schlüssel hinzugefügt
    inventory.Set("Morphine", 7);    // Bestehender Schlüssel auf 7 aktualisiert
}
```

**Kritische Unterscheidung:** `Insert()` aktualisiert **keine** bestehenden Schlüssel. `Set()` schon. Im Zweifelsfall verwenden Sie `Set()`.

### Auf Werte zugreifen

```c
void MapAccess()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Get: gibt Wert zurück, oder Standard (0 für int) wenn Schlüssel nicht gefunden
    int akmPrice = prices.Get("AKM");         // 5000
    int falPrice = prices.Get("FAL");          // 0 (nicht gefunden, gibt Standard zurück)

    // Find: sicherer Zugriff, gibt true zurück wenn Schlüssel existiert und setzt den out-Parameter
    int price;
    bool found = prices.Find("M4A1", price);  // found == true, price == 7500
    bool notFound = prices.Find("SVD", price); // notFound == false, price unverändert

    // Contains: prüfen ob Schlüssel existiert (kein Wertzugriff)
    bool hasAKM = prices.Contains("AKM");     // true
    bool hasFAL = prices.Contains("FAL");     // false

    // Count: Anzahl der Schlüssel-Wert-Paare
    int count = prices.Count();  // 3
}
```

### Entfernen

```c
void MapRemove()
{
    map<string, int> data = new map<string, int>;
    data.Set("a", 1);
    data.Set("b", 2);
    data.Set("c", 3);

    // Remove: nach Schlüssel entfernen
    data.Remove("b");
    // data hat jetzt: {"a": 1, "c": 3}

    // Clear: alle Einträge entfernen
    data.Clear();
    // data.Count() == 0
}
```

### Indexbasierter Zugriff

Maps unterstützen positionsbasierten Zugriff, aber dieser ist `O(n)` --- verwenden Sie ihn für die Iteration, nicht für häufige Nachschlagen.

```c
void MapIndexAccess()
{
    map<string, int> data = new map<string, int>;
    data.Set("alpha", 1);
    data.Set("beta", 2);
    data.Set("gamma", 3);

    // Zugriff per internem Index (O(n), Reihenfolge ist Einfügereihenfolge)
    for (int i = 0; i < data.Count(); i++)
    {
        string key = data.GetKey(i);
        int value = data.GetElement(i);
        Print(string.Format("%1 = %2", key, value));
    }
}
```

### Schlüssel und Werte extrahieren

```c
void MapExtraction()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Alle Schlüssel als Array erhalten
    array<string> keys = prices.GetKeyArray();
    // keys: ["AKM", "M4A1", "Mosin"]

    // Alle Werte als Array erhalten
    array<int> values = prices.GetValueArray();
    // values: [5000, 7500, 2000]
}
```

### Praxisbeispiel: Spielerverfolgung

```c
class PlayerTracker
{
    protected ref map<string, vector> m_LastPositions;  // UID -> Position
    protected ref map<string, float> m_PlayTime;        // UID -> Sekunden

    void PlayerTracker()
    {
        m_LastPositions = new map<string, vector>;
        m_PlayTime = new map<string, float>;
    }

    void OnPlayerConnect(string uid)
    {
        m_PlayTime.Set(uid, 0);
    }

    void OnPlayerDisconnect(string uid)
    {
        m_LastPositions.Remove(uid);
        m_PlayTime.Remove(uid);
    }

    void UpdatePlayer(string uid, vector pos, float deltaTime)
    {
        m_LastPositions.Set(uid, pos);

        float current = 0;
        m_PlayTime.Find(uid, current);
        m_PlayTime.Set(uid, current + deltaTime);
    }

    float GetPlayTime(string uid)
    {
        float time = 0;
        m_PlayTime.Find(uid, time);
        return time;
    }
}
```

---

## Sets: `set<T>`

Sets sind geordnete Sammlungen ähnlich wie Arrays, aber mit Semantik, die auf wertbasierte Operationen ausgerichtet ist (Suchen und Entfernen nach Wert). Sie werden seltener verwendet als Arrays und Maps.

```c
void SetExamples()
{
    set<string> activeZones = new set<string>;

    // Insert: ein Element hinzufügen
    activeZones.Insert("NWAF");
    activeZones.Insert("Tisy");
    activeZones.Insert("Balota");

    // Find: gibt Index zurück oder -1
    int idx = activeZones.Find("Tisy");    // 1
    int missing = activeZones.Find("Zelenogorsk");  // -1

    // Get: Zugriff per Index
    string first = activeZones.Get(0);     // "NWAF"

    // Count
    int count = activeZones.Count();       // 3

    // Remove per Index
    activeZones.Remove(0);
    // activeZones: ["Tisy", "Balota"]

    // RemoveItem: per Wert entfernen
    activeZones.RemoveItem("Tisy");
    // activeZones: ["Balota"]

    // Clear
    activeZones.Clear();
}
```

### Wann Set vs Array verwenden

In der Praxis verwenden die meisten DayZ-Modder `array<T>` für fast alles, weil:
- `set<T>` weniger Methoden hat als `array<T>`
- `array<T>` `Find()` zum Suchen und `RemoveItem()` zum wertbasierten Entfernen bietet
- Die API, die Sie benötigen, typischerweise bereits auf `array<T>` vorhanden ist

Verwenden Sie `set<T>`, wenn Ihr Code semantisch eine Menge darstellt (keine bedeutsame Reihenfolge, Fokus auf Zugehörigkeitstests), oder wenn Sie es im Vanilla-DayZ-Code finden und damit interagieren müssen.

---

## Maps iterieren

Maps unterstützen `foreach` für bequeme Iteration:

### foreach mit Schlüssel-Wert

```c
void IterateMap()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);
    scores.Set("Charlie", 180);

    // foreach mit Schlüssel und Wert
    foreach (string name, int score : scores)
    {
        Print(string.Format("%1: %2 Punkte", name, score));
    }
    // Alice: 150 Punkte
    // Bob: 230 Punkte
    // Charlie: 180 Punkte
}
```

### Indexbasierte for-Schleife

```c
void IterateMapByIndex()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);

    for (int i = 0; i < scores.Count(); i++)
    {
        string key = scores.GetKey(i);
        int val = scores.GetElement(i);
        Print(string.Format("%1 = %2", key, val));
    }
}
```

---

## Verschachtelte Sammlungen

Sammlungen können andere Sammlungen enthalten. Wenn Sie Referenztypen (wie Arrays) in einer Map speichern, verwenden Sie `ref` zur Verwaltung der Eigentümerschaft.

```c
class LootTable
{
    // Map von Kategoriename zu Liste von Klassennamen
    protected ref map<string, ref array<string>> m_Categories;

    void LootTable()
    {
        m_Categories = new map<string, ref array<string>>;

        // Kategorie-Arrays erstellen
        ref array<string> medical = new array<string>;
        medical.Insert("Bandage");
        medical.Insert("Morphine");
        medical.Insert("Saline");

        ref array<string> weapons = new array<string>;
        weapons.Insert("AKM");
        weapons.Insert("M4A1");

        m_Categories.Set("medical", medical);
        m_Categories.Set("weapons", weapons);
    }

    string GetRandomFromCategory(string category)
    {
        array<string> items;
        if (!m_Categories.Find(category, items))
            return "";

        if (items.Count() == 0)
            return "";

        return items.GetRandomElement();
    }
}
```

---

## Bewährte Vorgehensweisen

- Verwenden Sie immer `new`, um Sammlungen vor der Verwendung zu instanziieren -- `array<string> items;` ist `null`, nicht leer.
- Bevorzugen Sie `map.Set()` gegenüber `map.Insert()` für Aktualisierungen -- `Insert` ignoriert bestehende Schlüssel stillschweigend.
- Wenn Sie Elemente während der Iteration entfernen, verwenden Sie eine rückwärts laufende `for`-Schleife oder erstellen Sie eine separate Entfernungsliste -- ändern Sie niemals eine Sammlung innerhalb von `foreach`.
- Verwenden Sie `Reserve()`, wenn Sie die erwartete Elementanzahl im Voraus kennen, um wiederholte interne Neuzuweisungen zu vermeiden.
- Schützen Sie jeden Elementzugriff mit `IsValidIndex()` oder einer `Count() > 0`-Prüfung -- Zugriff außerhalb der Grenzen verursacht stille Abstürze.

---

## In echten Mods beobachtet

> Muster bestätigt durch das Studium professionellen DayZ-Mod-Quellcodes.

| Muster | Mod | Detail |
|---------|-----|--------|
| Rückwärts-`for`-Schleife zum Entfernen | Expansion / COT | Immer von `Count()-1` bis `0` iterieren, wenn gefilterte Elemente entfernt werden |
| `map<string, ref ClassName>` für Registrierungen | Dabs Framework | Alle Manager-Registrierungen verwenden `ref` in Map-Werten, um Objekte am Leben zu halten |
| `TStringArray`-Typedef überall | Vanilla / VPP | Config-Parsing, Chat-Nachrichten und Loot-Tabellen verwenden alle `TStringArray` statt `array<string>` |
| Null- + Leer-Schutz vor Zugriff | Expansion Market | Jede Funktion, die ein Array empfängt, beginnt mit `if (!arr \|\| arr.Count() == 0) return;` |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|--------|---------|
| `Remove(index)` ist "schnelles Entfernen" | Sollte das Element einfach löschen | Es tauscht zuerst mit dem letzten Element, ordnet das Array stillschweigend um |
| `map.Insert()` fügt einen Schlüssel hinzu | Erwartet, bei bestehendem Schlüssel zu aktualisieren | Gibt `false` zurück und tut nichts, wenn der Schlüssel bereits vorhanden ist |
| `set<T>` für einzigartige Sammlungen | Sollte sich wie eine mathematische Menge verhalten | Die meisten Modder verwenden `array<T>` mit `Find()` stattdessen, weil `set` weniger Methoden hat |

---

## Häufige Fehler

### 1. `Remove` vs `RemoveOrdered`: Der stille Fehler

`Remove(index)` ist schnell, **ändert aber die Reihenfolge**, indem es mit dem letzten Element tauscht. Wenn Sie vorwärts iterieren und entfernen, werden Elemente übersprungen:

```c
// SCHLECHT: überspringt Elemente, weil Remove die Reihenfolge tauscht
array<int> nums = {1, 2, 3, 4, 5};
for (int i = 0; i < nums.Count(); i++)
{
    if (nums[i] % 2 == 0)
        nums.Remove(i);  // Nach dem Entfernen von Index 1 ist das Element an Index 1 jetzt "5"
                          // und wir springen zu Index 2, verpassen "5"
}

// GUT: rückwärts iterieren beim Entfernen
array<int> nums2 = {1, 2, 3, 4, 5};
for (int j = nums2.Count() - 1; j >= 0; j--)
{
    if (nums2[j] % 2 == 0)
        nums2.Remove(j);  // Sicher: Entfernen vom Ende beeinflusst niedrigere Indizes nicht
}

// AUCH GUT: RemoveOrdered mit Rückwärts-Iteration zur Beibehaltung der Reihenfolge
array<int> nums3 = {1, 2, 3, 4, 5};
for (int k = nums3.Count() - 1; k >= 0; k--)
{
    if (nums3[k] % 2 == 0)
        nums3.RemoveOrdered(k);
}
// nums3: [1, 3, 5] in ursprünglicher Reihenfolge
```

### 2. Array-Index außerhalb der Grenzen

Enforce Script wirft keine Ausnahmen bei Zugriff außerhalb der Grenzen --- es gibt stillschweigend Müll zurück oder stürzt ab. Prüfen Sie immer die Grenzen.

```c
// SCHLECHT: keine Grenzenprüfung
array<string> items = {"A", "B", "C"};
string fourth = items[3];  // UNDEFINIERTES VERHALTEN: Index 3 existiert nicht

// GUT: Grenzen prüfen
if (items.IsValidIndex(3))
{
    string fourth2 = items[3];
}

// GUT: Count prüfen
if (items.Count() > 0)
{
    string last = items[items.Count() - 1];
}
```

### 3. Vergessen, die Sammlung zu erstellen

Sammlungen sind Objekte und müssen mit `new` instanziiert werden:

```c
// SCHLECHT: Null-Referenz-Absturz
array<string> items;
items.Insert("Test");  // ABSTURZ: items ist null

// GUT: zuerst erstellen
array<string> items2 = new array<string>;
items2.Insert("Test");

// AUCH GUT: Initialisierungsliste erstellt automatisch
array<string> items3 = {"Test"};
```

### 4. `Insert` vs `Set` bei Maps

`Insert` aktualisiert keine bestehenden Schlüssel --- es gibt `false` zurück und lässt den Wert unverändert:

```c
map<string, int> data = new map<string, int>;
data.Insert("key", 100);
data.Insert("key", 200);   // Gibt false zurück, Wert ist IMMER NOCH 100!

// Verwenden Sie Set zum Aktualisieren
data.Set("key", 200);      // Jetzt ist der Wert 200
```

### 5. Eine Sammlung während foreach ändern

Fügen Sie keine Elemente zu einer Sammlung hinzu und entfernen Sie keine, während Sie sie mit `foreach` durchlaufen. Erstellen Sie eine separate Liste der zu entfernenden Elemente und entfernen Sie diese danach.

```c
// SCHLECHT: Änderung während der Iteration
array<string> items = {"A", "B", "C", "D"};
foreach (string item : items)
{
    if (item == "B")
        items.RemoveItem(item);  // UNDEFINIERT: invalidiert den Iterator
}

// GUT: sammeln, dann entfernen
array<string> toRemove = new array<string>;
foreach (string item2 : items)
{
    if (item2 == "B")
        toRemove.Insert(item2);
}
foreach (string rem : toRemove)
{
    items.RemoveItem(rem);
}
```

### 6. Sicherheit bei leeren Arrays

Prüfen Sie immer, ob ein Array sowohl nicht-null als auch nicht-leer ist, bevor Sie auf Elemente zugreifen:

```c
string GetFirstItem(array<string> items)
{
    // Schutzklausel: Null-Prüfung + Leer-Prüfung
    if (!items || items.Count() == 0)
        return "";

    return items[0];
}
```

---

## Übungsaufgaben

### Aufgabe 1: Inventarzähler
Erstellen Sie eine Funktion, die ein `array<string>` mit Gegenstandsklassennamen (mit Duplikaten) entgegennimmt und eine `map<string, int>` zurückgibt, die zählt, wie viele von jedem Gegenstand existieren.

Beispiel: `{"Bandage", "Morphine", "Bandage", "Saline", "Bandage"}` sollte `{"Bandage": 3, "Morphine": 1, "Saline": 1}` ergeben.

### Aufgabe 2: Array-Deduplizierung
Schreiben Sie eine Funktion `array<string> RemoveDuplicates(array<string> input)`, die ein neues Array zurückgibt, bei dem Duplikate entfernt sind und die Reihenfolge des ersten Vorkommens beibehalten wird.

### Aufgabe 3: Bestenliste
Erstellen Sie eine `map<string, int>` mit Spielernamen und Kill-Zählern. Schreiben Sie Funktionen für:
1. Einen Kill für einen Spieler hinzufügen (Eintrag erstellen falls nötig)
2. Die Top-N-Spieler nach Kills sortiert abrufen (Tipp: in Arrays extrahieren, sortieren)
3. Alle Spieler mit null Kills entfernen

### Aufgabe 4: Positionsverlauf
Erstellen Sie eine Klasse, die die letzten 10 Positionen eines Spielers speichert (Ringpuffer mit einem Array). Sie sollte:
1. Eine neue Position hinzufügen (die älteste verwerfen bei voller Kapazität)
2. Die zurückgelegte Gesamtdistanz über alle gespeicherten Positionen zurückgeben
3. Die Durchschnittsposition zurückgeben

### Aufgabe 5: Bidirektionale Suche
Erstellen Sie eine Klasse mit zwei Maps, die Suche in beide Richtungen ermöglicht: gegeben eine Spieler-UID, den Namen finden; gegeben einen Namen, die UID finden. Implementieren Sie `Register(uid, name)`, `GetNameByUID(uid)`, `GetUIDByName(name)` und `Unregister(uid)`.

---

## Zusammenfassung

| Sammlung | Typ | Anwendungsfall | Hauptunterschied |
|-----------|------|----------|----------------|
| Statisches Array | `int arr[5]` | Feste Größe, zur Kompilierzeit bekannt | Keine Größenänderung, keine Methoden |
| Dynamisches Array | `array<T>` | Allzweck-geordnete Liste | Umfangreiche API, größenveränderbar |
| Map | `map<K,V>` | Schlüssel-Wert-Nachschlagen | `Set()` zum Einfügen/Aktualisieren |
| Set | `set<T>` | Wertbasierte Zugehörigkeit | Einfacher als Array, weniger verbreitet |

| Operation | Methode | Hinweise |
|-----------|--------|-------|
| Am Ende hinzufügen | `Insert(val)` | Gibt Index zurück |
| An Position hinzufügen | `InsertAt(val, idx)` | Verschiebt nach rechts |
| Schnell entfernen | `Remove(idx)` | Tauscht mit letztem, **ungeordnet** |
| Geordnet entfernen | `RemoveOrdered(idx)` | Verschiebt nach links, behält Reihenfolge |
| Per Wert entfernen | `RemoveItem(val)` | Findet, dann entfernt (geordnet) |
| Suchen | `Find(val)` | Gibt Index zurück oder -1 |
| Anzahl | `Count()` | Anzahl der Elemente |
| Grenzenprüfung | `IsValidIndex(idx)` | Gibt bool zurück |
| Sortieren | `Sort()` / `Sort(true)` | Aufsteigend / absteigend |
| Zufall | `GetRandomElement()` | Gibt zufälligen Wert zurück |
| foreach | `foreach (T val : arr)` | Nur Wert |
| foreach indiziert | `foreach (int i, T val : arr)` | Index + Wert |

---

[Startseite](../README.md) | [<< Zurück: Variablen & Typen](01-variables-types.md) | **Arrays, Maps & Sets** | [Weiter: Klassen & Vererbung >>](03-classes-inheritance.md)
