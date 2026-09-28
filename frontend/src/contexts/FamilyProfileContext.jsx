import { createContext, useContext } from 'react';

// Estado de los perfiles familiares (Modo Cuidador) accesible desde cualquier vista,
// sin tener que pasarlo como prop por cada pantalla.
export const FamilyProfileContext = createContext({
  hasFamilyProfiles: false,
  activeProfile: null,
  switchProfile: null,
});

export const useFamilyProfile = () => useContext(FamilyProfileContext);
