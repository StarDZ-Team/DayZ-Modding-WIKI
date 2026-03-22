# Často kladené otázky

[Domů](../README.md) | **FAQ**

---

## Začínáme

### Q: Co potřebuji k moddingu DayZ?
**A:** Potřebujete Steam, DayZ (retail kopii), DayZ Tools (zdarma na Steamu v sekci Nástroje) a textový editor (doporučujeme VS Code). Programátorské zkušenosti nejsou striktně vyžadovány — začněte s [Kapitolou 8.1: Váš první mod](08-tutorials/01-first-mod.md). DayZ Tools obsahuje Object Builder, Addon Builder, TexView2 a Workbench IDE.

### Q: Jaký programovací jazyk DayZ používá?
**A:** DayZ používá **Enforce Script**, proprietární jazyk od Bohemia Interactive. Má syntaxi podobnou C, podobnou C#, ale s vlastními pravidly a omezeními (žádný ternární operátor, žádný try/catch, žádné lambdy). Viz [Část 1: Enforce Script](01-enforce-script/01-variables-types.md) pro kompletní jazykový průvodce.

### Q: Jak nastavím P: disk?
**A:** Otevřete DayZ Tools ze Steamu, klikněte na "Workdrive" nebo "Setup Workdrive" pro připojení P: disku. Tím se vytvoří virtuální disk ukazující na váš moddovací pracovní prostor, kde engine hledá zdrojové soubory během vývoje. Můžete také použít `subst P: "C:\Vaše\Cesta"` z příkazového řádku. Viz [Kapitola 4.5](04-file-formats/05-dayz-tools.md).

### Q: Mohu testovat svůj mod bez dedikovaného serveru?
**A:** Ano. Spusťte DayZ s parametrem `-filePatching` a načteným modem. Pro rychlé testování použijte Listen Server (hostování z herního menu). Pro produkční testování vždy ověřte i na dedikovaném serveru, protože některé cesty kódu se liší. Viz [Kapitola 8.1](08-tutorials/01-first-mod.md).

### Q: Kde najdu vanilla DayZ skriptové soubory ke studiu?
**A:** Po připojení P: disku přes DayZ Tools jsou vanilla skripty na `P:\DZ\scripts\` organizované podle vrstev (`3_Game`, `4_World`, `5_Mission`). Tyto soubory jsou autoritativní reference pro každou třídu enginu, metodu a událost. Viz také [Tahák](cheatsheet.md) a [Rychlá reference API](06-engine-api/quick-reference.md).

---

## Běžné chyby a opravy

### Q: Můj mod se načte, ale nic se neděje. Žádné chyby v logu.
**A:** Nejspíše máte v `config.cpp` nesprávný záznam `requiredAddons[]`, takže se vaše skripty načítají příliš brzy nebo vůbec. Ověřte, že každý název addonu v `requiredAddons` přesně odpovídá existujícímu názvu třídy `CfgPatches` (rozlišuje velká a malá písmena). Zkontrolujte skriptový log v `%localappdata%/DayZ/` pro tichá varování. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

### Q: Dostávám chyby "Cannot find variable" nebo "Undefined variable".
**A:** To obvykle znamená, že odkazujete na třídu nebo proměnnou z vyšší skriptové vrstvy. Nižší vrstvy (`3_Game`) nemohou vidět typy definované ve vyšších vrstvách (`4_World`, `5_Mission`). Přesuňte definici vaší třídy do správné vrstvy, nebo použijte `typename` reflexi pro volnou vazbu. Viz [Kapitola 2.1](02-mod-structure/01-five-layers.md).

### Q: Proč `JsonFileLoader<T>.JsonLoadFile()` nevrací moje data?
**A:** `JsonLoadFile()` vrací `void`, ne načtený objekt. Musíte předem alokovat váš objekt a předat ho jako referenční parametr: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Přiřazení návratové hodnoty vám tiše vrátí `null`. Viz [Kapitola 6.8](06-engine-api/08-file-io.md).

### Q: Moje RPC je odesláno, ale nikdy není přijato na druhé straně.
**A:** Zkontrolujte tyto běžné příčiny: (1) RPC ID neodpovídá mezi odesílatelem a příjemcem. (2) Odesíláte z klienta, ale nasloucháte na klientu (nebo server-server). (3) Zapomněli jste zaregistrovat RPC handler v `OnRPC()` nebo ve vašem vlastním handleru. (4) Cílová entita je `null` nebo není síťově synchronizovaná. Viz [Kapitola 6.9](06-engine-api/09-networking.md) a [Kapitola 7.3](07-patterns/03-rpc-patterns.md).

### Q: Dostávám "Error: Member already defined" v else-if bloku.
**A:** Enforce Script neumožňuje opakovanou deklaraci proměnné v sousedních `else if` blocích ve stejném rozsahu. Deklarujte proměnnou jednou před řetězcem `if`, nebo použijte samostatné rozsahy se složenými závorkami. Viz [Kapitola 1.12](01-enforce-script/12-gotchas.md).

### Q: Moje UI rozložení nic nezobrazuje / widgety jsou neviditelné.
**A:** Běžné příčiny: (1) Widget má nulovou velikost — zkontrolujte, že šířka/výška jsou správně nastaveny (žádné záporné hodnoty). (2) Widget nemá `Show(true)`. (3) Alfa barvy textu je 0 (plně průhledná). (4) Cesta k rozložení v `CreateWidgets()` je špatná (žádná chyba se nevyvolá, prostě vrátí `null`). Viz [Kapitola 3.3](03-gui-system/03-sizing-positioning.md).

### Q: Můj mod způsobuje pád serveru při startu.
**A:** Zkontrolujte: (1) Volání metod pouze pro klienta (`GetGame().GetPlayer()`, UI kód) na serveru. (2) `null` reference v `OnInit` nebo `OnMissionStart` předtím, než je svět připraven. (3) Nekonečná rekurze v přepsání `modded class`, které zapomnělo volat `super`. Vždy přidávejte ochranné podmínky, protože neexistuje try/catch. Viz [Kapitola 1.11](01-enforce-script/11-error-handling.md).

### Q: Zpětné lomítko nebo uvozovky v mých řetězcích způsobují chyby parsování.
**A:** Parser Enforce Scriptu (CParser) nepodporuje escape sekvence `\\` nebo `\"` v řetězcových literálech. Vyhněte se zpětným lomítkům úplně. Pro cesty k souborům používejte dopředná lomítka (`"my/path/file.json"`). Pro uvozovky v řetězcích použijte jednoduché uvozovky nebo zřetězení řetězců. Viz [Kapitola 1.12](01-enforce-script/12-gotchas.md).

