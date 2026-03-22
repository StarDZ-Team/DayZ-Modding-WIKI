# Chapter 1.2: Arrays, Maps & Sets

[Home](../README.md) | [<< Previous: Variables & Types](01-variables-types.md) | **Arrays, Maps & Sets** | [Next: Classes & Inheritance >>](03-classes-inheritance.md)

---

## Introdução

Mods reais de DayZ lidam com coleções de coisas: listas de jogadores, inventários de itens, mapeamentos de IDs de jogadores para permissões, conjuntos de zonas ativas. Enforce Script fornece três tipos de coleção para atender essas necessidades:

- **`array<T>`** --- Lista dinâmica, ordenada e redimensionável (a coleção que você mais vai usar)
- **`map<K,V>`** --- Container associativo de chave-valor (hash map)
- **`set<T>`** --- Coleção ordenada com remoção baseada em valor

Também existem **arrays estáticos** (`int arr[5]`) para dados de tamanho fixo conhecidos em tempo de compilação. Este capítulo cobre todos eles em profundidade, incluindo cada método disponível, padrões de iteração e as armadilhas sutis que causam bugs reais em mods de produção.

---

## Arrays Estáticos

Arrays estáticos têm um tamanho fixo determinado em tempo de compilação. Não podem crescer ou encolher. São úteis para coleções pequenas de tamanho conhecido e são mais eficientes em memória que arrays dinâmicos.

### Declaração e Uso

```c
void StaticArrayBasics()
{
    // Declare with literal size
    int numbers[5];
    numbers[0] = 10;
    numbers[1] = 20;
    numbers[2] = 30;
    numbers[3] = 40;
    numbers[4] = 50;

    // Declare with initializer list
    float damages[3] = {10.5, 25.0, 50.0};

    // Declare with const size
    const int GRID_SIZE = 4;
    string labels[GRID_SIZE];

    // Access elements
    int first = numbers[0];     // 10
    float maxDmg = damages[2];  // 50.0

    // Iterate with for loop
    for (int i = 0; i < 5; i++)
    {
        Print(numbers[i]);
    }
}
```

### Regras de Arrays Estáticos

1. O tamanho deve ser uma constante de tempo de compilação (literal ou `const int`)
2. Você **não pode** usar uma variável como tamanho: `int arr[myVar]` é erro de compilação
3. Acessar um índice fora dos limites causa comportamento indefinido (sem verificação em tempo de execução)
4. Arrays estáticos são passados por referência para funções (diferente de primitivos)

```c
// Static arrays as function parameters
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
    Print(myArr[0]);  // 100 -- the original was modified (passed by reference)
}
```

### Quando Usar Arrays Estáticos

Use arrays estáticos para:
- Dados de vector/matriz (`vector mat[3]` para matrizes de rotação 3x3)
- Pequenas tabelas de consulta fixas
- Caminhos críticos de performance onde alocação importa

Use `array<T>` dinâmico para todo o resto.

---

## Arrays Dinâmicos: `array<T>`

Arrays dinâmicos são a coleção mais comumente usada em modding de DayZ. Podem crescer e encolher em tempo de execução, suportam generics e fornecem um rico conjunto de métodos.

### Criação

```c
void CreateArrays()
{
    // Method 1: new operator
    array<string> names = new array<string>;

    // Method 2: Initializer list
    array<int> scores = {100, 85, 92, 78};

    // Method 3: Using typedef
    TStringArray items = new TStringArray;  // same as array<string>

    // Arrays of any type
    array<float> distances = new array<float>;
    array<bool> flags = new array<bool>;
    array<vector> positions = new array<vector>;
    array<PlayerBase> players = new array<PlayerBase>;
}
```

### Typedefs Pré-definidos

DayZ fornece atalhos de typedef para os tipos de array mais comuns:

```c
typedef array<string>  TStringArray;
typedef array<float>   TFloatArray;
typedef array<int>     TIntArray;
typedef array<bool>    TBoolArray;
typedef array<vector>  TVectorArray;
```

Você vai encontrar `TStringArray` constantemente em código DayZ --- parsing de config, mensagens de chat, tabelas de loot, e mais.

---

## Referência Completa de Métodos de Array

### Adicionando Elementos

