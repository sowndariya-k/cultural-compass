import pandas as pd
import datetime
import google.generativeai as genai

def setup_calendar_model(api_key):
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-pro")

# Hardcoded cultural events data
def get_calendar_data():
    data = [
        {"Event": "Pongal", "Location": "Tamil Nadu", "Event Date": "2025-01-15"},
        {"Event": "Baisakhi", "Location": "Punjab", "Event Date": "2025-04-13"},
        {"Event": "Diwali", "Location": "India", "Event Date": "2025-11-20"},
        {"Event": "Holi", "Location": "India", "Event Date": "2025-03-14"},
        {"Event": "Onam", "Location": "Kerala", "Event Date": "2025-08-28"},
        {"Event": "Navratri", "Location": "Gujarat", "Event Date": "2025-09-22"},
        {"Event": "Christmas", "Location": "India", "Event Date": "2025-12-25"},
        {"Event": "Eid al-Fitr", "Location": "India", "Event Date": "2025-03-31"},
        {"Event": "Ganesh Chaturthi", "Location": "Maharashtra", "Event Date": "2025-08-30"},
        {"Event": "Durga Puja", "Location": "West Bengal", "Event Date": "2025-10-01"},
    ]
    return pd.DataFrame(data)

def get_upcoming_events():
    df = get_calendar_data()
    df["Event Date"] = pd.to_datetime(df["Event Date"])
    upcoming = df[df["Event Date"] >= datetime.datetime.now()]
    return upcoming.to_dict(orient="records")

def get_event_info(model, event_name, location):
    question = f"What is the cultural significance of the festival/event '{event_name}' in {location}?"
    try:
        response = model.generate_content(question)
        return response.text
    except Exception as e:
        return f"Error from Gemini: {e}"
