import React from 'react';

import { authService, routingService } from '../../services/imports';
import { defaults } from '../../models/imports';

//if no route matched redirects to default page
export default class NoRouteMatched extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        
        if (!authService.isAuthenticated())
            routingService.replace(defaults.notAuthRoute);
        else
            routingService.replace(defaults.authRoute);
    }

    render() {
        return null;
    }
}