```c
void AddingElements()
{
    array<string> items = new array<string>;

    // Insert: append to end, returns the new index
    int idx = items.Insert("Bandage");     // idx == 0
    idx = items.Insert("Morphine");        // idx == 1
    idx = items.Insert("Saline");          // idx == 2
    // items: ["Bandage", "Morphine", "Saline"]

    // InsertAt: insert at specific index, shifts existing elements right
    items.InsertAt("Epinephrine", 1);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline"]

    // InsertAll: append all elements from another array
    array<string> moreItems = {"Tetracycline", "Charcoal"};
    items.InsertAll(moreItems);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline", "Tetracycline", "Charcoal"]
}
```

### Acessando Elementos

```c
void AccessingElements()
{
    array<string> items = {"Apple", "Banana", "Cherry", "Date"};

    // Get: access by index
    string first = items.Get(0);       // "Apple"
    string third = items.Get(2);       // "Cherry"

    // Bracket operator: same as Get
    string second = items[1];          // "Banana"

    // Set: replace element at index
    items.Set(1, "Blueberry");         // items[1] is now "Blueberry"

    // Count: number of elements
    int count = items.Count();         // 4

    // IsValidIndex: bounds check
    bool valid = items.IsValidIndex(3);   // true
    bool invalid = items.IsValidIndex(4); // false
    bool negative = items.IsValidIndex(-1); // false
}
```

### Buscando

```c
void SearchingArrays()
{
    array<string> weapons = {"AKM", "M4A1", "Mosin", "IZH18", "AKM"};

    // Find: returns first index of element, or -1 if not found
    int idx = weapons.Find("Mosin");    // 2
    int notFound = weapons.Find("FAL");  // -1

    // Check existence
    if (weapons.Find("M4A1") != -1)
        Print("M4A1 found!");

    // GetRandomElement: returns a random element
    string randomWeapon = weapons.GetRandomElement();

    // GetRandomIndex: returns a random valid index
    int randomIdx = weapons.GetRandomIndex();
}
```

### Removendo Elementos

É aqui que os bugs mais comuns acontecem. Preste bastante atenção na diferença entre `Remove` e `RemoveOrdered`.

```c
void RemovingElements()
{
    array<string> items = {"A", "B", "C", "D", "E"};

    // Remove(index): FAST but UNORDERED
    // Swaps the element at index with the LAST element, then shrinks the array
    items.Remove(1);  // Removes "B" by swapping with "E"
    // items is now: ["A", "E", "C", "D"]  -- ORDER CHANGED!

    // RemoveOrdered(index): SLOW but preserves order
    // Shifts all elements after the index left by one
    items = {"A", "B", "C", "D", "E"};
    items.RemoveOrdered(1);  // Removes "B", shifts C,D,E left
    // items is now: ["A", "C", "D", "E"]  -- order preserved

    // RemoveItem(value): finds the element and removes it (ordered)
    items = {"A", "B", "C", "D", "E"};
    items.RemoveItem("C");
    // items is now: ["A", "B", "D", "E"]

    // Clear: remove all elements
    items.Clear();
    // items.Count() == 0
}
```

### Dimensionamento e Capacidade

```c
void SizingArrays()
{
    array<int> data = new array<int>;

    // Reserve: pre-allocate internal capacity (does NOT change Count)
    // Use when you know how many elements you will add
    data.Reserve(100);
    // data.Count() == 0, but internal buffer is ready for 100 elements

    // Resize: change the Count, filling new slots with default values
    data.Resize(10);
    // data.Count() == 10, all elements are 0

    // Resize smaller truncates
    data.Resize(5);
    // data.Count() == 5
}
```

### Ordenação e Embaralhamento

```c
void OrderingArrays()
{
    array<int> numbers = {5, 2, 8, 1, 9, 3};

    // Sort ascending
    numbers.Sort();
    // numbers: [1, 2, 3, 5, 8, 9]

    // Sort descending
    numbers.Sort(true);
    // numbers: [9, 8, 5, 3, 2, 1]

    // Invert (reverse) the array
    numbers = {1, 2, 3, 4, 5};
    numbers.Invert();
    // numbers: [5, 4, 3, 2, 1]

    // Shuffle randomly
    numbers.ShuffleArray();
    // numbers: [3, 1, 5, 2, 4]  (random order)
}
```

### Copiando

```c
void CopyingArrays()
{
    array<string> original = {"A", "B", "C"};

    // Copy: replaces all contents with a copy of another array
    array<string> copy = new array<string>;
    copy.Copy(original);
    // copy: ["A", "B", "C"]
    // Modifying copy does NOT affect original

    // InsertAll: appends (does not replace)
    array<string> combined = {"X", "Y"};
    combined.InsertAll(original);
    // combined: ["X", "Y", "A", "B", "C"]
}
```

