# try accessing parquet files using Spark
# source venv/bin/activate

import setuptools
import pandas as pd
import math
from datetime import datetime
from pyspark.conf import SparkConf
from pyspark.sql import SparkSession, Row
from pyspark.sql.functions import col, concat, to_json, substring, udf, pandas_udf
from pyspark.sql.types import StringType, DoubleType, IntegerType, BooleanType

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

df2 = df

def get_lon(value):
  coords = value[6:-1].split(' ')
  return str(round(float(coords[0]), 5))

def get_lat(value):
  coords = value[6:-1].split(' ')
  return str(round(float(coords[1]), 5))

def get_trimmed_path(value):
  trimmed = []
  points = value.split(',')
  for point in points:
      coords = point.split(' ')
      trim = [str(round(float(p), 5)) for p in coords]
      trimmed.append(' '.join(trim))
  return ','.join(trimmed)

def get_day_of_week(value):
  date_object = datetime.strptime(value, '%Y-%m-%d')
  return date_object.weekday()

def get_is_weekday(value):
  date_object = datetime.strptime(value, '%Y-%m-%d')
  return date_object.weekday() < 5

lon = udf(get_lon, StringType())
lat = udf(get_lat, StringType())
trim_path = udf(get_trimmed_path, StringType())
day_of_week = udf(get_day_of_week, IntegerType())
is_weekday = udf(get_is_weekday, BooleanType())

# start/end dates and times
df2 = df2.withColumn('start_date', substring("StartTime",1,10))
df2 = df2.withColumn('start_time', substring("StartTime",12,8))
df2 = df2.withColumn('end_date', substring("EndTime",1,10))
df2 = df2.withColumn('end_time', substring("EndTime",12,8))

# day of week
df2 = df2.withColumn('day_of_week', day_of_week(col('start_date')))
df2 = df2.withColumn('is_weekday', is_weekday(col('start_date')))

# start/end points - long/lat
df2 = df2.withColumn('start_lon', lon(col('first_point')))
df2 = df2.withColumn('start_lat', lat(col('first_point')))
df2 = df2.withColumn('end_lon', lon(col('last_point')))
df2 = df2.withColumn('end_lat', lat(col('last_point')))

# Path1 has far too many digits
df2 = df2.withColumn('path', trim_path(col('Path1')))

# Drop some columns we'll never use
drop_cols = ('Path1','Gyro_Roll_path','GyroPitch_path','Gyro_Yaw_path')
df2.drop(*drop_cols)

df2.printSchema()
df2.write.parquet(f"{folder}/computed")

# big_df = spark.read.option('mergeSchema','true').parquet(folder)
# big_df.printSchema()
