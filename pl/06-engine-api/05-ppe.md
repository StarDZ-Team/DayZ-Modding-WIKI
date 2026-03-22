# Rozdział 6.5: Efekty post-processingu (PPE)

[Strona główna](../README.md) | [<< Poprzedni: Kamery](04-cameras.md) | **Efekty post-processingu** | [Następny: Powiadomienia >>](06-notifications.md)

---

## Wprowadzenie

System efektów post-processingu (PPE) w DayZ kontroluje efekty wizualne stosowane po renderowaniu sceny: rozmycie, korekcję kolorów, winietowanie, aberrację chromatyczną, noktowizję i inne. System jest zbudowany wokół klas `PPERequester`, które mogą żądać określonych efektów wizualnych. Wiele requesterów może być aktywnych jednocześnie, a silnik łączy ich wkład. Ten rozdział opisuje, jak używać systemu PPE w modach.

---

## Przegląd architektury

```
PPEManager
├── PPERequesterBank              // Statyczny rejestr wszystkich dostępnych requesterów
│   ├── REQ_INVENTORYBLUR         // Rozmycie ekwipunku
│   ├── REQ_MENUEFFECTS           // Efekty menu
│   ├── REQ_CONTROLLERDISCONNECT  // Nakładka odłączenia kontrolera
│   ├── REQ_UNCONSCIOUS           // Efekt nieprzytomności
│   ├── REQ_FEVEREFFECTS          // Efekty wizualne gorączki
│   ├── REQ_FLASHBANGEFFECTS      // Granat błyskowy
│   ├── REQ_BURLAPSACK            // Worek na głowie
│   ├── REQ_DEATHEFFECTS          // Ekran śmierci
│   ├── REQ_BLOODLOSS             // Desaturacja utraty krwi
│   └── ... (i wiele innych)
└── PPERequester_*                // Poszczególne implementacje requesterów
```

---

## PPEManager

`PPEManager` to singleton koordynujący wszystkie aktywne żądania PPE. Rzadko wchodzisz z nim w interakcję bezpośrednio --- zamiast tego pracujesz przez podklasy `PPERequester`.

```c
// Pobranie instancji menedżera
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**Plik:** `3_Game/PPE/pperequesterbank.c`

Statyczny rejestr przechowujący instancje wszystkich requesterów PPE. Dostęp do konkretnych requesterów odbywa się przez ich stały indeks.

### Pobieranie requestera

```c
// Pobranie requestera przez jego stałą bankową
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### Typowe stałe requesterów

| Stała | Efekt |
|-------|-------|
| `REQ_INVENTORYBLUR` | Rozmycie gaussowskie przy otwartym ekwipunku |
| `REQ_MENUEFFECTS` | Rozmycie tła menu |
| `REQ_UNCONSCIOUS` | Efekt nieprzytomności (rozmycie + desaturacja) |
| `REQ_DEATHEFFECTS` | Ekran śmierci (skala szarości + winieta) |
| `REQ_BLOODLOSS` | Desaturacja utraty krwi |
| `REQ_FEVEREFFECTS` | Aberracja chromatyczna gorączki |
| `REQ_FLASHBANGEFFECTS` | Oślepienie granatem błyskowym |
| `REQ_BURLAPSACK` | Zaślepienie workiem |
| `REQ_PAINBLUR` | Efekt rozmycia bólu |
| `REQ_CONTROLLERDISCONNECT` | Nakładka odłączenia kontrolera |
| `REQ_CAMERANV` | Noktowizja |
| `REQ_FILMGRAINEFFECTS` | Nakładka ziarna filmowego |
| `REQ_RAINEFFECTS` | Efekty deszczu na ekranie |
| `REQ_COLORSETTING` | Ustawienia korekcji kolorów |

---

## Baza PPERequester

Wszystkie requestery PPE rozszerzają `PPERequester`:

```c
class PPERequester : Managed
{
    // Uruchom efekt
    void Start(Param par = null);

    // Zatrzymaj efekt
    void Stop(Param par = null);

    // Sprawdź czy aktywny
    bool IsActiveRequester();

    // Ustaw wartości parametrów materiału
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
    static const int SET          = 0;  // Bezpośrednie ustawienie wartości
    static const int ADD          = 1;  // Dodaj do aktualnej wartości
    static const int ADD_RELATIVE = 2;  // Dodaj relatywnie do aktualnej
    static const int HIGHEST      = 3;  // Użyj wyższej z aktualnej i nowej
    static const int LOWEST       = 4;  // Użyj niższej z aktualnej i nowej
    static const int MULTIPLY     = 5;  // Pomnóż aktualną wartość
    static const int OVERRIDE     = 6;  // Wymuś nadpisanie
}
```

---

## Typowe identyfikatory materiałów PPE

Efekty celują w określone materiały post-processingu. Typowe identyfikatory materiałów:

| Stała | Materiał |
|-------|----------|
| `PostProcessEffectType.Glow` | Bloom / poświata |
| `PostProcessEffectType.FilmGrain` | Ziarno filmowe |
| `PostProcessEffectType.RadialBlur` | Rozmycie radialne |
| `PostProcessEffectType.ChromAber` | Aberracja chromatyczna |
| `PostProcessEffectType.WetEffect` | Efekt mokrego obiektywu |
| `PostProcessEffectType.ColorGrading` | Korekcja kolorów / LUT |
| `PostProcessEffectType.DepthOfField` | Głębia ostrości |
| `PostProcessEffectType.SSAO` | Okluzja otoczenia w przestrzeni ekranu |
| `PostProcessEffectType.GodRays` | Światło wolumetryczne |
| `PostProcessEffectType.Rain` | Deszcz na ekranie |
| `PostProcessEffectType.Vignette` | Nakładka winiety |
| `PostProcessEffectType.HBAO` | Okluzja otoczenia oparta na horyzoncie |

---

## Korzystanie z wbudowanych requesterów

### Rozmycie ekwipunku

Najprostszy przykład --- rozmycie pojawiające się przy otwarciu ekwipunku:

```c
// Uruchom rozmycie
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Zatrzymaj rozmycie
blurReq.Stop();
```

### Efekt granatu błyskowego

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// Zatrzymaj po opóźnieniu
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## Tworzenie własnego requestera PPE

Aby stworzyć niestandardowe efekty post-processingu, rozszerz `PPERequester` i zarejestruj go.

### Krok 1: Zdefiniuj requester

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // Zastosuj silną winietę
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // Desaturuj kolory
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // Przywróć domyślne
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### Krok 2: Rejestracja i użycie

Rejestracja odbywa się przez dodanie requestera do banku. W praktyce większość modderów korzysta z wbudowanych requesterów i modyfikuje ich parametry zamiast tworzyć w pełni niestandardowe.

---

## Noktowizja (NVG)

Noktowizja jest zaimplementowana jako efekt PPE. Odpowiedni requester to `REQ_CAMERANV`:

```c
// Włącz efekt NVG
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// Wyłącz efekt NVG
nvgReq.Stop();
```

Rzeczywiste NVG w grze jest uruchamiane przez przedmiot NVGoggles poprzez jego `ComponentEnergyManager` i metodę `NVGoggles.ToggleNVG()`, która wewnętrznie steruje systemem PPE.

---

## Korekcja kolorów

Korekcja kolorów modyfikuje ogólny wygląd kolorystyczny sceny:

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// Dostosuj saturację (1.0 = normalna, 0.0 = skala szarości, >1.0 = przesycenie)
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## Efekty rozmycia

### Rozmycie gaussowskie

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Dostosuj intensywność rozmycia (0.0 = brak, wyższe = więcej rozmycia)
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### Rozmycie radialne

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## Warstwy priorytetowe

