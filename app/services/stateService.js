import { states } from "../models/imports";

class StateService {
  static states = [];
  static events = [];

  _createState(key) {
    let state = StateService.states.find(x => x.key === key);
    let isNew = state == null;
    state = state || {
      key: key,
      value: {},
      subscriptions: []
    };

    if (isNew) StateService.states.push(state);
    return state;
  }

  getState(key) {
    let state = this._createState(key);

    return {
      value: state.value,
      subscribe: fn => {
        state.subscriptions.push(fn);
        fn(state.value);

        return {
          unsubscribe: () => {
            let index = state.subscriptions.indexOf(fn);
            if (index !== -1) state.subscriptions.splice(index, 1);
          }
        };
      }
    };
  }

  setState(key, value) {
    let state = this._createState(key);

    state.value = { ...state.value, ...value };
    for (let subscription of state.subscriptions) subscription(state.value);
  }

  clearState(key, notify = true, skipKey = null) {
    let clear = state => {
      if (skipKey && state.key !== skipKey) {
        state.value = {};
        if (notify) {
          for (let subscription of state.subscriptions)
            subscription(state.value);
        }
      }
    };
    if (key) {
      let state = this.getState(key);
      clear(state);
      return;
    }

    for (let state of StateService.states) clear(state);
  }

  get global() {
    return this.getState(states.app);
  }

  set global(value) {
    this.setState(states.app, value);
  }

  event(key, model) {
    for (let e of StateService.events) {
      if (e.key !== key) continue;
      e.lastModel = model;

      for (let fn of e.exec) {
        fn(model);
      }
      break;
    }
  }

  onEvent(key, immediateExec) {
    return {
      subscribe: fn => {
        let model = StateService.events.find(x => x.key == key);
        if (!model) {
          model = { key, exec: [], lastModel: undefined };
          StateService.events.push(model);
        }
        model.exec.push(fn);

        if (immediateExec) fn(model.lastModel);

        return {
          unsubscribe: () => {
            let index = model.exec.indexOf(fn);
            if (index !== -1) model.exec.splice(index, 1);

            if (!model.exec.length) {
              index = StateService.events.indexOf(model);
              if (index !== -1) StateService.events.splice(index, 1);
            }
          }
        };
      }
    };
  }
}

export default new StateService();
