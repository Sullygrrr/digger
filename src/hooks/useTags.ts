import { useState } from 'react';
import toast from 'react-hot-toast';

const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 20;

export const useTags = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const validateTag = (tag: string): boolean => {
    if (tag.length > MAX_TAG_LENGTH) {
      toast.error(`Un tag ne peut pas dépasser ${MAX_TAG_LENGTH} caractères`);
      return false;
    }

    // Vérifier les caractères autorisés
    const validTagRegex = /^[a-zA-Z0-9\s\.\-_]+$/;
    if (!validTagRegex.test(tag)) {
      toast.error('Caractères spéciaux non autorisés (sauf . - _)');
      return false;
    }

    return true;
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = currentTag.trim().toLowerCase();
      
      if (!tag) return;
      
      if (tags.length >= MAX_TAGS) {
        toast.error(`Vous ne pouvez pas ajouter plus de ${MAX_TAGS} tags`);
        return;
      }

      if (tags.includes(tag)) {
        toast.error('Ce tag existe déjà');
        return;
      }

      if (validateTag(tag)) {
        setTags([...tags, tag]);
        setCurrentTag('');
      }
    }
  };

  const selectSuggestion = (tag: string) => {
    if (tags.length >= MAX_TAGS) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${MAX_TAGS} tags`);
      return;
    }

    if (tags.includes(tag)) {
      toast.error('Ce tag existe déjà');
      return;
    }

    setTags([...tags, tag]);
    setCurrentTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const clearTags = () => {
    setTags([]);
    setCurrentTag('');
  };

  return {
    tags,
    currentTag,
    setCurrentTag,
    addTag,
    removeTag,
    clearTags,
    selectSuggestion
  };
};