import React from "react";
import {
    createValidationContext,
    Input,
    LoadingButton,
    FieldValidation,
    TextArea
} from "../../components/formcontrols/imports";
import { translateService, routingService, paymentService, authService } from "../../services/imports";

export default class PaymentDetailsPage extends React.Component {
    constructor() {
        super();

        this.state = {
            email: "",
            password: "",
            repeatPassword: "",
            accountDomainName: "",
            isPwdVisible: false,
            bankCardNumber: null,
            cardHolder: "",
            month: null,
            year: null,
            cvcCode: null,
            isLoading: false
        };

        this.payValidation = createValidationContext();
    }

    goBack = () => {
        this.props.onCloseModal();
    }

    tooglePwd = () => {
        this.setState(prevState => {
          let isPwdVisible = !prevState.isPwdVisible;
          return {...prevState, isPwdVisible}
        })
      }

    submit = () => {
        // let valid = this.payValidation
        //     .removeCustomErrors()
        //     .setDirty()
        //     .isValid();
        // if (!valid) return;

        paymentService.authorizePaypal({
            "subscriptionId":"1",
            "tax":"0.01",
            "subtotal":"0.01",
            "total":"0.02",
            "payerName":"John",
            "payerLName":"Doe",
            "payerMail":"sb-43jfcx3218662@personal.example.com"
        }).subscribe(res => {
            //console.log(res)
        })
    };

