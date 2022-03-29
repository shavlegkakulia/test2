import React from "react";
import FileDrop from "../../components/fileDrop";
import OptimizedComponent from "../../components/optimizedComponent";
import { Link } from "../../components/routing/imports";
import { stateService } from "../../services/imports";
import {
  stateEvents,
  states,
  defaults,
  verifyStatuses
} from "../../models/imports";

import {
  createValidationContext,
  Input,
  LoadingButton,
  FieldValidation,
  CheckBox
} from "../../components/formcontrols/imports";
import {
  translateService,
  routingService,
  authService
} from "../../services/imports";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

import mediaService from "../../services/mediaService";

export default class LoginPage extends OptimizedComponent {
  constructor(props) {
    super(props);
    this.state = this.initialState();

    this.personValidation = createValidationContext();
    this.docValidation = createValidationContext();
  }

  initialState = () => {
    return {
      person: {
        userName: "",
        password: "",
        retryPassword: "",
        isPwdVisible: false
      },
      doc: {
        userName: "",
        doc: null
      },
      isRemember: false,
      hidePassword: true,
      isLoginLoading: false,
      isRegisterLoading: false,
      isValidationLoading: false,
      errorModal: false,
      success: false,
      errorMessage: "",
      required: false
    };
  };

  defaultState = () => {
    this.setState(this.initialState());
    this.personValidation.removeCustomErrors().setPristine();
    this.docValidation.removeCustomErrors().setPristine();
  };

  goToRegister = () => {
    routingService.navigate("register");
  };

  toggleIsRemember = () => {

    this.setState(state => { let isRemember = !state.isRemember; return { ...state, isRemember } });

  }

  login = () => {
    let valid = this.personValidation
      .removeCustomErrors()
      .setDirty()
      .isValid();
    if (!valid) {
      stateService.event(stateEvents.validateCheck, { check: true });
      return;
    }
    if(authService.isAuthenticated()) { authService.signOut();  }
    this.setState({ isLoginLoading: valid });
    let person = { ...this.state.person };

    authService.signIn(person.userName, person.password).subscribe(resp => {
      authService.setToken(resp.token, resp.refreshToken);
      let userInfo = authService.userInfo();
      userInfo.subscribe(res => {
        if (res.success) {
          if(res.data.userStatus === verifyStatuses.verified) {
            translateService.use(res.data.localeId);
            stateService.setState(states.userInfo, res.data);
            routingService.push(defaults.authRoute);
          } else {
            authService.signOut();
            this.setState({isLoginLoading: false, errorModal: true, errorMessage: translateService.t("signing.accountIsNotActive")});
          }
        }
      }
      );

      if (this.state.isRemember) {
        let __name = window.btoa(this.state.person.userName);
        localStorage.setItem("username", `${__name}`);
      } else {
        localStorage.removeItem("username");
      }
    },
      _ => {
        this.setState({ isLoginLoading: false });
      }
    );
  };

  validateDocument = () => {
    if (!this.state.doc.doc) this.setState({ required: true });
    let valid = this.docValidation
      .removeCustomErrors()
      .setDirty()
      .isValid();
    if (!valid || !this.state.doc.doc) {
      stateService.event(stateEvents.validateCheck, { check: true });
      return;
    }
    this.setState({ isValidationLoading: true });

    mediaService
      .uploadFile(
        this.state.doc.doc,
        this.state.doc.userName
      )
      .subscribe(res => {
        if (res?.success) {
          this.setState(prevState => {
            let state = { ...prevState };
            state.isValidationLoading = false;
            state.success = true;
            state.doc.doc = null;
            return { ...state, state };
          });
        }
      }, () => {
        this.setState({ isValidationLoading: false })
      });
  };

  emptyFile = (e) => {
    e.stopPropagation();
    this.setStateProperty({ "doc.userName": "", "doc.doc": null });
  }

  tooglePwd = () => {
    this.setState(prevState => {
      let isPwdVisible = !prevState.isPwdVisible;
      return { ...prevState, isPwdVisible }
    })
  }

