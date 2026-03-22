# Chapter 6.7: Timers & CallQueue

[Home](../README.md) | [<< Previous: Notifications](06-notifications.md) | **Timers & CallQueue** | [Next: File I/O & JSON >>](08-file-io.md)

---

## Introdução

DayZ fornece vários mecanismos para chamadas de função adiadas e repetidas: `ScriptCallQueue` (o sistema principal), `Timer`, `ScriptInvoker` e `WidgetFadeTimer`. Estes são essenciais para agendar lógica com atraso, criar loops de atualização e gerenciar eventos temporizados sem bloquear a thread principal. Este capítulo cobre cada mecanismo com assinaturas completas da API e padrões de uso.

---

## Categorias de Chamada

Todos os sistemas de timer e call queue requerem uma **categoria de chamada** que determina quando a chamada adiada é executada dentro do frame:

```c
const int CALL_CATEGORY_SYSTEM   = 0;   // Operações em nível de sistema
const int CALL_CATEGORY_GUI      = 1;   // Atualizações de UI
const int CALL_CATEGORY_GAMEPLAY = 2;   // Lógica de gameplay
const int CALL_CATEGORY_COUNT    = 3;   // Número total de categorias
```

Acessar a fila de uma categoria:

```c
ScriptCallQueue  queue   = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY);
ScriptInvoker    updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
TimerQueue       timers  = GetGame().GetTimerQueue(CALL_CATEGORY_GAMEPLAY);
```

---

## ScriptCallQueue

**Arquivo:** `3_Game/tools/utilityclasses.c`

O mecanismo principal para chamadas de função adiadas. Suporta atrasos únicos, chamadas repetidas e execução imediata no próximo frame.

### CallLater

```c
void CallLater(func fn, int delay = 0, bool repeat = false,
               void param1 = NULL, void param2 = NULL,
               void param3 = NULL, void param4 = NULL);
```

| Parâmetro | Descrição |
|-----------|-------------|
| `fn` | A função a chamar (referência de método: `this.MyMethod`) |
| `delay` | Atraso em milissegundos (0 = próximo frame) |
| `repeat` | `true` = chamar repetidamente em intervalos de `delay`; `false` = chamar uma vez |
| `param1..4` | Parâmetros opcionais passados para a função |

**Exemplo --- atraso único:**

```c
// Chamar MyFunction uma vez após 5 segundos
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunction, 5000, false);
```

**Exemplo --- chamada repetida:**

```c
// Chamar UpdateLoop a cada 1 segundo, repetindo
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.UpdateLoop, 1000, true);
```

**Exemplo --- com parâmetros:**

```c
void ShowMessage(string text, int color)
{
    Print(text);
}

// Chamar com parâmetros após 2 segundos
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(
    this.ShowMessage, 2000, false, "Hello!", ARGB(255, 255, 0, 0)
);
```

### Call

```c
void Call(func fn, void param1 = NULL, void param2 = NULL,
          void param3 = NULL, void param4 = NULL);
```

Executa a função no próximo frame (delay = 0, sem repetição). Atalho para `CallLater(fn, 0, false)`.

**Exemplo:**

```c
// Executar no próximo frame
GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).Call(this.Initialize);
```

### CallByName

```c
void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false,
                Param par = null);
```

Chamar um método pelo nome em string. Útil quando a referência do método não está diretamente disponível.

**Exemplo:**

```c
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallByName(
    myObject, "OnTimerExpired", 3000, false
);
```

### Remove

```c
void Remove(func fn);
```

Remove uma chamada agendada. Essencial para parar chamadas repetidas e prevenir chamadas em objetos destruídos.

**Exemplo:**

```c
// Parar uma chamada repetida
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.UpdateLoop);
```

### RemoveByName

```c
void RemoveByName(Class obj, string fnName);
```

Remove uma chamada agendada via `CallByName`.

### Tick

