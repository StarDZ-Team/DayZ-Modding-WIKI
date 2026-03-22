# Kapitola 8.9: Profesionální šablona modu

[Domů](../../README.md) | [<< Předchozí: Tvorba HUD překryvu](08-hud-overlay.md) | **Profesionální šablona modu** | [Další: Vytvoření vlastního vozidla >>](10-vehicle-mod.md)

---

> **Shrnutí:** Tato kapitola poskytuje kompletní profesionální šablonu modu pro DayZ, kterou můžete použít jako základ pro jakýkoli nový projekt. Obsahuje JSON konfiguraci s načítáním/ukládáním/výchozími hodnotami, string-směrované RPC, singleton manažer, životní cyklus modulu, UI panel, vlastní klávesové zkratky, lokalizaci a automatizovaný build skript.

---

## Obsah

- [Přehled](#přehled)
- [Kompletní adresářová struktura](#kompletní-adresářová-struktura)
- [mod.cpp](#modcpp)
- [config.cpp](#configcpp)
- [Soubor konstant (3_Game)](#soubor-konstant-3_game)
- [Třída konfiguračních dat (3_Game)](#třída-konfiguračních-dat-3_game)
- [Definice RPC (3_Game)](#definice-rpc-3_game)
- [Singleton manažer (4_World)](#singleton-manažer-4_world)
- [Handler událostí hráče (4_World)](#handler-událostí-hráče-4_world)
- [Hook mise: Server (5_Mission)](#hook-mise-server-5_mission)
- [Hook mise: Klient (5_Mission)](#hook-mise-klient-5_mission)
- [Skript UI panelu (5_Mission)](#skript-ui-panelu-5_mission)
- [Soubor rozvržení](#soubor-rozvržení)
- [stringtable.csv](#stringtablecsv)
- [Inputs.xml](#inputsxml)
- [Build skript](#build-skript)
- [Průvodce přizpůsobením](#průvodce-přizpůsobením)
- [Průvodce rozšiřováním funkcí](#průvodce-rozšiřováním-funkcí)
- [Další kroky](#další-kroky)

---

## Přehled

Mod "Hello World" dokazuje, že toolchain funguje. Profesionální mod potřebuje mnohem více:

| Záležitost | Hello World | Profesionální šablona |
|------------|-------------|----------------------|
| Konfigurace | Hardkódované hodnoty | JSON konfigurace s načítáním/ukládáním/výchozími hodnotami |
| Komunikace | Print příkazy | String-směrované RPC (klient na server a zpět) |
| Architektura | Jeden soubor, jedna funkce | Singleton manažer, vrstvené skripty, čistý životní cyklus |
| Uživatelské rozhraní | Žádné | UI panel řízený rozvržením s otevřením/zavřením |
| Ovládání | Žádné | Vlastní klávesová zkratka v Nastavení > Ovládání |
| Lokalizace | Žádná | stringtable.csv s 13 jazyky |
| Build pipeline | Ruční Addon Builder | Jednoklikový batch skript |
| Úklid | Žádný | Správné vypnutí při ukončení mise, žádné úniky |

Tato šablona vám dá vše z výše uvedeného připravené k použití. Přejmenujete identifikátory, odstraníte systémy, které nepotřebujete, a začnete stavět vaši skutečnou funkci na pevném základě.

---

## Kompletní adresářová struktura

Toto je kompletní zdrojové rozložení. Každý soubor uvedený níže je poskytnut jako kompletní šablona v této kapitole.

```
MyProfessionalMod/                          <-- Kořen zdrojáků (žije na P: disku)
    mod.cpp                                 <-- Metadata pro launcher
    Scripts/
        config.cpp                          <-- Registrace v enginu (CfgPatches + CfgMods)
        Inputs.xml                          <-- Definice klávesových zkratek
        stringtable.csv                     <-- Lokalizované řetězce (13 jazyků)
        3_Game/
            MyMod/
                MyModConstants.c            <-- Enumy, řetězec verze, sdílené konstanty
                MyModConfig.c               <-- JSON-serializovatelná konfigurace s výchozími hodnotami
                MyModRPC.c                  <-- Názvy RPC cest a registrace
        4_World/
            MyMod/
                MyModManager.c              <-- Singleton manažer (životní cyklus, konfigurace, stav)
                MyModPlayerHandler.c        <-- Hooky připojení/odpojení hráče
        5_Mission/
            MyMod/
                MyModMissionServer.c        <-- moddovaný MissionServer (inicializace/vypnutí serveru)
                MyModMissionClient.c        <-- moddovaný MissionGameplay (inicializace/vypnutí klienta)
                MyModUI.c                   <-- Skript UI panelu (otevření/zavření/naplnění)
        GUI/
            layouts/
                MyModPanel.layout           <-- Definice rozvržení UI
    build.bat                               <-- Automatizace balení PBO

Po sestavení distribovatelná složka modu vypadá takto:

@MyProfessionalMod/                         <-- Co jde na server / Workshop
    mod.cpp
    addons/
        MyProfessionalMod_Scripts.pbo       <-- Zabaleno z Scripts/
    keys/
        MyMod.bikey                         <-- Klíč pro podepsané servery
    meta.cpp                                <-- Metadata Workshopu (auto-generováno)
```

---

## mod.cpp

Tento soubor řídí, co hráči vidí v launcheru DayZ. Umísťuje se do kořene modu, **ne** dovnitř `Scripts/`.

```cpp
// ==========================================================================
// mod.cpp - Identita modu pro DayZ launcher
// Tento soubor čte launcher pro zobrazení informací o modu v seznamu modů.
// NENÍ kompilován skriptovým enginem -- jsou to čistá metadata.
// ==========================================================================

// Zobrazované jméno v seznamu modů launcheru a na herní obrazovce modů.
name         = "My Professional Mod";

// Vaše jméno nebo jméno týmu. Zobrazuje se ve sloupci "Autor".
author       = "YourName";

// Řetězec sémantické verze. Aktualizujte s každým vydáním.
// Launcher toto zobrazuje, aby hráči věděli, kterou verzi mají.
version      = "1.0.0";

// Krátký popis zobrazený při najetí na mod v launcheru.
// Udržujte pod 200 znaky pro čitelnost.
overview     = "A professional mod template with config, RPC, UI, and keybinds.";

// Popisek zobrazený při najetí. Obvykle odpovídá názvu modu.
tooltipOwned = "My Professional Mod";

// Volitelné: cesta k náhledovému obrázku (relativní ke kořenu modu).
// Doporučená velikost: 256x256 nebo 512x512, formát PAA nebo EDDS.
// Ponechte prázdné, pokud nemáte obrázek.
picture      = "";

// Volitelné: logo zobrazené v panelu detailů modu.
logo         = "";
logoSmall    = "";
logoOver     = "";

// Volitelné: URL otevřená, když hráč klikne na "Webová stránka" v launcheru.
action       = "";
actionURL    = "";
```

---

## config.cpp

Toto je nejkritičtější soubor. Registruje váš mod v enginu, deklaruje závislosti, propojuje skriptové vrstvy a volitelně nastavuje preprocesorové definice a image sety.

Umístěte na `Scripts/config.cpp`.

```cpp
// ==========================================================================
// config.cpp - Registrace v enginu
// DayZ engine toto čte, aby věděl, co váš mod poskytuje.
// Dvě sekce jsou důležité: CfgPatches (graf závislostí) a CfgMods (načítání skriptů).
// ==========================================================================

// --------------------------------------------------------------------------
// CfgPatches - Deklarace závislostí
// Engine toto používá pro určení pořadí načítání. Pokud váš mod závisí na
// jiném modu, uveďte třídu CfgPatches toho modu v requiredAddons[].
// --------------------------------------------------------------------------
class CfgPatches
{
    // Název třídy MUSÍ být globálně unikátní napříč všemi mody.
    // Konvence: NázevModu_Scripts (odpovídá názvu PBO).
    class MyMod_Scripts
    {
        // units[] a weapons[] deklarují konfigurační třídy definované tímto addonem.
        // Pro mody pouze se skripty ponechte prázdné. Používají je mody,
        // které definují nové předměty, zbraně nebo vozidla v config.cpp.
        units[] = {};
        weapons[] = {};

        // Minimální verze enginu. 0.1 funguje pro všechny aktuální verze DayZ.
        requiredVersion = 0.1;

        // Závislosti: uveďte názvy tříd CfgPatches z jiných modů.
        // "DZ_Data" je základní hra -- každý mod by na něm měl záviset.
        // Přidejte "CF_Scripts", pokud používáte Community Framework.
        // Přidejte patche jiných modů, pokud je rozšiřujete.
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

// --------------------------------------------------------------------------
// CfgMods - Registrace skriptových modulů
// Říká enginu, kde žije každá skriptová vrstva a jaké definice nastavit.
// --------------------------------------------------------------------------
class CfgMods
{
    // Název třídy zde je interní identifikátor vašeho modu.
    // NEMUSÍ odpovídat CfgPatches -- ale zachování souvislosti
    // usnadňuje orientaci v kódové bázi.
    class MyMod
    {
        // dir: název složky na P: disku (nebo v PBO).
        // Musí přesně odpovídat skutečnému názvu vaší kořenové složky.
        dir = "MyProfessionalMod";

        // Zobrazovaný název (zobrazený ve Workbench a některých logech enginu).
        name = "My Professional Mod";

        // Autor a popis pro metadata enginu.
        author = "YourName";
        overview = "Professional mod template";

        // Typ modu. Vždy "mod" pro skriptové mody.
        type = "mod";

        // credits: volitelná cesta k souboru Credits.json.
        // creditsJson = "MyProfessionalMod/Scripts/Credits.json";

        // inputs: cesta k vašemu Inputs.xml pro vlastní klávesové zkratky.
        // Toto MUSÍ být nastaveno zde, aby engine načetl vaše zkratky.
        inputs = "MyProfessionalMod/Scripts/Inputs.xml";

        // defines: preprocesorové symboly nastavené při načtení vašeho modu.
        // Jiné mody mohou použít #ifdef MYMOD pro detekci přítomnosti vašeho modu
        // a podmíněnou kompilaci integračního kódu.
        defines[] = { "MYMOD" };

        // dependencies: které vanilkové skriptové moduly váš mod hookuje.
        // "Game" = 3_Game, "World" = 4_World, "Mission" = 5_Mission.
        // Většina modů potřebuje všechny tři. Přidejte "Core" pouze pokud používáte 1_Core.
        dependencies[] =
        {
            "Game", "World", "Mission"
        };

        // defs: mapuje každý skriptový modul na jeho složku na disku.
        // Engine kompiluje všechny .c soubory nalezené rekurzivně v těchto cestách.
        // V Enforce Script neexistuje #include -- takto se soubory načítají.
        class defs
        {
            // imageSets: registrace .imageset souborů pro použití v rozvrženích.
            // Potřeba pouze pokud máte vlastní ikony/textury pro UI.
            // Odkomentujte a aktualizujte cesty, pokud přidáte imageset.
            //
            // class imageSets
            // {
            //     files[] =
            //     {
            //         "MyProfessionalMod/GUI/imagesets/mymod_icons.imageset"
            //     };
            // };

            // Vrstva Game (3_Game): načítá se první.
            // Umístěte enumy, konstanty, konfigurační třídy, definice RPC sem.
            // NEMŮŽE odkazovat na typy z 4_World nebo 5_Mission.
            class gameScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/3_Game" };
            };

            // Vrstva World (4_World): načítá se druhá.
            // Umístěte manažery, modifikace entit, světové interakce sem.
            // MŮŽE odkazovat na typy 3_Game. NEMŮŽE odkazovat na typy 5_Mission.
            class worldScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/4_World" };
            };

            // Vrstva Mission (5_Mission): načítá se poslední.
            // Umístěte hooky mise, UI panely, logiku spuštění/vypnutí sem.
            // MŮŽE odkazovat na typy ze všech nižších vrstev.
            class missionScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

## Soubor konstant (3_Game)

Umístěte na `Scripts/3_Game/MyMod/MyModConstants.c`.

Tento soubor definuje všechny sdílené konstanty, enumy a řetězec verze. Žije v `3_Game`, takže k těmto hodnotám má přístup každá vyšší vrstva.

```c
// ==========================================================================
// MyModConstants.c - Sdílené konstanty a enumy
// Vrstva 3_Game: dostupné všem vyšším vrstvám (4_World, 5_Mission).
//
// PROČ tento soubor existuje:
//   Centralizace konstant zabraňuje magickým číslům roztroušeným v souborech.
//   Enumy poskytují bezpečnost při kompilaci místo porovnávání syrových celých čísel.
//   Řetězec verze je definován jednou a používán v logech a UI.
// ==========================================================================

// ---------------------------------------------------------------------------
// Verze - aktualizujte s každým vydáním
// ---------------------------------------------------------------------------
const string MYMOD_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Tag logu - prefix pro všechny Print/log zprávy z tohoto modu
// Použití konzistentního tagu usnadňuje filtrování logu skriptů.
// ---------------------------------------------------------------------------
const string MYMOD_TAG = "[MyMod]";

// ---------------------------------------------------------------------------
// Cesty souborů - centralizované, aby se překlepy zachytily na jednom místě
// $profile: se za běhu vyřeší na profilový adresář serveru.
// ---------------------------------------------------------------------------
const string MYMOD_CONFIG_DIR  = "$profile:MyMod";
const string MYMOD_CONFIG_PATH = "$profile:MyMod/config.json";

// ---------------------------------------------------------------------------
// Enum: Režimy funkcí
// Použijte enumy místo syrových celých čísel pro čitelnost a kontroly při kompilaci.
// ---------------------------------------------------------------------------
enum MyModMode
{
    DISABLED = 0,    // Funkce je vypnutá
    PASSIVE  = 1,    // Funkce běží, ale nezasahuje
    ACTIVE   = 2     // Funkce je plně zapnutá
};

// ---------------------------------------------------------------------------
// Enum: Typy notifikací (používáno UI pro výběr ikony/barvy)
// ---------------------------------------------------------------------------
enum MyModNotifyType
{
    INFO    = 0,
    SUCCESS = 1,
    WARNING = 2,
    ERROR   = 3
};
```

---

## Třída konfiguračních dat (3_Game)

Umístěte na `Scripts/3_Game/MyMod/MyModConfig.c`.

Toto je JSON-serializovatelná třída nastavení. Server ji načítá při startu. Pokud soubor neexistuje, použijí se výchozí hodnoty a nová konfigurace se uloží na disk.

```c
// ==========================================================================
// MyModConfig.c - JSON konfigurace s výchozími hodnotami
// Vrstva 3_Game, takže ji mohou číst jak manažery 4_World, tak hooky 5_Mission.
//
// JAK TO FUNGUJE:
//   JsonFileLoader<MyModConfig> používá vestavěný JSON serializér
//   Enforce Script. Každé pole s výchozí hodnotou se zapíše/přečte
//   z JSON souboru. Přidání nového pole je bezpečné -- staré konfigurační
//   soubory jednoduše dostanou výchozí hodnotu pro chybějící pole.
//
// ZVLÁŠTNOST ENFORCE SCRIPT:
//   JsonFileLoader<T>.JsonLoadFile(path, obj) vrací VOID.
//   NEMŮŽETE udělat: if (JsonFileLoader<T>.JsonLoadFile(...)) -- to se nezkompiluje.
//   Vždy předávejte předem vytvořený objekt referencí.
// ==========================================================================

class MyModConfig
{
    // --- Obecná nastavení ---

    // Hlavní přepínač: pokud false, celý mod je vypnutý.
    bool Enabled = true;

    // Jak často (v sekundách) manažer spouští svůj aktualizační tick.
    // Nižší hodnoty = responzivnější, ale vyšší zátěž CPU.
    float UpdateInterval = 5.0;

    // Maximální počet předmětů/entit, které tento mod současně spravuje.
    int MaxItems = 100;

    // Režim: 0 = DISABLED, 1 = PASSIVE, 2 = ACTIVE (viz enum MyModMode).
    int Mode = 2;

    // --- Zprávy ---

    // Uvítací zpráva zobrazená hráčům při připojení.
    // Prázdný řetězec = žádná zpráva.
    string WelcomeMessage = "Welcome to the server!";

    // Zda zobrazit uvítací zprávu jako notifikaci nebo chatovou zprávu.
    bool WelcomeAsNotification = true;

    // --- Logování ---

    // Zapnutí podrobného ladícího logování. Vypněte pro produkční servery.
    bool DebugLogging = false;

    // -----------------------------------------------------------------------
    // Load - čte konfiguraci z disku, vrací instanci s výchozími hodnotami pokud chybí
    // -----------------------------------------------------------------------
    static MyModConfig Load()
    {
        // Vždy nejprve vytvořte čerstvou instanci. Tím zajistíte, že všechny
        // výchozí hodnoty jsou nastaveny, i když JSON souboru chybí pole
        // (např. po aktualizaci, která přidala nová nastavení).
        MyModConfig cfg = new MyModConfig();

        // Kontrola existence konfiguračního souboru před pokusem o načtení.
        // Při prvním spuštění nebude existovat -- použijeme výchozí hodnoty a uložíme.
        if (FileExist(MYMOD_CONFIG_PATH))
        {
            // JsonLoadFile naplní existující objekt. NEVRACÍ nový objekt.
            // Pole přítomná v JSON přepíší výchozí hodnoty;
            // pole chybějící v JSON si zachovají své výchozí hodnoty.
            JsonFileLoader<MyModConfig>.JsonLoadFile(MYMOD_CONFIG_PATH, cfg);
        }
        else
        {
            // První spuštění: uložení výchozích hodnot, aby admin měl soubor k úpravě.
            cfg.Save();
            Print(MYMOD_TAG + " No config found, created default at: " + MYMOD_CONFIG_PATH);
        }

        return cfg;
    }

    // -----------------------------------------------------------------------
    // Save - zapisuje aktuální hodnoty na disk jako formátovaný JSON
    // -----------------------------------------------------------------------
    void Save()
    {
        // Zajistěte, že adresář existuje. MakeDirectory je bezpečné volat,
        // i když adresář již existuje.
        if (!FileExist(MYMOD_CONFIG_DIR))
        {
            MakeDirectory(MYMOD_CONFIG_DIR);
        }

        // JsonSaveFile zapíše všechna pole jako JSON objekt.
        // Soubor se přepíše celý -- nedochází ke slučování.
        JsonFileLoader<MyModConfig>.JsonSaveFile(MYMOD_CONFIG_PATH, this);
    }
};
```

Výsledný `config.json` na disku vypadá takto:

```json
{
    "Enabled": true,
    "UpdateInterval": 5.0,
    "MaxItems": 100,
    "Mode": 2,
    "WelcomeMessage": "Welcome to the server!",
    "WelcomeAsNotification": true,
    "DebugLogging": false
}
```

Administrátoři upraví tento soubor, restartují server a nové hodnoty se projeví.

---

## Definice RPC (3_Game)

Umístěte na `Scripts/3_Game/MyMod/MyModRPC.c`.

RPC (Remote Procedure Call) je způsob komunikace klienta a serveru v DayZ. Tento soubor definuje názvy cest a poskytuje pomocné metody pro registraci.

```c
// ==========================================================================
// MyModRPC.c - Definice cest RPC a pomocníky
// Vrstva 3_Game: konstanty názvů cest musí být dostupné všude.
//
// JAK RPC FUNGUJE V DAYZ:
//   Engine poskytuje ScriptRPC a OnRPC pro odesílání/příjem dat.
//   Zavoláte GetGame().RPCSingleParam() nebo vytvoříte ScriptRPC, zapíšete
//   data a odešlete. Příjemce čte data ve stejném pořadí.
//
//   DayZ používá celočíselná RPC ID. Pro zamezení kolizím mezi mody by měl
//   každý mod zvolit unikátní rozsah ID nebo použít systém string-směrování.
//   Tato šablona používá jedno unikátní int ID se string prefixem
//   pro identifikaci, který handler by měl zpracovat každou zprávu.
//
// VZOR:
//   1. Klient chce data -> odešle požadavkové RPC na server
//   2. Server zpracuje  -> odešle odpovědní RPC zpět klientovi
//   3. Klient přijme    -> aktualizuje UI nebo stav
// ==========================================================================

// ---------------------------------------------------------------------------
// RPC ID - zvolte unikátní číslo, které pravděpodobně nebude kolidovat s jinými mody.
// Zkontrolujte komunitní wiki DayZ pro běžně používané rozsahy.
// Vestavěná RPC enginu používají nízká čísla (0-1000).
// Konvence: použijte 5-místné číslo založené na hashi názvu vašeho modu.
// ---------------------------------------------------------------------------
const int MYMOD_RPC_ID = 74291;

// ---------------------------------------------------------------------------
// Názvy cest RPC - stringové identifikátory pro každý RPC endpoint.
// Použití konstant zabraňuje překlepům a umožňuje vyhledávání v IDE.
// ---------------------------------------------------------------------------
const string MYMOD_RPC_CONFIG_SYNC     = "MyMod:ConfigSync";
const string MYMOD_RPC_WELCOME         = "MyMod:Welcome";
const string MYMOD_RPC_PLAYER_DATA     = "MyMod:PlayerData";
const string MYMOD_RPC_UI_REQUEST      = "MyMod:UIRequest";
const string MYMOD_RPC_UI_RESPONSE     = "MyMod:UIResponse";

// ---------------------------------------------------------------------------
// MyModRPCHelper - statická utilita pro odesílání RPC
// Obaluje standardní kód vytváření ScriptRPC, zápisu řetězce cesty,
// zápisu obsahu a volání Send().
// ---------------------------------------------------------------------------
class MyModRPCHelper
{
    // Odeslání stringové zprávy ze serveru konkrétnímu klientovi.
    // identity: cílový hráč. null = broadcast všem.
    // routeName: který handler by měl toto zpracovat (např. MYMOD_RPC_WELCOME).
    // message: stringový obsah.
    static void SendStringToClient(PlayerIdentity identity, string routeName, string message)
    {
        // Vytvoření RPC objektu. Toto je obálka.
        ScriptRPC rpc = new ScriptRPC();

        // Zapsat název cesty jako první. Příjemce toto přečte, aby rozhodl,
        // který handler zavolat. Vždy zapisujte/čtěte ve stejném pořadí.
        rpc.Write(routeName);

        // Zapsání dat obsahu.
        rpc.Write(message);

        // Odeslání klientovi. Parametry:
        //   null    = žádný cílový objekt (entita hráče není potřeba pro vlastní RPC)
        //   MYMOD_RPC_ID = náš unikátní RPC kanál
        //   true    = garantované doručení (podobné TCP). Použijte false pro časté aktualizace.
        //   identity = cílový klient. null by broadcastovalo VŠEM klientům.
        rpc.Send(null, MYMOD_RPC_ID, true, identity);
    }

    // Odeslání požadavku z klienta na server (bez obsahu, pouze cesta).
    static void SendRequestToServer(string routeName)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        // Při odesílání NA server je identity null (server nemá PlayerIdentity).
        // guaranteed = true zajistí doručení zprávy.
        rpc.Send(null, MYMOD_RPC_ID, true, null);
    }
};
```

---

## Singleton manažer (4_World)

Umístěte na `Scripts/4_World/MyMod/MyModManager.c`.

Toto je centrální mozek vašeho modu na straně serveru. Vlastní konfiguraci, zpracovává RPC a spouští periodické aktualizace.

```c
// ==========================================================================
// MyModManager.c - Singleton manažer na straně serveru
// Vrstva 4_World: může odkazovat na typy 3_Game (konfigurace, konstanty, RPC).
//
// PROČ singleton:
//   Manažer potřebuje přesně jednu instanci, která přetrvává celou misi.
//   Více instancí by způsobilo duplicitní zpracování a konfliktní stav.
//   Vzor singleton garantuje jednu instanci a poskytuje globální přístup
//   přes GetInstance().
//
// ŽIVOTNÍ CYKLUS:
//   1. MissionServer.OnInit() zavolá MyModManager.GetInstance().Init()
//   2. Manažer načte konfiguraci, zaregistruje RPC, spustí časovače
//   3. Manažer zpracovává události během hry
//   4. MissionServer.OnMissionFinish() zavolá MyModManager.Cleanup()
//   5. Singleton je zničen, všechny reference jsou uvolněny
// ==========================================================================

class MyModManager
{
    // Jediná instance. 'ref' znamená, že tato třída VLASTNÍ objekt.
    // Když je s_Instance nastaveno na null, objekt je zničen.
    private static ref MyModManager s_Instance;

    // Konfigurace načtená z disku.
    // 'ref' protože manažer vlastní životnost konfiguračního objektu.
    protected ref MyModConfig m_Config;

    // Akumulovaný čas od poslední aktualizace (sekundy).
    protected float m_TimeSinceUpdate;

    // Sleduje, zda bylo Init() úspěšně zavoláno.
    protected bool m_Initialized;

    // -----------------------------------------------------------------------
    // Přístup k singletonu
    // -----------------------------------------------------------------------

    static MyModManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyModManager();
        }
        return s_Instance;
    }

    // Zavolejte na konci mise pro zničení singletonu a uvolnění paměti.
    // Nastavení s_Instance na null spustí destruktor.
    static void Cleanup()
    {
        s_Instance = null;
    }

    // -----------------------------------------------------------------------
    // Životní cyklus
    // -----------------------------------------------------------------------

    // Voláno jednou z MissionServer.OnInit().
    void Init()
    {
        if (m_Initialized) return;

        // Načtení konfigurace z disku (nebo vytvoření výchozích hodnot při prvním spuštění).
        m_Config = MyModConfig.Load();

        if (!m_Config.Enabled)
        {
            Print(MYMOD_TAG + " Mod is DISABLED in config. Skipping initialization.");
            return;
        }

        // Reset aktualizačního časovače.
        m_TimeSinceUpdate = 0;

        m_Initialized = true;

        Print(MYMOD_TAG + " Manager initialized (v" + MYMOD_VERSION + ")");

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Debug logging enabled");
            Print(MYMOD_TAG + " Update interval: " + m_Config.UpdateInterval.ToString() + "s");
            Print(MYMOD_TAG + " Max items: " + m_Config.MaxItems.ToString());
        }
    }

    // Voláno každý snímek z MissionServer.OnUpdate().
    // timeslice je počet sekund od posledního snímku.
    void OnUpdate(float timeslice)
    {
        if (!m_Initialized || !m_Config.Enabled) return;

        // Akumulace času a zpracování pouze v nakonfigurovaném intervalu.
        // Tím se zabrání spouštění nákladné logiky každý jednotlivý snímek.
        m_TimeSinceUpdate += timeslice;
        if (m_TimeSinceUpdate < m_Config.UpdateInterval) return;
        m_TimeSinceUpdate = 0;

        // --- Logika periodické aktualizace patří sem ---
        // Příklad: iterace sledovaných entit, kontrola podmínek atd.
        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Periodic update tick");
        }
    }

    // Voláno při ukončení mise (vypnutí nebo restart serveru).
    void Shutdown()
    {
        if (!m_Initialized) return;

        Print(MYMOD_TAG + " Manager shutting down");

        // Uložení runtime stavu pokud potřeba.
        // m_Config.Save();

        m_Initialized = false;
    }

    // -----------------------------------------------------------------------
    // Handlery RPC
    // -----------------------------------------------------------------------

    // Voláno když klient vyžádá UI data.
    // sender: hráč, který odeslal požadavek.
    // ctx: datový proud (již za názvem cesty).
    void OnUIRequest(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " UI data requested by: " + sender.GetName());
        }

        // Sestavení dat odpovědi a odeslání zpět.
        // Ve skutečném modu byste zde shromáždili skutečná data.
        string responseData = "Items: " + m_Config.MaxItems.ToString();
        MyModRPCHelper.SendStringToClient(sender, MYMOD_RPC_UI_RESPONSE, responseData);
    }

    // Voláno při připojení hráče. Odešle uvítací zprávu pokud nakonfigurováno.
    void OnPlayerConnected(PlayerIdentity identity)
    {
        if (!m_Initialized || !m_Config.Enabled) return;
        if (!identity) return;

        // Odeslání uvítací zprávy pokud nakonfigurováno.
        if (m_Config.WelcomeMessage != "")
        {
            MyModRPCHelper.SendStringToClient(identity, MYMOD_RPC_WELCOME, m_Config.WelcomeMessage);

            if (m_Config.DebugLogging)
            {
                Print(MYMOD_TAG + " Sent welcome to: " + identity.GetName());
            }
        }
    }

    // -----------------------------------------------------------------------
    // Přístupové metody
    // -----------------------------------------------------------------------

    MyModConfig GetConfig()
    {
        return m_Config;
    }

    bool IsInitialized()
    {
        return m_Initialized;
    }
};
```

---

## Handler událostí hráče (4_World)

Umístěte na `Scripts/4_World/MyMod/MyModPlayerHandler.c`.

Toto používá vzor `modded class` pro napojení na vanilkovou entitu `PlayerBase` a detekci událostí připojení/odpojení.

```c
// ==========================================================================
// MyModPlayerHandler.c - Hooky životního cyklu hráče
// Vrstva 4_World: moddovaný PlayerBase pro zachycení připojení/odpojení.
//
// PROČ modded class:
//   DayZ nemá callback událost "hráč připojen". Standardní vzor je
//   přepsat metody na MissionServer (pro nová připojení)
//   nebo se napojit na PlayerBase (pro události na úrovni entity jako smrt).
//   Zde používáme moddovaný PlayerBase pro demonstraci hooků na úrovni entity.
//
// DŮLEŽITÉ:
//   Vždy volejte super.NázevMetody() jako první v overridech. Pokud tak
//   neučiníte, rozbijete řetězec vanilkového chování a ostatní mody,
//   které také přepisují stejnou metodu.
// ==========================================================================

modded class PlayerBase
{
    // Sledování, zda jsme odeslali inicializační událost pro tohoto hráče.
    // Tím se zabrání duplicitnímu zpracování, pokud je Init() volán vícekrát.
    protected bool m_MyModPlayerReady;

    // -----------------------------------------------------------------------
    // Voláno po plném vytvoření a replikaci entity hráče.
    // Na serveru je hráč v tomto bodě "připravený" přijímat RPC.
    // -----------------------------------------------------------------------
    override void Init()
    {
        super.Init();

        // Běžet pouze na serveru. GetGame().IsServer() vrací true na
        // dedikovaných serverech a na hostiteli listen serveru.
        if (!GetGame().IsServer()) return;

        // Ochrana proti dvojí inicializaci.
        if (m_MyModPlayerReady) return;
        m_MyModPlayerReady = true;

        // Získání síťové identity hráče.
        // Na serveru GetIdentity() vrací objekt PlayerIdentity
        // obsahující jméno hráče, Steam ID (PlainId) a UID.
        PlayerIdentity identity = GetIdentity();
        if (!identity) return;

        // Notifikace manažera o připojení hráče.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnPlayerConnected(identity);
        }
    }
};
```

---

## Hook mise: Server (5_Mission)

Umístěte na `Scripts/5_Mission/MyMod/MyModMissionServer.c`.

Toto se napojuje na `MissionServer` pro inicializaci a vypnutí modu na straně serveru.

```c
// ==========================================================================
// MyModMissionServer.c - Hooky mise na straně serveru
// Vrstva 5_Mission: poslední k načtení, může odkazovat na všechny nižší vrstvy.
//
// PROČ moddovaný MissionServer:
//   MissionServer je vstupní bod pro logiku na straně serveru. Jeho OnInit()
//   se spustí jednou při startu mise (boot serveru). OnMissionFinish()
//   se spustí při vypnutí nebo restartu serveru. Toto jsou správná místa
//   pro nastavení a zrušení systémů vašeho modu.
//
// POŘADÍ ŽIVOTNÍHO CYKLU:
//   1. Engine načte všechny skriptové vrstvy (3_Game -> 4_World -> 5_Mission)
//   2. Engine vytvoří instanci MissionServer
//   3. OnInit() je zavolán -> zde inicializujte vaše systémy
//   4. OnMissionStart() je zavolán -> svět je připraven, hráči se mohou připojit
//   5. OnUpdate() je voláno každý snímek
//   6. OnMissionFinish() je zavolán -> server se vypíná
// ==========================================================================

modded class MissionServer
{
    // -----------------------------------------------------------------------
    // Inicializace
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        // VŽDY volejte super jako první. Ostatní mody v řetězci na tom závisí.
        super.OnInit();

        // Inicializace singletonu manažera. Toto načte konfiguraci z disku,
        // zaregistruje handlery RPC a připraví mod k provozu.
        MyModManager.GetInstance().Init();

        Print(MYMOD_TAG + " Server mission initialized");
    }

    // -----------------------------------------------------------------------
    // Aktualizace každý snímek
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        // Delegování na manažera. Manažer zpracovává své vlastní omezení
        // frekvence (UpdateInterval z konfigurace), takže toto je levné.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnUpdate(timeslice);
        }
    }

    // -----------------------------------------------------------------------
    // Připojení hráče - dispatch RPC serveru
    // Voláno enginem, když klient odešle RPC na server.
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Zpracovat pouze naše RPC ID. Všechna ostatní RPC projdou.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Přečtení názvu cesty (první string zapsaný odesílatelem).
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Dispatch na správný handler podle názvu cesty.
        MyModManager mgr = MyModManager.GetInstance();
        if (!mgr) return;

        if (routeName == MYMOD_RPC_UI_REQUEST)
        {
            mgr.OnUIRequest(sender, ctx);
        }
        // Přidejte další cesty zde jak váš mod roste:
        // else if (routeName == MYMOD_RPC_SOME_OTHER)
        // {
        //     mgr.OnSomeOther(sender, ctx);
        // }
    }

    // -----------------------------------------------------------------------
    // Vypnutí
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Vypnutí manažera před voláním super.
        // Tím zajistíte, že náš úklid proběhne před tím, než engine strhne
        // infrastrukturu mise.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.Shutdown();
        }

        // Zničení singletonu pro uvolnění paměti a zabránění zastaralému stavu,
        // pokud se mise restartuje (např. restart serveru bez ukončení procesu).
        MyModManager.Cleanup();

        Print(MYMOD_TAG + " Server mission finished");

        super.OnMissionFinish();
    }
};
```

---

## Hook mise: Klient (5_Mission)

Umístěte na `Scripts/5_Mission/MyMod/MyModMissionClient.c`.

Toto se napojuje na `MissionGameplay` pro inicializaci na straně klienta, zpracování vstupu a příjem RPC.

```c
// ==========================================================================
// MyModMissionClient.c - Hooky mise na straně klienta
// Vrstva 5_Mission.
//
// PROČ MissionGameplay:
//   Na klientu je MissionGameplay aktivní třída mise během hry.
//   Přijímá OnUpdate() každý snímek (pro polling vstupu)
//   a OnRPC() pro příchozí zprávy ze serveru.
//
// POZNÁMKA K LISTEN SERVERŮM:
//   Na listen serveru (hostování + hraní) jsou aktivní JAK MissionServer,
//   TAK MissionGameplay. Váš klientský kód poběží souběžně se serverovým.
//   Chraňte pomocí GetGame().IsClient() nebo GetGame().IsServer(),
//   pokud potřebujete logiku specifickou pro stranu.
// ==========================================================================

modded class MissionGameplay
{
    // Reference na UI panel. null když je zavřený.
    protected ref MyModUI m_MyModPanel;

    // Sledování stavu inicializace.
    protected bool m_MyModInitialized;

    // -----------------------------------------------------------------------
    // Inicializace
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        m_MyModInitialized = true;

        Print(MYMOD_TAG + " Client mission initialized");
    }

    // -----------------------------------------------------------------------
    // Aktualizace každý snímek: polling vstupu a správa UI
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_MyModInitialized) return;

        // Polling klávesové zkratky definované v Inputs.xml.
        // GetUApi() vrací UserActions API.
        // GetInputByName() vyhledá akci podle názvu v Inputs.xml.
        // LocalPress() vrací true ve snímku, kdy je klávesa stisknuta.
        UAInput panelInput = GetUApi().GetInputByName("UAMyModPanel");
        if (panelInput && panelInput.LocalPress())
        {
            TogglePanel();
        }
    }

    // -----------------------------------------------------------------------
    // Přijímač RPC: zpracovává zprávy ze serveru
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Zpracovat pouze naše RPC ID.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Přečtení názvu cesty.
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Dispatch podle cesty.
        if (routeName == MYMOD_RPC_WELCOME)
        {
            string welcomeMsg;
            if (ctx.Read(welcomeMsg))
            {
                // Zobrazení uvítací zprávy hráči.
                GetGame().Chat(welcomeMsg, "");
                Print(MYMOD_TAG + " Welcome message: " + welcomeMsg);
            }
        }
        else if (routeName == MYMOD_RPC_UI_RESPONSE)
        {
            string responseData;
            if (ctx.Read(responseData))
            {
                // Aktualizace UI panelu přijatými daty.
                if (m_MyModPanel)
                {
                    m_MyModPanel.SetData(responseData);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // Přepnutí UI panelu
    // -----------------------------------------------------------------------
    protected void TogglePanel()
    {
        if (m_MyModPanel && m_MyModPanel.IsOpen())
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }
        else
        {
            // Otevřít pouze pokud je hráč naživu a žádné jiné menu se nezobrazuje.
            PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
            if (!player || !player.IsAlive()) return;

            UIManager uiMgr = GetGame().GetUIManager();
            if (uiMgr && uiMgr.GetMenu()) return;

            m_MyModPanel = new MyModUI();
            m_MyModPanel.Open();

            // Vyžádání čerstvých dat ze serveru.
            MyModRPCHelper.SendRequestToServer(MYMOD_RPC_UI_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // Vypnutí
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Zavření a zničení UI panelu pokud je otevřený.
        if (m_MyModPanel)
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }

        m_MyModInitialized = false;

        Print(MYMOD_TAG + " Client mission finished");

        super.OnMissionFinish();
    }
};
```

---

## Skript UI panelu (5_Mission)

Umístěte na `Scripts/5_Mission/MyMod/MyModUI.c`.

Tento skript řídí UI panel definovaný v souboru `.layout`. Najde reference widgetů, naplní je daty a zpracovává otevření/zavření.

```c
// ==========================================================================
// MyModUI.c - Řadič UI panelu
// Vrstva 5_Mission: může odkazovat na všechny nižší vrstvy.
//
// JAK FUNGUJE UI V DAYZ:
//   1. Soubor .layout definuje hierarchii widgetů (jako HTML).
//   2. Třída skriptu načte rozvržení, najde widgety podle názvu a
//      manipuluje s nimi (nastavení textu, zobrazení/skrytí, reakce na kliknutí).
//   3. Skript zobrazuje/skrývá kořenový widget a spravuje zaměření vstupu.
//
// ŽIVOTNÍ CYKLUS WIDGETŮ:
//   GetGame().GetWorkspace().CreateWidgets() načte soubor rozvržení a
//   vrátí kořenový widget. Poté použijete FindAnyWidget() pro získání
//   referencí na pojmenované potomkové widgety. Po skončení zavolejte
//   widget.Unlink() pro zničení celého stromu widgetů.
// ==========================================================================

class MyModUI
{
    // Kořenový widget panelu (načtený z .layout).
    protected ref Widget m_Root;

    // Pojmenované potomkové widgety.
    protected TextWidget m_TitleText;
    protected TextWidget m_DataText;
    protected TextWidget m_VersionText;
    protected ButtonWidget m_CloseButton;

    // Sledování stavu.
    protected bool m_IsOpen;

    // -----------------------------------------------------------------------
    // Konstruktor: načtení rozvržení a nalezení referencí widgetů
    // -----------------------------------------------------------------------
    void MyModUI()
    {
        // CreateWidgets načte soubor .layout a instanciuje všechny widgety.
        // Cesta je relativní ke kořenu modu (stejné jako cesty v config.cpp).
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModPanel.layout"
        );

        // Zpočátku skryto, dokud není zavoláno Open().
        if (m_Root)
        {
            m_Root.Show(false);

            // Nalezení pojmenovaných widgetů. Tyto názvy MUSÍ přesně odpovídat
            // názvům widgetů v souboru .layout (rozlišuje velká/malá písmena).
            m_TitleText   = TextWidget.Cast(m_Root.FindAnyWidget("TitleText"));
            m_DataText    = TextWidget.Cast(m_Root.FindAnyWidget("DataText"));
            m_VersionText = TextWidget.Cast(m_Root.FindAnyWidget("VersionText"));
            m_CloseButton = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));

            // Nastavení statického obsahu.
            if (m_TitleText)
                m_TitleText.SetText("My Professional Mod");

            if (m_VersionText)
                m_VersionText.SetText("v" + MYMOD_VERSION);
        }
    }

    // -----------------------------------------------------------------------
    // Open: zobrazení panelu a zachycení vstupu
    // -----------------------------------------------------------------------
    void Open()
    {
        if (!m_Root) return;

        m_Root.Show(true);
        m_IsOpen = true;

        // Uzamknutí ovládání hráče, aby WASD nepohybovalo postavou
        // zatímco je panel otevřený. Toto zobrazí kurzor.
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print(MYMOD_TAG + " UI panel opened");
    }

    // -----------------------------------------------------------------------
    // Close: skrytí panelu a uvolnění vstupu
    // -----------------------------------------------------------------------
    void Close()
    {
        if (!m_Root) return;

        m_Root.Show(false);
        m_IsOpen = false;

        // Znovu povolení ovládání hráče.
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print(MYMOD_TAG + " UI panel closed");
    }

    // -----------------------------------------------------------------------
    // Aktualizace dat: voláno když server odešle UI data
    // -----------------------------------------------------------------------
    void SetData(string data)
    {
        if (m_DataText)
        {
            m_DataText.SetText(data);
        }
    }

    // -----------------------------------------------------------------------
    // Dotaz na stav
    // -----------------------------------------------------------------------
    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -----------------------------------------------------------------------
    // Destruktor: úklid stromu widgetů
    // -----------------------------------------------------------------------
    void ~MyModUI()
    {
        // Unlink zničí kořenový widget a všechny jeho potomky.
        // Tím se uvolní paměť použitá stromem widgetů.
        if (m_Root)
        {
            m_Root.Unlink();
        }
    }
};
```

---

## Soubor rozvržení

Umístěte na `Scripts/GUI/layouts/MyModPanel.layout`.

Toto definuje vizuální strukturu UI panelu. Rozvržení DayZ používají vlastní textový formát (ne XML).

```
// ==========================================================================
// MyModPanel.layout - Struktura UI panelu
//
// PRAVIDLA DIMENZOVÁNÍ:
//   hexactsize 1 + vexactsize 1 = velikost je v pixelech (např. size 400 300)
//   hexactsize 0 + vexactsize 0 = velikost je proporcionální (0.0 až 1.0)
//   halign/valign řídí kotevní bod:
//     left_ref/top_ref     = ukotveno k levému/hornímu okraji rodiče
//     center_ref           = vycentrováno v rodiči
//     right_ref/bottom_ref = ukotveno k pravému/dolnímu okraji rodiče
//
// DŮLEŽITÉ:
//   - Nikdy nepoužívejte záporné velikosti. Místo toho použijte zarovnání a pozici.
//   - Názvy widgetů musí přesně odpovídat voláním FindAnyWidget() ve skriptu.
//   - 'ignorepointer 1' znamená, že widget nepřijímá kliknutí myší.
//   - 'scriptclass' propojuje widget se skriptovou třídou pro zpracování událostí.
// ==========================================================================

// Kořenový panel: vycentrovaný na obrazovce, 400x300 pixelů, poloprůhledné pozadí.
PanelWidgetClass MyModPanelRoot {
 position 0 0
 size 400 300
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 priority 100
 {
  // Záhlaví: plná šířka, 36px výška, nahoře.
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 36
   hexactpos 1
   vexactpos 1
   hexactsize 0
   vexactsize 1
   color 0.15 0.15 0.18 1
   {
    // Text záhlaví: zarovnaný vlevo s odsazením.
    TextWidgetClass TitleText {
     position 12 0
     size 300 36
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "My Mod"
     font "gui/fonts/metron2"
     "exact size" 16
     color 1 1 1 0.9
    }
    // Text verze: pravá strana záhlaví.
    TextWidgetClass VersionText {
     position 0 0
     size 80 36
     halign right_ref
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "v1.0.0"
     font "gui/fonts/metron2"
     "exact size" 12
     color 0.6 0.6 0.6 0.8
    }
   }
  }
  // Oblast obsahu: pod záhlavím, vyplňuje zbývající prostor.
  PanelWidgetClass ContentArea {
   position 0 40
   size 380 200
   halign center_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   color 0 0 0 0
   {
    // Text dat: kde se zobrazují serverová data.
    TextWidgetClass DataText {
     position 12 12
     size 356 160
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     ignorepointer 1
     text "Waiting for data..."
     font "gui/fonts/metron2"
     "exact size" 14
     color 0.85 0.85 0.85 1
    }
   }
  }
  // Tlačítko zavření: pravý dolní roh.
  ButtonWidgetClass CloseButton {
   position 0 0
   size 100 32
   halign right_ref
   valign bottom_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Close"
   font "gui/fonts/metron2"
   "exact size" 14
  }
 }
}
```

---

## stringtable.csv

Umístěte na `Scripts/stringtable.csv`.

Toto poskytuje lokalizaci pro veškerý text viditelný hráči. Engine čte sloupec odpovídající hernímu jazyku hráče. Sloupec `original` je záložní.

DayZ podporuje 13 jazykových sloupců. Každý řádek musí mít všech 13 sloupců (použijte anglický text jako zástupný pro jazyky, které nepřekládáte).

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod",
"STR_MYMOD_INPUT_PANEL","Open Panel","Open Panel","Otevrit Panel","Panel offnen","Otkryt Panel","Otworz Panel","Panel megnyitasa","Apri Pannello","Abrir Panel","Ouvrir Panneau","Open Panel","Open Panel","Abrir Painel","Open Panel",
"STR_MYMOD_TITLE","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod",
"STR_MYMOD_CLOSE","Close","Close","Zavrit","Schliessen","Zakryt","Zamknij","Bezaras","Chiudi","Cerrar","Fermer","Close","Close","Fechar","Close",
"STR_MYMOD_WELCOME","Welcome!","Welcome!","Vitejte!","Willkommen!","Dobro pozhalovat!","Witaj!","Udvozoljuk!","Benvenuto!","Bienvenido!","Bienvenue!","Welcome!","Welcome!","Bem-vindo!","Welcome!",
```

**Důležité:** Každý řádek musí končit koncovou čárkou za posledním jazykovým sloupcem. To je požadavek CSV parseru DayZ.

---

## Inputs.xml

Umístěte na `Scripts/Inputs.xml`.

Toto definuje vlastní klávesové zkratky, které se zobrazí v herním menu Nastavení > Ovládání. Pole `inputs` v `config.cpp` CfgMods musí odkazovat na tento soubor.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<!--
    Inputs.xml - Definice vlastních klávesových zkratek

    STRUKTURA:
    - <actions>:  deklaruje názvy vstupních akcí a jejich zobrazované řetězce
    - <sorting>:  seskupuje akce pod kategorii v menu Ovládání
    - <preset>:   nastavuje výchozí přiřazení klávesy

    KONVENCE POJMENOVÁNÍ:
    - Názvy akcí začínají "UA" (User Action) následovaným prefixem vašeho modu.
    - Atribut "loc" odkazuje na klíč řetězce ze stringtable.csv.

    NÁZVY KLÁVES:
    - Klávesnice: kA až kZ, k0-k9, kInsert, kHome, kEnd, kDelete,
      kNumpad0-kNumpad9, kF1-kF12, kLControl, kRControl, kLShift, kRShift,
      kLAlt, kRAlt, kSpace, kReturn, kBack, kTab, kEscape
    - Myš: mouse1 (levé), mouse2 (pravé), mouse3 (střední)
    - Kombinované klávesy: použijte element <combo> s více potomky <btn>
-->
<modded_inputs>
    <inputs>
        <!-- Deklarace vstupní akce. -->
        <actions>
            <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
        </actions>

        <!-- Seskupení pod kategorii v Nastavení > Ovládání. -->
        <!-- "name" je interní ID; "loc" je zobrazovaný název ze stringtable. -->
        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModPanel"/>
        </sorting>
    </inputs>

    <!-- Výchozí přednastavení klávesy. Hráči mohou přemapovat v Nastavení > Ovládání. -->
    <preset>
        <!-- Výchozí přiřazení na klávesu Home. -->
        <input name="UAMyModPanel">
            <btn name="kHome"/>
        </input>

        <!--
        PŘÍKLAD KOMBINOVANÉ KLÁVESY (odkomentujte pro použití):
        Toto by přiřadilo Ctrl+H místo jedné klávesy.
        <input name="UAMyModPanel">
            <combo>
                <btn name="kLControl"/>
                <btn name="kH"/>
            </combo>
        </input>
        -->
    </preset>
</modded_inputs>
```

---

## Build skript

Umístěte na `build.bat` v kořenu modu.

Tento batch soubor automatizuje balení PBO pomocí Addon Builderu z DayZ Tools.

```batch
@echo off
REM ==========================================================================
REM build.bat - Automatizované balení PBO pro MyProfessionalMod
REM
REM CO TO DĚLÁ:
REM   1. Zabalí složku Scripts/ do PBO souboru
REM   2. Umístí PBO do distribovatelné složky @mod
REM   3. Zkopíruje mod.cpp do distribovatelné složky
REM
REM PŘEDPOKLADY:
REM   - DayZ Tools nainstalované přes Steam
REM   - Zdrojáky modu na P:\MyProfessionalMod\
REM
REM POUŽITÍ:
REM   Dvakrát klikněte na tento soubor nebo spusťte z příkazového řádku: build.bat
REM ==========================================================================

REM --- Konfigurace: aktualizujte tyto cesty podle vašeho nastavení ---

REM Cesta k DayZ Tools (zkontrolujte cestu vaší knihovny Steam).
set DAYZ_TOOLS=C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools

REM Zdrojová složka: adresář Scripts, který se zabalí do PBO.
set SOURCE=P:\MyProfessionalMod\Scripts

REM Výstupní složka: kam jde zabalené PBO.
set OUTPUT=P:\@MyProfessionalMod\addons

REM Prefix: virtuální cesta uvnitř PBO. Musí odpovídat cestám
REM v config.cpp (např. "MyProfessionalMod/Scripts/3_Game" se musí vyřešit).
set PREFIX=MyProfessionalMod\Scripts

REM --- Kroky sestavení ---

echo ============================================
echo  Building MyProfessionalMod
echo ============================================

REM Vytvoření výstupního adresáře pokud neexistuje.
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

REM Spuštění Addon Builderu.
REM   -clear  = odstranění starého PBO před balením
REM   -prefix = nastavení prefixu PBO (vyžadováno pro vyřešení cest skriptů)
echo Packing PBO...
"%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe" "%SOURCE%" "%OUTPUT%" -prefix=%PREFIX% -clear

REM Kontrola, zda Addon Builder uspěl.
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: PBO packing failed! Check the output above for details.
    echo Common causes:
    echo   - DayZ Tools path is wrong
    echo   - Source folder does not exist
    echo   - A .c file has a syntax error that prevents packing
    pause
    exit /b 1
)

