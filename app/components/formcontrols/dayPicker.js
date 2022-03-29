import React from 'react';
import Select from './select';

export default class DayPicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            notCompleteDateRule: {
                name: "requiredIf",
                message: this.props.notCompleteDate || 'invalidDate',
                value: _ => this.props.year || this.props.month,
                key: 0
            }
        };
    }

    getAmountOfDays(year, month) {
        if (!year) year = new Date().getFullYear();
        if (month === undefined || month === null || month === false) month = new Date().getMonth() + 1;

        return new Date(year, month, 0).getDate();
    }

    componentDidUpdate(prevProps) {
        if (this.props.year !== prevProps.year || this.props.month !== prevProps.month) {
            let days = this.getAmountOfDays(this.props.year, this.props.month);
            if (this.props.value !== 0 && Number(this.props.value) > days && this.props.onChange) {
                this.props.onChange({ target: { value: null }, customEvent: true });
            }

            this.setState((state, props) => {
                let notCompleteDateRule = { ...state.notCompleteDateRule };
                notCompleteDateRule.key++;
                return {
                    notCompleteDateRule
                }
            });
        }
    }

    render() {
        let { rules, year, month, placeholder, optionDisabled, ...props } = this.props;

        if (year !== undefined || month !== undefined) {
            rules = [...(rules || []), { ...this.state.notCompleteDateRule }];
        }

        let days = [{ value: "", text: placeholder }];
        let dayCount = this.getAmountOfDays(this.props.year, this.props.month);
        for (let i = 1; i <= dayCount; i++) {
            days.push({ value: i, text: i.toString().length == 1 ? "0" + i : i });
        }

        return (
            <Select {...props} rules={rules}>
                {
                    days.map(day => (
                        <option key={day.value} value={day.value} disabled={!!optionDisabled && optionDisabled(day.value)}>
                            {day.text}
                        </option>
                    ))
                }
            </Select>
        );
    }
}