Gdy wiele requesterów modyfikuje ten sam parametr, warstwa priorytetowa określa, który wygrywa:

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // Najniższy priorytet (efekty statyczne)
    static const int L_1_VALUES   = 1;   // Dynamiczne zmiany wartości
    static const int L_2_SCRIPTS  = 2;   // Efekty sterowane skryptami
    static const int L_3_EFFECTS  = 3;   // Efekty rozgrywkowe
    static const int L_4_OVERLAY  = 4;   // Efekty nakładkowe
    static const int L_LAST       = 100;  // Najwyższy priorytet (nadpisz wszystko)
}
```

Wyższe numery mają priorytet. Użyj `PPEManager.L_LAST`, aby wymusić nadpisanie wszystkich innych efektów.

---

## Podsumowanie

| Koncept | Kluczowy punkt |
|---------|----------------|
| Dostęp | `PPERequesterBank.GetRequester(STAŁA)` |
| Start/Stop | `requester.Start()` / `requester.Stop()` |
| Parametry | `SetTargetValueFloat(materiał, parametr, relatywny, wartość, warstwa, operator)` |
| Operatory | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| Typowe efekty | Rozmycie, winieta, saturacja, NVG, granat błyskowy, ziarno, aberracja chromatyczna |
| NVG | Requester `REQ_CAMERANV` |
| Priorytet | Warstwy 0-100; wyższy numer wygrywa konflikty |
| Własny | Rozszerz `PPERequester`, nadpisz `OnStart()` / `OnStop()` |

---

## Dobre praktyki

- **Zawsze wywołuj `Stop()` aby posprzątać po swoim requesterze.** Niezatrzymanie requestera PPE pozostawia jego efekt wizualny na stałe aktywny, nawet po zakończeniu warunku wyzwalającego.
- **Używaj odpowiednich warstw priorytetowych.** Efekty rozgrywkowe powinny używać `L_3_EFFECTS` lub wyższych. Użycie `L_LAST` (100) nadpisuje wszystko, w tym efekty vanilla nieprzytomności i śmierci, co może zepsuć doświadczenie gracza.
- **Preferuj wbudowane requestery nad niestandardowymi.** `PPERequesterBank` już zawiera requestery dla rozmycia, desaturacji, winiety i ziarna. Użyj ich ponownie z dostosowanymi parametrami przed tworzeniem niestandardowej klasy requestera.
- **Testuj efekty PPE w różnych warunkach oświetleniowych.** Winieta i desaturacja wyglądają drastycznie różnie w nocy w porównaniu z dniem. Sprawdź, czy efekt jest czytelny w obu skrajnościach.
- **Unikaj nakładania wielu intensywnych efektów rozmycia.** Wiele aktywnych requesterów rozmycia kumuluje się, potencjalnie czyniąc ekran nieczytelnym. Sprawdzaj `IsActiveRequester()` przed uruchomieniem dodatkowych efektów.

---

## Kompatybilność i wpływ

- **Multi-Mod:** Wiele modów może aktywować requestery PPE jednocześnie. Silnik łączy je za pomocą warstw priorytetowych i operatorów. Konflikty występują, gdy dwa mody używają tego samego poziomu priorytetu z `PPOperators.SET` na tym samym parametrze -- ostatni zapis wygrywa.
- **Wydajność:** Efekty PPE to przebiegi post-processingu obciążające GPU. Włączenie wielu jednoczesnych efektów (rozmycie + ziarno + aberracja chromatyczna + winieta) może obniżyć liczbę klatek na sekundę na słabszych GPU. Utrzymuj aktywne efekty na minimum.
- **Serwer/Klient:** PPE to w całości renderowanie po stronie klienta. Serwer nie ma wiedzy o efektach post-processingu. Nigdy nie uzależniaj logiki serwerowej od stanu PPE.

---

[<< Poprzedni: Kamery](04-cameras.md) | **Efekty post-processingu** | [Następny: Powiadomienia >>](06-notifications.md)
