# Kapitola 5.2: inputs.xml --- Vlastní klávesové zkratky

[Domů](../README.md) | [<< Předchozí: stringtable.csv](01-stringtable.md) | **inputs.xml** | [Další: Credits.json >>](03-credits-json.md)

---

> **Shrnutí:** Soubor `inputs.xml` umožňuje vašemu modu registrovat vlastní klávesové zkratky, které se zobrazí v menu Nastavení > Ovládání hráče. Hráči mohou tyto vstupy prohlížet, přebindovat a přepínat stejně jako vanilkové akce. Toto je standardní mechanismus pro přidávání klávesových zkratek do modů DayZ.

---

## Obsah

- [Přehled](#přehled)
- [Umístění souboru](#umístění-souboru)
- [Kompletní struktura XML](#kompletní-struktura-xml)
- [Blok Actions](#blok-actions)
- [Blok Sorting](#blok-sorting)
- [Blok Preset (výchozí klávesové zkratky)](#blok-preset-výchozí-klávesové-zkratky)
- [Kombinace s modifikátory](#kombinace-s-modifikátory)
- [Skryté vstupy](#skryté-vstupy)
- [Více výchozích kláves](#více-výchozích-kláves)
- [Přístup ke vstupům ve skriptu](#přístup-ke-vstupům-ve-skriptu)
- [Reference vstupních metod](#reference-vstupních-metod)
- [Potlačení a deaktivace vstupů](#potlačení-a-deaktivace-vstupů)
- [Reference názvů kláves](#reference-názvů-kláves)
- [Reálné příklady](#reálné-příklady)
- [Časté chyby](#časté-chyby)

---

## Přehled

Když váš mod potřebuje, aby hráč stiskl klávesu --- otevření menu, přepnutí funkce, vydání příkazu AI jednotce --- registrujete vlastní vstupní akci v `inputs.xml`. Engine čte tento soubor při startu a integruje vaše akce do univerzálního vstupního systému. Hráči vidí vaše klávesové zkratky v herním menu Nastavení > Ovládání, seskupené pod nadpisem, který definujete.

Vlastní vstupy jsou identifikovány unikátním názvem akce (konvenčně s předponou `UA` pro "User Action") a mohou mít výchozí klávesové zkratky, které si hráči mohou přebindovat dle libosti.

---

## Umístění souboru

Umístěte `inputs.xml` do podsložky `data` vašeho adresáře Scripts:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        data/
          inputs.xml        <-- Zde
        3_Game/
        4_World/
        5_Mission/
```

Některé mody ho umisťují přímo do složky `Scripts/`. Obě umístění fungují. Engine objeví soubor automaticky --- žádná registrace v config.cpp není potřeba.

---

## Kompletní struktura XML

Soubor `inputs.xml` má tři sekce, všechny obalené kořenovým elementem `<modded_inputs>`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <!-- Definice akcí sem -->
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <!-- Pořadí řazení pro menu nastavení -->
        </sorting>
    </inputs>
    <preset>
        <!-- Výchozí přiřazení kláves sem -->
    </preset>
</modded_inputs>
```

Všechny tři sekce --- `<actions>`, `<sorting>` a `<preset>` --- spolupracují, ale slouží odlišným účelům.

---

## Blok Actions

Blok `<actions>` deklaruje každou vstupní akci, kterou váš mod poskytuje. Každá akce je jeden element `<input>`.

### Syntaxe

```xml
<actions>
    <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
    <input name="UAMyModToggleHUD" loc="STR_MYMOD_INPUT_TOGGLE_HUD" />
</actions>
```

### Atributy

| Atribut | Povinný | Popis |
|---------|---------|-------|
| `name` | Ano | Unikátní identifikátor akce. Konvence: předpona `UA` (User Action). Používá se ve skriptech pro dotazování tohoto vstupu. |
| `loc` | Ne | Klíč stringtable pro zobrazovaný název v menu Ovládání. **Bez předpony `#`** --- systém ji přidává sám. |
| `visible` | Ne | Nastavte na `"false"` pro skrytí z menu Ovládání. Výchozí hodnota je `true`. |

### Konvence pojmenování

Názvy akcí musí být globálně unikátní napříč všemi načtenými mody. Používejte předponu svého modu:

```xml
<input name="UAMyModAdminPanel" loc="STR_MYMOD_INPUT_ADMIN_PANEL" />
<input name="UAExpansionBookToggle" loc="STR_EXPANSION_BOOK_TOGGLE" />
<input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU" />
```

Předpona `UA` je konvenční, ale není vynucená. Expansion AI používá `eAI` jako svou předponu, což také funguje.

---

## Blok Sorting

Blok `<sorting>` řídí, jak se vaše vstupy zobrazují v nastavení Ovládání hráče. Definuje pojmenovanou skupinu (která se stane záhlavím sekce) a vypisuje vstupy v pořadí zobrazení.

### Syntaxe

```xml
<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModOpenMenu" />
    <input name="UAMyModToggleHUD" />
    <input name="UAMyModSpecialAction" />
</sorting>
```

### Atributy

| Atribut | Povinný | Popis |
|---------|---------|-------|
| `name` | Ano | Interní identifikátor pro tuto skupinu řazení |
| `loc` | Ano | Klíč stringtable pro záhlaví skupiny zobrazené v Nastavení > Ovládání |

### Jak to vypadá

V nastavení Ovládání hráč vidí:

```
[MyMod]                          <-- z loc v sorting
  Open Menu .............. [Y]   <-- z loc ve vstupu + preset
  Toggle HUD ............. [H]   <-- z loc ve vstupu + preset
```

Pouze vstupy uvedené v bloku `<sorting>` se zobrazí v menu nastavení. Vstupy definované v `<actions>`, ale neuvedené v `<sorting>`, jsou tiše zaregistrovány, ale pro hráče neviditelné (i když `visible` není explicitně nastaveno na `false`).

---

## Blok Preset (výchozí klávesové zkratky)

Blok `<preset>` přiřazuje výchozí klávesy vašim akcím. Toto jsou klávesy, se kterými hráč začíná před jakýmkoli přizpůsobením.

### Jednoduché přiřazení klávesy

```xml
<preset>
    <input name="UAMyModOpenMenu">
        <btn name="kY"/>
    </input>
</preset>
```

Toto přiřadí klávesu `Y` jako výchozí pro `UAMyModOpenMenu`.

### Bez výchozí klávesy

Pokud vynecháte akci z bloku `<preset>`, nemá žádné výchozí přiřazení. Hráč musí ručně přiřadit klávesu v Nastavení > Ovládání. To je vhodné pro volitelné nebo pokročilé zkratky.

---

## Kombinace s modifikátory

Pro vyžadování modifikační klávesy (Ctrl, Shift, Alt) vnořte elementy `<btn>`:

### Ctrl + levé tlačítko myši

```xml
<input name="eAISetWaypoint">
    <btn name="kLControl">
        <btn name="mBLeft"/>
    </btn>
</input>
```

Vnější `<btn>` je modifikátor; vnitřní `<btn>` je primární klávesa. Hráč musí podržet modifikátor a pak stisknout primární klávesu.

### Shift + klávesa

```xml
<input name="UAMyModQuickAction">
    <btn name="kLShift">
        <btn name="kQ"/>
    </btn>
</input>
```

### Pravidla vnořování

- **Vnější** `<btn>` je vždy modifikátor (podržený)
- **Vnitřní** `<btn>` je spouštěč (stisknutý při podržení modifikátoru)
- Typická je pouze jedna úroveň vnořování; hlubší vnořování je netestované a nedoporučované

---

## Skryté vstupy

Použijte `visible="false"` k registraci vstupu, který hráč nemůže vidět ani přebindovat v menu Ovládání. To je užitečné pro interní vstupy používané kódem vašeho modu, které by neměly být konfigurovatelné hráčem.

```xml
<actions>
    <input name="eAITestInput" visible="false" />
    <input name="UAExpansionConfirm" loc="" visible="false" />
</actions>
```

Skryté vstupy mohou stále mít výchozí přiřazení kláves v bloku `<preset>`:

```xml
<preset>
    <input name="eAITestInput">
        <btn name="kY"/>
    </input>
</preset>
```

---

## Více výchozích kláves

Akce může mít více výchozích kláves. Uveďte více elementů `<btn>` jako sourozence:

```xml
<input name="UAExpansionConfirm">
    <btn name="kReturn" />
    <btn name="kNumpadEnter" />
</input>
```

Obě klávesy `Enter` a `Numpad Enter` budou spouštět `UAExpansionConfirm`. To je užitečné pro akce, kde by více fyzických kláves mělo odpovídat stejné logické akci.

---

## Přístup ke vstupům ve skriptu

### Získání vstupního API

Veškerý přístup ke vstupům prochází přes `GetUApi()`, které vrací globální User Action API:

```c
UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");
```

### Dotazování v OnUpdate

Vlastní vstupy se typicky dotazují v `MissionGameplay.OnUpdate()` nebo podobných zpětných voláních po snímcích:

```c
modded class MissionGameplay
{
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");

        if (input.LocalPress())
        {
            // Klávesa byla právě stisknuta v tomto snímku
            OpenMyModMenu();
        }
    }
}
```

### Alternativa: přímé použití názvu vstupu

Mnoho modů kontroluje vstupy inline pomocí metod `UAInputAPI` s řetězcovými názvy:

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);

    Input input = GetGame().GetInput();

    if (input.LocalPress("UAMyModOpenMenu", false))
    {
        OpenMyModMenu();
    }
}
```

Parametr `false` v `LocalPress("name", false)` znamená, že kontrola nemá vstup konzumovat.

---

## Reference vstupních metod

Jakmile máte referenci `UAInput` (z `GetUApi().GetInputByName()`), nebo používáte třídu `Input` přímo, tyto metody detekují různé stavy vstupu:

| Metoda | Vrací | Kdy je True |
|--------|-------|-------------|
| `LocalPress()` | `bool` | Klávesa byla stisknuta **v tomto snímku** (jednorázový trigger při stisknutí) |
| `LocalRelease()` | `bool` | Klávesa byla uvolněna **v tomto snímku** (jednorázový trigger při uvolnění) |
| `LocalClick()` | `bool` | Klávesa byla stisknuta a rychle uvolněna (ťuknutí) |
| `LocalHold()` | `bool` | Klávesa byla podržena po prahovou dobu |
| `LocalDoubleClick()` | `bool` | Klávesa byla rychle dvakrát ťuknuta |
| `LocalValue()` | `float` | Aktuální analogová hodnota (0.0 nebo 1.0 pro digitální klávesy; proměnná pro analogové osy) |

### Vzory použití

**Přepnutí při stisku:**
```c
if (input.LocalPress("UAMyModToggle", false))
{
    m_IsEnabled = !m_IsEnabled;
}
```

**Podržení k aktivaci, uvolnění k deaktivaci:**
```c
if (input.LocalPress("eAICommandMenu", false))
{
    ShowCommandWheel();
}

if (input.LocalRelease("eAICommandMenu", false) || input.LocalValue("eAICommandMenu", false) == 0)
{
    HideCommandWheel();
}
```

**Akce dvojitým ťuknutím:**
```c
if (input.LocalDoubleClick("UAMyModSpecial", false))
{
    PerformSpecialAction();
}
```

**Podržení pro rozšířenou akci:**
```c
if (input.LocalHold("UAExpansionGPSToggle"))
{
    ToggleGPSMode();
}
```

---

## Potlačení a deaktivace vstupů

### ForceDisable

Dočasně deaktivuje konkrétní vstup. Běžně se používá při otevření menu, aby se zabránilo herním akcím při aktivním UI:

```c
// Deaktivace vstupu při otevřeném menu
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(true);

// Opětovná aktivace při zavření menu
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(false);
```

### SupressNextFrame

Potlačí veškeré zpracování vstupů pro příští snímek. Používá se během přechodů kontextu vstupů (např. zavírání menu) k prevenci jednosnímkového "prosakování" vstupů:

```c
GetUApi().SupressNextFrame(true);
```

### UpdateControls

Po úpravě stavů vstupů zavolejte `UpdateControls()` pro okamžité uplatnění změn:

```c
GetUApi().GetInputByName("UAExpansionBookToggle").ForceDisable(false);
GetUApi().UpdateControls();
```

### Vylučovací skupiny vstupů

Vanilkový misijní systém poskytuje vylučovací skupiny. Když je aktivní menu, můžete vyloučit kategorie vstupů:

```c
// Potlačení herních vstupů při otevřeném inventáři
AddActiveInputExcludes({"inventory"});

// Obnovení při zavření
RemoveActiveInputExcludes({"inventory"});
```

---

## Reference názvů kláves

Názvy kláves používané v atributu `<btn name="">` sledují specifickou konvenci pojmenování. Zde je kompletní reference.

### Klávesy klávesnice

| Kategorie | Názvy kláves |
|-----------|--------------|
| Písmena | `kA`, `kB`, `kC`, `kD`, `kE`, `kF`, `kG`, `kH`, `kI`, `kJ`, `kK`, `kL`, `kM`, `kN`, `kO`, `kP`, `kQ`, `kR`, `kS`, `kT`, `kU`, `kV`, `kW`, `kX`, `kY`, `kZ` |
| Čísla (horní řada) | `k0`, `k1`, `k2`, `k3`, `k4`, `k5`, `k6`, `k7`, `k8`, `k9` |
| Funkční klávesy | `kF1`, `kF2`, `kF3`, `kF4`, `kF5`, `kF6`, `kF7`, `kF8`, `kF9`, `kF10`, `kF11`, `kF12` |
| Modifikátory | `kLControl`, `kRControl`, `kLShift`, `kRShift`, `kLAlt`, `kRAlt` |
| Navigace | `kUp`, `kDown`, `kLeft`, `kRight`, `kHome`, `kEnd`, `kPageUp`, `kPageDown` |
| Editační | `kReturn`, `kBackspace`, `kDelete`, `kInsert`, `kSpace`, `kTab`, `kEscape` |
| Numerická klávesnice | `kNumpad0` ... `kNumpad9`, `kNumpadEnter`, `kNumpadPlus`, `kNumpadMinus`, `kNumpadMultiply`, `kNumpadDivide`, `kNumpadDecimal` |
| Interpunkce | `kMinus`, `kEquals`, `kLBracket`, `kRBracket`, `kBackslash`, `kSemicolon`, `kApostrophe`, `kComma`, `kPeriod`, `kSlash`, `kGrave` |
| Zámky | `kCapsLock`, `kNumLock`, `kScrollLock` |

### Tlačítka myši

| Název | Tlačítko |
|-------|----------|
| `mBLeft` | Levé tlačítko myši |
| `mBRight` | Pravé tlačítko myši |
| `mBMiddle` | Prostřední tlačítko myši (klik kolečkem) |
| `mBExtra1` | Tlačítko myši 4 (boční tlačítko vzad) |
| `mBExtra2` | Tlačítko myši 5 (boční tlačítko vpřed) |

### Osy myši

| Název | Osa |
|-------|-----|
| `mAxisX` | Horizontální pohyb myši |
| `mAxisY` | Vertikální pohyb myši |
| `mWheelUp` | Kolečko nahoru |
| `mWheelDown` | Kolečko dolů |

### Vzor pojmenování

- **Klávesnice**: předpona `k` + název klávesy (např. `kT`, `kF5`, `kLControl`)
- **Tlačítka myši**: předpona `mB` + název tlačítka (např. `mBLeft`, `mBRight`)
- **Osy myši**: předpona `m` + název osy (např. `mAxisX`, `mWheelUp`)

---

## Reálné příklady

### DayZ Expansion AI

Dobře strukturovaný inputs.xml s viditelnými klávesovými zkratkami, skrytými ladicími vstupy a kombinacemi s modifikátory:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU"/>
            <input name="eAISetWaypoint" loc="STR_EXPANSION_AI_SET_WAYPOINT"/>
            <input name="eAITestInput" visible="false" />
            <input name="eAITestLRIncrease" visible="false" />
            <input name="eAITestLRDecrease" visible="false" />
            <input name="eAITestUDIncrease" visible="false" />
            <input name="eAITestUDDecrease" visible="false" />
        </actions>

        <sorting name="expansion" loc="STR_EXPANSION_LABEL">
            <input name="eAICommandMenu" />
            <input name="eAISetWaypoint" />
            <input name="eAITestInput" />
            <input name="eAITestLRIncrease" />
            <input name="eAITestLRDecrease" />
            <input name="eAITestUDIncrease" />
            <input name="eAITestUDDecrease" />
        </sorting>
    </inputs>
    <preset>
        <input name="eAICommandMenu">
            <btn name="kT"/>
        </input>
        <input name="eAISetWaypoint">
            <btn name="kLControl">
                <btn name="mBLeft"/>
            </btn>
        </input>
        <input name="eAITestInput">
            <btn name="kY"/>
        </input>
        <input name="eAITestLRIncrease">
            <btn name="kRight"/>
        </input>
        <input name="eAITestLRDecrease">
            <btn name="kLeft"/>
        </input>
        <input name="eAITestUDIncrease">
            <btn name="kUp"/>
        </input>
        <input name="eAITestUDDecrease">
            <btn name="kDown"/>
        </input>
    </preset>
</modded_inputs>
```

Klíčová pozorování:
- `eAICommandMenu` přiřazeno na `T` --- viditelné v nastavení, hráč může přebindovat
- `eAISetWaypoint` používá kombinaci **Ctrl + levý klik** s modifikátorem
- Testovací vstupy jsou `visible="false"` --- skryté před hráči, ale přístupné v kódu

### DayZ Expansion Market

Minimální inputs.xml pro skrytý pomocný vstup s více výchozími klávesami:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAExpansionConfirm" loc="" visible="false" />
        </actions>
    </inputs>
    <preset>
        <input name="UAExpansionConfirm">
            <btn name="kReturn" />
            <btn name="kNumpadEnter" />
        </input>
    </preset>
</modded_inputs>
```

Klíčová pozorování:
- Skrytý vstup (`visible="false"`) s prázdným `loc` --- nikdy se nezobrazí v nastavení
- Dvě výchozí klávesy: obě Enter a Numpad Enter spouštějí stejnou akci
- Žádný blok `<sorting>` --- není potřeba, protože vstup je skrytý

### Kompletní startovací šablona

Minimální, ale kompletní šablona pro nový mod:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
            <input name="UAMyModQuickAction" loc="STR_MYMOD_INPUT_QUICK_ACTION" />
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModOpenMenu" />
            <input name="UAMyModQuickAction" />
        </sorting>
    </inputs>
    <preset>
        <input name="UAMyModOpenMenu">
            <btn name="kF6"/>
        </input>
        <!-- UAMyModQuickAction nemá výchozí klávesu; hráč si ji musí přiřadit -->
    </preset>
</modded_inputs>
```

S odpovídající stringtable.csv:

```csv
"Language","original","english"
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod"
"STR_MYMOD_INPUT_OPEN_MENU","Open Menu","Open Menu"
"STR_MYMOD_INPUT_QUICK_ACTION","Quick Action","Quick Action"
```

---

## Časté chyby

### Použití `#` v atributu loc

```xml
<!-- ŠPATNĚ -->
<input name="UAMyAction" loc="#STR_MYMOD_ACTION" />

<!-- SPRÁVNĚ -->
<input name="UAMyAction" loc="STR_MYMOD_ACTION" />
```

Vstupní systém interně přidává předponu `#`. Přidáním sami způsobíte dvojitou předponu a vyhledávání selže.

### Kolize názvů akcí

Pokud dva mody definují `UAOpenMenu`, bude fungovat pouze jeden. Vždy používejte předponu svého modu:

```xml
<input name="UAMyModOpenMenu" />     <!-- Dobře -->
<input name="UAOpenMenu" />          <!-- Riskantní -->
```

### Chybějící záznam v Sorting

Pokud definujete akci v `<actions>`, ale zapomenete ji uvést v `<sorting>`, akce funguje v kódu, ale je neviditelná v menu Ovládání. Hráč nemá možnost ji přebindovat.

### Zapomenutí definice v Actions

Pokud uvedete vstup v `<sorting>` nebo `<preset>`, ale nikdy ho nedefinujete v `<actions>`, engine ho tiše ignoruje.

### Přiřazení kolidujících kláves

Výběr kláves, které kolidují s vanilkovými přiřazeními (jako `W`, `A`, `S`, `D`, `Tab`, `I`), způsobí, že se vaše akce i vanilková akce spustí současně. Pro bezpečnost používejte méně běžné klávesy (F5-F12, klávesy numerické klávesnice) nebo kombinace s modifikátory.

---

## Osvědčené postupy

- Vždy přidávejte předponu `UA` + název modu k názvům akcí (např. `UAMyModOpenMenu`). Obecné názvy jako `UAOpenMenu` budou kolidovat s jinými mody.
- Poskytněte atribut `loc` pro každý viditelný vstup a definujte odpovídající klíč stringtable. Bez něj menu Ovládání zobrazí holý název akce.
- Zvolte méně běžné výchozí klávesy (F5-F12, numerická klávesnice) nebo kombinace s modifikátory (Ctrl+klávesa) pro minimalizaci konfliktů s vanilkovými a populárními klávesovými zkratkami modů.
- Vždy uveďte viditelné vstupy v bloku `<sorting>`. Vstup definovaný v `<actions>`, ale chybějící v `<sorting>`, je neviditelný pro hráče a nemůže být přebindován.
- Ukládejte referenci `UAInput` z `GetUApi().GetInputByName()` do členské proměnné místo volání každý snímek v `OnUpdate`. Vyhledávání řetězce má režii.

---

## Teorie vs praxe

> Co říká dokumentace versus jak věci skutečně fungují za běhu.

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `visible="false"` skryje z menu Ovládání | Vstup je registrován, ale neviditelný | Skryté vstupy se stále mohou objevit ve výpisu bloku `<sorting>` v některých verzích DayZ. Vynechání z `<sorting>` je spolehlivý způsob skrytí vstupů |
| `LocalPress()` se spustí jednou za stisk klávesy | Jednorázový trigger ve snímku stisku klávesy | Pokud hra zakolísá (nízké FPS), `LocalPress()` může být zcela vynechán. Pro kritické akce kontrolujte také `LocalValue() > 0` jako zálohu |
| Kombinace s modifikátory přes vnořené `<btn>` | Vnější je modifikátor, vnitřní je spouštěč | Samotná modifikační klávesa se také zaregistruje jako stisk na svém vlastním vstupu (např. `kLControl` je také vanilkový dřep). Hráči podržící Ctrl+klik budou také dřepat |
| `ForceDisable(true)` potlačí vstup | Vstup je zcela ignorován | `ForceDisable` přetrvává, dokud není explicitně znovu povolen. Pokud váš mod spadne nebo se UI zavře bez volání `ForceDisable(false)`, vstup zůstane deaktivován do restartu hry |
| Více sourozeneckých `<btn>` | Obě klávesy spouštějí stejnou akci | Funguje správně, ale menu Ovládání zobrazí pouze první klávesu. Hráč může vidět a přebindovat první klávesu, ale nemusí si uvědomovat, že existuje druhá výchozí |

---

## Kompatibilita a dopad

- **Více modů:** Kolize názvů akcí jsou hlavním rizikem. Pokud dva mody definují `UAOpenMenu`, bude fungovat pouze jeden a konflikt je tichý. Engine nevydává žádné varování pro duplicitní názvy akcí napříč mody.
- **Výkon:** Dotazování vstupů přes `GetUApi().GetInputByName()` zahrnuje vyhledávání hash řetězce. Dotazování 5-10 vstupů za snímek je zanedbatelné, ale ukládání reference `UAInput` do mezipaměti je stále doporučeno pro mody s mnoha vstupy.
- **Verze:** Formát `inputs.xml` a struktura `<modded_inputs>` jsou stabilní od DayZ 1.0. Atribut `visible` byl přidán později (kolem verze 1.08) --- na starších verzích jsou všechny vstupy vždy viditelné v menu Ovládání.

---

## Pozorováno v reálných modech

| Vzor | Mod | Detail |
|------|-----|--------|
| Kombinace s modifikátorem `Ctrl+klik` | Expansion AI | `eAISetWaypoint` používá vnořené `<btn name="kLControl"><btn name="mBLeft"/>` pro Ctrl+levý klik k umístění AI waypointů |
| Skryté pomocné vstupy | Expansion Market | `UAExpansionConfirm` je `visible="false"` se dvěma klávesami (Enter + Numpad Enter) pro interní potvrzovací logiku |
| `ForceDisable` při otevření menu | COT, VPP | Admin panely volají `ForceDisable(true)` na herní vstupy při otevření panelu a `ForceDisable(false)` při zavření, aby se zabránilo pohybu postavy při psaní |
| Uložená `UAInput` v členské proměnné | DabsFramework | Ukládá výsledek `GetUApi().GetInputByName()` do pole třídy během inicializace, dotazuje uloženou referenci v `OnUpdate` pro zamezení vyhledávání řetězce každý snímek |
