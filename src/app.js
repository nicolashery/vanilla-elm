// HELPERS
// ==============================================

export const ERRORS = {
  required: 'required',
  invalidEmail: 'invalidEmail'
};

function runValidators(validators, value) {
  return validators.reduce((error, validator) => {
    if (error) {
      return error;
    } else {
      return validator(value);
    }
  }, null);
}

function validateRequired(value) {
  if (value.trim().length) {
    return null;
  } else {
    return ERRORS.required;
  }
}

function validateEmail(value) {
  if (/(.+)@(.+){2,}\.(.+){2,}/.test(value)) {
    return null;
  } else {
    return ERRORS.invalidEmail;
  }
}

// DOM element cache
export const ElementCache = {
  create: function(initialCache) {
    return initialCache || {};
  },

  put: function(cache, key, el) {
    cache[key] = el;
    return cache;
  },

  get: function(cache, key) {
    const el = cache[key];
    if (!el) {
      throw new Error(`Could not find element '${key}'`);
    }
    return el;
  }
};

// Fake Api client
export const Api = {
  create: function(apiKey) {
    return { apiKey: apiKey };
  },

  login(api, data, cb) {
    setTimeout(() => {
      if (!(data.email === 'mary@example.com' && data.password === '1234')) {
        return cb({ error: 'Invalid email or password' });
      } else {
        return cb();
      }
    }, 1000);
  }
};

// ACTIONS
// ==============================================

const CHANGE_EMAIL = 'CHANGE_EMAIL';
const CHANGE_PASSWORD = 'CHANGE_PASSWORD';
const SUBMIT_FORM = 'SUBMIT_FORM';
const LOGIN_FAILED = 'LOGIN_FAILED';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';

function changeEmail(value) {
  return { type: CHANGE_EMAIL, value };
}

function changePassword(value) {
  return { type: CHANGE_PASSWORD, value };
}

function submitForm(email, password) {
  return { type: SUBMIT_FORM, email, password };
}

function loginFailed() {
  return { type: LOGIN_FAILED };
}

function loginSuccess() {
  return { type: LOGIN_SUCCESS };
}

export const ACTIONS = {
  changeEmail,
  changePassword,
  submitForm,
  loginFailed,
  loginSuccess
};

// UPDATE FUNCTION
// ==============================================

export const init = {
  state: {
    inputs: {
      email: {
        value: '',
        error: ERRORS.required,
        touched: false
      },
      password: {
        value: '',
        error: ERRORS.required,
        touched: false
      }
    },
    isSubmitted: false,
    isLoading: false,
    isLoginFailed: false,
    isLoginSuccess: false
  },
  effects: [attachInitialEventListeners]
};

export function update(state, action) {
  switch (action.type) {

    case CHANGE_EMAIL:
      return applyChangeEmail(state, action);

    case CHANGE_PASSWORD:
      return applyChangePassword(state, action);

    case SUBMIT_FORM:
      return applySubmitForm(state, action);

    case LOGIN_SUCCESS:
      return applyLoginSuccess(state, action);

    case LOGIN_FAILED:
      return applyLoginFailed(state, action);

    default:
      return { state: state, effects: [] };
  }
}

function applyChangeEmail(state, action) {
  const inputs = Object.assign({}, state.inputs, {
    email: {
      value: action.value,
      error: runValidators([validateRequired, validateEmail], action.value),
      touched: true
    }
  });

  let effects = [];
  if (state.inputs.email.error !== inputs.email.error ||
      state.inputs.email.touched !== inputs.email.touched) {
    effects.push(updateValidationClasses);
  }

  const new_state = Object.assign({}, state, {
    inputs: inputs
  });

  return {
    state: new_state,
    effects: effects
  };
}

function applyChangePassword(state, action) {
  const inputs = Object.assign({}, state.inputs, {
    password: {
      value: action.value,
      error: validateRequired(action.value),
      touched: true
    }
  });

  let effects = [];
  if (state.inputs.password.error !== inputs.password.error) {
    effects.push(updateValidationClasses);
  }

  const new_state = Object.assign({}, state, {
    inputs: inputs
  });

  return {
    state: new_state,
    effects: effects
  };
}

function applySubmitForm(state, action) {
  const inputs = Object.assign({}, state.inputs, {
    email: {
      value: action.email,
      error: runValidators([validateRequired, validateEmail], action.email),
      touched: state.inputs.email.touched
    },
    password: {
      value: action.password,
      error: validateRequired(action.password),
      touched: state.inputs.password.touched
    }
  });

  let effects = [updateValidationClasses];

  if (!(inputs.email.error || inputs.password.error)) {
    effects.push(login);
    effects.push(updateFormClasses);
  }

  const new_state = Object.assign({}, state, {
    inputs: inputs,
    isSubmitted: true,
    isLoading: true,
    isLoginFailed: false,
    isLoginSuccess: false
  });

  return {
    state: new_state,
    effects: effects
  };
}

function applyLoginSuccess(state) {
  const effects = [updateFormClasses];

  const new_state = Object.assign({}, state, {
    isLoading: false,
    isLoginSuccess: true
  });

  return {
    state: new_state,
    effects: effects
  };
}

