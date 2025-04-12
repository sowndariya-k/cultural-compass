import pandas as pd
import datetime
import google.generativeai as genai

def setup_calendar_model(api_key):
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-pro")

def get_calendar_data():
    return pd.read_csv("calendar_data.csv")  # Or use the hardcoded list

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
