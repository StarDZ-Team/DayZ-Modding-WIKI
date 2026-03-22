# Capítulo 6.6: Sistema de Notificaciones

[Inicio](../README.md) | [<< Anterior: Efectos de Post-Procesado](05-ppe.md) | **Notificaciones** | [Siguiente: Timers y CallQueue >>](07-timers.md)

---

## Introducción

DayZ incluye un sistema de notificaciones integrado para mostrar mensajes emergentes tipo "toast" a los jugadores. La clase `NotificationSystem` proporciona métodos estáticos para enviar notificaciones tanto localmente (lado del cliente) como del servidor al cliente mediante RPC. Este capítulo cubre la API completa para enviar, personalizar y gestionar notificaciones.

---

## NotificationSystem

**Archivo:** `3_Game/client/notifications/notificationsystem.c` (320 líneas)

Una clase estática que gestiona la cola de notificaciones. Las notificaciones aparecen como pequeñas tarjetas emergentes en la parte superior de la pantalla, apiladas verticalmente, y se desvanecen después de que expira su tiempo de visualización.

### Constantes

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Tiempo de visualización por defecto en segundos
const float NOTIFICATION_FADE_TIME = 3.0;   // Duración del desvanecimiento en segundos
static const int MAX_NOTIFICATIONS = 5;     // Máximo de notificaciones visibles
```

---

## Notificaciones de Servidor a Cliente

Estos métodos se llaman en el servidor. Envían un RPC al cliente del jugador objetivo, que muestra la notificación localmente.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Jugador objetivo (Man o PlayerBase)
    float show_time,       // Duración de visualización en segundos
    string title_text,     // Título de la notificación
    string detail_text = "",  // Texto del cuerpo (opcional)
    string icon = ""       // Ruta del ícono (opcional, ej: "set:dayz_gui image:icon_info")
);
```

**Ejemplo --- notificar a un jugador específico:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // Mostrar durante 8 segundos
        "Server Notice",       // Título
        message,               // Cuerpo
        ""                     // Ícono por defecto
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Identidad objetivo (null = transmitir a TODOS los jugadores)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Ejemplo --- transmitir a todos los jugadores:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = todos los jugadores conectados
        10.0,                  // Mostrar durante 10 segundos
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (Con Tipo)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Tipo de notificación predefinido
    float show_time,
    string detail_text = ""
);
```

Esta variante utiliza valores predefinidos del enum `NotificationType` que se asignan a títulos e íconos integrados. El `detail_text` se añade como cuerpo.

---

## Notificaciones del Lado del Cliente (Locales)

Estos métodos muestran notificaciones solo en el cliente local. No involucran ninguna comunicación de red.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Ejemplo --- notificación local en el cliente:**

```c
void ShowLocalNotification(string title, string body)
{
    if (!GetGame().IsClient())
        return;

    NotificationSystem.AddNotificationExtended(
        5.0,
        title,
        body,
        "set:dayz_gui image:icon_info"
    );
}
```

### AddNotification (Con Tipo)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Usa un `NotificationType` predefinido para el título y el ícono.

---

## Enum NotificationType

El juego vanilla define tipos de notificación con títulos e íconos asociados. Valores comunes:

| Tipo | Descripción |
|------|-------------|
| `NotificationType.GENERIC` | Notificación genérica |
| `NotificationType.FRIENDLY_FIRE` | Advertencia de fuego amigo |
| `NotificationType.JOIN` | Jugador se unió |
| `NotificationType.LEAVE` | Jugador se fue |
| `NotificationType.STATUS` | Actualización de estado |

> **Nota:** Los tipos disponibles dependen de la versión del juego. Para máxima flexibilidad, usa las variantes `Extended` que aceptan strings personalizados de título e ícono.

---

## Rutas de Íconos

Los íconos usan la sintaxis de conjunto de imágenes de DayZ:

```
"set:dayz_gui image:icon_name"
```

Nombres de íconos comunes:

| Ícono | Ruta del Set |
|-------|-------------|
| Información | `"set:dayz_gui image:icon_info"` |
| Advertencia | `"set:dayz_gui image:icon_warning"` |
| Calavera | `"set:dayz_gui image:icon_skull"` |

También puedes pasar una ruta directa a un archivo de imagen `.edds`:

```c
"MyMod/GUI/notification_icon.edds"
```

O pasar un string vacío `""` para no mostrar ícono.

---

## Eventos

El `NotificationSystem` expone script invokers para reaccionar al ciclo de vida de las notificaciones:

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Ejemplo --- reaccionar a notificaciones:**

```c
void Init()
{
    NotificationSystem notifSys = GetNotificationSystem();
    if (notifSys)
    {
        notifSys.m_OnNotificationAdded.Insert(OnNotifAdded);
        notifSys.m_OnNotificationRemoved.Insert(OnNotifRemoved);
    }
}

