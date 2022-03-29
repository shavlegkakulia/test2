import React from "react"
import { Route, Redirect } from 'react-router-dom';
import { fromEvent } from 'rxjs';

import SimpleRoute from './simpeRoute';

import { authService, routingService } from '../../services/imports';
import { defaults } from '../../models/imports';

//Route available only when user is not authentication. else redirects to default page
export default class ActiveRoute extends SimpleRoute {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.tabFocusSubscription = fromEvent(window, 'focus').subscribe(e => {
            if (authService.isAuthenticated() && authService.isActive()) window.location.reload();
        });
    }

    componentWillUnmount() {
        if (this.tabFocusSubscription) this.tabFocusSubscription.unsubscribe();
    }

    render() {
        let { redirectPath, ...props } = this.props;

        return (
            !authService.isActive() ?
                (<Route {...this.getInjectedProps()} />) :
                (<Redirect to={routingService.routePath(redirectPath || defaults.authRoute)} />)
        );
    }
}