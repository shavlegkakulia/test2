import React from "react";
import OptimizedComponent from "../../components/optimizedComponent";
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import {
  createValidationContext,
  Input,
  FieldValidation,
  LoadingButton,
  CheckBox
} from "../../components/formcontrols/imports";
import { Link } from "../../components/routing/imports";

import {
  translateService,
  routingService,
  stateService,
  authService
} from "../../services/imports";
import { defaults, stateEvents, states } from "../../models/imports";

export default class RegisterPage extends OptimizedComponent {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      password: "",
      confirmedPassword: "",
      isPwdVisible: false,
      isPwdConfirmVisible: false,
      isLoading: false,
      succesModal: false,
      agreedTermsCond: false
    };

    this.validation = createValidationContext({
      equals: "signing.passwordsNotMatch"
    });
  }

  defaultState = () => {
    this.validation.removeCustomErrors().setPristine();
  };

  tooglePwd = () => {
    this.setState(prevState => {
      let isPwdVisible = !prevState.isPwdVisible;
      return {...prevState, isPwdVisible}
    })
  }

  tooglePwdConfirm = () => {
    this.setState(prevState => {
      let isPwdConfirmVisible = !prevState.isPwdConfirmVisible;
      return {...prevState, isPwdConfirmVisible}
    })
  }

  submit = () => {
    let valid = this.validation
      .removeCustomErrors()
      .setDirty()
      .isValid();
    this.setState({ isLoading: valid });
    if (!valid) { stateService.event(stateEvents.validateCheck, { check: true }); return; }

    let person = { username: this.state.username, password: this.state.password, agreedTermsCond: this.state.agreedTermsCond }
    
    this.secureSubscription(
      authService.register(person).subscribe(
        _ => {
          this.setState({ isLoading: false, success: true, username: "", password: "", confirmedPassword: "", agreedTermsCond: false });
          this.defaultState();
        },
        err => {
          this.setState({ isLoading: false });
        }
      )
    );
  };

  toggleAggrement = () => {
    this.setState(prevState => {
      let state = {...prevState};
      state.agreedTermsCond = !state.agreedTermsCond;
      return state;
    });
  }

  openModalPage = (type) => {
    stateService.event(stateEvents.openModalPage, type);
}

  updateErrorInfo = (e) => {
    !e.target.value && e.target.classList.add("tooltip-error");
  }

  render() {
    return (
      <div className="recover-password-content">
        <div className="form mw260">
          <span className="title">
            {translateService.t("signing.registerPageTitle")}
          </span>
          <div className="inputs">
            <div className="input-item">
              <Input
                name="email"
                type="email"
                placeholder={translateService.t("signing.emailPlaceholder")}
                autoComplete="off"
                spellCheck="false"
                maxLength="50"
                minLength="6"
                value={this.state.username || ""}
                onChange={e => {
                  this.setState({
                    username: e.target.value
                  });
                }}
                rules={[{ name: "email", convert: { trim: true } }]}
                validation={this.validation}
                ref={input => this.user_email = input}
                onFocus={e => this.updateErrorInfo(e)}
              />

              <FieldValidation
                name="email"
                className="validation-register"
                rule="email"
                validation={this.validation}
                for={this.user_email}
              />
            </div>
            <div className="input-item">
            <FieldValidation
                name="password"
                className="validation-register"
                rules={['required', 'password']}
                validation={this.validation}
                for={this.user_password}
              />
            <div className={`has-pwd ${this.state.isPwdVisible ? 'eye' : 'eye-slash'}`} onClick={() => this.tooglePwd()}>
              <Input
                name="password"
                type={`${this.state.isPwdVisible ? 'text' : 'password'}`}
                className="form-control password"
                placeholder={translateService.t("signing.password")}
                autoComplete="off"
                spellCheck="false"
                maxLength="20"
                minLength="6"
                value={this.state.password || ""}
                onChange={e => {
                  this.setState({
                    password: e.target.value
                  });
                }}
                rules={['required', 'password']}
                validation={this.validation}
                ref={input => this.user_password = input}
                onFocus={e => this.updateErrorInfo(e)}
                onClick={e => e.stopPropagation()}
              />
              </div>

 
            </div>
            <div className="input-item">
            <FieldValidation
                name="confirmpassword"
                className="validation-register"
                rules={["required", "equals"]}
                validation={this.validation}
                for={this.user_confirmpassword}
              />
            <div className={`has-pwd ${this.state.isPwdConfirmVisible ? 'eye' : 'eye-slash'}`} onClick={() => this.tooglePwdConfirm()}>
              <Input
                name="confirmpassword"
                type={`${this.state.isPwdConfirmVisible ? 'text' : 'password'}`}
                className="form-control password"
                placeholder={translateService.t("signing.repeatPassword")}
                autoComplete="off"
                spellCheck="false"
                maxLength="20"
                value={this.state.confirmedPassword || ""}
                onChange={e => {
                  this.setState({
                    confirmedPassword: e.target.value
                  });
                }}
                rules={['required', { name: "equals", key: this.state.password || "", value: _ => this.state.password || "" }]}
                validation={this.validation}
                ref={input => this.user_confirmpassword = input}
                onFocus={e => this.updateErrorInfo(e)}
                onClick={e => e.stopPropagation()}
              />
              </div>

     
            </div>
          </div>
          <div className="password-tools">
                <span className="input-label-group">
                  <CheckBox className="checkbox-container" checked={this.state.agreedTermsCond}  onChange={(e) => this.toggleAggrement()} />
                  <span className="remember">
                    {translateService.t("common.iagree")}
                  </span>
                </span>
                <span className="color-two lh-14">
                  <a onClick={() => this.openModalPage(routingService.routeNames.terms)} className="forgotPass clickable">
                  {translateService.t("common.termsofuse")}
                  </a>
                </span>
              </div>
          <div className="buttons">
            <LoadingButton
              className="button background-color-one color-white"
              loading={this.state.isLoading}
              onClick={() => this.submit()}
            >
              {translateService.t(`signing.register`)}
            </LoadingButton>
          </div>
        </div>
        <Modal
          isOpen={this.state.success}
          fade={true}
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
              <img src="../../assets/images/modal-success.svg" />
              <div className="title">
                {translateService.t('common.succesRequestGoEmail')}
              </div>
            </div>
          </ModalBody>

        </Modal>
      </div>
    );
  }
}
