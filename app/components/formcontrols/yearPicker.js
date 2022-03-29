import React from 'react';
import Select from './select';

export default class YearPicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            notCompleteDateRule: {
                name: "requiredIf",
                message: this.props.notCompleteDate || 'invalidDate',
                value: _ => this.props.month || this.props.day,
                key: 0
            },

            minDateRule: {
                name: "cstMinDate",
                message: this.props.minDateMessage || 'invalidDate',
                value: _ => {
                    if (!this.props.value || !this.props.month || !this.props.day || !this.props.min) return {};
                    let now = new Date();
                    return {
                        date: new Date(this.props.value, Number(this.props.month) - 1, this.props.day),
                        compare: new Date(this.getExpressionYear(this.props.min), now.getMonth(), now.getDate())
                    };
                },
                key: 0
            },

            maxDateRule: {
                name: "cstMaxDate",
                message: this.props.maxDateMessage || 'invalidDate',
                value: _ => {
                    if (!this.props.value || !this.props.month || !this.props.day || !this.props.max) return {};
                    let now = new Date();
                    return {
                        date: new Date(this.props.value, Number(this.props.month) - 1, this.props.day),
                        compare: new Date(this.getExpressionYear(this.props.max), now.getMonth(), now.getDate())
                    };
                },
                key: 0
            }
        };

        this.customValidators = {
            cstMinDate: function (val, prop) {
                if (!prop.date || !prop.compare) return true;
                return prop.date >= prop.compare;
            },

            cstMaxDate: function (val, prop) {
                if (!prop.date || !prop.compare) return true;
                return prop.date <= prop.compare;
            }
        }
    }

    getExpressionYear(year) {
        if (typeof year == 'string') {
            if (year == "today") return new Date().getFullYear();

            if (year.startsWith("-")) {
                return new Date().getFullYear() - Number(year.replace('-', ''));
            }

            if (year.startsWith("+")) {
                return new Date().getFullYear() + Number(year.replace('+', ''));
            }
            return Number(year);
        }
        return year;
    }

    componentDidUpdate(prevProps) {
        if (this.props.month !== prevProps.month || this.props.day !== prevProps.day || this.props.value !== prevProps.value) {
            this.setState((state) => {
                let notCompleteDateRule = { ...state.notCompleteDateRule };
                let minDateRule = { ...state.minDateRule };
                let maxDateRule = { ...state.maxDateRule };
                notCompleteDateRule.key++;
                minDateRule.key++;
                maxDateRule.key++;
                return {
                    notCompleteDateRule,
                    minDateRule,
                    maxDateRule
                }
            });
        }
    }

    render() {
        let { rules, month, day, min, max, revert, minDateMessage, maxDateMessage, optionDisabled, ...props } = this.props;

        if (month !== undefined || day !== undefined || min || max) {
            rules = [...(rules || [])];
            if (month !== undefined || day !== undefined) rules.push({ ...this.state.notCompleteDateRule });
            if (min) rules.push({ ...this.state.minDateRule });
            if (max) rules.push({ ...this.state.maxDateRule });
        }

        min = this.getExpressionYear(min || 1950);
        max = this.getExpressionYear(max || new Date().getFullYear());
        let value = props.value ? Number(props.value) : props.value;
        if (value && (value > max || value < min)) props.value = "";

        let years = [{ value: "", text: props.placeholder }];

        if (revert) {
            for (let i = min; i <= max; i++)
                years.push({ value: i, text: i.toString() });
        }
        else {
            for (let i = max; i >= min; i--)
                years.push({ value: i, text: i.toString() });
        }

        return (
            <Select {...props} rules={rules} customValidators={this.customValidators}>
                {
                    years.map(year => (
                        <option key={year.value} value={year.value} disabled={!!optionDisabled && optionDisabled(year.value)}>
                            {year.text}
                        </option>
                    ))
                }
            </Select>
        );
    }
}