### Depuração

```c
void DebuggingArrays()
{
    array<string> items = {"Bandage", "Morphine", "Saline"};

    // Debug: prints all elements to script log
    items.Debug();
    // Output:
    // [0] => Bandage
    // [1] => Morphine
    // [2] => Saline
}
```

---

## Iterando Arrays

### Loop for (Baseado em Índice)

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

### foreach (Apenas Valor)

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

### foreach (Índice + Valor)

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

### Exemplo Real: Encontrando o Jogador Mais Próximo

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

Maps armazenam pares de chave-valor. São usados quando você precisa buscar um valor por uma chave --- dados de jogador por UID, preços de itens por nome de classe, permissões por nome de role, e assim por diante.

### Criação

```c
void CreateMaps()
{
    // Standard creation
    map<string, int> prices = new map<string, int>;

    // Maps of various types
    map<string, float> multipliers = new map<string, float>;
    map<int, string> idToName = new map<int, string>;
    map<string, ref array<string>> categories = new map<string, ref array<string>>;
}
```

### Typedefs Pré-definidos de Map

```c
typedef map<string, int>     TStringIntMap;
typedef map<string, string>  TStringStringMap;
typedef map<int, string>     TIntStringMap;
typedef map<string, float>   TStringFloatMap;
```

---

## Referência Completa de Métodos de Map

### Inserindo e Atualizando

```c
void MapInsertUpdate()
{
    map<string, int> inventory = new map<string, int>;

    // Insert: add a new key-value pair
    // Returns true if the key was new, false if it already existed
    bool isNew = inventory.Insert("Bandage", 5);    // true (new key)
    isNew = inventory.Insert("Bandage", 10);         // false (key exists, value NOT updated)
    // inventory["Bandage"] is still 5!

    // Set: insert OR update (this is what you usually want)
    inventory.Set("Bandage", 10);    // Now inventory["Bandage"] == 10
    inventory.Set("Morphine", 3);    // New key added
    inventory.Set("Morphine", 7);    // Existing key updated to 7
}
```

**Distinção crítica:** `Insert()` **não** atualiza chaves existentes. `Set()` sim. Na dúvida, use `Set()`.

### Acessando Valores

```c
void MapAccess()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Get: returns value, or default (0 for int) if key not found
    int akmPrice = prices.Get("AKM");         // 5000
    int falPrice = prices.Get("FAL");          // 0 (not found, returns default)

    // Find: safe access, returns true if key exists and sets the out parameter
    int price;
    bool found = prices.Find("M4A1", price);  // found == true, price == 7500
    bool notFound = prices.Find("SVD", price); // notFound == false, price unchanged

    // Contains: check if key exists (no value retrieval)
    bool hasAKM = prices.Contains("AKM");     // true
    bool hasFAL = prices.Contains("FAL");     // false

    // Count: number of key-value pairs
    int count = prices.Count();  // 3
}
```

### Removendo

```c
void MapRemove()
{
    map<string, int> data = new map<string, int>;
    data.Set("a", 1);
    data.Set("b", 2);
    data.Set("c", 3);

    // Remove: remove by key
    data.Remove("b");
    // data now has: {"a": 1, "c": 3}

    // Clear: remove all entries
    data.Clear();
    // data.Count() == 0
}
```

### Acesso Baseado em Índice

Maps suportam acesso posicional, mas é `O(n)` --- use para iteração, não para consultas frequentes.

```c
void MapIndexAccess()
{
    map<string, int> data = new map<string, int>;
    data.Set("alpha", 1);
    data.Set("beta", 2);
    data.Set("gamma", 3);

    // Access by internal index (O(n), order is insertion order)
    for (int i = 0; i < data.Count(); i++)
    {
        string key = data.GetKey(i);
        int value = data.GetElement(i);
        Print(string.Format("%1 = %2", key, value));
    }
}
```

### Extraindo Chaves e Valores

```c
void MapExtraction()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Get all keys as an array
    array<string> keys = prices.GetKeyArray();
    // keys: ["AKM", "M4A1", "Mosin"]

    // Get all values as an array
    array<int> values = prices.GetValueArray();
    // values: [5000, 7500, 2000]
}
```

### Exemplo Real: Rastreamento de Jogadores

