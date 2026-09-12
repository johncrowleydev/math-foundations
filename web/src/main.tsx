import { createRoot } from 'react-dom/client';
import { AuthGate } from './AuthGate';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { loadCurriculum } from './types';
import 'katex/dist/katex.min.css';
import './styles.css';
registerSW({});
const root = createRoot(document.getElementById('root')!);
root.render(<p className="loading">Opening Foundations…</p>);
loadCurriculum()
  .then((data) =>
    root.render(
      <AuthGate>
        <App data={data} />
      </AuthGate>,
    ),
  )
  .catch((error) =>
    root.render(
      <div className="loading">
        <h1>Could not open the notebook</h1>
        <p>{String(error)}</p>
        <button onClick={() => location.reload()}>Retry</button>
      </div>,
    ),
  );