```c
void Tick(float timeslice);
```

Chamado internamente pela engine a cada frame. Você nunca deve precisar chamar isso manualmente.

---

## Timer

**Arquivo:** `3_Game/tools/utilityclasses.c`

Um timer baseado em classe com ciclo de vida explícito de start/stop. Mais limpo para timers de longa duração que precisam ser pausados ou reiniciados.

### Construtor

```c
void Timer(int category = CALL_CATEGORY_SYSTEM);
```

### Run

```c
void Run(float duration, Class obj, string fn_name, Param params = null, bool loop = false);
```

| Parâmetro | Descrição |
|-----------|-------------|
| `duration` | Tempo em segundos (não milissegundos!) |
| `obj` | O objeto cujo método será chamado |
| `fn_name` | Nome do método como string |
| `params` | Objeto `Param` opcional com parâmetros |
| `loop` | `true` = repetir após cada duração |

**Exemplo --- timer único:**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(5.0, this, "OnTimerComplete", null, false);
}

void OnTimerComplete()
{
    Print("Timer finished!");
}
```

**Exemplo --- timer repetido:**

```c
ref Timer m_UpdateTimer;

void StartUpdateLoop()
{
    m_UpdateTimer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_UpdateTimer.Run(1.0, this, "OnUpdate", null, true);  // A cada 1 segundo
}

void StopUpdateLoop()
{
    if (m_UpdateTimer && m_UpdateTimer.IsRunning())
        m_UpdateTimer.Stop();
}
```

### Stop

```c
void Stop();
```

Para o timer. Pode ser reiniciado com outra chamada `Run()`.

### IsRunning

```c
bool IsRunning();
```

Retorna `true` se o timer está ativo no momento.

### GetRemaining

```c
float GetRemaining();
```

Retorna o tempo restante em segundos.

### GetDuration

```c
float GetDuration();
```

Retorna a duração total definida por `Run()`.

---

## ScriptInvoker

**Arquivo:** `3_Game/tools/utilityclasses.c`

Um sistema de evento/delegate. `ScriptInvoker` mantém uma lista de funções callback e invoca todas quando `Invoke()` é chamado. Este é o equivalente do DayZ a eventos C# ou o padrão observer.

### Insert

```c
void Insert(func fn);
```

Registrar uma função callback.

### Remove

```c
void Remove(func fn);
```

Desregistrar uma função callback.

### Invoke

```c
void Invoke(void param1 = NULL, void param2 = NULL,
            void param3 = NULL, void param4 = NULL);
```

Chamar todas as funções registradas com os parâmetros fornecidos.

### Count

```c
int Count();
```

Número de callbacks registrados.

### Clear

```c
void Clear();
```

Remover todos os callbacks registrados.

**Exemplo --- sistema de eventos personalizado:**

```c
class MyModule
{
    ref ScriptInvoker m_OnMissionComplete = new ScriptInvoker();

    void CompleteMission()
    {
        // Fazer lógica de conclusão...

        // Notificar todos os ouvintes
        m_OnMissionComplete.Invoke("MissionAlpha", 1500);
    }
}

class MyUI
{
    void Init(MyModule module)
    {
        // Inscrever-se no evento
        module.m_OnMissionComplete.Insert(this.OnMissionComplete);
    }

    void OnMissionComplete(string name, int reward)
    {
        Print(string.Format("Mission %1 complete! Reward: %2", name, reward));
    }

    void Cleanup(MyModule module)
    {
        // Sempre desinscrever para prevenir referências pendentes
        module.m_OnMissionComplete.Remove(this.OnMissionComplete);
    }
}
```

### Fila de Atualização

A engine fornece filas `ScriptInvoker` por frame:

```c
ScriptInvoker updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
updater.Insert(this.OnFrame);

