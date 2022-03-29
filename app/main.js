import React from "react";
import {
  translateService,
  authService,
  commonService,
  stateService
} from "./services/imports";
import { states, stateEvents, defaults, verifyStatuses } from "./models/imports";
import Navigation from "./navigation";
import { Scrollbars } from 'react-custom-scrollbars';
import GraphqlClientService from './services/GraphqlClientService';

export default class MainComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      initialized: false,
    };

    this.subscriptions = [
      commonService.registerCommonInterceptor(),
      authService.registerAuthInterceptor(),
    ];
  }

  //refresh on translate change
  //clear state on signout
  //if authorized get current user info
  //if authorized change lang else set en
  componentDidMount() {
    this.subscriptions.push(
      translateService.subscribe((_) => {

        this.forceUpdate();
      })
    );

    this.subscriptions.push(stateService.onEvent(stateEvents.scrollUp).subscribe(() => {
      this.defScrollbar.scrollTop(0);
      })
    );

    this.subscriptions.push(stateService.onEvent(stateEvents.signOut).subscribe((closeWSConnection) => {
      
      if(closeWSConnection) {
        GraphqlClientService.CloseConnection();
      }
        this.profileSub = null;
        stateService.clearState(null, false, states.allLocales);
      })
    );

    let initialize = (lang) => {
      if (!lang) {
        translateService.use(defaults.locale.value, defaults.locale.key);
      }
      this.setState({ initialized: true });
    };

    const fn = () => {
      if (authService.isAuthenticated()) {
        let userInfo = authService.userInfo();
        this.subscriptions.push(userInfo);

        userInfo.subscribe((res) => {
            if (!res.success) {
              initialize();
              return;
            }

            if(res.data.userStatus != verifyStatuses.verified) {
              
              setTimeout(() => {
                GraphqlClientService.CloseConnection();
              }, 1000);
            }

            translateService.use(res.data.localeId, res.data.localeCode, () => {
              stateService.setState(states.userInfo, res.data);
              initialize(res.data.localeId);
            });
          },
          () => {
            initialize();
          }
        );

  
      } else {
        
        setTimeout(() => {
          if(!authService.isAuthenticated())
            GraphqlClientService.CloseConnection();
        }, 1000);
        initialize();
      } 
    };

    const setLocales = (locales) => {
      stateService.setState(states.allLocales, {allLocales: locales});
      translateService.locales = locales;
    };

    translateService.fetchLocales().then((resp) => {
      setLocales(resp.data.data);
    });

    fn();
  }

  //global catch for render error
  componentDidCatch(error, info) {
    console.error(error);
  }

  //free subscriptions
  componentWillUnmount() {
    for (let sub of this.subscriptions) {
      sub.unsubscribe && sub.unsubscribe();
    }
    this.subscriptions = [];
    GraphqlClientService.CloseConnection();
  }

  render() {
    
    return this.state.initialized ? <Scrollbars ref={sb => this.defScrollbar = sb} autoHide className="BodyListScrollbar" ><Navigation />  </Scrollbars> : null;
  
  }
}
