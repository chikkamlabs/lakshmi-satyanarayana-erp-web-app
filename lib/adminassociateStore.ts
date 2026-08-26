import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

export interface AssociateProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: 'active' | 'inactive';
  role: 'associate' | 'admin' | 'gst';
  created_at: string;
  updated_at?: string;
}

export interface AssociateRecord {
  id: string;
  associate_id: string;
  current_points: number;
  created_at: string;
  updated_at?: string;
  profile?: AssociateProfile;
}

export interface CreateAssociateInput {
  associate_id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  current_points?: number;
  status?: 'active' | 'inactive';
}

export interface UpdateAssociateInput {
  id: string;
  associate_id: string;
  name: string;
  email: string;
  mobile: string;
  current_points: number;
  status: 'active' | 'inactive';
}

export interface AssociatesStats {
  totalAssociates: number;
  totalPoints: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

/**
 * Creates an isolated, non-session-persisting client so creating users via auth.signUp
 * does not overwrite the currently logged-in administrator session in the browser.
 */
function getIsolatedAuthClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Fetch all associates combined with their profile information.
 */
export async function fetchAssociates(searchQuery?: string): Promise<{ data: AssociateRecord[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    // Fetch associates records
    const { data: associatesData, error: assocError } = await supabase
      .from('associates')
      .select('*')
      .order('created_at', { ascending: false });

    if (assocError) {
      console.error('Error fetching associates:', assocError);
      return { data: [], error: assocError.message };
    }

    if (!associatesData || associatesData.length === 0) {
      return { data: [], error: null };
    }

    // Fetch profiles for these associates
    const associateUserIds = associatesData.map((a) => a.id);
    const { data: profilesData, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', associateUserIds);

    if (profError) {
      console.error('Error fetching associate profiles:', profError);
    }

    const profilesMap = new Map<string, AssociateProfile>();
    if (profilesData) {
      profilesData.forEach((p) => {
        profilesMap.set(p.id, p as AssociateProfile);
      });
    }

    // Merge associate + profile
    const merged: AssociateRecord[] = associatesData.map((assoc) => ({
      ...assoc,
      profile: profilesMap.get(assoc.id),
    }));

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const filtered = merged.filter((item) => {
        const nameMatch = item.profile?.name?.toLowerCase().includes(q);
        const mobileMatch = item.profile?.mobile?.toLowerCase().includes(q);
        const assocIdMatch = item.associate_id?.toLowerCase().includes(q);
        const emailMatch = item.profile?.email?.toLowerCase().includes(q);
        return Boolean(nameMatch || mobileMatch || assocIdMatch || emailMatch);
      });
      return { data: filtered, error: null };
    }

    return { data: merged, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchAssociates:', err);
    return { data: [], error: err?.message || 'Failed to fetch associates' };
  }
}

/**
 * Fetch total number of associates and total points aggregated.
 */
export async function getAssociatesStats(): Promise<{ stats: AssociatesStats; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { stats: { totalAssociates: 0, totalPoints: 0 }, error: null };
    }

    const { data, error } = await supabase
      .from('associates')
      .select('current_points');

    if (error) {
      console.error('Error fetching associates stats:', error);
      return { stats: { totalAssociates: 0, totalPoints: 0 }, error: error.message };
    }

    const totalAssociates = data?.length || 0;
    const totalPoints = data?.reduce((acc, curr) => acc + (Number(curr.current_points) || 0), 0) || 0;

    return {
      stats: { totalAssociates, totalPoints },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in getAssociatesStats:', err);
    return { stats: { totalAssociates: 0, totalPoints: 0 }, error: err?.message || 'Failed to fetch stats' };
  }
}

/**
 * Fetch a single associate by user ID or associate record ID.
 */
export async function fetchAssociateById(id: string): Promise<{ data: AssociateRecord | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured || !id) {
      return { data: null, error: 'Database not configured or missing ID' };
    }

    // Try finding by id
    const { data: assocData, error: assocError } = await supabase
      .from('associates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (assocError) {
      console.error('Error fetching associate by id:', assocError);
      return { data: null, error: assocError.message };
    }

    if (!assocData) {
      return { data: null, error: 'Associate record not found' };
    }

