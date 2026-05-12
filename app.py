from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__)

# 국가 코드
def get_code(name):
    res = requests.get(f"https://restcountries.com/v3.1/name/{name}")
    return res.json()[0]["cca3"]

# 국가 기본 정보
def get_country_info(name):
    res = requests.get(f"https://restcountries.com/v3.1/name/{name}")
    data = res.json()[0]

    return {
        "official_name": data["name"]["official"],
        "capital": data.get("capital", ["없음"])[0],
        "region": data["region"],
        "subregion": data.get("subregion", ""),
        "population": data["population"],
        "area": data["area"],
        "languages": list(data.get("languages", {}).values()),
        "currency": list(data.get("currencies", {}).keys()),
        "timezones": data["timezones"],
        "flag": data["flags"]["png"],
        "maps": data["maps"]["googleMaps"]
    }

# World Bank 데이터
def get_data(code):
    pop_url = f"https://api.worldbank.org/v2/country/{code}/indicator/SP.POP.TOTL?format=json"
    gdp_url = f"https://api.worldbank.org/v2/country/{code}/indicator/NY.GDP.MKTP.CD?format=json"

    pop = requests.get(pop_url).json()[1]
    gdp = requests.get(gdp_url).json()[1]

    return {
        "population": [{"year": d["date"], "value": d["value"]} for d in pop if d["value"]],
        "gdp": [{"year": d["date"], "value": d["value"]} for d in gdp if d["value"]]
    }

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/compare")
def compare():
    names = request.args.get("countries").split(",")

    result = {}

    for name in names:
        try:
            name = name.strip()
            code = get_code(name)

            result[name] = {
                "info": get_country_info(name),
                "data": get_data(code)
            }
        except:
            result[name] = {"error": "데이터 없음"}

    return jsonify(result)

# Render 배포용
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
