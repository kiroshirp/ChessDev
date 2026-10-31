import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('servicio desactivado: sin formularios, acceso ni conexiones externas',async()=>{
  const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
  const [html,app,admin,config,rules]=await Promise.all(['index.html','app.js','admin.html','firebase.json','database.disabled.rules.json'].map(read));
  assert.doesNotMatch(html,/<form|Registrar solicitud|wa\.me/);
  assert.doesNotMatch(app,/fetch\(|XMLHttpRequest|WebSocket|catalog-api|operations-api|firebase/);
  assert.doesNotMatch(admin,/<form|<script|type="password"/);
  assert.deepEqual(JSON.parse(rules).rules,{'.read':false,'.write':false});
  assert.deepEqual(JSON.parse(config).auth.providers,{emailPassword:false,anonymous:false});
});
