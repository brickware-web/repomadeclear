import test from 'node:test';import assert from 'node:assert/strict';import {connectionDescription,evidenceURL,model} from '../src/workspace/model.js';
const nodes=[{id:'a',title:'Reader'},{id:'b',title:'Definitions'}];
test('type references and human corrections are not described as runtime or detected connections',()=>{
 const type=connectionDescription({source:'a',target:'b',kind:'type-reference',certainty:'detected'},nodes);assert.match(type.text,/rather than sending/);assert.match(type.limit,/does not show a call/);
 const human=connectionDescription({source:'a',target:'b',certainty:'human-supplied',human:{explanation:'Reviewed by our team'}},nodes);assert.equal(human.text,'Reviewed by our team');assert.match(human.limit,/not established/);
});
test('evidence links bind to exact GitHub commits and reject untrusted destinations',()=>{
 const e={repository:'brickware-web/repomadeclear',commit:'a'.repeat(40),file:'app/src/scanner.js',startLine:5,endLine:8};assert.equal(evidenceURL(e),`https://github.com/brickware-web/repomadeclear/blob/${e.commit}/app/src/scanner.js#L5-L8`);
 for(const bad of [{repository:'https://evil.test/x'},{commit:'main'},{file:'../secret'},{startLine:0},{endLine:2}])assert.equal(evidenceURL({...e,...bad}),null);
});
test('human explanations remain labeled separately from suggested file roles',()=>{
 const value=model({nodes:[{id:'a',label:'src/scanner.js',kind:'source',human:{explanation:'Our reviewed note'}}],edges:[]});assert.equal(value.nodes[0].explanation,'Our reviewed note');assert.match(value.nodes[0].basis,/Human-supplied/);
});
