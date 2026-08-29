import { Alert } from 'react-native';

// Punto único para diálogos heredados mientras preservamos títulos, botones y callbacks.
export const showMessage = (title, message, buttons, options) => Alert.alert(
  title,
  message,
  buttons,
  options,
);

export const showValidationMessage = (message) => Alert.alert('Revisá los datos', message);

export const showErrorMessage = (message) => Alert.alert('No se pudo completar', message);

export const showSuccessMessage = (title, message, onClose) => Alert.alert(
  title,
  message,
  [{ text: 'Cerrar', onPress: onClose }],
);

export const showInfoMessage = (title, message, onClose) => Alert.alert(
  title,
  message,
  [{ text: 'Cerrar', onPress: onClose }],
);

export const showConfirmationMessage = ({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
}) => Alert.alert(title, message, [
  { text: cancelLabel, style: 'cancel' },
  { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
]);
