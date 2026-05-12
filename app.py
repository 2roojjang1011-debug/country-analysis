from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__)

# 국가 코드 안전 변환
def get_code(name):
    try:
        res = requests.get(f"https://restcountries.com/v3.1/name/{name}")
        data = res.json()
        return data[0]["cca3"]
    except:
        return None

# 국가 정보
def get_country_info(name):
    try:
        res = requests.get(f"https://restcountries.com/v3.1/name/{name}")
        data = res.json()[0]

        return {
            "name": data["name"]["common"],
            "capital": data.get("capital", ["없음"])[0],
            "population": data["population"],
            "area": data["area"],
            "flag": data["flags"]["png"]
        }
    except:
        return None

# World Bank 데이터 (안전)
def get_data(code):
    try:
        pop_url = f"https://api.worldbank.org/v2/country/{code}/indicator/SP.POP.TOTL?format=json"
        gdp_url = f"https://api.worldbank.org/v2/country/{code}/indicator/NY.GDP.MKTP.CD?format=json"

        pop = requests.get(pop_url).json()[1]
        gdp = requests.get(gdp_url).json()[1]

        pop_data = [{"year": int(d["date"]), "value": d["value"]} for d in pop if d["value"]]
        gdp_data = [{"year": int(d["date"]), "value": d["value"]} for d in gdp if d["value"]]

        # 정렬 (중요)
        pop_data.sort(key=lambda x: x["year"])
        gdp_data.sort(key=lambda x: x["year"])

        return {"population": pop_data, "gdp": gdp_data}
    except:
        return None

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/compare")
def compare():
    names = request.args.get("countries").split(",")

    result = {}

    for name in names:
        name = name.strip()

        code = get_code(name)
        if not code:
            result[name] = {"error": "국가 없음"}
            continue

        data = get_data(code)
        info = get_country_info(name)

        if not data:
            result[name] = {"error": "데이터 없음"}
            continue

        result[name] = {
            "info": info,
            "population": data["population"],
            "gdp": data["gdp"]
        }

    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
