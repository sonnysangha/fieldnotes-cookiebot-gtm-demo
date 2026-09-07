import { useLayoutEffect, useRef, type ComponentProps } from "react";

// Native dialog supplies focus trapping, Escape handling and focus restoration.
// Its imperative browser API is synchronized here; callers remain controlled React.
export default function Dialog({
  open,
  onClose,
  children,
  ...props
}: Omit<ComponentProps<"dialog">, "onClose"> & {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);
  return (
    <dialog
      {...props}
      ref={ref}
      onCancel={onClose}
      onClose={onClose}
      closedby="any"
    >
      {children}
    </dialog>
  );
}
