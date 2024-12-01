import { ref, getMetadata } from 'firebase/storage';
import { storage } from '../config/firebase';

export const useStorageCheck = () => {
  const checkFileExists = async (url: string): Promise<boolean> => {
    try {
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/music-6e66d.appspot.com/o/';
      const filePath = decodeURIComponent(url.replace(baseUrl, '').split('?')[0]);
      const fileRef = ref(storage, filePath);
      await getMetadata(fileRef);
      return true;
    } catch (error) {
      console.error('Fichier non trouvé:', error);
      return false;
    }
  };

  return { checkFileExists };
};