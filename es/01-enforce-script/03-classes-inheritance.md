# Capitulo 1.3: Clases y Herencia

[Inicio](../README.md) | [<< Anterior: Arrays, Maps & Sets](02-arrays-maps-sets.md) | **Clases y Herencia** | [Siguiente: Modded Classes >>](04-modded-classes.md)

---

## Introduccion

Todo en DayZ es una clase. Cada arma, vehiculo, zombie, panel de UI, administrador de configuracion y jugador es una instancia de una clase. Entender como declarar, extender y trabajar con clases en Enforce Script es la base de todo el modding de DayZ.

El sistema de clases de Enforce Script es de herencia simple, orientado a objetos, con modificadores de acceso, constructores, destructores, miembros estaticos y sobreescritura de metodos. Si conoces C# o Java, los conceptos te resultaran familiares --- pero la sintaxis tiene su propio estilo, y hay diferencias importantes cubiertas en este capitulo.

---

## Declarar una Clase

Una clase agrupa datos (campos) y comportamiento (metodos) relacionados.

```c
class ZombieTracker
{
    // Campos (variables miembro)
    int m_ZombieCount;
    float m_SpawnRadius;
    string m_ZoneName;
    bool m_IsActive;
    vector m_CenterPos;

    // Metodos (funciones miembro)
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

### Convenciones de Nombres de Clases

El modding de DayZ sigue estas convenciones:
- Nombres de clase: `PascalCase` (ej., `PlayerTracker`, `LootManager`)
- Campos miembro: prefijo `m_PascalCase` (ej., `m_Health`, `m_PlayerList`)
- Campos estaticos: prefijo `s_PascalCase` (ej., `s_Instance`, `s_Counter`)
- Constantes: `UPPER_SNAKE_CASE` (ej., `MAX_HEALTH`, `DEFAULT_RADIUS`)
- Metodos: `PascalCase` (ej., `GetPosition()`, `SetHealth()`)
- Variables locales: `camelCase` (ej., `playerCount`, `nearestDist`)

### Crear y Usar Instancias

```c
void Example()
{
    // Crear una instancia con 'new'
    ZombieTracker tracker = new ZombieTracker;

    // Llamar metodos
    tracker.Activate(Vector(5000, 0, 8000), 200.0);

    if (tracker.IsActive())
    {
        float dist = tracker.GetDistanceToCenter(Vector(5050, 0, 8050));
        Print(string.Format("Distance: %1", dist));
    }

    // Destruir una instancia con 'delete' (usualmente no es necesario; ver seccion de Memoria)
    delete tracker;
}
```

---

## Constructores y Destructores

Los constructores inicializan un objeto cuando se crea. Los destructores limpian cuando se destruye. En Enforce Script, ambos usan el nombre de la clase --- el destructor tiene el prefijo `~`.

### Constructor

```c
class SpawnZone
{
    protected string m_Name;
    protected vector m_Position;
    protected float m_Radius;
    protected ref array<string> m_AllowedTypes;

    // Constructor: mismo nombre que la clase
    void SpawnZone(string name, vector pos, float radius)
    {
        m_Name = name;
        m_Position = pos;
        m_Radius = radius;
        m_AllowedTypes = new array<string>;

        Print(string.Format("[SpawnZone] Created: %1 at %2, radius %3", m_Name, m_Position, m_Radius));
    }

    // Destructor: prefijo ~
    void ~SpawnZone()
    {
        Print(string.Format("[SpawnZone] Destroyed: %1", m_Name));
        // m_AllowedTypes es ref, se eliminara automaticamente
    }

    void AddAllowedType(string typeName)
    {
        m_AllowedTypes.Insert(typeName);
    }
}
```

### Constructor Predeterminado (Sin Parametros)

Si no defines un constructor, la clase obtiene un constructor predeterminado implicito que inicializa todos los campos a sus valores predeterminados (`0`, `0.0`, `false`, `""`, `null`).

```c
class SimpleConfig
{
    int m_MaxPlayers;      // inicializado a 0
    float m_SpawnDelay;    // inicializado a 0.0
    string m_ServerName;   // inicializado a ""
    bool m_PvPEnabled;     // inicializado a false
}

void Test()
{
    SimpleConfig cfg = new SimpleConfig;
    // Todos los campos estan en sus valores predeterminados
    Print(cfg.m_MaxPlayers);  // 0
}
```

### Sobrecarga de Constructores

Puedes definir multiples constructores con diferentes listas de parametros:

```c
class DamageEvent
{
    protected float m_Amount;
    protected string m_Source;
    protected vector m_Position;

