import { useAuth } from './AuthProvider';
import { signOut } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { loadUserProfile, getUserDisplayName, getUserInitial, type UserProfile } from '@/lib/profile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, Heart, Clock, LogOut, User as UserIcon } from 'lucide-react';

export const UserMenu = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      loadUserProfile(user).then(setProfile).catch(console.error);
    }
  }, [user]);

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

  if (!user) return null;

  const displayName = getUserDisplayName(profile, user);
  const userInitial = getUserInitial(profile, user);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-dc-cream/70">
        <span className="max-w-[120px] sm:max-w-[140px] truncate" title={user?.email || ''}>
          {displayName}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full glass flex items-center justify-center border border-dc-gold/20 hover:border-dc-gold/40 transition-colors flex-shrink-0">
            <span className="text-dc-gold text-xs font-semibold">
              {userInitial}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass border-dc-cream/10 backdrop-blur-xl min-w-[200px]">
          <DropdownMenuLabel className="text-dc-cream">
            <div className="flex flex-col">
              <span className="font-semibold">{displayName}</span>
              {user?.email && (
                <span className="text-xs text-dc-cream/60 font-normal">{user.email}</span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-dc-cream/10" />
          <DropdownMenuItem
            onClick={() => navigate('/saved')}
            className="text-dc-cream/80 hover:text-dc-cream hover:bg-dc-cream/10 cursor-pointer"
          >
            <Heart className="w-4 h-4 mr-2" />
            Saved Recipes
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate('/history')}
            className="text-dc-cream/80 hover:text-dc-cream hover:bg-dc-cream/10 cursor-pointer"
          >
            <Clock className="w-4 h-4 mr-2" />
            History
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate('/settings')}
            className="text-dc-cream/80 hover:text-dc-cream hover:bg-dc-cream/10 cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-dc-cream/10" />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={loading}
            className="text-dc-cream/80 hover:text-dc-cream hover:bg-dc-cream/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loading ? 'Signing out...' : 'Sign out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

