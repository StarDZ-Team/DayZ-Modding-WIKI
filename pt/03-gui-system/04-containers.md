# Chapter 3.4: Container Widgets

[Home](../README.md) | [<< Previous: Sizing & Positioning](03-sizing-positioning.md) | **Container Widgets** | [Next: Programmatic Widgets >>](05-programmatic-widgets.md)

---

## FrameWidget -- Container Estrutural

`FrameWidget` e o container mais basico. Ele nao desenha nada na tela e nao arranja seus filhos -- voce deve posicionar cada filho manualmente.

**Quando usar:**
- Agrupar widgets relacionados para que possam ser mostrados/ocultados juntos
- Widget raiz de um painel ou dialogo
- Qualquer agrupamento estrutural onde voce lida com o posicionamento

```
FrameWidgetClass MyPanel {
 size 0.5 0.5
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
 {
  TextWidgetClass Header {
   position 0 0
   size 1 0.1
   text "Panel Title"
   "text halign" center
  }
  PanelWidgetClass Divider {
   position 0 0.1
   size 1 2
   hexactsize 0
   vexactsize 1
   color 1 1 1 0.3
  }
  FrameWidgetClass Content {
   position 0 0.12
   size 1 0.88
  }
 }
}
```

**Caracteristicas principais:**
- Sem aparencia visual (transparente)
- Filhos posicionados relativos aos limites do frame
- Sem layout automatico -- todo filho precisa de posicao/tamanho explicitos
- Leve -- zero custo de renderizacao alem dos seus filhos

---

## WrapSpacerWidget -- Layout de Fluxo

`WrapSpacerWidget` arranja automaticamente seus filhos em uma sequencia de fluxo. Os filhos sao colocados um apos o outro horizontalmente, quebrando para a proxima linha quando excedem a largura disponivel. Este e o widget para usar em listas dinamicas onde o numero de filhos muda em tempo de execucao.

### Atributos de Layout

| Atributo | Valores | Descricao |
|---|---|---|
| `Padding` | inteiro (pixels) | Espaco entre a borda do spacer e seus filhos |
| `Margin` | inteiro (pixels) | Espaco entre filhos individuais |
| `"Size To Content H"` | `0` ou `1` | Redimensionar largura para caber todos os filhos |
| `"Size To Content V"` | `0` ou `1` | Redimensionar altura para caber todos os filhos |
| `content_halign` | `left`, `center`, `right` | Alinhamento horizontal do grupo de filhos |
| `content_valign` | `top`, `center`, `bottom` | Alinhamento vertical do grupo de filhos |

### Layout de Fluxo Basico

```
WrapSpacerWidgetClass TagList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Padding 5
 Margin 3
 {
  ButtonWidgetClass Tag1 {
   size 80 24
   hexactsize 1
   vexactsize 1
   text "Weapons"
  }
  ButtonWidgetClass Tag2 {
   size 60 24
   hexactsize 1
   vexactsize 1
   text "Food"
  }
  ButtonWidgetClass Tag3 {
   size 90 24
   hexactsize 1
   vexactsize 1
   text "Medical"
  }
 }
}
```

Neste exemplo:
- O spacer tem largura total do pai (`size 1`), mas sua altura se ajusta para caber nos filhos (`"Size To Content V" 1`).
- Os filhos sao botoes de 80px, 60px e 90px de largura.
- Se a largura disponivel nao consegue caber todos os tres em uma linha, o spacer os quebra para a proxima linha.
- `Padding 5` adiciona 5px de espaco dentro das bordas do spacer.
- `Margin 3` adiciona 3px entre cada filho.

### Lista Vertical com WrapSpacer

Para criar uma lista vertical (um item por linha), faca os filhos com largura total:

```
WrapSpacerWidgetClass ItemList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Margin 2
 {
  FrameWidgetClass Item1 {
   size 1 30
   hexactsize 0
   vexactsize 1
  }
  FrameWidgetClass Item2 {
   size 1 30
   hexactsize 0
   vexactsize 1
  }
 }
}
```

Cada filho tem 100% de largura (`size 1` com `hexactsize 0`), entao so um cabe por linha, criando uma pilha vertical.

### Filhos Dinamicos

`WrapSpacerWidget` e ideal para filhos adicionados programaticamente. Quando voce adiciona ou remove filhos, chame `Update()` no spacer para forcar um recalculo do layout:

```c
WrapSpacerWidget spacer;

// Adicionar um filho de um arquivo de layout
Widget child = GetGame().GetWorkspace().CreateWidgets("MyMod/gui/layouts/ListItem.layout", spacer);

// Forcar o spacer a recalcular
spacer.Update();
```

