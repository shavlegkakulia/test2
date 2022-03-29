import React from "react";
import OptimizedComponent from "../../components/optimizedComponent";
import { translateService, routingService, stateService } from "../../services/imports";
import LoginPage from "./login";
import RegisterPage from "./register";
import RecoverPasswordPage from "./recoverPassword";
import { Switch } from "react-router-dom";
import {
  NoRouteMatched,
  Route
} from "../../components/routing/imports";
import { stateEvents } from "../../models/imports";
import ContactPage from './../contact/contact';
import TermsPage from './../terms/terms';
import Packages from './../packages/packages';

export default class LandingPage extends OptimizedComponent {
  constructor(props) {
    super(props);

    this.state = {
      modalPageType: null
    }
  }

  componentDidMount() {
    this.secureSubscription(stateService.onEvent(stateEvents.openModalPage).subscribe(type => {
      this.setState({modalPageType: type});
  }));
  }

  openModalPage = (type) => {
    stateService.event(stateEvents.openModalPage, type);
  }

  render() {
    return (
      <React.Fragment>
          {this.state.modalPageType && (this.state.modalPageType === routingService.routeNames.contact ?
      <ContactPage display={true} /> :
      this.state.modalPageType === routingService.routeNames.terms ?
      <TermsPage display={true} /> :
      this.state.modalPageType === routingService.routeNames.packages ?
      <Packages /> : null ) }
      <div className={`registration container ${translateService.key} ${this.state.modalPageType ? 'd-none': ''}`}>
        <div className="row row-left">
          <div className="welcome">
            <div className="text-one color-white">
              {translateService.t("common.welcomeBack")}
            </div>
            <div className="text-two color-white">
              {translateService.t("common.aboutUs")}
            </div>
          </div>
          <div className="select-package">
            <button className="button color-two" onClick={() => this.openModalPage(routingService.routeNames.packages)}>
              {translateService.t("common.selectPackage")}
            </button>
          </div>
        </div>
        <div className="row row-right">
          <Switch>
            <Route
              path={routingService.routes.default}
              exact
              component={LoginPage}
            />
            <Route
              path={routingService.routes.landing}
              exact
              component={LoginPage}
            />
            <Route
              path={routingService.routes.register}
              exact
              component={RegisterPage}
            />
            <Route
              path={routingService.routes.login}
              exact
              component={LoginPage}
            />
            <Route
              path={routingService.routes.recoverPassword}
              exact
              component={RecoverPasswordPage}
            />
            <Route component={NoRouteMatched} />
          </Switch>
        </div>
      </div>
      </React.Fragment>
    );
  }
}
