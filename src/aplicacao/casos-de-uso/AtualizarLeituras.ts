import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { RepositorioDeJardins } from '@/dominio/portas/RepositorioDeJardins';

/** Atualiza cada jardim de forma independente; SensorComCache persiste leituras bem-sucedidas. */
export class AtualizarLeituras {
  constructor(
    private readonly jardins: RepositorioDeJardins,
    private readonly fontes: FontesDeJardim,
  ) {}

  async executar(): Promise<void> {
    let jardins;
    try {
      jardins = await this.jardins.listar();
    } catch (falha) {
      console.warn('Não foi possível listar os jardins para atualizar as leituras.', falha);
      return;
    }
    await Promise.all(jardins.map(async (jardim) => {
      try {
        await (await this.fontes.obter(jardim.id)).aguardarLeitura();
      } catch (falha) {
        console.warn(`Não foi possível atualizar as leituras do jardim "${jardim.nome}".`, falha);
      }
    }));
  }
}
