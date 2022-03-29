import React from 'react';
import Select from './select';

import { dateHelperService } from '../../services/imports';

export default class MonthPicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            notCompleteDateRule: {
                name: "requiredIf",
                message: this.props.notCompleteDate || 'invalidDate',
                value: _ => this.props.year || this.props.day,
                key: 0
            }
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.year !== prevProps.year || this.props.day !== prevProps.day) {
            this.setState((state) => {
                let notCompleteDateRule = { ...state.notCompleteDateRule };
                notCompleteDateRule.key++;
                return {
                    notCompleteDateRule
                }
            });
        }
    }

    render() {
        let { rules, year, day, short, optionDisabled, ...props } = this.props;

        if (year !== undefined || day !== undefined) {
            rules = [...(rules || []), { ...this.state.notCompleteDateRule }];
        }

        return (
            <Select {...props} rules={rules}>
                <option key="" value="" disabled={!!optionDisabled && optionDisabled()}>{this.props.placeholder}</option>
                <option key="1" value="1" disabled={!!optionDisabled && optionDisabled(1)}>{dateHelperService.getMonthName(1, short)}</option>
                <option key="2" value="2" disabled={!!optionDisabled && optionDisabled(2)}>{dateHelperService.getMonthName(2, short)}</option>
                <option key="3" value="3" disabled={!!optionDisabled && optionDisabled(3)}>{dateHelperService.getMonthName(3, short)}</option>
                <option key="4" value="4" disabled={!!optionDisabled && optionDisabled(4)}>{dateHelperService.getMonthName(4, short)}</option>
                <option key="5" value="5" disabled={!!optionDisabled && optionDisabled(5)}>{dateHelperService.getMonthName(5, short)}</option>
                <option key="6" value="6" disabled={!!optionDisabled && optionDisabled(6)}>{dateHelperService.getMonthName(6, short)}</option>
                <option key="7" value="7" disabled={!!optionDisabled && optionDisabled(7)}>{dateHelperService.getMonthName(7, short)}</option>
                <option key="8" value="8" disabled={!!optionDisabled && optionDisabled(8)}>{dateHelperService.getMonthName(8, short)}</option>
                <option key="9" value="9" disabled={!!optionDisabled && optionDisabled(9)}>{dateHelperService.getMonthName(9, short)}</option>
                <option key="10" value="10" disabled={!!optionDisabled && optionDisabled(10)}>{dateHelperService.getMonthName(10, short)}</option>
                <option key="11" value="11" disabled={!!optionDisabled && optionDisabled(11)}>{dateHelperService.getMonthName(11, short)}</option>
                <option key="12" value="12" disabled={!!optionDisabled && optionDisabled(12)}>{dateHelperService.getMonthName(12, short)}</option>
            </Select>
        );
    }
}
