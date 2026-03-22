# 6.5. fejezet: Utófeldolgozási effektek (PPE)

[Kezdőlap](../README.md) | [<< Előző: Kamerák](04-cameras.md) | **Utófeldolgozási effektek** | [Következő: Értesítések >>](06-notifications.md)

---

## Bevezetés

A DayZ utófeldolgozási effekt (PPE) rendszere a jelenet renderelése után alkalmazott vizuális effekteket vezérli: elmosódás, színkorrekció, vignettálás, kromatikus aberráció, éjjellátó és sok más. A rendszer `PPERequester` osztályokra épül, amelyek meghatározott vizuális effekteket kérhetnek. Egyszerre több kérelmező is aktív lehet, és a motor összekeveri a hozzájárulásukat. Ez a fejezet a PPE rendszer modokban való használatát tárgyalja.

---

## Architektúra áttekintés

```
PPEManager
├── PPERequesterBank              // Az összes elérhető kérelmező statikus nyilvántartása
│   ├── REQ_INVENTORYBLUR         // Leltár elmosódás
│   ├── REQ_MENUEFFECTS           // Menü effektek
│   ├── REQ_CONTROLLERDISCONNECT  // Kontroller leválasztás fedvény
│   ├── REQ_UNCONSCIOUS           // Eszméletlenség effekt
│   ├── REQ_FEVEREFFECTS          // Láz vizuális effektek
│   ├── REQ_FLASHBANGEFFECTS      // Vakítógránát
│   ├── REQ_BURLAPSACK            // Zsákvászon a fejen
│   ├── REQ_DEATHEFFECTS          // Halál képernyő
│   ├── REQ_BLOODLOSS             // Vérveszteség telítetlenítés
│   └── ... (még sok más)
└── PPERequester_*                // Egyedi kérelmező implementációk
```

---

## PPEManager

A `PPEManager` egy singleton, amely koordinálja az összes aktív PPE kérelmet. Ritkán lépsz vele közvetlen interakcióba --- ehelyett a `PPERequester` alosztályokon keresztül dolgozol.

```c
// A kezelő példány lekérése
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**Fájl:** `3_Game/PPE/pperequesterbank.c`

Statikus nyilvántartás, amely az összes PPE kérelmező példányát tárolja. Az egyes kérelmezőket a konstans indexükkel éred el.

### Kérelmező lekérése

```c
// Kérelmező lekérése a bank konstansa alapján
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### Gyakori kérelmező konstansok

| Konstans | Effekt |
|----------|--------|
| `REQ_INVENTORYBLUR` | Gauss elmosódás, amikor a leltár nyitva van |
| `REQ_MENUEFFECTS` | Menü háttér elmosódás |
| `REQ_UNCONSCIOUS` | Eszméletlenség vizuális (elmosódás + telítetlenítés) |
| `REQ_DEATHEFFECTS` | Halál képernyő (szürkeárnyalatos + vignetta) |
| `REQ_BLOODLOSS` | Vérveszteség telítetlenítés |
| `REQ_FEVEREFFECTS` | Láz kromatikus aberráció |
| `REQ_FLASHBANGEFFECTS` | Vakítógránát fehéredés |
| `REQ_BURLAPSACK` | Zsákvászon szemkötő |
| `REQ_PAINBLUR` | Fájdalom elmosódás effekt |
| `REQ_CONTROLLERDISCONNECT` | Kontroller leválasztás fedvény |
| `REQ_CAMERANV` | Éjjellátó |
| `REQ_FILMGRAINEFFECTS` | Filmzaj fedvény |
| `REQ_RAINEFFECTS` | Eső képernyő effektek |
| `REQ_COLORSETTING` | Színkorrekciós beállítások |

---

## PPERequester alap

Minden PPE kérelmező a `PPERequester`-t terjeszti ki:

