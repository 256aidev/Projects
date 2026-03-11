import client from './client';

export interface Rotation {
  chore_id: string;
  child_ids: string[];
  current_index: number;
}

export async function getRotation(choreId: string): Promise<Rotation> {
  const { data } = await client.get<Rotation>(
    `/households/me/chores/${choreId}/rotation`,
  );
  return data;
}

export async function setRotation(
  choreId: string,
  childIds: string[],
): Promise<Rotation> {
  const { data } = await client.post<Rotation>(
    `/households/me/chores/${choreId}/rotation`,
    { child_ids: childIds },
  );
  return data;
}
