import React from "react";
import { LoadingButton } from "../../components/formcontrols/imports";
import {
  translateService,
  routingService,
  authService,
  workSpacesService,
  htmlHelperService,
  dateHelperService,
  commonService,
  stateService,
  mediaService,
} from "../../services/imports";
import { stateEvents, states } from "../../models/states";
import OptimizedComponent from "../../components/optimizedComponent";
import { Scrollbars } from "react-custom-scrollbars";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import { TextArea } from "../../components/formcontrols/imports";
import ContactPage from "../contact/contact";
import TermsPage from "../terms/terms";
import customProtocolCheck from "protocol-checker";
import FacsimileEditor from "./../../components/facsimileEditor";

export default class ResultPage extends OptimizedComponent {
  constructor(props) {
    super(props);

    this.state = {
      result: null,
      header: "",
      workSpaceId: null,
      submitLoading: false,
      isSignatureLoading: false,
      isEditing: false,
      modalPageType: null,
      errorModal: null,

      signatureProcessStep: 1,
      signatureProcessVisible: false,
      activeCardIndex: 1,
      currentLang: translateService.key,
      facsimData: null,
      useFacsimile: 0,
      facsimilePath: null,
      faximCardInitialized: false,
      hasFacsimileError: false,
      base64str: null,
      isBase64Fetching: false
    };
  }

  goBack = () => {
    if (this.props.goBack) {
      this.props.goBack();
      return;
    }

    if (authService.isAuthenticated() && authService.isActive())
      routingService.push("dashboard");
    else {
      authService.signOut();
      routingService.push("landing");
    }
  };

  downloadFile = (url = null, name) => {
    htmlHelperService.downloadFile(url, name);
  };

  getFile = (id) => {
    this.secureSubscription(
      workSpacesService.getDocumentResult(id).subscribe((data) => {
        if (data.success) {
          this.setState({
            result: data.data,
            header: data.data?.header,
            isEditing: data.data?.header?.length <= 0,
          });
        }
      })
    );
  };

  signature = (widthSignature = false, signParameter = undefined) => {
    let url = this.state.result?.docPath;
    if (!url) return;

    let fn = () => {
      this.setState((prevState) => {
        let state = { ...prevState };
        state.isSignatureLoading = true;
        state.required = false;
        return state;
      });

      mediaService
        .privateUploadFile(
          null,
          url,
          this.state.workSpaceId,
          widthSignature,
          signParameter
        )
        .subscribe(
          (res) => {
            if (res?.success) {
              this.setState((prevState) => {
                let state = { ...prevState };
                state.isSignatureLoading = false;
                state.signatureProcessVisible = false;
                if (res.data?.signServerUrl?.length) {
                  customProtocolCheck(
                    res.data.signServerUrl,
                    () => {
                      this.setState({ errorModal: true });
                    },
                    () => {},
                    5000
                  );
                }
                return { ...state, state };
              });
            } else {
              this.setState(prevState => { prevState.hasFacsimileError =  !prevState.hasFacsimileError; return prevState; });
            }
          },
          () => {
            this.setState((prevState) => {
              let state = { ...prevState };
              state.hasFacsimileError = !state.hasFacsimileError;
              state.isSignatureLoading = false;
              return state;
            });
          }
        );
    };

    fn();
  };

  /* facsimile */
  setActivefacsimData = (data, index) => {
    this.setState({ activeCardIndex: index, facsimData: data });
  };

  validateWithoutApostile = () => {
    this.endSugnatureProcess();
    this.signature(true);
  };

  startSignature = () => {
    this.setState({isBase64Fetching: true});
    htmlHelperService.getBASEFromUrl(this.state.result?.docPath).then(base64 => {
      if (this.state.useFacsimile) {
        this.setState({ signatureProcessVisible: true, signatureProcessStep: 2, base64str: base64, isBase64Fetching: false });
        return;
      }
  
      this.setState({ signatureProcessVisible: true, base64str: base64, isBase64Fetching: false });
      htmlHelperService
        .setIdleTimer(800)
        .subscribe(() => {
          this.setState({ faximCardInitialized: true });
        })
        .unsubscribe();
    })
  };