  _handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.login();
    }
  }

  goNextField = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.user_password.control.focus();
    }
  }

  updateErrorInfo = e => {
    !e.target.value && e.target.classList.add("tooltip-error");
  };

  fileDrop = file => {
    this.setState(state => {
      let temp = { ...state };
      if (file) {
        temp.doc.doc = file[0];
        temp.required = false;
      }
      return temp;
    });
  };

  componentDidMount() {
    if (localStorage.getItem('username')?.length >= 0) {
      let __name = window.atob(localStorage.getItem('username'));
      this.setStateProperty({ "person.userName": __name, "isRemember": true });
    }
  }

  render() {
    return (
      <React.Fragment>
        <div className="item-left">
          <div className="form">
            <span className="title">
              {translateService.t("signing.freevalidationtitle")}
            </span>
            <div className="inputs">
              <div className="input-item">

                <FileDrop
                        className="fileDrops"
                        accept="application/pdf"
                        maxSize={globalConfig.MaxFileSize}
                        required={this.state.required}
                        onDrop={this.fileDrop}
                    >
                    <div className={`upload ${this.state.doc.doc ? 'close':''}`} >
                    <Input
                        type="text"
                        placeholder={translateService.t("common.uploadPdfFile")}
                        spellCheck="false"
                        value={this.state.doc.doc?.name || ""}
                        readOnly
                    />
                    {this.state.doc.doc && <button className="emtyLink" onClick={e => this.emptyFile(e)}></button>}
                    </div>
                </FileDrop>
              </div>

              <div className="input-item">
                <Input
                  name="email"
                  type="email"
                  placeholder={translateService.t("signing.emailPlaceholder")}
                  autoComplete="off"
                  spellCheck="false"
                  maxLength="50"
                  value={this.state.doc.userName || ""}
                  onChange={e => {
                    this.setStateProperty({ "doc.userName": e.target.value });
                  }}
                  rules={[{ name: "email", convert: { trim: true } }]}
                  validation={this.docValidation}
                  ref={input => (this.doc_email = input)}
                  onFocus={e => this.updateErrorInfo(e)}
                />

                <FieldValidation
                  name="email"
                  className="validation-register"
                  rule="email"
                  validation={this.docValidation}
                  for={this.doc_email}
                />
              </div>
            </div>
            <div className="buttons">
              <LoadingButton
                className="button background-color-two color-white"
                loading={this.state.isValidationLoading}
                onClick={this.validateDocument}
              >
                {translateService.t("common.validation")}
              </LoadingButton>
            </div>
          </div>
        </div>
        <div className="item-right">
          <form autoComplete="off">
            <div className="form">
              <span className="title">
                {translateService.t("signing.loginTitle")}
              </span>
              <div className="inputs">
                <div className="input-item">
                <FieldValidation
                    name="email"
                    className="validation-register"
                    rule="email"
                    validation={this.personValidation}
                    for={this.user_email}
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder={translateService.t("signing.emailPlaceholder")}
                    spellCheck="false"
                    autoComplete="off"
                    maxLength="50"
                    value={this.state.person.userName || ""}
                    onChange={e => {
                      this.setStateProperty({
                        "person.userName": e.target.value
                      });
                    }}
                    onKeyDown={e => this.goNextField(e)}
                    rules={[{ name: "email", convert: { trim: true } }]}
                    validation={this.personValidation}
                    ref={input => (this.user_email = input)}
                    onFocus={e => this.updateErrorInfo(e)}
                  />

            
                </div>
                <div className="input-item">
                <FieldValidation
                    name="password"
                    className="validation-register"
                    rule="password"
                    validation={this.personValidation}
                    for={this.user_password}
                  />
                  <div className={`has-pwd ${this.state.isPwdVisible ? 'eye' : 'eye-slash'}`} onClick={() => this.tooglePwd()}>
                 
                    <Input
                      name="password"
                      type={`${this.state.isPwdVisible ? 'text' : 'password'}`}
                      className="form-control password"
                      placeholder={translateService.t("signing.password")}
                      spellCheck="false"
                      autoComplete="off"
                      maxLength="20"
                      minLength="6"
                      value={this.state.person.password || ""}
                      onChange={e => {
                        this.setStateProperty({
                          "person.password": e.target.value
                        });
                      }}
                      rules={[{ name: "password", convert: { trim: true } }]}
                      validation={this.personValidation}
                      ref={input => (this.user_password = input)}
                      onFocus={e => this.updateErrorInfo(e)}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={this._handleKeyDown}
                    />
                  </div>

                </div>
              </div>
              <div className="password-tools">
                <span className="input-label-group">
                  <CheckBox className="checkbox-container" checked={this.state.isRemember} onChange={(e) => this.toggleIsRemember()} />
                  <span className="remember">
                    {translateService.t(`signing.rememberMe`)}
                  </span>
                </span>
                <span className="color-two lh-14">
                  <Link to="recoverPassword" className="forgotPass">
                    {translateService.t("signing.forgotPassword")}
                  </Link>
                </span>
              </div>
              <div className="buttons">
                <LoadingButton type="button"
                  className="button background-color-two color-white"
                  loading={this.state.isLoginLoading}
                  onClick={() => this.login()}
                >
                  {translateService.t(`signing.login`)}
                </LoadingButton>

                <LoadingButton
                  className="button background-color-one color-white"
                  loading={this.state.isRegisterLoading}
                  onClick={() => this.goToRegister()}
                >
                  {translateService.t(`signing.register`)}
                </LoadingButton>
              </div>
            </div>
          </form>
        </div>

        <Modal
          isOpen={this.state.errorModal || this.state.errorMessage.length > 0}
          fade={false}
          toggle={e => {
            this.setState({ errorModal: false, errorMessage: "" });
          }}
        >
          <ModalHeader>
            <span>
              &nbsp;
              <span
                onClick={() => this.setState({ errorModal: false, errorMessage: "" })}
                className="clickable"
              >
                <img src="../../assets/images/close32.svg" />
              </span>
            </span>
          </ModalHeader>
          <ModalBody>
            <div className="additional color-three">
              <img src="../../assets/images/modal-error.svg" />
              <div className="title">
                {this.state.errorMessage || translateService.t("common.requestError")}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>

            <LoadingButton type="button"
              className="button background-color-three color-white"
              onClick={() => this.setState({ errorModal: false, errorMessage: "" })}
            >
              {translateService.t(`common.ok`)}
            </LoadingButton>

          </ModalFooter>
        </Modal>

        <Modal
          isOpen={this.state.success}
          fade={true}
          className="modal"
          modalClassName="Modal-dialog"
          backdropClassName="backDrop"
          toggle={e => {
            this.setState({ success: false });
          }}
        >
          <ModalHeader>
            <span>
              &nbsp;
              <span
                onClick={() => this.setState({ success: false })}
                className="clickable"
              >
                <img src="../../assets/images/close32.svg" />
              </span>
            </span>
          </ModalHeader>
          <ModalBody>
            <div className="additional color-black">
              <img src="../../assets/images/modal-success.svg" onClick={() => this.setState({ success: false })} />
              <div className="title">
                {translateService.t('common.succesRequestGoEmail')}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>

            <LoadingButton type="button"
              className="button background-color-two color-white"
              onClick={() => this.setState({ success: false })}
            >
              {translateService.t(`common.ok`)}
            </LoadingButton>

          </ModalFooter>
        </Modal>
      </React.Fragment>
    );
  }
}