---

## Architektonická rozhodnutí

### Q: Co je 5vrstvá hierarchie skriptů a proč záleží?
**A:** DayZ skripty se kompilují v pěti číslovaných vrstvách: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Každá vrstva může odkazovat pouze na typy ze stejné nebo nižší vrstvy. To vynucuje architektonické hranice — sdílené enumy a konstanty umístěte do `3_Game`, logiku entit do `4_World` a UI/mission hooky do `5_Mission`. Viz [Kapitola 2.1](02-mod-structure/01-five-layers.md).

### Q: Mám použít `modded class` nebo vytvořit nové třídy?
**A:** Použijte `modded class`, když potřebujete změnit nebo rozšířit existující vanilla chování (přidání metody do `PlayerBase`, hookování do `MissionServer`). Vytvořte nové třídy pro samostatné systémy, které nepotřebují nic přepisovat. Modifikované třídy se řetězí automaticky — vždy volejte `super`, aby se nenarušily ostatní mody. Viz [Kapitola 1.4](01-enforce-script/04-modded-classes.md).

### Q: Jak mám organizovat kód klienta vs. serveru?
**A:** Použijte preprocesorové podmínky `#ifdef SERVER` a `#ifdef CLIENT` pro kód, který musí běžet pouze na jedné straně. Pro větší mody rozdělte do samostatných PBO: klientský mod (UI, renderování, lokální efekty) a serverový mod (spawnování, logika, persistence). To zabraňuje úniku serverové logiky ke klientům. Viz [Kapitola 2.5](02-mod-structure/05-file-organization.md) a [Kapitola 6.9](06-engine-api/09-networking.md).

### Q: Kdy mám použít Singleton vs. Modul/Plugin?
**A:** Použijte Modul (registrovaný přes CF `PluginManager` nebo váš vlastní modulový systém), když potřebujete správu životního cyklu (`OnInit`, `OnUpdate`, `OnMissionFinish`). Použijte samostatný Singleton pro bezstavové utility služby, které potřebují pouze globální přístup. Moduly jsou preferovány pro cokoli se stavem nebo potřebou úklidu. Viz [Kapitola 7.1](07-patterns/01-singletons.md) a [Kapitola 7.2](07-patterns/02-module-systems.md).

### Q: Jak bezpečně ukládám data per-hráč, která přežijí restart serveru?
**A:** Ukládejte JSON soubory do adresáře `$profile:` serveru pomocí `JsonFileLoader`. Jako název souboru použijte Steam UID hráče (z `PlayerIdentity.GetId()`). Načítejte při připojení hráče, ukládejte při odpojení a periodicky. Vždy zpracovávejte chybějící/poškozené soubory elegantně s ochrannými podmínkami. Viz [Kapitola 7.4](07-patterns/04-config-persistence.md) a [Kapitola 6.8](06-engine-api/08-file-io.md).

---

## Publikování a distribuce

