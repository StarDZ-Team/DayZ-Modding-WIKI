# Chapter 3.6: Event Handling

[Home](../README.md) | [<< Previous: Programmatic Widget Creation](05-programmatic-widgets.md) | **Event Handling** | [Next: Styles, Fonts & Images >>](07-styles-fonts.md)

---

## ScriptedWidgetEventHandler

A classe `ScriptedWidgetEventHandler` e a fundacao de todo tratamento de eventos de widget no DayZ. Ela fornece metodos de override para todo evento possivel de widget.

Para receber eventos de um widget, crie uma classe que estenda `ScriptedWidgetEventHandler`, faca override dos metodos de evento que lhe interessam e anexe o handler ao widget com `SetHandler()`.

### Lista Completa de Metodos de Evento

```c
class ScriptedWidgetEventHandler
{
    // Eventos de clique
    bool OnClick(Widget w, int x, int y, int button);
    bool OnDoubleClick(Widget w, int x, int y, int button);

    // Eventos de selecao
    bool OnSelect(Widget w, int x, int y);
    bool OnItemSelected(Widget w, int x, int y, int row, int column,
                         int oldRow, int oldColumn);

    // Eventos de foco
    bool OnFocus(Widget w, int x, int y);
    bool OnFocusLost(Widget w, int x, int y);

    // Eventos de mouse
    bool OnMouseEnter(Widget w, int x, int y);
    bool OnMouseLeave(Widget w, Widget enterW, int x, int y);
    bool OnMouseWheel(Widget w, int x, int y, int wheel);
    bool OnMouseButtonDown(Widget w, int x, int y, int button);
    bool OnMouseButtonUp(Widget w, int x, int y, int button);

    // Eventos de teclado
    bool OnKeyDown(Widget w, int x, int y, int key);
    bool OnKeyUp(Widget w, int x, int y, int key);
    bool OnKeyPress(Widget w, int x, int y, int key);

    // Eventos de mudanca (sliders, checkboxes, editboxes)
    bool OnChange(Widget w, int x, int y, bool finished);

    // Eventos de arrastar e soltar
    bool OnDrag(Widget w, int x, int y);
    bool OnDragging(Widget w, int x, int y, Widget receiver);
    bool OnDraggingOver(Widget w, int x, int y, Widget receiver);
    bool OnDrop(Widget w, int x, int y, Widget receiver);
    bool OnDropReceived(Widget w, int x, int y, Widget receiver);

    // Eventos de controle (gamepad)
    bool OnController(Widget w, int control, int value);

    // Eventos de layout
    bool OnResize(Widget w, int x, int y);
    bool OnChildAdd(Widget w, Widget child);
    bool OnChildRemove(Widget w, Widget child);

    // Outros
    bool OnUpdate(Widget w);
    bool OnModalResult(Widget w, int x, int y, int code, int result);
}
```

### Valor de Retorno: Consumido vs. Repassado

Todo handler de evento retorna um `bool`:

- **`return true;`** -- O evento e **consumido**. Nenhum outro handler o recebera. O evento para de propagar pela hierarquia de widgets.
- **`return false;`** -- O evento e **repassado** para o handler do widget pai (se houver).

Isso e critico para construir UIs em camadas. Por exemplo, um handler de clique de botao deve retornar `true` para impedir que o clique tambem acione um painel atras dele.

---

## Registrando Handlers com SetHandler()

A forma mais simples de tratar eventos e chamar `SetHandler()` em um widget:

```c
class MyPanel : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_SaveBtn;
    protected ButtonWidget m_CancelBtn;

    void MyPanel()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/panel.layout");

        m_SaveBtn = ButtonWidget.Cast(m_Root.FindAnyWidget("SaveButton"));
        m_CancelBtn = ButtonWidget.Cast(m_Root.FindAnyWidget("CancelButton"));

        // Registrar esta classe como handler de eventos para ambos os botoes
        m_SaveBtn.SetHandler(this);
        m_CancelBtn.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_SaveBtn)
        {
            Save();
            return true;  // Consumido
        }

        if (w == m_CancelBtn)
        {
            Cancel();
            return true;
        }

        return false;  // Nao e nosso widget, repassar
    }
}
```

