# Chapter 1.6: String Operations

[Home](../README.md) | [<< Previous: Control Flow](05-control-flow.md) | **String Operations** | [Next: Math & Vectors >>](07-math-vectors.md)

---

## Introdução

Strings em Enforce Script são um **tipo de valor**, como `int` ou `float`. São passadas por valor e comparadas por valor. O tipo `string` tem um rico conjunto de métodos embutidos para busca, fatiamento, conversão e formatação de texto. Este capítulo é uma referência completa para toda operação de string disponível em scripting de DayZ, com exemplos reais do desenvolvimento de mods.

---

## Básico de Strings

```c
// Declaration and initialization
string empty;                          // "" (empty string by default)
string greeting = "Hello, Chernarus!";
string combined = "Player: " + "John"; // Concatenation with +

// Strings are value types -- assignment creates a copy
string original = "DayZ";
string copy = original;
copy = "Arma";
Print(original); // Still "DayZ"
```

---

## Referência Completa de Métodos de String

### Length

Retorna o número de caracteres na string.

```c
string s = "Hello";
int len = s.Length(); // 5

string empty = "";
int emptyLen = empty.Length(); // 0
```

### Substring

Extrai uma porção da string. Parâmetros: `start` (índice), `length` (número de caracteres).

```c
string s = "Hello World";
string word = s.Substring(6, 5);  // "World"
string first = s.Substring(0, 5); // "Hello"

// Extract from a position to the end
string rest = s.Substring(6, s.Length() - 6); // "World"
```

### IndexOf

Encontra a primeira ocorrência de uma substring. Retorna o índice, ou `-1` se não encontrada.

```c
string s = "Hello World";
int idx = s.IndexOf("World");     // 6
int notFound = s.IndexOf("DayZ"); // -1
```

### IndexOfFrom

Encontra a primeira ocorrência começando de um índice dado.

```c
string s = "one-two-one-two";
int first = s.IndexOf("one");        // 0
int second = s.IndexOfFrom(1, "one"); // 8
```

### LastIndexOf

Encontra a última ocorrência de uma substring.

```c
string path = "profiles/MyMod/Players/player.json";
int lastSlash = path.LastIndexOf("/"); // 23
```

### Contains

Retorna `true` se a string contém a substring dada.

```c
string chatMsg = "!teleport 100 0 200";
if (chatMsg.Contains("!teleport"))
{
    Print("Teleport command detected");
}
```

### Replace

Substitui todas as ocorrências de uma substring. **Modifica a string in-place** e retorna o número de substituições feitas.

```c
string s = "Hello World World";
int count = s.Replace("World", "DayZ");
// s is now "Hello DayZ DayZ"
// count is 2
```

### Split

Divide uma string por um delimitador e preenche um array. O array deve ser pré-alocado.

```c
string csv = "AK101,M4A1,UMP45,Mosin9130";
TStringArray weapons = new TStringArray;
csv.Split(",", weapons);
// weapons = ["AK101", "M4A1", "UMP45", "Mosin9130"]

// Split chat command by spaces
string chatLine = "!spawn Barrel_Green 5";
TStringArray parts = new TStringArray;
chatLine.Split(" ", parts);
// parts = ["!spawn", "Barrel_Green", "5"]
string command = parts.Get(0);   // "!spawn"
string itemType = parts.Get(1);  // "Barrel_Green"
int amount = parts.Get(2).ToInt(); // 5
```

### Join (estático)

Junta um array de strings com um separador.

```c
TStringArray names = {"Alice", "Bob", "Charlie"};
string result = string.Join(", ", names);
// result = "Alice, Bob, Charlie"
```

### Format (estático)

Constrói uma string usando placeholders numerados `%1` até `%9`. Esta é a forma principal de construir strings formatadas em Enforce Script.

```c
string name = "John";
int kills = 15;
float distance = 342.5;

string msg = string.Format("Player %1 has %2 kills (best shot: %3m)", name, kills, distance);
// msg = "Player John has 15 kills (best shot: 342.5m)"
```

