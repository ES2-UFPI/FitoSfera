/**
 * Dois projetos: `unidade` roda o domínio, a aplicação e a lógica pura em Node, sem React Native;
 * `telas` renderiza as telas com o preset do Expo.
 */
const alias = { '^@/(.*)$': '<rootDir>/src/$1' };
const ignorarPratica = ['<rootDir>/fitosfera-pratica'];

module.exports = {
  // Metade dos núcleos: com todos, os testes de tela disputam CPU com o Metro e o editor e estouram o tempo.
  maxWorkers: '50%',
  projects: [
    {
      displayName: 'unidade',
      testEnvironment: 'node',
      roots: ['<rootDir>/testes/unidade'],
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/testes/tsconfig.json' }],
      },
      moduleNameMapper: alias,
      modulePathIgnorePatterns: ignorarPratica,
    },
    {
      displayName: 'telas',
      preset: 'jest-expo',
      // As telas de cadastro desenham dezenas de SVGs; rodando em paralelo, 5 s não basta.
      testTimeout: 15000,
      roots: ['<rootDir>/testes/telas'],
      setupFilesAfterEnv: ['<rootDir>/testes/telas/configurar.ts'],
      moduleNameMapper: {
        ...alias,
        '^@react-native-async-storage/async-storage$':
          '@react-native-async-storage/async-storage/jest/async-storage-mock',
      },
      modulePathIgnorePatterns: ignorarPratica,
    },
  ],
};
