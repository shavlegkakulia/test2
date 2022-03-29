import axios from 'axios';
import { from } from 'rxjs';

class PaymentService {
    authorizePaypal = (data) => {
        let promise = axios.post(`${globalConfig.api_URL}billing/authorizePaypal`, data, { objectResponse: true });
        return from (promise);
    }

    executePaypal = (data) => {
        let promise = axios.post(`${globalConfig.api_URL}billing/executePaypal`, {}, { objectResponse: true });
        return from(promise);
    }
}

export default new PaymentService();