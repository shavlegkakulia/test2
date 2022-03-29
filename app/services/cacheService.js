import { of } from 'rxjs'
import { map } from 'rxjs/operators';

export class CacheService{
    constructor(){
        this._cache = {};
    }

    addCache(key, value, minutes = 5){
        let time = minutes * 60 * 1000;
        let item = {
            value,
            validTo: time? (new Date()).getTime() + time : null
        };
        this._cache[key] = item;
    }

    getCache(key){
        let item = this._cache[key];
        if(!item) return undefined;

        if(!item.validTo || item.validTo >= (new Date()).getTime()) return item.value;
        return undefined;
    }

    //fn should return Observable
    fromCache(key, fn, minutes = 5){
        let value = this.getCache(key);
        if(value) return of(value);

        let observable = fn();
        return observable.pipe(map(value => {
            this.addCache(key, value, minutes);
            return value;
        }));
    }

    clearCache(key){
        if(key === undefined)this._cache = {};
        else delete this._cache[key];
    }
}