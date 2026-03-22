# Chapter 1.3: Classes & Inheritance

[Home](../README.md) | [<< Previous: Arrays, Maps & Sets](02-arrays-maps-sets.md) | **Classes & Inheritance** | [Next: Modded Classes >>](04-modded-classes.md)

---

## Introdução

Tudo no DayZ é uma classe. Toda arma, veículo, zumbi, painel de UI, gerenciador de config e jogador é uma instância de uma classe. Entender como declarar, estender e trabalhar com classes em Enforce Script é a base de todo modding para DayZ.

O sistema de classes do Enforce Script é de herança simples, orientado a objetos, com modificadores de acesso, construtores, destrutores, membros estáticos e override de métodos. Se você conhece C# ou Java, os conceitos são familiares --- mas a sintaxe tem seu próprio estilo, e existem diferenças importantes abordadas neste capítulo.

---

## Declarando uma Classe

Uma classe agrupa dados relacionados (campos) e comportamento (métodos) juntos.

```c
class ZombieTracker
{
    // Fields (member variables)
    int m_ZombieCount;
    float m_SpawnRadius;
    string m_ZoneName;
    bool m_IsActive;
    vector m_CenterPos;

    // Methods (member functions)
    void Activate(vector center, float radius)
    {
        m_CenterPos = center;
        m_SpawnRadius = radius;
        m_IsActive = true;
    }

    bool IsActive()
    {
        return m_IsActive;
    }

    float GetDistanceToCenter(vector pos)
    {
        return vector.Distance(m_CenterPos, pos);
    }
}
```

### Convenções de Nomenclatura de Classes

O modding de DayZ segue estas convenções:
- Nomes de classes: `PascalCase` (ex: `PlayerTracker`, `LootManager`)
- Campos de membro: prefixo `m_PascalCase` (ex: `m_Health`, `m_PlayerList`)
- Campos estáticos: prefixo `s_PascalCase` (ex: `s_Instance`, `s_Counter`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `MAX_HEALTH`, `DEFAULT_RADIUS`)
- Métodos: `PascalCase` (ex: `GetPosition()`, `SetHealth()`)
- Variáveis locais: `camelCase` (ex: `playerCount`, `nearestDist`)

### Criando e Usando Instâncias

```c
void Example()
{
    // Create an instance with 'new'
    ZombieTracker tracker = new ZombieTracker;

    // Call methods
    tracker.Activate(Vector(5000, 0, 8000), 200.0);

    if (tracker.IsActive())
    {
        float dist = tracker.GetDistanceToCenter(Vector(5050, 0, 8050));
        Print(string.Format("Distance: %1", dist));
    }

    // Destroy an instance with 'delete' (usually not needed; see Memory section)
    delete tracker;
}
```

---

## Construtores e Destrutores

Construtores inicializam um objeto quando ele é criado. Destrutores fazem limpeza quando ele é destruído. Em Enforce Script, ambos usam o nome da classe --- o destrutor é prefixado com `~`.

### Construtor

```c
class SpawnZone
{
    protected string m_Name;
    protected vector m_Position;
    protected float m_Radius;
    protected ref array<string> m_AllowedTypes;

    // Constructor: same name as the class
    void SpawnZone(string name, vector pos, float radius)
    {
        m_Name = name;
        m_Position = pos;
        m_Radius = radius;
        m_AllowedTypes = new array<string>;

        Print(string.Format("[SpawnZone] Created: %1 at %2, radius %3", m_Name, m_Position, m_Radius));
    }

    // Destructor: ~ prefix
    void ~SpawnZone()
    {
        Print(string.Format("[SpawnZone] Destroyed: %1", m_Name));
        // m_AllowedTypes is a ref, it will be deleted automatically
    }

    void AddAllowedType(string typeName)
    {
        m_AllowedTypes.Insert(typeName);
    }
}
```

### Construtor Padrão (Sem Parâmetros)

Se você não definir um construtor, a classe recebe um construtor padrão implícito que inicializa todos os campos com seus valores padrão (`0`, `0.0`, `false`, `""`, `null`).

```c
class SimpleConfig
{
    int m_MaxPlayers;      // initialized to 0
    float m_SpawnDelay;    // initialized to 0.0
    string m_ServerName;   // initialized to ""
    bool m_PvPEnabled;     // initialized to false
}

void Test()
{
    SimpleConfig cfg = new SimpleConfig;
    // All fields are at their defaults
    Print(cfg.m_MaxPlayers);  // 0
}
```