void OnNotifAdded()
{
    Print("Se agregó una notificación");
}

void OnNotifRemoved()
{
    Print("Se eliminó una notificación");
}
```

---

## Bucle de Actualización

El sistema de notificaciones debe actualizarse cada frame para manejar las animaciones de aparición/desvanecimiento y la eliminación de notificaciones expiradas:

```c
static void Update(float timeslice);
```

Esto se llama automáticamente por el método `OnUpdate` de la misión vanilla. Si estás escribiendo una misión completamente personalizada, asegúrate de llamarlo.

---

## Ejemplo Completo de Servidor a Cliente

Un patrón típico de mod para enviar notificaciones desde código del servidor:

```c
// Lado del servidor: en un manejador de eventos de misión o módulo
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // Transmitir a todos los jugadores
        string title = "Mission Started!";
        string body = string.Format("Go to %1!", missionName);

        NotificationSystem.SendNotificationToPlayerIdentityExtended(
            null,
            12.0,
            title,
            body,
            "set:dayz_gui image:icon_info"
        );
    }

    void OnPlayerEnteredZone(PlayerBase player, string zoneName)
    {
        if (!GetGame().IsServer())
            return;

        // Notificar solo a este jugador
        NotificationSystem.SendNotificationToPlayerExtended(
            player,
            5.0,
            "Zone Entered",
            string.Format("You have entered %1", zoneName),
            ""
        );
    }
}
```

---

## Alternativa de CommunityFramework (CF)

Si usas CommunityFramework, este proporciona su propia API de notificaciones:

```c
// Notificación de CF (RPC diferente internamente)
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

La API de CF agrega soporte para colores y localización. Usa el sistema que tu stack de mods requiera --- son funcionalmente similares pero usan RPCs internos diferentes.

---

## Resumen

| Concepto | Punto Clave |
|---------|-----------|
| Servidor a jugador | `SendNotificationToPlayerExtended(player, time, title, text, icon)` |
| Servidor a todos | `SendNotificationToPlayerIdentityExtended(null, time, title, text, icon)` |
| Cliente local | `AddNotificationExtended(time, title, text, icon)` |
| Con tipo | `SendNotificationToPlayer(player, NotificationType, time, text)` |
| Máximo visible | 5 notificaciones apiladas |
| Tiempo por defecto | 10 segundos de visualización, 3 segundos de desvanecimiento |
| Íconos | `"set:dayz_gui image:icon_name"` o ruta directa `.edds` |
| Eventos | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## Mejores Prácticas

- **Usa las variantes `Extended` para notificaciones personalizadas.** `SendNotificationToPlayerExtended` te da control total sobre título, cuerpo e ícono. Las variantes con `NotificationType` están limitadas a los presets vanilla.
- **Respeta el límite de 5 notificaciones apiladas.** Enviar muchas notificaciones en rápida sucesión empuja las anteriores fuera de pantalla antes de que los jugadores puedan leerlas. Agrupa mensajes relacionados o usa tiempos de visualización más largos.
- **Siempre protege las notificaciones del servidor con `GetGame().IsServer()`.** Llamar a `SendNotificationToPlayerExtended` en el cliente no tiene efecto y desperdicia una llamada de método.
- **Pasa `null` como identidad para transmisiones reales.** `SendNotificationToPlayerIdentityExtended(null, ...)` envía a todos los jugadores conectados. No iteres manualmente por los jugadores para enviar el mismo mensaje.
- **Mantén el texto de la notificación conciso.** La ventana emergente tiene un ancho de visualización limitado. Títulos o cuerpos largos serán recortados. Apunta a títulos de menos de 30 caracteres y texto del cuerpo de menos de 80 caracteres.

---

## Compatibilidad e Impacto

- **Multi-Mod:** El `NotificationSystem` vanilla es compartido por todos los mods. Múltiples mods enviando notificaciones simultáneamente pueden desbordar la pila de 5 notificaciones. CF proporciona un canal de notificaciones separado que no entra en conflicto con las notificaciones vanilla.
- **Rendimiento:** Las notificaciones son ligeras (un solo RPC por notificación). Sin embargo, transmitir a todos los jugadores cada pocos segundos genera tráfico de red medible en servidores con más de 60 jugadores.
- **Servidor/Cliente:** Los métodos `SendNotificationToPlayer*` son RPCs de servidor a cliente. `AddNotificationExtended` es solo del cliente (local). El tick de `Update()` se ejecuta en el bucle de misión del cliente.

---

[<< Anterior: Efectos de Post-Procesado](05-ppe.md) | **Notificaciones** | [Siguiente: Timers y CallQueue >>](07-timers.md)