Placeholders são **indexados a partir de 1** (`%1` é o primeiro argumento, não `%0`). Você pode usar até 9 placeholders.

```c
string log = string.Format("[%1] %2 :: %3", "MyMod", "INFO", "Server started");
// log = "[MyMod] INFO :: Server started"
```

> **Nota:** Não existe formatação estilo `printf` (`%d`, `%f`, `%s`). Apenas `%1` até `%9`.

### ToLower

Converte a string para minúsculas. **Modifica in-place** -- NÃO retorna uma nova string.

```c
string s = "Hello WORLD";
s.ToLower();
Print(s); // "hello world"
```

### ToUpper

Converte a string para maiúsculas. **Modifica in-place.**

```c
string s = "Hello World";
s.ToUpper();
Print(s); // "HELLO WORLD"
```

### Trim / TrimInPlace

Remove espaços em branco do início e fim. **Modifica in-place.**

```c
string s = "  Hello World  ";
s.TrimInPlace();
Print(s); // "Hello World"
```

Também existe `Trim()` que retorna uma nova string sem espaços (disponível em algumas versões do engine):

```c
string raw = "  padded  ";
string clean = raw.Trim();
// clean = "padded", raw unchanged
```

### Get

Obtém um único caractere em um índice, retornado como string.

```c
string s = "DayZ";
string ch = s.Get(0); // "D"
string ch2 = s.Get(3); // "Z"
```

### Set

Define um único caractere em um índice.

```c
string s = "DayZ";
s.Set(0, "N");
Print(s); // "NayZ"
```

### ToInt

Converte uma string numérica para inteiro.

```c
string s = "42";
int num = s.ToInt(); // 42

string bad = "hello";
int zero = bad.ToInt(); // 0 (non-numeric strings return 0)
```

### ToFloat

Converte uma string numérica para float.

```c
string s = "3.14";
float f = s.ToFloat(); // 3.14
```

### ToVector

Converte uma string de três números separados por espaço para um vector.

```c
string s = "100.5 0 200.3";
vector pos = s.ToVector(); // Vector(100.5, 0, 200.3)
```

---

## Comparação de Strings

Strings são comparadas por valor usando operadores padrão. A comparação é **case-sensitive** e segue ordem lexicográfica (dicionário).

```c
string a = "Apple";
string b = "Banana";
string c = "Apple";

bool equal    = (a == c);  // true
bool notEqual = (a != b);  // true
bool less     = (a < b);   // true  ("Apple" < "Banana" lexicographically)
bool greater  = (b > a);   // true
```

### Comparação case-insensitive

Não existe comparação case-insensitive embutida. Converta ambas as strings para minúsculas primeiro:

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

## Concatenação de Strings

Use o operador `+` para concatenar strings. Tipos não-string são convertidos automaticamente.

```c
string name = "John";
int health = 75;
float distance = 42.5;

string msg = "Player " + name + " has " + health + " HP at " + distance + "m";
// "Player John has 75 HP at 42.5m"
```

Para formatação complexa, prefira `string.Format()` em vez de concatenação -- é mais legível e evita múltiplas alocações intermediárias.

```c
// Prefer this:
string msg = string.Format("Player %1 has %2 HP at %3m", name, health, distance);

// Over this:
string msg2 = "Player " + name + " has " + health + " HP at " + distance + "m";
```

---

## Exemplos Reais

### Parseando comandos de chat

