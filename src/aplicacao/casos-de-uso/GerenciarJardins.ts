import { Jardim } from '@/dominio/modelos/Jardim';
import { GeradorDeIdentificador } from '@/dominio/portas/GeradorDeIdentificador';
import { RepositorioDeJardins } from '@/dominio/portas/RepositorioDeJardins';
import { SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';

export class SensorJaEmUso extends Error {
  constructor() {
    super('Este sensor já está associado a outro jardim.');
    this.name = 'SensorJaEmUso';
  }
}

export class GerenciarJardins {
  constructor(private readonly jardins: RepositorioDeJardins, private readonly gerador: GeradorDeIdentificador,
    private readonly sensores?: { listarPareados(): Promise<readonly SensorPareado[]> }) {}

  listar(): Promise<readonly Jardim[]> {
    return this.jardins.listar();
  }

  obterSelecionado(): Promise<string> {
    return this.jardins.obterSelecionado();
  }

  async criar(nome: string): Promise<Jardim> {
    const limpo = nome.trim();
    if (!limpo) throw new Error('Informe o nome do jardim.');
    const jardim: Jardim = { id: this.gerador.gerar(), nome: limpo, idSensor: null };
    await this.jardins.salvar(jardim);
    return jardim;
  }

  selecionar(id: string): Promise<void> {
    return this.jardins.selecionar(id);
  }

  async associar(idJardim: string, idSensor: string): Promise<void> {
    if (!idSensor || (this.sensores && !(await this.sensores.listarPareados()).some((item) => item.id === idSensor)))
      throw new Error('Sensor não pareado.');
    const jardins = await this.jardins.listar();
    const jardim = jardins.find((item) => item.id === idJardim);
    if (!jardim) throw new Error('Jardim não encontrado.');
    if (jardins.some((item) => item.id !== idJardim && item.idSensor === idSensor)) throw new SensorJaEmUso();
    await this.jardins.salvar({ ...jardim, idSensor });
  }

  async associarSensorSimulado(idJardim: string): Promise<void> {
    const jardim = (await this.jardins.listar()).find((item) => item.id === idJardim);
    if (!jardim) throw new Error('Jardim não encontrado.');
    await this.jardins.salvar({ ...jardim, idSensor: `simulado:${idJardim}` });
  }

  async desassociar(idJardim: string): Promise<void> {
    const jardim = (await this.jardins.listar()).find((item) => item.id === idJardim);
    if (!jardim) throw new Error('Jardim não encontrado.');
    await this.jardins.salvar({ ...jardim, idSensor: null });
  }
}
