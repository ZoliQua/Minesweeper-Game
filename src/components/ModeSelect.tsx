import { useMessages } from '../arcade';
import { LEVEL_KEY, MESSAGES, type MessageKey } from '../i18n';
import { LEVELS, type Level, type ModeKind, type ModeSelection } from '../logic/modes';

export type ModeSelectProps = {
  mode: ModeSelection;
  /** Classic / hex level to return to when leaving time attack. */
  lastLevel?: Level;
  onChange: (mode: ModeSelection) => void;
};

const KINDS: ReadonlyArray<{ id: ModeKind; label: MessageKey; hint: MessageKey }> = [
  { id: 'classic', label: 'modeClassic', hint: 'hintClassic' },
  { id: 'hex', label: 'modeHex', hint: 'hintHex' },
  { id: 'timeAttack', label: 'modeTimeAttack', hint: 'hintTimeAttack' },
];

/** Mode (Classic / Hexagonal / Time attack) and, for the first two, the level. */
export const ModeSelect = ({ mode, lastLevel, onChange }: ModeSelectProps) => {
  const t = useMessages(MESSAGES);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div className="arc-segmented arc-segmented--full" role="group" aria-label={t('modeGroup')}>
        {KINDS.map(({ id, label, hint }) => (
          <button
            type="button"
            key={id}
            aria-pressed={id === mode.kind}
            title={t(hint)}
            onClick={() => onChange({ kind: id, level: id === 'timeAttack' ? 'beginner' : mode.kind === 'timeAttack' ? (lastLevel ?? 'beginner') : mode.level })}
          >
            {t(label)}
          </button>
        ))}
      </div>
      {mode.kind !== 'timeAttack' && (
        <div className="arc-segmented arc-segmented--full" role="group" aria-label={t('levelGroup')}>
          {LEVELS.map((level) => (
            <button
              type="button"
              key={level}
              aria-pressed={level === mode.level}
              onClick={() => onChange({ kind: mode.kind, level })}
            >
              {t(LEVEL_KEY[level])}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeSelect;
