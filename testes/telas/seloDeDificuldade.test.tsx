import { render } from '@testing-library/react-native';
import { SeloDeDificuldade } from '@/apresentacao/componentes/SeloDeDificuldade';
import { APRESENTACAO_DA_DIFICULDADE } from '@/apresentacao/componentes/textosDaDificuldade';
import { CORES } from '@/apresentacao/tema/cores';
import { NivelDeDificuldade, NIVEIS_DE_DIFICULDADE } from '@/dominio/modelos/EspecieVegetal';

/** O selo recém-desenhado, isolado: cada teste monta o seu e lê o único elemento com o testID. */
function selo(nivel: NivelDeDificuldade, sobreFundoTingido = false) {
  return render(<SeloDeDificuldade nivel={nivel} sobreFundoTingido={sobreFundoTingido} />).getByTestId(
    'selo-dificuldade',
  );
}

test('cada nível tem um rótulo em linguagem simples', () => {
  const rotulos = NIVEIS_DE_DIFICULDADE.map((nivel) => {
    const { getByTestId, unmount } = render(<SeloDeDificuldade nivel={nivel} />);
    const rotulo = getByTestId('selo-dificuldade').props.children;
    unmount();
    return rotulo;
  });
  expect(rotulos).toEqual(['fácil', 'médio', 'exigente']);
});

test('o nível aparece como texto, e não só pela cor', () => {
  // Critério de aceite da #121: quem não distingue as cores tem que conseguir ler o nível.
  expect(selo('dificil').props.children).toBe('exigente');
});

test('sobre superfície clara o selo usa a cor do nível', () => {
  expect(selo('medio')).toHaveStyle({ color: APRESENTACAO_DA_DIFICULDADE.medio.cor });
});

test('sobre o fundo tingido do cartão o selo vai em texto, que é o que passa no contraste', () => {
  expect(selo('medio', true)).toHaveStyle({ color: CORES.texto });
});

test('o rótulo sai em maiúsculas, sem depender de quem chama', () => {
  expect(selo('facil')).toHaveStyle({ textTransform: 'uppercase' });
});