  endSugnatureProcess = () => {
    this.setState({ signatureProcessVisible: false, isBase64Fetching: false });
  };

  submitFacsimData = (data) => {
    let params = {
      "x": `${Math.round(data.x)}`,
      "y": `${Math.round(data.y)}`,
      "page": `${data.page}`,
      "timeZone": `${commonService.getTimeZone()}`
    };
    if (params.x < 0 && params.y < 0) params = undefined;

    this.signature(true, params);
  };

  sendFacsimData = (data) => {
    this.setState((prevState) => {
      prevState.useFacsimile = (prevState.useFacsimile || 0) + 1;
      prevState.facsimilePath = data;
      prevState.signatureProcessStep = 2;
      return prevState;
    });

    const userData = {...stateService.getState(states.userInfo).value};
    userData.facsimilePath = data;
    userData.useFacsimile = (userData.useFacsimile || 1);
    stateService.setState(states.userInfo, userData);
  };

  resetFacsimileStates = () => {
    this.setState({
      signatureProcessStep: 1,
      activeCardIndex: 1,
      facsimData: null,
      base64str: null,
      hasFacsimileError: !this.state.hasFacsimileError
    });
  };

  componentDidMount() {
    if (this.props?.fromRoute) {
      this.secureSubscription(
        stateService.onEvent(stateEvents.openModalPage).subscribe((type) => {
          this.setState((prevState) => {
            let state = { ...prevState };
            state.modalPageType = type;
            return state;
          });
        })
      );
    }

    if (this.props.match?.params.id) {
      this.getFile(this.props.match?.params.id);
    } else {
      this.setState({
        result: this.props.result,
        header: this.props.result?.header,
        isEditing: this.props.result?.header?.length <= 0,
      });
    }

    this.secureSubscription(
      stateService.getState(states.userInfo).subscribe((data) => {
        this.setState({
          workSpaceId: data.workspaceId,
          useFacsimile: data.useFacsimile,
          facsimilePath: data.facsimilePath,
        });
      })
    );

    this.secureSubscription(
      stateService.onEvent(stateEvents.setWorkSpace).subscribe((data) => {
        this.setState({ workSpaceId: data.id });
      })
    );

    this.secureSubscription(
      stateService.onEvent(states.changeWorkSpace).subscribe((id) => {
        this.setState({ workSpaceId: id });
      })
    );

    this.secureSubscription(
      translateService.subscribe((_) => {
        this.setState({ currentLang: translateService.key });
      })
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.result &&
      !commonService.compareObjectValues(prevProps.result, this.props.result)
    ) {
      this.setState({
        result: this.props.result,
        header: this.props.result?.header,
        isEditing: this.props.result?.header?.length <= 0,
      });
    }
  }

  componentWillUnmount() {
    stateService.event(stateEvents.scrollUp);
    this.clearSubscriptions();
    // if(this.props?.fromRoute) {
    //   this.clearSubscriptions();
    // }
  }

  updateHeader(value) {
    this.setState((prevState) => {
      let state = { ...prevState };
      state.result.header = value;

      return { ...prevState, state };
    });
  }

  submit() {
    if (!this.state.header) return;
    this.setState({ submitLoading: true });
    workSpacesService
      .changedocheader(this.state.result?.docId, this.state.header)
      .subscribe(
        (res) => {
          if (res.success) {
            this.props?.onUpdateHeader
              ? this.props.onUpdateHeader(this.state.header)
              : this.updateHeader(this.state.header);

            this.setState({ submitLoading: false, isEditing: false });
          }
        },
        () => {
          this.setState({ submitLoading: false });
        }
      );
  }

  startEditing = () => {
    this.setState({ isEditing: true });
  };

