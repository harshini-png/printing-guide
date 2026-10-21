import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Category, Guide, GuideFormData } from '../types';

// Retrieve credentials from environment variables or custom local storage configuration
const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_KEY = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

// Local storage fallback keys for manual configuration if .env isn't set yet in preview
const LS_URL_KEY = 'printmate_supabase_url';
const LS_ANON_KEY = 'printmate_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; key: string; isConfigured: boolean } {
  const localUrl = (typeof window !== 'undefined' ? localStorage.getItem(LS_URL_KEY) || '' : '').trim();
  const localKey = (typeof window !== 'undefined' ? localStorage.getItem(LS_ANON_KEY) || '' : '').trim();

  const url = ENV_SUPABASE_URL || localUrl;
  const key = ENV_SUPABASE_KEY || localKey;

  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    !url.includes('your_supabase_project_url')
  );

  return { url, key, isConfigured };
}

export function saveManualSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_URL_KEY, url.trim());
    localStorage.setItem(LS_ANON_KEY, key.trim());
    // Reload client instance
    reinitializeSupabase();
  }
}

export function clearManualSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LS_URL_KEY);
    localStorage.removeItem(LS_ANON_KEY);
    reinitializeSupabase();
  }
}

let supabaseInstance: SupabaseClient | null = null;

function initClient(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;
  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    supabaseInstance = initClient();
  }
  return supabaseInstance;
}

export function reinitializeSupabase() {
  supabaseInstance = initClient();
}

// ==============================================================================
// AUTHENTICATION & ADMIN VERIFICATION HELPERS
// ==============================================================================

// Track whether the connected Supabase project is missing the schema tables (PGRST205)
let schemaTablesMissing = false;

export function isSchemaMissing(): boolean {
  return schemaTablesMissing;
}

export function setSchemaMissing(val: boolean) {
  schemaTablesMissing = val;
}

export function isTableMissingError(error: unknown): boolean {
  if (!error) return false;
  const errObj = error as { code?: string; message?: string };
  const code = errObj.code || '';
  const msg = (errObj.message || '').toLowerCase();
  return (
    code === 'PGRST205' ||
    msg.includes('pgrst205') ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

export const DEFAULT_SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'WhatsApp', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Cards & IDs', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Xerox', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Colour Print', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Email & PDF', created_at: new Date().toISOString() },
];

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check against app_admins table (explicit administrator verification)
    const { data, error } = await supabase
      .from('app_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error)) {
        schemaTablesMissing = true;
        return false;
      }
      return false;
    }

    if (!data) {
      return false;
    }
    return true;
  } catch (err) {
    if (isTableMissingError(err)) {
      schemaTablesMissing = true;
      return false;
    }
    console.error('Error verifying administrator authorization:', err);
    return false;
  }
}

export async function getCurrentUser() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signInAdmin(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase is not configured yet. Please enter your Supabase URL and anon key.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  // Verify that this user is in the app_admins allowlist
  if (data.user) {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      if (schemaTablesMissing) {
        throw new Error(
          'Supabase schema is not initialized yet. Please run the supabase/schema.sql script and add your user to app_admins.'
        );
      }
      // User is logged into Supabase auth, but NOT authorized in app_admins table
      await supabase.auth.signOut();
      throw new Error('Access denied: Your account is not authorized as an administrator in the app_admins table.');
    }
  }

  return data;
}

export async function signOutAdmin() {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

// ==============================================================================
// CATEGORY OPERATIONS
// ==============================================================================

export async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return DEFAULT_SEED_CATEGORIES;
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    if (isTableMissingError(error)) {
      schemaTablesMissing = true;
      // Return default seed categories so UI remains functional
      return DEFAULT_SEED_CATEGORIES;
    }
    console.error('Error fetching categories from Supabase:', error);
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  // If table exists and is empty, return default categories
  const catList = (data as Category[]) || [];
  if (catList.length === 0) {
    return DEFAULT_SEED_CATEGORIES;
  }

  schemaTablesMissing = false;
  return catList;
}

export async function createCategory(name: string): Promise<Category> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be empty.');

  const { data, error } = await supabase
    .from('categories')
    .insert({ name: trimmed })
    .select()
    .single();

  if (error) {
    if (error.code === '23505' || error.message.toLowerCase().includes('duplicate') || error.message.toLowerCase().includes('unique')) {
      throw new Error(`A category named "${trimmed}" already exists.`);
    }
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return data as Category;
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be empty.');

  const { data, error } = await supabase
    .from('categories')
    .update({ name: trimmed })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505' || error.message.toLowerCase().includes('duplicate') || error.message.toLowerCase().includes('unique')) {
      throw new Error(`A category named "${trimmed}" already exists.`);
    }
    throw new Error(`Failed to update category: ${error.message}`);
  }

  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  // Safe foreign-key pre-check: ensure no guides are currently using this category
  const { count, error: countError } = await supabase
    .from('guides')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (countError) {
    throw new Error(`Could not verify category usage: ${countError.message}`);
  }

  if (count && count > 0) {
    throw new Error(
      `Cannot delete this category because it is currently assigned to ${count} guide${count > 1 ? 's' : ''}. Please reassign or delete those guides first.`
    );
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }
}

