# Chapter 6.5: Post-Process Effects (PPE)

[Home](../../README.md) | [<< Previous: Cameras](04-cameras.md) | **Post-Process Effects** | [Next: Notifications >>](06-notifications.md)

---

## Introdução

O sistema de Efeitos Pós-Processamento (PPE) do DayZ controla efeitos visuais aplicados após a renderização da cena: blur, color grading, vinheta, aberração cromática, visão noturna é mais. O sistema é construído em torno de classes `PPERequester` que podem solicitar efeitos visuais específicos. Múltiplos requesters podem estar ativos simultaneamente, é a engine combina suas contribuições. Este capítulo cobre como usar o sistema PPE em mods.

---

## Visão Geral da Arquitetura

```
PPEManager
├── PPERequesterBank              // Registro estático de todos os requesters disponíveis
│   ├── REQ_INVENTORYBLUR         // Blur do inventário
│   ├── REQ_MENUEFFECTS           // Efeitos de menu
│   ├── REQ_CONTROLLERDISCONNECT  // Overlay de controle desconectado
│   ├── REQ_UNCONSCIOUS           // Efeito de inconsciência
│   ├── REQ_FEVEREFFECTS          // Efeitos visuais de febre
│   ├── REQ_FLASHBANGEFFECTS      // Flashbang
│   ├── REQ_BURLAPSACK            // Saco de estopa na cabeça
│   ├── REQ_DEATHEFFECTS          // Tela de morte
│   ├── REQ_BLOODLOSS             // Dessaturação por perda de sangue
│   └── ... (muitos mais)
└── PPERequester_*                // Implementações individuais de requester
```

---

## PPEManager

O `PPEManager` é um singleton que coordena todas as requisições PPE ativas. Raramente você interage com ele diretamente --- ao invés disso, trabalha através de subclasses de `PPERequester`.

```c
// Obter a instância do manager
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**Arquivo:** `3_Game/PPE/pperequesterbank.c`

Um registro estático que mantém instâncias de todos os requesters PPE. Acesse requesters específicos por seu índice constante.

### Obtendo um Requester

```c
// Obter um requester pelo índice constante do banco
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### Constantes Comuns de Requester

| Constante | Efeito |
|----------|--------|
| `REQ_INVENTORYBLUR` | Blur gaussiano quando o inventário está aberto |
| `REQ_MENUEFFECTS` | Blur de fundo do menu |
| `REQ_UNCONSCIOUS` | Visual de inconsciência (blur + dessaturação) |
| `REQ_DEATHEFFECTS` | Tela de morte (escala de cinza + vinheta) |
| `REQ_BLOODLOSS` | Dessaturação por perda de sangue |
| `REQ_FEVEREFFECTS` | Aberração cromática de febre |
| `REQ_FLASHBANGEFFECTS` | Branco de flashbang |
| `REQ_BURLAPSACK` | Venda do saco de estopa |
| `REQ_PAINBLUR` | Efeito de blur de dor |
| `REQ_CONTROLLERDISCONNECT` | Overlay de controle desconectado |
| `REQ_CAMERANV` | Visão noturna |
| `REQ_FILMGRAINEFFECTS` | Overlay de film grain |
| `REQ_RAINEFFECTS` | Efeitos de chuva na tela |
| `REQ_COLORSETTING` | Configurações de correção de cor |

---

## PPERequester Base

Todos os requesters PPE estendem `PPERequester`:

```c
class PPERequester : Managed
{
    // Iniciar o efeito
    void Start(Param par = null);

    // Parar o efeito
    void Stop(Param par = null);

    // Verificar se está ativo
    bool IsActiveRequester();

    // Definir valores nos parâmetros do material
    void SetTargetValueFloat(int mat_id, int param_idx, bool relative,
                              float val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueColor(int mat_id, int param_idx, bool relative,
                              float val1, float val2, float val3, float val4,
                              int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueBool(int mat_id, int param_idx, bool relative,
                             bool val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueInt(int mat_id, int param_idx, bool relative,
                            int val, int priority_layer, int operator = PPOperators.SET);
}
```

### PPOperators

```c
class PPOperators
{
    static const int SET          = 0;  // Definir o valor diretamente
    static const int ADD          = 1;  // Adicionar ao valor atual
    static const int ADD_RELATIVE = 2;  // Adicionar relativo ao atual
    static const int HIGHEST      = 3;  // Usar o maior entre atual e novo
    static const int LOWEST       = 4;  // Usar o menor entre atual e novo
    static const int MULTIPLY     = 5;  // Multiplicar valor atual
    static const int OVERRIDE     = 6;  // Forçar sobrescrita
}
```

