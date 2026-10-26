import { useEffect, useState } from 'react';
import { ConexaoDoSensor } from '@/dominio/modelos/EstadoDaConexao';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';

/** A conexão do sensor, atualizada a cada mudança; null até o primeiro aviso. */
export function useConexaoDoSensor(): ConexaoDoSensor | null {
  const { container, idJardimSelecionado } = useAplicativo();
  const [conexao, definirConexao] = useState<ConexaoDoSensor | null>(null);
  useEffect(() => {
    definirConexao(null);
    return container.conexaoDoSensor.observar(definirConexao, idJardimSelecionado);
  }, [container, idJardimSelecionado]);
  return conexao;
}