    // Constructor con todos los parametros
    void DamageEvent(float amount, string source, vector pos)
    {
        m_Amount = amount;
        m_Source = source;
        m_Position = pos;
    }

    // Constructor mas simple con valores predeterminados
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

## Modificadores de Acceso

Los modificadores de acceso controlan quien puede ver y usar campos y metodos.

| Modificador | Accesible Desde | Sintaxis |
|----------|----------------|--------|
| `private` | Solo la clase que lo declara | `private int m_Secret;` |
| `protected` | Clase que lo declara + todas las subclases | `protected int m_Health;` |
| *(ninguno)* | Desde cualquier lugar (publico) | `int m_Value;` |

No hay una palabra clave `public` explicita --- todo lo que no tiene `private` o `protected` es publico por defecto.

```c
class BaseVehicle
{
    // Publico: cualquiera puede acceder
    string m_DisplayName;

    // Protegido: solo esta clase y subclases
    protected float m_Fuel;
    protected float m_MaxFuel;

    // Privado: solo esta clase exacta
    private int m_InternalState;

    void BaseVehicle(string name, float maxFuel)
    {
        m_DisplayName = name;
        m_MaxFuel = maxFuel;
        m_Fuel = maxFuel;
        m_InternalState = 0;
    }

    // Metodo publico
    float GetFuelPercent()
    {
        return (m_Fuel / m_MaxFuel) * 100.0;
    }

    // Metodo protegido: las subclases pueden llamar esto
    protected void ConsumeFuel(float amount)
    {
        m_Fuel = Math.Clamp(m_Fuel - amount, 0, m_MaxFuel);
    }

    // Metodo privado: solo esta clase
    private void UpdateInternalState()
    {
        m_InternalState++;
    }
}
```

### Buena Practica: Encapsulamiento

Expone campos a traves de metodos (getters/setters) en lugar de hacerlos publicos. Esto te permite agregar validacion, logging o efectos secundarios despues sin romper el codigo que usa la clase.

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

    // Setter con validacion
    void SetHealth(float value)
    {
        m_Health = Math.Clamp(value, 0, m_MaxHealth);
    }

    // Metodos de conveniencia
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

## Herencia

La herencia te permite crear una nueva clase basada en una existente. La clase hija hereda todos los campos y metodos del padre, y puede agregar nuevos o sobreescribir el comportamiento existente.

### Sintaxis: `extends` o `:`

Enforce Script soporta dos sintaxis para herencia. Ambas son equivalentes:

```c
// Sintaxis 1: palabra clave extends (preferida, mas legible)
class Car extends BaseVehicle
{
}

// Sintaxis 2: dos puntos (estilo C++, tambien comun en codigo de DayZ)
class Truck : BaseVehicle
{
}
```

### Ejemplo Basico de Herencia

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
        // Nota: el constructor del padre se llama automaticamente sin argumentos,
        // o puedes inicializar los campos del padre directamente ya que son protegidos
        m_Name = name;
        m_Health = 100.0;
        m_Breed = breed;
    }

    string GetBreed()
    {
        return m_Breed;
    }

    // Nuevo metodo solo en Dog
    void Fetch()
    {
        Print(m_Name + " fetches the stick!");
    }
}

void Test()
{
    Dog rex = new Dog("Rex", "German Shepherd");
    rex.Speak();         // Heredado de Animal: "Rex makes a sound"
    rex.Fetch();         // Metodo propio de Dog: "Rex fetches the stick!"
    Print(rex.GetName()); // Heredado: "Rex"
    Print(rex.GetBreed()); // Propio de Dog: "German Shepherd"
}
```

### Solo Herencia Simple

Enforce Script soporta **solo herencia simple**. Una clase puede extender exactamente un padre. No hay herencia multiple, ni interfaces, ni mixins.

```c
class A { }
class B extends A { }     // OK: un solo padre
// class C extends A, B { }  // ERROR: herencia multiple no soportada
class D extends B { }     // OK: B extiende A, D extiende B (cadena de herencia)
```

### La Palabra Clave `sealed` (1.28+)

Una clase marcada como `sealed` no puede heredarse. Un metodo marcado como `sealed` no puede sobreescribirse. DayZ 1.28 aplica esto en tiempo de compilacion.

```c
sealed class FinalClass
{
    void DoWork()
    {
        // Esta clase no puede extenderse
    }
}

