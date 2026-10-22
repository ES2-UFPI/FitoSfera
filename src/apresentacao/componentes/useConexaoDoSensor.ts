import { useEffect, useState } from 'react';
import { ConexaoDoSensor } from '@/dominio/modelos/EstadoDaConexao';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';

/** A conexão do sensor, atualizada a cada mudança; null até o primeiro aviso. */
export function useConexaoDoSensor(): ConexaoDoSensor | null {
  const { container } = useAplicativo();
  const [conexao, definirConexao] = useState<ConexaoDoSensor | null>(null);
  useEffect(() => container.conexaoDoSensor.observar(definirConexao), [container]);
  return conexao;
}
