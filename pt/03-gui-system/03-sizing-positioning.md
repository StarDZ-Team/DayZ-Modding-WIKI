# Chapter 3.3: Sizing & Positioning

[Home](../README.md) | [<< Previous: Layout File Format](02-layout-files.md) | **Sizing & Positioning** | [Next: Container Widgets >>](04-containers.md)

---

## O Conceito Central: Proporcional vs. Pixel

Todo widget tem uma posicao (`x, y`) e um tamanho (`largura, altura`). Cada um desses quatro valores pode independentemente ser:

- **Proporcional** (0.0 a 1.0) -- relativo as dimensoes do widget pai
- **Pixel** (qualquer numero positivo) -- pixels absolutos da tela

O modo para cada eixo e controlado por quatro flags:

| Flag | Controla | `0` = Proporcional | `1` = Pixel |
|---|---|---|---|
| `hexactpos` | Posicao X | Fracao da largura do pai | Pixels da esquerda |
| `vexactpos` | Posicao Y | Fracao da altura do pai | Pixels do topo |
| `hexactsize` | Largura | Fracao da largura do pai | Largura em pixels |
| `vexactsize` | Altura | Fracao da altura do pai | Altura em pixels |

Isso significa que voce pode misturar modos livremente. Por exemplo, um widget pode ter largura proporcional mas altura em pixels -- um padrao muito comum para linhas e barras.

---

## Entendendo o Modo Proporcional

Quando uma flag e `0` (proporcional), o valor representa uma **fracao da dimensao do pai**:

- `size 1 1` com `hexactsize 0` e `vexactsize 0` significa "100% da largura do pai, 100% da altura do pai" -- o filho preenche o pai.
- `size 0.5 0.3` significa "50% da largura do pai, 30% da altura do pai."
- `position 0.5 0` com `hexactpos 0` significa "comecar em 50% da largura do pai a partir da esquerda."

O modo proporcional e independente de resolucao. O widget escala automaticamente quando o pai muda de tamanho ou quando o jogo roda em uma resolucao diferente.

```
// Um widget que preenche a metade esquerda do seu pai
FrameWidgetClass LeftHalf {
 position 0 0
 size 0.5 1
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 0
}
```

---

## Entendendo o Modo Pixel

Quando uma flag e `1` (pixel/exato), o valor e em **pixels da tela**:

- `size 200 40` com `hexactsize 1` e `vexactsize 1` significa "200 pixels de largura, 40 pixels de altura."
- `position 10 10` com `hexactpos 1` e `vexactpos 1` significa "10 pixels da borda esquerda do pai, 10 pixels da borda superior do pai."

O modo pixel da controle exato mas NAO escala automaticamente com a resolucao.

```
// Um botao de tamanho fixo: 120x30 pixels
ButtonWidgetClass MyButton {
 position 10 10
 size 120 30
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 text "Click Me"
}
```

---

## Misturando Modos: O Padrao Mais Comum

O verdadeiro poder vem da mistura de modos proporcional e pixel. O padrao mais comum em mods profissionais de DayZ e:

**Largura proporcional, altura em pixels** -- para barras, linhas e cabecalhos.

```
// Linha de largura total, exatamente 30 pixels de altura
FrameWidgetClass Row {
 position 0 0
 size 1 30
 hexactpos 0
 vexactpos 0
 hexactsize 0        // Largura: proporcional (100% do pai)
 vexactsize 1        // Altura: pixel (30px)
}
```

**Largura e altura proporcionais, posicao em pixels** -- para paineis centralizados deslocados por uma quantidade fixa.

```
// Painel 60% x 70%, deslocado 0px do centro
FrameWidgetClass Dialog {
 position 0 0
 size 0.6 0.7
 halign center_ref
 valign center_ref
 hexactpos 1         // Posicao: pixel (deslocamento de 0px do centro)
 vexactpos 1
 hexactsize 0        // Tamanho: proporcional (60% x 70%)
 vexactsize 0
}
```

---

## Referencias de Alinhamento: halign e valign

Os atributos `halign` e `valign` mudam o **ponto de referencia** para posicionamento:

| Valor | Efeito |
|---|---|
| `left_ref` (padrao) | Posicao medida a partir da borda esquerda do pai |
| `center_ref` | Posicao medida a partir do centro do pai |
| `right_ref` | Posicao medida a partir da borda direita do pai |
| `top_ref` (padrao) | Posicao medida a partir da borda superior do pai |
| `center_ref` | Posicao medida a partir do centro do pai |
| `bottom_ref` | Posicao medida a partir da borda inferior do pai |

Quando combinados com posicao em pixels (`hexactpos 1`), as referencias de alinhamento tornam a centralizacao trivial:

```
// Centralizado na tela sem deslocamento
FrameWidgetClass CenteredDialog {
 position 0 0
 size 0.4 0.5
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
}
```

Com `center_ref`, uma posicao de `0 0` significa "centralizado no pai." Uma posicao de `10 0` significa "10 pixels a direita do centro."

### Elementos Alinhados a Direita

