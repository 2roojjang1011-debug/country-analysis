from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

# 국가 코드
def get_code(name):
    try:
        r = requests.get(f"https://restcountries.com/v3.1/name/{name}")
        return r.json()[0]["cca3"]
    except:
        return None

# 국가 정보
def get_info(name):
    try:
        r = requests.get(f"https://restcountries.com/v3.1/name/{name}")
        d = r.json()[0]
        return {
            "name": d["name"]["common"],
            "capital": d.get("capital", ["-"])[0],
            "population": d.get("population", 0),
            "area": d.get("area", 0),
            "flag": d["flags"]["png"]
        }
    except:
        return None

# World Bank 데이터
def get_data(code):
    try:
        pop = requests.get(
            f"https://api.worldbank.org/v2/country/{code}/indicator/SP.POP.TOTL?format=json"
        ).json()[1]

        gdp = requests.get(
            f"https://api.worldbank.org/v2/country/{code}/indicator/NY.GDP.MKTP.CD?format=json"
        ).json()[1]

        pop_data = []
        gdp_data = []

        for p in pop:
            if p["value"]:
                pop_data.append({"year": int(p["date"]), "value": p["value"]})

        for g in gdp:
            if g["value"]:
                gdp_data.append({"year": int(g["date"]), "value": g["value"]})

        pop_data.sort(key=lambda x: x["year"])
        gdp_data.sort(key=lambda x: x["year"])

        return {"population": pop_data, "gdp": gdp_data}

    except:
        return {"population": [], "gdp": []}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/compare")
def compare():
    countries = request.args.get("countries", "").split(",")

    result = {}

    for c in countries:
        c = c.strip()
        code = get_code(c)

        if not code:
            continue

        result[c] = {
            "info": get_info(c),
            "gdp": get_data(code)["gdp"],
            "population": get_data(code)["population"]
        }

    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
