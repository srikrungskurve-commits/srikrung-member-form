import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { memberIdFromSearch, memberError, newPasswordError } from '../assets/login-validation.mjs';
import { createFirstTimeDemo } from '../assets/first-time-demo.mjs';

const source = (await readFile(new URL('../assets/login.js', import.meta.url), 'utf8')).replace(/^import .*;\r?\n/gmu, '');

function page(search) {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { value:'', hidden:false, dataset:{}, listeners:{},
      setAttribute() {}, removeAttribute() {}, focus() {},
      querySelector() { return node(id+'-heading'); },
      addEventListener(event, handler) { this.listeners[event] = handler; }
    });
    return nodes.get(id);
  };
  const tabs = ['login','first-time','password'].map(name => Object.assign(node('tab-'+name), {dataset:{go:name}, closest:()=>true}));
  let apiCalls = 0;
  const context = { URLSearchParams, URL, Date, createFirstTimeDemo, memberError, newPasswordError, memberIdFromSearch,
    loginConfig:{apiBase:null}, AuthError:Error,
    createAuthApi:()=>new Proxy({}, {get:()=>()=>{ apiCalls++; throw Error('Unexpected API call'); }}),
    location:{search,hash:'',origin:'https://example.test',assign(){throw Error('Unexpected navigation');}},
    document:{ getElementById:node, querySelectorAll:selector=>selector==='[data-go]'?tabs:[],
      addEventListener(){},body:{classList:{add(){}}}},window:{addEventListener(){}}
  };
  vm.runInNewContext(source, context);
  return {node, click:name=>node('tab-'+name).listeners.click(), apiCalls:()=>apiCalls};
}

for (const id of ['AM0003','AM0009','SK00001','TESTAM0006']) {
  test(`URL ${id} prefills only editable Login field without authenticating`, () => {
    const p = page('?member_id='+id);
    assert.equal(p.node('member-id').value,id);
    assert.equal(p.node('line-member').value,'');
    assert.equal(p.node('expired-member').value,'');
    assert.equal(p.node('session-member').value,'');
    p.node('member-id').value='EDITED0001';
    p.click('first-time');
    assert.equal(p.node('demo-member').value,'');
    assert.equal(p.node('first-time-panel').hidden,false);
    p.click('password');
    assert.equal(p.node('line-member').value,'');
    p.click('login');
    assert.equal(p.node('member-id').value,'EDITED0001');
    assert.equal(p.apiCalls(),0);
  });
}

test('absent, empty, ambiguous, malformed and unsafe URL hints leave Login blank', () => {
  for (const search of ['', '?other=AM0003','?member_id=','?member_id=AM0003&member_id=AM0009',
    '?member_id=AM+0003','?member_id=%00AM0003','?member_id=%3Cscript%3E',
    '?member_id=%ZZ','?member_id='+ 'A'.repeat(65)]) {
    assert.equal(memberIdFromSearch(search),'');
    const p=page(search);
    assert.equal(p.node('member-id').value,'');
    assert.equal(p.apiCalls(),0);
  }
});

test('URL decoding and unrelated parameters do not change authentication state', () => {
  assert.equal(memberIdFromSearch('?member_id=%41M0003&role=ADMIN&verified=true'),'AM0003');
  const p=page('?member_id=%41M0003&role=ADMIN&verified=true');
  assert.equal(p.node('login-panel').hidden,false);
  assert.equal(p.node('welcome-panel').hidden,true);
  assert.equal(p.apiCalls(),0);
});
