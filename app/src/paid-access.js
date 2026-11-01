import {HttpError} from './providers.js';
// Input is a trusted server payment record, never a browser's paid flag.
export function hasPaidAccess(record, now = Date.now()) {
 return !!record && record.status==='active' && record.paymentVerified===true && Number.isFinite(record.accessUntil) && record.accessUntil>now && record.refunded!==true && record.disputed!==true;
}
export async function requirePaidRepository({userId,installation,repository,readEntitlement,repositories,now}) {
 if(!userId)throw new HttpError(401,'Sign in to continue.');
 const entitlement=await readEntitlement(userId);
 if(!hasPaidAccess(entitlement,now))throw new HttpError(402,'Payment is required to open details or edit this map.');
 const repo=(await repositories(installation)).find(r=>String(r.id)===String(repository));
 if(!repo)throw new HttpError(403,'This repository is no longer accessible.');
 return {entitlement,repo};
}
