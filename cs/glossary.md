# DayZ Modding Glossary & Page Index

[Home](./README.md) | **Glossary & Index**

---

Komplexni reference pojmu pouzivanych v teto wiki a pri moddingu DayZ.

---

## A

**Action (Akce)** — Interakce hrace s predmetem nebo svetem (jedeni, otevirani dveri, oprava). Akce se vytvareji pomoci `ActionBase` s podminkami a fazemi callbacku. Viz [Kapitola 6.12](06-engine-api/12-action-system.md).

**Addon Builder** — Aplikace DayZ Tools, ktera balí soubory modu do PBO archivu. Zpracovava binarizaci, podepisovani souboru a mapovani prefixu. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md).

**autoptr** — Silny referencni ukazatel s rozsahem v Enforce Scriptu. Odkazovany objekt je automaticky znicen, kdyz `autoptr` opusti rozsah. Zridka pouzivany v moddingu DayZ (preferujte explicitni `ref`). Viz [Kapitola 1.8](01-enforce-script/08-memory-management.md).

---

## B

**Binarize (Binarizace)** — Proces prevodu zdrojovych souboru (`config.cpp`, `.p3d`, `.tga`) do optimalizovanych formatu pripravenych pro engine (`.bin`, ODOL, `.paa`). Provadeno automaticky Addon Builderem nebo nastrojem Binarize v DayZ Tools. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md).

