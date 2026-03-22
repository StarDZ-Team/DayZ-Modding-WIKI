# Často kladené otázky

[Domů](./README.md) | **FAQ**

---

## Začínáme

### Q: Co potřebuji k moddingu DayZ?
**A:** Potřebujete Steam, DayZ (retail kopii), DayZ Tools (zdarma na Steamu v sekci Nástroje) a textový editor (doporučujeme VS Code). Programátorské zkušenosti nejsou striktně vyžadovány -- začněte s [Kapitolou 8.1: Váš první mod](08-tutorials/01-first-mod.md). DayZ Tools obsahuje Object Builder, Addon Builder, TexView2 a Workbench IDE.

### Q: Jaký programovací jazyk DayZ používá?
**A:** DayZ používá **Enforce Script**, proprietární jazyk od Bohemia Interactive. Má syntaxi podobnou jazyku C, blízkou C#, ale s vlastními pravidly a omezeními (žádný ternární operátor, žádný try/catch, žádné lambdy). Viz [Část 1: Enforce Script](01-enforce-script/01-variables-types.md) pro kompletní průvodce jazykem.

### Q: Jak nastavím P: disk?
**A:** Otevřete DayZ Tools ze Steamu, klikněte na "Workdrive" nebo "Setup Workdrive" pro připojení P: disku. Tím se vytvoří virtuální disk směřující na váš moddingový pracovní prostor, kde engine hledá zdrojové soubory při vývoji. Můžete také použít příkaz `subst P: "C:\Vase\Cesta"` z příkazového řádku. Viz [Kapitola 4.5](04-file-formats/05-dayz-tools.md).

### Q: Mohu testovat svůj mod bez dedikovaného serveru?
**A:** Ano. Spusťte DayZ s parametrem `-filePatching` a načteným modem. Pro rychlé testování použijte Listen Server (hostování z nabídky ve hře). Pro produkční testování vždy ověřte i na dedikovaném serveru, protože některé cesty kódu se liší. Viz [Kapitola 8.1](08-tutorials/01-first-mod.md).

### Q: Kde najdu vanilla DayZ skriptové soubory ke studiu?
**A:** Po připojení P: disku přes DayZ Tools jsou vanilla skripty v `P:\DZ\scripts\` organizované podle vrstev (`3_Game`, `4_World`, `5_Mission`). To je autoritativní reference pro každou třídu enginu, metodu a událost. Viz také [Cheat Sheet](cheatsheet.md) a [API Quick Reference](06-engine-api/quick-reference.md).

---

## Časté chyby a opravy

### Q: Můj mod se načte, ale nic se neděje. Žádné chyby v logu.
**A:** Nejpravděpodobněji má váš `config.cpp` nesprávný záznam `requiredAddons[]`, takže se vaše skripty načtou příliš brzy nebo vůbec. Ověřte, že každý název addonu v `requiredAddons` přesně odpovídá existujícímu názvu třídy `CfgPatches` (rozlišuje velká a malá písmena). Zkontrolujte skriptový log v `%localappdata%/DayZ/` pro tiché varování. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

### Q: Dostávám chyby "Cannot find variable" nebo "Undefined variable".
**A:** To obvykle znamená, že odkazujete na třídu nebo proměnnou z vyšší skriptové vrstvy. Nižší vrstvy (`3_Game`) nemohou vidět typy definované ve vyšších vrstvách (`4_World`, `5_Mission`). Přesuňte definici třídy do správné vrstvy, nebo použijte reflexi `typename` pro volné propojení. Viz [Kapitola 2.1](02-mod-structure/01-five-layers.md).

### Q: Proč `JsonFileLoader<T>.JsonLoadFile()` nevrací moje data?
**A:** `JsonLoadFile()` vrací `void`, nikoliv načtený objekt. Musíte předalokovat objekt a předat jej jako referenční parametr: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Přiřazení návratové hodnoty vám tiše dá `null`. Viz [Kapitola 6.8](06-engine-api/08-file-io.md).

### Q: Moje RPC je odeslané, ale nikdy nepřijato na druhé straně.
**A:** Zkontrolujte tyto časté příčiny: (1) ID RPC nesouhlasí mezi odesílatelem a příjemcem. (2) Odesíláte z klienta, ale nasloucháte na klientu (nebo server-na-server). (3) Zapomněli jste zaregistrovat handler RPC v `OnRPC()` nebo ve vlastním handleru. (4) Cílová entita je `null` nebo není síťově synchronizovaná. Viz [Kapitola 6.9](06-engine-api/09-networking.md) a [Kapitola 7.3](07-patterns/03-rpc-patterns.md).

### Q: Dostávám "Error: Member already defined" v bloku else-if.
**A:** Enforce Script neumožňuje re-deklaraci proměnné v sourozeneckých `else if` blocích ve stejném scope. Deklarujte proměnnou jednou před řetězcem `if`/`else`, nebo použijte oddělené scopy se složenými závorkami. Viz [Kapitola 1.12](01-enforce-script/12-gotchas.md).

### Q: Můj UI layout nic nezobrazuje / widgety jsou neviditelné.
**A:** Časté příčiny: (1) Widget má nulovou velikost -- zkontrolujte, že šířka/výška jsou správně nastaveny (žádné záporné hodnoty). (2) Widget nemá `Show(true)`. (3) Alfa kanál barvy textu je 0 (plně průhledný). (4) Cesta k layoutu v `CreateWidgets()` je chybná (nevyhodí chybu, jen vrátí `null`). Viz [Kapitola 3.3](03-gui-system/03-sizing-positioning.md).

### Q: Můj mod způsobuje pád při startu serveru.
**A:** Zkontrolujte: (1) Volání metod pouze pro klienta (`GetGame().GetPlayer()`, UI kód) na serveru. (2) `null` reference v `OnInit` nebo `OnMissionStart` předtím, než je svět připraven. (3) Nekonečná rekurze v overridu `modded class`, kde se zapomnělo zavolat `super`. Vždy přidávejte ochranné klauzule, protože neexistuje try/catch. Viz [Kapitola 1.11](01-enforce-script/11-error-handling.md).

### Q: Znaky zpětného lomítka nebo uvozovek v mých řetězcích způsobují chyby parsování.
**A:** Parser Enforce Scriptu (CParser) nepodporuje escape sekvence `\\` ani `\"` v řetězcových literálech. Vyhněte se zpětným lomítkům úplně. Pro cesty k souborům používejte lomítka (`"my/path/file.json"`). Pro uvozovky v řetězcích použijte jednoduché uvozovky nebo konkatenaci řetězců. Viz [Kapitola 1.12](01-enforce-script/12-gotchas.md).

