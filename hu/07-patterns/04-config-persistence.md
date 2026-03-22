# 7.4. fejezet: Konfiguráció perzisztencia

[Kezdőlap](../README.md) | [<< Előző: RPC minták](03-rpc-patterns.md) | **Konfiguráció perzisztencia** | [Következő: Jogosultsági rendszerek >>](05-permissions.md)

---

## Bevezetés

Szinte minden DayZ modnak szüksége van konfigurációs adatok mentésére és betöltésére: szerver beállítások, spawn táblák, tiltólisták, játékosadatok, teleport helyszínek. A motor a `JsonFileLoader`-t biztosítja egyszerű JSON szerializációhoz és nyers fájl I/O-t (`FileHandle`, `FPrintln`) minden máshoz. A professzionális modok konfiguráció-verziózást és automatikus migrációt építenek erre.

Ez a fejezet az alap JSON mentés/betöltéstől a verziózott migrációs rendszereken, könyvtárkezelésen és automatikus mentési időzítőkön át tárgyalja a standard konfigurációperzisztencia-mintákat.

---

## Tartalomjegyzék

- [JsonFileLoader minta](#jsonfileloader-minta)
- [Kézi JSON írás (FPrintln)](#kézi-json-írás-fprintln)
- [A $profile útvonal](#a-profile-útvonal)
- [Könyvtár létrehozása](#könyvtár-létrehozása)
- [Konfigurációs adatosztályok](#konfigurációs-adatosztályok)
- [Konfiguráció verziózás és migráció](#konfiguráció-verziózás-és-migráció)
- [Automatikus mentési időzítők](#automatikus-mentési-időzítők)
- [Gyakori hibák](#gyakori-hibák)
- [Bevált gyakorlatok](#bevált-gyakorlatok)

---

## JsonFileLoader minta

A `JsonFileLoader` a motor beépített szerializálója. Enforce Script objektumok és JSON fájlok közötti konverzióra szolgál reflexió használatával --- beolvassa az osztályod publikus mezőit és automatikusan JSON kulcsokra képezi le őket.

### Kritikus buktató

**A `JsonFileLoader<T>.JsonLoadFile()` és a `JsonFileLoader<T>.JsonSaveFile()` `void`-ot ad vissza.** Nem ellenőrizheted a visszatérési értéküket. Nem rendelheted `bool`-hoz. Nem használhatod `if` feltételben. Ez az egyik leggyakoribb hiba a DayZ moddingban.

```c
// HIBÁS — nem fordul le
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// HIBÁS — nem fordul le
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// HELYES — hívd meg, majd ellenőrizd az objektum állapotát
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
// Ellenőrizd, hogy az adatok valóban feltöltődtek-e
if (config.m_ServerName != "")
{
    // Adatok sikeresen betöltve
}
```

### Alap mentés/betöltés

```c
// Adatosztály — a publikus mezők szerializálódnak JSON-ba/-ból
class ServerSettings
{
    string ServerName = "My DayZ Server";
    int MaxPlayers = 60;
    float RestartInterval = 14400.0;
    bool PvPEnabled = true;
};

class SettingsManager
{
    private static const string SETTINGS_PATH = "$profile:MyMod/ServerSettings.json";
    protected ref ServerSettings m_Settings;

    void Load()
    {
        m_Settings = new ServerSettings();

        if (FileExist(SETTINGS_PATH))
        {
            JsonFileLoader<ServerSettings>.JsonLoadFile(SETTINGS_PATH, m_Settings);
        }
        else
        {
            // Első futtatás: alapértelmezések mentése
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### Mi szerializálódik

A `JsonFileLoader` **minden publikus mezőt** szerializál az objektumon. Nem szerializálja:
- Privát vagy védett mezőket
- Metódusokat
- Statikus mezőket
- Tranziens/csak futásidejű mezőket (nincs `[NonSerialized]` attribútum --- használj hozzáférés-módosítókat)

Az eredményül kapott JSON így néz ki:

```json
{
    "ServerName": "My DayZ Server",
    "MaxPlayers": 60,
    "RestartInterval": 14400.0,
    "PvPEnabled": true
}
```

### Támogatott mezőtípusok

| Típus | JSON ábrázolás |
|------|-------------------|
| `int` | Szám |
| `float` | Szám |
| `bool` | `true` / `false` |
| `string` | Szöveg |
| `vector` | 3 számból álló tömb |
| `array<T>` | JSON tömb |
| `map<string, T>` | JSON objektum (csak szöveg kulcsokkal) |
| Beágyazott osztály | Beágyazott JSON objektum |

### Beágyazott objektumok

```c
class SpawnPoint
{
    string Name;
    vector Position;
    float Radius;
};

class SpawnConfig
{
    ref array<ref SpawnPoint> SpawnPoints = new array<ref SpawnPoint>();
};
```

Eredménye:

```json
{
    "SpawnPoints": [
        {
            "Name": "Coast",
            "Position": [13000, 0, 3500],
            "Radius": 100.0
        },
        {
            "Name": "Airfield",
            "Position": [4500, 0, 9500],
            "Radius": 50.0
        }
    ]
}
```

---

## Kézi JSON írás (FPrintln)

Néha a `JsonFileLoader` nem elég rugalmas: nem kezeli a vegyes típusú tömböket, az egyéni formázást vagy a nem osztály típusú adatszerkezeteket. Ilyen esetekben használj nyers fájl I/O-t.

### Alap minta

```c
void WriteCustomData(string path, array<string> lines)
{
    FileHandle file = OpenFile(path, FileMode.WRITE);
    if (!file) return;

    FPrintln(file, "{");
    FPrintln(file, "    \"entries\": [");

    for (int i = 0; i < lines.Count(); i++)
    {
        string comma = "";
        if (i < lines.Count() - 1) comma = ",";
        FPrintln(file, "        \"" + lines[i] + "\"" + comma);
    }

    FPrintln(file, "    ]");
    FPrintln(file, "}");

    CloseFile(file);
}
```

### Nyers fájlok olvasása

```c
void ReadCustomData(string path)
{
    FileHandle file = OpenFile(path, FileMode.READ);
    if (!file) return;

    string line;
    while (FGets(file, line) >= 0)
    {
        line = line.Trim();
        if (line == "") continue;
        // Sor feldolgozása...
    }

    CloseFile(file);
}
```

### Mikor használj kézi I/O-t

- Naplófájlok írása (hozzáfűzés módban)
- CSV vagy egyszerű szöveges exportok írása
- Egyéni JSON formázás, amit a `JsonFileLoader` nem tud előállítani
- Nem-JSON fájlformátumok elemzése (pl. DayZ `.map` vagy `.xml` fájlok)

Standard konfigurációs fájlokhoz használd inkább a `JsonFileLoader`-t. Gyorsabb implementálni, kevésbé hibára hajlamos, és automatikusan kezeli a beágyazott objektumokat.

---

## A $profile útvonal

A DayZ a `$profile:` útvonal-előtagot biztosítja, amely a szerver profil könyvtárára oldódik fel (általában a `DayZServer_x64.exe`-t tartalmazó mappa, vagy a `-profiles=` kapcsolóval megadott profil útvonal).

```c
// Ezek a profil könyvtárra oldódnak fel:
"$profile:MyMod/config.json"       // → C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // → C:/DayZServer/MyMod/Players/data.json
```

### Mindig használd a $profile-t

Soha ne használj abszolút útvonalakat. Soha ne használj relatív útvonalakat. Mindig a `$profile:`-t használd minden fájlhoz, amit a mod futásidőben létrehoz vagy olvas:

```c
// ROSSZ: Abszolút útvonal — más gépen nem működik
const string CONFIG_PATH = "C:/DayZServer/MyMod/config.json";

// ROSSZ: Relatív útvonal — a munkakönyvtártól függ, ami változó
const string CONFIG_PATH = "MyMod/config.json";

// JÓ: $profile mindenhol helyesen oldódik fel
const string CONFIG_PATH = "$profile:MyMod/config.json";
```

### Szokásos könyvtárszerkezet

A legtöbb mod ezt a konvenciót követi:

```
$profile:
  └── YourModName/
      ├── Config.json          (fő szerver konfiguráció)
      ├── Permissions.json     (admin jogosultságok)
      ├── Logs/
      │   └── 2025-01-15.log   (napi naplófájlok)
      └── Players/
          ├── 76561198xxxxx.json
          └── 76561198yyyyy.json
```

---

## Könyvtár létrehozása

Fájl írása előtt biztosítanod kell, hogy a szülő könyvtár létezik. A DayZ nem hozza létre automatikusan a könyvtárakat.

### MakeDirectory

```c
void EnsureDirectories()
{
    string baseDir = "$profile:MyMod";
    if (!FileExist(baseDir))
    {
        MakeDirectory(baseDir);
    }

    string playersDir = baseDir + "/Players";
    if (!FileExist(playersDir))
    {
        MakeDirectory(playersDir);
    }

    string logsDir = baseDir + "/Logs";
    if (!FileExist(logsDir))
    {
        MakeDirectory(logsDir);
    }
}
```

### Fontos: A MakeDirectory nem rekurzív

A `MakeDirectory` csak az útvonal utolsó könyvtárát hozza létre. Ha a szülő nem létezik, csendben kudarcot vall. Minden szintet külön kell létrehoznod:

```c
// HIBÁS: A "MyMod" szülő még nem létezik
MakeDirectory("$profile:MyMod/Data/Players");  // Csendben kudarcot vall

// HELYES: Minden szint létrehozása
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

### Útvonal-konstansok minta

Egy keretrendszer mod az összes útvonalat konstansként definiálja egy dedikált osztályban:

```c
class MyModConst
{
    static const string PROFILE_DIR    = "$profile:MyMod";
    static const string CONFIG_DIR     = "$profile:MyMod/Configs";
    static const string LOG_DIR        = "$profile:MyMod/Logs";
    static const string PLAYERS_DIR    = "$profile:MyMod/Players";
    static const string PERMISSIONS_FILE = "$profile:MyMod/Permissions.json";
};
```

Ez elkerüli az útvonal-szövegek duplikálását a kódbázisban és megkönnyíti minden fájl megtalálását, amit a mod érint.

---

## Konfigurációs adatosztályok

Egy jól tervezett konfigurációs adatosztály alapértelmezett értékeket, verziókövetést és az egyes mezők világos dokumentációját biztosítja.

### Alap minta

```c
class MyModConfig
{
    // Verziókövetés a migrációkhoz
    int ConfigVersion = 3;

    // Játékmenet beállítások ésszerű alapértelmezésekkel
    bool EnableFeatureX = true;
    int MaxEntities = 50;
    float SpawnRadius = 500.0;
    string WelcomeMessage = "Welcome to the server!";

    // Összetett beállítások
    ref array<string> AllowedWeapons = new array<string>();
    ref map<string, float> ZoneRadii = new map<string, float>();

    void MyModConfig()
    {
        // Gyűjtemények inicializálása alapértelmezésekkel
        AllowedWeapons.Insert("AK74");
        AllowedWeapons.Insert("M4A1");

        ZoneRadii.Set("safe_zone", 100.0);
        ZoneRadii.Set("pvp_zone", 500.0);
    }
};
```

### Reflektív ConfigBase minta

Ez a minta reflektív konfigurációs rendszert használ, ahol minden konfigurációs osztály leíróként deklarálja a mezőit. Ez lehetővé teszi, hogy az admin panel automatikusan generáljon UI-t bármely konfigurációhoz beégetett mezőnevek nélkül:

```c
// Koncepcionális minta (reflektív konfiguráció):
class MyConfigBase
{
    // Minden konfiguráció deklarálja a verzióját
    int ConfigVersion;
    string ModId;

    // Az alosztályok felülírják a mezőik deklarálásához
    void Init(string modId)
    {
        ModId = modId;
    }

    // Reflexió: összes konfigurálható mező lekérése
    array<ref MyConfigField> GetFields();

    // Dinamikus get/set mezőnév alapján (admin panel szinkronizációhoz)
    string GetFieldValue(string fieldName);
    void SetFieldValue(string fieldName, string value);

    // Hookok egyéni logikához betöltés/mentés során
    void OnAfterLoad() {}
    void OnBeforeSave() {}
};
```

### VPP ConfigurablePlugin minta

A VPP a konfigurációkezelést közvetlenül a plugin életciklusba integrálja:

```c
// VPP minta (egyszerűsítve):
class VPPESPConfig
{
    bool EnableESP = true;
    float MaxDistance = 1000.0;
    int RefreshRate = 5;
};

class VPPESPPlugin : ConfigurablePlugin
{
    ref VPPESPConfig m_ESPConfig;

    override void OnInit()
    {
        m_ESPConfig = new VPPESPConfig();
        // A ConfigurablePlugin.LoadConfig() kezeli a JSON betöltést
        super.OnInit();
    }
};
```

---

## Konfiguráció verziózás és migráció

Ahogy a modod fejlődik, a konfigurációs struktúrák változnak. Mezőket adsz hozzá, távolítasz el, nevezel át, alapértelmezéseket változtatsz. Verziózás nélkül a régi konfigurációs fájlokkal rendelkező felhasználók csendben rossz értékeket kapnak vagy összeomlást tapasztalnak.

### A verziómező

Minden konfigurációs osztálynak kell legyen egy egész szám verziómezője:

```c
class MyModConfig
{
    int ConfigVersion = 5;  // Növeld, amikor a struktúra változik
    // ...
};
```

### Migráció betöltéskor

Konfiguráció betöltésekor hasonlítsd össze a lemezen lévő verziót az aktuális kódverzióval. Ha különböznek, futtass migrációkat:

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // Aktuális alapértelmezésekkel

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // Újramentés frissített verzióval
        }
    }
    else
    {
        SaveConfig(config);  // Első futtatás: alapértelmezések írása
    }

    m_Config = config;
}
```

### Migrációs függvények

```c
static const int CURRENT_VERSION = 5;

void MigrateConfig(MyModConfig config)
{
    // Minden migrációs lépés sorrendben fut
    if (config.ConfigVersion < 2)
    {
        // v1 → v2: A "SpawnDelay" átnevezve "RespawnInterval"-ra
        // A régi mező betöltéskor elveszik; állítsd be az új alapértelmezést
        config.RespawnInterval = 300.0;
    }

    if (config.ConfigVersion < 3)
    {
        // v2 → v3: "EnableNotifications" mező hozzáadva
        config.EnableNotifications = true;
    }

    if (config.ConfigVersion < 4)
    {
        // v3 → v4: "MaxZombies" alapértelmezés 100-ról 200-ra változott
        if (config.MaxZombies == 100)
        {
            config.MaxZombies = 200;  // Csak akkor frissítsd, ha a felhasználó nem változtatta meg
        }
    }

    if (config.ConfigVersion < 5)
    {
        // v4 → v5: "DifficultyMode" int-ről string-re változott
        // config.DifficultyMode = "Normal"; // Új alapértelmezés beállítása
    }

    MyLog.Info("Config", "Migrated config from v"
        + config.ConfigVersion.ToString() + " to v" + CURRENT_VERSION.ToString());
}
```

### Expansion migrációs példa

Az Expansion ismert az agresszív konfiguráció-fejlődésről. Néhány Expansion konfiguráció 17+ verzión ment keresztül. A mintájuk:
1. Minden verzióugrásnak dedikált migrációs függvénye van
2. A migrációk sorrendben futnak (1-ről 2-re, majd 2-ről 3-ra, majd 3-ról 4-re stb.)
3. Minden migráció csak az adott verziólépéshez szükséges dolgokat változtatja
4. A végső verziószám az összes migráció befejezése után íródik lemezre

Ez a DayZ modok konfiguráció-verziózásának arany standardja.

---

## Automatikus mentési időzítők

A futásidőben változó konfigurációkhoz (admin szerkesztések, játékosadatok felhalmozódása) valósíts meg automatikus mentési időzítőt az adatvesztés megelőzéséhez összeomlás esetén.

### Időzítő-alapú automatikus mentés

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5 perc
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // Változtak-e adatok az utolsó mentés óta?

    void MarkDirty()
    {
        m_Dirty = true;
    }

    void OnUpdate(float dt)
    {
        m_AutosaveTimer += dt;
        if (m_AutosaveTimer >= AUTOSAVE_INTERVAL)
        {
            m_AutosaveTimer = 0;

            if (m_Dirty)
            {
                Save();
                m_Dirty = false;
            }
        }
    }

    void OnMissionFinish()
    {
        // Mindig ments leálláskor, még ha az időzítő nem is járt le
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

### Dirty flag optimalizáció

Csak akkor írj lemezre, amikor az adatok ténylegesen változtak. A fájl I/O költséges. Ha semmi nem változott, hagyd ki a mentést:

```c
void UpdateSetting(string key, string value)
{
    if (m_Settings.Get(key) == value) return;  // Nincs változás, nincs mentés

    m_Settings.Set(key, value);
    MarkDirty();
}
```

### Mentés kritikus eseményekkor

Az időzített mentések mellett ments azonnal a kritikus műveletek után:

```c
void BanPlayer(string uid, string reason)
{
    m_BanList.Insert(uid);
    Save();  // Azonnali mentés — a tiltásoknak túl kell élniük az összeomlást
}
```

---

## Gyakori hibák

### 1. A JsonLoadFile kezelése, mintha értéket adna vissza

```c
// HIBÁS — nem fordul le
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config)) { ... }
```

A `JsonLoadFile` `void`-ot ad vissza. Hívd meg, majd ellenőrizd az objektum állapotát.

### 2. FileExist ellenőrzés hiánya betöltés előtt

```c
// HIBÁS — összeomlik vagy üres objektumot ad diagnosztika nélkül
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);

// HELYES — először ellenőrizd, hozd létre az alapértelmezéseket ha hiányzik
if (!FileExist("$profile:MyMod/Config.json"))
{
    SaveDefaults();
    return;
}
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);
```

### 3. Könyvtárak létrehozásának elfelejtése

A `JsonSaveFile` csendben kudarcot vall, ha a könyvtár nem létezik. Mindig biztosítsd a könyvtárakat mentés előtt.

### 4. Nem kívánt publikus mezők szerializálódnak

Minden `public` mező a konfigurációs osztályon bekerül a JSON-ba. Ha vannak csak futásidejű mezőid, tedd `protected` vagy `private` elérésűre:

```c
class MyConfig
{
    // Ezek a JSON-ba kerülnek:
    int MaxPlayers = 60;
    string ServerName = "My Server";

    // Ez NEM kerül a JSON-ba (protected):
    protected bool m_Loaded;
    protected float m_LastSaveTime;
};
```

### 5. Fordított perjel és idézőjel karakterek JSON értékekben

Az Enforce Script CParser-je problémás a `\\` és `\"` karakterekkel a szöveg literálokban. Kerüld a fordított perjeles fájl-útvonalak tárolását a konfigurációkban. Használj perjelet:

```c
// ROSSZ — a fordított perjelek eltörhetik az elemzést
string LogPath = "C:\\DayZ\\Logs\\server.log";

// JÓ — a perjelek mindenhol működnek
string LogPath = "$profile:MyMod/Logs/server.log";
```

---

## Bevált gyakorlatok

1. **Használd a `$profile:`-t minden fájl-útvonalhoz.** Soha ne égesd be az abszolút útvonalakat.

2. **Hozd létre a könyvtárakat fájlok írása előtt.** Ellenőrizd a `FileExist()`-tel, hozd létre a `MakeDirectory()`-vel, egyszerre egy szintet.

3. **Mindig adj meg alapértelmezett értékeket a konfigurációs osztályod konstruktorában vagy mező inicializálóiban.** Ez biztosítja, hogy az első futtatás konfigurációi ésszerűek legyenek.

4. **Verziózd a konfigurációidat az első naptól.** Egy `ConfigVersion` mező hozzáadása nem kerül semmibe és órákat takarít meg később a hibakeresésben.

5. **Válaszd szét a konfigurációs adatosztályokat a menedzser osztályoktól.** Az adatosztály egy egyszerű tároló; a menedzser kezeli a betöltés/mentés/szinkronizálás logikát.

6. **Használj automatikus mentést dirty flag-gel.** Ne írj lemezre minden egyes értékváltozáskor --- kötegelve ments időzítővel.

7. **Ments a küldetés befejezésekor.** Az automatikus mentési időzítő biztonsági háló, nem az elsődleges mentés. Mindig ments az `OnMissionFinish()` során.

8. **Definiáld az útvonal-konstansokat egy helyen.** Egy `MyModConst` osztály az összes útvonallal megelőzi a szöveg-duplikációt és megkönnyíti az útvonalváltoztatásokat.

9. **Naplózd a betöltési/mentési műveleteket.** Konfigurációs problémák hibakeresésekor egy naplósor, amely azt mondja "Loaded config v3 from $profile:MyMod/Config.json", felbecsülhetetlen értékű.

10. **Tesztelj törölt konfigurációs fájllal.** A mododnak kecsesen kell kezelnie az első futtatást: könyvtárak létrehozása, alapértelmezések írása, naplózás, mit csinált.

---

## Kompatibilitás és hatás

- **Multi-Mod:** Minden mod a saját `$profile:ModName/` könyvtárába ír. Ütközések csak akkor fordulnak elő, ha két mod ugyanazt a könyvtárnevet használja. Használj egyedi, felismerhető előtagot a mod mappájához.
- **Betöltési sorrend:** A konfiguráció betöltése az `OnInit`-ben vagy az `OnMissionStart`-ban történik, mindkettő a mod saját életciklusával vezérelt. Nincs mod-közi betöltési sorrend probléma, hacsak két mod nem próbálja ugyanazt a fájlt olvasni/írni (amit soha nem kellene tenniük).
- **Listen szerver:** A konfigurációs fájlok csak szerver oldaliak (a `$profile:` a szerveren oldódik fel). Listen szervereken a kliens oldali kód technikailag hozzáférhet a `$profile:`-hoz, de a konfigurációkat csak szerver moduloknak kellene betölteniük a kétértelműség elkerülése érdekében.
- **Teljesítmény:** A `JsonFileLoader` szinkron és blokkolja a fő szálat. Nagy konfigurációkhoz (100+ KB) az `OnInit` során töltsd be (a játékmenet megkezdése előtt). Az automatikus mentési időzítők megelőzik az ismételt írásokat; a dirty flag minta biztosítja, hogy a lemez I/O csak akkor történik, amikor az adatok ténylegesen változtak.
- **Migráció:** Új mezők hozzáadása egy konfigurációs osztályhoz biztonságos --- a `JsonFileLoader` figyelmen kívül hagyja a hiányzó JSON kulcsokat és meghagyja az osztály alapértelmezett értékét. Mezők eltávolítása vagy átnevezése verziózott migrációs lépést igényel a csendes adatvesztés elkerülése érdekében.

---

## Elmélet vs gyakorlat

| Az elmélet azt mondja | DayZ valóság |
|---------------|-------------|
| Használj aszinkron fájl I/O-t a blokkolás elkerüléséhez | Az Enforce Scriptben nincs aszinkron fájl I/O; minden olvasás/írás szinkron. Indításkor töltsd be, időzítőkkel ments. |
| Validáld a JSON-t sémával | Nem létezik JSON séma validáció; mezők validálása az `OnAfterLoad()`-ban vagy betöltés utáni őrfeltételekkel. |
| Használj adatbázist strukturált adatokhoz | Nincs adatbázis-hozzáférés az Enforce Scriptből; JSON fájlok a `$profile:`-ban az egyetlen perzisztencia mechanizmus. |

---

[Kezdőlap](../README.md) | [<< Előző: RPC minták](03-rpc-patterns.md) | **Konfiguráció perzisztencia** | [Következő: Jogosultsági rendszerek >>](05-permissions.md)
