import React from 'react';
import OptimizedComponent from '../optimizedComponent';

import { commonService } from '../../services/imports';
import { validate, hasRulesChanged } from './validation';

//Decorated component which is used buy other components like Input
export default class FormControl extends OptimizedComponent {
    constructor(props) {
        super(props);
    }

    isDirty(props) {
        if (!props) props = this.props;

        if (props.dirty !== undefined) return props.dirty;
        if (props.validation) return props.validation.dirty;
        return false;
    }

    shouldComponentUpdate(nextProps, nextState) {
        this.hasRulesChanged = hasRulesChanged(this.props.rules, nextProps.rules);
        if (this.hasRulesChanged) return true;
        if (this.isDirty() !== this.isDirty(nextProps)) return true;

        return super.shouldComponentUpdate(nextProps, nextState, {
            propsToSkip: {
                rules: true,
                validation: true,
                customValidators: true,
                onChange: true
            }
        });
    }

    //when value is chenged validates it and binds result to validationContext
    componentDidUpdate(prevProps) {
        if (prevProps.name !== this.props.name) {
            if (this.props.validation)
                this.props.validation.removeResult(this.keyName);
            this.keyName = this.props.name || commonService.guid();
        }

        //validates only if value, dirty or rules changes
        if (prevProps.name === this.props.name && this.props.value === prevProps.value && this.isDirty() === this.isDirty(prevProps) && !this.hasRulesChanged) return;
        this.hasRulesChanged = false;//to prevent loop

        if (this.props.validation) {
            let errors = validate(this.props.value, this.props.rules, this.props.customValidators);
            let dirty = this.isDirty();

            this.props.validation.addResult({
                key: this.keyName,
                dirty: dirty,
                errors: errors
            });
        }
    }

    //validates calls bind first time
    componentDidMount() {
        this.keyName = this.props.name || commonService.guid();

        if (this.props.validation) {
            let errors = validate(this.props.value, this.props.rules, this.props.customValidators)
            let dirty = this.isDirty();

            this.props.validation.addResult({
                key: this.keyName,
                dirty: dirty,
                errors: errors
            });

            if (errors && dirty) this.forceUpdate();

            this.secureSubscription(this.props.validation.subscribe((key) => {
                if (!key || key == this.keyName) this.forceUpdate();
            }));
        }
    }

    //removes binding from validation context
    componentWillUnmount() {
        super.componentWillUnmount();

        if (this.props.validation)
            this.props.validation.removeResult(this.keyName);
    }

    getRenderProps() {
        let { validation, customValidators, dirty, rules, ...props } = this.props;
        if (validation) {
            let result = validation.getResult(this.keyName);
            if (result && result.errors && this.isDirty()) props.className = `${props.className || ''} has-error`;
        }
        return props;
    }
}
