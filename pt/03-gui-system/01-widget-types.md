# Chapter 3.1: Widget Types

[Home](../README.md) | **Widget Types** | [Next: Layout Files >>](02-layout-files.md)

---

---

## Como os Widgets Funcionam

Todo widget no DayZ herda da classe base `Widget`. Widgets sao organizados em uma arvore pai-filho, onde a raiz e tipicamente um `WorkspaceWidget` obtido via `GetGame().GetWorkspace()`.

Cada tipo de widget tem tres identificadores associados:

| Identificador | Exemplo | Usado Para |
|---|---|---|
| **Classe de script** | `TextWidget` | Referencias de codigo, casting |
| **Classe de layout** | `TextWidgetClass` | Declaracoes em arquivos `.layout` |
| **Constante TypeID** | `TextWidgetTypeID` | Criacao programatica com `CreateWidget()` |

Em arquivos `.layout` voce sempre usa o nome da classe de layout (terminando em `Class`). Em scripts voce trabalha com o nome da classe de script.

---

## Widgets de Container / Layout

Widgets de container seguram e organizam widgets filhos. Eles nao exibem conteudo por si so (exceto `PanelWidget`, que desenha um retangulo colorido).

| Classe de Script | Classe de Layout | Proposito |
|---|---|---|
| `Widget` | `WidgetClass` | Classe base abstrata para todos os widgets. Nunca instancie diretamente. |
| `WorkspaceWidget` | `WorkspaceWidgetClass` | Workspace raiz. Obtido via `GetGame().GetWorkspace()`. Usado para criar widgets programaticamente. |
| `FrameWidget` | `FrameWidgetClass` | Container de uso geral. O widget mais comumente usado no DayZ. |
| `PanelWidget` | `PanelWidgetClass` | Retangulo colorido solido. Use para fundos, divisores, separadores. |
| `WrapSpacerWidget` | `WrapSpacerWidgetClass` | Layout de fluxo. Arranja filhos sequencialmente com quebra de linha, padding e margens. |
| `GridSpacerWidget` | `GridSpacerWidgetClass` | Layout de grid. Arranja filhos em uma grade definida por `Columns` e `Rows`. |
| `ScrollWidget` | `ScrollWidgetClass` | Viewport rolavel. Habilita rolagem vertical/horizontal do conteudo filho. |
| `SpacerBaseWidget` | -- | Classe base abstrata para `WrapSpacerWidget` e `GridSpacerWidget`. |

### FrameWidget

O carro-chefe da UI do DayZ. Use `FrameWidget` como seu container padrao quando precisar agrupar widgets. Ele nao tem aparencia visual -- e puramente estrutural.

**Metodos principais:**
- Todos os metodos base de `Widget` (posicao, tamanho, cor, filhos, flags)

**Quando usar:** Quase em todo lugar. Agrupe widgets relacionados. Use como raiz de dialogos, paineis e elementos de HUD.

```c
// Encontrar um frame widget pelo nome
FrameWidget panel = FrameWidget.Cast(root.FindAnyWidget("MyPanel"));
panel.Show(true);
```

### PanelWidget

Um retangulo visivel com cor solida. Diferente do `FrameWidget`, um `PanelWidget` realmente desenha algo na tela.

**Metodos principais:**
- `SetColor(int argb)` -- Definir a cor de fundo
- `SetAlpha(float alpha)` -- Definir transparencia

**Quando usar:** Fundos atras de texto, divisores coloridos, retangulos de overlay, camadas de tonalizacao.

```c
PanelWidget bg = PanelWidget.Cast(root.FindAnyWidget("Background"));
bg.SetColor(ARGB(200, 0, 0, 0));  // Preto semi-transparente
```

### WrapSpacerWidget

Arranja automaticamente os filhos em um layout de fluxo. Os filhos sao colocados um apos o outro, quebrando para a proxima linha quando o espaco acaba.

**Atributos principais de layout:**
- `Padding` -- Padding interno (pixels)
- `Margin` -- Margem externa (pixels)
- `"Size To Content H" 1` -- Redimensionar largura para caber nos filhos
- `"Size To Content V" 1` -- Redimensionar altura para caber nos filhos
- `content_halign` -- Alinhamento horizontal do conteudo (`left`, `center`, `right`)
- `content_valign` -- Alinhamento vertical do conteudo (`top`, `center`, `bottom`)

