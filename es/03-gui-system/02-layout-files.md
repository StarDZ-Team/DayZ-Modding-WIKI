# Capitulo 3.2: Formato de Archivos Layout (.layout)

[Inicio](../README.md) | [<< Anterior: Tipos de Widget](01-widget-types.md) | **Formato de Archivos Layout** | [Siguiente: Tamano y Posicionamiento >>](03-sizing-positioning.md)

---

## Estructura Basica

Un archivo `.layout` define un arbol de widgets. Cada archivo tiene exactamente un widget raiz, que contiene hijos anidados.

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

Reglas clave:

1. El elemento raiz es siempre un unico widget (tipicamente `FrameWidgetClass`).
2. Los nombres de tipo de widget usan el nombre de **clase de layout**, que siempre termina con `Class` (ej., `FrameWidgetClass`, `TextWidgetClass`, `ButtonWidgetClass`).
3. Cada widget tiene un nombre unico que sigue a su tipo de clase.
4. Los atributos son pares `clave valor`, uno por linea.
5. Los nombres de atributos que contienen espacios deben estar entre comillas: `"text halign" center`.
6. Los valores de string van entre comillas: `text "Hello World"`.
7. Los valores numericos no van entre comillas: `size 0.5 0.3`.
8. Los hijos se anidan dentro de bloques `{ }` despues de los atributos del padre.

---

## Referencia de Atributos

### Posicionamiento y Tamano

| Atributo | Valores | Descripcion |
|---|---|---|
| `position` | `x y` | Posicion del widget (proporcional 0-1 o valores en pixeles) |
| `size` | `w h` | Dimensiones del widget (proporcional 0-1 o valores en pixeles) |
| `halign` | `left_ref`, `center_ref`, `right_ref` | Punto de referencia de alineacion horizontal |
| `valign` | `top_ref`, `center_ref`, `bottom_ref` | Punto de referencia de alineacion vertical |
| `hexactpos` | `0` o `1` | 0 = posicion X proporcional, 1 = posicion X en pixeles |
| `vexactpos` | `0` o `1` | 0 = posicion Y proporcional, 1 = posicion Y en pixeles |
| `hexactsize` | `0` o `1` | 0 = ancho proporcional, 1 = ancho en pixeles |
| `vexactsize` | `0` o `1` | 0 = alto proporcional, 1 = alto en pixeles |
| `fixaspect` | `fixwidth`, `fixheight` | Mantener la relacion de aspecto restringiendo una dimension |
| `scaled` | `0` o `1` | Escalar con la configuracion de escala de UI de DayZ |
| `priority` | entero | Orden Z (valores mas altos se renderizan encima) |

Los flags `hexactpos`, `vexactpos`, `hexactsize` y `vexactsize` son los atributos mas importantes en todo el sistema de layouts. Controlan si cada dimension usa unidades proporcionales (0.0 - 1.0 relativo al padre) o de pixeles (pixeles absolutos de pantalla). Consulta [3.3 Tamano y Posicionamiento](03-sizing-positioning.md) para una explicacion completa.

### Atributos Visuales

| Atributo | Valores | Descripcion |
|---|---|---|
| `visible` | `0` o `1` | Visibilidad inicial (0 = oculto) |
| `color` | `r g b a` | Color como cuatro floats, cada uno de 0.0 a 1.0 |
| `style` | nombre de estilo | Estilo visual predefinido (ej., `Default`, `Colorable`) |
| `draggable` | `0` o `1` | El widget puede ser arrastrado por el usuario |
| `clipchildren` | `0` o `1` | Recortar widgets hijos a los limites de este widget |
| `inheritalpha` | `0` o `1` | Los hijos heredan el valor alfa de este widget |
| `keepsafezone` | `0` o `1` | Mantener el widget dentro de la zona segura de pantalla |

### Atributos de Comportamiento

| Atributo | Valores | Descripcion |
|---|---|---|
| `ignorepointer` | `0` o `1` | El widget ignora la entrada del mouse (los clics pasan a traves) |
| `disabled` | `0` o `1` | El widget esta deshabilitado |
| `"no focus"` | `0` o `1` | El widget no puede recibir foco de teclado |

### Atributos de Texto

