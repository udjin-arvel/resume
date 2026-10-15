type ToastType = 'error' | 'success';

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

const TOAST_DURATION_MS = 5000;

export function useToast() {
  const toast = useState<ToastState>('app-toast', () => ({
    show: false,
    message: '',
    type: 'error',
  }));

  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const clearHideTimer = () => {
    if (hideTimer !== undefined) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }
  };

  const show = (message: string, type: ToastType = 'error') => {
    clearHideTimer();
    toast.value = { show: true, message, type };
    hideTimer = setTimeout(() => {
      toast.value = { ...toast.value, show: false };
      hideTimer = undefined;
    }, TOAST_DURATION_MS);
  };

  const error = (message: string) => show(message, 'error');
  const success = (message: string) => show(message, 'success');

  const hide = () => {
    clearHideTimer();
    toast.value = { ...toast.value, show: false };
  };

  return { toast, show, error, success, hide };
}
