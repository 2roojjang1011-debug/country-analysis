let gdpChart = null;
let popChart = null;

// 지도
var map = L.map('map').setView([20,0],2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

map.on('click', async function(e){
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`);
    const data = await res.json();
    document.getElementById("countries").value = data.address.country || "";
});

// 검색
async function search(){

    let input = document.getElementById("countries").value;
    if(!input) return;

    let list = input.split(",").map(x => x.trim()).filter(x => x);

    const res = await fetch(`/compare?countries=${list.join(",")}`);
    const data = await res.json();

    draw(data);
    table(data);
    info(data);
}

// 그래프
function draw(data){

    let labels = [];
    let gdpSet = [];
    let popSet = [];

    Object.keys(data).forEach(c => {

        let g = data[c].gdp || [];
        let p = data[c].population || [];

        if(g.length === 0) return;

        if(labels.length === 0){
            labels = g.map(x => x.year);
        }

        gdpSet.push({
            label: c,
            data: g.map(x => x.value)
        });

        popSet.push({
            label: c,
            data: p.map(x => x.value)
        });
    });

    if(gdpChart) gdpChart.destroy();
    if(popChart) popChart.destroy();

    gdpChart = new Chart(document.getElementById("gdpChart"), {
        type: "bar",
        data: { labels, datasets: gdpSet }
    });

    popChart = new Chart(document.getElementById("popChart"), {
        type: "line",
        data: { labels, datasets: popSet }
    });
}

// 순위
function table(data){

    let arr = [];

    Object.keys(data).forEach(c => {
        let g = data[c].gdp;
        if(!g || g.length === 0) return;

        arr.push({
            name: c,
            value: g[g.length - 1].value
        });
    });

    arr.sort((a,b) => b.value - a.value);

    let html = "<tr><th>순위</th><th>국가</th><th>GDP</th></tr>";

    arr.forEach((x,i)=>{
        html += `<tr><td>${i+1}</td><td>${x.name}</td><td>${x.value.toLocaleString()}</td></tr>`;
    });

    document.getElementById("table").innerHTML = html;
}

// 정보
function info(data){

    let html = "";

    Object.keys(data).forEach(c=>{
        let i = data[c].info;
        if(!i) return;

        html += `
        <h3>${i.name}</h3>
        <img src="${i.flag}" width="80"><br>
        수도: ${i.capital}<br>
        인구: ${i.population.toLocaleString()}<br>
        면적: ${i.area}<br>
        <hr>
        `;
    });

    document.getElementById("info").innerHTML = html;
}      "https://api.qrserver.com/v1/create-qr-code/?data=https://data.worldbank.org"
}
