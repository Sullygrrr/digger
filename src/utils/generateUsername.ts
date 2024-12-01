import { customAlphabet } from 'nanoid';

// Créer un générateur avec uniquement des lettres et des chiffres
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export const generateDefaultUsername = () => {
  return `user${nanoid()}`;
};