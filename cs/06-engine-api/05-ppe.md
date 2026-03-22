# Kapitola 6.5: Post-processingové efekty (PPE)

[Domů](../README.md) | [<< Předchozí: Kamery](04-cameras.md) | **Post-processingové efekty** | [Další: Notifikace >>](06-notifications.md)

---

## Úvod

Systém post-processingových efektů (PPE) v DayZ řídí vizuální efekty aplikované po vykreslení scény: rozmazání, barevné korekce, vinětu, chromatickou aberaci, noční vidění a další. Systém je postaven na třídách `PPERequester`, které mohou požadovat specifické vizuální efekty. Více requesterů může být aktivních současně a engine prolíná jejich příspěvky. Tato kapitola pokrývá použití systému PPE v modech.

---

## Přehled architektury

```
PPEManager
├── PPERequesterBank              // Statický registr všech dostupných requesterů
│   ├── REQ_INVENTORYBLUR         // Rozmazání inventáře
│   ├── REQ_MENUEFFECTS           // Efekty menu
│   ├── REQ_CONTROLLERDISCONNECT  // Překrytí při odpojení ovladače
│   ├── REQ_UNCONSCIOUS           // Efekt bezvědomí
│   ├── REQ_FEVEREFFECTS          // Vizuální efekty horečky
│   ├── REQ_FLASHBANGEFFECTS      // Zábleskový granát
│   ├── REQ_BURLAPSACK            // Pytel na hlavě
│   ├── REQ_DEATHEFFECTS          // Obrazovka smrti
│   ├── REQ_BLOODLOSS             // Desaturace při ztrátě krve
│   └── ... (a mnoho dalších)
└── PPERequester_*                // Jednotlivé implementace requesterů
```

---

## PPEManager

`PPEManager` je singleton, který koordinuje všechny aktivní PPE požadavky. Zřídka s ním interagujete přímo --- místo toho pracujete prostřednictvím podtříd `PPERequester`.

```c
// Získat instanci manažera
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**Soubor:** `3_Game/PPE/pperequesterbank.c`

Statický registr, který obsahuje instance všech PPE requesterů. Přistupujte ke konkrétním requesterům pomocí jejich konstantního indexu.

### Získání requesteru

```c
// Získat requester podle jeho bankovní konstanty
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### Běžné konstanty requesterů

| Konstanta | Efekt |
|-----------|-------|
| `REQ_INVENTORYBLUR` | Gaussovské rozmazání při otevřeném inventáři |
| `REQ_MENUEFFECTS` | Rozmazání pozadí menu |
| `REQ_UNCONSCIOUS` | Vizuál bezvědomí (rozmazání + desaturace) |
| `REQ_DEATHEFFECTS` | Obrazovka smrti (stupně šedi + viněta) |
| `REQ_BLOODLOSS` | Desaturace při ztrátě krve |
| `REQ_FEVEREFFECTS` | Chromatická aberace horečky |
| `REQ_FLASHBANGEFFECTS` | Oslnění zábleskového granátu |
| `REQ_BURLAPSACK` | Oslepení pytlem |
| `REQ_PAINBLUR` | Efekt rozmazání bolestí |
| `REQ_CONTROLLERDISCONNECT` | Překrytí při odpojení ovladače |
| `REQ_CAMERANV` | Noční vidění |
| `REQ_FILMGRAINEFFECTS` | Překrytí filmovým zrnem |
| `REQ_RAINEFFECTS` | Efekty deště na obrazovce |
| `REQ_COLORSETTING` | Nastavení barevné korekce |

---

## Základ PPERequester

Všechny PPE requestery rozšiřují `PPERequester`:

```c
class PPERequester : Managed
{
    // Spustit efekt
    void Start(Param par = null);

    // Zastavit efekt
    void Stop(Param par = null);

    // Zkontrolovat zda je aktivní
    bool IsActiveRequester();

    // Nastavit hodnoty parametrů materiálu
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
    static const int SET          = 0;  // Přímo nastavit hodnotu
    static const int ADD          = 1;  // Přičíst k aktuální hodnotě
    static const int ADD_RELATIVE = 2;  // Přičíst relativně k aktuální
    static const int HIGHEST      = 3;  // Použít vyšší z aktuální a nové
    static const int LOWEST       = 4;  // Použít nižší z aktuální a nové
    static const int MULTIPLY     = 5;  // Vynásobit aktuální hodnotu
    static const int OVERRIDE     = 6;  // Vynutit přepsání
}
```

---

## Běžné ID PPE materiálů

Efekty cílí na specifické post-processingové materiály. Běžná ID materiálů:

| Konstanta | Materiál |
|-----------|----------|
| `PostProcessEffectType.Glow` | Bloom / záře |
| `PostProcessEffectType.FilmGrain` | Filmové zrno |
| `PostProcessEffectType.RadialBlur` | Radiální rozmazání |
| `PostProcessEffectType.ChromAber` | Chromatická aberace |
| `PostProcessEffectType.WetEffect` | Efekt mokrého objektivu |
| `PostProcessEffectType.ColorGrading` | Barevné korekce / LUT |
| `PostProcessEffectType.DepthOfField` | Hloubka ostrosti |
| `PostProcessEffectType.SSAO` | Ambientní okluze v prostoru obrazovky |
| `PostProcessEffectType.GodRays` | Objemové světlo |
| `PostProcessEffectType.Rain` | Déšť na obrazovce |
| `PostProcessEffectType.Vignette` | Překrytí viněty |
| `PostProcessEffectType.HBAO` | Ambientní okluze na základě horizontu |

