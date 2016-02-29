import {
  createApp,
  update,
  init,
  ElementCache,
  Api,
  ELS
} from './app';

// APP
// ==============================================

const $els = ElementCache.create({
  [ELS.form]: $(ELS.form),
  [ELS.email]: $(ELS.email),
  [ELS.emailGroup]: $(ELS.emailGroup),
  [ELS.password]: $(ELS.password),
  [ELS.passwordGroup]: $(ELS.passwordGroup),
  [ELS.submit]: $(ELS.submit)
});
const api = Api.create('fake-api-key');
const context = { $els, api };

const app = createApp(update, init, context);
app.start();

// For debugging
window.app = app;

// TESTS
// ==============================================

mocha.setup('bdd');

require('../test/app-test');

mocha.checkLeaks();
mocha.globals(['$']);
mocha.run();
