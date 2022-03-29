import React from 'react';
import Input from './input';

export default class TimePicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: '',
            showPicker: false
        };

        this.hours = [];
        this.minutes = [];

        for (let i = 0; i < 24; i++) this.hours.push(i);
        for (let i = 0; i < 60; i++) this.minutes.push(i);
    }

    onInputFocus = e => {
        this.setState({ showPicker: true }, () => { this.hasFocus = true; });
    }

    onPickerFocus = e => {
        this.hasFocus = true;
    }

    checkValidity = (str) => {
        if (str.length > 5) return null;

        let separatorIndex = str.indexOf(':');
        let hour = Number(separatorIndex == -1 ? str : str.substring(0, separatorIndex));
        let minute = Number(separatorIndex == -1 ? "0" : str.substring(separatorIndex + 1));

        if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
        if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
        if (hour < 0 || hour > 23) return null;
        if (minute < 0 || minute > 59) return null;

        return { hour, minute };
    }

    onBlur = e => {
        // if (this.blurInterval) clearInterval(this.blurInterval);
        // this.hasFocus = false;
        // this.blurInterval = setTimeout(() => {
        //     if (this.hasFocus || this.props.readOnly || this.props.disabled) return;
        //     this.setState({ showPicker: false });

        //     if (!this.state.value) {
        //         this.props.onChange({ target: { value: null } });
        //         return;
        //     }
        //     let time = this.checkValidity(this.state.value);
        //     if (time) {
        //         this.props.onChange({ target: { value: time } });
        //     }
        //     else {
        //         this.setState({ value: '' });
        //         this.props.onChange({ target: { value: null } });
        //     }
        // }, 20);
    }

    onTimeChange = (value) => {
        let time = { ...(this.props.value || { hour: 0, minute: 0 }), ...value };
        this.props.onChange({ target: { value: time } })
    }

    format(value) {
        if (!value) return "";
        let { hour, minute } = value;
        return `${hour < 10 ? "0" : ""}${hour}:${minute < 10 ? "0" : ""}${minute}`;;
    }

    componentDidUpdate(prevProps) {
        if (this.props.value != prevProps.value) {
            this.setState({ value: this.format(this.props.value) });
        }
    }

    componentDidMount() {
        this.setState({ value: this.format(this.props.value) });
    }

    componentWillUnmount() {
        if (this.blurInterval) clearInterval(this.blurInterval);
    }

    render() {
        let {
            value,
            onChange,
            show24,
            readOnly,
            ...props
        } = this.props;

        let { hour = 0, minute = 0 } = value || {};

        let hours = [...this.hours];
        if (show24) {
            hours.splice(0, 1);
            hours.push(24);
        }

        return (
            <React.Fragment>
                <Input type="text" {...props} maxLength="5"
                    value={this.state.value} onChange={e => { this.setState({ value: e.target.value }); }} readOnly={readOnly}
                    onFocus={this.onInputFocus} onBlur={this.onBlur} />
                {
                    <div className="time-picker" tabIndex="-1" onFocus={this.onPickerFocus} onBlur={this.onBlur}>
                        <select value={hour} onChange={e => { this.onTimeChange({ hour: Number(e.target.value) }) }} disabled={readOnly}>
                            {
                                hours.map(item => <option key={item} value={item == 24 ? 0 : item}>{item < 10 ? "0" : ""}{item}</option>)
                            }
                        </select>
                        <label>:</label>
                        <select value={minute} onChange={e => { this.onTimeChange({ minute: Number(e.target.value) }) }} disabled={readOnly}>
                            {
                                this.minutes.map(item => <option key={item} value={item}>{item < 10 ? "0" : ""}{item}</option>)
                            }
                        </select>
                    </div>
                }
            </React.Fragment>
        );
    }
}
