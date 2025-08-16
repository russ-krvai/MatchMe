document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("filterForm");
  const activeFiltersCount = document.getElementById("activeFiltersCount");

  // Show "Other" text boxes when selected
  form.querySelectorAll("select").forEach(select => {
    select.addEventListener("change", () => {
      const otherInput = select.nextElementSibling;
      if (select.value === "Other") {
        otherInput.classList.remove("hidden");
      } else {
        otherInput.classList.add("hidden");
        otherInput.value = "";
      }
    });
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const formData = new FormData(form);
    let activeCount = 0;

    formData.forEach((value, key) => {
      if (value && value.trim() !== "") activeCount++;
    });

    activeFiltersCount.textContent = activeCount;

    // TODO: Add actual filtering logic to query facilities
    document.getElementById("results").innerHTML =
      `<p>Searching with ${activeCount} active filters...</p>`;
  });
});