```
// Icone fixado na borda direita, 5px da borda
ImageWidgetClass StatusIcon {
 position 5 5
 size 24 24
 halign right_ref
 valign top_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
}
```

### Elementos Alinhados Embaixo

```
// Barra de status no fundo do seu pai
FrameWidgetClass StatusBar {
 position 0 0
 size 1 30
 halign left_ref
 valign bottom_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 1
}
```

---

## CRITICO: Sem Valores de Tamanho Negativos

**Nunca use valores negativos para tamanho de widget em arquivos de layout.** Tamanhos negativos causam comportamento indefinido -- widgets podem ficar invisiveis, renderizar incorretamente ou travar o sistema de UI. Se voce precisa que um widget fique oculto, use `visible 0`.

Este e um dos erros de layout mais comuns. Se seu widget nao esta aparecendo, verifique se voce nao definiu acidentalmente um valor de tamanho negativo.

---

## Padroes Comuns de Dimensionamento

### Overlay de Tela Cheia

```
FrameWidgetClass Overlay {
 position 0 0
 size 1 1
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 0
}
```

### Dialogo Centralizado (60% x 70%)

```
FrameWidgetClass Dialog {
 position 0 0
 size 0.6 0.7
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
}
```

### Painel Lateral Alinhado a Direita (25% de Largura)

```
FrameWidgetClass SidePanel {
 position 0 0
 size 0.25 1
 halign right_ref
 hexactpos 1
 vexactpos 0
 hexactsize 0
 vexactsize 0
}
```

### Barra Superior (Largura Total, Altura Fixa)

```
FrameWidgetClass TopBar {
 position 0 0
 size 1 40
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 1
}
```

### Badge no Canto Inferior Direito

```
FrameWidgetClass Badge {
 position 10 10
 size 80 24
 halign right_ref
 valign bottom_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
}
```

### Icone Centralizado de Tamanho Fixo

```
ImageWidgetClass Icon {
 position 0 0
 size 64 64
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
}
```

---

## Posicao e Tamanho Programaticos

No codigo, voce pode ler e definir posicao e tamanho usando tanto coordenadas proporcionais quanto em pixels (tela):

```c
// Coordenadas proporcionais (intervalo 0-1)
float x, y, w, h;
widget.GetPos(x, y);           // Ler posicao proporcional
widget.SetPos(0.5, 0.1);      // Definir posicao proporcional
widget.GetSize(w, h);          // Ler tamanho proporcional
widget.SetSize(0.3, 0.2);     // Definir tamanho proporcional

// Coordenadas de pixel/tela
widget.GetScreenPos(x, y);     // Ler posicao em pixels
widget.SetScreenPos(100, 50);  // Definir posicao em pixels
widget.GetScreenSize(w, h);    // Ler tamanho em pixels
widget.SetScreenSize(400, 300);// Definir tamanho em pixels
```

Para centralizar um widget na tela programaticamente:

```c
int screen_w, screen_h;
GetScreenSize(screen_w, screen_h);

float w, h;
widget.GetScreenSize(w, h);
widget.SetScreenPos((screen_w - w) / 2, (screen_h - h) / 2);
```

---

## O Atributo `scaled`

Quando `scaled 1` esta definido, o widget respeita a configuracao de escala de UI do DayZ (Opcoes > Video > Tamanho do HUD). Isso e importante para elementos de HUD que devem escalar com a preferencia do usuario.

Sem `scaled`, widgets com tamanho em pixels terao o mesmo tamanho fisico independentemente da opcao de escala de UI.

---

## O Atributo `fixaspect`

Use `fixaspect` para manter a proporcao de aspecto de um widget:

- `fixaspect fixwidth` -- Altura se ajusta para manter proporcao baseada na largura
- `fixaspect fixheight` -- Largura se ajusta para manter proporcao baseada na altura

Isso e primariamente util para `ImageWidget` para prevenir distorcao de imagem.

---

## Debugando Problemas de Dimensionamento

Quando um widget nao esta aparecendo onde voce espera:

1. **Verifique as flags exact** -- `hexactsize` esta definido como `0` quando voce queria pixels? Um valor de `200` no modo proporcional significa 200x a largura do pai (bem fora da tela).
2. **Verifique tamanhos negativos** -- Qualquer valor negativo em `size` causara problemas.
3. **Verifique o tamanho do pai** -- Um filho proporcional de um pai com tamanho zero tem tamanho zero.
4. **Verifique `visible`** -- Widgets sao visiveis por padrao, mas se um pai esta oculto, todos os filhos tambem estao.
5. **Verifique `priority`** -- Um widget com prioridade menor pode estar escondido atras de outro.
6. **Use `clipchildren`** -- Se um pai tem `clipchildren 1`, filhos fora dos seus limites nao sao visiveis.

---

## Proximos Passos

- [3.4 Widgets de Container](04-containers.md) -- Como spacers e widgets de scroll lidam com layout automaticamente
- [3.5 Criacao Programatica de Widgets](05-programmatic-widgets.md) -- Definindo tamanho e posicao por codigo
