/**
 * "Print wall sheet" prints only the week sheet (see .wall-sheet rules in globals.css);
 * a plain window.print() still prints the whole page.
 */
export function printWallSheet() {
  const root = document.documentElement;
  root.dataset.print = 'week';
  const done = () => {
    delete root.dataset.print;
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.setTimeout(() => {
    window.print();
    // Safari/iOS fires afterprint unreliably — clear the flag defensively too
    window.setTimeout(done, 1200);
  }, 60);
}
