import pandas as pd
import joblib
from fastapi import FastAPI
from pydantic import BaseModel,Field
from typing import Annotated,Optional,Literal
from fastapi.middleware.cors import CORSMiddleware

model = joblib.load("Mental_Health_Model.pkl")


 

from pydantic import BaseModel

class Student(BaseModel):
    Age:Annotated[int,Field(...,gt=0,lt=120)]
    Gender: Annotated[str,Literal['male','female','other']]
    Country: str
    Academic_Level: Annotated[str,Literal['Undergraduate', 'Graduate', 'High School']]
    Most_Used_Platform: Annotated[str,Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat'],Field(examples=['Facebook'])]
    Purpose_Of_Use: Annotated[str,Literal['Networking', 'Education', 'Entertainment', 'News']]
    Avg_Daily_Usage_Hours: Annotated[float,Field(...,gt=0,lt=24)]
    Daily_Unlocks: int
    Study_Hours: Annotated[float,Field(...,gt=0,lt=24)]
    Physical_Activity_Hours: Annotated[float,Field(...,gt=0,lt=24)]
    Sleep_Hours_Per_Night: Annotated[float,Field(...,gt=0,lt=24)]
    Stress_Level: Annotated[str,Literal['Medium', 'Low', 'Very High', 'High']]





class PredictionRespone(BaseModel):
    predicted_mental_health_score:float





app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def greet():
    return {"message": "Hello"} 

top_countries=['India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']



@app.post('/predict',response_model=PredictionRespone)
def predict(data:Student):

    country_group=(data.Country if data.Country in top_countries else 'Other')
    input_row=pd.DataFrame([{
        'Age':data.Age,
        'Gender':data.Gender,
        'Academic_Level':data.Academic_Level,
        'Most_Used_Platform':data.Most_Used_Platform,
        'Purpose_Of_Use':data.Purpose_Of_Use,
        'Avg_Daily_Usage_Hours':data.Avg_Daily_Usage_Hours,
        'Daily_Unlocks':data.Daily_Unlocks,
        'Study_Hours':data.Study_Hours,
        'Physical_Activity_Hours':data.Physical_Activity_Hours,
        'Sleep_Hours_Per_Night':data.Sleep_Hours_Per_Night,
        'Stress_Level':data.Stress_Level,
        'grouped_country':country_group
    }])


    prediction=model.predict(input_row)[0]
    return PredictionRespone(predicted_mental_health_score=round(float(prediction),2))