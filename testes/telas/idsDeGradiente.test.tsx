import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import { LinearGradient } from 'react-native-svg';
import { FundoAconchegante } from '@/apresentacao/componentes/FundoAconchegante';
import { TabuaDeMadeira } from '@/apresentacao/estante/Prateleira';

// Na web todas as telas montadas dividem o mesmo documento: id repetido faz um degradê apontar para o
// de uma tela escondida, e o fundo some.
test('fundos e tábuas montados ao mesmo tempo não repetem id de degradê', () => {
  render(
    <View>
      <FundoAconchegante />
      <FundoAconchegante />
      <TabuaDeMadeira />
      <TabuaDeMadeira />
    </View>,
  );
  const ids = screen.UNSAFE_getAllByType(LinearGradient).map((gradiente) => gradiente.props.id);
  expect(ids).toHaveLength(6);
  expect(new Set(ids).size).toBe(6);
});
