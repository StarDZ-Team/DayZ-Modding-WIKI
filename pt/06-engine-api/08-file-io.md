# Chapter 6.8: File I/O & JSON

[Home](../README.md) | [<< Previous: Timers & CallQueue](07-timers.md) | **File I/O & JSON** | [Next: Networking & RPC >>](09-networking.md)

---

## Introdução

DayZ fornece operações de I/O de arquivo para leitura e escrita de arquivos de texto, serialização/desserialização JSON, gerenciamento de diretórios e enumeração de arquivos. Todas as operações de arquivo usam prefixos de caminho especiais (`$profile:`, `$saves:`, `$mission:`) ao invés de caminhos absolutos do sistema de arquivos. Este capítulo cobre todas as operações de arquivo disponíveis em Enforce Script.

---

## Prefixos de Caminho

| Prefixo | Localização | Gravável |
|--------|----------|----------|
| `$profile:` | Diretório de perfil do servidor/cliente (ex: `DayZServer/profiles/`) | Sim |
| `$saves:` | Diretório de saves | Sim |
| `$mission:` | Pasta da missão atual (ex: `mpmissions/dayzOffline.chernarusplus/`) | Tipicamente leitura |
| `$CurrentDir:` | Diretório de trabalho atual | Depende |
| Sem prefixo | Relativo à raiz do jogo | Apenas leitura |

> **Importante:** A maioria das operações de escrita são restritas a `$profile:` e `$saves:`. Tentar escrever em outro lugar pode falhar silenciosamente.

---

## Verificação de Existência de Arquivo

```c
proto bool FileExist(string name);
```

Retorna `true` se o arquivo existe no caminho dado.

**Exemplo:**

```c
if (FileExist("$profile:MyMod/config.json"))
{
    Print("Config file found");
}
else
{
    Print("Config file not found, creating defaults");
}
```

---

## Abrindo e Fechando Arquivos

```c
proto FileHandle OpenFile(string name, FileMode mode);
proto void CloseFile(FileHandle file);
```

### Enum FileMode

```c
enum FileMode
{
    READ,     // Abrir para leitura (arquivo deve existir)
    WRITE,    // Abrir para escrita (cria novo / sobrescreve existente)
    APPEND    // Abrir para append (cria se não existir)
}
```

`FileHandle` é um handle inteiro. Um valor de retorno `0` indica falha.

**Exemplo:**

```c
FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.WRITE);
if (fh != 0)
{
    // Arquivo aberto com sucesso
    // ... fazer trabalho ...
    CloseFile(fh);
}
```

> **Crítico:** Sempre chame `CloseFile()` quando terminar. Não fechar arquivos pode causar perda de dados e vazamentos de recursos.

---

## Escrevendo Arquivos

### FPrintln (Escrever Linha)

```c
proto void FPrintln(FileHandle file, void var);
```

Escreve o valor seguido de um caractere de nova linha.

### FPrint (Escrever Sem Nova Linha)

```c
proto void FPrint(FileHandle file, void var);
```

Escreve o valor sem nova linha no final.

**Exemplo --- escrever um arquivo de log:**

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

## Lendo Arquivos

### FGets (Ler Linha)

```c
proto int FGets(FileHandle file, string var);
```

Lê uma linha do arquivo em `var`. Retorna o número de caracteres lidos, ou `-1` no final do arquivo.

**Exemplo --- ler um arquivo linha por linha:**

```c
void ReadConfigFile()
{
    FileHandle fh = OpenFile("$profile:MyMod/settings.txt", FileMode.READ);
    if (fh != 0)
    {
        string line;
        while (FGets(fh, line) >= 0)
        {
            Print("Line: " + line);
            ProcessLine(line);
        }
        CloseFile(fh);
    }
}
```

### ReadFile (Leitura Binária Bruta)

```c
proto int ReadFile(FileHandle file, void param_array, int length);
```

Lê bytes brutos em um buffer. Usado para dados binários.

---

