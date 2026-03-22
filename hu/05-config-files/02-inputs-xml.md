# 5.2. fejezet: inputs.xml --- Egyéni billentyűkötések

[Főoldal](../README.md) | [<< Előző: stringtable.csv](01-stringtable.md) | **inputs.xml** | [Következő: Credits.json >>](03-credits-json.md)

---

> **Összefoglalás:** Az `inputs.xml` fájl lehetővé teszi, hogy a modod egyéni billentyűkötéseket regisztráljon, amelyek megjelennek a játékos Vezérlés beállítások menüjében. A játékosok megtekinthetik, átrendezhetik és kapcsolgathatják ezeket a beviteleket, ugyanúgy mint a vanilla akciókat. Ez a szabványos mechanizmus gyorsbillentyűk hozzáadásához DayZ modokban.

---

## Tartalomjegyzék

- [Áttekintés](#overview)
- [Fájl helye](#file-location)
- [Teljes XML struktúra](#complete-xml-structure)
- [Actions blokk](#actions-block)
- [Sorting blokk](#sorting-block)
- [Preset blokk (alapértelmezett billentyűkötések)](#preset-block-default-keybindings)
- [Módosító kombók](#modifier-combos)
- [Rejtett bemenetek](#hidden-inputs)
- [Több alapértelmezett billentyű](#multiple-default-keys)
- [Bemenetek elérése szkriptben](#accessing-inputs-in-script)
- [Beviteli metódusok referencia](#input-methods-reference)
- [Bemenetek elnyomása és letiltása](#suppressing-and-disabling-inputs)
- [Billentyűnevek referencia](#key-names-reference)
- [Valós példák](#real-examples)
- [Gyakori hibák](#common-mistakes)

---

## Áttekintés

Amikor a modod igényli, hogy a játékos megnyomjon egy billentyűt --- menü megnyitása, funkció kapcsolgatása, AI egység irányítása --- regisztrálsz egy egyéni beviteli akciót az `inputs.xml` fájlban. A motor indításkor beolvassa ezt a fájlt, és integrálja az akcióidat az univerzális beviteli rendszerbe. A játékosok az általad definiált csoportcím alatt látják a billentyűkötéseidet a játék Beállítások > Vezérlés menüjében.

Az egyéni bemenetek egy egyedi akciónévvel azonosíthatók (konvenció szerint `UA` előtaggal, ami "User Action"-t jelent), és rendelkezhetnek alapértelmezett billentyűkötésekkel, amelyeket a játékosok tetszés szerint módosíthatnak.

---

## Fájl helye

Helyezd az `inputs.xml` fájlt a Scripts könyvtárad `data` almappájába:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        data/
          inputs.xml        <-- Itt
        3_Game/
        4_World/
        5_Mission/
```

Egyes modok közvetlenül a `Scripts/` mappába helyezik. Mindkét hely működik. A motor automatikusan felfedezi a fájlt --- nincs szükség config.cpp regisztrációra.

---

## Teljes XML struktúra

Az `inputs.xml` fájl három szekcióval rendelkezik, amelyek mind egy `<modded_inputs>` gyökérelembe vannak csomagolva:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <!-- Akció definíciók ide kerülnek -->
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <!-- Rendezési sorrend a beállítások menühöz -->
        </sorting>
    </inputs>
    <preset>
        <!-- Alapértelmezett billentyűkötés hozzárendelések ide kerülnek -->
    </preset>
</modded_inputs>
```

Mindhárom szekció --- `<actions>`, `<sorting>` és `<preset>` --- együtt működik, de különböző célokat szolgál.

---

## Actions blokk

Az `<actions>` blokk deklarálja a modod által biztosított összes beviteli akciót. Minden akció egyetlen `<input>` elem.

### Szintaxis

```xml
<actions>
    <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
    <input name="UAMyModToggleHUD" loc="STR_MYMOD_INPUT_TOGGLE_HUD" />
</actions>
```

### Attribútumok

| Attribútum | Kötelező | Leírás |
|-----------|----------|-------------|
| `name` | Igen | Egyedi akció azonosító. Konvenció: `UA` (User Action) előtag. Szkriptekben használatos a bemenet lekérdezéséhez. |
| `loc` | Nem | Stringtable kulcs a Vezérlés menüben megjelenő névhez. **`#` előtag nélkül** --- a rendszer maga adja hozzá. |
| `visible` | Nem | Állítsd `"false"`-ra a Vezérlés menüből való elrejtéshez. Alapértelmezés: `true`. |

### Elnevezési konvenció

Az akcióneveknek globálisan egyedinek kell lenniük az összes betöltött mod között. Használd a mod előtagodat:

```xml
<input name="UAMyModAdminPanel" loc="STR_MYMOD_INPUT_ADMIN_PANEL" />
<input name="UAExpansionBookToggle" loc="STR_EXPANSION_BOOK_TOGGLE" />
<input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU" />
```

Az `UA` előtag konvenció, de nem kötelező. Az Expansion AI az `eAI`-t használja előtagként, ami szintén működik.

---

## Sorting blokk

A `<sorting>` blokk szabályozza, hogyan jelennek meg a beviteleid a játékos Vezérlés beállításaiban. Egy megnevezett csoportot definiál (amely szekció fejlécként jelenik meg), és felsorolja a bemeneteket megjelenítési sorrendben.

### Szintaxis

```xml
<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModOpenMenu" />
    <input name="UAMyModToggleHUD" />
    <input name="UAMyModSpecialAction" />
</sorting>
```

### Attribútumok

| Attribútum | Kötelező | Leírás |
|-----------|----------|-------------|
| `name` | Igen | A rendezési csoport belső azonosítója |
| `loc` | Igen | Stringtable kulcs a Beállítások > Vezérlés menüben megjelenő csoportfejléchez |

### Hogyan jelenik meg

A Vezérlés beállításokban a játékos ezt látja:

```
[MyMod]                          <-- a sorting loc-ból
  Open Menu .............. [Y]   <-- az input loc + preset alapján
  Toggle HUD ............. [H]   <-- az input loc + preset alapján
```

Csak a `<sorting>` blokkban felsorolt bemenetek jelennek meg a beállítások menüben. Az `<actions>`-ban definiált, de a `<sorting>`-ban nem felsorolt bemenetek csendben regisztrálódnak, de láthatatlanok a játékos számára (még ha a `visible` nincs is kifejezetten `false`-ra állítva).

---

## Preset blokk (alapértelmezett billentyűkötések)

A `<preset>` blokk alapértelmezett billentyűket rendel az akcióidhoz. Ezek azok a billentyűk, amelyekkel a játékos indul bármilyen testreszabás előtt.

### Egyszerű billentyűkötés

```xml
<preset>
    <input name="UAMyModOpenMenu">
        <btn name="kY"/>
    </input>
</preset>
```

Ez az `Y` billentyűt köti hozzá alapértelmezettként az `UAMyModOpenMenu` akcióhoz.

### Nincs alapértelmezett billentyű

Ha kihagysz egy akciót a `<preset>` blokkból, nincs alapértelmezett kötése. A játékosnak manuálisan kell hozzárendelnie egy billentyűt a Beállítások > Vezérlés menüben. Ez megfelelő opcionális vagy haladó kötésekhez.

---

## Módosító kombók

Módosító billentyű (Ctrl, Shift, Alt) megköveteléséhez ágyazd egymásba a `<btn>` elemeket:

### Ctrl + Bal egérgomb

```xml
<input name="eAISetWaypoint">
    <btn name="kLControl">
        <btn name="mBLeft"/>
    </btn>
</input>
```

A külső `<btn>` a módosító; a belső `<btn>` az elsődleges billentyű. A játékosnak le kell tartania a módosítót, majd meg kell nyomnia az elsődleges billentyűt.

### Shift + billentyű

```xml
<input name="UAMyModQuickAction">
    <btn name="kLShift">
        <btn name="kQ"/>
    </btn>
</input>
```

### Beágyazási szabályok

- A **külső** `<btn>` mindig a módosító (lenyomva tartott)
- A **belső** `<btn>` a kiváltó (a módosító lenyomva tartása közben megnyomott)
- Jellemzően csak egy szintű beágyazás szokásos; a mélyebb beágyazás nem tesztelt és nem ajánlott

---

## Rejtett bemenetek

Használd a `visible="false"` attribútumot egy olyan bemenet regisztrálásához, amelyet a játékos nem láthat és nem köthet át a Vezérlés menüben. Ez hasznos a mod kódja által használt belső bemenetekhez, amelyeknek nem kellene játékos által konfigurálhatónak lenniük.

```xml
<actions>
    <input name="eAITestInput" visible="false" />
    <input name="UAExpansionConfirm" loc="" visible="false" />
</actions>
```

A rejtett bemenetek továbbra is rendelkezhetnek alapértelmezett billentyű-hozzárendelésekkel a `<preset>` blokkban:

```xml
<preset>
    <input name="eAITestInput">
        <btn name="kY"/>
    </input>
</preset>
```

---

## Több alapértelmezett billentyű

Egy akciónak több alapértelmezett billentyűje is lehet. Sorold fel a `<btn>` elemeket testvérként:

```xml
<input name="UAExpansionConfirm">
    <btn name="kReturn" />
    <btn name="kNumpadEnter" />
</input>
```

Mind az `Enter`, mind a `Numpad Enter` kiváltja az `UAExpansionConfirm` akciót. Ez hasznos olyan akcióknál, ahol több fizikai billentyűnek ugyanazt a logikai akciót kell végrehajtania.

---

## Bemenetek elérése szkriptben

### A beviteli API megszerzése

Minden beviteli hozzáférés a `GetUApi()`-n keresztül történik, amely a globális User Action API-t adja vissza:

```c
UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");
```

### Lekérdezés OnUpdate-ben

Az egyéni bemeneteket jellemzően a `MissionGameplay.OnUpdate()` vagy hasonló képkockánkénti visszahívásokban kérdezik le:

```c
modded class MissionGameplay
{
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");

        if (input.LocalPress())
        {
            // A billentyűt éppen ebben a képkockában nyomták meg
            OpenMyModMenu();
        }
    }
}
```

### Alternatíva: Beviteli név közvetlen használata

Sok mod ellenőrzi a bemeneteket soron belül az `UAInputAPI` metódusaival sztring nevekkel:

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

A `false` paraméter a `LocalPress("name", false)` metódusban azt jelzi, hogy az ellenőrzés ne fogyassza el a beviteli eseményt.

---

## Beviteli metódusok referencia

Ha van `UAInput` referenciád (a `GetUApi().GetInputByName()`-ből), vagy közvetlenül az `Input` osztályt használod, ezek a metódusok érzékelik a különböző beviteli állapotokat:

| Metódus | Visszatérés | Mikor igaz |
|--------|---------|-----------|
| `LocalPress()` | `bool` | A billentyűt **ebben a képkockában** nyomták meg (egyszeri kiváltás billentyű-lenyomáskor) |
| `LocalRelease()` | `bool` | A billentyűt **ebben a képkockában** engedték fel (egyszeri kiváltás billentyű-felengedéskor) |
| `LocalClick()` | `bool` | A billentyűt gyorsan lenyomták és felengedték (koppintás) |
| `LocalHold()` | `bool` | A billentyűt egy küszöbidőtartamon túl nyomva tartották |
| `LocalDoubleClick()` | `bool` | A billentyűt kétszer gyorsan megérintették |
| `LocalValue()` | `float` | Aktuális analóg érték (0.0 vagy 1.0 digitális billentyűknél; változó analóg tengeleknél) |

### Használati minták

**Kapcsolgatás megnyomásra:**
```c
if (input.LocalPress("UAMyModToggle", false))
{
    m_IsEnabled = !m_IsEnabled;
}
```

**Tartás az aktiváláshoz, felengedés a deaktiváláshoz:**
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

**Dupla koppintás akció:**
```c
if (input.LocalDoubleClick("UAMyModSpecial", false))
{
    PerformSpecialAction();
}
```

**Nyomvatartás kiterjesztett akcióhoz:**
```c
if (input.LocalHold("UAExpansionGPSToggle"))
{
    ToggleGPSMode();
}
```

---

## Bemenetek elnyomása és letiltása

### ForceDisable

Ideiglenesen letilt egy adott bemenetet. Gyakran használják menük megnyitásakor, hogy megakadályozzák a játék akcióinak kiváltását, amíg a UI aktív:

```c
// Bemenet letiltása amíg a menü nyitva van
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(true);

// Újra engedélyezés a menü bezárásakor
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(false);
```

### SupressNextFrame

Elnyomja az összes bemenet feldolgozását a következő képkockára. Beviteli kontextus átmenetek során használatos (pl. menük bezárásakor), hogy megelőzze az egyképkockás beviteli átszivárgást:

```c
GetUApi().SupressNextFrame(true);
```

### UpdateControls

A beviteli állapotok módosítása után hívd meg az `UpdateControls()` metódust a változások azonnali alkalmazásához:

```c
GetUApi().GetInputByName("UAExpansionBookToggle").ForceDisable(false);
GetUApi().UpdateControls();
```

### Beviteli kizárások

A vanilla mission rendszer kizárási csoportokat biztosít. Amikor egy menü aktív, kizárhatsz beviteli kategóriákat:

```c
// Játékmenet bemenetek elnyomása amíg a leltár nyitva van
AddActiveInputExcludes({"inventory"});

// Visszaállítás bezáráskor
RemoveActiveInputExcludes({"inventory"});
```

---

## Billentyűnevek referencia

A `<btn name="">` attribútumban használt billentyűnevek meghatározott elnevezési konvenciót követnek. Itt a teljes referencia.

### Billentyűzet billentyűk

| Kategória | Billentyűnevek |
|----------|-----------|
| Betűk | `kA`, `kB`, `kC`, `kD`, `kE`, `kF`, `kG`, `kH`, `kI`, `kJ`, `kK`, `kL`, `kM`, `kN`, `kO`, `kP`, `kQ`, `kR`, `kS`, `kT`, `kU`, `kV`, `kW`, `kX`, `kY`, `kZ` |
| Számok (felső sor) | `k0`, `k1`, `k2`, `k3`, `k4`, `k5`, `k6`, `k7`, `k8`, `k9` |
| Funkcióbillentyűk | `kF1`, `kF2`, `kF3`, `kF4`, `kF5`, `kF6`, `kF7`, `kF8`, `kF9`, `kF10`, `kF11`, `kF12` |
| Módosítók | `kLControl`, `kRControl`, `kLShift`, `kRShift`, `kLAlt`, `kRAlt` |
| Navigáció | `kUp`, `kDown`, `kLeft`, `kRight`, `kHome`, `kEnd`, `kPageUp`, `kPageDown` |
| Szerkesztés | `kReturn`, `kBackspace`, `kDelete`, `kInsert`, `kSpace`, `kTab`, `kEscape` |
| Numpad | `kNumpad0` ... `kNumpad9`, `kNumpadEnter`, `kNumpadPlus`, `kNumpadMinus`, `kNumpadMultiply`, `kNumpadDivide`, `kNumpadDecimal` |
| Írásjelek | `kMinus`, `kEquals`, `kLBracket`, `kRBracket`, `kBackslash`, `kSemicolon`, `kApostrophe`, `kComma`, `kPeriod`, `kSlash`, `kGrave` |
| Zárkapcsolók | `kCapsLock`, `kNumLock`, `kScrollLock` |

### Egérgombok

| Név | Gomb |
|------|--------|
| `mBLeft` | Bal egérgomb |
| `mBRight` | Jobb egérgomb |
| `mBMiddle` | Középső egérgomb (görgő kattintás) |
| `mBExtra1` | Egérgomb 4 (oldalsó gomb hátra) |
| `mBExtra2` | Egérgomb 5 (oldalsó gomb előre) |

### Egér tengelyek

| Név | Tengely |
|------|------|
| `mAxisX` | Egér vízszintes mozgás |
| `mAxisY` | Egér függőleges mozgás |
| `mWheelUp` | Görgő felfelé |
| `mWheelDown` | Görgő lefelé |

### Elnevezési minta

- **Billentyűzet**: `k` előtag + billentyű neve (pl. `kT`, `kF5`, `kLControl`)
- **Egérgombok**: `mB` előtag + gomb neve (pl. `mBLeft`, `mBRight`)
- **Egér tengelyek**: `m` előtag + tengely neve (pl. `mAxisX`, `mWheelUp`)

---

## Valós példák

### DayZ Expansion AI

Jól strukturált inputs.xml látható billentyűkötésekkel, rejtett hibakeresési bemenetekkel és módosító kombókkal:

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

Fontos megfigyelések:
- `eAICommandMenu` a `T` billentyűhöz van kötve --- látható a beállításokban, a játékos átköthet
- `eAISetWaypoint` **Ctrl + Bal kattintás** módosító kombót használ
- A teszt bemenetek `visible="false"` --- rejtve a játékosok elől, de a kódból elérhetők

### DayZ Expansion Market

Minimális inputs.xml rejtett segéd bemenettel és több alapértelmezett billentyűvel:

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

Fontos megfigyelések:
- Rejtett bemenet (`visible="false"`) üres `loc`-cal --- soha nem jelenik meg a beállításokban
- Két alapértelmezett billentyű: mind az Enter, mind a Numpad Enter kiváltja ugyanazt az akciót
- Nincs `<sorting>` blokk --- nem szükséges, mivel a bemenet rejtett

### Teljes kezdő sablon

Minimális de teljes sablon egy új modhoz:

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
        <!-- UAMyModQuickAction-nek nincs alapértelmezett billentyűje; a játékosnak kell hozzárendelnie -->
    </preset>
</modded_inputs>
```

A hozzá tartozó stringtable.csv:

```csv
"Language","original","english"
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod"
"STR_MYMOD_INPUT_OPEN_MENU","Open Menu","Open Menu"
"STR_MYMOD_INPUT_QUICK_ACTION","Quick Action","Quick Action"
```

---

## Gyakori hibák

### A `#` használata a loc attribútumban

```xml
<!-- HELYTELEN -->
<input name="UAMyAction" loc="#STR_MYMOD_ACTION" />

<!-- HELYES -->
<input name="UAMyAction" loc="STR_MYMOD_ACTION" />
```

A beviteli rendszer belsőleg fűzi hozzá a `#`-t. Ha te is hozzáadod, dupla előtag keletkezik és a keresés sikertelen.

### Akciónév ütközések

Ha két mod definiálja az `UAOpenMenu`-t, csak az egyik fog működni. Mindig használd a mod előtagodat:

```xml
<input name="UAMyModOpenMenu" />     <!-- Jó -->
<input name="UAOpenMenu" />          <!-- Kockázatos -->
```

### Hiányzó sorting bejegyzés

Ha definiálsz egy akciót az `<actions>`-ban, de elfelejteted felsorolni a `<sorting>`-ban, az akció kódból működik, de láthatatlan a Vezérlés menüben. A játékosnak nincs módja átkötni.

### Elfelejtett definíció az actions-ben

Ha felsorolsz egy bemenetet a `<sorting>`-ban vagy `<preset>`-ben, de soha nem definiálod az `<actions>`-ban, a motor csendben figyelmen kívül hagyja.

### Ütköző billentyűk kötése

Az olyan billentyűk választása, amelyek ütköznek a vanilla kötésekkel (mint a `W`, `A`, `S`, `D`, `Tab`, `I`), azt okozza, hogy mind a te akciód, mind a vanilla akció egyszerre aktiválódik. Használj kevésbé gyakori billentyűket (F5-F12, numpad billentyűk) vagy módosító kombókat a biztonság érdekében.
