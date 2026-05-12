var map = L.map('map').setView([20,0],2)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

// 지도 클릭 → 국가 자동 입력
map.on('click', async function(e){
    const lat = e.latlng.lat
    const lon = e.latlng.lng

    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    const data = await res.json()

    document.getElementById("countries").value = data.address.country
})

// 검색
async function search(){
    let input = document.getElementById("countries").value
    let list = input.split(",")

    if(!list.includes("South Korea")) list.push("South Korea")

    const res = await fetch(`/compare?countries=${list.join(",")}`)
    const data = await res.json()

    drawCharts(data)
    makeRanking(data)
    showInfo(data)

    document.getElementById("qr").src =
      "https://api.qrserver.com/v1/create-qr-code/?data=https://data.worldbank.org"
}

// 그래프
function drawCharts(data){
    const first = Object.keys(data)[0]
    const labels = data[first].data.gdp.map(d => d.year)

    const gdpDatasets = Object.keys(data).map(country => ({
        label: country,
        data: data[country].data.gdp.map(d => d.value)
    }))

    new Chart(document.getElementById("barChart"), {
        type: 'bar',
        data: { labels, datasets: gdpDatasets }
    })

    const popDatasets = Object.keys(data).map(country => ({
        label: country,
        data: data[country].data.population.map(d => d.value)
    }))

    new Chart(document.getElementById("lineChart"), {
        type: 'line',
        data: { labels, datasets: popDatasets }
    })
}

// 순위표
function makeRanking(data){
    let ranking = []

    Object.keys(data).forEach(country=>{
        if(data[country].data){
            let latest = data[country].data.gdp[0].value
            ranking.push({country, gdp: latest})
        }
    })

    ranking.sort((a,b)=> b.gdp - a.gdp)

    let html = "<tr><th>순위</th><th>국가</th><th>GDP</th></tr>"

    ranking.forEach((r,i)=>{
        html += `<tr><td>${i+1}</td><td>${r.country}</td><td>${r.gdp}</td></tr>`
    })

    document.getElementById("table").innerHTML = html
}

// 국가 정보
function showInfo(data){
    let html = ""

    Object.keys(data).forEach(country=>{
        if(data[country].info){
            let i = data[country].info

            html += `
            <h3>${country}</h3>
            <img src="${i.flag}" width="100"><br>
            공식명: ${i.official_name}<br>
            수도: ${i.capital}<br>
            지역: ${i.region} (${i.subregion})<br>
            인구: ${i.population.toLocaleString()}<br>
            면적: ${i.area} km²<br>
            언어: ${i.languages.join(", ")}<br>
            통화: ${i.currency.join(", ")}<br>
            시간대: ${i.timezones.join(", ")}<br>
            <a href="${i.maps}" target="_blank">지도 보기</a>
            <hr>
            `
        }
    })

    document.getElementById("info").innerHTML = html
}
