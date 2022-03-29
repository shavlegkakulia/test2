import axios from 'axios';
import { from } from 'rxjs';


class WorkSpaceService {
    getWorkSpaces = () => {
        let promise = axios.get(`${globalConfig.api_URL}api/private/userworkspaces`, { objectResponse: true });
        return from(promise);
    }

    getDocumentList = (workSpaceId, timeStamp) => {
        let promise = axios.get(`${globalConfig.api_URL}api/private/listvalidateddocs/${workSpaceId || 0}/${timeStamp || 0}`, { objectResponse: true });
        return from(promise);
    }

    getDocumentResult = (docId) => {
        let promise = axios.get(`${globalConfig.api_URL}api/private/getvalidateddocresult/${docId}`, { objectResponse: true });
        return from(promise);
    }

    deleteDocument = (docId) => {
        let promise = axios.delete(`${globalConfig.api_URL}api/private/deletedocument/${docId}`, { objectResponse: true });
        return from(promise);
    }

    addUserToWorkSpace = (workSpaceId, mail) => {
        let promise = axios.post(`${globalConfig.api_URL}api/private/addusertoworkspace/`, {id: workSpaceId, value: mail}, { objectResponse: true });
        return from(promise);
    }

    deleteUserFromWorkSpace = (userID, workspaceID) => {
        let promise = axios.delete(`${globalConfig.api_URL}api/private/deleteuserfromworkspace/${userID}/${workspaceID}`, { objectResponse: true });
        return from(promise);
    }

    changedocheader = (docId, value) => {
        let promise = axios.post(`${globalConfig.api_URL}api/private/changedocheader/`, {id: docId, value: value}, { objectResponse: true });
        return from(promise);
    }
}

export default new WorkSpaceService();