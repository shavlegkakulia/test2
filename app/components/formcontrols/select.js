import React from 'react';
import FromControl from './fromControl';

export default class Select extends FromControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        
        return <select {...props} ref={el => { this.control = el; }} />;
    }
}
