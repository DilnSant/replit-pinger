
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { storage } from './storage';

// Configurar Google OAuth apenas se as credenciais estiverem disponíveis
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found from Google'), null);
      }

      // Verificar se usuário já existe
      const existingUsers = await storage.getAllUsers();
      let user = existingUsers.find(u => u.email === email);

      if (!user) {
        // Criar novo usuário
        const newUser = {
          id: crypto.randomUUID(),
          email,
          firstName: profile.name?.givenName || profile.displayName || '',
          lastName: profile.name?.familyName || '',
          profileImageUrl: profile.photos?.[0]?.value || null,
          isAdmin: false,
          userType: 'visualizador', // tipo padrão
          provider: 'google',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        user = await storage.upsertUser(newUser);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('Google OAuth credentials not provided - Google authentication disabled');
}

// Configurar Local Strategy (email/senha)
passport.use(new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  try {
    const users = await storage.getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.password) {
      return done(null, false, { message: 'Usuário ou senha inválidos' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Usuário ou senha inválidos' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
