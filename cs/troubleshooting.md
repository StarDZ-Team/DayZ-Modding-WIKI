# Pruvodce resenim problemu

[Domu](./README.md) | **Pruvodce resenim problemu**

---

> Kdyz se neco pokazi, zacnete zde. Tento pruvodce je organizovan podle **toho, co vidite** (symptomu), ne podle systemu. Najdete svuj problem, prectete pricinu, aplikujte opravu.

---

## Obsah

1. [Mod se nenacte](#1-mod-se-nenacte)
2. [Chyby skriptu](#2-chyby-skriptu)
3. [Problemy s RPC a siti](#3-problemy-s-rpc-a-siti)
4. [Problemy s UI](#4-problemy-s-ui)
5. [Problemy se sestavenim a PBO](#5-problemy-se-sestavenim-a-pbo)
6. [Problemy s vykonem](#6-problemy-s-vykonem)
7. [Problemy s predmety, vozidly a entitami](#7-problemy-s-predmety-vozidly-a-entitami)
8. [Problemy s konfiguraci a typy](#8-problemy-s-konfiguraci-a-typy)
9. [Problemy s perzistenci](#9-problemy-s-perzistenci)
10. [Rozhodovaci vyvojove diagramy](#10-rozhodovaci-vyvojove-diagramy)
11. [Rychla reference ladici prikazu](#11-rychla-reference-ladici-prikazu)
12. [Umisteni log souboru](#12-umisteni-log-souboru)
13. [Kde ziskat pomoc](#13-kde-ziskat-pomoc)

---

## 1. Mod se nenacte

Problemy, kdy se mod nezobrazi, neaktivuje, nebo je hrou odmitnut pri spusteni.

| Symptom | Pricina | Oprava |
|---------|---------|--------|
| Chyba "Addon requires addon X" pri spusteni | Chybejici nebo nesprávny zaznam `requiredAddons[]` | Pridejte presny nazev tridy `CfgPatches` zavislosti do vaseho `requiredAddons[]`. Nazvy rozlisuji velka a mala pismena. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md). |
| Mod neni viditelny v launcheru | Soubor `mod.cpp` chybi nebo ma syntakticke chyby | Vytvorte nebo opravte `mod.cpp` v koreni modu. Musi obsahovat pole `name`, `author` a `dir`. Viz [Kapitola 2.3](02-mod-structure/03-mod-cpp.md). |
| "Config parse error" pri spusteni | Syntakticka chyba v `config.cpp` | Zkontrolujte chybejici stredniky za zaviraci tridy (`};`), neuzavrene zavorky nebo neodpovidajici uvozovky. Kazde telo tridy konci `};`, kazda vlastnost konci `;`. |
| Zadne zaznamy ve skriptovem logu | Blok `CfgMods` `defs` ukazuje na spatnou cestu | Overte, ze vas zaznam `CfgMods` v `config.cpp` ma spravny `dir` a ze definicni soubor skriptu odpovida vasi adresarove strukture. Engine tise ignoruje spatne cesty. |
| Mod se nacte, ale nic se nedeje | Skripty se kompiluji, ale nikdy se nevykonaji | Zkontrolujte, ze vas mod ma vstupni bod: `modded class MissionServer` nebo `MissionGameplay`, registrovany modul nebo plugin. Skripty se samy od sebe nespousteji. Viz [Kapitola 7.2](07-patterns/02-module-systems.md). |
| "Cannot register cfg class X" | Duplicitni nazev tridy `CfgPatches` | Jiny mod jiz pouziva tento nazev tridy. Prejmenovejte vasi tridu `CfgPatches` na neco unikatniho s prefixem vaseho modu. |
| Mod funguje pouze v singleplayeru | Server nema mod nainstalovany | Ujistete se, ze spousteci parametr `-mod=` serveru obsahuje cestu k vasemu modu a PBO je ve slozce `@VasMod/Addons/` serveru. |
| "Addon X is not signed" | Server vyzaduje podepsane addony | Podepiste vase PBO vasim soukromym klicem a poskytnete `.bikey` do slozky `keys/` serveru. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md). |

---

## 2. Chyby skriptu

Tyto se objevi ve skriptovem logu jako radky `SCRIPT (E):` nebo `SCRIPT ERROR:`.

| Symptom | Pricina | Oprava |
|---------|---------|--------|
| `Null pointer access` | Pristup k promenne, ktera je `null` | Pridejte kontrolu null pred pouzitim promenne: `if (myVar) { myVar.DoSomething(); }`. Toto je nejcastejsi chyba za behu. |
| `Cannot convert type 'X' to type 'Y'` | Prime pretypovani mezi nekompatibilnimi typy | Pouzijte `Class.CastTo()` pro bezpecne pretypovani smerem dolu: `Class.CastTo(result, source);`. Nikdy nepredpokladejte, ze pretypovani uspeje. Viz [Kapitola 1.9](01-enforce-script/09-casting-reflection.md). |
| `Undefined variable 'X'` | Prekep, spatny scope nebo spatna vrstva | Zkontrolujte nejdrive pravopis. Pokud je promenna trida z jineho souboru, ujistete se, ze je definovana ve stejne nebo nizsi vrstve. `3_Game` nemuze videt typy z `4_World`. Viz [Kapitola 2.1](02-mod-structure/01-five-layers.md). |
| `Method 'X' not found` | Volani metody, ktera na dane tride neexistuje | Overte nazev metody a zkontrolujte rodicovskou tridu. Mozna budete muset nejdrive pretypovat na specifictejsi typ. Zkontrolujte vanilla skripty v `P:\DZ\scripts\` pro spravne API. |
| `Division by zero` | Deleni promennou, ktera se rovna `0` | Pridejte guard: `if (divisor != 0) result = value / divisor;`. Plati take pro modulo (`%`) operace. |
| `Redeclaration of variable 'X'` | Stejny nazev promenne deklarovan v sourozeneckych blocich `else if` | Deklarujte promennou jednou pred retezem `if`/`else` a potom priradte uvnitr kazde vetvi. Viz [Kapitola 1.12](01-enforce-script/12-gotchas.md). |
| `Member already defined` | Duplicitni nazev promenne nebo metody ve tride | Zkontrolujte chyby copy/paste. Kazdy nazev clena musi byt unikatni v ramci hierarchie trid (vcetne rodicovskych trid). |
| `Stack overflow` | Nekonecna rekurze | Metoda vola sama sebe bez zakladniho pripadu, nebo override `modded class` nema spravnou ochranu proti opetovnemu vstupu. Pridejte kontrolu hloubky nebo opravte rekurzivni volani. |
| `Index out of range` | Pristup k poli s neplatnym indexem | Vzdy zkontrolujte `array.Count()` nebo pouzijte `array.IsValidIndex(idx)` pred pristupem podle indexu. |
| Syntakticka chyba bez jasne zpravy | Zpetne lomitko `\` nebo escape uvozovky `\"` v retezcovem literalu | CParser Enforce Scriptu nepodporuje `\\` nebo `\"`. Pouzijte lomitka pro cesty (`"my/path/file"`). Pro uvozovky pouzijte jednoduche uvozovky. Viz [Kapitola 1.12](01-enforce-script/12-gotchas.md). |
| `JsonFileLoader` vraci null data | Prirazeni navratove hodnoty `JsonLoadFile()` | `JsonLoadFile()` vraci `void`. Prealokujte objekt a predejtej jej referenci: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Viz [Kapitola 6.8](06-engine-api/08-file-io.md). |
| `Object.IsAlive()` neexistuje | Volani `IsAlive()` na zakladnim `Object` | `IsAlive()` je pouze na `EntityAI`. Nejdrive pretypujte: `EntityAI entity; if (Class.CastTo(entity, obj) && entity.IsAlive()) { ... }` |
| Zadna podpora ternarniho operatoru | Pouziti syntaxe `condition ? a : b` | Enforce Script nema ternarni operator. Pouzijte blok `if`/`else`. Viz [Kapitola 1.12](01-enforce-script/12-gotchas.md). |
| Chyba smycky `do...while` | Pouziti `do { } while(cond)` | Enforce Script nepodporuje `do...while`. Pouzijte smycku `while` s podminkou `break`. Viz [Kapitola 1.12](01-enforce-script/12-gotchas.md). |

---

## 3. Problemy s RPC a siti

Problemy se vzdalenymi volanimi procedur a komunikaci klient-server.

| Symptom | Pricina | Oprava |
|---------|---------|--------|
| RPC odeslano, ale nikdy neprijato | Nesoulad registrace | Odesilatel i prijemce musi zaregistrovat stejne RPC ID. Overte, ze ID presne odpovida na obou stranach. Viz [Kapitola 6.9](06-engine-api/09-networking.md). |
| RPC prijato, ale data jsou poskozena | Nesoulad parametru cteni/zapisu | Volani `Write()` odesilatele a `Read()` prijemce musi mit stejne typy ve stejnem poradi. Jediny nesoulad povredi vsechna nasledna cteni. |
| RPC zpusobi pad serveru | Null cilova entita nebo spatne typy parametru | Ujistete se, ze cilova entita existuje na obou stranach. Nikdy neposilejte `null` jako cil RPC. Validujte vsechny prectene parametry pred pouzitim. |
| Data se nesynchronizuji na klienty | Chybejici `SetSynchDirty()` | Po zmene jakekoli promenne registrovane pro synchronizaci zavolejte `SetSynchDirty()` na entite. Bez toho engine neodvysila zmeny. |
| Funguje v singleplayeru/listen serveru, selhava na dedicatem | Ruzne cesty kodu pro listen vs. dedicaty | Na listen serveru bezi klient i server v jednom procesu, coz skryva casove a null problemy. Vzdy testujte na dedicovanem serveru. Zkontrolujte guardy `GetGame().IsServer()` a `GetGame().IsMultiplayer()`. |
| Zahlceni RPC a zpozdeni serveru | Odesilani RPC kazdy frame nebo v tesnych smyckach | Omezte volani RPC casovaci nebo akumulatory. Seskupte vice malych aktualizaci do jednoho RPC. Pro casto se menici data pouzijte Net Sync Variables. |

---

## 4. Problemy s UI

Problemy s GUI layouty, widgety, menu a vstupem.

| Symptom | Pricina | Oprava |
|---------|---------|--------|
| Layout se nacte, ale nic neni viditelne | Velikost widgetu je nula | Zkontrolujte hodnoty `hexactsize` a `vexactsize`. Obe musi byt vetsi nez nula. Nepouzivejte zaporne velikosti. Viz [Kapitola 3.3](03-gui-system/03-sizing-positioning.md). |
| `CreateWidgets()` vraci null | Cesta k layout souboru je spatna nebo soubor chybi | Overte cestu k `.layout` souboru (lomitka, zadne preklepy). Engine tise vraci `null` pri spatnych cestach, zadna chyba se nezaloguje. |
| Widgety existuji, ale nelze na ne kliknout | Jiny widget zakryva tlacitko | Zkontrolujte `priority` widgetu (z-porad). Widgety s vyssi prioritou se vykresluji navrch a zachytavaji vstup jako prvni. |
| Herní vstup je zaseknuty / nelze se pohybovat po zavreni UI | Volani `ChangeGameFocus()` jsou nevyvazena | Kazde `GetGame().GetInput().ChangeGameFocus(1)` musi byt sparovano s `ChangeGameFocus(-1)`. Sledujte zmeny fokusu a zajistete, ze cleanup probehne i pri vynucenem zavreni. |
| Text zobrazuje `#STR_some_key` doslova | Zaznam stringtable chybi nebo soubor neni nacten | Pridejte klic do vaseho `stringtable.csv`. Zkontrolujte, ze CSV je v koreni modu a ma spravny format hlavicky. |
| Kurzor mysi se neobjevi | Nezavolano `ShowUICursor()` | Zavolejte `GetGame().GetUIManager().ShowUICursor(true)` pri otevreni vaseho UI. Zavolejte s `false` pri zavirani. |
| ScrollWidget obsah se neroluje | Obsah neni uvnitr WrapSpacer nebo potomkovskeho widgetu | ScrollWidget potrebuje jednoho potomka (obvykle `WrapSpacer` nebo `FrameWidget`), ktery je vetsi nez oblast rolovani. Umistete sve widgety obsahu dovnitr tohoto potomka. |

---

## 5. Problemy se sestavenim a PBO

Problemy s balenimm, binarizaci a nasazenim modu.

| Symptom | Pricina | Oprava |
|---------|---------|--------|
| "Include file not found" behem binarizace | Config odkazuje na soubor, ktery neexistuje | Zkontrolujte, ze vsechny cesty `#include` v konfiguraci modelu a rvmatech jsou spravne. Ujistete se, ze P: disk je pripojen. |
| PBO se uspesne sestavi, ale mod pada pri nacteni | Chyba binarizace `config.cpp` | Zkuste sestavit s vypnutou binarizaci pro izolovani problemu. |
| "Signature check failed" pri pripojeni k serveru | PBO neni podepsane nebo je podepsane spatnym klicem | Znovu podepiste PBO vasim soukromym klicem. Ujistete se, ze server ma odpovidajici `.bikey` ve slozce `keys/`. |
| Zmeny file patchingu se neprojevi | Nepouziva se diagnosticky spustitelny soubor | File patching funguje pouze s `DayZDiag_x64.exe`, ne s retail `DayZ_x64.exe`. Spustte s parametrem `-filePatching`. |
| Stara verze modu se nacita i presto zmeny | Cachovane PBO nebo verze z workshopu prepisuje | Smazte stare PBO. Zkontrolujte, ze hra nenacita cachovanou verzi z workshopu. Overte, ze cesta `-mod=` ukazuje na vasi vyvojovou slozku. |

---

## 6. Problemy s vykonem

Poklesy FPS serveru nebo klienta, problemy s pameti a pomale operace.

| Symptom | Pricina | Oprava |
|---------|---------|--------|
| Nizke FPS serveru (pod 20) | Tezke zpracovani v `OnUpdate()` nebo per-frame metodach | Pouzijte akumulator delta-casu pro omezeni prace: vykonavejte logiku pouze kazdych N sekund. Presunte nakladne operace do casovaci nebo planovanych callbacku. Viz [Kapitola 7.7](07-patterns/07-performance.md). |
| Pamet roste v case (unik pameti) | Cykly `ref` referenci branici garbage collection | Kdyz dva objekty drzi `ref` reference na sebe navzajem, ani jeden neni nikdy uvolnen. Udelejte jednu stranu raw (ne-`ref`) referenci. Prerusujte cykly v metodach cisteni. Viz [Kapitola 1.8](01-enforce-script/08-memory-management.md). |
| Pomaly start serveru | Tezka inicializace v `OnInit` | Odlozte nekritickou inicializaci pomoci `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater()`. Nacitejte konfigurace line pri prvnim pouziti misto vsech pri startu. |
| Sitove prodlevy | Prilis mnoho RPC nebo velke RPC datove zateze | Seskupte male aktualizace do mensich RPC. Pouzijte Net Sync Variables pro casto se menici hodnoty. |
| Log soubor velmi rychle roste | Nadmerne `Print()` nebo debugovaci logovani | Odstrante nebo omezte debugovaci `Print()` volani za `#ifdef DEVELOPER` nebo debugovaci priznak. |

---

## 7. Problemy s predmety, vozidly a entitami

Problemy s vlastnimi predmety, vozidly a svetovymi entitami.

| Symptom | Pricina | Oprava |
|---------|---------|--------|
| Predmet se nespawni (admin nastroje hlasi "cannot create") | `scope=0` v konfiguraci nebo chybi v `types.xml` | Nastavte `scope=2` v konfiguraci `CfgVehicles` vaseho predmetu pro predmety, ktere by mely byt spawnovatelne. Pridejte zaznam do serveroveho `types.xml`. |
| Predmet se spawni, ale je neviditelny | Cesta k modelu (`.p3d`) je spatna nebo chybi | Zkontrolujte cestu `model` ve vasi tride `CfgVehicles`. Pouzijte lomitka. Overte, ze `.p3d` soubor existuje a je zabalen ve vasem PBO. |
| Predmet nelze zvednout | Nespravna geometrie nebo spatny `inventorySlot` | Overte, ze predmet ma spravnou Fire Geometry v modelu. Zkontrolujte, ze `itemSize[]` je spravne nastavena. |
| Entita je ihned smazana po spawnu | `lifetime` je nula v `types.xml` nebo problem se scope | Nastavte vhodnou hodnotu `lifetime` v `types.xml`. Zajistete `scope=2` v konfiguraci. |
| Prilohy se nepripevni k predmetu | Spatne nazvy `inventorySlot` | Nazvy slotu priloh musi presne odpovidat mezi polem `attachments[]` rodicovskeho predmetu a polem `inventorySlot[]` potomkovskeho predmetu. Nazvy rozlisuji velka a mala pismena. |

---

## 8. Problemy s konfiguraci a typy

Problemy s `config.cpp`, `types.xml` a dalsimi konfiguracnimi soubory.

| Symptom | Pricina | Oprava |
|---------|---------|--------|
| Konfiguracni hodnoty se neprojevi | Pouziti binarizovane konfigurace, ale editace zdroje | Po zmenach konfigurace znovu sestavte vase PBO. |
| Zmeny `types.xml` jsou ignorovany | Editace spatneho souboru `types.xml` | Server nacita typy z `mpmissions/your_mission/db/types.xml`. Editace souboru types jinde nema zadny ucinek. |
| "Error loading types" pri startu serveru | Syntakticka chyba XML v `types.xml` | Zvalidujte vase XML. Caste problemy: neuzavrene tagy, chybejici uvozovky u hodnot atributu, nebo `&` misto `&amp;`. |
| JSON konfiguracni soubor se nenacita | Poskozeny JSON nebo spatna cesta | Zvalidujte syntaxi JSON (zadne carkky za poslednim prvkem, spravne uvozovky). Pouzijte prefix `$profile:` pro cesty profilu serveru. |

---

## 9. Problemy s perzistenci

Problemy s ukladanim a nacitanim dat pres restarty serveru.

| Symptom | Pricina | Oprava |
|---------|---------|--------|
| Data hrace ztracena pri restartu | Neuklada se do adresare `$profile:` | Pouzijte `JsonFileLoader<T>.JsonSaveFile()` s cestou `$profile:`. Ukladejte pri odpojeni hrace a periodicky behem hry. |
| Ulozeny soubor je prazdny nebo poskozeny | Pad behem zapisu nebo chyba serializace | Zapisujte nejdrive do docasneho souboru a pak prejmenujte na finalni cestu. Validujte data pred ulozenim. |
| Nesoulad `OnStoreSave`/`OnStoreLoad` | Verze se zmenila, ale zadna migrace | Vzdy nejdrive zapiste cislo verze. Pri nacteni prectete verzi a zpracujte stare formaty. |
| Predmety mizi z uloziste | `lifetime` vyprsel v `types.xml` | Zvyste `lifetime` pro persistentni predmety. |

---

## 10. Rozhodovaci vyvojove diagramy

Krokove diagnosticke procesy pro caste situace "to nefunguje".

### "Muj mod vubec nefunguje"

1. **Zkontrolujte skriptovy log** pro chyby `SCRIPT (E)`. Opravte prvni chybu, kterou najdete. (Sekce 2)
2. **Je mod uveden v launcheru?** Pokud ne, zkontrolujte, ze `mod.cpp` existuje a je validni. (Sekce 1)
3. **Zminuje log vasi tridu CfgPatches?** Pokud ne, zkontrolujte syntaxi `config.cpp`, `requiredAddons[]` a spousteci parametr `-mod=`.
4. **Kompiluji se skripty?** Hledejte chyby kompilace v RPT. Opravte vsechny syntakticke chyby. (Sekce 2)
5. **Existuje vstupni bod?** Potrebujete `modded class MissionServer`/`MissionGameplay`, registrovany modul nebo plugin.
6. **Stale nic?** Pridejte `Print("MY_MOD: Init reached");` na vas vstupni bod pro potvrzeni vykonavani.

### "Funguje offline, ale ne na dedicovanem serveru"

1. **Je mod nainstalovany na serveru?** Zkontrolujte, ze `-mod=` obsahuje cestu k vasemu modu a PBO je v `@VasMod/Addons/`.
2. **Kod pouze pro klienta na serveru?** `GetGame().GetPlayer()` vraci `null` behem inicializace serveru. Pridejte guardy `GetGame().IsServer()` / `GetGame().IsClient()`.
3. **Funguji RPC?** Pridejte `Print()` na obe strany odeslani a prijmu. Zkontrolujte, ze RPC ID odpovida a cilova entita existuje na obou stranach. (Sekce 3)
4. **Synchronizuji se data?** Overte, ze `SetSynchDirty()` je zavolano po zmenach.
5. **Casove problemy?** Listen servery skryvaji race conditions, protoze klient a server sdili jeden proces. Dedicovane servery je odhali.

### "Moje UI je rozbite"

1. **Vraci `CreateWidgets()` null?** Cesta k layoutu je spatna nebo soubor chybi.
2. **Widgety existuji, ale jsou neviditelne?** Zkontrolujte velikosti (musi byt > 0, zadne zaporne hodnoty). Zkontrolujte, ze je zavolano `Show(true)`.
3. **Viditelne, ale neklikatelne?** Zkontrolujte `priority` widgetu (z-porad). Overte, ze `ScriptClass` je prirazen.
4. **Vstup zaseknuty po zavreni UI?** Volani `ChangeGameFocus()` jsou nevyvazena.

---

## 11. Rychla reference ladici prikazu

Pouzijte tyto v debug konzoli DayZDiag nebo admin nastrojich.

| Akce | Prikaz |
|------|--------|
| Spawn predmetu na zemi | `GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition());` |
| Spawn vozidla (sestavene) | `EntityAI car = EntityAI.Cast(GetGame().CreateObject("OffroadHatchback", GetGame().GetPlayer().GetPosition())); if (car) car.OnDebugSpawn();` |
| Spawn zombie | `GetGame().CreateObject("ZmbM_Normal_00", GetGame().GetPlayer().GetPosition());` |
| Teleport na souradnice | `GetGame().GetPlayer().SetPosition("6543 0 2114".ToVector());` |
| Plne vyleceni | `GetGame().GetPlayer().SetHealth("", "", 5000);` |
| Nastavit poledne | `GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);` |
| Nastavit noc | `GetGame().GetWorld().SetDate(2024, 9, 15, 2, 0);` |
| Jasne pocasi | `GetGame().GetWeather().GetOvercast().Set(0,0,0); GetGame().GetWeather().GetRain().Set(0,0,0);` |
| Tisknout pozici | `Print(GetGame().GetPlayer().GetPosition());` |
| Kontrola server/klient | `Print("IsServer: " + GetGame().IsServer().ToString());` |

**Caste lokace Chernarus:** Elektro `"10570 0 2354"`, Cherno `"6649 0 2594"`, NWAF `"4494 0 10365"`, Tisy `"1693 0 13575"`, Berezino `"12121 0 9216"`

### Spousteci parametry

| Parametr | Ucel |
|----------|------|
| `-filePatching` | Nacteni rozbalenych souboru (vyzaduje DayZDiag) |
| `-scriptDebug=true` | Povoleni funkci ladeni skriptu |
| `-doLogs` | Povoleni podrobneho logovani |
| `-adminLog` | Povoleni admin logu na serveru |
| `-noSound` | Vypnuti zvuku (rychlejsi testovani) |
| `-noPause` | Server se nezastavi, kdyz je prazdny |
| `-profiles=<cesta>` | Vlastni profilovy/logovy adresar |
| `-connect=<ip>` | Auto-pripojeni k serveru pri spusteni |
| `-port=<port>` | Port serveru (vychozi 2302) |
| `-mod=@Mod1;@Mod2` | Nacteni modu (oddeleno strednikem) |
| `-serverMod=@Mod` | Pouze serverove mody (neodesila se klientum) |

---

## 12. Umisteni log souboru

Vedet, kam se divat, je pulka bitvy.

### Klientske logy

| Log | Umisteni | Obsah |
|-----|----------|-------|
| Skriptovy log | `%localappdata%\DayZ\` (nejnovejsi soubor `.RPT`) | Chyby skriptu, varovani, vystup `Print()` |
| Dump padu | `%localappdata%\DayZ\` (soubory `.mdmp`) | Data pro analyzu padu |
| Log Workbench | Vystupni panel Workbench IDE | Chyby kompilace behem vyvoje |

### Serverove logy

| Log | Umisteni | Obsah |
|-----|----------|-------|
| Skriptovy log | `<server_root>\profiles\` (nejnovejsi soubor `.RPT`) | Chyby skriptu, serverovy `Print()` |
| Admin log | `<server_root>\profiles\` (soubor `.ADM`) | Pripojeni hracu, zabiti, chat |
| Dump padu | `<server_root>\profiles\` (soubory `.mdmp`) | Data padu serveru |

### Efektivni cteni logu

- Hledejte `SCRIPT (E)` pro nalezeni chyb skriptu
- Hledejte `SCRIPT ERROR` pro nalezeni fatalnich problemu skriptu
- Hledejte nazev vaseho modu nebo nazvy trid pro filtrovani relevntnich zaznamu
- Chyby se casto kaskadovi -- opravte **prvni** chybu v logu, ne posledni

---

## 13. Kde ziskat pomoc

Kdyz tento pruvodce vase problem nevyresi, toto jsou nejlepsi zdroje.

### Zdroje komunity

| Zdroj | URL | Nejlepsi pro |
|-------|-----|-------------|
| DayZ Modding Discord | `discord.gg/dayzmods` | Pomoc v realnem case od zkusenych modderu |
| Bohemia Interactive Fora | `forums.bohemia.net/forums/forum/231-dayz-modding/` | Oficialni fora, oznameni |
| DayZ Feedback Tracker | `feedback.bistudio.com/tag/dayz/` | Oficialni hlaseni chyb |
| DayZ Workshop | Steam Workshop (DayZ) | Prochazeni publikovanych modu jako reference |

### Reference zdrojoveho kodu

Studujte tyto mody pro nauceni vzoru od zkusenych modderu:

| Mod | Co se naucite |
|-----|---------------|
| **Community Framework (CF)** | Zivotni cyklus modulu, sprava RPC, logovani |
| **DayZ Expansion** | Velkoformatova architektura modu, trzni system, vozidla |
| **Community Online Tools (COT)** | Admin nastroje, opravneni, vzory UI |
| **VPP Admin Tools** | Administrace serveru, opravneni, ESP |
| **Dabs Framework** | Vzor MVC, datove vazby, ramec UI komponent |

### Vanilla reference skriptu

Autoritativni reference pro vsechny tridy a metody enginu:

- Pripojte P: disk pres DayZ Tools
- Prejdete na `P:\DZ\scripts\`
- Organizovano podle vrstev: `3_Game/`, `4_World/`, `5_Mission/`
- Pouzijte vyhledavani editoru pro nalezeni libovolne vanilla tridy, metody nebo enumu

---

## Rychly rejstrik symptomu

Nemusite najit svuj problem ve vyse uvedenych sekcich? Zkuste tento abecedni rejstrik.

| Symptom (co vidite) | Prejdete na |
|----------------------|------------|
| Addon Builder selhava | [Sekce 5](#5-problemy-se-sestavenim-a-pbo) |
| Index pole mimo rozsah | [Sekce 2](#2-chyby-skriptu) |
| Tlacitka neklikatelna | [Sekce 4](#4-problemy-s-ui) |
| Nelze prevest typ | [Sekce 2](#2-chyby-skriptu) |
| Config parse error | [Sekce 1](#1-mod-se-nenacte) |
| Kurzor chybi | [Sekce 4](#4-problemy-s-ui) |
| Deleni nulou | [Sekce 2](#2-chyby-skriptu) |
| Data ztracena pri restartu | [Sekce 9](#9-problemy-s-perzistenci) |
| File patching nefunguje | [Sekce 5](#5-problemy-se-sestavenim-a-pbo) |
| Poklesy FPS | [Sekce 6](#6-problemy-s-vykonem) |
| Herni vstup zaseknuty | [Sekce 4](#4-problemy-s-ui) |
| Predmet neviditelny | [Sekce 7](#7-problemy-s-predmety-vozidly-a-entitami) |
| Predmet se nespawni | [Sekce 7](#7-problemy-s-predmety-vozidly-a-entitami) |
| Layout vraci null | [Sekce 4](#4-problemy-s-ui) |
| Unik pameti | [Sekce 6](#6-problemy-s-vykonem) |
| Mod neni v launcheru | [Sekce 1](#1-mod-se-nenacte) |
| Null pointer pristup | [Sekce 2](#2-chyby-skriptu) |
| RPC neprijato | [Sekce 3](#3-problemy-s-rpc-a-siti) |
| Pad serveru pri startu | [Sekce 2](#2-chyby-skriptu) |
| Nedefinovana promenna | [Sekce 2](#2-chyby-skriptu) |
| Funguje offline, selhava online | [Sekce 3](#3-problemy-s-rpc-a-siti) |

---

*Problem stale nevyresen? Podivejte se na [FAQ](faq.md) pro dalsi odpovedi, [Cheat Sheet](cheatsheet.md) pro referenci syntaxe, nebo se zeptejte na DayZ Modding Discordu.*
