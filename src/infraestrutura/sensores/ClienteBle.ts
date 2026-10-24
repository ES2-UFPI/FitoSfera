export type EstadoDoBluetooth = 'ligado' | 'desligado' | 'desconhecido';

export interface DispositivoBle {
  readonly id: string;
  readonly nome: string | null;
  readonly rssi: number | null;
}

/** Uma conexão aberta com um sensor, já com o serviço do FitoSfera descoberto. */
export interface ConexaoBle {
  /** Assina as notificações da característica de leitura; o valor chega em base64. */
  monitorar(aoReceber: (valor: string | null) => void): () => void;
  ler(): Promise<string | null>;
  pedirLeitura(): Promise<void>;
  aoCair(aviso: () => void): () => void;
  desconectar(): Promise<void>;
}

/**
 * O que deu errado numa operação BLE, já sem o vocabulário da biblioteca. `desconhecido` cobre o que a
 * biblioteca não sabe explicar; quem usa decide a mensagem genérica.
 */
export type TipoDaFalhaBle =
  | 'bluetooth-desligado'
  | 'sem-permissao'
  | 'tempo-esgotado'
  | 'fora-de-alcance'
  | 'falha-na-leitura'
  | 'desconhecido';

export class FalhaBle extends Error {
  constructor(
    readonly tipo: TipoDaFalhaBle,
    causa?: unknown,
  ) {
    super(`Falha no Bluetooth: ${tipo}.`, { cause: causa });
    this.name = 'FalhaBle';
  }
}

/** O tipo de qualquer erro: um `FalhaBle` diz o seu; o resto é desconhecido. */
export function tipoDaFalha(erro: unknown): TipoDaFalhaBle {
  return erro instanceof FalhaBle ? erro.tipo : 'desconhecido';
}

/** O pedaço da biblioteca BLE de que o sensor precisa. Em teste, entra um cliente falso. */
export interface ClienteBle {
  pedirPermissoes(): Promise<boolean>;
  /** Confere, sem perguntar nada à pessoa, se as permissões já foram dadas. */
  temPermissoes(): Promise<boolean>;
  consultarEstado(): Promise<EstadoDoBluetooth>;
  /** Avisa cada vez que a pessoa liga ou desliga o Bluetooth do celular. */
  observarEstado(aoMudar: (estado: EstadoDoBluetooth) => void): () => void;
  /** Só avisa dispositivos que anunciam o serviço do FitoSfera. */
  procurar(aoEncontrar: (dispositivo: DispositivoBle) => void, aoFalhar: (erro: FalhaBle) => void): () => void;
  /** Falha sempre com um `FalhaBle`, para o sensor saber o motivo. */
  conectar(id: string): Promise<ConexaoBle>;
}
