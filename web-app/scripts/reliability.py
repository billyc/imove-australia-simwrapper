# reliability.py:
# Use lon/lat boxes to develop travel time reliability measures by orig/dest

# source venv/bin/activate

# end point: Melbourne Connect 144.96, -37.80
dest = ("145.0", "-37.8")

# box size in lat/lon degrees -------------
step = 0.01
lon_range = (144.20, 146)
lat_range = (-38.50, -37.00)
# -----------------------------------------

import setuptools
import numpy as np
import pandas as pd
import csv,json,math,sys
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

    print(zlon,zlat)

    filtered_df = df

    # start point
    filtered_df = filtered_df.filter(filtered_df.start_lon.startswith(zlon))
    filtered_df = filtered_df.filter(filtered_df.start_lat.startswith(zlat))


    # end point: Melbourne Connect 144.96, -37.80
    filtered_df = filtered_df.filter(filtered_df.end_lon.startswith(dest[0]))
    filtered_df = filtered_df.filter(filtered_df.end_lat.startswith(dest[1]))

    # morning peak: 8am - 9am
    filtered_df = filtered_df.filter(filtered_df.start_time.startswith('08'))

    # Just Fridays
    filtered_df = filtered_df.filter(filtered_df.day_of_week == 4)

    # Cars only
    filtered_df = filtered_df.filter(filtered_df.veh_types == "car")

    # ==============================================================================
    # Only need a few columns
    trimmed = filtered_df.select(['start_time','end_time','TravelDistanceMeters'])
    trips = trimmed.collect()

    if len(trips) > 1:
        speeds = []
        for trip in trips:
            start_timestamp = 3600*int(trip.start_time[0:2]) + 60*int(trip.start_time[3:5]) + int(trip.start_time[6:8])
            end_timestamp = 3600*int(trip.end_time[0:2]) + 60*int(trip.end_time[3:5]) + int(trip.end_time[6:8])
            km_per_hour = 3.6 * trip.TravelDistanceMeters / (end_timestamp - start_timestamp)
            speeds.append(km_per_hour)

        # coefficient of variance
        cv = np.std(speeds, ddof=1) / np.mean(speeds) * 100

        print(zlon,zlat, cv)
        writer.writerow([0,zlon,zlat,cv])


# Main analysis ------------------------------------------

with open(sys.argv[1],'w') as f:
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



