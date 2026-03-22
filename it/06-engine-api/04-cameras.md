# Capitolo 6.4: Sistema telecamere

[Home](../README.md) | [<< Precedente: Meteo](03-weather.md) | **Telecamere** | [Successivo: Effetti di post-elaborazione >>](05-ppe.md)

---

## Introduzione

DayZ utilizza un sistema telecamere multilivello. La telecamera del giocatore viene gestita dal motore tramite le sottoclassi di `DayZPlayerCamera`. Per il modding e il debug, la `FreeDebugCamera` consente il volo libero. Il motore fornisce anche accessori globali per lo stato corrente della telecamera. Questo capitolo tratta i tipi di telecamera, come accedere ai dati della telecamera e come utilizzare gli strumenti telecamera scriptati.

---

## Stato attuale della telecamera (Accessori globali)

Questi metodi sono disponibili ovunque e restituiscono lo stato della telecamera attiva indipendentemente dal tipo di telecamera:

```c
// Posizione mondiale attuale della telecamera
proto native vector GetGame().GetCurrentCameraPosition();

// Direzione in avanti della telecamera attuale (vettore unitario)
proto native vector GetGame().GetCurrentCameraDirection();

// Conversione posizione mondiale in coordinate schermo
proto native vector GetGame().GetScreenPos(vector world_pos);
// Restituisce: x = schermo X (pixel), y = schermo Y (pixel), z = profondita (distanza dalla telecamera)
```

**Esempio --- verificare se una posizione e sullo schermo:**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 significa dietro la telecamera
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**Esempio --- ottenere la distanza dalla telecamera a un punto:**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## Sistema DayZPlayerCamera

Le telecamere dei giocatori DayZ sono classi native gestite dal controller del giocatore del motore. Non vengono istanziate direttamente dallo script --- invece, il motore seleziona la telecamera appropriata in base allo stato del giocatore (in piedi, prono, nuoto, veicolo, incosciente, ecc.).

### Tipi di telecamera (Costanti DayZPlayerCameras)

Gli ID dei tipi di telecamera sono definiti come costanti:

| Costante | Descrizione |
|----------|-------------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | Telecamera in prima persona |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | Terza persona in piedi |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | Terza persona accovacciato |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | Terza persona prono |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | Terza persona sprint |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | Terza persona arma alzata |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | Terza persona accovacciato arma alzata |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | Mira con tacca di mira |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | Mira con ottica/cannocchiale |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | Terza persona veicolo |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | Prima persona veicolo |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | Terza persona nuoto |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | Terza persona incosciente |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | Prima persona incosciente |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | Terza persona arrampicata |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | Terza persona salto |

### Ottenere il tipo di telecamera attuale

```c
DayZPlayer player = GetGame().GetPlayer();
if (player)
{
    int cameraType = player.GetCurrentCameraType();
    if (cameraType == DayZPlayerCameras.DAYZCAMERA_1ST)
    {
        Print("Player is in first person");
    }
}
```

---

## FreeDebugCamera

**File:** `5_Mission/gui/scriptconsole/freedebugcamera.c`

La telecamera a volo libero utilizzata per il debug e il lavoro cinematografico. Disponibile nelle build diagnostiche o quando abilitata dai mod.

### Accesso all'istanza

```c
FreeDebugCamera GetFreeDebugCamera();
```

Questa funzione globale restituisce l'istanza singleton della telecamera libera (o null se non esiste).

### Metodi principali

```c
// Abilitare/disabilitare la telecamera libera
static void SetActive(bool active);
static bool GetActive();

// Posizione e orientamento
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // imbardata, beccheggio, rollio

// Velocita
void SetFlySpeed(float speed);
float GetFlySpeed();

// Direzione della telecamera
vector GetDirection();
```

**Esempio --- attivare la telecamera libera e teletrasportarla:**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // Guarda leggermente verso il basso
        cam.SetFlySpeed(10.0);
    }
}
```

---

## Campo visivo (FOV)

Il motore controlla il FOV nativamente. Puoi leggerlo e modificarlo tramite il sistema telecamera del giocatore:

### Lettura del FOV

```c
// Ottenere il FOV della telecamera attuale
float fov = GetDayZGame().GetFieldOfView();
```

### Override del FOV in DayZPlayerCamera

Nelle classi telecamera personalizzate che estendono `DayZPlayerCamera`, puoi sovrascrivere il FOV:

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // ~45 gradi (radianti)
    }
}
```

---

## Profondita di campo (DOF)

La profondita di campo e controllata tramite il sistema di effetti di post-elaborazione (vedi [Capitolo 6.5](05-ppe.md)). Tuttavia, il sistema telecamera lavora con il DOF attraverso questi meccanismi:

### Impostazione del DOF tramite World

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(distanza_fuoco, lunghezza_fuoco, lunghezza_fuoco_vicino, sfocatura, offset_profondita_fuoco)
    // Tutti i valori in metri
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### Disabilitazione del DOF

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // Tutti zeri disabilita il DOF
}
```

---

## ScriptCamera (GameLib)

**File:** `2_GameLib/entities/scriptcamera.c`

Un'entita telecamera scriptata di livello inferiore dal layer GameLib. Questa e la base per le implementazioni di telecamere personalizzate.

### Creazione di una telecamera

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // solo locale
);
```

### Metodi principali

```c
proto native void SetFOV(float fov);          // FOV in radianti
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### Attivazione di una telecamera

```c
// Rendere questa telecamera la telecamera di rendering attiva
GetGame().SelectPlayer(null, null);   // Scollegare dal giocatore
GetGame().ObjectRelease(camera);      // Rilasciare al motore
```

> **Nota:** Passare dalla telecamera del giocatore richiede una gestione attenta dell'input e dell'HUD. La maggior parte dei mod utilizza la telecamera di debug libera o gli effetti overlay PPE invece di creare telecamere personalizzate.

---

## Raycasting dalla telecamera

Un pattern comune e il raycasting dalla posizione della telecamera nella direzione della telecamera per trovare cio che il giocatore sta guardando:

```c
Object GetObjectInCrosshair(float maxDistance)
{
    vector from = GetGame().GetCurrentCameraPosition();
    vector to = from + (GetGame().GetCurrentCameraDirection() * maxDistance);

    vector contactPos;
    vector contactDir;
    int contactComponent;
    set<Object> hitObjects = new set<Object>;

    if (DayZPhysics.RaycastRV(from, to, contactPos, contactDir,
                               contactComponent, hitObjects, null, null,
                               false, false, ObjIntersectView, 0.0))
    {
        if (hitObjects.Count() > 0)
            return hitObjects[0];
    }

    return null;
}
```

---

## Riepilogo

| Concetto | Punto chiave |
|----------|-------------|
| Accessori globali | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| Tipi di telecamera | Costanti `DayZPlayerCameras` (1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE, ecc.) |
| Tipo attuale | `player.GetCurrentCameraType()` |
| Telecamera libera | `FreeDebugCamera.SetActive(true)`, poi `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` per leggere, sovrascrivere `GetCurrentFOV()` nella classe telecamera |
| DOF | `GetGame().GetWorld().SetDOF(fuoco, lunghezza, vicino, sfocatura, offset)` |
| Conversione schermo | `GetScreenPos(worldPos)` restituisce pixel XY + profondita Z |

---

## Buone pratiche

- **Memorizza nella cache la posizione della telecamera quando la interroghi piu volte per frame.** `GetGame().GetCurrentCameraPosition()` e `GetCurrentCameraDirection()` sono chiamate al motore --- memorizza il risultato in una variabile locale se ne hai bisogno in piu calcoli nello stesso frame.
- **Usa il controllo di profondita di `GetScreenPos()` prima del posizionamento dell'UI.** Verifica sempre che `screenPos[2] > 0` (davanti alla telecamera) prima di disegnare marcatori HUD alle posizioni mondiali, altrimenti i marcatori appariranno specchiati dietro al giocatore.
- **Evita di creare istanze ScriptCamera personalizzate per effetti semplici.** La FreeDebugCamera e il sistema PPE coprono la maggior parte delle esigenze cinematografiche e visive. Le telecamere personalizzate richiedono una gestione attenta di input/HUD che e facile da rompere.
- **Rispetta le transizioni dei tipi di telecamera del motore.** Non forzare cambi di tipo telecamera dallo script a meno che non gestisci completamente lo stato del controller del giocatore. Cambi di telecamera inaspettati possono bloccare il movimento del giocatore o causare desync.
- **Proteggi l'uso della telecamera libera con controlli admin/debug.** La FreeDebugCamera fornisce un'ispezione del mondo simile a quella di un dio. Abilitala solo per admin autenticati o build diagnostiche per prevenire abusi.

---

## Compatibilita e impatto

- **Multi-Mod:** Gli accessori telecamera sono globali di sola lettura, quindi piu mod possono leggere in sicurezza lo stato della telecamera simultaneamente. I conflitti sorgono solo se due mod tentano entrambi di attivare FreeDebugCamera o istanze ScriptCamera personalizzate.
- **Prestazioni:** `GetScreenPos()` e `GetCurrentCameraPosition()` sono chiamate leggere al motore. Il raycasting dalla telecamera (`DayZPhysics.RaycastRV`) e piu costoso --- limitalo a una volta per frame, non per entita.
- **Server/Client:** Lo stato della telecamera esiste solo sul client. Tutti i metodi telecamera restituiscono dati privi di significato su un server dedicato. Non usare mai query telecamera nella logica lato server.

---

[<< Precedente: Meteo](03-weather.md) | **Telecamere** | [Successivo: Effetti di post-elaborazione >>](05-ppe.md)
