# Capitolo 6.5: Effetti Post-Process (PPE)

[Home](../README.md) | [<< Precedente: Telecamere](04-cameras.md) | **Effetti Post-Process** | [Successivo: Notifiche >>](06-notifications.md)

---

## Introduzione

Il sistema di Effetti Post-Process (PPE) di DayZ controlla gli effetti visivi applicati dopo il rendering della scena: sfocatura, color grading, vignettatura, aberrazione cromatica, visione notturna e altro. Il sistema è costruito attorno alle classi `PPERequester` che possono richiedere effetti visivi specifici. Più requester possono essere attivi contemporaneamente e il motore fonde i loro contributi. Questo capitolo spiega come utilizzare il sistema PPE nelle mod.

---

## Panoramica dell'Architettura

```
PPEManager
├── PPERequesterBank              // Registro statico di tutti i requester disponibili
│   ├── REQ_INVENTORYBLUR         // Sfocatura inventario
│   ├── REQ_MENUEFFECTS           // Effetti del menù
│   ├── REQ_CONTROLLERDISCONNECT  // Overlay disconnessione controller
│   ├── REQ_UNCONSCIOUS           // Effetto incoscienza
│   ├── REQ_FEVEREFFECTS          // Effetti visivi della febbre
│   ├── REQ_FLASHBANGEFFECTS      // Flashbang
│   ├── REQ_BURLAPSACK            // Sacco di iuta sulla testa
│   ├── REQ_DEATHEFFECTS          // Schermata di morte
│   ├── REQ_BLOODLOSS             // Desaturazione per perdita di sangue
│   └── ... (molti altri)
└── PPERequester_*                // Implementazioni individuali dei requester
```

---

## PPEManager

Il `PPEManager` è un singleton che coordina tutte le richieste PPE attive. Raramente interagisci direttamente con esso --- invece, lavori attraverso le sottoclassi di `PPERequester`.

```c
// Ottenere l'istanza del manager
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**File:** `3_Game/PPE/pperequesterbank.c`

Un registro statico che contiene le istanze di tutti i requester PPE. Accedi a requester specifici tramite il loro indice costante.

### Ottenere un Requester

```c
// Ottenere un requester tramite la sua costante nel bank
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### Costanti Comuni dei Requester

| Costante | Effetto |
|----------|--------|
| `REQ_INVENTORYBLUR` | Sfocatura gaussiana quando l'inventario è aperto |
| `REQ_MENUEFFECTS` | Sfocatura dello sfondo del menù |
| `REQ_UNCONSCIOUS` | Visuale di incoscienza (sfocatura + desaturazione) |
| `REQ_DEATHEFFECTS` | Schermata di morte (scala di grigi + vignettatura) |
| `REQ_BLOODLOSS` | Desaturazione per perdita di sangue |
| `REQ_FEVEREFFECTS` | Aberrazione cromatica da febbre |
| `REQ_FLASHBANGEFFECTS` | Bagliore bianco da flashbang |
| `REQ_BURLAPSACK` | Bendaggio del sacco di iuta |
| `REQ_PAINBLUR` | Effetto sfocatura da dolore |
| `REQ_CONTROLLERDISCONNECT` | Overlay disconnessione controller |
| `REQ_CAMERANV` | Visione notturna |
| `REQ_FILMGRAINEFFECTS` | Overlay grana pellicola |
| `REQ_RAINEFFECTS` | Effetti della pioggia sullo schermo |
| `REQ_COLORSETTING` | Impostazioni di correzione colore |

---

## Base PPERequester

Tutti i requester PPE estendono `PPERequester`:

```c
class PPERequester : Managed
{
    // Avviare l'effetto
    void Start(Param par = null);

    // Fermare l'effetto
    void Stop(Param par = null);

    // Verificare se è attivo
    bool IsActiveRequester();

    // Impostare valori sui parametri del materiale
    void SetTargetValueFloat(int mat_id, int param_idx, bool relative,
                              float val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueColor(int mat_id, int param_idx, bool relative,
                              float val1, float val2, float val3, float val4,
                              int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueBool(int mat_id, int param_idx, bool relative,
                             bool val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueInt(int mat_id, int param_idx, bool relative,
                            int val, int priority_layer, int operator = PPOperators.SET);
}
```

### PPOperators

```c
class PPOperators
{
    static const int SET          = 0;  // Imposta direttamente il valore
    static const int ADD          = 1;  // Aggiunge al valore corrente
    static const int ADD_RELATIVE = 2;  // Aggiunge relativamente al corrente
    static const int HIGHEST      = 3;  // Usa il più alto tra corrente e nuovo
    static const int LOWEST       = 4;  // Usa il più basso tra corrente e nuovo
    static const int MULTIPLY     = 5;  // Moltiplica il valore corrente
    static const int OVERRIDE     = 6;  // Forza l'override
}
```

---

## ID Comuni dei Materiali PPE

Gli effetti puntano a materiali di post-processing specifici. ID di materiali comuni:

| Costante | Materiale |
|----------|----------|
| `PostProcessEffectType.Glow` | Bloom / bagliore |
| `PostProcessEffectType.FilmGrain` | Grana pellicola |
| `PostProcessEffectType.RadialBlur` | Sfocatura radiale |
| `PostProcessEffectType.ChromAber` | Aberrazione cromatica |
| `PostProcessEffectType.WetEffect` | Effetto lente bagnata |
| `PostProcessEffectType.ColorGrading` | Color grading / LUT |
| `PostProcessEffectType.DepthOfField` | Profondità di campo |
| `PostProcessEffectType.SSAO` | Occlusione ambientale nello spazio schermo |
| `PostProcessEffectType.GodRays` | Luce volumetrica |
| `PostProcessEffectType.Rain` | Pioggia sullo schermo |
| `PostProcessEffectType.Vignette` | Overlay vignettatura |
| `PostProcessEffectType.HBAO` | Occlusione ambientale basata sull'orizzonte |

