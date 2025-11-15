import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '@/components/Nav';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from '@/lib/auth';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Trash2, Save, LogOut, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { clearHistory } from '@/lib/history';
import { loadUserProfile, updateUserProfile, type UserProfile } from '@/lib/profile';
import { testDatabaseConnection } from '@/lib/testDatabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [recipeSuggestions, setRecipeSuggestions] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    
    setProfileLoading(true);
    try {
      const profileData = await loadUserProfile(user);
      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
      } else {
        // Profile doesn't exist yet, that's okay
        setFullName('');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data.',
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleClearName = () => {
    setFullName('');
  };

  const handleTestDatabase = async () => {
    console.log('🧪 Running database connection test...');
    const result = await testDatabaseConnection();
    if (result.success) {
      toast({
        title: 'Database Test Passed',
        description: 'All database connections are working correctly!',
      });
    } else {
      toast({
        title: 'Database Test Failed',
        description: result.error + (result.solution ? `\n\nSolution: ${result.solution}` : ''),
        variant: 'destructive',
        duration: 15000,
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be signed in to update your profile.',
        variant: 'destructive',
      });
      return;
    }

    // Validate input
    const trimmedName = fullName.trim();
    if (trimmedName === '' && profile?.full_name === null) {
      // No change, but that's okay
    }

    setLoading(true);
    try {
      console.log('🚀 Settings: Starting profile update...', {
        userId: user.id,
        name: trimmedName || null,
        currentProfile: profile
      });
      
      const updatedProfile = await updateUserProfile(user, {
        full_name: trimmedName || null,
      });

      if (updatedProfile) {
        console.log('✅ Settings: Profile updated successfully', updatedProfile);
        setProfile(updatedProfile);
        setFullName(updatedProfile.full_name || '');
        toast({
          title: 'Profile updated',
          description: 'Your profile has been saved successfully.',
        });
      } else {
        console.error('❌ Settings: Update returned no profile data');
        throw new Error('Update returned no profile data');
      }
    } catch (error) {
      console.error('❌ Settings: Error updating profile:', error);
      let errorMessage = 'Failed to update profile.';
      let errorTitle = 'Error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for common Supabase errors and provide helpful messages
        if (error.message.includes('Database not set up') || error.message.includes('profiles table') || error.message.includes('PGRST205')) {
          errorTitle = 'Database Setup Required';
          errorMessage = 'The profiles table does not exist. Please:\n1. Open Supabase Dashboard\n2. Go to SQL Editor\n3. Run the script from supabase/migrations/000_SETUP_ALL.sql\n\nSee DATABASE_SETUP.md for detailed instructions.';
        } else if (error.message.includes('Permission denied') || error.message.includes('policy') || error.message.includes('42501')) {
          errorTitle = 'Permission Denied';
          errorMessage = 'You do not have permission to update your profile. This usually means:\n1. The RLS (Row Level Security) policies are not set up correctly\n2. Your session may be invalid\n\nPlease check your database policies or try signing out and back in.';
        } else if (error.message.includes('Session expired') || error.message.includes('JWT') || error.message.includes('token') || error.message.includes('PGRST301')) {
          errorTitle = 'Session Expired';
          errorMessage = 'Your session has expired. Please sign out and sign in again.';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorTitle = 'Table Not Found';
          errorMessage = 'The profiles table was not found. Please run the database migration script in Supabase SQL Editor.';
        } else if (error.message.includes('No active session')) {
          errorTitle = 'Not Signed In';
          errorMessage = 'You must be signed in to update your profile. Please sign in and try again.';
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        duration: 10000, // Show for 10 seconds so user can read it
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await signOut();
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all recipe history? This cannot be undone.')) return;

    try {
      await clearHistory(user);
      toast({
        title: 'History cleared',
        description: 'All recipe history has been removed.',
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear history.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) return;
    if (!confirm('This is your last chance. Are you absolutely sure?')) return;

    toast({
      title: 'Account deletion',
      description: 'Please contact support to delete your account.',
      variant: 'destructive',
    });
  };

  if (!user) {
    return (
      <main className="min-h-screen relative">
        <Nav />
        <div 
          className="fixed inset-0 -z-10"
          style={{
            background: `
              radial-gradient(circle at 15% 30%, hsl(165 63% 15% / 0.4) 0%, transparent 45%),
              radial-gradient(circle at 85% 70%, hsl(342 68% 18% / 0.35) 0%, transparent 45%),
              radial-gradient(circle at 50% 50%, hsl(215 49% 13% / 0.3) 0%, transparent 60%),
              linear-gradient(135deg, hsl(215 49% 13%) 0%, hsl(165 63% 15%) 100%)
            `
          }}
        />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 pt-24 pb-20">
          <div className="glass p-16 rounded-xl text-center">
            <h2 className="text-2xl font-bold text-dc-cream mb-4">Sign in required</h2>
            <p className="text-dc-cream/60 mb-6">
              Please sign in to access settings
            </p>
            <Button onClick={() => navigate('/signin')} className="btn-gold">
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <Nav />
      
      {/* Background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 15% 30%, hsl(165 63% 15% / 0.4) 0%, transparent 45%),
            radial-gradient(circle at 85% 70%, hsl(342 68% 18% / 0.35) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, hsl(215 49% 13% / 0.3) 0%, transparent 60%),
            linear-gradient(135deg, hsl(215 49% 13%) 0%, hsl(165 63% 15%) 100%)
          `
        }}
      />
      
      <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10 pt-24 pb-20">
        {/* Header */}
        <section className="py-12 md:py-16">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-xl glass glass-reflection flex items-center justify-center">
              <SettingsIcon className="w-7 h-7 text-dc-gold" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-dc-cream mb-2 tracking-tight">
                Settings
              </h1>
              <p className="text-lg text-dc-cream/60">
                Manage your account and preferences
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="glass glass-reflection p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                  <User className="w-5 h-5 text-dc-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-dc-cream">Profile</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-dc-cream/90 text-sm font-semibold mb-2 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="input-glass mt-2 opacity-60 cursor-not-allowed"
                    readOnly
                  />
                  <p className="text-xs text-dc-cream/50 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <Label htmlFor="fullName" className="text-dc-cream/90 text-sm font-semibold mb-2 block">
                    Full Name
                    {profileLoading && (
                      <span className="ml-2 text-xs text-dc-cream/50 font-normal">(Loading...)</span>
                    )}
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !loading && !profileLoading) {
                          e.preventDefault();
                          handleUpdateProfile();
                        }
                      }}
                      placeholder="Enter your full name (e.g., John Doe)"
                      className="input-glass pr-10 !bg-transparent"
                      disabled={loading || profileLoading}
                      autoComplete="name"
                      style={{
                        color: 'hsl(var(--dc-cream))',
                        borderColor: loading || profileLoading 
                          ? 'hsl(var(--glass-border) / 0.08)' 
                          : 'hsl(var(--glass-border) / 0.08)',
                      }}
                    />
                    {fullName && !loading && !profileLoading && (
                      <button
                        type="button"
                        onClick={handleClearName}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dc-cream/50 hover:text-dc-cream transition-colors"
                        aria-label="Clear name"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-dc-cream/50 mt-2">
                    {fullName 
                      ? `This name will be displayed as: "${fullName}"`
                      : 'This name will be displayed on your profile. Leave empty to use your email username.'}
                  </p>
                  {profile && profile.full_name && (
                    <p className="text-xs text-dc-cream/40 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Current saved name: {profile.full_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={loading || !user || profileLoading}
                    className="btn-gold inline-flex items-center gap-2"
                    type="button"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  {fullName && (
                    <Button
                      onClick={handleClearName}
                      disabled={loading || profileLoading}
                      variant="outline"
                      className="btn-glass inline-flex items-center gap-2"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                  <Button
                    onClick={handleTestDatabase}
                    disabled={loading || !user}
                    variant="outline"
                    className="btn-glass inline-flex items-center gap-2 text-xs"
                    type="button"
                    title="Test database connection and diagnose issues"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Test DB
                  </Button>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="glass glass-reflection p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                  <Bell className="w-5 h-5 text-dc-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-dc-cream">Notifications</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl glass hover:bg-dc-cream/5 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="emailNotifications" className="text-dc-cream/90 text-sm font-semibold mb-1 block">Email Notifications</Label>
                    <p className="text-sm text-dc-cream/60">Receive email updates about new recipes and features</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    className="ml-4"
                  />
                </div>
                <Separator className="bg-dc-cream/10" />
                <div className="flex items-center justify-between p-4 rounded-xl glass hover:bg-dc-cream/5 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="recipeSuggestions" className="text-dc-cream/90 text-sm font-semibold mb-1 block">Recipe Suggestions</Label>
                    <p className="text-sm text-dc-cream/60">Get personalized recipe recommendations based on your preferences</p>
                  </div>
                  <Switch
                    id="recipeSuggestions"
                    checked={recipeSuggestions}
                    onCheckedChange={setRecipeSuggestions}
                    className="ml-4"
                  />
                </div>
              </div>
            </div>

            {/* Privacy & Data */}
            <div className="glass glass-reflection p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                  <Shield className="w-5 h-5 text-dc-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-dc-cream">Privacy & Data</h2>
              </div>
              <div className="space-y-4">
                <div className="p-5 rounded-xl glass border border-dc-cream/10">
                  <Button
                    onClick={handleClearHistory}
                    variant="outline"
                    className="btn-glass w-full justify-start hover:scale-[1.02] transition-transform"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Recipe History
                  </Button>
                  <p className="text-xs text-dc-cream/50 mt-3 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    This will permanently remove all recipes from your viewing history. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="glass glass-reflection p-8 rounded-2xl border-2 border-dc-cream/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-dc-gold" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-dc-cream">Account</h2>
              </div>
              <div className="space-y-4">
                <Button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="btn-glass w-full justify-center hover:scale-[1.02] transition-transform inline-flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {loading ? 'Signing out...' : 'Sign Out'}
                </Button>
                <Separator className="bg-dc-cream/10 my-6" />
                <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
                  <p className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Danger Zone
                  </p>
                  <Button
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:scale-[1.02] transition-transform"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                  <p className="text-xs text-red-400/70 mt-3 text-center">
                    This will permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
};

export default Settings;

