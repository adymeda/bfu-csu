import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enAuth from './en/auth.json';
import enCalendar from './en/calendar.json';
import enCommon from './en/common.json';
import enInbox from './en/inbox.json';
import enSettings from './en/settings.json';

import ruAuth from './ru/auth.json';
import ruCalendar from './ru/calendar.json';
import ruCommon from './ru/common.json';
import ruInbox from './ru/inbox.json';
import ruSettings from './ru/settings.json';

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en: {
				auth: enAuth,
				calendar: enCalendar,
				common: enCommon,
				inbox: enInbox,
				settings: enSettings,
			},
			ru: {
				auth: ruAuth,
				calendar: ruCalendar,
				common: ruCommon,
				inbox: ruInbox,
				settings: ruSettings,
			},
		},
		defaultNS: 'common',
		fallbackLng: 'ru',
		supportedLngs: ['en', 'ru'],
		detection: {
			order: ['localStorage', 'navigator'],
			lookupLocalStorage: 'i18n_language',
			caches: ['localStorage'],
		},
		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;
