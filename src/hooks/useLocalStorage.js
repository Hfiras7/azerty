import { useState, useEffect } from 'react';

// Hook personnalisé pour gérer le localStorage avec React
export const useLocalStorage = (key, initialValue) => {
  // Récupérer la valeur depuis localStorage ou utiliser la valeur initiale
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key} depuis localStorage:`, error);
      return initialValue;
    }
  });

  // Fonction pour mettre à jour la valeur
  const setValue = (value) => {
    try {
      // Permettre à value d'être une fonction comme useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${key} dans localStorage:`, error);
    }
  };

  // Synchroniser avec les changements dans d'autres onglets
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Erreur lors de la synchronisation:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
};

// Hook pour gérer les données d'étudiants
export const useStudents = () => {
  return useLocalStorage('exam_students', []);
};

// Hook pour gérer les notes
export const useGrades = () => {
  return useLocalStorage('exam_grades', {});
};

// Hook pour gérer les paramètres de l'application
export const useAppSettings = () => {
  return useLocalStorage('exam_settings', {
    lastStation: null,
    autoSave: true,
    theme: 'light'
  });
};
