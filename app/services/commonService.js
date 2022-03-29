import axios from 'axios';
import translateService from './translateService';
import stateService from './stateService';
import { fileTypes, stateEvents, defaults, states } from '../models/imports';
import { authService } from './imports';

class CommonService {
    guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

     debounce(func, wait, immediate) {
      
        var timeout;
      
       
        return function() {
     
          var context = this,
            args = arguments;
      
        
          var callNow = immediate && !timeout;
      
       
          clearTimeout(timeout);
      
        
          timeout = setTimeout(function() {
      
          
            timeout = null;
      
           
            if (!immediate) {
            
              func.apply(context, args);
            }
          }, wait);
      
         
          if (callNow) func.apply(context, args);
        }
      }

    formatNumber(number, digits = 2, skipEndingZeros) {
        if (!number && number !== 0) return "";
        if (typeof number == 'string') number = Number(number);

        let numberStr = number.toFixed(digits + 1);
        numberStr = numberStr.substring(0, numberStr.length - 1);

        let dotIndex = numberStr.indexOf('.');
        let mainPart = dotIndex == -1 ? numberStr : numberStr.substring(0, dotIndex);
        let floatPart = dotIndex == -1 ? "" : numberStr.substring(dotIndex + 1);

        while (skipEndingZeros && floatPart && floatPart[floatPart.length - 1] == '0') {
            floatPart = floatPart.substring(0, floatPart.length - 1);
        }

        if (!floatPart) return mainPart;
        return `${mainPart}.${floatPart}`;
    }

    shrinkNumber(number) {
        if (!number && number !== 0) return "";
        if (typeof number == 'string') number = Number(number);

        if (number > 1000000) return (number / 1000000).toFixed(1) + 'M';
        if (number > 1000) return (number / 1000).toFixed(1) + 'K';
        return number.toFixed(0);
    }

    compareObjectValues(obj1, obj2) {
        let getObjVal = (obj) => {
            return JSON.stringify(obj);
        }

        return getObjVal(obj1) === getObjVal(obj2);
    }

    toShortCode(str, length) {
        if(!str || str && str.length <= length) return str;
        return str.substr(0, length).concat("***", str.substring(str.length - length))
    }

    //helper function to set state property using string. ex: setStateProperty('person.contacts[0].country.name', "georgia")
    createStateProperty(instance) {
        const normalizeProperty = function (prop) {
            let parts = prop.split('[');
            let content = [parts[0]]
            for (let i = 1; i < parts.length; i++) {
                let part = [parts[i]];
                content.push(Number(part.substring(0, part.length - 1)));
            }
            return content;
        };

        const newReference = function (val) {
            if (Array.isArray(val)) return [...val];
            return { ...val };
        }

        return (obj, then) => {
            instance.setState((state, props) => {
                //get config
                let config = typeof obj === "function" ? obj(state, props) : obj;
                let nextState = {};

                //from config props create nextState
                for (let prop in config) {
                    let parts = prop.split('.');
                    let root;
                    for (let i = 0; i < parts.length; i++) {
                        let [name, ...indexes] = normalizeProperty(parts[i]);
                        if (parts.length == 1 && !indexes.length) {
                            nextState[name] = config[prop];
                            break;
                        }

                        if (i === 0) {//if root element get from state
                            if (nextState[name] !== undefined)
                                root = nextState[name];
                            else {
                                root = newReference(state[name]);
                                nextState[name] = root;
                            }
                        }
                        else if (i == (parts.length - 1) && !indexes.length) {
                            root[name] = config[prop];
                            break;
                        }
                        else {//renew reference of property and set root to this property
                            root[name] = newReference(root[name]);
                            root = root[name];
                        }
                        for (let j = 0; j < indexes.length; j++) {//if indexes renew index reference end set root to this index value
                            let index = indexes[j];
                            if (i == (parts.length - 1) && j == (indexes.length - 1)) root[index] = config[prop];
                            else {
                                root[index] = newReference(root[index]);
                                root = root[index];
                            }
                        }
                    }


                }

                return nextState;
            }, then);
        };
    }

