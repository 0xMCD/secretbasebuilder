import { ENVIRONMENTS } from '../core/catalog';
import { confirmEnvironmentPick } from '../core/actions';

const WEATHER_ICON: Record<string, string> = {
  sunny: '☀️',
  rain: '🌧️',
  snow: '❄️',
  night: '🌙',
};

/** Start-screen: one pick = aboveground structure + weather + dirt. */
export function EnvironmentPicker() {
  return (
    <div className="env-modal-backdrop">
      <div className="env-modal">
        <h1>🕵️ Secret Base Builder</h1>
        <p>Every secret base starts with a disguise. Pick where yours hides:</p>
        <div className="env-grid">
          {ENVIRONMENTS.map((env) => (
            <button key={env.id} className="env-card" onClick={() => confirmEnvironmentPick(env.id)}>
              <div className="env-swatches">
                <span style={{ background: env.palette.skyTop }} />
                <span style={{ background: env.palette.structureMain }} />
                <span style={{ background: env.palette.surface }} />
                <span style={{ background: env.palette.dirt }} />
              </div>
              <div className="env-name">
                {WEATHER_ICON[env.weather]} {env.name}
              </div>
              <div className="env-blurb">{env.blurb}</div>
            </button>
          ))}
        </div>
        <p className="env-hint">You can change this any time from the top bar — your rooms stay put.</p>
      </div>
    </div>
  );
}
