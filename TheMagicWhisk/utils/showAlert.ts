import { Alert, Platform } from 'react-native';

// Alert.alert() is a no-op on web in react-native-web, so route through window.alert there.
export const showAlert = (title: string, message?: string, onDismiss?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    onDismiss?.();
    return;
  }

  Alert.alert(title, message, onDismiss ? [{ text: 'OK', onPress: onDismiss }] : undefined);
};

// Alert.alert's button array (Cancel/Confirm) doesn't render on web either, so this
// falls back to window.confirm there, which returns a boolean synchronously.
export const showConfirm = (
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  options?: { destructive?: boolean; cancelLabel?: string }
) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: options?.cancelLabel ?? 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: options?.destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
};
