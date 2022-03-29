import React, { Component } from 'react';

export default class DropDown extends Component {

    constructor(props) {
        super(props);

        this.state = {
            open: false,
        };
    }

    show = () => {
        this.setState({open: true});
    };

    blur = () => {
        if(this.toggleTimeout) clearTimeout(this.toggleTimeout);

        this.toggleTimeout = setTimeout(() => {
            this.setState({open: false});
        }, 300);
    }

    componentWillUnmount() {
        if(this.toggleTimeout) clearTimeout(this.toggleTimeout);
    }

    render() {
        return (
            <div className={this.props.className} >
                <div className={this.props.tapClassName} tabIndex="1" onClick={this.show} onBlur={this.blur} >
                    <span className={this.props.activeClassName} >
                        {this.props.current}
                    </span>                                     
                    {
                        this.props.tapImg ? <img src={this.props.tapImg} />
                            :
                            <img src={`../../assets/images/${this.state.isVisible ? 'up' : 'down'}-arrow.svg`} />
                    }
                </div>
                {this.state.open &&
                    (
                        <div >{this.props.children}</div>
                    )
                }
            </div>
        )
    }
}

