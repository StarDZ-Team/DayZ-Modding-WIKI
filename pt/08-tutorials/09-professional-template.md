# Capítulo 8.9: Template Profissional de Mod

[Início](../README.md) | [<< Anterior: Construindo um HUD Overlay](08-hud-overlay.md) | **Template Profissional de Mod** | [Próximo: Criando um Veículo Personalizado >>](10-vehicle-mod.md)

---

> **Resumo:** Este capítulo fornece um template de mod completo e pronto para produção com todos os arquivos necessários para um mod profissional de DayZ. Diferente do [Capítulo 8.5](05-mod-template.md) que apresenta o esqueleto inicial do InclementDab, este é um template completo com sistema de configuração, gerenciador singleton, RPC cliente-servidor, painel de UI, teclas de atalho, localização e automação de build. Cada arquivo é pronto para copiar e colar, com comentários extensivos que explicam **por que** cada linha existe.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Estrutura Completa de Diretórios](#estrutura-completa-de-diretórios)
- [mod.cpp](#modcpp)
- [config.cpp](#configcpp)
- [Arquivo de Constantes (3_Game)](#arquivo-de-constantes-3_game)
- [Classe de Dados de Config (3_Game)](#classe-de-dados-de-config-3_game)
- [Definições de RPC (3_Game)](#definições-de-rpc-3_game)
- [Gerenciador Singleton (4_World)](#gerenciador-singleton-4_world)
- [Handler de Eventos do Jogador (4_World)](#handler-de-eventos-do-jogador-4_world)
- [Hook de Missão: Servidor (5_Mission)](#hook-de-missão-servidor-5_mission)
- [Hook de Missão: Cliente (5_Mission)](#hook-de-missão-cliente-5_mission)
- [Script do Painel de UI (5_Mission)](#script-do-painel-de-ui-5_mission)
- [Arquivo de Layout](#arquivo-de-layout)
- [stringtable.csv](#stringtablecsv)
- [Inputs.xml](#inputsxml)
- [Script de Build](#script-de-build)
- [Guia de Personalização](#guia-de-personalização)
- [Guia de Expansão de Recursos](#guia-de-expansão-de-recursos)
- [Próximos Passos](#próximos-passos)

---

## Visão Geral

Um mod "Hello World" prova que o toolchain funciona. Um mod profissional precisa de muito mais:

| Preocupação | Hello World | Template Profissional |
|---------|-------------|----------------------|
| Configuração | Valores hardcoded | Config JSON com load/save/defaults |
| Comunicação | Statements de print | RPC roteado por string (cliente para servidor e vice-versa) |
| Arquitetura | Um arquivo, uma função | Gerenciador singleton, scripts em camadas, ciclo de vida limpo |
| Interface | Nenhuma | Painel de UI baseado em layout com abrir/fechar |
| Teclas de atalho | Nenhuma | Keybind personalizado em Opções > Controles |
| Localização | Nenhuma | stringtable.csv com 13 idiomas |
| Pipeline de build | Addon Builder manual | Script batch de um clique |
| Limpeza | Nenhuma | Shutdown adequado no fim da missão, sem vazamentos |

Este template lhe dá tudo isso pronto para uso. Você renomeia os identificadores, deleta os sistemas que não precisa e começa a construir seu recurso real sobre uma fundação sólida.

---

## Estrutura Completa de Diretórios

Este é o layout completo de fontes. Cada arquivo listado abaixo é fornecido como template completo neste capítulo.

```
MyProfessionalMod/                          <-- Raiz dos fontes (fica no drive P:)
    mod.cpp                                 <-- Metadados do launcher
    Scripts/
        config.cpp                          <-- Registro no engine (CfgPatches + CfgMods)
        Inputs.xml                          <-- Definições de keybind
        stringtable.csv                     <-- Strings localizadas (13 idiomas)
        3_Game/
            MyMod/
                MyModConstants.c            <-- Enums, string de versão, constantes compartilhadas
                MyModConfig.c               <-- Config serializável em JSON com defaults
                MyModRPC.c                  <-- Nomes de rotas RPC e registro
        4_World/
            MyMod/
                MyModManager.c              <-- Gerenciador singleton (ciclo de vida, config, estado)
                MyModPlayerHandler.c        <-- Hooks de connect/disconnect de jogador
        5_Mission/
            MyMod/
                MyModMissionServer.c        <-- modded MissionServer (init/shutdown do servidor)
                MyModMissionClient.c        <-- modded MissionGameplay (init/shutdown do cliente)
                MyModUI.c                   <-- Script do painel de UI (abrir/fechar/popular)
        GUI/
            layouts/
                MyModPanel.layout           <-- Definição de layout da UI
    build.bat                               <-- Automação de empacotamento PBO

Após o build, a pasta distribuível do mod fica assim:

@MyProfessionalMod/                         <-- O que vai no servidor / Workshop
    mod.cpp
    addons/
        MyProfessionalMod_Scripts.pbo       <-- Empacotado de Scripts/
    keys/
        MyMod.bikey                         <-- Chave para servidores assinados
    meta.cpp                                <-- Metadados do Workshop (gerado automaticamente)
```

---

## mod.cpp

Este arquivo controla o que os jogadores veem no launcher do DayZ. Ele é colocado na raiz do mod, **não** dentro de `Scripts/`.

```cpp
// ==========================================================================
// mod.cpp - Identidade do mod para o launcher do DayZ
// Este arquivo é lido pelo launcher para exibir informações do mod na lista.
// NÃO é compilado pelo engine de script -- é apenas metadados.
// ==========================================================================

// Nome de exibição mostrado na lista de mods do launcher e na tela de mods do jogo.
name         = "My Professional Mod";

// Seu nome ou nome da equipe. Aparece na coluna "Author".
author       = "YourName";

// String de versão semântica. Atualize a cada lançamento.
// O launcher exibe isso para que os jogadores saibam qual versão têm.
version      = "1.0.0";

// Descrição curta mostrada ao passar o mouse sobre o mod no launcher.
// Mantenha com menos de 200 caracteres para legibilidade.
overview     = "A professional mod template with config, RPC, UI, and keybinds.";

// Tooltip mostrado ao passar o mouse. Geralmente corresponde ao nome do mod.
tooltipOwned = "My Professional Mod";

// Opcional: caminho para uma imagem de preview (relativo à raiz do mod).
// Tamanho recomendado: 256x256 ou 512x512, formato PAA ou EDDS.
// Deixe vazio se ainda não tem imagem.
picture      = "";

// Opcional: logo exibido no painel de detalhes do mod.
logo         = "";
logoSmall    = "";
logoOver     = "";

// Opcional: URL aberta quando o jogador clica em "Website" no launcher.
action       = "";
actionURL    = "";
```

---

## config.cpp

Este é o arquivo mais crítico. Ele registra seu mod no engine, declara dependências, conecta camadas de script e opcionalmente define preprocessor defines e image sets.

Coloque em `Scripts/config.cpp`.

```cpp
// ==========================================================================
// config.cpp - Registro no engine
// O engine do DayZ lê isso para saber o que seu mod fornece.
// Duas seções importam: CfgPatches (grafo de dependências) e CfgMods (carregamento de scripts).
// ==========================================================================

// --------------------------------------------------------------------------
// CfgPatches - Declaração de Dependências
// O engine usa isso para determinar a ordem de carregamento. Se seu mod depende de
// outro mod, liste a classe CfgPatches daquele mod em requiredAddons[].
// --------------------------------------------------------------------------
class CfgPatches
{
    // O nome da classe DEVE ser globalmente único entre todos os mods.
    // Convenção: ModName_Scripts (corresponde ao nome do PBO).
    class MyMod_Scripts
    {
        // units[] e weapons[] declaram classes de config definidas por este addon.
        // Para mods somente de script, deixe vazios. São usados por mods
        // que definem novos itens, armas ou veículos no config.cpp.
        units[] = {};
        weapons[] = {};

        // Versão mínima do engine. 0.1 funciona para todas as versões atuais do DayZ.
        requiredVersion = 0.1;

        // Dependências: liste nomes de classes CfgPatches de outros mods.
        // "DZ_Data" é o jogo base -- todo mod deve depender dele.
        // Adicione "CF_Scripts" se usar o Community Framework.
        // Adicione outros patches de mods se os estender.
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

// --------------------------------------------------------------------------
// CfgMods - Registro de Módulos de Script
// Diz ao engine onde cada camada de script fica e quais defines definir.
// --------------------------------------------------------------------------
class CfgMods
{
    // O nome da classe aqui é o identificador interno do seu mod.
    // NÃO precisa corresponder ao CfgPatches -- mas mantê-los relacionados
    // torna o codebase mais fácil de navegar.
    class MyMod
    {
        // dir: o nome da pasta no drive P: (ou no PBO).
        // Deve corresponder ao nome real da sua pasta raiz exatamente.
        dir = "MyProfessionalMod";

        // Nome de exibição (mostrado no Workbench e em alguns logs do engine).
        name = "My Professional Mod";

        // Autor e descrição para metadados do engine.
        author = "YourName";
        overview = "Professional mod template";

        // Tipo de mod. Sempre "mod" para mods de script.
        type = "mod";

        // credits: caminho opcional para um arquivo Credits.json.
        // creditsJson = "MyProfessionalMod/Scripts/Credits.json";

        // inputs: caminho para seu Inputs.xml para keybinds personalizados.
        // Isso DEVE ser definido aqui para que o engine carregue seus keybinds.
        inputs = "MyProfessionalMod/Scripts/Inputs.xml";

        // defines: símbolos do preprocessador definidos quando seu mod é carregado.
        // Outros mods podem usar #ifdef MYMOD para detectar a presença do seu mod
        // e compilar código de integração condicionalmente.
        defines[] = { "MYMOD" };

        // dependencies: quais módulos de script vanilla seu mod conecta.
        // "Game" = 3_Game, "World" = 4_World, "Mission" = 5_Mission.
        // A maioria dos mods precisa dos três. Adicione "Core" apenas se usar 1_Core.
        dependencies[] =
        {
            "Game", "World", "Mission"
        };

        // defs: mapeia cada módulo de script para sua pasta no disco.
        // O engine compila todos os arquivos .c encontrados recursivamente nestes caminhos.
        // Não existe #include no Enforce Script -- é assim que os arquivos são carregados.
        class defs
        {
            // imageSets: registra arquivos .imageset para uso em layouts.
            // Necessário apenas se você tem ícones/texturas personalizados para UI.
            // Descomente e atualize os caminhos se adicionar um imageset.
            //
            // class imageSets
            // {
            //     files[] =
            //     {
            //         "MyProfessionalMod/GUI/imagesets/mymod_icons.imageset"
            //     };
            // };

            // Camada Game (3_Game): carrega primeiro.
            // Coloque enums, constantes, classes de config, definições de RPC aqui.
            // NÃO PODE referenciar tipos de 4_World ou 5_Mission.
            class gameScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/3_Game" };
            };

            // Camada World (4_World): carrega em segundo.
            // Coloque gerenciadores, modificações de entidades, interações com o mundo aqui.
            // PODE referenciar tipos de 3_Game. NÃO PODE referenciar tipos de 5_Mission.
            class worldScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/4_World" };
            };

            // Camada Mission (5_Mission): carrega por último.
            // Coloque hooks de missão, painéis de UI, lógica de startup/shutdown aqui.
            // PODE referenciar tipos de todas as camadas inferiores.
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

## Arquivo de Constantes (3_Game)

Coloque em `Scripts/3_Game/MyMod/MyModConstants.c`.

Este arquivo define todas as constantes compartilhadas, enums e a string de versão. Ele fica em `3_Game` para que toda camada superior possa acessar esses valores.

```c
// ==========================================================================
// MyModConstants.c - Constantes e enums compartilhados
// Camada 3_Game: disponível para todas as camadas superiores (4_World, 5_Mission).
//
// POR QUE este arquivo existe:
//   Centralizar constantes previne números mágicos espalhados pelos arquivos.
//   Enums dão segurança em tempo de compilação em vez de comparações com int brutos.
//   A string de versão é definida uma vez e usada em logs e UI.
// ==========================================================================

// ---------------------------------------------------------------------------
// Versão - atualize a cada lançamento
// ---------------------------------------------------------------------------
const string MYMOD_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Tag de log - prefixo para todas as mensagens Print/log deste mod
// Usar uma tag consistente facilita filtrar o log de script.
// ---------------------------------------------------------------------------
const string MYMOD_TAG = "[MyMod]";

// ---------------------------------------------------------------------------
// Caminhos de arquivo - centralizados para que erros de digitação sejam detectados em um só lugar
// $profile: resolve para o diretório de perfil do servidor em tempo de execução.
// ---------------------------------------------------------------------------
const string MYMOD_CONFIG_DIR  = "$profile:MyMod";
const string MYMOD_CONFIG_PATH = "$profile:MyMod/config.json";

// ---------------------------------------------------------------------------
// Enum: Modos de recurso
// Use enums em vez de ints brutos para legibilidade e verificações em tempo de compilação.
// ---------------------------------------------------------------------------
enum MyModMode
{
    DISABLED = 0,    // Recurso desligado
    PASSIVE  = 1,    // Recurso roda mas não interfere
    ACTIVE   = 2     // Recurso totalmente habilitado
};

// ---------------------------------------------------------------------------
// Enum: Tipos de notificação (usado pela UI para escolher ícone/cor)
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

## Classe de Dados de Config (3_Game)

Coloque em `Scripts/3_Game/MyMod/MyModConfig.c`.

Esta é uma classe de configurações serializável em JSON. O servidor a carrega na inicialização. Se nenhum arquivo existir, defaults são usados e um config fresco é salvo no disco.

```c
// ==========================================================================
// MyModConfig.c - Configuração JSON com defaults
// Camada 3_Game para que tanto gerenciadores de 4_World quanto hooks de 5_Mission possam lê-la.
//
// COMO FUNCIONA:
//   JsonFileLoader<MyModConfig> usa o serializador JSON integrado do Enforce Script.
//   Cada campo com valor default é escrito para / lido do arquivo JSON.
//   Adicionar um novo campo é seguro -- arquivos de config antigos simplesmente
//   recebem o valor default para campos faltantes.
//
// GOTCHA DO ENFORCE SCRIPT:
//   JsonFileLoader<T>.JsonLoadFile(path, obj) retorna VOID.
//   Você NÃO PODE fazer: if (JsonFileLoader<T>.JsonLoadFile(...)) -- não vai compilar.
//   Sempre passe um objeto pré-criado por referência.
// ==========================================================================

class MyModConfig
{
    // --- Configurações Gerais ---

    // Interruptor mestre: se false, o mod inteiro é desabilitado.
    bool Enabled = true;

    // Frequência (em segundos) que o gerenciador executa seu tick de atualização.
    // Valores menores = mais responsivo mas maior custo de CPU.
    float UpdateInterval = 5.0;

    // Número máximo de itens/entidades que este mod gerencia simultaneamente.
    int MaxItems = 100;

    // Modo: 0 = DISABLED, 1 = PASSIVE, 2 = ACTIVE (veja enum MyModMode).
    int Mode = 2;

    // --- Mensagens ---

    // Mensagem de boas-vindas mostrada aos jogadores quando conectam.
    // String vazia = sem mensagem.
    string WelcomeMessage = "Welcome to the server!";

    // Se deve mostrar a mensagem de boas-vindas como notificação ou mensagem de chat.
    bool WelcomeAsNotification = true;

    // --- Logging ---

    // Habilitar logging verbose de debug. Desligue para servidores de produção.
    bool DebugLogging = false;

    // -----------------------------------------------------------------------
    // Load - lê config do disco, retorna instância com defaults se ausente
    // -----------------------------------------------------------------------
    static MyModConfig Load()
    {
        // Sempre crie uma instância fresca primeiro. Isso garante que todos os defaults
        // estão definidos mesmo se o arquivo JSON tem campos faltantes (ex: após
        // uma atualização que adicionou novas configurações).
        MyModConfig cfg = new MyModConfig();

        // Verifique se o arquivo de config existe antes de tentar carregar.
        // Na primeira execução, não existirá -- usamos defaults e salvamos.
        if (FileExist(MYMOD_CONFIG_PATH))
        {
            // JsonLoadFile popula o objeto existente. NÃO retorna
            // um novo objeto. Campos presentes no JSON sobrescrevem defaults;
            // campos ausentes do JSON mantêm seus valores default.
            JsonFileLoader<MyModConfig>.JsonLoadFile(MYMOD_CONFIG_PATH, cfg);
        }
        else
        {
            // Primeira execução: salvar defaults para que o admin tenha um arquivo para editar.
            cfg.Save();
            Print(MYMOD_TAG + " No config found, created default at: " + MYMOD_CONFIG_PATH);
        }

        return cfg;
    }

    // -----------------------------------------------------------------------
    // Save - escreve valores atuais no disco como JSON formatado
    // -----------------------------------------------------------------------
    void Save()
    {
        // Garantir que o diretório existe. MakeDirectory é seguro de chamar
        // mesmo se o diretório já existe.
        if (!FileExist(MYMOD_CONFIG_DIR))
        {
            MakeDirectory(MYMOD_CONFIG_DIR);
        }

        // JsonSaveFile escreve todos os campos como um objeto JSON.
        // O arquivo é sobrescrito inteiramente -- não há merge.
        JsonFileLoader<MyModConfig>.JsonSaveFile(MYMOD_CONFIG_PATH, this);
    }
};
```

O `config.json` resultante no disco fica assim:

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

Admins editam este arquivo, reiniciam o servidor e os novos valores entram em efeito.

---

## Definições de RPC (3_Game)

Coloque em `Scripts/3_Game/MyMod/MyModRPC.c`.

RPC (Remote Procedure Call) é como o cliente e servidor comunicam no DayZ. Este arquivo define nomes de rotas e fornece métodos auxiliares para registro.

```c
// ==========================================================================
// MyModRPC.c - Definições de rotas RPC e auxiliares
// Camada 3_Game: constantes de nomes de rotas devem estar disponíveis em todos os lugares.
//
// COMO RPC FUNCIONA NO DAYZ:
//   O engine fornece ScriptRPC e OnRPC para enviar/receber dados.
//   Você chama GetGame().RPCSingleParam() ou cria um ScriptRPC, escreve
//   dados nele e envia. O receptor lê os dados na mesma ordem.
//
//   O DayZ usa IDs inteiros de RPC. Para evitar colisões entre mods, cada
//   mod deve escolher uma faixa de ID única ou usar um sistema de roteamento por string.
//   Este template usa um único ID int único com um prefixo de string
//   para identificar qual handler deve processar cada mensagem.
//
// PADRÃO:
//   1. Cliente quer dados -> envia RPC de solicitação ao servidor
//   2. Servidor processa  -> envia RPC de resposta de volta ao cliente
//   3. Cliente recebe     -> atualiza UI ou estado
// ==========================================================================

// ---------------------------------------------------------------------------
// ID do RPC - escolha um número único improvável de colidir com outros mods.
// Verifique a wiki da comunidade DayZ para faixas comumente usadas.
// RPCs integrados do engine usam números baixos (0-1000).
// Convenção: use um número de 5 dígitos baseado no hash do nome do seu mod.
// ---------------------------------------------------------------------------
const int MYMOD_RPC_ID = 74291;

// ---------------------------------------------------------------------------
// Nomes de Rotas RPC - identificadores string para cada endpoint de RPC.
// Usar constantes previne erros de digitação e habilita busca no IDE.
// ---------------------------------------------------------------------------
const string MYMOD_RPC_CONFIG_SYNC     = "MyMod:ConfigSync";
const string MYMOD_RPC_WELCOME         = "MyMod:Welcome";
const string MYMOD_RPC_PLAYER_DATA     = "MyMod:PlayerData";
const string MYMOD_RPC_UI_REQUEST      = "MyMod:UIRequest";
const string MYMOD_RPC_UI_RESPONSE     = "MyMod:UIResponse";

// ---------------------------------------------------------------------------
// MyModRPCHelper - classe utilitária estática para enviar RPCs
// Encapsula o boilerplate de criar um ScriptRPC, escrever a string de rota,
// escrever o payload e chamar Send().
// ---------------------------------------------------------------------------
class MyModRPCHelper
{
    // Enviar uma mensagem string do servidor para um cliente específico.
    // identity: o jogador alvo. null = broadcast para todos.
    // routeName: qual handler deve processar isso (ex: MYMOD_RPC_WELCOME).
    // message: o payload string.
    static void SendStringToClient(PlayerIdentity identity, string routeName, string message)
    {
        // Criar o objeto RPC. Este é o envelope.
        ScriptRPC rpc = new ScriptRPC();

        // Escrever o nome da rota primeiro. O receptor lê isso para decidir
        // qual handler chamar. Sempre escreva/leia na mesma ordem.
        rpc.Write(routeName);

        // Escrever os dados do payload.
        rpc.Write(message);

        // Enviar ao cliente. Parâmetros:
        //   null    = sem objeto alvo (entidade do jogador não necessária para RPCs customizados)
        //   MYMOD_RPC_ID = nosso canal RPC único
        //   true    = entrega garantida (tipo TCP). Use false para atualizações frequentes.
        //   identity = cliente alvo. null faria broadcast para TODOS os clientes.
        rpc.Send(null, MYMOD_RPC_ID, true, identity);
    }

    // Enviar uma solicitação do cliente para o servidor (sem payload, apenas a rota).
    static void SendRequestToServer(string routeName)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        // Ao enviar PARA o servidor, identity é null (servidor não tem PlayerIdentity).
        // guaranteed = true garante que a mensagem chegue.
        rpc.Send(null, MYMOD_RPC_ID, true, null);
    }
};
```

---

## Gerenciador Singleton (4_World)

Coloque em `Scripts/4_World/MyMod/MyModManager.c`.

Este é o cérebro central do seu mod no lado do servidor. Ele possui o config, processa RPC e executa atualizações periódicas.

```c
// ==========================================================================
// MyModManager.c - Gerenciador singleton do lado do servidor
// Camada 4_World: pode referenciar tipos de 3_Game (config, constantes, RPC).
//
// POR QUE um singleton:
//   O gerenciador precisa de exatamente uma instância que persista durante toda
//   a missão. Múltiplas instâncias causariam processamento duplicado e
//   estado conflitante. O padrão singleton garante uma instância
//   e fornece acesso global via GetInstance().
//
// CICLO DE VIDA:
//   1. MissionServer.OnInit() chama MyModManager.GetInstance().Init()
//   2. Gerenciador carrega config, registra RPCs, inicia timers
//   3. Gerenciador processa eventos durante o gameplay
//   4. MissionServer.OnMissionFinish() chama MyModManager.Cleanup()
//   5. Singleton é destruído, todas as referências são liberadas
// ==========================================================================

class MyModManager
{
    // A instância única. 'ref' significa que esta classe POSSUI o objeto.
    // Quando s_Instance é definido para null, o objeto é destruído.
    private static ref MyModManager s_Instance;

    // Configuração carregada do disco.
    // 'ref' porque o gerenciador possui o tempo de vida do objeto de config.
    protected ref MyModConfig m_Config;

    // Tempo acumulado desde o último tick de atualização (segundos).
    protected float m_TimeSinceUpdate;

    // Rastreia se Init() foi chamado com sucesso.
    protected bool m_Initialized;

    // -----------------------------------------------------------------------
    // Acesso ao singleton
    // -----------------------------------------------------------------------

    static MyModManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyModManager();
        }
        return s_Instance;
    }

    // Chame isso no fim da missão para destruir o singleton e liberar memória.
    // Definir s_Instance para null dispara o destrutor.
    static void Cleanup()
    {
        s_Instance = null;
    }

    // -----------------------------------------------------------------------
    // Ciclo de vida
    // -----------------------------------------------------------------------

    // Chamado uma vez pelo MissionServer.OnInit().
    void Init()
    {
        if (m_Initialized) return;

        // Carregar config do disco (ou criar defaults na primeira execução).
        m_Config = MyModConfig.Load();

        if (!m_Config.Enabled)
        {
            Print(MYMOD_TAG + " Mod is DISABLED in config. Skipping initialization.");
            return;
        }

        // Resetar o timer de atualização.
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

    // Chamado a cada frame pelo MissionServer.OnUpdate().
    // timeslice são os segundos decorridos desde o último frame.
    void OnUpdate(float timeslice)
    {
        if (!m_Initialized || !m_Config.Enabled) return;

        // Acumular tempo e processar apenas no intervalo configurado.
        // Isso previne executar lógica custosa a cada frame.
        m_TimeSinceUpdate += timeslice;
        if (m_TimeSinceUpdate < m_Config.UpdateInterval) return;
        m_TimeSinceUpdate = 0;

        // --- Lógica de atualização periódica vai aqui ---
        // Exemplo: iterar entidades rastreadas, verificar condições, etc.
        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Periodic update tick");
        }
    }

    // Chamado quando a missão termina (shutdown ou restart do servidor).
    void Shutdown()
    {
        if (!m_Initialized) return;

        Print(MYMOD_TAG + " Manager shutting down");

        // Salvar qualquer estado de runtime se necessário.
        // m_Config.Save();

        m_Initialized = false;
    }

    // -----------------------------------------------------------------------
    // Handlers de RPC
    // -----------------------------------------------------------------------

    // Chamado quando um cliente solicita dados da UI.
    // sender: o jogador que enviou a solicitação.
    // ctx: o stream de dados (já passou o nome da rota).
    void OnUIRequest(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " UI data requested by: " + sender.GetName());
        }

        // Construir dados de resposta e enviar de volta.
        // Em um mod real, você reuniria dados reais aqui.
        string responseData = "Items: " + m_Config.MaxItems.ToString();
        MyModRPCHelper.SendStringToClient(sender, MYMOD_RPC_UI_RESPONSE, responseData);
    }

    // Chamado quando um jogador conecta. Envia mensagem de boas-vindas se configurado.
    void OnPlayerConnected(PlayerIdentity identity)
    {
        if (!m_Initialized || !m_Config.Enabled) return;
        if (!identity) return;

        // Enviar mensagem de boas-vindas se configurado.
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
    // Accessors
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

## Handler de Eventos do Jogador (4_World)

Coloque em `Scripts/4_World/MyMod/MyModPlayerHandler.c`.

Isso usa o padrão `modded class` para fazer hook na entidade vanilla `PlayerBase` e detectar eventos de connect/disconnect.

```c
// ==========================================================================
// MyModPlayerHandler.c - Hooks de ciclo de vida do jogador
// Camada 4_World: modded PlayerBase para interceptar connect/disconnect.
//
// POR QUE modded class:
//   O DayZ não tem um callback de evento "jogador conectou". O padrão
//   é sobrescrever métodos no MissionServer (para novas conexões)
//   ou fazer hook no PlayerBase (para eventos de nível de entidade como morte).
//   Usamos modded PlayerBase aqui para demonstrar hooks de nível de entidade.
//
// IMPORTANTE:
//   Sempre chame super.NomeDoMetodo() primeiro nos overrides. Falhar ao fazer isso
//   quebra a cadeia de comportamento vanilla e outros mods que também sobrescrevem
//   o mesmo método.
// ==========================================================================

modded class PlayerBase
{
    // Rastrear se enviamos o evento de init para este jogador.
    // Isso previne processamento duplicado se Init() é chamado múltiplas vezes.
    protected bool m_MyModPlayerReady;

    // -----------------------------------------------------------------------
    // Chamado após a entidade do jogador ser totalmente criada e replicada.
    // No servidor, é onde o jogador está "pronto" para receber RPCs.
    // -----------------------------------------------------------------------
    override void Init()
    {
        super.Init();

        // Executar apenas no servidor. GetGame().IsServer() retorna true em
        // servidores dedicados e no host de um listen server.
        if (!GetGame().IsServer()) return;

        // Proteção contra init duplo.
        if (m_MyModPlayerReady) return;
        m_MyModPlayerReady = true;

        // Obter a identidade de rede do jogador.
        // No servidor, GetIdentity() retorna o objeto PlayerIdentity
        // contendo o nome do jogador, Steam ID (PlainId) e UID.
        PlayerIdentity identity = GetIdentity();
        if (!identity) return;

        // Notificar o gerenciador que um jogador conectou.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnPlayerConnected(identity);
        }
    }
};
```

---

## Hook de Missão: Servidor (5_Mission)

Coloque em `Scripts/5_Mission/MyMod/MyModMissionServer.c`.

Isso faz hook no `MissionServer` para inicializar e encerrar o mod no lado do servidor.

```c
// ==========================================================================
// MyModMissionServer.c - Hooks de missão do lado do servidor
// Camada 5_Mission: última a carregar, pode referenciar todas as camadas inferiores.
//
// POR QUE modded MissionServer:
//   MissionServer é o ponto de entrada para lógica do lado do servidor. Seu OnInit()
//   executa uma vez quando a missão inicia (boot do servidor). OnMissionFinish()
//   executa quando o servidor desliga ou reinicia. Estes são os lugares corretos
//   para configurar e encerrar os sistemas do seu mod.
//
// ORDEM DO CICLO DE VIDA:
//   1. Engine carrega todas as camadas de script (3_Game -> 4_World -> 5_Mission)
//   2. Engine cria instância do MissionServer
//   3. OnInit() é chamado -> inicialize seus sistemas aqui
//   4. OnMissionStart() é chamado -> mundo está pronto, jogadores podem entrar
//   5. OnUpdate() é chamado a cada frame
//   6. OnMissionFinish() é chamado -> servidor está desligando
// ==========================================================================

modded class MissionServer
{
    // -----------------------------------------------------------------------
    // Inicialização
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        // SEMPRE chame super primeiro. Outros mods na cadeia dependem disso.
        super.OnInit();

        // Inicializar o singleton do gerenciador. Isso carrega config do disco,
        // registra handlers de RPC e prepara o mod para operação.
        MyModManager.GetInstance().Init();

        Print(MYMOD_TAG + " Server mission initialized");
    }

    // -----------------------------------------------------------------------
    // Atualização por frame
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        // Delegar ao gerenciador. O gerenciador lida com sua própria
        // limitação de taxa (UpdateInterval do config) então isso é barato.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnUpdate(timeslice);
        }
    }

    // -----------------------------------------------------------------------
    // Conexão de jogador - dispatch de RPC do servidor
    // Chamado pelo engine quando um cliente envia um RPC ao servidor.
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Lidar apenas com nosso ID de RPC. Todos os outros RPCs passam.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Ler o nome da rota (primeira string escrita pelo remetente).
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Despachar para o handler correto baseado no nome da rota.
        MyModManager mgr = MyModManager.GetInstance();
        if (!mgr) return;

        if (routeName == MYMOD_RPC_UI_REQUEST)
        {
            mgr.OnUIRequest(sender, ctx);
        }
        // Adicione mais rotas aqui conforme seu mod cresce:
        // else if (routeName == MYMOD_RPC_SOME_OTHER)
        // {
        //     mgr.OnSomeOther(sender, ctx);
        // }
    }

    // -----------------------------------------------------------------------
    // Shutdown
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Encerrar o gerenciador antes de chamar super.
        // Isso garante que nossa limpeza execute antes que o engine
        // desmonte a infraestrutura da missão.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.Shutdown();
        }

        // Destruir o singleton para liberar memória e prevenir estado obsoleto
        // se a missão reiniciar (ex: restart do servidor sem sair do processo).
        MyModManager.Cleanup();

        Print(MYMOD_TAG + " Server mission finished");

        super.OnMissionFinish();
    }
};
```

---

## Hook de Missão: Cliente (5_Mission)

Coloque em `Scripts/5_Mission/MyMod/MyModMissionClient.c`.

Isso faz hook no `MissionGameplay` para inicialização do lado do cliente, tratamento de input e recebimento de RPC.

```c
// ==========================================================================
// MyModMissionClient.c - Hooks de missão do lado do cliente
// Camada 5_Mission.
//
// POR QUE MissionGameplay:
//   No cliente, MissionGameplay é a classe de missão ativa durante
//   o gameplay. Ela recebe OnUpdate() a cada frame (para polling de input)
//   e OnRPC() para mensagens do servidor recebidas.
//
// NOTA SOBRE LISTEN SERVERS:
//   Em um listen server (host + play), AMBOS MissionServer e
//   MissionGameplay estão ativos. Seu código de cliente vai rodar junto
//   com o código do servidor. Proteja com GetGame().IsClient() ou GetGame().IsServer()
//   se precisar de lógica específica por lado.
// ==========================================================================

modded class MissionGameplay
{
    // Referência ao painel de UI. null quando fechado.
    protected ref MyModUI m_MyModPanel;

    // Rastrear estado de inicialização.
    protected bool m_MyModInitialized;

    // -----------------------------------------------------------------------
    // Inicialização
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        m_MyModInitialized = true;

        Print(MYMOD_TAG + " Client mission initialized");
    }

    // -----------------------------------------------------------------------
    // Atualização por frame: polling de input e gerenciamento de UI
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_MyModInitialized) return;

        // Verificar o keybind definido no Inputs.xml.
        // GetUApi() retorna a API de UserActions.
        // GetInputByName() busca a ação pelo nome no Inputs.xml.
        // LocalPress() retorna true no frame em que a tecla é pressionada.
        UAInput panelInput = GetUApi().GetInputByName("UAMyModPanel");
        if (panelInput && panelInput.LocalPress())
        {
            TogglePanel();
        }
    }

    // -----------------------------------------------------------------------
    // Receptor de RPC: trata mensagens do servidor
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Lidar apenas com nosso ID de RPC.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Ler o nome da rota.
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Despachar baseado na rota.
        if (routeName == MYMOD_RPC_WELCOME)
        {
            string welcomeMsg;
            if (ctx.Read(welcomeMsg))
            {
                // Exibir a mensagem de boas-vindas ao jogador.
                // GetGame().GetMission().OnEvent() pode mostrar notificações,
                // ou você pode usar uma UI personalizada. Por simplicidade, usamos chat.
                GetGame().Chat(welcomeMsg, "");
                Print(MYMOD_TAG + " Welcome message: " + welcomeMsg);
            }
        }
        else if (routeName == MYMOD_RPC_UI_RESPONSE)
        {
            string responseData;
            if (ctx.Read(responseData))
            {
                // Atualizar o painel de UI com dados recebidos.
                if (m_MyModPanel)
                {
                    m_MyModPanel.SetData(responseData);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // Alternância do painel de UI
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
            // Abrir apenas se o jogador está vivo e nenhum outro menu está mostrando.
            PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
            if (!player || !player.IsAlive()) return;

            UIManager uiMgr = GetGame().GetUIManager();
            if (uiMgr && uiMgr.GetMenu()) return;

            m_MyModPanel = new MyModUI();
            m_MyModPanel.Open();

            // Solicitar dados frescos do servidor.
            MyModRPCHelper.SendRequestToServer(MYMOD_RPC_UI_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // Shutdown
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Fechar e destruir o painel de UI se aberto.
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

## Script do Painel de UI (5_Mission)

Coloque em `Scripts/5_Mission/MyMod/MyModUI.c`.

Este script controla o painel de UI definido no arquivo `.layout`. Ele encontra referências de widgets, popula-os com dados e lida com abrir/fechar.

```c
// ==========================================================================
// MyModUI.c - Controlador do painel de UI
// Camada 5_Mission: pode referenciar todas as camadas inferiores.
//
// COMO A UI DO DAYZ FUNCIONA:
//   1. Um arquivo .layout define a hierarquia de widgets (como HTML).
//   2. Uma classe de script carrega o layout, encontra widgets pelo nome e
//      manipula-os (definir texto, mostrar/ocultar, responder a cliques).
//   3. O script mostra/oculta o widget raiz e gerencia o foco de input.
//
// CICLO DE VIDA DO WIDGET:
//   GetGame().GetWorkspace().CreateWidgets() carrega o arquivo de layout e
//   retorna o widget raiz. Você então usa FindAnyWidget() para obter
//   referências a widgets filhos nomeados. Quando terminar, chame widget.Unlink()
//   para destruir toda a árvore de widgets.
// ==========================================================================

class MyModUI
{
    // Widget raiz do painel (carregado do .layout).
    protected ref Widget m_Root;

    // Widgets filhos nomeados.
    protected TextWidget m_TitleText;
    protected TextWidget m_DataText;
    protected TextWidget m_VersionText;
    protected ButtonWidget m_CloseButton;

    // Rastreamento de estado.
    protected bool m_IsOpen;

    // -----------------------------------------------------------------------
    // Construtor: carregar o layout e encontrar referências de widgets
    // -----------------------------------------------------------------------
    void MyModUI()
    {
        // CreateWidgets carrega o arquivo .layout e instancia todos os widgets.
        // O caminho é relativo à raiz do mod (mesmo que caminhos no config.cpp).
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModPanel.layout"
        );

        // Inicialmente oculto até Open() ser chamado.
        if (m_Root)
        {
            m_Root.Show(false);

            // Encontrar widgets nomeados. Estes nomes DEVEM corresponder aos nomes
            // dos widgets no arquivo .layout exatamente (sensível a maiúsculas/minúsculas).
            m_TitleText   = TextWidget.Cast(m_Root.FindAnyWidget("TitleText"));
            m_DataText    = TextWidget.Cast(m_Root.FindAnyWidget("DataText"));
            m_VersionText = TextWidget.Cast(m_Root.FindAnyWidget("VersionText"));
            m_CloseButton = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));

            // Definir conteúdo estático.
            if (m_TitleText)
                m_TitleText.SetText("My Professional Mod");

            if (m_VersionText)
                m_VersionText.SetText("v" + MYMOD_VERSION);
        }
    }

    // -----------------------------------------------------------------------
    // Open: mostrar o painel e capturar input
    // -----------------------------------------------------------------------
    void Open()
    {
        if (!m_Root) return;

        m_Root.Show(true);
        m_IsOpen = true;

        // Travar controles do jogador para que WASD não mova o personagem
        // enquanto o painel está aberto. Isso mostra um cursor.
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print(MYMOD_TAG + " UI panel opened");
    }

    // -----------------------------------------------------------------------
    // Close: ocultar o painel e liberar input
    // -----------------------------------------------------------------------
    void Close()
    {
        if (!m_Root) return;

        m_Root.Show(false);
        m_IsOpen = false;

        // Reabilitar controles do jogador.
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print(MYMOD_TAG + " UI panel closed");
    }

    // -----------------------------------------------------------------------
    // Atualização de dados: chamado quando o servidor envia dados da UI
    // -----------------------------------------------------------------------
    void SetData(string data)
    {
        if (m_DataText)
        {
            m_DataText.SetText(data);
        }
    }

    // -----------------------------------------------------------------------
    // Consulta de estado
    // -----------------------------------------------------------------------
    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -----------------------------------------------------------------------
    // Destrutor: limpar a árvore de widgets
    // -----------------------------------------------------------------------
    void ~MyModUI()
    {
        // Unlink destrói o widget raiz e todos os seus filhos.
        // Isso libera a memória usada pela árvore de widgets.
        if (m_Root)
        {
            m_Root.Unlink();
        }
    }
};
```

---

## Arquivo de Layout

Coloque em `Scripts/GUI/layouts/MyModPanel.layout`.

Isso define a estrutura visual do painel de UI. Layouts do DayZ usam um formato de texto personalizado (não XML).

```
// ==========================================================================
// MyModPanel.layout - Estrutura do painel de UI
//
// REGRAS DE DIMENSIONAMENTO:
//   hexactsize 1 + vexactsize 1 = tamanho é em pixels (ex: size 400 300)
//   hexactsize 0 + vexactsize 0 = tamanho é proporcional (0.0 a 1.0)
//   halign/valign controlam ponto de âncora:
//     left_ref/top_ref     = ancorado à borda esquerda/superior do pai
//     center_ref           = centralizado no pai
//     right_ref/bottom_ref = ancorado à borda direita/inferior do pai
//
// IMPORTANTE:
//   - Nunca use tamanhos negativos. Use alinhamento e posição em vez disso.
//   - Nomes de widgets devem corresponder às chamadas FindAnyWidget() no script exatamente.
//   - 'ignorepointer 1' significa que o widget não recebe cliques do mouse.
//   - 'scriptclass' vincula um widget a uma classe de script para tratamento de eventos.
// ==========================================================================

// Painel raiz: centralizado na tela, 400x300 pixels, fundo semitransparente.
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
  // Barra de título: largura total, 36px de altura, no topo.
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 36
   hexactpos 1
   vexactpos 1
   hexactsize 0
   vexactsize 1
   color 0.15 0.15 0.18 1
   {
    // Texto do título: alinhado à esquerda com padding.
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
    // Texto da versão: lado direito da barra de título.
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
  // Área de conteúdo: abaixo da barra de título, preenche o espaço restante.
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
    // Texto de dados: onde os dados do servidor são exibidos.
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
  // Botão fechar: canto inferior direito.
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

Coloque em `Scripts/stringtable.csv`.

Isso fornece localização para todo texto voltado ao jogador. O engine lê a coluna correspondente ao idioma do jogo do jogador. A coluna `original` é o fallback.

O DayZ suporta 13 colunas de idioma. Cada linha deve ter todas as 13 colunas (use o texto em inglês como placeholder para idiomas que você não traduzir).

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod",
"STR_MYMOD_INPUT_PANEL","Open Panel","Open Panel","Otevrit Panel","Panel offnen","Otkryt Panel","Otworz Panel","Panel megnyitasa","Apri Pannello","Abrir Panel","Ouvrir Panneau","Open Panel","Open Panel","Abrir Painel","Open Panel",
"STR_MYMOD_TITLE","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod",
"STR_MYMOD_CLOSE","Close","Close","Zavrit","Schliessen","Zakryt","Zamknij","Bezaras","Chiudi","Cerrar","Fermer","Close","Close","Fechar","Close",
"STR_MYMOD_WELCOME","Welcome!","Welcome!","Vitejte!","Willkommen!","Dobro pozhalovat!","Witaj!","Udvozoljuk!","Benvenuto!","Bienvenido!","Bienvenue!","Welcome!","Welcome!","Bem-vindo!","Welcome!",
```

**Importante:** Cada linha deve terminar com uma vírgula após a última coluna de idioma. Isso é uma exigência do parser CSV do DayZ.

---

## Inputs.xml

Coloque em `Scripts/Inputs.xml`.

Isso define keybinds personalizados que aparecem no menu Opções > Controles do jogo. O campo `inputs` no CfgMods do `config.cpp` deve apontar para este arquivo.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<!--
    Inputs.xml - Definições de keybind personalizados

    ESTRUTURA:
    - <actions>:  declara nomes de ações de input e suas strings de exibição
    - <sorting>:  agrupa ações sob uma categoria no menu de Controles
    - <preset>:   define a tecla padrão

    CONVENÇÃO DE NOMES:
    - Nomes de ações começam com "UA" (User Action) seguido do prefixo do seu mod.
    - O atributo "loc" referencia uma chave de string do stringtable.csv.

    NOMES DE TECLAS:
    - Teclado: kA até kZ, k0-k9, kInsert, kHome, kEnd, kDelete,
      kNumpad0-kNumpad9, kF1-kF12, kLControl, kRControl, kLShift, kRShift,
      kLAlt, kRAlt, kSpace, kReturn, kBack, kTab, kEscape
    - Mouse: mouse1 (esquerdo), mouse2 (direito), mouse3 (meio)
    - Teclas combo: use o elemento <combo> com múltiplos filhos <btn>
-->
<modded_inputs>
    <inputs>
        <!-- Declarar a ação de input. -->
        <actions>
            <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
        </actions>

        <!-- Agrupar sob uma categoria em Opções > Controles. -->
        <!-- O "name" é um ID interno; "loc" é o nome de exibição do stringtable. -->
        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModPanel"/>
        </sorting>
    </inputs>

    <!-- Preset de tecla padrão. Jogadores podem remapear em Opções > Controles. -->
    <preset>
        <!-- Vincular à tecla Home por padrão. -->
        <input name="UAMyModPanel">
            <btn name="kHome"/>
        </input>

        <!--
        EXEMPLO DE TECLA COMBO (descomente para usar):
        Isso vincularia a Ctrl+H em vez de uma tecla única.
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

## Script de Build

Coloque em `build.bat` na raiz do mod.

Este arquivo batch automatiza o empacotamento PBO usando o Addon Builder do DayZ Tools.

```batch
@echo off
REM ==========================================================================
REM build.bat - Empacotamento PBO automatizado para MyProfessionalMod
REM
REM O QUE ISSO FAZ:
REM   1. Empacota a pasta Scripts/ em um arquivo PBO
REM   2. Coloca o PBO na pasta distribuível @mod
REM   3. Copia mod.cpp para a pasta distribuível
REM
REM PRÉ-REQUISITOS:
REM   - DayZ Tools instalado via Steam
REM   - Fonte do mod em P:\MyProfessionalMod\
REM
REM USO:
REM   Dê duplo clique neste arquivo ou execute pela linha de comando: build.bat
REM ==========================================================================

REM --- Configuração: atualize estes caminhos para corresponder à sua configuração ---

REM Caminho para DayZ Tools (verifique o caminho da sua biblioteca Steam).
set DAYZ_TOOLS=C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools

REM Pasta fonte: o diretório Scripts que é empacotado no PBO.
set SOURCE=P:\MyProfessionalMod\Scripts

REM Pasta de saída: onde o PBO empacotado vai.
set OUTPUT=P:\@MyProfessionalMod\addons

REM Prefixo: o caminho virtual dentro do PBO. Deve corresponder aos caminhos
REM no config.cpp (ex: "MyProfessionalMod/Scripts/3_Game" deve resolver).
set PREFIX=MyProfessionalMod\Scripts

REM --- Passos do Build ---

echo ============================================
echo  Building MyProfessionalMod
echo ============================================

REM Criar diretório de saída se não existe.
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

REM Executar Addon Builder.
REM   -clear  = remover PBO antigo antes de empacotar
REM   -prefix = definir o prefixo do PBO (necessário para caminhos de script resolverem)
echo Packing PBO...
"%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe" "%SOURCE%" "%OUTPUT%" -prefix=%PREFIX% -clear

REM Verificar se Addon Builder teve sucesso.
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

REM Copiar mod.cpp para a pasta distribuível.
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

## Guia de Personalização

Quando usar este template para seu próprio mod, você precisa renomear cada ocorrência dos nomes placeholder. Aqui está um checklist completo.

### Passo 1: Escolha Seus Nomes

Decida estes identificadores antes de fazer qualquer edição:

| Identificador | Exemplo | Regras |
|------------|---------|-------|
| **Nome da pasta do mod** | `MyBountySystem` | Sem espaços, PascalCase ou underscores |
| **Nome de exibição** | `"My Bounty System"` | Legível por humanos, para mod.cpp e config.cpp |
| **Classe CfgPatches** | `MyBountySystem_Scripts` | Deve ser globalmente único entre todos os mods |
| **Classe CfgMods** | `MyBountySystem` | Identificador interno do engine |
| **Prefixo de script** | `MyBounty` | Prefixo curto para classes: `MyBountyManager`, `MyBountyConfig` |
| **Constante de tag** | `MYBOUNTY_TAG` | Para mensagens de log: `"[MyBounty]"` |
| **Define do preprocessador** | `MYBOUNTYSYSTEM` | Para detecção entre mods com `#ifdef` |
| **ID do RPC** | `58432` | Número único de 5 dígitos, não usado por outros mods |
| **Nome da ação de input** | `UAMyBountyPanel` | Começa com `UA`, único |

### Passo 2: Renomear Arquivos e Pastas

Renomeie cada arquivo e pasta que contém "MyMod" ou "MyProfessionalMod":

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

### Passo 3: Buscar e Substituir em Cada Arquivo

Realize estas substituições **em ordem** (strings mais longas primeiro para evitar correspondências parciais):

| Buscar | Substituir | Arquivos Afetados |
|------|---------|----------------|
| `MyProfessionalMod` | `MyBountySystem` | config.cpp, mod.cpp, build.bat, script de UI |
| `MyModManager` | `MyBountyManager` | Gerenciador, hooks de missão, handler do jogador |
| `MyModConfig` | `MyBountyConfig` | Classe de config, gerenciador |
| `MyModConstants` | `MyBountyConstants` | (apenas nome do arquivo) |
| `MyModRPCHelper` | `MyBountyRPCHelper` | Helper de RPC, hooks de missão |
| `MyModUI` | `MyBountyUI` | Script de UI, hook de missão cliente |
| `MyModPanel` | `MyBountyPanel` | Arquivo de layout, script de UI |
| `MyMod_Scripts` | `MyBountySystem_Scripts` | config.cpp CfgPatches |
| `MYMOD_RPC_ID` | `MYBOUNTY_RPC_ID` | Constantes, RPC, hooks de missão |
| `MYMOD_RPC_` | `MYBOUNTY_RPC_` | Todas as constantes de rotas RPC |
| `MYMOD_TAG` | `MYBOUNTY_TAG` | Constantes, todos os arquivos usando a tag de log |
| `MYMOD_CONFIG` | `MYBOUNTY_CONFIG` | Constantes, classe de config |
| `MYMOD_VERSION` | `MYBOUNTY_VERSION` | Constantes, script de UI |
| `MYMOD` | `MYBOUNTYSYSTEM` | config.cpp defines[] |
| `MyMod` | `MyBounty` | config.cpp classe CfgMods, strings de rotas RPC |
| `My Mod` | `My Bounty System` | Strings em layouts, stringtable |
| `mymod` | `mybounty` | Inputs.xml nome de sorting |
| `STR_MYMOD_` | `STR_MYBOUNTY_` | stringtable.csv, Inputs.xml |
| `UAMyMod` | `UAMyBounty` | Inputs.xml, hook de missão cliente |
| `m_MyMod` | `m_MyBounty` | Variáveis membro do hook de missão cliente |
| `74291` | `58432` | ID do RPC (seu número único escolhido) |

### Passo 4: Verificar

Após renomear, faça uma busca em todo o projeto por "MyMod" e "MyProfessionalMod" para detectar qualquer coisa que você tenha perdido. Então compile e teste:

```batch
DayZDiag_x64.exe -mod=P:\MyBountySystem -filePatching
```

Verifique o log de script pela sua tag (ex: `[MyBounty]`) para confirmar que tudo carregou.

---

## Guia de Expansão de Recursos

Uma vez que seu mod está rodando, aqui está como adicionar recursos comuns.

### Adicionando um Novo Endpoint de RPC

**1. Defina a constante de rota** em `MyModRPC.c` (3_Game):

```c
const string MYMOD_RPC_BOUNTY_SET = "MyMod:BountySet";
```

**2. Adicione o handler no servidor** em `MyModManager.c` (4_World):

```c
void OnBountySet(PlayerIdentity sender, ParamsReadContext ctx)
{
    // Ler parâmetros escritos pelo cliente.
    string targetName;
    int bountyAmount;
    if (!ctx.Read(targetName)) return;
    if (!ctx.Read(bountyAmount)) return;

    Print(MYMOD_TAG + " Bounty set on " + targetName + ": " + bountyAmount.ToString());
    // ... sua lógica aqui ...
}
```

**3. Adicione o caso de dispatch** em `MyModMissionServer.c` (5_Mission), dentro de `OnRPC()`:

```c
else if (routeName == MYMOD_RPC_BOUNTY_SET)
{
    mgr.OnBountySet(sender, ctx);
}
```

**4. Envie do cliente** (onde quer que a ação seja acionada):

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(MYMOD_RPC_BOUNTY_SET);
rpc.Write("PlayerName");
rpc.Write(5000);
rpc.Send(null, MYMOD_RPC_ID, true, null);
```

### Adicionando um Novo Campo de Config

**1. Adicione o campo** em `MyModConfig.c` com um valor default:

```c
// Valor mínimo de recompensa que jogadores podem definir.
int MinBountyAmount = 100;
```

Isso é tudo. O serializador JSON detecta campos públicos automaticamente. Arquivos de config existentes no disco usarão o valor default para o novo campo até que o admin edite e salve.

**2. Referencie-o** no gerenciador:

```c
if (bountyAmount < m_Config.MinBountyAmount)
{
    // Rejeitar: muito baixo.
    return;
}
```

### Adicionando um Novo Painel de UI

**1. Crie o layout** em `Scripts/GUI/layouts/MyModBountyList.layout`:

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

**2. Crie o script** em `Scripts/5_Mission/MyMod/MyModBountyListUI.c`:

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

### Adicionando um Novo Keybind

**1. Adicione a ação** em `Inputs.xml`:

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

**2. Adicione o binding padrão** na seção `<preset>`:

```xml
<input name="UAMyModBountyList">
    <btn name="kEnd"/>
</input>
```

**3. Adicione a localização** em `stringtable.csv`:

```csv
"STR_MYMOD_INPUT_BOUNTYLIST","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List",
```

**4. Faça polling do input** em `MyModMissionClient.c`:

```c
UAInput bountyInput = GetUApi().GetInputByName("UAMyModBountyList");
if (bountyInput && bountyInput.LocalPress())
{
    ToggleBountyList();
}
```

### Adicionando uma Nova Entrada no stringtable

**1. Adicione a linha** em `stringtable.csv`. Cada linha precisa de todas as 13 colunas de idioma mais uma vírgula final:

```csv
"STR_MYMOD_BOUNTY_PLACED","Bounty placed!","Bounty placed!","Odměna vypsána!","Kopfgeld gesetzt!","Награда назначена!","Nagroda wyznaczona!","Fejpénz kiírva!","Taglia piazzata!","Recompensa puesta!","Prime placée!","Bounty placed!","Bounty placed!","Recompensa colocada!","Bounty placed!",
```

**2. Use-a** no código de script:

```c
// Widget.SetText() NÃO resolve automaticamente chaves do stringtable.
// Você deve usar Widget.SetText() com a string resolvida:
string localizedText = Widget.TranslateString("#STR_MYMOD_BOUNTY_PLACED");
myTextWidget.SetText(localizedText);
```

Ou em um arquivo `.layout`, o engine resolve chaves `#STR_` automaticamente:

```
text "#STR_MYMOD_BOUNTY_PLACED"
```

---

## Próximos Passos

Com este template profissional rodando, você pode:

1. **Estudar mods de produção** -- Leia o [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) e o código fonte do `StarDZ_Core` para padrões do mundo real em escala.
2. **Adicionar itens personalizados** -- Siga o [Capítulo 8.2: Criando um Item Personalizado](02-custom-item.md) e integre-os com seu gerenciador.
3. **Construir um painel de admin** -- Siga o [Capítulo 8.3: Construindo um Painel de Admin](03-admin-panel.md) usando seu sistema de config.
4. **Adicionar um HUD overlay** -- Siga o [Capítulo 8.8: Construindo um HUD Overlay](08-hud-overlay.md) para elementos de UI sempre visíveis.
5. **Publicar na Workshop** -- Siga o [Capítulo 8.7: Publicando na Workshop](07-publishing-workshop.md) quando seu mod estiver pronto.
6. **Aprender debugging** -- Leia o [Capítulo 8.6: Debugging e Testes](06-debugging-testing.md) para análise de logs e solução de problemas.

---

**Anterior:** [Capítulo 8.8: Construindo um HUD Overlay](08-hud-overlay.md) | [Início](../README.md)
