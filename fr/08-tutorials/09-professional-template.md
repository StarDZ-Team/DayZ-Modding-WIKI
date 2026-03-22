# Chapitre 8.9 : Modèle de mod professionnel

[Accueil](../../README.md) | [<< Précédent : Construire une surcouche HUD](08-hud-overlay.md) | **Modèle de mod professionnel** | [Suivant : Créer un véhicule personnalisé >>](10-vehicle-mod.md)

---

> **Résumé :** Ce chapitre fournit un modèle de mod complet et prêt pour la production avec tous les fichiers nécessaires pour un mod DayZ professionnel. Contrairement au [Chapitre 8.5](05-mod-template.md) qui présente le squelette de démarrage d'InclementDab, ceci est un modèle complet avec un système de configuration, un gestionnaire singleton, un RPC client-serveur, un panneau d'interface, des raccourcis clavier, de la localisation et de l'automatisation de build. Chaque fichier est prêt à copier-coller et largement commenté pour expliquer **pourquoi** chaque ligne existe.

---

## Table des matières

- [Aperçu](#aperçu)
- [Structure complète du répertoire](#structure-complète-du-répertoire)
- [mod.cpp](#modcpp)
- [config.cpp](#configcpp)
- [Fichier de constantes (3_Game)](#fichier-de-constantes-3_game)
- [Classe de données de configuration (3_Game)](#classe-de-données-de-configuration-3_game)
- [Définitions RPC (3_Game)](#définitions-rpc-3_game)
- [Singleton gestionnaire (4_World)](#singleton-gestionnaire-4_world)
- [Gestionnaire d'événements joueur (4_World)](#gestionnaire-dévénements-joueur-4_world)
- [Hook de mission : Serveur (5_Mission)](#hook-de-mission--serveur-5_mission)
- [Hook de mission : Client (5_Mission)](#hook-de-mission--client-5_mission)
- [Script du panneau d'interface (5_Mission)](#script-du-panneau-dinterface-5_mission)
- [Fichier de disposition](#fichier-de-disposition)
- [stringtable.csv](#stringtablecsv)
- [Inputs.xml](#inputsxml)
- [Script de build](#script-de-build)
- [Guide de personnalisation](#guide-de-personnalisation)
- [Guide d'expansion des fonctionnalités](#guide-dexpansion-des-fonctionnalités)
- [Prochaines étapes](#prochaines-étapes)

---

## Aperçu

Un mod "Hello World" prouve que la chaîne d'outils fonctionne. Un mod professionnel nécessite bien plus :

| Préoccupation | Hello World | Modèle professionnel |
|---------------|-------------|---------------------|
| Configuration | Valeurs codées en dur | Configuration JSON avec chargement/sauvegarde/valeurs par défaut |
| Communication | Instructions Print | RPC routé par chaîne (client vers serveur et retour) |
| Architecture | Un fichier, une fonction | Gestionnaire singleton, scripts en couches, cycle de vie propre |
| Interface utilisateur | Aucune | Panneau UI piloté par disposition avec ouverture/fermeture |
| Raccourcis clavier | Aucun | Raccourci personnalisé dans Options > Contrôles |
| Localisation | Aucune | stringtable.csv avec 13 langues |
| Pipeline de build | Addon Builder manuel | Script batch en un clic |
| Nettoyage | Aucun | Arrêt propre en fin de mission, pas de fuites |

Ce modèle vous donne tout cela directement. Vous renommez les identifiants, supprimez les systèmes dont vous n'avez pas besoin, et commencez à construire votre fonctionnalité sur une base solide.

---

## Structure complète du répertoire

Ceci est la disposition source complète. Chaque fichier listé ci-dessous est fourni comme modèle complet dans ce chapitre.

```
MyProfessionalMod/                          <-- Racine source (sur le lecteur P:)
    mod.cpp                                 <-- Métadonnées du launcher
    Scripts/
        config.cpp                          <-- Enregistrement moteur (CfgPatches + CfgMods)
        Inputs.xml                          <-- Définitions de raccourcis clavier
        stringtable.csv                     <-- Chaînes localisées (13 langues)
        3_Game/
            MyMod/
                MyModConstants.c            <-- Enums, chaîne de version, constantes partagées
                MyModConfig.c               <-- Configuration sérialisable JSON avec valeurs par défaut
                MyModRPC.c                  <-- Noms de routes RPC et enregistrement
        4_World/
            MyMod/
                MyModManager.c              <-- Gestionnaire singleton (cycle de vie, config, état)
                MyModPlayerHandler.c        <-- Hooks de connexion/déconnexion de joueur
        5_Mission/
            MyMod/
                MyModMissionServer.c        <-- MissionServer moddé (init/arrêt serveur)
                MyModMissionClient.c        <-- MissionGameplay moddé (init/arrêt client)
                MyModUI.c                   <-- Script du panneau UI (ouvrir/fermer/remplir)
        GUI/
            layouts/
                MyModPanel.layout           <-- Définition de disposition UI
    build.bat                               <-- Automatisation de l'empaquetage PBO

Après la compilation, le dossier de mod distribuable ressemble à ceci :

@MyProfessionalMod/                         <-- Ce qui va sur le serveur / Workshop
    mod.cpp
    addons/
        MyProfessionalMod_Scripts.pbo       <-- Empaqueté depuis Scripts/
    keys/
        MyMod.bikey                         <-- Clé pour les serveurs signés
    meta.cpp                                <-- Métadonnées Workshop (auto-générées)
```

---

## mod.cpp

Ce fichier contrôle ce que les joueurs voient dans le launcher DayZ. Il est placé à la racine du mod, **pas** dans `Scripts/`.

```cpp
// ==========================================================================
// mod.cpp - Identité du mod pour le launcher DayZ
// Ce fichier est lu par le launcher pour afficher les infos du mod.
// Il n'est PAS compilé par le moteur de script -- c'est de la pure métadonnée.
// ==========================================================================

// Nom d'affichage montré dans la liste des mods du launcher et l'écran de mods en jeu.
name         = "My Professional Mod";

// Votre nom ou nom d'équipe. Affiché dans la colonne "Auteur".
author       = "YourName";

// Chaîne de version sémantique. Mettez à jour à chaque release.
// Le launcher l'affiche pour que les joueurs sachent quelle version ils ont.
version      = "1.0.0";

// Description courte affichée au survol du mod dans le launcher.
// Gardez moins de 200 caractères pour la lisibilité.
overview     = "A professional mod template with config, RPC, UI, and keybinds.";

// Info-bulle affichée au survol. Correspond généralement au nom du mod.
tooltipOwned = "My Professional Mod";

// Optionnel : chemin vers une image de prévisualisation (relatif à la racine du mod).
// Taille recommandée : 256x256 ou 512x512, format PAA ou EDDS.
// Laissez vide si vous n'avez pas encore d'image.
picture      = "";

// Optionnel : logo affiché dans le panneau de détails du mod.
logo         = "";
logoSmall    = "";
logoOver     = "";

// Optionnel : URL ouverte quand le joueur clique sur "Site web" dans le launcher.
action       = "";
actionURL    = "";
```

---

## config.cpp

C'est le fichier le plus critique. Il enregistre votre mod auprès du moteur, déclare les dépendances, connecte les couches de script, et définit optionnellement des symboles préprocesseur et des imagesets.

Placez-le dans `Scripts/config.cpp`.

```cpp
// ==========================================================================
// config.cpp - Enregistrement auprès du moteur
// Le moteur DayZ lit ceci pour savoir ce que votre mod fournit.
// Deux sections comptent : CfgPatches (graphe de dépendances) et CfgMods (chargement de scripts).
// ==========================================================================

// --------------------------------------------------------------------------
// CfgPatches - Déclaration de dépendances
// Le moteur utilise ceci pour déterminer l'ordre de chargement. Si votre mod dépend
// d'un autre mod, listez la classe CfgPatches de ce mod dans requiredAddons[].
// --------------------------------------------------------------------------
class CfgPatches
{
    // Le nom de classe DOIT être globalement unique parmi tous les mods.
    // Convention : NomDuMod_Scripts (correspond au nom du PBO).
    class MyMod_Scripts
    {
        // units[] et weapons[] déclarent les classes de config définies par cet addon.
        // Pour les mods purement script, laissez vides. Ils sont utilisés par les mods
        // qui définissent de nouveaux objets, armes ou véhicules dans config.cpp.
        units[] = {};
        weapons[] = {};

        // Version minimum du moteur. 0.1 fonctionne pour toutes les versions actuelles de DayZ.
        requiredVersion = 0.1;

        // Dépendances : listez les noms de classes CfgPatches des autres mods.
        // "DZ_Data" est le jeu de base -- chaque mod devrait en dépendre.
        // Ajoutez "CF_Scripts" si vous utilisez Community Framework.
        // Ajoutez d'autres patches de mods si vous les étendez.
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

// --------------------------------------------------------------------------
// CfgMods - Enregistrement des modules de script
// Indique au moteur où se trouve chaque couche de script et quels defines définir.
// --------------------------------------------------------------------------
class CfgMods
{
    // Le nom de classe ici est l'identifiant interne de votre mod.
    // Il n'a PAS besoin de correspondre à CfgPatches -- mais les garder liés
    // rend le code plus facile à naviguer.
    class MyMod
    {
        // dir : le nom du dossier sur le lecteur P: (ou dans le PBO).
        // Doit correspondre exactement au nom réel de votre dossier racine.
        dir = "MyProfessionalMod";

        // Nom d'affichage (montré dans Workbench et certains journaux du moteur).
        name = "My Professional Mod";

        // Auteur et description pour les métadonnées du moteur.
        author = "YourName";
        overview = "Professional mod template";

        // Type de mod. Toujours "mod" pour les mods de script.
        type = "mod";

        // credits : chemin optionnel vers un fichier Credits.json.
        // creditsJson = "MyProfessionalMod/Scripts/Credits.json";

        // inputs : chemin vers votre Inputs.xml pour les raccourcis personnalisés.
        // Ceci DOIT être défini ici pour que le moteur charge vos raccourcis.
        inputs = "MyProfessionalMod/Scripts/Inputs.xml";

        // defines : symboles préprocesseur définis quand votre mod est chargé.
        // D'autres mods peuvent utiliser #ifdef MYMOD pour détecter la présence de votre mod
        // et compiler conditionnellement du code d'intégration.
        defines[] = { "MYMOD" };

        // dependencies : quels modules de script vanilla votre mod intercepte.
        // "Game" = 3_Game, "World" = 4_World, "Mission" = 5_Mission.
        // La plupart des mods ont besoin des trois. Ajoutez "Core" seulement si vous utilisez 1_Core.
        dependencies[] =
        {
            "Game", "World", "Mission"
        };

        // defs : associe chaque module de script à son dossier sur disque.
        // Le moteur compile tous les fichiers .c trouvés récursivement dans ces chemins.
        // Il n'y a pas de #include en Enforce Script -- c'est ainsi que les fichiers sont chargés.
        class defs
        {
            // imageSets : enregistre les fichiers .imageset pour utilisation dans les dispositions.
            // Nécessaire seulement si vous avez des icônes/textures personnalisées pour l'UI.
            // Décommentez et mettez à jour les chemins si vous ajoutez un imageset.
            //
            // class imageSets
            // {
            //     files[] =
            //     {
            //         "MyProfessionalMod/GUI/imagesets/mymod_icons.imageset"
            //     };
            // };

            // Couche Game (3_Game) : chargée en premier.
            // Placez les enums, constantes, classes de config, définitions RPC ici.
            // NE PEUT PAS référencer les types de 4_World ou 5_Mission.
            class gameScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/3_Game" };
            };

            // Couche World (4_World) : chargée en deuxième.
            // Placez les gestionnaires, modifications d'entités, interactions monde ici.
            // PEUT référencer les types de 3_Game. NE PEUT PAS référencer les types de 5_Mission.
            class worldScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/4_World" };
            };

            // Couche Mission (5_Mission) : chargée en dernier.
            // Placez les hooks de mission, panneaux UI, logique de démarrage/arrêt ici.
            // PEUT référencer les types de toutes les couches inférieures.
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

## Fichier de constantes (3_Game)

Placez dans `Scripts/3_Game/MyMod/MyModConstants.c`.

Ce fichier définit toutes les constantes partagées, enums et la chaîne de version. Il réside dans `3_Game` pour que chaque couche supérieure puisse accéder à ces valeurs.

```c
// ==========================================================================
// MyModConstants.c - Constantes et enums partagés
// Couche 3_Game : disponible pour toutes les couches supérieures (4_World, 5_Mission).
//
// POURQUOI ce fichier existe :
//   Centraliser les constantes évite les nombres magiques dispersés dans les fichiers.
//   Les enums donnent une sécurité à la compilation au lieu de comparaisons d'entiers bruts.
//   La chaîne de version est définie une fois et utilisée dans les journaux et l'UI.
// ==========================================================================

// ---------------------------------------------------------------------------
// Version - mettez à jour à chaque release
// ---------------------------------------------------------------------------
const string MYMOD_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Tag de journal - préfixe pour tous les messages Print/log de ce mod
// Utiliser un tag cohérent facilite le filtrage du journal de script.
// ---------------------------------------------------------------------------
const string MYMOD_TAG = "[MyMod]";

// ---------------------------------------------------------------------------
// Chemins de fichiers - centralisés pour que les fautes de frappe soient détectées en un seul endroit
// $profile: se résout vers le répertoire de profil du serveur à l'exécution.
// ---------------------------------------------------------------------------
const string MYMOD_CONFIG_DIR  = "$profile:MyMod";
const string MYMOD_CONFIG_PATH = "$profile:MyMod/config.json";

// ---------------------------------------------------------------------------
// Enum : Modes de fonctionnalité
// Utilisez des enums au lieu d'entiers bruts pour la lisibilité et les vérifications à la compilation.
// ---------------------------------------------------------------------------
enum MyModMode
{
    DISABLED = 0,    // Fonctionnalité désactivée
    PASSIVE  = 1,    // Fonctionnalité active mais n'interfère pas
    ACTIVE   = 2     // Fonctionnalité entièrement activée
};

// ---------------------------------------------------------------------------
// Enum : Types de notification (utilisés par l'UI pour choisir l'icône/couleur)
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

## Classe de données de configuration (3_Game)

Placez dans `Scripts/3_Game/MyMod/MyModConfig.c`.

C'est une classe de paramètres sérialisable en JSON. Le serveur la charge au démarrage. Si aucun fichier n'existe, les valeurs par défaut sont utilisées et une configuration fraîche est sauvegardée sur disque.

```c
// ==========================================================================
// MyModConfig.c - Configuration JSON avec valeurs par défaut
// Couche 3_Game pour que les gestionnaires 4_World et les hooks 5_Mission puissent la lire.
//
// COMMENT ÇA FONCTIONNE :
//   JsonFileLoader<MyModConfig> utilise le sérialiseur JSON intégré d'Enforce Script.
//   Chaque champ avec une valeur par défaut est écrit/lu depuis le fichier JSON.
//   Ajouter un nouveau champ est sûr -- les anciens fichiers de config obtiennent
//   simplement la valeur par défaut pour les champs manquants.
//
// PIÈGE ENFORCE SCRIPT :
//   JsonFileLoader<T>.JsonLoadFile(path, obj) renvoie VOID.
//   Vous NE POUVEZ PAS faire : if (JsonFileLoader<T>.JsonLoadFile(...)) -- ça ne compile pas.
//   Passez toujours un objet pré-créé par référence.
// ==========================================================================

class MyModConfig
{
    // --- Paramètres généraux ---

    // Interrupteur principal : si false, tout le mod est désactivé.
    bool Enabled = true;

    // Fréquence (en secondes) du tick de mise à jour du gestionnaire.
    // Des valeurs plus basses = plus réactif mais coût CPU plus élevé.
    float UpdateInterval = 5.0;

    // Nombre maximum d'objets/entités que ce mod gère simultanément.
    int MaxItems = 100;

    // Mode : 0 = DISABLED, 1 = PASSIVE, 2 = ACTIVE (voir enum MyModMode).
    int Mode = 2;

    // --- Messages ---

    // Message de bienvenue affiché aux joueurs quand ils se connectent.
    // Chaîne vide = pas de message.
    string WelcomeMessage = "Welcome to the server!";

    // Afficher le message de bienvenue comme notification ou message de chat.
    bool WelcomeAsNotification = true;

    // --- Journalisation ---

    // Activer la journalisation de débogage verbeuse. Désactiver pour les serveurs de production.
    bool DebugLogging = false;

    // -----------------------------------------------------------------------
    // Load - lit la config depuis le disque, renvoie une instance avec les défauts si manquante
    // -----------------------------------------------------------------------
    static MyModConfig Load()
    {
        // Toujours créer une instance fraîche d'abord. Cela garantit que toutes les valeurs
        // par défaut sont définies même si le fichier JSON manque des champs (par exemple après
        // une mise à jour qui a ajouté de nouveaux paramètres).
        MyModConfig cfg = new MyModConfig();

        // Vérifier si le fichier de config existe avant d'essayer de charger.
        // Au premier lancement, il n'existera pas -- nous utilisons les défauts et sauvegardons.
        if (FileExist(MYMOD_CONFIG_PATH))
        {
            // JsonLoadFile remplit l'objet existant. Il ne renvoie PAS
            // un nouvel objet. Les champs présents dans le JSON écrasent les défauts ;
            // les champs manquants du JSON gardent leurs valeurs par défaut.
            JsonFileLoader<MyModConfig>.JsonLoadFile(MYMOD_CONFIG_PATH, cfg);
        }
        else
        {
            // Premier lancement : sauvegarder les défauts pour que l'admin ait un fichier à éditer.
            cfg.Save();
            Print(MYMOD_TAG + " No config found, created default at: " + MYMOD_CONFIG_PATH);
        }

        return cfg;
    }

    // -----------------------------------------------------------------------
    // Save - écrit les valeurs actuelles sur disque en JSON formaté
    // -----------------------------------------------------------------------
    void Save()
    {
        // S'assurer que le répertoire existe. MakeDirectory est sûr à appeler
        // même si le répertoire existe déjà.
        if (!FileExist(MYMOD_CONFIG_DIR))
        {
            MakeDirectory(MYMOD_CONFIG_DIR);
        }

        // JsonSaveFile écrit tous les champs comme un objet JSON.
        // Le fichier est entièrement réécrit -- il n'y a pas de fusion.
        JsonFileLoader<MyModConfig>.JsonSaveFile(MYMOD_CONFIG_PATH, this);
    }
};
```

Le fichier `config.json` résultant sur disque ressemble à ceci :

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

Les administrateurs éditent ce fichier, redémarrent le serveur, et les nouvelles valeurs prennent effet.

---

## Définitions RPC (3_Game)

Placez dans `Scripts/3_Game/MyMod/MyModRPC.c`.

Le RPC (Remote Procedure Call) est la façon dont le client et le serveur communiquent dans DayZ. Ce fichier définit les noms de routes et fournit des méthodes utilitaires pour l'enregistrement.

```c
// ==========================================================================
// MyModRPC.c - Définitions de routes RPC et utilitaires
// Couche 3_Game : les constantes de noms de routes doivent être disponibles partout.
//
// COMMENT FONCTIONNE LE RPC DANS DAYZ :
//   Le moteur fournit ScriptRPC et OnRPC pour envoyer/recevoir des données.
//   Vous appelez GetGame().RPCSingleParam() ou créez un ScriptRPC, écrivez
//   des données dedans, et l'envoyez. Le récepteur lit les données dans le même ordre.
//
//   DayZ utilise des identifiants RPC entiers. Pour éviter les collisions entre mods,
//   chaque mod devrait choisir une plage d'identifiants unique ou utiliser un système de
//   routage par chaîne. Ce modèle utilise un seul identifiant entier unique avec un
//   préfixe de chaîne pour identifier quel gestionnaire doit traiter chaque message.
//
// PATRON :
//   1. Le client veut des données -> envoie un RPC de requête au serveur
//   2. Le serveur traite -> renvoie un RPC de réponse au client
//   3. Le client reçoit -> met à jour l'UI ou l'état
// ==========================================================================

// ---------------------------------------------------------------------------
// Identifiant RPC - choisissez un numéro unique peu susceptible d'entrer en collision.
// Vérifiez le wiki communautaire DayZ pour les plages couramment utilisées.
// Les RPCs intégrés du moteur utilisent des numéros bas (0-1000).
// Convention : utiliser un nombre à 5 chiffres basé sur le hash du nom de votre mod.
// ---------------------------------------------------------------------------
const int MYMOD_RPC_ID = 74291;

// ---------------------------------------------------------------------------
// Noms de routes RPC - identifiants de chaîne pour chaque endpoint RPC.
// Utiliser des constantes évite les fautes de frappe et permet la recherche IDE.
// ---------------------------------------------------------------------------
const string MYMOD_RPC_CONFIG_SYNC     = "MyMod:ConfigSync";
const string MYMOD_RPC_WELCOME         = "MyMod:Welcome";
const string MYMOD_RPC_PLAYER_DATA     = "MyMod:PlayerData";
const string MYMOD_RPC_UI_REQUEST      = "MyMod:UIRequest";
const string MYMOD_RPC_UI_RESPONSE     = "MyMod:UIResponse";

// ---------------------------------------------------------------------------
// MyModRPCHelper - classe utilitaire statique pour envoyer des RPCs
// Encapsule le code standard de création d'un ScriptRPC, écriture de la route,
// écriture de la charge utile, et appel de Send().
// ---------------------------------------------------------------------------
class MyModRPCHelper
{
    // Envoyer un message texte du serveur à un client spécifique.
    // identity : le joueur cible. null = diffusion à tous.
    // routeName : quel gestionnaire doit traiter ceci (ex: MYMOD_RPC_WELCOME).
    // message : la charge utile texte.
    static void SendStringToClient(PlayerIdentity identity, string routeName, string message)
    {
        // Créer l'objet RPC. C'est l'enveloppe.
        ScriptRPC rpc = new ScriptRPC();

        // Écrire le nom de route en premier. Le récepteur lit ceci pour décider
        // quel gestionnaire appeler. Toujours écrire/lire dans le même ordre.
        rpc.Write(routeName);

        // Écrire les données de charge utile.
        rpc.Write(message);

        // Envoyer au client. Paramètres :
        //   null    = pas d'objet cible (l'entité joueur non nécessaire pour les RPCs personnalisés)
        //   MYMOD_RPC_ID = notre canal RPC unique
        //   true    = livraison garantie (type TCP). Utilisez false pour les mises à jour fréquentes.
        //   identity = client cible. null diffuserait à TOUS les clients.
        rpc.Send(null, MYMOD_RPC_ID, true, identity);
    }

    // Envoyer une requête du client au serveur (pas de charge utile, juste la route).
    static void SendRequestToServer(string routeName)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        // Lors de l'envoi AU serveur, identity est null (le serveur n'a pas de PlayerIdentity).
        // guaranteed = true assure que le message arrive.
        rpc.Send(null, MYMOD_RPC_ID, true, null);
    }
};
```

---

## Singleton gestionnaire (4_World)

Placez dans `Scripts/4_World/MyMod/MyModManager.c`.

C'est le cerveau central de votre mod côté serveur. Il possède la config, traite les RPC, et exécute des mises à jour périodiques.

```c
// ==========================================================================
// MyModManager.c - Gestionnaire singleton côté serveur
// Couche 4_World : peut référencer les types de 3_Game (config, constantes, RPC).
//
// POURQUOI un singleton :
//   Le gestionnaire a besoin d'exactement une instance qui persiste pendant toute
//   la mission. Des instances multiples causeraient un traitement en double et
//   un état conflictuel. Le patron singleton garantit une instance
//   et fournit un accès global via GetInstance().
//
// CYCLE DE VIE :
//   1. MissionServer.OnInit() appelle MyModManager.GetInstance().Init()
//   2. Le gestionnaire charge la config, enregistre les RPCs, démarre les minuteurs
//   3. Le gestionnaire traite les événements pendant le gameplay
//   4. MissionServer.OnMissionFinish() appelle MyModManager.Cleanup()
//   5. Le singleton est détruit, toutes les références sont libérées
// ==========================================================================

class MyModManager
{
    // L'instance unique. 'ref' signifie que cette classe POSSÈDE l'objet.
    // Quand s_Instance est mis à null, l'objet est détruit.
    private static ref MyModManager s_Instance;

    // Configuration chargée depuis le disque.
    // 'ref' car le gestionnaire possède la durée de vie de l'objet config.
    protected ref MyModConfig m_Config;

    // Temps accumulé depuis le dernier tick de mise à jour (secondes).
    protected float m_TimeSinceUpdate;

    // Suit si Init() a été appelé avec succès.
    protected bool m_Initialized;

    // -----------------------------------------------------------------------
    // Accès au singleton
    // -----------------------------------------------------------------------

    static MyModManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyModManager();
        }
        return s_Instance;
    }

    // Appelez ceci en fin de mission pour détruire le singleton et libérer la mémoire.
    // Mettre s_Instance à null déclenche le destructeur.
    static void Cleanup()
    {
        s_Instance = null;
    }

    // -----------------------------------------------------------------------
    // Cycle de vie
    // -----------------------------------------------------------------------

    // Appelé une fois depuis MissionServer.OnInit().
    void Init()
    {
        if (m_Initialized) return;

        // Charger la config depuis le disque (ou créer les défauts au premier lancement).
        m_Config = MyModConfig.Load();

        if (!m_Config.Enabled)
        {
            Print(MYMOD_TAG + " Mod is DISABLED in config. Skipping initialization.");
            return;
        }

        // Réinitialiser le minuteur de mise à jour.
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

    // Appelé chaque frame depuis MissionServer.OnUpdate().
    // timeslice est les secondes écoulées depuis la dernière frame.
    void OnUpdate(float timeslice)
    {
        if (!m_Initialized || !m_Config.Enabled) return;

        // Accumuler le temps et ne traiter qu'à l'intervalle configuré.
        // Cela empêche d'exécuter de la logique coûteuse à chaque frame.
        m_TimeSinceUpdate += timeslice;
        if (m_TimeSinceUpdate < m_Config.UpdateInterval) return;
        m_TimeSinceUpdate = 0;

        // --- La logique de mise à jour périodique va ici ---
        // Exemple : itérer les entités suivies, vérifier les conditions, etc.
        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Periodic update tick");
        }
    }

    // Appelé quand la mission se termine (arrêt ou redémarrage du serveur).
    void Shutdown()
    {
        if (!m_Initialized) return;

        Print(MYMOD_TAG + " Manager shutting down");

        // Sauvegarder tout état à l'exécution si nécessaire.
        // m_Config.Save();

        m_Initialized = false;
    }

    // -----------------------------------------------------------------------
    // Gestionnaires RPC
    // -----------------------------------------------------------------------

    // Appelé quand un client demande des données UI.
    // sender : le joueur qui a envoyé la requête.
    // ctx : le flux de données (déjà passé le nom de route).
    void OnUIRequest(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " UI data requested by: " + sender.GetName());
        }

        // Construire les données de réponse et les renvoyer.
        // Dans un vrai mod, vous rassembleriez des données réelles ici.
        string responseData = "Items: " + m_Config.MaxItems.ToString();
        MyModRPCHelper.SendStringToClient(sender, MYMOD_RPC_UI_RESPONSE, responseData);
    }

    // Appelé quand un joueur se connecte. Envoie le message de bienvenue si configuré.
    void OnPlayerConnected(PlayerIdentity identity)
    {
        if (!m_Initialized || !m_Config.Enabled) return;
        if (!identity) return;

        // Envoyer le message de bienvenue si configuré.
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
    // Accesseurs
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

## Gestionnaire d'événements joueur (4_World)

Placez dans `Scripts/4_World/MyMod/MyModPlayerHandler.c`.

Ceci utilise le patron `modded class` pour se connecter à l'entité vanilla `PlayerBase` et détecter les événements de connexion/déconnexion.

```c
// ==========================================================================
// MyModPlayerHandler.c - Hooks du cycle de vie du joueur
// Couche 4_World : PlayerBase moddé pour intercepter connexion/déconnexion.
//
// POURQUOI modded class :
//   DayZ n'a pas de callback d'événement "joueur connecté". Le patron standard
//   est de surcharger des méthodes sur MissionServer (pour les nouvelles connexions)
//   ou de se connecter à PlayerBase (pour les événements au niveau de l'entité comme la mort).
//   Nous utilisons PlayerBase moddé ici pour démontrer les hooks au niveau de l'entité.
//
// IMPORTANT :
//   Appelez toujours super.NomDeMethode() en premier dans les surcharges. Ne pas le faire
//   casse la chaîne de comportement vanilla et les autres mods qui surchargent aussi
//   la même méthode.
// ==========================================================================

modded class PlayerBase
{
    // Suivre si nous avons envoyé l'événement d'init pour ce joueur.
    // Cela empêche le traitement en double si Init() est appelé plusieurs fois.
    protected bool m_MyModPlayerReady;

    // -----------------------------------------------------------------------
    // Appelé après que l'entité joueur est entièrement créée et répliquée.
    // Sur le serveur, c'est là que le joueur est "prêt" à recevoir des RPCs.
    // -----------------------------------------------------------------------
    override void Init()
    {
        super.Init();

        // Ne s'exécuter que sur le serveur. GetGame().IsServer() renvoie true sur
        // les serveurs dédiés et sur l'hôte d'un listen server.
        if (!GetGame().IsServer()) return;

        // Protection contre la double initialisation.
        if (m_MyModPlayerReady) return;
        m_MyModPlayerReady = true;

        // Obtenir l'identité réseau du joueur.
        // Sur le serveur, GetIdentity() renvoie l'objet PlayerIdentity
        // contenant le nom du joueur, le Steam ID (PlainId) et l'UID.
        PlayerIdentity identity = GetIdentity();
        if (!identity) return;

        // Notifier le gestionnaire qu'un joueur s'est connecté.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnPlayerConnected(identity);
        }
    }
};
```

---

## Hook de mission : Serveur (5_Mission)

Placez dans `Scripts/5_Mission/MyMod/MyModMissionServer.c`.

Ceci se connecte à `MissionServer` pour initialiser et arrêter le mod côté serveur.

```c
// ==========================================================================
// MyModMissionServer.c - Hooks de mission côté serveur
// Couche 5_Mission : dernière à charger, peut référencer toutes les couches inférieures.
//
// POURQUOI MissionServer moddé :
//   MissionServer est le point d'entrée pour la logique côté serveur. Son OnInit()
//   s'exécute une fois quand la mission démarre (démarrage du serveur). OnMissionFinish()
//   s'exécute quand le serveur s'arrête ou redémarre. Ce sont les bons endroits
//   pour configurer et démonter les systèmes de votre mod.
//
// ORDRE DU CYCLE DE VIE :
//   1. Le moteur charge toutes les couches de script (3_Game -> 4_World -> 5_Mission)
//   2. Le moteur crée l'instance MissionServer
//   3. OnInit() est appelé -> initialisez vos systèmes ici
//   4. OnMissionStart() est appelé -> le monde est prêt, les joueurs peuvent rejoindre
//   5. OnUpdate() est appelé à chaque frame
//   6. OnMissionFinish() est appelé -> le serveur s'arrête
// ==========================================================================

modded class MissionServer
{
    // -----------------------------------------------------------------------
    // Initialisation
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        // TOUJOURS appeler super en premier. Les autres mods dans la chaîne en dépendent.
        super.OnInit();

        // Initialiser le singleton gestionnaire. Ceci charge la config depuis le disque,
        // enregistre les gestionnaires RPC et prépare le mod pour l'opération.
        MyModManager.GetInstance().Init();

        Print(MYMOD_TAG + " Server mission initialized");
    }

    // -----------------------------------------------------------------------
    // Mise à jour par frame
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        // Déléguer au gestionnaire. Le gestionnaire gère sa propre limitation
        // de fréquence (UpdateInterval depuis la config) donc c'est peu coûteux.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnUpdate(timeslice);
        }
    }

    // -----------------------------------------------------------------------
    // Connexion joueur - dispatch RPC serveur
    // Appelé par le moteur quand un client envoie un RPC au serveur.
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Ne gérer que notre identifiant RPC. Tous les autres RPCs passent.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Lire le nom de route (première chaîne écrite par l'expéditeur).
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Dispatcher vers le bon gestionnaire selon le nom de route.
        MyModManager mgr = MyModManager.GetInstance();
        if (!mgr) return;

        if (routeName == MYMOD_RPC_UI_REQUEST)
        {
            mgr.OnUIRequest(sender, ctx);
        }
        // Ajoutez plus de routes ici au fur et à mesure que votre mod grandit :
        // else if (routeName == MYMOD_RPC_SOME_OTHER)
        // {
        //     mgr.OnSomeOther(sender, ctx);
        // }
    }

    // -----------------------------------------------------------------------
    // Arrêt
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Arrêter le gestionnaire avant d'appeler super.
        // Cela assure que notre nettoyage s'exécute avant que le moteur ne démonte
        // l'infrastructure de la mission.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.Shutdown();
        }

        // Détruire le singleton pour libérer la mémoire et éviter un état périmé
        // si la mission redémarre (ex: redémarrage serveur sans arrêt du processus).
        MyModManager.Cleanup();

        Print(MYMOD_TAG + " Server mission finished");

        super.OnMissionFinish();
    }
};
```

---

## Hook de mission : Client (5_Mission)

Placez dans `Scripts/5_Mission/MyMod/MyModMissionClient.c`.

Ceci se connecte à `MissionGameplay` pour l'initialisation côté client, la gestion des entrées et la réception des RPC.

```c
// ==========================================================================
// MyModMissionClient.c - Hooks de mission côté client
// Couche 5_Mission.
//
// POURQUOI MissionGameplay :
//   Sur le client, MissionGameplay est la classe de mission active pendant
//   le gameplay. Elle reçoit OnUpdate() chaque frame (pour scruter les entrées)
//   et OnRPC() pour les messages entrants du serveur.
//
// NOTE SUR LES LISTEN SERVERS :
//   Sur un listen server (hôte + jouer), BOTH MissionServer et
//   MissionGameplay sont actifs. Votre code client s'exécutera aux côtés
//   du code serveur. Protégez avec GetGame().IsClient() ou GetGame().IsServer()
//   si vous avez besoin de logique spécifique à un côté.
// ==========================================================================

modded class MissionGameplay
{
    // Référence au panneau UI. null quand fermé.
    protected ref MyModUI m_MyModPanel;

    // Suivre l'état d'initialisation.
    protected bool m_MyModInitialized;

    // -----------------------------------------------------------------------
    // Initialisation
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        m_MyModInitialized = true;

        Print(MYMOD_TAG + " Client mission initialized");
    }

    // -----------------------------------------------------------------------
    // Mise à jour par frame : scrutation des entrées et gestion de l'UI
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_MyModInitialized) return;

        // Scruter le raccourci défini dans Inputs.xml.
        // GetUApi() renvoie l'API UserActions.
        // GetInputByName() recherche l'action par le nom dans Inputs.xml.
        // LocalPress() renvoie true à la frame où la touche est enfoncée.
        UAInput panelInput = GetUApi().GetInputByName("UAMyModPanel");
        if (panelInput && panelInput.LocalPress())
        {
            TogglePanel();
        }
    }

    // -----------------------------------------------------------------------
    // Récepteur RPC : gère les messages du serveur
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Ne gérer que notre identifiant RPC.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Lire le nom de route.
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Dispatcher selon la route.
        if (routeName == MYMOD_RPC_WELCOME)
        {
            string welcomeMsg;
            if (ctx.Read(welcomeMsg))
            {
                // Afficher le message de bienvenue au joueur.
                // GetGame().GetMission().OnEvent() peut afficher des notifications,
                // ou vous pouvez utiliser une UI personnalisée. Pour simplifier, nous utilisons le chat.
                GetGame().Chat(welcomeMsg, "");
                Print(MYMOD_TAG + " Welcome message: " + welcomeMsg);
            }
        }
        else if (routeName == MYMOD_RPC_UI_RESPONSE)
        {
            string responseData;
            if (ctx.Read(responseData))
            {
                // Mettre à jour le panneau UI avec les données reçues.
                if (m_MyModPanel)
                {
                    m_MyModPanel.SetData(responseData);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // Bascule du panneau UI
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
            // N'ouvrir que si le joueur est vivant et qu'aucun autre menu n'est affiché.
            PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
            if (!player || !player.IsAlive()) return;

            UIManager uiMgr = GetGame().GetUIManager();
            if (uiMgr && uiMgr.GetMenu()) return;

            m_MyModPanel = new MyModUI();
            m_MyModPanel.Open();

            // Demander des données fraîches au serveur.
            MyModRPCHelper.SendRequestToServer(MYMOD_RPC_UI_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // Arrêt
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Fermer et détruire le panneau UI s'il est ouvert.
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

## Script du panneau d'interface (5_Mission)

Placez dans `Scripts/5_Mission/MyMod/MyModUI.c`.

Ce script pilote le panneau UI défini dans le fichier `.layout`. Il trouve les références de widgets, les remplit avec des données, et gère l'ouverture/fermeture.

```c
// ==========================================================================
// MyModUI.c - Contrôleur de panneau UI
// Couche 5_Mission : peut référencer toutes les couches inférieures.
//
// COMMENT FONCTIONNE L'UI DayZ :
//   1. Un fichier .layout définit la hiérarchie de widgets (comme du HTML).
//   2. Une classe de script charge la disposition, trouve les widgets par nom, et
//      les manipule (définir le texte, afficher/masquer, répondre aux clics).
//   3. Le script affiche/masque le widget racine et gère le focus d'entrée.
//
// CYCLE DE VIE DES WIDGETS :
//   GetGame().GetWorkspace().CreateWidgets() charge le fichier de disposition et
//   renvoie le widget racine. Vous utilisez ensuite FindAnyWidget() pour obtenir
//   des références aux widgets enfants nommés. Quand c'est fini, appelez widget.Unlink()
//   pour détruire tout l'arbre de widgets.
// ==========================================================================

class MyModUI
{
    // Widget racine du panneau (chargé depuis .layout).
    protected ref Widget m_Root;

    // Widgets enfants nommés.
    protected TextWidget m_TitleText;
    protected TextWidget m_DataText;
    protected TextWidget m_VersionText;
    protected ButtonWidget m_CloseButton;

    // Suivi d'état.
    protected bool m_IsOpen;

    // -----------------------------------------------------------------------
    // Constructeur : charger la disposition et trouver les références de widgets
    // -----------------------------------------------------------------------
    void MyModUI()
    {
        // CreateWidgets charge le fichier .layout et instancie tous les widgets.
        // Le chemin est relatif à la racine du mod (même que les chemins config.cpp).
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModPanel.layout"
        );

        // Initialement masqué jusqu'à l'appel de Open().
        if (m_Root)
        {
            m_Root.Show(false);

            // Trouver les widgets nommés. Ces noms DOIVENT correspondre aux noms de widgets
            // dans le fichier .layout exactement (sensible à la casse).
            m_TitleText   = TextWidget.Cast(m_Root.FindAnyWidget("TitleText"));
            m_DataText    = TextWidget.Cast(m_Root.FindAnyWidget("DataText"));
            m_VersionText = TextWidget.Cast(m_Root.FindAnyWidget("VersionText"));
            m_CloseButton = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));

            // Définir le contenu statique.
            if (m_TitleText)
                m_TitleText.SetText("My Professional Mod");

            if (m_VersionText)
                m_VersionText.SetText("v" + MYMOD_VERSION);
        }
    }

    // -----------------------------------------------------------------------
    // Ouvrir : afficher le panneau et capturer l'entrée
    // -----------------------------------------------------------------------
    void Open()
    {
        if (!m_Root) return;

        m_Root.Show(true);
        m_IsOpen = true;

        // Verrouiller les contrôles du joueur pour que ZQSD ne déplace pas le personnage
        // pendant que le panneau est ouvert. Ceci affiche un curseur.
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print(MYMOD_TAG + " UI panel opened");
    }

    // -----------------------------------------------------------------------
    // Fermer : masquer le panneau et libérer l'entrée
    // -----------------------------------------------------------------------
    void Close()
    {
        if (!m_Root) return;

        m_Root.Show(false);
        m_IsOpen = false;

        // Réactiver les contrôles du joueur.
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print(MYMOD_TAG + " UI panel closed");
    }

    // -----------------------------------------------------------------------
    // Mise à jour des données : appelé quand le serveur envoie des données UI
    // -----------------------------------------------------------------------
    void SetData(string data)
    {
        if (m_DataText)
        {
            m_DataText.SetText(data);
        }
    }

    // -----------------------------------------------------------------------
    // Requête d'état
    // -----------------------------------------------------------------------
    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -----------------------------------------------------------------------
    // Destructeur : nettoyer l'arbre de widgets
    // -----------------------------------------------------------------------
    void ~MyModUI()
    {
        // Unlink détruit le widget racine et tous ses enfants.
        // Ceci libère la mémoire utilisée par l'arbre de widgets.
        if (m_Root)
        {
            m_Root.Unlink();
        }
    }
};
```

---

## Fichier de disposition

Placez dans `Scripts/GUI/layouts/MyModPanel.layout`.

Ceci définit la structure visuelle du panneau UI. Les dispositions DayZ utilisent un format texte personnalisé (pas du XML).

```
// ==========================================================================
// MyModPanel.layout - Structure du panneau UI
//
// RÈGLES DE DIMENSIONNEMENT :
//   hexactsize 1 + vexactsize 1 = taille en pixels (ex: size 400 300)
//   hexactsize 0 + vexactsize 0 = taille proportionnelle (0.0 à 1.0)
//   halign/valign contrôlent le point d'ancrage :
//     left_ref/top_ref     = ancré au bord gauche/haut du parent
//     center_ref           = centré dans le parent
//     right_ref/bottom_ref = ancré au bord droit/bas du parent
//
// IMPORTANT :
//   - N'utilisez jamais de tailles négatives. Utilisez l'alignement et la position à la place.
//   - Les noms de widgets doivent correspondre exactement aux appels FindAnyWidget() dans le script.
//   - 'ignorepointer 1' signifie que le widget ne reçoit pas les clics de souris.
//   - 'scriptclass' lie un widget à une classe de script pour la gestion d'événements.
// ==========================================================================

// Panneau racine : centré à l'écran, 400x300 pixels, fond semi-transparent.
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
  // Barre de titre : pleine largeur, 36px de haut, en haut.
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 36
   hexactpos 1
   vexactpos 1
   hexactsize 0
   vexactsize 1
   color 0.15 0.15 0.18 1
   {
    // Texte du titre : aligné à gauche avec padding.
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
    // Texte de version : côté droit de la barre de titre.
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
  // Zone de contenu : sous la barre de titre, remplit l'espace restant.
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
    // Texte de données : où les données du serveur sont affichées.
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
  // Bouton de fermeture : coin inférieur droit.
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

Placez dans `Scripts/stringtable.csv`.

Ceci fournit la localisation pour tout le texte visible par le joueur. Le moteur lit la colonne correspondant à la langue du jeu du joueur. La colonne `original` est le repli.

DayZ supporte 13 colonnes de langues. Chaque ligne doit avoir les 13 colonnes (utilisez le texte anglais comme espace réservé pour les langues que vous ne traduisez pas).

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod",
"STR_MYMOD_INPUT_PANEL","Open Panel","Open Panel","Otevrit Panel","Panel offnen","Otkryt Panel","Otworz Panel","Panel megnyitasa","Apri Pannello","Abrir Panel","Ouvrir Panneau","Open Panel","Open Panel","Abrir Painel","Open Panel",
"STR_MYMOD_TITLE","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod",
"STR_MYMOD_CLOSE","Close","Close","Zavrit","Schliessen","Zakryt","Zamknij","Bezaras","Chiudi","Cerrar","Fermer","Close","Close","Fechar","Close",
"STR_MYMOD_WELCOME","Welcome!","Welcome!","Vitejte!","Willkommen!","Dobro pozhalovat!","Witaj!","Udvozoljuk!","Benvenuto!","Bienvenido!","Bienvenue!","Welcome!","Welcome!","Bem-vindo!","Welcome!",
```

**Important :** Chaque ligne doit se terminer par une virgule finale après la dernière colonne de langue. C'est une exigence du parseur CSV de DayZ.

---

## Inputs.xml

Placez dans `Scripts/Inputs.xml`.

Ceci définit les raccourcis clavier personnalisés qui apparaissent dans le menu Options > Contrôles du jeu. Le champ `inputs` dans CfgMods de `config.cpp` doit pointer vers ce fichier.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<!--
    Inputs.xml - Définitions de raccourcis clavier personnalisés

    STRUCTURE :
    - <actions> :  déclare les noms d'actions d'entrée et leurs chaînes d'affichage
    - <sorting> :  regroupe les actions sous une catégorie dans le menu Contrôles
    - <preset> :   définit le raccourci par défaut

    CONVENTION DE NOMMAGE :
    - Les noms d'actions commencent par "UA" (User Action) suivi du préfixe de votre mod.
    - L'attribut "loc" référence une clé de chaîne depuis stringtable.csv.

    NOMS DE TOUCHES :
    - Clavier : kA à kZ, k0-k9, kInsert, kHome, kEnd, kDelete,
      kNumpad0-kNumpad9, kF1-kF12, kLControl, kRControl, kLShift, kRShift,
      kLAlt, kRAlt, kSpace, kReturn, kBack, kTab, kEscape
    - Souris : mouse1 (gauche), mouse2 (droit), mouse3 (milieu)
    - Combinaisons : utilisez l'élément <combo> avec plusieurs enfants <btn>
-->
<modded_inputs>
    <inputs>
        <!-- Déclarer l'action d'entrée. -->
        <actions>
            <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
        </actions>

        <!-- Regrouper sous une catégorie dans Options > Contrôles. -->
        <!-- Le "name" est un identifiant interne ; "loc" est le nom d'affichage depuis stringtable. -->
        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModPanel"/>
        </sorting>
    </inputs>

    <!-- Preset de touche par défaut. Les joueurs peuvent reconfigurer dans Options > Contrôles. -->
    <preset>
        <!-- Lié à la touche Home par défaut. -->
        <input name="UAMyModPanel">
            <btn name="kHome"/>
        </input>

        <!--
        EXEMPLE DE COMBINAISON (décommentez pour utiliser) :
        Ceci lierait à Ctrl+H au lieu d'une touche unique.
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

## Script de build

Placez dans `build.bat` à la racine du mod.

Ce fichier batch automatise l'empaquetage PBO en utilisant l'Addon Builder de DayZ Tools.

```batch
@echo off
REM ==========================================================================
REM build.bat - Empaquetage PBO automatisé pour MyProfessionalMod
REM
REM CE QUE ÇA FAIT :
REM   1. Empaquète le dossier Scripts/ dans un fichier PBO
REM   2. Place le PBO dans le dossier @mod distribuable
REM   3. Copie mod.cpp dans le dossier distribuable
REM
REM PRÉREQUIS :
REM   - DayZ Tools installé via Steam
REM   - Sources du mod à P:\MyProfessionalMod\
REM
REM UTILISATION :
REM   Double-cliquez ce fichier ou exécutez en ligne de commande : build.bat
REM ==========================================================================

REM --- Configuration : mettez à jour ces chemins selon votre installation ---

REM Chemin vers DayZ Tools (vérifiez le chemin de votre bibliothèque Steam).
set DAYZ_TOOLS=C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools

REM Dossier source : le répertoire Scripts qui est empaqueté dans le PBO.
set SOURCE=P:\MyProfessionalMod\Scripts

REM Dossier de sortie : où le PBO empaqueté va.
set OUTPUT=P:\@MyProfessionalMod\addons

REM Préfixe : le chemin virtuel dans le PBO. Doit correspondre aux chemins
REM dans config.cpp (ex: "MyProfessionalMod/Scripts/3_Game" doit se résoudre).
set PREFIX=MyProfessionalMod\Scripts

REM --- Étapes de build ---

echo ============================================
echo  Building MyProfessionalMod
echo ============================================

REM Créer le répertoire de sortie s'il n'existe pas.
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

REM Exécuter Addon Builder.
REM   -clear  = supprimer l'ancien PBO avant l'empaquetage
REM   -prefix = définir le préfixe PBO (requis pour que les chemins de script se résolvent)
echo Packing PBO...
"%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe" "%SOURCE%" "%OUTPUT%" -prefix=%PREFIX% -clear

REM Vérifier si Addon Builder a réussi.
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

REM Copier mod.cpp dans le dossier distribuable.
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

## Guide de personnalisation

Quand vous utilisez ce modèle pour votre propre mod, vous devez renommer chaque occurrence des noms de substitution. Voici une liste de contrôle complète.

### Étape 1 : Choisir vos noms

Décidez de ces identifiants avant de faire des modifications :

| Identifiant | Exemple | Règles |
|-------------|---------|--------|
| **Nom du dossier du mod** | `MyBountySystem` | Pas d'espaces, PascalCase ou underscores |
| **Nom d'affichage** | `"My Bounty System"` | Lisible par un humain, pour mod.cpp et config.cpp |
| **Classe CfgPatches** | `MyBountySystem_Scripts` | Doit être globalement unique parmi tous les mods |
| **Classe CfgMods** | `MyBountySystem` | Identifiant interne du moteur |
| **Préfixe de script** | `MyBounty` | Préfixe court pour les classes : `MyBountyManager`, `MyBountyConfig` |
| **Constante de tag** | `MYBOUNTY_TAG` | Pour les messages de journal : `"[MyBounty]"` |
| **Define préprocesseur** | `MYBOUNTYSYSTEM` | Pour la détection inter-mods `#ifdef` |
| **Identifiant RPC** | `58432` | Nombre unique à 5 chiffres, non utilisé par d'autres mods |
| **Nom d'action d'entrée** | `UAMyBountyPanel` | Commence par `UA`, unique |

### Étape 2 : Renommer fichiers et dossiers

Renommez chaque fichier et dossier contenant "MyMod" ou "MyProfessionalMod" :

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

### Étape 3 : Rechercher-remplacer dans chaque fichier

Effectuez ces remplacements **dans l'ordre** (chaînes les plus longues en premier pour éviter les correspondances partielles) :

| Chercher | Remplacer | Fichiers affectés |
|----------|-----------|-------------------|
| `MyProfessionalMod` | `MyBountySystem` | config.cpp, mod.cpp, build.bat, script UI |
| `MyModManager` | `MyBountyManager` | Gestionnaire, hooks de mission, gestionnaire joueur |
| `MyModConfig` | `MyBountyConfig` | Classe config, gestionnaire |
| `MyModConstants` | `MyBountyConstants` | (nom de fichier seulement) |
| `MyModRPCHelper` | `MyBountyRPCHelper` | Utilitaire RPC, hooks de mission |
| `MyModUI` | `MyBountyUI` | Script UI, hook mission client |
| `MyModPanel` | `MyBountyPanel` | Fichier de disposition, script UI |
| `MyMod_Scripts` | `MyBountySystem_Scripts` | config.cpp CfgPatches |
| `MYMOD_RPC_ID` | `MYBOUNTY_RPC_ID` | Constantes, RPC, hooks de mission |
| `MYMOD_RPC_` | `MYBOUNTY_RPC_` | Toutes les constantes de routes RPC |
| `MYMOD_TAG` | `MYBOUNTY_TAG` | Constantes, tous les fichiers utilisant le tag de journal |
| `MYMOD_CONFIG` | `MYBOUNTY_CONFIG` | Constantes, classe config |
| `MYMOD_VERSION` | `MYBOUNTY_VERSION` | Constantes, script UI |
| `MYMOD` | `MYBOUNTYSYSTEM` | config.cpp defines[] |
| `MyMod` | `MyBounty` | config.cpp classe CfgMods, chaînes de routes RPC |
| `My Mod` | `My Bounty System` | Chaînes dans les dispositions, stringtable |
| `mymod` | `mybounty` | Inputs.xml nom de tri |
| `STR_MYMOD_` | `STR_MYBOUNTY_` | stringtable.csv, Inputs.xml |
| `UAMyMod` | `UAMyBounty` | Inputs.xml, hook mission client |
| `m_MyMod` | `m_MyBounty` | Variables membres du hook mission client |
| `74291` | `58432` | Identifiant RPC (votre numéro unique choisi) |

### Étape 4 : Vérifier

Après le renommage, faites une recherche sur tout le projet pour "MyMod" et "MyProfessionalMod" pour attraper ce que vous avez manqué. Puis compilez et testez :

```batch
DayZDiag_x64.exe -mod=P:\MyBountySystem -filePatching
```

Vérifiez le journal de script pour votre tag (ex: `[MyBounty]`) pour confirmer que tout s'est chargé.

---

## Guide d'expansion des fonctionnalités

Une fois votre mod en fonctionnement, voici comment ajouter des fonctionnalités courantes.

### Ajouter un nouvel endpoint RPC

**1. Définir la constante de route** dans `MyModRPC.c` (3_Game) :

```c
const string MYMOD_RPC_BOUNTY_SET = "MyMod:BountySet";
```

**2. Ajouter le gestionnaire serveur** dans `MyModManager.c` (4_World) :

```c
void OnBountySet(PlayerIdentity sender, ParamsReadContext ctx)
{
    // Lire les paramètres écrits par le client.
    string targetName;
    int bountyAmount;
    if (!ctx.Read(targetName)) return;
    if (!ctx.Read(bountyAmount)) return;

    Print(MYMOD_TAG + " Bounty set on " + targetName + ": " + bountyAmount.ToString());
    // ... votre logique ici ...
}
```

**3. Ajouter le cas de dispatch** dans `MyModMissionServer.c` (5_Mission), dans `OnRPC()` :

```c
else if (routeName == MYMOD_RPC_BOUNTY_SET)
{
    mgr.OnBountySet(sender, ctx);
}
```

**4. Envoyer depuis le client** (là où l'action est déclenchée) :

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(MYMOD_RPC_BOUNTY_SET);
rpc.Write("PlayerName");
rpc.Write(5000);
rpc.Send(null, MYMOD_RPC_ID, true, null);
```

### Ajouter un nouveau champ de configuration

**1. Ajouter le champ** dans `MyModConfig.c` avec une valeur par défaut :

```c
// Montant minimum de prime que les joueurs peuvent définir.
int MinBountyAmount = 100;
```

C'est tout. Le sérialiseur JSON détecte automatiquement les champs publics. Les fichiers de config existants sur disque utiliseront la valeur par défaut pour le nouveau champ jusqu'à ce que l'admin édite et sauvegarde.

**2. Le référencer** depuis le gestionnaire :

```c
if (bountyAmount < m_Config.MinBountyAmount)
{
    // Rejeter : trop bas.
    return;
}
```

### Ajouter un nouveau panneau UI

**1. Créer la disposition** dans `Scripts/GUI/layouts/MyModBountyList.layout` :

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

**2. Créer le script** dans `Scripts/5_Mission/MyMod/MyModBountyListUI.c` :

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

### Ajouter un nouveau raccourci clavier

**1. Ajouter l'action** dans `Inputs.xml` :

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

**2. Ajouter le raccourci par défaut** dans la section `<preset>` :

```xml
<input name="UAMyModBountyList">
    <btn name="kEnd"/>
</input>
```

**3. Ajouter la localisation** dans `stringtable.csv` :

```csv
"STR_MYMOD_INPUT_BOUNTYLIST","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List",
```

**4. Scruter l'entrée** dans `MyModMissionClient.c` :

```c
UAInput bountyInput = GetUApi().GetInputByName("UAMyModBountyList");
if (bountyInput && bountyInput.LocalPress())
{
    ToggleBountyList();
}
```

### Ajouter une nouvelle entrée stringtable

**1. Ajouter la ligne** dans `stringtable.csv`. Chaque ligne nécessite les 13 colonnes de langues plus une virgule finale :

```csv
"STR_MYMOD_BOUNTY_PLACED","Bounty placed!","Bounty placed!","Odměna vypsána!","Kopfgeld gesetzt!","Награда назначена!","Nagroda wyznaczona!","Fejpénz kiírva!","Taglia piazzata!","Recompensa puesta!","Prime placée!","Bounty placed!","Bounty placed!","Recompensa colocada!","Bounty placed!",
```

**2. L'utiliser** dans le code de script :

```c
// Widget.SetText() ne résout PAS automatiquement les clés stringtable.
// Vous devez utiliser Widget.SetText() avec la chaîne résolue :
string localizedText = Widget.TranslateString("#STR_MYMOD_BOUNTY_PLACED");
myTextWidget.SetText(localizedText);
```

Ou dans un fichier `.layout`, le moteur résout les clés `#STR_` automatiquement :

```
text "#STR_MYMOD_BOUNTY_PLACED"
```

---

## Prochaines étapes

Avec ce modèle professionnel en fonctionnement, vous pouvez :

1. **Étudier les mods de production** -- Lisez [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) et les sources de `StarDZ_Core` pour des patrons concrets à grande échelle.
2. **Ajouter des objets personnalisés** -- Suivez le [Chapitre 8.2 : Créer un objet personnalisé](02-custom-item.md) et intégrez-les avec votre gestionnaire.
3. **Construire un panneau d'administration** -- Suivez le [Chapitre 8.3 : Construire un panneau d'administration](03-admin-panel.md) en utilisant votre système de configuration.
4. **Ajouter une surcouche HUD** -- Suivez le [Chapitre 8.8 : Construire une surcouche HUD](08-hud-overlay.md) pour les éléments UI toujours visibles.
5. **Publier sur le Workshop** -- Suivez le [Chapitre 8.7 : Publier sur le Workshop](07-publishing-workshop.md) quand votre mod est prêt.
6. **Apprendre le débogage** -- Lisez le [Chapitre 8.6 : Débogage et test](06-debugging-testing.md) pour l'analyse des journaux et le dépannage.

---

**Précédent :** [Chapitre 8.8 : Construire une surcouche HUD](08-hud-overlay.md) | [Accueil](../../README.md)