  toggleList(id) {
    this.setState((prevState) => {
      let result = { ...prevState.result };
      let signatures = [...result.signatures];
      let index = signatures.findIndex((res) => res.id === id);
      signatures[index].visible = !signatures[index].visible;
      result.signatures = signatures;
      return { ...prevState, result };
    });
  }

  render() {
    let docHeader = this.props.match?.params.id
      ? this.state.result?.header
      : this.props.result?.header;
    return (
      <React.Fragment>
        {this.state.modalPageType &&
          this.props?.fromRoute &&
          (this.state.modalPageType === routingService.routeNames.contact ? (
            <ContactPage display={true} />
          ) : this.state.modalPageType === routingService.routeNames.terms ? (
            <TermsPage display={true} />
          ) : null)}
        <div
          className={`view container ${this.props?.isPopup ? "popup" : ""} ${
            !this.props?.display || this.state.modalPageType ? "d-none" : ""
          }`}
        >
          <span className="clickable close" onClick={this.goBack}>
            <img src="../../assets/images/close32smallInner.svg" />
          </span>
          <div className="custom-row">
            <div className="column-45">
              <div className="pdf-page">
                <div className="document-header">
                  {this.state.result?.shared && (
                    <span className="share">
                      {translateService.t("result.documentShareStatus")}
                      <img
                        src="../assets/images/upArrowYellow.svg"
                        className="up"
                      />
                    </span>
                  )}

                  {(!docHeader || this.state.isEditing) && (
                    <div className="inputs df">
                      <div className="input-item">
                        <TextArea
                          name="header"
                          value={this.state.header || ""}
                          onChange={(e) => {
                            this.setState({
                              header: e.target.value,
                            });
                          }}
                          autoComplete="off"
                          maxLength="120"
                          spellCheck="false"
                          placeholder={translateService.t(
                            "result.docHeaderPlaceholder"
                          )}
                        />
                      </div>
                      <div className="buttons">
                        <LoadingButton
                          className="button background-color-four color-two"
                          loading={this.state.submitLoading}
                          onClick={() => this.submit()}
                        >
                          {translateService.t("common.submit")}
                        </LoadingButton>
                      </div>
                    </div>
                  )}
                  {docHeader && !this.state.isEditing && (
                    <div className="header-title">
                      <span>{this.state.header}</span>
                      <span
                        className="clickable close"
                        onClick={this.startEditing}
                      >
                        <img src="../../assets/images/close32.svg" />
                      </span>
                    </div>
                  )}
                  <span className="desc">{this.state.result?.docName}</span>
                </div>
                <div className="scroll-view">
                  {this.state.result?.docPath &&
                    this.state.result?.processingStatus != 0 && (
                      <iframe
                        src={`${this.state.result?.docPath}#toolbar=0`}
                        className="pdfViewer"
                      ></iframe>
                    )}
                </div>
              </div>
            </div>
            <div className="column-75">
              <div className="buttons">
                <LoadingButton
                  className="button background-color-two color-white download"
                  onClick={() =>
                    this.downloadFile(
                      this.state.result.docPath,
                      this.state.result.docName
                    )
                  }
                >
                  {translateService.t("result.downloadDocument")}
                </LoadingButton>
                {authService.isActive() && (
                  <LoadingButton
                    className="button background-color-two color-white download signature-button"
                    loading={this.state.isSignatureLoading || this.state.isBase64Fetching}
                    onClick={this.startSignature}
                  >
                    {translateService.t("dashboard.signature")}
                  </LoadingButton>
                )}
              </div>
              {this.state.result?.processingStatus === 0 && (
                <span className="isLoadingDoc">
                  {translateService.t("result.docIdLoading")}
                </span>
              )}

              <div className="validCount">
                <span>
                  <span className="nobreak">
                    {translateService.t("result.signatureCount")}
                  </span>{" "}
                  {this.state.result?.signatureCount}
                </span>
                <span>
                  {translateService.t("result.validSignatureCount")}{" "}
                  {this.state.result?.validSignatureCount}
                </span>
                <span>
                  {translateService.t("result.validTimestamp")}{" "}
                  {dateHelperService.format(
                    this.state.result?.validationTime,
                    dateHelperService.dateTimeFormat,
                    false,
                    true
                  )}
                </span>
              </div>

              <div className="sectionTitle">
                {translateService.t("result.signatures")}
              </div>
              <Scrollbars autoHide className="listScrollbar">
                <div className="signaturesList">
                  {this.state.result?.signatures.map((signature, index) => (
                    <div className="item" key={index}>
                      <div className="signatureHeader">
                        <div
                          className={`validStatus ${
                            signature?.validSignature === true
                              ? "valid"
                              : "novalid"
                          }`}
                        >
                          <span
                            className="signatureAuthor"
                            title={signature?.signerDN}
                          >{`${signature?.signerCN} ${signature?.signerAltName} ${signature?.signerPID}`}</span>
                        </div>
                        <span
                          className="signatureDownload"
                          onClick={() => {
                            this.downloadFile(
                              signature.signatureRevisionUrl,
                              `${signature.id}.pdf`
                            );
                          }}
                        >
                          {translateService.t("common.download")}
                        </span>
                      </div>
                      <div
                        className={`additionalRetails ${
                          signature?.visible ? "" : "pb"
                        }`}
                      >
                        <span className="signTime">
                          <div>
                            {translateService.t("result.signatureTime")}
                          </div>
                          <div>
                            {dateHelperService.format(
                              signature?.signatureTime,
                              dateHelperService.dateTimeFormat,
                              false,
                              true
                            )}
                          </div>
                        </span>
                        {signature?.lastLTATime && (
                          <span className="lastArchiveTime">
                            <div>
                              {translateService.t("result.lastArchiveTime")}{" "}
                            </div>
                            <div>
                              {dateHelperService.format(
                                signature?.lastLTATime,
                                dateHelperService.dateTimeFormat,
                                false,
                                true
                              )}
                            </div>
                          </span>
                        )}
                        <span
                          className={`timestampCount ${
                            signature?.timeStampValid === true &&
                            signature?.timeStampCount > 0
                              ? "valid"
                              : signature?.timeStampValid !== true &&
                                signature?.timeStampCount > 0
                              ? "novalid"
                              : ""
                          }`}
                        >
                          <div>
                            {translateService.t("result.timestampCount")}{" "}
                          </div>
                          <div>{signature?.timeStampCount}</div>
                        </span>
                        {signature?.validTimeStampCount !==
                          signature?.timeStampCount && (
                          <span className="validationTimeStamp">
                            <div>
                              {translateService.t("result.validTimestampCount")}{" "}
                            </div>
                            <div>{signature?.validTimeStampCount}</div>
                          </span>
                        )}
                        <span
                          className={`validationTimeStamp ${
                            signature?.certRevoced === true ? "novalid" : ""
                          }`}
                        >
                          <div>
                            {translateService.t("result.revocationCount")}{" "}
                          </div>
                          <div>{signature?.revocationCount}</div>
                        </span>
                        <div
                          className="toggleDetails clickable"
                          onClick={() => this.toggleList(signature.id)}
                        >
                          <img src={`../../assets/images/${"downArrow"}.svg`} />
                        </div>
                      </div>

                      <div
                        className={`slideArea ${
                          signature?.visible ? "visible" : ""
                        }`}
                      >
                        <div className="timeStamps">
                          <div className="timestamps_title">
                            {translateService.t("result.timeStamps")}
                          </div>
                          {signature?.timestamps.map((tms) => (
                            <React.Fragment key={tms.id}>
                              {tms.id && (
                                <React.Fragment>
                                  <div
                                    className={`keyValue ${
                                      tms?.valid === true ? "valid" : "novalid"
                                    }`}
                                  >
                                    {translateService.t("result.productDate")}{" "}
                                    {dateHelperService.format(
                                      tms?.productionDate,
                                      dateHelperService.dateTimeFormat,
                                      false,
                                      true
                                    )}
                                  </div>
                                  <div
                                    className={`keyValue ${
                                      tms?.signingCertValid ? "" : "color-three"
                                    }`}
                                  >
                                    {translateService.t(
                                      `result.sertificaTe${
                                        tms?.signingCertValid ? "IS" : "NO"
                                      }Valid`
                                    )}{" "}
                                  </div>
                                  <div className="keyValue">
                                    {tms?.signingCertIssuerDN}{" "}
                                  </div>
                                </React.Fragment>
                              )}
                              {tms?.notes && (
                                <div className="keyValue loading">
                                  {tms?.notes}{" "}
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="revocations">
                          <div className="timestamps_title">
                            {translateService.t("result.revocations")}
                          </div>
                          {signature?.revocations.map((revc) => (
                            <div
                              className={`rev-item ${
                                revc.id
                                  ? revc?.valid === true && !revc?.revoked
                                    ? "valid"
                                    : "novalid"
                                  : ""
                              }`}
                              key={revc.id}
                            >
                              {revc.id && revc?.revocationDate && (
                                <div className="keyValue">
                                  {translateService.t("result.productDate")}{" "}
                                  {dateHelperService.format(
                                    revc?.revocationDate,
                                    dateHelperService.dateTimeFormat,
                                    false,
                                    true
                                  )}
                                </div>
                              )}
                              {revc.id && (
                                <div className="keyValue">
                                  {revc?.signingCertIssuerDN}{" "}
                                </div>
                              )}
                              {revc.id && revc?.revoked && (
                                <div className={`keyValue color-three`}>
                                  {translateService.t("dashboard.revoked")}{" "}
                                </div>
                              )}

                              {revc.id && !revc?.valid && !revc?.revoked && (
                                <div className="keyValue color-three">
                                  {translateService.t(
                                    "common.revokeStatusUnknown"
                                  )}{" "}
                                </div>
                              )}

                              {revc?.notes && (
                                <div className="keyValue loading">
                                  {revc?.notes}{" "}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="issuerCertDN">
                          <div>{translateService.t("result.issuerCertDN")}</div>
                          <div>{signature?.issuerCertDN}</div>
                        </div>
                        <div className="issuerCertDN">
                          <div>
                            {translateService.t("result.diagnosticData")}
                          </div>
                          <div>{signature?.signatureWarning}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Scrollbars>
            </div>
          </div>
        </div>

        <FacsimileEditor
          isVisible={this.state.signatureProcessVisible}
          onClosed={this.resetFacsimileStates}
          onToggle={this.endSugnatureProcess}
          signatureProcessStep={this.state.signatureProcessStep}
          faximCardInitialized={this.state.faximCardInitialized}
          currentLang={this.state.currentLang}
          OnValidateWithoutApostile={this.validateWithoutApostile}
          sendFacsimData={this.sendFacsimData}
          onSetFacsimData={this.setActivefacsimData}
          activeCardIndex={this.state.activeCardIndex}
          onSubmitFacsimData={this.submitFacsimData}
          docPath={this.state.base64str}
          facsimData={this.state.facsimData}
          facsimilePath={this.state.facsimilePath}
          hasFacsimileError={this.state.hasFacsimileError}
        />

        <Modal
          isOpen={this.state.errorModal}
          fade={true}
          toggle={(e) => {
            this.setState({ errorModal: null });
          }}
          contentClassName="modal-content noheight"
        >
          <ModalHeader>
            <span>
              &nbsp;
              <span
                onClick={() => this.setState({ errorModal: null })}
                className="clickable"
              >
                <img src="../../assets/images/close32.svg" />
              </span>
            </span>
          </ModalHeader>
          <ModalBody>
            <div className="additional color-three">
              <img src="../../assets/images/modal-error.svg" />
              <div
                className="title"
                dangerouslySetInnerHTML={{
                  __html: translateService.t("dashboard.no-driver"),
                }}
              ></div>
            </div>
          </ModalBody>
        </Modal>
      </React.Fragment>
    );
  }
}
