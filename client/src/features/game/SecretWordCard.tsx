import { Badge } from '../../components/Badge';
import { Panel } from '../../components/Panel';
import type { PrivateRoundInfo } from '../../types/game';

interface SecretWordCardProps {
  privateInfo: PrivateRoundInfo | null;
}

export function SecretWordCard({ privateInfo }: SecretWordCardProps) {
  return (
    <Panel
      title="Your secret word"
      subtitle="Keep this private. Other players should not see your screen."
      action={
        privateInfo ? (
          <Badge tone={privateInfo.role === 'spy' ? 'danger' : 'accent'}>
            {privateInfo.role === 'spy' ? 'Spy' : 'Civilian'}
          </Badge>
        ) : null
      }
    >
      <div className="rounded-3xl bg-night px-6 py-8 text-center text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Secret word</p>
        <div className="mt-3 text-4xl font-semibold">
          {privateInfo?.word || 'Waiting...'}
        </div>
      </div>
    </Panel>
  );
}
