export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'moderator' | 'user' | 'guest';
  isVerified: boolean;
  status: 'active' | 'suspended' | 'banned' | 'deleted';
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  preferredLanguage: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoggedIn: Date;
  lastLoginIp?: string;
  metadata: {
    birthDate?: Date;
    location?: string;
    website?: string;
    bio?: string;
  };
  socialAccounts: Array<{
    provider: string;
    providerId: string;
    connectedAt: Date;
  }>;
  notificationPreferences: {
    email: {
      productUpdates: boolean;
      newsletter: boolean;
      promotions: boolean;
    };
    push: {
      messages: boolean;
      mentions: boolean;
    };
  };
}
