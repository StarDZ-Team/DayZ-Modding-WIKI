# Chapitre 6.8 : E/S fichiers et JSON

[Accueil](../README.md) | [<< Precedent : Timers & CallQueue](07-timers.md) | **E/S fichiers & JSON** | [Suivant : Reseau & RPC >>](09-networking.md)

---

## Introduction

DayZ fournit des operations d'E/S fichiers pour la lecture et l'ecriture de fichiers texte, la serialisation/deserialisation JSON, la gestion de repertoires et l'enumeration de fichiers. Toutes les operations de fichiers utilisent des prefixes de chemin speciaux (`$profile:`, `$saves:`, `$mission:`) plutot que des chemins absolus du systeme de fichiers. Ce chapitre couvre chaque operation de fichier disponible en Enforce Script.

---

## Prefixes de chemin

| Prefixe | Emplacement | Inscriptible |
|---------|-------------|--------------|
| `$profile:` | Repertoire de profil serveur/client (par ex. `DayZServer/profiles/`) | Oui |
| `$saves:` | Repertoire de sauvegarde | Oui |
| `$mission:` | Dossier de mission actuel (par ex. `mpmissions/dayzOffline.chernarusplus/`) | Lecture generalement |
| `$CurrentDir:` | Repertoire de travail actuel | Depend |
| Sans prefixe | Relatif a la racine du jeu | Lecture seule |

> **Important :** La plupart des operations d'ecriture de fichiers sont limitees a `$profile:` et `$saves:`. Tenter d'ecrire ailleurs peut echouer silencieusement.

---

## Verification d'existence de fichier

```c
proto bool FileExist(string name);
```

Retourne `true` si le fichier existe au chemin donne.

**Exemple :**

```c
if (FileExist("$profile:MyMod/config.json"))
{
    Print("Fichier de configuration trouve");
}
else
{
    Print("Fichier de configuration introuvable, creation des valeurs par defaut");
}
```

---

## Ouverture et fermeture de fichiers

```c
proto FileHandle OpenFile(string name, FileMode mode);
proto void CloseFile(FileHandle file);
```

### Enumeration FileMode

```c
enum FileMode
{
    READ,     // Ouvrir en lecture (le fichier doit exister)
    WRITE,    // Ouvrir en ecriture (cree nouveau / ecrase l'existant)
    APPEND    // Ouvrir en ajout (cree si inexistant)
}
```

`FileHandle` est un identifiant entier. Une valeur de retour de `0` indique un echec.

**Exemple :**

```c
FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.WRITE);
if (fh != 0)
{
    // Fichier ouvert avec succes
    // ... faire le travail ...
    CloseFile(fh);
}
```

> **Critique :** Appelez toujours `CloseFile()` quand vous avez termine. Ne pas fermer les fichiers peut causer une perte de donnees et des fuites de ressources.

---

## Ecriture de fichiers

### FPrintln (ecrire une ligne)

```c
proto void FPrintln(FileHandle file, void var);
```

Ecrit la valeur suivie d'un caractere de nouvelle ligne.

### FPrint (ecrire sans nouvelle ligne)

```c
proto void FPrint(FileHandle file, void var);
```

Ecrit la valeur sans nouvelle ligne finale.

**Exemple -- ecrire un fichier de log :**

```c
void WriteLog(string message)
{
    FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.APPEND);
    if (fh != 0)
    {
        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);
        string timestamp = string.Format("[%1-%2-%3 %4:%5]", year, month, day, hour, minute);

        FPrintln(fh, timestamp + " " + message);
        CloseFile(fh);
    }
}
```

---

## Lecture de fichiers

### FGets (lire une ligne)

```c
proto int FGets(FileHandle file, string var);
```

Lit une ligne du fichier dans `var`. Retourne le nombre de caracteres lus, ou `-1` a la fin du fichier.

**Exemple -- lire un fichier ligne par ligne :**

```c
void ReadConfigFile()
{
    FileHandle fh = OpenFile("$profile:MyMod/settings.txt", FileMode.READ);
    if (fh != 0)
    {
        string line;
        while (FGets(fh, line) >= 0)
        {
            Print("Ligne : " + line);
            ProcessLine(line);
        }
        CloseFile(fh);
    }
}
```

### ReadFile (lecture binaire brute)

```c
proto int ReadFile(FileHandle file, void param_array, int length);
```

Lit des octets bruts dans un tampon. Utilise pour les donnees binaires.

---

## Operations sur les repertoires

### MakeDirectory

```c
proto native bool MakeDirectory(string name);
```