class MyChild : FinalClass  // ERROR DE COMPILACION: no se puede heredar de clase sealed
{
}
```

Los metodos tambien pueden ser sealed individualmente:

```c
class MyBase
{
    sealed void LockedMethod()
    {
        // No puede sobreescribirse en clases hijas
    }

    void OpenMethod()
    {
        // Puede sobreescribirse normalmente
    }
}
```

> **Nota de migracion:** Si actualizas a DayZ 1.28 y obtienes un error de compilacion sobre heredar de una clase sealed, debes refactorizar. Usa composicion (envuelve la clase como un miembro) en lugar de herencia.

`sealed` rara vez se usa en modding de DayZ ya que la extensibilidad es el objetivo principal.

---

## Sobreescritura de Metodos

Cuando una subclase necesita cambiar el comportamiento de un metodo heredado, usa la palabra clave `override`. El compilador verifica que la firma del metodo coincida con un metodo en la clase padre.

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
        // Dano base, sin caida
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

    // Override: cambiar el calculo de dano para incluir caida por distancia
    override float CalculateDamage(float distance)
    {
        float falloff = Math.Clamp(1.0 - (distance / m_MaxRange), 0.1, 1.0);
        return m_Damage * falloff;
    }

    // Override: agregar info de alcance
    override string GetInfo()
    {
        return string.Format("%1 (Dmg: %2, Range: %3m)", m_Name, m_Damage, m_MaxRange);
    }
}
```

### La Palabra Clave `super`

`super` se refiere a la clase padre. Usala para llamar a la version del padre de un metodo, y luego agregar tu propia logica encima. Esto es critico --- especialmente en [clases modded](04-modded-classes.md).

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
        // Llamar al Log del padre primero
        super.Log(message);

        // Luego agregar logging con timestamp
        int hour, minute, second;
        GetHourMinuteSecond(hour, minute, second);
        Print(string.Format("[%1:%2:%3] %4", hour, minute, second, message));
    }
}
```

### Palabra Clave `this`

`this` se refiere a la instancia actual del objeto. Usualmente es implicito (no necesitas escribirlo), pero puede ser util para claridad o cuando pasas el objeto actual a otra funcion.

```c
class EventManager
{
    void Register(Managed handler) { /* ... */ }
}

class MyPlugin
{
    void Init(EventManager mgr)
    {
        // Pasar 'this' (la instancia actual de MyPlugin) al manager
        mgr.Register(this);
    }
}
```

---

## Metodos y Campos Estaticos

Los miembros estaticos pertenecen a la clase en si, no a ninguna instancia. Se acceden usando el nombre de la clase, no una variable de objeto.

### Campos Estaticos

```c
class GameConfig
{
    // Campos estaticos: compartidos entre todas las instancias (y accesibles sin una instancia)
    static int s_MaxPlayers = 60;
    static float s_TickRate = 30.0;
    static string s_ServerName = "My Server";

    // Campo regular (de instancia)
    protected bool m_IsLoaded;
}

void UseStaticFields()
{
    // Acceder sin crear una instancia
    Print(GameConfig.s_MaxPlayers);     // 60
    Print(GameConfig.s_ServerName);     // "My Server"

    // Modificar
    GameConfig.s_MaxPlayers = 40;
}
```

### Metodos Estaticos

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

### El Patron Singleton

El uso mas comun de campos estaticos en mods de DayZ es el patron singleton: una clase que tiene exactamente una instancia, accesible globalmente.

```c
class MyModManager
{
    // Referencia estatica a la unica instancia
    private static ref MyModManager s_Instance;

    protected bool m_Initialized;
    protected ref array<string> m_Data;

    void MyModManager()
    {
        m_Initialized = false;
        m_Data = new array<string>;
    }

    // Getter estatico para el singleton
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

    // Limpieza estatica
    static void Destroy()
    {
        s_Instance = null;
    }
}

// Uso desde cualquier lugar:
void SomeFunction()
{
    MyModManager.GetInstance().Init();
}
```

---

## Ejemplo del Mundo Real: Clase de Item Personalizado

Aqui hay un ejemplo completo mostrando una jerarquia de clases de items personalizados en el estilo del modding de DayZ. Esto demuestra todo lo cubierto en este capitulo.

```c
// Clase base para todos los items medicos personalizados
class CustomMedicalBase extends ItemBase
{
    protected float m_HealAmount;
    protected float m_UseTime;      // segundos para usar
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

