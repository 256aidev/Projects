import client from './client';
import type { HouseholdMember } from './household';

export interface AddChildDto {
  name: string;
  avatar_color: string;
  age: number;
}

export interface UpdateChildDto {
  name?: string;
  avatar_color?: string;
  age?: number;
}

export async function addChild(dto: AddChildDto): Promise<HouseholdMember> {
  const { data } = await client.post<HouseholdMember>(
    '/households/me/children',
    dto,
  );
  return data;
}

export async function updateChild(
  id: string,
  dto: UpdateChildDto,
): Promise<HouseholdMember> {
  const { data } = await client.patch<HouseholdMember>(
    `/households/me/children/${id}`,
    dto,
  );
  return data;
}

export async function deactivateChild(
  id: string,
): Promise<HouseholdMember> {
  const { data } = await client.post<HouseholdMember>(
    `/households/me/children/${id}/deactivate`,
  );
  return data;
}
