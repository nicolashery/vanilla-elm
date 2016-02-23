// HELPERS
// ==============================================

const ERRORS = {
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
  if( /(.+)@(.+){2,}\.(.+){2,}/.test(value) ){
    return null;
  } else {
    return ERRORS.invalidEmail;
  }
}

// Fake Ajax call
const Ajax = {
  post(url, data, cb) {
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

const INIT = 'INIT';
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

// REDUCERS
// ==============================================

const initialState = {
  $els: {},
  email: '',
  password: '',
  errors: {
    email: ERRORS.required,
    password: ERRORS.invalidEmail
  },
  isLoading: false,
  isLoginFailed: false,
  isLoginSuccess: false
};

function reducer(state = initialState, action) {
  switch (action.type) {

    case INIT:
      action.sideEffect(attachInitialEventListeners);
      return Object.assign({}, state, { $els: action.$els });

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
      return state;
  }
}

function applyChangeEmail(state, action) {
  const email = action.value;
  const errors = Object.assign({}, state.errors, {
    email: runValidators([validateRequired, validateEmail], email)
  });

  if (state.errors.email !== errors.email) {
    action.sideEffect(updateValidationClasses);
  }

  return Object.assign({}, state, {
    email: email,
    errors: errors
  });
}

function applyChangePassword(state, action) {
  const password = action.value;
  const errors = Object.assign({}, state.errors, {
    password: validateRequired(password)
  });

  if (state.errors.password !== errors.password) {
    action.sideEffect(updateValidationClasses);
  }

  return Object.assign({}, state, {
    password: password,
    errors: errors
  });
}

function applySubmitForm(state, action) {
  const email = action.email;
  const password = action.password;
  const errors = {
    email: runValidators([validateRequired, validateEmail], email),
    password: validateRequired(password)
  };

  if (state.errors.email !== errors.email ||
      state.errors.password !== errors.password) {
    action.sideEffect(updateValidationClasses);
  }

  if (!(errors.email || errors.password)) {
    action.sideEffect(login);
  }

  action.sideEffect(updateFormClasses);

  return Object.assign({}, state, {
    email: email,
    password: password,
    errors: errors,
    isLoading: true,
    isLoginFailed: false,
    isLoginSuccess: false
  });
}

function applyLoginSuccess(state, action) {
  action.sideEffect(updateFormClasses);

  return Object.assign({}, state, {
    isLoading: false,
    isLoginSuccess: true
  });
}

function applyLoginFailed(state, action) {
  action.sideEffect(updateFormClasses);

  return Object.assign({}, state, {
    isLoading: false,
    isLoginFailed: true
  });
}

// SIDE EFFECTS
// ==============================================

function attachInitialEventListeners(dispatch, getState) {
  const { $els } = getState();

  $els.email.on('change', (e) => {
    dispatch(changeEmail(e.target.value));
  });

  $els.password.on('change', (e) => {
    dispatch(changePassword(e.target.value));
  });

  $els.form.on('submit', (e) => {
    e.preventDefault();
    const email = $els.email.val();
    const password = $els.password.val();
    dispatch(submitForm(email, password));
  });
}

function updateValidationClasses(dispatch, getState) {
  const { $els, errors } = getState();

  if (errors.email === ERRORS.required) {
    $els.emailGroup.addClass('has-error has-error-required');
  } else if (errors.email === ERRORS.invalidEmail) {
    $els.emailGroup.addClass('has-error has-error-invalid-email');
  } else if (!errors.email) {
    $els.emailGroup.removeClass('has-error');
    $els.emailGroup.removeClass('has-error-required');
    $els.emailGroup.removeClass('has-error-invalid-email');
  }

  if (errors.password === ERRORS.required) {
    $els.passwordGroup.addClass('has-error has-error-required');
  } else if (!errors.password) {
    $els.passwordGroup.removeClass('has-error');
    $els.passwordGroup.removeClass('has-error-required');
  }
}

function updateFormClasses(dispatch, getState) {
  const { $els, isLoading, isLoginSuccess, isLoginFailed } = getState();

  if (isLoading) {
    $els.submit.attr('disabled', true);
    $els.submit.text($els.submit.attr('data-loading-text'));
  } else {
    $els.submit.attr('disabled', null);
    $els.submit.text($els.submit.attr('data-text'));
  }

  if (isLoginSuccess) {
    $els.form.addClass('login-success');
  } else {
    $els.form.removeClass('login-success');
  }

  if (isLoginFailed) {
    $els.form.addClass('login-failed');
  } else {
    $els.form.removeClass('login-failed');
  }
}

function login(dispatch, getState) {
  const { email, password } = getState();

  Ajax.post('/login', { email, password }, (err) => {
    if (err) {
      return dispatch({ type: LOGIN_FAILED });
    } else {
      return dispatch({ type: LOGIN_SUCCESS });
    }
  });
}

// SETUP
// ==============================================

const logger = store => next => action => {
  console.log('dispatching', action);
  let result = next(action);
  console.log('next state', store.getState());
  return result;
};

const store = Redux.createStore(
  reducer,
  Redux.applyMiddleware(logger, actionSideEffectMiddleware)
);

const $els = {
  form: $('#form'),
  email: $('#email'),
  emailGroup: $('#email-group'),
  password: $('#password'),
  passwordGroup: $('#password-group'),
  submit: $('#submit')
};

store.dispatch({ type: INIT, $els: $els });

window.$els = $els;
window.store = store;

// LIBS
// ==============================================

// Inspired by: https://github.com/gregwebs/redux-side-effect

function makeSideEffectCollector(sideEffects) {
  return function sideEffect(...effects) {
    for (var i in effects){
      sideEffects.push(effects[i]);
    }
  };
}

function makeSideEffectTimeout(sideEffect) {
  return function sideEffectTimeout(timeout, ...effects) {
    return sideEffect(effects.map(eff => (dispatch, getState) => {
      setTimeout(eff(dispatch, getState), timeout);
    }));
  };
}

function makeDrainSideEffects(sideEffects, dispatch, getState) {
  return function drainSideEffects(){
    while (sideEffects.length > 0){
      sideEffects.shift()(dispatch, getState);
    }
  };
}

function actionSideEffectMiddleware({ dispatch, getState }) {
  const sideEffects = [];
  const sideEffect = makeSideEffectCollector(sideEffects);
  const sideEffectTimeout = makeSideEffectTimeout(sideEffect);
  const drainSideEffects = makeDrainSideEffects(sideEffects, dispatch, getState);
  return next => action => {
    console.log('actionSideEffectMiddleware', action);
    action.sideEffect = sideEffect;
    action.sideEffectTimeout = sideEffectTimeout;
    let result = next(action);
    drainSideEffects();
    return result;
  };
}