    // Puede ser sobreescrito por subclases
    void OnApplied(PlayerBase player)
    {
        if (!player)
            return;

        player.AddHealth("", "Health", m_HealAmount);
        Print(string.Format("[Medical] %1 applied, healed %2", GetType(), m_HealAmount));
    }
}

// Item medico especifico: Vendaje
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

        // Efecto adicional especifico del vendaje: detener sangrado
        // (ejemplo simplificado)
        Print("[Medical] Bleeding stopped");
    }
}

// Item medico especifico: Kit de Primeros Auxilios (cura mas, tarda mas)
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

### config.cpp para Items Personalizados

La jerarquia de clases en script debe coincidir con la herencia en `config.cpp`:

```cpp
class CfgVehicles
{
    class ItemBase;

    class CustomMedicalBase : ItemBase
    {
        scope = 0;  // 0 = abstracto, no se puede spawnear
        displayName = "";
    };

    class CustomBandage : CustomMedicalBase
    {
        scope = 2;  // 2 = publico, se puede spawnear
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

## La Jerarquia de Clases de DayZ

Entender la jerarquia de clases vanilla es esencial para el modding. Aqui estan las clases mas importantes de las que heredaras o con las que interactuaras:

```
Class                          // Raiz de todos los tipos de referencia
  Managed                      // Previene el conteo de referencias del motor (usar para clases puras de script)
  IEntity                      // Base de entidad del motor
    Object                     // Cualquier cosa con posicion en el mundo
      Entity
        EntityAI               // Tiene inventario, salud, acciones
          InventoryItem
            ItemBase           // TODOS los items (heredar de esto para items personalizados)
              Weapon_Base      // Todas las armas
              Magazine_Base    // Todos los cargadores
              Clothing_Base    // Toda la ropa
          Transport
            CarScript          // Todos los vehiculos
          DayZCreatureAI
            DayZInfected       // Zombies
            DayZAnimal         // Animales
          Man
            DayZPlayer
              PlayerBase       // LA clase del jugador (se moddea constantemente)
                SurvivorBase   // Apariencia del personaje
```

### Clases Base Comunes para Modding

| Si quieres crear... | Extiende... |
|--------------------------|-----------|
| Un nuevo item | `ItemBase` |
| Una nueva arma | `Weapon_Base` |
| Una nueva pieza de ropa | `Clothing_Base` |
| Un nuevo vehiculo | `CarScript` |
| Un elemento de UI | `UIScriptedMenu` o `ScriptedWidgetEventHandler` |
| Un manager/sistema | `Managed` |
| Una clase de datos de configuracion | `Managed` |
| Un hook de mision | `MissionServer` o `MissionGameplay` (via `modded class`) |

---

## Errores Comunes

### 1. Olvidar `ref` para Objetos Propios

```mermaid
classDiagram
    class Object {
        +GetPosition() vector
        +SetPosition(vector)
        +GetType() string
        +IsKindOf(string) bool
    }

    class Entity {
        +GetOrientation() vector
        +SetOrientation(vector)
    }

    class EntityAI {
        +GetHealth(string, string) float
        +SetHealth(string, string, float)
        +IsAlive() bool
        +GetInventory() GameInventory
    }

    class ItemBase {
        +GetQuantity() float
        +SetQuantity(float)
        +OnDebugSpawn()
    }

    class PlayerBase {
        +GetIdentity() PlayerIdentity
        +GetBleeding() bool
        +IsRestrained() bool
    }

    class Building {
        +GetDoorIndex(int) int
    }

    class CarScript {
        +EngineStart()
        +EngineStop()
        +Fill(CarFluid, float)
    }

    Object <|-- Entity
    Entity <|-- EntityAI
    EntityAI <|-- ItemBase
    EntityAI <|-- ManBase
    EntityAI <|-- Building
    EntityAI <|-- DayZInfected
    ManBase <|-- PlayerBase
    ItemBase <|-- Weapon_Base
    ItemBase <|-- ClothingBase
    EntityAI <|-- CarScript
```

Cuando una clase posee otro objeto (lo crea, es responsable de su tiempo de vida), declara el campo como `ref`. Sin `ref`, el objeto puede ser recolectado por el garbage collector inesperadamente.

```c
// MAL: m_Data podria ser recolectado por el garbage collector
class BadManager
{
    array<string> m_Data;  // puntero crudo, sin ownership

    void BadManager()
    {
        m_Data = new array<string>;  // el objeto podria ser recolectado
    }
}