// ==============================================================================
// GUIDE & STEP OPERATIONS
// ==============================================================================

export async function fetchGuides(includeUnpublished = false): Promise<Guide[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase
    .from('guides')
    .select(`
      id,
      title,
      description,
      category_id,
      icon,
      published,
      created_at,
      updated_at,
      category:categories ( id, name, created_at ),
      steps:guide_steps ( id, guide_id, instruction, description, note, step_order, created_at )
    `)
    .order('created_at', { ascending: false });

  if (!includeUnpublished) {
    query = query.eq('published', true);
  }

  const { data, error } = await query;

  if (error) {
    if (isTableMissingError(error)) {
      schemaTablesMissing = true;
      return [];
    }
    console.error('Error fetching guides:', error);
    throw new Error(`Failed to load guides: ${error.message}`);
  }

  const guides = (data as unknown as Guide[]) || [];

  // Sort nested steps by step_order
  guides.forEach((g) => {
    if (g.steps && Array.isArray(g.steps)) {
      g.steps.sort((a, b) => a.step_order - b.step_order);
    }
  });

  return guides;
}

export async function fetchGuideById(id: string): Promise<Guide | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('guides')
    .select(`
      id,
      title,
      description,
      category_id,
      icon,
      published,
      created_at,
      updated_at,
      category:categories ( id, name, created_at ),
      steps:guide_steps ( id, guide_id, instruction, description, note, step_order, created_at )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (isTableMissingError(error)) {
      schemaTablesMissing = true;
      return null;
    }
    console.error('Error fetching guide by ID:', error);
    throw new Error(`Failed to load guide: ${error.message}`);
  }

  if (!data) return null;

  const guide = data as unknown as Guide;
  if (guide.steps && Array.isArray(guide.steps)) {
    guide.steps.sort((a, b) => a.step_order - b.step_order);
  }

  return guide;
}

export async function saveGuide(formData: GuideFormData, existingId?: string): Promise<Guide> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  if (!formData.title.trim()) {
    throw new Error('Guide title is required.');
  }
  if (!formData.category_id) {
    throw new Error('Please select a category for this guide.');
  }
  if (!formData.steps || formData.steps.length === 0) {
    throw new Error('Every guide must have at least one step.');
  }

  // Validate that every step has an instruction
  for (let i = 0; i < formData.steps.length; i++) {
    const step = formData.steps[i];
    if (!step.instruction.trim()) {
      throw new Error(`Step ${i + 1} is missing an instruction.`);
    }
  }

  let guideId = existingId;

  if (existingId) {
    // 1. Update existing guide
    const { error: guideError } = await supabase
      .from('guides')
      .update({
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        category_id: formData.category_id,
        icon: formData.icon || 'BookOpen',
        published: formData.published,
      })
      .eq('id', existingId);

    if (guideError) {
      throw new Error(`Failed to update guide: ${guideError.message}`);
    }

    // 2. Remove previous steps to cleanly replace with re-ordered and updated steps
    const { error: deleteStepsError } = await supabase
      .from('guide_steps')
      .delete()
      .eq('guide_id', existingId);

    if (deleteStepsError) {
      throw new Error(`Failed to update guide steps: ${deleteStepsError.message}`);
    }
  } else {
    // 1. Insert new guide
    const { data: newGuide, error: insertError } = await supabase
      .from('guides')
      .insert({
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        category_id: formData.category_id,
        icon: formData.icon || 'BookOpen',
        published: formData.published,
      })
      .select('id')
      .single();

    if (insertError || !newGuide) {
      throw new Error(`Failed to create guide: ${insertError?.message || 'Unknown database error'}`);
    }

    guideId = newGuide.id;
  }

  // 3. Insert all steps with strict sequence step_order
  const stepsToInsert = formData.steps.map((step, index) => ({
    guide_id: guideId!,
    instruction: step.instruction.trim(),
    description: step.description?.trim() || null,
    note: step.note?.trim() || null,
    step_order: index + 1,
  }));

  const { error: stepsInsertError } = await supabase
    .from('guide_steps')
    .insert(stepsToInsert);

  if (stepsInsertError) {
    throw new Error(`Failed to save guide steps: ${stepsInsertError.message}`);
  }

  // Fetch and return the fully populated saved guide
  const savedGuide = await fetchGuideById(guideId!);
  if (!savedGuide) {
    throw new Error('Guide was saved but could not be retrieved from the database.');
  }

  return savedGuide;
}

export async function deleteGuide(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  // Foreign key with ON DELETE CASCADE ensures steps are deleted
  const { error } = await supabase.from('guides').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete guide: ${error.message}`);
  }
}