Uma unica instancia de handler pode ser registrada em multiplos widgets. Dentro do metodo de evento, compare `w` (o widget que gerou o evento) com suas referencias armazenadas em cache para determinar qual widget foi interagido.

---

## Eventos Comuns em Detalhe

### OnClick

```c
bool OnClick(Widget w, int x, int y, int button)
```

Disparado quando um `ButtonWidget` e clicado (mouse solto sobre o widget).

- `w` -- O widget clicado
- `x, y` -- Posicao do cursor do mouse (pixels da tela)
- `button` -- Indice do botao do mouse: `0` = esquerdo, `1` = direito, `2` = meio

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (button != 0) return false;  // Tratar apenas clique esquerdo

    if (w == m_MyButton)
    {
        DoAction();
        return true;
    }
    return false;
}
```

### OnChange

```c
bool OnChange(Widget w, int x, int y, bool finished)
```

Disparado por `SliderWidget`, `CheckBoxWidget`, `EditBoxWidget` e outros widgets baseados em valor quando seu valor muda.

- `w` -- O widget cujo valor mudou
- `finished` -- Para sliders: `true` quando o usuario solta o handle do slider. Para edit boxes: `true` quando Enter e pressionado.

```c
override bool OnChange(Widget w, int x, int y, bool finished)
{
    if (w == m_VolumeSlider)
    {
        SliderWidget slider = SliderWidget.Cast(w);
        float value = slider.GetCurrent();

        // Aplicar apenas quando o usuario termina de arrastar
        if (finished)
        {
            ApplyVolume(value);
        }
        else
        {
            // Previsualizar enquanto arrasta
            PreviewVolume(value);
        }
        return true;
    }

    if (w == m_NameInput)
    {
        EditBoxWidget edit = EditBoxWidget.Cast(w);
        string text = edit.GetText();

        if (finished)
        {
            // Usuario pressionou Enter
            SubmitName(text);
        }
        return true;
    }

    if (w == m_EnableCheckbox)
    {
        CheckBoxWidget cb = CheckBoxWidget.Cast(w);
        bool checked = cb.IsChecked();
        ToggleFeature(checked);
        return true;
    }

    return false;
}
```

### OnMouseEnter / OnMouseLeave

```c
bool OnMouseEnter(Widget w, int x, int y)
bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
```

Disparados quando o cursor do mouse entra ou sai dos limites de um widget. O parametro `enterW` em `OnMouseLeave` e o widget para o qual o cursor se moveu.

Uso comum: efeitos de hover.

```c
override bool OnMouseEnter(Widget w, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 80, 130, 200));  // Destaque
        return true;
    }
    return false;
}

override bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 50, 50, 50));  // Padrao
        return true;
    }
    return false;
}
```

### OnFocus / OnFocusLost

```c
bool OnFocus(Widget w, int x, int y)
bool OnFocusLost(Widget w, int x, int y)
```

Disparados quando um widget ganha ou perde foco do teclado. Importante para edit boxes e outros widgets de entrada de texto.

```c
override bool OnFocus(Widget w, int x, int y)
{
    if (w == m_SearchBox)
    {
        m_SearchBox.SetColor(ARGB(255, 100, 160, 220));
        return true;
    }
    return false;
}

