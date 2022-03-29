import React from 'react';
import OptimizedComponent from '../optimizedComponent';

export default class MonthPicker extends OptimizedComponent {
    constructor(props) {
        super(props);
    }

    render() {
        let { disabled, loading, className, loadingClassName, children, ...props } = this.props;

        return (
            <button {...props} className={loading ? (loadingClassName || className) : className} disabled={loading ? true : disabled}>
                {loading ? <div id="default-loader"></div> : children}
            </button>
        );
    }
}