# Chapter 6.6: Notification System

[Home](../README.md) | [<< Previous: Post-Process Effects](05-ppe.md) | **Notifications** | [Next: Timers & CallQueue >>](07-timers.md)

---

## Introdução

DayZ inclui um sistema de notificações integrado para exibir mensagens popup estilo toast para jogadores. A classe `NotificationSystem` fornece métodos estáticos para enviar notificações tanto localmente (lado do cliente) quanto do servidor para o cliente via RPC. Este capítulo cobre a API completa para enviar, personalizar e gerenciar notificações.

---

## NotificationSystem

**Arquivo:** `3_Game/client/notifications/notificationsystem.c` (320 linhas)

Uma classe estática que gerencia a fila de notificações. Notificações aparecem como pequenos cards popup no topo da tela, empilhados verticalmente, e desaparecem após o tempo de exibição expirar.

### Constantes

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Tempo padrão de exibição em segundos
const float NOTIFICATION_FADE_TIME = 3.0;   // Duração do fade-out em segundos
static const int MAX_NOTIFICATIONS = 5;     // Máximo de notificações visíveis
```

---

## Notificações Servidor-para-Cliente

Estes métodos são chamados no servidor. Eles enviam um RPC para o cliente do jogador alvo, que exibe a notificação localmente.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Jogador alvo (Man ou PlayerBase)
    float show_time,       // Duração de exibição em segundos
    string title_text,     // Título da notificação
    string detail_text = "",  // Texto do corpo opcional
    string icon = ""       // Caminho do ícone opcional (ex: "set:dayz_gui image:icon_info")
);
```

**Exemplo --- notificar um jogador específico:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // Mostrar por 8 segundos
        "Server Notice",       // Título
        message,               // Corpo
        ""                     // Ícone padrão
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Identidade alvo (null = broadcast para TODOS os jogadores)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Exemplo --- broadcast para todos os jogadores:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = todos os jogadores conectados
        10.0,                  // Mostrar por 10 segundos
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (Tipada)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Tipo de notificação predefinido
    float show_time,
    string detail_text = ""
);
```

Esta variante usa valores predefinidos do enum `NotificationType` que mapeiam para títulos e ícones integrados. O `detail_text` é adicionado como corpo.

---

## Notificações Locais (Cliente)

Estes métodos exibem notificações apenas no cliente local. Não envolvem rede.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Exemplo --- notificação local no cliente:**

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

### AddNotification (Tipada)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Usa um `NotificationType` predefinido para o título e ícone.

---

## Enum NotificationType

O jogo vanilla define tipos de notificação com títulos e ícones associados. Valores comuns:

| Tipo | Descrição |
|------|-------------|
| `NotificationType.GENERIC` | Notificação genérica |
| `NotificationType.FRIENDLY_FIRE` | Aviso de fogo amigo |
| `NotificationType.JOIN` | Jogador entrou |
| `NotificationType.LEAVE` | Jogador saiu |
| `NotificationType.STATUS` | Atualização de status |

> **Nota:** Os tipos disponíveis dependem da versão do jogo. Para máxima flexibilidade, use as variantes `Extended` que aceitam strings personalizadas de título e ícone.

---

## Caminhos de Ícones

Ícones usam a sintaxe de image set do DayZ:

```
"set:dayz_gui image:icon_name"
```

Nomes comuns de ícones:

| Ícone | Caminho do Set |
|------|----------|
| Info | `"set:dayz_gui image:icon_info"` |
| Aviso | `"set:dayz_gui image:icon_warning"` |
| Caveira | `"set:dayz_gui image:icon_skull"` |

Você também pode passar um caminho direto para um arquivo de imagem `.edds`:

```c
"MyMod/GUI/notification_icon.edds"
```

Ou passar uma string vazia `""` para sem ícone.

---

## Eventos

O `NotificationSystem` expõe script invokers para reagir ao ciclo de vida da notificação:

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Exemplo --- reagir a notificações:**

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
    Print("A notification was added");
}

void OnNotifRemoved()
{
    Print("A notification was removed");
}
```

---

## Loop de Atualização

O sistema de notificações precisa ser atualizado a cada frame para lidar com animações de fade-in/fade-out e remoção de notificações expiradas:

```c
static void Update(float timeslice);
```

Isto é chamado automaticamente pelo método `OnUpdate` da missão vanilla. Se você está escrevendo uma missão completamente personalizada, certifique-se de chamá-lo.

---

## Exemplo Completo Servidor-para-Cliente

Um padrão típico de mod para enviar notificações do código do servidor:

```c
// Lado do servidor: em um handler de evento da missão ou módulo
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // Broadcast para todos os jogadores
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

        // Notificar apenas este jogador
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

## Alternativa CommunityFramework (CF)

Se você usa CommunityFramework, ele fornece sua própria API de notificação:

```c
// Notificação CF (RPC interno diferente)
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

A API do CF adiciona suporte a cores e localização. Use o sistema que sua stack de mods requer --- eles são funcionalmente similares mas usam RPCs internos diferentes.

---

## Resumo

| Conceito | Ponto-chave |
|---------|-----------|
| Servidor para jogador | `SendNotificationToPlayerExtended(player, time, title, text, icon)` |
| Servidor para todos | `SendNotificationToPlayerIdentityExtended(null, time, title, text, icon)` |
| Local no cliente | `AddNotificationExtended(time, title, text, icon)` |
| Tipada | `SendNotificationToPlayer(player, NotificationType, time, text)` |
| Máximo visível | 5 notificações empilhadas |
| Tempo padrão | 10 segundos de exibição, 3 segundos de fade |
| Ícones | `"set:dayz_gui image:icon_name"` ou caminho direto `.edds` |
| Eventos | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

[<< Anterior: Efeitos Pós-Processamento](05-ppe.md) | **Notificações** | [Próximo: Timers & CallQueue >>](07-timers.md)
