import React from 'react';
import FromControl from './fromControl';

export default class Input extends FromControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        if (!props.type) props.type = "text";

        return <input {...props} ref={el => { this.control = el; }} />;
    }
}
