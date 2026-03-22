# Chapter 7.4: Config Persistence

[Home](../../README.md) | [<< Previous: RPC Patterns](03-rpc-patterns.md) | **Config Persistence** | [Next: Permission Systems >>](05-permissions.md)

---

## Introdução

Quase todo mod DayZ precisa salvar e carregar dados de configuração: configurações do servidor, tabelas de spawn, listas de ban, dados de jogador, localizações de teleporte. A engine fornece `JsonFileLoader` para serialização JSON simples e I/O de arquivo bruto (`FileHandle`, `FPrintln`) para todo o resto. Mods profissionais adicionam versionamento de config e auto-migração por cima.

Este capítulo cobre os padrões standard para persistência de config, desde JSON load/save básico até sistemas de migração versionada, gerenciamento de diretórios e timers de auto-save.

---

## Padrão JsonFileLoader

`JsonFileLoader` é o serializador integrado da engine. Ele converte entre objetos Enforce Script e arquivos JSON usando reflexão --- lê os campos públicos da sua classe e mapeia para chaves JSON automaticamente.

### Cuidado Crítico

**`JsonFileLoader<T>.JsonLoadFile()` e `JsonFileLoader<T>.JsonSaveFile()` retornam `void`.** Você não pode verificar o valor de retorno. Não pode atribuir a um `bool`. Não pode usá-los em uma condição `if`. Este é um dos erros mais comuns em modding DayZ.

```c
// ERRADO — não vai compilar
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// ERRADO — não vai compilar
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// CORRETO — chamar e depois verificar o estado do objeto
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
if (config.m_ServerName != "")
{
    // Dados carregados com sucesso
}
```

### Load/Save Básico

```c
// Classe de dados — campos públicos são serializados de/para JSON
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
            // Primeira execução: salvar padrões
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### O que é Serializado

`JsonFileLoader` serializa **todos os campos públicos** do objeto. Ele não serializa:
- Campos privados ou protegidos
- Métodos
- Campos estáticos
- Campos transientes/apenas runtime (não existe atributo `[NonSerialized]` --- use modificadores de acesso)

### Tipos de Campo Suportados

| Tipo | Representação JSON |
|------|-------------------|
| `int` | Número |
| `float` | Número |
| `bool` | `true` / `false` |
| `string` | String |
| `vector` | Array de 3 números |
| `array<T>` | Array JSON |
| `map<string, T>` | Objeto JSON (apenas chaves string) |
| Classe aninhada | Objeto JSON aninhado |

---

## O Caminho $profile

DayZ fornece o prefixo de caminho `$profile:`, que resolve para o diretório de perfil do servidor (tipicamente a pasta contendo `DayZServer_x64.exe`, ou o caminho de perfil especificado com `-profiles=`).

```c
// Estes resolvem para o diretório de perfil:
"$profile:MyMod/config.json"       // → C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // → C:/DayZServer/MyMod/Players/data.json
```

### Sempre Use $profile

Nunca use caminhos absolutos. Nunca use caminhos relativos. Sempre use `$profile:` para qualquer arquivo que seu mod cria ou lê em runtime.

### Estrutura Convencional de Diretórios

A maioria dos mods segue esta convenção:

```
$profile:
  └── YourModName/
      ├── Config.json          (config principal do servidor)
      ├── Permissions.json     (permissões admin)
      ├── Logs/
      │   └── 2025-01-15.log   (arquivos de log diários)
      └── Players/
          ├── 76561198xxxxx.json
          └── 76561198yyyyy.json
```

---

## Criação de Diretórios

Antes de escrever um arquivo, você deve garantir que seu diretório pai existe. DayZ não auto-cria diretórios.

### Importante: MakeDirectory Não é Recursivo

`MakeDirectory` cria apenas o diretório final no caminho. Se o pai não existir, falha silenciosamente. Você deve criar cada nível:

```c
// ERRADO: Pai "MyMod" ainda não existe
MakeDirectory("$profile:MyMod/Data/Players");  // Falha silenciosamente

// CORRETO: Criar cada nível
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

---

## Versionamento e Migração de Config

Conforme seu mod evolui, estruturas de config mudam. Sem versionamento, usuários com arquivos de config antigos vão silenciosamente obter valores errados ou crashar.

### O Campo de Versão

Toda classe de config deve ter um campo inteiro de versão:

```c
class MyModConfig
{
    int ConfigVersion = 5;  // Incrementar quando a estrutura mudar
    // ...
};
```

