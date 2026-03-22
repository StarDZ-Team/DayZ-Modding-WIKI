# Kapitola 4.3: Materiály (.rvmat)

[Domů](../../README.md) | [<< Předchozí: 3D modely](02-models.md) | **Materiály** | [Další: Zvuk >>](04-audio.md)

---

## Úvod

Materiál v DayZ je most mezi 3D modelem a jeho vizuálním vzhledem. Zatímco textury poskytují surová obrazová data, soubor **RVMAT** (Real Virtuality Material) definuje, jak jsou tyto textury kombinovány, který shader je interpretuje a jaké povrchové vlastnosti by měl engine simulovat -- lesklost, průhlednost, samozáření a další. Každá plocha na každém P3D modelu ve hře odkazuje na soubor RVMAT a pochopení jejich vytváření a konfigurace je nezbytné pro jakýkoli vizuální mod.

Tato kapitola pokrývá formát souboru RVMAT, typy shaderů, konfiguraci fází textur, vlastnosti materiálů, systém výměny materiálů podle úrovně poškození a praktické příklady čerpané z DayZ-Samples.

---

## Přehled formátu RVMAT

Soubor **RVMAT** je textový konfigurační soubor (ne binární), který definuje materiál. Navzdory vlastní příponě je formát prostý text používající konfigurační syntaxi Bohemie s třídami a páry klíč-hodnota.

### Klíčové vlastnosti

- **Textový formát:** Editovatelný v jakémkoli textovém editoru (Notepad++, VS Code).
- **Vazba na shader:** Každý RVMAT specifikuje, který renderovací shader použít.
- **Mapování textur:** Definuje, které soubory textur jsou přiřazeny kterým vstupům shaderu (difuzní, normálová, spekulární atd.).
- **Vlastnosti povrchu:** Řídí intenzitu odlesků, emisivní záření, průhlednost a další.
- **Odkazován P3D modely:** Plochám v Resolution LOD Object Builderu je přiřazen RVMAT. Engine načte RVMAT a všechny textury, na které odkazuje.
- **Odkazován config.cpp:** `hiddenSelectionsMaterials[]` může přepsat materiály za běhu.

### Konvence cest

Soubory RVMAT žijí vedle svých textur, typicky v adresáři `data/`:

```
MyMod/
  data/
    my_item.rvmat              <-- Definice materiálu
    my_item_co.paa             <-- Difuzní textura (odkazovaná RVMAT)
    my_item_nohq.paa           <-- Normálová mapa (odkazovaná RVMAT)
    my_item_smdi.paa           <-- Spekulární mapa (odkazovaná RVMAT)
```

---

## Struktura souboru

Soubor RVMAT má konzistentní strukturu. Zde je kompletní, anotovaný příklad:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};        // Násobič barvy okolního světla (RGBA)
diffuse[] = {1.0, 1.0, 1.0, 1.0};        // Násobič barvy difuzního světla (RGBA)
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};  // Aditivní přepis difuze
emmisive[] = {0.0, 0.0, 0.0, 0.0};       // Emisivní (samozáření) barva
specular[] = {0.7, 0.7, 0.7, 1.0};       // Barva spekulárního odlesku
specularPower = 80;                        // Ostrost spekulárních odlesků (vyšší = těsnější odlesk)
PixelShaderID = "Super";                   // Program pixel shaderu
VertexShaderID = "Super";                  // Program vertex shaderu

class Stage1                               // Fáze textury: Normálová mapa
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2                               // Fáze textury: Difuzní/barevná mapa
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3                               // Fáze textury: Spekulární/kovová mapa
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

---

## Typy shaderů

Hodnoty `PixelShaderID` a `VertexShaderID` určují, který renderovací pipeline zpracovává materiál. Oba by měly být obvykle nastaveny na stejnou hodnotu.

### Dostupné shadery

