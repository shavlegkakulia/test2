import axios from "axios";
import { from } from "rxjs";
import { tap } from "rxjs/operators";

import { CacheService } from "./cacheService";
import routingService from "./routingService";
import stateService from "./stateService";
import {
  stateEvents,
  defaults,
  states,
  verifyStatuses,
} from "../models/imports";

class AuthService extends CacheService {
  //set token and refresh token
  setToken(token, refreshToken) {
    localStorage.setItem("access-token", token);

    if (refreshToken !== undefined) {
      localStorage.setItem("refresh-token", refreshToken);
    }
  }

  //get token
  getToken() {
    return localStorage.getItem("access-token");
  }

  //get refresh token
  getRefreshToken() {
    return localStorage.getItem("refresh-token");
  }

  //remove token and refresh token
  removeToken() {
    localStorage.removeItem("access-token");
    localStorage.removeItem("refresh-token");
  }

  //is authenticated
  isAuthenticated() {
    let token = this.getToken();
    let refreshToken = this.getRefreshToken();

    return token != null || refreshToken != null;
  }

  isActive() {
    let active = false;
    stateService.getState(states.userInfo).subscribe((data) => {
      active = data.userStatus == verifyStatuses.verified;
    });
    return active;
  }

  //register auth interseptors
  //disables when anonymous is passed in config
  registerAuthInterceptor() {
    const setAuthToken = (config) => {
      config.headers = config.headers || {};
      if (!config.headers?.noToken) {
        config.headers["authorization"] = this.getToken();
      }
    };

    const waitForRefresh = (config) => {
      return new Promise((resolve) => {
        let interval = setInterval(() => {
          if (this.refreshStarted) return;

          clearInterval(interval);
          resolve(config);
        }, 500);
      });
    };

    //add auth header
    let requestInterceptor = axios.interceptors.request.use((config) => {
      if (this.isAuthenticated() && !config.anonymous) {
        //if refreshStarted wait
        if (this.refreshStarted && !config.skipRefresh) {
          return waitForRefresh(config).then((config) => {
            if (!this.getToken()) return Promise.reject({ status: 401 });
            setAuthToken(config);
            return Promise.resolve(config);
          });
        }

        setAuthToken(config);
      }
      return config;
    });

    // if unauthorized refetch
    let responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        error.response = error.response || {};

        //Reject promise if usual error
        if (
          (error.response.status !== 401 && error.response.status !== 403) ||
          error.config.anonymous ||
          error.config.skipRefresh
        ) {
          return Promise.reject(error);
        }
        const originalRequest = error.config;
        //if refresh already started wait and retry with new token
        if (this.refreshStarted) {
          return waitForRefresh().then((_) => {
            if (!this.getToken()) return Promise.reject({ status: 401 });
            setAuthToken(originalRequest);
            return axios(originalRequest);
          });
        }

        //refresh token
        this.refreshStarted = true;
        return axios
          .post(
            `${
              globalConfig.api_URL
            }api/private/refreshaccesstoken/${this.getRefreshToken()}`,
            {},
            { anonymous: true }
          )
          .then((response) => {
            let tokenData = response?.data?.data;
            let jsonStr = tokenData?.replace(
              /(\w+:)|(\w+ :)/g,
              function (matchedStr) {
                return (
                  '"' + matchedStr.substring(0, matchedStr.length - 1) + '":'
                );
              }
            );

            let objData = JSON.parse(jsonStr);

            if (!response.data.success || !objData.token) throw response;
            this.setToken(objData.token, objData?.refreshToken);
            this.refreshStarted = false;

            setAuthToken(originalRequest);
            return axios(originalRequest);
          })
          .catch((err) => {
            this.signOut();
            this.refreshStarted = false;

            //redirect to login
            routingService.push(defaults.notAuthRoute);
            return Promise.reject(err);
          });
      }
    );

    return {
      unsubscribe: () => {
        axios.interceptors.request.eject(requestInterceptor);
        axios.interceptors.response.eject(responseInterceptor);
      },
    };
  }

  register(user) {
    let promise = axios.post(
      `${globalConfig.api_URL}api/public/register/`,
      user,
      { objectResponse: true }
    );
    return from(promise);
  }

  verify(hash, type) {
    let promise = axios.get(
      `${globalConfig.api_URL}api/public/authWithHash/${type}/${hash}`,
      { objectResponse: true }
    );
    return from(promise);
  }

  signIn(username, password) {
    let promise = axios.post(
      `${globalConfig.api_URL}api/authenticate`,
      { username: username, password: password },
      { fromLogin: true, objectResponse: true, skipRefresh: true }
    );
    return from(promise);
  }

  userInfo() {
    return this.fromCache(
      "userInfo",
      () => {
        let promise = axios.get(`${globalConfig.api_URL}api/private/userInfo`, {
          objectResponse: true,
        });
        return from(promise);
      },
      0.5
    );
  }

  resetPassword(username, password) {
    let promise = axios.post(
      `${globalConfig.api_URL}api/public/resetPassword`,
      { username, password },
      { objectResponse: true }
    );
    return from(promise);
  }

  signOut(closeWSConnection = true) {
    let fn = () => {
      this.removeToken();
      this.clearCache();
      stateService.event(stateEvents.signOut, closeWSConnection);
    };

    fn();
  }
}

export default new AuthService();
