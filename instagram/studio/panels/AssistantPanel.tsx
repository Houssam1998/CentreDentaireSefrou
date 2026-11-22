/** Panneau « Assistant IA » : conversation avec Claude, qui crée et retouche la publication dans le Studio. */
import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../store/editor';
import { useAssistant, checkStatus, send, newConversation, undoAssistant } from '../ai/client';
import { Icon } from '../ui/Icon';

const SUGGESTIONS = [
  'Prépare la publication de la prochaine fête',
  'Que penses-tu de ce visuel ? Améliore-le.',
  'Propose 3 légendes pour cette publication',
  'Crée un conseil sur le brossage des dents',
  'Traduis le titre en arabe',
];

export function AssistantPanel() {
  const { status, statusText, model, used, limit, bubbles, busy, lastResult } = useAssistant();
  const project = useEditor((s) => s.project);
  const [text, setText] = useState('');
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => { if (useAssistant.getState().status === 'unknown') void checkStatus(); }, []);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [bubbles]);

  if (status === 'unknown') return <p className="sp-hint">Connexion à l’assistant…</p>;
  if (status === 'off') {
    return (
      <div className="ai">
        <p className="sp-warn">{statusText}</p>
        <p className="sp-hint">L’assistant crée et retouche les visuels à votre demande, écrit les légendes (français + darija) et vérifie les règles de déontologie.</p>
      </div>
    );
  }

  const submit = (t = text) => {
    if (!t.trim() || busy) return;
    setText('');
    void send(t);
  };

  return (
    <div className="ai">
      <div className="ai-list" ref={list} aria-live="polite">
        {bubbles.length === 0 ? (
          <div className="ai-intro">
            <p>Bonjour ! Dites-moi quelle publication préparer, ou ce qu’il faut changer sur la page affichée.</p>
            <div className="ai-sugg">
              {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip" onClick={() => submit(s)}>{s}</button>)}
            </div>
          </div>
        ) : null}
        {bubbles.map((b) => (
          <div key={b.id} className={`ai-msg ${b.role}`}>{b.role === 'tool' ? <><Icon name="sparkles" size={13} /> {b.text}</> : b.text}</div>
        ))}
        {busy ? <div className="ai-msg tool ai-wait"><span className="dots" aria-label="L’assistant travaille" /> Évitez de modifier la page pendant ce temps.</div> : null}
      </div>

      {lastResult && lastResult === project && !busy ? (
        <button type="button" className="btn wide" onClick={undoAssistant}><Icon name="undo" size={16} /> Annuler ce que l’IA a fait</button>
      ) : null}

      <form className="ai-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <textarea
          value={text}
          rows={3}
          placeholder="Ex. : Prépare un visuel pour l’Aïd al-Adha, ambiance soirée"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          disabled={busy}
          aria-label="Votre demande à l’assistant"
        />
        <div className="row">
          <button type="button" className="btn ghost" onClick={newConversation} disabled={busy || !bubbles.length}>Nouvelle conversation</button>
          <span className="grow" />
          <button type="submit" className="btn primary" disabled={busy || !text.trim()}>Envoyer</button>
        </div>
      </form>
      <p className="sp-hint">Claude ({model}) · {used}/{limit} échanges aujourd’hui. Relisez toujours les textes avant de publier ; tout texte médical est validé par le Dr El Omari.</p>
    </div>
  );
}
