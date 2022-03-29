import React from "react";
import {
  createValidationContext,
  Input,
  LoadingButton,
  FieldValidation,
  TextArea
} from "../../components/formcontrols/imports";
import { translateService, stateService, contactService } from "../../services/imports";
import { stateEvents } from "../../models/states";
import { Modal, ModalBody, ModalHeader } from "reactstrap";

export default class ContactPage extends React.Component {
  constructor() {
    super();

    this.state = {
      name: "",
      email: "",
      text: "",
      success: false,
      isLoading: false
    };

    this.contactValidation = createValidationContext();
  }

  defaultState = () => {
    this.contactValidation.removeCustomErrors().setPristine();
  };

  goBack = () => {
    stateService.event(stateEvents.openModalPage, null);
  }

  submit = () => {
    let valid = this.contactValidation
      .removeCustomErrors()
      .setDirty()
      .isValid();
    if (!valid) return;
    this.setState({isLoading: true});
    contactService.sendSystemEmail({email: this.state.email, text: this.state.text}).subscribe(res => {
     if(res.success) {
      this.defaultState();
      this.setState({ email: "", text: "", name: "", success: true});
     }
     this.setState({isLoading: false});
    }, () => {
      this.setState({isLoading: false});
    });
  };

  componentDidMount() {
    stateService.event(stateEvents.scrollUp);
  }

  componentWillUnmount() {
      stateService.event(stateEvents.scrollUp);
  }

  render() {
    return (
      <div className={`contact container ${!this.props?.display? 'd-none' : ''}`}>
        <div className="page-header">
          <span className="clickable" onClick={this.goBack}>
            <img src="../../assets/images/close32.svg" />
          </span>
        </div>
        <div className="row-container">
          <div className="row row-left">
            <div className="form">
              <span className="title">
                {translateService.t("contact.pageTtitle")}
              </span>
              <span className="desc">
                {translateService.t("contact.desc")}
              </span>
              <div className="inputs">
                <div className="input-item">
                  <Input
                    name="name"
                    type="text"
                    placeholder={translateService.t("contact.fullName")}
                    autoComplete="off"
                    spellCheck="false"
                    maxLength="200"
                    value={this.state.name || ""}
                    onChange={e => {
                      this.setState({
                        name: e.target.value
                      });
                    }}
                  />
                </div>
                <div className="input-item">
                  <Input
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder={translateService.t("contact.yourEmail")}
                    autoComplete="off"
                    spellCheck="false"
                    maxLength="60"
                    value={this.state.email || ""}
                    onChange={e => {
                      this.setState({
                        email: e.target.value
                      });
                    }}
                    rules={[{ name: "email", convert: { trim: true } }]}
                    validation={this.contactValidation}
                  />

                  <FieldValidation
                    name="email"
                    className="validation-register"
                    rule="email"
                    validation={this.contactValidation}
                  />
                </div>
                <div className="input-item">
                  <TextArea
                    name="text"
                    value={this.state.text || ""}
                    onChange={e => {
                      this.setState({
                        text: e.target.value
                      });
                    }}
                    autoComplete="off"
                    spellCheck="false"
                    placeholder={translateService.t("contact.message")}
                    rules={[{ name: "required", convert: { trim: true } }]}
                    validation={this.contactValidation}
                  />
                  <FieldValidation
                    name="text"
                    className="validation-register"
                    rule="required"
                    validation={this.contactValidation}
                  />
                </div>
              </div>
              <div className="buttons">
                <LoadingButton
                  className="button background-color-two color-white"
                  loading={this.state.isLoading}
                  onClick={this.submit}
                >
                  {translateService.t(`contact.submit`)}
                </LoadingButton>
              </div>
            </div>
          </div>
          <div className="row row-right">
            <div className="templates">
            <span className="title">
                &nbsp;
              </span>
              <div className="template">
                <div className="item-left"><img src="../../assets/images/location.svg" /></div>
                <div className="item-right">
                  <div className="item">
                    {translateService.t(`contact.locationTitle`)}
                  </div>
                  <div className="item">{translateService.t("contact.location")} </div>
                  {/* <div className="item">block 22/5</div> */}
                </div>
              </div>

              <div className="template">
                <div className="item-left"><img src="../../assets/images/postal.svg" /></div>
                <div className="item-right">
                  <div className="item">
                    {translateService.t(`contact.email`)}
                  </div>
                  <div className="item">support@aisitec.com</div>
                </div>
              </div>

              <div className="template">
                <div className="item-left"><img src="../../assets/images/phone.svg" /></div>
                <div className="item-right">
                  <div className="item">
                    {translateService.t(`contact.phone`)}
                  </div>
                  <div className="item">+995 577783892</div>
                  {/* <div className="item">+995 032 2 12 12 12</div> */}
                </div>
              </div>
            </div>
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
              <div className="title">{translateService.t('common.succes')}</div>
            </div>
          </ModalBody>
        </Modal>
      </div>
    );
  }
}
