import React from 'react';
import { Prompt } from 'react-router-dom';
import { fromEvent } from 'rxjs';

import { routingService } from '../../services/imports';

export default class AdvancedPrompt extends React.Component {
    constructor(props) {
        super(props);

        this.prompts = [];
    }

    onPrompt = location => {
        if (this.skipNextPrompt) {
            this.skipNextPrompt = false;
            return true;
        }

        for (let prompt of this.prompts) {
            if (!prompt) continue;
            if (typeof this.prompt == "string") return prompt;

            let value = prompt(location);
            if (value) return value;
        }

        return true;
    }

    onLocationChange = location => {
        if (routingService.customUrlEnabled) return true;
        return this.onPrompt(location);
    }

    componentDidMount() {
        this.subscription = routingService.beforeChangeHandler.subscribe(prompts => {
            if (!Array.isArray(prompts)) {
                this.skipNextPrompt = prompts.skipNext;
            }
            else this.prompts = prompts;
        });

        this.reloadSubscription = fromEvent(window, 'beforeunload').subscribe(e => {
            let shouldBlockNavigation = this.onPrompt(routingService.history.location) === true ? false : true;

            if (shouldBlockNavigation) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    componentWillUnmount() {
        if (this.subscription) this.subscription.unsubscribe();
        if (this.reloadSubscription) this.reloadSubscription.unsubscribe();
    }

    render() {
        return (<Prompt message={this.onLocationChange} />);
    }
}