REM Kopírování mod.cpp do distribovatelné složky.
echo Copying mod.cpp...
copy /Y "P:\MyProfessionalMod\mod.cpp" "P:\@MyProfessionalMod\mod.cpp" >nul

echo.
echo ============================================
echo  Build complete!
echo  Output: P:\@MyProfessionalMod\
echo ============================================
echo.
echo To test with file patching (no PBO needed):
echo   DayZDiag_x64.exe -mod=P:\MyProfessionalMod -filePatching
echo.
echo To test with the built PBO:
echo   DayZDiag_x64.exe -mod=P:\@MyProfessionalMod
echo.
pause
```

---

## Průvodce přizpůsobením

Když použijete tuto šablonu pro svůj vlastní mod, musíte přejmenovat každý výskyt zástupných názvů. Zde je kompletní kontrolní seznam.

### Krok 1: Zvolte své názvy

Rozhodněte se o těchto identifikátorech před jakýmikoli úpravami:

| Identifikátor | Příklad | Pravidla |
|----------------|---------|----------|
| **Název složky modu** | `MyBountySystem` | Bez mezer, PascalCase nebo podtržítka |
| **Zobrazovaný název** | `"My Bounty System"` | Čitelný pro člověka, pro mod.cpp a config.cpp |
| **Třída CfgPatches** | `MyBountySystem_Scripts` | Musí být globálně unikátní napříč všemi mody |
| **Třída CfgMods** | `MyBountySystem` | Interní identifikátor enginu |
| **Prefix skriptů** | `MyBounty` | Krátký prefix pro třídy: `MyBountyManager`, `MyBountyConfig` |
| **Konstanta tagu** | `MYBOUNTY_TAG` | Pro log zprávy: `"[MyBounty]"` |
| **Preprocesorová definice** | `MYBOUNTYSYSTEM` | Pro `#ifdef` detekci mezi mody |
| **RPC ID** | `58432` | Unikátní 5-místné číslo, nepoužívané jinými mody |
| **Název vstupní akce** | `UAMyBountyPanel` | Začíná `UA`, unikátní |

