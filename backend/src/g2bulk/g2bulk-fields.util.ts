export interface GameFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'select';
  required: boolean;
  options?: { value: string; label: string }[];
}

const FIELD_LABELS: Record<string, string> = {
  userid: 'User ID',
  user_id: 'User ID',
  player_id: 'Player ID',
  serverid: 'Server ID',
  server_id: 'Server ID',
  server: 'Server',
  charname: 'Character Name',
  character: 'Character Name',
  zone: 'Zone Code',
  zoneid: 'Zone ID',
  zone_id: 'Zone Code',
  roleid: 'Role ID',
  role_id: 'Role ID',
};

export function getFieldLabel(fieldName: string): string {
  const key = fieldName.toLowerCase();
  return FIELD_LABELS[key] ?? fieldName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isServerField(fieldName: string): boolean {
  const key = fieldName.toLowerCase();
  return ['serverid', 'server_id', 'server', 'zone', 'zoneid', 'zone_id'].includes(key);
}

export function buildValidatePayload(
  gameCode: string,
  apiFields: string[],
  values: Record<string, string>,
): Record<string, string> {
  const body: Record<string, string> = { game: gameCode };

  for (const field of apiFields) {
    const value = values[field]?.trim();
    if (!value) continue;
    const key = field.toLowerCase();

    if (key === 'userid' || key === 'user_id' || key === 'player_id') {
      body.user_id = value;
    } else if (key === 'serverid' || key === 'server_id' || key === 'server') {
      body.server_id = value;
    } else if (key === 'zone' || key === 'zoneid' || key === 'zone_id') {
      body.server_id = value;
    } else if (key === 'charname' || key === 'character' || key === 'char_name') {
      body.charname = value;
    } else {
      body[key] = value;
    }
  }

  return body;
}

/** G2Bulk POST /v1/games/:code/order body (see G2BULK_API_ANALYSIS.md) */
export function buildOrderPayload(params: {
  catalogue_name: string;
  catalogue_id?: number;
  playerId?: string | null;
  serverId?: string | null;
  charname?: string | null;
}): Record<string, string | number> {
  const body: Record<string, string | number> = {
    catalogue_name: params.catalogue_name,
  };
  if (params.catalogue_id != null) body.catalogue_id = params.catalogue_id;
  if (params.playerId?.trim()) body.player_id = params.playerId.trim();
  if (params.serverId?.trim()) body.server_id = params.serverId.trim();
  if (params.charname?.trim()) body.charname = params.charname.trim();
  return body;
}

export function buildFieldDefinitions(
  apiFields: string[],
  servers: Record<string, string> | null,
): GameFieldDefinition[] {
  return apiFields.map((field) => {
    const useSelect = isServerField(field) && servers && Object.keys(servers).length > 0;
    return {
      name: field,
      label: getFieldLabel(field),
      type: useSelect ? 'select' : 'text',
      required: true,
      options: useSelect
        ? Object.entries(servers!).map(([label, value]) => ({ value, label }))
        : undefined,
    };
  });
}
