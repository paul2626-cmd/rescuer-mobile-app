import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getApiBaseUrl, getSupabaseClient } from './backend';

export async function downloadCompletionPdf(incidentId: string, filename: string) {
  const session = (await getSupabaseClient().auth.getSession()).data.session;
  if (!session?.access_token) throw new Error('Your session has ended. Please sign in again.');
  const base = getApiBaseUrl();
  if (!base) throw new Error('The API base URL is not configured.');
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) throw new Error('This device does not have a writable file location.');
  const result = await FileSystem.downloadAsync(
    `${base}/api/rescuer/incidents/${encodeURIComponent(incidentId)}/record/pdf`,
    `${directory}${safeName}`,
    { headers: { Authorization: `Bearer ${session.access_token}` } },
  );
  if (result.status < 200 || result.status >= 300) {
    throw new Error(result.status === 404 || result.status === 409
      ? 'The completion PDF is not available yet.'
      : `The PDF could not be downloaded (${result.status}).`);
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Completion report' });
  } else {
    throw new Error('Sharing files is not available on this device.');
  }
}