**bikey / biprivatekey / bisign** — Viz [Podepisovani klicu](#k).

---

## C

**CallQueue** — Utilita enginu DayZ pro planovani zpozdenych nebo opakovanych volani funkci. Pristupna pres `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)`. Viz [Kapitola 6.7](06-engine-api/07-timers.md).

**CastTo** — Viz [Class.CastTo](#classcasto).

**Central Economy (CE) — Centralni ekonomika** — System distribuce lootu a persistence v DayZ. Konfigurovany pomoci XML souboru (`types.xml`, `mapgrouppos.xml`, `cfglimitsdefinition.xml`), ktere definuji co se spawnuje, kde a jak casto. Viz [Kapitola 6.10](06-engine-api/10-central-economy.md).

**CfgMods** — Trida nejvyssi urovne v config.cpp, ktera registruje mod v enginu. Definuje nazev modu, adresare skriptu, pozadovane zavislosti a poradi nacitani addonu. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

**CfgPatches** — Trida v config.cpp, ktera registruje jednotlive addony (balicky skriptu, modely, textury) v ramci modu. Pole `requiredAddons[]` ovlada poradi nacitani mezi mody. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

**CfgVehicles** — Hierarchie trid v config.cpp, ktera definuje vsechny herní entity: predmety, budovy, vozidla, zvirata a hrace. Navzdory nazvu obsahuje mnohem vic nez jen vozidla. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

**Class.CastTo** — Staticka metoda pro bezpecne pretypovani v Enforce Scriptu. Vraci `true`, pokud pretypovani uspeje. Vyzadovano, protoze Enforce Script nema klicove slovo `as`. Pouziti: `Class.CastTo(result, source)`. Viz [Kapitola 1.9](01-enforce-script/09-casting-reflection.md).

**CommunityFramework (CF)** — Mod frameworku treti strany od Jacob_Mango poskytujici spravu zivotniho cyklu modulu, logovani, pomocniky RPC, utility pro I/O souboru a datove struktury obousmernych seznamu. Mnoho popularnich modu na nem zavisi. Viz [Kapitola 7.2](07-patterns/02-module-systems.md).

**config.cpp** — Centralni konfiguracni soubor pro kazdy mod DayZ. Definuje `CfgPatches`, `CfgMods`, `CfgVehicles` a dalsi hierarchie trid, ktere engine cte pri spusteni. Toto NENI kod C++ navzdory pripone. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

---

## D

**DamageSystem (System poskozeni)** — Subsystem enginu zpracovavajici registraci zasahu, zony poskozeni, hodnoty zdravi/krve/soku a vypocty brneni na entitach. Konfigurovany pres tridu `DamageSystem` v config.cpp se zonami a komponentami zasahu. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**DayZ Tools** — Bezplatna aplikace na Steamu obsahujici oficialni sadu nastroju pro modding: Object Builder, Terrain Builder, Addon Builder, TexView2, Workbench a spravu P: disku. Viz [Kapitola 4.5](04-file-formats/05-dayz-tools.md).

**DayZPlayer** — Zakladni trida pro vsechny hracske entity v enginu. Poskytuje pristup k systemu pohybu, animaci, inventare a vstupu. `PlayerBase` rozsiruje tuto tridu a je typickym vstupnim bodem pro modding. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**Dedicated Server (Vyhrazeny server)** — Samostatny bezhlavy serverovy proces (`DayZServer_x64.exe`) pouzivany pro multiplayerovy hosting. Spousti pouze serverove skripty. Kontrast s [Listen Server](#l).

---

## E

**EEInit** — Metoda udalosti enginu volana pri inicializaci entity po vytvoreni. Prepiste ji ve sve tride entity pro provedeni nastavovaci logiky. Volana na klientu i serveru. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**EEKilled** — Metoda udalosti enginu volana, kdyz zdravi entity dosahne nuly. Pouzivana pro logiku smrti, drop lootu a sledovani zabiti. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**EEHitBy** — Metoda udalosti enginu volana, kdyz entita obdrzi poskozeni. Parametry zahrnuji zdroj poskozeni, zasazeny komponent, typ poskozeni a zony poskozeni. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**EEItemAttached** — Metoda udalosti enginu volana, kdyz je predmet pripojen do slotu inventare entity (napr. pripojeni zamerovaciho dalekohledu na zbran). Sparovana s `EEItemDetached`. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**Enforce Script** — Proprietarni skriptovaci jazyk od Bohemia Interactive pouzivany v DayZ a hrach na enginu Enfusion. Syntaxe podobna C, blizka C#, ale s unikatnimi omezeními (zadny ternarni operator, zadny try/catch, zadne lambdy). Viz [Cast 1](01-enforce-script/01-variables-types.md).

**EntityAI** — Zakladni trida pro vsechny "inteligentni" entity v DayZ (hraci, zvirata, zombie, predmety). Rozsiruje `Entity` o inventar, system poskozeni a rozhrani AI. Vetsina moddingu predmetu a postav zacina zde. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**EventBus (Sbernice udalosti)** — Vzor publish-subscribe pro oddelenu komunikaci mezi systemy. Moduly se prihlasi k odber pojmenovanych udalosti a obdrzi callbacky pri vyvolani udalosti, bez primych zavislosti. Viz [Kapitola 7.6](07-patterns/06-events.md).

---

## F

**File Patching (Opravy souboru)** — Parametr spusteni (`-filePatching`), ktery umoznuje enginu nacitat volne soubory z P: disku misto zabalenych PBO. Nezbytne pro rychlou vyvojovou iteraci. Musi byt povoleno na klientu i serveru. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md).

**Fire Geometry** — Specializovany LOD v 3D modelu (`.p3d`), ktery definuje povrchy, kde mohou dopadat kulky a zpusobit poskozeni. Odlisny od View Geometry a Geometry LOD. Viz [Kapitola 4.2](04-file-formats/02-models.md).

---

## G

**GameInventory** — Trida enginu spravujici system inventare entity. Poskytuje metody pro pridavani, odstranovani, hledani a prenos predmetu mezi kontejnery a sloty. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**GetGame()** — Globalni funkce vracejici singleton `CGame`. Vstupni bod pro pristup k misi, hracum, frontam volani, RPC, pocasi a dalsim systemum enginu. Dostupna vsude ve skriptu. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**GetUApi()** — Globalni funkce vracejici singleton `UAInputAPI` pro vstupni system. Pouzivana pro registraci a dotazovani vlastnich klavesovych zkratek. Viz [Kapitola 6.13](06-engine-api/13-input-system.md).

**Geometry LOD** — Level-of-detail 3D modelu pouzivany pro fyzikalni detekci kolize (pohyb hrace, fyzika vozidel). Oddeleny od View Geometry a Fire Geometry. Viz [Kapitola 4.2](04-file-formats/02-models.md).

**Guard Clause (Ochranna podminka)** — Vzor defenzivniho programovani: kontrola predpokladu na zacatku metody a predcasny navrat, pokud selzou. Nezbytne v Enforce Scriptu, protoze neexistuje try/catch. Viz [Kapitola 1.11](01-enforce-script/11-error-handling.md).

---

## H

**Hidden Selections (Skryte selekce)** — Pojmenovane sloty textur/materialu na 3D modelu, ktere lze za behu vymenovat pomoci skriptu. Pouzivany pro varianty maskovani, barvy tymu, stavy poskozeni a dynamicke zmeny vzhledu. Definovany v config.cpp a pojmenovanych selekcich modelu. Viz [Kapitola 4.2](04-file-formats/02-models.md).

**HUD** — Heads-Up Display: prvky UI na obrazovce viditelne behem hrani (indikatory zdravi, hotbar, kompas, notifikace). Vytvareji se pomoci souboru `.layout` a skriptovanych trid widgetu. Viz [Kapitola 3.1](03-gui-system/01-widget-types.md).

---

## I

**IEntity** — Rozhrani entity nejnizsi urovne v enginu Enfusion. Poskytuje pristup k transformaci (pozice/rotace), vizualu a fyzice. Vetsina modderu pracuje s `EntityAI` nebo vyssimi tridami. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**ImageSet** — XML soubor (`.imageset`) definujici pojmenovane obdelnikove oblasti v atlasu textur (`.edds` nebo `.paa`). Pouzivany pro odkazovani na ikony, grafiky tlacitek a prvky UI bez samostatnych obrazkovych souboru. Viz [Kapitola 5.4](05-config-files/04-imagesets.md).

**InventoryLocation** — Trida enginu popisujici konkretni pozici v systemu inventare: ktera entita, ktery slot, ktery radek/sloupec carga. Pouzivana pro presnou manipulaci a prenosy inventare. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**ItemBase** — Standardni zakladni trida pro vsechny predmety ve hre (rozsiruje `EntityAI`). Zbrane, nastroje, jidlo, obleceni, kontejnery a prislusenstvi vsechny dedi z `ItemBase`. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

---

## J

**JsonFileLoader** — Utilitni trida enginu pro nacitani a ukladani JSON souboru v Enforce Scriptu. Dulezite upozorneni: `JsonLoadFile()` vraci `void` — musite predat predalokovany objekt odkazem, nikoliv priradit navratovou hodnotu. Viz [Kapitola 6.8](06-engine-api/08-file-io.md).

---

## K

**Key Signing — Podepisovani klicu (.bikey, .biprivatekey, .bisign)** — System overovani modu DayZ. `.biprivatekey` se pouziva k podpisu PBO (vytvari soubory `.bisign`). Odpovidajici verejny klic `.bikey` se uklada do slozky `keys/` serveru. Servery nacitaji pouze mody, jejichz podpisy odpovidaji nainstalovanemu klici. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md).

---

## L

**Layout (soubor .layout)** — Definicni soubor UI na bazi XML pouzivany systemem GUI DayZ. Definuje hierarchii widgetu, pozicovani, dimenzovani a vlastnosti stylu. Nacitany za behu pomoci `GetGame().GetWorkspace().CreateWidgets()`. Viz [Kapitola 3.2](03-gui-system/02-layout-files.md).

**Listen Server** — Server hostovany v ramci klienta hry (hrac pusobi jako server i klient). Uzitecny pro solo testovani. Nektere cesty kodu se lisi od vyhrazenych serveru — vzdy testujte oba. Viz [Kapitola 8.1](08-tutorials/01-first-mod.md).

**LOD (Level of Detail — Uroven detailu)** — Vice verzi 3D modelu s ruznym poctem polygonu. Engine mezi nimi prepina na zaklade vzdalenosti kamery pro optimalizaci vykonu. DayZ modely maji take specialni LODy: Geometry, Fire Geometry, View Geometry, Memory a Shadow. Viz [Kapitola 4.2](04-file-formats/02-models.md).

---

## M

**Managed** — Klicove slovo Enforce Scriptu oznacujici tridu, jejiz instance jsou pocitany referencemi a automaticky sbírany garbage collectorem. Vetsina trid DayZ dedi z `Managed`. Kontrast s `Class` (rucne spravovano). Viz [Kapitola 1.8](01-enforce-script/08-memory-management.md).

**Memory Point (Bod pameti)** — Pojmenovany bod vlozeny do Memory LOD 3D modelu. Pouzivany skripty k lokalizaci pozic na objektu (puvod zablesku ustí, body pripojeni, pozice proxy). Pristupny pres `GetMemoryPointPosition()`. Viz [Kapitola 4.2](04-file-formats/02-models.md).

**Mission (MissionServer / MissionGameplay)** — Kontroler herniho stavu nejvyssi urovne. `MissionServer` bezi na serveru, `MissionGameplay` bezi na klientu. Prepiste je pro hookování do startu hry, pripojeni hracu a vypnuti. Viz [Kapitola 6.11](06-engine-api/11-mission-hooks.md).

**mod.cpp** — Soubor umisteny v korenove slozce modu, ktery definuje metadata Steam Workshopu: nazev, autor, popis, ikona a URL akce. Nezamenovejte s `config.cpp`. Viz [Kapitola 2.3](02-mod-structure/03-mod-cpp.md).

**Modded Class (Modifikovana trida)** — Mechanismus Enforce Scriptu (`modded class X extends X`) pro rozsireni nebo prepsani existujicich trid bez modifikace originalnich souboru. Engine retezi vsechny definice modifikovanych trid dohromady. Toto je primarni zpusob, jakym mody interaguji s vanilla a dalsimi mody. Viz [Kapitola 1.4](01-enforce-script/04-modded-classes.md).

**Module (Modul)** — Samostatna jednotka funkcnosti registrovana u spravce modulu (jako CF `PluginManager`). Moduly maji metody zivotniho cyklu (`OnInit`, `OnUpdate`, `OnMissionFinish`) a jsou standardni architekturou pro systemy modu. Viz [Kapitola 7.2](07-patterns/02-module-systems.md).

---

## N

**Named Selection (Pojmenovana selekce)** — Pojmenovana skupina vertexu/ploch v 3D modelu, vytvorena v Object Builderu. Pouzivana pro Hidden Selections (vymena textur), zony poskozeni a cile animaci. Viz [Kapitola 4.2](04-file-formats/02-models.md).

**Net Sync Variable (Sitova synchronizacni promenna)** — Promenna automaticky synchronizovana ze serveru na vsechny klienty systemem sitove replikace enginu. Registrovana pomoci metod `RegisterNetSyncVariable*()` a prijímana v `OnVariablesSynchronized()`. Viz [Kapitola 6.9](06-engine-api/09-networking.md).

**notnull** — Modifikator parametru Enforce Scriptu, ktery rika kompilatoru, ze referencni parametr nesmi byt `null`. Poskytuje bezpecnost v dobe kompilace a dokumentuje zamer. Pouziti: `void DoWork(notnull MyClass obj)`. Viz [Kapitola 1.3](01-enforce-script/03-classes-inheritance.md).

---

## O

**Object Builder** — Aplikace DayZ Tools pro tvorbu a editaci 3D modelu (`.p3d`). Pouzivana k definici LODu, pojmenovanych selekci, bodu pameti a komponent geometrie. Viz [Kapitola 4.5](04-file-formats/05-dayz-tools.md).

**OnInit** — Metoda zivotniho cyklu volana pri prvni inicializaci modulu nebo pluginu. Pouzivana pro registraci, prihlaseni k udalostem a jednoruzove nastaveni. Viz [Kapitola 7.2](07-patterns/02-module-systems.md).

**OnUpdate** — Metoda zivotniho cyklu volana kazdy snimek (nebo v pevnem intervalu) na modulech a urcitych entitach. Pouzivejte setrrne — per-frame kod je problem z hlediska vykonu. Viz [Kapitola 7.7](07-patterns/07-performance.md).

**OnMissionFinish** — Metoda zivotniho cyklu volana pri ukonceni mise (vypnuti serveru, odpojeni). Pouzivana pro uklid, ukladani stavu a uvolneni prostredku. Viz [Kapitola 6.11](06-engine-api/11-mission-hooks.md).

**Override (Prepsani)** — Klicove slovo `override` v Enforce Scriptu, oznacujici metodu, ktera nahrazuje metodu rodicovske tridy. Vyzadovano (nebo silne doporuceno) pri prepsani virtualnich metod. Vzdy volejte `super.NazevMetody()` pro zachovani chovani rodice, pokud ho zamerne nechcete preskocit. Viz [Kapitola 1.3](01-enforce-script/03-classes-inheritance.md).

---

## P

**P: Drive (Workdrive)** — Virtualni pismeno disku mapovane DayZ Tools na adresar vaseho projektu modu. Engine pouziva cesty `P:\` interne k lokalizaci zdrojovych souboru behem vyvoje. Nastaveni pres DayZ Tools nebo rucni prikazy `subst`. Viz [Kapitola 4.5](04-file-formats/05-dayz-tools.md).

**PAA** — Proprietarni format textur Bohemie (`.paa`). Konvertovany ze zdrojovych souboru `.tga` nebo `.png` pomoci TexView2 nebo binarizacniho kroku Addon Builderu. Podporuje kompresi DXT1, DXT5 a ARGB. Viz [Kapitola 4.1](04-file-formats/01-textures.md).

**PBO** — Packed Bohemia Object (`.pbo`): archivni format pro distribuci obsahu modu DayZ. Obsahuje skripty, konfigurace, textury, modely a datove soubory. Sestaven Addon Builderem nebo nastroji treti strany. Viz [Kapitola 4.6](04-file-formats/06-pbo-packing.md).

**PlayerBase** — Primarni trida hracske entity, se kterou modderi pracuji. Rozsiruje `DayZPlayer` a poskytuje pristup k inventari, poskozeni, stavovym efektum a veskere funkcionalite souvisejici s hracem. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**PlayerIdentity** — Trida enginu obsahujici metadata pripojeneho hrace: Steam UID, jmeno, sitove ID a ping. Pristupna na strane serveru z `PlayerBase.GetIdentity()`. Nezbytna pro admin nastroje a persistenci. Viz [Kapitola 6.9](06-engine-api/09-networking.md).

**PPE (Post-Process Effects — Post-procesni efekty)** — System enginu pro vizualni efekty v prostoru obrazovky: rozmazani, barevna korekce, chromaticka aberace, vinetace, filmove zrneni. Ovladany pomoci trid `PPERequester`. Viz [Kapitola 6.5](06-engine-api/05-ppe.md).

**Print** — Vestevena funkce pro vystup textu do skriptoveho logu (soubory logu v `%localappdata%/DayZ/`). Uzitecne pro ladeni, ale melo by byt odstraneno nebo osetrreno v produkcnim kodu. Viz [Kapitola 1.11](01-enforce-script/11-error-handling.md).

**Proto Native** — Funkce deklarovane s `proto native` jsou implementovany v C++ enginu, ne ve skriptu. Premosuji Enforce Script k internim castem enginu a nelze je prepsat. Viz [Kapitola 1.3](01-enforce-script/03-classes-inheritance.md).

---

## Q

**Quaternion** — Ctyrslozkova reprezentace rotace pouzivana interne enginem. V praxi modderi DayZ typicky pracuji s Eulerovymi uhly (`vector` pitch/yaw/roll) a engine konvertuje interne. Viz [Kapitola 1.7](01-enforce-script/07-math-vectors.md).

---

## R

**ref** — Klicove slovo Enforce Scriptu deklarujici silnou referenci na spravovany objekt. Zabranuje garbage collection, dokud reference existuje. Pouzijte `ref` pro vlastnictvi; surove reference pro nevlastneni ukazatele. Pozor na cykly `ref` (A odkazuje na B, B odkazuje na A), ktere zpusobuji uniky pameti. Viz [Kapitola 1.8](01-enforce-script/08-memory-management.md).

**requiredAddons** — Pole v `CfgPatches` urcujici, ktere addony se musi nacist pred vasim. Ovlada poradi kompilace skriptu a dedeni konfiguraci mezi mody. Chybne nastaveni zpusobi "missing class" nebo tiche selhani nacitani. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

**RPC (Remote Procedure Call — Vzdatene volani procedury)** — Mechanismus pro odesilani dat mezi serverem a klientem. DayZ poskytuje `GetGame().RPCSingleParam()` a `ScriptRPC` pro vlastni komunikaci. Vyzaduje odpovidajici odesilatele a prijemce na spravnem stroji. Viz [Kapitola 6.9](06-engine-api/09-networking.md).

**RVMAT** — Soubor definice materialu (`.rvmat`) pouzivany rendererem DayZ. Specifikuje textury, shadery a povrchove vlastnosti pro 3D modely. Viz [Kapitola 4.3](04-file-formats/03-materials.md).

---

## S

**Scope (config)** — Celociselna hodnota v `CfgVehicles` ovladajici viditelnost predmetu: `0` = skryty/abstraktni (nikdy se nespawnuje), `1` = pristupny pouze pres skript, `2` = viditelny ve hre a spawnovatelny Centralni ekonomikou. Viz [Kapitola 2.2](02-mod-structure/02-config-cpp.md).

**ScriptRPC** — Trida Enforce Scriptu pro stavbu a odesilani vlastnich RPC zprav. Umoznuje zapis vice parametru (inty, floaty, stringy, vektory) do jednoho sitoveho paketu. Viz [Kapitola 6.9](06-engine-api/09-networking.md).

**SEffectManager** — Singleton manazer pro vizualni a zvukove efekty. Zpracovava tvorbu castic, prehravani zvuku a zivotni cyklus efektu. Pouzijte `SEffectManager.PlayInWorld()` pro pozicovane efekty. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**Singleton** — Navrhovy vzor zajistujici existenci pouze jedne instance tridy. V Enforce Scriptu bezne implementovany se statickou metodou `GetInstance()` ukladajici instanci do promenne `static ref`. Viz [Kapitola 7.1](07-patterns/01-singletons.md).

**Slot** — Pojmenovany bod pripojeni na entite (napr. `"Shoulder"`, `"Hands"`, `"Slot_Magazine"`). Definovany v config.cpp pod `InventorySlots` a polem `attachments[]` entity. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

**stringtable.csv** — CSV soubor poskytujici lokalizovane retezce az pro 13 jazyku. Odkazovany v kodu pomoci klicu s prefixem `#STR_`. Engine automaticky vybere spravny jazykovy sloupec. Viz [Kapitola 5.1](05-config-files/01-stringtable.md).

**super** — Klicove slovo pouzivane uvnitr prepsane metody pro volani implementace rodicovske tridy. Vzdy volejte `super.NazevMetody()` v prepsanych metodach, pokud zamerne nechcete preskocit rodicovskou logiku. Viz [Kapitola 1.3](01-enforce-script/03-classes-inheritance.md).

---

## T

**TexView2** — Utilita DayZ Tools pro prohlizeni a konverzi textur mezi formaty `.tga`, `.png`, `.paa` a `.edds`. Pouzivana take k inspekci komprese PAA, mipmap a alfa kanalu. Viz [Kapitola 4.5](04-file-formats/05-dayz-tools.md).

**typename** — Typ Enforce Scriptu reprezentujici referenci na tridu za behu. Pouzivany pro reflexi, tovarni vzory a dynamickou kontrolu typu. Ziskan z instance pomoci `obj.Type()` nebo z nazvu tridy primo: `typename t = PlayerBase;`. Viz [Kapitola 1.9](01-enforce-script/09-casting-reflection.md).

**types.xml** — XML soubor Centralni ekonomiky definujici nominalni pocet, zivotnost, chovani doplnovani, kategorie spawnu a tierove zony pro kazdy spawnovatelny predmet. Umisten ve slozce `db/` mise. Viz [Kapitola 6.10](06-engine-api/10-central-economy.md).

---

## U

**UAInput** — Trida enginu reprezentujici jednu vstupni akci (klavesovou zkratku). Vytvorena z `GetUApi().RegisterInput()` a pouzivana pro detekci stisku, podrzeni a uvolneni klaves. Definovana spolecne s `inputs.xml`. Viz [Kapitola 6.13](06-engine-api/13-input-system.md).

**Unlink** — Metoda pro bezpecne zniceni a dereferenci spravovaneho objektu. Preferovana pred nastavenim na `null`, kdyz potrebujete zajistit okamzity uklid. Volana jako `GetGame().ObjectDelete(obj)` pro entity. Viz [Kapitola 1.8](01-enforce-script/08-memory-management.md).

---

## V

**View Geometry** — LOD 3D modelu pouzivany pro testy vizualni okluzse (kontroly videni AI, linie viditelnosti hrace). Urcuje, zda objekt blokuje videni. Oddeleny od Geometry LOD (kolize) a Fire Geometry (balistika). Viz [Kapitola 4.2](04-file-formats/02-models.md).

---

## W

**Widget** — Zakladni trida pro vsechny prvky UI v systemu GUI DayZ. Podtypy zahrnuji `TextWidget`, `ImageWidget`, `ButtonWidget`, `EditBoxWidget`, `ScrollWidget` a kontejnerove typy jako `WrapSpacerWidget`. Viz [Kapitola 3.1](03-gui-system/01-widget-types.md).

**Workbench** — IDE DayZ Tools pro editaci skriptu, konfiguraci a spousteni hry ve vyvojovem rezimu. Poskytuje kompilaci skriptu, breakpointy a Resource Browser. Viz [Kapitola 4.5](04-file-formats/05-dayz-tools.md).

**WrapSpacer** — Kontejnerovy widget, ktery zalamuje sve potomky do radku/sloupcu (jako CSS flexbox wrap). Nezbytny pro dynamicke seznamy, mrizky inventare a jakekoliv rozlozeni, kde se pocet potomku meni. Viz [Kapitola 3.4](03-gui-system/04-containers.md).

---

## X

**XML Configs (XML konfigurace)** — Souhrnny termin pro mnoho XML konfiguracnich souboru pouzivanych servery DayZ: `types.xml`, `globals.xml`, `economy.xml`, `events.xml`, `cfglimitsdefinition.xml`, `mapgrouppos.xml` a dalsi. Viz [Kapitola 6.10](06-engine-api/10-central-economy.md).

---

## Z

**Zone (Damage Zone — Zona poskozeni)** — Pojmenovana oblast na modelu entity, ktera obdrzuje nezavisle sledovani zdravi. Definovana v config.cpp pod `DamageSystem` s `class DamageZones`. Bezne zony na hracich: `Head`, `Torso`, `LeftArm`, `LeftLeg` atd. Viz [Kapitola 6.1](06-engine-api/01-entity-system.md).

---

*Chybi pojem? Otevrete issue nebo poslete pull request.*