    render() {
        return (
            <div className="payment-details container" >
                <div className="page-header">
                    <span className="clickable" onClick={this.goBack}>
                        <img src="../../assets/images/close32.svg" />
                    </span>
                </div>
                <div className="payment-details-items" >
                    <div className="flex-title-item">
                        <span className="title">
                            {translateService.t("packages.detailPageTitle")}
                        </span>

                        <span className="account-info">
                            <span className="account-number">{this.props.activeDomain}</span>
                            <span className="account-domain-name">{translateService.t("common.accountDomainName")}</span>
                        </span>
                    </div>

                    <span className="title2">
                        {translateService.t("packages.detailPageTitle2")}<span className="color-two"> {translateService.t("packages.package")} {this.props.packageId}</span>
                    </span>

                    <span className="desc">
                        {translateService.t("packages.detailPageDesc")}
                    </span>

                    {!authService.isAuthenticated() &&
                    <div className="not-auth">
                        <div className="items">
                            <div className="item">
                                <div className="inputs">
                                    <div className="input-item">
                                        <Input
                                            name="email"
                                            type="email"
                                            placeholder={translateService.t("signing.emailPlaceholder")}
                                            autoComplete="off"
                                            spellCheck="false"
                                            maxLength="20"
                                            value={this.state.email || ""}
                                            onChange={e => {
                                                this.setState({
                                                    email: e.target.value
                                                });
                                            }}
                                            rules={[{ name: "required", convert: { trim: true } }]}
                                            validation={this.payValidation}
                                        />

                                        <FieldValidation
                                            name="email"
                                            className="validation-register"
                                            rule="required"
                                            validation={this.payValidation}
                                        />
                                    </div>
                                    <div className="input-item">
                                        <Input
                                            name="repeatPassword"
                                            type="password"
                                            placeholder={translateService.t("signing.repeatPassword")}
                                            autoComplete="off"
                                            spellCheck="false"
                                            maxLength="20"
                                            value={this.state.repeatPassword || ""}
                                            onChange={e => {
                                                this.setState({
                                                    repeatPassword: e.target.value
                                                });
                                            }}
                                            rules={[{ name: "required", convert: { trim: true } }]}
                                            validation={this.payValidation}
                                        />

                                        <FieldValidation
                                            name="repeatPassword"
                                            className="validation-register"
                                            rule="required"
                                            validation={this.payValidation}
                                        />
                                    </div>
                                    <div className="input-item">
                                        <Input
                                            name="bankCardNumber"
                                            type="text"
                                            placeholder={translateService.t("packages.bankCardNumber")}
                                            autoComplete="off"
                                            spellCheck="false"
                                            maxLength="20"
                                            value={this.state.bankCardNumber || ""}
                                            onChange={e => {
                                                this.setState({
                                                    bankCardNumber: e.target.value
                                                });
                                            }}
                                            rules={[{ name: "required", convert: { trim: true } }]}
                                            validation={this.payValidation}
                                        />

                                        <FieldValidation
                                            name="bankCardNumber"
                                            className="validation-register"
                                            rule="required"
                                            validation={this.payValidation}
                                        />
                                    </div>
                                    <div className="input-item">
                                        <Input
                                            name="month"
                                            type="text"
                                            placeholder={translateService.t("packages.monthYear")}
                                            autoComplete="off"
                                            spellCheck="false"
                                            maxLength="20"
                                            value={this.state.month || ""}
                                            onChange={e => {
                                                this.setState({
                                                    month: e.target.value
                                                });
                                            }}
                                            rules={[{ name: "required", convert: { trim: true } }]}
                                            validation={this.payValidation}
                                        />

                                        <FieldValidation
                                            name="month"
                                            className="validation-register"
                                            rule="required"
                                            validation={this.payValidation}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="item">
                                <div className="inputs">
                                    <div className="input-item">
                                    <div className={`has-pwd ${this.state.isPwdVisible ? 'eye' : 'eye-slash'}`} onClick={() => this.tooglePwd()}>
                                        <Input
                                            name="password"
                                            type={`${this.state.isPwdVisible ? 'text' : 'password'}`}
                                            className="password"
                                            placeholder={translateService.t("signing.password")}
                                            autoComplete="off"
                                            spellCheck="false"
                                            maxLength="20"
                                            value={this.state.password || ""}
                                            onChange={e => {
                                                this.setState({
                                                    password: e.target.value
                                                });
                                            }}
                                            rules={[{ name: "required", convert: { trim: true } }]}
                                            validation={this.payValidation}
                                            onClick={e => e.stopPropagation()}
                                        />
                                        </div>

                                        <FieldValidation
                                            name="password"
                                            className="validation-register"
                                            rule="required"
                                            validation={this.payValidation}
                                        />
                                    </div>
                                    <div className="input-item">
                                        <Input
                                            name="accountDomainName"
                                            type="text"
                                            placeholder={translateService.t("common.accountDomainName")}
                                            autoComplete="off"
                                            spellCheck="false"
                                            maxLength="20"
                                            value={this.state.accountDomainName || ""}
                                            onChange={e => {
                                                this.setState({
                                                    accountDomainName: e.target.value
                                                });
                                            }}
                                            rules={[{ name: "required", convert: { trim: true } }]}
                                            validation={this.payValidation}
                                        />

                                        <FieldValidation
                                            name="accountDomainName"
                                            className="validation-register"
                                            rule="required"
                                            validation={this.payValidation}
                                        />
                                    </div>
                                    <div className="input-item">
                                        <Input
                                            name="cardHolder"
                                            type="text"
                                            placeholder={translateService.t("packages.cardHolder")}
                                            autoComplete="off"
                                            spellCheck="false"
                                            maxLength="20"
                                            value={this.state.cardHolder || ""}
                                            onChange={e => {
                                                this.setState({
                                                    cardHolder: e.target.value
                                                });
                                            }}
                                            rules={[{ name: "required", convert: { trim: true } }]}
                                            validation={this.payValidation}
                                        />

                                        <FieldValidation
                                            name="cardHolder"
                                            className="validation-register"
                                            rule="required"
                                            validation={this.payValidation}
                                        />
                                    </div>
                                    <div className="input-item">
                                        <Input
                                            name="cvcCode"
                                            type="text"
                                            placeholder={translateService.t("packages.cvcCode")}
                                            autoComplete="off"
                                            spellCheck="false"
                                            maxLength="20"
                                            value={this.state.cvcCode || ""}
                                            onChange={e => {
                                                this.setState({
                                                    cvcCode: e.target.value
                                                });
                                            }}
                                            rules={[{ name: "required", convert: { trim: true } }]}
                                            validation={this.payValidation}
                                        />

                                        <FieldValidation
                                            name="cvcCode"
                                            className="validation-register"
                                            rule="required"
                                            validation={this.payValidation}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="buttons">
                            <LoadingButton
                                className="button background-color-two color-white"
                                loading={this.state.isLoading}
                                onClick={this.submit}
                            >
                                {translateService.t(`packages.pay`)}
                            </LoadingButton>
                        </div>
                    </div>}

                    {authService.isAuthenticated() &&
                    <div className="auth">
                        <div className="items">
                            <div className="input-item">
                                <Input
                                    name="accountDomainName"
                                    type="text"
                                    placeholder={translateService.t("common.accountDomainName")}
                                    autoComplete="off"
                                    spellCheck="false"
                                    maxLength="20"
                                    value={this.state.accountDomainName || ""}
                                    onChange={e => {
                                        this.setState({
                                            accountDomainName: e.target.value
                                        });
                                    }}
                                    rules={[{ name: "required", convert: { trim: true } }]}
                                    validation={this.payValidation}
                                />

                                <FieldValidation
                                    name="accountDomainName"
                                    className="validation-register"
                                    rule="required"
                                    validation={this.payValidation}
                                />
                            </div>
                            <div className="input-item">
                                <Input
                                    name="bankCardNumber"
                                    type="text"
                                    placeholder={translateService.t("packages.bankCardNumber")}
                                    autoComplete="off"
                                    spellCheck="false"
                                    maxLength="20"
                                    value={this.state.bankCardNumber || ""}
                                    onChange={e => {
                                        this.setState({
                                            bankCardNumber: e.target.value
                                        });
                                    }}
                                    rules={[{ name: "required", convert: { trim: true } }]}
                                    validation={this.payValidation}
                                />

                                <FieldValidation
                                    name="bankCardNumber"
                                    className="validation-register"
                                    rule="required"
                                    validation={this.payValidation}
                                />
                            </div>
                            <div className="input-item">
                                <Input
                                    name="cardHolder"
                                    type="text"
                                    placeholder={translateService.t("packages.cardHolder")}
                                    autoComplete="off"
                                    spellCheck="false"
                                    maxLength="20"
                                    value={this.state.cardHolder || ""}
                                    onChange={e => {
                                        this.setState({
                                            cardHolder: e.target.value
                                        });
                                    }}
                                    rules={[{ name: "required", convert: { trim: true } }]}
                                    validation={this.payValidation}
                                />

                                <FieldValidation
                                    name="cardHolder"
                                    className="validation-register"
                                    rule="required"
                                    validation={this.payValidation}
                                />
                            </div>
                            <div className="input-item">
                                <Input
                                    name="month"
                                    type="text"
                                    placeholder={translateService.t("packages.monthYear")}
                                    autoComplete="off"
                                    spellCheck="false"
                                    maxLength="20"
                                    value={this.state.month || ""}
                                    onChange={e => {
                                        this.setState({
                                            month: e.target.value
                                        });
                                    }}
                                    rules={[{ name: "required", convert: { trim: true } }]}
                                    validation={this.payValidation}
                                />

                                <FieldValidation
                                    name="month"
                                    className="validation-register"
                                    rule="required"
                                    validation={this.payValidation}
                                />
                            </div>
                            <div className="input-item">
                                <Input
                                    name="cvcCode"
                                    type="text"
                                    placeholder={translateService.t("packages.cvcCode")}
                                    autoComplete="off"
                                    spellCheck="false"
                                    maxLength="20"
                                    value={this.state.cvcCode || ""}
                                    onChange={e => {
                                        this.setState({
                                            cvcCode: e.target.value
                                        });
                                    }}
                                    rules={[{ name: "required", convert: { trim: true } }]}
                                    validation={this.payValidation}
                                />

                                <FieldValidation
                                    name="cvcCode"
                                    className="validation-register"
                                    rule="required"
                                    validation={this.payValidation}
                                />
                            </div>
                        </div>
                        <div className="buttons">
                            <LoadingButton
                                className="button background-color-two color-white"
                                loading={this.state.isLoading}
                                onClick={this.submit}
                            >
                                {translateService.t(`packages.pay`)}
                            </LoadingButton>
                            <LoadingButton
                                className="button background-color-one color-white"
                                loading={this.state.isLoading}
                            >
                                {translateService.t(`packages.savecardInformation`)}
                            </LoadingButton>
                        </div>
                    </div>}
                </div>
            </div>
        );
    }
}
