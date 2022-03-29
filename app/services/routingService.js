import { Subject } from 'rxjs';

class RoutingService {
    constructor() {
        let baseUrl = globalConfig.base_URL;
        this.beforeChangeHandler = new Subject();
        this.beforeChangeEvents = [];
        this.routes = [];
        this.routeNames = {
            default: 'default',
            login: 'login',
            register: 'register',
            register: 'register',
            landing: 'landing',
            recoverPassword: 'recoverPassword',
            contact: 'contact',
            packages: 'packages',
            Settings: 'Settings',
            dashboard: 'dashboard',
            terms: 'terms',
            viewResult: 'viewResult',
            viewWithHashDoc: 'viewWithHashDoc',
            viewWithHashResetPassword: 'viewWithHashResetPassword',
            viewWithHashOnce: 'viewWithHashOnce',
            viewPayment: 'viewPayment',
            startBogAuthorize: 'startBogAuthorize',
            cancellPayment: 'cancellPayment',
            paymentSucces: 'paymentSucces',
            paymentFailed: 'paymentFailed',
            dashboardView: 'dashboardView'
        }
   
        this.routes[this.routeNames.default] = `${baseUrl}`;
        this.routes[this.routeNames.login] = `${baseUrl}landing/login/`;
        this.routes[this.routeNames.register] = `${baseUrl}landing/register/`;
        this.routes[this.routeNames.landing] = `${baseUrl}landing/`;
        this.routes[this.routeNames.recoverPassword] = `${baseUrl}landing/recover-password/`;
        this.routes[this.routeNames.contact] = `${baseUrl}contact`;
        this.routes[this.routeNames.packages] = `${baseUrl}packages`;
        this.routes[this.routeNames.Settings] = `${baseUrl}Settings`;
        this.routes[this.routeNames.dashboard] = `${baseUrl}dashboard`;
        this.routes[this.routeNames.terms] = `${baseUrl}terms`;
        this.routes[this.routeNames.viewResult] = `${baseUrl}viewResult/:id`;
        this.routes[this.routeNames.viewWithHashDoc] = `${baseUrl}auth/api/public/authWithHash/pdf/:hash`;
        this.routes[this.routeNames.viewWithHashResetPassword] = `${baseUrl}auth/api/public/authWithHash/resetPassword/:hash`;
        this.routes[this.routeNames.viewWithHashOnce] = `${baseUrl}auth/api/public/authWithHash/once/:hash`;
        this.routes[this.routeNames.viewPayment] = `${baseUrl}viewPayment`;
        this.routes[this.routeNames.startBogAuthorize] = `${baseUrl}Settings/startBOGAuthorize/:packetid`;
        this.routes[this.routeNames.cancellPayment] = `${baseUrl}cancellPayment`;
        this.routes[this.routeNames.paymentSucces] = `${baseUrl}Settings/payment/success`;
        this.routes[this.routeNames.paymentFailed] = `${baseUrl}Settings/payment/failed`; 
        this.routes[this.routeNames.dashboardView] = `${baseUrl}dashboardView/:docId`;
    }

    //set history and match objects
    routeChanged(history, match) {
        this.history = history;
        this.match = match;
    }

    //set prompt text before route change
    beforChange(prompt, priority = 0) {
        if (!prompt) return;
        if (!(typeof prompt == "string" || typeof prompt == "function")) {
            this.beforeChangeHandler.next(prompt);
            return;
        }

        let val = { prompt, priority };
        this.beforeChangeEvents.push(val);
        this.beforeChangeEvents.sort((a, b) => b - a);
        this.beforeChangeHandler.next(this.beforeChangeEvents.map(x => x.prompt));
        return {
            unsubscribe: () => {
                let index = this.beforeChangeEvents.indexOf(val);
                if (index !== -1) this.beforeChangeEvents.splice(index, 1);
                this.beforeChangeHandler.next(this.beforeChangeEvents.map(x => x.prompt));
            }
        };
    }

    //listen route changed event
    listen(imediateExec = true) {
        let unlistened = false;
        return {
            subscribe: (fn) => {
                let exec = (data) => {
                    setTimeout(() => {
                        if (unlistened) return;
                        fn(data);
                    }, 20);
                }
                if (imediateExec) exec();
                let unlisten = this.history.listen(data => {
                    exec(data);
                });
                return {
                    unsubscribe: () => {
                        unlistened = true;
                        unlisten();
                    }
                };
            }
        }
    }

    //get route path from name and optional params
    routePath(name, params) {
        let route = this.routes[name];
        if (!route) return '';

        if (params) {
            for (let prop in params) {
                route = route.replace(`:${prop}`, params[prop]);
            }
        }

        return route;
    }

    //get route name from path
    routeName(path, checkSlash = true) {
        if (!path) path = this.history.location.pathname;
        if (!path.endsWith('/') && checkSlash) path += '/';

        for (let routeName in this.routes) {
            let route = this.routes[routeName];

            for (let param in this.match.params) {
                route = route.replace(`:${param}`, this.match.params[param]);
            }
            
            if (route == path) return routeName;
        }
        return null;
    }

    //is current route equal to name
    is(...names) {
        let routName = this.routeName();

        for (let name of names) {
            if (name === routName) return true;
        }
        return false;
    }

    //refresh current route
    refresh() {
        this.history.replace(location.pathname + location.search);
    }

    //redirect to route
    push(name, props) {
        props = props || {};

        let path = this.routePath(name, props.params);
        if (props.query) path += this.toQuery(props.query);
        this._data = props.data;

        this.history.push(path);
    }

    //replace route
    replace(name, props) {
        props = props || {};

        let path = this.routePath(name, props.params);
        if (props.query) path += this.toQuery(props.query);
        this._data = props.data;

        this.history.replace(path);
    }

    //pushes if different route or replaces if current
    navigate(name, props) {
        props = props || {};
        let routePath = this.routePath(name, props.params);

        if (routePath == this.history.location.pathname) {
            this.replace(name, props);
        }
        else this.push(name, props);
    }

    //go back
    back(toDefault = false) {
        if(toDefault) {
            if(this.history.length <= 2) {
                this.push(this.routes.default);
                return;
            }
        }
        this.history.goBack();
    }

    //get query object
    get query() {
        if (!window.location.search) return {};
        let search = window.location.search.substring(1);
        return JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) { return key === "" ? value : decodeURIComponent(value) });
    }

    //set query
    set query(params) {
        let query = this.toQuery(params);
        if (!query) return;

        let path = this.history.location.pathname;
        this.history.replace(path + (query || ''));
    }

    //get query string
    toQuery(query) {
        if (!query) return null;
        let queryStr = '';

        if (typeof query == 'string') {
            queryStr = query && (query[0] != '?' ? '?' : '' + query);
        }
        else {
            queryStr = '?';
            for (let prop in query) {
                if (queryStr != '?') queryStr += '&';
                queryStr += `${prop}=${encodeURIComponent(query[prop])}`;
            }
        }
        return queryStr;
    }

    get params() {
        return this.match.params;
    }

    get data() {
        return this._data;
    }
}

export default new RoutingService();