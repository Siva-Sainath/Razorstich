import { useSearchParams } from 'react-router-dom';

/** True when demo is opened with ?record=1 for screen recording. */
export function useRecordMode() {
  const [searchParams] = useSearchParams();
  return searchParams.get('record') === '1';
}

export const RECORD_PLAYBACK_SPEED = 0.65;