```c
class PlayerTracker
{
    protected ref map<string, vector> m_LastPositions;  // UID -> position
    protected ref map<string, float> m_PlayTime;        // UID -> seconds

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

Sets são coleções ordenadas similares a arrays, mas com semântica orientada a operações baseadas em valor (busca e remoção por valor). São menos comumente usados que arrays e maps.

```c
void SetExamples()
{
    set<string> activeZones = new set<string>;

    // Insert: add an element
    activeZones.Insert("NWAF");
    activeZones.Insert("Tisy");
    activeZones.Insert("Balota");

    // Find: returns index or -1
    int idx = activeZones.Find("Tisy");    // 1
    int missing = activeZones.Find("Zelenogorsk");  // -1

    // Get: access by index
    string first = activeZones.Get(0);     // "NWAF"

    // Count
    int count = activeZones.Count();       // 3

    // Remove by index
    activeZones.Remove(0);
    // activeZones: ["Tisy", "Balota"]

    // RemoveItem: remove by value
    activeZones.RemoveItem("Tisy");
    // activeZones: ["Balota"]

    // Clear
    activeZones.Clear();
}
```

### Quando Usar Set vs Array

Na prática, a maioria dos modders de DayZ usa `array<T>` para quase tudo porque:
- `set<T>` tem menos métodos que `array<T>`
- `array<T>` fornece `Find()` para busca e `RemoveItem()` para remoção baseada em valor
- A API que você precisa normalmente já está no `array<T>`

Use `set<T>` quando seu código semanticamente representa um conjunto (sem ordem significativa, foco em teste de pertencimento), ou quando você encontrá-lo no código vanilla do DayZ e precisar fazer interface com ele.

---

## Iterando Maps

Maps suportam `foreach` para iteração conveniente:

### foreach com Chave-Valor

```c
void IterateMap()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);
    scores.Set("Charlie", 180);

    // foreach with key and value
    foreach (string name, int score : scores)
    {
        Print(string.Format("%1: %2 points", name, score));
    }
    // Alice: 150 points
    // Bob: 230 points
    // Charlie: 180 points
}
```

### Loop for Baseado em Índice

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

## Coleções Aninhadas

Coleções podem conter outras coleções. Ao armazenar tipos de referência (como arrays) dentro de um map, use `ref` para gerenciar propriedade.

```c
class LootTable
{
    // Map from category name to list of class names
    protected ref map<string, ref array<string>> m_Categories;

