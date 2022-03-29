import React, { createRef, useEffect, useRef, useState } from "react";
import {
  translateService,
  workSpacesService,
  stateService,
  mediaService,
  htmlHelperService,
  dateHelperService,
  authService,
  routingService,
  commonService,
} from "../../services/imports";
import {
  createValidationContext,
  Input,
  LoadingButton,
  FieldValidation,
} from "../../components/formcontrols/imports";
import FileDrop from "../../components/fileDrop";
import OptimizedComponent from "../../components/optimizedComponent";
import { Modal, ModalBody, ModalHeader, ModalFooter } from "reactstrap";
import { states, stateEvents } from "../../models/states";
import { Scrollbars } from "react-custom-scrollbars";
import ResultPage from "../viewResult/resultPage";
import { defaults } from "../../models/imports";
import ContactPage from "../contact/contact";
import TermsPage from "../terms/terms";
import PackageInfo from "../package-info/package-info";
import customProtocolCheck from "protocol-checker";
import FacsimileEditor from "./../../components/facsimileEditor";

export default class dashboardPage extends OptimizedComponent {
  constructor() {
    super();

    this.state = {
      doc: {
        doc: null,
        doclink: "",
      },
      documents: [],
      documentResult: null,
      workSpaceId: null,
      shareModal: false,
      documentName: null,
      shareId: null,
      shareUserEmail: "",
      shareLoading: false,
      deleteModal: false,
      viewDocId: null,
      isLoading: false,
      required: false,
      isValidationLoading: false,
      isSignatureLoading: false,
      deleteLoading: false,
      deleteionId: null,
      nextPayDate: null,
      activeDomain: null,
      showSuccesModal: false,
      listTimestamps: [],
      hasScroll: false,
      doclinkvalid: false,
      modalPageType: null,
      openedPages: [],
      errorModal: null,
      documentIsProcessing: false,
      signatureProcessStep: 1,
      signatureProcessVisible: false,
      activeCardIndex: 1,
      currentLang: translateService.key,
      facsimData: null,
      useFacsimile: 0,
      facsimilePath: null,
      faximCardInitialized: false,
      hasFacsimileError: false
    };

    this.isFirstLoad = true;
    this.urlValidation = createValidationContext();
    this.docValidation = createValidationContext();
    this.emailValidation = createValidationContext();
    this.scrollService = htmlHelperService.createScrollPaging();
  }

  viewShareDialog = (docId, name) => {
    this.setState({ shareModal: true, shareId: docId, documentName: name });
  };

  shareDocument = () => {
    let valid = this.emailValidation.removeCustomErrors().setDirty().isValid();
    if (!valid) {
      stateService.event(stateEvents.validateCheck, { check: true });
      return;
    }
    this.setState({ shareLoading: true });
    mediaService
      .shareDocument(this.state.shareUserEmail, this.state.shareId)
      .subscribe(
        (res) => {
          if (res.success) {
            this.setState({
              shareModal: false,
              shareId: null,
              showSuccesModal: true,
            });
          }

          this.setState({ shareLoading: false });
        },
        () => {
          this.setState({ shareLoading: false });
        }
      );
  };

  toggleSuccesModal = () => {
    this.setState((prevState) => {
      let showSuccesModal = !prevState.showSuccesModal;

      return { ...prevState, showSuccesModal };
    });
  };

  viewDeleteDialog = (docId, name) => {
    this.setState({
      deleteModal: true,
      deleteionId: docId,
      documentName: name,
    });
  };

  delete = () => {
    this.setState({ deleteLoading: true });
    workSpacesService.deleteDocument(this.state.deleteionId).subscribe(
      (resp) => {
        if (resp.success) {
          this.setState((state) => {
            let s = { ...state, deleteLoading: false };
            s.deleteModal = false;
            s.documents = [
              ...state.documents.filter(
                (doc) => doc.docId !== state.deleteionId
              ),
            ];
            s.deleteionId = null;
            return s;
          });
        }
      },
      () => {
        this.setState({ deleteLoading: false });
      }
    );
  };

