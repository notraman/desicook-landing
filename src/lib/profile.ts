import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Load user profile from database
 */
export const loadUserProfile = async (user: User): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // Check if table doesn't exist (common setup issue)
      if (error.code === 'PGRST205' || error.message?.includes("Could not find the table 'public.profiles'")) {
        console.error('❌ Database Setup Required:', 'The profiles table does not exist. Please run the database migration.');
        console.error('📖 See DATABASE_SETUP.md for instructions');
        throw new Error('Database not set up. Please run the migration script in Supabase SQL Editor. See DATABASE_SETUP.md');
      }
      
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        console.log('Profile not found, creating new profile...');
        return await createUserProfile(user);
      }
      console.error('Error loading profile:', error);
      throw error;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
};

/**
 * Create a new user profile
 */
export const createUserProfile = async (user: User): Promise<UserProfile | null> => {
  try {
    console.log('Creating profile for user:', user.id);
    // Type assertion needed - table may not exist in generated types until migration is run
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('profiles') as any)
      .insert({
        id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      })
      .select()
      .single();

    if (error) {
      // Check if table doesn't exist
      if (error.code === 'PGRST205' || error.message?.includes("Could not find the table 'public.profiles'")) {
        console.error('❌ Database Setup Required:', 'The profiles table does not exist. Please run the database migration.');
        console.error('📖 See DATABASE_SETUP.md for instructions');
        throw new Error('Database not set up. Please run the migration script in Supabase SQL Editor. See DATABASE_SETUP.md');
      }
      
      console.error('Error creating profile:', error);
      // If profile already exists, try to load it
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        console.log('Profile already exists, loading it...');
        return await loadUserProfile(user);
      }
      throw error;
    }
    
    console.log('Profile created successfully:', data);
    return data as UserProfile;
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  user: User,
  updates: {
    full_name?: string | null;
    avatar_url?: string | null;
  }
): Promise<UserProfile | null> => {
  try {
    console.log('🔄 Starting profile update...', { userId: user.id, updates });
    
    // Verify user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session. Please sign in again.');
    }
    console.log('✅ Session verified:', session.user.id);

    // First, ensure the profile exists
    console.log('📖 Loading existing profile...');
    let profile = await loadUserProfile(user);
    if (!profile) {
      console.log('📝 Profile not found, creating new profile...');
      // If profile doesn't exist, create it first
      profile = await createUserProfile(user);
      if (!profile) {
        throw new Error('Failed to create profile');
      }
      console.log('✅ Profile created:', profile);
    } else {
      console.log('✅ Profile found:', profile);
    }

    // The updated_at field will be automatically updated by the database trigger
    console.log('💾 Updating profile in database...', updates);
    // Type assertion needed - table may not exist in generated types until migration is run
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('profiles') as any)
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        error: error
      });
      
      // Check if table doesn't exist
      if (error.code === 'PGRST205' || error.message?.includes("Could not find the table 'public.profiles'")) {
        console.error('❌ Database Setup Required:', 'The profiles table does not exist. Please run the database migration.');
        console.error('📖 See DATABASE_SETUP.md for instructions');
        throw new Error('Database not set up. Please run the migration script in Supabase SQL Editor. See DATABASE_SETUP.md');
      }
      
      // Check for RLS policy violations
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
        console.error('❌ RLS Policy Error:', 'You may not have permission to update this profile.');
        throw new Error('Permission denied. Please check your database RLS policies. Make sure you are signed in and the UPDATE policy allows users to update their own profile.');
      }
      
      // Check for JWT/session errors
      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('token')) {
        console.error('❌ Authentication Error:', 'Your session may have expired.');
        throw new Error('Session expired. Please sign out and sign in again.');
      }
      
      console.error('❌ Unknown Supabase error:', error);
      throw new Error(error.message || `Failed to update profile. Error code: ${error.code || 'unknown'}`);
    }

    if (!data) {
      console.error('❌ No data returned from update');
      throw new Error('No data returned from update');
    }

    console.log('✅ Profile updated successfully:', data);
    return data as UserProfile;
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while updating profile');
  }
};

/**
 * Get user's display name (full_name or email or fallback)
 */
export const getUserDisplayName = (profile: UserProfile | null, user: User | null): string => {
  if (profile?.full_name) {
    return profile.full_name;
  }
  if (user?.email) {
    return user.email.split('@')[0];
  }
  return 'User';
};

/**
 * Get user's display initial (for avatar)
 */
export const getUserInitial = (profile: UserProfile | null, user: User | null): string => {
  if (profile?.full_name) {
    return profile.full_name.charAt(0).toUpperCase();
  }
  if (user?.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return 'U';
};

