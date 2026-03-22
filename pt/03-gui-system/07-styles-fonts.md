# Chapter 3.7: Styles, Fonts & Images

[Home](../README.md) | [<< Previous: Event Handling](06-event-handling.md) | **Styles, Fonts & Images** | [Next: Dialogs & Modals >>](08-dialogs-modals.md)

---

## Estilos

Estilos sao aparencias visuais predefinidas que podem ser aplicadas a widgets via o atributo `style` em arquivos de layout. Eles controlam renderizacao de fundo, bordas e aparencia geral sem exigir configuracao manual de cor e imagem.

### Estilos Integrados Comuns

| Nome do Estilo | Descricao |
|---|---|
| `blank` | Sem visual -- fundo completamente transparente |
| `Empty` | Sem renderizacao de fundo |
| `Default` | Estilo padrao de botao/widget com aparencia padrao do DayZ |
| `Colorable` | Estilo que pode ser tonalizado usando `SetColor()` |
| `rover_sim_colorable` | Estilo de painel colorido, comumente usado para fundos |
| `rover_sim_black` | Fundo de painel escuro |
| `rover_sim_black_2` | Variante de painel mais escuro |
| `Outline_1px_BlackBackground` | Contorno de 1 pixel com fundo preto solido |
| `OutlineFilled` | Contorno com interior preenchido |
| `DayZDefaultPanelRight` | Estilo de painel direito padrao do DayZ |
| `DayZNormal` | Estilo normal de texto/widget do DayZ |
| `MenuDefault` | Estilo padrao de botao de menu |

### Usando Estilos em Layouts

```
ButtonWidgetClass MyButton {
 style Default
 text "Click Me"
 size 120 30
 hexactsize 1
 vexactsize 1
}

PanelWidgetClass Background {
 style rover_sim_colorable
 color 0.2 0.3 0.5 0.9
 size 1 1
}
```

### Padrao Estilo + Cor

Os estilos `Colorable` e `rover_sim_colorable` sao projetados para serem tonalizados. Defina o atributo `color` no layout ou chame `SetColor()` no codigo:

```
PanelWidgetClass TitleBar {
 style rover_sim_colorable
 color 0.4196 0.6471 1 0.9412
 size 1 30
 hexactsize 0
 vexactsize 1
}
```

```c
// Mudar cor em tempo de execucao
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### Estilos em Mods Profissionais

Dialogos do DabsFramework usam `Outline_1px_BlackBackground` para containers de dialogos:

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

Colorful UI usa `rover_sim_colorable` extensivamente para paineis tematizados onde a cor e controlada por um gerenciador de temas centralizado.

---

## Fontes

O DayZ inclui varias fontes integradas. Caminhos de fonte sao especificados no atributo `font`.

### Caminhos de Fontes Integradas

| Caminho da Fonte | Descricao |
|---|---|
| `"gui/fonts/Metron"` | Fonte padrao de UI |
| `"gui/fonts/Metron28"` | Fonte padrao, variante 28pt |
| `"gui/fonts/Metron-Bold"` | Variante em negrito |
| `"gui/fonts/Metron-Bold58"` | Variante negrito 58pt |
| `"gui/fonts/sdf_MetronBook24"` | Fonte SDF (Signed Distance Field) -- nitida em qualquer tamanho |

### Usando Fontes em Layouts

```
TextWidgetClass Title {
 text "Mission Briefing"
 font "gui/fonts/Metron-Bold"
 "text halign" center
 "text valign" center
}

TextWidgetClass Body {
 text "Objective: Secure the airfield"
 font "gui/fonts/Metron"
}
```

### Usando Fontes no Codigo

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// A fonte e definida no layout, nao alteravel em tempo de execucao via script
```

### Fontes SDF

Fontes SDF (Signed Distance Field) renderizam nitidamente em qualquer nivel de zoom, tornando-as ideais para elementos de UI que podem aparecer em varios tamanhos. A fonte `sdf_MetronBook24` e a melhor escolha para texto que precisa parecer nitido em diferentes configuracoes de escala de UI.

---

## Dimensionamento de Texto: "exact text" vs. Proporcional

Widgets de texto do DayZ suportam dois modos de dimensionamento, controlados pelo atributo `"exact text"`:

### Texto Proporcional (Padrao)

