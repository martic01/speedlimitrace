import startGame from './game.js';
import { Curves } from './Curves.js';
import { TumbleSystem } from './TumbleSystem.js';

const FINISH_LINE_TYPES = {
    CLASSIC: 'classic',
    MODERN: 'modern',
    RACING: 'racing',
    CHECKERED: 'checkered'
};

export {
    startGame,
    FINISH_LINE_TYPES,
    Curves,
    TumbleSystem
};