| Shader | Případ použití | Požadované fáze textur |
|--------|----------|------------------------|
| **Super** | Standardní neprůhledné povrchy (zbraně, oblečení, předměty) | Normálová, difuzní, spekulární/kovová |
| **Multi** | Vícevrstevný terén a složité povrchy | Více difuzních/normálových párů |
| **Glass** | Průhledné a poloprůhledné povrchy | Difuzní s alfou |
| **Water** | Vodní povrchy s odrazem a lomem | Speciální textury vody |
| **Terrain** | Povrchy terénu | Satelit, maska, vrstvy materiálů |
| **AlphaTest** | Tvrdá průhlednost (listí, ploty) | Difuzní s alfou |
| **AlphaBlend** | Hladká průhlednost (sklo, kouř) | Difuzní s alfou |

### Shader Super (nejběžnější)

Shader **Super** je standardní fyzikálně založený renderovací shader používaný pro naprostou většinu předmětů v DayZ. Očekává tři fáze textur:

```
Stage1 = Normálová mapa (_nohq)
Stage2 = Difuzní/barevná mapa (_co)
Stage3 = Spekulární/kovová mapa (_smdi)
```

Pokud vytváříte modový předmět (zbraň, oblečení, nástroj, kontejner), téměř vždy budete používat shader Super.

---

## Fáze textur

Každá třída `Stage` v RVMAT přiřazuje texturu specifickému vstupu shaderu. Číslo fáze určuje, jakou roli textura hraje.

### Přiřazení fází pro shader Super

| Fáze | Role textury | Typická přípona | Popis |
|-------|-------------|----------------|-------------|
| **Stage1** | Normálová mapa | `_nohq` | Detail povrchu, nerovnosti, drážky |
| **Stage2** | Difuzní / barevná mapa | `_co` nebo `_ca` | Základní barva povrchu |
| **Stage3** | Spekulární / kovová mapa | `_smdi` | Lesklost, kovové vlastnosti, detail |
| **Stage4** | Okolní stín | `_as` | Předpečená okolní okluze (volitelné) |
| **Stage5** | Makro mapa | `_mc` | Velkoplošná barevná variace (volitelné) |
| **Stage6** | Detailní mapa | `_de` | Dlaždicový mikro-detail (volitelné) |
| **Stage7** | Emisivní / světelná mapa | `_li` | Samozáření (volitelné) |

---

## Vlastnosti materiálu

### Řízení spekuláru

Hodnoty `specular[]` a `specularPower` spolupracují na definici toho, jak lesklý povrch vypadá:

| Typ materiálu | specular[] | specularPower | Vzhled |
|---------------|-----------|---------------|------------|
| **Matný plast** | `{0.1, 0.1, 0.1, 1.0}` | 10 | Matný, široký odlesk |
| **Opotřebovaný kov** | `{0.3, 0.3, 0.3, 1.0}` | 40 | Mírný lesk |
| **Leštěný kov** | `{0.8, 0.8, 0.8, 1.0}` | 120 | Jasný, těsný odlesk |
| **Chrom** | `{1.0, 1.0, 1.0, 1.0}` | 200 | Zrcadlový odraz |
| **Guma** | `{0.02, 0.02, 0.02, 1.0}` | 5 | Téměř žádný odlesk |
| **Mokrý povrch** | `{0.6, 0.6, 0.6, 1.0}` | 80 | Kluzký, středně ostrý odlesk |

### Emisivní (samozáření)

Aby povrch svítil (LED světla, obrazovky, svítící prvky):

```cpp
emmisive[] = {0.2, 0.8, 0.2, 1.0};   // Zelená záře
```

Emisivní barva se přidá ke konečné barvě pixelu bez ohledu na osvětlení. Emisivní mapa `_li` v pozdější fázi textury může maskovat, které části povrchu svítí.

> **Poznámka:** Bohemia používá překlep `emmisive` (dvojité m, jedno s). Použití správného anglického pravopisu `emissive` nebude fungovat.

---