```c
void ProcessChatMessage(string sender, string message)
{
    // Trim whitespace
    message.TrimInPlace();

    // Must start with !
    if (message.Length() == 0 || message.Get(0) != "!")
        return;

    // Split into parts
    TStringArray parts = new TStringArray;
    message.Split(" ", parts);

    if (parts.Count() == 0)
        return;

    string command = parts.Get(0);
    command.ToLower();

    switch (command)
    {
        case "!heal":
            Print(string.Format("[CMD] %1 used !heal", sender));
            break;

        case "!spawn":
            if (parts.Count() >= 2)
            {
                string itemType = parts.Get(1);
                int quantity = 1;
                if (parts.Count() >= 3)
                    quantity = parts.Get(2).ToInt();

                Print(string.Format("[CMD] %1 spawning %2 x%3", sender, itemType, quantity));
            }
            break;

        case "!tp":
            if (parts.Count() >= 4)
            {
                float x = parts.Get(1).ToFloat();
                float y = parts.Get(2).ToFloat();
                float z = parts.Get(3).ToFloat();
                vector pos = Vector(x, y, z);
                Print(string.Format("[CMD] %1 teleporting to %2", sender, pos.ToString()));
            }
            break;
    }
}
```

### Formatando nomes de jogadores para exibição

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

### Construindo caminhos de arquivo

```c
string BuildPlayerFilePath(string steamId)
{
    return "$profile:MyMod/Players/" + steamId + ".json";
}
```

### Sanitizando mensagens de log

```c
string SanitizeForLog(string input)
{
    string safe = input;
    safe.Replace("\n", " ");
    safe.Replace("\r", "");
    safe.Replace("\t", " ");

    // Truncate to max length
    if (safe.Length() > 200)
    {
        safe = safe.Substring(0, 197) + "...";
    }

    return safe;
}
```

### Extraindo nome de arquivo de um caminho

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

## Erros Comuns

| Erro | Problema | Correção |
|------|----------|----------|
| Esperar que `ToLower()` retorne uma nova string | `ToLower()` modifica in-place, retorna `void` | Copie a string primeiro, depois chame `ToLower()` na cópia |
| Esperar que `ToUpper()` retorne uma nova string | Mesmo que acima -- modifica in-place | Copie primeiro, depois chame `ToUpper()` na cópia |
| Esperar que `Replace()` retorne uma nova string | `Replace()` modifica in-place, retorna contagem de substituições | Copie a string primeiro se precisar do original |
| Usar `%0` em `string.Format()` | Placeholders são indexados a partir de 1 (`%1` até `%9`) | Comece por `%1` |
| Usar especificadores de formato `%d`, `%f`, `%s` | Especificadores estilo C não funcionam | Use `%1`, `%2`, etc. |
| Comparar strings sem normalizar case | `"Hello" != "hello"` | Chame `ToLower()` em ambas antes de comparar |
| Tratar strings como tipos de referência | Strings são tipos de valor; atribuir cria uma cópia | Isso geralmente é ok -- apenas esteja ciente de que modificar uma cópia não afeta o original |
| Esquecer de criar o array antes do `Split()` | Chamar `Split()` em um array nulo causa crash | Sempre: `TStringArray parts = new TStringArray;` antes do `Split()` |

---

## Referência Rápida

```c
// Length
int len = s.Length();

// Search
int idx = s.IndexOf("sub");
int idx = s.IndexOfFrom(startIdx, "sub");
int idx = s.LastIndexOf("sub");
bool has = s.Contains("sub");

// Extract
string sub = s.Substring(start, length);
string ch  = s.Get(index);

// Modify (in place)
s.Set(index, "x");
int count = s.Replace("old", "new");
s.ToLower();
s.ToUpper();
s.TrimInPlace();

// Split & Join
TStringArray parts = new TStringArray;
s.Split(delimiter, parts);
string joined = string.Join(sep, parts);

// Format (static, %1-%9 placeholders)
string msg = string.Format("Hello %1, you have %2 items", name, count);

// Conversion
int n    = s.ToInt();
float f  = s.ToFloat();
vector v = s.ToVector();

// Comparison (case-sensitive, lexicographic)
bool eq = (a == b);
bool lt = (a < b);
```

---

[<< 1.5: Fluxo de Controle](05-control-flow.md) | [Início](../README.md) | [1.7: Matemática & Vectors >>](07-math-vectors.md)
