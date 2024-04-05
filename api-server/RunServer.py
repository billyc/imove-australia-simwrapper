#!/usr/bin/env python3

# RunServer.py #######################################################
# This is the iMOVE data API.
#
# It does one thing: it is a REST API application which can run in the
# cloud somewhere and accepts data requests, queries the parquet files,
# and returns the JSON result of the query.


import os,setuptools,json
from os.path import exists
import sys,tempfile,random,shutil
from datetime import datetime, timedelta

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_restful import Resource, Api, reqparse

import pandas as pd
from pyspark.conf import SparkConf
from pyspark.sql import SparkSession
from pyspark.sql.functions import to_json, udf
from pyspark.sql.types import StringType


# Storage volume expected to be mounted on /data:
folder = '/data/sample-data/computed'
points_folder = '/data/sample-data/trip-points'

#folder = '/data/parquet-data/computed'
#points_folder = '/data/parquet-data/trip-points'

# Set up API keys ------------------------------
authfile = 'auth-keys.csv'  # username,key
valid_api_keys = {}

def setup_auth_keys(authfile):
    print('-- SETTING UP API AUTH KEYS')

    lookup = {}
    # keys from API_KEYS env variable
    if 'API_KEYS' in os.environ:
        env_api_keys = [key.strip() for key in os.environ['API_KEYS'].split(',')]
        for key in env_api_keys:
            split = key.split('-')
            lookup[key] = len(split) > 1 and split[0] or 'user'

    # keys from auth_keys.csv
    try:
        with open(authfile,'r') as keys:
            for line in keys:
                line = line.strip()
                if line.startswith('#'): continue
                items = line.split(',')
                if len(items) >= 2: lookup[items[1]] = items[0]
    except:
       print("\n**\nAuth keyfile not found: ", authfile)

    # No keys? Abort
    if len(lookup.keys()) == 0:
        raise RuntimeError("\n***\nNo valid API keys. Provide keyfile or set API_KEYS env variable.")
        sys.exit(1)

    print("\n*** IMOVE API SERVER")
    print("*** Valid API users:", ", ".join(lookup.values()), '\n')
    return lookup

def is_valid_api_key():
    apikey = request.headers.get('Authorization')
    if apikey in valid_api_keys: return True
    return False


valid_api_keys = setup_auth_keys(authfile)

# ------ SET UP SPARK
spark = (
   SparkSession.builder.appName("CompassIoT")
   .config("spark.sql.repl.eagerEval.enabled", True)
   .config("spark.sql.parquet.cacheMetadata", "true")
   .config("spark.executor.memory", "8g")
   .config("spark.driver.memory", "8g")
   .config("org.xerial.snappy.use.systemlib", True)
   .config("org.xerial.snappy.lib.path","/usr/lib/libsnappyjava.so")
   .config("spark.sql.session.timeZone", "Etc/UTC")
   .getOrCreate()
)


# initialize spark dataframe
df = spark.read.parquet(folder)
df.printSchema()

points = spark.read.parquet(points_folder)


# ---------- Set up Flask ----------------------------
# Flask API

app = Flask(__name__)
CORS(app)

valid_api_keys = setup_auth_keys(authfile)

@app.route('/location', methods=['GET'])
def filter_by_location():
    if not is_valid_api_key(): return "Invalid API Key", 403

    lon = float(request.args.get('lon'))
    lat = float(request.args.get('lat'))

    radius = request.args.get('radius')
    radius = radius and float(radius) or 0.001  # default radius

    if not lon: return []
    if not lat: return []

    lon_lo = lon - radius
    lon_hi = lon + radius
    lat_lo = lat - radius
    lat_hi = lat + radius

    filtered_points = points
    filtered_points = filtered_points.filter(filtered_points.lon.between(lon_lo, lon_hi))
    filtered_points = filtered_points.filter(filtered_points.lat.between(lat_lo, lat_hi))

    # only return one row per TripID
    filtered_points = filtered_points.select('TripID').distinct()

    # output
    json = filtered_points.toPandas().to_json(orient='records')
    return json


