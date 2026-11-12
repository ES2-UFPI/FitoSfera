import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { RepositorioDeJardins } from '@/dominio/portas/RepositorioDeJardins';

/** Atualiza cada jardim de forma independente; SensorComCache persiste leituras bem-sucedidas. */
export class AtualizarLeituras {
  constructor(
    private readonly jardins: RepositorioDeJardins,
    private readonly fontes: FontesDeJardim,
  ) {}

  async executar(idJardim?: string): Promise<{ readonly houveFalha: boolean }> {
    let jardins;
    try {
      jardins = await this.jardins.listar();
    } catch (falha) {
      console.warn('Não foi possível listar os jardins para atualizar as leituras.', falha);
      return { houveFalha: true };
    }
    const paraAtualizar = idJardim === undefined ? jardins : jardins.filter((jardim) => jardim.id === idJardim);
    const resultados = await Promise.all(paraAtualizar.map(async (jardim) => {
      try {
        const leitura = await (await this.fontes.obter(jardim.id)).atualizarLeitura();
        if (leitura === null) throw new Error('sensor sem leitura nova');
        return false;
      } catch (falha) {
        console.warn(`Não foi possível atualizar as leituras do jardim "${jardim.nome}".`, falha);
        return true;
      }
    }));
    return { houveFalha: resultados.some(Boolean) };
  }
}
