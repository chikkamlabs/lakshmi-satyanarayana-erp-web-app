import { supabase, isSupabaseConfigured } from './supabase';

export interface RewardRecord {
  id: string;
  name: string;
  description: string | null;
  points: number;
  reward_url: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface CreateRewardInput {
  name: string;
  description?: string | null;
  points: number;
  reward_url?: string | null;
  status: 'active' | 'inactive';
}

export interface UpdateRewardInput {
  id: string;
  name: string;
  description?: string | null;
  points: number;
  reward_url?: string | null;
  status: 'active' | 'inactive';
}

export interface RewardsStats {
  totalRewards: number;
  activeRewards: number;
}

/**
 * Uploads an image file to the 'rewards_media' bucket in Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadRewardImage(file: File): Promise<{ url: string | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { url: null, error: 'Supabase is not configured.' };
    }

    if (!file) {
      return { url: null, error: 'No file provided for upload.' };
    }

    // Allowed image formats
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return { url: null, error: 'Please upload a valid image file (JPEG, PNG, WebP, GIF, or SVG).' };
    }

    // Limit file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { url: null, error: 'Image size should not exceed 5MB.' };
    }

    const bucketName = 'rewards_media';
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filePath = `rewards/${Date.now()}_${cleanFileName}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      
      // If bucket does not exist, try to create it or give informative message
      if (uploadError.message?.toLowerCase().includes('bucket not found')) {
        try {
          const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
          });
          if (!createBucketError) {
            // Retry upload
            const { error: retryError } = await supabase.storage
              .from(bucketName)
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
              });
            if (!retryError) {
              const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);
              return { url: publicUrlData.publicUrl, error: null };
            }
          }
        } catch (bErr) {
          console.error('Bucket auto-creation error:', bErr);
        }
      }
      return { url: null, error: uploadError.message || 'Failed to upload image to Supabase Storage.' };
    }

    // Retrieve Public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return { url: null, error: 'Could not retrieve public URL for uploaded image.' };
    }

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Unexpected error in uploadRewardImage:', err);
    return { url: null, error: err?.message || 'Unexpected error during image upload.' };
  }
}

/**
 * Fetch all rewards ordered by creation date descending.
 */
export async function fetchRewards(searchQuery?: string): Promise<{ data: RewardRecord[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.ilike('name', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rewards:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchRewards:', err);
    return { data: [], error: err?.message || 'Failed to fetch rewards.' };
  }
}

/**
 * Fetch active rewards ordered by creation date descending.
 */
export async function fetchActiveRewards(searchQuery?: string): Promise<{ data: RewardRecord[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('rewards')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (searchQuery && searchQuery.trim() !== '') {
      query = query.ilike('name', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching active rewards:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchActiveRewards:', err);
    return { data: [], error: err?.message || 'Failed to fetch active rewards.' };
  }
}

/**
 * Fetch summary stats for rewards: Total count.
 */
export async function getRewardsStats(): Promise<{ stats: RewardsStats; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { stats: { totalRewards: 0, activeRewards: 0 }, error: null };
    }

    const { data, error } = await supabase
      .from('rewards')
      .select('id, status');

    if (error) {
      console.error('Error fetching rewards stats:', error);
      return { stats: { totalRewards: 0, activeRewards: 0 }, error: error.message };
    }

    const totalRewards = data?.length || 0;
    const activeRewards = data?.filter((r) => r.status === 'active').length || 0;

    return {
      stats: { totalRewards, activeRewards },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in getRewardsStats:', err);
    return { stats: { totalRewards: 0, activeRewards: 0 }, error: err?.message || 'Failed to fetch reward statistics.' };
  }
}

/**
 * Fetch a single reward by its ID.
 */
export async function fetchRewardById(id: string): Promise<{ data: RewardRecord | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured || !id) {
      return { data: null, error: 'Database not configured or missing reward ID.' };
    }

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching reward by id:', error);
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Reward record not found.' };
    }

    return { data: data as RewardRecord, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchRewardById:', err);
    return { data: null, error: err?.message || 'Failed to fetch reward details.' };
  }
}

/**
 * Create a new reward entry in public.rewards table.
 */
export async function createReward(input: CreateRewardInput): Promise<{ data: RewardRecord | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase is not configured. Please check environment variables.' };
    }

    if (!input.name || !input.name.trim()) {
      return { data: null, error: 'Reward name is required.' };
    }

    const points = Number(input.points);
    if (isNaN(points) || points <= 0) {
      return { data: null, error: 'Points must be a positive integer greater than 0.' };
    }

    const { data, error } = await supabase
      .from('rewards')
      .insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        points: points,
        reward_url: input.reward_url?.trim() || null,
        status: input.status || 'active',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return { data: null, error: error.message };
    }

    return { data: data as RewardRecord, error: null };
  } catch (err: any) {
    console.error('Unexpected error in createReward:', err);
    return { data: null, error: err?.message || 'Failed to create reward.' };
  }
}

/**
 * Update an existing reward entry in public.rewards table.
 */
export async function updateReward(input: UpdateRewardInput): Promise<{ data: RewardRecord | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase is not configured.' };
    }

    if (!input.id) {
      return { data: null, error: 'Reward ID is required for update.' };
    }

    if (!input.name || !input.name.trim()) {
      return { data: null, error: 'Reward name is required.' };
    }

    const points = Number(input.points);
    if (isNaN(points) || points <= 0) {
      return { data: null, error: 'Points must be a positive integer greater than 0.' };
    }

    const { data, error } = await supabase
      .from('rewards')
      .update({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        points: points,
        reward_url: input.reward_url?.trim() || null,
        status: input.status || 'active',
      })
      .eq('id', input.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating reward:', error);
      return { data: null, error: error.message };
    }

    return { data: data as RewardRecord, error: null };
  } catch (err: any) {
    console.error('Unexpected error in updateReward:', err);
    return { data: null, error: err?.message || 'Failed to update reward.' };
  }
}