**Quando usar:** Listas dinamicas, nuvens de tags, linhas de botoes, qualquer layout onde filhos tem tamanhos variados.

### GridSpacerWidget

Arranja filhos em uma grade fixa. Cada celula tem tamanho igual.

**Atributos principais de layout:**
- `Columns` -- Numero de colunas
- `Rows` -- Numero de linhas
- `Margin` -- Espaco entre celulas
- `"Size To Content V" 1` -- Redimensionar altura para caber no conteudo

**Quando usar:** Grades de inventario, galerias de icones, paineis de configuracao com linhas uniformes.

### ScrollWidget

Fornece um viewport rolavel para conteudo que excede a area visivel.

**Atributos principais de layout:**
- `"Scrollbar V" 1` -- Habilitar barra de rolagem vertical
- `"Scrollbar H" 1` -- Habilitar barra de rolagem horizontal

**Metodos principais:**
- `VScrollToPos(float pos)` -- Rolar para uma posicao vertical
- `GetVScrollPos()` -- Obter posicao atual de rolagem vertical
- `GetContentHeight()` -- Obter altura total do conteudo
- `VScrollStep(int step)` -- Rolar por uma quantidade de passos

**Quando usar:** Listas longas, paineis de configuracao, janelas de chat, visualizadores de log.

---

## Widgets de Exibicao

Widgets de exibicao mostram conteudo ao usuario, mas nao sao interativos.

| Classe de Script | Classe de Layout | Proposito |
|---|---|---|
| `TextWidget` | `TextWidgetClass` | Exibicao de texto de linha unica |
| `MultilineTextWidget` | `MultilineTextWidgetClass` | Texto somente leitura de multiplas linhas |
| `RichTextWidget` | `RichTextWidgetClass` | Texto com imagens incorporadas (tags `<image>`) |
| `ImageWidget` | `ImageWidgetClass` | Exibicao de imagem (de imagesets ou arquivos) |
| `CanvasWidget` | `CanvasWidgetClass` | Superficie de desenho programavel |
| `VideoWidget` | `VideoWidgetClass` | Reproducao de arquivo de video |
| `RTTextureWidget` | `RTTextureWidgetClass` | Superficie de render-to-texture |
| `RenderTargetWidget` | `RenderTargetWidgetClass` | Alvo de renderizacao de cena 3D |
| `ItemPreviewWidget` | `ItemPreviewWidgetClass` | Preview 3D de item do DayZ |
| `PlayerPreviewWidget` | `PlayerPreviewWidgetClass` | Preview 3D do personagem do jogador |
| `MapWidget` | `MapWidgetClass` | Mapa do mundo interativo |

### TextWidget

O widget de exibicao mais comum. Mostra uma unica linha de texto.

**Metodos principais:**
```c
TextWidget tw;
tw.SetText("Hello World");
tw.GetText();                           // Retorna string
tw.GetTextSize(out int w, out int h);   // Dimensoes em pixels do texto renderizado
tw.SetTextExactSize(float size);        // Definir tamanho da fonte em pixels
tw.SetOutline(int size, int color);     // Adicionar contorno ao texto
tw.GetOutlineSize();                    // Retorna int
tw.GetOutlineColor();                   // Retorna int (ARGB)
tw.SetColor(int argb);                  // Cor do texto
```

