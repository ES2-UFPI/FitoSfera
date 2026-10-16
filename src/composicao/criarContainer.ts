import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdicionarPlantaAoJardim } from '@/aplicacao/casos-de-uso/AdicionarPlantaAoJardim';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { GeradorDeIdentificadorAleatorio } from '@/infraestrutura/identificador/GeradorDeIdentificadorAleatorio';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { Container } from './Container';

/** Raiz de composição: o único lugar do app que escolhe as implementações concretas. */
export function criarContainer(): Container {
  const plantas = new RepositorioDePlantasAsyncStorage(AsyncStorage);
  const especies = new RepositorioDeEspeciesLocal();

  return {
    listarJardim: new ListarJardimVirtual(plantas, especies),
    obterPlanta: new ObterPlantaDoJardim(plantas, especies),
    pesquisarEspecies: new PesquisarEspecies(especies),
    adicionarPlanta: new AdicionarPlantaAoJardim(plantas, especies, new GeradorDeIdentificadorAleatorio()),
  };
}
