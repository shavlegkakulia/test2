import axios from 'axios';
import { from } from 'rxjs';


class MediaService {
    uploadFile(file, mail) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mail', new Blob([mail], { type: 'application/json' }));

        let promise = axios.post(`${globalConfig.api_URL}api/public/freedocumentvalidation`, formData, {
            objectResponse: true,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return from(promise);
    }

    privateUploadFile(file, docLink, workSpaceId, withSignature = false, signParameter = undefined) {
        const formData = new FormData();
        console.log(`signParameter: ${JSON.stringify(signParameter)}`)
        file && formData.append('file', file);
        docLink && formData.append('doclink', new Blob([docLink], { type: 'application/json' }));
        formData.append('workspaceId', new Blob([workSpaceId], { type: 'application/json' }));
        signParameter && formData.append('signParameter', new Blob([JSON.stringify(signParameter)], { type: 'application/json' }));
        withSignature && formData.append('withSignature', new Blob([withSignature], { type: 'application/json' }));

        let promise = axios.post(`${globalConfig.api_URL}api/private/validatedocument`, formData, {
            objectResponse: true,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return from(promise);
    }

    shareDocument(mail, docId) {
        let promise = axios.post(`${globalConfig.api_URL}api/private/sharedocument/${mail}/${docId}`, {}, { objectResponse: true });
        return from(promise);
    }

    uploadFacsimileFile(file) {
        const formData = new FormData();
        formData.append('file', new Blob([file], { type: 'application/json' }));

        let promise = axios.post(`${globalConfig.api_URL}api/private/uploadfacsimile`, formData, {
            objectResponse: true,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return from(promise);
    }
}

export default new MediaService();