    // Fetch profile
    const { data: profileData, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', assocData.id)
      .maybeSingle();

    if (profError) {
      console.error('Error fetching profile for associate:', profError);
    }

    const fullRecord: AssociateRecord = {
      ...assocData,
      profile: profileData as AssociateProfile | undefined,
    };

    return { data: fullRecord, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchAssociateById:', err);
    return { data: null, error: err?.message || 'Failed to fetch associate' };
  }
}

/**
 * Generate a suggested next associate_id (e.g. asc-101, asc-102)
 */
export async function suggestNextAssociateId(): Promise<string> {
  try {
    if (!isSupabaseConfigured) {
      return 'asc-101';
    }

    const { data } = await supabase
      .from('associates')
      .select('associate_id');

    if (!data || data.length === 0) {
      return 'asc-101';
    }

    let maxNum = 100;
    data.forEach((a) => {
      const match = a.associate_id?.match(/asc-(\d+)/i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    });

    return `asc-${maxNum + 1}`;
  } catch {
    return 'asc-101';
  }
}

/**
 * Create a new Associate:
 * 1. Creates Supabase Auth User (using isolated client to preserve Admin session)
 * 2. Inserts into public.profiles
 * 3. Inserts into public.associates
 */
export async function createAssociate(input: CreateAssociateInput): Promise<{ data: AssociateRecord | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase is not configured. Please check environment variables.' };
    }

    const finalAssociateId = (input.associate_id || '').trim() || (await suggestNextAssociateId());

    // Basic Validation
    if (!input.email || !input.password || !input.name || !input.mobile || !finalAssociateId) {
      return { data: null, error: 'All fields (Name, Email, Mobile, Associate ID, Password) are required.' };
    }

    if (input.password.length < 6) {
      return { data: null, error: 'Password must be at least 6 characters long.' };
    }

    // Check if associate_id is already taken
    const { data: existingAssoc } = await supabase
      .from('associates')
      .select('id')
      .eq('associate_id', finalAssociateId)
      .maybeSingle();

    if (existingAssoc) {
      return { data: null, error: `Associate ID "${finalAssociateId}" is already in use. Please choose another.` };
    }

    // Check if mobile is already taken in profiles
    const { data: existingMobile } = await supabase
      .from('profiles')
      .select('id')
      .eq('mobile', input.mobile.trim())
      .maybeSingle();

    if (existingMobile) {
      return { data: null, error: `Mobile number "${input.mobile}" is already registered with another profile.` };
    }

    // Use isolated auth client so current admin login session is preserved
    const authClient = getIsolatedAuthClient();
    if (!authClient) {
      return { data: null, error: 'Failed to initialize authentication client.' };
    }

    const { data: authData, error: authError } = await authClient.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: {
          name: input.name.trim(),
          mobile: input.mobile.trim(),
          role: 'associate',
          associate_id: finalAssociateId,
        },
      },
    });

    if (authError) {
      console.error('Supabase auth signUp error:', authError);
      return { data: null, error: authError.message };
    }

    const newUserId = authData.user?.id;
    if (!newUserId) {
      return { data: null, error: 'Failed to obtain user ID from authentication system.' };
    }

    const userStatus = input.status || 'active';
    const initialPoints = Number(input.current_points) || 0;

    // Insert or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: newUserId,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        mobile: input.mobile.trim(),
        status: userStatus,
        role: 'associate',
      });

    if (profileError) {
      console.error('Error creating profile entry:', profileError);
      return { data: null, error: `Profile creation failed: ${profileError.message}` };
    }

    // Insert into associates table
    const { data: createdAssoc, error: assocError } = await supabase
      .from('associates')
      .upsert({
        id: newUserId,
        associate_id: finalAssociateId,
        current_points: initialPoints,
      })
      .select('*')
      .single();

    if (assocError) {
      console.error('Error creating associates table entry:', assocError);
      return { data: null, error: `Associate record creation failed: ${assocError.message}` };
    }

    const fullRecord: AssociateRecord = {
      ...createdAssoc,
      profile: {
        id: newUserId,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        mobile: input.mobile.trim(),
        status: userStatus,
        role: 'associate',
        created_at: new Date().toISOString(),
      },
    };

    return { data: fullRecord, error: null };
  } catch (err: any) {
    console.error('Unexpected error in createAssociate:', err);
    return { data: null, error: err?.message || 'Failed to create associate' };
  }
}

/**
 * Update an existing Associate:
 * 1. Updates public.profiles (name, email, mobile, status)
 * 2. Updates public.associates (associate_id, current_points)
 */
export async function updateAssociate(input: UpdateAssociateInput): Promise<{ data: AssociateRecord | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase is not configured.' };
    }

    if (!input.id || !input.name || !input.email || !input.mobile || !input.associate_id) {
      return { data: null, error: 'ID, Name, Email, Mobile, and Associate ID are required.' };
    }

    // Check if new associate_id is taken by another record
    const { data: existingAssoc } = await supabase
      .from('associates')
      .select('id')
      .eq('associate_id', input.associate_id.trim())
      .neq('id', input.id)
      .maybeSingle();

    if (existingAssoc) {
      return { data: null, error: `Associate ID "${input.associate_id}" is already used by another associate.` };
    }

    // Check if new mobile is taken by another profile
    const { data: existingMobile } = await supabase
      .from('profiles')
      .select('id')
      .eq('mobile', input.mobile.trim())
      .neq('id', input.id)
      .maybeSingle();

    if (existingMobile) {
      return { data: null, error: `Mobile number "${input.mobile}" is already used by another profile.` };
    }

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        mobile: input.mobile.trim(),
        status: input.status,
      })
      .eq('id', input.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return { data: null, error: `Profile update failed: ${profileError.message}` };
    }

    // Update associates table
    const { data: updatedAssoc, error: assocError } = await supabase
      .from('associates')
      .update({
        associate_id: input.associate_id.trim(),
        current_points: Number(input.current_points) || 0,
      })
      .eq('id', input.id)
      .select('*')
      .single();

    if (assocError) {
      console.error('Error updating associates table:', assocError);
      return { data: null, error: `Associate update failed: ${assocError.message}` };
    }

    const fullRecord: AssociateRecord = {
      ...updatedAssoc,
      profile: {
        id: input.id,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        mobile: input.mobile.trim(),
        status: input.status,
        role: 'associate',
        created_at: updatedAssoc.created_at,
        updated_at: new Date().toISOString(),
      },
    };

    return { data: fullRecord, error: null };
  } catch (err: any) {
    console.error('Unexpected error in updateAssociate:', err);
    return { data: null, error: err?.message || 'Failed to update associate' };
  }
}
