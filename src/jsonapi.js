import { createAction, handleActions } from 'redux-actions';
import Imm from 'immutable';

import {
  removeEntityFromState,
  updateOrInsertEntitiesIntoState,
  setIsInvalidatingForExistingEntity
} from './state-mutation';
import { apiRequest, noop, jsonContentTypes } from './utils';
import {
  API_SET_AXIOS_CONFIG, API_WILL_CREATE, API_CREATED, API_CREATE_FAILED, API_WILL_READ, API_READ, API_READ_FAILED, API_WILL_UPDATE, API_UPDATED, API_UPDATE_FAILED, API_WILL_DELETE, API_DELETED, API_DELETE_FAILED
} from './constants';

// Entity isInvalidating values
export const IS_DELETING = 'IS_DELETING';
export const IS_UPDATING = 'IS_UPDATING';

// Action creators
export const setAxiosConfig = createAction(API_SET_AXIOS_CONFIG);

const apiWillCreate = createAction(API_WILL_CREATE);
const apiCreated = createAction(API_CREATED);
const apiCreateFailed = createAction(API_CREATE_FAILED);

const apiWillRead = createAction(API_WILL_READ);
const apiRead = createAction(API_READ);
const apiReadFailed = createAction(API_READ_FAILED);

const apiWillUpdate = createAction(API_WILL_UPDATE);
const apiUpdated = createAction(API_UPDATED);
const apiUpdateFailed = createAction(API_UPDATE_FAILED);

const apiWillDelete = createAction(API_WILL_DELETE);
const apiDeleted = createAction(API_DELETED);
const apiDeleteFailed = createAction(API_DELETE_FAILED);

// Actions
export const uploadFile = (file, {
  companyId,
  fileableType: fileableType = null,
  fileableId: fileableId = null
}, {
  onSuccess: onSuccess = noop,
  onError: onError = noop
} = {}) => {
  console.warn('uploadFile has been deprecated and will no longer be supported by redux-json-api https://github.com/dixieio/redux-json-api/issues/2');

  if (onSuccess !== noop || onError !== noop) {
    console.warn('onSuccess/onError callbacks are deprecated. Please use returned promise: https://github.com/dixieio/redux-json-api/issues/17');
  }

  return (dispatch, getState) => {
    const axiosConfig = getState().api.endpoint.axiosConfig;
    const path = [companyId, fileableType, fileableId].filter(o => !!o).join('/');
    const endpoint = `${__API_HOST__}/upload/${path}`;

    const data = new FormData;
    data.append('file', file);

    const options = {
      ...axiosConfig,
      method: 'POST',
      body: data
    };

    return apiRequest(endpoint, options)
      .then((res) => {
        onSuccess(res.data);
        if (res.status >= 200 && res.status < 300) {
          if (jsonContentTypes.some(contentType => res.headers.get('Content-Type').indexOf(contentType) > -1)) {
            return res.data;
          }

          return res;
        }

        const e = new Error(res.statusText);
        e.response = res;
        throw e;
      })
      .catch(error => {
        onError(error);
      });
  };
};

export const createEntity = (entity, {
  onSuccess: onSuccess = noop,
  onError: onError = noop
} = {}) => {
  if (onSuccess !== noop || onError !== noop) {
    console.warn('onSuccess/onError callbacks are deprecated. Please use returned promise: https://github.com/dixieio/redux-json-api/issues/17');
  }

  return (dispatch, getState) => {
    dispatch(apiWillCreate(entity));

    const { axiosConfig } = getState().api.endpoint;
    const endpoint = `${axiosConfig.baseURL}/${entity.type}`;

    const options = {
      ...axiosConfig,
      method: 'POST',
      body: JSON.stringify({ data: entity })
    };

    return new Promise((resolve, reject) => {
      apiRequest(endpoint, options)
        .then(json => {
          dispatch(apiCreated(json.data));
          onSuccess(json);
          resolve(json);
        }).catch(error => {
          const err = error;
          err.entity = entity;

          dispatch(apiCreateFailed(err));
          onError(err);
          reject(err);
        });
    });
  };
};

export const readEndpoint = (endpoint, {
  onSuccess: onSuccess = noop,
  onError: onError = noop
} = {}) => {
  if (onSuccess !== noop || onError !== noop) {
    console.warn('onSuccess/onError callbacks are deprecated. Please use returned promise: https://github.com/dixieio/redux-json-api/issues/17');
  }

  return (dispatch, getState) => {
    dispatch(apiWillRead(endpoint));

    const { axiosConfig } = getState().api.endpoint;
    const apiEndpoint = `${axiosConfig.baseURL}/${endpoint}`;

    return new Promise((resolve, reject) => {
      apiRequest(apiEndpoint, axiosConfig)
        .then(json => {
          dispatch(apiRead({ endpoint, ...json }));
          onSuccess(json);
          resolve(json);
        })
        .catch(error => {
          const err = error;
          err.endpoint = endpoint;

          dispatch(apiReadFailed(err));
          onError(err);
          reject(err);
        });
    });
  };
};

export const updateEntity = (entity, {
  onSuccess: onSuccess = noop,
  onError: onError = noop
} = {}) => {
  if (onSuccess !== noop || onError !== noop) {
    console.warn('onSuccess/onError callbacks are deprecated. Please use returned promise: https://github.com/dixieio/redux-json-api/issues/17');
  }

  return (dispatch, getState) => {
    dispatch(apiWillUpdate(entity));

    const { axiosConfig } = getState().api.endpoint;
    const endpoint = `${axiosConfig.baseURL}/${entity.id}`;

    return new Promise((resolve, reject) => {
      apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
          data: entity
        })
      }).then(json => {
        dispatch(apiUpdated(json.data));
        onSuccess(json);
        resolve(json);
      }).catch(error => {
        const err = error;
        err.entity = entity;

        dispatch(apiUpdateFailed(err));
        onError(err);
        reject(err);
      });
    });
  };
};