---

## Architektonická rozhodnutí

### Q: Co je pětivrstvá hierarchie skriptů a proč na ní záleží?
**A:** DayZ skripty se kompilují v pěti číslovaných vrstvách: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Každá vrstva může odkazovat pouze na typy ze stejné nebo nižší číslované vrstvy. To vynucuje architektonické hranice -- sdílené enumy a konstanty umístěte do `3_Game`, logiku entit do `4_World` a UI/mission hooky do `5_Mission`. Viz [Kapitola 2.1](02-mod-structure/01-five-layers.md).

### Q: Mám použít `modded class` nebo vytvořit nové třídy?
**A:** Použijte `modded class`, když potřebujete změnit nebo rozšířit existující vanilla chování (přidání metody do `PlayerBase`, hookování do `MissionServer`). Vytvořte nové třídy pro samostatné systémy, které nepotřebují nic přepisovat. Moddované třídy se automaticky řetězí -- vždy volejte `super`, abyste neporušili ostatní mody. Viz [Kapitola 1.4](01-enforce-script/04-modded-classes.md).

### Q: Jak mám organizovat klientský vs. serverový kód?
**A:** Použijte preprocesorové guardy `#ifdef SERVER` a `#ifdef CLIENT` pro kód, který musí běžet pouze na jedné straně. Pro větší mody je rozdělte do samostatných PBO: klientský mod (UI, renderování, lokální efekty) a serverový mod (spawnování, logika, persistence). To zabrání úniku serverové logiky ke klientům. Viz [Kapitola 2.5](02-mod-structure/05-file-organization.md) a [Kapitola 6.9](06-engine-api/09-networking.md).

### Q: Kdy mám použít Singleton vs. Modul/Plugin?
**A:** Použijte Modul (registrovaný přes `PluginManager` z CF nebo vlastní modulový systém), když potřebujete správu životního cyklu (`OnInit`, `OnUpdate`, `OnMissionFinish`). Použijte samostatný Singleton pro bezstavové utility služby, které potřebují pouze globální přístup. Moduly jsou preferovány pro cokoliv se stavem nebo potřebou úklidu. Viz [Kapitola 7.1](07-patterns/01-singletons.md) a [Kapitola 7.2](07-patterns/02-module-systems.md).

### Q: Jak bezpečně ukládat data pro každého hráče, která přežijí restart serveru?
**A:** Ukládejte JSON soubory do adresáře `$profile:` serveru pomocí `JsonFileLoader`. Jako název souboru použijte Steam UID hráče (z `PlayerIdentity.GetId()`). Načítejte při připojení hráče, ukládejte při odpojení a periodicky během hry. Vždy elegantně zpracujte chybějící/poškozené soubory pomocí ochranných klauzulí. Viz [Kapitola 7.4](07-patterns/04-config-persistence.md) a [Kapitola 6.8](06-engine-api/08-file-io.md).

---

## Publikování a distribuce

