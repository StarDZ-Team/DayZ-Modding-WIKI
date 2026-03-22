# Chapter 3.5: Programmatic Widget Creation

[Home](../README.md) | [<< Previous: Container Widgets](04-containers.md) | **Programmatic Widget Creation** | [Next: Event Handling >>](06-event-handling.md)

---

## Duas Abordagens

O DayZ fornece duas formas de criar widgets por codigo:

1. **`CreateWidgets()`** -- Carregar um arquivo `.layout` e instanciar sua arvore de widgets
2. **`CreateWidget()`** -- Criar um unico widget com parametros explicitos

Ambos os metodos sao chamados no `WorkspaceWidget` obtido via `GetGame().GetWorkspace()`.

---

## CreateWidgets() -- A Partir de Arquivos de Layout

A abordagem mais comum. Carrega um arquivo `.layout` e cria toda a arvore de widgets, anexando-a a um widget pai.

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // Caminho para o arquivo de layout
    parentWidget                            // Widget pai (ou null para raiz)
);
```

O `Widget` retornado e o widget raiz do arquivo de layout. Voce pode entao encontrar widgets filhos pelo nome:

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### Criando Multiplas Instancias

Um padrao comum e criar multiplas instancias de um template de layout (ex: itens de lista):

```c
void PopulateList(WrapSpacerWidget container, array<string> items)
{
    foreach (string item : items)
    {
        Widget row = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/ListRow.layout", container);

        TextWidget label = TextWidget.Cast(row.FindAnyWidget("Label"));
        label.SetText(item);
    }

    container.Update();  // Forcar recalculo de layout
}
```

---

## CreateWidget() -- Criacao Programatica

Cria um unico widget com tipo, posicao, tamanho, flags e pai explicitos.

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // Constante de tipo ID do widget
    0,                       // Posicao X
    0,                       // Posicao Y
    100,                     // Largura
    100,                     // Altura
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // Cor (inteiro ARGB, -1 = branco/padrao)
    0,                       // Ordem de classificacao (prioridade)
    parentWidget             // Widget pai
);
```

### Parametros

| Parametro | Tipo | Descricao |
|---|---|---|
| typeID | int | Constante de tipo do widget (ex: `FrameWidgetTypeID`, `TextWidgetTypeID`) |
| x | float | Posicao X (proporcional ou pixel baseado nas flags) |
| y | float | Posicao Y |
| width | float | Largura do widget |
| height | float | Altura do widget |
| flags | int | OR bit a bit de constantes `WidgetFlags` |
| color | int | Inteiro de cor ARGB (-1 para padrao/branco) |
| sort | int | Ordem Z (maior renderiza por cima) |
| parent | Widget | Widget pai para anexar |

### IDs de Tipo de Widget

```c
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
RichTextWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
RenderTargetWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
MultilineEditBoxWidgetTypeID
SliderWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
TextListboxWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
WorkspaceWidgetTypeID
```

---

## WidgetFlags

Flags controlam o comportamento do widget quando criado programaticamente. Combine-as com OR bit a bit (`|`).

| Flag | Efeito |
|---|---|
| `WidgetFlags.VISIBLE` | Widget comeca visivel |
| `WidgetFlags.IGNOREPOINTER` | Widget nao recebe eventos do mouse |
| `WidgetFlags.DRAGGABLE` | Widget pode ser arrastado |
| `WidgetFlags.EXACTSIZE` | Valores de tamanho sao em pixels (nao proporcional) |
| `WidgetFlags.EXACTPOS` | Valores de posicao sao em pixels (nao proporcional) |
| `WidgetFlags.SOURCEALPHA` | Usar canal alfa de origem |
| `WidgetFlags.BLEND` | Habilitar alpha blending |
| `WidgetFlags.FLIPU` | Espelhar textura horizontalmente |
| `WidgetFlags.FLIPV` | Espelhar textura verticalmente |

Combinacoes comuns de flags:

```c
// Visivel, tamanho em pixels, posicao em pixels, alpha-blended
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// Visivel, proporcional, nao-interativo
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

Apos a criacao, voce pode modificar flags dinamicamente:

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // Adicionar uma flag
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // Remover uma flag
int flags = widget.GetFlags();                  // Ler flags atuais
```

---

## Definindo Propriedades Apos a Criacao

Apos criar um widget com `CreateWidget()`, voce precisa configura-lo. O widget e retornado como o tipo base `Widget`, entao voce deve fazer cast para o tipo especifico.

### Definindo Nome

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

Nomes sao importantes para buscas com `FindAnyWidget()` e debug.

### Definindo Texto

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // Tamanho da fonte em pixels
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // Contorno preto de 1px
```

### Definindo Cor

Cores no DayZ usam formato ARGB (Alpha, Red, Green, Blue), empacotados em um unico inteiro de 32 bits:

```c
// Usando a funcao helper ARGB (0-255 por canal)
int red    = ARGB(255, 255, 0, 0);       // Vermelho opaco
int green  = ARGB(255, 0, 255, 0);       // Verde opaco
int blue   = ARGB(200, 0, 0, 255);       // Azul semi-transparente
int black  = ARGB(255, 0, 0, 0);         // Preto opaco
int white  = ARGB(255, 255, 255, 255);   // Branco opaco (igual a -1)

