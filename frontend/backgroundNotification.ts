import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
  if (error) {
    console.error('Background notification task error:', error);
    return;
  }
  if (data) {
    const { notification } = data as { notification: Notifications.Notification };
    console.log('Background notification received:', notification);
  }
});

export async function registerBackgroundNotificationTask() {
  await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
}