export const deleteEntity = (entity, {
  onSuccess: onSuccess = noop,
  onError: onError = noop
} = {}) => {
  if (onSuccess !== noop || onError !== noop) {
    console.warn('onSuccess/onError callbacks are deprecated. Please use returned promise: https://github.com/dixieio/redux-json-api/issues/17');
  }

  return (dispatch, getState) => {
    dispatch(apiWillDelete(entity));

    const { axiosConfig } = getState().api.endpoint;
    const endpoint = `${axiosConfig.baseURL}/${entity.type}/${entity.id}`;

    return new Promise((resolve, reject) => {
      apiRequest(endpoint, {
        method: 'DELETE'
      }).then(() => {
        dispatch(apiDeleted(entity));
        onSuccess();
        resolve();
      }).catch(error => {
        const err = error;
        err.entity = entity;

        dispatch(apiDeleteFailed(err));
        onError(err);
        reject(err);
      });
    });
  };
};

export const requireEntity = (entityType, endpoint = entityType, {
  onSuccess: onSuccess = noop,
  onError: onError = noop
} = {}) => {
  if (onSuccess !== noop || onError !== noop) {
    console.warn('onSuccess/onError callbacks are deprecated. Please use returned promise: https://github.com/dixieio/redux-json-api/issues/17');
  }

  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      const { api } = getState();
      if (api.hasOwnProperty(entityType)) {
        resolve();
        return onSuccess();
      }

      dispatch(readEndpoint(endpoint, { onSuccess, onError }))
        .then(resolve)
        .catch(reject);
    });
  };
};

// Reducers
export const reducer = handleActions({

  [API_SET_AXIOS_CONFIG]: (state, { payload: axiosConfig }) => {
    return Imm.fromJS(state).setIn(['endpoint', 'axiosConfig'], axiosConfig).toJS();
  },

  [API_WILL_CREATE]: (state) => {
    return Imm.fromJS(state).update('isCreating', v => v + 1).toJS();
  },

  [API_CREATED]: (rawState, { payload: rawEntities }) => {
    const state = Imm.fromJS(rawState);
    const entities = Imm.fromJS(
      Array.isArray(rawEntities) ? rawEntities : [rawEntities]
    );

    return updateOrInsertEntitiesIntoState(state, entities)
      .update('isCreating', v => v - 1)
      .toJS();
  },

  [API_CREATE_FAILED]: (state) => {
    return Imm.fromJS(state).update('isCreating', v => v - 1).toJS();
  },

  [API_WILL_READ]: (state) => {
    return Imm.fromJS(state).update('isReading', v => v + 1).toJS();
  },

  [API_READ]: (rawState, { payload }) => {
    const state = Imm.fromJS(rawState);
    const entities = Imm.fromJS(
      Array.isArray(payload.data) ? payload.data : [payload.data]
    ).concat(Imm.fromJS(payload.included || []));

    return updateOrInsertEntitiesIntoState(state, entities)
      .update('isReading', v => v - 1)
      .toJS();
  },

  [API_READ_FAILED]: (state) => {
    return Imm.fromJS(state).update('isReading', v => v - 1).toJS();
  },

  [API_WILL_UPDATE]: (rawState, { payload: entity }) => {
    const { type, id } = entity;
    const state = Imm.fromJS(rawState);

    return setIsInvalidatingForExistingEntity(state, { type, id }, IS_UPDATING)
      .update('isUpdating', v => v + 1)
      .toJS();
  },

  [API_UPDATED]: (rawState, { payload: rawEntities }) => {
    const state = Imm.fromJS(rawState);
    const entities = Imm.fromJS(
      Array.isArray(rawEntities) ? rawEntities : [rawEntities]
    );

    return updateOrInsertEntitiesIntoState(state, entities)
      .update('isUpdating', v => v - 1)
      .toJS();
  },

  [API_UPDATE_FAILED]: (rawState, { payload: { entity } }) => {
    const { type, id } = entity;
    const state = Imm.fromJS(rawState);

    return setIsInvalidatingForExistingEntity(state, { type, id }, IS_UPDATING)
      .update('isUpdating', v => v - 1)
      .toJS();
  },

  [API_WILL_DELETE]: (rawState, { payload: entity }) => {
    const { type, id } = entity;
    const state = Imm.fromJS(rawState);

    return setIsInvalidatingForExistingEntity(state, { type, id }, IS_DELETING)
      .update('isDeleting', v => v + 1)
      .toJS();
  },

  [API_DELETED]: (rawState, { payload: rawEntity }) => {
    const state = Imm.fromJS(rawState);
    const entity = Imm.fromJS(rawEntity);

    return removeEntityFromState(state, entity)
      .update('isDeleting', v => v - 1)
      .toJS();
  },

  [API_DELETE_FAILED]: (rawState, { payload: { entity } }) => {
    const { type, id } = entity;
    const state = Imm.fromJS(rawState);

    return setIsInvalidatingForExistingEntity(state, { type, id }, IS_DELETING)
      .update('isDeleting', v => v - 1)
      .toJS();
  }

}, {
  isCreating: 0,
  isReading: 0,
  isUpdating: 0,
  isDeleting: 0,
  endpoint: {
    host: null,
    path: null,
    axiosConfig: {}
  }
});
