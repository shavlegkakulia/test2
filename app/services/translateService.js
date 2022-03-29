import axios from 'axios';
import { authService, stateService } from './imports';
import { states } from '../models/states';
import { defaults } from '../models/imports';

class TranslateService {
    static events = [];

    key = 'ka';

    constructor() {
        this.translate = {};
    }

    //translates key to current language value
    t(key, ...params) {
        try {
            if (!key) return null;
            let parts = key.split('.');
            let value = this.translate;

            for (let part of parts) {
                value = value[part];
            }

            value = value || "";
            for (let i = 0; i < params.length; i++) {
                value = value.replace(new RegExp(`\\{${i}}`, "g"), params[i]);
            }

            return value;
        }
        catch (e) {
            return "";
        }
    }

    //set language
    use(lang, key, then, errCallback) {
        const fn = () => {
            axios.get(`assets/translate/${key}.json?v=${globalConfig.translate_Version}`).then(resp => {
                this.lang = lang;
                this.key = key;
                this.translate = resp.data;
                for (const e of TranslateService.events) {
                    e(lang);
                }
                
                if(then && authService.isAuthenticated())
                then();
            }).catch(err => {
                if (errCallback) errCallback(err);
            });
        }
       if(!key) 
        {
            let locales = this.locales;
            if(locales) {
                if(!this.lang) this.lang = defaults.locale.id;
                let current = locales.filter(l => l.id == lang);
                key = current[0]?.key || defaults.locale.key;
                fn();
            }
        } else {
            fn();
        }
        
    }

    changeUserLocale = async () => {
        return await axios.post(`${globalConfig.api_URL}api/private/changelocale/${this.lang}`);
    }

    async fetchLocales() {
        return await axios.get(`${globalConfig.api_URL}api/public/allLocales`, {headers: {noToken: true}});
    }

    //register translation change event
    subscribe(fn) {
        TranslateService.events.push(fn);

        return {
            unsubscribe: () => {
                const index = TranslateService.events.indexOf(fn);
                if (index != -1) TranslateService.events.splice(index, 1);
            }
        };
    }
}

export default new TranslateService();