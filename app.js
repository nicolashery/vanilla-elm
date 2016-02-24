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
  if (/(.+)@(.+){2,}\.(.+){2,}/.test(value)) {
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

// UPDATE FUNCTION
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

function update(state = initialState, action) {
  switch (action.type) {

    case INIT:
      return {
        state: Object.assign({}, state, { $els: action.$els }),
        effects: [attachInitialEventListeners]
      };

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
  const email = action.value;
  const errors = Object.assign({}, state.errors, {
    email: runValidators([validateRequired, validateEmail], email)
  });

  let effects = [];
  if (state.errors.email !== errors.email) {
    effects.push(updateValidationClasses);
  }

  const new_state = Object.assign({}, state, {
    email: email,
    errors: errors
  });

  return {
    state: new_state,
    effects: effects
  };
}

function applyChangePassword(state, action) {
  const password = action.value;
  const errors = Object.assign({}, state.errors, {
    password: validateRequired(password)
  });

  let effects = [];
  if (state.errors.password !== errors.password) {
    effects.push(updateValidationClasses);
  }

  const new_state = Object.assign({}, state, {
    password: password,
    errors: errors
  });

  return {
    state: new_state,
    effects: effects
  };
}

function applySubmitForm(state, action) {
  const email = action.email;
  const password = action.password;
  const errors = {
    email: runValidators([validateRequired, validateEmail], email),
    password: validateRequired(password)
  };

  let effects = [];

  if (state.errors.email !== errors.email ||
      state.errors.password !== errors.password) {
    effects.push(updateValidationClasses);
  }

  if (!(errors.email || errors.password)) {
    effects.push(login);
  }

  effects.push(updateFormClasses);

  const new_state = Object.assign({}, state, {
    email: email,
    password: password,
    errors: errors,
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

const app = createApp(update);

const $els = {
  form: $('#form'),
  email: $('#email'),
  emailGroup: $('#email-group'),
  password: $('#password'),
  passwordGroup: $('#password-group'),
  submit: $('#submit')
};

app.dispatch({ type: INIT, $els: $els });

// LIB
// ==============================================

// Adapted from Redux, adding side effects
function createApp(update, init) {
  if (typeof init === 'undefined') {
    init = { state: undefined, effects: [] };
  }

  var currentState = init.state;
  var isDispatching = false;

  function getState() {
    return currentState;
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

  function runEffects(effects) {
    effects.forEach(eff => eff(dispatch, getState));
  }

  runEffects(init.effects);
  dispatch({ type: '__INIT__' });

  return {
    dispatch,
    getState,
    runEffects
  };
}
