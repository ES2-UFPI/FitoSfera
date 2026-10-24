import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ToqueNaNotificacao } from '@/aplicacao/portas/ToquesNaNotificacao';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';

/**
 * Abre o detalhe da planta citada quando a pessoa toca na notificação de desvio — tanto com o app já
 * aberto quanto quando é o toque que tira o app do zero. Montado uma vez só, no layout raiz.
 */
export function useAberturaPelaNotificacao(): void {
  const { container } = useAplicativo();
  const navegador = useRouter();
  // Sobrevive às execuções do efeito: no início o mesmo toque pode chegar pelas duas vias.
  const jaTratados = useRef(new Set<string>());

  useEffect(() => {
    let ativo = true;
    const toques = container.toquesNaNotificacao;

    function abrir(toque: ToqueNaNotificacao): void {
      if (!ativo || jaTratados.current.has(toque.idDaNotificacao)) return;
      jaTratados.current.add(toque.idDaNotificacao);
      navegador.push({ pathname: '/planta/[id]', params: { id: toque.idPlanta } });
    }

    // O adaptador já engole as próprias falhas e devolve null, então aqui não há o que tratar.
    void toques.toqueQueAbriuOApp().then((toque) => {
      if (toque !== null) abrir(toque);
    });
    const cancelar = toques.aoTocar(abrir);

    return () => {
      // Duas travas para dois riscos: a promessa que resolve tarde e o ouvinte que ficaria registrado.
      ativo = false;
      cancelar();
    };
  }, [container, navegador]);
}
