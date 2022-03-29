import React from 'react';
import { UncontrolledTooltip } from 'reactstrap';

import { commonService } from '../services/imports';

export default class Tooltip extends React.Component {
    constructor(props) {
        super(props);
    }

    createRef = (ref) => {
        this.el = ref;
    }

    componentDidMount() {
        //first time is not showing without this
        this.forceUpdate();
    }

    render() {
        let { placement, trigger, content, renderContent, ...props } = this.props;
        let child = this.props.children.length ? this.props.children[0] : this.props.children;

        if (typeof child.type != "string" && !this.id) {
            this.id = child.props.id || ('tl_' + commonService.guid());
        }
        return (
            <React.Fragment>
                {
                    React.cloneElement(child, { ref: this.createRef, id: this.id })
                }
                {
                    (this.el && content ?.length > 0) &&
                    <UncontrolledTooltip {...props} target={this.id ? `#${this.id}` : this.el} placement={placement || 'bottom'} trigger={trigger || 'hover'}>
                        {renderContent ? renderContent() : content}
                    </UncontrolledTooltip>
                }
            </React.Fragment>
        );
    }
}