  getDocumentResult = (docId, update, view = true) => {
    this.secureSubscription(
      workSpacesService.getDocumentResult(docId).subscribe((data) => {
        if (data.success) {
          this.setState((prevState) => {
            let state = { ...prevState };

            //only view result
            if (view) {
              state.documentResult = data.data;
              state.viewDocId = docId;
              let pages = state.openedPages;
              pages = pages.filter(
                (page) => page.name != routingService.routeNames.viewResult
              );
              pages = [
                { name: routingService.routeNames.viewResult },
                ...pages,
              ];
              state.openedPages = pages;
              return state;
            }

            //when subscription result is SHARE
            if (!view && !update) {
              state.documents = [data.data, ...state.documents];
              return state;
            }

            //when subscription result is VAL
            if (!view && update) {
              let docIndex = state.documents.findIndex(
                (doc) => doc.docId == docId
              );
              if (docIndex >= 0) {
                state.documents[docIndex] = data.data;
              } else {
                state.documents = [data.data, ...state.documents];
              }

              //if result page is opened
              if (this.state.viewDocId) {
                state.documentResult = data.data;
              }
              return state;
            }
          });
        }
      })
    );
  };

  closeDocumenResult = () => {
    this.setState((prevState) => {
      let state = { ...prevState };
      state.viewDocId = null;
      let pages = state.openedPages;
      pages = pages.filter(
        (page) => page.name != routingService.routeNames.viewResult
      );
      state.openedPages = pages;
      return state;
    });

    if (this.props?.match?.params?.docId) {
      this.getDocuments();
    }
  };

