export function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.remove('active');
  });

  document.getElementById(`${viewId}-view`).classList.add('active');
}
