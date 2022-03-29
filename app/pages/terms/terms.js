import React, { useEffect } from 'react';
import { stateEvents } from '../../models/states';
import { translateService, stateService } from "../../services/imports";
import ViewTermsKa from './withlangs/ka';
import ViewTermsEn from './withlangs/en';

const TermsPage = (props) => {

    let goBack = () => {
        stateService.event(stateEvents.openModalPage, null);
    }

    useEffect(() => {
        stateService.event(stateEvents.scrollUp);
        
        return () => {
            stateService.event(stateEvents.scrollUp);
        }
    }, [])

    return (
        <div className={`terms container ${!props?.display? 'd-none' : ''}`}>
            <div className="page-header">
                <span className="clickable" onClick={goBack}>
                    <img src="../../assets/images/close32.svg" />
                </span>
            </div>

            <div className="row-container">
                <div className="form">
                    <div className="title">{translateService.t("terms.pageTtitle")}</div>
                </div>
                {translateService.key === 'ka' &&
                <ViewTermsKa />}
                {translateService.key === 'en' &&
                <ViewTermsEn />}
            </div>
        </div>
    )
}

export default TermsPage;