override bool OnFocusLost(Widget w, int x, int y)
{
    if (w == m_SearchBox)
    {
        m_SearchBox.SetColor(ARGB(255, 60, 60, 60));
        return true;
    }
    return false;
}
```

### OnMouseWheel

```c
bool OnMouseWheel(Widget w, int x, int y, int wheel)
```

Disparado quando a roda do mouse rola sobre um widget. `wheel` e positivo para rolagem para cima, negativo para rolagem para baixo.

### OnKeyDown / OnKeyUp / OnKeyPress

```c
bool OnKeyDown(Widget w, int x, int y, int key)
bool OnKeyUp(Widget w, int x, int y, int key)
bool OnKeyPress(Widget w, int x, int y, int key)
```

Eventos de teclado. O parametro `key` corresponde a constantes `KeyCode` (ex: `KeyCode.KC_ESCAPE`, `KeyCode.KC_RETURN`).

### OnDrag / OnDrop / OnDropReceived

```c
bool OnDrag(Widget w, int x, int y)
bool OnDrop(Widget w, int x, int y, Widget receiver)
bool OnDropReceived(Widget w, int x, int y, Widget receiver)
```

Eventos de arrastar e soltar. O widget deve ter `draggable 1` no seu layout (ou `WidgetFlags.DRAGGABLE` definido no codigo).

- `OnDrag` -- Usuario comecou a arrastar o widget `w`
- `OnDrop` -- Widget `w` foi solto; `receiver` e o widget embaixo
- `OnDropReceived` -- Widget `w` recebeu um drop; `receiver` e o widget solto

### OnItemSelected

```c
bool OnItemSelected(Widget w, int x, int y, int row, int column,
                     int oldRow, int oldColumn)
```

Disparado por `TextListboxWidget` quando uma linha e selecionada.

---

## WidgetEventHandler Vanilla (Registro de Callbacks)

O codigo vanilla do DayZ usa um padrao alternativo: `WidgetEventHandler`, um singleton que roteia eventos para funcoes de callback nomeadas. Isso e comumente usado em menus vanilla.

```c
WidgetEventHandler handler = WidgetEventHandler.GetInstance();

// Registrar callbacks de evento por nome de funcao
handler.RegisterOnClick(myButton, this, "OnMyButtonClick");
handler.RegisterOnMouseEnter(myWidget, this, "OnHoverStart");
handler.RegisterOnMouseLeave(myWidget, this, "OnHoverEnd");
handler.RegisterOnDoubleClick(myWidget, this, "OnDoubleClick");
handler.RegisterOnMouseButtonDown(myWidget, this, "OnMouseDown");
handler.RegisterOnMouseButtonUp(myWidget, this, "OnMouseUp");
handler.RegisterOnMouseWheel(myWidget, this, "OnWheel");
handler.RegisterOnFocus(myWidget, this, "OnFocusGained");
handler.RegisterOnFocusLost(myWidget, this, "OnFocusLost");
handler.RegisterOnDrag(myWidget, this, "OnDragStart");
handler.RegisterOnDrop(myWidget, this, "OnDropped");
handler.RegisterOnDropReceived(myWidget, this, "OnDropReceived");
handler.RegisterOnDraggingOver(myWidget, this, "OnDragOver");
handler.RegisterOnChildAdd(myWidget, this, "OnChildAdded");
handler.RegisterOnChildRemove(myWidget, this, "OnChildRemoved");

// Desregistrar todos os callbacks de um widget
handler.UnregisterWidget(myWidget);
```

As assinaturas das funcoes de callback devem corresponder ao tipo de evento:

```c
void OnMyButtonClick(Widget w, int x, int y, int button)
{
    // Tratar clique
}

void OnHoverStart(Widget w, int x, int y)
{
    // Tratar entrada do mouse
}