```c
class PPERequester : Managed
{
    // Effekt indítása
    void Start(Param par = null);

    // Effekt leállítása
    void Stop(Param par = null);

    // Ellenőrzés, hogy aktív-e
    bool IsActiveRequester();

    // Értékek beállítása anyag paramétereken
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
    static const int SET          = 0;  // Közvetlenül beállítja az értéket
    static const int ADD          = 1;  // Hozzáadás az aktuális értékhez
    static const int ADD_RELATIVE = 2;  // Relatív hozzáadás az aktuálishoz
    static const int HIGHEST      = 3;  // Az aktuális és az új közül a magasabb használata
    static const int LOWEST       = 4;  // Az aktuális és az új közül az alacsonyabb használata
    static const int MULTIPLY     = 5;  // Aktuális érték szorzása
    static const int OVERRIDE     = 6;  // Kényszerített felülírás
}
```

---

## Gyakori PPE anyag-azonosítók

Az effektek meghatározott utófeldolgozási anyagokat céloznak meg. Gyakori anyag-azonosítók:

| Konstans | Anyag |
|----------|-------|
| `PostProcessEffectType.Glow` | Ragyogás / fénylés |
| `PostProcessEffectType.FilmGrain` | Filmzaj |
| `PostProcessEffectType.RadialBlur` | Radiális elmosódás |
| `PostProcessEffectType.ChromAber` | Kromatikus aberráció |
| `PostProcessEffectType.WetEffect` | Nedves lencse effekt |
| `PostProcessEffectType.ColorGrading` | Színkorrekció / LUT |
| `PostProcessEffectType.DepthOfField` | Mélységélesség |
| `PostProcessEffectType.SSAO` | Képernyőtér ambient okklúzió |
| `PostProcessEffectType.GodRays` | Volumetrikus fény |
| `PostProcessEffectType.Rain` | Eső a képernyőn |
| `PostProcessEffectType.Vignette` | Vignetta fedvény |
| `PostProcessEffectType.HBAO` | Horizont-alapú ambient okklúzió |

---

## Beépített kérelmezők használata

### Leltár elmosódás

A legegyszerűbb példa --- az elmosódás, ami a leltár megnyitásakor jelenik meg:

```c
// Elmosódás indítása
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Elmosódás leállítása
blurReq.Stop();
```

### Vakítógránát effekt

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// Leállítás késleltetés után
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## Egyéni PPE kérelmező létrehozása

Egyéni utófeldolgozási effektek létrehozásához terjesd ki a `PPERequester`-t és regisztráld.

### 1. lépés: A kérelmező definiálása

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // Erős vignetta alkalmazása
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // Színek telítetlenítése
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // Visszaállítás alapértékekre
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### 2. lépés: Regisztráció és használat

A regisztrációt a kérelmező bankhoz való hozzáadás kezeli. A gyakorlatban a legtöbb modder a beépített kérelmezőket használja módosított paraméterekkel ahelyett, hogy teljesen egyéni kérelmezőket hozna létre.

---

## Éjjellátó (NVG)

Az éjjellátó PPE effektként van implementálva. A releváns kérelmező a `REQ_CAMERANV`:

```c
// NVG effekt engedélyezése
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// NVG effekt letiltása
nvgReq.Stop();
```

A tényleges játékon belüli NVG az NVGoggles tárgy által az `ComponentEnergyManager` és az `NVGoggles.ToggleNVG()` metódusán keresztül aktiválódik, amely belsőleg a PPE rendszert vezérli.

---

## Színkorrekció

A színkorrekció a jelenet általános színmegjelenését módosítja:

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// Telítettség beállítása (1.0 = normál, 0.0 = szürkeárnyalatos, >1.0 = túltelített)
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## Elmosódás effektek

### Gauss elmosódás

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Elmosódás intenzitás beállítása (0.0 = nincs, nagyobb = több elmosódás)
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### Radiális elmosódás

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## Prioritási rétegek