### Sobrecarga de Construtores

Você pode definir múltiplos construtores com diferentes listas de parâmetros:

```c
class DamageEvent
{
    protected float m_Amount;
    protected string m_Source;
    protected vector m_Position;

    // Constructor with all parameters
    void DamageEvent(float amount, string source, vector pos)
    {
        m_Amount = amount;
        m_Source = source;
        m_Position = pos;
    }

    // Simpler constructor with defaults
    void DamageEvent(float amount)
    {
        m_Amount = amount;
        m_Source = "Unknown";
        m_Position = vector.Zero;
    }
}

void Test()
{
    DamageEvent full = new DamageEvent(50.0, "AKM", Vector(100, 0, 200));
    DamageEvent simple = new DamageEvent(25.0);
}
```

---

## Modificadores de Acesso

Modificadores de acesso controlam quem pode ver e usar campos e métodos.

| Modificador | Acessível De | Sintaxe |
|-------------|-------------|---------|
| `private` | Apenas a classe declarante | `private int m_Secret;` |
| `protected` | Classe declarante + todas as subclasses | `protected int m_Health;` |
| *(nenhum)* | Qualquer lugar (público) | `int m_Value;` |

Não existe a palavra-chave `public` explícita --- tudo sem `private` ou `protected` é público por padrão.

```c
class BaseVehicle
{
    // Public: anyone can access
    string m_DisplayName;

    // Protected: this class and subclasses only
    protected float m_Fuel;
    protected float m_MaxFuel;

    // Private: only this exact class
    private int m_InternalState;

    void BaseVehicle(string name, float maxFuel)
    {
        m_DisplayName = name;
        m_MaxFuel = maxFuel;
        m_Fuel = maxFuel;
        m_InternalState = 0;
    }

    // Public method
    float GetFuelPercent()
    {
        return (m_Fuel / m_MaxFuel) * 100.0;
    }

    // Protected method: subclasses can call this
    protected void ConsumeFuel(float amount)
    {
        m_Fuel = Math.Clamp(m_Fuel - amount, 0, m_MaxFuel);
    }

    // Private method: only this class
    private void UpdateInternalState()
    {
        m_InternalState++;
    }
}
```

### Boa Prática: Encapsulamento

Exponha campos através de métodos (getters/setters) em vez de torná-los públicos. Isso permite adicionar validação, logging ou efeitos colaterais depois sem quebrar o código que usa a classe.

```c
class PlayerStats
{
    protected float m_Health;
    protected float m_MaxHealth;

    void PlayerStats(float maxHealth)
    {
        m_MaxHealth = maxHealth;
        m_Health = maxHealth;
    }

    // Getter
    float GetHealth()
    {
        return m_Health;
    }

    // Setter with validation
    void SetHealth(float value)
    {
        m_Health = Math.Clamp(value, 0, m_MaxHealth);
    }

    // Convenience methods
    void TakeDamage(float amount)
    {
        SetHealth(m_Health - amount);
    }

    void Heal(float amount)
    {
        SetHealth(m_Health + amount);
    }

    bool IsAlive()
    {
        return m_Health > 0;
    }
}
```

---

## Herança

Herança permite criar uma nova classe baseada em uma existente. A classe filha herda todos os campos e métodos da classe pai, e pode adicionar novos ou sobrescrever o comportamento existente.

### Sintaxe: `extends` ou `:`

Enforce Script suporta duas sintaxes para herança. Ambas são equivalentes:

```c
// Syntax 1: extends keyword (preferred, more readable)
class Car extends BaseVehicle
{
}

// Syntax 2: colon (C++ style, also common in DayZ code)
class Truck : BaseVehicle
{
}
```

### Exemplo Básico de Herança

