/**
 * Como está a ligação com o sensor do ambiente:
 * - `indisponivel`: o app não tem sensor configurado;
 * - `desconectado`: há sensor, mas sem ligação agora;
 * - `conectando`: tentando ligar;
 * - `conectado`: recebendo leituras.
 */
export type EstadoDaConexao = 'indisponivel' | 'desconectado' | 'conectando' | 'conectado';
