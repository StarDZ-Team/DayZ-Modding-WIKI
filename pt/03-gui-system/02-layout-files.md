# Chapter 3.2: Layout File Format (.layout)

[Home](../README.md) | [<< Previous: Widget Types](01-widget-types.md) | **Layout File Format** | [Next: Sizing & Positioning >>](03-sizing-positioning.md)

---

## Estrutura Basica

Um arquivo `.layout` define uma arvore de widgets. Todo arquivo tem exatamente um widget raiz, que contem filhos aninhados.

```
WidgetTypeClass WidgetName {
 attribute value
 attribute "quoted value"
 {
  ChildWidgetTypeClass ChildName {
   attribute value
  }
 }
}
```

Regras principais:

1. O elemento raiz e sempre um unico widget (tipicamente `FrameWidgetClass`).
2. Nomes de tipo de widget usam o nome da **classe de layout**, que sempre termina com `Class` (ex: `FrameWidgetClass`, `TextWidgetClass`, `ButtonWidgetClass`).
3. Cada widget tem um nome unico apos seu tipo de classe.
4. Atributos sao pares `chave valor`, um por linha.
5. Nomes de atributos contendo espacos devem ser citados: `"text halign" center`.
6. Valores de string sao citados: `text "Hello World"`.
7. Valores numericos nao sao citados: `size 0.5 0.3`.
8. Filhos sao aninhados dentro de blocos `{ }` apos os atributos do pai.

---

## Referencia de Atributos

### Posicionamento e Dimensionamento

| Atributo | Valores | Descricao |
|---|---|---|
| `position` | `x y` | Posicao do widget (proporcional 0-1 ou valores em pixels) |
| `size` | `w h` | Dimensoes do widget (proporcional 0-1 ou valores em pixels) |
| `halign` | `left_ref`, `center_ref`, `right_ref` | Ponto de referencia de alinhamento horizontal |
| `valign` | `top_ref`, `center_ref`, `bottom_ref` | Ponto de referencia de alinhamento vertical |
| `hexactpos` | `0` ou `1` | 0 = posicao X proporcional, 1 = posicao X em pixels |
| `vexactpos` | `0` ou `1` | 0 = posicao Y proporcional, 1 = posicao Y em pixels |
| `hexactsize` | `0` ou `1` | 0 = largura proporcional, 1 = largura em pixels |
| `vexactsize` | `0` ou `1` | 0 = altura proporcional, 1 = altura em pixels |
| `fixaspect` | `fixwidth`, `fixheight` | Manter proporcao restringindo uma dimensao |
| `scaled` | `0` ou `1` | Escalar com a configuracao de escala de UI do DayZ |
| `priority` | inteiro | Ordem Z (valores maiores renderizam por cima) |

As flags `hexactpos`, `vexactpos`, `hexactsize` e `vexactsize` sao os atributos mais importantes de todo o sistema de layout. Eles controlam se cada dimensao usa unidades proporcionais (0.0 - 1.0 relativas ao pai) ou em pixels (pixels absolutos da tela). Veja [3.3 Dimensionamento e Posicionamento](03-sizing-positioning.md) para uma explicacao completa.

### Atributos Visuais

| Atributo | Valores | Descricao |
|---|---|---|
| `visible` | `0` ou `1` | Visibilidade inicial (0 = oculto) |
| `color` | `r g b a` | Cor como quatro floats, cada um de 0.0 a 1.0 |
| `style` | nome do estilo | Estilo visual predefinido (ex: `Default`, `Colorable`) |
| `draggable` | `0` ou `1` | Widget pode ser arrastado pelo usuario |
| `clipchildren` | `0` ou `1` | Recortar widgets filhos nos limites deste widget |
| `inheritalpha` | `0` ou `1` | Filhos herdam o valor alfa deste widget |
| `keepsafezone` | `0` ou `1` | Manter widget dentro da zona segura da tela |

### Atributos Comportamentais

| Atributo | Valores | Descricao |
|---|---|---|
| `ignorepointer` | `0` ou `1` | Widget ignora entrada do mouse (cliques passam) |
| `disabled` | `0` ou `1` | Widget esta desabilitado |
| `"no focus"` | `0` ou `1` | Widget nao pode receber foco do teclado |

### Atributos de Texto

Estes se aplicam a `TextWidgetClass`, `RichTextWidgetClass`, `MultilineTextWidgetClass`, `ButtonWidgetClass` e outros widgets que contem texto.