```c
class Animal
{
    protected string m_Name;
    protected float m_Health;

    void Animal(string name, float health)
    {
        m_Name = name;
        m_Health = health;
    }

    string GetName()
    {
        return m_Name;
    }

    void Speak()
    {
        Print(m_Name + " makes a sound");
    }
}

class Dog extends Animal
{
    protected string m_Breed;

    void Dog(string name, string breed)
    {
        // Note: parent constructor is called automatically with no args,
        // or you can initialize parent fields directly since they are protected
        m_Name = name;
        m_Health = 100.0;
        m_Breed = breed;
    }

    string GetBreed()
    {
        return m_Breed;
    }

    // New method only in Dog
    void Fetch()
    {
        Print(m_Name + " fetches the stick!");
    }
}

void Test()
{
    Dog rex = new Dog("Rex", "German Shepherd");
    rex.Speak();         // Inherited from Animal: "Rex makes a sound"
    rex.Fetch();         // Dog's own method: "Rex fetches the stick!"
    Print(rex.GetName()); // Inherited: "Rex"
    Print(rex.GetBreed()); // Dog's own: "German Shepherd"
}
```

### Apenas Herança Simples

Enforce Script suporta **apenas herança simples**. Uma classe pode estender exatamente um pai. Não existe herança múltipla, interfaces ou mixins.

```c
class A { }
class B extends A { }     // OK: single parent
// class C extends A, B { }  // ERROR: multiple inheritance not supported
class D extends B { }     // OK: B extends A, D extends B (inheritance chain)
```

---

## Sobrescrevendo Métodos

Quando uma subclasse precisa mudar o comportamento de um método herdado, ela usa a palavra-chave `override`. O compilador verifica se a assinatura do método corresponde a um método na classe pai.

```c
class Weapon
{
    protected string m_Name;
    protected float m_Damage;

    void Weapon(string name, float damage)
    {
        m_Name = name;
        m_Damage = damage;
    }

    float CalculateDamage(float distance)
    {
        // Base damage, no falloff
        return m_Damage;
    }

    string GetInfo()
    {
        return string.Format("%1 (Dmg: %2)", m_Name, m_Damage);
    }
}

class Rifle extends Weapon
{
    protected float m_MaxRange;

    void Rifle(string name, float damage, float maxRange)
    {
        m_Name = name;
        m_Damage = damage;
        m_MaxRange = maxRange;
    }

    // Override: change damage calculation to include distance falloff
    override float CalculateDamage(float distance)
    {
        float falloff = Math.Clamp(1.0 - (distance / m_MaxRange), 0.1, 1.0);
        return m_Damage * falloff;
    }

    // Override: add range info
    override string GetInfo()
    {
        return string.Format("%1 (Dmg: %2, Range: %3m)", m_Name, m_Damage, m_MaxRange);
    }
}
```

### A Palavra-chave `super`

`super` se refere à classe pai. Use para chamar a versão do método do pai, depois adicione sua própria lógica por cima. Isso é crítico --- especialmente em [modded classes](04-modded-classes.md).

```c
class BaseLogger
{
    void Log(string message)
    {
        Print("[LOG] " + message);
    }
}

class TimestampLogger extends BaseLogger
{
    override void Log(string message)
    {
        // Call parent's Log first
        super.Log(message);

        // Then add timestamp logging
        int hour, minute, second;
        GetHourMinuteSecond(hour, minute, second);
        Print(string.Format("[%1:%2:%3] %4", hour, minute, second, message));
    }
}
```

### Palavra-chave `this`

`this` se refere à instância atual do objeto. Geralmente é implícito (você não precisa escrevê-lo), mas pode ser útil para clareza ou ao passar o objeto atual para outra função.

```c
class EventManager
{
    void Register(Managed handler) { /* ... */ }
}

class MyPlugin
{
    void Init(EventManager mgr)
    {
        // Pass 'this' (the current MyPlugin instance) to the manager
        mgr.Register(this);
    }
}
```

---

## Métodos e Campos Estáticos

Membros estáticos pertencem à classe em si, não a qualquer instância. São acessados usando o nome da classe, não uma variável de objeto.

### Campos Estáticos

```c
class GameConfig
{
    // Static fields: shared across all instances (and accessible without an instance)
    static int s_MaxPlayers = 60;
    static float s_TickRate = 30.0;
    static string s_ServerName = "My Server";

    // Regular (instance) field
    protected bool m_IsLoaded;
}

void UseStaticFields()
{
    // Access without creating an instance
    Print(GameConfig.s_MaxPlayers);     // 60
    Print(GameConfig.s_ServerName);     // "My Server"

    // Modify
    GameConfig.s_MaxPlayers = 40;
}
```