---

## Usare i Requester Integrati

### Sfocatura Inventario

L'esempio più semplice --- la sfocatura che appare quando l'inventario è aperto:

```c
// Avviare la sfocatura
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Fermare la sfocatura
blurReq.Stop();
```

### Effetto Flashbang

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// Fermare dopo un ritardo
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## Creare un Requester PPE Personalizzato

Per creare effetti post-process personalizzati, estendi `PPERequester` e registralo.

### Passo 1: Definire il Requester

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // Applicare una vignettatura forte
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // Desaturare i colori
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // Ripristinare i valori predefiniti
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### Passo 2: Registrare e Utilizzare

La registrazione viene gestita aggiungendo il requester al bank. In pratica, la maggior parte dei modder utilizza i requester integrati e ne modifica i parametri piuttosto che creare requester completamente personalizzati.

---

## Visione Notturna (NVG)

La visione notturna è implementata come effetto PPE. Il requester rilevante è `REQ_CAMERANV`:

```c
// Abilitare l'effetto NVG
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// Disabilitare l'effetto NVG
nvgReq.Stop();
```

L'NVG effettivo in gioco viene attivato dall'oggetto NVGoggles tramite il suo `ComponentEnergyManager` e il metodo `NVGoggles.ToggleNVG()`, che internamente pilota il sistema PPE.

---

## Color Grading

Il color grading modifica l'aspetto cromatico complessivo della scena:

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// Regolare la saturazione (1.0 = normale, 0.0 = scala di grigi, >1.0 = sovrasaturato)
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## Effetti di Sfocatura

### Sfocatura Gaussiana

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Regolare l'intensità della sfocatura (0.0 = nessuna, più alto = più sfocatura)
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### Sfocatura Radiale

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## Livelli di Priorità

Quando più requester modificano lo stesso parametro, il livello di priorità determina quale prevale:

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // Priorità più bassa (effetti statici)
    static const int L_1_VALUES   = 1;   // Modifiche dinamiche dei valori
    static const int L_2_SCRIPTS  = 2;   // Effetti guidati da script
    static const int L_3_EFFECTS  = 3;   // Effetti di gameplay
    static const int L_4_OVERLAY  = 4;   // Effetti overlay
    static const int L_LAST       = 100;  // Priorità più alta (sovrascrive tutto)
}
```

I numeri più alti hanno la priorità. Usa `PPEManager.L_LAST` per forzare il tuo effetto a sovrascrivere tutti gli altri.

---

## Riepilogo

| Concetto | Punto Chiave |
|----------|-------------|
| Accesso | `PPERequesterBank.GetRequester(COSTANTE)` |
| Avvio/Arresto | `requester.Start()` / `requester.Stop()` |
| Parametri | `SetTargetValueFloat(materiale, param, relativo, valore, livello, operatore)` |
| Operatori | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| Effetti comuni | Sfocatura, vignettatura, saturazione, NVG, flashbang, grana, aberrazione cromatica |
| NVG | Requester `REQ_CAMERANV` |
| Priorità | Livelli 0-100; il numero più alto vince i conflitti |
| Personalizzato | Estendi `PPERequester`, fai l'override di `OnStart()` / `OnStop()` |

---

## Buone Pratiche

- **Chiama sempre `Stop()` per pulire il tuo requester.** Non fermare un requester PPE lascia il suo effetto visivo permanentemente attivo, anche dopo che la condizione che lo ha innescato è terminata.
- **Usa livelli di priorità appropriati.** Gli effetti di gameplay dovrebbero usare `L_3_EFFECTS` o superiore. Usare `L_LAST` (100) sovrascrive tutto, inclusi gli effetti vanilla di incoscienza e morte, il che può rovinare l'esperienza del giocatore.
- **Preferisci i requester integrati a quelli personalizzati.** Il `PPERequesterBank` contiene già requester per sfocatura, desaturazione, vignettatura e grana. Riutilizzali con parametri modificati prima di creare una classe requester personalizzata.
- **Testa gli effetti PPE sotto diverse condizioni di illuminazione.** Vignettatura e desaturazione appaiono drasticamente diverse di notte rispetto al giorno. Verifica che il tuo effetto sia leggibile in entrambi gli estremi.
- **Evita di sovrapporre più effetti di sfocatura ad alta intensità.** Più requester di sfocatura attivi si sommano, rendendo potenzialmente lo schermo illeggibile. Controlla `IsActiveRequester()` prima di avviare effetti aggiuntivi.

---

## Compatibilità e Impatto

- **Multi-Mod:** Più mod possono attivare requester PPE contemporaneamente. Il motore li fonde usando livelli di priorità e operatori. I conflitti si verificano quando due mod usano lo stesso livello di priorità con `PPOperators.SET` sullo stesso parametro -- l'ultimo a scrivere prevale.
- **Prestazioni:** Gli effetti PPE sono passaggi di post-processing vincolati alla GPU. Abilitare molti effetti simultanei (sfocatura + grana + aberrazione cromatica + vignettatura) può ridurre il frame rate su GPU di fascia bassa. Mantieni gli effetti attivi al minimo.
- **Server/Client:** Il PPE è interamente rendering lato client. Il server non ha conoscenza degli effetti post-process. Non condizionare mai la logica del server sullo stato PPE.

---

[<< Precedente: Telecamere](04-cameras.md) | **Effetti Post-Process** | [Successivo: Notifiche >>](06-notifications.md)
