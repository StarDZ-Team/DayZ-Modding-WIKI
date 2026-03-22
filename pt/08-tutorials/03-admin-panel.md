# Chapter 8.3: Building an Admin Panel Module

[Home](../README.md) | [<< Previous: Creating a Custom Item](02-custom-item.md) | **Building an Admin Panel** | [Next: Adding Chat Commands >>](04-chat-commands.md)

---

## O que Estamos Construindo

Vamos criar um painel **Admin Player Info** que:

1. Mostra um botão "Refresh" em um painel UI simples
2. Quando o admin clica Refresh, envia um RPC para o servidor solicitando dados de contagem de jogadores
3. O servidor recebe a requisição, coleta as informações e envia de volta
4. O cliente recebe a resposta e exibe a contagem de jogadores e a lista na UI

Isso demonstra o padrão fundamental usado por toda ferramenta admin com rede, painel de configuração de mod e UI multiplayer no DayZ.

---

## Pré-requisitos

- Um mod funcional do [Capítulo 8.1](01-first-mod.md) ou um novo mod com a estrutura padrão
- Entendimento da [Hierarquia de Script de 5 Camadas](../02-mod-structure/01-five-layers.md) (vamos usar `3_Game`, `4_World` e `5_Mission`)

### Estrutura do Mod para Este Tutorial

```
AdminDemo/
    mod.cpp
    GUI/
        layouts/
            admin_player_info.layout
    Scripts/
        config.cpp
        3_Game/
            AdminDemo/
                AdminDemoRPC.c
        4_World/
            AdminDemo/
                AdminDemoServer.c
        5_Mission/
            AdminDemo/
                AdminDemoPanel.c
                AdminDemoMission.c
```

---

## Visão Geral da Arquitetura

```
CLIENT                              SERVER
------                              ------

1. Admin clica "Refresh"
2. Cliente envia RPC ------>  3. Servidor recebe RPC
   (AdminDemo_RequestInfo)       Coleta dados de jogadores
                             4. Servidor envia RPC ------>  CLIENT
                                (AdminDemo_ResponseInfo)
                                                     5. Cliente recebe RPC
                                                        Atualiza texto da UI
```

---

## Passo 1: Definir Constantes RPC (3_Game)

