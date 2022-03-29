import React from 'react';
import { Route } from 'react-router-dom';

import { routingService } from '../../services/imports';

export default class SimpleRoute extends React.Component {
    constructor(props) {
        super(props);
    }

    getInjectedProps() {
        let { component, skipReload, ...props } = this.props;

        props.render = (locationProps) => {
            routingService.routeChanged(locationProps.history, locationProps.match);
            let reload = false;

            if (this._prevPath && this._prevKey && !skipReload &&
                locationProps.history.location.pathname === this._prevPath &&
                locationProps.history.location.key !== this._prevKey) {
                reload = true;
            }
            if (locationProps.history.location.pathname !== this._prevPath) {
                window.scrollTo(0, 0);
            }

            this._prevPath = locationProps.history.location.pathname;
            this._prevKey = locationProps.history.location.key;
            let Component = component;
            return (
                <Container reload={reload}>
                    <Component {...props} {...locationProps} />
                </Container>
            );
        };

        return props;
    }

    render() {
        return (<Route {...this.getInjectedProps()} />);
    }
}

class Container extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            render: true
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.reload === prevProps.reload || !this.props.reload) return;
        this.setState({ render: false }, () => { this.setState({ render: true }); })
    }

    componentDidMount() {
        if (this.props.reload) this.setState({ render: false }, () => { this.setState({ render: true }); })
    }

    render() {
        if (!this.state.render) return null;

        return (
            <React.Fragment>
                {this.props.children}
            </React.Fragment>
        );
    }
}