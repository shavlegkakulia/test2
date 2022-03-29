import React from "react";
import {
  translateService,
  stateService,
  routingService,
  billingService,
  workSpacesService,
  htmlHelperService,
  dateHelperService,
} from "../../services/imports";
import OptimizedComponent from "../../components/optimizedComponent";
import {
  createValidationContext,
  Input,
  LoadingButton,
  FieldValidation,
} from "../../components/formcontrols/imports";
import { states, stateEvents } from "../../models/states";
import PaymentDetailsPage from "../payment-details/payment-details";
import { Scrollbars } from "react-custom-scrollbars";
// import FacsimileEditor from "./../../components/facsimileEditor";

export default class PackageInfo extends OptimizedComponent {
  constructor() {
    super();

    this.state = {
      email: "",
      workSpaceId: null,
      packages: [],
      userBillings: [],
      billingPackName: null,
      paymentDetails: null,
      isLoading: false,
      addLoading: false,
      nextPayDate: null,
      activeDomain: null,
      lastTimestamp: 0,
      paymentStatus: null,

      // signatureProcessStep: 1,
      // signatureProcessVisible: false,
      // activeCardIndex: 1,
      // currentLang: translateService.key,
      // facsimData: null,
      // currentFacsimData: null,
      // useFacsimile: 0,
      // faximCardInitialized: false,
    };

    this.emailValidation = createValidationContext();
    this.scrollService = htmlHelperService.createScrollPaging();
  }

  addUserToWorkSpace = () => {
    let valid = this.emailValidation.removeCustomErrors().setDirty().isValid();
    if (!valid) {
      stateService.event(stateEvents.validateCheck, { check: true });
      return;
    }
    this.setState({ addLoading: true });
    workSpacesService
      .addUserToWorkSpace(this.state.workSpaceId, this.state.email)
      .subscribe(
        (res) => {
          if (res.success) {
            this.setState({
              email: "",
              userBillings: [res.data, ...this.state.userBillings],
            });
          }
          this.emailValidation.dirty = false;
          this.setState({ addLoading: false });
        },
        () => {
          this.setState({ addLoading: false });
        }
      );
  };

  goBack = () => {
    if (this.props?.match?.fromRoute) {
      routingService.navigate(routingService.routes.default);
    } else {
      if (this.props?.shouldReload) {
        document.location.reload();
      } else {
        stateService.event(stateEvents.openModalPage, null);
      }
    }
  };

  viewPackage = (id) => {
    this.setState({ paymentDetails: id });
  };

  updateErrorInfo = (e) => {
    !e.target.value && e.target.classList.add("tooltip-error");
  };

  copyText = (text) => {
    htmlHelperService.copyToClipboard(text);
  };

  closeModal = () => {
    this.setState({ paymentDetails: null });
  };

  deleteUserFromWorkSpace = (e, userId, workspaceID) => {
    e.stopPropagation();
    workSpacesService
      .deleteUserFromWorkSpace(userId, workspaceID)
      .subscribe((res) => {
        if (res.success) {
          this.setState((prevState) => {
            let state = { ...prevState };
            let userBillings = state.userBillings.filter(
              (user) => user.userId !== userId
            );
            return { ...state, userBillings };
          });
        }
      });
  };

  getUserBillings = () => {
    if (this.fetchFinished || this.fetchStarted) return;
    this.fetchStarted = true;

    this.secureSubscription(
      billingService.getUserBillingPackages(this.state.lastTimestamp).subscribe(
        (res) => {
          this.fetchStarted = false;
          if (!res.data) return;

          this.fetchFinished = !res.data.userList.length;
          this.setState(
            (state) => {
              let userBillings = [...state.userBillings, ...res.data.userList];
              let lastTimestamp = res.data.timeStamp;
              let billingPackName = res.data.billingPackName;

              return {
                billingPackName,
                userBillings,
                lastTimestamp,
                nextPayDate: res.data.nextPayDate,
                activeDomain: res.data.domainName,
                workSpaceId: res.data.workspaceId,
              };
            },
            () => {
              !this.scrollService.hasScollHeight(
                this.docList.container.firstChild
              ) && this.getUserBillings();
            }
          );
        },
        () => {
          this.fetchStarted = false;
        }
      )
    );
  };