### Krok 2: Přejmenování souborů a složek

Přejmenujte každý soubor a složku obsahující "MyMod" nebo "MyProfessionalMod":

```
MyProfessionalMod/           -> MyBountySystem/
  Scripts/3_Game/MyMod/      -> Scripts/3_Game/MyBounty/
    MyModConstants.c          -> MyBountyConstants.c
    MyModConfig.c             -> MyBountyConfig.c
    MyModRPC.c                -> MyBountyRPC.c
  Scripts/4_World/MyMod/     -> Scripts/4_World/MyBounty/
    MyModManager.c            -> MyBountyManager.c
    MyModPlayerHandler.c      -> MyBountyPlayerHandler.c
  Scripts/5_Mission/MyMod/   -> Scripts/5_Mission/MyBounty/
    MyModMissionServer.c      -> MyBountyMissionServer.c
    MyModMissionClient.c      -> MyBountyMissionClient.c
    MyModUI.c                 -> MyBountyUI.c
  Scripts/GUI/layouts/
    MyModPanel.layout          -> MyBountyPanel.layout
```

### Krok 3: Najít-a-nahradit v každém souboru

Proveďte tyto náhrady **v pořadí** (nejdelší řetězce první pro zamezení částečných shod):

| Najít | Nahradit | Dotčené soubory |
|-------|----------|-----------------|
| `MyProfessionalMod` | `MyBountySystem` | config.cpp, mod.cpp, build.bat, UI skript |
| `MyModManager` | `MyBountyManager` | Manažer, hooky mise, handler hráče |
| `MyModConfig` | `MyBountyConfig` | Třída konfigurace, manažer |
| `MyModRPCHelper` | `MyBountyRPCHelper` | Pomocník RPC, hooky mise |
| `MyModUI` | `MyBountyUI` | UI skript, hook klientské mise |
| `MyModPanel` | `MyBountyPanel` | Soubor rozvržení, UI skript |
| `MyMod_Scripts` | `MyBountySystem_Scripts` | config.cpp CfgPatches |
| `MYMOD_RPC_ID` | `MYBOUNTY_RPC_ID` | Konstanty, RPC, hooky mise |
| `MYMOD_RPC_` | `MYBOUNTY_RPC_` | Všechny konstanty cest RPC |
| `MYMOD_TAG` | `MYBOUNTY_TAG` | Konstanty, všechny soubory používající tag logu |
| `MYMOD_CONFIG` | `MYBOUNTY_CONFIG` | Konstanty, třída konfigurace |
| `MYMOD_VERSION` | `MYBOUNTY_VERSION` | Konstanty, UI skript |
| `MYMOD` | `MYBOUNTYSYSTEM` | config.cpp defines[] |
| `MyMod` | `MyBounty` | config.cpp třída CfgMods, řetězce cest RPC |
| `My Mod` | `My Bounty System` | Řetězce v rozvrženích, stringtable |
| `mymod` | `mybounty` | Inputs.xml název řazení |
| `STR_MYMOD_` | `STR_MYBOUNTY_` | stringtable.csv, Inputs.xml |
| `UAMyMod` | `UAMyBounty` | Inputs.xml, hook klientské mise |
| `m_MyMod` | `m_MyBounty` | Členské proměnné hooku klientské mise |
| `74291` | `58432` | RPC ID (vaše zvolené unikátní číslo) |