Cree un repertoire. Retourne `true` en cas de succes. Ne cree que le repertoire final -- les repertoires parents doivent deja exister.

**Exemple -- assurer la structure de repertoires :**

```c
void EnsureDirectories()
{
    MakeDirectory("$profile:MyMod");
    MakeDirectory("$profile:MyMod/data");
    MakeDirectory("$profile:MyMod/logs");
}
```

### DeleteFile

```c
proto native bool DeleteFile(string name);
```

Supprime un fichier. Fonctionne uniquement dans les repertoires `$profile:` et `$saves:`.

### CopyFile

```c
proto native bool CopyFile(string sourceName, string destName);
```

Copie un fichier de la source vers la destination.

**Exemple :**

```c
// Sauvegarde avant ecrasement
if (FileExist("$profile:MyMod/config.json"))
{
    CopyFile("$profile:MyMod/config.json", "$profile:MyMod/config.json.bak");
}
```

---

## Enumeration de fichiers (FindFile / FindNextFile)

Enumerer les fichiers correspondant a un patron dans un repertoire.

```c
proto FindFileHandle FindFile(string pattern, out string fileName,
                               out FileAttr fileAttributes, FindFileFlags flags);
proto bool FindNextFile(FindFileHandle handle, out string fileName,
                         out FileAttr fileAttributes);
proto native void CloseFindFile(FindFileHandle handle);
```

### Enumeration FileAttr

```c
enum FileAttr
{
    DIRECTORY,   // L'entree est un repertoire
    HIDDEN,      // L'entree est masquee
    READONLY,    // L'entree est en lecture seule
    INVALID      // Entree invalide
}
```

### Enumeration FindFileFlags

```c
enum FindFileFlags
{
    DIRECTORIES,  // Retourner uniquement les repertoires
    ARCHIVES,     // Retourner uniquement les fichiers
    ALL           // Retourner les deux
}
```

**Exemple -- enumerer tous les fichiers JSON dans un repertoire :**

```c
void ListJsonFiles()
{
    string fileName;
    FileAttr fileAttr;
    FindFileHandle handle = FindFile(
        "$profile:MyMod/missions/*.json", fileName, fileAttr, FindFileFlags.ALL
    );

    if (handle)
    {
        // Traiter le premier resultat
        if (!(fileAttr & FileAttr.DIRECTORY))
        {
            Print("Trouve : " + fileName);
        }

        // Traiter les resultats restants
        while (FindNextFile(handle, fileName, fileAttr))
        {
            if (!(fileAttr & FileAttr.DIRECTORY))
            {
                Print("Trouve : " + fileName);
            }
        }

        CloseFindFile(handle);
    }
}
```

> **Important :** `FindFile` retourne uniquement le nom de fichier, pas le chemin complet. Vous devez prependre le chemin du repertoire vous-meme lors du traitement des fichiers.

**Exemple -- compter les fichiers dans un repertoire :**

```c
int CountFiles(string pattern)
{
    int count = 0;
    string fileName;
    FileAttr fileAttr;
    FindFileHandle handle = FindFile(pattern, fileName, fileAttr, FindFileFlags.ARCHIVES);

    if (handle)
    {
        count++;
        while (FindNextFile(handle, fileName, fileAttr))
        {
            count++;
        }
        CloseFindFile(handle);
    }

    return count;
}
```

---

## JsonFileLoader (JSON generique)

**Fichier :** `3_Game/tools/jsonfileloader.c` (173 lignes)

La methode recommandee pour charger et sauvegarder des donnees JSON. Fonctionne avec toute classe ayant des champs publics.

### API moderne (recommandee)

```c
class JsonFileLoader<Class T>
{
    // Charger un fichier JSON dans un objet
    static bool LoadFile(string filename, out T data, out string errorMessage);

    // Sauvegarder un objet dans un fichier JSON
    static bool SaveFile(string filename, T data, out string errorMessage);

    // Analyser une chaine JSON dans un objet
    static bool LoadData(string string_data, out T data, out string errorMessage);

    // Serialiser un objet en chaine JSON
    static bool MakeData(T inputData, out string outputData,
                          out string errorMessage, bool prettyPrint = true);
}
```

Toutes les methodes retournent `bool` -- `true` en cas de succes, `false` en cas d'echec avec l'erreur dans `errorMessage`.

### API heritee (obsolete)

```c
class JsonFileLoader<Class T>
{
    static void JsonLoadFile(string filename, out T data);    // Retourne void !
    static void JsonSaveFile(string filename, T data);
    static void JsonLoadData(string string_data, out T data);
    static string JsonMakeData(T data);
}
```

