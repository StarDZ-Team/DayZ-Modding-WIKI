# Capítulo 8.8: Construindo um HUD Overlay

[Início](../../README.md) | [<< Anterior: Publicando na Steam Workshop](07-publishing-workshop.md) | **Construindo um HUD Overlay** | [Próximo: Template Profissional de Mod >>](09-professional-template.md)

---

> **Resumo:** Este tutorial guia você na construção de um HUD overlay personalizado que exibe informações do servidor no canto superior direito da tela. Você criará um arquivo de layout, escreverá uma classe controladora, fará hook no ciclo de vida da missão, solicitará dados do servidor via RPC, adicionará uma tecla de alternância e polirá o resultado com animações de fade e visibilidade inteligente. Ao final, você terá um HUD de Informações do Servidor discreto mostrando o nome do servidor, contagem de jogadores e horário atual do jogo -- além de uma compreensão sólida de como HUD overlays funcionam no DayZ.

---

## Sumário

- [O Que Estamos Construindo](#o-que-estamos-construindo)
- [Pré-requisitos](#pré-requisitos)
- [Estrutura do Mod](#estrutura-do-mod)
- [Passo 1: Criar o Arquivo de Layout](#passo-1-criar-o-arquivo-de-layout)
- [Passo 2: Criar a Classe Controladora do HUD](#passo-2-criar-a-classe-controladora-do-hud)
- [Passo 3: Hook no MissionGameplay](#passo-3-hook-no-missiongameplay)
- [Passo 4: Solicitar Dados do Servidor](#passo-4-solicitar-dados-do-servidor)
- [Passo 5: Adicionar Alternância com Tecla de Atalho](#passo-5-adicionar-alternância-com-tecla-de-atalho)
- [Passo 6: Polimento](#passo-6-polimento)
- [Referência Completa do Código](#referência-completa-do-código)
- [Estendendo o HUD](#estendendo-o-hud)
- [Erros Comuns](#erros-comuns)
- [Próximos Passos](#próximos-passos)

---

## O Que Estamos Construindo

Um painel pequeno e semitransparente ancorado no canto superior direito da tela que exibe três linhas de informação:

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

O painel fica abaixo dos indicadores de status e acima da barra rápida. Ele atualiza uma vez por segundo (não a cada frame), aparece com fade-in quando mostrado e desaparece com fade-out quando oculto, e se esconde automaticamente quando o inventário ou menu de pausa está aberto. O jogador pode alterná-lo com uma tecla configurável (padrão: **F7**).

### Resultado Esperado

Quando carregado, você verá um retângulo escuro semitransparente na área superior direita da tela. Texto branco mostra o nome do servidor na primeira linha, a contagem atual de jogadores na segunda linha e o horário do mundo no jogo na terceira linha. Pressionar F7 faz o painel sumir suavemente com fade; pressionar F7 novamente o traz de volta com fade.

---

## Pré-requisitos

- Uma estrutura de mod funcional (complete o [Capítulo 8.1](01-first-mod.md) primeiro)
- Compreensão básica da sintaxe do Enforce Script
- Familiaridade com o modelo cliente-servidor do DayZ (o HUD roda no cliente; a contagem de jogadores vem do servidor)

---

## Estrutura do Mod

Crie a seguinte árvore de diretórios:

```
ServerInfoHUD/
    mod.cpp
    Scripts/
        config.cpp
        data/
            inputs.xml
        3_Game/
            ServerInfoHUD/
                ServerInfoRPC.c
        4_World/
            ServerInfoHUD/
                ServerInfoServer.c
        5_Mission/
            ServerInfoHUD/
                ServerInfoHUD.c
                MissionHook.c
    GUI/
        layouts/
            ServerInfoHUD.layout
```

A camada `3_Game` define constantes (nosso ID de RPC). A camada `4_World` lida com a resposta do lado do servidor. A camada `5_Mission` contém a classe do HUD e o hook de missão. O arquivo de layout define a árvore de widgets.

---

## Passo 1: Criar o Arquivo de Layout

Arquivos de layout (`.layout`) definem a hierarquia de widgets em XML. O sistema de GUI do DayZ usa um modelo de coordenadas onde cada widget tem uma posição e tamanho expressos como valores proporcionais (0.0 a 1.0 do pai) mais offsets em pixels.

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- Frame raiz: cobre a tela inteira, não consome input -->
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <!-- Painel de fundo: canto superior direito -->
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <!-- Texto do nome do servidor -->
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Texto da contagem de jogadores -->
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Texto do horário no jogo -->
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

### Conceitos-Chave de Layout

| Atributo | Significado |
|-----------|---------|
| `halign="2"` | Alinhamento horizontal: **direita**. O widget se ancora na borda direita do pai. |
| `valign="0"` | Alinhamento vertical: **topo**. |
| `hexactpos="0"` + `vexactpos="1"` | Posição horizontal é proporcional (1.0 = borda direita), posição vertical é em pixels. |
| `hexactsize="1"` + `vexactsize="1"` | Largura e altura são em pixels (220 x 70). |
| `color="0 0 0 0.55"` | RGBA como floats. Preto com 55% de opacidade para o painel de fundo. |

O `ServerInfoPanel` é posicionado em X proporcional=1.0 (borda direita) com `halign="2"` (alinhado à direita), então a borda direita do painel toca o lado direito da tela. A posição Y é 0 pixels a partir do topo. Isso coloca nosso HUD no canto superior direito.

**Por que tamanhos em pixels para o painel?** Dimensionamento proporcional faria o painel escalar com a resolução, mas para pequenos widgets de informação você quer um footprint fixo em pixels para que o texto permaneça legível em todas as resoluções.

---

## Passo 2: Criar a Classe Controladora do HUD

A classe controladora carrega o layout, encontra widgets pelo nome e expõe métodos para atualizar o texto exibido. Ela estende `ScriptedWidgetEventHandler` para poder receber eventos de widgets se necessário no futuro.

### `Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;

    // Frequência de atualização dos dados exibidos (segundos)
    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    // Criar e mostrar o HUD
    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout file.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        // Solicitar dados iniciais do servidor
        RequestServerInfo();
    }

    // Remover todos os widgets
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // Chamado a cada frame pelo MissionGameplay.OnUpdate
    void Update(float timeslice)
    {
        if (!m_Root)
            return;

        if (!m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    // Atualizar o display de horário do jogo (lado do cliente, sem RPC necessário)
    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    // Enviar RPC ao servidor pedindo contagem de jogadores e nome do servidor
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // Modo offline: mostrar apenas informações locais
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    // --- Setters chamados quando os dados chegam ---

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    // Alternar visibilidade
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // Ocultar quando menus estão abertos
    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};
```

### Detalhes Importantes

1. **Caminho de `CreateWidgets`**: O caminho é relativo à raiz do mod. Como empacotamos a pasta `GUI/` dentro do PBO, o engine resolve `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` usando o prefixo do mod.
2. **`FindAnyWidget`**: Busca na árvore de widgets recursivamente pelo nome. Sempre verifique NULL após o cast.
3. **`Widget.Unlink()`**: Remove corretamente o widget e todos os seus filhos da árvore de UI. Sempre chame isso na limpeza.
4. **Padrão de acumulador de timer**: Adicionamos `timeslice` a cada frame e agimos apenas quando o tempo acumulado excede `UPDATE_INTERVAL`. Isso evita fazer trabalho a cada frame.

---

## Passo 3: Hook no MissionGameplay

A classe `MissionGameplay` é o controlador de missão no lado do cliente. Usamos `modded class` para injetar nosso HUD em seu ciclo de vida sem substituir o arquivo vanilla.

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // Criar o HUD overlay
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // Limpar ANTES de chamar super
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Ocultar HUD quando inventário ou qualquer menu está aberto
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // Atualizar dados do HUD (throttled internamente)
        m_ServerInfoHUD.Update(timeslice);

        // Verificar tecla de alternância
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // Accessor para que o handler de RPC possa acessar o HUD
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Por Que Este Padrão Funciona

- **`OnInit`** executa uma vez quando o jogador entra no gameplay. Criamos e inicializamos o HUD aqui.
- **`OnUpdate`** executa a cada frame. Passamos `timeslice` para o HUD, que internamente limita a uma vez por segundo. Também verificamos a tecla de alternância e a visibilidade do menu aqui.
- **`OnMissionFinish`** executa quando o jogador desconecta ou a missão termina. Destruímos nossos widgets aqui para prevenir vazamentos de memória.

### Regra Crítica: Sempre Faça a Limpeza

Se você esquecer de destruir seus widgets em `OnMissionFinish`, o root do widget vazará para a próxima sessão. Após alguns trocas de servidor, o jogador acaba com widgets fantasma empilhados consumindo memória. Sempre associe `Init()` com `Destroy()`.

---

## Passo 4: Solicitar Dados do Servidor

A contagem de jogadores só é conhecida no servidor. Precisamos de uma ida e volta simples de RPC (Remote Procedure Call): o cliente envia uma solicitação, o servidor lê os dados e os envia de volta.

### Passo 4a: Definir o ID do RPC

IDs de RPC devem ser únicos entre todos os mods. Definimos o nosso na camada `3_Game` para que tanto o código do cliente quanto do servidor possam referenciá-lo.

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// IDs de RPC para o Server Info HUD.
// Usando números altos para evitar conflitos com o vanilla e outros mods.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**Por que `3_Game`?** Constantes e enums pertencem à camada mais baixa que tanto cliente quanto servidor podem acessar. A camada `3_Game` carrega antes de `4_World` e `5_Mission`, então ambos os lados podem ver esses valores.

### Passo 4b: Handler do Lado do Servidor

O servidor escuta por `SIH_RPC_REQUEST_INFO`, reúne os dados e responde com `SIH_RPC_RESPONSE_INFO`.

### `Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Obter informações do servidor
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // Obter a lista de jogadores
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // Máximo de jogadores da config do servidor
        maxPlayers = GetGame().GetMaxPlayers();

        // Enviar resposta de volta ao cliente solicitante
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Passo 4c: Receptor de RPC no Cliente

O cliente recebe a resposta e atualiza o HUD.

Adicione isso ao mesmo arquivo `ServerInfoHUD.c` (no final, fora da classe), ou crie um arquivo separado em `5_Mission/ServerInfoHUD/`:

Adicione o seguinte **abaixo** da classe `ServerInfoHUD` em `ServerInfoHUD.c`:

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        // Acessar o HUD através do MissionGameplay
        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );

        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Como o Fluxo de RPC Funciona

```
CLIENTE                          SERVIDOR
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | lê serverName, playerCount, maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | atualiza texto do HUD         |
```

O cliente envia a solicitação uma vez por segundo (limitado pelo timer de atualização). O servidor responde com três valores empacotados no contexto do RPC. O cliente os lê na mesma ordem em que foram escritos.

**Importante:** `rpc.Write()` e `ctx.Read()` devem usar os mesmos tipos na mesma ordem. Se o servidor escreve um `string` e depois dois valores `int`, o cliente deve ler um `string` e depois dois valores `int`.

---

## Passo 5: Adicionar Alternância com Tecla de Atalho

### Passo 5a: Definir o Input em `inputs.xml`

O DayZ usa `inputs.xml` para registrar ações de teclas personalizadas. O arquivo deve ser colocado em `Scripts/data/inputs.xml` e referenciado no `config.cpp`.

### `Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

| Elemento | Propósito |
|---------|---------|
| `<actions>` | Declara a ação de input pelo nome. `loc` é a string de exibição mostrada no menu de opções de teclas. |
| `<preset>` | Atribui a tecla padrão. `kF7` mapeia para a tecla F7. |

### Passo 5b: Referenciar `inputs.xml` no `config.cpp`

Seu `config.cpp` deve dizer ao engine onde encontrar o arquivo de inputs. Adicione uma entrada `inputs` dentro do bloco `defs`:

```cpp
class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/3_Game" };
    };

    class worldScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/4_World" };
    };

    class missionScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/5_Mission" };
    };

    class inputs
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/data" };
    };
};
```

### Passo 5c: Ler o Pressionamento da Tecla

Já tratamos isso no hook do `MissionGameplay` do Passo 3:

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` retorna o singleton da API de input. `GetInputByName` busca nossa ação registrada. `LocalPress()` retorna `true` por exatamente um frame quando a tecla é pressionada.

### Referência de Nomes de Teclas

Nomes de teclas comuns para `<btn>`:

| Nome da Tecla | Tecla |
|----------|-----|
| `kF1` até `kF12` | Teclas de função |
| `kH`, `kI`, etc. | Teclas de letras |
| `kNumpad0` até `kNumpad9` | Numpad |
| `kLControl` | Ctrl Esquerdo |
| `kLShift` | Shift Esquerdo |
| `kLAlt` | Alt Esquerdo |

Combinações com modificadores usam aninhamento:

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

Isso significa "segure Ctrl Esquerdo e pressione H."

---

## Passo 6: Polimento

### 6a: Animação de Fade In/Out

O DayZ fornece `WidgetFadeTimer` para transições suaves de alfa. Atualize a classe `ServerInfoHUD` para usá-lo:

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... campos existentes ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // Substituir o método ToggleVisibility:
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    // ... resto da classe ...
};
```

`FadeIn(widget, duration)` anima o alfa do widget de 0 para 1 durante a duração dada em segundos. `FadeOut` vai de 1 para 0 e oculta o widget quando termina.

### 6b: Painel de Fundo com Alfa

Já definimos isso no layout (`color="0 0 0 0.55"`), dando um overlay escuro com 55% de opacidade. Se você quiser ajustar o alfa em tempo de execução:

```c
void SetBackgroundAlpha(float alpha)
{
    if (m_Panel)
    {
        int color = ARGB(
            (int)(alpha * 255),
            0, 0, 0
        );
        m_Panel.SetColor(color);
    }
}
```

A função `ARGB()` recebe valores inteiros de 0-255 para alfa, vermelho, verde e azul.

### 6c: Escolhas de Fonte e Cor

O DayZ inclui diversas fontes que você pode referenciar em layouts:

| Caminho da Fonte | Estilo |
|-----------|-------|
| `gui/fonts/MetronBook` | Sans-serif limpa (usada no HUD vanilla) |
| `gui/fonts/MetronMedium` | Versão mais negrito do MetronBook |
| `gui/fonts/Metron` | Variante mais fina |
| `gui/fonts/luxuriousscript` | Script decorativo (evite para HUD) |

Para mudar a cor do texto em tempo de execução:

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d: Respeitando Outras UIs

Nosso `MissionHook.c` já detecta quando um menu está aberto e chama `SetMenuState(true)`. Aqui está uma abordagem mais completa que verifica o inventário especificamente:

```c
// No override de OnUpdate do modded MissionGameplay:
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// Também verificar se o inventário está aberto
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

Isso garante que seu HUD se esconde atrás da tela de inventário, do menu de pausa, da tela de opções e de qualquer outro menu scriptado.

---

## Referência Completa do Código

Abaixo está cada arquivo do mod, em sua forma final com todo o polimento aplicado.

### Arquivo 1: `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### Arquivo 2: `ServerInfoHUD/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class ServerInfoHUD_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
        };
    };
};

class CfgMods
{
    class ServerInfoHUD
    {
        dir = "ServerInfoHUD";
        name = "Server Info HUD";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/5_Mission" };
            };

            class inputs
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/data" };
            };
        };
    };
};
```

### Arquivo 3: `ServerInfoHUD/Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

### Arquivo 4: `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// IDs de RPC para o Server Info HUD.
// Use números altos para evitar colisões com ERPCs vanilla e outros mods.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### Arquivo 5: `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Apenas o servidor lida com este RPC
        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Obter nome do servidor
        string serverName = "";
        GetGame().GetHostName(serverName);

        // Contar jogadores
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // Obter máximo de vagas de jogadores
        int maxPlayers = GetGame().GetMaxPlayers();

        // Enviar dados de volta ao cliente solicitante
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Arquivo 6: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;
    protected ref WidgetFadeTimer m_FadeTimer;

    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        RequestServerInfo();
    }

    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    void Update(float timeslice)
    {
        if (!m_Root || !m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};

// -----------------------------------------------
// Receptor de RPC no lado do cliente
// -----------------------------------------------
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );
        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Arquivo 7: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Detectar menus abertos
        bool menuOpen = false;
        UIManager uiMgr = GetGame().GetUIManager();
        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);
        m_ServerInfoHUD.Update(timeslice);

        // Tecla de alternância
        if (GetUApi().GetInputByName(
            "UAServerInfoToggle"
        ).LocalPress())
        {
            m_ServerInfoHUD.ToggleVisibility();
        }
    }

    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Arquivo 8: `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
            </Widget>
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

---

## Estendendo o HUD

Uma vez que você tenha o HUD básico funcionando, aqui estão extensões naturais.

### Adicionando Display de FPS

O FPS pode ser lido no lado do cliente sem nenhum RPC:

```c
// Adicione um campo TextWidget m_FPSText e encontre-o no Init()

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

Chame `RefreshFPS()` junto com `RefreshTime()` no método de atualização. Note que `GetDeltaT()` retorna o tempo do frame atual, então o valor de FPS vai flutuar. Para um display mais suave, faça a média ao longo de vários frames:

```c
protected float m_FPSAccum;
protected int m_FPSFrames;

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    m_FPSAccum += GetGame().GetDeltaT();
    m_FPSFrames++;

    float avgFPS = m_FPSFrames / m_FPSAccum;
    m_FPSText.SetText("FPS: " + Math.Round(avgFPS).ToString());

    // Resetar a cada segundo (quando o timer principal dispara)
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### Adicionando Posição do Jogador

```c
protected void RefreshPosition()
{
    if (!m_PositionText)
        return;

    Man player = GetGame().GetPlayer();
    if (!player)
        return;

    vector pos = player.GetPosition();
    string text = "Pos: " + Math.Round(pos[0]).ToString()
        + " / " + Math.Round(pos[2]).ToString();
    m_PositionText.SetText(text);
}
```

### Múltiplos Painéis de HUD

Para múltiplos painéis (bússola, status, minimapa), crie uma classe gerenciadora pai que mantém um array de elementos de HUD:

```c
class HUDManager
{
    protected ref array<ref ServerInfoHUD> m_Panels;

    void HUDManager()
    {
        m_Panels = new array<ref ServerInfoHUD>();
    }

    void AddPanel(ServerInfoHUD panel)
    {
        m_Panels.Insert(panel);
    }

    void UpdateAll(float timeslice)
    {
        int count = m_Panels.Count();
        int i = 0;
        while (i < count)
        {
            m_Panels.Get(i).Update(timeslice);
            i++;
        }
    }
};
```

### Elementos de HUD Arrastáveis

Tornar um widget arrastável requer lidar com eventos de mouse via `ScriptedWidgetEventHandler`:

```c
class DraggableHUD : ScriptedWidgetEventHandler
{
    protected bool m_Dragging;
    protected float m_OffsetX;
    protected float m_OffsetY;
    protected Widget m_DragWidget;

    override bool OnMouseButtonDown(Widget w, int x, int y, int button)
    {
        if (w == m_DragWidget && button == 0)
        {
            m_Dragging = true;
            float wx, wy;
            m_DragWidget.GetScreenPos(wx, wy);
            m_OffsetX = x - wx;
            m_OffsetY = y - wy;
            return true;
        }
        return false;
    }

    override bool OnMouseButtonUp(Widget w, int x, int y, int button)
    {
        if (button == 0)
            m_Dragging = false;
        return false;
    }

    override bool OnUpdate(Widget w, int x, int y, int oldX, int oldY)
    {
        if (m_Dragging && m_DragWidget)
        {
            m_DragWidget.SetPos(x - m_OffsetX, y - m_OffsetY);
            return true;
        }
        return false;
    }
};
```

Nota: para que o arrasto funcione, o widget deve ter `SetHandler(this)` chamado nele para que o handler de eventos receba os eventos. Além disso, o cursor deve estar visível, o que limita HUDs arrastáveis a situações onde um menu ou modo de edição está ativo.

---

## Erros Comuns

### 1. Atualizar a Cada Frame em Vez de Com Throttle

**Errado:**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // Executa 60+ vezes por segundo!
    m_ServerInfoHUD.RequestServerInfo(); // Envia 60+ RPCs por segundo!
}
```

**Correto:** Use um acumulador de timer (como mostrado no tutorial) para que operações custosas executem no máximo uma vez por segundo. Texto do HUD que muda a cada frame (como um contador de FPS) pode ser atualizado por frame, mas solicitações RPC devem ser limitadas.

### 2. Não Fazer Limpeza no OnMissionFinish

**Errado:**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // Nenhuma limpeza em lugar nenhum -- widget vaza ao desconectar!
    }
};
```

**Correto:** Sempre destrua widgets e anule referências em `OnMissionFinish()`. O destrutor (`~ServerInfoHUD`) é uma rede de segurança, mas não confie nele -- `OnMissionFinish` é o lugar correto para limpeza explícita.

### 3. HUD Atrás de Outros Elementos de UI

Widgets criados depois renderizam em cima de widgets criados antes. Se seu HUD aparece atrás da UI vanilla, ele foi criado cedo demais. Soluções:

- Crie o HUD mais tarde na sequência de inicialização (por exemplo, na primeira chamada de `OnUpdate` em vez de no `OnInit`).
- Use `m_Root.SetSort(100)` para forçar uma ordem de renderização mais alta, empurrando seu widget acima dos outros.

### 4. Solicitar Dados Com Muita Frequência (Spam de RPC)

Enviar um RPC a cada frame cria 60+ pacotes de rede por segundo por jogador conectado. Em um servidor de 60 jogadores, são 3.600 pacotes por segundo de tráfego desnecessário. Sempre limite solicitações RPC. Uma vez por segundo é razoável para informações não críticas. Para dados que raramente mudam (como nome do servidor), você poderia solicitá-los apenas uma vez na inicialização e cache-á-los.

### 5. Esquecer a Chamada `super`

```c
// ERRADO: quebra a funcionalidade do HUD vanilla
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // Falta super.OnInit()! O HUD vanilla não inicializará.
}
```

Sempre chame `super.OnInit()` (e `super.OnUpdate()`, `super.OnMissionFinish()`) primeiro. Omitir a chamada super quebra a implementação vanilla e todos os outros mods que fazem hook no mesmo método.

### 6. Usar a Camada de Script Errada

Se você tentar referenciar `MissionGameplay` a partir de `4_World`, receberá um erro "Undefined type" porque os tipos de `5_Mission` não são visíveis para `4_World`. As constantes RPC vão em `3_Game`, o handler do servidor vai em `4_World` (modificando `PlayerBase` que vive lá), e a classe do HUD e o hook de missão vão em `5_Mission`.

### 7. Caminho de Layout Hardcoded

O caminho do layout em `CreateWidgets()` é relativo aos caminhos de busca do jogo. Se o prefixo do seu PBO não corresponde à string do caminho, o layout não carregará e `CreateWidgets` retorna NULL. Sempre verifique NULL após `CreateWidgets` e registre um erro se falhar.

---

## Próximos Passos

Agora que você tem um HUD overlay funcionando, considere estas progressões:

1. **Salvar preferências do usuário** -- Armazene se o HUD está visível em um arquivo JSON local para que o estado de alternância persista entre sessões.
2. **Adicionar configuração do lado do servidor** -- Permita que administradores de servidor habilitem/desabilitem o HUD ou escolham quais campos mostrar via um arquivo de configuração JSON.
3. **Construir um overlay de administrador** -- Expanda o HUD para mostrar informações exclusivas de admin (performance do servidor, contagem de entidades, timer de restart) usando verificações de permissão.
4. **Criar um HUD de bússola** -- Use `GetGame().GetCurrentCameraDirection()` para calcular a direção e exibir uma barra de bússola no topo da tela.
5. **Estudar mods existentes** -- Veja o HUD de quests do DayZ Expansion e o sistema de overlay do Colorful UI para implementações de HUD de qualidade de produção.

---

## Boas Práticas

- **Limite o `OnUpdate` a intervalos de 1 segundo no mínimo.** Use um acumulador de timer para evitar executar operações custosas (solicitações RPC, formatação de texto) 60+ vezes por segundo. Apenas visuais por frame como contadores de FPS devem atualizar a cada frame.
- **Oculte o HUD quando o inventário ou qualquer menu estiver aberto.** Verifique `GetGame().GetUIManager().GetMenu()` a cada atualização e suprima seu overlay. Elementos de UI sobrepostos confundem jogadores e bloqueiam interação.
- **Sempre faça limpeza de widgets em `OnMissionFinish`.** Roots de widgets vazados persistem entre trocas de servidor, empilhando painéis fantasma que consomem memória e eventualmente causam glitches visuais.
- **Use `SetSort()` para controlar a ordem de renderização.** Se seu HUD aparece atrás de elementos vanilla, chame `m_Root.SetSort(100)` para empurrá-lo acima. Sem ordem de classificação explícita, o timing de criação determina a camada.
- **Faça cache de dados do servidor que raramente mudam.** O nome do servidor não muda durante uma sessão. Solicite-o uma vez na inicialização e faça cache localmente em vez de re-solicitar a cada segundo.

---

## Teoria vs Prática

| Conceito | Teoria | Realidade |
|---------|--------|---------|
| `OnUpdate(float timeslice)` | Chamado uma vez por frame com o delta time do frame | Em um cliente com 144 FPS, isso dispara 144 vezes por segundo. Enviar um RPC a cada chamada cria 144 pacotes de rede/segundo por jogador. Sempre acumule `timeslice` e aja apenas quando a soma exceder seu intervalo. |
| Caminho do layout em `CreateWidgets()` | Carrega o layout a partir do caminho fornecido | O caminho é relativo ao prefixo do PBO, não ao sistema de arquivos. Se o prefixo do seu PBO não corresponde à string do caminho, `CreateWidgets` silenciosamente retorna NULL sem erro no log. |
| `WidgetFadeTimer` | Anima suavemente a opacidade do widget | `FadeOut` oculta o widget após a animação completar, mas `FadeIn` NÃO chama `Show(true)` primeiro. Você deve manualmente mostrar o widget antes de chamar `FadeIn`, ou nada aparece. |
| `GetUApi().GetInputByName()` | Retorna a ação de input para sua tecla personalizada | Se `inputs.xml` não é referenciado no `config.cpp` sob `class inputs`, o nome da ação é desconhecido e `GetInputByName` retorna null, causando um crash em `.LocalPress()`. |

---

## O Que Você Aprendeu

Neste tutorial você aprendeu:
- Como criar um layout de HUD com painéis ancorados e semitransparentes
- Como construir uma classe controladora que limita atualizações a um intervalo fixo
- Como fazer hook no `MissionGameplay` para gerenciamento do ciclo de vida do HUD (init, update, cleanup)
- Como solicitar dados do servidor via RPC e exibi-los no cliente
- Como registrar uma tecla personalizada via `inputs.xml` e alternar a visibilidade do HUD com animações de fade

**Anterior:** [Capítulo 8.7: Publicando na Steam Workshop](07-publishing-workshop.md)
