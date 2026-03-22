# Capítulo 8.3: Construyendo un Módulo de Panel de Administración

[Inicio](../README.md) | [<< Anterior: Creando un Objeto Personalizado](02-custom-item.md) | **Construyendo un Panel de Administración** | [Siguiente: Agregando Comandos de Chat >>](04-chat-commands.md)

---

> **Resumen:** Este tutorial te guía paso a paso en la construcción de un módulo completo de panel de administración desde cero. Crearás un layout de interfaz, vincularás widgets en script, manejarás clics de botones, enviarás un RPC del cliente al servidor, procesarás la solicitud en el servidor, enviarás una respuesta de vuelta y mostrarás el resultado en la interfaz. Esto cubre el viaje completo de ida y vuelta cliente-servidor-cliente que todo mod en red necesita.

---

## Tabla de Contenidos

- [Qué Vamos a Construir](#qué-vamos-a-construir)
- [Prerrequisitos](#prerrequisitos)
- [Vista General de la Arquitectura](#vista-general-de-la-arquitectura)
- [Paso 1: Crear la Clase del Módulo](#paso-1-crear-la-clase-del-módulo)
- [Paso 2: Crear el Archivo de Layout](#paso-2-crear-el-archivo-de-layout)
- [Paso 3: Vincular Widgets en OnActivated](#paso-3-vincular-widgets-en-onactivated)
- [Paso 4: Manejar Clics de Botones](#paso-4-manejar-clics-de-botones)
- [Paso 5: Enviar un RPC al Servidor](#paso-5-enviar-un-rpc-al-servidor)
- [Paso 6: Manejar la Respuesta del Lado del Servidor](#paso-6-manejar-la-respuesta-del-lado-del-servidor)
- [Paso 7: Actualizar la Interfaz con los Datos Recibidos](#paso-7-actualizar-la-interfaz-con-los-datos-recibidos)
- [Paso 8: Registrar el Módulo](#paso-8-registrar-el-módulo)
- [Referencia Completa de Archivos](#referencia-completa-de-archivos)
- [El Viaje Completo de Ida y Vuelta Explicado](#el-viaje-completo-de-ida-y-vuelta-explicado)
- [Solución de Problemas](#solución-de-problemas)
- [Siguientes Pasos](#siguientes-pasos)

---

## Qué Vamos a Construir

Crearemos un panel de **Información de Jugadores para Administradores** que:

1. Muestra un botón "Refresh" en un panel de interfaz simple
2. Cuando el admin hace clic en Refresh, envía un RPC al servidor solicitando datos del conteo de jugadores
3. El servidor recibe la solicitud, recopila la información y la envía de vuelta
4. El cliente recibe la respuesta y muestra el conteo de jugadores y la lista en la interfaz

Esto demuestra el patrón fundamental usado por toda herramienta de administración en red, panel de configuración de mods e interfaz multijugador en DayZ.

---

## Prerrequisitos

- Un mod funcional del [Capítulo 8.1](01-first-mod.md) o un nuevo mod con la estructura estándar
- Comprensión de la [Jerarquía de 5 Capas de Script](../02-mod-structure/01-five-layers.md) (usaremos `3_Game`, `4_World` y `5_Mission`)
- Comodidad básica leyendo código de Enforce Script

### Estructura del Mod para Este Tutorial

Crearemos estos nuevos archivos:

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

## Vista General de la Arquitectura

Antes de escribir código, entiende el flujo de datos:

```
CLIENTE                              SERVIDOR
------                              ------

1. El admin hace clic en "Refresh"
2. El cliente envía RPC ------>  3. El servidor recibe el RPC
   (AdminDemo_RequestInfo)       Recopila datos de jugadores
                             4. El servidor envía RPC ------>  CLIENTE
                                (AdminDemo_ResponseInfo)
                                                     5. El cliente recibe el RPC
                                                        Actualiza el texto de la interfaz
```

El sistema RPC (Remote Procedure Call) es cómo el cliente y el servidor se comunican en DayZ. El motor proporciona los métodos `GetGame().RPCSingleParam()` y `GetGame().RPC()` para enviar datos, y un override `OnRPC()` para recibirlos.

**Restricciones clave:**
- Los clientes no pueden leer directamente datos del lado del servidor (lista de jugadores, estado del servidor)
- Toda comunicación entre límites debe pasar a través de RPC
- Los mensajes RPC se identifican por IDs enteros
- Los datos se envían como parámetros serializados usando clases `Param`

---

## Paso 1: Crear la Clase del Módulo

Primero, define los identificadores RPC en `3_Game` (la capa más temprana donde los tipos del juego están disponibles). Los IDs de RPC deben definirse en `3_Game` porque tanto `4_World` (handler del servidor) como `5_Mission` (handler del cliente) necesitan referenciarlos.

### Crear `Scripts/3_Game/AdminDemo/AdminDemoRPC.c`

```c
class AdminDemoRPC
{
    // IDs de RPC -- elige números únicos que no colisionen con otros mods
    // Usar números altos reduce el riesgo de colisión
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

Estas constantes serán usadas tanto por el cliente (para enviar solicitudes) como por el servidor (para identificar solicitudes entrantes y enviar respuestas).

### ¿Por Qué 3_Game?

Los IDs de RPC son datos puros -- enteros sin dependencia de entidades del mundo o interfaz. Colocarlos en `3_Game` los hace visibles tanto para `4_World` (donde vive el handler del servidor) como para `5_Mission` (donde vive la interfaz del cliente).

---

## Paso 2: Crear el Archivo de Layout

El archivo de layout define la estructura visual de tu panel. DayZ usa un formato personalizado basado en texto (no XML) para archivos `.layout`.

### Crear `GUI/layouts/admin_player_info.layout`

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
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   color 0.1 0.1 0.1 0.85
  }
  TextWidgetClass Title {
   size 1 0.08
   position 0 0.02
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Info Panel"
   "text halign" center
   "text valign" center
   color 1 1 1 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass RefreshButton {
   size 0.3 0.08
   position 0.35 0.12
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Refresh"
   "text halign" center
   "text valign" center
   color 0.2 0.6 1.0 1.0
  }
  TextWidgetClass PlayerCountText {
   size 1 0.06
   position 0 0.22
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Count: --"
   "text halign" center
   "text valign" center
   color 0.9 0.9 0.9 1
   font "gui/fonts/MetronBook"
  }
  TextWidgetClass PlayerListText {
   size 0.9 0.55
   position 0.05 0.3
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Click Refresh to load player data..."
   "text halign" left
   "text valign" top
   color 0.8 0.8 0.8 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass CloseButton {
   size 0.2 0.06
   position 0.4 0.9
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Close"
   "text halign" center
   "text valign" center
   color 1.0 0.3 0.3 1.0
  }
 }
}
```

### Desglose del Layout

| Widget | Propósito |
|--------|-----------|
| `AdminDemoPanel` | Marco raíz, 40% de ancho y 50% de alto, centrado en la pantalla |
| `Background` | Fondo oscuro semitransparente que llena todo el panel |
| `Title` | Texto "Player Info Panel" en la parte superior |
| `RefreshButton` | Botón que el admin hace clic para solicitar datos |
| `PlayerCountText` | Muestra el número de conteo de jugadores |
| `PlayerListText` | Muestra la lista de nombres de jugadores |
| `CloseButton` | Cierra el panel |

Todos los tamaños usan coordenadas proporcionales (0.0 a 1.0 relativas al padre) porque `hexactsize` y `vexactsize` están configurados a `0`.

---

## Paso 3: Vincular Widgets en OnActivated

Ahora crea el script del panel del lado del cliente que carga el layout y conecta los widgets a variables.

### Crear `Scripts/5_Mission/AdminDemo/AdminDemoPanel.c`

```c
class AdminDemoPanel extends ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_RefreshButton;
    protected ButtonWidget m_CloseButton;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_PlayerListText;
    protected bool m_IsOpen;

    void AdminDemoPanel() { m_IsOpen = false; }
    void ~AdminDemoPanel() { Close(); }

    void Open()
    {
        if (m_IsOpen) return;
        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root) { Print("[AdminDemo] ERROR: Failed to load layout file!"); return; }
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

    bool IsOpen() { return m_IsOpen; }
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
        if (m_PlayerListText) m_PlayerListText.SetText("Requesting data from server...");
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

### Conceptos Clave

**`CreateWidgets()`** carga el archivo `.layout` y crea objetos de widget reales en memoria. Retorna el widget raíz.

**`FindAnyWidget("name")`** busca en el árbol de widgets un widget con el nombre dado. El nombre debe coincidir con el nombre del widget en el archivo de layout exactamente.

**`Cast()`** convierte la referencia genérica `Widget` a un tipo específico (como `ButtonWidget`). Esto es necesario porque `FindAnyWidget` retorna el tipo base `Widget`.

**`SetHandler(this)`** registra esta clase como el handler de eventos para el widget. Cuando se hace clic en el botón, el motor llama a `OnClick()` en este objeto.

**`PlayerControlDisable` / `PlayerControlEnable`** deshabilita/re-habilita el movimiento y las acciones del jugador. Sin esto, el jugador caminaría mientras intenta hacer clic en los botones.

---

## Paso 4: Manejar Clics de Botones

El manejo de clics de botones ya está implementado en el método `OnClick()` del Paso 3. Examinemos el patrón más de cerca.

### El Patrón OnClick

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_RefreshButton)
    {
        OnRefreshClicked();
        return true;    // Evento consumido -- detener propagación
    }
    if (w == m_CloseButton)
    {
        Close();
        return true;
    }
    return false;        // Evento no consumido -- dejar que se propague
}
```

**Parámetros:**
- `w` -- El widget en el que se hizo clic
- `x`, `y` -- Coordenadas del ratón en el momento del clic
- `button` -- Qué botón del ratón (0 = izquierdo, 1 = derecho, 2 = medio)

**Valor de retorno:**
- `true` significa que manejaste el evento. Deja de propagarse a widgets padres.
- `false` significa que no lo manejaste. El motor lo pasa al siguiente handler.

**Patrón:** Compara el widget clicado `w` contra tus referencias de widget conocidas. Llama a un método handler para cada botón reconocido. Retorna `true` para clics manejados, `false` para todo lo demás.

---

## Paso 5: Enviar un RPC al Servidor

Cuando el admin hace clic en Refresh, necesitamos enviar un mensaje del cliente al servidor. DayZ proporciona el sistema RPC para esto.

### Envío de RPC (Cliente a Servidor)

La llamada de envío central del Paso 3:

```c
Man player = GetGame().GetPlayer();
if (player)
{
    Param1<bool> params = new Param1<bool>(true);
    GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
}
```

**`GetGame().RPCSingleParam(target, rpcID, params, guaranteed)`:**

| Parámetro | Significado |
|-----------|-------------|
| `target` | El objeto con el que este RPC está asociado. Usar el jugador es lo estándar. |
| `rpcID` | Tu identificador entero único (definido en `AdminDemoRPC`). |
| `params` | Un objeto `Param` que lleva la carga de datos. |
| `guaranteed` | `true` = entrega confiable tipo TCP. `false` = dispara y olvida tipo UDP. Siempre usa `true` para operaciones de admin. |

### Clases Param

DayZ proporciona clases plantilla `Param` para enviar datos:

| Clase | Uso |
|-------|-----|
| `Param1<T>` | Un valor |
| `Param2<T1, T2>` | Dos valores |
| `Param3<T1, T2, T3>` | Tres valores |

Puedes enviar strings, ints, floats, bools y vectores. Ejemplo con múltiples valores:

```c
Param3<string, int, float> data = new Param3<string, int, float>("hello", 42, 3.14);
GetGame().RPCSingleParam(player, MY_RPC_ID, data, true);
```

---

## Paso 6: Manejar la Respuesta del Lado del Servidor

El servidor recibe el RPC del cliente, recopila datos y envía una respuesta de vuelta.

### Crear `Scripts/4_World/AdminDemo/AdminDemoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);
        if (!GetGame().IsServer()) return;

        switch (rpc_type)
        {
            case AdminDemoRPC.REQUEST_PLAYER_INFO:
                HandlePlayerInfoRequest(sender);
                break;
        }
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
            if (man)
            {
                PlayerIdentity identity = man.GetIdentity();
                if (identity)
                {
                    if (playerNames != "") playerNames = playerNames + "\n";
                    playerNames = playerNames + (i + 1).ToString() + ". " + identity.GetName();
                }
            }
        }
        if (playerNames == "") playerNames = "(No players connected)";

        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);
        Man requestorPlayer = null;
        for (int j = 0; j < players.Count(); j++)
        {
            Man candidate = players.Get(j);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
            { requestorPlayer = candidate; break; }
        }
        if (requestorPlayer)
            GetGame().RPCSingleParam(requestorPlayer, AdminDemoRPC.RESPONSE_PLAYER_INFO, responseData, true, requestor);
    }
};
```

### Cómo Funciona la Recepción de RPC del Lado del Servidor

1. **`OnRPC()` se llama en el objeto destino.** Cuando el cliente envió el RPC con `target = player`, el `PlayerBase.OnRPC()` del lado del servidor se dispara.

2. **Siempre llama a `super.OnRPC()`.** Otros mods y código vanilla también pueden manejar RPCs en este objeto.

3. **Verifica `GetGame().IsServer()`.** Este código está en `4_World`, que se compila tanto en el cliente como en el servidor. La verificación `IsServer()` asegura que solo procesemos la solicitud en el servidor.

4. **Usa switch en `rpc_type`.** Compara contra tus constantes de ID de RPC.

5. **Envía la respuesta.** Usa `RPCSingleParam` con el quinto parámetro (`recipient`) configurado a la identidad del jugador solicitante. Esto envía la respuesta solo a ese cliente específico.

### Firma de Respuesta de RPCSingleParam

```c
GetGame().RPCSingleParam(
    requestorPlayer,                        // Objeto destino (el jugador)
    AdminDemoRPC.RESPONSE_PLAYER_INFO,      // ID de RPC
    responseData,                           // Carga de datos
    true,                                   // Entrega garantizada
    requestor                               // Identidad del destinatario (cliente específico)
);
```

El quinto parámetro `requestor` (un `PlayerIdentity`) es lo que hace de esto una respuesta dirigida. Sin él, el RPC iría a todos los clientes.

---

## Paso 7: Actualizar la Interfaz con los Datos Recibidos

De vuelta en el lado del cliente, necesitamos interceptar el RPC de respuesta del servidor y enrutarlo al panel.

### Crear `Scripts/5_Mission/AdminDemo/AdminDemoMission.c`

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
            if (m_AdminDemoPanel) m_AdminDemoPanel.Toggle();
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);
        switch (rpc_type)
        {
            case AdminDemoRPC.RESPONSE_PLAYER_INFO:
                HandlePlayerInfoResponse(ctx);
                break;
        }
    }

    protected void HandlePlayerInfoResponse(ParamsReadContext ctx)
    {
        Param2<int, string> data = new Param2<int, string>(0, "");
        if (!ctx.Read(data)) return;
        if (m_AdminDemoPanel)
            m_AdminDemoPanel.OnPlayerInfoReceived(data.param1, data.param2);
    }
};
```

### Cómo Funciona la Recepción de RPC del Lado del Cliente

1. **`MissionGameplay.OnRPC()`** es un handler que captura todo para RPCs recibidos en el cliente. Se dispara para cada RPC entrante.

2. **`ParamsReadContext ctx`** contiene los datos serializados enviados por el servidor. Debes deserializarlos usando `ctx.Read()` con un tipo `Param` que coincida.

3. **La coincidencia de tipos Param es crítica.** El servidor envió `Param2<int, string>`. El cliente debe leer con `Param2<int, string>`. Una discrepancia causa que `ctx.Read()` retorne `false` y no se recuperan datos.

4. **Enruta los datos al panel.** Después de deserializar, llama a un método en el objeto del panel para actualizar la interfaz.

---

## Paso 8: Registrar el Módulo

Finalmente, conecta todo en config.cpp.

### Crear `AdminDemo/mod.cpp`

```cpp
name = "Admin Demo";
author = "YourName";
version = "1.0";
overview = "Tutorial admin panel demonstrating the full RPC roundtrip pattern.";
```

### Crear `AdminDemo/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class AdminDemo_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Scripts" };
    };
};

class CfgMods
{
    class AdminDemo
    {
        dir = "AdminDemo";
        name = "Admin Demo";
        author = "YourName";
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };
        class defs
        {
            class gameScriptModule    { value = ""; files[] = { "AdminDemo/Scripts/3_Game" }; };
            class worldScriptModule   { value = ""; files[] = { "AdminDemo/Scripts/4_World" }; };
            class missionScriptModule { value = ""; files[] = { "AdminDemo/Scripts/5_Mission" }; };
        };
    };
};
```

### ¿Por Qué Tres Capas?

| Capa | Contiene | Razón |
|------|----------|-------|
| `3_Game` | `AdminDemoRPC.c` | Las constantes de ID RPC necesitan ser visibles tanto para `4_World` como para `5_Mission` |
| `4_World` | `AdminDemoServer.c` | Handler del lado del servidor que moddea `PlayerBase` (una entidad del mundo) |
| `5_Mission` | `AdminDemoPanel.c`, `AdminDemoMission.c` | Interfaz del cliente y hooks de misión |

---

## Referencia Completa de Archivos

### Estructura Final de Directorios

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

## El Viaje Completo de Ida y Vuelta Explicado

Esta es la secuencia exacta de eventos cuando el admin presiona F5 y hace clic en Refresh:

```
1. [CLIENTE] El admin presiona F5
   --> MissionGameplay.OnKeyPress(KC_F5) se dispara
   --> AdminDemoPanel.Toggle() es llamado
   --> El panel se abre, el layout se crea, el cursor aparece

2. [CLIENTE] El admin hace clic en el botón "Refresh"
   --> AdminDemoPanel.OnClick() se dispara con w == m_RefreshButton
   --> OnRefreshClicked() es llamado
   --> La interfaz muestra "Loading..."
   --> RPCSingleParam envía REQUEST_PLAYER_INFO (78001) al servidor

3. [RED] El RPC viaja del cliente al servidor

4. [SERVIDOR] PlayerBase.OnRPC() se dispara
   --> rpc_type coincide con REQUEST_PLAYER_INFO
   --> HandlePlayerInfoRequest(sender) es llamado
   --> El servidor itera todos los jugadores conectados
   --> Construye el conteo de jugadores y la lista de nombres
   --> RPCSingleParam envía RESPONSE_PLAYER_INFO (78002) de vuelta al cliente

5. [RED] El RPC viaja del servidor al cliente

6. [CLIENTE] MissionGameplay.OnRPC() se dispara
   --> rpc_type coincide con RESPONSE_PLAYER_INFO
   --> HandlePlayerInfoResponse(ctx) es llamado
   --> Los datos se deserializan del ParamsReadContext
   --> AdminDemoPanel.OnPlayerInfoReceived() es llamado
   --> La interfaz se actualiza con el conteo de jugadores y nombres

Tiempo total: típicamente menos de 100ms en una red local.
```

---

## Solución de Problemas

### El Panel No Se Abre Al Presionar F5

- **Verifica el override de OnKeyPress:** Asegúrate de que `super.OnKeyPress(key)` se llame primero.
- **Verifica el código de tecla:** `KeyCode.KC_F5` es la constante correcta. Si usas una tecla diferente, encuentra la constante correcta en la API de Enforce Script.
- **Verifica la inicialización:** Asegúrate de que `m_AdminDemoPanel` se cree en `OnInit()`.

### El Panel Se Abre Pero Los Botones No Funcionan

- **Verifica SetHandler:** Cada botón necesita que se llame `button.SetHandler(this)`.
- **Verifica los nombres de widgets:** `FindAnyWidget("RefreshButton")` es sensible a mayúsculas. El nombre debe coincidir con el archivo de layout exactamente.
- **Verifica el retorno de OnClick:** Asegúrate de que `OnClick` retorne `true` para los botones manejados.

### El RPC Nunca Llega al Servidor

- **Verifica la unicidad del ID RPC:** Si otro mod usa el mismo número de ID RPC, habrá conflictos. Usa números altos y únicos.
- **Verifica la referencia del jugador:** `GetGame().GetPlayer()` retorna `null` si se llama antes de que el jugador esté completamente inicializado. Asegúrate de que el panel solo se abra después de que el jugador aparezca.
- **Verifica que el código del servidor compile:** Busca errores `SCRIPT (E)` en el log de scripts del servidor en tu código `4_World`.

### La Respuesta del Servidor Nunca Llega al Cliente

- **Verifica el parámetro de destinatario:** El quinto parámetro de `RPCSingleParam` debe ser la `PlayerIdentity` del cliente destino.
- **Verifica la coincidencia de tipo Param:** El servidor envía `Param2<int, string>`, el cliente lee `Param2<int, string>`. Una discrepancia de tipo causa que `ctx.Read()` falle.
- **Verifica el override de MissionGameplay.OnRPC:** Asegúrate de llamar a `super.OnRPC()` y que la firma del método sea correcta.

### La Interfaz Se Muestra Pero Los Datos No Se Actualizan

- **Referencias de widget null:** Si `FindAnyWidget` retorna `null` (nombre de widget no coincide), las llamadas a `SetText()` fallan silenciosamente.
- **Verifica la referencia del panel:** Asegúrate de que `m_AdminDemoPanel` en la clase de misión sea el mismo objeto que se abrió.
- **Agrega sentencias Print:** Traza el flujo de datos agregando llamadas `Print()` en cada paso.

---

## Siguientes Pasos

1. **[Capítulo 8.4: Agregando Comandos de Chat](04-chat-commands.md)** -- Crea comandos de chat del lado del servidor para operaciones de administración.
2. **Agregar permisos** -- Verifica si el jugador solicitante es admin antes de procesar RPCs.
3. **Agregar más funciones** -- Extiende el panel con pestañas para control del clima, teletransporte de jugadores, generación de objetos.
4. **Usar un framework** -- Frameworks como MyMod Core proporcionan enrutamiento RPC integrado, gestión de configuración e infraestructura de panel de admin que elimina gran parte de este código repetitivo.
5. **Estilizar la interfaz** -- Aprende sobre estilos de widgets, imagesets y fuentes en el [Capítulo 3: Sistema de GUI](../03-gui-system/01-widget-types.md).

---

## Buenas Prácticas

- **Valida todos los datos RPC en el servidor antes de ejecutar.** Nunca confíes en los datos del cliente -- siempre verifica permisos, valida parámetros y protégete contra valores null antes de realizar cualquier acción en el servidor.
- **Almacena en caché las referencias de widgets en variables miembro en lugar de llamar a `FindAnyWidget` cada cuadro.** La búsqueda de widgets no es gratuita; llamarla en `OnUpdate` o `OnClick` repetidamente desperdicia rendimiento.
- **Siempre llama a `SetHandler(this)` en widgets interactivos.** Sin él, `OnClick()` nunca se disparará, y no hay mensaje de error -- los botones simplemente no hacen nada en silencio.
- **Usa números de ID RPC altos y únicos.** DayZ vanilla usa IDs bajos. Otros mods eligen rangos comunes. Usa números por encima de 70000 y agrega el prefijo de tu mod en comentarios para que las colisiones sean rastreables.
- **Limpia los widgets en `OnMissionFinish`.** Las raíces de widgets filtradas se acumulan entre saltos de servidor, consumiendo memoria y causando elementos de interfaz fantasma.

---

## Teoría vs Práctica

| Concepto | Teoría | Realidad |
|----------|--------|----------|
| Entrega de `RPCSingleParam` | Configurar `guaranteed=true` significa que el RPC siempre llega | Los RPCs aún pueden perderse si el jugador se desconecta a mitad de vuelo o el servidor se cae. Siempre maneja el caso de "sin respuesta" en tu interfaz (ej., un mensaje de tiempo agotado). |
| Coincidencia de widgets en `OnClick` | Compara `w == m_Button` para identificar clics | Si `FindAnyWidget` retornó NULL (error tipográfico en el nombre del widget), `m_Button` es NULL y la comparación falla silenciosamente. Siempre registra una advertencia si la vinculación del widget falla en `Open()`. |
| Coincidencia de tipos Param | Cliente y servidor usan el mismo `Param2<int, string>` | Si los tipos u orden no coinciden exactamente, `ctx.Read()` retorna false y los datos se pierden silenciosamente. No hay mensaje de error de verificación de tipos en tiempo de ejecución. |
| Pruebas en listen server | Suficiente para iteración rápida | Los listen servers ejecutan cliente y servidor en un proceso, así que los RPCs llegan instantáneamente y nunca cruzan la red. Los errores de sincronización, pérdida de paquetes y problemas de autoridad solo aparecen en un servidor dedicado real. |

---

## Qué Aprendiste

En este tutorial aprendiste:
- Cómo crear un panel de interfaz con archivos de layout y vincular widgets en script
- Cómo manejar clics de botones con `OnClick()` y `SetHandler()`
- Cómo enviar RPCs del cliente al servidor y de vuelta usando `RPCSingleParam` y clases `Param`
- El patrón completo de viaje de ida y vuelta cliente-servidor-cliente usado por toda herramienta de administración en red
- Cómo registrar el panel en `MissionGameplay` con gestión adecuada del ciclo de vida

**Siguiente:** [Capítulo 8.4: Agregando Comandos de Chat](04-chat-commands.md)

---

**Anterior:** [Capítulo 8.2: Creando un Objeto Personalizado](02-custom-item.md)
**Siguiente:** [Capítulo 8.4: Agregando Comandos de Chat](04-chat-commands.md)