---

## Použití vestavěných requesterů

### Rozmazání inventáře

Nejjednodušší příklad --- rozmazání, které se objeví při otevření inventáře:

```c
// Spustit rozmazání
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Zastavit rozmazání
blurReq.Stop();
```

### Efekt zábleskového granátu

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// Zastavit po zpoždění
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## Vytvoření vlastního PPE requesteru

Pro vytvoření vlastních post-processingových efektů rozšiřte `PPERequester` a zaregistrujte jej.

### Krok 1: Definujte requester

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // Aplikovat silnou vinětu
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // Desaturovat barvy
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // Resetovat na výchozí
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### Krok 2: Registrace a použití

Registrace se provádí přidáním requesteru do banky. V praxi většina modderů používá vestavěné requestery a upravuje jejich parametry místo vytváření plně vlastních.

---

## Noční vidění (NVG)

Noční vidění je implementováno jako PPE efekt. Příslušný requester je `REQ_CAMERANV`:

```c
// Povolit efekt NVG
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// Zakázat efekt NVG
nvgReq.Stop();
```

Skutečné NVG ve hře je spouštěno předmětem NVGoggles prostřednictvím jeho `ComponentEnergyManager` a metody `NVGoggles.ToggleNVG()`, která interně ovládá systém PPE.

---

## Barevné korekce

Barevné korekce mění celkový barevný vzhled scény:

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// Upravit saturaci (1.0 = normální, 0.0 = stupně šedi, >1.0 = přesycené)
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## Efekty rozmazání

### Gaussovské rozmazání

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Upravit intenzitu rozmazání (0.0 = žádné, vyšší = větší rozmazání)
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### Radiální rozmazání

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## Prioritní vrstvy

Když více requesterů modifikuje stejný parametr, prioritní vrstva určuje, který vyhraje:

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // Nejnižší priorita (statické efekty)
    static const int L_1_VALUES   = 1;   // Dynamické změny hodnot
    static const int L_2_SCRIPTS  = 2;   // Efekty řízené skriptem
    static const int L_3_EFFECTS  = 3;   // Herní efekty
    static const int L_4_OVERLAY  = 4;   // Překryvné efekty
    static const int L_LAST       = 100;  // Nejvyšší priorita (přepsat vše)
}
```

Vyšší čísla mají přednost. Použijte `PPEManager.L_LAST` pro vynucení přepsání všech ostatních efektů.

---

## Shrnutí

| Koncept | Klíčový bod |
|---------|-------------|
| Přístup | `PPERequesterBank.GetRequester(KONSTANTA)` |
| Spuštění/Zastavení | `requester.Start()` / `requester.Stop()` |
| Parametry | `SetTargetValueFloat(materiál, parametr, relativní, hodnota, vrstva, operátor)` |
| Operátory | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| Běžné efekty | Rozmazání, viněta, saturace, NVG, zábleskový granát, zrno, chromatická aberace |
| NVG | Requester `REQ_CAMERANV` |
| Priorita | Vrstvy 0-100; vyšší číslo vyhrává konflikty |
| Vlastní | Rozšířit `PPERequester`, přepsat `OnStart()` / `OnStop()` |

---

## Osvědčené postupy

- **Vždy volejte `Stop()` pro úklid vašeho requesteru.** Nezastavení PPE requesteru ponechá jeho vizuální efekt trvale aktivní, i po skončení spouštěcí podmínky.
- **Používejte vhodné prioritní vrstvy.** Herní efekty by měly používat `L_3_EFFECTS` nebo vyšší. Použití `L_LAST` (100) přepíše vše včetně vanilla efektů bezvědomí a smrti, což může narušit zážitek hráče.
- **Upřednostňujte vestavěné requestery před vlastními.** `PPERequesterBank` již obsahuje requestery pro rozmazání, desaturaci, vinětu a zrno. Znovu je použijte s upravenými parametry před vytvořením vlastní třídy requesteru.
- **Testujte PPE efekty za různých světelných podmínek.** Viněta a desaturace vypadají drasticky odlišně v noci oproti dni. Ověřte, že váš efekt je čitelný v obou extrémech.
- **Vyhněte se vrstvení více vysoce intenzivních efektů rozmazání.** Více aktivních requesterů rozmazání se kumuluje, což může učinit obrazovku nečitelnou. Kontrolujte `IsActiveRequester()` před spuštěním dalších efektů.

---

## Kompatibilita a dopad

- **Multi-Mod:** Více modů může aktivovat PPE requestery současně. Engine je prolíná pomocí prioritních vrstev a operátorů. Konflikty nastávají, když dva mody používají stejnou prioritní úroveň s `PPOperators.SET` na stejném parametru -- poslední zápis vyhrává.
- **Výkon:** PPE efekty jsou GPU-vázané post-processingové průchody. Povolení mnoha současných efektů (rozmazání + zrno + chromatická aberace + viněta) může snížit snímkovou frekvenci na slabších GPU. Udržujte aktivní efekty na minimu.
- **Server/Klient:** PPE je zcela na straně klientského renderingu. Server nemá žádné znalosti o post-processingových efektech. Nikdy nepodmiňujte serverovou logiku stavem PPE.

---

[<< Předchozí: Kamery](04-cameras.md) | **Post-processingové efekty** | [Další: Notifikace >>](06-notifications.md)