Quando `"exact text" 0` (padrao), o tamanho da fonte e determinado pela altura do widget. O texto escala com o widget. Este e o comportamento padrao.

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "I scale with my parent"
}
```

### Tamanho de Texto Exato

Quando `"exact text" 1`, o tamanho da fonte e um valor fixo em pixels definido por `"exact text size"`:

```
TextWidgetClass FixedText {
 size 1 30
 hexactsize 0
 vexactsize 1
 text "I am always 16 pixels"
 "exact text" 1
 "exact text size" 16
}
```

### Qual Usar?

| Cenario | Recomendacao |
|---|---|
| Elementos de HUD que escalam com o tamanho da tela | Proporcional (padrao) |
| Texto de menu em um tamanho especifico | `"exact text" 1` com `"exact text size"` |
| Texto que deve corresponder a um tamanho especifico de pixel de fonte | `"exact text" 1` |
| Texto dentro de spacers/grades | Frequentemente proporcional, determinado pela altura da celula |

### Atributos de Tamanho Relacionados a Texto

| Atributo | Efeito |
|---|---|
| `"size to text h" 1` | Largura do widget se ajusta para caber no texto |
| `"size to text v" 1` | Altura do widget se ajusta para caber no texto |
| `"text sharpness"` | Valor float controlando nitidez de renderizacao |
| `wrap 1` | Habilitar quebra de palavra para texto que excede a largura do widget |

Os atributos `"size to text"` sao uteis para labels e tags onde o widget deve ter exatamente o tamanho do seu conteudo de texto.

---

## Alinhamento de Texto

Controle onde o texto aparece dentro do seu widget usando atributos de alinhamento:

```
TextWidgetClass CenteredLabel {
 text "Centered"
 "text halign" center
 "text valign" center
}
```

| Atributo | Valores | Efeito |
|---|---|---|
| `"text halign"` | `left`, `center`, `right` | Posicao horizontal do texto dentro do widget |
| `"text valign"` | `top`, `center`, `bottom` | Posicao vertical do texto dentro do widget |

---

## Contorno de Texto

Adicione contornos ao texto para legibilidade em fundos movimentados:

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // Contorno preto de 1px

int size = tw.GetOutlineSize();           // Ler tamanho do contorno
int color = tw.GetOutlineColor();         // Ler cor do contorno (ARGB)
```

---

## ImageWidget

`ImageWidget` exibe imagens de duas fontes: referencias de imageset e arquivos carregados dinamicamente.

### Referencias de Imageset

A forma mais comum de exibir imagens. Um imageset e um atlas de sprites -- um unico arquivo de textura com multiplas sub-imagens nomeadas.

Em um arquivo de layout:

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

O formato e `"set:<nome_imageset> image:<nome_imagem>"`.

Imagesets e imagens vanilla comuns:

```
"set:dayz_gui image:icon_pin"           -- Icone de pin de mapa
"set:dayz_gui image:icon_refresh"       -- Icone de atualizar
"set:dayz_gui image:icon_x"            -- Icone de fechar/X
"set:dayz_gui image:icon_missing"      -- Icone de aviso/faltando
"set:dayz_gui image:iconHealth0"       -- Icone de saude/mais
"set:dayz_gui image:DayZLogo"          -- Logo do DayZ
"set:dayz_gui image:Expand"            -- Seta de expandir
"set:dayz_gui image:Gradient"          -- Faixa de gradiente
```

### Multiplos Slots de Imagem

Um unico `ImageWidget` pode conter multiplas imagens em slots diferentes (`image0`, `image1`, etc.) e alternar entre elas:

```
ImageWidgetClass StatusIcon {
 image0 "set:dayz_gui image:icon_missing"
 image1 "set:dayz_gui image:iconHealth0"
}
```

```c
ImageWidget icon;
icon.SetImage(0);    // Mostrar image0 (icone faltando)
icon.SetImage(1);    // Mostrar image1 (icone de saude)
```

### Carregando Imagens de Arquivos

Carregue imagens dinamicamente em tempo de execucao:

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

O caminho e relativo ao diretorio raiz do mod. Formatos suportados incluem `.edds`, `.paa` e `.tga` (embora `.edds` seja o padrao para DayZ).

### Modos de Blend de Imagem

O atributo `mode` controla como a imagem e mesclada com o que esta atras dela:

| Modo | Efeito |
|---|---|
| `blend` | Alpha blending padrao (mais comum) |
| `additive` | Cores se somam (efeitos de brilho) |
| `stretch` | Esticar para preencher sem blending |

### Transicoes com Mascara de Imagem

