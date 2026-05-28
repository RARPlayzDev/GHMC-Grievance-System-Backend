import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
const resources = {
  en: {
    translation: {
      "welcome": "Welcome to GHMC Grievance Platform",
      "home": "Home",
      "file_complaint": "File a Complaint",
      "track_status": "Track Status",
      "officer_login": "Officer Login",
      "select_language": "Select Language",
      // ... more translations can go here
    }
  },
  te: {
    translation: {
      "welcome": "GHMC ఫిర్యాదు వేదికకు స్వాగతం",
      "home": "హోమ్",
      "file_complaint": "ఫిర్యాదు చేయండి",
      "track_status": "స్థితిని ట్రాక్ చేయండి",
      "officer_login": "అధికారి లాగిన్",
      "select_language": "భాషను ఎంచుకోండి",
    }
  },
  hi: {
    translation: {
      "welcome": "जीएचएमसी शिकायत मंच में आपका स्वागत है",
      "home": "होम",
      "file_complaint": "शिकायत दर्ज करें",
      "track_status": "स्थिति ट्रैक करें",
      "officer_login": "अधिकारी लॉगिन",
      "select_language": "भाषा चुनें",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
