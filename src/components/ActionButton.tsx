/**
 * NOT A NINTH PRIMITIVE. This is a composition of FormLabel + Lantern with the
 * standard 44x44 touch target, extracted only because the same eight lines were
 * appearing on every screen. It introduces no new visual idea — if you find yourself
 * adding a variant here that changes how it looks rather than what it says, the
 * screen is wrong (CLAUDE.md, "Component discipline").
 */
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { FormLabel, Lantern } from './primitives';
import { color, radius, space, type ColorToken } from '@/theme/tokens';

export type ActionButtonProps = {
  label: string;
  onPress?: () => void;
  /** office = primary action. stamp = destructive. Nothing else. */
  tone?: 'office' | 'stamp' | 'quiet';
  lantern?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TONES: Record<
  NonNullable<ActionButtonProps['tone']>,
  { bg: string | undefined; fg: ColorToken; border?: string }
> = {
  office: { bg: color.office, fg: 'stock' },
  stamp: { bg: color.stamp, fg: 'stock' },
  quiet: { bg: undefined, fg: 'wallTextDim', border: color.brass },
};

export function ActionButton({
  label,
  onPress,
  tone = 'office',
  lantern = false,
  disabled = false,
  style,
}: ActionButtonProps) {
  const t = TONES[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          // Minimum touch target 44x44 (docs/04-design-system.md, Accessibility).
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          paddingVertical: 13,
          paddingHorizontal: space.lg,
          borderRadius: radius.md,
          backgroundColor: t.bg,
          borderWidth: t.border ? 1 : 0,
          borderColor: t.border,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {lantern ? <Lantern size={14} tone={t.fg} /> : null}
      <FormLabel size={12} tracking={2.6} tone={t.fg}>
        {label}
      </FormLabel>
    </Pressable>
  );
}
