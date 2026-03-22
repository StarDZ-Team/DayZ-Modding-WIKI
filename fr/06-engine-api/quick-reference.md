# Reference rapide de l'API du moteur

> Reference condensee sur une seule page pour les methodes les plus couramment utilisees du moteur DayZ. Pour des explications detaillees et des exemples, consultez les chapitres complets lies dans chaque en-tete de section.

---

## Sommaire

- [Methodes d'entite](#methodes-dentite)
- [Sante et degats](#sante-et-degats)
- [Verification de type](#verification-de-type)
- [Inventaire](#inventaire)
- [Creation et suppression d'entites](#creation-et-suppression-dentites)
- [Methodes du joueur](#methodes-du-joueur)
- [Methodes de vehicule](#methodes-de-vehicule)
- [Methodes meteo](#methodes-meteo)
- [Methodes d'E/S fichier](#methodes-des-fichier)
- [Methodes Timer et CallQueue](#methodes-timer-et-callqueue)
- [Methodes de creation de widgets](#methodes-de-creation-de-widgets)
- [Methodes RPC / Reseau](#methodes-rpc--reseau)
- [Constantes et methodes mathematiques](#constantes-et-methodes-mathematiques)
- [Methodes vectorielles](#methodes-vectorielles)
- [Fonctions globales](#fonctions-globales)
- [Mission Hooks](#mission-hooks)
- [Systeme d'actions](#systeme-dactions)

---

## Methodes d'entite

*Reference complete : [Chapitre 6.1 : Systeme d'entites](01-entity-system.md)*

### Position et orientation (Object)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetPosition` | `vector GetPosition()` | Position dans le monde |
| `SetPosition` | `void SetPosition(vector pos)` | Definir la position dans le monde |
| `GetOrientation` | `vector GetOrientation()` | Lacet, tangage, roulis en degres |
| `SetOrientation` | `void SetOrientation(vector ori)` | Definir lacet, tangage, roulis |
| `GetDirection` | `vector GetDirection()` | Vecteur de direction avant |
| `SetDirection` | `void SetDirection(vector dir)` | Definir la direction avant |
| `GetScale` | `float GetScale()` | Echelle actuelle |
| `SetScale` | `void SetScale(float scale)` | Definir l'echelle |

### Transform (IEntity)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetOrigin` | `vector GetOrigin()` | Position dans le monde (niveau moteur) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Definir la position dans le monde (niveau moteur) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Rotation en lacet/tangage/roulis |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Matrice de transformation 4x3 complete |
| `SetTransform` | `void SetTransform(vector mat[4])` | Definir la transformation complete |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Direction locale vers le monde |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Point local vers le monde |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Direction monde vers locale |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Point monde vers local |

### Hierarchie (IEntity)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Attacher un enfant a un os |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Detacher un enfant |
| `GetParent` | `IEntity GetParent()` | Entite parente ou null |
| `GetChildren` | `IEntity GetChildren()` | Premiere entite enfant |
| `GetSibling` | `IEntity GetSibling()` | Entite sœur suivante |

### Informations d'affichage (Object)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetType` | `string GetType()` | Nom de classe config (ex. `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Nom d'affichage localise |
| `IsKindOf` | `bool IsKindOf(string type)` | Verifier l'heritage de config |

### Positions des os (Object)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Position de l'os en espace local |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Position de l'os en espace modele |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Position de l'os en espace monde |

### Acces a la configuration (Object)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Lire un bool depuis la config |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Lire un int depuis la config |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Lire un float depuis la config |
| `ConfigGetString` | `string ConfigGetString(string entry)` | Lire une string depuis la config |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | Lire un tableau de strings |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Verifier si une entree config existe |

---

## Sante et degats

*Reference complete : [Chapitre 6.1 : Systeme d'entites](01-entity-system.md)*

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Obtenir la valeur de sante |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Obtenir la sante maximale |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Definir la sante |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Definir au maximum |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Ajouter de la sante |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Reduire la sante |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Activer/desactiver les degats |
| `GetAllowDamage` | `bool GetAllowDamage()` | Verifier si les degats sont autorises |
| `IsAlive` | `bool IsAlive()` | Verification en vie (utiliser sur EntityAI) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Appliquer des degats (EntityAI) |

**Paires zone/type courantes :** `("", "Health")` global, `("", "Blood")` sang du joueur, `("", "Shock")` choc du joueur, `("Engine", "Health")` moteur du vehicule.

---

## Verification de type

| Methode | Classe | Description |
|---------|--------|-------------|
| `IsMan()` | Object | Est-ce un joueur ? |
| `IsBuilding()` | Object | Est-ce un batiment ? |
| `IsTransport()` | Object | Est-ce un vehicule ? |
| `IsDayZCreature()` | Object | Est-ce une creature (zombie/animal) ? |
| `IsKindOf(string)` | Object | Verification d'heritage de config |
| `IsItemBase()` | EntityAI | Est-ce un objet d'inventaire ? |
| `IsWeapon()` | EntityAI | Est-ce une arme ? |
| `IsMagazine()` | EntityAI | Est-ce un chargeur ? |
| `IsClothing()` | EntityAI | Est-ce un vetement ? |
| `IsFood()` | EntityAI | Est-ce de la nourriture ? |
| `Class.CastTo(out, obj)` | Class | Downcast securise (retourne bool) |
| `ClassName.Cast(obj)` | Class | Cast inline (retourne null en cas d'echec) |

---

## Inventaire

*Reference complete : [Chapitre 6.1 : Systeme d'entites](01-entity-system.md)*

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetInventory` | `GameInventory GetInventory()` | Obtenir le composant inventaire (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Creer un objet dans le cargo |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Creer un objet dans le cargo |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Creer un objet en tant qu'accessoire |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Lister tous les objets |
| `CountInventory` | `int CountInventory()` | Compter les objets |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Verifier la presence d'un objet |
| `AttachmentCount` | `int AttachmentCount()` | Nombre d'accessoires |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Obtenir un accessoire par index |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Obtenir un accessoire par slot |

---

## Creation et suppression d'entites

*Reference complete : [Chapitre 6.1 : Systeme d'entites](01-entity-system.md)*

| Methode | Signature | Description |
|---------|-----------|-------------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Creer une entite |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Creer avec des flags ECE |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Suppression immediate cote serveur |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Suppression cote client uniquement |
| `Delete` | `void obj.Delete()` | Suppression differee (frame suivante) |

### Flags ECE courants

| Flag | Valeur | Description |
|------|--------|-------------|
| `ECE_NONE` | `0` | Aucun comportement special |
| `ECE_CREATEPHYSICS` | `1024` | Creer la collision |
| `ECE_INITAI` | `2048` | Initialiser l'IA |
| `ECE_EQUIP` | `24576` | Apparaitre avec accessoires + cargo |
| `ECE_PLACE_ON_SURFACE` | combine | Physique + chemin + trace |
| `ECE_LOCAL` | `1073741824` | Client uniquement (non replique) |
| `ECE_NOLIFETIME` | `4194304` | Ne disparaitra pas |
| `ECE_KEEPHEIGHT` | `524288` | Conserver la position Y |

---

## Methodes du joueur

*Reference complete : [Chapitre 6.1 : Systeme d'entites](01-entity-system.md)*

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Objet identite du joueur |
| `GetIdentity().GetName()` | `string GetName()` | Nom d'affichage Steam/plateforme |
| `GetIdentity().GetId()` | `string GetId()` | ID unique BI |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | ID Steam64 |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | ID de session du joueur |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Objet en main |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Vehicule conduit |
| `IsAlive` | `bool IsAlive()` | Verification en vie |
| `IsUnconscious` | `bool IsUnconscious()` | Verification inconscient |
| `IsRestrained` | `bool IsRestrained()` | Verification attache |
| `IsInVehicle` | `bool IsInVehicle()` | Verification dans un vehicule |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Faire apparaitre devant le joueur |

---

## Methodes de vehicule

*Reference complete : [Chapitre 6.2 : Systeme de vehicules](02-vehicles.md)*

### Equipage (Transport)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `CrewSize` | `int CrewSize()` | Nombre total de sieges |
| `CrewMember` | `Human CrewMember(int idx)` | Obtenir l'humain au siege |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Obtenir le siege de l'humain |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Ejecter de force du siege |
| `CrewDeath` | `void CrewDeath(int idx)` | Tuer le membre d'equipage |

### Moteur (Car)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `EngineIsOn` | `bool EngineIsOn()` | Le moteur tourne ? |
| `EngineStart` | `void EngineStart()` | Demarrer le moteur |
| `EngineStop` | `void EngineStop()` | Arreter le moteur |
| `EngineGetRPM` | `float EngineGetRPM()` | RPM actuel |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | RPM zone rouge |
| `GetGear` | `int GetGear()` | Vitesse actuelle |
| `GetSpeedometer` | `float GetSpeedometer()` | Vitesse en km/h |

### Fluides (Car)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Capacite maximale |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Niveau de remplissage 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Ajouter du fluide |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Retirer du fluide |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Vider tout le fluide |

**Enum CarFluid :** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Commandes (Car)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = toutes |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Entree de direction |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 accelerateur |

---

## Methodes meteo

*Reference complete : [Chapitre 6.3 : Systeme meteo](03-weather.md)*

### Acces

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Obtenir le singleton meteo |

### Phenomenes (Weather)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Couverture nuageuse |
| `GetRain` | `WeatherPhenomenon GetRain()` | Pluie |
| `GetFog` | `WeatherPhenomenon GetFog()` | Brouillard |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Neige |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Vitesse du vent |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Direction du vent |
| `GetWind` | `vector GetWind()` | Vecteur de direction du vent |
| `GetWindSpeed` | `float GetWindSpeed()` | Vitesse du vent en m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Configuration de la foudre |

### WeatherPhenomenon

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetActual` | `float GetActual()` | Valeur interpolee actuelle |
| `GetForecast` | `float GetForecast()` | Valeur cible |
| `GetDuration` | `float GetDuration()` | Duree restante (secondes) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Definir la cible (serveur uniquement) |
| `SetLimits` | `void SetLimits(float min, float max)` | Limites de plage de valeurs |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Limites de vitesse de changement |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Limites d'amplitude de changement |

---

## Methodes d'E/S fichier

*Reference complete : [Chapitre 6.8 : E/S fichier et JSON](08-file-io.md)*

### Prefixes de chemin

| Prefixe | Emplacement | Ecriture |
|---------|-------------|----------|
| `$profile:` | Repertoire de profil serveur/client | Oui |
| `$saves:` | Repertoire de sauvegarde | Oui |
| `$mission:` | Dossier de la mission en cours | Lecture generalement |
| `$CurrentDir:` | Repertoire de travail | Variable |

### Operations sur les fichiers

| Methode | Signature | Description |
|---------|-----------|-------------|
| `FileExist` | `bool FileExist(string path)` | Verifier si le fichier existe |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Creer un repertoire |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Ouvrir un fichier (0 = echec) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Fermer un fichier |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Ecrire du texte (sans saut de ligne) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Ecrire du texte + saut de ligne |
| `FGets` | `int FGets(FileHandle fh, string line)` | Lire une ligne |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Lire le fichier entier |
| `DeleteFile` | `bool DeleteFile(string path)` | Supprimer un fichier |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Copier un fichier |

### JSON (JsonFileLoader)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | Charger du JSON dans un objet (**retourne void**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Sauvegarder un objet en JSON |

### Enum FileMode

| Valeur | Description |
|--------|-------------|
| `FileMode.READ` | Ouvrir en lecture |
| `FileMode.WRITE` | Ouvrir en ecriture (cree/ecrase) |
| `FileMode.APPEND` | Ouvrir en ajout |

---

## Methodes Timer et CallQueue

*Reference complete : [Chapitre 6.7 : Timers et CallQueue](07-timers.md)*

### Acces

| Expression | Retour | Description |
|------------|--------|-------------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | File d'appels gameplay |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | File d'appels systeme |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | File d'appels GUI |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | File de mise a jour par frame |

### ScriptCallQueue

| Methode | Signature | Description |
|---------|-----------|-------------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Planifier un appel differe/repetitif |
| `Call` | `void Call(func fn, param1..4)` | Executer a la frame suivante |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Appeler une methode par nom de string |
| `Remove` | `void Remove(func fn)` | Annuler un appel planifie |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Annuler par nom de string |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Obtenir le temps restant d'un CallLater |

### Classe Timer

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Constructeur |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Demarrer le timer |
| `Stop` | `void Stop()` | Arreter le timer |
| `Pause` | `void Pause()` | Mettre en pause le timer |
| `Continue` | `void Continue()` | Reprendre le timer |
| `IsPaused` | `bool IsPaused()` | Timer en pause ? |
| `IsRunning` | `bool IsRunning()` | Timer actif ? |
| `GetRemaining` | `float GetRemaining()` | Secondes restantes |

### ScriptInvoker

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Insert` | `void Insert(func fn)` | Enregistrer un callback |
| `Remove` | `void Remove(func fn)` | Desenregistrer un callback |
| `Invoke` | `void Invoke(params...)` | Declencher tous les callbacks |
| `Count` | `int Count()` | Nombre de callbacks enregistres |
| `Clear` | `void Clear()` | Supprimer tous les callbacks |

---

## Methodes de creation de widgets

*Reference complete : [Chapitre 3.5 : Creation programmatique](../03-gui-system/05-programmatic-widgets.md)*

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Obtenir l'espace de travail UI |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | Charger un fichier .layout |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Trouver un enfant par nom (recursif) |
| `Show` | `void Show(bool show)` | Afficher/masquer un widget |
| `SetText` | `void TextWidget.SetText(string text)` | Definir le contenu texte |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Definir l'index de l'image |
| `SetColor` | `void SetColor(int color)` | Definir la couleur du widget (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Definir la transparence 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Definir la taille du widget |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Definir la position du widget |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Resolution de l'ecran |
| `Destroy` | `void Widget.Destroy()` | Supprimer et detruire le widget |

### Aide couleur ARGB

| Fonction | Signature | Description |
|----------|-----------|-------------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Creer un entier couleur (0-255 chacun) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Creer un entier couleur (0.0-1.0 chacun) |

---

## Methodes RPC / Reseau

*Reference complete : [Chapitre 6.9 : Reseau et RPC](09-networking.md)*

### Verifications d'environnement

| Methode | Signature | Description |
|---------|-----------|-------------|
| `GetGame().IsServer()` | `bool IsServer()` | Vrai sur le serveur / hote listen-server |
| `GetGame().IsClient()` | `bool IsClient()` | Vrai sur le client |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Vrai en multijoueur |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | Vrai uniquement sur serveur dedie |

### ScriptRPC

| Methode | Signature | Description |
|---------|-----------|-------------|
| `ScriptRPC()` | `void ScriptRPC()` | Constructeur |
| `Write` | `bool Write(void value)` | Serialiser une valeur (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | Envoyer un RPC |
| `Reset` | `void Reset()` | Effacer les donnees ecrites |

### Reception (Override sur Object)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | Gestionnaire de reception RPC |

### ParamsReadContext

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Read` | `bool Read(out void value)` | Deserialiser une valeur (memes types que Write) |

### RPC classique (CGame)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Envoyer un seul objet Param |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Envoyer plusieurs Params |

### ScriptInputUserData (Verifie par le moteur)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Verifier si la file a de l'espace |
| `Write` | `bool Write(void value)` | Serialiser une valeur |
| `Send` | `void Send()` | Envoyer au serveur (client uniquement) |

---

## Constantes et methodes mathematiques

*Reference complete : [Chapitre 1.7 : Mathematiques et vecteurs](../01-enforce-script/07-math-vectors.md)*

### Constantes

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `Math.PI` | `3.14159...` | Pi |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Multiplicateur degres vers radians |
| `Math.RAD2DEG` | `57.2957...` | Multiplicateur radians vers degres |
| `int.MAX` | `2147483647` | Entier maximum |
| `int.MIN` | `-2147483648` | Entier minimum |
| `float.MAX` | `3.4028e+38` | Float maximum |
| `float.MIN` | `1.175e-38` | Float positif minimum |

### Aleatoire

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Entier aleatoire [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Entier aleatoire [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Float aleatoire [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | Vrai/faux aleatoire |

### Arrondis

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Math.Round` | `float Round(float f)` | Arrondir au plus proche |
| `Math.Floor` | `float Floor(float f)` | Arrondir vers le bas |
| `Math.Ceil` | `float Ceil(float f)` | Arrondir vers le haut |

### Limitation et interpolation

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Limiter a une plage |
| `Math.Min` | `float Min(float a, float b)` | Minimum de deux valeurs |
| `Math.Max` | `float Max(float a, float b)` | Maximum de deux valeurs |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Interpolation lineaire |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Interpolation lineaire inverse |

### Valeur absolue et puissance

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Valeur absolue (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Valeur absolue (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Puissance |
| `Math.Sqrt` | `float Sqrt(float f)` | Racine carree |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Carre (f * f) |

### Trigonometrie (radians)

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Math.Sin` | `float Sin(float rad)` | Sinus |
| `Math.Cos` | `float Cos(float rad)` | Cosinus |
| `Math.Tan` | `float Tan(float rad)` | Tangente |
| `Math.Asin` | `float Asin(float val)` | Arc sinus |
| `Math.Acos` | `float Acos(float val)` | Arc cosinus |
| `Math.Atan2` | `float Atan2(float y, float x)` | Angle depuis les composantes |

### Amortissement progressif

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Amortissement progressif vers la cible (similaire au SmoothDamp de Unity) |

```c
// Utilisation de l'amortissement progressif
// val : valeur actuelle, target : valeur cible, velocity : ref velocite (persistee entre les appels)
// smoothTime : temps de lissage, maxSpeed : vitesse max, dt : delta time
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Angle

| Methode | Signature | Description |
|---------|-----------|-------------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Normaliser a 0-360 |

---

## Methodes vectorielles

| Methode | Signature | Description |
|---------|-----------|-------------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Distance entre deux points |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Distance au carre (plus rapide) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Vecteur de direction |
| `vector.Dot` | `float Dot(vector a, vector b)` | Produit scalaire |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Interpoler les positions |
| `v.Length()` | `float Length()` | Norme du vecteur |
| `v.LengthSq()` | `float LengthSq()` | Norme au carre (plus rapide) |
| `v.Normalized()` | `vector Normalized()` | Vecteur unitaire |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Direction vers lacet/tangage |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Lacet/tangage vers direction |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Multiplication matricielle |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Multiplication matricielle inverse |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Creer un vecteur |

---

## Fonctions globales

| Fonction | Signature | Description |
|----------|-----------|-------------|
| `GetGame()` | `CGame GetGame()` | Instance du jeu |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Joueur local (CLIENT uniquement) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Tous les joueurs (serveur) |
| `GetGame().GetWorld()` | `World GetWorld()` | Instance du monde |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Temps serveur (secondes) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Espace de travail UI |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Hauteur du terrain a la position |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Type de surface |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Trouver les objets pres d'une position |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Obtenir la resolution de l'ecran |
| `GetGame().IsServer()` | `bool IsServer()` | Verification serveur |
| `GetGame().IsClient()` | `bool IsClient()` | Verification client |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Verification multijoueur |
| `Print(string)` | `void Print(string msg)` | Ecrire dans le log de script |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Enregistrer une erreur avec severite |
| `DumpStackString()` | `string DumpStackString()` | Obtenir la pile d'appels en string |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | Formater une string (`%1`..`%9`) |

---

## Mission Hooks

*Reference complete : [Chapitre 6.11 : Mission Hooks](11-mission-hooks.md)*

### Cote serveur (modded MissionServer)

| Methode | Description |
|---------|-------------|
| `override void OnInit()` | Initialiser les managers, enregistrer les RPCs |
| `override void OnMissionStart()` | Apres le chargement de tous les mods |
| `override void OnUpdate(float timeslice)` | Par frame (utiliser un accumulateur !) |
| `override void OnMissionFinish()` | Nettoyer les singletons, se desabonner des evenements |
| `override void OnEvent(EventType eventTypeId, Param params)` | Evenements de chat, voix |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Joueur connecte |
| `override void InvokeOnDisconnect(PlayerBase player)` | Joueur deconnecte |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Client pret pour les donnees |
| `override void PlayerRegistered(int peerId)` | Identite enregistree |

### Cote client (modded MissionGameplay)

| Methode | Description |
|---------|-------------|
| `override void OnInit()` | Initialiser les managers client, creer le HUD |
| `override void OnUpdate(float timeslice)` | Mise a jour client par frame |
| `override void OnMissionFinish()` | Nettoyage |
| `override void OnKeyPress(int key)` | Touche appuyee |
| `override void OnKeyRelease(int key)` | Touche relachee |

---

## Systeme d'actions

*Reference complete : [Chapitre 6.12 : Systeme d'actions](12-action-system.md)*

### Enregistrer des actions sur un objet

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Ajouter une action personnalisee
    RemoveAction(ActionEat);       // Supprimer une action vanilla
}
```

### Methodes cles de ActionBase

| Methode | Description |
|---------|-------------|
| `override void CreateConditionComponents()` | Definir les conditions de distance CCINone/CCTNone |
| `override bool ActionCondition(...)` | Logique de validation personnalisee |
| `override void OnExecuteServer(ActionData action_data)` | Execution cote serveur |
| `override void OnExecuteClient(ActionData action_data)` | Effets cote client |
| `override string GetText()` | Nom d'affichage (supporte les cles `#STR_`) |

---

*Documentation complete : [Accueil](../../README.md) | [Aide-memoire](../cheatsheet.md) | [Systeme d'entites](01-entity-system.md) | [Vehicules](02-vehicles.md) | [Meteo](03-weather.md) | [Timers](07-timers.md) | [E/S fichier](08-file-io.md) | [Reseau](09-networking.md) | [Mission Hooks](11-mission-hooks.md) | [Systeme d'actions](12-action-system.md)*