### Krok 4: Ověření

Po přejmenování proveďte celoprojektové vyhledávání "MyMod" a "MyProfessionalMod" pro zachycení čehokoli, co jste přehlédli. Poté sestavte a testujte:

```batch
DayZDiag_x64.exe -mod=P:\MyBountySystem -filePatching
```

Zkontrolujte log skriptů na váš tag (např. `[MyBounty]`) pro potvrzení, že se vše načetlo.

---

## Průvodce rozšiřováním funkcí

Jakmile váš mod běží, zde je postup přidání běžných funkcí.

### Přidání nového RPC endpointu

**1. Definujte konstantu cesty** v `MyModRPC.c` (3_Game):

```c
const string MYMOD_RPC_BOUNTY_SET = "MyMod:BountySet";
```

**2. Přidejte handler serveru** v `MyModManager.c` (4_World):

```c
void OnBountySet(PlayerIdentity sender, ParamsReadContext ctx)
{
    // Čtení parametrů zapsaných klientem.
    string targetName;
    int bountyAmount;
    if (!ctx.Read(targetName)) return;
    if (!ctx.Read(bountyAmount)) return;

    Print(MYMOD_TAG + " Bounty set on " + targetName + ": " + bountyAmount.ToString());
    // ... vaše logika zde ...
}
```

