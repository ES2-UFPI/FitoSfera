import { JANELA_PADRAO } from '@/dominio/modelos/JanelaDeLembretes';
import { descreverJanela, formatarHorario } from '@/apresentacao/lembretes/textosDosLembretes';

test('o horário sai com dois dígitos, para não dançar na tela', () => {
  expect(formatarHorario({ hora: 8, minuto: 0 })).toBe('08:00');
  expect(formatarHorario({ hora: 0, minuto: 5 })).toBe('00:05');
  expect(formatarHorario({ hora: 23, minuto: 45 })).toBe('23:45');
});

test('a janela normal é descrita pelos dois limites', () => {
  expect(descreverJanela(JANELA_PADRAO)).toBe('das 08:00 às 21:00');
});

test('a janela que atravessa a meia-noite diz isso, para não parecer erro', () => {
  expect(descreverJanela({ inicio: { hora: 22, minuto: 0 }, fim: { hora: 7, minuto: 0 } })).toBe(
    'das 22:00 às 07:00, atravessando a meia-noite',
  );
});

test('início igual ao fim libera o dia inteiro', () => {
  expect(descreverJanela({ inicio: { hora: 9, minuto: 30 }, fim: { hora: 9, minuto: 30 } })).toBe(
    'a qualquer hora do dia',
  );
});