Estos aplican a `TextWidgetClass`, `RichTextWidgetClass`, `MultilineTextWidgetClass`, `ButtonWidgetClass` y otros widgets que contienen texto.

| Atributo | Valores | Descripcion |
|---|---|---|
| `text` | `"string"` | Contenido de texto predeterminado |
| `font` | `"ruta/a/fuente"` | Ruta del archivo de fuente |
| `"text halign"` | `left`, `center`, `right` | Alineacion horizontal del texto dentro del widget |
| `"text valign"` | `top`, `center`, `bottom` | Alineacion vertical del texto dentro del widget |
| `"bold text"` | `0` o `1` | Renderizado en negrita |
| `"italic text"` | `0` o `1` | Renderizado en italica |
| `"exact text"` | `0` o `1` | Usar tamano de fuente exacto en pixeles en lugar de proporcional |
| `"exact text size"` | entero | Tamano de fuente en pixeles (requiere `"exact text" 1`) |
| `"size to text h"` | `0` o `1` | Redimensionar ancho del widget para ajustar al texto |
| `"size to text v"` | `0` o `1` | Redimensionar alto del widget para ajustar al texto |
| `"text sharpness"` | float | Nitidez de renderizado del texto |
| `wrap` | `0` o `1` | Habilitar ajuste de palabras |

### Atributos de Imagen

Estos aplican a `ImageWidgetClass`.

| Atributo | Valores | Descripcion |
|---|---|---|
| `image0` | `"set:nombre image:nombre"` | Imagen principal desde un imageset |
| `mode` | `blend`, `additive`, `stretch` | Modo de mezcla de imagen |
| `"src alpha"` | `0` o `1` | Usar el canal alfa fuente |
| `stretch` | `0` o `1` | Estirar imagen para llenar el widget |
| `filter` | `0` o `1` | Habilitar filtrado de textura |
| `"flip u"` | `0` o `1` | Voltear imagen horizontalmente |
| `"flip v"` | `0` o `1` | Voltear imagen verticalmente |
| `"clamp mode"` | `clamp`, `wrap` | Comportamiento de bordes de textura |
| `"stretch mode"` | `stretch_w_h`, etc. | Modo de estiramiento |

### Atributos de Espaciador

Estos aplican a `WrapSpacerWidgetClass` y `GridSpacerWidgetClass`.

| Atributo | Valores | Descripcion |
|---|---|---|
| `Padding` | entero | Padding interno en pixeles |
| `Margin` | entero | Espacio entre items hijos en pixeles |
| `"Size To Content H"` | `0` o `1` | Redimensionar ancho para coincidir con hijos |
| `"Size To Content V"` | `0` o `1` | Redimensionar alto para coincidir con hijos |
| `content_halign` | `left`, `center`, `right` | Alineacion horizontal del contenido hijo |
| `content_valign` | `top`, `center`, `bottom` | Alineacion vertical del contenido hijo |
| `Columns` | entero | Columnas de grilla (solo GridSpacer) |
| `Rows` | entero | Filas de grilla (solo GridSpacer) |

### Atributos de Boton

| Atributo | Valores | Descripcion |
|---|---|---|
| `switch` | `toggle` | Hace que el boton sea un toggle (permanece presionado) |
| `style` | nombre de estilo | Estilo visual para el boton |

### Atributos de Slider

| Atributo | Valores | Descripcion |
|---|---|---|
| `"fill in"` | `0` o `1` | Mostrar una pista rellena detras del handle del slider |
| `"listen to input"` | `0` o `1` | Responder a entrada del mouse |

### Atributos de Scroll

| Atributo | Valores | Descripcion |
|---|---|---|
| `"Scrollbar V"` | `0` o `1` | Mostrar barra de scroll vertical |
| `"Scrollbar H"` | `0` o `1` | Mostrar barra de scroll horizontal |

---

## Integracion con Scripts

### El Atributo `scriptclass`

El atributo `scriptclass` vincula un widget a una clase de Enforce Script. Cuando el layout se carga, el motor crea una instancia de esa clase y llama a su metodo `OnWidgetScriptInit(Widget w)`.

```
FrameWidgetClass MyPanel {
 size 1 1
 scriptclass "MyPanelHandler"
}
```

La clase del script debe heredar de `Managed` e implementar `OnWidgetScriptInit`:

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

### El Bloque ScriptParamsClass

