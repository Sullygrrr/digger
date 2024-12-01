import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';

interface TagData {
  count: number;
  lastUsed: Date;
}

export const useTagSuggestions = (inputValue: string) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<Map<string, TagData>>(new Map());

  // Charger tous les tags au montage du composant
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsQuery = query(
          collection(db, 'tags'),
          where('count', '>', 0),
          orderBy('count', 'desc')
        );
        
        const snapshot = await getDocs(tagsQuery);
        const tagsMap = new Map<string, TagData>();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data() as TagData;
          if (data.count > 0) { // Double vérification au cas où
            tagsMap.set(doc.id, data);
          }
        });
        
        setAllTags(tagsMap);
      } catch (error) {
        console.error('Erreur lors du chargement des tags:', error);
      }
    };

    fetchTags();
  }, []);

  // Mettre à jour les suggestions quand l'input change
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    const normalizedInput = inputValue.toLowerCase().trim();
    const matchingTags = Array.from(allTags.entries())
      .filter(([tag]) => tag.startsWith(normalizedInput))
      .sort((a, b) => b[1].count - a[1].count)
      .map(([tag]) => tag)
      .slice(0, 5); // Limiter à 5 suggestions

    setSuggestions(matchingTags);
  }, [inputValue, allTags]);

  return suggestions;
};