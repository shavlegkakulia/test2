import React from 'react';
import OptimizedComponent from '../optimizedComponent';

import { routingService } from '../../services/imports';

export default class LinkComponent extends OptimizedComponent {
    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.hasImmutableContainerChanged(this.props.params, nextProps.params)) return true;
        if ((typeof nextProps.query != 'string') && this.hasImmutableContainerChanged(this.props.query, nextProps.query)) return true;

        return super.shouldComponentUpdate(nextProps, nextState, {
            propsToSkip: {
                params: true,
                query: (typeof nextProps.query != 'string'),
            }
        });
    }

    onClick = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();

        if (this.props.onClick) {
            let result = this.props.onClick(e);
            if (result === false) return;
        }

        let { to, params, query, replace, data } = this.props;

        if (replace === undefined) routingService.navigate(to, { params, query, data });
        else if (replace) routingService.replace(to, { params, query, data });
        else routingService.push(to, { params, query, data });
    }

    render() {
        let { to, params, query, replace, data, onClick, ...props } = this.props;
        let path = to && routingService.routePath(to, params);
        let pathQuery = query ? routingService.toQuery(query) : '';

        if (!to) return <a {...props} />
        return <a href={path + pathQuery} {...props} onClick={this.onClick} />
    }
}