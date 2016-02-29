import {
  createApp,
  init,
  update,
  ACTIONS,
  EFFECTS,
  ERRORS
} from '../src/app';

const assign = Object.assign.bind(Object);

function mockApp(options = {}) {
  let { state, effects, context } = options;
  if (typeof state === 'undefined') {
    state = init.state;
  }
  if (typeof effects === 'undefined') {
    effects = [];
  }
  if (typeof context === 'undefined') {
    context = {};
  }

  let accumulatedEffects = [];

  let app = createApp(update, { state, effects }, context, {
    mockRunEffects: function(effects) {
      accumulatedEffects = accumulatedEffects.concat(effects);
    }
  });

  app.getEffects = function() {
    return accumulatedEffects;
  };

  return app;
}

describe('App', () => {
  describe('start', () => {
    it('should attach initial event listeners', function () {
      const app = mockApp({ effects: [EFFECTS.attachInitialEventListeners] });
      app.start();

      expect(app.getEffects()).toInclude(EFFECTS.attachInitialEventListeners);
    });
  });

  describe('change email', () => {
    it('should show no errors when email is valid', function () {
      const app = mockApp();
      app.start();
      app.dispatch(ACTIONS.changeEmail('mary@example.com'));

      expect(app.getState().inputs.email.value).toBe('mary@example.com');
      expect(app.getState().inputs.email.error).toBe(null);
    });

    it('should show required error when email is empty', function () {
      const state = assign({}, init.state, {
        inputs: assign({}, init.state.inputs, {
          email: {
            value: 'mary@example.com',
            error: null,
            touched: true
          }
        })
      });
      const app = mockApp({ state });
      app.start();
      app.dispatch(ACTIONS.changeEmail(''));

      expect(app.getState().inputs.email.value).toBe('');
      expect(app.getState().inputs.email.error).toBe(ERRORS.required);
      expect(app.getEffects()).toInclude(EFFECTS.updateValidationClasses);
    });
  });
});