**3. Přidejte dispatch case** v `MyModMissionServer.c` (5_Mission), uvnitř `OnRPC()`:

```c
else if (routeName == MYMOD_RPC_BOUNTY_SET)
{
    mgr.OnBountySet(sender, ctx);
}
```

**4. Odešlete z klienta** (kdekoli je akce spuštěna):

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(MYMOD_RPC_BOUNTY_SET);
rpc.Write("PlayerName");
rpc.Write(5000);
rpc.Send(null, MYMOD_RPC_ID, true, null);
```

### Přidání nového konfiguračního pole

**1. Přidejte pole** v `MyModConfig.c` s výchozí hodnotou:

```c
// Minimální částka odměny, kterou hráči mohou nastavit.
int MinBountyAmount = 100;
```

To je vše. JSON serializér automaticky zachytí veřejná pole. Existující konfigurační soubory na disku budou pro nové pole používat výchozí hodnotu, dokud admin neupraví a neuloží.

**2. Odkažte na něj** z manažera:

```c
if (bountyAmount < m_Config.MinBountyAmount)
{
    // Odmítnutí: příliš nízké.
    return;
}
```

### Přidání nového UI panelu

**1. Vytvořte rozvržení** na `Scripts/GUI/layouts/MyModBountyList.layout`:

```
PanelWidgetClass BountyListRoot {
 position 0 0
 size 500 400
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 {
  TextWidgetClass BountyListTitle {
   position 12 8
   size 476 30
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Active Bounties"
   font "gui/fonts/metron2"
   "exact size" 18
   color 1 1 1 0.9
  }
 }
}
```

**2. Vytvořte skript** na `Scripts/5_Mission/MyMod/MyModBountyListUI.c`:

```c
class MyModBountyListUI
{
    protected ref Widget m_Root;
    protected bool m_IsOpen;

