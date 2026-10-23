import { Jardim, JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { RepositorioDeJardins } from '@/dominio/portas/RepositorioDeJardins';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

interface EstadoDosJardins {
  jardins: Jardim[];
  selecionado: string;
}

/** O jardim principal existe mesmo para instalações anteriores à separação em jardins. */
export class RepositorioDeJardinsAsyncStorage implements RepositorioDeJardins {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async listar(): Promise<readonly Jardim[]> {
    return (await this.ler()).jardins;
  }

  async obterSelecionado(): Promise<string> {
    return (await this.ler()).selecionado;
  }

  async salvar(jardim: Jardim): Promise<void> {
    const estado = await this.ler();
    const indice = estado.jardins.findIndex((atual) => atual.id === jardim.id);
    if (indice < 0) estado.jardins.push(jardim);
    else estado.jardins[indice] = jardim;
    await this.gravar(estado);
  }

  async selecionar(id: string): Promise<void> {
    const estado = await this.ler();
    if (!estado.jardins.some((jardim) => jardim.id === id)) throw new Error('Jardim não encontrado.');
    await this.gravar({ ...estado, selecionado: id });
  }

  private async ler(): Promise<EstadoDosJardins> {
    const bruto = await this.armazenamento.getItem(CHAVES.jardins);
    if (bruto !== null) {
      try {
        const registro: unknown = JSON.parse(bruto);
        if (typeof registro === 'object' && registro !== null) {
          const { jardins, selecionado } = registro as Record<string, unknown>;
          if (Array.isArray(jardins)) {
            const validos = jardins.filter((jardim): jardim is Jardim =>
              typeof jardim?.id === 'string' && jardim.id.length > 0 &&
              typeof jardim.nome === 'string' && jardim.nome.length > 0 &&
              (jardim.idSensor === null || typeof jardim.idSensor === 'string'),
            );
            const lista = validos.some((jardim) => jardim.id === JARDIM_PRINCIPAL.id)
              ? validos : [JARDIM_PRINCIPAL, ...validos];
            return {
              jardins: lista,
              selecionado: typeof selecionado === 'string' && lista.some((jardim) => jardim.id === selecionado)
                ? selecionado : JARDIM_PRINCIPAL.id,
            };
          }
        }
      } catch {
        // Dados antigos ou ilegíveis não impedem a abertura do jardim principal.
      }
    }
    // Na atualização, o sensor que já estava pareado continua pertencendo ao jardim original.
    const anterior = await this.armazenamento.getItem(CHAVES.sensorPareado);
    let idSensor: string | null = null;
    try {
      const registro: unknown = anterior === null ? null : JSON.parse(anterior);
      if (typeof registro === 'object' && registro !== null && typeof (registro as { id?: unknown }).id === 'string')
        idSensor = (registro as { id: string }).id;
    } catch {
      // Pareamento antigo ilegível é ignorado.
    }
    return { jardins: [{ ...JARDIM_PRINCIPAL, idSensor }], selecionado: JARDIM_PRINCIPAL.id };
  }

  private gravar(estado: EstadoDosJardins): Promise<void> {
    return this.armazenamento.setItem(CHAVES.jardins, JSON.stringify(estado));
  }
}
