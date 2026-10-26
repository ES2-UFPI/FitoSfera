import { GeradorDeIdentificador } from '@/dominio/portas/GeradorDeIdentificador';

export class GeradorDeIdentificadorAleatorio implements GeradorDeIdentificador {
  private contador = 0;

  gerar(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
    // Sem crypto (alguns motores JavaScript antigos): tempo + contador + sufixo aleatório.
    this.contador += 1;
    return `${Date.now().toString(36)}-${this.contador.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