```c
class AdminDemoRPC
{
    // IDs de RPC -- escolher números únicos que não colidam com outros mods
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

### Por que 3_Game?

IDs de RPC são dados puros --- inteiros sem dependência de entidades do mundo ou UI. Colocá-los em `3_Game` os torna visíveis tanto para `4_World` (onde o handler do servidor fica) quanto `5_Mission` (onde a UI do cliente fica).

---

## Passo 2: Criar o Arquivo de Layout

```
FrameWidgetClass AdminDemoPanel {
 size 0.4 0.5
 position 0.3 0.25
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 0
 {
  ImageWidgetClass Background {
   size 1 1
   position 0 0
   color 0.1 0.1 0.1 0.85
  }
  TextWidgetClass Title {
   size 1 0.08
   position 0 0.02
   text "Player Info Panel"
   "text halign" center
   "text valign" center
   color 1 1 1 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass RefreshButton {
   size 0.3 0.08
   position 0.35 0.12
   text "Refresh"
   "text halign" center
   "text valign" center
   color 0.2 0.6 1.0 1.0
  }
  TextWidgetClass PlayerCountText {
   size 1 0.06
   position 0 0.22
   text "Player Count: --"
   "text halign" center
   "text valign" center
   color 0.9 0.9 0.9 1
  }
  TextWidgetClass PlayerListText {
   size 0.9 0.55
   position 0.05 0.3
   text "Click Refresh to load player data..."
   "text halign" left
   "text valign" top
   color 0.8 0.8 0.8 1
  }
  ButtonWidgetClass CloseButton {
   size 0.2 0.06
   position 0.4 0.9
   text "Close"
   "text halign" center
   "text valign" center
   color 1.0 0.3 0.3 1.0
  }
 }
}
```

---

## Passo 3: Criar o Painel do Cliente (5_Mission)

```c
class AdminDemoPanel extends ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_RefreshButton;
    protected ButtonWidget m_CloseButton;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_PlayerListText;
    protected bool m_IsOpen;

    void Open()
    {
        if (m_IsOpen) return;

        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root) return;

        m_RefreshButton  = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton    = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        if (m_RefreshButton) m_RefreshButton.SetHandler(this);
        if (m_CloseButton) m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void Close()
    {
        if (!m_IsOpen) return;
        if (m_Root) { m_Root.Unlink(); m_Root = null; }
        m_IsOpen = false;
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);
    }

    void Toggle() { if (m_IsOpen) Close(); else Open(); }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_RefreshButton) { OnRefreshClicked(); return true; }
        if (w == m_CloseButton) { Close(); return true; }
        return false;
    }

    protected void OnRefreshClicked()
    {
        if (m_PlayerCountText) m_PlayerCountText.SetText("Player Count: Loading...");

        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    void OnPlayerInfoReceived(int playerCount, string playerNames)
    {
        if (m_PlayerCountText) m_PlayerCountText.SetText("Player Count: " + playerCount.ToString());
        if (m_PlayerListText) m_PlayerListText.SetText(playerNames);
    }
};
```

### Conceitos-Chave

**`CreateWidgets()`** carrega o arquivo `.layout` e cria objetos widget reais na memória.

**`FindAnyWidget("name")`** busca na árvore de widgets por um widget com o nome dado. O nome deve corresponder ao do arquivo de layout exatamente.

**`SetHandler(this)`** registra esta classe como handler de eventos para o widget. Quando o botão é clicado, a engine chama `OnClick()` neste objeto.

**`PlayerControlDisable` / `PlayerControlEnable`** desabilita/reabilita movimento e ações do jogador. Sem isso, o jogador andaria enquanto tenta clicar botões.

---

## Passo 4: Handler Server-Side (4_World)

```c
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer()) return;

        if (rpc_type == AdminDemoRPC.REQUEST_PLAYER_INFO)
            HandlePlayerInfoRequest(sender);
    }

    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor) return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        int playerCount = players.Count();
        string playerNames = "";

        for (int i = 0; i < playerCount; i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                if (playerNames != "") playerNames = playerNames + "\n";
                playerNames = playerNames + (i + 1).ToString() + ". " + man.GetIdentity().GetName();
            }
        }

        if (playerNames == "") playerNames = "(No players connected)";

        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        // Encontrar o objeto jogador do requisitante para enviar resposta
        Man requestorPlayer = null;
        for (int j = 0; j < players.Count(); j++)
        {
            Man candidate = players.Get(j);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
            {
                requestorPlayer = candidate;
                break;
            }
        }

        if (requestorPlayer)
            GetGame().RPCSingleParam(requestorPlayer, AdminDemoRPC.RESPONSE_PLAYER_INFO, responseData, true, requestor);
    }
};
```

---

## Passo 5: Hook da Missão no Cliente (5_Mission)

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    override void OnInit()
    {
        super.OnInit();
        if (!m_AdminDemoPanel) m_AdminDemoPanel = new AdminDemoPanel();
    }

    override void OnMissionFinish()
    {
        if (m_AdminDemoPanel) { m_AdminDemoPanel.Close(); m_AdminDemoPanel = null; }
        super.OnMissionFinish();
    }

    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);
        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel) m_AdminDemoPanel.Toggle();
        }
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == AdminDemoRPC.RESPONSE_PLAYER_INFO)
        {
            Param2<int, string> data = new Param2<int, string>(0, "");
            if (!ctx.Read(data)) return;

            if (m_AdminDemoPanel)
                m_AdminDemoPanel.OnPlayerInfoReceived(data.param1, data.param2);
        }
    }
};
```

---

## Resolução de Problemas

### Painel Não Abre ao Pressionar F5

- Verifique o override de `OnKeyPress`: certifique-se que `super.OnKeyPress(key)` é chamado primeiro.
- Verifique a inicialização: certifique-se que `m_AdminDemoPanel` é criado em `OnInit()`.

### Painel Abre Mas Botões Não Funcionam

- Verifique `SetHandler`: todo botão precisa de `button.SetHandler(this)`.
- Verifique nomes de widgets: `FindAnyWidget("RefreshButton")` é case-sensitive.

### RPC Nunca Chega ao Servidor

- Verifique unicidade do ID de RPC.
- Verifique referência do jogador: `GetGame().GetPlayer()` retorna `null` se chamado antes do jogador estar totalmente inicializado.

### Resposta do Servidor Nunca Chega ao Cliente

- Verifique o parâmetro recipient: o quinto parâmetro de `RPCSingleParam` deve ser o `PlayerIdentity` do cliente alvo.
- Verifique correspondência do tipo Param: servidor envia `Param2<int, string>`, cliente lê `Param2<int, string>`.

---

## Próximos Passos

1. **[Capítulo 8.4: Adicionando Comandos de Chat](04-chat-commands.md)** -- Criar comandos de chat server-side para operações admin.
2. **Adicionar permissões** -- Verificar se o jogador requisitante é admin antes de processar RPCs.
3. **Adicionar mais features** -- Estender o painel com abas para controle de clima, teleporte de jogador, spawn de itens.
4. **Usar um framework** -- Frameworks como MyFramework fornecem roteamento RPC, gerenciamento de config e infraestrutura de painel admin integrados que eliminam muito deste boilerplate.

---

**Anterior:** [Capítulo 8.2: Criando um Item Personalizado](02-custom-item.md)
**Próximo:** [Capítulo 8.4: Adicionando Comandos de Chat](04-chat-commands.md)