**Atributos principais de layout:** `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `"size to text h"`, `"size to text v"`, `wrap`.

### MultilineTextWidget

Exibe multiplas linhas de texto somente leitura. O texto quebra automaticamente baseado na largura do widget.

**Quando usar:** Paineis de descricao, texto de ajuda, exibicoes de log.

### RichTextWidget

Suporta imagens inline incorporadas no texto usando tags `<image>`. Tambem suporta quebra de texto.

**Atributos principais de layout:**
- `wrap 1` -- Habilitar quebra de palavra

**Uso no texto:**
```
"Health: <image set:dayz_gui image:iconHealth0 /> OK"
```

**Quando usar:** Texto de status com icones, mensagens formatadas, chat com imagens inline.

### ImageWidget

Exibe imagens de sprite sheets de imagesets ou carregadas de caminhos de arquivo.

**Metodos principais:**
```c
ImageWidget iw;
iw.SetImage(int index);                    // Alternar entre image0, image1, etc.
iw.LoadImageFile(int slot, string path);   // Carregar imagem de arquivo
iw.LoadMaskTexture(string path);           // Carregar uma textura de mascara
iw.SetMaskProgress(float progress);        // 0-1 para transicoes de revelacao
```

**Atributos principais de layout:**
- `image0 "set:dayz_gui image:icon_refresh"` -- Imagem de um imageset
- `mode blend` -- Modo de blend (`blend`, `additive`, `stretch`)
- `"src alpha" 1` -- Usar canal alfa de origem
- `stretch 1` -- Esticar imagem para preencher o widget
- `"flip u" 1` -- Espelhar horizontalmente
- `"flip v" 1` -- Espelhar verticalmente

**Quando usar:** Icones, logos, fundos, marcadores de mapa, indicadores de status.

### CanvasWidget

Uma superficie de desenho onde voce pode renderizar linhas programaticamente.

**Metodos principais:**
```c
CanvasWidget cw;
cw.DrawLine(float x1, float y1, float x2, float y2, float width, int color);
cw.Clear();
```

**Quando usar:** Graficos customizados, linhas de conexao entre nos, overlays de debug.

### MapWidget

O mapa do mundo interativo completo. Suporta pan, zoom e conversao de coordenadas.

**Metodos principais:**
```c
MapWidget mw;
mw.SetMapPos(vector pos);              // Centralizar na posicao do mundo
mw.GetMapPos();                        // Posicao central atual
mw.SetScale(float scale);             // Nivel de zoom
mw.GetScale();                        // Zoom atual
mw.MapToScreen(vector world_pos);     // Coords do mundo para coords da tela
mw.ScreenToMap(vector screen_pos);    // Coords da tela para coords do mundo
```

**Quando usar:** Mapas de missao, sistemas GPS, seletores de localizacao.

### ItemPreviewWidget

Renderiza um preview 3D de qualquer item de inventario do DayZ.

**Quando usar:** Telas de inventario, previews de loot, interfaces de loja.

### PlayerPreviewWidget

Renderiza um preview 3D do modelo do personagem do jogador.

**Quando usar:** Telas de criacao de personagem, preview de equipamento, sistemas de guarda-roupa.

### RTTextureWidget

Renderiza seus filhos em uma superficie de textura em vez de diretamente na tela.

**Quando usar:** Renderizacao de minimapa, efeitos picture-in-picture, composicao de UI offscreen.

---

## Widgets Interativos

Widgets interativos respondem a entrada do usuario e disparam eventos.

| Classe de Script | Classe de Layout | Proposito |
|---|---|---|
| `ButtonWidget` | `ButtonWidgetClass` | Botao clicavel |
| `CheckBoxWidget` | `CheckBoxWidgetClass` | Checkbox booleano |
| `EditBoxWidget` | `EditBoxWidgetClass` | Entrada de texto de linha unica |
| `MultilineEditBoxWidget` | `MultilineEditBoxWidgetClass` | Entrada de texto de multiplas linhas |
| `PasswordEditBoxWidget` | `PasswordEditBoxWidgetClass` | Entrada de senha mascarada |
| `SliderWidget` | `SliderWidgetClass` | Controle de slider horizontal |
| `XComboBoxWidget` | `XComboBoxWidgetClass` | Selecao dropdown |
| `TextListboxWidget` | `TextListboxWidgetClass` | Lista de linhas selecionaveis |
| `ProgressBarWidget` | `ProgressBarWidgetClass` | Indicador de progresso |
| `SimpleProgressBarWidget` | `SimpleProgressBarWidgetClass` | Indicador de progresso minimo |

### ButtonWidget

O controle interativo principal. Suporta tanto clique momentaneo quanto modos toggle.

**Metodos principais:**
```c
ButtonWidget bw;
bw.SetText("Click Me");
bw.GetState();              // Retorna bool (apenas botoes toggle)
bw.SetState(bool state);    // Definir estado de toggle
```

**Atributos principais de layout:**
- `text "Label"` -- Texto do rotulo do botao
- `switch toggle` -- Tornar botao toggle
- `style Default` -- Estilo visual

**Eventos disparados:** `OnClick(Widget w, int x, int y, int button)`

### CheckBoxWidget

Um controle de toggle booleano.

**Metodos principais:**
```c
CheckBoxWidget cb;
cb.IsChecked();                 // Retorna bool
cb.SetChecked(bool checked);    // Definir estado
```

**Eventos disparados:** `OnChange(Widget w, int x, int y, bool finished)`

### EditBoxWidget

Um campo de entrada de texto de linha unica.

**Metodos principais:**
```c
EditBoxWidget eb;
eb.GetText();               // Retorna string
eb.SetText("default");      // Definir conteudo de texto
```

**Eventos disparados:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` e `true` quando Enter e pressionado.

