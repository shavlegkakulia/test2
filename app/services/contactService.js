import axios from 'axios';
import { from } from 'rxjs';

class ContactService {
    sendSystemEmail = (data) => {
        let mail = {
            key: data.email,
            value: data.text
        }
        let promise = axios.post(`${globalConfig.api_URL}api/public/sendsystemmail`, mail, { objectResponse: true });
        return from (promise);
    }
}

export default new ContactService();