// BIEN: ref asegura que el manager mantiene m_Data vivo
class GoodManager
{
    ref array<string> m_Data;  // referencia fuerte, posee el objeto

    void GoodManager()
    {
        m_Data = new array<string>;
    }
}
```

### 2. Olvidar la Palabra Clave `override`

Si intentas sobreescribir un metodo del padre pero olvidas la palabra clave `override`, obtienes un metodo **nuevo** que oculta el metodo del padre en lugar de reemplazarlo. El compilador puede advertir sobre esto.

```c
class Parent
{
    void DoWork() { Print("Parent"); }
}

class Child extends Parent
{
    // MAL: crea un nuevo metodo, no sobreescribe
    void DoWork() { Print("Child"); }

    // BIEN: sobreescribe correctamente
    override void DoWork() { Print("Child"); }
}
```

### 3. No Llamar a `super` en Sobreescrituras

Cuando sobreescribes un metodo, el codigo del padre NO se llama automaticamente. Si omites `super`, pierdes el comportamiento del padre --- lo cual puede romper la funcionalidad, especialmente en las profundas cadenas de herencia de DayZ.

```c
class Parent
{
    void Init()
    {
        // La inicializacion critica ocurre aqui
        Print("Parent.Init()");
    }
}

class Child extends Parent
{
    // MAL: Parent.Init() nunca se ejecuta
    override void Init()
    {
        Print("Child.Init()");
    }

    // BIEN: Parent.Init() se ejecuta primero, luego el hijo agrega comportamiento
    override void Init()
    {
        super.Init();
        Print("Child.Init()");
    }
}
```

### 4. Los Ciclos de Ref Causan Fugas de Memoria

Si el objeto A tiene un `ref` al objeto B, y el objeto B tiene un `ref` al objeto A, ninguno puede ser liberado. Un lado debe usar un puntero crudo (sin ref).

```c
// MAL: ciclo de ref, ningun objeto puede ser liberado
class Parent
{
    ref Child m_Child;
}
class Child
{
    ref Parent m_Parent;  // FUGA: ref circular
}

// BIEN: el hijo tiene un puntero crudo al padre
class Parent2
{
    ref Child2 m_Child;
}
class Child2
{
    Parent2 m_Parent;  // puntero crudo, sin ref -- rompe el ciclo
}
```

### 5. Intentar Usar Herencia Multiple

Enforce Script no soporta herencia multiple. Si necesitas compartir comportamiento entre clases no relacionadas, usa composicion (mantener una referencia a un objeto auxiliar) o metodos estaticos de utilidad.

```c
// NO SE PUEDE HACER ESTO:
// class FlyingCar extends Car, Aircraft { }  // ERROR

// En su lugar, usa composicion:
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

## Mejores Practicas

- Siempre llama a `super.MethodName()` en sobreescrituras a menos que intencionalmente quieras reemplazar el comportamiento del padre por completo -- las profundas cadenas de herencia de DayZ dependen de ello.
- Usa `protected` para campos miembro y exponlos via metodos getter/setter -- esto te permite agregar validacion o logging despues sin romper los llamadores.
- Prefiere composicion sobre herencia profunda al combinar comportamientos no relacionados (por ejemplo, un controlador de vuelo dentro de un vehiculo, no un FlyingCar con multi-herencia).
- Marca miembros de objeto propios con `ref` en la declaracion -- sin esto, el objeto puede ser recolectado por el garbage collector mientras tu clase todavia lo espera.
- Usa el patron singleton (`static ref` + `GetInstance()`) para clases manager que deben tener exactamente una instancia.

---

## Observado en Mods Reales

> Patrones confirmados estudiando codigo fuente de mods profesionales de DayZ.

| Patron | Mod | Detalle |
|---------|-----|--------|
| Singleton via `static ref` + `GetInstance()` | COT / Expansion | Cada manager importante (permisos, notificaciones, mercado) sigue este patron exacto |
| Constructor inicializa todas las colecciones `ref` | Dabs Framework | Los constructores siempre crean `new array` / `new map` para cada miembro `ref` |
| `override` + `super` en cada metodo de ciclo de vida | VPP Admin | `OnInit`, `OnMissionStart`, `OnUpdate` siempre llaman a `super` primero, luego agregan comportamiento |
| Base abstracta con `scope=0` en config.cpp | Expansion Vehicles | La clase de script base del vehiculo tiene `scope=0` (no se puede spawnear), las subclases concretas tienen `scope=2` |

---

## Teoria vs Practica

