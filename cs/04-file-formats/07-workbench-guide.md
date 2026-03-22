# Kapitola 4.7: Průvodce Workbenchem

[Domů](../README.md) | [<< Předchozí: Balení PBO](06-pbo-packing.md) | **Průvodce Workbenchem** | [Další: Modelování budov >>](08-building-modeling.md)

---

## Úvod

Workbench je integrované vývojové prostředí od Bohemia Interactive pro engine Enfusion. Dodává se s DayZ Tools a je jediným oficiálním nástrojem, který rozumí Enforce Scriptu na jazykové úrovni. Zatímco mnoho modderů píše kód ve VS Code nebo jiných editorech, Workbench zůstává nepostradatelný pro úkoly, které žádný jiný nástroj nedokáže: připojení debuggeru k běžící instanci DayZ, nastavení breakpointů, krokování kódem, inspekce proměnných za běhu, náhled `.layout` UI souborů, procházení herních zdrojů a spouštění živých skriptových příkazů přes vestavěnou konzoli.

---

## Obsah

- [Co je Workbench?](#co-je-workbench)
- [Instalace a nastavení](#instalace-a-nastavení)
- [Projektové soubory (.gproj)](#projektové-soubory-gproj)
- [Rozhraní Workbenche](#rozhraní-workbenche)
- [Editace skriptů](#editace-skriptů)
- [Ladění skriptů](#ladění-skriptů)
- [Skriptová konzole --- Živé testování](#skriptová-konzole----živé-testování)
- [Náhled UI / Layoutu](#náhled-ui--layoutu)
- [Prohlížeč zdrojů](#prohlížeč-zdrojů)
- [Profilování výkonu](#profilování-výkonu)
- [Integrace s File Patchingem](#integrace-s-file-patchingem)
- [Běžné problémy Workbenche](#běžné-problémy-workbenche)
- [Tipy a doporučené postupy](#tipy-a-doporučené-postupy)

---

## Co je Workbench?

Workbench je IDE od Bohemia pro vývoj na enginu Enfusion. Je jediným nástrojem v sadě DayZ Tools, který dokáže kompilovat, analyzovat a ladit Enforce Script. Slouží šesti účelům:

| Účel | Popis |
|---------|-------------|
| **Editace skriptů** | Zvýrazňování syntaxe, doplňování kódu a kontrola chyb pro `.c` soubory |
| **Ladění skriptů** | Breakpointy, inspekce proměnných, zásobník volání, krokování |
| **Procházení zdrojů** | Navigace a náhled herních assetů -- modely, textury, konfigurace, layouty |
| **Náhled UI / layoutu** | Vizuální náhled hierarchií `.layout` widgetů s inspekcí vlastností |
| **Profilování výkonu** | Profilování skriptů, analýza času snímku, monitorování paměti |
| **Skriptová konzole** | Spouštění příkazů Enforce Scriptu živě proti běžící instanci hry |

Workbench používá stejný kompilátor skriptů Enfusion jako samotné DayZ. Když Workbench nahlásí chybu kompilace, tato chyba se objeví i ve hře -- díky tomu je spolehlivou předletovou kontrolou před spuštěním.

### Co Workbench NENÍ

- **Není univerzální editor kódu.** Chybí mu refaktorovací nástroje, integrace s Git, multi-kurzorová editace a ekosystém rozšíření VS Code.
- **Není spouštěč hry.** Stále spouštíte `DayZDiag_x64.exe` samostatně; Workbench se k němu připojí.
- **Není nutný pro sestavování PBO.** AddonBuilder a sestavovací skripty řeší balení PBO nezávisle.

---

## Instalace a nastavení

### Krok 1: Instalace DayZ Tools

Workbench je součástí DayZ Tools, distribuovaných zdarma přes Steam. Otevřete knihovnu Steam, povolte filtr **Nástroje**, vyhledejte **DayZ Tools** a nainstalujte (~2 GB).

### Krok 2: Nalezení Workbenche

```
Steam\steamapps\common\DayZ Tools\Bin\Workbench\
  workbenchApp.exe          <-- Spustitelný soubor Workbenche
  dayz.gproj                <-- Výchozí projektový soubor
```

### Krok 3: Připojení disku P:

Workbench vyžaduje připojený disk P: (workdrive). Bez něj Workbench selže při spuštění nebo zobrazí prázdný prohlížeč zdrojů. Připojte přes DayZ Tools Launcher, váš projektový `SetupWorkdrive.bat`, nebo ručně: `subst P: "D:\VasAdresarPrace"`.

### Krok 4: Extrakce vanilkových skriptů

Workbench potřebuje vanilkové DayZ skripty na P: pro kompilaci vašeho modu (protože váš kód rozšiřuje vanilkové třídy):

```
P:\scripts\
  1_Core\
  2_GameLib\
  3_Game\
  4_World\
  5_Mission\
```

Extrahujte je přes DayZ Tools Launcher, nebo vytvořte symbolický odkaz na adresář s extrahovanými skripty.

### Krok 4b: Propojení herní instalace s projektovým diskem (pro živé přenačítání)

Pro umožnění DayZDiag načítat skripty přímo z vašeho projektového disku (což umožňuje živou editaci bez přestavby PBO) vytvořte symbolický odkaz ze složky instalace DayZ na `P:\scripts`:

1. Přejděte do složky instalace DayZ (typicky `Steam\steamapps\common\DayZ`).
2. Smažte jakoukoliv existující složku `scripts` uvnitř.
3. Otevřete příkazový řádek **jako správce** a spusťte:

```batch
mklink /J "C:\...\steamapps\common\DayZ\scripts" "P:\scripts"
```

Nahraďte první cestu vaší skutečnou cestou instalace DayZ. Poté bude složka instalace DayZ obsahovat spojení `scripts`, které ukazuje na `P:\scripts`. Jakékoli změny provedené na projektovém disku jsou okamžitě viditelné pro hru.

### Krok 5: Konfigurace adresáře zdrojových dat

1. Spusťte `workbenchApp.exe`.
2. Klikněte na **Workbench > Options** v panelu nabídek.
3. Nastavte **Source data directory** na `P:\`.
4. Klikněte na **OK** a nechte Workbench restartovat.

---

## Projektové soubory (.gproj)

Soubor `.gproj` je projektová konfigurace Workbenche. Říká Workbenchi, kde najít skripty, které sady obrázků načíst pro náhled layoutu a které styly widgetů jsou dostupné.

### Umístění souboru

Konvencí je umístit ho do adresáře `Workbench/` uvnitř vašeho modu:

```
P:\MyMod\
  Workbench\
    dayz.gproj
  Scripts\
    3_Game\
    4_World\
    5_Mission\
  config.cpp
```

### Přehled struktury

Soubor `.gproj` používá proprietární textový formát (ne JSON, ne XML):

```
GameProjectClass {
    ID "MyMod"
    TITLE "My Mod Name"
    Configurations {
        GameProjectConfigClass PC {
            platformHardware PC
            skeletonDefinitions "DZ/Anims/cfg/skeletons.anim.xml"

            FileSystem {
                FileSystemPathClass {
                    Name "Workdrive"
                    Directory "P:/"
                }
            }

            imageSets {
                "gui/imagesets/ccgui_enforce.imageset"
                "gui/imagesets/dayz_gui.imageset"
                "gui/imagesets/dayz_inventory.imageset"
                // ... další vanilkové sady obrázků ...
                "MyMod/gui/imagesets/my_imageset.imageset"
            }

            widgetStyles {
                "gui/looknfeel/dayzwidgets.styles"
                "gui/looknfeel/widgets.styles"
            }

            ScriptModules {
                ScriptModulePathClass {
                    Name "core"
                    Paths {
                        "scripts/1_Core"
                        "MyMod/Scripts/1_Core"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "gameLib"
                    Paths { "scripts/2_GameLib" }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "game"
                    Paths {
                        "scripts/3_Game"
                        "MyMod/Scripts/3_Game"
                    }
                    EntryPoint "CreateGame"
                }
                ScriptModulePathClass {
                    Name "world"
                    Paths {
                        "scripts/4_World"
                        "MyMod/Scripts/4_World"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "mission"
                    Paths {
                        "scripts/5_Mission"
                        "MyMod/Scripts/5_Mission"
                    }
                    EntryPoint "CreateMission"
                }
                ScriptModulePathClass {
                    Name "workbench"
                    Paths { "MyMod/Workbench/ToolAddons" }
                    EntryPoint ""
                }
            }
        }
        GameProjectConfigClass XBOX_ONE { platformHardware XBOX_ONE }
        GameProjectConfigClass PS4 { platformHardware PS4 }
        GameProjectConfigClass LINUX { platformHardware LINUX }
    }
}
```

### Vysvětlení klíčových sekcí

**FileSystem** -- Kořenové adresáře, kde Workbench hledá soubory. Minimálně zahrňte `P:/`. Můžete přidat další cesty (např. adresář instalace DayZ ve Steamu), pokud soubory žijí mimo workdrive.

**ScriptModules** -- Nejdůležitější sekce. Mapuje každou vrstvu enginu na adresáře skriptů:

| Modul | Vrstva | EntryPoint | Účel |
|--------|-------|------------|---------|
| `core` | `1_Core` | `""` | Jádro enginu, základní typy |
| `gameLib` | `2_GameLib` | `""` | Knihovní utility hry |
| `game` | `3_Game` | `"CreateGame"` | Enumy, konstanty, inicializace hry |
| `world` | `4_World` | `""` | Entity, manažeři |
| `mission` | `5_Mission` | `"CreateMission"` | Mise hooky, UI panely |
| `workbench` | (nástroje) | `""` | Pluginy Workbenche |

Vanilkové cesty jsou první, poté cesty vašeho modu. Pokud váš mod závisí na jiných modech (jako Community Framework), přidejte i jejich cesty:

```
ScriptModulePathClass {
    Name "game"
    Paths {
        "scripts/3_Game"              // Vanilka
        "JM/CF/Scripts/3_Game"        // Community Framework
        "MyMod/Scripts/3_Game"        // Váš mod
    }
    EntryPoint "CreateGame"
}
```

Některé frameworky přepisují entry pointy (CF používá `"CF_CreateGame"`).

**imageSets / widgetStyles** -- Vyžadovány pro náhled layoutu. Bez vanilkových sad obrázků layoutové soubory zobrazují chybějící obrázky. Vždy zahrňte standardních 14 vanilkových sad obrázků uvedených v příkladu výše.

### Rozlišení prefixu cesty

Když Workbench automaticky rozlišuje cesty skriptů z `config.cpp` modu, cesta FileSystem se předřadí. Pokud je váš mod na `P:\OtherMods\MyMod` a config.cpp deklaruje `MyMod/scripts/3_Game`, FileSystem musí zahrnovat `P:\OtherMods` pro správné rozlišení.

### Vytvoření a spuštění

**Vytvoření .gproj:** Zkopírujte výchozí `dayz.gproj` z `DayZ Tools\Bin\Workbench\`, aktualizujte `ID`/`TITLE` a přidejte cesty skriptů vašeho modu ke každému modulu.

**Spuštění s vlastním projektem:**
```batch
workbenchApp.exe -project="P:\MyMod\Workbench\dayz.gproj"
```

**Spuštění s -mod (automatická konfigurace z config.cpp):**
```batch
workbenchApp.exe -mod=P:\MyMod
workbenchApp.exe -mod=P:\CommunityFramework;P:\MyMod
```

Přístup `-mod` je jednodušší, ale dává méně kontroly. Pro komplexní multi-mod sestavení je vlastní `.gproj` spolehlivější.

---

## Rozhraní Workbenche

### Hlavní panel nabídek

| Nabídka | Klíčové položky |
|------|-----------|
| **File** | Otevřít projekt, poslední projekty, uložit |
| **Edit** | Vyjmout, kopírovat, vložit, najít, nahradit |
| **View** | Přepínání panelů zap/vyp, reset rozvržení |
| **Workbench** | Možnosti (adresář zdrojových dat, preference) |
| **Debug** | Spuštění/zastavení ladění, přepínání klient/server, správa breakpointů |
| **Plugins** | Nainstalované pluginy a doplňky nástrojů Workbenche |

### Panely

- **Prohlížeč zdrojů** (vlevo) -- Strom souborů disku P:. Dvojklikem `.c` soubory upravíte, `.layout` soubory zobrazíte, `.p3d` prohlédnete modely, `.paa` zobrazíte textury.
- **Editor skriptů** (uprostřed) -- Oblast editace kódu se zvýrazňováním syntaxe, doplňováním kódu, podtrháváním chyb, čísly řádků, značkami breakpointů a editací více souborů v záložkách.
- **Výstup** (dole) -- Chyby/varování kompilátoru, výstup `Print()` z připojené hry, ladicí zprávy. Při připojení k DayZDiag toto okno streamuje v reálném čase veškerý text, který diagnostický spustitelný soubor tiskne pro účely ladění -- stejný výstup, který byste viděli v logech skriptů. Dvojklikem na chyby přejdete na zdrojový řádek.
- **Vlastnosti** (vpravo) -- Vlastnosti vybraného objektu. Nejužitečnější v editoru layoutu pro inspekci widgetů.
- **Konzole** -- Živé spouštění příkazů Enforce Scriptu.
- **Ladicí panely** (při ladění) -- **Locals** (proměnné aktuálního rozsahu), **Watch** (uživatelské výrazy), **Call Stack** (řetězec volání), **Breakpoints** (seznam s přepínáním zapnout/vypnout).

---

## Editace skriptů

### Otevírání souborů

1. **Prohlížeč zdrojů:** Dvojklikněte na `.c` soubor. Tím se automaticky otevře modul editoru skriptů a načte soubor.
2. **Prohlížeč zdrojů editoru skriptů:** Editor skriptů má vlastní vestavěný panel prohlížeče zdrojů, oddělený od hlavního prohlížeče zdrojů Workbenche. Můžete použít kterýkoli pro navigaci a otevírání souborů skriptů.
3. **File > Open:** Standardní dialog pro otevření souboru.
4. **Výstup chyb:** Dvojklikem na chybu kompilátoru přejdete na soubor a řádek.

### Zvýrazňování syntaxe

| Prvek | Zvýrazněno |
|---------|-------------|
| Klíčová slova (`class`, `if`, `while`, `return`, `modded`, `override`) | Tučně / barva klíčových slov |
| Typy (`int`, `float`, `string`, `bool`, `vector`, `void`) | Barva typů |
| Řetězce, komentáře, direktivy preprocesoru | Odlišné barvy |

### Doplňování kódu

Napište název třídy následovaný `.` pro zobrazení metod a polí, nebo stiskněte `Ctrl+Space` pro návrhy. Doplňování je založeno na zkompilovaném kontextu skriptu. Je funkční, ale omezené ve srovnání s VS Code -- nejlepší pro rychlé vyhledávání API.

### Zpětná vazba kompilátoru

Workbench kompiluje při uložení. Běžné chyby:

| Zpráva | Význam |
|---------|---------|
| `Undefined variable 'xyz'` | Nedeklarováno nebo překlep |
| `Method 'Foo' not found in class 'Bar'` | Špatný název metody nebo třídy |
| `Cannot convert 'string' to 'int'` | Neshoda typů |
| `Type 'MyClass' not found` | Soubor není v projektu |

### Hledání, nahrazování a přechod na definici

- `Ctrl+F` / `Ctrl+H` -- hledání/nahrazování v aktuálním souboru.
- `Ctrl+Shift+F` -- hledání napříč všemi soubory projektu.
- Klikněte pravým tlačítkem na symbol a vyberte **Go to Definition** pro přechod na jeho deklaraci, i do vanilkových skriptů.

---

## Ladění skriptů

Ladění je nejsilnější funkcí Workbenche -- pozastavte běžící instanci DayZ, prozkoumejte každou proměnnou a krokujte kódem řádek po řádku.

### Předpoklady

- **DayZDiag_x64.exe** (ne retailové DayZ) -- ladění podporuje pouze Diag build.
- **Připojený disk P:** s extrahovanými vanilkovými skripty.
- **Skripty se musí shodovat** -- pokud editujete po načtení hry, čísla řádků nebudou odpovídat.

### Nastavení ladicí relace

1. Otevřete Workbench a načtěte svůj projekt.
2. Otevřete modul **Script Editor** (z panelu nabídek nebo dvojklikem na jakýkoli `.c` soubor v prohlížeči zdrojů -- tím se automaticky otevře editor skriptů a načte soubor).
3. Spusťte DayZDiag samostatně:

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

4. Workbench automaticky detekuje DayZDiag a připojí se. V pravém dolním rohu obrazovky se krátce zobrazí vyskakovací okno potvrzující připojení.

> **Tip:** Pokud potřebujete pouze vidět výstup konzole (žádné breakpointy ani krokování), nemusíte extrahovat PBO ani načítat skripty do Workbenche. Editor skriptů se stále připojí k DayZDiag a zobrazí proud výstupu. Nicméně breakpointy a navigace kódem vyžadují načtení odpovídajících souborů skriptů v projektu.

### Breakpointy

Klikněte na levý okraj vedle čísla řádku. Objeví se červená tečka.

| Značka | Význam |
|--------|---------|
| Červená tečka | Aktivní breakpoint -- provádění se zde pozastaví |
| Žlutý vykřičník | Neplatný -- tento řádek se nikdy nespustí |
| Modrá tečka | Záložka -- pouze navigační značka |

Přepínání pomocí `F9`. Můžete také kliknout levým tlačítkem přímo v oblasti okraje (kde se zobrazují červené tečky) pro přidání nebo odebrání breakpointů. Kliknutí pravým tlačítkem v okraji přidá modrou **záložku** -- záložky nemají žádný vliv na provádění, ale označují místa, ke kterým se chcete vrátit. Klikněte pravým tlačítkem na breakpoint pro nastavení **podmínky** (např. `i == 10` nebo `player.GetIdentity().GetName() == "TestPlayer"`).

### Krokování kódem

| Akce | Klávesová zkratka | Popis |
|--------|----------|-------------|
| Pokračovat | `F5` | Spustit do dalšího breakpointu |
| Krok přes | `F10` | Provést aktuální řádek, přejít na další |
| Krok dovnitř | `F11` | Vstoupit do volané funkce |
| Krok ven | `Shift+F11` | Spustit, dokud se aktuální funkce nevrátí |
| Zastavit | `Shift+F5` | Odpojit a obnovit hru |

### Inspekce proměnných

Panel **Locals** zobrazuje všechny proměnné v rozsahu -- primitivy s hodnotami, objekty s názvy tříd (rozbalitelné), pole s délkami a NULL reference jasně označené. Panel **Watch** vyhodnocuje vlastní výrazy při každém pozastavení. **Call Stack** zobrazuje řetězec volání funkcí; klikněte na položky pro navigaci.

### Ladění klienta vs serveru

`DayZDiag_x64.exe` může fungovat jako klient i server (přidáním parametru spuštění `-server`). Přijímá všechny stejné parametry jako retailový spustitelný soubor. Workbench se může připojit k oběma instancím.

Použijte **Debug > Debug Client** nebo **Debug > Debug Server** v nabídce editoru skriptů pro výběr, kterou stranu ladit. Na listen serveru můžete volně přepínat. Ovládací prvky krokování, breakpointy a inspekce proměnných se vztahují na tu stranu, která je aktuálně vybrána.

### Omezení

- Ladění podporuje pouze `DayZDiag_x64.exe`, ne retailové buildy.
- Do interních C++ funkcí enginu nelze vstoupit.
- Mnoho breakpointů ve vysokofrekvenčních funkcích (`OnUpdate`) způsobuje vážné zpomalení.
- Velké modové projekty mohou zpomalit indexování Workbenche.

---

## Skriptová konzole --- Živé testování

Skriptová konzole vám umožňuje spouštět příkazy Enforce Scriptu proti běžící instanci hry -- neocenitelné pro experimentování s API bez editace souborů.

### Otevření

Hledejte záložku **Console** ve spodním panelu, nebo povolte přes **View > Console**.

### Běžné příkazy

```c
// Vypsat pozici hráče
Print(GetGame().GetPlayer().GetPosition().ToString());

// Vytvořit předmět u nohou hráče
GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition(), false, false, true);

// Testovat matematiku
float dist = vector.Distance("0 0 0", "100 0 100");
Print("Distance: " + dist.ToString());

// Teleportovat hráče
GetGame().GetPlayer().SetPosition("6737 0 2505");

// Vytvořit zombie v okolí
vector pos = GetGame().GetPlayer().GetPosition();
for (int i = 0; i < 5; i++)
{
    vector offset = Vector(Math.RandomFloat(-5, 5), 0, Math.RandomFloat(-5, 5));
    GetGame().CreateObject("ZmbF_JournalistNormal_Blue", pos + offset, false, false, true);
}
```

### Omezení

- **Pouze na straně klienta** ve výchozím nastavení (serverový kód vyžaduje listen server).
- **Žádný trvalý stav** -- proměnné se nepřenášejí mezi spuštěními.
- **Některá API nedostupná**, dokud hra nedosáhne určitého stavu (hráč spawnutý, mise načtená).
- **Žádné zotavení z chyb** -- nulové ukazatele jednoduše tiše selžou.

---

## Náhled UI / Layoutu

Workbench může otevírat `.layout` soubory pro vizuální inspekci.

### Co můžete dělat

- **Zobrazit hierarchii widgetů** -- vidět vnořování rodič-potomek a názvy widgetů.
- **Inspektovat vlastnosti** -- pozice, velikost, barva, alfa, zarovnání, zdroj obrázku, text, font.
- **Najít názvy widgetů** používané `FindAnyWidget()` v kódu skriptu.
- **Kontrolovat reference obrázků** -- které záznamy sady obrázků nebo textury widget používá.

### Co nemůžete dělat

- **Žádné chování za běhu** -- handlery ScriptClass a dynamický obsah se nespouštějí.
- **Rozdíly v renderování** -- průhlednost, vrstvení a rozlišení se mohou lišit od hry.
- **Omezená editace** -- Workbench je primárně prohlížeč, ne vizuální návrhář.

**Doporučený postup:** Použijte editor layoutu pro inspekci. Vytvářejte a upravujte `.layout` soubory v textovém editoru. Testujte ve hře s file patchingem.

---

## Prohlížeč zdrojů

Prohlížeč zdrojů naviguje disk P: s náhledy souborů s povědomím o hře.

### Schopnosti

| Typ souboru | Akce při dvojkliku |
|-----------|----------------------|
| `.c` | Otevře v editoru skriptů |
| `.layout` | Otevře v editoru layoutu |
| `.p3d` | Náhled 3D modelu (otáčení, zoom, inspekce LODů) |
| `.paa` / `.edds` | Prohlížeč textur s inspekcí kanálů (R, G, B, A) |
| Konfigurační třídy | Procházení parsovaných hierarchií CfgVehicles, CfgWeapons |

### Hledání vanilkových zdrojů

Jedno z nejcennějších použití -- studium toho, jak Bohemia strukturuje assety:

```
P:\DZ\weapons\        <-- Vanilkové modely zbraní a textury
P:\DZ\characters\     <-- Modely postav a oblečení
P:\scripts\4_World\   <-- Vanilkové world skripty
P:\scripts\5_Mission\  <-- Vanilkové mission skripty
```

---

## Profilování výkonu

Při připojení k DayZDiag může Workbench profilovat provádění skriptů.

### Co profilér zobrazuje

- **Počty volání funkcí** -- jak často se každá funkce spouští za snímek.
- **Doba provádění** -- milisekundy na funkci.
- **Hierarchie volání** -- které funkce volají které, s přiřazením času.
- **Rozbor času snímku** -- čas skriptů vs čas enginu. Při 60 FPS má každý snímek ~16,6 ms rozpočet.
- **Paměť** -- počty alokací podle třídy, detekce úniků ref-cyklů.

### Herní profilér skriptů (Diag Menu)

Kromě profiléru Workbenche má `DayZDiag_x64.exe` vestavěný profilér skriptů přístupný přes Diag Menu (pod Statistics). Zobrazuje top-20 seznamy pro čas na třídu, čas na funkci, alokace tříd, počet na funkci a počty instancí tříd. Použijte parametr spuštění `-profile` pro povolení profilování od startu. Profilér měří pouze Enforce Script -- proto (engine) metody se neměří jako samostatné záznamy, ale jejich doba provádění je zahrnuta v celkovém čase skriptové metody, která je volá. Viz `EnProfiler.c` ve vanilkových skriptech pro programové API (`EnProfiler.Enable`, `EnProfiler.SetModule`, konstanty příznaků).

### Běžná úzká místa

| Problém | Symptom profiléru | Oprava |
|---------|-----------------|-----|
| Náročný kód běžící každý snímek | Vysoký čas v `OnUpdate` | Přesuňte na časovače, snižte frekvenci |
| Nadměrná iterace | Smyčka s tisíci volání | Cache výsledků, použijte prostorové dotazy |
| Konkatenace řetězců ve smyčkách | Vysoký počet alokací | Omezte logování, sdružujte řetězce |

---

## Integrace s File Patchingem

Nejrychlejší vývojový pracovní postup kombinuje Workbench s file patchingem, čímž se eliminují přestavby PBO pro změny skriptů.

### Nastavení

1. Skripty na disku P: jako volné soubory (ne v PBO).
2. Symbolický odkaz skriptů instalace DayZ: `mklink /J "...\DayZ\scripts" "P:\scripts"`
3. Spuštění s `-filePatching`: klient i server používají `DayZDiag_x64.exe`.

### Smyčka rychlé iterace

```
1. Upravte .c soubor ve vašem editoru
2. Uložte (soubor je již na disku P:)
3. Restartujte misi v DayZDiag (bez přestavby PBO)
4. Testujte ve hře
5. Nastavte breakpointy ve Workbenchi, pokud je potřeba
6. Opakujte
```

### Co vyžaduje přestavbu?

| Změna | Přestavba? |
|--------|----------|
| Logika skriptů (`.c`) | Ne -- restartujte misi |
| Layoutové soubory (`.layout`) | Ne -- restartujte misi |
| Config.cpp (pouze skripty) | Ne -- restartujte misi |
| Config.cpp (s CfgVehicles) | Ano -- binarizované konfigurace vyžadují PBO |
| Textury (`.paa`) | Ne -- engine přenačítá z P: |
| Modely (`.p3d`) | Možná -- pouze nebinarizované MLOD |

---

## Běžné problémy Workbenche

### Workbench padá při spuštění

**Příčina:** Disk P: není připojen nebo `.gproj` odkazuje na neexistující cesty.
**Oprava:** Nejprve připojte P:. Zkontrolujte **Workbench > Options** adresář zdrojů. Ověřte, že cesty FileSystem v `.gproj` existují.

### Žádné doplňování kódu

**Příčina:** Projekt je špatně nakonfigurovaný -- Workbench nemůže kompilovat skripty.
**Oprava:** Ověřte, že ScriptModules v `.gproj` zahrnují vanilkové cesty (`scripts/1_Core` atd.). Zkontrolujte výstup pro chyby kompilátoru. Ujistěte se, že vanilkové skripty jsou na P:.

### Skripty se nekompilují

**Oprava:** Zkontrolujte panel výstupu pro přesné chyby. Ověřte, že všechny cesty závislostních modů jsou ve ScriptModules. Ujistěte se, že nejsou křížové reference vrstev (3_Game nemůže používat typy z 4_World).

### Breakpointy se nespouštějí

**Kontrolní seznam:**
1. Připojeno k DayZDiag (ne retailovému)?
2. Červená tečka (platný) nebo žlutý vykřičník (neplatný)?
3. Shodují se skripty mezi Workbenchem a hrou?
4. Ladíte správnou stranu (klient vs server)?
5. Je cesta kódu skutečně dosažena? (Přidejte `Print()` pro ověření.)

### Nelze najít soubory v prohlížeči zdrojů

**Oprava:** Zkontrolujte, že FileSystem v `.gproj` zahrnuje adresář, kde vaše soubory žijí. Restartujte Workbench po úpravě `.gproj`.

### Chyby "Plugin Not Found"

**Oprava:** Ověřte integritu DayZ Tools přes Steam (pravé tlačítko > Vlastnosti > Nainstalované soubory > Ověřit). V případě potřeby přeinstalujte.

### Připojení k DayZDiag selhává

**Oprava:** Oba procesy musí být na stejném počítači. Zkontrolujte firewally. Ujistěte se, že modul editoru skriptů je otevřen před spuštěním DayZDiag. Zkuste restartovat oba.

---

## Tipy a doporučené postupy

1. **Používejte Workbench pro ladění, VS Code pro psaní.** Editor Workbenche je základní. Používejte externí editory pro každodenní kódování; přepněte na Workbench pro ladění a náhled layoutu.

2. **Mějte .gproj pro každý mod.** Každý mod by měl mít svůj vlastní projektový soubor pro kompilaci přesně správného kontextu skriptů bez indexování nesouvisejících modů.

3. **Používejte konzoli pro experimentování s API.** Testujte volání API v konzoli před zápisem do souborů. Rychlejší než cykly editace-restart-test.

4. **Profilujte před optimalizací.** Nehádejte úzká místa. Profilér ukazuje, kde se čas skutečně tráví.

5. **Nastavujte breakpointy strategicky.** Vyhněte se breakpointům v `OnUpdate()`, pokud nejsou podmíněné. Spouštějí se každý snímek a neustále zamrazují hru.

6. **Používejte záložky pro navigaci.** Modré záložkové tečky označují zajímavá místa ve vanilkových skriptech, na která se často odkazujete.

7. **Kontrolujte výstup kompilátoru před spuštěním.** Pokud Workbench hlásí chyby, hra selže také. Opravte chyby ve Workbenchi nejprve -- rychlejší než čekat na boot hry.

8. **Používejte -mod pro jednoduchá nastavení, .gproj pro složitá.** Jeden mod bez závislostí: `-mod=P:\MyMod`. Více modů s CF/Dabs: vlastní `.gproj`.

9. **Udržujte Workbench aktualizovaný.** Aktualizujte DayZ Tools přes Steam při aktualizaci DayZ. Neshodné verze způsobují selhání kompilace.

---

## Rychlá reference: Klávesové zkratky

| Zkratka | Akce |
|----------|--------|
| `F5` | Spustit / Pokračovat v ladění |
| `Shift+F5` | Zastavit ladění |
| `F9` | Přepnout breakpoint |
| `F10` | Krok přes |
| `F11` | Krok dovnitř |
| `Shift+F11` | Krok ven |
| `Ctrl+F` | Najít v souboru |
| `Ctrl+H` | Najít a nahradit |
| `Ctrl+Shift+F` | Najít v projektu |
| `Ctrl+S` | Uložit |
| `Ctrl+Space` | Doplňování kódu |

## Rychlá reference: Parametry spuštění

| Parametr | Popis |
|-----------|-------------|
| `-project="cesta/dayz.gproj"` | Načíst konkrétní projektový soubor |
| `-mod=P:\MyMod` | Automatická konfigurace z config.cpp modu |
| `-mod=P:\ModA;P:\ModB` | Více modů (oddělené středníkem) |

---

## Navigace

| Předchozí | Nahoru | Další |
|----------|----|------|
| [4.6 Balení PBO](06-pbo-packing.md) | [Část 4: Formáty souborů a DayZ Tools](01-textures.md) | [4.8 Modelování budov](08-building-modeling.md) |