    void MyModBountyListUI()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModBountyList.layout"
        );
        if (m_Root)
            m_Root.Show(false);
    }

    void Open()  { if (m_Root) { m_Root.Show(true); m_IsOpen = true; } }
    void Close() { if (m_Root) { m_Root.Show(false); m_IsOpen = false; } }
    bool IsOpen() { return m_IsOpen; }

    void ~MyModBountyListUI()
    {
        if (m_Root) m_Root.Unlink();
    }
};
```

### Přidání nové klávesové zkratky

**1. Přidejte akci** v `Inputs.xml`:

```xml
<actions>
    <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
    <input name="UAMyModBountyList" loc="STR_MYMOD_INPUT_BOUNTYLIST" />
</actions>

<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModPanel"/>
    <input name="UAMyModBountyList"/>
</sorting>
```

**2. Přidejte výchozí přiřazení** v sekci `<preset>`:

```xml
<input name="UAMyModBountyList">
    <btn name="kEnd"/>
</input>
```

**3. Přidejte lokalizaci** v `stringtable.csv`:

```csv
"STR_MYMOD_INPUT_BOUNTYLIST","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List",
```

**4. Pollujte vstup** v `MyModMissionClient.c`:

```c
UAInput bountyInput = GetUApi().GetInputByName("UAMyModBountyList");
if (bountyInput && bountyInput.LocalPress())
{
    ToggleBountyList();
}
```

### Přidání nového záznamu stringtable

**1. Přidejte řádek** v `stringtable.csv`. Každý řádek potřebuje všech 13 jazykových sloupců plus koncovou čárku:

```csv
"STR_MYMOD_BOUNTY_PLACED","Bounty placed!","Bounty placed!","Odměna vypsána!","Kopfgeld gesetzt!","Награда назначена!","Nagroda wyznaczona!","Fejpénz kiírva!","Taglia piazzata!","Recompensa puesta!","Prime placée!","Bounty placed!","Bounty placed!","Recompensa colocada!","Bounty placed!",
```

**2. Použijte ho** v kódu skriptu:

```c
// Widget.SetText() AUTOMATICKY neřeší klíče stringtable.
// Musíte použít Widget.SetText() s vyřešeným řetězcem:
string localizedText = Widget.TranslateString("#STR_MYMOD_BOUNTY_PLACED");
myTextWidget.SetText(localizedText);
```

Nebo v souboru `.layout` engine řeší klíče `#STR_` automaticky:

