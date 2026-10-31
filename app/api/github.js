import { githubHandler } from '../src/github-api.js';
export default githubHandler({ authURL:process.env.SUPABASE_URL,authKey:process.env.SUPABASE_PUBLISHABLE_KEY,githubAppId:process.env.GITHUB_APP_ID,githubSlug:process.env.GITHUB_APP_SLUG,githubClientId:process.env.GITHUB_CLIENT_ID,githubSecret:process.env.GITHUB_CLIENT_SECRET,encryptionKey:process.env.GITHUB_TOKEN_ENCRYPTION_KEY });