---

## IDs Comuns de Matériais PPE

Efeitos visam matériais específicos de pós-processamento. IDs comuns de matérial:

| Constante | Matérial |
|----------|----------|
| `PostProcessEffectType.Glow` | Bloom / brilho |
| `PostProcessEffectType.FilmGrain` | Film grain |
| `PostProcessEffectType.RadialBlur` | Blur radial |
| `PostProcessEffectType.ChromAber` | Aberração cromática |
| `PostProcessEffectType.WetEffect` | Efeito de lente molhada |
| `PostProcessEffectType.ColorGrading` | Color grading / LUT |
| `PostProcessEffectType.DepthOfField` | Profundidade de campo |
| `PostProcessEffectType.SSAO` | Oclusão de ambiente em espaço de tela |
| `PostProcessEffectType.GodRays` | Luz volumétrica |
| `PostProcessEffectType.Rain` | Chuva na tela |
| `PostProcessEffectType.Vignette` | Overlay de vinheta |
| `PostProcessEffectType.HBAO` | Oclusão de ambiente baseada em horizonte |

---

## Usando Requesters Integrados

### Blur de Inventário

O exemplo mais simples --- o blur que aparece quando o inventário abre:

```c
// Iniciar blur
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Parar blur
blurReq.Stop();
```

### Efeito de Flashbang

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// Parar após um atraso
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## Criando um PPE Requester Personalizado

Para criar efeitos pós-processamento personalizados, estenda `PPERequester` é registre-o.

### Passo 1: Definir o Requester

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // Aplicar uma vinheta forte
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // Dessaturar cores
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // Resetar para padrões
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### Passo 2: Registrar é Usar

O registro é tratado adicionando o requester ao banco. Na prática, a maioria dos modders usa os requesters integrados é modifica seus parâmetros ao invés de criar requesters totalmente personalizados.

---

## Visão Noturna (NVG)

A visão noturna é implementada como um efeito PPE. O requester relevante é `REQ_CAMERANV`:

```c
// Habilitar efeito NVG
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// Desabilitar efeito NVG
nvgReq.Stop();
```

O NVG real no jogo é acionado pelo item NVGoggles através do seu `ComponentEnergyManager` é o método `NVGoggles.ToggleNVG()`, que internamente aciona o sistema PPE.

---

## Color Grading

Color grading modifica a aparência geral de cor da cena:

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// Ajustar saturação (1.0 = normal, 0.0 = escala de cinza, >1.0 = supersaturado)
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## Efeitos de Blur

### Blur Gaussiano

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Ajustar intensidade do blur (0.0 = nenhum, maior = mais blur)
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### Blur Radial

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## Camadas de Prioridade

Quando múltiplos requesters modificam o mesmo parâmetro, a camada de prioridade determina qual ganha:

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // Prioridade mais baixa (efeitos estáticos)
    static const int L_1_VALUES   = 1;   // Mudanças dinâmicas de valor
    static const int L_2_SCRIPTS  = 2;   // Efeitos controlados por script
    static const int L_3_EFFECTS  = 3;   // Efeitos de gameplay
    static const int L_4_OVERLAY  = 4;   // Efeitos de overlay
    static const int L_LAST       = 100;  // Prioridade mais alta (sobrescreve tudo)
}
```

Números maiores têm prioridade. Use `PPEManager.L_LAST` para forçar seu efeito a sobrescrever todos os outros.

---

## Resumo

| Conceito | Ponto-chave |
|---------|-----------|
| Acesso | `PPERequesterBank.GetRequester(CONSTANTE)` |
| Iniciar/Parar | `requester.Start()` / `requester.Stop()` |
| Parâmetros | `SetTargetValueFloat(material, param, relative, value, layer, operator)` |
| Operadores | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| Efeitos comuns | Blur, vinheta, saturação, NVG, flashbang, grain, aberração cromática |
| NVG | Requester `REQ_CAMERANV` |
| Prioridade | Camadas 0-100; número maior ganha conflitos |
| Personalizado | Estender `PPERequester`, sobrescrever `OnStart()` / `OnStop()` |

---

[<< Anterior: Câmeras](04-cameras.md) | **Efeitos Pós-Processamento** | [Próximo: Notificações >>](06-notifications.md)
