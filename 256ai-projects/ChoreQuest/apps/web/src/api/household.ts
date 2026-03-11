import client from './client';

export interface Household {
  id: string;
  name: string;
  timezone: string;
  settings: HouseholdSettings;
}

export interface HouseholdSettings {
  default_approval_required: boolean;
  points_enabled: boolean;
  reminders_enabled: boolean;
}

export interface HouseholdMember {
  id: string;
  display_name: string;
  email: string;
  role: 'parent' | 'child';
  avatar_color: string | null;
  age: number | null;
  is_active: boolean;
}

export async function getHousehold(): Promise<Household> {
  const { data } = await client.get<Household>('/households/me');
  return data;
}

export async function updateSettings(
  dto: Partial<HouseholdSettings>,
): Promise<Household> {
  const { data } = await client.patch<Household>(
    '/households/me/settings',
    dto,
  );
  return data;
}

export async function getMembers(): Promise<HouseholdMember[]> {
  const { data } = await client.get<HouseholdMember[]>(
    '/households/me/members',
  );
  return data;
}
