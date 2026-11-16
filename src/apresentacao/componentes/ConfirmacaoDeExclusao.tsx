import { TEXTOS } from '@/textos';
import { DialogoDeConfirmacao } from './DialogoDeConfirmacao';

interface Props {
  readonly apelido: string;
  /** A planta dá frutos: as colheitas registradas também se vão, e a pessoa precisa saber. */
  readonly comColheitas?: boolean;
  readonly visivel: boolean;
  readonly excluindo: boolean;
  readonly erro: boolean;
  aoConfirmar(): void;
  aoCancelar(): void;
}

export function ConfirmacaoDeExclusao({ apelido, comColheitas = false, visivel, excluindo, erro, aoConfirmar, aoCancelar }: Props) {
  return (
    <DialogoDeConfirmacao
      titulo={TEXTOS.exclusao.titulo(apelido)}
      explicacao={comColheitas ? TEXTOS.exclusao.explicacaoComColheitas : TEXTOS.exclusao.explicacao}
      tituloDoBotao={TEXTOS.exclusao.excluirPlanta}
      tituloEmAndamento={TEXTOS.exclusao.excluindo}
      mensagemDeErro={TEXTOS.exclusao.falha}
      visivel={visivel}
      emAndamento={excluindo}
      erro={erro}
      aoConfirmar={aoConfirmar}
      aoCancelar={aoCancelar}
    />
  );
}
