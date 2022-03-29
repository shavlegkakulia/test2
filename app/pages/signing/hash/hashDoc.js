import React from 'react';
import OptimizedComponent from '../../../components/optimizedComponent';

import { routingService, authService, stateService, translateService } from '../../../services/imports';
import { states, defaults, verifyStatuses } from '../../../models/imports';

export default class VerifyPage extends OptimizedComponent {
    constructor(props) {
        super(props);
    }

    componentDidMount() { 
        this.secureSubscription(authService.verify(routingService.params.hash, 'pdf').subscribe(resp => {
            if (authService.isAuthenticated()) authService.signOut();
            authService.setToken(resp.data.token, resp.data.refreshToken);
            let userInfo = authService.userInfo();
            userInfo.subscribe(
              res => {
                if (res.success) {
                  translateService.use(res.data.localeId);
                  stateService.setState(states.userInfo, res.data);
                  
                  const userStatus = res.data.userStatus;
                  if(userStatus === verifyStatuses.verified) {
                    routingService.push("dashboardView", { params: { docId: resp.data.pdfId } });
                  } else {
                    routingService.push("viewResult", { params: { id: resp.data.pdfId } });
                  }
                  
                } else {
                  routingService.push(defaults.authRoute);
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