type MessageValue = string | ((...args: string[]) => string);

export const messages = {
  // Success messages (S)
  S001: (object: string) => `${object} veiksmīgi izveidots`,
  S002: (object: string) => `${object} veiksmīgi rediģēts`,
  S003: (object: string) => `${object} veiksmīgi izdzēsts`,
  S004: "Vai tiešām vēlaties dzēst profilu?",
  S005: (user: string, type: string) => `Vai vēlaties mainīt lietotāja ${user} tipu uz ${type}?`,
  S006: "Pieteikums veiksmīgi atteikts",
  S007: "Veiksmīga reģistrācija",
  S008: "Veiksmīga autentifikācija",
  S009: "Veiksmīga atrakstīšanās",
  S010: "Lietotājs veiksmīgi atrasts",
  S011: "Rezultāti veiksmīgi ielādēti",
  S012: "Rezultāti publicēti",

  // Error messages (E)
  E001: (field: string) => `${field} jābūt aizpildītam`,
  E002: (value: string) => `${value} pārsniedz atļauto garumu`,
  E003: (value: string) => `${value} jau tiek izmantots citam profilam`,
  E004: "Jums nav tiesības veikt šo darbību",
  E005: "Tālruņa numurs neatbilst formātam",
  E006: "E-pasts neatbilst formātam",
  E007: "Nepareizs e-pasts vai parole",
  E008: "Parolēm jāsakrīt",
  E009: (user: string) => `Lietotājs ${user} neeksistē`,
  E010: (user: string, type: string) => `Lietotājs ${user} jau ir ${type}`,
} as const;

export type MessageKey = keyof typeof messages;
export type MessageMap = Record<MessageKey, MessageValue>;