| Atributo | Valores | Descricao |
|---|---|---|
| `text` | `"string"` | Conteudo de texto padrao |
| `font` | `"caminho/da/fonte"` | Caminho do arquivo de fonte |
| `"text halign"` | `left`, `center`, `right` | Alinhamento horizontal do texto dentro do widget |
| `"text valign"` | `top`, `center`, `bottom` | Alinhamento vertical do texto dentro do widget |
| `"bold text"` | `0` ou `1` | Renderizacao em negrito |
| `"italic text"` | `0` ou `1` | Renderizacao em italico |
| `"exact text"` | `0` ou `1` | Usar tamanho de fonte exato em pixels em vez de proporcional |
| `"exact text size"` | inteiro | Tamanho da fonte em pixels (requer `"exact text" 1`) |
| `"size to text h"` | `0` ou `1` | Redimensionar largura do widget para caber no texto |
| `"size to text v"` | `0` ou `1` | Redimensionar altura do widget para caber no texto |
| `"text sharpness"` | float | Nitidez de renderizacao do texto |
| `wrap` | `0` ou `1` | Habilitar quebra de palavra |

### Atributos de Imagem

Estes se aplicam a `ImageWidgetClass`.

| Atributo | Valores | Descricao |
|---|---|---|
| `image0` | `"set:nome image:nome"` | Imagem primaria de um imageset |
| `mode` | `blend`, `additive`, `stretch` | Modo de blend da imagem |
| `"src alpha"` | `0` ou `1` | Usar o canal alfa de origem |
| `stretch` | `0` ou `1` | Esticar imagem para preencher o widget |
| `filter` | `0` ou `1` | Habilitar filtragem de textura |
| `"flip u"` | `0` ou `1` | Espelhar imagem horizontalmente |
| `"flip v"` | `0` ou `1` | Espelhar imagem verticalmente |
| `"clamp mode"` | `clamp`, `wrap` | Comportamento de borda da textura |
| `"stretch mode"` | `stretch_w_h`, etc. | Modo de esticamento |

### Atributos de Spacer

Estes se aplicam a `WrapSpacerWidgetClass` e `GridSpacerWidgetClass`.

| Atributo | Valores | Descricao |
|---|---|---|
| `Padding` | inteiro | Padding interno em pixels |
| `Margin` | inteiro | Espaco entre itens filhos em pixels |
| `"Size To Content H"` | `0` ou `1` | Redimensionar largura para corresponder aos filhos |
| `"Size To Content V"` | `0` ou `1` | Redimensionar altura para corresponder aos filhos |
| `content_halign` | `left`, `center`, `right` | Alinhamento horizontal do conteudo dos filhos |
| `content_valign` | `top`, `center`, `bottom` | Alinhamento vertical do conteudo dos filhos |
| `Columns` | inteiro | Colunas da grade (apenas GridSpacer) |
| `Rows` | inteiro | Linhas da grade (apenas GridSpacer) |

### Atributos de Botao

| Atributo | Valores | Descricao |
|---|---|---|
| `switch` | `toggle` | Torna o botao toggle (fica pressionado) |
| `style` | nome do estilo | Estilo visual do botao |

### Atributos de Slider

| Atributo | Valores | Descricao |
|---|---|---|
| `"fill in"` | `0` ou `1` | Mostrar trilha preenchida atras do handle do slider |
| `"listen to input"` | `0` ou `1` | Responder a entrada do mouse |

### Atributos de Scroll

| Atributo | Valores | Descricao |
|---|---|---|
| `"Scrollbar V"` | `0` ou `1` | Mostrar barra de rolagem vertical |
| `"Scrollbar H"` | `0` ou `1` | Mostrar barra de rolagem horizontal |

---

## Integracao com Script

### O Atributo `scriptclass`

O atributo `scriptclass` vincula um widget a uma classe Enforce Script. Quando o layout e carregado, o motor cria uma instancia daquela classe e chama seu metodo `OnWidgetScriptInit(Widget w)`.

```
FrameWidgetClass MyPanel {
 size 1 1
 scriptclass "MyPanelHandler"
}
```

A classe de script deve herdar de `Managed` e implementar `OnWidgetScriptInit`:

```c
class MyPanelHandler : Managed
{
    Widget m_Root;

    void OnWidgetScriptInit(Widget w)
    {
        m_Root = w;
    }
}
```

### O Bloco ScriptParamsClass

Parametros podem ser passados do layout para o `scriptclass` via um bloco `ScriptParamsClass`. Este bloco aparece como um segundo bloco `{ }` filho apos os filhos do widget.

```
ImageWidgetClass Logo {
 image0 "set:dayz_gui image:DayZLogo"
 scriptclass "Bouncer"
 {
  ScriptParamsClass {
   amount 0.1
   speed 1
  }
 }
}
```

A classe de script le esses parametros em `OnWidgetScriptInit` usando o sistema de parametros de script do widget.

### ViewBinding do DabsFramework

Em mods que usam DabsFramework MVC, o padrao `scriptclass "ViewBinding"` conecta widgets as propriedades de dados de um ViewController:

```
TextWidgetClass StatusLabel {
 scriptclass "ViewBinding"
 "text halign" center
 {
  ScriptParamsClass {
   Binding_Name "StatusText"
   Two_Way_Binding 0
  }
 }
}
```

