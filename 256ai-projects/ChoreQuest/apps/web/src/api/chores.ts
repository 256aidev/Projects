import client from './client';

export interface Chore {
  id: string;
  household_id: string;
  title: string;
  description: string | null;
  points: number;
  recurrence_type: 'daily' | 'weekly' | 'custom' | 'once';
  recurrence_days: number[] | null;
  assignment_mode: 'single' | 'rotation';
  assigned_child_id: string | null;
  approval_required: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  assigned_child_name?: string;
}

export interface CreateChoreDto {
  title: string;
  description?: string;
  points: number;
  recurrence_type: 'daily' | 'weekly' | 'custom' | 'once';
  recurrence_days?: number[];
  assignment_mode: 'single' | 'rotation';
  assigned_child_id?: string;
  approval_required: boolean;
}

export type UpdateChoreDto = Partial<CreateChoreDto>;

export interface ChoreParams {
  active?: boolean;
  archived?: boolean;
}

export async function getChores(params?: ChoreParams): Promise<Chore[]> {
  const { data } = await client.get<Chore[]>('/households/me/chores', {
    params,
  });
  return data;
}

export async function createChore(dto: CreateChoreDto): Promise<Chore> {
  const { data } = await client.post<Chore>('/households/me/chores', dto);
  return data;
}

export async function updateChore(
  id: string,
  dto: UpdateChoreDto,
): Promise<Chore> {
  const { data } = await client.patch<Chore>(
    `/households/me/chores/${id}`,
    dto,
  );
  return data;
}

export async function archiveChore(id: string): Promise<Chore> {
  const { data } = await client.post<Chore>(
    `/households/me/chores/${id}/archive`,
  );
  return data;
}

export async function restoreChore(id: string): Promise<Chore> {
  const { data } = await client.post<Chore>(
    `/households/me/chores/${id}/restore`,
  );
  return data;
}