### Métodos Estáticos

```c
class MathUtils
{
    static float MetersToKilometers(float meters)
    {
        return meters / 1000.0;
    }

    static string FormatDistance(float meters)
    {
        if (meters >= 1000)
            return string.Format("%.1f km", meters / 1000.0);
        else
            return string.Format("%1 m", Math.Round(meters));
    }

    static bool IsInCircle(vector point, vector center, float radius)
    {
        return vector.Distance(point, center) <= radius;
    }
}

void Test()
{
    float km = MathUtils.MetersToKilometers(2500);     // 2.5
    string display = MathUtils.FormatDistance(750);      // "750 m"
    bool inside = MathUtils.IsInCircle("100 0 200", "150 0 250", 100);
}
```

### O Padrão Singleton

O uso mais comum de campos estáticos em mods de DayZ é o padrão singleton: uma classe que tem exatamente uma instância, acessível globalmente.

```c
class MyModManager
{
    // Static reference to the single instance
    private static ref MyModManager s_Instance;

    protected bool m_Initialized;
    protected ref array<string> m_Data;

    void MyModManager()
    {
        m_Initialized = false;
        m_Data = new array<string>;
    }

    // Static getter for the singleton
    static MyModManager GetInstance()
    {
        if (!s_Instance)
            s_Instance = new MyModManager;

        return s_Instance;
    }

    void Init()
    {
        if (m_Initialized)
            return;

        m_Initialized = true;
        Print("[MyMod] Manager initialized");
    }

    // Static cleanup
    static void Destroy()
    {
        s_Instance = null;
    }
}

// Usage from anywhere:
void SomeFunction()
{
    MyModManager.GetInstance().Init();
}
```

---

## Exemplo Real: Classe de Item Personalizado

Aqui está um exemplo completo mostrando uma hierarquia de classe de item personalizado no estilo de modding de DayZ. Isso demonstra tudo que foi abordado neste capítulo.

```c
// Base class for all custom medical items
class CustomMedicalBase extends ItemBase
{
    protected float m_HealAmount;
    protected float m_UseTime;      // seconds to use
    protected bool m_RequiresBandage;

    void CustomMedicalBase()
    {
        m_HealAmount = 0;
        m_UseTime = 3.0;
        m_RequiresBandage = false;
    }

    float GetHealAmount()
    {
        return m_HealAmount;
    }

    float GetUseTime()
    {
        return m_UseTime;
    }

    bool RequiresBandage()
    {
        return m_RequiresBandage;
    }

    // Can be overridden by subclasses
    void OnApplied(PlayerBase player)
    {
        if (!player)
            return;

        player.AddHealth("", "Health", m_HealAmount);
        Print(string.Format("[Medical] %1 applied, healed %2", GetType(), m_HealAmount));
    }
}

// Specific medical item: Bandage
class CustomBandage extends CustomMedicalBase
{
    void CustomBandage()
    {
        m_HealAmount = 25.0;
        m_UseTime = 2.0;
    }

    override void OnApplied(PlayerBase player)
    {
        super.OnApplied(player);

        // Additional bandage-specific effect: stop bleeding
        // (simplified example)
        Print("[Medical] Bleeding stopped");
    }
}

// Specific medical item: First Aid Kit (heals more, takes longer)
class CustomFirstAidKit extends CustomMedicalBase
{
    private int m_UsesRemaining;

    void CustomFirstAidKit()
    {
        m_HealAmount = 75.0;
        m_UseTime = 8.0;
        m_UsesRemaining = 3;
    }

    int GetUsesRemaining()
    {
        return m_UsesRemaining;
    }

    override void OnApplied(PlayerBase player)
    {
        if (m_UsesRemaining <= 0)
        {
            Print("[Medical] First Aid Kit is empty!");
            return;
        }

        super.OnApplied(player);
        m_UsesRemaining--;

        Print(string.Format("[Medical] Uses remaining: %1", m_UsesRemaining));
    }
}
```

### config.cpp para Itens Personalizados

A hierarquia de classes no script deve corresponder à herança do `config.cpp`:

```cpp
class CfgVehicles
{
    class ItemBase;

    class CustomMedicalBase : ItemBase
    {
        scope = 0;  // 0 = abstract, cannot be spawned
        displayName = "";
    };

    class CustomBandage : CustomMedicalBase
    {
        scope = 2;  // 2 = public, can be spawned
        displayName = "Custom Bandage";
        descriptionShort = "A sterile bandage for wound treatment.";
        model = "\MyMod\data\bandage.p3d";
        weight = 50;
    };

    class CustomFirstAidKit : CustomMedicalBase
    {
        scope = 2;
        displayName = "Custom First Aid Kit";
        descriptionShort = "A complete first aid kit with multiple uses.";
        model = "\MyMod\data\firstaidkit.p3d";
        weight = 300;
    };
};
```

---

## A Hierarquia de Classes do DayZ

Entender a hierarquia de classes vanilla é essencial para modding. Aqui estão as classes mais importantes das quais você vai herdar ou interagir:

```
Class                          // Root of all reference types
  Managed                      // Prevents engine ref-counting (use for pure script classes)
  IEntity                      // Engine entity base
    Object                     // Anything with a position in the world
      Entity
        EntityAI               // Has inventory, health, actions
          InventoryItem
            ItemBase           // ALL items (inherit from this for custom items)
              Weapon_Base      // All weapons
              Magazine_Base    // All magazines
              Clothing_Base    // All clothing
          Transport
            CarScript          // All vehicles
          DayZCreatureAI
            DayZInfected       // Zombies
            DayZAnimal         // Animals
          Man
            DayZPlayer
              PlayerBase       // THE player class (modded constantly)
                SurvivorBase   // Character appearance
```

### Classes Base Comuns para Modding

| Se você quer criar... | Estenda... |
|------------------------|-----------|
| Um novo item | `ItemBase` |
| Uma nova arma | `Weapon_Base` |
| Uma nova peça de roupa | `Clothing_Base` |
| Um novo veículo | `CarScript` |
| Um elemento de UI | `UIScriptedMenu` ou `ScriptedWidgetEventHandler` |
| Um gerenciador/sistema | `Managed` |
| Uma classe de dados de config | `Managed` |
| Um hook de mission | `MissionServer` ou `MissionGameplay` (via `modded class`) |

---

## Erros Comuns

### 1. Esquecendo `ref` para Objetos Próprios

Quando uma classe possui outro objeto (cria-o, é responsável pelo seu ciclo de vida), declare o campo como `ref`. Sem `ref`, o objeto pode ser coletado pelo garbage collector inesperadamente.

```c
// BAD: m_Data might be garbage collected
class BadManager
{
    array<string> m_Data;  // raw pointer, no ownership

    void BadManager()
    {
        m_Data = new array<string>;  // object might get collected
    }
}

// GOOD: ref ensures the manager keeps m_Data alive
class GoodManager
{
    ref array<string> m_Data;  // strong reference, owns the object

    void GoodManager()
    {
        m_Data = new array<string>;
    }
}
```

### 2. Esquecendo a Palavra-chave `override`

Se você pretende sobrescrever um método do pai mas esquece a palavra-chave `override`, você obtém um **novo** método que esconde o método do pai em vez de substituí-lo. O compilador pode alertar sobre isso.

```c
class Parent
{
    void DoWork() { Print("Parent"); }
}

class Child extends Parent
{
    // BAD: creates a new method, doesn't override
    void DoWork() { Print("Child"); }

    // GOOD: properly overrides
    override void DoWork() { Print("Child"); }
}
```

### 3. Não Chamar `super` em Overrides

Quando você sobrescreve um método, o código do pai NÃO é chamado automaticamente. Se você pular o `super`, perde o comportamento do pai --- o que pode quebrar funcionalidades, especialmente nas cadeias profundas de herança do DayZ.

```c
class Parent
{
    void Init()
    {
        // Critical initialization happens here
        Print("Parent.Init()");
    }
}

class Child extends Parent
{
    // BAD: Parent.Init() never runs
    override void Init()
    {
        Print("Child.Init()");
    }

    // GOOD: Parent.Init() runs first, then child adds behavior
    override void Init()
    {
        super.Init();
        Print("Child.Init()");
    }
}
```

### 4. Ciclos de Ref Causam Vazamento de Memória

Se o objeto A mantém um `ref` para o objeto B, e o objeto B mantém um `ref` para o objeto A, nenhum pode ser liberado. Um lado deve usar um ponteiro raw (sem ref).

