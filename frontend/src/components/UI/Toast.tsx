import { Toaster } from 'sonner';

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a2e',
          border: '1px solid #2a2a3a',
          color: '#e8e6e3',
        },
      }}
    />
  );
}