  scrollUserBillings = (e) => {
    if (this.fetchStarted) return;
    this.scrollService.onScrollDown(e, this.getUserBillings);
  };

  componentDidMount() {
    this.secureSubscription(
      translateService.subscribe((_) => {
        this.setState({ currentLang: translateService.key });
      })
    );

    this.secureSubscription(
      stateService.getState(states.userInfo).subscribe((data) => {
        this.setState({
          nextPayDate: data?.nextPayDate,
          paymentStatus: data?.paymentStatus,
          // useFacsimile: data.useFacsimile,
          // currentFacsimData: data.facsimilePath
        });
      })
    );

    this.secureSubscription(
      billingService.getBillingPackages().subscribe((res) => {
        this.setState({ packages: res.data });
      })
    );

    this.getUserBillings();

    if (this.props?.match?.params.packetid) {
      const bogData = {
        id: this.props.match.params.packetid,
        value: "BOG",
      };

      this.secureSubscription(
        billingService.authorizeBOG(bogData).subscribe((res) => {
          if (res.success && res.data) {
            document.location.href = res.data;
          }
        })
      );
    }
  }

  /* facsimile */
  // setActivefacsimData = (data, index) => {
  //   this.setState({ activeCardIndex: index, facsimData: data });
  // };

  // validateWithoutApostile = () => {
  //   this.endSugnatureProcess();
  // };

  // startSignatureEditing = () => {
  //   this.setState({ signatureProcessVisible: true });

  //   htmlHelperService
  //     .setIdleTimer(800)
  //     .subscribe(() => {
  //       this.setState({ faximCardInitialized: true });
  //     })
  //     .unsubscribe();
  // };

  // endSugnatureProcess = () => {
  //   this.setState({ signatureProcessVisible: false });
  // };

  // sendFacsimData = (_) => {
  //   this.setState(
  //     (prevState) => {
  //       prevState.useFacsimile = prevState.useFacsimile + 1;
  //       return prevState;
  //     },
  //     () => {
  //       this.endSugnatureProcess();
  //     }
  //   );

  //   const user = stateService.getState(states.userInfo).value;
  //   const userData = { ...user };
  //   userData.facsimilePath = this.state.facsimData;
  //   stateService.setState(states.userInfo, userData);
  // };

  // resetFacsimileStates = () => {
  //   this.setState({
  //     activeCardIndex: 1,
  //     facsimData: null,
  //   });
  // };

