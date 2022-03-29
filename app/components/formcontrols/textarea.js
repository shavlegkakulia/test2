import React from 'react';
import FromControl from './fromControl';

export default class TextArea extends FromControl {
    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps, prevState) {
        super.componentDidUpdate(prevProps, prevState);
        if (prevProps.value != this.props.value && this.props.autoHeight) {
            this.control.style.height = 0;
            this.control.style.height = this.control.scrollHeight + 'px';
        }
    }

    componentDidMount(){
        super.componentDidMount();
        if (this.props.value && this.props.autoHeight) {
            this.control.style.height = 0;
            this.control.style.height = this.control.scrollHeight + 'px';
        }
    }

    render() {
        let renderProps = this.getRenderProps();
        let { autoHeight, ...props } = renderProps;

        return <textarea {...props} ref={el => { this.control = el; }} />
    }
}
