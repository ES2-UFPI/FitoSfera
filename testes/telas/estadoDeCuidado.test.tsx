import { render, screen } from '@testing-library/react-native';
import { VasoNaEstante } from '@/apresentacao/estante/VasoNaEstante';
import { DesenhoDaPlanta } from '@/apresentacao/ilustracao/DesenhoDaPlanta';
import { EstadoVisual, SEM_DADOS } from '@/apresentacao/ilustracao/estadoVisual';
import { plantaDeTeste } from '../apoio/fakes';

// O estado de cuidado entra por um único ponto, do vaso na estante até o desenho; quando houver
// medição, só o tipo EstadoVisual e o desenho mudam.
test('o vaso na estante repassa o estado de cuidado ao desenho', () => {
  const estado: EstadoVisual = { tipo: 'sem-dados' };
  render(
    <VasoNaEstante
      item={{ planta: plantaDeTeste(), especie: null, status: 'sem-dados' }}
      fase={0}
      inclinacao="esquerda"
      aoTocar={() => {}}
      estado={estado}
    />,
  );
  expect(screen.UNSAFE_getByType(DesenhoDaPlanta).props.estado).toBe(estado);
});

test('sem estado informado, o vaso usa "sem dados"', () => {
  render(
    <VasoNaEstante
      item={{ planta: plantaDeTeste(), especie: null, status: 'sem-dados' }}
      fase={0}
      inclinacao="esquerda"
      aoTocar={() => {}}
    />,
  );
  expect(screen.UNSAFE_getByType(DesenhoDaPlanta).props.estado).toBe(SEM_DADOS);
});
