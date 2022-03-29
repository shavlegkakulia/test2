import React from 'react';
import OptimizedComponent from '../optimizedComponent';
import { stateService } from '../../services/imports';
import { stateEvents } from '../../models/imports';
import { translateService } from '../../services/imports';

//shows field validation errors
export default class FieldValidation extends OptimizedComponent {
    constructor(props) {
        super(props);

        this.state = {
            showError: true
        }
    }

    componentDidMount() {
        if (!this.props.validation) return;
        this.secureSubscription(this.props.validation.subscribe(() => {
            this.forceUpdate();
        }));

        this.secureSubscription(stateService.onEvent(stateEvents.validateCheck).subscribe(e => {
            this.setState({showError: true});
        }));
    }

    hideError = () => {
        this.setState({showError: false});
        if(this.props.for) this.props.for.control.focus();
    }

    render() {
        if (!this.props.validation) return null;

        let rule = this.props.rule;;
        let hasError = false;
        let message = null;

        if (rule) {
            hasError = this.props.validation.hasError(this.props.name, this.props.rule, this.props.dirty, this.props.globalDirty);
        }
        else if (this.props.rules && this.props.rules.length) {
            for (let ruleName of this.props.rules) {
                rule = ruleName;
                hasError = this.props.validation.hasError(this.props.name, rule, this.props.dirty, this.props.globalDirty);

                if (hasError) break;
            }
        }
        else if (this.props.hasError) {
            hasError = this.props.hasError(this.props.validation);
            message = hasError;
        }

        if (rule) message = this.props.message || translateService.t(this.props.validation.messages[rule]);

        if (!hasError) { return null }; 

        let cln = `${this.props.className} ${!this.state.showError?'tooltip':''} ${(this.state.showError && this.props.for?.control.value)?'tooltip':''}`
        return (
            <div onClick={this.hideError} className={cln}>
                <div className="message">
                    <div className="text-area">{message}</div>
                </div>
            </div>
        );
    }
}