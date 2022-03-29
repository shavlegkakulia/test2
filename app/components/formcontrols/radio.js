import React from 'react';
import FromControl from './fromControl';

export default class Radio extends FromControl {
    constructor(props) {
        super(props);
    }

    render() {
        let props = this.getRenderProps();
        
        return <input {...props} type="radio" ref={el => { this.control = el; }} />;
    }
}