    //register common interseptors for normalzing response
    //when objectResponse is passed in config returns noly ObjectResponse
    registerCommonInterceptor() {
        let requestInterceptor = axios.interceptors.request.use((config) => {
            config.headers = config.headers || {}; 
            config.headers['locale'] = translateService.key || defaults.locale.key;

            return config;
        });

        let responseInterceptor = axios.interceptors.response.use(
            response => {
                if (!response.config.objectResponse) return Promise.resolve(response);

                let data = response.data || {};
                if (!data.success && !data.token) {
                    response.errorMessage = data.errorMessage || translateService.t("validation.error");
                    response.customError = true;
                    if (!response.config.skipCustomErrorHandling)
                        stateService.event(stateEvents.globalError, response.errorMessage);

                    return Promise.reject(response);
                }
                return Promise.resolve(data);
            },
            error => {
                if (navigator && !navigator.onLine) {
                    if (!error.config.skipCustomErrorHandling)
                    stateService.event(stateEvents.globalError, "No internet connection");
                }
                if(!error?.response){
                    authService.signOut();
                    return Promise.reject(error);
                }

                if(error.response.status === 401 || error.response.status === 403 || error.config.anonymous || error.config.skipRefresh) {
                  error.errorMessage = "error.unauthorized";
                  if(error.config.fromLogin || error.config.anonymous)
                    stateService.event(stateEvents.globalError, error?.response?.data?.errorMessage || translateService.t(error.errorMessage));
                  return Promise.reject(error);
                }

                else error.errorMessage = "error.error";

                stateService.event(stateEvents.globalError, translateService.t(error.errorMessage));

                return Promise.reject(error);
            }
        );

        return {
            unsubscribe: () => {
                axios.interceptors.request.eject(requestInterceptor);
                axios.interceptors.response.eject(responseInterceptor);
            }
        };
    }

    setTimeout(time, ...args) {
        return {
            subscribe: (fn) => {
                let timeout = setTimeout(fn, time, args);
                return {
                    unsubscribe: () => { clearTimeout(timeout); }
                };
            }
        };
    }

    getTimeZone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    getTypeFromExtension(ext) {
        if (ext) {
            if (ext.indexOf('.') !== - 1) ext = ext.substring(ext.lastIndexOf('.') + 1).toLowerCase();
            if (ext) {
                for (let prop in mimeTypes) {
                    let type = mimeTypes[prop];
                    if (type.ext.findIndex(x => x === ext) !== -1) return { contentType: prop, ext, type: type.type }
                }
            }
        }

        return { contentType: 'unknown', ext, type: fileTypes.unknown };
    }


    hasModelChanged(newModel, oldModel, propsToSkip) {
        if (newModel === null || newModel === undefined) return newModel != oldModel;
        if (newModel instanceof Date || newModel instanceof File ||
            (!(typeof newModel === 'object' && newModel.constructor === Object) &&
                !Array.isArray(newModel))) return newModel != oldModel;

        if (Array.isArray(newModel)) {
            if (!Array.isArray(oldModel)) return true;
            if (newModel.length !== oldModel.length) return true;

            for (let i = 0; i < newModel.length; i++) {
                if (this.hasModelChanged(newModel[i], oldModel[i], propsToSkip)) return true;
            }
            return false;
        }

        for (let prop in newModel) {
            if (propsToSkip && propsToSkip[prop]) continue;

            if (newModel[prop] &&
                !(newModel[prop] instanceof Date) &&
                !(newModel[prop] instanceof File) &&
                ((typeof (newModel[prop]) === 'object' && newModel[prop].constructor === Object) || Array.isArray(newModel[prop]))) {
                if (this.hasModelChanged(newModel[prop], oldModel[prop])) return true;
            }
            else if (newModel[prop] != oldModel[prop]) return true;
        }
        return false;
    }

    arrayMove(array, oldIndex, newIndex, exchange) {
        array = [...array];
        if (oldIndex == newIndex) return array;

        let temp = array[oldIndex];
        if (exchange) {
            array[oldIndex] = array[newIndex];
            array[newIndex] = temp;

            return array;
        }

        if (oldIndex < newIndex)
            for (let i = oldIndex; i <= newIndex; i++) {
                if (i === newIndex) array[i] = temp;
                else array[i] = array[i + 1];
            }
        else
            for (let i = oldIndex; i >= newIndex; i--) {
                if (i === newIndex) array[i] = temp;
                else array[i] = array[i - 1];
            }

        return array;
    }
}

export default new CommonService();

const mimeTypes = {
    'application/pdf': { ext: ['pdf'], type: fileTypes.pdf },
}