---

## GridSpacerWidget -- Layout de Grade

`GridSpacerWidget` arranja filhos em uma grade uniforme. Voce define o numero de colunas e linhas, e cada celula recebe espaco igual.

### Atributos de Layout

| Atributo | Valores | Descricao |
|---|---|---|
| `Columns` | inteiro | Numero de colunas da grade |
| `Rows` | inteiro | Numero de linhas da grade |
| `Margin` | inteiro (pixels) | Espaco entre celulas da grade |
| `"Size To Content V"` | `0` ou `1` | Redimensionar altura para caber no conteudo |

### Grade Basica

```
GridSpacerWidgetClass InventoryGrid {
 size 0.5 0.5
 hexactsize 0
 vexactsize 0
 Columns 4
 Rows 3
 Margin 2
 {
  // 12 celulas (4 colunas x 3 linhas)
  // Filhos sao colocados em ordem: esquerda-para-direita, cima-para-baixo
  FrameWidgetClass Slot1 { }
  FrameWidgetClass Slot2 { }
  FrameWidgetClass Slot3 { }
  FrameWidgetClass Slot4 { }
  FrameWidgetClass Slot5 { }
  FrameWidgetClass Slot6 { }
  FrameWidgetClass Slot7 { }
  FrameWidgetClass Slot8 { }
  FrameWidgetClass Slot9 { }
  FrameWidgetClass Slot10 { }
  FrameWidgetClass Slot11 { }
  FrameWidgetClass Slot12 { }
 }
}
```

### Grade de Coluna Unica (Lista Vertical)

Definir `Columns 1` cria uma pilha vertical simples onde cada filho ocupa a largura total:

```
GridSpacerWidgetClass SettingsList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Columns 1
 {
  FrameWidgetClass Setting1 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
  FrameWidgetClass Setting2 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
  FrameWidgetClass Setting3 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
 }
}
```

### GridSpacer vs. WrapSpacer

| Caracteristica | GridSpacer | WrapSpacer |
|---|---|---|
| Tamanho da celula | Uniforme (igual) | Cada filho mantem seu proprio tamanho |
| Modo de layout | Grade fixa (colunas x linhas) | Fluxo com quebra |
| Melhor para | Slots de inventario, galerias uniformes | Listas dinamicas, nuvens de tags |
| Dimensionamento dos filhos | Ignorado (a grade controla) | Respeitado (tamanho do filho importa) |

---

## ScrollWidget -- Viewport Rolavel

`ScrollWidget` envolve conteudo que pode ser mais alto (ou mais largo) que a area visivel, fornecendo barras de rolagem para navegacao.

### Atributos de Layout

| Atributo | Valores | Descricao |
|---|---|---|
| `"Scrollbar V"` | `0` ou `1` | Mostrar barra de rolagem vertical |
| `"Scrollbar H"` | `0` ou `1` | Mostrar barra de rolagem horizontal |

### API de Script

```c
ScrollWidget sw;
sw.VScrollToPos(float pos);     // Rolar para posicao vertical (0 = topo)
sw.GetVScrollPos();             // Obter posicao atual de rolagem
sw.GetContentHeight();          // Obter altura total do conteudo
sw.VScrollStep(int step);       // Rolar por uma quantidade de passos
```

### Lista Rolavel Basica

```
ScrollWidgetClass ListScroll {
 size 1 300
 hexactsize 0
 vexactsize 1
 "Scrollbar V" 1
 {
  WrapSpacerWidgetClass ListContent {
   size 1 0
   hexactsize 0
   "Size To Content V" 1
   {
    // Muitos filhos aqui...
    FrameWidgetClass Item1 {
     size 1 30
     hexactsize 0
     vexactsize 1
    }
    FrameWidgetClass Item2 {
     size 1 30
     hexactsize 0
     vexactsize 1
    }
    // ... mais itens
   }
  }
 }
}
```

---

## O Padrao ScrollWidget + WrapSpacer

Este e **o** padrao para listas dinamicas rolaveis em mods de DayZ. Ele combina um `ScrollWidget` de altura fixa com um `WrapSpacerWidget` que cresce para caber seus filhos.

```
// Viewport de scroll com altura fixa
ScrollWidgetClass DialogScroll {
 size 0.97 235
 hexactsize 0
 vexactsize 1
 "Scrollbar V" 1
 {
  // Conteudo cresce verticalmente para caber todos os filhos
  WrapSpacerWidgetClass DialogContent {
   size 1 0
   hexactsize 0
   "Size To Content V" 1
  }
 }
}
```

