import { TelaEmBreve } from '@/apresentacao/telas/TelaEmBreve';
import { TEXTOS } from '@/textos';

export default function RotaAmbiente() {
  return (
    <TelaEmBreve
      titulo={TEXTOS.abas.ambiente}
      descricao={TEXTOS.abas.ambienteEmBreve}
    />
  );
}