> **Piege critique :** `JsonLoadFile()` retourne `void`. Vous NE POUVEZ PAS l'utiliser dans une condition `if` :
> ```c
> // FAUX - ne compilera pas ou sera toujours false
> if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg)) { }
>
> // CORRECT - utiliser le moderne LoadFile() qui retourne bool
> if (JsonFileLoader<MyConfig>.LoadFile(path, cfg, error)) { }
> ```

### Exigences de la classe de donnees

La classe cible doit avoir des **champs publics** avec des valeurs par defaut. Le serialiseur JSON fait correspondre les noms de champs directement aux cles JSON.

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 150.0;
    string ServerName = "Mon Serveur";
    bool EnablePVP = true;
    ref array<string> AllowedItems = new array<string>;
    ref map<string, int> ItemPrices = new map<string, int>;

    void MyConfig()
    {
        AllowedItems.Insert("BandageDressing");
        AllowedItems.Insert("Canteen");
    }
}
```

Ceci produit le JSON :

```json
{
    "MaxPlayers": 60,
    "SpawnRadius": 150.0,
    "ServerName": "Mon Serveur",
    "EnablePVP": true,
    "AllowedItems": ["BandageDressing", "Canteen"],
    "ItemPrices": {}
}
```

### Exemple complet de chargement/sauvegarde

```c
class MyModConfig
{
    int Version = 1;
    float RespawnTime = 300.0;
    ref array<string> SpawnItems = new array<string>;
}

class MyModConfigManager
{
    protected static const string CONFIG_PATH = "$profile:MyMod/config.json";
    protected ref MyModConfig m_Config;

    void Init()
    {
        MakeDirectory("$profile:MyMod");
        m_Config = new MyModConfig();
        Load();
    }

    void Load()
    {
        if (!FileExist(CONFIG_PATH))
        {
            Save();  // Creer la configuration par defaut
            return;
        }

        string error;
        if (!JsonFileLoader<MyModConfig>.LoadFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Erreur de chargement de config : " + error);
            m_Config = new MyModConfig();  // Reinitialiser aux valeurs par defaut
            Save();
        }
    }

    void Save()
    {
        string error;
        if (!JsonFileLoader<MyModConfig>.SaveFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Erreur de sauvegarde de config : " + error);
        }
    }

    MyModConfig GetConfig()
    {
        return m_Config;
    }
}
```

---

## JsonSerializer (utilisation directe)

**Fichier :** `3_Game/gameplay.c`

Pour les cas ou vous devez serialiser/deserialiser des chaines JSON directement sans operations de fichier :

```c
class JsonSerializer : Serializer
{
    proto bool WriteToString(void variable_out, bool nice, out string result);
    proto bool ReadFromString(void variable_in, string jsonString, out string error);
}
```

**Exemple :**

```c
MyConfig cfg = new MyConfig();
cfg.MaxPlayers = 100;

JsonSerializer js = new JsonSerializer();

// Serialiser en chaine
string jsonOutput;
js.WriteToString(cfg, true, jsonOutput);  // true = mise en forme
Print(jsonOutput);

