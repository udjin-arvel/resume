import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Лёгкая отдача при добавлении в избранное (web без haptics). */
export async function hapticFavoriteAdded(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // На симуляторе haptics может быть недоступен.
  }
}