`ImageWidget` suporta transicoes de revelacao baseadas em mascara:

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 50% revelado
```

Isso e util para barras de carregamento, exibicoes de saude e animacoes de revelacao.

---

## Formato de ImageSet

Um arquivo de imageset (`.imageset`) define regioes nomeadas dentro de um atlas de textura de sprites. O DayZ suporta dois formatos de imageset.

### Formato Nativo do DayZ

Usado pelo DayZ vanilla e a maioria dos mods. Isso **nao** e XML -- usa o mesmo formato delimitado por chaves que arquivos de layout.

```
ImageSetClass {
 Name "my_mod_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_sword {
   Name "icon_sword"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_shield {
   Name "icon_shield"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_potion {
   Name "icon_potion"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

Campos principais:
- `Name` -- Nome do imageset (usado em `"set:<nome>"`)
- `RefSize` -- Tamanho de referencia da textura de origem em pixels (largura altura)
- `path` -- Caminho para o arquivo de textura (`.edds`)
- `mpix` -- Nivel de mipmap (0 = resolucao padrao, 1 = resolucao 2x)
- Cada entrada de imagem define `Name`, `Pos` (x y em pixels) e `Size` (largura altura em pixels)

### Formato XML

Alguns mods (incluindo alguns modulos do DayZ Expansion) usam um formato de imageset baseado em XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
  <image name="icon_potion" pos="128 0" size="64 64" />
</imageset>
```

Ambos os formatos realizam a mesma coisa. O formato nativo e usado pelo DayZ vanilla; o formato XML as vezes e mais facil de ler e editar manualmente.

---

## Criando Imagesets Customizados

Para criar seu proprio imageset para um mod:

### Passo 1: Criar a Textura do Atlas de Sprites

Use um editor de imagem (Photoshop, GIMP, etc.) para criar uma unica textura que contenha todos os seus icones/imagens arranjados em uma grade. Tamanhos comuns sao 256x256, 512x512 ou 1024x1024 pixels.

Salve como `.tga`, depois converta para `.edds` usando DayZ Tools (TexView2 ou ImageTool).

### Passo 2: Criar o Arquivo de Imageset

Crie um arquivo `.imageset` que mapeia regioes nomeadas para posicoes na textura:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyFramework/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_mission {
   Name "icon_mission"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_waypoint {
   Name "icon_waypoint"
   Pos 64 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Passo 3: Registrar no config.cpp

No `config.cpp` do seu mod, registre o imageset em `CfgMods`:

```cpp
class CfgMods
{
    class MyMod
    {
        // ... outros campos ...
        class defs
        {
            class imageSets
            {
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... script modules ...
        };
    };
};
```

### Passo 4: Usar em Layouts e Codigo

Em arquivos de layout:

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

No codigo:

```c
ImageWidget icon;
// Imagens de imagesets registrados estao disponiveis por set:nome image:nome
// Nenhuma etapa adicional de carregamento necessaria apos registro no config.cpp
```

---

## Padrao de Tema de Cores

Mods profissionais centralizam suas definicoes de cores em uma classe de tema, depois aplicam cores em tempo de execucao. Isso facilita reestilizar toda a UI mudando um unico arquivo.

```c
class UIColor
{
    static int White()        { return ARGB(255, 255, 255, 255); }
    static int Black()        { return ARGB(255, 0, 0, 0); }
    static int Primary()      { return ARGB(255, 75, 119, 190); }
    static int Secondary()    { return ARGB(255, 60, 60, 60); }
    static int Accent()       { return ARGB(255, 100, 200, 100); }
    static int Danger()       { return ARGB(255, 200, 50, 50); }
    static int Transparent()  { return ARGB(1, 0, 0, 0); }
    static int SemiBlack()    { return ARGB(180, 0, 0, 0); }
}
```

Aplicar no codigo:

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

Este padrao (usado por Colorful UI, MyMod e outros) significa que mudar todo o esquema de cores da UI requer editar apenas a classe de tema.

---

## Resumo de Atributos Visuais por Tipo de Widget

| Widget | Atributos Visuais Principais |
|---|---|
| Qualquer widget | `color`, `visible`, `style`, `priority`, `inheritalpha` |
| TextWidget | `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `wrap` |
| ImageWidget | `image0`, `mode`, `"src alpha"`, `stretch`, `"flip u"`, `"flip v"` |
| ButtonWidget | `text`, `style`, `switch toggle` |
| PanelWidget | `color`, `style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## Boas Praticas

1. **Use referencias de imageset** em vez de caminhos diretos de arquivo quando possivel -- imagesets sao processados em lote de forma mais eficiente pelo motor.

2. **Use fontes SDF** (`sdf_MetronBook24`) para texto que precisa parecer nitido em qualquer escala.

3. **Use `"exact text" 1`** para texto de UI em tamanhos especificos de pixel; use texto proporcional para elementos de HUD que devem escalar.

4. **Centralize cores** em uma classe de tema em vez de hardcoding valores ARGB por todo seu codigo.

5. **Defina `"src alpha" 1`** em widgets de imagem para obter transparencia adequada.

6. **Registre imagesets customizados** no `config.cpp` para que fiquem disponiveis globalmente sem carregamento manual.

7. **Mantenha atlas de sprites em tamanho razoavel** -- 512x512 ou 1024x1024 e tipico. Texturas maiores desperdicam memoria se a maior parte do espaco esta vazia.

---

## Proximos Passos

- [3.1 Tipos de Widget](01-widget-types.md) -- Revise o catalogo completo de widgets
- [3.6 Tratamento de Eventos](06-event-handling.md) -- Torne seus widgets estilizados interativos