// Deserialiser depuis une chaine
MyConfig parsed = new MyConfig();
string parseError;
js.ReadFromString(parsed, jsonOutput, parseError);
Print("MaxPlayers : " + parsed.MaxPlayers);
```

---

## Resume

| Operation | Fonction | Notes |
|-----------|----------|-------|
| Verifier l'existence | `FileExist(path)` | Retourne bool |
| Ouvrir | `OpenFile(path, FileMode)` | Retourne un handle (0 = echec) |
| Fermer | `CloseFile(handle)` | Toujours appeler quand termine |
| Ecrire une ligne | `FPrintln(handle, data)` | Avec nouvelle ligne |
| Ecrire | `FPrint(handle, data)` | Sans nouvelle ligne |
| Lire une ligne | `FGets(handle, out line)` | Retourne -1 a la fin du fichier |
| Creer un rep. | `MakeDirectory(path)` | Un seul niveau uniquement |
| Supprimer | `DeleteFile(path)` | Uniquement `$profile:` / `$saves:` |
| Copier | `CopyFile(src, dst)` | -- |
| Trouver des fichiers | `FindFile(pattern, ...)` | Retourne un handle, iterer avec `FindNextFile` |
| Charger JSON | `JsonFileLoader<T>.LoadFile(path, data, error)` | API moderne, retourne bool |
| Sauvegarder JSON | `JsonFileLoader<T>.SaveFile(path, data, error)` | API moderne, retourne bool |
| Chaine JSON | `JsonSerializer.WriteToString()` / `ReadFromString()` | Operations de chaine directes |

| Concept | Point cle |
|---------|-----------|
| Prefixes de chemin | `$profile:` (inscriptible), `$mission:` (lecture), `$saves:` (inscriptible) |
| JsonLoadFile | **Retourne void** -- utilisez `LoadFile()` (bool) a la place |
| Classes de donnees | Champs publics avec valeurs par defaut, `ref` pour les tableaux/maps |
| Toujours fermer | Chaque `OpenFile` doit avoir un `CloseFile` correspondant |
| FindFile | Retourne uniquement les noms de fichiers, pas les chemins complets |

---

## Bonnes pratiques

- **Entourez toujours les operations de fichier de verifications d'existence et fermez les handles dans tous les chemins de code.** Un `FileHandle` non ferme provoque des fuites de ressources et peut empecher l'ecriture du fichier sur le disque. Utilisez des patrons de garde : verifiez `fh != 0`, faites le travail, puis `CloseFile(fh)` avant chaque `return`.
- **Utilisez le moderne `JsonFileLoader<T>.LoadFile()` (retourne bool) au lieu du legacy `JsonLoadFile()` (retourne void).** L'API heritee ne peut pas signaler les erreurs, et tenter d'utiliser son retour void dans une condition echoue silencieusement.
- **Creez les repertoires avec `MakeDirectory()` dans l'ordre du parent a l'enfant.** `MakeDirectory` ne cree que le segment de repertoire final. `MakeDirectory("$profile:A/B/C")` echoue si `A/B` n'existe pas. Creez chaque niveau sequentiellement.
- **Utilisez `CopyFile()` pour creer des sauvegardes avant d'ecraser les fichiers de configuration.** Les erreurs d'analyse JSON des sauvegardes corrompues sont irrecuperables. Une copie `.bak` permet aux proprietaires de serveurs de restaurer le dernier etat valide.
- **N'oubliez pas que `FindFile()` retourne uniquement les noms de fichiers, pas les chemins complets.** Vous devez concatener le prefixe de repertoire vous-meme lors du chargement des fichiers trouves via `FindFile`/`FindNextFile`.

---

## Compatibilite et impact

> **Compatibilite des mods :** Les E/S fichiers sont inheremment isolees par mod quand chaque mod utilise son propre sous-repertoire `$profile:`. Les conflits surviennent uniquement lorsque deux mods lisent/ecrivent le meme chemin de fichier.

- **Ordre de chargement :** Les E/S fichiers n'ont aucune dependance d'ordre de chargement. Les mods lisent et ecrivent independamment.
- **Conflits de classes moddees :** Aucun conflit de classe. Le risque est que deux mods utilisent le meme nom de sous-repertoire ou de fichier `$profile:`, causant une corruption de donnees.
- **Impact sur les performances :** La serialisation JSON via `JsonFileLoader` est synchrone et bloque le thread principal. Charger de gros fichiers JSON (>100Ko) pendant le gameplay cause des saccades. Chargez les configs dans `OnInit()` ou `OnMissionStart()`, jamais dans `OnUpdate()`.
- **Serveur/Client :** Les ecritures de fichiers sont limitees a `$profile:` et `$saves:`. Sur les clients, `$profile:` pointe vers le repertoire de profil du client. Sur les serveurs dedies, il pointe vers le profil du serveur. `$mission:` est generalement en lecture seule des deux cotes.

---

## Observe dans les mods reels

> Ces patrons ont ete confirmes en etudiant le code source de mods DayZ professionnels.

| Patron | Mod | Fichier/Emplacement |
|--------|-----|---------------------|
| Chaine `MakeDirectory` + verification `FileExist` + `LoadFile` avec repli sur les valeurs par defaut | Expansion | Gestionnaire de parametres (`ExpansionSettings`) |
| Sauvegarde `CopyFile` avant la sauvegarde de config | COT | Gestion des fichiers de permissions |
| `FindFile`/`FindNextFile` pour enumerer les fichiers JSON par joueur dans `$profile:` | VPP Admin Tools | Chargeur de donnees joueur |
| `JsonSerializer.WriteToString()` pour la serialisation de payload RPC (sans fichier) | Dabs Framework | Synchronisation de config reseau |

---

[<< Precedent : Timers & CallQueue](07-timers.md) | **E/S fichiers & JSON** | [Suivant : Reseau & RPC >>](09-networking.md)
