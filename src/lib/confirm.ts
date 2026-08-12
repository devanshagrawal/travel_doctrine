import { useConfirm } from '../store/useConfirm';

// Cross-platform confirmation. Routes to a single styled in-app dialog
// (see ConfirmHost) so it behaves identically on web and native — unlike
// Alert.alert (buttons ignored on web) or window.confirm (blocking/native).
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  opts?: { confirmLabel?: string; destructive?: boolean }
) {
  useConfirm.getState().show({
    title,
    message,
    onConfirm,
    confirmLabel: opts?.confirmLabel,
    destructive: opts?.destructive,
  });
}
