import { stateService } from '../../services/imports';
import { stateEvents } from '../../models/imports';

//validate value using rules and custom validators
export function validate(value, rules, customValidators) {
    if (!rules) return null;
    let errors = [];

    for (let rule of rules) {
        if (!rule) continue;

        let ruleName;
        let ruleMessage;
        let ruleValue;
        if (typeof rule === 'string') {
            ruleName = rule;
            ruleMessage = rule;
        }
        else {
            ruleName = rule.name;
            ruleMessage = rule.message || rule.name;
            ruleValue = rule.value;
            if (typeof ruleValue == 'function') ruleValue = ruleValue();

            if (rule.convert) {
                if (rule.convert.trim) value = value ?.trim();
                if (rule.convert.custom) value = rule.convert.custom(value, ruleValue);
                if (typeof rule.convert == 'function') value = rule.convert(value, ruleValue);
            }
        }

        let validator = customValidators && customValidators[ruleName];
        if (!validator) validator = constValidations[ruleName];
        if (!validator) continue;

        if (!validator(value, ruleValue)) errors.push({ name: ruleName, message: ruleMessage });
    }

    return errors.length ? errors : null;
}

const defaultMessages = {
    required: "validation.required",
    email: "validation.email",
    number: "validation.number",
    pdfSizeExceeds: "validation.pdfSizeExceeds",
    invalidDate: "validation.invalidDate",
    password: "validation.password",
    error: "validation.error"
};

//create validation context
export function createValidationContext(messages) {
    let context = {
        dirty: false,
        results: [],
        messages: { ...defaultMessages, ...messages },
        events: [],
    };

    context.subscribe = function (fn) {
        if (typeof fn !== 'function') {
            let obj = fn;
            fn = () => { obj.forceUpdate(); };
        }
        this.events.push(fn);
        return {
            unsubscribe: () => {
                let index = this.events.indexOf(fn);
                if (index == -1) return;
                this.events.splice(index, 1);
            }
        };
    }

    context.notify = function (key, imediate, time = 10) {
        let exec = () => {
            for (let fn of this.events) fn(key);
        }
        if (!this.timeOuts) this.timeOuts = {};

        if (!key && this.timeOut) clearTimeout(this.timeOut);
        else if (key && this.timeOuts[key]) clearTimeout(this.timeOuts[key]);

        if (imediate) {
            exec();
            return;
        }
        if (!key) this.timeOut = setTimeout(exec, time);
        else this.timeOuts[key] = setTimeout(exec, time);
    }

    context.setDirty = function (imediate) {
        if (!this.dirty) {
            this.dirty = true;
            this.notify(undefined, imediate);
        }
        return this;
    };
    context.setPristine = function (imediate) {
        if (this.dirty) {
            this.dirty = false;
            this.notify(undefined, imediate);
        }
        return this;
    };
    context.setMessages = function (messages) {
        this.messages = messages;
        return this;
    };
    context.addResult = function (result) {
        let item = this.results.find(item => item.key == result.key);
        let index = this.results.indexOf(item);

        if (index > -1) this.results[index] = result;
        else this.results.push(result);

        this.notify(result.key);
        return this;
    };
    context.removeResult = function (key) {
        let result = this.results.find(item => item.key == key);
        let index = this.results.indexOf(result);

        if (index > -1) this.results.splice(index, 1);

        this.notify(key);
        return this;
    };
    context.getResult = function (key) {
        let item = this.results.find(item => item.key == key);

        return item;
    };
    context.getState = function (key) {
        let item = this.results.find(item => item.key == key);
        if (!item) return {};

        let valid = !(item.errors && item.errors.length > 0);
        let state = { valid, dirty: item.dirty, errors: {} };

        for (let error of item.errors || []) {
            state.errors[error.name] = true;
        }

        return state;
    };
    context.hasError = function (key, rule = null, dirty, globalDirty = true) {
        if (globalDirty !== undefined && this.dirty != globalDirty) return false;

        let state = this.getState(key);
        if (dirty !== undefined && state.dirty !== dirty) return false;

        if (!rule) return !state.valid;
        if (!state.errors) return false;
        return state.errors[rule] || false;

    }
    context.addError = function (error) {
        if (!this.messages[error]) this.messages[error] = error;

        return this.addResult({
            key: error,
            dirty: true,
            custome: true,
            errors: [{ name: error, message: error }]
        });
    };
    context.removeError = function (error) {
        return this.removeResult(error);
    };
    context.removeCustomErrors = function () {
        let results = [];
        for (let result of this.results) {
            if (!result.custome) results.push(result);
        }

        if (this.results.length != results.length) {
            this.results = results;
            this.notify();
        }
        return this;
    };

    context.throwError = function (error) {
        stateService.event(stateEvents.globalError, error);
    }

    context.isValid = function (skipCustom) {
        let results = this.results.find(item => item.errors && (!skipCustom || !item.custome));
        return !results ? true : false;
    }

    return context;
}

//if rule is object:
//name: validator property name
//message: validation message name
//key: version of rule needed if rule value changes
//value: can be primitive, object or function
export function hasRulesChanged(prevRules, nextRules) {
    if (!prevRules && !nextRules) return false;
    if (!(prevRules && nextRules)) return true;
    if (prevRules.length != nextRules.length) return true;

    for (let i = 0; i < prevRules.length; i++) {
        if (!prevRules[i] && !nextRules[i]) continue;
        if (!(prevRules[i] && nextRules[i])) return true;

        if (!prevRules[i] || typeof prevRules[i] == "string") {
            if (prevRules[i] !== nextRules[i]) return true;
        }
        else {
            if (prevRules[i].name !== nextRules[i].name || prevRules[i].key !== nextRules[i].key || prevRules[i].value !== nextRules[i].value) return true;
        }
    }

    return false;
}

//constant validation functions
export const constValidations = {
    required: function (value) {
        return (value === null || value === undefined || value === "") ? false : true;
    },

    requiredIf: function (value, ifCase) {
        if (!ifCase) return true;
        return constValidations.required(value);
    },

    requireChecked: function (value) {
        if (typeof value == 'string') return value == "true";
        return value;
    },

    email: function (value) {
        if (!value) return false;

        return /^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$/
            .test(value);
    },

    url: function (value) {
        if (!value) return true;

        return /^(?:http(s)?:\/\/)?(?:www\.)?[a-zA-Z0-9]+(?:[\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,5}(?:[\/|\#|\?]\S*)?$/
            .test(value);
    },

    min: function (value, min) {
        if (!value || (!min && min !== 0)) return true;

        let number = Number(value);
        if (!constValidations.number(number)) return false;
        return number >= min;
    },

    max: function (value, max) {
        if (!value || (!max && max !== 0)) return true;

        let number = Number(value);
        if (!constValidations.number(number)) return false;
        return number <= max;
    },

    minLength: function (value, length) {
        if (!value) return true;
        return value.length >= length;
    },

    maxLength: function (value, length) {
        if (!value) return true;
        return value.length <= length;
    },

    equals: function (value, equalValue) {
        return value === equalValue;
    },

    number: function (value) {
        if (!value && value !== 0) return true;
        if (typeof value == "string") value = Number(value);

        return Object.prototype.toString.call(value) === '[object Number]';
    },

    invalidSuggestion: function (value, id) {
        if (value && !id) return false;
        return true;
    },

    password: function (value) {
        if (!value) return false;
        if (value.indexOf(' ') != -1) return false;
        return value.length >= 6;
    },

    custom: function (value, customValue) {
        if (!value) return true;
        return customValue;
    }
};