import React from "react";
import OptimizedComponent from "./components/optimizedComponent";

import { Switch } from "react-router-dom";
import {
  NoRouteMatched,
  PrivateRoute,
  ActiveRoute,
  Route,
  Prompt
} from "./components/routing/imports";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import PageHeader from "./components/pageHeader";
import PageFooter from "./components/pageFooter";
import {
  htmlHelperService,
  routingService,
  stateService
} from "./services/imports";
import { stateEvents } from "./models/imports";

import LandingPage from "./pages/signing/landing";
import ContactPage from "./pages/contact/contact";
import PackagesPage from "./pages/packages/packages";
import PackageInfoPage from "./pages/package-info/package-info";
import dashboardPage from "./pages/dashboard/dashboard";
import dashboardContainerPage from "./pages/index";
import TermsPage from "./pages/terms/terms";
import ResultPage from "./pages/viewResult/resultPage";

const HashDoc = React.lazy(() => import("./pages/signing/hash/hashDoc"));
const HashOnce = React.lazy(() => import("./pages/signing/hash/hashOnce"));
const HashResetPassword = React.lazy(() =>
  import("./pages/signing/hash/hashResetPassword")
);

const RecoverPasswordPage = React.lazy(() =>
  import("./pages/signing/recoverPassword")
);

export default class Navigation extends OptimizedComponent {
  constructor(props) {
    super(props);

    this.state = {
      messages: [],
      showModal: false
    };
  }
  componentDidMount() {
    const handleMessages = (type, data) => {
      if (!Array.isArray(data)) data = { text: data, type };
      else data = data.map((x) => ({ ...{ text: x }, ...{ type } }));
      this.setState((state) => ({
        messages: [...state.messages, data],
        showModal: true
      }));

      setTimeout(() => {
        if (this._componentUnmounted) return;
      }, 30000);
    };
    this.secureSubscription(
      stateService
        .onEvent(stateEvents.globalError)
        .subscribe((data) => handleMessages("error", data))
    );
    this.secureSubscription(
      stateService
        .onEvent(stateEvents.globalActionSucces)
        .subscribe((data) => handleMessages("success", data))
    );
  }

  closeModal = () => {
    this.setState({ showModal: false }, () => {
      htmlHelperService
        .setIdleTimer(500)
        .subscribe(() => {
          this.setState({ messages: [] });
        })
        .unsubscribe();
    });
  };

  render() {
    let messages = [];

    for (let msgs of this.state.messages) {
      if (!Array.isArray(msgs)) msgs = [msgs];
      for (let msg of msgs) {
        if (!msg) continue;
        if (messages.find((x) => x.text == msg.text)) continue;
        messages.push(msg);
      }
    }
    let errorMessages = messages
      .filter((x) => x.type == "error")
      .map((x) => x.text);
    let succesMessages = messages
      .filter((x) => x.type == "success")
      .map((x) => x.text);

    return (
      <div className="App">
        <PageHeader />

        <React.Suspense fallback={null}>
          <Switch>
            <Route
              path={routingService.routes.viewWithHashDoc}
              exact
              component={HashDoc}
            />
            <Route
              path={routingService.routes.viewWithHashOnce}
              exact
              component={HashOnce}
            />
            <Route
              path={routingService.routes.viewWithHashResetPassword}
              exact
              component={HashResetPassword}
            />
            <Route
              path={routingService.routes.contact}
              component={dashboardContainerPage}
            />
            <Route path={routingService.routes.terms} component={TermsPage} />
            <Route
              path={routingService.routes.packages}
              component={PackagesPage}
            />
            <PrivateRoute path={routingService.routes.viewResult} children={(props) => <ResultPage {...props} display = {true} fromRoute = {true} /> }/>
            <PrivateRoute
              path={routingService.routes.Settings}
              exact
              component={PackageInfoPage}
            />
            <PrivateRoute
              path={routingService.routes.startBogAuthorize}
              component={PackageInfoPage}
            />
            <PrivateRoute path={routingService.routes.paymentSucces} children={() => <PackageInfoPage match = {{params: {packetid: null}, fromRoute: true}} /> }/>
            <PrivateRoute path={routingService.routes.paymentFailed} children={() => <PackageInfoPage match = {{params: {packetid: null}, fromRoute: true}} /> }/>
            <PrivateRoute
              path={routingService.routes.dashboard}
              component={dashboardContainerPage}
            />
            <PrivateRoute
              path={routingService.routes.dashboardView}
              component={dashboardContainerPage}
            />
            <ActiveRoute
              path={routingService.routes.default}
              component={LandingPage}
            />
            <ActiveRoute
              path={routingService.routes.landing}
              component={LandingPage}
            />
            <Route
              path={routingService.routes.recoverPassword}
              exact
              component={RecoverPasswordPage}
            />
            <Route
              path={routingService.routes.register}
              exact
              component={RecoverPasswordPage}
            />

            <Route component={NoRouteMatched} />
          </Switch>
        </React.Suspense>

        <Prompt />

        <Modal
          isOpen={this.state.showModal && errorMessages.length > 0}
          fade={true}
          toggle={(e) => {
            this.closeModal();
          }}
        >
          <ModalHeader>
            <span>
              &nbsp;
              <span onClick={() => this.closeModal()} className="clickable">
                <img src="../../assets/images/close32.svg" />
              </span>
            </span>
          </ModalHeader>
          <ModalBody>
            <div className="additional color-three">
              <img src="../../assets/images/modal-error.svg" />
              <div className="title">{errorMessages[0]}</div>
            </div>
          </ModalBody>
        </Modal>

        <Modal
          isOpen={this.state.showModal && succesMessages.length > 0}
          fade={true}
          toggle={(e) => {
            this.closeModal();
          }}
        >
          <ModalHeader>
            <span>
              &nbsp;
              <span onClick={() => this.closeModal()} className="clickable">
                <img src="../../assets/images/close32.svg" />
              </span>
            </span>
          </ModalHeader>
          <ModalBody>
            <div className="additional color-black">
              <img src="../../assets/images/modal-success.svg" />
              <div className="title">{succesMessages[0]}</div>
            </div>
          </ModalBody>
        </Modal>
        <PageFooter />
      </div>
    );
  }
}
