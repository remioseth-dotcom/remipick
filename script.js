async function fetchDraws() {
  const response = await fetch("https://eurojackpot-api.svein.dev/latest?limit=100");
  const data = await response.json();

  return data.map(draw => ({
    date: draw.date,
    main: draw.numbers,
    stars: draw.euroNumbers
  }));
}

function getWeekday(dateStr) {
  const date = new Date(dateStr);
  return date.getDay() === 2 ? "Tirsdag" : "Fredag";
}

function getTop(arr, count) {
  return arr.map((val, i) => ({ num: i, freq: val }))
            .filter(obj => obj.num > 0)
            .sort((a, b) => b.freq - a.freq)
            .slice(0, count)
            .map(obj => obj.num);
}

function buildStats(drawList) {
  const main = Array(51).fill(0);
  const stars = Array(13).fill(0);
  drawList.forEach(draw => {
    draw.main.forEach(n => main[n]++);
    draw.stars.forEach(s => stars[s]++);
  });
  return { main, stars };
}

function renderChart(stats) {
  let chart = '';
  for (let i = 1; i <= 50; i++) {
    if (stats.main[i] > 0) {
      chart += `${i.toString().padStart(2, '0')}: ${'█'.repeat(stats.main[i])} (${stats.main[i]})\n`;
    }
  }
  return chart;
}

function generatePick(dayType, stats) {
  const pick = getTop(stats.main, 5).sort((a, b) => a - b);
  const stars = getTop(stats.stars, 2).sort((a, b) => a - b);
  document.getElementById("remiPick").textContent =
    `Remis ${dayType === "tuesday" ? "tirsdags" : "fredags"}forslag: ${pick.join(', ')} ★ ${stars.join(', ')}`;
}

window.onload = async function () {
  const draws = await fetchDraws();

  const uniqueYears = [...new Set(draws.map(d => d.date.slice(0, 4)))].sort().reverse();
  const yearSelect = document.getElementById("yearSelect");
  uniqueYears.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
  yearSelect.value = uniqueYears[0];

  function applyFilter() {
    const selectedYear = yearSelect.value;
    const selectedMonth = document.getElementById("monthSelect").value;

    const filtered = draws.filter(d => {
      const [year, month] = d.date.split("-");
      return year === selectedYear && (selectedMonth === "all" || month === selectedMonth);
    });

    const tuesdayDraws = filtered.filter(d => getWeekday(d.date) === "Tirsdag");
    const fridayDraws = filtered.filter(d => getWeekday(d.date) === "Fredag");

    const tuesdayStats = buildStats(tuesdayDraws);
    const fridayStats = buildStats(fridayDraws);
    const allStats = buildStats(filtered);

    document.getElementById("drawList").innerHTML = "";
    filtered.forEach(draw => {
      const li = document.createElement("li");
      const weekday = getWeekday(draw.date);
      li.textContent = `${weekday} ${draw.date}: ${draw.main.join(", ")} ★ ${draw.stars.join(", ")}`;
      document.getElementById("drawList").appendChild(li);
    });

    document.getElementById("mostTuesdayMain").textContent = "Mest trukket hovedtall (tirsdag): " + getTop(tuesdayStats.main, 5).join(", ");
    document.getElementById("mostTuesdayStars").textContent = "Mest trukket stjernetall (tirsdag): " + getTop(tuesdayStats.stars, 5).join(", ");

    document.getElementById("mostFridayMain").textContent = "Mest trukket hovedtall (fredag): " + getTop(fridayStats.main, 5).join(", ");
    document.getElementById("mostFridayStars").textContent = "Mest trukket stjernetall (fredag): " + getTop(fridayStats.stars, 5).join(", ");

    document.getElementById("freqChart").textContent = renderChart(allStats);
    document.getElementById("freqTuesday").textContent = renderChart(tuesdayStats);
    document.getElementById("freqFriday").textContent = renderChart(fridayStats);

    document.querySelector('button[onclick*="tuesday"]').onclick = () => generatePick("tuesday", tuesdayStats);
    document.querySelector('button[onclick*="friday"]').onclick = () => generatePick("friday", fridayStats);
  }

  yearSelect.onchange = () => {
    document.getElementById("monthSelect").value = "all";
    applyFilter();
  };
  document.getElementById("monthSelect").onchange = applyFilter;

  applyFilter();
};