  validateDocument = (widthSignature = false, signParameter = undefined) => {
    let validUrl = this.urlValidation.removeCustomErrors().setDirty().isValid();

    if (!this.state.doc.doc) this.setState({ required: true });
    let valid = this.docValidation.removeCustomErrors().setDirty().isValid();
    if (
      (!valid || !this.state.doc.doc) &&
      (!validUrl || !this.state.doc.doclink)
    ) {
      stateService.event(stateEvents.validateCheck, { check: true });
      return;
    }

    let fn = () => {
      this.setState((prevState) => {
        let state = { ...prevState };
        if (widthSignature) {
          state.isSignatureLoading = true;
        } else {
          state.isValidationLoading = true;
        }
        state.required = false;
        return state;
      });

      mediaService
        .privateUploadFile(
          this.state.doc.doc,
          this.state.doc.doclink,
          this.state.workSpaceId,
          widthSignature,
          signParameter
          //() => this.setState({ isValidationLoading: false })
        )
        .subscribe(
          (res) => {
            if (res?.success) {
              this.setState((prevState) => {
                let state = { ...prevState };
                if (widthSignature) {
                  state.isSignatureLoading = false;
                  //close facsimile modal
                  state.signatureProcessVisible = false;
                } else {
                  state.isValidationLoading = false;
                  let signData = { ...res.data };
                  signData.signers = [
                    translateService.t("dashboard.dataProcessing"),
                  ];
                  state.documents = [signData, ...prevState.documents];
                }
                state.success = true;
                state.doc.doc = null;
                state.doc.doclink = "";
                state.doclinkvalid = false;
                if (widthSignature) {
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
              if (widthSignature) {
                state.isSignatureLoading = false;
              } else {
                state.isValidationLoading = false;
              }
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
    this.validateDocument(true);
  };

  startSignature = () => {
    let validUrl = this.urlValidation.removeCustomErrors().setDirty().isValid();

    if (!this.state.doc.doc) this.setState({ required: true });
    let valid = this.docValidation.removeCustomErrors().setDirty().isValid();
    if (
      (!valid || !this.state.doc.doc) &&
      (!validUrl || !this.state.doc.doclink)
    ) {
      stateService.event(stateEvents.validateCheck, { check: true });
      return;
    }
    if (this.state.useFacsimile) {
      this.setState({ signatureProcessVisible: true, signatureProcessStep: 2 });
      return;
    }
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

  submitFacsimData = (data) => {
    let params = {
      "x": `${Math.round(data.x)}`,
      "y": `${Math.round(data.y)}`,
      "page": `${data.page}`,
      "timeZone": `${commonService.getTimeZone()}`
    };
    if (params.x < 0 && params.y < 0) params = undefined;

    this.validateDocument(true, params);
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
      hasFacsimileError: !this.state.hasFacsimileError
    });
  };

  fileDrop = (file) => {
    this.setState((state) => {
      let temp = { ...state };
      if (file) {
        temp.doc.doc = file[0];
        temp.required = false;
        (temp.doc.doclink = ""), (temp.doclinkvalid = false);
      }
      return temp;
    });
  };

  getDocuments = async () => {
    if (this.fetchFinished || this.fetchStarted) return;
    this.fetchStarted = true;

    this.secureSubscription(
      workSpacesService
        .getDocumentList(this.state.workSpaceId, this.state.postTime)
        .subscribe(
          (res) => {
            this.fetchStarted = false;
            if (!res.data) return;

            if (
              !this.state.listTimestamps.includes(this.state.postTime) &&
              this.state.postTime
            )
              this.state.listTimestamps.push(this.state.postTime);

            this.fetchFinished = !res.data.pdfList.length;
            this.setState(
              (state) => {
                let documents = [...state.documents, ...res.data.pdfList];
                let postTime = res.data.timeStamp;

                return {
                  documents,
                  postTime,
                  isFirstLoad: false,
                };
              },
              () => {
                if (
                  !this.scrollService.hasScollHeight(
                    this.docList?.container?.firstChild
                  )
                ) {
                  this.getDocuments();
                } else {
                  this.setState({ hasScroll: true });
                }
              }
            );
          },
          () => {
            this.fetchStarted = false;
          }
        )
    );
  };

  onScroll = (e) => {
    if (this.fetchStarted) return;
    this.scrollService.onScrollDown(e, this.getDocuments);
  };

  emptyFile = (e) => {
    e?.stopPropagation();
    this.setStateProperty({ "doc.userName": "", "doc.doc": null });
  };

  getResultPageZIndex = () => {
    return this.state.openedPages.findIndex(
      (page) => page.name == routingService.routeNames.viewResult
    );
  };

  componentDidMount() {
    if (!authService.isActive()) routingService.navigate(defaults.notAuthRoute);

    this.secureSubscription(
      translateService.subscribe((_) => {
        this.setState({ currentLang: translateService.key });
      })
    );

    if (this.props?.match?.params?.docId) {
      this.getDocumentResult(this.props?.match?.params?.docId);
    }

    this.secureSubscription(
      stateService.getState(states.userInfo).subscribe((data) => {
        this.setState(
          {
            workSpaceId: data.workspaceId,
            nextPayDate: data?.nextPayDate,
            useFacsimile: data.useFacsimile,
            facsimilePath: data.facsimilePath,
          },
          () => {
            if (!this.props?.match?.params?.docId) this.getDocuments();
          }
        );
      })
    );

    this.secureSubscription(
      stateService.onEvent(stateEvents.setWorkSpace).subscribe((data) => {
        this.setState({ workSpaceId: data.id });
        this.secureSubscription(
          workSpacesService.getDocumentList(data.id).subscribe((res) => {
            this.setState({ documents: res.data });
          })
        );
      })
    );

    this.secureSubscription(
      stateService.getState(states.allWorkSpaces).subscribe((data) => {
        if (data) this.setState({ activeDomain: data.domain });
      })
    );

    this.secureSubscription(
      stateService.onEvent(states.changeWorkSpace).subscribe((id) => {
        this.fetchStarted = this.fetchFinished = false;
        this.setState(
          { workSpaceId: id, documents: [], postTime: 0, listTimestamps: [] },
          () => {
            if (!this.props?.match?.params?.docId) {
              this.getDocuments();
              this.docList.scrollTop(0);
            }
          }
        );
      })
    );

    this.secureSubscription(
      stateService.onEvent(stateEvents.openModalPage).subscribe((type) => {
        this.setState((prevState) => {
          let state = { ...prevState };
          state.modalPageType = type;
          let pages = state.openedPages;
          if (type) {
            pages = pages.filter((page) => page.name != type);
            pages = [{ name: type }, ...pages];
            state.openedPages = pages;
          } else {
            pages = pages.filter(
              (page) => page.name == routingService.routeNames.viewResult
            );
            state.openedPages = pages;
          }
          return state;
        });
      })
    );
  }

  componentDidUpdate(prevProps, prevState) {
    console.log(JSON.stringify(prevProps.socketResponse))
    if (
      this.props.socketResponse &&
      !commonService.compareObjectValues(
        prevProps.socketResponse,
        this.props.socketResponse
      )
    ) {
      this.setState({ socketResponse: this.props.socketResponse }, () => {
        if (this.state.socketResponse.type == NotificationResponseTypes.SHARE) {
          this.getDocumentResult(
            this.state.socketResponse.objectid,
            false,
            false
          );
        } else if (
          this.state.socketResponse.type == NotificationResponseTypes.VAL
        ) {
          this.setState({ documentIsProcessing: false });
          this.getDocumentResult(
            this.state.socketResponse.objectid,
            true,
            false
          );
        } else if (
          this.state.socketResponse.type == NotificationResponseTypes.PROC
        ) {
          this.setState({ documentIsProcessing: true });
        }
      });
    }
  }

  updateHeader(value) {
    this.setState((prevState) => {
      let state = { ...prevState };
      state.documentResult.header = value;
      let docIndex = state.documents.findIndex(
        (doc) => doc.docId === state.documentResult.docId
      );
      if (docIndex < 0) return { ...prevState };
      state.documents[docIndex].header = value;

      return { ...prevState, state };
    });
  }

  enterUrl = (e) => {
    this.urlValidation.removeCustomErrors().setDirty().isValid();

    this.setStateProperty({
      "doc.doclink": e.target.value,
      doclinkvalid: e.target.value.length > 0,
    });
  };

  updateErrorInfo = async (e, onlyTarget = false) => {
    if (!onlyTarget) {
      htmlHelperService.pasteUrl(true).then((data) => {
        this.setStateProperty({
          "doc.doclink": data,
          doclinkvalid: data?.length > 0,
        });
        let valid = this.urlValidation
          .removeCustomErrors()
          .setDirty()
          .isValid();
        if (!valid) return;
        this.emptyFile();
      });
      this.setState({ required: false });
    }

    !e.target.value && e.target.classList.add("tooltip-error");
  };

  componentWillUnmount() {
    this.clearSubscriptions();
  }

  listScroll = (e) => {
    this.onScroll(e);
  };

  render() {
    let concateNames = (elements = []) => {
      if (!elements) return "";
      let result = "";
      elements.forEach(
        (signer) => (result = result.concat(signer).concat(","))
      );
      return result.substr(0, result.length - 1);
    };

    return (
      <React.Fragment>
        {this.state.modalPageType &&
          (this.state.modalPageType === routingService.routeNames.contact ? (
            <ContactPage display={this.getResultPageZIndex() != 0} />
          ) : this.state.modalPageType === routingService.routeNames.terms ? (
            <TermsPage display={this.getResultPageZIndex() != 0} />
          ) : this.state.modalPageType ===
            routingService.routeNames.Settings ? (
            <PackageInfo display={this.getResultPageZIndex() != 0} />
          ) : null)}
        {this.state.viewDocId && (
          <ResultPage
            isPopup={true}
            display={this.getResultPageZIndex() == 0}
            onUpdateHeader={(value) => this.updateHeader(value)}
            fromRoute={this.props?.match?.params?.docId ? true : false}
            result={this.state.documentResult}
            goBack={this.closeDocumenResult}
          />
        )}

        <div
          className={`dashboard container ${translateService.key} ${
            this.state.modalPageType || this.state.viewDocId ? "d-none" : ""
          }`}
        >
          <div className="dashboard-items">
            <div className="flex-title-item">
              <div className="file-container">
                <span className="uploadTitle">
                  {translateService.t("common.uploadOrPaste")}
                </span>
                <div className="inputs">
                  <div className="input-item file-choose">
                    <FileDrop
                      className="fileDrops"
                      accept="application/pdf"
                      maxSize={globalConfig.MaxFileSize}
                      required={this.state.required}
                      onDrop={this.fileDrop}
                    >
                      <div
                        className={`upload ${
                          this.state.doc.doc ? "close" : ""
                        }`}
                      >
                        <Input
                          type="text"
                          placeholder={translateService.t(
                            "common.uploadPdfFile"
                          )}
                          spellCheck="false"
                          value={this.state.doc.doc?.name || ""}
                          readOnly
                        />
                        {this.state.doc.doc && (
                          <button
                            className="emtyLink"
                            onClick={(e) => this.emptyFile(e)}
                          ></button>
                        )}
                      </div>
                    </FileDrop>
                  </div>
                  {/*
				  <span className="or">
                    {translateService.t("dashboard.or")}
                  </span>
                  <div className="input-item">
                    <FieldValidation
                      name="url"
                      className="validation-register"
                      rule="url"
                      validation={this.urlValidation}
                      for={this.url}
                    />
                    <div
                      className={`paste ${
                        this.state.doclinkvalid ? "close" : ""
                      }`}
                    >
                      <Input
                        name="url"
                        type="text"
                        placeholder={translateService.t("dashboard.pasetLink")}
                        spellCheck="false"
                        autoComplete="off"
                        value={this.state.doc.doclink || ""}
                        onChange={(e) => {
                          this.enterUrl(e);
                        }}
                        rules={[{ name: "url" }]}
                        validation={this.urlValidation}
                        ref={(input) => (this.url = input)}
                        onFocus={(e) => this.updateErrorInfo(e)}
                        title={this.state.doc.doclink}
                      />
                      {this.state.doclinkvalid && (
                        <button
                          className="emtyLink"
                          onClick={() =>
                            this.setStateProperty({
                              "doc.doclink": "",
                              doclinkvalid: false,
                            })
                          }
                        ></button>
                      )}
                    </div>
                  </div>
				  */}
                </div>
                <span className="buttons validation">
                  <LoadingButton
                    className="button background-color-two color-white check-button"
                    loading={this.state.isValidationLoading}
                    onClick={() => this.validateDocument(false)}
                  >
                    {translateService.t("common.validation")}
                  </LoadingButton>

                  <LoadingButton
                    className="button background-color-two color-white signature-button"
                    loading={this.state.isSignatureLoading}
                    onClick={this.startSignature}
                  >
                    {translateService.t("dashboard.signature")}
                  </LoadingButton>
                </span>
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
                  <div
                    className={`nd ${this.state.nextPayDate ? "" : "empty"}`}
                  >
                    <span>
                      {this.state.nextPayDate
                        ? translateService.t("common.nextPayDateTitle")
                        : "."}{" "}
                    </span>
                    <span>
                      {dateHelperService.format(
                        this.state.nextPayDate,
                        dateHelperService.serverDateFormat,
                        false,
                        true
                      ) || "."}
                    </span>
                  </div>
                </span>
              </div>
            </div>
            {this.fetchStarted && this.state.documents.length <= 0 ? (
              <img
                src="./assets/images/black-loading.svg"
                className="content-loader"
              />
            ) : (
              <React.Fragment>
                <div className="items">
                  <Scrollbars
                    onScroll={(e) => this.listScroll(e)}
                    ref={(el) => (this.docList = el)}
                    autoHide
                    className="listScrollbar"
                  >
                    <table id="dashboard" className="for-mobile-table">
                      <tbody>
                        {this.state.documents?.map((doc, index) => (
                          <React.Fragment key={index}>
                            <tr
                              className={`clickable ${index % 2 == 0 && "bg"}`}
                            >
                              <td className="padding">
                                {doc.shared && (
                                  <img
                                    src="../assets/images/upArrowYellow.svg"
                                    className="up"
                                  />
                                )}
                                <span title={doc.docName} className="_3dots-1">
                                  {doc?.header || doc.docName}
                                </span>
                              </td>
                              <td className="padding  mw-500 db">
                                <span className="_3dots-1">
                                  {concateNames(doc?.signers)}
                                </span>
                              </td>
                            </tr>
                            <tr
                              className={`clickable btop ${
                                index % 2 == 0 && "bg"
                              }`}
                            >
                              <td className="padding" colSpan="3">
                                <div className="action-tools">
                                  <div className="padding validationDate">
                                    <span className="nowrap">
                                      {dateHelperService.format(
                                        doc.validationTime,
                                        dateHelperService.dateTimeFormat,
                                        false,
                                        true
                                      )}
                                    </span>
                                  </div>
                                  <img
                                    onClick={() =>
                                      this.getDocumentResult(doc.docId)
                                    }
                                    src="../assets/images/search.svg"
                                  />
                                  <img
                                    onClick={() =>
                                      this.viewDeleteDialog(
                                        doc.docId,
                                        doc.docName
                                      )
                                    }
                                    src="../assets/images/close32smallInner.svg"
                                  />
                                  <img
                                    onClick={() =>
                                      this.viewShareDialog(
                                        doc.docId,
                                        doc.docName
                                      )
                                    }
                                    src="../assets/images/share.svg"
                                  />
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>

                      <thead ref={(el) => (this.mobileListHeader = el)}>
                        <tr>
                          <th className="padding nowrap">
                            {translateService.t("dashboard.filedatabase")}
                          </th>
                          <th className="padding">
                            {translateService.t("dashboard.listOfSignatures")}
                          </th>
                        </tr>
                      </thead>
                    </table>

                    <table id="dashboard" className="for-web-table">
                      <tbody>
                        {this.state.documents?.map((doc, index) => (
                          <tr
                            className={`clickable ${index % 2 == 0 && "bg"}`}
                            key={index}
                          >
                            <td className="padding">
                              {doc.shared && (
                                <img
                                  src="../assets/images/upArrowYellow.svg"
                                  className="up"
                                />
                              )}
                              <span title={doc.docName} className="_3dots-1">
                                {doc?.header || doc.docName}
                              </span>
                            </td>
                            <td className="padding mw-500 db">
                              <span className="_3dots-1 pt-17">
                                {concateNames(doc?.signers)}
                              </span>
                            </td>
                            <td className="padding">
                              <span className="nowrap">
                                {dateHelperService.format(
                                  doc.validationTime,
                                  dateHelperService.dateTimeFormat,
                                  false,
                                  true
                                )}
                              </span>
                            </td>
                            <td>
                              <img
                                onClick={() =>
                                  this.getDocumentResult(doc.docId)
                                }
                                src="../assets/images/search.svg"
                              />
                            </td>
                            <td>
                              <img
                                onClick={() =>
                                  this.viewDeleteDialog(doc.docId, doc.docName)
                                }
                                src="../assets/images/close32smallInner.svg"
                              />
                            </td>
                            <td>
                              <img
                                onClick={() =>
                                  this.viewShareDialog(doc.docId, doc.docName)
                                }
                                src="../assets/images/share.svg"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <thead ref={(el) => (this.webListHeader = el)}>
                        <tr>
                          <th className="padding nowrap">
                            {translateService.t("dashboard.filedatabase")}
                          </th>
                          <th className="padding">
                            {translateService.t("dashboard.listOfSignatures")}
                          </th>
                          <th className="padding nowrap">
                            {translateService.t("dashboard.validationDate")}
                          </th>
                          <th>{translateService.t("common.view")}</th>
                          <th>{translateService.t("common.delete")}</th>
                          <th>{translateService.t("common.share")}</th>
                        </tr>
                      </thead>
                    </table>
                  </Scrollbars>
                </div>
              </React.Fragment>
            )}
          </div>

          <Modal
            isOpen={this.state.shareModal}
            fade={false}
            backdrop={false}
            className="modal dashboard-page sharer"
            modalClassName="Modal-dialog"
            backdropClassName="backDrop"
            toggle={(e) => {
              this.setState({ shareModal: false });
            }}
          >
            <ModalHeader>
              <span>
                &nbsp;
                <span
                  onClick={() => this.setState({ shareModal: false })}
                  className="clickable"
                >
                  <img src="../../assets/images/close32.svg" />
                </span>
              </span>
            </ModalHeader>
            <ModalBody>
              <div className="additional color-three">
                <img src="../../assets/images/modal-sharer.svg" />
                <div className="title">
                  {translateService
                    .t("common.shareConfirmation")
                    .replace("{0}", this.state.documentName)}
                </div>
                <div className="inputs">
                  <div className="input-item">
                    <Input
                      name="email"
                      type="email"
                      placeholder={translateService.t("common.email")}
                      autoComplete="off"
                      spellCheck="false"
                      maxLength="60"
                      value={this.state.shareUserEmail || ""}
                      onChange={(e) => {
                        this.setState({
                          shareUserEmail: e.target.value,
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
                </div>
                <span className="buttons flexed">
                  <LoadingButton
                    className="button background-color-two color-white"
                    loading={this.state.shareLoading}
                    onClick={this.shareDocument}
                  >
                    {translateService.t("common.share")}
                  </LoadingButton>
                  <LoadingButton
                    className="button background-color-three color-white"
                    onClick={() => this.setState({ shareModal: false })}
                  >
                    {translateService.t("common.cancell")}
                  </LoadingButton>
                </span>
              </div>
            </ModalBody>
          </Modal>

          <Modal
            isOpen={this.state.deleteModal}
            fade={false}
            backdrop={false}
            className="modal dashboard-page delete"
            modalClassName="Modal-dialog"
            backdropClassName="backDrop"
            toggle={(e) => {
              this.setState({ deleteModal: false, deleteionId: null });
            }}
          >
            <ModalHeader>
              <span>
                &nbsp;
                <span
                  onClick={() =>
                    this.setState({ deleteModal: false, deleteionId: null })
                  }
                  className="clickable"
                >
                  <img src="../../assets/images/close32.svg" />
                </span>
              </span>
            </ModalHeader>
            <ModalBody>
              <div className="additional color-three">
                <img src="../../assets/images/modal-delete.svg" />
                <div className="title">
                  {translateService
                    .t("common.filedeleteConfirmation")
                    .replace("{0}", this.state.documentName)}
                </div>
                <span className="buttons flexed">
                  <LoadingButton
                    className="button background-color-three color-white"
                    loading={this.state.deleteLoading}
                    onClick={this.delete}
                  >
                    {translateService.t("common.yes")}
                  </LoadingButton>
                  <LoadingButton
                    className="button background-color-one color-white"
                    onClick={() =>
                      this.setState({
                        deleteModal: false,
                        deleteionId: null,
                      })
                    }
                  >
                    {translateService.t("common.no")}
                  </LoadingButton>
                </span>
              </div>
            </ModalBody>
          </Modal>

          <Modal
            isOpen={this.state.showSuccesModal}
            fade={true}
            toggle={(e) => {
              this.toggleSuccesModal();
            }}
          >
            <ModalHeader>
              <span>
                &nbsp;
                <span
                  onClick={() => this.toggleSuccesModal()}
                  className="clickable"
                >
                  <img src="../../assets/images/close32.svg" />
                </span>
              </span>
            </ModalHeader>
            <ModalBody>
              <div className="additional color-black">
                <img src="../../assets/images/modal-success.svg" />
                <div className="title">
                  {translateService
                    .t("common.documentIsShared")
                    .replace("{0}", this.state.documentName)
                    .replace("{1}", this.state.shareUserEmail)}
                </div>
              </div>
            </ModalBody>
          </Modal>

          <Modal
            isOpen={this.state.documentIsProcessing}
            fade={true}
            toggle={(e) => {
              this.setState({ documentIsProcessing: false });
            }}
          >
            <ModalHeader>
              <span>
                &nbsp;
                <span
                  onClick={() => this.setState({ documentIsProcessing: false })}
                  className="clickable"
                >
                  <img src="../../assets/images/close32.svg" />
                </span>
              </span>
            </ModalHeader>
            <ModalBody>
              <div className="additional color-black">
                <img src="../../assets/images/modal-success.svg" />
                <div className="title">
                  {translateService.t("dashboard.documentIsProcessing")}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <LoadingButton
                type="button"
                className="button background-color-three color-white"
                onClick={() => this.setState({ documentIsProcessing: false })}
              >
                {translateService.t(`common.close`)}
              </LoadingButton>
            </ModalFooter>
          </Modal>

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

          <FacsimileEditor
            isLoading={this.state.isValidationLoading || this.state.isValidationLoading}
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
            docPath={this.state.doc.doc || this.state.doc.doclink}
            facsimData={this.state.facsimData}
            facsimilePath={this.state.facsimilePath}
            hasFacsimileError={this.state.hasFacsimileError}
          />

        </div>
      </React.Fragment>
    );
  }
}

const NotificationResponseTypes = {
  SHARE: "share",
  VAL: "val",
  PROC: "signProc",
};