function applyLoginFailed(state) {
  const effects = [updateFormClasses];

  const new_state = Object.assign({}, state, {
    isLoading: false,
    isLoginFailed: true
  });

  return {
    state: new_state,
    effects: effects
  };
}

// SIDE EFFECTS
// ==============================================

export const ELS = {
  form: '#form',
  email: '#email',
  emailGroup: '#email-group',
  password: '#password',
  passwordGroup: '#password-group',
  submit: '#submit'
};

function attachInitialEventListeners(dispatch, getState, getContext) {
  const { $els } = getContext();

  ElementCache.get($els, ELS.email).on('change', (e) => {
    dispatch(changeEmail(e.target.value));
  });

  ElementCache.get($els, ELS.password).on('change', (e) => {
    dispatch(changePassword(e.target.value));
  });

  ElementCache.get($els, ELS.form).on('submit', (e) => {
    e.preventDefault();
    const email = ElementCache.get($els, ELS.email).val();
    const password = ElementCache.get($els, ELS.password).val();
    dispatch(submitForm(email, password));
  });
}

function updateValidationClasses(dispatch, getState, getContext) {
  const { inputs, isSubmitted } = getState();
  const { $els } = getContext();

  const shouldShowEmailError = (isSubmitted || inputs.email.touched);
  if (shouldShowEmailError && inputs.email.error === ERRORS.required) {
    ElementCache.get($els, ELS.emailGroup).addClass('has-error has-error-required');
    ElementCache.get($els, ELS.emailGroup).removeClass('has-error-invalid-email');
  } else if (shouldShowEmailError && inputs.email.error === ERRORS.invalidEmail) {
    ElementCache.get($els, ELS.emailGroup).addClass('has-error has-error-invalid-email');
    ElementCache.get($els, ELS.emailGroup).removeClass('has-error-required');
  } else if (!inputs.email.error) {
    ElementCache.get($els, ELS.emailGroup).removeClass('has-error');
    ElementCache.get($els, ELS.emailGroup).removeClass('has-error-required');
    ElementCache.get($els, ELS.emailGroup).removeClass('has-error-invalid-email');
  }

  const shouldShowPasswordError = (isSubmitted || inputs.password.touched);
  if (shouldShowPasswordError && inputs.password.error === ERRORS.required) {
    ElementCache.get($els, ELS.passwordGroup).addClass('has-error has-error-required');
  } else if (!inputs.password.error) {
    ElementCache.get($els, ELS.passwordGroup).removeClass('has-error');
    ElementCache.get($els, ELS.passwordGroup).removeClass('has-error-required');
  }
}

function updateFormClasses(dispatch, getState, getContext) {
  const { isLoading, isLoginSuccess, isLoginFailed } = getState();
  const { $els } = getContext();

  if (isLoading) {
    ElementCache.get($els, ELS.submit).attr('disabled', true);
    const text = ElementCache.get($els, ELS.submit).attr('data-loading-text');
    ElementCache.get($els, ELS.submit).text(text);
  } else {
    ElementCache.get($els, ELS.submit).attr('disabled', null);
    const text = ElementCache.get($els, ELS.submit).attr('data-text');
    ElementCache.get($els, ELS.submit).text(text);
  }

  if (isLoginSuccess) {
    ElementCache.get($els, ELS.form).addClass('login-success');
  } else {
    ElementCache.get($els, ELS.form).removeClass('login-success');
  }

  if (isLoginFailed) {
    ElementCache.get($els, ELS.form).addClass('login-failed');
  } else {
    ElementCache.get($els, ELS.form).removeClass('login-failed');
  }
}

function login(dispatch, getState, getContext) {
  const { email, password } = getState();
  const { api } = getContext();

  Api.login(api, { email, password }, (err) => {
    if (err) {
      return dispatch(loginFailed());
    } else {
      return dispatch(loginSuccess());
    }
  });
}

export const EFFECTS = {
  attachInitialEventListeners,
  updateValidationClasses,
  updateFormClasses,
  login
};

// LIB
// ==============================================

// Adapted from Redux, adding side effects
export function createApp(update, init, context, options = {}) {
  if (typeof init === 'undefined') {
    init = { state: {}, effects: [] };
  }

  if (typeof context === 'undefined') {
    context = {};
  }

  var currentState = init.state;
  var isDispatching = false;

  function getState() {
    return currentState;
  }

  function getContext() {
    return context;
  }

  function dispatch(action) {
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
        'Have you misspelled a constant?'
      );
    }

    if (isDispatching) {
      throw new Error('An "update" function may not dispatch actions.');
    }

    try {
      isDispatching = true;
      var result = update(currentState, action);
      currentState = result.state;
      runEffects(result.effects);
    } finally {
      isDispatching = false;
    }

    return action;
  }

  let runEffects = function runEffects(effects) {
    effects.forEach(eff => eff(dispatch, getState, getContext));
  };
  if (options.mockRunEffects) {
    runEffects = options.mockRunEffects;
  }

  function start() {
    runEffects(init.effects);
  }

  return {
    dispatch,
    getState,
    getContext,
    start
  };
}
