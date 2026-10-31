// Supabase owns credentials, email verification, token rotation, and session revocation.
// This browser adapter exposes account UI only; it never authorizes repository data.
export function accountTransport(auth, storage) {
  const marker = 'rmc-password-recovery';
  let recovering = storage.getItem(marker) === 'true';
  auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') { recovering = true; storage.setItem(marker, 'true'); }
    if (event === 'SIGNED_OUT') { recovering = false; storage.removeItem(marker); }
  });
  function checked(result) {
    if (result.error) {
      const code = result.error.code;
      if (result.error.status === 429) throw new Error('Too many attempts or emails. Please wait before trying again.');
      if (code === 'email_not_confirmed') throw new Error('Confirm your email using the link in your inbox, then sign in.');
      if (code === 'email_address_not_authorized') throw new Error('Email delivery is currently limited to the project team. A custom email sender is still needed.');
      if (code === 'invalid_credentials') throw new Error('Email or password is incorrect.');
      throw new Error('The account request could not be completed. Check your details and try again.');
    }
    return result.data;
  }
  function validPassword(value) {
    if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw new Error('Use a password with 12–128 characters.');
  }
  return async function request(route, data = {}) {
    if (route === '/api/config') return { authReady: true, githubReady: false, scanningReady: false, billingReady: false, detailsRequirePayment: true, emailLinks: true };
    if (route === '/api/session') {
      const { session } = checked(await auth.getSession());
      if (!session) return { signedIn: false };
      const { user } = checked(await auth.getUser());
      if (!user?.id || !user.email_confirmed_at) {
        await auth.signOut({ scope: 'local' });
        return { signedIn: false };
      }
      return { signedIn: true, email: user.email, recovery: recovering, githubConnected: false, paid: false };
    }
    if (route === '/api/auth/signup') {
      validPassword(data.password);
      checked(await auth.signUp({ email: data.email.trim(), password: data.password }));
      return { message: 'Check your inbox for the confirmation link. Open it to verify your email, then sign in.' };
    }
    if (route === '/api/auth/login') {
      validPassword(data.password);
      checked(await auth.signInWithPassword({ email: data.email.trim(), password: data.password }));
      recovering = false; storage.removeItem(marker);
      return { signedIn: true };
    }
    if (route === '/api/auth/recover') {
      checked(await auth.resetPasswordForEmail(data.email.trim()));
      return { message: 'If an account exists, check your inbox for a password-reset link. Open it to choose a new password.' };
    }
    if (route === '/api/auth/password') {
      if (!recovering) throw new Error('Open the password-reset link from your email first.');
      validPassword(data.password);
      const { user } = checked(await auth.getUser());
      if (!user?.id || !user.email_confirmed_at) throw new Error('Open a new password-reset link.');
      checked(await auth.updateUser({ password: data.password }));
      checked(await auth.signOut({ scope: 'global' }));
      recovering = false; storage.removeItem(marker);
      return { message: 'Password updated. Sign in with your new password.' };
    }
    if (route === '/api/auth/logout') {
      checked(await auth.signOut({ scope: 'local' }));
      recovering = false; storage.removeItem(marker);
      return { signedOut: true };
    }
    throw new Error('This feature is not available yet.');
  };
}