void OnHoverEnd(Widget w, Widget enterW, int x, int y)
{
    // Tratar saida do mouse
}
```

### SetHandler() vs. WidgetEventHandler

| Aspecto | SetHandler() | WidgetEventHandler |
|---|---|---|
| Padrao | Override de metodos virtuais | Registrar callbacks nomeados |
| Handler por widget | Um handler por widget | Multiplos callbacks por evento |
| Usado por | DabsFramework, Expansion, mods customizados | Menus vanilla do DayZ |
| Flexibilidade | Deve tratar todos os eventos em uma classe | Pode registrar alvos diferentes para eventos diferentes |
| Limpeza | Implicita quando o handler e destruido | Deve chamar `UnregisterWidget()` |

Para mods novos, `SetHandler()` com `ScriptedWidgetEventHandler` e a abordagem recomendada.

---

## Exemplo Completo: Painel de Botoes Interativo

Um painel com tres botoes que mudam de cor ao passar o mouse e executam acoes ao clicar:

```c
class InteractivePanel : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_BtnStart;
    protected ButtonWidget m_BtnStop;
    protected ButtonWidget m_BtnReset;
    protected TextWidget m_StatusText;

    protected int m_DefaultColor = ARGB(255, 60, 60, 60);
    protected int m_HoverColor   = ARGB(255, 80, 130, 200);
    protected int m_ActiveColor  = ARGB(255, 50, 180, 80);

    void InteractivePanel()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/interactive_panel.layout");

        m_BtnStart  = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnStart"));
        m_BtnStop   = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnStop"));
        m_BtnReset  = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnReset"));
        m_StatusText = TextWidget.Cast(m_Root.FindAnyWidget("StatusText"));

        // Registrar este handler em todos os widgets interativos
        m_BtnStart.SetHandler(this);
        m_BtnStop.SetHandler(this);
        m_BtnReset.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (button != 0) return false;

        if (w == m_BtnStart)
        {
            m_StatusText.SetText("Started");
            m_StatusText.SetColor(m_ActiveColor);
            return true;
        }
        if (w == m_BtnStop)
        {
            m_StatusText.SetText("Stopped");
            m_StatusText.SetColor(ARGB(255, 200, 50, 50));
            return true;
        }
        if (w == m_BtnReset)
        {
            m_StatusText.SetText("Ready");
            m_StatusText.SetColor(ARGB(255, 200, 200, 200));
            return true;
        }
        return false;
    }

    override bool OnMouseEnter(Widget w, int x, int y)
    {
        if (w == m_BtnStart || w == m_BtnStop || w == m_BtnReset)
        {
            w.SetColor(m_HoverColor);
            return true;
        }
        return false;
    }

    override bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
    {
        if (w == m_BtnStart || w == m_BtnStop || w == m_BtnReset)
        {
            w.SetColor(m_DefaultColor);
            return true;
        }
        return false;
    }

    void Show(bool visible)
    {
        m_Root.Show(visible);
    }

    void ~InteractivePanel()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }
}
```

---

## Boas Praticas de Tratamento de Eventos

1. **Sempre retorne `true` quando voce trata um evento** -- Caso contrario, o evento se propaga para widgets pais e pode acionar comportamento nao intencional.

2. **Retorne `false` para eventos que voce nao trata** -- Isso permite que widgets pais processem o evento.

3. **Armazene referencias de widgets em cache** -- Nao chame `FindAnyWidget()` dentro de handlers de evento. Busque widgets uma vez no construtor e armazene referencias.

4. **Verifique null nos widgets dos eventos** -- O widget `w` geralmente e valido, mas programacao defensiva previne crashes.

5. **Limpe handlers** -- Ao destruir um painel, faca unlink do widget raiz. Se usando `WidgetEventHandler`, chame `UnregisterWidget()`.

6. **Use o parametro `finished` sabiamente** -- Para sliders, aplique operacoes custosas apenas quando `finished` e `true` (usuario soltou o handle). Use eventos nao-finalizados para previsualizacao.

7. **Adie trabalho pesado** -- Se um handler de evento precisa fazer computacao custosa, use `CallLater` para adiar:

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_HeavyActionBtn)
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(DoHeavyWork, 0, false);
        return true;
    }
    return false;
}
```

---

## Proximos Passos

- [3.7 Estilos, Fontes e Imagens](07-styles-fonts.md) -- Estilizacao visual com estilos, fontes e referencias de imagesets
- [3.5 Criacao Programatica de Widgets](05-programmatic-widgets.md) -- Criando widgets que geram eventos
