/** O tempo como porta, para "leitura recente" ser testável com uma data fixa. */
export interface Relogio {
  agora(): Date;
}
