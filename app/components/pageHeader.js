import React from "react";
import OptimizedComponent from "./optimizedComponent";
import {
  routingService,
  authService,
  translateService,
  stateService,
  commonService,
  workSpacesService,
  htmlHelperService,
} from "../services/imports";
import { defaults, states } from "../models/imports";
import { stateEvents } from "./../models/states";
import DropDown from "../components/dropDown";
import FacsimileEditor from "./facsimileEditor";

export default class PageHeader extends OptimizedComponent {
  constructor(props) {
    super(props);
    this.state = {
      userName: null,
      languagesData: [],
      domains: [],
      activeLang: {
        value: defaults.locale.value,
        key: defaults.locale.key,
      },
      activeDomain: null,
      workSpaceId: null,
      isLoading: true,

      signatureProcessStep: 1,
      signatureProcessVisible: false,
      activeCardIndex: 1,
      currentLang: translateService.key,
      facsimData: null,
      currentFacsimData: null,
      useFacsimile: 0,
      faximCardInitialized: false,
    };

    this.subscriptions = [];
  }

  logout = (e) => {
    e.preventDefault();

    this.secureSubscription(authService.signOut());
    routingService.push(defaults.notAuthRoute);
  };

  setLang = (lang) => {
    translateService.use(lang.id, lang.key, translateService.changeUserLocale);
    this.setState((prevState) => {
      let activeLang = { ...prevState.activeLang };
      activeLang.value = lang.value;
      activeLang.key = lang.key;

      return { ...prevState, activeLang };
    });
  };

  setDomain = (domain) => {
    this.setState({ activeDomain: domain.value }, () => {
      stateService.event(states.changeWorkSpace, domain.id);
      let userInfo = { ...this.state.userInfo };
      userInfo.workspaceId = domain.id;
      stateService.setState(states.userInfo, userInfo);
    });
  };

  openModalPage = () => {
    const type =
      authService.isAuthenticated() && authService.isActive()
        ? routingService.routeNames.Settings
        : routingService.routeNames.packages;
    stateService.event(stateEvents.openModalPage, type);
  };

  goHome = () => {
    routingService.navigate("/");
    stateService.event(stateEvents.openModalPage, null);
  };

  componentDidMount() {
    this.subscriptions.push(stateService.onEvent(stateEvents.logouted).subscribe(() => {
      this.setState({signatureProcessVisible: false});
      this.resetFacsimileStates();
      })
    );

    this.secureSubscription(
      stateService.getState(states.allLocales).subscribe((data) => {
        if (!data?.allLocales) {
            return;
        }
        const locales = data.allLocales;
        this.setState({ languagesData: locales }, () => {
          this.secureSubscription(
            stateService.getState(states.userInfo).subscribe((data) => {
              this.setState(
                (prevState) => {
                  let activeLang = { ...prevState.activeLang };

                  let curLang = this.state.languagesData?.filter(
                    (l) => l.id == data.localeId
                  );
                  if (curLang.length) {
                    curLang = curLang[0];
                    activeLang.value = curLang.value;
                    activeLang.key = curLang.key;
                  } else {
                    activeLang.value = defaults.locale.value;
                    activeLang.key = defaults.locale.key;
                  }
                  let workSpaceId = data.workspaceId;
                  let userName = data.mail;
                  let userInfo = { ...data };
                  let useFacsimile = data.useFacsimile;
                  let currentFacsimData = data.facsimilePath;

                  return {
                    ...prevState,
                    activeLang,
                    workSpaceId,
                    userName,
                    userInfo,
                    isLoading: true,
                    useFacsimile,
                    currentFacsimData,
                  };
                },
                () => {
                  if (authService.isAuthenticated()) {
                    this.secureSubscription(
                      workSpacesService.getWorkSpaces().subscribe((res) => {
                        this.setState(
                          (prevState) => {
                            let domains = res.data;

                            let activeDomain = [...domains].filter(
                              (w) => w.id === prevState.workSpaceId
                            );

                            if (activeDomain.length)
                              activeDomain = activeDomain[0].value;
                            return {
                              ...prevState,
                              domains,
                              activeDomain,
                              isLoading: false,
                            };
                          },
                          () => {
                            stateService.setState(states.allWorkSpaces, {
                              domain: this.state.activeDomain,
                            });
                          }
                        );
                      })
                    );
                  } else {
                    this.setState({ isLoading: false });
                  }
                }
              );
            })
          );
        });
      })
    );
  }

  /* facsimile */
  setActivefacsimData = (data, index) => {
    this.setState({ activeCardIndex: index, facsimData: data });
  };

  validateWithoutApostile = () => {
    this.endSugnatureProcess();
  };

  startSignatureEditing = () => {
    this.setState({ signatureProcessVisible: true });

    htmlHelperService
      .setIdleTimer(800)
      .subscribe(() => {
        this.setState({ faximCardInitialized: true });
      })
      .unsubscribe();
  };