```
text "#STR_MYMOD_BOUNTY_PLACED"
```

---

## Další kroky

S touto profesionální šablonou v provozu můžete:

1. **Studovat produkční mody** -- Čtěte [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) a zdrojáky `StarDZ_Core` pro reálné vzory ve velkém měřítku.
2. **Přidat vlastní předměty** -- Postupujte podle [Kapitoly 8.2: Vytvoření vlastního předmětu](02-custom-item.md) a integrujte je s vaším manažerem.
3. **Sestavit administrátorský panel** -- Postupujte podle [Kapitoly 8.3: Tvorba administrátorského panelu](03-admin-panel.md) s využitím vašeho konfiguračního systému.
4. **Přidat HUD překryv** -- Postupujte podle [Kapitoly 8.8: Tvorba HUD překryvu](08-hud-overlay.md) pro trvale viditelné UI prvky.
5. **Publikovat na Workshop** -- Postupujte podle [Kapitoly 8.7: Publikování na Workshop](07-publishing-workshop.md), když je váš mod připraven.
6. **Naučit se ladění** -- Čtěte [Kapitolu 8.6: Ladění a testování](06-debugging-testing.md) pro analýzu logů a řešení problémů.

---

**Předchozí:** [Kapitola 8.8: Tvorba HUD překryvu](08-hud-overlay.md) | [Domů](../../README.md)