### SliderWidget

Um slider horizontal para valores numericos.

**Metodos principais:**
```c
SliderWidget sw;
sw.GetCurrent();            // Retorna float (0-1)
sw.SetCurrent(float val);   // Definir posicao
```

**Atributos principais de layout:**
- `"fill in" 1` -- Mostrar trilha preenchida atras do handle
- `"listen to input" 1` -- Responder a entrada do mouse

**Eventos disparados:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` e `true` quando o usuario solta o slider.

### XComboBoxWidget

Uma lista de selecao dropdown.

**Metodos principais:**
```c
XComboBoxWidget xcb;
xcb.AddItem("Option A");
xcb.AddItem("Option B");
xcb.SetCurrentItem(0);         // Selecionar por indice
xcb.GetCurrentItem();          // Retorna indice selecionado
xcb.ClearAll();                // Remover todos os itens
```

### TextListboxWidget

Uma lista rolavel de linhas de texto. Suporta selecao e dados multi-coluna.

**Metodos principais:**
```c
TextListboxWidget tlb;
tlb.AddItem("Row text", null, 0);   // texto, userData, coluna
tlb.GetSelectedRow();               // Retorna int (-1 se nenhum)
tlb.SetRow(int row);                // Selecionar uma linha
tlb.RemoveRow(int row);
tlb.ClearItems();
```

**Eventos disparados:** `OnItemSelected`

### ProgressBarWidget

Exibe um indicador de progresso.

**Metodos principais:**
```c
ProgressBarWidget pb;
pb.SetCurrent(float value);    // 0-100
```

**Quando usar:** Barras de carregamento, barras de vida, progresso de missao, indicadores de cooldown.

---

## Referencia Completa de TypeID

Use estas constantes com `GetGame().GetWorkspace().CreateWidget()` para criacao programatica de widgets:

```
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
MultilineEditBoxWidgetTypeID
RichTextWidgetTypeID
RenderTargetWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
SliderWidgetTypeID
TextListboxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
WorkspaceWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
```

---

## Escolhendo o Widget Certo

| Eu preciso... | Use este widget |
|---|---|
| Agrupar widgets (invisivel) | `FrameWidget` |
| Desenhar um retangulo colorido | `PanelWidget` |
| Mostrar texto | `TextWidget` |
| Mostrar texto de multiplas linhas | `MultilineTextWidget` ou `RichTextWidget` com `wrap 1` |
| Mostrar texto com icones inline | `RichTextWidget` |
| Exibir uma imagem/icone | `ImageWidget` |
| Criar um botao clicavel | `ButtonWidget` |
| Criar um toggle (liga/desliga) | `CheckBoxWidget` ou `ButtonWidget` com `switch toggle` |
| Aceitar entrada de texto | `EditBoxWidget` |
| Aceitar entrada de texto multi-linha | `MultilineEditBoxWidget` |
| Aceitar uma senha | `PasswordEditBoxWidget` |
| Deixar o usuario escolher um numero | `SliderWidget` |
| Deixar o usuario escolher de uma lista | `XComboBoxWidget` (dropdown) ou `TextListboxWidget` (lista visivel) |
| Mostrar progresso | `ProgressBarWidget` ou `SimpleProgressBarWidget` |
| Arranjar filhos em fluxo | `WrapSpacerWidget` |
| Arranjar filhos em grade | `GridSpacerWidget` |
| Tornar conteudo rolavel | `ScrollWidget` |
| Mostrar um modelo 3D de item | `ItemPreviewWidget` |
| Mostrar o modelo do jogador | `PlayerPreviewWidget` |
| Mostrar o mapa do mundo | `MapWidget` |
| Desenhar linhas/formas customizadas | `CanvasWidget` |
| Renderizar para uma textura | `RTTextureWidget` |

---

## Proximos Passos

- [3.2 Formato de Arquivo de Layout](02-layout-files.md) -- Aprenda como definir arvores de widgets em arquivos `.layout`
- [3.5 Criacao Programatica de Widgets](05-programmatic-widgets.md) -- Crie widgets por codigo ao inves de arquivos de layout
