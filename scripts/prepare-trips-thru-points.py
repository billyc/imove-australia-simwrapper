# Explode path into individual rows for each point along the trip
# This will be useful for finding trips which pass through/by a point
# ------------------------
# source venv/bin/activate

import setuptools
import pandas as pd
import math
from datetime import datetime
from pyspark.conf import SparkConf
from pyspark.sql import SparkSession, Row
from pyspark.sql.functions import col, concat, to_json, explode, posexplode, pandas_udf, row_number, split, substring, udf
from pyspark.sql.types import StringType, DoubleType, IntegerType, BooleanType, ArrayType
from pyspark.sql.window import Window

# Set up Spark with extra ram
spark = (
   SparkSession.builder.appName("CompassIoT")
   .config("spark.sql.repl.eagerEval.enabled", True)
   .config("spark.sql.execution.arrow.pyspark.enabled", True)
   .config("spark.sql.parquet.cacheMetadata", "true")
   .config("spark.executor.memory", "8g")
   .config("spark.driver.memory", "8g")
   .config("spark.sql.session.timeZone", "Etc/UTC")
   .getOrCreate()
)

# initialize spark dataframe
# folder = './sample-data'
folder = './parquet-data'

df = spark.read.parquet(f"{folder}/original")
df.printSchema()

# We only want the coords and the trip
keep_columns = ('TripID','Snapped_path')
df = df.select(*keep_columns)

# parse the Snapped_Path which is comma-separated strings of "LON LAT,LON LAT,LON LAT..."
# return array of floats
def split_points(path):
  points = path.split(",")
  values = []
  for point in points:
    coords = [float(p) for p in point.split(' ')]
    values.append(coords)
  return values


lonlat = udf(split_points, ArrayType(ArrayType(DoubleType())))

df = df.withColumn('lonlat', lonlat(col("Snapped_path")))

trip_points = df.select(df.TripID, posexplode(df.lonlat).alias('pos','lonlat'))
trip_points = trip_points.withColumn('lon', trip_points["lonlat"][0])
trip_points = trip_points.withColumn('lat', trip_points["lonlat"][1])

trip_points = trip_points.select(trip_points.TripID, trip_points.lon, trip_points.lat)

# sort by lon/lat for faster retrieval
ordered_trips = trip_points.sortWithinPartitions(['lon','lat'])

# output
ordered_trips.printSchema()
ordered_trips.count()
ordered_trips.head(10)
ordered_trips.write.parquet(f"{folder}/trip-points")

