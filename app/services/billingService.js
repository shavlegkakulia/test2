import axios from 'axios';
import { from } from 'rxjs';

class BillingService {
    getBillingPackages = () => {
        let promise = axios.get(`${globalConfig.api_URL}api/public/billingPackages`, { objectResponse: true });
        return from(promise);
    }

    getUserBillingPackages = (value) => {
        let promise = axios.get(`${globalConfig.api_URL}api/private/userbillingpackinfo/${value }`, { objectResponse: true });
        return from(promise);
    }

    getUserPaymenmtInfo = (user) => {
        let promise = axios.get(`${globalConfig.api_URL}api/private/userPaymentInfo`, { objectResponse: true });
        return from(promise);
    }

    changePaymentInfo = (card) => {
        let promise = axios.post(`${globalConfig.api_URL}api/private/changePayment`, {card}, { objectResponse: true });
        return from(promise);
    }

    /* BOG billing */

    authorizeBOG = (data) => {
        let promise = axios.post(`${globalConfig.api_URL}payment/authorizebog`, data, { objectResponse: true });
        return from(promise);
    }
}

export default new BillingService();