## Úrovně zdraví (výměny materiálů při poškození)

Předměty DayZ se časem degradují. Engine podporuje automatickou výměnu materiálů při různých prazích poškození, definovaných v `config.cpp` pomocí pole `healthLevels[]`. To vytváří vizuální progresi od nedotčeného po zničený.

### Struktura healthLevels[]

```cpp
class MyItem: Inventory_Base
{
    healthLevels[] =
    {
        {1.0, {"MyMod\data\my_item.rvmat"}},           // Nedotčený (100% zdraví)
        {0.7, {"MyMod\data\my_item_worn.rvmat"}},       // Opotřebovaný (70% zdraví)
        {0.5, {"MyMod\data\my_item_damaged.rvmat"}},     // Poškozený (50% zdraví)
        {0.3, {"MyMod\data\my_item_badly_damaged.rvmat"}},// Vážně poškozený (30% zdraví)
        {0.0, {"MyMod\data\my_item_ruined.rvmat"}}       // Zničený (0% zdraví)
    };
};
```

### Jak to funguje

1. Engine sleduje hodnotu zdraví předmětu (0.0 až 1.0).
2. Když zdraví klesne pod práh, engine vymění materiál za odpovídající RVMAT.
3. Každý RVMAT může odkazovat na jiné textury -- typicky postupně více poškozené varianty.
4. Výměna je automatická. Není potřeba žádný skriptový kód.

---

## Jak materiály odkazují na textury

Spojení mezi modely, materiály a texturami tvoří řetězec:

```
P3D model (Object Builder)
  |
  |--> Plocha přiřazena RVMAT
         |
         |--> Stage1.texture = "cesta\k\normal_nohq.paa"
         |--> Stage2.texture = "cesta\k\color_co.paa"
         |--> Stage3.texture = "cesta\k\specular_smdi.paa"
```

### Řešení cest

Všechny cesty textur v souborech RVMAT jsou relativní ke kořeni **disku P:**:

```cpp
// Správně: relativní k disku P:
texture = "MyMod\data\textures\my_item_co.paa";

// To znamená: P:\MyMod\data\textures\my_item_co.paa
```

---

## Vytvoření RVMAT od nuly

### Krok za krokem: Standardní neprůhledný předmět

1. **Vytvořte soubory textur:**
   - `my_item_co.paa` (difuzní barva)
   - `my_item_nohq.paa` (normálová mapa)
   - `my_item_smdi.paa` (spekulární/kovová)

2. **Vytvořte soubor RVMAT** (prostý text):

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.5, 0.5, 0.5, 1.0};
specularPower = 60;
PixelShaderID = "Super";
VertexShaderID = "Super";

class Stage1
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

3. **Přiřaďte v Object Builderu:**
   - Otevřete svůj model P3D.
   - Vyberte plochy v Resolution LOD.
   - Klikněte pravým --> **Face Properties**.
   - Přejděte k vašemu souboru RVMAT.

4. **Testujte ve hře** přes file patching nebo sestavení PBO.

---

## Časté chyby

### 1. Špatné pořadí fází

**Příznak:** Textura se zobrazuje zkomoleně, normálová mapa se zobrazuje jako barva, barva se zobrazuje jako nerovnosti.
**Oprava:** Ujistěte se, že Stage1 = normálová, Stage2 = difuzní, Stage3 = spekulární (pro shader Super).

### 2. Překlep `emmisive`

**Příznak:** Emisivní efekt nefunguje.
**Oprava:** Bohemia používá `emmisive` (dvojité m, jedno s). Použití správného anglického pravopisu `emissive` nebude fungovat. Toto je známá historická zvláštnost.

### 3. Nesoulad cesty textury

**Příznak:** Model se zobrazuje s výchozím šedým nebo magentovým materiálem.
**Oprava:** Ověřte, že cesty textur v RVMAT přesně odpovídají umístění souborů relativně k disku P:. Cesty používají zpětná lomítka. Zkontrolujte velikost písmen -- některé systémy rozlišují velká a malá písmena.