| Concepto | Teoria | Realidad |
|---------|--------|---------|
| Omitir la palabra clave `override` | Deberia crear un metodo nuevo | A menudo crea un bug sutil donde el metodo del padre se ejecuta en lugar del hijo |
| Multiples constructores (sobrecarga) | Caracteristica estandar de OOP | Funciona pero rara vez se usa en mods de DayZ -- la mayoria de clases usan un solo constructor con valores predeterminados |
| Clases/metodos `sealed` | Previene herencia o sobreescritura (forzado en compilacion desde 1.28) | Casi nunca se usa en modding de DayZ porque la extensibilidad es el punto central |

---

## Ejercicios Practicos

### Ejercicio 1: Jerarquia de Formas
Crea una clase base `Shape` con un metodo `float GetArea()`. Crea subclases `Circle` (radio), `Rectangle` (ancho, alto) y `Triangle` (base, alto) que sobreescriban `GetArea()`. Imprime el area de cada una.

### Ejercicio 2: Sistema de Logger
Crea una clase `Logger` con un metodo `Log(string message)` que imprima en consola. Crea `FileLogger` que la extienda y tambien escriba en un archivo conceptual (solo imprime con un prefijo `[FILE]`). Crea `DiscordLogger` que extienda `Logger` y agregue un prefijo `[DISCORD]`. Cada uno deberia llamar a `super.Log()`.

### Ejercicio 3: Item de Inventario
Crea una clase `CustomItem` con campos protegidos para `m_Weight`, `m_Value` y `m_Condition` (float 0-1). Incluye:
- Un constructor que tome los tres valores
- Getters para cada campo
- Un metodo `Degrade(float amount)` que reduzca la condicion (limitado a 0)
- Un metodo `GetEffectiveValue()` que retorne `m_Value * m_Condition`

Luego crea `CustomWeaponItem` que la extienda, agregando `m_Damage` y un override de `GetEffectiveValue()` que incluya el dano.

### Ejercicio 4: Manager Singleton
Implementa un singleton `SessionManager` que rastree eventos de entrada/salida de jugadores. Deberia almacenar tiempos de entrada en un map y proveer metodos:
- `OnPlayerJoin(string uid, string name)`
- `OnPlayerLeave(string uid)`
- `int GetOnlineCount()`
- `float GetSessionDuration(string uid)` (en segundos)

### Ejercicio 5: Cadena de Mando
Crea una clase abstracta `Handler` con `protected Handler m_Next` y metodos `SetNext(Handler next)` y `void Handle(string request)`. Crea tres handlers concretos (`AuthHandler`, `PermissionHandler`, `ActionHandler`) que manejen la solicitud o la pasen a `m_Next`. Demuestra la cadena.

---

## Resumen

| Concepto | Sintaxis | Notas |
|---------|--------|-------|
| Declaracion de clase | `class Name { }` | Miembros publicos por defecto |
| Herencia | `class Child extends Parent` | Solo herencia simple; tambien `: Parent` |
| Constructor | `void ClassName()` | Mismo nombre que la clase |
| Destructor | `void ~ClassName()` | Se llama al eliminarse |
| Privado | `private int m_Field;` | Solo esta clase |
| Protegido | `protected int m_Field;` | Esta clase + subclases |
| Publico | `int m_Field;` | No necesita palabra clave (predeterminado) |
| Override | `override void Method()` | Debe coincidir con la firma del padre |
| Llamada a super | `super.Method()` | Llama a la version del padre |
| Campo estatico | `static int s_Count;` | Compartido entre todas las instancias |
| Metodo estatico | `static void DoThing()` | Se llama via `ClassName.DoThing()` |
| `ref` | `ref MyClass m_Obj;` | Referencia fuerte (posee el objeto) |
| Clase sealed | `sealed class Name { }` | No puede heredarse (error de compilacion en 1.28+) |
| Metodo sealed | `sealed void Method()` | No puede sobreescribirse en clases hijas |
| Proto native | `proto native void Func();` | Metodo implementado en el motor |
| Parametro `out` | `void Func(out int val)` | Parametro de solo salida |
| Parametro `inout` | `void Func(inout array<int> a)` | Parametro de entrada + salida |
| Parametro `notnull` | `void Func(notnull EntityAI e)` | No null forzado por el compilador |

---

[Inicio](../README.md) | [<< Anterior: Arrays, Maps & Sets](02-arrays-maps-sets.md) | **Clases y Herencia** | [Siguiente: Modded Classes >>](04-modded-classes.md)