// Remover quando terminar
updater.Remove(this.OnFrame);
```

Funções registradas na fila de atualização são chamadas a cada frame sem parâmetros. Útil para lógica por frame sem usar `EntityEvent.FRAME`.

---

## WidgetFadeTimer

**Arquivo:** `3_Game/tools/utilityclasses.c`

Um timer especializado para fazer fade in e fade out de widgets.

```c
class WidgetFadeTimer
{
    void FadeIn(Widget w, float time, bool continue_from_current = false);
    void FadeOut(Widget w, float time, bool continue_from_current = false);
    bool IsFading();
    void Stop();
}
```

| Parâmetro | Descrição |
|-----------|-------------|
| `w` | O widget para fazer fade |
| `time` | Duração do fade em segundos |
| `continue_from_current` | Se `true`, começar do alpha atual; caso contrário começar de 0 (fade in) ou 1 (fade out) |

**Exemplo:**

```c
ref WidgetFadeTimer m_FadeTimer;
Widget m_NotificationPanel;

void ShowNotification()
{
    m_NotificationPanel.Show(true);
    m_FadeTimer = new WidgetFadeTimer;
    m_FadeTimer.FadeIn(m_NotificationPanel, 0.3);

    // Auto-esconder após 5 segundos
    GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(this.HideNotification, 5000, false);
}

void HideNotification()
{
    m_FadeTimer.FadeOut(m_NotificationPanel, 0.5);
}
```

---

## Padrões Comuns

### Acumulador de Timer (OnUpdate com Throttle)

Quando você tem um callback por frame mas quer rodar lógica a uma taxa mais lenta:

```c
class MyModule
{
    protected float m_UpdateAccumulator;
    protected const float UPDATE_INTERVAL = 2.0;  // A cada 2 segundos

    void OnUpdate(float timeslice)
    {
        m_UpdateAccumulator += timeslice;
        if (m_UpdateAccumulator < UPDATE_INTERVAL)
            return;
        m_UpdateAccumulator = 0;

        // Lógica com throttle aqui
        DoPeriodicWork();
    }
}
```

### Padrão de Limpeza

Sempre remova chamadas agendadas quando seu objeto é destruído para prevenir crashes:

```c
class MyManager
{
    void MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.Tick, 1000, true);
    }

    void ~MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.Tick);
    }

    void Tick()
    {
        // Trabalho periódico
    }
}
```

### Inicialização com Atraso Único

Um padrão comum para inicializar sistemas após o mundo estar totalmente carregado:

```c
void OnMissionStart()
{
    // Atrasar init por 1 segundo para garantir que tudo esteja carregado
    GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.DelayedInit, 1000, false);
}

void DelayedInit()
{
    // Seguro para acessar objetos do mundo agora
}
```

---

## Resumo

| Mecanismo | Caso de Uso | Unidade de Tempo |
|-----------|----------|-----------|
| `CallLater` | Chamadas adiadas únicas ou repetidas | Milissegundos |
| `Call` | Executar no próximo frame | N/A (imediato) |
| `Timer` | Timer baseado em classe com start/stop/remaining | Segundos |
| `ScriptInvoker` | Evento/delegate (padrão observer) | N/A (invoke manual) |
| `WidgetFadeTimer` | Fade-in/fade-out de widget | Segundos |
| `GetUpdateQueue()` | Registro de callback por frame | N/A (a cada frame) |

| Conceito | Ponto-chave |
|---------|-----------|
| Categorias | `CALL_CATEGORY_SYSTEM` (0), `GUI` (1), `GAMEPLAY` (2) |
| Remover chamadas | Sempre `Remove()` no destrutor para prevenir referências pendentes |
| Timer vs CallLater | Timer é em segundos + baseado em classe; CallLater é em milissegundos + funcional |
| ScriptInvoker | Insert/Remove callbacks, Invoke para disparar todos |

---

[<< Anterior: Notificações](06-notifications.md) | **Timers & CallQueue** | [Próximo: File I/O & JSON >>](08-file-io.md)
