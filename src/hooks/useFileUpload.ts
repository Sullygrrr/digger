import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export const useFileUpload = (userId: string) => {
  const uploadFile = async (file: File, folder: string) => {
    const fileRef = ref(storage, `${folder}/${userId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return getDownloadURL(snapshot.ref);
  };

  return { uploadFile };
};