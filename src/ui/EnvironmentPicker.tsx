import { ENVIRONMENTS } from '../core/catalog';
import { confirmEnvironmentPick } from '../core/actions';
import { getEnvironmentPreviewURL } from '../render/environment';

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
              <img className="env-preview" src={getEnvironmentPreviewURL(env)} alt="" draggable={false} />
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
