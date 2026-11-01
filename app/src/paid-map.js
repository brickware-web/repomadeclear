import {billing} from './billing.js';
import {credentialVault} from './github-store.js';
import {createOverlayEngine} from './overlays.js';
import {HttpError} from './providers.js';
export async function paidMap({config,user,repository,body},dependencies={}){
 const payments=dependencies.payments||billing(config),access=await payments.paid(user.id,repository.id);
 if(!access.paid)throw new HttpError(402,'Subscribe to unlock component details and editing.');
 const {data:saved,error}=await payments.db.from('rmc_scans').select('scan_key,envelope').eq('user_id',user.id).maybeSingle();
 if(error||!saved?.envelope)throw new HttpError(404,'Create your free scan first.');
 const vault=credentialVault(config.encryptionKey);const {scan}=await vault.open(saved.envelope,user.id,'scan');
 if(scan.repository!==repository.full_name)throw new HttpError(403,'This saved map belongs to a different repository.');
 const engine=createOverlayEngine();const {data:stored,error:readError}=await payments.db.from('rmc_overlays').select('*').eq('user_id',user.id).maybeSingle();
 if(readError)throw new HttpError(503,'Edits could not be loaded.');
 if(stored&&stored.scan_key!==saved.scan_key)throw new HttpError(409,'This map changed. Your saved edits need review before continuing.');
 let overlay=stored?(await vault.open(stored.envelope,user.id,'overlay')).overlay:engine.fresh(scan);
 let version=stored?.version||0;
 if(body.action==='edit'){
  if(body.version!==version)throw new HttpError(409,'Your edits changed in another tab. Reload the map before saving.');
  try{overlay=engine.apply(scan,overlay,body.operation,user.id);}catch{throw new HttpError(400,'This edit is invalid or exceeds the editing limits.');}
  const envelope=await vault.seal({overlay},user.id,'overlay',315360000);
  if(envelope.length>200000)throw new HttpError(413,'This map has reached its editing storage limit.');
  const value={user_id:user.id,scan_key:saved.scan_key,envelope,version:version+1,updated_at:new Date().toISOString()};
  const result=stored?await payments.db.from('rmc_overlays').update(value).eq('user_id',user.id).eq('version',version).select('version'):await payments.db.from('rmc_overlays').insert(value).select('version');
  if(result.error||!result.data?.length)throw new HttpError(409,'Another edit was saved first. Reload before continuing.');version++;
 }
 return {scan,overlay,version,access:{paid:true,accessUntil:access.accessUntil}};
}