## Operações de Diretório

### MakeDirectory

```c
proto native bool MakeDirectory(string name);
```

Cria um diretório. Retorna `true` em caso de sucesso. Cria apenas o diretório final --- diretórios pai devem já existir.

**Exemplo --- garantir estrutura de diretórios:**

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

Deleta um arquivo. Só funciona nos diretórios `$profile:` e `$saves:`.

### CopyFile

```c
proto native bool CopyFile(string sourceName, string destName);
```

Copia um arquivo da origem para o destino.

**Exemplo:**

```c
// Backup antes de sobrescrever
if (FileExist("$profile:MyMod/config.json"))
{
    CopyFile("$profile:MyMod/config.json", "$profile:MyMod/config.json.bak");
}
```

---

## Enumeração de Arquivos (FindFile / FindNextFile)

Enumerar arquivos que correspondem a um padrão em um diretório.

```c
proto FindFileHandle FindFile(string pattern, out string fileName,
                               out FileAttr fileAttributes, FindFileFlags flags);
proto bool FindNextFile(FindFileHandle handle, out string fileName,
                         out FileAttr fileAttributes);
proto native void CloseFindFile(FindFileHandle handle);
```

### Enum FileAttr

```c
enum FileAttr
{
    DIRECTORY,   // Entrada é um diretório
    HIDDEN,      // Entrada é oculta
    READONLY,    // Entrada é somente leitura
    INVALID      // Entrada inválida
}
```

### Enum FindFileFlags

```c
enum FindFileFlags
{
    DIRECTORIES,  // Retornar apenas diretórios
    ARCHIVES,     // Retornar apenas arquivos
    ALL           // Retornar ambos
}
```

**Exemplo --- enumerar todos os arquivos JSON em um diretório:**

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
        // Processar primeiro resultado
        if (!(fileAttr & FileAttr.DIRECTORY))
        {
            Print("Found: " + fileName);
        }

        // Processar resultados restantes
        while (FindNextFile(handle, fileName, fileAttr))
        {
            if (!(fileAttr & FileAttr.DIRECTORY))
            {
                Print("Found: " + fileName);
            }
        }

        CloseFindFile(handle);
    }
}
```

> **Importante:** `FindFile` retorna apenas o nome do arquivo, não o caminho completo. Você deve adicionar o caminho do diretório ao processar os arquivos.

**Exemplo --- contar arquivos em um diretório:**

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

## JsonFileLoader (JSON Genérico)

**Arquivo:** `3_Game/tools/jsonfileloader.c` (173 linhas)

A forma recomendada de carregar e salvar dados JSON. Funciona com qualquer classe que tenha campos públicos.

### API Moderna (Preferida)

```c
class JsonFileLoader<Class T>
{
    // Carregar arquivo JSON no objeto
    static bool LoadFile(string filename, out T data, out string errorMessage);

    // Salvar objeto em arquivo JSON
    static bool SaveFile(string filename, T data, out string errorMessage);

    // Parsear string JSON no objeto
    static bool LoadData(string string_data, out T data, out string errorMessage);

