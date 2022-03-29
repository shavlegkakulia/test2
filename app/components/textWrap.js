import React from 'react';

export default class TextWrap extends React.Component {
    constructor(props) {
        super(props);
    }

    createRef = (ref) => {
        this.element = ref;
        this.onChange();
    }

    onChange() {
        if (!this.element) return;
        let widthTolerance = this.props.widthTolerance === undefined? 5 : this.props.widthTolerance;
        let heightTolerance = this.props.heightTolerance === undefined? 5 : this.props.heightTolerance;
        
        let widthOverflow = (this.element.offsetWidth + widthTolerance) < this.element.scrollWidth;
        let heightOverflow = (this.element.offsetHeight + heightTolerance) < this.element.scrollHeight;
        let changed = widthOverflow !== this.widthOverflow || heightOverflow !== this.heightOverflow;

        this.widthOverflow = widthOverflow;
        this.heightOverflow = heightOverflow;
        if (changed && this.props.onChange) this.props.onChange({
            widthOverflow,
            heightOverflow
        });
    }

    componentDidUpdate() {
        this.onChange();
    }

    render() {
        let child = React.Children.only(this.props.children);
        return React.cloneElement(child, { ref: this.createRef });
    }
}