Como funciona:

1. O `ScrollWidget` tem uma altura **fixa** (235 pixels neste exemplo).
2. Dentro dele, o `WrapSpacerWidget` tem `"Size To Content V" 1`, entao sua altura cresce conforme filhos sao adicionados.
3. Quando o conteudo do spacer excede 235 pixels, a barra de rolagem aparece e o usuario pode rolar.

Este padrao aparece em todo o DabsFramework, DayZ Editor, Expansion e virtualmente todo mod profissional de DayZ.

### Adicionando Itens Programaticamente

```c
ScrollWidget m_Scroll;
WrapSpacerWidget m_Content;

void AddItem(string text)
{
    // Criar um novo filho dentro do WrapSpacer
    Widget item = GetGame().GetWorkspace().CreateWidgets(
        "MyMod/gui/layouts/ListItem.layout", m_Content);

    // Configurar o novo item
    TextWidget tw = TextWidget.Cast(item.FindAnyWidget("Label"));
    tw.SetText(text);

    // Forcar recalculo de layout
    m_Content.Update();
}

void ScrollToBottom()
{
    m_Scroll.VScrollToPos(m_Scroll.GetContentHeight());
}

void ClearAll()
{
    // Remover todos os filhos
    Widget child = m_Content.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();
        child = next;
    }
    m_Content.Update();
}
```

---

## Regras de Aninhamento

Containers podem ser aninhados para criar layouts complexos. Algumas diretrizes:

1. **FrameWidget dentro de qualquer coisa** -- Sempre funciona. Use frames para agrupar sub-secoes dentro de spacers ou grades.

2. **WrapSpacer dentro de ScrollWidget** -- O padrao padrao para listas rolaveis. O spacer cresce; o scroll recorta.

3. **GridSpacer dentro de WrapSpacer** -- Funciona. Util para colocar uma grade fixa como um item em um layout de fluxo.

4. **ScrollWidget dentro de WrapSpacer** -- Possivel mas requer uma altura fixa no scroll widget (`vexactsize 1`). Sem altura fixa, o scroll widget tentara crescer para caber seu conteudo (anulando o proposito da rolagem).

5. **Evite aninhamento profundo** -- Cada nivel de aninhamento adiciona custo de computacao de layout. Tres ou quatro niveis de profundidade e tipico para UIs complexas; ir alem de seis niveis sugere que o layout deve ser reestruturado.

---

## Quando Usar Cada Container

| Cenario | Melhor Container |
|---|---|
| Painel estatico com elementos posicionados manualmente | `FrameWidget` |
| Lista dinamica de itens com tamanho variado | `WrapSpacerWidget` |
| Grade uniforme (inventario, galeria) | `GridSpacerWidget` |
| Lista vertical com um item por linha | `WrapSpacerWidget` (filhos de largura total) ou `GridSpacerWidget` (`Columns 1`) |
| Conteudo mais alto que o espaco disponivel | `ScrollWidget` envolvendo um spacer |
| Area de conteudo de abas | `FrameWidget` (alternar visibilidade dos filhos) |
| Botoes de toolbar | `WrapSpacerWidget` ou `GridSpacerWidget` |

---

## Exemplo Completo: Painel de Configuracoes Rolavel

Um painel de configuracoes com barra de titulo, area de conteudo rolavel com opcoes arranjadas em grade e uma barra de botoes inferior:

```
FrameWidgetClass SettingsPanel {
 size 0.4 0.6
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
 {
  // Barra de titulo
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 30
   hexactsize 0
   vexactsize 1
   color 0.2 0.4 0.8 1
  }

  // Area de configuracoes rolavel
  ScrollWidgetClass SettingsScroll {
   position 0 30
   size 1 0
   hexactpos 0
   vexactpos 1
   hexactsize 0
   vexactsize 0
   "Scrollbar V" 1
   {
    GridSpacerWidgetClass SettingsGrid {
     size 1 0
     hexactsize 0
     "Size To Content V" 1
     Columns 1
     Margin 2
    }
   }
  }

  // Barra de botoes no fundo
  FrameWidgetClass ButtonBar {
   size 1 40
   halign left_ref
   valign bottom_ref
   hexactpos 0
   vexactpos 1
   hexactsize 0
   vexactsize 1
  }
 }
}
```

---

## Proximos Passos

- [3.5 Criacao Programatica de Widgets](05-programmatic-widgets.md) -- Criar widgets por codigo
- [3.6 Tratamento de Eventos](06-event-handling.md) -- Responder a cliques, mudancas e outros eventos
