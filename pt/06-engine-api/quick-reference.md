# Engine API Quick Reference

[Home](../README.md) | **Engine API Quick Reference**

---

## Indice

- [Metodos de Entidade](#metodos-de-entidade)
- [Saude e Dano](#saude-e-dano)
- [Verificacao de Tipo](#verificacao-de-tipo)
- [Inventario](#inventario)
- [Criacao e Exclusao de Entidades](#criacao-e-exclusao-de-entidades)
- [Metodos do Jogador](#metodos-do-jogador)
- [Metodos de Veiculo](#metodos-de-veiculo)
- [Metodos de Clima](#metodos-de-clima)
- [Metodos de E/S de Arquivo](#metodos-de-es-de-arquivo)
- [Metodos de Timer e CallQueue](#metodos-de-timer-e-callqueue)
- [Metodos de Criacao de Widget](#metodos-de-criacao-de-widget)
- [Metodos de RPC / Rede](#metodos-de-rpc--rede)
- [Constantes e Metodos Matematicos](#constantes-e-metodos-matematicos)
- [Metodos de Vetor](#metodos-de-vetor)
- [Funcoes Globais](#funcoes-globais)
- [Hooks de Mission](#hooks-de-mission)
- [Sistema de Acoes](#sistema-de-acoes)

---

## Metodos de Entidade

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

### Posicao e Orientacao (Object)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetPosition` | `vector GetPosition()` | Posicao no mundo |
| `SetPosition` | `void SetPosition(vector pos)` | Definir posicao no mundo |
| `GetOrientation` | `vector GetOrientation()` | Yaw, pitch, roll em graus |
| `SetOrientation` | `void SetOrientation(vector ori)` | Definir yaw, pitch, roll |
| `GetDirection` | `vector GetDirection()` | Vetor de direcao frontal |
| `SetDirection` | `void SetDirection(vector dir)` | Definir direcao frontal |
| `GetScale` | `float GetScale()` | Escala atual |
| `SetScale` | `void SetScale(float scale)` | Definir escala |

### Transformacao (IEntity)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetOrigin` | `vector GetOrigin()` | Posicao no mundo (nivel do motor) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Definir posicao no mundo (nivel do motor) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Rotacao como yaw/pitch/roll |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Matriz de transformacao 4x3 completa |
| `SetTransform` | `void SetTransform(vector mat[4])` | Definir transformacao completa |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Direcao local para mundo |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Ponto local para mundo |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Direcao mundo para local |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Ponto mundo para local |

### Hierarquia (IEntity)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Anexar filho a um osso |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Desanexar filho |
| `GetParent` | `IEntity GetParent()` | Entidade pai ou null |
| `GetChildren` | `IEntity GetChildren()` | Primeira entidade filha |
| `GetSibling` | `IEntity GetSibling()` | Proxima entidade irmao |

### Informacoes de Exibicao (Object)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetType` | `string GetType()` | Nome da classe de config (ex: `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Nome de exibicao localizado |
| `IsKindOf` | `bool IsKindOf(string type)` | Verificar heranca de config |

### Posicoes de Osso (Object)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Posicao do osso no espaco local |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Posicao do osso no espaco do modelo |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Posicao do osso no espaco do mundo |

### Acesso a Configuracao (Object)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Ler bool da config |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Ler int da config |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Ler float da config |
| `ConfigGetString` | `string ConfigGetString(string entry)` | Ler string da config |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | Ler array de strings |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Verificar se entrada de config existe |

---

## Saude e Dano

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Obter valor de saude |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Obter saude maxima |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Definir saude |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Definir para o maximo |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Adicionar saude |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Reduzir saude |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Habilitar/desabilitar dano |
| `GetAllowDamage` | `bool GetAllowDamage()` | Verificar se dano e permitido |
| `IsAlive` | `bool IsAlive()` | Verificacao de vivo (usar em EntityAI) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Aplicar dano (EntityAI) |

**Pares comuns zona/tipo:** `("", "Health")` global, `("", "Blood")` sangue do jogador, `("", "Shock")` choque do jogador, `("Engine", "Health")` motor do veiculo.

---

## Verificacao de Tipo

| Metodo | Classe | Descricao |
|--------|--------|-----------|
| `IsMan()` | Object | E um jogador? |
| `IsBuilding()` | Object | E um predio? |
| `IsTransport()` | Object | E um veiculo? |
| `IsDayZCreature()` | Object | E uma criatura (zumbi/animal)? |
| `IsKindOf(string)` | Object | Verificacao de heranca de config |
| `IsItemBase()` | EntityAI | E um item de inventario? |
| `IsWeapon()` | EntityAI | E uma arma? |
| `IsMagazine()` | EntityAI | E um carregador? |
| `IsClothing()` | EntityAI | E uma roupa? |
| `IsFood()` | EntityAI | E comida? |
| `Class.CastTo(out, obj)` | Class | Downcast seguro (retorna bool) |
| `ClassName.Cast(obj)` | Class | Cast inline (retorna null em caso de falha) |

---

## Inventario

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetInventory` | `GameInventory GetInventory()` | Obter componente de inventario (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Criar item no cargo |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Criar item no cargo |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Criar item como acessorio |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Listar todos os itens |
| `CountInventory` | `int CountInventory()` | Contar itens |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Verificar item |
| `AttachmentCount` | `int AttachmentCount()` | Numero de acessorios |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Obter acessorio por indice |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Obter acessorio por slot |

---

## Criacao e Exclusao de Entidades

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Criar entidade |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Criar com flags ECE |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Exclusao imediata no servidor |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Exclusao apenas no cliente |
| `Delete` | `void obj.Delete()` | Exclusao adiada (proximo frame) |

### Flags ECE Comuns

| Flag | Valor | Descricao |
|------|-------|-----------|
| `ECE_NONE` | `0` | Sem comportamento especial |
| `ECE_CREATEPHYSICS` | `1024` | Criar colisao |
| `ECE_INITAI` | `2048` | Inicializar IA |
| `ECE_EQUIP` | `24576` | Spawnar com acessorios + cargo |
| `ECE_PLACE_ON_SURFACE` | combinado | Fisica + caminho + trace |
| `ECE_LOCAL` | `1073741824` | Apenas cliente (nao replicado) |
| `ECE_NOLIFETIME` | `4194304` | Nao vai despawnar |
| `ECE_KEEPHEIGHT` | `524288` | Manter posicao Y |

---

## Metodos do Jogador

*Referencia completa: [Capitulo 6.1: Sistema de Entidades](01-entity-system.md)*

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Objeto de identidade do jogador |
| `GetIdentity().GetName()` | `string GetName()` | Nome de exibicao Steam/plataforma |
| `GetIdentity().GetId()` | `string GetId()` | ID unico BI |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | ID Steam64 |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | ID do jogador na sessao |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Item nas maos |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Veiculo sendo dirigido |
| `IsAlive` | `bool IsAlive()` | Verificacao de vivo |
| `IsUnconscious` | `bool IsUnconscious()` | Verificacao de inconsciente |
| `IsRestrained` | `bool IsRestrained()` | Verificacao de restrito |
| `IsInVehicle` | `bool IsInVehicle()` | Verificacao de dentro de veiculo |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Spawnar na frente do jogador |

---

## Metodos de Veiculo

*Referencia completa: [Capitulo 6.2: Sistema de Veiculos](02-vehicles.md)*

### Tripulacao (Transport)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `CrewSize` | `int CrewSize()` | Total de assentos |
| `CrewMember` | `Human CrewMember(int idx)` | Obter humano no assento |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Obter assento do humano |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Forcar ejecao do assento |
| `CrewDeath` | `void CrewDeath(int idx)` | Matar membro da tripulacao |

### Motor (Car)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `EngineIsOn` | `bool EngineIsOn()` | Motor ligado? |
| `EngineStart` | `void EngineStart()` | Ligar motor |
| `EngineStop` | `void EngineStop()` | Desligar motor |
| `EngineGetRPM` | `float EngineGetRPM()` | RPM atual |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | RPM de redline |
| `GetGear` | `int GetGear()` | Marcha atual |
| `GetSpeedometer` | `float GetSpeedometer()` | Velocidade em km/h |

### Fluidos (Car)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Capacidade maxima |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Nivel de preenchimento 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Adicionar fluido |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Remover fluido |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Drenar todo o fluido |

**Enum CarFluid:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Controles (Car)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = todos |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Entrada de direcao |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 acelerador |

---

## Metodos de Clima

*Referencia completa: [Capitulo 6.3: Sistema de Clima](03-weather.md)*

### Acesso

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Obter singleton de clima |

### Fenomenos (Weather)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Cobertura de nuvens |
| `GetRain` | `WeatherPhenomenon GetRain()` | Chuva |
| `GetFog` | `WeatherPhenomenon GetFog()` | Neblina |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Neve |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Velocidade do vento |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Direcao do vento |
| `GetWind` | `vector GetWind()` | Vetor de direcao do vento |
| `GetWindSpeed` | `float GetWindSpeed()` | Velocidade do vento m/s |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Configuracao de relampago |

### WeatherPhenomenon

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetActual` | `float GetActual()` | Valor interpolado atual |
| `GetForecast` | `float GetForecast()` | Valor alvo |
| `GetDuration` | `float GetDuration()` | Duracao restante (segundos) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Definir alvo (apenas servidor) |
| `SetLimits` | `void SetLimits(float min, float max)` | Limites de faixa de valor |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Limites de velocidade de mudanca |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Limites de magnitude de mudanca |

---

## Metodos de E/S de Arquivo

*Referencia completa: [Capitulo 6.8: E/S de Arquivo e JSON](08-file-io.md)*

### Prefixos de Caminho

| Prefixo | Localizacao | Gravavel |
|---------|-------------|----------|
| `$profile:` | Diretorio de perfil do servidor/cliente | Sim |
| `$saves:` | Diretorio de saves | Sim |
| `$mission:` | Pasta da missao atual | Geralmente leitura |
| `$CurrentDir:` | Diretorio de trabalho | Depende |

### Operacoes de Arquivo

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `FileExist` | `bool FileExist(string path)` | Verificar se arquivo existe |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Criar diretorio |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Abrir arquivo (0 = falha) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Fechar arquivo |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Escrever texto (sem quebra de linha) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Escrever texto + quebra de linha |
| `FGets` | `int FGets(FileHandle fh, string line)` | Ler uma linha |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Ler arquivo inteiro |
| `DeleteFile` | `bool DeleteFile(string path)` | Excluir arquivo |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Copiar arquivo |

### JSON (JsonFileLoader)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | Carregar JSON para objeto (**retorna void**) |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | Salvar objeto como JSON |

### Enum FileMode

| Valor | Descricao |
|-------|-----------|
| `FileMode.READ` | Abrir para leitura |
| `FileMode.WRITE` | Abrir para escrita (cria/sobrescreve) |
| `FileMode.APPEND` | Abrir para adicionar ao final |

---

## Metodos de Timer e CallQueue

*Referencia completa: [Capitulo 6.7: Timers e CallQueue](07-timers.md)*

### Acesso

| Expressao | Retorna | Descricao |
|-----------|---------|-----------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Fila de chamadas de gameplay |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | Fila de chamadas de sistema |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | Fila de chamadas de GUI |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Fila de atualizacao por frame |

### ScriptCallQueue

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Agendar chamada atrasada/repetida |
| `Call` | `void Call(func fn, param1..4)` | Executar no proximo frame |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Chamar metodo por nome de string |
| `Remove` | `void Remove(func fn)` | Cancelar chamada agendada |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Cancelar por nome de string |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Obter tempo restante do CallLater |

### Classe Timer

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Construtor |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Iniciar timer |
| `Stop` | `void Stop()` | Parar timer |
| `Pause` | `void Pause()` | Pausar timer |
| `Continue` | `void Continue()` | Retomar timer |
| `IsPaused` | `bool IsPaused()` | Timer pausado? |
| `IsRunning` | `bool IsRunning()` | Timer ativo? |
| `GetRemaining` | `float GetRemaining()` | Segundos restantes |

### ScriptInvoker

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Insert` | `void Insert(func fn)` | Registrar callback |
| `Remove` | `void Remove(func fn)` | Remover callback |
| `Invoke` | `void Invoke(params...)` | Disparar todos os callbacks |
| `Count` | `int Count()` | Numero de callbacks registrados |
| `Clear` | `void Clear()` | Remover todos os callbacks |

---

## Metodos de Criacao de Widget

*Referencia completa: [Capitulo 3.5: Criacao Programatica](../03-gui-system/05-programmatic-widgets.md)*

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Obter workspace da UI |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | Carregar arquivo .layout |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Encontrar filho por nome (recursivo) |
| `Show` | `void Show(bool show)` | Mostrar/ocultar widget |
| `SetText` | `void TextWidget.SetText(string text)` | Definir conteudo de texto |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Definir indice de imagem |
| `SetColor` | `void SetColor(int color)` | Definir cor do widget (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Definir transparencia 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Definir tamanho do widget |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Definir posicao do widget |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Resolucao da tela |
| `Destroy` | `void Widget.Destroy()` | Remover e destruir widget |

### Auxiliar de Cor ARGB

| Funcao | Assinatura | Descricao |
|--------|------------|-----------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Criar int de cor (0-255 cada) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Criar int de cor (0.0-1.0 cada) |

---

## Metodos de RPC / Rede

*Referencia completa: [Capitulo 6.9: Rede e RPC](09-networking.md)*

### Verificacoes de Ambiente

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `GetGame().IsServer()` | `bool IsServer()` | Verdadeiro no servidor / host listen-server |
| `GetGame().IsClient()` | `bool IsClient()` | Verdadeiro no cliente |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Verdadeiro em multiplayer |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | Verdadeiro apenas em servidor dedicado |

### ScriptRPC

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `ScriptRPC()` | `void ScriptRPC()` | Construtor |
| `Write` | `bool Write(void value)` | Serializar um valor (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | Enviar RPC |
| `Reset` | `void Reset()` | Limpar dados escritos |

### Recebimento (Override em Object)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | Handler de recebimento de RPC |

### ParamsReadContext

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Read` | `bool Read(out void value)` | Desserializar um valor (mesmos tipos que Write) |

### RPC Legado (CGame)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Enviar um unico objeto Param |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Enviar multiplos Params |

### ScriptInputUserData (Verificado por Entrada)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Verificar se a fila tem espaco |
| `Write` | `bool Write(void value)` | Serializar valor |
| `Send` | `void Send()` | Enviar para o servidor (apenas cliente) |

---

## Constantes e Metodos Matematicos

*Referencia completa: [Capitulo 1.7: Matematica e Vetores](../01-enforce-script/07-math-vectors.md)*

### Constantes

| Constante | Valor | Descricao |
|-----------|-------|-----------|
| `Math.PI` | `3.14159...` | Pi |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | Multiplicador de graus para radianos |
| `Math.RAD2DEG` | `57.2957...` | Multiplicador de radianos para graus |
| `int.MAX` | `2147483647` | Int maximo |
| `int.MIN` | `-2147483648` | Int minimo |
| `float.MAX` | `3.4028e+38` | Float maximo |
| `float.MIN` | `1.175e-38` | Float positivo minimo |

### Aleatorio

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Int aleatorio [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Int aleatorio [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Float aleatorio [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | Verdadeiro/falso aleatorio |

### Arredondamento

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Math.Round` | `float Round(float f)` | Arredondar para o mais proximo |
| `Math.Floor` | `float Floor(float f)` | Arredondar para baixo |
| `Math.Ceil` | `float Ceil(float f)` | Arredondar para cima |

### Limitacao e Interpolacao

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Limitar a uma faixa |
| `Math.Min` | `float Min(float a, float b)` | Minimo entre dois |
| `Math.Max` | `float Max(float a, float b)` | Maximo entre dois |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Interpolacao linear |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Interpolacao linear inversa |

### Absoluto e Potencia

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Valor absoluto (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Valor absoluto (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Potencia |
| `Math.Sqrt` | `float Sqrt(float f)` | Raiz quadrada |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Quadrado (f * f) |

### Trigonometria (Radianos)

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Math.Sin` | `float Sin(float rad)` | Seno |
| `Math.Cos` | `float Cos(float rad)` | Cosseno |
| `Math.Tan` | `float Tan(float rad)` | Tangente |
| `Math.Asin` | `float Asin(float val)` | Arco seno |
| `Math.Acos` | `float Acos(float val)` | Arco cosseno |
| `Math.Atan2` | `float Atan2(float y, float x)` | Angulo a partir de componentes |

### Amortecimento Suave

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Amortecimento suave em direcao ao alvo (como SmoothDamp do Unity) |

```c
// Uso do amortecimento suave
// val: valor atual, target: valor alvo, velocity: velocidade ref (persistida entre chamadas)
// smoothTime: tempo de suavizacao, maxSpeed: limite de velocidade, dt: delta time
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Angulo

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Ajustar para 0-360 |

---

## Metodos de Vetor

| Metodo | Assinatura | Descricao |
|--------|------------|-----------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Distancia entre pontos |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Distancia ao quadrado (mais rapido) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Vetor de direcao |
| `vector.Dot` | `float Dot(vector a, vector b)` | Produto escalar |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Interpolar posicoes |
| `v.Length()` | `float Length()` | Magnitude do vetor |
| `v.LengthSq()` | `float LengthSq()` | Magnitude ao quadrado (mais rapido) |
| `v.Normalized()` | `vector Normalized()` | Vetor unitario |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Direcao para yaw/pitch |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Yaw/pitch para direcao |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Multiplicacao por matriz |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Multiplicacao inversa por matriz |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Criar vetor |

---

## Funcoes Globais

| Funcao | Assinatura | Descricao |
|--------|------------|-----------|
| `GetGame()` | `CGame GetGame()` | Instancia do jogo |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Jogador local (apenas CLIENTE) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Todos os jogadores (servidor) |
| `GetGame().GetWorld()` | `World GetWorld()` | Instancia do mundo |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Tempo do servidor (segundos) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Workspace da UI |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Altura do terreno na posicao |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Tipo de material da superficie |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Encontrar objetos proximos a posicao |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Obter resolucao da tela |
| `GetGame().IsServer()` | `bool IsServer()` | Verificacao de servidor |
| `GetGame().IsClient()` | `bool IsClient()` | Verificacao de cliente |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Verificacao de multiplayer |
| `Print(string)` | `void Print(string msg)` | Escrever no log de scripts |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Registrar erro com severidade |
| `DumpStackString()` | `string DumpStackString()` | Obter pilha de chamadas como string |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | Formatar string (`%1`..`%9`) |

---

## Hooks de Mission

*Referencia completa: [Capitulo 6.11: Hooks de Mission](11-mission-hooks.md)*

### Lado do Servidor (modded MissionServer)

| Metodo | Descricao |
|--------|-----------|
| `override void OnInit()` | Inicializar gerenciadores, registrar RPCs |
| `override void OnMissionStart()` | Apos todos os mods carregados |
| `override void OnUpdate(float timeslice)` | Por frame (use acumulador!) |
| `override void OnMissionFinish()` | Limpar singletons, cancelar inscricoes de eventos |
| `override void OnEvent(EventType eventTypeId, Param params)` | Eventos de chat, voz |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Jogador entrou |
| `override void InvokeOnDisconnect(PlayerBase player)` | Jogador saiu |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Cliente pronto para dados |
| `override void PlayerRegistered(int peerId)` | Identidade registrada |

### Lado do Cliente (modded MissionGameplay)

| Metodo | Descricao |
|--------|-----------|
| `override void OnInit()` | Inicializar gerenciadores do cliente, criar HUD |
| `override void OnUpdate(float timeslice)` | Atualizacao por frame do cliente |
| `override void OnMissionFinish()` | Limpeza |
| `override void OnKeyPress(int key)` | Tecla pressionada |
| `override void OnKeyRelease(int key)` | Tecla solta |

---

## Sistema de Acoes

*Referencia completa: [Capitulo 6.12: Sistema de Acoes](12-action-system.md)*

### Registrar Acoes em um Item

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Adicionar acao personalizada
    RemoveAction(ActionEat);       // Remover acao vanilla
}
```

### Metodos Principais de ActionBase

| Metodo | Descricao |
|--------|-----------|
| `override void CreateConditionComponents()` | Definir condicoes de distancia CCINone/CCTNone |
| `override bool ActionCondition(...)` | Logica de validacao personalizada |
| `override void OnExecuteServer(ActionData action_data)` | Execucao no lado do servidor |
| `override void OnExecuteClient(ActionData action_data)` | Efeitos no lado do cliente |
| `override string GetText()` | Nome de exibicao (suporta chaves `#STR_`) |

---

*Documentacao completa: [Inicio](../README.md) | [Folha de Referencia](../cheatsheet.md) | [Sistema de Entidades](01-entity-system.md) | [Veiculos](02-vehicles.md) | [Clima](03-weather.md) | [Timers](07-timers.md) | [E/S de Arquivo](08-file-io.md) | [Rede](09-networking.md) | [Hooks de Mission](11-mission-hooks.md) | [Sistema de Acoes](12-action-system.md)*