### Q: Jak zabalím svůj mod do PBO?
**A:** Použijte Addon Builder (z DayZ Tools) nebo nástroje třetích stran jako PBO Manager. Nasměrujte ho na zdrojovou složku vašeho modu, nastavte správný prefix (odpovídající prefixu addonu ve vašem `config.cpp`) a sestavte. Výstupní soubor `.pbo` jde do složky `Addons/` vašeho modu. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md).

### Q: Jak podepíšu svůj mod pro použití na serveru?
**A:** Vygenerujte pár klíčů pomocí DSSignFile nebo DSCreateKey v DayZ Tools: tím získáte `.biprivatekey` a `.bikey`. Podepište každé PBO soukromým klíčem (vytvoří soubory `.bisign` vedle každého PBO). Distribuujte `.bikey` správcům serverů pro jejich složku `keys/`. Nikdy nesdílejte svůj `.biprivatekey`. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md).

### Q: Jak publikuji na Steam Workshop?
**A:** Použijte DayZ Tools Publisher nebo Steam Workshop nahrávač. Potřebujete soubor `mod.cpp` v kořenové složce vašeho modu definující název, autora a popis. Publisher nahraje vaše zabalené PBO a Steam přiřadí Workshop ID. Aktualizujte opětovným publikováním ze stejného účtu. Viz [Kapitola 2.3](02-mod-structure/03-mod-cpp.md) a [Kapitola 8.7](08-tutorials/07-publishing-workshop.md).

### Q: Může můj mod vyžadovat jiné mody jako závislosti?
**A:** Ano. V `config.cpp` přidejte název třídy `CfgPatches` závislého modu do vašeho pole `requiredAddons[]`. V `mod.cpp` neexistuje formální systém závislostí — dokumentujte požadované mody v popisu na Workshopu. Hráči musí odebírat a načíst všechny požadované mody. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

---

## Pokročilá témata

### Q: Jak vytvořím vlastní hráčské akce (interakce)?
**A:** Rozšiřte `ActionBase` (nebo podtřídu jako `ActionInteractBase`), definujte `CreateConditionComponents()` pro podmínky, přepište `OnStart`/`OnExecute`/`OnEnd` pro logiku a zaregistrujte ji v `SetActions()` na cílové entitě. Akce podporují průběžný (podržení) a okamžitý (klik) režim. Viz [Kapitola 6.12](06-engine-api/12-action-system.md).

### Q: Jak funguje systém poškození pro vlastní předměty?
**A:** Definujte třídu `DamageSystem` v config.cpp vašeho předmětu s `DamageZones` (pojmenované oblasti) a hodnotami `ArmorType`. Každá zóna sleduje své vlastní zdraví. Přepište `EEHitBy()` a `EEKilled()` ve skriptu pro vlastní reakce na poškození. Engine mapuje komponenty Fire Geometry modelu na názvy zón. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

### Q: Jak mohu přidat vlastní klávesové zkratky do svého modu?
**A:** Vytvořte soubor `inputs.xml` definující vaše vstupní akce s výchozím přiřazením kláves. Zaregistrujte je ve skriptu přes `GetUApi().RegisterInput()`. Dotazujte stav pomocí `GetUApi().GetInputByName("vaše_akce").LocalPress()`. Přidejte lokalizované názvy do vašeho `stringtable.csv`. Viz [Kapitola 5.2](05-config-files/02-inputs-xml.md) a [Kapitola 6.13](06-engine-api/13-input-system.md).

### Q: Jak zajistím kompatibilitu mého modu s ostatními mody?
**A:** Dodržujte tyto principy: (1) Vždy volejte `super` v přepsáních modifikovaných tříd. (2) Používejte unikátní názvy tříd s prefixem modu (např. `MujMod_Manager`). (3) Používejte unikátní RPC ID. (4) Nepřepisujte vanilla metody bez volání `super`. (5) Používejte `#ifdef` pro detekci volitelných závislostí. (6) Testujte s populárními kombinacemi modů (CF, Expansion, atd.). Viz [Kapitola 7.2](07-patterns/02-module-systems.md).

### Q: Jak optimalizuji svůj mod pro výkon serveru?
**A:** Klíčové strategie: (1) Vyhněte se per-frame (`OnUpdate`) logice — používejte časovače nebo událostmi řízený design. (2) Ukládejte reference do mezipaměti místo opakovaného volání `GetGame().GetPlayer()`. (3) Používejte ochranné podmínky `GetGame().IsServer()` / `GetGame().IsClient()` pro přeskočení nepotřebného kódu. (4) Profilujte pomocí benchmarků `int start = TickCount(0);`. (5) Omezte síťový provoz — slučujte RPC a používejte Net Sync Variables pro časté malé aktualizace. Viz [Kapitola 7.7](07-patterns/07-performance.md).

---

*Máte otázku, která zde není pokryta? Otevřete issue v repozitáři.*
