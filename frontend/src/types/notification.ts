export interface INotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
}
