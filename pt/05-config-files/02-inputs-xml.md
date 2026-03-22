# Chapter 5.2: inputs.xml --- Custom Keybindings

[Home](../README.md) | [<< Previous: stringtable.csv](01-stringtable.md) | **inputs.xml** | [Next: Credits.json >>](03-credits-json.md)

---

## Sumário

- [Visao Geral](#visao-geral)
- [Localização do Arquivo](#localização-do-arquivo)
- [Estrutura XML Completa](#estrutura-xml-completa)
- [Bloco Actions](#bloco-actions)
- [Bloco Sorting](#bloco-sorting)
- [Bloco Preset (Keybindings Padrão)](#bloco-preset-keybindings-padrão)
- [Combos com Modificadores](#combos-com-modificadores)
- [Inputs Ocultos](#inputs-ocultos)
- [Multiplas Teclas Padrão](#múltiplas-teclas-padrão)
- [Acessando Inputs no Script](#acessando-inputs-no-script)
- [Referência de Métodos de Input](#referência-de-métodos-de-input)
- [Suprimindo e Desabilitando Inputs](#suprimindo-e-desabilitando-inputs)
- [Referência de Nomes de Teclas](#referência-de-nomes-de-teclas)
- [Exemplos Reais](#exemplos-reais)
- [Erros Comuns](#erros-comuns)

---

## Visao Geral

Quando seu mod precisa que o jogador pressione uma tecla --- abrindo um menu, alternando uma funcionalidade, comandando uma unidade de IA --- você registra uma acao de input personalizada no `inputs.xml`. O motor le este arquivo na inicializacao e integra suas acoes ao sistema universal de input. Jogadores veem seus keybindings no menu Settings > Controls do jogo, agrupados sob um cabecalho que você define.

Inputs personalizados são identificados por um nome de acao único (convencionalmente prefixado com `UA` para "User Action") e podem ter keybindings padrão que os jogadores podem reconfigurar a vontade.

---

## Localização do Arquivo

Coloque `inputs.xml` dentro de uma subpasta `data` do seu diretório Scripts:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        data/
          inputs.xml        <-- Aqui
        3_Game/
        4_World/
        5_Mission/
```

Alguns mods o colocam diretamente na pasta `Scripts/`. Ambas as localizacoes funcionam. O motor descobre o arquivo automáticamente --- nenhum registro no config.cpp é necessário.

---

## Estrutura XML Completa

Um arquivo `inputs.xml` tem três seções, todas encapsuladas em um elemento raiz `<modded_inputs>`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <!-- Action definitions go here -->
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <!-- Sort order for the settings menu -->
        </sorting>
    </inputs>
    <preset>
        <!-- Default keybinding assignments go here -->
    </preset>
</modded_inputs>
```

Todas as três seções --- `<actions>`, `<sorting>` e `<preset>` --- trabalham juntas, mas servem a propósitos diferentes.

---

## Bloco Actions

O bloco `<actions>` declara toda acao de input que seu mod fornece. Cada acao e um único elemento `<input>`.

### Sintaxe

```xml
<actions>
    <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
    <input name="UAMyModToggleHUD" loc="STR_MYMOD_INPUT_TOGGLE_HUD" />
</actions>
```

### Atributos

| Atributo | Obrigatorio | Descrição |
|----------|-------------|-----------|
| `name` | Sim | Identificador único da acao. Convencao: prefixar com `UA` (User Action). Usado em scripts para consultar este input. |
| `loc` | Não | Chave de stringtable para o nome de exibicao no menu de Controles. **Sem prefixo `#`** --- o sistema o adiciona. |
| `visible` | Não | Defina como `"false"` para ocultar do menu de Controles. Padrão e `true`. |

### Convencao de Nomenclatura

Nomes de acao devem ser globalmente únicos entre todos os mods carregados. Use o prefixo do seu mod:

```xml
<input name="UAMyModAdminPanel" loc="STR_MYMOD_INPUT_ADMIN_PANEL" />
<input name="UAExpansionBookToggle" loc="STR_EXPANSION_BOOK_TOGGLE" />
<input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU" />
```

O prefixo `UA` e convencional mas não obrigatório. O Expansion AI usa `eAI` como prefixo, o que também funciona.

---

## Bloco Sorting

O bloco `<sorting>` controla como seus inputs aparecem nas configurações de Controles do jogador. Ele define um grupo nomeado (que se torna um cabecalho de seção) e lista os inputs na ordem de exibicao.

### Sintaxe

```xml
<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModOpenMenu" />
    <input name="UAMyModToggleHUD" />
    <input name="UAMyModSpecialAction" />
</sorting>
```

### Atributos

| Atributo | Obrigatorio | Descrição |
|----------|-------------|-----------|
| `name` | Sim | Identificador interno para este grupo de ordenacao |
| `loc` | Sim | Chave de stringtable para o cabecalho do grupo exibido em Settings > Controls |

### Como Aparece

Nas configurações de Controles, o jogador ve:

```
[MyMod]                          <-- do loc do sorting
  Open Menu .............. [Y]   <-- do loc do input + preset
  Toggle HUD ............. [H]   <-- do loc do input + preset
```

Apenas inputs listados no bloco `<sorting>` aparecem no menu de configurações. Inputs definidos em `<actions>` mas não listados em `<sorting>` são silenciosamente registrados mas invisíveis para o jogador (mesmo se `visible` não estiver explicitamente definido como `false`).

---

## Bloco Preset (Keybindings Padrão)

O bloco `<preset>` atribui teclas padrão as suas acoes. Estas são as teclas com as quais o jogador comeca antes de qualquer personalizacao.

### Binding Simples de Tecla

```xml
<preset>
    <input name="UAMyModOpenMenu">
        <btn name="kY"/>
    </input>
</preset>
```

Isso vincula a tecla `Y` como padrão para `UAMyModOpenMenu`.

### Sem Tecla Padrão

Se você omitir uma acao do bloco `<preset>`, ela não tem binding padrão. O jogador deve atribuir manualmente uma tecla em Settings > Controls. Isso é apropriado para bindings opcionais ou avancados.

---

## Combos com Modificadores

Para exigir uma tecla modificadora (Ctrl, Shift, Alt), aninhe elementos `<btn>`:

### Ctrl + Botao Esquerdo do Mouse

```xml
<input name="eAISetWaypoint">
    <btn name="kLControl">
        <btn name="mBLeft"/>
    </btn>
</input>
```

O `<btn>` externo e o modificador; o `<btn>` interno e a tecla principal. O jogador deve segurar o modificador e então pressionar a tecla principal.

### Shift + Tecla

```xml
<input name="UAMyModQuickAction">
    <btn name="kLShift">
        <btn name="kQ"/>
    </btn>
</input>
```

### Regras de Aninhamento

- O `<btn>` **externo** é sempre o modificador (mantido pressionado)
- O `<btn>` **interno** e o gatilho (pressionado enquanto o modificador e mantido)
- Apenas um nível de aninhamento e típico; aninhamento mais profundo não é testado e não é recomendado

---

## Inputs Ocultos

Use `visible="false"` para registrar um input que o jogador não pode ver ou reconfigurar no menu de Controles. Isso é util para inputs internos usados pelo código do seu mod que não devem ser configuraveis pelo jogador.

```xml
<actions>
    <input name="eAITestInput" visible="false" />
    <input name="UAExpansionConfirm" loc="" visible="false" />
</actions>
```

Inputs ocultos ainda podem ter atribuicoes de tecla padrão no bloco `<preset>`:

```xml
<preset>
    <input name="eAITestInput">
        <btn name="kY"/>
    </input>
</preset>
```

---

## Multiplas Teclas Padrão

Uma acao pode ter múltiplas teclas padrão. Liste múltiplos elementos `<btn>` como irmaos:

```xml
<input name="UAExpansionConfirm">
    <btn name="kReturn" />
    <btn name="kNumpadEnter" />
</input>
```

Tanto `Enter` quanto `Numpad Enter` acionarao `UAExpansionConfirm`. Isso é util para acoes onde múltiplas teclas físicas devem mapear para a mesma acao logica.

---

## Acessando Inputs no Script

### Obtendo a API de Input

Todo acesso a input passa por `GetUApi()`, que retorna a API global de User Action:

```c
UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");
```

### Consultando no OnUpdate

Inputs personalizados são típicamente consultados em `MissionGameplay.OnUpdate()` ou callbacks similares por frame:

```c
modded class MissionGameplay
{
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");

        if (input.LocalPress())
        {
            // Key was just pressed this frame
            OpenMyModMenu();
        }
    }
}
```

### Alternativa: Usando o Nome do Input Diretamente

Muitos mods verificam inputs inline usando os métodos `UAInputAPI` com nomes string:

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);

    Input input = GetGame().GetInput();

    if (input.LocalPress("UAMyModOpenMenu", false))
    {
        OpenMyModMenu();
    }
}
```

O parâmetro `false` em `LocalPress("name", false)` indica que a verificação não deve consumir o evento de input.

---

## Referência de Métodos de Input

Uma vez que você tem uma referência `UAInput` (de `GetUApi().GetInputByName()`), ou esta usando a classe `Input` diretamente, estes métodos detectam diferentes estados de input:

| Método | Retorna | Quando e Verdadeiro |
|--------|---------|---------------------|
| `LocalPress()` | `bool` | A tecla foi pressionada **neste frame** (gatilho único no key-down) |
| `LocalRelease()` | `bool` | A tecla foi solta **neste frame** (gatilho único no key-up) |
| `LocalClick()` | `bool` | A tecla foi pressionada e solta rapidamente (toque) |
| `LocalHold()` | `bool` | A tecla foi mantida pressionada por um tempo limite |
| `LocalDoubleClick()` | `bool` | A tecla foi tocada duas vezes rapidamente |
| `LocalValue()` | `float` | Valor analogico atual (0.0 ou 1.0 para teclas digitais; variavel para eixos analogicos) |

### Padroes de Uso

**Alternar ao pressionar:**
```c
if (input.LocalPress("UAMyModToggle", false))
{
    m_IsEnabled = !m_IsEnabled;
}
```

**Segurar para ativar, soltar para desativar:**
```c
if (input.LocalPress("eAICommandMenu", false))
{
    ShowCommandWheel();
}

if (input.LocalRelease("eAICommandMenu", false) || input.LocalValue("eAICommandMenu", false) == 0)
{
    HideCommandWheel();
}
```

**Acao de duplo toque:**
```c
if (input.LocalDoubleClick("UAMyModSpecial", false))
{
    PerformSpecialAction();
}
```

**Segurar para acao estendida:**
```c
if (input.LocalHold("UAExpansionGPSToggle"))
{
    ToggleGPSMode();
}
```

---

## Suprimindo e Desabilitando Inputs

### ForceDisable

Desabilita temporariamente um input específico. Comumente usado ao abrir menus para prevenir que acoes do jogo disparem enquanto uma UI esta ativa:

```c
// Disable the input while menu is open
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(true);

// Re-enable when menu closes
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(false);
```

### SupressNextFrame

Suprime todo processamento de input para o próximo frame. Usado durante transicoes de contexto de input (ex.: fechando menus) para prevenir sangramento de input de um frame:

```c
GetUApi().SupressNextFrame(true);
```

### UpdatéControls

Apos modificar estados de input, chame `UpdateControls()` para aplicar mudancas imediatamente:

```c
GetUApi().GetInputByName("UAExpansionBookToggle").ForceDisable(false);
GetUApi().UpdateControls();
```

### Exclusoes de Input

O sistema de missao vanilla fornece grupos de exclusao. Quando um menu esta ativo, você pode excluir catégorias de inputs:

```c
// Suppress gameplay inputs while inventory is open
AddActiveInputExcludes({"inventory"});

// Restore when closing
RemoveActiveInputExcludes({"inventory"});
```

---

## Referência de Nomes de Teclas

Nomes de tecla usados no atributo `<btn name="">` seguem uma convencao de nomenclatura específica. Aqui esta a referência completa.

### Teclas do Teclado

| Catégoria | Nomes de Tecla |
|-----------|----------------|
| Letras | `kA`, `kB`, `kC`, `kD`, `kE`, `kF`, `kG`, `kH`, `kI`, `kJ`, `kK`, `kL`, `kM`, `kN`, `kO`, `kP`, `kQ`, `kR`, `kS`, `kT`, `kU`, `kV`, `kW`, `kX`, `kY`, `kZ` |
| Números (linha superior) | `k0`, `k1`, `k2`, `k3`, `k4`, `k5`, `k6`, `k7`, `k8`, `k9` |
| Teclas de função | `kF1`, `kF2`, `kF3`, `kF4`, `kF5`, `kF6`, `kF7`, `kF8`, `kF9`, `kF10`, `kF11`, `kF12` |
| Modificadores | `kLControl`, `kRControl`, `kLShift`, `kRShift`, `kLAlt`, `kRAlt` |
| Navegação | `kUp`, `kDown`, `kLeft`, `kRight`, `kHome`, `kEnd`, `kPageUp`, `kPageDown` |
| Edicao | `kReturn`, `kBackspace`, `kDelete`, `kInsert`, `kSpace`, `kTab`, `kEscape` |
| Numpad | `kNumpad0` ... `kNumpad9`, `kNumpadEnter`, `kNumpadPlus`, `kNumpadMinus`, `kNumpadMultiply`, `kNumpadDivide`, `kNumpadDecimal` |
| Pontuacao | `kMinus`, `kEquals`, `kLBracket`, `kRBracket`, `kBackslash`, `kSemicolon`, `kApostrophe`, `kComma`, `kPeriod`, `kSlash`, `kGrave` |
| Bloqueios | `kCapsLock`, `kNumLock`, `kScrollLock` |

### Botoes do Mouse

| Nome | Botao |
|------|-------|
| `mBLeft` | Botao esquerdo do mouse |
| `mBRight` | Botao direito do mouse |
| `mBMiddle` | Botao do meio do mouse (clique na roda de scroll) |
| `mBExtra1` | Botao 4 do mouse (botao latéral traseiro) |
| `mBExtra2` | Botao 5 do mouse (botao latéral dianteiro) |

### Eixos do Mouse

| Nome | Eixo |
|------|------|
| `mAxisX` | Movimento horizontal do mouse |
| `mAxisY` | Movimento vertical do mouse |
| `mWheelUp` | Roda de scroll para cima |
| `mWheelDown` | Roda de scroll para baixo |

### Padrão de Nomenclatura

- **Teclado**: prefixo `k` + nome da tecla (ex.: `kT`, `kF5`, `kLControl`)
- **Botoes do mouse**: prefixo `mB` + nome do botao (ex.: `mBLeft`, `mBRight`)
- **Eixos do mouse**: prefixo `m` + nome do eixo (ex.: `mAxisX`, `mWheelUp`)

---

## Exemplos Reais

### DayZ Expansion AI

Um inputs.xml bem estruturado com keybindings visíveis, inputs de debug ocultos e combos com modificadores:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU"/>
            <input name="eAISetWaypoint" loc="STR_EXPANSION_AI_SET_WAYPOINT"/>
            <input name="eAITestInput" visible="false" />
            <input name="eAITestLRIncrease" visible="false" />
            <input name="eAITestLRDecrease" visible="false" />
            <input name="eAITestUDIncrease" visible="false" />
            <input name="eAITestUDDecrease" visible="false" />
        </actions>

        <sorting name="expansion" loc="STR_EXPANSION_LABEL">
            <input name="eAICommandMenu" />
            <input name="eAISetWaypoint" />
            <input name="eAITestInput" />
            <input name="eAITestLRIncrease" />
            <input name="eAITestLRDecrease" />
            <input name="eAITestUDIncrease" />
            <input name="eAITestUDDecrease" />
        </sorting>
    </inputs>
    <preset>
        <input name="eAICommandMenu">
            <btn name="kT"/>
        </input>
        <input name="eAISetWaypoint">
            <btn name="kLControl">
                <btn name="mBLeft"/>
            </btn>
        </input>
        <input name="eAITestInput">
            <btn name="kY"/>
        </input>
        <input name="eAITestLRIncrease">
            <btn name="kRight"/>
        </input>
        <input name="eAITestLRDecrease">
            <btn name="kLeft"/>
        </input>
        <input name="eAITestUDIncrease">
            <btn name="kUp"/>
        </input>
        <input name="eAITestUDDecrease">
            <btn name="kDown"/>
        </input>
    </preset>
</modded_inputs>
```

Observacoes principais:
- `eAICommandMenu` vinculado a `T` --- visível nas configurações, jogador pode reconfigurar
- `eAISetWaypoint` usa um combo modificador **Ctrl + Clique Esquerdo**
- Inputs de teste são `visible="false"` --- ocultos dos jogadores mas acessiveis no código

### DayZ Expansion Market

Um inputs.xml mínimo para um input utilitário oculto com múltiplas teclas padrão:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAExpansionConfirm" loc="" visible="false" />
        </actions>
    </inputs>
    <preset>
        <input name="UAExpansionConfirm">
            <btn name="kReturn" />
            <btn name="kNumpadEnter" />
        </input>
    </preset>
</modded_inputs>
```

Observacoes principais:
- Input oculto (`visible="false"`) com `loc` vazio --- nunca mostrado nas configurações
- Duas teclas padrão: tanto Enter quanto Numpad Enter acionam a mesma acao
- Sem bloco `<sorting>` --- não necessário já que o input e oculto

### Template Inicial Completo

Um template mínimo mas completo para um novo mod:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
            <input name="UAMyModQuickAction" loc="STR_MYMOD_INPUT_QUICK_ACTION" />
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModOpenMenu" />
            <input name="UAMyModQuickAction" />
        </sorting>
    </inputs>
    <preset>
        <input name="UAMyModOpenMenu">
            <btn name="kF6"/>
        </input>
        <!-- UAMyModQuickAction has no default key; player must bind it -->
    </preset>
</modded_inputs>
```

Com uma stringtable.csv correspondente:

```csv
"Language","original","english"
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod"
"STR_MYMOD_INPUT_OPEN_MENU","Open Menu","Open Menu"
"STR_MYMOD_INPUT_QUICK_ACTION","Quick Action","Quick Action"
```

---

## Erros Comuns

### Usando `#` no Atributo loc

```xml
<!-- WRONG -->
<input name="UAMyAction" loc="#STR_MYMOD_ACTION" />

<!-- CORRECT -->
<input name="UAMyAction" loc="STR_MYMOD_ACTION" />
```

O sistema de input prepende `#` internamente. Adicioná-lo você mesmo causa um duplo prefixo e a busca falha.

### Colisao de Nomes de Acao

Se dois mods definem `UAOpenMenu`, apenas um funcionara. Sempre use o prefixo do seu mod:

```xml
<input name="UAMyModOpenMenu" />     <!-- Bom -->
<input name="UAOpenMenu" />          <!-- Arriscado -->
```

### Entrada de Sorting Ausente

Se você define uma acao em `<actions>` mas esquece de lista-la em `<sorting>`, a acao funciona no código mas fica invisível no menu de Controles. O jogador não tem como reconfigura-la.

### Esquecendo de Definir em Actions

Se você lista um input em `<sorting>` ou `<preset>` mas nunca o define em `<actions>`, o motor silenciosamente o ignora.

### Vinculando Teclas Conflitantes

Escolher teclas que conflitam com bindings vanilla (como `W`, `A`, `S`, `D`, `Tab`, `I`) faz tanto sua acao quanto a acao vanilla dispararem simultaneamente. Use teclas menos comuns (F5-F12, teclas do numpad) ou combos com modificadores por seguranca.