  render() {
    return (
      <React.Fragment>
        {this.state.paymentDetails ? (
          <PaymentDetailsPage
            packageId={this.state.paymentDetails}
            activeDomain={this.state.activeDomain}
            onCloseModal={this.closeModal}
          />
        ) : (
          <div
            className={`package-info container ${translateService.key} ${
              !this.props?.display ? "d-none" : ""
            }`}
          >
            <div className="page-header">
              <span className="clickable" onClick={this.goBack}>
                <img src="../../assets/images/close32.svg" />
              </span>
            </div>
            <div className="package-info-items">
              <div className="flex-title-item">
                <div className="title-container">
                  <span className="title">
                    {translateService.t("payments.detailPageTitle")}
                  </span>
                  {/* {this.state.useFacsimile > 0 && (
                    <span
                      className="facsimileChangeButton"
                      onClick={this.startSignatureEditing}
                    >
                      {translateService.t("common.changeFacsimile")}
                    </span>
                  )} */}
                  {/* {translateService.t("payments.detailPageTitle1")} */}
                </div>

                <div className="accinfoF">
                  <span className="account-info">
                    <div className="ai">
                      <span className="account-number">
                        {this.state.activeDomain}
                      </span>
                      <span className="account-domain-name">
                        {translateService.t("common.accountDomainName")}
                      </span>
                    </div>
                    {this.state.nextPayDate && (
                      <div className="nd">
                        <span>
                          {translateService.t("common.nextPayDateTitle")}{" "}
                        </span>
                        <span>
                          {dateHelperService.format(
                            this.state.nextPayDate,
                            dateHelperService.serverDateFormat,
                            false,
                            true
                          )}
                        </span>
                      </div>
                    )}
                  </span>
                </div>
              </div>

              <span className="title2">
                {translateService.t("payments.detailPageTitle2")}
                <span className="color-two">
                  {" "}
                  {this.state.paymentStatus == 0
                    ? translateService.t("packages.freePackage")
                    : this.state.billingPackName || ""}{" "}
                </span>
                <div className="userWorkspace">
                  {translateService.t("packages.userWorkspace")}
                </div>
              </span>

              <div className="items">
                <div className="item">
                  <div className="inputs-container">
                    <div className="input-item">
                      <Input
                        name="email"
                        type="email"
                        placeholder={translateService.t(
                          "payments.adduserEmail"
                        )}
                        autoComplete="off"
                        spellCheck="false"
                        maxLength="50"
                        value={this.state.email || ""}
                        onChange={(e) => {
                          this.setState({
                            email: e.target.value,
                          });
                        }}
                        rules={[{ name: "email", convert: { trim: true } }]}
                        validation={this.emailValidation}
                        ref={(input) => (this.user_email = input)}
                        onFocus={(e) => this.updateErrorInfo(e)}
                      />

                      <FieldValidation
                        name="email"
                        className="validation-register"
                        rule="email"
                        validation={this.emailValidation}
                        for={this.user_email}
                      />
                    </div>
                    <div className="buttons">
                      <LoadingButton
                        className="button background-color-two color-white"
                        loading={this.state.addLoading}
                        onClick={this.addUserToWorkSpace}
                      >
                        {translateService.t(`common.add`)}
                      </LoadingButton>
                    </div>
                  </div>
                  <div className="listContainer">
                    <div className="listHeader">
                      {translateService.t("payments.listOfPaymentUsers")}{" "}
                      <span className="btn clickable">
                        {translateService.t("common.delete")}
                      </span>
                    </div>
                    <Scrollbars
                      onScroll={(e) => this.scrollUserBillings(e)}
                      ref={(el) => (this.docList = el)}
                      autoHide
                      className="listScrollbar"
                    >
                      {this.state.userBillings.map((user, index) => (
                        <React.Fragment key={user.id + index}>
                          <div
                            className={`listItem hover ${
                              index % 2 == 0 ? "" : "white-bg"
                            }`}
                          >
                            {user.username}
                            <img
                              className="clickable"
                              src="../../assets/images/close32.svg"
                              onClick={(e) =>
                                this.deleteUserFromWorkSpace(
                                  e,
                                  user.userId,
                                  user.workspaceId
                                )
                              }
                            />
                          </div>
                        </React.Fragment>
                      ))}
                    </Scrollbars>
                  </div>
                </div>

                <div className="item">
                  <div className="packages-list">
                    <span className="title">
                      {translateService.t("payments.packageChangeTitle")}{" "}
                    </span>

                    <div className="packages-list-items">
                      {this.state.packages.map((p) => (
                        <div className="packages-item" key={p.id}>
                          <div className="packages-item-detail">
                            <span className="package-title">{p.key}</span>
                            <span className="package-desc">
                              {p.description}
                            </span>
                            <span className="package-amount">{p.value}</span>
                          </div>
                          {/* <div className="pachage-item-buy">
                                                <div className="buttons" >
                                                    <LoadingButton
                                                        className="button background-color-two color-white"
                                                        loading={this.state.isLoading}
                                                        onClick={() => this.viewPackage(0)}
                                                    >
                                                        {translateService.t(`packages.buy`)}
                                                    </LoadingButton>
                                                </div>
                                            </div> */}
                        </div>
                      ))}
                      <div className="packages-item bog">
                        <div className="packages-item-detail">
                          <span className="package-title">
                            {translateService.t("common.transferToBank")}
                          </span>
                          <span className="package-nomination">
                            {translateService.t("common.accountNumber")}
                          </span>
                          <span className="package-desc">
                            GE123TB123456789456123
                          </span>
                          <span className="package-comment">
                            {translateService.t("common.nomination")}
                          </span>
                        </div>
                        <div className="pachage-item-buy">
                          <div className="buttons">
                            <LoadingButton
                              className="button background-color-one color-white"
                              onClick={() =>
                                this.copyText("GE123TB123456789456123")
                              }
                            >
                              {translateService.t(`common.copy`)}
                            </LoadingButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* <FacsimileEditor
          isEditing={true}
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
        /> */}
      </React.Fragment>
    );
  }
}
