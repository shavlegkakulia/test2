import React from 'react';
import FromControl from './fromControl';

export default class CheckBox extends FromControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        return  <label className={this.props.className}>
                    <input {...props} type="checkbox" ref={el => { this.control = el; }} />
                    <span className="checkmark"></span>
                </label>
    }
}