@app.route('/path', methods=['GET'])
def get_path():
    if not is_valid_api_key(): return "Invalid API Key", 403

    # Get query parameters
    trip = request.args.get('trip')
    if not trip: raise RuntimeError('need trip')

    day_of_week = request.args.get('day_of_week')
    is_weekday = request.args.get('is_weekday')
    start_time = request.args.get('start_time')
    veh_types = request.args.get('veh_type')

    trips = trip.split(',')
    # print(trips)

    # fetch selected trips
    filtered_df = df.filter(df.TripID.isin(trips))

    if day_of_week != None:
        filtered_df = filtered_df.filter(filtered_df.day_of_week==day_of_week)
    if is_weekday != None:
        filtered_df = filtered_df.filter(filtered_df.is_weekday==is_weekday)
    if veh_types:
        filtered_df = filtered_df.filter(filtered_df.veh_types == veh_types)
    if start_time:
        filtered_df = filtered_df.filter(filtered_df.start_time.startswith(start_time))

    # trimmed = filtered_df.select(['TripID', 'path', 'Timestamp_path'])
    trimmed = filtered_df.select(['TripID', 'Path1','Timestamp_path','Speed_path','start_time'])

    json = trimmed.toPandas().to_json(orient='records')
    return json


@app.route('/filter', methods=['GET'])
def filter_dataframe():
    if not is_valid_api_key(): return "Invalid API Key", 403

    # Get query parameters
    vehicle = request.args.get('vehicle')
    veh_type = request.args.get('veh_type')
    trip = request.args.get('trip')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_time')
    start_lon = request.args.get('start_lon')
    start_lat = request.args.get('start_lat')
    end_lon = request.args.get('end_lon')
    end_lat = request.args.get('end_lat')
    distance = request.args.get('distance')
    duration = request.args.get('total_time')

    day_of_week = request.args.get('day_of_week')
    is_weekday = request.args.get('is_weekday')
    start_time = request.args.get('start_time')

    filtered_df = df

    # Apply filters
    if start_date:
        filtered_df = filtered_df.filter(filtered_df.start_date==start_date)
    if end_date:
        filtered_df = filtered_df.filter(filtered_df.end_date==end_date)
    if start_lon:
        filtered_df = filtered_df.filter(filtered_df.start_lon.startswith(start_lon))
    if start_lat:
        filtered_df = filtered_df.filter(filtered_df.start_lat.startswith(start_lat))
    if end_lon:
        filtered_df = filtered_df.filter(filtered_df.start_lon.startswith(end_lon))
    if end_lat:
        filtered_df = filtered_df.filter(filtered_df.start_lat.startswith(end_lat))
    if vehicle:
        filtered_df = filtered_df.filter(filtered_df.VehicleID==vehicle)
    if veh_type:
        filtered_df = filtered_df.filter(filtered_df.veh_types==veh_type)
    if trip:
        filtered_df = filtered_df.filter(filtered_df.TripID==trip)

    if day_of_week != None:
        filtered_df = filtered_df.filter(filtered_df.day_of_week==day_of_week)
    if is_weekday != None:
        filtered_df = filtered_df.filter(filtered_df.is_weekday==is_weekday)
    if start_time:
        filtered_df = filtered_df.filter(filtered_df.start_time.startswith(start_time))

    trimmed = filtered_df.select(['VehicleID','TripID','start_date','start_time','end_date','end_time','start_lon','start_lat','end_lon','end_lat','total_time','TravelDistanceMeters'])

    json = trimmed.toPandas().to_json(orient='records')

    return json

api = Api(app)

# api.add_resource(FilesList, '/files/')
# api.add_resource(File, '/files/<file_id>')
# api.add_resource(JobsList, '/jobs/')
# api.add_resource(Job, '/jobs/<job_id>')

if __name__ == "__main__":
    app.run(port=4999, debug=False)
