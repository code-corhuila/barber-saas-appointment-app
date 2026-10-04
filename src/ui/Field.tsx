import { IonInput, IonTextarea } from '@ionic/react';

interface FieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  inputMode?: 'text' | 'numeric';
  multiline?: boolean;
  placeholder?: string;
  onChange(value: string): void;
}

/** A labelled input whose error is tied to it with aria-describedby (annex H), as in identity-auth-app. */
export function Field({ id, label, value, error, inputMode = 'text', multiline, placeholder, onChange }: FieldProps) {
  const errorId = `${id}-error`;
  const common = {
    id, label, value, placeholder,
    labelPlacement: 'stacked' as const,
    'aria-invalid': error ? 'true' as const : 'false' as const,
    'aria-describedby': error ? errorId : undefined,
  };
  return (
    <div className="ap-field">
      {multiline
        ? <IonTextarea {...common} autoGrow onIonInput={(e) => onChange(String(e.detail.value ?? ''))} />
        : <IonInput {...common} inputmode={inputMode} onIonInput={(e) => onChange(String(e.detail.value ?? ''))} />}
      {error && <div id={errorId} className="ap-field-error">{error}</div>}
    </div>
  );
}