  endSugnatureProcess = () => {
    this.setState({ signatureProcessVisible: false });
  };

  sendFacsimData = (data) => {
    this.setState(
      (prevState) => {
        prevState.useFacsimile = (prevState.useFacsimile || 0) + 1;
        return prevState;
      },
      () => {
        this.endSugnatureProcess();
      }
    );

    const userData = {...stateService.getState(states.userInfo).value};
    userData.facsimilePath = data;
    userData.useFacsimile = (userData.useFacsimile || 1);
    stateService.setState(states.userInfo, userData);
  };

  resetFacsimileStates = () => {
    this.setState({
      activeCardIndex: 1,
      facsimData: null,
    });
  };

  render() {
    const languages = (
      <div className="dropDown">
        {this.state.languagesData &&
          this.state.languagesData.map(
            (lang) =>
              lang.value != this.state.activeLang.value && (
                <div
                  key={lang.id}
                  onClick={() => this.setLang(lang)}
                  className={`dropDownItem ${
                    this.state.activeLang.value == lang.value ? "active" : ""
                  }`}
                >
                  <img src={`../../assets/images/${lang.key}.svg`} />
                  {lang.value}
                </div>
              )
          )}
      </div>
    );

    const domains =
      (this.state.domains?.length == 1 &&
        this.state.domains[0]?.id == this.state.workSpaceId) ||
      !authService.isAuthenticated() ||
      !authService.isActive() ||
      this.state.isLoading ? null : (
        <div className="dropDown">
          {this.state.domains.map((domain) => (
            <div
              key={domain.id}
              onClick={() => this.setDomain(domain)}
              className={`dropDownItem ${
                this.state.activeDomain == domain.value ? "active" : ""
              }`}
            >
              {commonService.toShortCode(domain.value, 8)}
            </div>
          ))}
        </div>
      );

    return (
      <header className={`header ${translateService.key}`}>
        <div className="header-item-left">
          <div className="logo clickable" onClick={this.goHome}>
            <img src="../../assets/images/logo.svg" className="for-web" />
            <img
              src="../../assets/images/logo-for-small-devices.svg"
              className="for-mobile"
            />
          </div>
          <div
            className={`title ${
              authService.isActive() && authService.isAuthenticated()
                ? "for-web"
                : ""
            }`}
          >
            {translateService.t("common.defaultTitle")}
          </div>
        </div>
        <div className="header-item-right">
          {domains && (
            <div className="account-switcher">
              <DropDown
                current={commonService.toShortCode(this.state.activeDomain, 8)}
                tapImg="../../assets/images/updownarrow.svg"
                className="dropDownComponent"
                activeClassName="active"
                tapClassName="toggle clickable"
              >
                {domains}
              </DropDown>
            </div>
          )}
          {authService.isAuthenticated() &&
            authService.isActive() &&
            this.state.userName && (
              <div className="userEmail">
                <span>{this.state.userName}</span>
                <img src="../../assets/images/man.svg" />
              </div>
            )}
          <div className="lang-switcher">
            <DropDown
              current={
                <div className="activeLang">
                  {" "}
                  <img
                    src={`../../assets/images/${this.state.activeLang.key}.svg`}
                  />
                </div>
              }
              className="dropDownComponent"
              tapClassName="toggle clickable"
            >
              {languages}
            </DropDown>
          </div>
          {authService.isAuthenticated() && authService.isActive() && (
            <div className="hamburger-menu clickable">
              <DropDown
                current={this.state.activeMenu}
                tapImg="../../assets/images/hamburger.svg"
                className="dropDownComponent"
                tapClassName="toggle clickable"
              >
                <div className="dropDown">
                  <div className="dropDownItem" onClick={this.openModalPage}>
                    {translateService.t("common.settings")}
                  </div>
                  <div
                    className="dropDownItem"
                    onClick={this.startSignatureEditing}
                  >
                    {translateService.t("common.facsimile")}
                  </div>
                  <div className="dropDownItem" onClick={this.logout}>
                    {translateService.t("common.logout")}
                  </div>
                </div>
              </DropDown>
            </div>
          )}
        </div>
        <FacsimileEditor
          isEditing={this.state.useFacsimile > 0}
          isVisible={this.state.signatureProcessVisible}
          onClosed={this.resetFacsimileStates}
          onToggle={this.endSugnatureProcess}
          signatureProcessStep={this.state.signatureProcessStep}
          faximCardInitialized={this.state.faximCardInitialized}
          currentLang={this.state.currentLang}
          sendFacsimData={this.sendFacsimData}
          onSetFacsimData={this.setActivefacsimData}
          activeCardIndex={this.state.activeCardIndex}
          facsimData={this.state.facsimData}
          currentFacsimData={this.state.currentFacsimData}
        />
      </header>
    );
  }
}