    void LootTable()
    {
        m_Categories = new map<string, ref array<string>>;

        // Create category arrays
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

## Erros Comuns

### 1. `Remove` vs `RemoveOrdered`: O Bug Silencioso

`Remove(index)` é rápido mas **muda a ordem** ao trocar com o último elemento. Se você está iterando para frente e removendo, isso causa elementos pulados:

```c
// BAD: skips elements because Remove swaps order
array<int> nums = {1, 2, 3, 4, 5};
for (int i = 0; i < nums.Count(); i++)
{
    if (nums[i] % 2 == 0)
        nums.Remove(i);  // After removing index 1, element at index 1 is now "5"
                          // and we skip to index 2, missing "5"
}

// GOOD: iterate backward when removing
array<int> nums2 = {1, 2, 3, 4, 5};
for (int j = nums2.Count() - 1; j >= 0; j--)
{
    if (nums2[j] % 2 == 0)
        nums2.Remove(j);  // Safe: removing from the end doesn't affect lower indices
}

// ALSO GOOD: use RemoveOrdered with backward iteration for order preservation
array<int> nums3 = {1, 2, 3, 4, 5};
for (int k = nums3.Count() - 1; k >= 0; k--)
{
    if (nums3[k] % 2 == 0)
        nums3.RemoveOrdered(k);
}
// nums3: [1, 3, 5] in original order
```

### 2. Índice de Array Fora dos Limites

Enforce Script não lança exceções para acesso fora dos limites --- silenciosamente retorna lixo ou crasha. Sempre verifique os limites.

```c
// BAD: no bounds check
array<string> items = {"A", "B", "C"};
string fourth = items[3];  // UNDEFINED BEHAVIOR: index 3 doesn't exist

// GOOD: check bounds
if (items.IsValidIndex(3))
{
    string fourth2 = items[3];
}

// GOOD: check count
if (items.Count() > 0)
{
    string last = items[items.Count() - 1];
}
```

### 3. Esquecendo de Criar a Coleção

Coleções são objetos e devem ser instanciadas com `new`:

```c
// BAD: null reference crash
array<string> items;
items.Insert("Test");  // CRASH: items is null

// GOOD: create first
array<string> items2 = new array<string>;
items2.Insert("Test");

// ALSO GOOD: initializer list creates automatically
array<string> items3 = {"Test"};
```

### 4. `Insert` vs `Set` em Maps

`Insert` não atualiza chaves existentes --- retorna `false` e deixa o valor inalterado:

```c
map<string, int> data = new map<string, int>;
data.Insert("key", 100);
data.Insert("key", 200);   // Returns false, value is STILL 100!

// Use Set to update
data.Set("key", 200);      // Now value is 200
```

### 5. Modificando uma Coleção Durante foreach

Não adicione ou remova elementos de uma coleção enquanto itera sobre ela com `foreach`. Construa uma lista separada de elementos para remover, depois remova-os.

```c
// BAD: modifying during iteration
array<string> items = {"A", "B", "C", "D"};
foreach (string item : items)
{
    if (item == "B")
        items.RemoveItem(item);  // UNDEFINED: invalidates iterator
}

// GOOD: collect then remove
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

### 6. Segurança com Array Vazio

Sempre verifique se um array é não-nulo e não-vazio antes de acessar elementos:

```c
string GetFirstItem(array<string> items)
{
    // Guard clause: null check + empty check
    if (!items || items.Count() == 0)
        return "";

    return items[0];
}
```

---

## Exercícios Práticos

### Exercício 1: Contador de Inventário
Crie uma função que recebe um `array<string>` de nomes de classe de itens (com duplicatas) e retorna um `map<string, int>` contando quantos de cada item existem.

Exemplo: `{"Bandage", "Morphine", "Bandage", "Saline", "Bandage"}` deve produzir `{"Bandage": 3, "Morphine": 1, "Saline": 1}`.

### Exercício 2: Deduplicação de Array
Escreva uma função `array<string> RemoveDuplicates(array<string> input)` que retorna um novo array com duplicatas removidas, preservando a ordem da primeira ocorrência.

### Exercício 3: Placar
Crie um `map<string, int>` de nomes de jogadores para contagem de kills. Escreva funções para:
1. Adicionar um kill para um jogador (criando a entrada se necessário)
2. Obter os top N jogadores ordenados por kills (dica: extraia para arrays, ordene)
3. Remover todos os jogadores com zero kills

### Exercício 4: Histórico de Posição
Crie uma classe que armazena as últimas 10 posições de um jogador (buffer circular usando um array). Deve:
1. Adicionar uma nova posição (descartando a mais antiga se na capacidade)
2. Retornar a distância total percorrida entre todas as posições armazenadas
3. Retornar a posição média

### Exercício 5: Consulta Bidirecional
Crie uma classe com dois maps que permite consulta em ambas as direções: dado um UID de jogador, encontre o nome; dado um nome, encontre o UID. Implemente `Register(uid, name)`, `GetNameByUID(uid)`, `GetUIDByName(name)`, e `Unregister(uid)`.

---

## Resumo

| Coleção | Tipo | Caso de Uso | Diferença Principal |
|---------|------|-------------|---------------------|
| Array estático | `int arr[5]` | Tamanho fixo, conhecido em compilação | Sem redimensionamento, sem métodos |
| Array dinâmico | `array<T>` | Lista ordenada de uso geral | API rica, redimensionável |
| Map | `map<K,V>` | Consulta chave-valor | `Set()` para inserir/atualizar |
| Set | `set<T>` | Pertencimento baseado em valor | Mais simples que array, menos comum |

| Operação | Método | Observações |
|----------|--------|-------------|
| Adicionar ao final | `Insert(val)` | Retorna índice |
| Adicionar na posição | `InsertAt(val, idx)` | Desloca para direita |
| Remover rápido | `Remove(idx)` | Troca com último, **sem ordem** |
| Remover ordenado | `RemoveOrdered(idx)` | Desloca para esquerda, preserva ordem |
| Remover por valor | `RemoveItem(val)` | Encontra e remove (ordenado) |
| Buscar | `Find(val)` | Retorna índice ou -1 |
| Contar | `Count()` | Número de elementos |
| Verificar limites | `IsValidIndex(idx)` | Retorna bool |
| Ordenar | `Sort()` / `Sort(true)` | Crescente / decrescente |
| Aleatório | `GetRandomElement()` | Retorna valor aleatório |
| foreach | `foreach (T val : arr)` | Apenas valor |
| foreach indexado | `foreach (int i, T val : arr)` | Índice + valor |

---

[Início](../README.md) | [<< Anterior: Variáveis & Tipos](01-variables-types.md) | **Arrays, Maps & Sets** | [Próximo: Classes & Herança >>](03-classes-inheritance.md)