Amikor több kérelmező módosítja ugyanazt a paramétert, a prioritási réteg határozza meg, melyik nyer:

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // Legalacsonyabb prioritás (statikus effektek)
    static const int L_1_VALUES   = 1;   // Dinamikus értékváltozások
    static const int L_2_SCRIPTS  = 2;   // Szkript-vezérelt effektek
    static const int L_3_EFFECTS  = 3;   // Játékmenet effektek
    static const int L_4_OVERLAY  = 4;   // Fedvény effektek
    static const int L_LAST       = 100;  // Legmagasabb prioritás (mindent felülír)
}
```

A magasabb számok élveznek elsőbbséget. Használd a `PPEManager.L_LAST` értéket, hogy az effekted felülírjon minden mást.

---

## Összefoglalás

| Fogalom | Lényeg |
|---------|--------|
| Hozzáférés | `PPERequesterBank.GetRequester(KONSTANS)` |
| Indítás/Leállítás | `requester.Start()` / `requester.Stop()` |
| Paraméterek | `SetTargetValueFloat(anyag, paraméter, relatív, érték, réteg, operátor)` |
| Operátorok | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| Gyakori effektek | Elmosódás, vignetta, telítettség, NVG, vakítógránát, filmzaj, kromatikus aberráció |
| NVG | `REQ_CAMERANV` kérelmező |
| Prioritás | 0-100 közötti rétegek; magasabb szám nyer konfliktus esetén |
| Egyéni | `PPERequester` kiterjesztése, `OnStart()` / `OnStop()` felülírása |

---

## Bevált gyakorlatok

- **Mindig hívd meg a `Stop()` metódust a kérelmeződ eltakarításához.** A PPE kérelmező leállításának elmulasztása állandóan aktívvá teszi a vizuális effektet, még az aktiváló feltétel megszűnése után is.
- **Használj megfelelő prioritási rétegeket.** A játékmenet effektek az `L_3_EFFECTS` vagy magasabb rétegbe kerüljenek. Az `L_LAST` (100) használata mindent felülír, beleértve a vanilla eszméletlenségi és halál effekteket, ami ronthatja a játékos élményét.
- **Részesítsd előnyben a beépített kérelmezőket az egyéniekkel szemben.** A `PPERequesterBank` már tartalmaz kérelmezőket elmosódáshoz, telítetlenítéshez, vignettához és filmzajhoz. Használd ezeket módosított paraméterekkel, mielőtt egyéni kérelmező osztályt hoznál létre.
- **Teszteld a PPE effekteket különböző fényviszonyok között.** A vignetta és a telítetlenítés drasztikusan másként néz ki éjjel és nappal. Ellenőrizd, hogy az effekted mindkét szélsőségben jól olvasható.
- **Kerüld több magas intenzitású elmosódás effekt halmozását.** Több aktív elmosódás kérelmező összeadódik, és a képernyő olvashatatlanná válhat. Ellenőrizd az `IsActiveRequester()` értékét, mielőtt további effekteket indítanál.

---

## Kompatibilitás és hatás

- **Több mod együtt:** Több mod is aktiválhat PPE kérelmezőket egyszerre. A motor a prioritási rétegek és operátorok alapján keveri össze őket. Konfliktus akkor lép fel, ha két mod ugyanazon a prioritási szinten `PPOperators.SET` műveletet használ ugyanazon a paraméteren --- az utolsó író nyer.
- **Teljesítmény:** A PPE effektek GPU-kötött utófeldolgozási lépések. Sok egyidejű effekt engedélyezése (elmosódás + filmzaj + kromatikus aberráció + vignetta) csökkentheti a képkockasebességet gyengébb GPU-kon. Tartsd az aktív effekteket minimálisra.
- **Szerver/Kliens:** A PPE teljes egészében kliens oldali renderelés. A szerver nem tud az utófeldolgozási effektekről. Soha ne kösd szerver logikát PPE állapothoz.

---

[<< Előző: Kamerák](04-cameras.md) | **Utófeldolgozási effektek** | [Következő: Értesítések >>](06-notifications.md)