    // Serializar objeto em string JSON
    static bool MakeData(T inputData, out string outputData,
                          out string errorMessage, bool prettyPrint = true);
}
```

Todos os métodos retornam `bool` --- `true` em caso de sucesso, `false` em caso de falha com o erro em `errorMessage`.

### API Legada (Deprecada)

```c
class JsonFileLoader<Class T>
{
    static void JsonLoadFile(string filename, out T data);    // Retorna void!
    static void JsonSaveFile(string filename, T data);
    static void JsonLoadData(string string_data, out T data);
    static string JsonMakeData(T data);
}
```

> **Cuidado Crítico:** `JsonLoadFile()` retorna `void`. Você NÃO PODE usá-lo em uma condição `if`:
> ```c
> // ERRADO - não vai compilar ou será sempre falso
> if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg)) { }
>
> // CORRETO - use o LoadFile() moderno que retorna bool
> if (JsonFileLoader<MyConfig>.LoadFile(path, cfg, error)) { }
> ```

### Requisitos da Classe de Dados

A classe alvo deve ter **campos públicos** com valores padrão. O serializador JSON mapeia nomes de campos diretamente para chaves JSON.

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 150.0;
    string ServerName = "My Server";
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

Isso produz o JSON:

```json
{
    "MaxPlayers": 60,
    "SpawnRadius": 150.0,
    "ServerName": "My Server",
    "EnablePVP": true,
    "AllowedItems": ["BandageDressing", "Canteen"],
    "ItemPrices": {}
}
```

### Exemplo Completo de Load/Save

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
            Save();  // Criar config padrão
            return;
        }

        string error;
        if (!JsonFileLoader<MyModConfig>.LoadFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Config load error: " + error);
            m_Config = new MyModConfig();  // Resetar para padrões
            Save();
        }
    }

    void Save()
    {
        string error;
        if (!JsonFileLoader<MyModConfig>.SaveFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Config save error: " + error);
        }
    }

    MyModConfig GetConfig()
    {
        return m_Config;
    }
}
```

---

## JsonSerializer (Uso Direto)

**Arquivo:** `3_Game/gameplay.c`

Para casos onde você precisa serializar/desserializar strings JSON diretamente sem operações de arquivo:

```c
class JsonSerializer : Serializer
{
    proto bool WriteToString(void variable_out, bool nice, out string result);
    proto bool ReadFromString(void variable_in, string jsonString, out string error);
}
```

**Exemplo:**

```c
MyConfig cfg = new MyConfig();
cfg.MaxPlayers = 100;

JsonSerializer js = new JsonSerializer();

// Serializar para string
string jsonOutput;
js.WriteToString(cfg, true, jsonOutput);  // true = pretty print
Print(jsonOutput);

// Desserializar de string
MyConfig parsed = new MyConfig();
string parseError;
js.ReadFromString(parsed, jsonOutput, parseError);
Print("MaxPlayers: " + parsed.MaxPlayers);
```

---

## Resumo

| Operação | Função | Notas |
|-----------|----------|-------|
| Verificar existência | `FileExist(path)` | Retorna bool |
| Abrir | `OpenFile(path, FileMode)` | Retorna handle (0 = falha) |
| Fechar | `CloseFile(handle)` | Sempre chamar quando terminar |
| Escrever linha | `FPrintln(handle, data)` | Com nova linha |
| Escrever | `FPrint(handle, data)` | Sem nova linha |
| Ler linha | `FGets(handle, out line)` | Retorna -1 no EOF |
| Criar dir | `MakeDirectory(path)` | Apenas um nível |
| Deletar | `DeleteFile(path)` | Apenas `$profile:` / `$saves:` |
| Copiar | `CopyFile(src, dst)` | -- |
| Encontrar arquivos | `FindFile(pattern, ...)` | Retorna handle, iterar com `FindNextFile` |
| JSON load | `JsonFileLoader<T>.LoadFile(path, data, error)` | API moderna, retorna bool |
| JSON save | `JsonFileLoader<T>.SaveFile(path, data, error)` | API moderna, retorna bool |
| JSON string | `JsonSerializer.WriteToString()` / `ReadFromString()` | Operações diretas com string |

| Conceito | Ponto-chave |
|---------|-----------|
| Prefixos de caminho | `$profile:` (gravável), `$mission:` (leitura), `$saves:` (gravável) |
| JsonLoadFile | **Retorna void** --- use `LoadFile()` (bool) ao invés |
| Classes de dados | Campos públicos com padrões, `ref` para arrays/maps |
| Sempre fechar | Todo `OpenFile` deve ter um `CloseFile` correspondente |
| FindFile | Retorna apenas nomes de arquivo, não caminhos completos |

---

[<< Anterior: Timers & CallQueue](07-timers.md) | **File I/O & JSON** | [Próximo: Networking & RPC >>](09-networking.md)
