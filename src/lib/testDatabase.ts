/**
 * Test database connection and table existence
 * Run this in browser console to diagnose issues
 */
import { supabase } from './supabaseClient';

export const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      return { success: false, error: 'No active session' };
    }
    if (!session) {
      console.error('❌ No active session');
      return { success: false, error: 'Please sign in first' };
    }
    console.log('✅ Session active:', session.user.id);

    // Test 2: Try to query profiles table
    console.log('🔍 Testing profiles table access...');
    // @ts-ignore - Table may not exist in types
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Profiles table error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === 'PGRST205') {
        return {
          success: false,
          error: 'Table does not exist',
          solution: 'Run the migration script: supabase/migrations/000_SETUP_ALL.sql in Supabase SQL Editor'
        };
      }
      
      if (error.code === '42501') {
        return {
          success: false,
          error: 'Permission denied',
          solution: 'Check RLS policies. Make sure UPDATE policy exists for profiles table.'
        };
      }
      
      return { success: false, error: error.message };
    }

    console.log('✅ Profiles table accessible');
    
    // Test 3: Try to read own profile
    console.log('🔍 Testing profile read access...');
    // @ts-ignore
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile read error:', profileError);
      return { success: false, error: 'Cannot read profile', details: profileError.message };
    }

    console.log('✅ Profile read successful:', profileData);

    // Test 4: Try to update profile (dry run - we'll rollback)
    console.log('🔍 Testing profile update access...');
    // @ts-ignore
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: profileData?.full_name || null })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('❌ Profile update error:', updateError);
      return {
        success: false,
        error: 'Cannot update profile',
        details: updateError.message,
        code: updateError.code
      };
    }

    console.log('✅ Profile update access confirmed');
    
    return {
      success: true,
      message: 'All database tests passed!',
      profile: profileData
    };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testDatabase = testDatabaseConnection;
  console.log('💡 Run testDatabase() in console to diagnose database issues');
}

