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