Los parametros pueden pasarse desde el layout al `scriptclass` via un bloque `ScriptParamsClass`. Este bloque aparece como un segundo bloque hijo `{ }` despues de los hijos del widget.

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

La clase del script lee estos parametros en `OnWidgetScriptInit` usando el sistema de parametros de script del widget.

### ViewBinding de DabsFramework

En mods que usan DabsFramework MVC, el patron `scriptclass "ViewBinding"` conecta widgets a las propiedades de datos de un ViewController:

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

| Parametro | Descripcion |
|---|---|
| `Binding_Name` | Nombre de la propiedad del ViewController a la que vincular |
| `Two_Way_Binding` | `1` = los cambios en la UI se propagan de vuelta al controlador |
| `Relay_Command` | Nombre de funcion en el controlador a llamar cuando el widget es clickeado/cambiado |
| `Selected_Item` | Propiedad a la que vincular el item seleccionado (para listas) |
| `Debug_Logging` | `1` = habilitar logging detallado para este binding |

---

## Anidamiento de Hijos

Los hijos se colocan dentro de un bloque `{ }` despues de los atributos del padre. Multiples hijos pueden existir en el mismo bloque.

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

Los hijos siempre se posicionan relativos a su padre. Un hijo con `position 0 0` y `size 1 1` (proporcional) llena a su padre completamente.

---

## Ejemplo Completo Anotado

Aqui hay un archivo layout completamente anotado para un panel de notificaciones --- el tipo de UI que podrias construir para un mod:

```
// Contenedor raiz -- frame invisible que cubre 30% del ancho de pantalla
// Centrado horizontalmente, posicionado en la parte superior de la pantalla
FrameWidgetClass NotificationPanel {

 // Empieza oculto (el script lo mostrara)
 visible 0

 // No bloquear clics del mouse en cosas detras de este panel
 ignorepointer 1

 // Color con tinte azul (R=0.2, G=0.6, B=1.0, A=0.9)
 color 0.2 0.6 1.0 0.9

 // Posicion: 0 pixeles desde la izquierda, 0 pixeles desde arriba
 position 0 0
 hexactpos 1
 vexactpos 1

 // Tamano: 30% del ancho del padre, 30 pixeles de alto
 size 0.3 30
 hexactsize 0
 vexactsize 1

 // Centrar horizontalmente dentro del padre
 halign center_ref

 // Bloque de hijos
 {
  // Etiqueta de texto llena todo el panel de notificacion
  TextWidgetClass NotificationText {

   // Tambien ignorar entrada del mouse
   ignorepointer 1

   // Posicion en el origen relativo al padre
   position 0 0
   hexactpos 1
   vexactpos 1

   // Llenar el padre completamente (proporcional)
   size 1 1
   hexactsize 0
   vexactsize 0

   // Centrar el texto en ambas direcciones
   "text halign" center
   "text valign" center

   // Usar una fuente en negrita
   font "gui/fonts/Metron-Bold"

   // Texto predeterminado (sera sobreescrito por el script)
   text "Notification"
  }
 }
}
```

Y aqui hay un ejemplo mas complejo --- un dialogo con barra de titulo, contenido con scroll y un boton de cerrar:

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
  // Fila de la barra de titulo
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

  // Area de contenido con scroll
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

## Errores Comunes

1. **Olvidar el sufijo `Class`** -- En layouts, escribe `TextWidgetClass`, no `TextWidget`.
2. **Mezclar valores proporcionales y de pixeles** -- Si `hexactsize 0`, los valores de tamano son proporcionales 0.0-1.0. Si `hexactsize 1`, son valores en pixeles. Usar `300` con modo proporcional significa 300 veces el ancho del padre.
3. **No usar comillas en atributos de multiples palabras** -- Escribe `"text halign" center`, no `text halign center`.
4. **Colocar ScriptParamsClass en el bloque equivocado** -- Debe estar en un bloque `{ }` separado despues del bloque de hijos, no dentro de el.

---

## Siguientes Pasos

- [3.3 Tamano y Posicionamiento](03-sizing-positioning.md) -- Dominar el sistema de coordenadas proporcionales vs. pixeles
- [3.4 Widgets Contenedores](04-containers.md) -- Profundizar en widgets de espaciador y scroll
