import React from 'react';

import { translateService, stateService, routingService } from '../services/imports'
import { stateEvents } from "./../models/states";

export default class PageFooter extends React.Component {
    constructor() {
        super();

        this.state = {
            showSelf: true
        }
    }

    toggleSelf = () => {
        this.setState({ showSelf: !this.state.showSelf })
    }

    openModalPage = (type) => {
        stateService.event(stateEvents.openModalPage, type);
    }

    render() {
        return (
            <footer className={`footer ${translateService.key}`}>
                <div className='footer-menu'>
                    <div><a className="clickable" onClick={() => this.openModalPage(routingService.routeNames.terms)}>{translateService.t('common.terms')}</a></div>
                    <div><a className="clickable" onClick={() => this.openModalPage(routingService.routeNames.contact)}>{translateService.t('common.contact')}</a></div>
                    <div className="soc"><a className="clickable" href="https://www.facebook.com/aisitec.ge" target="blank" ><img src="../../assets/images/facebook.png" /></a></div>
                    <div><a className="clickable" href="https://www.linkedin.com/company/aisitec" target="blank" ><img src="../../assets/images/linkedin.png" /></a></div>
                </div>
                <div className="copyright-lay">
                    <p className='copyright'>{translateService.t('common.copyright').replace("{data}", new Date().getFullYear())}</p>
                </div>
                {
                    !this.state.showSelf ?
                        <div className="side-self for-mobile-flex" onClick={this.toggleSelf}>
                            <img src="../../assets/images/left-white-arrow.svg" />
                        </div> :
                        <div className="self-content for-mobile-flex">
                            <img src="../../assets/images/close32white.svg" className="clickable close" onClick={this.toggleSelf} />
                            <span className="desc">
                                {translateService.t("common.selfText")}
                                {/* <a href="https://www.youtube.com/watch?v=ymr7JQupPvw" target="_blank">
                                    <span>{translateService.t("common.instructions")}</span> <img src="../../assets/images/youtube-ico.svg" className="clickable link"  />
                                </a> */}
                                <a href={`${translateService.t("common.link-1")}`} target="_blank">
                                    <span>{translateService.t("common.whithisplat")}</span> 
                                    {/* <img src="../../assets/images/youtube-ico.svg" className="clickable link"  /> */}
                                </a>
                            </span>
                        </div>
                }
            </footer>
        )
    }
}