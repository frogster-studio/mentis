import { Dialog } from "./dialog";

interface FloorBlockDialogProps {
  message: string;
  onDismiss: () => void;
}

export const FloorBlockDialog = ({ message, onDismiss }: FloorBlockDialogProps) => {
  return (
    <Dialog title="This Question is holding the Theme up" onDismiss={onDismiss}>
      <p>{message}</p>
    </Dialog>
  );
};
