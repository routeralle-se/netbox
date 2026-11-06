import type TomSelect from 'tom-select';

type SelectorTarget = HTMLSelectElement & { tomselect: TomSelect };

const RESULT_LINK = 'a[data-value]';

/**
 * Return the field that the object selector populates, if TomSelect has initialized it
 */
function getTarget(results: HTMLElement): SelectorTarget | null {
  const id = results.dataset.selectorTarget ?? '';
  const target = document.getElementById(id) as SelectorTarget | null;
  return target?.tomselect ? target : null;
}

/**
 * On a multiple-choice field, turn each result into a toggle button which keeps the selector open
 * and shows whether that object is currently selected
 */
function renderToggles(results: HTMLElement, target: SelectorTarget): void {
  const selectedValues = new Set(target.tomselect.items);
  for (const link of results.querySelectorAll<HTMLAnchorElement>(RESULT_LINK)) {
    const selected = selectedValues.has(link.dataset.value ?? '');
    link.removeAttribute('data-bs-dismiss');
    link.setAttribute('role', 'button'); // aria-pressed is not supported on the implicit link role
    link.setAttribute('aria-pressed', String(selected));
    link.classList.toggle('active', selected);
  }
}

/**
 * Add the clicked object to the field or remove it if a multiple-choice field already has it
 */
function toggleSelection(target: SelectorTarget, link: HTMLAnchorElement): void {
  const { label, value } = link.dataset;
  if (value == null) return;
  const { tomselect } = target;

  if (target.multiple && tomselect.items.includes(value)) {
    tomselect.removeItem(value);
  } else {
    tomselect.addOption({ id: value, display: label });
    tomselect.addItem(value);
  }
}

export function initObjectSelector(): void {
  const results = document.getElementById('selector_results');
  if (!results) return;

  const target = getTarget(results);
  if (!target) return;

  if (target.multiple) renderToggles(results, target);

  // This runs after every HTMX swap on the page so only bind the click handler once per selector.
  // The results container persists while the user filters, only its contents are replaced.
  if (results.dataset.selectorBound) return;
  results.dataset.selectorBound = 'true';

  results.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>(RESULT_LINK);
    if (link == null) return;
    event.preventDefault();
    toggleSelection(target, link);
    if (target.multiple) renderToggles(results, target);
  });
}
