import React, { useEffect, useState } from 'react';
import { translateService, stateService, billingService, htmlHelperService, authService } from "../../services/imports";
import {
    LoadingButton
} from "../../components/formcontrols/imports";
import PaymentDetailsPage from '../payment-details/payment-details';
import { Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { stateEvents } from '../../models/imports';
import PackageInfo from '../package-info/package-info';

const PackagesPage = () => {
    const [packages, setPackages] = useState([]);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [modal, showMoadal] = useState(false);

    let goBack = () => {
      stateService.event(stateEvents.openModalPage, null);
    }

    let viewPackage = (id) => {
        if(authService.isAuthenticated())
            setPaymentDetails(id);
        else showMoadal(true);
    }

    let copyText = (text) => {
        htmlHelperService.copyToClipboard(text);
    }

    let closeModal = () => {
        setPaymentDetails(null);
    }
    
    useEffect(() => {
        billingService.getBillingPackages().subscribe(res => {
            setPackages(res.data);
        });
    }, [])

    if(authService.isActive())
    return (<PackageInfo display={true} shouldReload={true} />)

    return (
        <React.Fragment>
        {paymentDetails ? <PaymentDetailsPage packageId={paymentDetails} onCloseModal={closeModal} /> :
        <div className={`packages container ${translateService.key}`} >
            <div className="page-header">
                <span className="clickable" onClick={goBack}>
                    <img src="../../assets/images/close32.svg" />
                </span>
            </div>
            <div className="packages-items" >
                <span className="title">
                    {translateService.t("packages.pageTitle")}
                </span>

                <div className="items">
                    {packages.map((p, index) => (
                    <div className="item" key={p.id}>
                        <div className="content" >
                            <img className="packageLogo" src={`../../assets/images/pack-${index+1}.svg`} />
                            <div className="name">{p.key}</div>
                            <div className="dots"></div>
                            <div className="description _3dots-3 h-auto" title={p.description}>{p.description}</div>
                            <div className="amount">{p.value}</div>
                            {/* <div className="details clickable">{translateService.t("packages.details")}</div> */}
                        </div>
                        <div className="buttons" >
                            <LoadingButton 
                                onClick={() => viewPackage(p.id)}
                                className="button background-color-two color-white"
                            >
                                {translateService.t(`packages.buy`)}
                            </LoadingButton>
                        </div>
                    </div>))}

                    <div className="item" >
                        <div className="content" >
                            <div className="package-title">{translateService.t("common.transferToBank")}</div>
                            <div className="name"></div>
                            <div className="dots"></div>
                            <span className="package-acc">{translateService.t("common.accountNumber")}</span>
                            <span className="package-desc" >GE123TB123456789456123</span>
                            <span className="package-acc">{translateService.t("common.nomination")}</span>
                        </div>
                        <div className="buttons" >
                            <LoadingButton
                                 onClick={() => copyText('GE123TB123456789456123')}
                                className="button background-color-one color-white"
                            >
                                {translateService.t(`packages.copyAccountNumber`)}
                            </LoadingButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>}
        <Modal
          isOpen={modal}
          fade={false}
          toggle={e => {
            showMoadal(false);
          }}
        >
          <ModalHeader>
            <span>
              &nbsp;
              <span
                onClick={() => showMoadal(false)}
                className="clickable"
              >
                <img src="../../assets/images/close32.svg" />
              </span>
            </span>
          </ModalHeader>
          <ModalBody>
            <div className="additional color-three">
              <img src="../../assets/images/modal-error.svg" />
              <div className="title">
                {translateService.t("signing.mustRegisterOrLogin")}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>

            <LoadingButton type="button"
              className="button background-color-three color-white"
              onClick={() => showMoadal(false)}
            >
              {translateService.t(`common.ok`)}
            </LoadingButton>

          </ModalFooter>
        </Modal>
        </React.Fragment>
    );
}

export default PackagesPage;