import React from "react"
import { routingService, translateService, commonService } from '../services/imports';

//Optimized component wich calls updates only when state, property, translation or route changes
export default class OptimizedComponent extends React.Component {
    constructor(props) {
        super(props);
        this._optimizedProps = {
            locationKey: routingService.history.location.key,
            lang: translateService.lang
        };

        this.setStateProperty = commonService.createStateProperty(this);
        this._subscriptions = [];
        this._scrollPosition = {};
    }

    //will be removed when component is unmounted
    secureSubscription(key, subscription, clearPrev) {
        if (subscription === undefined) {
            subscription = key;
            key = '';
        }
        else if (clearPrev) this.clearSubscriptions(key, typeof clearPrev == "number" ? clearPrev : null);
        this._subscriptions.push({ key, subscription });
    }

    clearSubscriptions(key, amount) {
        let subscriptions = key === undefined ? [...this._subscriptions] : this._subscriptions.filter(x => x.key === (key || ''));
        if (amount && subscriptions.length < amount) return;
        if (amount) subscriptions = subscriptions.filter((x, i) => i <= (amount / 2));

        for (let item of subscriptions)
            item.subscription.unsubscribe();

        this._subscriptions = this._subscriptions.filter(x => subscriptions.indexOf(x) == -1);
    }

    saveScrollPosition(key, pos) {
        if (!key) key = 'window';
        if (!pos) pos = { x: window.scrollX, y: window.scrollY };
        this._scrollPosition[key] = pos;
    }

    restoreScrollPosition(key, fn, orientation) {
        if (key === true) {
            window.scrollTo(0, 0);
            return;
        }

        if (!key) key = 'window';
        if (!fn) fn = (pos) => {
            window.scrollTo(pos.x || 0, pos.y || 0);
        }
        let pos = this._scrollPosition[key] || {};
        if (orientation == 'x') pos.y = 0;
        else if (orientation == 'y') pos.x = 0;

        fn(pos)
    }

    //checks if container with immutable objects has changed
    hasImmutableContainerChanged(container, nextContainer, propsToSkip) {
        //if none exists return false
        if (!container && !nextContainer) return false;
        //if one of them is null return true
        if (!(container && nextContainer)) return true;

        //check prop changes
        for (let prop in container) {
            if (propsToSkip && propsToSkip[prop]) continue;
            if (container[prop] !== nextContainer[prop]) return true;
        }

        for (let prop in nextContainer) {
            if (propsToSkip && propsToSkip[prop]) continue;
            if (container[prop] !== nextContainer[prop]) return true;
        }

        return false;
    }

    //has prop.children changed
    hasChildrenChanged(children, nextChildren) {
        //no children
        if (!children && !nextChildren) return false;
        //if one of them is null
        if (!(children && nextChildren)) return true;

        //children element count not equal
        if (children.length !== nextChildren.length) return true;

        //convert to array if only child
        if (!Array.isArray(children)) children = [children];
        if (!Array.isArray(nextChildren)) nextChildren = [nextChildren];

        //children changed
        for (let i = 0; i < children.length; i++) {
            let isReactElement = children[i].$$typeof === Symbol.for('react.element') || nextChildren[i].$$typeof === Symbol.for('react.element');
            let isArray = Array.isArray(children[i]) || Array.isArray(nextChildren[i]);

            if (isReactElement) {
                if (children[i].key === null || nextChildren[i].key === null) return true;
                if (children[i].key !== nextChildren[i].key) return true;
            }
            else {
                if (isArray && this.hasChildrenChanged(children[i], nextChildren[i])) return true;
                else if (!isArray && children !== nextChildren) return true;
            }
        }

        return false;
    }

    //checking if object should call update
    shouldComponentUpdate(nextProps, nextState, config) {
        config = config || {};

        if (this._optimizedProps.locationKey !== routingService.history.location.key || this._optimizedProps.lang !== translateService.lang) {
            this._optimizedProps.locationKey = routingService.history.location.key;
            this._optimizedProps.lang = translateService.lang;
            return true;
        }

        //shallow comparision not needed. Only changes when setState is called.
        if (this.state !== nextState) return true;

        if (this.hasImmutableContainerChanged(this.props, nextProps, { ...config.propsToSkip, ...{ children: true } })) return true;
        if (!config.skipChildrenComparision && this.hasChildrenChanged(this.props.children, nextProps.children)) return true;

        return false;
    }

    componentWillUnmount() {
        this.clearSubscriptions();

        //this is untipatern and should be avoided to use
        this._componentUnmounted = true;
    }
}