// O Worklets depende de módulo nativo; em teste entra o mock que o próprio pacote oferece.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

// As animações do Reanimated rodam em modo de teste, sem a thread de UI.
require('react-native-reanimated').setUpTests();
