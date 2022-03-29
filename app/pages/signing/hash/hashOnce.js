import React from 'react';
import OptimizedComponent from '../../../components/optimizedComponent';

import { routingService, authService, stateService, translateService } from '../../../services/imports';
import { states, defaults } from '../../../models/imports';

export default class VerifyPage extends OptimizedComponent {
    constructor(props) {
        super(props);
    }

    componentDidMount() { 
        this.secureSubscription(authService.verify(routingService.params.hash, 'once').subscribe(resp => {
            if (authService.isAuthenticated()) authService.signOut(false);
            authService.setToken(resp.data.token, resp.data.refreshToken);
            let userInfo = authService.userInfo();
            userInfo.subscribe(
              res => {
                if (res.success) {
                  translateService.use(res.data.localeId);
                  stateService.setState(states.userInfo, res.data);
                  routingService.push(defaults.authRoute);
                } else {
                  routingService.replace('landing');
                }
              }
            );
           

        }, err => {
            routingService.replace('landing');
        }));
    }

    render() {
        return null;
    }

}