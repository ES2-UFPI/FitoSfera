import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotaoFlutuante } from '../componentes/BotaoFlutuante';
import { CabecalhoDoJardim } from '../componentes/CabecalhoDoJardim';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { Estante } from '../estante/Estante';
import { EstadoVazio } from './EstadoVazio';

/** Aba inicial: a estante com as plantas da pessoa. */
export function TelaJardim() {
  const { plantas, recarregarJardim } = useAplicativo();
  const margens = useSafeAreaInsets();
  const navegador = useRouter();

  useFocusEffect(
    useCallback(() => {
      void recarregarJardim();
    }, [recarregarJardim]),
  );

  const abrirCadastro = () => navegador.push('/cadastro');
  const abrirPlanta = (id: string) => navegador.push({ pathname: '/planta/[id]', params: { id } });
  const lista = plantas ?? [];

  return (
    <FundoAconchegante style={{ paddingTop: margens.top }}>
      <CabecalhoDoJardim quantidade={lista.length} />
      {lista.length > 0 ? (
        <>
          <Estante plantas={lista} aoAbrirPlanta={abrirPlanta} aoCadastrar={abrirCadastro} />
          <BotaoFlutuante aoTocar={abrirCadastro} />
        </>
      ) : null}
      {plantas !== null && plantas.length === 0 ? <EstadoVazio aoComecar={abrirCadastro} /> : null}
    </FundoAconchegante>
  );
}
