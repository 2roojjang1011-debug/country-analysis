let gdpChart = null;
let popChart = null;

// 지도
var map = L.map('map').setView([20,0],2)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

map.on('click', async function(e){
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
    const data = await res.json()
    document.getElementById("countries").value = data.address.country
})

// 검색
async function search(){
    let input = document.getElementById("countries").value
    let list = input.split(",").map(s=>s.trim())

    if(!list.includes("South Korea")) list.push("South Korea")

    const res = await fetch(`/compare?countries=${list.join(",")}`)
    const data = await res.json()

    console.log("서버 데이터:", data) // 디버깅

    drawCharts(data)
    makeRanking(data)
    showInfo(data)
    makeQR()
}

// 그래프
function drawCharts(data){
    let labels = []
    let gdpDatasets = []
    let popDatasets = []

    Object.keys(data).forEach(country=>{
        if(!data[country].gdp) return

        let gdp = data[country].gdp
        let pop = data[country].population

        if(labels.length === 0){
            labels = gdp.map(d => d.year)
        }

        gdpDatasets.push({
            label: country,
            data: gdp.map(d => d.value)
        })

        popDatasets.push({
            label: country,
            data: pop.map(d => d.value)
        })
    })

    // 기존 차트 삭제
    if(gdpChart) gdpChart.destroy()
    if(popChart) popChart.destroy()

    gdpChart = new Chart(document.getElementById("gdpChart"), {
        type: 'bar',
        data: { labels, datasets: gdpDatasets }
    })

    popChart = new Chart(document.getElementById("popChart"), {
        type: 'line',
        data: { labels, datasets: popDatasets }
    })
}

// 순위표
function makeRanking(data){
    let ranking = []

    Object.keys(data).forEach(country=>{
        if(data[country].gdp && data[country].gdp.length > 0){
            let latest = data[country].gdp[data[country].gdp.length - 1].value
            ranking.push({country, gdp: latest})
        }
    })

    ranking.sort((a,b)=> b.gdp - a.gdp)

    let html = "<tr><th>순위</th><th>국가</th><th>GDP</th></tr>"

    ranking.forEach((r,i)=>{
        html += `<tr><td>${i+1}</td><td>${r.country}</td><td>${r.gdp.toLocaleString()}</td></tr>`
    })

    document.getElementById("table").innerHTML = html
}

// 국가 정보
function showInfo(data){
    let html = ""

    Object.keys(data).forEach(country=>{
        let i = data[country].info
        if(!i) return

        html += `
        <h3>${i.name}</h3>
        <img src="${i.flag}" width="100"><br>
        수도: ${i.capital}<br>
        인구: ${i.population.toLocaleString()}<br>
        면적: ${i.area} km²<br>
        <hr>
        `
    })

    document.getElementById("info").innerHTML = html
}

// QR
function makeQR(){
    document.getElementById("qr").src =
      "https://api.qrserver.com/v1/create-qr-code/?data=https://data.worldbank.org"
}
