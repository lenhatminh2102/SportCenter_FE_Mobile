import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Field } from './ui';
import { RelationField } from './relation-field';
import { ui } from './styles';
import { colors } from '@/data/sport';
import { initialValues, resources, validateResource } from '@/utils/resources';
import { referenceLabel, type Entity, type ResourceInput, type ResourceKey } from '@/services/operations';
export function ResourceForm({ resource, initial, token, userId, onSave, onSaved }: {
  resource: ResourceKey; initial?: Entity; token: string; userId: string;
  onSave: (input: ResourceInput) => Promise<unknown>; onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...initialValues(resource, initial), ...(resource === 'activity-logs' ? { userId } : {}) }));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const result = validateResource(resource, values, !!initial);
  const change = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));
  async function save() {
    if (pending.current) return;
    setSubmitted(true); setError('');
    if (Object.keys(result.errors).length) return;
    pending.current = true; setBusy(true);
    try { await onSave(result.payload); onSaved(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được dữ liệu.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <View style={ui.card}>{resources[resource].fields.filter(field => !initial || !field.createOnly).map(field => {
    const fieldError = submitted ? result.errors[field.key] : undefined;
    if (field.relation) return <RelationField key={field.key} label={field.label} path={field.relation} token={token} value={values[field.key]} initialLabel={initial?.[field.key] && typeof initial[field.key] === 'object' ? referenceLabel(initial[field.key]) : undefined} onChange={value => change(field.key, value)} disabled={busy} error={fieldError} />;
    if (field.options) return <View key={field.key} style={{ gap: 8 }}><Text style={ui.heading}>{field.label}</Text><View style={{ gap: 8 }}>{field.options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: values[field.key] === option.value, disabled: busy }} disabled={busy} onPress={() => change(field.key, option.value)} style={{ padding: 13, minHeight: 46, borderRadius: 10, backgroundColor: values[field.key] === option.value ? colors.pale : colors.background }}><Text style={ui.body}>{values[field.key] === option.value ? '●' : '○'} {option.label}</Text></Pressable>)}</View>{!!fieldError && <Text style={ui.error}>{fieldError}</Text>}</View>;
    return <Field key={field.key} label={field.label} value={values[field.key]} onChangeText={value => change(field.key, value)} editable={!busy} error={fieldError} multiline={field.type === 'multiline'} autoCapitalize={field.type === 'id' ? 'none' : 'sentences'} keyboardType={field.type === 'number' ? 'number-pad' : field.type === 'phone' ? 'phone-pad' : 'default'} />;
  })}{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Button disabled={busy} title={busy ? 'Đang lưu…' : 'Lưu thông tin'} onPress={save} /></View>;
}
