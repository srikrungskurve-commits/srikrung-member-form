import { newPasswordError } from './login-validation.mjs';
// Display-only state: never retains passwords or grants authentication.
export function createFirstTimeDemo() {
  let stage = 'intro', member = '';
  const requireStage = value => { if (stage !== value) throw Error('กรุณาทดลองตามลำดับขั้นตอน'); };
  return Object.freeze({
    snapshot: () => Object.freeze({ stage, member, mode: 'demo' }),
    reset() { stage = 'intro'; member = ''; },
    selectMember(value) {
      requireStage('member');
      const sample = value.trim().toUpperCase();
      if (!['DEMO0001', 'DEMO0002'].includes(sample)) throw Error('ใช้เฉพาะรหัสตัวอย่าง DEMO0001 หรือ DEMO0002');
      member = sample; stage = 'line';
    },
    move(action) {
      if (action === 'restart') { stage = 'intro'; member = ''; return; }
      const routes = { start:['intro','member'], verify:['line','verified'], password:['verified','password'], edit:['line','member'] };
      if (!routes[action]) throw Error('ขั้นตอนทดลองไม่ถูกต้อง');
      requireStage(routes[action][0]); stage = routes[action][1];
    },
    back() { stage = ({ member:'intro', line:'member', verified:'line', password:'verified', done:'password' })[stage] || 'intro'; },
    complete(password, confirmation) {
      requireStage('password');
      const error = newPasswordError(password, confirmation);
      if (error) throw Error(error);
      stage = 'done';
    }
  });
}