| Parametro | Descricao |
|---|---|
| `Binding_Name` | Nome da propriedade do ViewController para vincular |
| `Two_Way_Binding` | `1` = mudancas na UI enviam de volta para o controller |
| `Relay_Command` | Nome da funcao no controller para chamar quando o widget e clicado/alterado |
| `Selected_Item` | Propriedade para vincular o item selecionado (para listas) |
| `Debug_Logging` | `1` = habilitar logging detalhado para este binding |

---

## Aninhamento de Filhos

Filhos sao colocados dentro de um bloco `{ }` apos os atributos do pai. Multiplos filhos podem existir no mesmo bloco.

```
FrameWidgetClass Parent {
 size 1 1
 {
  TextWidgetClass Child1 {
   position 0 0
   size 1 0.1
   text "First"
  }
  TextWidgetClass Child2 {
   position 0 0.1
   size 1 0.1
   text "Second"
  }
 }
}
```

Filhos sao sempre posicionados relativos ao seu pai. Um filho com `position 0 0` e `size 1 1` (proporcional) preenche seu pai completamente.

---

## Exemplo Completo Anotado

Aqui esta um arquivo de layout totalmente anotado para um painel de notificacao -- o tipo de UI que voce pode construir para um mod:

```
// Container raiz -- frame invisivel que cobre 30% da largura da tela
// Centralizado horizontalmente, posicionado no topo da tela
FrameWidgetClass NotificationPanel {

 // Comeca oculto (script vai mostra-lo)
 visible 0

 // Nao bloquear cliques do mouse em coisas atras deste painel
 ignorepointer 1

 // Cor azul (R=0.2, G=0.6, B=1.0, A=0.9)
 color 0.2 0.6 1.0 0.9

 // Posicao: 0 pixels da esquerda, 0 pixels do topo
 position 0 0
 hexactpos 1
 vexactpos 1

 // Tamanho: 30% da largura do pai, 30 pixels de altura
 size 0.3 30
 hexactsize 0
 vexactsize 1

 // Centralizar horizontalmente dentro do pai
 halign center_ref

 // Bloco de filhos
 {
  // Label de texto preenche todo o painel de notificacao
  TextWidgetClass NotificationText {

   // Tambem ignorar entrada do mouse
   ignorepointer 1

   // Posicao na origem relativa ao pai
   position 0 0
   hexactpos 1
   vexactpos 1

   // Preencher pai completamente (proporcional)
   size 1 1
   hexactsize 0
   vexactsize 0

   // Centralizar o texto em ambas direcoes
   "text halign" center
   "text valign" center

   // Usar uma fonte em negrito
   font "gui/fonts/Metron-Bold"

   // Texto padrao (sera sobrescrito por script)
   text "Notification"
  }
 }
}
```

E aqui um exemplo mais complexo -- um dialogo com barra de titulo, conteudo rolavel e um botao de fechar:

```
WrapSpacerWidgetClass MyDialog {
 clipchildren 1
 color 0.7059 0.7059 0.7059 0.7843
 size 0.35 0
 halign center_ref
 valign center_ref
 priority 998
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content H" 1
 "Size To Content V" 1
 content_halign center
 {
  // Linha da barra de titulo
  FrameWidgetClass TitleBarRow {
   size 1 26
   hexactsize 0
   vexactsize 1
   draggable 1
   {
    PanelWidgetClass TitleBar {
     color 0.4196 0.6471 1 0.9412
     size 1 25
     style rover_sim_colorable
     {
      TextWidgetClass TitleText {
       size 0.85 0.9
       text "My Dialog"
       font "gui/fonts/Metron"
       "text halign" center
       "text valign" center
      }
      ButtonWidgetClass CloseBtn {
       size 0.15 0.9
       halign right_ref
       text "X"
      }
     }
    }
   }
  }

  // Area de conteudo rolavel
  ScrollWidgetClass ContentScroll {
   size 0.97 235
   hexactsize 0
   vexactsize 1
   "Scrollbar V" 1
   {
    WrapSpacerWidgetClass ContentItems {
     size 1 0
     hexactsize 0
     "Size To Content V" 1
    }
   }
  }
 }
}
```

---

## Erros Comuns

1. **Esquecer o sufixo `Class`** -- Em layouts, escreva `TextWidgetClass`, nao `TextWidget`.
2. **Misturar valores proporcionais e em pixels** -- Se `hexactsize 0`, os valores de size sao 0.0-1.0 proporcionais. Se `hexactsize 1`, sao valores em pixels. Usar `300` com modo proporcional significa 300x a largura do pai.
3. **Nao citar atributos de multiplas palavras** -- Escreva `"text halign" center`, nao `text halign center`.
4. **Colocar ScriptParamsClass no bloco errado** -- Deve estar em um bloco `{ }` separado apos o bloco de filhos, nao dentro dele.

---

## Proximos Passos

- [3.3 Dimensionamento e Posicionamento](03-sizing-positioning.md) -- Domine o sistema de coordenadas proporcional vs. pixel
- [3.4 Widgets de Container](04-containers.md) -- Mergulho profundo em widgets de spacer e scroll