### Q: Jak zabalím svůj mod do PBO?
**A:** Použijte Addon Builder (z DayZ Tools) nebo nástroje třetích stran jako PBO Manager. Nasměrujte jej na zdrojovou složku vašeho modu, nastavte správný prefix (odpovídající prefixu addonu v `config.cpp`) a sestavte. Výstupní soubor `.pbo` umístěte do složky `Addons/` vašeho modu. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md).

### Q: Jak podepíši svůj mod pro použití na serveru?
**A:** Vygenerujte pár klíčů pomocí DSSignFile nebo DSCreateKey z DayZ Tools: vytvoří `.biprivatekey` a `.bikey`. Podepište každé PBO soukromým klíčem (vytvoří soubory `.bisign` vedle každého PBO). `.bikey` distribuujte administrátorům serverů pro jejich složku `keys/`. Nikdy nesdílejte `.biprivatekey`. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md).

### Q: Jak publikuji na Steam Workshop?
**A:** Použijte DayZ Tools Publisher nebo Steam Workshop uploader. Potřebujete soubor `mod.cpp` v kořeni modu definující název, autora a popis. Publisher nahraje vaše zabalená PBA a Steam přiřadí Workshop ID. Aktualizujte opětovným publikováním ze stejného účtu. Viz [Kapitola 2.3](02-mod-structure/03-mod-cpp.md) a [Kapitola 8.7](08-tutorials/07-publishing-workshop.md).

### Q: Může můj mod vyžadovat jiné mody jako závislosti?
**A:** Ano. V `config.cpp` přidejte název třídy `CfgPatches` závislého modu do vašeho pole `requiredAddons[]`. V `mod.cpp` neexistuje formální systém závislostí -- požadované mody dokumentujte v popisu na Workshopu. Hráči se musí přihlásit k odběru a načíst všechny požadované mody. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

---

## Pokročilá témata

### Q: Jak vytvořím vlastní akce hráče (interakce)?
**A:** Rozšiřte `ActionBase` (nebo podtřídu jako `ActionInteractBase`), definujte `CreateConditionComponents()` pro předpoklady, přepište `OnStart`/`OnExecute`/`OnEnd` pro logiku a zaregistrujte ji v `SetActions()` na cílové entitě. Akce podporují režimy průběžného (podržení) a okamžitého (kliknutí). Viz [Kapitola 6.12](06-engine-api/12-action-system.md).

### Q: Jak funguje systém poškození pro vlastní předměty?
**A:** Definujte třídu `DamageSystem` v config.cpp vašeho předmětu s `DamageZones` (pojmenované oblasti) a hodnotami `ArmorType`. Každá zóna sleduje své vlastní body zdraví. Přepište `EEHitBy()` a `EEKilled()` ve skriptu pro vlastní reakce na poškození. Engine mapuje komponenty Fire Geometry modelu na názvy zón. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

### Q: Jak mohu přidat vlastní klávesové zkratky do svého modu?
**A:** Vytvořte soubor `inputs.xml` definující vaše vstupní akce s výchozím přiřazením kláves. Zaregistrujte je ve skriptu přes `GetUApi().RegisterInput()`. Dotazujte stav pomocí `GetUApi().GetInputByName("your_action").LocalPress()`. Přidejte lokalizované názvy do `stringtable.csv`. Viz [Kapitola 5.2](05-config-files/02-inputs-xml.md) a [Kapitola 6.13](06-engine-api/13-input-system.md).

### Q: Jak zajistím kompatibilitu svého modu s ostatními mody?
**A:** Dodržujte tyto principy: (1) Vždy volejte `super` v overridech modded class. (2) Používejte unikátní názvy tříd s prefixem modu (např. `MyMod_Manager`). (3) Používejte unikátní RPC ID. (4) Nepřepisujte vanilla metody bez volání `super`. (5) Používejte `#ifdef` pro detekci volitelných závislostí. (6) Testujte s populárními kombinacemi modů (CF, Expansion atd.). Viz [Kapitola 7.2](07-patterns/02-module-systems.md).

### Q: Jak optimalizuji svůj mod pro výkon serveru?
**A:** Klíčové strategie: (1) Vyhněte se per-frame (`OnUpdate`) logice -- používejte časovače nebo událostmi řízenou architekturu. (2) Cachujte reference místo opakovaného volání `GetGame().GetPlayer()`. (3) Používejte guardy `GetGame().IsServer()` / `GetGame().IsClient()` pro přeskočení nepotřebného kódu. (4) Profilujte pomocí benchmarků `int start = TickCount(0);`. (5) Omezte síťový provoz -- seskupujte RPC a používejte Net Sync Variables pro časté malé aktualizace. Viz [Kapitola 7.7](07-patterns/07-performance.md).

---

*Máte otázku, která zde není zodpovězena? Otevřete issue v repozitáři.*