### 4. Chybějící přiřazení RVMAT v P3D

**Příznak:** Model se vykresluje bez materiálu (plochá šedá nebo výchozí shader).
**Oprava:** Otevřete model v Object Builderu, vyberte plochy a přiřaďte RVMAT přes **Face Properties**.

### 5. Použití špatného shaderu pro průhledné předměty

**Příznak:** Průhledná textura se zobrazuje jako neprůhledná nebo celý povrch zmizí.
**Oprava:** Pro průhledné povrchy použijte shader `Glass`, `AlphaTest` nebo `AlphaBlend` místo `Super`. Používejte textury s příponou `_ca` se správnými alfa kanály.

---

## Osvědčené postupy

1. **Začněte od fungujícího příkladu.** Zkopírujte RVMAT z DayZ-Samples nebo vanilla předmětu a upravte ho. Začínání od nuly zvyšuje riziko překlepů.

2. **Uchovávejte materiály a textury pohromadě.** Ukládejte RVMAT do stejného adresáře `data/` jako jeho textury. To činí vztah zřejmým a zjednodušuje správu cest.

3. **Používejte shader Super, pokud nemáte důvod jinak.** Správně zvládá 95% případů použití.

4. **Vytvořte materiály poškození i pro jednoduché předměty.** Hráči si všimnou, když se předměty vizuálně nedegradují. Minimálně použijte vanilla výchozí materiály poškození pro nižší úrovně zdraví.

5. **Testujte spekulár ve hře, nejen v Object Builderu.** Osvětlení editoru a osvětlení ve hře produkují velmi odlišné výsledky. Co vypadá perfektně v Object Builderu, může být příliš lesklé nebo příliš matné pod dynamickým osvětlením DayZ.

6. **Dokumentujte svá nastavení materiálů.** Když najdete hodnoty spekuláru/výkonu, které fungují dobře pro typ povrchu, zaznamenejte je. Tato nastavení budete opakovaně používat napříč mnoha předměty.

---

## Pozorováno v reálných modech

| Vzor | Mod | Detail |
|---------|-----|--------|
| Sdílené RVMAT poškození napříč všemi předměty | Expansion (více modulů) | Znovupoužívá společnou sadu RVMAT úrovní poškození (`worn`, `damaged`, `ruined`) místo variant pro jednotlivé předměty pro snížení počtu souborů |
| Emisivní materiály pro záři obrazovky | COT (Admin Tools) | Používá hodnoty `emmisive[]` v RVMAT pro efekty obrazovky tabletu/zařízení viditelné v noci |
| Shader Glass pro okna vozidel | DayZ-Samples (Test_Vehicle) | Demonstruje `PixelShaderID = "Glass"` s texturami `_ca` pro průhledné panely čelního skla |

---

## Kompatibilita a dopad

- **Více modů:** Cesty RVMAT jsou per-PBO a nekolidují napříč mody. Nicméně přepisy `hiddenSelectionsMaterials[]` v config.cpp následují prioritu poslední-načtený-vyhrává, takže dva mody přepisující materiál stejného vanilla předmětu budou v konfliktu.
- **Výkon:** Každý unikátní RVMAT odkazovaný na jednom P3D modelu vytváří oddělený draw call. Konsolidace ploch pod méně materiály snižuje režii GPU, zejména pro složité scény.
- **Verze:** Textový formát RVMAT a názvy shaderů (Super, Glass, AlphaTest) jsou stabilní od DayZ 1.0. V nedávných aktualizacích nebyly zavedeny žádné strukturální změny.

---

## Navigace

| Předchozí | Nahoru | Další |
|----------|----|------|
| [4.2 3D modely](02-models.md) | [Část 4: Formáty souborů a DayZ Tools](01-textures.md) | [4.4 Zvuk](04-audio.md) |
