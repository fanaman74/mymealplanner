// lib/i18n.ts
export type Lang = 'en' | 'fr' | 'nl'

export interface Strings {
  appName: string
  thisWeek: string
  today: string
  noMeal: string
  randomize: string
  randomizeWeek: string
  generating: string
  generatingWeek: string
  clearAll: string
  saveSnapshot: string
  shoppingList: string
  preferences: string
  history: string
  settings: string
  edit: string
  storageWarning: string
  moreIngredients: (n: number) => string
  days: Record<'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday', string>
  daysShort: Record<'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday', string>
}

export const TRANSLATIONS: Record<Lang, Strings> = {
  en: {
    appName: 'MyMealPlanner',
    thisWeek: 'This week',
    today: 'Tonight',
    noMeal: 'No meal — click 🎲 to generate',
    randomize: 'Randomize',
    randomizeWeek: 'Randomize week',
    generating: 'Generating…',
    generatingWeek: 'Generating your week…',
    clearAll: 'Clear all',
    saveSnapshot: 'Save snapshot',
    shoppingList: 'Shopping list',
    preferences: 'Preferences',
    history: 'History',
    settings: 'Settings',
    edit: 'Edit',
    storageWarning: "Local storage unavailable — your plan won't persist after closing this tab.",
    moreIngredients: (n: number) => `+${n} more`,
    days: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    },
    daysShort: {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    },
  },
  fr: {
    appName: 'MonMenuDuSoir',
    thisWeek: 'Cette semaine',
    today: 'Ce soir',
    noMeal: 'Pas de repas — cliquez 🎲 pour générer',
    randomize: 'Générer',
    randomizeWeek: 'Générer la semaine',
    generating: 'Génération…',
    generatingWeek: 'Génération de votre semaine…',
    clearAll: 'Tout effacer',
    saveSnapshot: 'Sauvegarder',
    shoppingList: 'Liste de courses',
    preferences: 'Préférences',
    history: 'Historique',
    settings: 'Réglages',
    edit: 'Modifier',
    storageWarning: "Stockage local indisponible — votre plan ne sera pas sauvegardé.",
    moreIngredients: (n: number) => `+${n} de plus`,
    days: {
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
    },
    daysShort: {
      monday: 'Lun',
      tuesday: 'Mar',
      wednesday: 'Mer',
      thursday: 'Jeu',
      friday: 'Ven',
      saturday: 'Sam',
      sunday: 'Dim',
    },
  },
  nl: {
    appName: 'MijnMaaltijdPlanner',
    thisWeek: 'Deze week',
    today: 'Vanavond',
    noMeal: 'Geen maaltijd — klik 🎲 om te genereren',
    randomize: 'Genereren',
    randomizeWeek: 'Week genereren',
    generating: 'Genereren…',
    generatingWeek: 'Uw week genereren…',
    clearAll: 'Alles wissen',
    saveSnapshot: 'Opslaan',
    shoppingList: 'Boodschappenlijst',
    preferences: 'Voorkeuren',
    history: 'Geschiedenis',
    settings: 'Instellingen',
    edit: 'Bewerken',
    storageWarning: "Lokale opslag niet beschikbaar — uw plan wordt niet bewaard.",
    moreIngredients: (n: number) => `+${n} meer`,
    days: {
      monday: 'Maandag',
      tuesday: 'Dinsdag',
      wednesday: 'Woensdag',
      thursday: 'Donderdag',
      friday: 'Vrijdag',
      saturday: 'Zaterdag',
      sunday: 'Zondag',
    },
    daysShort: {
      monday: 'Ma',
      tuesday: 'Di',
      wednesday: 'Wo',
      thursday: 'Do',
      friday: 'Vr',
      saturday: 'Za',
      sunday: 'Zo',
    },
  },
}

export function t(lang: Lang): typeof TRANSLATIONS['en'] {
  return TRANSLATIONS[lang]
}