// Usando a versao float (0.0-1.0 por canal)
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// Decompor uma cor de volta para floats
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// Aplicar a qualquer widget
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // Sobrescrever apenas o alfa
```

O formato hexadecimal `0xAARRGGBB` tambem e comum:

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### Definindo um Event Handler

```c
widget.SetHandler(myEventHandler);  // Instancia de ScriptedWidgetEventHandler
```

### Definindo User Data

Anexe dados arbitrarios a um widget para recuperacao posterior:

```c
widget.SetUserData(myDataObject);  // Deve herdar de Managed

// Recuperar depois:
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## Limpeza de Widgets

Widgets que nao sao mais necessarios devem ser limpos adequadamente para evitar vazamentos de memoria.

### Unlink()

Remove um widget do seu pai e o destroi (e todos os seus filhos):

```c
widget.Unlink();
```

Apos chamar `Unlink()`, a referencia do widget se torna invalida. Defina como `null`:

```c
widget.Unlink();
widget = null;
```

### Removendo Todos os Filhos

Para limpar um widget container de todos os seus filhos:

```c
void ClearChildren(Widget parent)
{
    Widget child = parent.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();
        child = next;
    }
}
```

**Importante:** Voce deve chamar `GetSibling()` **antes** de chamar `Unlink()`, porque unlink invalida a cadeia de irmaos do widget.

### Verificacoes de Null

Sempre faca verificacao de null nos widgets antes de usa-los. `FindAnyWidget()` retorna `null` se o widget nao for encontrado, e operacoes de cast retornam `null` se o tipo nao corresponder:

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Found it");
}
```

---

## Navegacao na Hierarquia de Widgets

Navegue pela arvore de widgets por codigo:

```c
Widget parent = widget.GetParent();           // Widget pai
Widget firstChild = widget.GetChildren();     // Primeiro filho
Widget nextSibling = widget.GetSibling();     // Proximo irmao
Widget found = widget.FindAnyWidget("Name");  // Busca recursiva por nome

string name = widget.GetName();               // Nome do widget
string typeName = widget.GetTypeName();       // ex: "TextWidget"
```

Para iterar todos os filhos:

```c
Widget child = parent.GetChildren();
while (child)
{
    // Processar filho
    Print("Child: " + child.GetName());

    child = child.GetSibling();
}
```

Para iterar todos os descendentes recursivamente:

```c
void WalkWidgets(Widget w, int depth = 0)
{
    if (!w) return;

    string indent = "";
    for (int i = 0; i < depth; i++) indent += "  ";
    Print(indent + w.GetTypeName() + " " + w.GetName());

    WalkWidgets(w.GetChildren(), depth + 1);
    WalkWidgets(w.GetSibling(), depth);
}
```

---

## Exemplo Completo: Criando um Dialogo por Codigo

Aqui esta um exemplo completo que cria um dialogo de informacao simples inteiramente por codigo, sem nenhum arquivo de layout:

```c
class SimpleCodeDialog : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected TextWidget m_Title;
    protected TextWidget m_Message;
    protected ButtonWidget m_CloseBtn;

    void SimpleCodeDialog(string title, string message)
    {
        int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE
            | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
        int FLAGS_PROP = WidgetFlags.VISIBLE | WidgetFlags.SOURCEALPHA
            | WidgetFlags.BLEND;

        WorkspaceWidget workspace = GetGame().GetWorkspace();

        // Frame raiz: 400x200 pixels, centralizado na tela
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // Centralizar manualmente
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // Texto do titulo: largura total, 30px de altura, no topo
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // Texto da mensagem: abaixo do titulo, preenche espaco restante
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // Botao de fechar: 80x30 pixels, area inferior direita
        Widget btnW = workspace.CreateWidget(
            ButtonWidgetTypeID, 310, 160, 80, 30, FLAGS_EXACT,
            ARGB(255, 80, 130, 200), 0, m_Root);
        m_CloseBtn = ButtonWidget.Cast(btnW);
        m_CloseBtn.SetText("Close");
        m_CloseBtn.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_CloseBtn)
        {
            Close();
            return true;
        }
        return false;
    }

    void Close()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }

    void ~SimpleCodeDialog()
    {
        Close();
    }
}

// Uso:
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## Arquivos de Layout vs. Programatico: Quando Usar Cada Um

| Situacao | Recomendacao |
|---|---|
| Estrutura de UI estatica | Arquivo de layout (`.layout`) |
| Arvores de widgets complexas | Arquivo de layout |
| Numero dinamico de itens | `CreateWidgets()` a partir de um layout template |
| Elementos simples em tempo de execucao (texto de debug, marcadores) | `CreateWidget()` |
| Prototipagem rapida | `CreateWidget()` |
| UI de mod em producao | Arquivo de layout + configuracao por codigo |

Na pratica, a maioria dos mods usa **arquivos de layout** para a estrutura e **codigo** para popular dados, mostrar/ocultar elementos e tratar eventos. UIs puramente programaticas sao raras fora de ferramentas de debug.

---

## Proximos Passos

- [3.6 Tratamento de Eventos](06-event-handling.md) -- Tratar cliques, mudancas e eventos do mouse
- [3.7 Estilos, Fontes e Imagens](07-styles-fonts.md) -- Estilizacao visual e recursos de imagem
