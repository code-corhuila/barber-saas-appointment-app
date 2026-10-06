/**
 * The look of the prototype: dark background, cards a shade lighter, gold accent. Scoped to .ap-root
 * with its own prefix, so it never collides with another domain app's styles in the same page.
 */
export const STYLES = `
.ap-root { min-height: 100%; background: #121212; color: #fff; padding-bottom: 5rem; }
.ap-page { max-width: 40rem; margin: 0 auto; padding: 1rem; }
.ap-header { font-size: 1.375rem; font-weight: 700; margin: .5rem 0 .75rem; }
.ap-center { display: grid; place-items: center; gap: .75rem; padding: 3rem 1rem; text-align: center; }
.ap-error { color: #ff6b6b; margin: 0; }
.ap-empty { color: #888; text-align: center; margin-top: 2.5rem; }
.ap-hint { color: #888; font-size: .8rem; margin: -.25rem 0 .75rem; }
.ap-primary { --background: #d4af37; --color: #121212; --border-radius: 10px; font-weight: 700; }
.ap-secondary { --color: #d4af37; --border-color: #d4af37; --border-radius: 10px; }
.ap-search { --background: #1e1e1e; --color: #fff; --placeholder-color: #888; --icon-color: #d4af37; padding: 0 0 .5rem; }
.ap-card { display: flex; gap: .75rem; align-items: center; width: 100%; background: #1e1e1e; border: 1px solid transparent;
  border-radius: 12px; padding: .75rem; margin-bottom: .75rem; color: #fff; text-align: left; cursor: pointer; font: inherit; }
.ap-card.selected { border-color: #d4af37; }
.ap-card.inactive { opacity: .5; }
.ap-card > :last-child { margin-bottom: 0; }
.ap-logo { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex: none; background: #2a2a2a;
  display: grid; place-items: center; color: #d4af37; font-size: 1.5rem; font-weight: 700; }
.ap-grow { flex: 1; min-width: 0; }
.ap-title { font-size: 1rem; font-weight: 600; margin: 0; }
.ap-gold { color: #d4af37; font-size: .8rem; margin: .15rem 0 0; }
.ap-muted { color: #aaa; font-size: .8rem; margin: .15rem 0 0; }
.ap-price { color: #d4af37; font-weight: 700; white-space: nowrap; }
.ap-section { font-size: 1.05rem; font-weight: 700; margin: 1.5rem 0 .75rem; }
.ap-banner { width: 100%; height: 160px; object-fit: cover; border-radius: 12px; }
.ap-chips { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .4rem; }
.ap-chip { background: #2a2a2a; color: #d4af37; border-radius: 999px; padding: .1rem .6rem; font-size: .75rem; }
.ap-footer { position: fixed; left: 0; right: 0; bottom: 0; padding: .75rem 1rem; background: #121212;
  border-top: 1px solid #2a2a2a; }
.ap-tabs { --background: #1e1e1e; margin-bottom: .75rem; }
.ap-tabs ion-segment-button { --color: #888; --color-checked: #d4af37; --indicator-color: #d4af37; }
.ap-field { margin-bottom: .75rem; }
.ap-field ion-input, .ap-field ion-textarea { --background: #1e1e1e; --color: #fff; --placeholder-color: #666;
  --border-radius: 10px; --padding-start: 12px; --highlight-color-focused: #d4af37; }
.ap-field-error { color: #ff6b6b; font-size: .8rem; margin-top: .3rem; }
.ap-alert { background: #2a1414; border: 1px solid #ff6b6b; color: #ffb3b3; border-radius: 10px; padding: .75rem;
  margin: .5rem 0; font-size: .875rem; }
.ap-modal { --background: #121212; }
.ap-remove { background: none; border: 0; color: #ff6b6b; font-size: 1.4rem; cursor: pointer; padding: 0 .25rem; }
.ap-ok { background: #142a17; border: 1px solid #4caf50; color: #b9f6c3; border-radius: 10px; padding: .75rem;
  margin: .5rem 0; font-size: .875rem; }
.ap-badge { border-radius: 999px; padding: .15rem .6rem; font-size: .75rem; font-weight: 700; color: #121212; white-space: nowrap; }
.ap-row { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
.ap-time { font-size: 1.25rem; font-weight: 700; color: #d4af37; margin: 0; }
.ap-days, .ap-slots { display: flex; gap: .5rem; overflow-x: auto; padding-bottom: .25rem; }
.ap-slots { flex-wrap: wrap; overflow: visible; }
.ap-days { margin-bottom: .75rem; }
.ap-chip-button { background: #1e1e1e; color: #fff; border: 1px solid #2a2a2a; border-radius: 8px; padding: .5rem .9rem;
  font: inherit; font-size: .85rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
.ap-chip-button.selected { background: #d4af37; border-color: #d4af37; color: #121212; }
.ap-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }
.ap-danger { --color: #ff6b6b; --border-color: #ff6b6b; --border-radius: 10px; }
.ap-reason { color: #aaa; font-size: .8rem; font-style: italic; margin: .35rem 0 0; }
`;
