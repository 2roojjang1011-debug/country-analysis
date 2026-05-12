var map = L.map('map').setView([20,0],2)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

// 지도 클릭
map.on('click', async function(e){
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
    const data = await res.json()
    document.getElementById("countries").value = data.address.country
})

async function search(){
    let input = document.getElementById("countries").value
    let list = input.split(",")

    if(!list.includes("South Korea")) list.push("South Korea")

    const res = await fetch(`/compare?countries=${list.join(",")}`)
    const data = await res.json()

    drawCharts(data)
    makeRanking(data)
    showInfo(data)
}

function drawCharts(data){
    const countries = Object.keys(data)

    let labels = []
    let gdpDatasets = []
    let popDatasets = []

    countries.forEach(country=>{
        if(data[country].gdp){

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
        }
    })

    new Chart(document.getElementById("gdpChart"), {
        type: 'bar',
        data: { labels, datasets: gdpDatasets }
    })

    new Chart(document.getElementById("popChart"), {
        type: 'line',
        data: { labels, datasets: popDatasets }
    })
}

function makeRanking(data){
    let ranking = []

    Object.keys(data).forEach(country=>{
        if(data[country].gdp){
            let latest = data[country].gdp.slice(-1)[0].value
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

function showInfo(data){
    let html = ""

    Object.keys(data).forEach(country=>{
        let i = data[country].info
        if(i){
            html += `
            <h3>${i.name}</h3>
            <img src="${i.flag}" width="100"><br>
            수도: ${i.capital}<br>
            인구: ${i.population.toLocaleString()}<br>
            면적: ${i.area} km²<br>
            <hr>
            `
        }
    })

    document.getElementById("info").innerHTML = html
}
