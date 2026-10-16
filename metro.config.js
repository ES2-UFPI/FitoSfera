const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// A pasta de prática da equipe tem o próprio projeto Expo e não pode entrar no bundle.
const bloqueioDaPratica = /fitosfera-pratica\/.*/;
const bloqueioPadrao = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(bloqueioPadrao) ? bloqueioPadrao : bloqueioPadrao ? [bloqueioPadrao] : []),
  bloqueioDaPratica,
];

module.exports = config;
