# Capítulo 8.10: Criando um Mod de Veículo Personalizado

[Início](../README.md) | [<< Anterior: Template Profissional de Mod](09-professional-template.md) | **Criando um Veículo Personalizado** | [Próximo: Criando Roupas Personalizadas >>](11-clothing-mod.md)

---

> **Resumo:** Este tutorial guia você na criação de uma variante de veículo personalizado no DayZ estendendo um veículo vanilla existente. Você definirá o veículo no config.cpp, personalizará seus stats e texturas, escreverá o comportamento de script para portas e motor, adicionará ele à tabela de spawn do servidor com peças pré-anexadas e testará no jogo. Ao final, você terá uma variante totalmente dirigível do Offroad Hatchback personalizado com performance e aparência modificadas.

---

## Sumário

- [O Que Estamos Construindo](#o-que-estamos-construindo)
- [Pré-requisitos](#pré-requisitos)
- [Passo 1: Criar o Config (config.cpp)](#passo-1-criar-o-config-configcpp)
- [Passo 2: Texturas Personalizadas](#passo-2-texturas-personalizadas)
- [Passo 3: Comportamento de Script (CarScript)](#passo-3-comportamento-de-script-carscript)
- [Passo 4: Entrada no types.xml](#passo-4-entrada-no-typesxml)
- [Passo 5: Compilar e Testar](#passo-5-compilar-e-testar)
- [Passo 6: Polimento](#passo-6-polimento)
- [Referência Completa do Código](#referência-completa-do-código)
- [Boas Práticas](#boas-práticas)
- [Teoria vs Prática](#teoria-vs-prática)
- [O Que Você Aprendeu](#o-que-você-aprendeu)
- [Erros Comuns](#erros-comuns)

---

## O Que Estamos Construindo

Vamos criar um veículo chamado **MFM Rally Hatchback** -- uma versão modificada do Offroad Hatchback vanilla (o Niva) com:

- Painéis de carroceria retexturizados usando hidden selections
- Performance de motor modificada (velocidade máxima maior, maior consumo de combustível)
- Valores de saúde de zonas de dano ajustados (motor mais resistente, portas mais fracas)
- Todo o comportamento padrão de veículo: abrir portas, ligar/desligar motor, combustível, luzes, entrada/saída de tripulação
- Entrada na tabela de spawn com rodas e peças pré-anexadas

Estendemos `OffroadHatchback` em vez de construir um veículo do zero. Este é o fluxo de trabalho padrão para mods de veículos porque herda o modelo, animações, geometria de física e todo o comportamento existente. Você só sobrescreve o que quer mudar.

---

## Pré-requisitos

- Uma estrutura de mod funcional (complete o [Capítulo 8.1](01-first-mod.md) e o [Capítulo 8.2](02-custom-item.md) primeiro)
- Um editor de texto
- DayZ Tools instalado (para conversão de texturas, opcional)
- Familiaridade básica com como a herança de classes no config.cpp funciona

Seu mod deve ter esta estrutura inicial:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## Passo 1: Criar o Config (config.cpp)

Definições de veículos ficam em `CfgVehicles`, assim como itens. Apesar do nome da classe, `CfgVehicles` contém tudo -- itens, construções e veículos propriamente ditos. A diferença-chave para veículos é a classe pai e a configuração adicional para zonas de dano, anexos e parâmetros de simulação.

### Atualize Seu Data config.cpp

Abra `MyFirstMod/Data/config.cpp` e adicione a classe do veículo. Se você já tem definições de itens aqui do Capítulo 8.2, adicione a classe do veículo dentro do bloco `CfgVehicles` existente.

```cpp
class CfgPatches
{
    class MyFirstMod_Vehicles
    {
        units[] = { "MFM_RallyHatchback" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgVehicles
{
    class OffroadHatchback;

    class MFM_RallyHatchback : OffroadHatchback
    {
        scope = 2;
        displayName = "Rally Hatchback";
        descriptionShort = "A modified offroad hatchback built for speed.";

        // --- Hidden Selections para retexturização ---
        hiddenSelections[] =
        {
            "camoGround",
            "camoMale",
            "driverDoors",
            "coDriverDoors",
            "intHood",
            "intTrunk"
        };
        hiddenSelectionsTextures[] =
        {
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "",
            "",
            "",
            ""
        };

        // --- Simulação (física e motor) ---
        class SimulationModule : SimulationModule
        {
            // Tipo de tração: 0 = RWD, 1 = FWD, 2 = AWD
            drive = 2;

            class Throttle
            {
                reactionTime = 0.75;
                defaultThrust = 0.85;
                gentleThrust = 0.65;
                turboCoef = 4.0;
                gentleCoef = 0.5;
            };

            class Engine
            {
                inertia = 0.15;
                torqueMax = 160;
                torqueRpm = 4200;
                powerMax = 95;
                powerRpm = 5600;
                rpmIdle = 850;
                rpmMin = 900;
                rpmClutch = 1400;
                rpmRedline = 6500;
                rpmMax = 7500;
            };

            class Gearbox
            {
                reverse = 3.526;
                ratios[] = { 3.667, 2.1, 1.361, 1.0 };
                transmissionRatio = 3.857;
            };

            braking[] = { 0.0, 0.1, 0.8, 0.9, 0.95, 1.0 };
        };

        // --- Zonas de Dano ---
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                    healthLevels[] =
                    {
                        { 1.0, {} },
                        { 0.7, {} },
                        { 0.5, {} },
                        { 0.3, {} },
                        { 0.0, {} }
                    };
                };
            };

            class DamageZones
            {
                class Chassis
                {
                    class Health
                    {
                        hitpoints = 3000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_chassis" };
                    inventorySlots[] = {};
                };

                class Engine
                {
                    class Health
                    {
                        hitpoints = 1200;
                        transferToGlobalCoef = 1;
                    };
                    fatalInjuryCoef = 0.001;
                    componentNames[] = { "yourcar_engine" };
                    inventorySlots[] = {};
                };

                class FuelTank
                {
                    class Health
                    {
                        hitpoints = 600;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_fueltank" };
                    inventorySlots[] = {};
                };

                class Front
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_front" };
                    inventorySlots[] = { "NivaHood" };
                };

                class Rear
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_rear" };
                    inventorySlots[] = { "NivaTrunk" };
                };

                class Body
                {
                    class Health
                    {
                        hitpoints = 2000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_body" };
                    inventorySlots[] = {};
                };

                class WindowFront
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowfront" };
                    inventorySlots[] = {};
                };

                class WindowLR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowLR" };
                    inventorySlots[] = {};
                };

                class WindowRR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowRR" };
                    inventorySlots[] = {};
                };

                class Door_1_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_1_1" };
                    inventorySlots[] = { "NivaDriverDoors" };
                };

                class Door_2_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_2_1" };
                    inventorySlots[] = { "NivaCoDriverDoors" };
                };
            };
        };
    };
};
```

### Campos-Chave Explicados

| Campo | Propósito |
|-------|---------|
| `scope = 2` | Torna o veículo spawnável. Use `0` para classes base que nunca devem spawnar diretamente. |
| `displayName` | Nome mostrado em ferramentas de admin e no jogo. Você pode usar referências `$STR_` para localização. |
| `requiredAddons[]` | Deve incluir `"DZ_Vehicles_Wheeled"` para que a classe pai `OffroadHatchback` seja carregada antes da sua. |
| `hiddenSelections[]` | Slots de textura no modelo que você quer sobrescrever. Devem corresponder às seleções nomeadas do modelo. |
| `SimulationModule` | Configuração de física e motor. Controla velocidade, torque, câmbio e frenagem. |
| `DamageSystem` | Define pools de saúde para cada parte do veículo (motor, portas, janelas, carroceria). |

### Sobre a Classe Pai

```cpp
class OffroadHatchback;
```

Esta declaração antecipada diz ao parser de config que `OffroadHatchback` existe no DayZ vanilla. Seu veículo então herda dele, obtendo o modelo completo do Niva, animações, geometria de física, pontos de anexo e definições de proxy. Você só precisa sobrescrever o que quer mudar.

Outras classes pai de veículos vanilla que você poderia estender:

| Classe Pai | Veículo |
|-------------|---------|
| `OffroadHatchback` | Niva (hatchback de 4 lugares) |
| `CivilianSedan` | Olga (sedan de 4 lugares) |
| `Hatchback_02` | Golf/Gunter (hatchback de 4 lugares) |
| `Sedan_02` | Sarka 120 (sedan de 4 lugares) |
| `Offroad_02` | Humvee (offroad de 4 lugares) |
| `Truck_01_Base` | V3S (caminhão) |

### Sobre o SimulationModule

O `SimulationModule` controla como o veículo dirige. Parâmetros-chave:

| Parâmetro | Efeito |
|-----------|--------|
| `drive` | `0` = tração traseira, `1` = tração dianteira, `2` = tração integral |
| `torqueMax` | Torque máximo do motor em Nm. Maior = mais aceleração. Niva vanilla é ~114. |
| `powerMax` | Potência máxima. Maior = maior velocidade máxima. Niva vanilla é ~68. |
| `rpmRedline` | RPM de corte do motor. Além disso, o motor bate no limitador de rotação. |
| `ratios[]` | Relações de marcha. Números menores = marchas mais longas = maior velocidade máxima mas aceleração mais lenta. |
| `transmissionRatio` | Relação final. Atua como multiplicador em todas as marchas. |

### Sobre as Zonas de Dano

Cada zona de dano tem seu próprio pool de saúde. Quando a saúde de uma zona chega a zero, aquele componente é destruído:

| Zona | Efeito Quando Destruído |
|------|-------------------|
| `Engine` | Veículo não pode ligar |
| `FuelTank` | Combustível vaza |
| `Front` / `Rear` | Dano visual, proteção reduzida |
| `Door_1_1` / `Door_2_1` | Porta cai |
| `WindowFront` | Janela estilhaça (afeta isolamento acústico) |

O valor `transferToGlobalCoef` determina quanto dano é transferido desta zona para a saúde global do veículo. `1` significa 100% de transferência (dano no motor afeta a saúde geral), `0` significa sem transferência.

O `componentNames[]` deve corresponder a componentes nomeados no LOD de geometria do veículo. Como herdamos o modelo do Niva, usamos nomes de placeholder aqui -- os nomes de componentes de geometria da classe pai são o que realmente importa para detecção de colisão. Se você está usando o modelo vanilla sem modificação, o mapeamento de componentes do pai se aplica automaticamente.

---

## Passo 2: Texturas Personalizadas

### Como Funcionam as Hidden Selections de Veículos

As hidden selections de veículos funcionam da mesma forma que texturas de itens, mas veículos tipicamente têm mais slots de seleção. O modelo do Offroad Hatchback usa seleções para diferentes painéis de carroceria, permitindo variantes de cor (Branco, Azul) no vanilla.

### Usando Texturas Vanilla (Início Mais Rápido)

Para testes iniciais, aponte suas hidden selections para texturas vanilla existentes. Isso confirma que seu config funciona antes de criar arte personalizada:

```cpp
hiddenSelectionsTextures[] =
{
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "",
    "",
    "",
    ""
};
```

Strings vazias `""` significam "usar a textura padrão do modelo para esta seleção."

### Criando um Conjunto de Texturas Personalizado

Para criar uma aparência única:

1. **Extraia a textura vanilla** usando o Addon Builder do DayZ Tools ou o drive P: para encontrar:
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **Converta para formato editável** usando o TexView2:
   - Abra o arquivo `.paa` no TexView2
   - Exporte como `.tga` ou `.png`

3. **Edite no seu editor de imagem** (GIMP, Photoshop, Paint.NET):
   - Texturas de veículos são tipicamente **2048x2048** ou **4096x4096**
   - Modifique cores, adicione decals, faixas de corrida ou efeitos de ferrugem
   - Mantenha o layout UV intacto -- mude apenas cores e detalhes

4. **Converta de volta para `.paa`**:
   - Abra sua imagem editada no TexView2
   - Salve no formato `.paa`
   - Salve em `MyFirstMod/Data/Textures/rally_body_co.paa`

### Convenções de Nomenclatura de Texturas para Veículos

| Sufixo | Tipo | Propósito |
|--------|------|---------|
| `_co` | Cor (Diffuse) | Cor e aparência principal |
| `_nohq` | Normal Map | Relevos de superfície, linhas de painéis, detalhes de rebites |
| `_smdi` | Specular | Brilho metálico, reflexos de pintura |
| `_as` | Alpha/Surface | Transparência para janelas |
| `_de` | Destruct | Texturas de overlay de dano |

Para um primeiro mod de veículo, apenas a textura `_co` é necessária. O modelo usa seus mapas normais e especulares padrão.

### Materiais Correspondentes (Opcional)

Para controle completo de material, crie um arquivo `.rvmat`:

```cpp
hiddenSelectionsMaterials[] =
{
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "",
    "",
    "",
    ""
};
```

---

## Passo 3: Comportamento de Script (CarScript)

Classes de script de veículos controlam sons do motor, lógica de portas, comportamento de entrada/saída de tripulação e animações de assentos. Como estendemos `OffroadHatchback`, herdamos todo o comportamento vanilla e só sobrescrevemos o que queremos personalizar.

### Criar o Arquivo de Script

Crie a estrutura de pastas e o arquivo de script:

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### Atualizar Scripts config.cpp

Seu `Scripts/config.cpp` deve registrar a camada `4_World` para que o engine carregue seu script:

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "World" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
        };
    };
};
```

### Escrever o Script do Veículo

Crie `4_World/MyFirstMod/MFM_RallyHatchback.c`:

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // Sobrescrever sons do motor (reutilizar sons vanilla do Niva)
        m_EngineStartOK         = "offroad_engine_start_SoundSet";
        m_EngineStartBattery    = "offroad_engine_failed_start_battery_SoundSet";
        m_EngineStartPlug       = "offroad_engine_failed_start_sparkplugs_SoundSet";
        m_EngineStartFuel       = "offroad_engine_failed_start_fuel_SoundSet";
        m_EngineStop            = "offroad_engine_stop_SoundSet";
        m_EngineStopFuel        = "offroad_engine_stop_fuel_SoundSet";

        m_CarDoorOpenSound      = "offroad_door_open_SoundSet";
        m_CarDoorCloseSound     = "offroad_door_close_SoundSet";
        m_CarSeatShiftInSound   = "Offroad_SeatShiftIn_SoundSet";
        m_CarSeatShiftOutSound  = "Offroad_SeatShiftOut_SoundSet";

        m_CarHornShortSoundName = "Offroad_Horn_Short_SoundSet";
        m_CarHornLongSoundName  = "Offroad_Horn_SoundSet";

        // Posição do motor no espaço do modelo (x, y, z) -- usada para
        // fonte de temperatura, detecção de afogamento e efeitos de partículas
        SetEnginePos("0 0.7 1.2");
    }

    // --- Instância de Animação ---
    // Determina qual conjunto de animações do jogador é usado ao entrar/sair.
    // Deve corresponder ao esqueleto do veículo. Como usamos o modelo do Niva, mantemos HATCHBACK.
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- Distância da Câmera ---
    // Quão longe a câmera de terceira pessoa fica atrás do veículo.
    // Niva vanilla é 3.5. Aumente para uma visão mais ampla.
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- Tipos de Animação de Assento ---
    // Mapeia cada índice de assento para um tipo de animação do jogador.
    // 0 = motorista, 1 = co-piloto, 2 = traseiro esquerdo, 3 = traseiro direito.
    override int GetSeatAnimationType(int posIdx)
    {
        switch (posIdx)
        {
        case 0:
            return DayZPlayerConstants.VEHICLESEAT_DRIVER;
        case 1:
            return DayZPlayerConstants.VEHICLESEAT_CODRIVER;
        case 2:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_L;
        case 3:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_R;
        }

        return 0;
    }

    // --- Estado da Porta ---
    // Retorna se uma porta está faltando, aberta ou fechada.
    // Nomes de slot (NivaDriverDoors, NivaCoDriverDoors, NivaHood, NivaTrunk)
    // são definidos pelos proxies de slot de inventário do modelo.
    override int GetCarDoorsState(string slotType)
    {
        CarDoor carDoor;

        Class.CastTo(carDoor, FindAttachmentBySlotName(slotType));
        if (!carDoor)
        {
            return CarDoorState.DOORS_MISSING;
        }

        switch (slotType)
        {
            case "NivaDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsDriver");

            case "NivaCoDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsCoDriver");

            case "NivaHood":
                return TranslateAnimationPhaseToCarDoorState("DoorsHood");

            case "NivaTrunk":
                return TranslateAnimationPhaseToCarDoorState("DoorsTrunk");
        }

        return CarDoorState.DOORS_MISSING;
    }

    // --- Entrada/Saída de Tripulação ---
    // Determina se um jogador pode entrar ou sair de um assento específico.
    // Verifica o estado da porta e a fase de animação de dobrar o assento.
    // Assentos dianteiros (0, 1) requerem que a porta esteja aberta.
    // Assentos traseiros (2, 3) requerem a porta aberta E o assento dianteiro dobrado para frente.
    override bool CrewCanGetThrough(int posIdx)
    {
        switch (posIdx)
        {
            case 0:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") > 0.5)
                    return false;
                return true;

            case 1:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") > 0.5)
                    return false;
                return true;

            case 2:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") <= 0.5)
                    return false;
                return true;

            case 3:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") <= 0.5)
                    return false;
                return true;
        }

        return false;
    }

    // --- Verificação do Capô para Anexos ---
    // Impede jogadores de remover peças do motor quando o capô está fechado.
    override bool CanReleaseAttachment(EntityAI attachment)
    {
        if (!super.CanReleaseAttachment(attachment))
        {
            return false;
        }

        if (EngineIsOn() || GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
        {
            string attType = attachment.GetType();
            if (attType == "CarRadiator" || attType == "CarBattery" || attType == "SparkPlug")
            {
                return false;
            }
        }

        return true;
    }

    // --- Acesso ao Cargo ---
    // O porta-malas deve estar aberto para acessar o cargo do veículo.
    override bool CanDisplayCargo()
    {
        if (!super.CanDisplayCargo())
        {
            return false;
        }

        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            return false;
        }

        return true;
    }

    // --- Acesso ao Compartimento do Motor ---
    // O capô deve estar aberto para ver os slots de anexo do motor.
    override bool CanDisplayAttachmentCategory(string category_name)
    {
        if (!super.CanDisplayAttachmentCategory(category_name))
        {
            return false;
        }

        category_name.ToLower();
        if (category_name.Contains("engine"))
        {
            if (GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
            {
                return false;
            }
        }

        return true;
    }

    // --- Spawn de Debug ---
    // Chamado ao spawnar pelo menu de debug. Spawna com todas as peças anexadas
    // e fluidos cheios para teste imediato.
    override void OnDebugSpawn()
    {
        SpawnUniversalParts();
        SpawnAdditionalItems();
        FillUpCarFluids();

        GameInventory inventory = GetInventory();
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");

        inventory.CreateInInventory("HatchbackDoors_Driver");
        inventory.CreateInInventory("HatchbackDoors_CoDriver");
        inventory.CreateInInventory("HatchbackHood");
        inventory.CreateInInventory("HatchbackTrunk");

        // Rodas sobressalentes no cargo
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### Entendendo os Overrides Principais

**GetAnimInstance** -- Retorna qual conjunto de animações o jogador usa ao sentar no veículo. Os valores do enum são:

| Valor | Constante | Tipo de Veículo |
|-------|----------|-------------|
| 0 | `CIVVAN` | Van |
| 1 | `V3S` | Caminhão V3S |
| 2 | `SEDAN` | Sedan Olga |
| 3 | `HATCHBACK` | Hatchback Niva |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

Se você mudar isso para o valor errado, a animação do jogador vai atravessar o veículo ou parecer incorreta. Sempre corresponda ao modelo que você está usando.

**CrewCanGetThrough** -- Isso é chamado a cada frame para determinar se um jogador pode entrar ou sair de um assento. Os assentos traseiros do Niva (índices 2 e 3) funcionam diferentemente dos dianteiros: o encosto do banco dianteiro deve ser dobrado para frente (fase de animação > 0.5) antes que passageiros traseiros possam passar. Isso corresponde ao comportamento real de um hatchback de 2 portas onde passageiros traseiros devem inclinar o banco dianteiro.

**OnDebugSpawn** -- Chamado quando você usa o menu de spawn de debug. `SpawnUniversalParts()` adiciona lâmpadas de farol e uma bateria de carro. `FillUpCarFluids()` enche combustível, líquido de arrefecimento, óleo e fluido de freio ao máximo. Então criamos rodas, portas, capô e porta-malas. Isso lhe dá um veículo imediatamente dirigível para testes.

---

## Passo 4: Entrada no types.xml

### Configuração de Spawn de Veículos

Veículos no `types.xml` usam o mesmo formato que itens, mas com algumas diferenças importantes. Adicione isso ao `types.xml` do seu servidor:

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

### Diferenças entre Veículos e Itens no types.xml

| Configuração | Itens | Veículos |
|---------|-------|----------|
| `nominal` | 10-50+ | 1-5 (veículos são raros) |
| `lifetime` | 3600-14400 | 3888000 (45 dias -- veículos persistem por muito tempo) |
| `restock` | 1800 | 0 (veículos não restocam automaticamente; eles respawnam apenas após o anterior ser destruído e despawnado) |
| `category` | `tools`, `weapons`, etc. | `vehicles` |

### Peças Pré-Anexadas com cfgspawnabletypes.xml

Veículos spawnam como cascas vazias por padrão -- sem rodas, portas ou peças de motor. Para fazê-los spawnar com peças pré-anexadas, adicione entradas ao `cfgspawnabletypes.xml` na pasta de missão do servidor:

```xml
<type name="MFM_RallyHatchback">
    <attachments chance="1.00">
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.60" />
        <item name="HatchbackWheel" chance="0.40" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackDoors_Driver" chance="0.50" />
        <item name="HatchbackDoors_CoDriver" chance="0.50" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackHood" chance="0.60" />
        <item name="HatchbackTrunk" chance="0.60" />
    </attachments>
    <attachments chance="0.70">
        <item name="CarBattery" chance="0.30" />
        <item name="SparkPlug" chance="0.30" />
    </attachments>
    <attachments chance="0.50">
        <item name="CarRadiator" chance="0.40" />
    </attachments>
    <attachments chance="0.30">
        <item name="HeadlightH7" chance="0.50" />
        <item name="HeadlightH7" chance="0.50" />
    </attachments>
</type>
```

### Como o cfgspawnabletypes Funciona

Cada bloco `<attachments>` é avaliado independentemente:
- O `chance` externo determina se este grupo de anexos é considerado
- Cada `<item>` dentro tem sua própria `chance` de ser colocado
- Itens são colocados no primeiro slot correspondente disponível no veículo

Isso significa que um veículo pode spawnar com 3 rodas e sem portas, ou com todas as rodas e uma bateria mas sem vela de ignição. Isso cria o loop de gameplay de vasculhar -- jogadores devem encontrar as peças faltantes.

---

## Passo 5: Compilar e Testar

### Empacotar os PBOs

Você precisa de dois PBOs para este mod:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Contém Scripts/config.cpp e 4_World/
        Data.pbo             <-- Contém Data/config.cpp e Textures/
```

Use o Addon Builder do DayZ Tools:
1. **Scripts PBO:** Source = `MyFirstMod/Scripts/`, Prefix = `MyFirstMod/Scripts`
2. **Data PBO:** Source = `MyFirstMod/Data/`, Prefix = `MyFirstMod/Data`

Ou use file patching durante o desenvolvimento:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Spawnar o Veículo Usando o Console de Script

1. Inicie o DayZ com seu mod carregado
2. Entre no seu servidor ou inicie o modo offline
3. Abra o console de script
4. Para spawnar um veículo totalmente equipado perto do seu personagem:

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. Pressione **Execute**

O veículo deve aparecer 5 metros à sua frente.

### Spawnar um Veículo Pronto para Dirigir

Para testes mais rápidos, spawne o veículo e use o método de debug spawn que anexa todas as peças:

```c
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
Object obj = GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true);
CarScript car = CarScript.Cast(obj);
if (car)
{
    car.OnDebugSpawn();
}
```

Isso chama seu override de `OnDebugSpawn()`, que enche os fluidos e anexa rodas, portas, capô e porta-malas.

### O Que Testar

| Verificação | O Que Procurar |
|-------|-----------------|
| **Veículo spawna** | Aparece no mundo sem erros no log de script |
| **Texturas aplicadas** | Cor personalizada da carroceria é visível (se usando texturas personalizadas) |
| **Motor liga** | Entre, segure a tecla de ligar o motor. Ouça o som de partida. |
| **Direção** | Aceleração, velocidade máxima, sensação de manuseio diferente do vanilla |
| **Portas** | Pode abrir/fechar portas do motorista e co-piloto |
| **Capô/Porta-malas** | Pode abrir o capô para acessar peças do motor. Pode abrir o porta-malas para cargo. |
| **Assentos traseiros** | Dobrar banco dianteiro, depois entrar no assento traseiro |
| **Consumo de combustível** | Dirija e observe o medidor de combustível |
| **Dano** | Atire no veículo. Peças devem receber dano e eventualmente quebrar. |
| **Luzes** | Faróis e lanternas traseiras funcionam à noite |

### Lendo o Log de Script

Se o veículo não spawna ou se comporta incorretamente, verifique o log de script em:

```
%localappdata%\DayZ\<SeuPerfil>\script.log
```

Erros comuns:

| Mensagem no Log | Causa |
|-------------|-------|
| `Cannot create object type MFM_RallyHatchback` | Nome da classe no config.cpp não confere ou Data PBO não carregado |
| `Undefined variable 'OffroadHatchback'` | `requiredAddons` faltando `"DZ_Vehicles_Wheeled"` |
| `Member not found` na chamada de método | Erro de digitação no nome do método override |

---

## Passo 6: Polimento

### Som de Buzina Personalizado

Para dar ao seu veículo uma buzina única, defina sound sets personalizados no seu Data config.cpp:

```cpp
class CfgSoundShaders
{
    class MFM_RallyHorn_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn", 1 }};
        volume = 1.0;
        range = 150;
        limitation = 0;
    };
    class MFM_RallyHornShort_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn_short", 1 }};
        volume = 1.0;
        range = 100;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MFM_RallyHorn_SoundSet
    {
        soundShaders[] = { "MFM_RallyHorn_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
    class MFM_RallyHornShort_SoundSet
    {
        soundShaders[] = { "MFM_RallyHornShort_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
};
```

Depois referencie-os no construtor do seu script:

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

Arquivos de som devem estar no formato `.ogg`. O caminho em `samples[]` NÃO inclui a extensão do arquivo.

### Faróis Personalizados

Você pode criar uma classe de luz personalizada para mudar brilho, cor ou alcance dos faróis:

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // Farol baixo (segregated)
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // Farol alto (aggregated)
        m_AggregatedBrightness = 14;
        m_AggregatedRadius = 90;
        m_AggregatedAngle = 120;
        m_AggregatedColorRGB = Vector(0.9, 0.9, 1.0);

        FadeIn(0.3);
        SetFadeOutTime(0.25);

        SegregateLight();
    }
};
```

Sobrescreva na sua classe de veículo:

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### Isolamento Acústico (OnSound)

O override `OnSound` controla o quanto a cabine abafa o ruído do motor baseado no estado de portas e janelas:

```c
override float OnSound(CarSoundCtrl ctrl, float oldValue)
{
    switch (ctrl)
    {
    case CarSoundCtrl.DOORS:
        float newValue = 0;
        if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.3;
        }
        if (GetHealthLevel("WindowFront") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.6;
        }
        if (GetHealthLevel("WindowLR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        if (GetHealthLevel("WindowRR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        return Math.Clamp(newValue, 0, 1);
    }

    return super.OnSound(ctrl, oldValue);
}
```

Um valor de `1.0` significa isolamento total (cabine silenciosa), `0.0` significa sem isolamento (sensação de ar livre).

---

## Referência Completa do Código

### Estrutura Final de Diretórios

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
    Data/
        config.cpp
        Textures/
            rally_body_co.paa
        Sounds/
            rally_horn.ogg           (opcional)
            rally_horn_short.ogg     (opcional)
```

### MyFirstMod/mod.cpp

```cpp
name = "My First Mod";
author = "YourName";
version = "1.2";
overview = "My first DayZ mod with a custom rally hatchback vehicle.";
```

### MyFirstMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "World" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
        };
    };
};
```

### Entrada no types.xml da Missão do Servidor

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

### Entrada no cfgspawnabletypes.xml da Missão do Servidor

```xml
<type name="MFM_RallyHatchback">
    <attachments chance="1.00">
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.60" />
        <item name="HatchbackWheel" chance="0.40" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackDoors_Driver" chance="0.50" />
        <item name="HatchbackDoors_CoDriver" chance="0.50" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackHood" chance="0.60" />
        <item name="HatchbackTrunk" chance="0.60" />
    </attachments>
    <attachments chance="0.70">
        <item name="CarBattery" chance="0.30" />
        <item name="SparkPlug" chance="0.30" />
    </attachments>
    <attachments chance="0.50">
        <item name="CarRadiator" chance="0.40" />
    </attachments>
    <attachments chance="0.30">
        <item name="HeadlightH7" chance="0.50" />
        <item name="HeadlightH7" chance="0.50" />
    </attachments>
</type>
```

---

## Boas Práticas

- **Sempre estenda uma classe de veículo existente.** Criar um veículo do zero requer um modelo 3D personalizado com LODs de geometria corretos, proxies, pontos de memória e uma configuração de simulação de física. Estender um veículo vanilla lhe dá tudo isso de graça.
- **Teste com `OnDebugSpawn()` primeiro.** Antes de configurar types.xml e cfgspawnabletypes.xml, verifique se o veículo funciona spawnando-o totalmente equipado via menu de debug ou console de script.
- **Mantenha o mesmo `GetAnimInstance()` do pai.** Se você mudar isso sem um conjunto de animações correspondente, jogadores vão ficar em T-pose ou atravessar o veículo.
- **Não mude nomes de slot de portas.** O Niva usa `NivaDriverDoors`, `NivaCoDriverDoors`, `NivaHood`, `NivaTrunk`. Estes estão vinculados aos nomes de proxy do modelo e definições de slot de inventário. Mudá-los sem mudar o modelo vai quebrar a funcionalidade das portas.
- **Use `scope = 0` para classes base internas.** Se você criar um veículo base abstrato que outras variantes estendem, defina `scope = 0` para que nunca spawne diretamente.
- **Configure `requiredAddons` corretamente.** Seu Data config.cpp deve listar `"DZ_Vehicles_Wheeled"` para que a classe pai `OffroadHatchback` carregue antes da sua.
- **Teste a lógica de portas completamente.** Entre/saia de cada assento, abra/feche cada porta, tente acessar o compartimento do motor com o capô fechado. Bugs no CrewCanGetThrough são o problema mais comum em mods de veículos.

---

## Teoria vs Prática

| Conceito | Teoria | Realidade |
|---------|--------|---------|
| `SimulationModule` no config.cpp | Controle total sobre a física do veículo | Nem todos os parâmetros sobrescrevem corretamente ao estender uma classe pai. Se suas mudanças de velocidade/torque parecem não ter efeito, tente ajustar `transmissionRatio` e `ratios[]` das marchas em vez de apenas `torqueMax`. |
| Zonas de dano com `componentNames[]` | Cada zona mapeia para um componente de geometria | Ao estender um veículo vanilla, os nomes de componentes do modelo pai já estão definidos. Seus valores de `componentNames[]` no config só importam se você fornecer um modelo personalizado. O LOD de geometria do pai determina a detecção de colisão real. |
| Texturas personalizadas via hidden selections | Trocar qualquer textura livremente | Apenas seleções que o autor do modelo marcou como "hidden" podem ser sobrescritas. Se você precisar retexturizar uma parte que não está em `hiddenSelections[]`, deve criar um novo modelo ou modificar o existente no Object Builder. |
| Peças pré-anexadas no `cfgspawnabletypes.xml` | Itens se anexam aos slots correspondentes | Se uma classe de roda é incompatível com o veículo (slot de anexo errado), ela falha silenciosamente. Sempre use peças que o veículo pai aceita -- para o Niva, isso significa `HatchbackWheel`, não `CivSedanWheel`. |
| Sons do motor | Definir qualquer nome de SoundSet | Sound sets devem ser definidos em `CfgSoundSets` em algum lugar nos configs carregados. Se você referenciar um sound set que não existe, o engine silenciosamente volta para sem som -- nenhum erro no log. |

---

## O Que Você Aprendeu

Neste tutorial você aprendeu:

- Como definir uma classe de veículo personalizada estendendo um veículo vanilla existente no config.cpp
- Como zonas de dano funcionam e como configurar valores de saúde para cada componente do veículo
- Como hidden selections de veículos permitem retexturização da carroceria sem um modelo 3D personalizado
- Como escrever um script de veículo com lógica de estado de portas, verificações de entrada de tripulação e comportamento do motor
- Como `types.xml` e `cfgspawnabletypes.xml` trabalham juntos para spawn de veículos com peças pré-anexadas aleatorizadas
- Como testar veículos no jogo usando o console de script e o método `OnDebugSpawn()`
- Como adicionar sons personalizados para buzinas e classes de luz personalizadas para faróis

**Próximo:** Expanda seu mod de veículo com modelos de portas personalizados, texturas interiores ou até mesmo uma carroceria de veículo completamente nova usando Blender e Object Builder.

---

## Erros Comuns

### Veículo Spawna Mas Imediatamente Cai Através do Chão

A geometria de física não está carregando. Isso geralmente significa que `requiredAddons[]` está faltando `"DZ_Vehicles_Wheeled"`, então a configuração de física da classe pai não é herdada.

### Veículo Spawna Mas Não Pode Ser Entrado

Verifique se `GetAnimInstance()` retorna o valor de enum correto para seu modelo. Se você estende `OffroadHatchback` mas retorna `VehicleAnimInstances.SEDAN`, a animação de entrada mira nas posições de porta erradas e o jogador não consegue entrar.

### Portas Não Abrem ou Fecham

Verifique se `GetCarDoorsState()` usa os nomes de slot corretos. O Niva usa `"NivaDriverDoors"`, `"NivaCoDriverDoors"`, `"NivaHood"` e `"NivaTrunk"`. Estes devem corresponder exatamente, incluindo maiúsculas e minúsculas.

### Motor Liga Mas Veículo Não Se Move

Verifique as relações de marcha do seu `SimulationModule`. Se `ratios[]` está vazio ou tem valores zero, o veículo não tem marchas para frente. Também verifique se as rodas estão anexadas -- um veículo sem rodas vai acelerar mas não se mover.

### Veículo Não Tem Som

Sons do motor são atribuídos no construtor. Se você escrever errado um nome de SoundSet (por exemplo `"offroad_engine_Start_SoundSet"` em vez de `"offroad_engine_start_SoundSet"`), o engine silenciosamente usa sem som. Nomes de sound set são sensíveis a maiúsculas e minúsculas.

### Textura Personalizada Não Aparece

Verifique três coisas em ordem: (1) o nome da hidden selection corresponde ao modelo exatamente, (2) o caminho da textura usa barras invertidas no config.cpp, e (3) o arquivo `.paa` está dentro do PBO empacotado. Se usando file patching durante o desenvolvimento, certifique-se de que o caminho começa da raiz do mod, não um caminho absoluto.

### Passageiros do Assento Traseiro Não Conseguem Entrar

Os assentos traseiros do Niva requerem que o banco dianteiro seja dobrado para frente. Se seu override de `CrewCanGetThrough()` para os índices de assento 2 e 3 não verifica `GetAnimationPhase("SeatDriver")` e `GetAnimationPhase("SeatCoDriver")`, passageiros traseiros ficarão permanentemente trancados fora.

### Veículo Spawna Sem Peças no Multiplayer

`OnDebugSpawn()` é apenas para debug/teste. Em um servidor real, peças vêm do `cfgspawnabletypes.xml`. Se seu veículo spawna como uma casca vazia, adicione a entrada de `cfgspawnabletypes.xml` descrita no Passo 4.

---

**Anterior:** [Capítulo 8.9: Template Profissional de Mod](09-professional-template.md)
