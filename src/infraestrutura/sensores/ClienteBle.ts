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

/** O pedaço da biblioteca BLE de que o sensor precisa. Em teste, entra um cliente falso. */
export interface ClienteBle {
  pedirPermissoes(): Promise<boolean>;
  consultarEstado(): Promise<EstadoDoBluetooth>;
  /** Só avisa dispositivos que anunciam o serviço do FitoSfera. */
  procurar(aoEncontrar: (dispositivo: DispositivoBle) => void, aoFalhar: (erro: unknown) => void): () => void;
  conectar(id: string): Promise<ConexaoBle>;
}