### Migração ao Carregar

Ao carregar uma config, compare a versão no disco com a versão atual do código. Se diferirem, rode migrações:

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // Tem padrões atuais

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // Re-salvar com versão atualizada
        }
    }
    else
    {
        SaveConfig(config);  // Primeira execução: escrever padrões
    }

    m_Config = config;
}
```

---

## Timers de Auto-Save

Para configs que mudam em runtime (edições admin, acúmulo de dados de jogador), implemente um timer de auto-save para prevenir perda de dados em crashes.

### Auto-Save Baseado em Timer

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5 minutos
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // Dados mudaram desde o último save?

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
        // Sempre salvar no shutdown, mesmo se o timer não disparou
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

---

## Melhores Práticas

1. **Use `$profile:` para todos os caminhos de arquivo.** Nunca hardcode caminhos absolutos.
2. **Crie diretórios antes de escrever arquivos.** Verifique com `FileExist()`, crie com `MakeDirectory()`, um nível por vez.
3. **Sempre forneça valores padrão no construtor ou inicializadores de campo.** Isso garante que configs de primeira execução sejam sensatos.
4. **Versione suas configs desde o primeiro dia.** Adicionar um campo `ConfigVersion` custa nada e economiza horas de debug depois.
5. **Separe classes de dados de config de classes manager.** A classe de dados é um container burro; o manager cuida da lógica de load/save/sync.
6. **Use auto-save com flag dirty.** Não escreva no disco toda vez que um valor muda --- agrupe escritas em um timer.
7. **Salve no mission finish.** O timer de auto-save é uma rede de segurança, não o save principal. Sempre salve durante `OnMissionFinish()`.
8. **Defina constantes de caminho em um lugar.** Uma classe `MyModConst` com todos os caminhos previne duplicação de strings.
9. **Faça log de operações de load/save.** Ao depurar problemas de config, uma linha de log dizendo "Loaded config v3 from $profile:MyMod/Config.json" é inestimável.
10. **Teste com um arquivo de config deletado.** Seu mod deve lidar graciosamente com primeira execução: criar diretórios, escrever padrões, fazer log do que fez.

---

## Compatibilidade & Impacto

- **Multi-Mod:** Cada mod escreve em seu próprio diretório `$profile:NomeDoMod/`. Conflitos só acontecem se dois mods usam o mesmo nome de diretório. Use um prefixo único e reconhecível para a pasta do seu mod.
- **Ordem de Carregamento:** Carregamento de config acontece em `OnInit` ou `OnMissionStart`, ambos controlados pelo ciclo de vida do próprio mod. Sem problemas de ordem de carregamento cross-mod a menos que dois mods tentem ler/escrever o mesmo arquivo (o que nunca devem fazer).
- **Listen Server:** Arquivos de config são apenas server-side (`$profile:` resolve no servidor). Em listen servers, código client-side pode tecnicamente acessar `$profile:`, mas configs devem ser carregadas apenas por módulos server para evitar ambiguidade.
- **Performance:** `JsonFileLoader` é síncrono e bloqueia a thread principal. Para configs grandes (100+ KB), carregue durante `OnInit` (antes do gameplay começar). Timers de auto-save previnem escritas repetidas; o padrão dirty-flag garante que I/O de disco só aconteça quando dados realmente mudaram.
- **Migração:** Adicionar novos campos a uma classe de config é seguro --- `JsonFileLoader` ignora chaves JSON ausentes e mantém o valor padrão da classe. Remover ou renomear campos requer um passo de migração versionada para evitar perda silenciosa de dados.

---

## Teoria vs Prática

| Livro-Texto Diz | Realidade do DayZ |
|-----------------|-------------------|
| Use I/O de arquivo async para evitar bloqueio | Enforce Script não tem I/O de arquivo async; todas as leituras/escritas são síncronas. Carregue no startup, salve em timers. |
| Valide JSON com um schema | Nenhuma validação de schema JSON existe; valide campos em `OnAfterLoad()` ou com cláusulas de guarda após o carregamento. |
| Use um banco de dados para dados estruturados | Sem acesso a banco de dados do Enforce Script; arquivos JSON em `$profile:` são o único mecanismo de persistência. |

---

[<< Anterior: Padrões RPC](03-rpc-patterns.md) | [Início](../../README.md) | [Próximo: Sistemas de Permissão >>](05-permissions.md)
