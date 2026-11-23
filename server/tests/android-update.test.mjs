import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {compareAppVersions,evaluateAndroidRelease,safeApkDownloadUrl} from '../../src/androidUpdate.js';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shods-app-update-'));
process.env.SHODS_TEST_MODE='1';
process.env.SHODS_DATA_PATH=path.join(dir,'db.json');
process.env.SHODS_ANDROID_RELEASE_VERSION='4.3.2';
process.env.SHODS_ANDROID_APK_URL='https://github.com/example/shods-shop/releases/download/v4.3.2/app-release.apk';
process.env.SHODS_ANDROID_RELEASE_NOTES='Yangi Android dizayni va tuzatishlar';
const {server}=await import('../index.mjs');

test('Android version comparison and safe download links',()=>{
 assert.equal(compareAppVersions('4.3.0','4.2.9'),1);
 assert.equal(compareAppVersions('4.3.0','4.3.0'),0);
 assert.equal(compareAppVersions('4.2.0','4.3.0'),-1);
 assert.equal(compareAppVersions('invalid','4.2.0'),null);
 assert.equal(safeApkDownloadUrl('http://bad.example/a.apk'),null);
 assert.equal(safeApkDownloadUrl('https://evil:secret@example.com/app.apk'),null);
 assert.equal(evaluateAndroidRelease({releasePublished:false},'4.3.0').status,'unpublished');
 assert.equal(evaluateAndroidRelease({releasePublished:true,version:'4.4.0',downloadUrl:'http://insecure/a.apk'},'4.3.0').status,'invalid');
 assert.equal(evaluateAndroidRelease({releasePublished:true,version:'4.3.2',downloadUrl:'https://example.com/app.apk'},'4.3.0').status,'available');
 assert.equal(evaluateAndroidRelease({releasePublished:true,version:'4.3.2',downloadUrl:'https://example.com/app.apk'},'4.3.2').status,'current');
});

test('Public Android release endpoint is read-only and CORS compatible',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const res=await fetch(base+'/api/app/android-release',{headers:{Origin:'https://localhost'}});
  assert.equal(res.status,200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'),'https://localhost');
  const info=await res.json();
  assert.equal(info.releasePublished,true);
  assert.equal(info.version,'4.3.2');
  assert.match(info.downloadUrl,/^https:\/\//);
  assert.equal(info.notes,'Yangi Android dizayni va tuzatishlar');
  assert.equal(info.downloadUrl.includes('TOKEN'),false);
  assert.equal(info.capabilities?.autoInstall,undefined);
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
