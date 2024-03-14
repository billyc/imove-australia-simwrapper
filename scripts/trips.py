# reliability.py:
# Use lon/lat boxes to develop travel time reliability measures by orig/dest

# source venv/bin/activate

# box size in lat/lon degrees -------------
step = 0.01
lon_range = (144.20, 146)
lat_range = (-38.50, -37.00)
# -----------------------------------------

import setuptools
import pandas as pd
import csv,json,math
from flask import Flask, request, jsonify
from pyspark.conf import SparkConf
from pyspark.sql import SparkSession
from pyspark.sql.functions import to_json, udf, substring
from pyspark.sql.types import StringType
from datetime import datetime, timedelta

# ------------------
# Set up Spark
# spark = SparkSession.builder.getOrCreate()
spark = (
   SparkSession.builder.appName("CompassIoT")
   .config("spark.sql.repl.eagerEval.enabled", True)
   .config("spark.sql.parquet.cacheMetadata", "true")
   .config("spark.executor.memory", "8g")
   .config("spark.driver.memory", "8g")
   .config("spark.sql.session.timeZone", "Etc/UTC")
   .getOrCreate()
)

# initialize spark dataframe
folder = './sample-data/computed'
# folder = './parquet-data/computed'

print('READING:', folder)
df = spark.read.parquet(folder)
df.printSchema()

def calc_reliabilities(writer, rlon, rlat, xstep, xhour=None):
    digits = int(math.log10(1/xstep))
    fmt = f"{{0:.{digits}f}}"

    zlon = fmt.format(round(rlon,digits))
    zlat = fmt.format(round(rlat,digits))

    print('trying',zlon,zlat)

    filtered_df = df
    filtered_df = filtered_df.filter(filtered_df.start_lon.startswith(zlon))
    filtered_df = filtered_df.filter(filtered_df.start_lat.startswith(zlat))

    trimmed = filtered_df.select(['start_time','end_time','total_time','TravelDistanceMeters'])

    if len(trimmed.collect()) == 0: return

    # loop by hour
    h = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23']

    for hour in h:
        trips_per_hour = trimmed.filter(trimmed.start_time.startswith(hour))
        trips = trips_per_hour.collect()
        if len(trips) > 0:
            print(hour,zlon,zlat,len(trips))
            writer.writerow([3600*int(hour),zlon,zlat,len(trips)])

# Start analysis ------------------------------------------

with open('sampled.trips_large.xyt.csv','w') as f:
    writer = csv.writer(f)
    writer.writerow(['time','x','y','value'])

    # first time slot
    writer.writerow([0,144,-37,0])

    # loop on each box
    lon = lon_range[0]
    while lon <= lon_range[1]:
        lat = lat_range[0]
        while lat <= lat_range[1]:
            calc_reliabilities(writer, lon, lat, step)
            lat += step
        lon += step

    # last time slot
    writer.writerow([86399,144,-37,0])