```c
// BAD: ref cycle, neither object can be freed
class Parent
{
    ref Child m_Child;
}
class Child
{
    ref Parent m_Parent;  // LEAK: circular ref
}

// GOOD: child holds a raw pointer to parent
class Parent2
{
    ref Child2 m_Child;
}
class Child2
{
    Parent2 m_Parent;  // raw pointer, no ref -- breaks the cycle
}
```

### 5. Tentando Usar Herança Múltipla

Enforce Script não suporta herança múltipla. Se você precisa compartilhar comportamento entre classes não relacionadas, use composição (mantenha uma referência a um objeto auxiliar) ou métodos utilitários estáticos.

```c
// CANNOT DO THIS:
// class FlyingCar extends Car, Aircraft { }  // ERROR

// Instead, use composition:
class FlyingCar extends Car
{
    protected ref FlightController m_Flight;

    void FlyingCar()
    {
        m_Flight = new FlightController;
    }

    void Fly(vector destination)
    {
        m_Flight.NavigateTo(destination);
    }
}
```

---

## Exercícios Práticos

### Exercício 1: Hierarquia de Formas
Crie uma classe base `Shape` com um método `float GetArea()`. Crie subclasses `Circle` (raio), `Rectangle` (largura, altura) e `Triangle` (base, altura) que sobrescrevem `GetArea()`. Imprima a área de cada uma.

### Exercício 2: Sistema de Logger
Crie uma classe `Logger` com um método `Log(string message)` que imprime no console. Crie `FileLogger` que a estende e também escreve em um arquivo conceitual (apenas imprima com prefixo `[FILE]`). Crie `DiscordLogger` que estende `Logger` e adiciona um prefixo `[DISCORD]`. Cada um deve chamar `super.Log()`.

### Exercício 3: Item de Inventário
Crie uma classe `CustomItem` com campos protegidos para `m_Weight`, `m_Value` e `m_Condition` (float 0-1). Inclua:
- Um construtor que recebe todos os três valores
- Getters para cada campo
- Um método `Degrade(float amount)` que reduz a condição (limitado a 0)
- Um método `GetEffectiveValue()` que retorna `m_Value * m_Condition`

Depois crie `CustomWeaponItem` que a estende, adicionando `m_Damage` e um override de `GetEffectiveValue()` que incorpora o dano.

### Exercício 4: Gerenciador Singleton
Implemente um singleton `SessionManager` que rastreia eventos de entrada/saída de jogadores. Deve armazenar tempos de entrada em um map e fornecer métodos:
- `OnPlayerJoin(string uid, string name)`
- `OnPlayerLeave(string uid)`
- `int GetOnlineCount()`
- `float GetSessionDuration(string uid)` (em segundos)

### Exercício 5: Cadeia de Comando
Crie uma classe abstrata `Handler` com `protected Handler m_Next` e métodos `SetNext(Handler next)` e `void Handle(string request)`. Crie três handlers concretos (`AuthHandler`, `PermissionHandler`, `ActionHandler`) que tratam a requisição ou passam para `m_Next`. Demonstre a cadeia.

---

## Resumo

| Conceito | Sintaxe | Observações |
|----------|---------|-------------|
| Declaração de classe | `class Name { }` | Membros públicos por padrão |
| Herança | `class Child extends Parent` | Apenas herança simples; também `: Parent` |
| Construtor | `void ClassName()` | Mesmo nome que a classe |
| Destrutor | `void ~ClassName()` | Chamado na exclusão |
| Private | `private int m_Field;` | Apenas esta classe |
| Protected | `protected int m_Field;` | Esta classe + subclasses |
| Public | `int m_Field;` | Sem palavra-chave necessária (padrão) |
| Override | `override void Method()` | Deve corresponder à assinatura do pai |
| Chamada super | `super.Method()` | Chama a versão do pai |
| Campo estático | `static int s_Count;` | Compartilhado entre todas as instâncias |
| Método estático | `static void DoThing()` | Chamado via `ClassName.DoThing()` |
| `ref` | `ref MyClass m_Obj;` | Referência forte (possui o objeto) |

---

[Início](../README.md) | [<< Anterior: Arrays, Maps & Sets](02-arrays-maps-sets.md) | **Classes & Herança** | [Próximo: Modded Classes >>](04-modded-classes.md)
